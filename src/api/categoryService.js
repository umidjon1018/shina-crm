import api from './client'

const map = (c) => ({
  id: c.id,
  label: c.label,
  labelRu: c.labelRu ?? c.label_ru ?? c.label,
  isActive: c.isActive ?? c.is_active ?? true,
  sortOrder: c.sortOrder ?? c.sort_order ?? 0,
  turnoverDays: c.turnoverDays ?? c.turnover_days ?? null,
})

export const getCategories = async () => {
  try {
    const { data } = await api.get('/api/categories')
    return data.map(map)
  } catch { return [] }
}

export const createCategory = async (cat) => {
  const { data } = await api.post('/api/categories', {
    id: cat.id,
    label: cat.label,
    label_ru: cat.labelRu || cat.label,
    sort_order: cat.sortOrder || 0,
    turnover_days: cat.turnoverDays || null,
  })
  return map(data)
}

export const updateCategory = async (id, cat) => {
  const { data } = await api.put(`/api/categories/${id}`, {
    label: cat.label,
    label_ru: cat.labelRu || cat.label,
    is_active: cat.isActive ?? true,
    turnover_days: cat.turnoverDays || null,
  })
  return map(data)
}

export const toggleCategory = async (id) => {
  const { data } = await api.patch(`/api/categories/${id}/toggle`)
  return map(data)
}

export const deleteCategory = async (id) => {
  await api.delete(`/api/categories/${id}`)
}
