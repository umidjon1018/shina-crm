import api from './client'

// Umumiy bildirishnomalar (chegirma so'rovi, nazorat ogohlantirishlari) — serverda, barcha qurilmalarda bir xil
export const getNotifications = async () => (await api.get('/api/notifications')).data || []
export const createNotification = async (n) => (await api.post('/api/notifications', n)).data
export const resolveNotification = async (id, status) => (await api.patch(`/api/notifications/${id}/resolve`, { status })).data
export const markNotificationsRead = async (body) => (await api.post('/api/notifications/read', body)).data
export const dismissNotifications = async (body) => (await api.post('/api/notifications/dismiss', body)).data
