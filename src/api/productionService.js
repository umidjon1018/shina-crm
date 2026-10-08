import api from './client'

const shopParam = (shopId) => (shopId && shopId !== 'all' ? { shop_id: shopId } : {})

export const getProdSummary = async ({ from, to, shopId } = {}) =>
  (await api.get('/api/production/summary', { params: { from, to, ...shopParam(shopId) } })).data
export const getProdReport = async ({ from, to, shopId } = {}) =>
  (await api.get('/api/production/report', { params: { from, to, ...shopParam(shopId) } })).data

// ─── Mahsulotlar (xomashyo, yarim tayyor, tayyor) ───
export const getProdProducts = async (shopId) => (await api.get('/api/production/products', { params: shopParam(shopId) })).data
export const createProdProduct = async (d) => (await api.post('/api/production/products', d)).data
export const updateProdProduct = async (id, d) => (await api.put(`/api/production/products/${id}`, d)).data

// ─── Xomashyo qoldig'i ───
export const getMaterials = async (shopId) => (await api.get('/api/production/materials', { params: shopParam(shopId) })).data
export const getMaterialDetail = async (productId, shopId) =>
  (await api.get(`/api/production/materials/${productId}`, { params: shopParam(shopId) })).data
export const receiveMaterial = async (body) => (await api.post('/api/production/materials/receive', body)).data
export const adjustMaterial = async (body) => (await api.post('/api/production/materials/adjust', body)).data

// ─── Retseptlar ───
export const getRecipes = async () => (await api.get('/api/production/recipes')).data
export const saveRecipe = async (r) => (r.id
  ? await api.put(`/api/production/recipes/${r.id}`, r)
  : await api.post('/api/production/recipes', r)).data
export const deleteRecipe = async (id) => (await api.delete(`/api/production/recipes/${id}`)).data

// ─── Buyurtmalar ───
export const getProdOrders = async ({ status, from, to, shopId } = {}) => {
  const params = { ...shopParam(shopId) }
  if (status) params.status = status
  if (from) params.from = from
  if (to) params.to = to
  return (await api.get('/api/production/orders', { params })).data
}
export const getProdOrder = async (id) => (await api.get(`/api/production/orders/${id}`)).data
export const createProdOrder = async (body) => (await api.post('/api/production/orders', body)).data
export const startProdOrder = async (id) => (await api.post(`/api/production/orders/${id}/start`)).data
export const completeProdOrder = async (id, body) => (await api.post(`/api/production/orders/${id}/complete`, body)).data
export const cancelProdOrder = async (id) => (await api.post(`/api/production/orders/${id}/cancel`)).data
