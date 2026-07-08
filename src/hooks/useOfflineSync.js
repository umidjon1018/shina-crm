import { useState, useEffect, useCallback } from 'react'
import { getPendingCount, syncQueue, cleanOldItems } from '../utils/offlineQueue'

export const useOfflineSync = (apiHandler = null) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(null)

  // Pending count yangilash
  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingCount()
      setPendingCount(count)
    } catch {}
  }, [])

  // Sinxronizatsiya
  const sync = useCallback(async () => {
    if (!isOnline || !apiHandler || isSyncing) return
    setIsSyncing(true)
    try {
      const result = await syncQueue(apiHandler)
      await refreshPendingCount()
      await cleanOldItems()
      setLastSync(new Date())
      return result
    } catch {}
    finally {
      setIsSyncing(false)
    }
  }, [isOnline, apiHandler, isSyncing, refreshPendingCount])

  // Online/offline hodisalari
  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true)
      // Internet kelganda avtomatik sync
      setTimeout(() => sync(), 1500)
    }
    const onOffline = () => setIsOnline(false)

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [sync])

  // Har 30 sekundda pending count yangilanadi
  useEffect(() => {
    refreshPendingCount()
    const interval = setInterval(refreshPendingCount, 30000)
    return () => clearInterval(interval)
  }, [refreshPendingCount])

  return {
    isOnline,
    pendingCount,
    isSyncing,
    lastSync,
    sync,
    refreshPendingCount,
  }
}
