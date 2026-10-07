import api from './client'

export const getAiStatsOverview = async ({ shop } = {}) =>
  (await api.get('/api/ai-stats/overview', { params: shop && shop !== 'all' ? { shop } : {} })).data
export const getWeeklyReports = async () => (await api.get('/api/ai-stats/weekly')).data
export const generateWeeklyReport = async (weekStart) => (await api.post('/api/ai-stats/weekly', weekStart ? { weekStart } : {})).data
