import api from './client'

const map = (r) => ({
  id: String(r.id),
  name: r.name,
  type: r.type || 'category',
  targetId: r.target_id ?? r.targetId ?? null,
  discountPercent: Number(r.discount_percent ?? r.discountPercent) || 0,
  minQty: Number(r.min_qty ?? r.minQty) || 1,
  startDate: r.start_date ?? r.startDate ?? null,
  endDate: r.end_date ?? r.endDate ?? null,
  isActive: r.is_active ?? r.isActive ?? true,
  shopId: r.shop_id ?? r.shopId ?? 'all',
  createdAt: r.created_at ?? r.createdAt ?? '',
})

export const getPromotions = async () => {
  const { data } = await api.get('/api/promotions')
  return data.map(map)
}

export const createPromotion = async (entry) => {
  const { data } = await api.post('/api/promotions', {
    name: entry.name,
    type: entry.type,
    target_id: entry.targetId || null,
    discount_percent: entry.discountPercent || 0,
    min_qty: entry.minQty || 1,
    start_date: entry.startDate || null,
    end_date: entry.endDate || null,
    shop_id: entry.shopId || 'all',
  })
  return map(data)
}

export const updatePromotion = async (id, entry) => {
  const { data } = await api.put(`/api/promotions/${id}`, {
    name: entry.name,
    type: entry.type,
    target_id: entry.targetId ?? null,
    discount_percent: entry.discountPercent,
    min_qty: entry.minQty,
    start_date: entry.startDate ?? null,
    end_date: entry.endDate ?? null,
    shop_id: entry.shopId,
    is_active: entry.isActive,
  })
  return map(data)
}

export const togglePromotion = async (id) => {
  const { data } = await api.patch(`/api/promotions/${id}/toggle`)
  return map(data)
}

export const deletePromotion = async (id) => {
  await api.delete(`/api/promotions/${id}`)
  return { success: true }
}
