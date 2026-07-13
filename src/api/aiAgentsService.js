import api from './client'

const map = (r) => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  description: r.description,
  systemPrompt: r.systemPrompt,
  knowledge: r.knowledge,
  model: r.model,
  temperature: r.temperature,
  maxTokens: r.maxTokens,
  tools: r.tools || [],
  integrations: r.integrations || {},
  isActive: r.isActive,
})

export const getAiAgents = async () => {
  const { data } = await api.get('/api/ai-agents')
  return data.map(map)
}

export const getAvailableTools = async () => {
  const { data } = await api.get('/api/ai-agents/tools')
  return data
}

export const updateAiAgent = async (id, payload) => {
  const { data } = await api.put(`/api/ai-agents/${id}`, payload)
  return map(data)
}
