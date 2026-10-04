import api from './client'

// Internet-do'kon API kalitlari
export const getApiKeys = async () => (await api.get('/api/integrations/api-keys')).data
export const createApiKey = async (d) => (await api.post('/api/integrations/api-keys', d)).data
export const updateApiKey = async (id, d) => (await api.put(`/api/integrations/api-keys/${id}`, d)).data
export const deleteApiKey = async (id) => (await api.delete(`/api/integrations/api-keys/${id}`)).data

// Telegram botda qoldiq
export const getBotStock = async () => (await api.get('/api/integrations/bot-stock')).data
export const saveBotStock = async (d) => (await api.put('/api/integrations/bot-stock', d)).data

// UDS
export const getUdsSettings = async () => (await api.get('/api/integrations/uds/settings')).data
export const saveUdsSettings = async (d) => (await api.put('/api/integrations/uds/settings', d)).data
export const getUdsStatus = async () => (await api.get('/api/integrations/uds/status')).data
export const findUdsCustomer = async (code, total) => (await api.get('/api/integrations/uds/customer', { params: { code, total } })).data

// Onlayn to'lovlar
export const getPaymentsSettings = async () => (await api.get('/api/integrations/payments/settings')).data
export const savePaymentsSettings = async (d) => (await api.put('/api/integrations/payments/settings', d)).data
export const getPaymentProviders = async () => (await api.get('/api/integrations/payments/providers')).data
export const getOnlinePayments = async () => (await api.get('/api/integrations/payments')).data
export const createOnlinePayment = async (d) => (await api.post('/api/integrations/payments', d)).data
export const getOnlinePayment = async (id) => (await api.get(`/api/integrations/payments/${id}`)).data
export const cancelOnlinePayment = async (id) => (await api.post(`/api/integrations/payments/${id}/cancel`)).data
export const simulateOnlinePayment = async (id) => (await api.post(`/api/integrations/payments/${id}/simulate`)).data

export const API_BASE = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/+$/, '')
