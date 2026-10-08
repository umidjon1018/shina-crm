import api from './client'

// Kompaniya brendi (nom, logotip, login sahifasi) — serverda, barcha qurilmalar uchun bir xil
export const getBranding = async () => {
  const { data } = await api.get('/api/settings/branding')
  return data || {}
}

export const saveBranding = async (patch) => {
  const { data } = await api.put('/api/settings/branding', patch)
  return data
}

// Sodiqlik: jamg'arma chegirma va keshbek — serverda, barcha qurilmalar uchun bir xil
export const getLoyaltySettings = async () => {
  const { data } = await api.get('/api/settings/loyalty')
  return data
}

export const saveLoyaltySettings = async (cfg) => {
  const { data } = await api.put('/api/settings/loyalty', cfg)
  return data
}

// Savdo sozlamalari (kurs, manbalar, nasiya tashkilotlari, chegirma chegaralari, rejalar...) — serverda
export const getBusinessSettings = async () => {
  const { data } = await api.get('/api/settings/business')
  return data || {}
}

export const saveBusinessSettings = async (patch) => {
  const { data } = await api.put('/api/settings/business', patch)
  return data
}
