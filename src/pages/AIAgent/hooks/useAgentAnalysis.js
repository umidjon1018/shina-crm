import { useState, useEffect, useRef } from 'react'
import { streamChat } from '../../../api/aiService'

const JSON_INSTRUCTION = `

Faqat quyidagi JSON formatida javob ber, hech qanday qo'shimcha matn yozma:
{
  "kpis": [
    { "label": "...", "value": "...", "sub": "...", "status": "good|warning|danger|neutral" }
  ],
  "alerts": [
    { "severity": "danger|warning|info", "message": "..." }
  ],
  "insights": [
    { "title": "...", "description": "..." }
  ],
  "recommendations": [
    { "priority": "high|medium|low", "action": "...", "reason": "..." }
  ]
}`

export function useAgentAnalysis({ agentId, systemPrompt, buildPrompt, enabled = true, deps = [] }) {
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState(null)
  const runIdRef = useRef(0)

  const run = () => {
    if (!enabled || !agentId || !buildPrompt) return
    const dataPrompt = buildPrompt()
    if (!dataPrompt) return

    const id = ++runIdRef.current
    setLoading(true)
    setError(null)
    let fullText = ''

    streamChat({
      agentId,
      systemPrompt,
      messages: [{ role: 'user', content: dataPrompt + JSON_INSTRUCTION }],
      onToken: (token) => { if (runIdRef.current === id) fullText += token },
      onDone: () => {
        if (runIdRef.current !== id) return
        try {
          const m = fullText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, fullText]
          setAnalysis(JSON.parse((m[1] || fullText).trim()))
        } catch {
          setAnalysis({ raw: fullText })
        }
        setLoading(false)
      },
      onError: (err) => {
        if (runIdRef.current !== id) return
        setError(String(err))
        setLoading(false)
      },
    })
  }

  useEffect(() => { if (enabled) run() }, [enabled, ...deps])

  return { loading, analysis, error, refresh: run }
}
