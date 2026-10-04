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
