import { useState, useEffect, useCallback } from 'react'
import { getFinanceCategories } from '../../../api/financeService'
import { useDataStore } from '../../../store/dataStore'

export const useFinanceCategories = (kind) => {
  const { version } = useDataStore()
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)
  const reload = useCallback(() => {
    return getFinanceCategories()
      .then(d => setAll(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => { reload() }, [reload, version])
  const categories = kind ? all.filter(c => c.kind === kind) : all
  return { categories, activeCategories: categories.filter(c => c.isActive), loading, reload }
}

export default useFinanceCategories
