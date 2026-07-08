// Offline Queue — IndexedDB asosida
// Sotuvchi internet bo'lmasa ham sotuv qiladi,
// internet kelganda avtomatik serverga yuboradi

const DB_NAME = 'shina_crm_offline'
const DB_VERSION = 1
const STORE_NAME = 'queue'

// IndexedDB ochish
const openDB = () => {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('status', 'status', { unique: false })
        store.createIndex('createdAt', 'createdAt', { unique: false })
      }
    }
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror = (e) => reject(e.target.error)
  })
}

// Navbatga qo'shish
export const enqueueAction = async (action) => {
  const db = await openDB()
  const item = {
    id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    type: action.type,       // 'CREATE_SALE' | 'UPDATE_STOCK' | 'CREATE_CUSTOMER' etc
    payload: action.payload,
    status: 'pending',       // pending | syncing | done | failed
    createdAt: new Date().toISOString(),
    attempts: 0,
    error: null,
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const req = tx.objectStore(STORE_NAME).add(item)
    req.onsuccess = () => resolve(item)
    req.onerror = (e) => reject(e.target.error)
  })
}

// Barcha pending itemlarni olish
export const getPendingItems = async () => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const index = tx.objectStore(STORE_NAME).index('status')
    const req = index.getAll('pending')
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror = (e) => reject(e.target.error)
  })
}

// Barcha itemlarni olish (hisobotlar uchun)
export const getAllItems = async () => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror = (e) => reject(e.target.error)
  })
}

// Item statusini yangilash
export const updateItemStatus = async (id, status, error = null) => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const getReq = store.get(id)
    getReq.onsuccess = (e) => {
      const item = e.target.result
      if (!item) return resolve(null)
      item.status = status
      item.attempts += 1
      item.error = error
      item.updatedAt = new Date().toISOString()
      const putReq = store.put(item)
      putReq.onsuccess = () => resolve(item)
      putReq.onerror = (e) => reject(e.target.error)
    }
    getReq.onerror = (e) => reject(e.target.error)
  })
}

// Done itemlarni tozalash (7 kundan eski)
export const cleanOldItems = async () => {
  const db = await openDB()
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.openCursor()
    req.onsuccess = (e) => {
      const cursor = e.target.result
      if (!cursor) return resolve()
      const item = cursor.value
      if (item.status === 'done' && item.createdAt < cutoff) {
        cursor.delete()
      }
      cursor.continue()
    }
    req.onerror = (e) => reject(e.target.error)
  })
}

// Pending count (sidebar badge uchun)
export const getPendingCount = async () => {
  const items = await getPendingItems()
  return items.length
}

// Sinxronizatsiya — internet kelganda chaqiriladi
// apiHandler: async (item) => { ... serverga yuborish ... }
export const syncQueue = async (apiHandler) => {
  const pending = await getPendingItems()
  if (!pending.length) return { synced: 0, failed: 0 }

  let synced = 0
  let failed = 0

  for (const item of pending) {
    try {
      await updateItemStatus(item.id, 'syncing')
      await apiHandler(item)
      await updateItemStatus(item.id, 'done')
      synced++
    } catch (err) {
      await updateItemStatus(item.id, 'failed', err.message)
      failed++
    }
  }

  return { synced, failed }
}
