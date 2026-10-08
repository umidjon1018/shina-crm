import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, AlertCircle, AlertTriangle, Info, Loader2, Play } from 'lucide-react'
import { runAiDigests, getAiDigestStatus } from '../../../api/aiStatsService'
import { useAuthStore } from '../../../store/authStore'

const LEVEL = {
  danger:  { Icon: AlertCircle,   cls: 'border-accent-red/30 bg-accent-red/5',     icon: 'text-accent-red' },
  warning: { Icon: AlertTriangle, cls: 'border-accent-orange/30 bg-accent-orange/5', icon: 'text-accent-orange' },
  info:    { Icon: Info,          cls: 'border-accent-blue/30 bg-accent-blue/5',   icon: 'text-accent-blue' },
}
const PRIORITY_DOT = { high: 'bg-accent-red', medium: 'bg-amber-400', low: 'bg-accent-green' }

const fmtWhen = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// Bo'limning bugungi AI xulosasi (kundalik tahlilchi natijasi). Admin qo'lda qayta tahlil qila oladi
export default function DigestCard({ section, digest, onDone, compact = false }) {
  const { t } = useTranslation()
  const isAdmin = useAuthStore(s => s.user?.role === 'admin')
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)
  const timer = useRef(null)

  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])

  const run = async () => {
    setError(null)
    setRunning(true)
    try {
      await runAiDigests(section)
    } catch (err) {
      if (err?.response?.status !== 409) {
        setError(err?.response?.data?.error || err.message)
        setRunning(false)
        return
      }
    }
    let n = 0
    timer.current = setInterval(async () => {
      n++
      try {
        const st = await getAiDigestStatus()
        if (!st.running || n > 60) {
          clearInterval(timer.current)
          setRunning(false)
          if (st.last?.status === 'failed') setError(st.last.error || t('aisec_digest_failed'))
          onDone?.()
        }
      } catch {}
    }, 3000)
  }

  const RunBtn = isAdmin && (
    <button onClick={run} disabled={running}
      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-accent-blue/30 text-accent-blue hover:bg-accent-blue/10 disabled:opacity-50 flex-shrink-0">
      {running ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
      <span>{running ? t('aisec_digest_running') : t('aisec_digest_run')}</span>
    </button>
  )

  return (
    <div className="bg-bg-secondary border border-border rounded-xl p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-accent-blue" />
          <p className="text-sm font-semibold text-text-primary">{t('aisec_digest_title')}</p>
          {digest?.createdAt && <span className="text-[11px] text-text-muted">{fmtWhen(digest.createdAt)}</span>}
        </div>
        {RunBtn}
      </div>

      {error && <p className="text-xs text-accent-red mb-2">{error}</p>}

      {!digest ? (
        <p className="text-xs text-text-muted py-2">{t('aisec_digest_none')}</p>
      ) : (
        <div className="space-y-3">
          {digest.summary && <p className="text-sm text-text-primary leading-relaxed">{digest.summary}</p>}
          {!compact && digest.alerts?.length > 0 && (
            <div className="space-y-2">
              {digest.alerts.map((a, i) => {
                const L = LEVEL[a.level] || LEVEL.info
                return (
                  <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${L.cls}`}>
                    <L.Icon size={15} className={`${L.icon} flex-shrink-0 mt-0.5`} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-text-primary">{a.title}</p>
                      <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{a.text}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {!compact && digest.recommendations?.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">{t('aisec_recs')}</p>
              <div className="space-y-2">
                {digest.recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_DOT[r.priority] || PRIORITY_DOT.medium}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-text-primary">{r.title}</p>
                      <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{r.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
