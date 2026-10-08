import api from './client'

// Audit jurnali serverda (admin o'qiydi); brauzer faqat sessiya va sahifa hodisalarini yuboradi
export const getAuditLog = async (params) => (await api.get('/api/audit', { params })).data
export const sendAudit = async (entry) => (await api.post('/api/audit', entry)).data
