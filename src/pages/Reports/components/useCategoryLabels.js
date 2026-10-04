import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getCategories } from '../../../api/categoryService'

// Kategoriya id → nom (joriy tilda)
export const useCategoryLabels = () => {
  const { i18n } = useTranslation()
  const [cats, setCats] = useState([])
  useEffect(() => { getCategories().then(setCats).catch(() => {}) }, [])
  return (id) => {
    const c = cats.find(x => String(x.id) === String(id))
    if (!c) return id || '—'
    return i18n.language === 'ru' ? (c.labelRu || c.label) : c.label
  }
}

export default useCategoryLabels
