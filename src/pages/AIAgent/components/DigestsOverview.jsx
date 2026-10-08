import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, Loader2, Play, ChevronRight, AlertCircle, AlertTriangle } from 'lucide-react'
import { getAiDigests, runAiDigests, getAiDigestStatus } from '../../../api/aiStatsService'
import { useAuthStore } from '../../../store/authStore'
import { useDataStore } from '../../../store/dataStore'
import { TAB_COLORS } from '../aiHelpers'

const SECTIONS = ['sales', 'inventory', 'customers', 'marketing', 'staff']

// Umumiy holat: 5 bo'limning bugungi AI xulosalari (qisqa), bosilsa bo'limga o'tadi
export default function DigestsOverview({ onTabChange }) {
  const { t } = useTranslation()
  const isAdmin = useAuthStore(s => s.user?.role === 'admin')
  const { version } = useDataStore()
  const [data, setData] = useState(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)
  const timer = useRef(null)

  const load = useCallback(() => {
    getAiDigests().then(d => { setData(d); setRunning(!!d.status?.running) }).catch(err => setError(err?.response?.data?.error || err.message))
  }, [])
  useEffect(() => { load() }, [load, version])
  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])

  const runAll = async () => {
    setError(null)
    setRunning(true)
    try { await runAiDigests() } catch (err) {
      if (err?.response?.status !== 409) { setError(err?.response?.data?.error || err.message); setRunning(false); return }
    }
    let n = 0
    timer.current = setInterval(async () => {
      n++
      try {
        const st = await getAiDigestStatus()
        if (!st.running || n > 100) { clearInterval(timer.current); setRunning(false); load() }
      } catch {}
    }, 3000)
  }

  const digests = data?.digests || {}
  const last = data?.status?.last

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-accent-blue" />
          <p className="text-sm font-semibold text-text-primary">{t('aisec_digests_title')}</p>
        </div>
        {isAdmin && (
          <button onClick={runAll} disabled={running}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-accent-blue/30 text-accent-blue hover:bg-accent-blue/10 disabled:opacity-50">
            {running ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
            <span>{running ? t('aisec_digest_running') : t('aisec_digest_run_all')}</span>
          </button>
        )}
      </div>
      {error && <p className="text-xs text-accent-red">{error}</p>}
      {last?.status === 'failed' && !running && <p className="text-xs text-accent-red">{t('aisec_digest_failed')}: {String(last.error || '').slice(0, 160)}</p>}
      {data && !Object.keys(digests).length ? (
        <p className="text-xs text-text-muted bg-bg-secondary border border-border rounded-xl px-3 py-4 text-center">{t('aisec_digest_none')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2 sm:gap-3">
          {SECTIONS.map(s => {
            const d = digests[s]
            const c = TAB_COLORS[s]
            const danger = d?.alerts?.filter(a => a.level === 'danger').length || 0
            const warn = d?.alerts?.filter(a => a.level === 'warning').length || 0
            return (
              <button key={s} onClick={() => onTabChange?.(s)}
                className={`text-left p-3 rounded-xl border ${c.border} ${c.bg} hover:brightness-110 transition flex flex-col gap-1.5 min-w-0`}>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-semibold ${c.text}`}>{t(`aisec_head_${s}`)}</span>
                  <ChevronRight size={14} className="text-text-muted" />
                </div>
                {d ? (
                  <>
                    <p className="text-xs text-text-primary leading-snug line-clamp-4">{d.summary || '—'}</p>
                    <div className="flex items-center gap-2 mt-auto">
                      {danger > 0 && <span className="flex items-center gap-0.5 text-[11px] text-accent-red"><AlertCircle size={11} />{danger}</span>}
                      {warn > 0 && <span className="flex items-center gap-0.5 text-[11px] text-accent-orange"><AlertTriangle size={11} />{warn}</span>}
                      <span className="text-[11px] text-text-muted">{t('aisec_recs_n', { n: d.recommendations?.length || 0 })}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-text-muted">{t('aisec_digest_none_short')}</p>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
