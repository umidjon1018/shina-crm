import api from './client'

export const getFiscalPublic = async () => (await api.get('/api/fiscal/public')).data
export const getFiscalSettings = async () => (await api.get('/api/fiscal/settings')).data
export const saveFiscalSettings = async (cfg) => (await api.put('/api/fiscal/settings', cfg)).data
export const getFiscalStatus = async () => (await api.get('/api/fiscal/status')).data
export const getFiscalProducts = async () => (await api.get('/api/fiscal/products')).data
export const setFiscalProduct = async (id, d) => (await api.put(`/api/fiscal/products/${id}`, d)).data
export const retryFiscal = async () => (await api.post('/api/fiscal/retry')).data
