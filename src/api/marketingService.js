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

// SMS
export const getSmsSettings = async () => (await api.get('/api/marketing/sms/settings')).data
export const saveSmsSettings = async (d) => (await api.put('/api/marketing/sms/settings', d)).data
export const testSms = async (d) => (await api.post('/api/marketing/sms/test', d)).data
export const previewSegment = async (segment) => (await api.post('/api/marketing/sms/segment-preview', { segment })).data
export const sendCampaign = async (d) => (await api.post('/api/marketing/sms/campaigns', d)).data
export const getCampaigns = async () => (await api.get('/api/marketing/sms/campaigns')).data
export const getSmsMessages = async (params) => (await api.get('/api/marketing/sms/messages', { params })).data
export const sendPersonalSms = async (d) => (await api.post('/api/marketing/sms/send', d)).data

// Tug'ilgan kunlar
export const getBirthdays = async (days = 7) => (await api.get('/api/marketing/birthdays', { params: { days } })).data
export const greetBirthday = async (customerId) => (await api.post(`/api/marketing/birthdays/${customerId}/greet`)).data
