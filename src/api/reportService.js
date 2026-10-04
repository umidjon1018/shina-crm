import api from './client'

const params = (p = {}) => {
  const o = {}
  Object.entries(p).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '' && v !== 'all') o[k] = v })
  return o
}

export const getDashboardReport = async (p) => (await api.get('/api/reports/dashboard', { params: params(p) })).data
export const getProductsReport = async (p) => (await api.get('/api/reports/products', { params: params(p) })).data
export const getStockAsOf = async (p) => (await api.get('/api/reports/stock-as-of', { params: params(p) })).data
export const getMovementReport = async (p) => (await api.get('/api/reports/movement', { params: params(p) })).data
export const getReceiptsReport = async (p) => (await api.get('/api/reports/receipts', { params: params(p) })).data
export const getSuppliersReport = async (p) => (await api.get('/api/reports/suppliers', { params: params(p) })).data
export const getShopsReport = async (p) => (await api.get('/api/reports/shops', { params: params(p) })).data
export const getCustomersReport = async (p) => (await api.get('/api/reports/customers', { params: params(p) })).data

export const getStaffLink = async () => (await api.post('/api/marketing/tg/staff-link')).data
export const getStaffMe = async () => (await api.get('/api/marketing/tg/staff-me')).data
export const getTgStaff = async () => (await api.get('/api/marketing/tg/staff')).data
export const saveTgStaff = async (d) => (await api.put('/api/marketing/tg/staff', d)).data
export const removeTgStaff = async (chatId) => (await api.delete(`/api/marketing/tg/staff/${chatId}`)).data
