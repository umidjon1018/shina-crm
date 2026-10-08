import api from './client'

export const getAiStatsOverview = async ({ shop } = {}) =>
  (await api.get('/api/ai-stats/overview', { params: shop && shop !== 'all' ? { shop } : {} })).data
export const getWeeklyReports = async () => (await api.get('/api/ai-stats/weekly')).data
export const generateWeeklyReport = async (weekStart) => (await api.post('/api/ai-stats/weekly', weekStart ? { weekStart } : {})).data

const shopParams = (shop) => (shop && shop !== 'all' ? { shop } : {})
export const getAiSection = async (section, { shop } = {}) => (await api.get(`/api/ai-stats/section/${section}`, { params: shopParams(shop) })).data
export const getAiDigests = async () => (await api.get('/api/ai-stats/digests')).data
export const getAiDigestStatus = async () => (await api.get('/api/ai-stats/digests/status')).data
export const runAiDigests = async (section) => (await api.post('/api/ai-stats/digests/run', section ? { section } : {})).data
export const getAiAnomalies = async ({ shop } = {}) => (await api.get('/api/ai-stats/anomalies', { params: shopParams(shop) })).data
