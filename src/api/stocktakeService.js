import api from './client'

const mapSt = (s) => ({
  id: String(s.id),
  shopId: s.shop_id ? String(s.shop_id) : null,
  createdBy: s.created_by,
  status: s.status,
  notes: s.notes || '',
  itemCount: s.item_count ?? 0,
  createdAt: s.created_at,
  completedAt: s.completed_at || null,
  writeoffAt: s.writeoff_at || null,
})

const mapItem = (i) => ({
  id: String(i.id),
  stocktakeId: String(i.stocktake_id),
  productId: String(i.product_id),
  productName: i.product_name || '',
  expectedQty: Number(i.expected_qty) || 0,
  actualQty: i.actual_qty != null ? Number(i.actual_qty) : null,
  note: i.note || '',
})

export const getStocktakes = async (shopId) => {
  const params = shopId && shopId !== 'all' ? { shop_id: shopId } : {}
  const { data } = await api.get('/api/stocktakes', { params })
  return data.map(mapSt)
}

export const getStocktake = async (id) => {
  const { data } = await api.get(`/api/stocktakes/${id}`)
  return { ...mapSt(data), items: (data.items || []).map(mapItem) }
}

export const createStocktake = async ({ shopId, notes }) => {
  const { data } = await api.post('/api/stocktakes', {
    shop_id: shopId && shopId !== 'all' ? shopId : null,
    notes: notes || null,
  })
  return mapSt(data)
}

export const updateStocktakeItem = async (stocktakeId, itemId, { actualQty, note }) => {
  const { data } = await api.patch(`/api/stocktakes/${stocktakeId}/items/${itemId}`, {
    actual_qty: actualQty,
    note: note || null,
  })
  return mapItem(data)
}

export const completeStocktake = async (id, autoWriteoff = false) => {
  const { data } = await api.post(`/api/stocktakes/${id}/complete`, { auto_writeoff: autoWriteoff })
  return { ...mapSt(data), writtenOff: data.written_off || [], notWrittenOff: data.not_written_off || [] }
}

export const reopenStocktake = async (id) => {
  const { data } = await api.post(`/api/stocktakes/${id}/reopen`)
  return mapSt(data)
}

export const deleteStocktake = async (id) => {
  await api.delete(`/api/stocktakes/${id}`)
}
