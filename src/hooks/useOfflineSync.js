import { useState, useEffect, useCallback, useRef } from 'react'
import { getPendingCount, syncQueue, cleanOldItems } from '../utils/offlineQueue'

// apiHandler: async (queueItem) => serverga yuborish. onResult: ({ synced, failed, rejected }) => void
export const useOfflineSync = (apiHandler = null, onResult = null) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const syncingRef = useRef(false)
  const handlerRef = useRef(apiHandler)
  const resultRef = useRef(onResult)
  handlerRef.current = apiHandler
  resultRef.current = onResult

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingCount()
      setPendingCount(count)
      return count
    } catch { return 0 }
  }, [])

  const sync = useCallback(async () => {
    if (!navigator.onLine || !handlerRef.current || syncingRef.current) return
    if (!(await refreshPendingCount())) return
    syncingRef.current = true
    setIsSyncing(true)
    try {
      const result = await syncQueue(handlerRef.current)
      await refreshPendingCount()
      await cleanOldItems()
      setLastSync(new Date())
      if (result && (result.synced || result.failed)) resultRef.current?.(result)
      return result
    } catch {
      /* keyingi urinishda */
    } finally {
      syncingRef.current = false
      setIsSyncing(false)
    }
  }, [refreshPendingCount])

  useEffect(() => {
    const onOnline = () => { setIsOnline(true); setTimeout(() => sync(), 1500) }
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [sync])

  // Ochilganda va har 30 soniyada: navbat bo'lsa yuborishga urinadi
  // (Wi-Fi bor, lekin server vaqtincha javob bermagan holatlar uchun ham)
  useEffect(() => {
    sync()
    const interval = setInterval(() => { refreshPendingCount(); sync() }, 30000)
    return () => clearInterval(interval)
  }, [sync, refreshPendingCount])

  return { isOnline, pendingCount, isSyncing, lastSync, sync, refreshPendingCount }
}
