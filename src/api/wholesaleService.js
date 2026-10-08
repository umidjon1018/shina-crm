import api from './client'

const shopParam = (shopId) => (shopId && shopId !== 'all' ? { shop_id: shopId } : {})

export const getWhSummary = async ({ from, to, shopId } = {}) => {
  const { data } = await api.get('/api/wholesale/summary', { params: { from, to, ...shopParam(shopId) } })
  return data
}

// ─── Mijozlar (dilerlar) ───
export const getWhClients = async () => (await api.get('/api/wholesale/clients')).data
export const createWhClient = async (d) => (await api.post('/api/wholesale/clients', d)).data
export const updateWhClient = async (id, d) => (await api.put(`/api/wholesale/clients/${id}`, d)).data
export const getWhClientPrices = async (id) => (await api.get(`/api/wholesale/clients/${id}/prices`)).data
export const setWhClientPrice = async (id, productId, price) =>
  (await api.put(`/api/wholesale/clients/${id}/prices`, { productId, price })).data
export const getWhStatement = async (id, { from, to } = {}) =>
  (await api.get(`/api/wholesale/clients/${id}/statement`, { params: { from, to } })).data

// ─── Narxlar ───
export const getWhGroups = async () => (await api.get('/api/wholesale/price-groups')).data
export const saveWhGroup = async (g) => (g.id
  ? await api.put(`/api/wholesale/price-groups/${g.id}`, g)
  : await api.post('/api/wholesale/price-groups', g)).data
export const deleteWhGroup = async (id) => (await api.delete(`/api/wholesale/price-groups/${id}`)).data
export const getWhProducts = async ({ shopId, clientId } = {}) =>
  (await api.get('/api/wholesale/products', { params: { ...shopParam(shopId), ...(clientId ? { client_id: clientId } : {}) } })).data
export const setWhProductPrice = async (id, wholesalePrice) =>
  (await api.put(`/api/wholesale/products/${id}/price`, { wholesalePrice })).data

// ─── Hujjatlar ───
export const getWhDocs = async ({ clientId, kind, from, to, shopId } = {}) => {
  const params = { ...shopParam(shopId) }
  if (clientId) params.client_id = clientId
  if (kind) params.kind = kind
  if (from) params.from = from
  if (to) params.to = to
  return (await api.get('/api/wholesale/docs', { params })).data
}
export const getWhDoc = async (id) => (await api.get(`/api/wholesale/docs/${id}`)).data
export const createWhDoc = async (body) => (await api.post('/api/wholesale/docs', body)).data
export const settleWhDoc = async (id, body) => (await api.post(`/api/wholesale/docs/${id}/settle`, body)).data
export const takeBackWhDoc = async (id, body) => (await api.post(`/api/wholesale/docs/${id}/take-back`, body)).data
export const returnWhDoc = async (id, body) => (await api.post(`/api/wholesale/docs/${id}/return`, body)).data

// ─── To'lovlar ───
export const getWhPayments = async (clientId) =>
  (await api.get('/api/wholesale/payments', { params: clientId ? { client_id: clientId } : {} })).data
export const createWhPayment = async (body) => (await api.post('/api/wholesale/payments', body)).data
