import { useState, useEffect, useRef } from 'react'
import { streamChat } from '../../../api/aiService'
import { useSettingsStore } from '../../../store/settingsStore'

const JSON_INSTRUCTION = `

Faqat quyidagi JSON formatida javob ber, hech qanday boshqa matn yozma:
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

const CACHE_PREFIX = 'ai_analysis_v2_'

function getCache(agentId, autoRunHour = 23) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + agentId)
    if (!raw) return null
    const { analysis, date, cachedAt } = JSON.parse(raw)
    const today = new Date().toISOString().slice(0, 10)
    if (date !== today) return null
    // If current time >= autoRunHour and cache was created before autoRunHour → stale
    const currentHour = new Date().getHours()
    if (cachedAt) {
      const cacheHour = new Date(cachedAt).getHours()
      if (currentHour >= autoRunHour && cacheHour < autoRunHour) return null
    }
    return analysis
  } catch { return null }
}

function setCache(agentId, analysis) {
  try {
    localStorage.setItem(CACHE_PREFIX + agentId, JSON.stringify({
      analysis,
      date: new Date().toISOString().slice(0, 10),
      cachedAt: Date.now(),
    }))
  } catch {}
}

export function clearAnalysisCache(agentId) {
  try { localStorage.removeItem(CACHE_PREFIX + agentId) } catch {}
}

export function clearAllAnalysisCache() {
  try {
    Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX)).forEach(k => localStorage.removeItem(k))
  } catch {}
}

// Tries multiple strategies to extract JSON from AI response text
function parseAnalysis(text) {
  const strategies = [
    // 1. Direct parse
    () => JSON.parse(text.trim()),
    // 2. Extract from first { to last }
    () => {
      const s = text.indexOf('{'), e = text.lastIndexOf('}')
      if (s === -1 || e <= s) throw new Error('no braces')
      return JSON.parse(text.slice(s, e + 1))
    },
    // 3. Strip code fence then parse
    () => {
      const stripped = text.replace(/^```[\w]*\s*/m, '').replace(/\s*```\s*$/m, '').trim()
      return JSON.parse(stripped)
    },
    // 4. Strip code fence then extract braces
    () => {
      const stripped = text.replace(/^```[\w]*\s*/m, '').replace(/\s*```\s*$/m, '')
      const s = stripped.indexOf('{'), e = stripped.lastIndexOf('}')
      if (s === -1 || e <= s) throw new Error('no braces')
      return JSON.parse(stripped.slice(s, e + 1))
    },
  ]
  for (const fn of strategies) {
    try {
      const r = fn()
      if (r && typeof r === 'object' && !Array.isArray(r)) return r
    } catch {}
  }
  return null
}

export function useAgentAnalysis({ agentId, systemPrompt, buildPrompt, enabled = true }) {
  const autoRunHour = useSettingsStore(s => s.aiAutoAnalysisHour ?? 23)
  const cached = enabled ? getCache(agentId, autoRunHour) : null
  const [loading, setLoading] = useState(!cached && enabled)
  const [analysis, setAnalysis] = useState(cached)
  const [error, setError] = useState(null)
  const runIdRef = useRef(0)
  const didRunRef = useRef(!!cached)

  const run = (force = false) => {
    if (!enabled || !agentId || !buildPrompt) return
    if (!force && didRunRef.current) return
    const dataPrompt = buildPrompt()
    if (!dataPrompt) return

    if (force) clearAnalysisCache(agentId)
    didRunRef.current = true

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
        const parsed = parseAnalysis(fullText)
        if (parsed) {
          setCache(agentId, parsed)
          setAnalysis(parsed)
          setError(null)
        } else {
          // Show raw text so user sees something useful
          setAnalysis({ raw: fullText || 'Javob bo\'sh qaytdi. Qayta urinib ko\'ring.' })
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

  // Run once on mount if no cache
  useEffect(() => {
    if (enabled && !didRunRef.current) run()
  }, [enabled])

  return { loading, analysis, error, refresh: () => run(true) }
}
