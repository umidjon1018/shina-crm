import api from './client'

// AI telefon operatori (kiruvchi qo'ng'iroqlar)
export const getVoiceSettings = async () => (await api.get('/api/voice/settings')).data
export const saveVoiceSettings = async (body) => (await api.put('/api/voice/settings', body)).data
export const newVoiceKey = async () => (await api.post('/api/voice/key')).data
export const getVoiceSetup = async () => (await api.get('/api/voice/setup')).data
export const getVoiceCalls = async () => (await api.get('/api/voice/calls')).data
export const markVoiceCallHandled = async (id) => (await api.post(`/api/voice/calls/${id}/handled`)).data
