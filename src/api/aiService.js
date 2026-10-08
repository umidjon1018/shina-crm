import { useSettingsStore } from '../store/settingsStore'
import { getFreshToken } from './session'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

const authHeaders = async () => {
  const token = await getFreshToken()
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

export const getInstagramConversations = async ({ limit = 50, offset = 0 } = {}) => {
  const r = await fetch(`${BASE_URL}/api/ai/instagram/conversations?limit=${limit}&offset=${offset}`, { headers: await authHeaders() })
  if (!r.ok) throw new Error('Instagram conversations yuklanmadi')
  return r.json()
}

export const getInstagramConversationDetail = async (senderId) => {
  const r = await fetch(`${BASE_URL}/api/ai/instagram/conversations/${encodeURIComponent(senderId)}`, { headers: await authHeaders() })
  if (!r.ok) throw new Error('Suhbat tarixi yuklanmadi')
  return r.json()
}

export const getInstagramStats = async () => {
  const r = await fetch(`${BASE_URL}/api/ai/instagram/stats`, { headers: await authHeaders() })
  if (!r.ok) throw new Error('Instagram statistika yuklanmadi')
  return r.json()
}

export const streamChat = async ({ messages, agentId, systemPrompt, section, onToken, onModel, onDone, onError }) => {
  const token = await getFreshToken()
  const { aiApiKey } = useSettingsStore.getState()

  let response
  try {
    response = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ messages, agentId, systemPrompt, section, ...(aiApiKey ? { apiKey: aiApiKey } : {}) }),
    })
  } catch (err) {
    onError?.('Server bilan aloqa yo\'q')
    return
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({ error: 'Server xatosi' }))
    onError?.(errData.error || 'Server xatosi')
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') {
        onDone?.()
        return
      }
      try {
        const parsed = JSON.parse(data)
        if (parsed.error) { onError?.(parsed.error); return }
        else if (parsed.model) onModel?.(parsed.model)
        else if (parsed.text) onToken?.(parsed.text)
      } catch {}
    }
  }
  onDone?.()
}
