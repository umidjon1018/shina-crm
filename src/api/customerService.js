import api from './client'

const map = (c) => ({
  id: String(c.id),
  name: c.name,
  phone: c.phone || '',
  phone2: c.phone2 || '',
  birthDate: c.birth_date || null,
  instagram: c.instagram || '',
  carModel: c.car_model || '',
  shopId: c.shop_id ? String(c.shop_id) : null,
  createdAt: c.created_at || '',
  gender: c.gender || '',
  address: c.address || '',
  email: c.email || '',
  group: c.customer_group || '',
  tags: Array.isArray(c.tags) ? c.tags : [],
  balance: Number(c.balance) || 0,
  // mock compat
  visitHistory: [],
  loyaltyVisits: 0,
  segment: 'new',
  totalPurchases: 0,
  totalDebt: 0,
})

export const getCustomers = async () => {
  const { data } = await api.get('/api/customers')
  return data.map(map)
}

const extra = (v) => v === undefined ? undefined : (v ?? '')
const validDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null

export const addCustomer = async (customerData) => {
  const { data } = await api.post('/api/customers', {
    name: customerData.name,
    phone: customerData.phone,
    phone2: customerData.phone2 || null,
    birth_date: validDate(customerData.birthDate),
    instagram: customerData.instagram || null,
    car_model: customerData.carModel || null,
    shop_id: customerData.shopId || null,
    gender: customerData.gender || null,
    address: customerData.address || null,
    email: customerData.email || null,
    customer_group: customerData.group || null,
    tags: customerData.tags || [],
  })
  return { success: true, customer: map(data) }
}

export const updateCustomer = async (id, customerData) => {
  const { data } = await api.put(`/api/customers/${id}`, {
    name: customerData.name,
    phone: customerData.phone,
    phone2: customerData.phone2 || null,
    birth_date: validDate(customerData.birthDate),
    instagram: customerData.instagram || null,
    car_model: customerData.carModel || null,
    // undefined — backend eski qiymatni saqlaydi; '' — tozalaydi
    gender: extra(customerData.gender),
    address: extra(customerData.address),
    email: extra(customerData.email),
    customer_group: extra(customerData.group),
    tags: Array.isArray(customerData.tags) ? customerData.tags : undefined,
  })
  return { success: true, customer: map(data) }
}

export const deleteCustomer = async (id) => {
  await api.delete(`/api/customers/${id}`)
  return { success: true }
}

export const mergeCustomers = async (keepId, removeId) => {
  const { data } = await api.post(`/api/customers/${keepId}/merge`, { remove_id: removeId })
  return { success: true, ...data }
}

export const getCustomerNotes = async (id) => {
  const { data } = await api.get(`/api/customers/${id}/notes`)
  return data.map(n => ({ id: String(n.id), text: n.text, createdByName: n.created_by_name || '', createdAt: n.created_at }))
}

export const addCustomerNote = async (id, text) => {
  const { data } = await api.post(`/api/customers/${id}/notes`, { text })
  return data
}

export const deleteCustomerNote = async (id, noteId) => {
  await api.delete(`/api/customers/${id}/notes/${noteId}`)
}

export const getCustomerBalance = async (id) => {
  const { data } = await api.get(`/api/customers/${id}/balance`)
  return {
    balance: Number(data.balance) || 0,
    transactions: data.transactions.map(x => ({
      id: String(x.id), type: x.type, amount: Number(x.amount) || 0, method: x.method || '',
      note: x.note || '', shopName: x.shop_name || '', createdByName: x.created_by_name || '', createdAt: x.created_at,
    })),
  }
}

export const addCustomerBalanceTx = async (id, { type, amount, method, note, shopId }) => {
  const { data } = await api.post(`/api/customers/${id}/balance`, {
    type, amount: Number(amount), method, note: note || null, shop_id: shopId && shopId !== 'all' ? shopId : null,
  })
  return data
}

export const payCustomerDebt = async (id, { amount, source, note, shopId }) => {
  const { data } = await api.post(`/api/customers/${id}/pay-debt`, {
    amount: Number(amount), source, note: note || null, shop_id: shopId && shopId !== 'all' ? shopId : null,
  })
  return data
}

export const getCustomerLoyalty = async (id) => {
  const { data } = await api.get(`/api/customers/${id}/loyalty`)
  return {
    totalPurchases: Number(data.totalPurchases) || 0,
    balance: Number(data.balance) || 0,
    discountPercent: Number(data.discountPercent) || 0,
    nextDiscount: data.nextDiscount || null,
    cashbackPercent: Number(data.cashbackPercent) || 0,
    cashbackMinSale: Number(data.cashbackMinSale) || 0,
  }
}
