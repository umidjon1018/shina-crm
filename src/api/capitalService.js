import api from './client'

const map = (c) => ({
  id: String(c.id),
  shopId: String(c.shop_id),
  type: c.type,
  amount: Number(c.amount) || 0,
  currency: c.currency || 'UZS',
  usdRate: c.usd_rate ? Number(c.usd_rate) : null,
  amountUZS: Number(c.amount_uzs) || Number(c.amount) || 0,
  date: c.date || '',
  source: c.source || '',
  note: c.note || '',
  createdAt: c.created_at || '',
})

export const getCapital = async (shopId) => {
  const params = shopId && shopId !== 'all' ? { shop_id: shopId } : {}
  const { data } = await api.get('/api/capital', { params })
  return data.map(map)
}

export const addCapital = async (d) => {
  const { data } = await api.post('/api/capital', {
    shop_id: d.shopId,
    type: d.type,
    amount: d.amount,
    currency: d.currency,
    usd_rate: d.usdRate,
    amount_uzs: d.amountUZS,
    date: d.date,
    source: d.source,
    note: d.note,
  })
  return { success: true, entry: map(data) }
}

export const updateCapital = async (id, d) => {
  const { data } = await api.put(`/api/capital/${id}`, {
    type: d.type,
    amount: d.amount,
    currency: d.currency,
    usd_rate: d.usdRate,
    amount_uzs: d.amountUZS,
    date: d.date,
    source: d.source,
    note: d.note,
  })
  return { success: true, entry: map(data) }
}

export const deleteCapital = async (id) => {
  await api.delete(`/api/capital/${id}`)
}
