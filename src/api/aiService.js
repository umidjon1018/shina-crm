const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export const streamChat = async ({ messages, systemPrompt, onToken, onDone, onError }) => {
  const token = localStorage.getItem('shina_token')

  let response
  try {
    response = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ messages, systemPrompt }),
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
        else if (parsed.text) onToken?.(parsed.text)
      } catch {}
    }
  }
  onDone?.()
}
