import api from './client'

const map = (r) => ({
  ...r,
  id: String(r.id),
  targetIds: (r.targetIds || []).map(String),
  giftTargetIds: (r.giftTargetIds || []).map(String),
  tiers: r.tiers || [],
  conditions: r.conditions || {},
  shopId: r.shopId ?? 'all',
})

const payload = (e) => ({
  name: e.name,
  description: e.description || '',
  kind: e.kind || 'discount',
  template: e.template || null,
  target_type: e.targetType || 'all',
  target_ids: e.targetIds || [],
  discount_type: e.discountType || 'percent',
  discount_value: e.discountValue ?? e.discountPercent ?? 0,
  min_qty: e.minQty || 1,
  buy_qty: e.buyQty || 0,
  get_qty: e.getQty || 0,
  get_discount: e.getDiscount ?? 100,
  gift_target_type: e.giftTargetType || null,
  gift_target_ids: e.giftTargetIds || [],
  tiers: e.tiers || [],
  min_total: e.minTotal || 0,
  conditions: e.conditions || {},
  stackable: !!e.stackable,
  requires_code: !!e.requiresCode,
  start_date: e.startDate || null,
  end_date: e.endDate || null,
  shop_id: e.shopId || 'all',
  ...(e.isActive !== undefined ? { is_active: e.isActive } : {}),
})

export const getPromotions = async () => {
  const { data } = await api.get('/api/promotions')
  return data.map(map)
}

export const getPromotionStats = async () => {
  const { data } = await api.get('/api/promotions/stats')
  return data
}

export const createPromotion = async (entry) => {
  const { data } = await api.post('/api/promotions', payload(entry))
  return map(data)
}

export const updatePromotion = async (id, entry) => {
  const { data } = await api.put(`/api/promotions/${id}`, payload(entry))
  return map(data)
}

export const togglePromotion = async (id) => {
  const { data } = await api.patch(`/api/promotions/${id}/toggle`)
  return map(data)
}

export const deletePromotion = async (id) => {
  const { data } = await api.delete(`/api/promotions/${id}`)
  return data
}
