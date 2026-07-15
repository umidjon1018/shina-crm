import api from './client'

export const generateVideo = (prompt, options = {}) =>
  api.post('/api/higgsfield/generate', { prompt, ...options }).then(r => r.data)

export const getVideoStatus = (requestId) =>
  api.get(`/api/higgsfield/status/${requestId}`).then(r => r.data)
