import api from './client'

export const resolveCode = async (code, customerId) => {
  const params = { code }
  if (customerId) params.customer_id = customerId
  const { data } = await api.get('/api/marketing/resolve', { params })
  return data
}

// Promokod va vaucherlar
export const getCodes = async () => (await api.get('/api/marketing/codes')).data
export const getCodesReport = async (params) => (await api.get('/api/marketing/codes/report', { params })).data
export const createCodes = async (d) => (await api.post('/api/marketing/codes', d)).data
export const updateCode = async (id, d) => (await api.put(`/api/marketing/codes/${id}`, d)).data
export const deleteCode = async (id) => (await api.delete(`/api/marketing/codes/${id}`)).data

// Sovg'a sertifikatlari
export const getGiftCards = async () => (await api.get('/api/marketing/gift-cards')).data
export const getGiftCardTx = async (id) => (await api.get(`/api/marketing/gift-cards/${id}/tx`)).data
export const createGiftCards = async (d) => (await api.post('/api/marketing/gift-cards', d)).data
export const sellGiftCard = async (d) => (await api.post('/api/marketing/gift-cards/sell', d)).data
export const cancelGiftCard = async (id, d) => (await api.post(`/api/marketing/gift-cards/${id}/cancel`, d)).data

// Telegram bot xabarlari
export const getTgSettings = async () => (await api.get('/api/marketing/tg/settings')).data
export const saveTgSettings = async (d) => (await api.put('/api/marketing/tg/settings', d)).data
export const setupTgWebhook = async (baseUrl) => (await api.post('/api/marketing/tg/webhook-setup', { base_url: baseUrl })).data
export const testTgMessage = async (d) => (await api.post('/api/marketing/tg/test', d)).data
export const previewSegment = async (segment) => (await api.post('/api/marketing/tg/segment-preview', { segment })).data
export const sendCampaign = async (d) => (await api.post('/api/marketing/tg/campaigns', d)).data
export const getCampaigns = async () => (await api.get('/api/marketing/tg/campaigns')).data
export const getTgMessages = async (params) => (await api.get('/api/marketing/tg/messages', { params })).data
export const sendPersonalMessage = async (d) => (await api.post('/api/marketing/tg/send', d)).data
export const getCustomerTgStatus = async (id) => (await api.get(`/api/marketing/tg/customer/${id}`)).data

// Tug'ilgan kunlar
export const getBirthdays = async (days = 7) => (await api.get('/api/marketing/birthdays', { params: { days } })).data
export const greetBirthday = async (customerId) => (await api.post(`/api/marketing/birthdays/${customerId}/greet`)).data
