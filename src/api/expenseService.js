import api from './client'

const map = (e) => ({
  id: String(e.id),
  shopId: String(e.shop_id),
  expenseType: e.expense_type || 'variable',
  categoryId: e.category_id ? String(e.category_id) : null,
  amount: Number(e.amount) || 0,
  currency: e.currency || 'UZS',
  usdRate: e.usd_rate ? Number(e.usd_rate) : null,
  amountUzs: Number(e.amount_uzs) || Number(e.amount) || 0,
  date: e.date || '',
  note: e.note || '',
  createdAt: e.created_at || '',
})

export const getExpenses = async (shopId) => {
  const params = shopId && shopId !== 'all' ? { shop_id: shopId } : {}
  const { data } = await api.get('/api/expenses', { params })
  return data.map(map)
}

export const addExpense = async (expenseData) => {
  const { data } = await api.post('/api/expenses', {
    shop_id: expenseData.shopId,
    expense_type: expenseData.expenseType,
    category_id: expenseData.categoryId,
    amount: expenseData.amount,
    currency: expenseData.currency,
    usd_rate: expenseData.usdRate,
    amount_uzs: expenseData.amountUzs,
    date: expenseData.date,
    note: expenseData.note,
  })
  return map(data)
}

export const updateExpense = async (id, expenseData) => {
  const { data } = await api.put(`/api/expenses/${id}`, {
    expense_type: expenseData.expenseType,
    category_id: expenseData.categoryId,
    amount: expenseData.amount,
    currency: expenseData.currency,
    usd_rate: expenseData.usdRate,
    amount_uzs: expenseData.amountUzs,
    date: expenseData.date,
    note: expenseData.note,
  })
  return map(data)
}

export const deleteExpense = async (id) => {
  await api.delete(`/api/expenses/${id}`)
}
