import { RefreshCw, AlertTriangle, AlertCircle, Info, Lightbulb, Zap, Loader2, Play } from 'lucide-react'

const STATUS_STYLES = {
  good:    'text-[#22c55e]',
  warning: 'text-amber-400',
  danger:  'text-[#E63946]',
  neutral: 'text-text-primary',
}

const SEVERITY_STYLES = {
  danger:  { bg: 'bg-[#E63946]/10 border-[#E63946]/30', text: 'text-[#E63946]',  Icon: AlertCircle },
  warning: { bg: 'bg-amber-400/10 border-amber-400/30', text: 'text-amber-400',   Icon: AlertTriangle },
  info:    { bg: 'bg-accent-blue/10 border-accent-blue/30', text: 'text-accent-blue', Icon: Info },
}

const PRIORITY_STYLES = {
  high:   { dot: 'bg-[#E63946]',  label: 'Yuqori' },
  medium: { dot: 'bg-amber-400',  label: "O'rta" },
  low:    { dot: 'bg-[#22c55e]',  label: 'Past' },
}

function fmtAgo(iso) {
  if (!iso) return null
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000)
  if (diff < 1) return 'hozirgina'
  if (diff < 60) return diff + ' daqiqa oldin'
  if (diff < 1440) return Math.floor(diff / 60) + ' soat oldin'
  return Math.floor(diff / 1440) + ' kun oldin'
}

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 sm:mb-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-bg-secondary border border-border rounded-xl p-4 animate-pulse">
          <div className="h-3 bg-bg-tertiary rounded w-2/3 mb-3" />
          <div className="h-6 bg-bg-tertiary rounded w-4/5 mb-2" />
          <div className="h-2.5 bg-bg-tertiary rounded w-1/2" />
        </div>
      ))}
    </div>
  )
}

function RawFallback({ text }) {
  return (
    <div className="bg-bg-secondary border border-border rounded-xl p-4 sm:p-5 mb-4 sm:mb-6 text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
      {text}
    </div>
  )
}

export default function AgentAnalysisPanel({
  loading, analysis, error, refresh,
  accentColor = 'text-accent-blue',
  onTriggerRun = null,
  triggering = false,
  source = null,
  lastRun = null,
}) {
  if (loading) {
    return (
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Loader2 size={16} className={`animate-spin ${accentColor}`} />
          <span className="text-sm text-text-secondary">
            {triggering ? 'Backend agent ishlamoqda...' : 'AI agent tahlil qilmoqda...'}
          </span>
        </div>
        <KpiSkeleton />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-bg-secondary border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-[#E63946]/10 border border-[#E63946]/30 rounded-xl p-4 mb-4 sm:mb-6 flex items-center justify-between gap-3">
        <span className="text-[#E63946] text-sm flex-1">{error}</span>
        <div className="flex items-center gap-2 shrink-0">
          {onTriggerRun && (
            <button
              onClick={onTriggerRun}
              disabled={triggering}
              className="flex items-center gap-1.5 text-sm text-[#E63946] hover:underline"
            >
              {triggering ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
              {triggering ? 'Ishlamoqda...' : 'Ishga tushir'}
            </button>
          )}
          <button onClick={refresh} className="flex items-center gap-1.5 text-sm text-[#E63946] hover:underline">
            <RefreshCw size={14} /> Qayta
          </button>
        </div>
      </div>
    )
  }

  if (!analysis) {
    if (!onTriggerRun) return null
    return (
      <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3 bg-bg-secondary border border-border rounded-xl px-5 py-4">
        <span className="text-sm text-text-secondary">Hali agent natijasi yo'q</span>
        <button
          onClick={onTriggerRun}
          disabled={triggering}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
            triggering
              ? 'text-text-muted border-border cursor-not-allowed'
              : 'text-accent-red border-accent-red/30 hover:bg-accent-red/10'
          }`}
        >
          {triggering ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
          {triggering ? 'Ishlamoqda...' : 'Agentni ishga tushir'}
        </button>
      </div>
    )
  }

  if (analysis.raw) return <RawFallback text={analysis.raw} />

  const { kpis = [], alerts = [], insights = [], recommendations = [] } = analysis

  const sourceLabel = source === 'db'
    ? '🟢 Backend agent natijasi'
    : source === 'cache'
    ? '🟡 Kesh'
    : '🔵 Stream tahlili'

  return (
    <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-sm text-text-secondary flex items-center gap-1.5">
          {sourceLabel}
          {lastRun?.finished_at && (
            <span className="text-text-muted"> — {fmtAgo(lastRun.finished_at)}</span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <RefreshCw size={13} /> Yangilash
          </button>
          {onTriggerRun && (
            <button
              onClick={onTriggerRun}
              disabled={triggering}
              title="Backend agentni ishga tushirish (DB ga yozadi)"
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                triggering
                  ? 'text-text-muted border-border cursor-not-allowed'
                  : 'text-accent-red border-accent-red/30 hover:bg-accent-red/10'
              }`}
            >
              {triggering ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
              {triggering ? 'Ishlamoqda...' : 'Agentni ishga tushir'}
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-bg-secondary border border-border rounded-xl p-4 flex flex-col">
              <p className="text-text-secondary text-xs mb-2 leading-tight line-clamp-2">{kpi.label}</p>
              <p className={`font-syne font-bold ${kpi.value.length > 12 ? 'text-lg' : 'text-2xl'} ${STATUS_STYLES[kpi.status] || 'text-text-primary'} leading-tight`}>
                {kpi.value}
              </p>
              {kpi.sub && <p className="text-text-secondary text-xs mt-1.5 line-clamp-2 leading-snug">{kpi.sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => {
            const s = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info
            return (
              <div key={i} className={`flex items-start gap-3 p-3.5 rounded-xl border ${s.bg}`}>
                <s.Icon size={16} className={`${s.text} mt-0.5 flex-shrink-0`} />
                <span className={`text-sm font-medium ${s.text}`}>{alert.message}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Insights — fullwidth */}
      {insights.length > 0 && (
        <div className="bg-bg-secondary border border-border rounded-xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={16} className="text-amber-400" />
            <span className="text-base font-semibold text-text-primary">Tahlil natijalari</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((ins, i) => (
              <div key={i}>
                <p className="text-sm font-semibold text-text-primary">{ins.title}</p>
                <p className="text-sm text-text-secondary mt-1 leading-relaxed">{ins.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations — fullwidth */}
      {recommendations.length > 0 && (
        <div className="bg-bg-secondary border border-border rounded-xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className={accentColor} />
            <span className="text-base font-semibold text-text-primary">Tavsiyalar</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec, i) => {
              const p = PRIORITY_STYLES[rec.priority] || PRIORITY_STYLES.medium
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${p.dot} mt-2 flex-shrink-0`} />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{rec.action}</p>
                    {rec.reason && <p className="text-sm text-text-secondary mt-0.5 leading-relaxed">{rec.reason}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
