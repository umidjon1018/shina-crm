import { useState, useEffect, useRef, useCallback } from 'react'
import { streamChat } from '../../../api/aiService'
import { getAgentInsights, triggerAgentRun, getAgentStatus } from '../../../api/agentRunService'
import { useSettingsStore } from '../../../store/settingsStore'
import { useDataStore } from '../../../store/dataStore'

// ─── LocalStorage cache (offline fallback) ────────────────────────────────
const CACHE_PREFIX = 'ai_analysis_v4_'

function getCache(agentId) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + agentId)
    if (!raw) return null
    const { analysis, date } = JSON.parse(raw)
    if (date !== new Date().toISOString().slice(0, 10)) return null
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

// ─── JSON repair (stream fallback uchun) ──────────────────────────────────
function repairJSON(text) {
  const start = text.indexOf('{')
  if (start === -1) return null
  let t = text.slice(start)
  const stack = []
  let inStr = false, esc = false, lastSafePos = 0
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
    if (lastComma > 0 && lastComma < t.length - 1) trimmed = t.slice(0, lastComma)
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
    try { const r = JSON.parse(trimmed); if (r && typeof r === 'object' && !Array.isArray(r)) return r } catch {}
  }
  if (lastSafePos > 0) {
    try { const r = JSON.parse(t.slice(0, lastSafePos)); if (r && typeof r === 'object' && !Array.isArray(r)) return r } catch {}
  }
  return null
}

function parseAnalysis(text) {
  const strategies = [
    () => JSON.parse(text.trim()),
    () => { const s = text.indexOf('{'), e = text.lastIndexOf('}'); if (s === -1 || e <= s) throw 0; return JSON.parse(text.slice(s, e + 1)) },
    () => { const stripped = text.replace(/^```[\w]*\s*/m, '').replace(/\s*```\s*$/m, '').trim(); return JSON.parse(stripped) },
    () => { const r = repairJSON(text); if (!r) throw 0; return r },
  ]
  for (const fn of strategies) {
    try { const r = fn(); if (r && typeof r === 'object' && !Array.isArray(r)) return r } catch {}
  }
  return null
}

// ─── DB dan o'qish (asosiy manba) ─────────────────────────────────────────
async function fetchFromDB(agentId) {
  try {
    const data = await getAgentInsights(agentId)
    if (!data?.run) return null
    // analysis: {kpis, alerts, insights, recommendations} — to'g'ridan AgentAnalysisPanel formatiga mos
    if (data.analysis && (data.analysis.kpis?.length || data.analysis.alerts?.length || data.analysis.recommendations?.length)) {
      return data.analysis
    }
    return null
  } catch {
    return null
  }
}

// ─── Asosiy hook ──────────────────────────────────────────────────────────
// Ikki rejim:
// 1. DB rejim: agentId bo'yicha /api/agents/:slug/insights dan o'qiydi
// 2. Stream rejim (fallback): streamChat orqali — buildPrompt + systemPrompt kerak
export function useAgentAnalysis({ agentId, systemPrompt, buildPrompt, enabled = true }) {
  const [loading, setLoading]   = useState(enabled)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError]       = useState(null)
  const [source, setSource]     = useState(null) // 'db' | 'stream' | 'cache'
  const [runStatus, setRunStatus] = useState(null) // { status, started_at, finished_at }
  const runIdRef = useRef(0)
  const didLoadRef = useRef(false)

  const loadFromDB = useCallback(async () => {
    if (!enabled || !agentId) return false
    try {
      const dbAnalysis = await fetchFromDB(agentId)
      if (dbAnalysis) {
        setAnalysis(dbAnalysis)
        setCache(agentId, dbAnalysis)
        setSource('db')
        setError(null)
        return true
      }
    } catch {}
    return false
  }, [agentId, enabled])

  const runStreamFallback = useCallback(() => {
    if (!enabled || !agentId || !buildPrompt) return
    const dataPrompt = buildPrompt()
    if (!dataPrompt) return

    const id = ++runIdRef.current
    setLoading(true)
    setError(null)
    let fullText = ''

    const JSON_INSTRUCTION = `\n\nFaqat quyidagi JSON formatida javob ber, hech qanday boshqa matn yozma. MAX: 8 kpi, 5 alert, 3 insight, 4 recommendation:\n{"kpis":[{"label":"...","value":"...","sub":"...","status":"good|warning|danger|neutral"}],"alerts":[{"severity":"danger|warning|info","message":"..."}],"insights":[{"title":"...","description":"..."}],"recommendations":[{"priority":"high|medium|low","action":"...","reason":"..."}]}`

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
          setSource('stream')
          setError(null)
          useDataStore.getState().bump()
        } else {
          setAnalysis({ raw: fullText || 'Javob bo\'sh qaytdi. Qayta urinib ko\'ring.' })
          setSource('stream')
        }
        setLoading(false)
      },
      onError: (err) => {
        if (runIdRef.current !== id) return
        // Stream ham xato bersа — cache ni ko'rsat
        const cached = getCache(agentId)
        if (cached) { setAnalysis(cached); setSource('cache') }
        setError(String(err))
        setLoading(false)
      },
    })
  }, [agentId, systemPrompt, buildPrompt, enabled])

  const load = useCallback(async (force = false) => {
    if (!enabled || !agentId) return
    if (!force && didLoadRef.current) return
    didLoadRef.current = true
    setLoading(true)

    // 1. DB dan o'qishga urinish
    const fromDB = await loadFromDB()
    if (fromDB) {
      setLoading(false)
      return
    }

    // 2. LocalStorage cache
    const cached = getCache(agentId)
    if (cached && !force) {
      setAnalysis(cached)
      setSource('cache')
      setLoading(false)
      return
    }

    // 3. Stream fallback (buildPrompt mavjud bo'lsa)
    if (buildPrompt && systemPrompt) {
      runStreamFallback()
    } else {
      setLoading(false)
    }
  }, [agentId, enabled, loadFromDB, buildPrompt, systemPrompt, runStreamFallback])

  const refresh = useCallback(async () => {
    didLoadRef.current = false
    clearAnalysisCache(agentId)
    setAnalysis(null)
    setError(null)
    setSource(null)

    // DB dan so'nggi natijani ol
    setLoading(true)
    const fromDB = await loadFromDB()
    if (fromDB) { setLoading(false); return }

    // Agentni trigger qilishga urinish
    try {
      await triggerAgentRun(agentId)
      // 3 soniya kutib qayta yukla (agent fon da ishlaydi)
      setTimeout(async () => {
        const fromDB2 = await loadFromDB()
        if (!fromDB2 && buildPrompt && systemPrompt) runStreamFallback()
        setLoading(false)
      }, 3000)
    } catch {
      if (buildPrompt && systemPrompt) runStreamFallback()
      else setLoading(false)
    }
  }, [agentId, loadFromDB, buildPrompt, systemPrompt, runStreamFallback])

  // Agent run holatini polling (agent ishlab turgan paytda)
  useEffect(() => {
    if (!agentId || !enabled) return
    let interval = null
    const checkStatus = async () => {
      try {
        const st = await getAgentStatus(agentId)
        setRunStatus(st)
        if (st?.status === 'completed' && !analysis) {
          await loadFromDB()
          setLoading(false)
        }
        if (st?.status !== 'running') {
          clearInterval(interval)
          interval = null
        }
      } catch {}
    }
    checkStatus()
    interval = setInterval(checkStatus, 5000)
    return () => { if (interval) clearInterval(interval) }
  }, [agentId, enabled])

  useEffect(() => {
    if (enabled) load()
  }, [enabled])

  return { loading, analysis, error, source, runStatus, refresh }
}
