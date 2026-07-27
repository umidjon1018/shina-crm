import api from './client'

// Agentning so'nggi insights (AgentAnalysisPanel formatida)
export async function getAgentInsights(slug) {
  const r = await api.get(`/agents/${slug}/insights`)
  return r.data // { run, analysis: {kpis, alerts, insights, recommendations}, raw }
}

// Agentning so'nggi run holati
export async function getAgentStatus(slug) {
  const r = await api.get(`/agents/${slug}/status`)
  return r.data // { id, status, started_at, finished_at, tokens_used, error } | null
}

// Barcha agentlar holati (Overview uchun)
export async function getAllAgentsStatus() {
  const r = await api.get('/agents/all/status')
  return r.data // [{ agent_slug, run_id, status, started_at, ... }]
}

// Agentni qo'lda ishga tushirish
export async function triggerAgentRun(slug) {
  const r = await api.post(`/agents/${slug}/run`)
  return r.data // { message, started }
}

// Agent run tarixi
export async function getAgentRuns(slug, limit = 10) {
  const r = await api.get(`/agents/${slug}/runs`, { params: { limit } })
  return r.data // [{ id, status, started_at, ... }]
}
