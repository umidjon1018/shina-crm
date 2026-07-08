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
