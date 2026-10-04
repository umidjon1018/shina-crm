// Oxirgi muvaffaqiyatli GET javoblari — internet uzilganda ko'rsatish uchun (IndexedDB)
const DB_NAME = 'shina_crm_http'
const STORE = 'responses'

let dbPromise = null
const openDB = () => (dbPromise ??= new Promise((resolve, reject) => {
  const req = indexedDB.open(DB_NAME, 1)
  req.onupgradeneeded = () => req.result.createObjectStore(STORE)
  req.onsuccess = () => resolve(req.result)
  req.onerror = () => reject(req.error)
}))

export const cacheKey = (config) => {
  const params = config.params ? JSON.stringify(config.params, Object.keys(config.params).sort()) : ''
  return `${config.url}?${params}`
}

export const putCached = async (key, data) => {
  try {
    const db = await openDB()
    db.transaction(STORE, 'readwrite').objectStore(STORE).put({ data, at: Date.now() }, key)
  } catch { /* IndexedDB yopiq — kesh ishlamaydi */ }
}

export const getCached = async (key) => {
  try {
    const db = await openDB()
    return await new Promise((resolve) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

// Chiqishda boshqa foydalanuvchiga ko'rinmasligi uchun
export const clearHttpCache = async () => {
  try {
    const db = await openDB()
    db.transaction(STORE, 'readwrite').objectStore(STORE).clear()
  } catch { /* */ }
}
