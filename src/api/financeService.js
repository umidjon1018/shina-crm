import api from './client'

const mapCategory = (c) => ({ ...c, id: String(c.id) })

export const getFinanceCategories = async () => {
  const { data } = await api.get('/api/finance/categories')
  return data.map(mapCategory)
}

export const createFinanceCategory = async (d) => {
  const { data } = await api.post('/api/finance/categories', {
    kind: d.kind, label: d.label, label_ru: d.labelRu, icon: d.icon, color: d.color, is_fixed: d.isFixed,
  })
  return mapCategory(data)
}

export const updateFinanceCategory = async (id, d) => {
  const { data } = await api.put(`/api/finance/categories/${id}`, {
    label: d.label, label_ru: d.labelRu, icon: d.icon, color: d.color, is_fixed: d.isFixed, is_active: d.isActive,
  })
  return mapCategory(data)
}

export const deleteFinanceCategory = async (id) => {
  const { data } = await api.delete(`/api/finance/categories/${id}`)
  return data
}

const mapIncome = (i) => ({
  id: String(i.id),
  shopId: String(i.shop_id),
  categoryId: i.category_id ? String(i.category_id) : null,
  amount: Number(i.amount) || 0,
  currency: i.currency || 'UZS',
  usdRate: i.usd_rate ? Number(i.usd_rate) : null,
  amountUZS: Number(i.amount_uzs) || Number(i.amount) || 0,
  paymentMethod: i.payment_method || 'cash',
  date: i.date || '',
  note: i.note || '',
  responsibleName: i.responsible_name || '',
})

const incomePayload = (d) => ({
  shop_id: d.shopId, category_id: d.categoryId, amount: d.amount, currency: d.currency,
  usd_rate: d.usdRate, amount_uzs: d.amountUZS, payment_method: d.paymentMethod,
  date: d.date, note: d.note, responsible_name: d.responsibleName,
})

export const getIncomes = async (shopId) => {
  const params = shopId && shopId !== 'all' ? { shop_id: shopId } : {}
  const { data } = await api.get('/api/finance/incomes', { params })
  return data.map(mapIncome)
}

export const addIncome = async (d) => {
  const { data } = await api.post('/api/finance/incomes', incomePayload(d))
  return mapIncome(data)
}

export const updateIncome = async (id, d) => {
  const { data } = await api.put(`/api/finance/incomes/${id}`, incomePayload(d))
  return mapIncome(data)
}

export const deleteIncome = async (id) => {
  await api.delete(`/api/finance/incomes/${id}`)
}

export const getCashflow = async ({ from, to, shopId }) => {
  const params = { from, to }
  if (shopId && shopId !== 'all') params.shop_id = shopId
  const { data } = await api.get('/api/finance/cashflow', { params })
  return data
}

export const getPnl = async ({ from, to, shopId }) => {
  const params = { from, to }
  if (shopId && shopId !== 'all') params.shop_id = shopId
  const { data } = await api.get('/api/finance/pnl', { params })
  return data
}

export const getDebts = async (shopId) => {
  const params = shopId && shopId !== 'all' ? { shop_id: shopId } : {}
  const { data } = await api.get('/api/finance/debts', { params })
  return data
}

export const getCashToday = async (shopId) => {
  const params = shopId && shopId !== 'all' ? { shop_id: shopId } : {}
  const { data } = await api.get('/api/finance/cash-today', { params })
  return data
}

export const addCashExpense = async ({ shopId, categoryId, amount, note }) => {
  const { data } = await api.post('/api/finance/cash-expense', {
    shop_id: shopId, category_id: categoryId, amount, note,
  })
  return data
}
