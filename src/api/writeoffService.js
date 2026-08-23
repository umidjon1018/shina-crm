import api from './client'

const map = (w) => ({
  id: String(w.id),
  shopId: String(w.shop_id),
  productId: String(w.product_id),
  productName: w.product_name || '',
  shopName: w.shop_name || '',
  quantity: Number(w.quantity),
  reason: w.reason || '',
  expenseId: w.expense_id ? String(w.expense_id) : null,
  createdByName: w.created_by_name || '',
  createdAt: w.created_at || '',
})

export const getWriteoffs = async (shopId) => {
  const params = shopId && shopId !== 'all' ? { shop_id: shopId } : {}
  const { data } = await api.get('/api/writeoffs', { params })
  return data.map(map)
}

export const createWriteoff = async ({ productId, shopId, quantity, reason, createExpense }) => {
  const { data } = await api.post('/api/writeoffs', {
    product_id: productId,
    shop_id: shopId,
    quantity,
    reason,
    create_expense: createExpense,
  })
  return data
}
