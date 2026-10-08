import { useState, useEffect, useRef } from 'react'
import { streamChat } from '../../../api/aiService'
import { useSettingsStore } from '../../../store/settingsStore'
import { useDataStore } from '../../../store/dataStore'
import { getAgentInsights, getAgentStatus, triggerAgentRun } from '../../../api/agentRunService'
import { useAuthStore } from '../../../store/authStore'
import { localYmd } from '../aiHelpers'

// Max 8 KPI, 5 alert, 3 insight, 4 recommendation
const JSON_INSTRUCTION = `

Faqat quyidagi JSON formatida javob ber, hech qanday boshqa matn yozma. MAX: 8 kpi, 5 alert, 3 insight, 4 recommendation:
{"kpis":[{"label":"...","value":"...","sub":"...","status":"good|warning|danger|neutral"}],"alerts":[{"severity":"danger|warning|info","message":"..."}],"insights":[{"title":"...","description":"..."}],"recommendations":[{"priority":"high|medium|low","action":"...","reason":"..."}]}`

const CACHE_PREFIX = 'ai_analysis_v4_'

function getCache(agentId, autoRunHour = 23) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + agentId)
    if (!raw) return null
    const { analysis, date, cachedAt } = JSON.parse(raw)
    if (date !== localYmd(new Date())) return null
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
      date: localYmd(new Date()),
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

// Tries to close a truncated JSON string by balancing braces/brackets
function repairJSON(text) {
  const start = text.indexOf('{')
  if (start === -1) return null
  let t = text.slice(start)
  const stack = []
  let inStr = false
  let esc = false
  let lastSafePos = 0
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (esc) { esc = false; continue }
    if (c === '\\' && inStr) { esc = true; continue }
    if (c === '"') { inStr = !inStr; continue }
    if (inStr) continue
    if (c === '{' || c === '[') stack.push(c === '{' ? '}' : ']')
    else if (c === '}' || c === ']') {
      if (stack.length && stack[stack.length - 1] === c) {
        stack.pop()
        if (stack.length === 0) lastSafePos = i + 1
      }
    }
  }
  if (stack.length > 0) {
    let trimmed = t
    const lastComma = Math.max(t.lastIndexOf(','), t.lastIndexOf('['), t.lastIndexOf('{'))
    if (lastComma > 0 && lastComma < t.length - 1) {
      trimmed = t.slice(0, lastComma)
    }
    const checkStack = []
    let cs = false, ce = false
    for (const ch of trimmed) {
      if (ce) { ce = false; continue }
      if (ch === '\\' && cs) { ce = true; continue }
      if (ch === '"') { cs = !cs; continue }
      if (cs) continue
      if (ch === '{' || ch === '[') checkStack.push(ch === '{' ? '}' : ']')
      else if (ch === '}' || ch === ']') checkStack.pop()
    }
    if (cs) trimmed += '"'
    trimmed += checkStack.reverse().join('')
    try {
      const r = JSON.parse(trimmed)
      if (r && typeof r === 'object' && !Array.isArray(r)) return r
    } catch {}
  }
  if (lastSafePos > 0) {
    try {
      const r = JSON.parse(t.slice(0, lastSafePos))
      if (r && typeof r === 'object' && !Array.isArray(r)) return r
    } catch {}
  }
  return null
}

function parseAnalysis(text) {
  const strategies = [
    () => JSON.parse(text.trim()),
    () => {
      const s = text.indexOf('{'), e = text.lastIndexOf('}')
      if (s === -1 || e <= s) throw new Error('no braces')
      return JSON.parse(text.slice(s, e + 1))
    },
    () => {
      const stripped = text.replace(/^```[\w]*\s*/m, '').replace(/\s*```\s*$/m, '').trim()
      return JSON.parse(stripped)
    },
    () => {
      const stripped = text.replace(/^```[\w]*\s*/m, '').replace(/\s*```\s*$/m, '')
      const s = stripped.indexOf('{'), e = stripped.lastIndexOf('}')
      if (s === -1 || e <= s) throw new Error('no braces')
      return JSON.parse(stripped.slice(s, e + 1))
    },
    () => {
      const r = repairJSON(text)
      if (!r) throw new Error('repair failed')
      return r
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

export function useAgentAnalysis({ agentId, systemPrompt, buildPrompt, enabled = true, deps = [] }) {
  const autoRunHour = useSettingsStore(s => s.aiAutoAnalysisHour ?? 23)
  const cached = enabled ? getCache(agentId, autoRunHour) : null
  const [loading, setLoading] = useState(!cached && enabled)
  const [analysis, setAnalysis] = useState(cached)
  const [error, setError] = useState(null)
  const [source, setSource] = useState(cached ? 'cache' : null)
  const [lastRun, setLastRun] = useState(null)
  const [triggering, setTriggering] = useState(false)
  const runIdRef = useRef(0)
  const didRunRef = useRef(!!cached)
  const pollingRef = useRef(null)
  // Agentni qo'lda ishga tushirish backendda faqat adminga ruxsat etilgan
  const isAdmin = useAuthStore(s => s.user?.role === 'admin')
  useEffect(() => () => { if (pollingRef.current) clearInterval(pollingRef.current) }, [])
  // Refs so that closures always see the latest buildPrompt/systemPrompt
  const buildPromptRef = useRef(buildPrompt)
  const systemPromptRef = useRef(systemPrompt)
  buildPromptRef.current = buildPrompt
  systemPromptRef.current = systemPrompt

  // DB dan so'nggi agent natijalarini olish
  function checkDB() {
    return getAgentInsights(agentId)
      .then(data => {
        if (!data?.analysis) return false
        const { kpis = [], alerts = [], insights = [], recommendations = [] } = data.analysis
        if (!kpis.length && !alerts.length && !insights.length && !recommendations.length) return false
        setAnalysis(data.analysis)
        setLastRun(data.run || null)
        setSource('db')
        setCache(agentId, data.analysis)
        return true
      })
      .catch(() => false)
  }

  // Stream orqali tahlil (fallback)
  const run = (force = false) => {
    const bp = buildPromptRef.current
    const sp = systemPromptRef.current
    if (!enabled || !agentId || !bp) { setLoading(false); return }
    if (!force && didRunRef.current) return
    const dataPrompt = bp()
    if (!dataPrompt) { setLoading(false); return }

    if (force) clearAnalysisCache(agentId)
    didRunRef.current = true

    const id = ++runIdRef.current
    setLoading(true)
    setError(null)
    setSource('stream')
    let fullText = ''

    streamChat({
      agentId,
      systemPrompt: sp,
      messages: [{ role: 'user', content: dataPrompt + JSON_INSTRUCTION }],
      onToken: (token) => { if (runIdRef.current === id) fullText += token },
      onDone: () => {
        if (runIdRef.current !== id) return
        const parsed = parseAnalysis(fullText)
        if (parsed) {
          setCache(agentId, parsed)
          setAnalysis(parsed)
          setError(null)
          useDataStore.getState().bump()
        } else {
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

  // Mount: DB tekshir → yo'q bo'lsa cache/stream
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!enabled) return
    checkDB().then(fromDB => {
      if (fromDB) {
        didRunRef.current = true
        setLoading(false)
        return
      }
      if (!didRunRef.current) run()
    })
  }, [enabled, ...deps])

  // Backend agentni ishga tushirish va natijani kutish
  function startPolling() {
    let n = 0
    pollingRef.current = setInterval(async () => {
      if (++n > 90) { clearInterval(pollingRef.current); setTriggering(false); return }
      try {
        const st = await getAgentStatus(agentId)
        if (st?.status === 'completed') {
          clearInterval(pollingRef.current)
          checkDB().then(() => {
            setTriggering(false)
            useDataStore.getState().bump()
          })
        } else if (st?.status === 'failed') {
          clearInterval(pollingRef.current)
          setError('Agent xato: ' + (st.error ? st.error.slice(0, 100) : 'noma\'lum'))
          setTriggering(false)
        }
      } catch {}
    }, 2000)
  }

  function triggerRun() {
    if (triggering) return
    if (pollingRef.current) clearInterval(pollingRef.current)
    setTriggering(true)
    setError(null)
    triggerAgentRun(agentId)
      .then(() => startPolling())
      .catch(err => {
        if (err?.response?.status === 409) {
          // Agent allaqachon ishlayapti — uning natijasini kuting
          startPolling()
        } else {
          setTriggering(false)
          setError(err?.response?.data?.error || err.message || 'Agent ishga tushmadi')
        }
      })
  }

  async function refresh() {
    didRunRef.current = false
    clearAnalysisCache(agentId)
    setSource(null)
    setLoading(true)
    const fromDB = await checkDB()
    if (!fromDB) run(true)
    else setLoading(false)
  }

  return { loading, analysis, error, source, lastRun, triggering, triggerRun: isAdmin ? triggerRun : null, refresh }
}
