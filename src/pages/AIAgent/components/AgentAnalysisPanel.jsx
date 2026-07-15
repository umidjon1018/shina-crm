import { RefreshCw, AlertTriangle, AlertCircle, Info, Lightbulb, Zap, ChevronRight, Loader2 } from 'lucide-react'

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

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {[...Array(4)].map((_, i) => (
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
    <div className="bg-bg-secondary border border-border rounded-xl p-5 mb-6 text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
      {text}
    </div>
  )
}

export default function AgentAnalysisPanel({ loading, analysis, error, refresh, accentColor = 'text-accent-blue' }) {
  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Loader2 size={16} className={`animate-spin ${accentColor}`} />
          <span className="text-sm text-text-secondary">AI agent tahlil qilmoqda...</span>
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
      <div className="bg-[#E63946]/10 border border-[#E63946]/30 rounded-xl p-4 mb-6 flex items-center justify-between">
        <span className="text-[#E63946] text-sm">{error}</span>
        <button onClick={refresh} className="flex items-center gap-1.5 text-sm text-[#E63946] hover:underline">
          <RefreshCw size={14} /> Qayta urinish
        </button>
      </div>
    )
  }

  if (!analysis) return null

  if (analysis.raw) return <RawFallback text={analysis.raw} />

  const { kpis = [], alerts = [], insights = [], recommendations = [] } = analysis

  return (
    <div className="mb-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#22c55e] inline-block" />
          AI tahlil tayyor
        </span>
        <button
          onClick={refresh}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <RefreshCw size={13} /> Yangilash
        </button>
      </div>

      {/* KPIs */}
      {kpis.length > 0 && (
        <div className={`grid gap-3 ${kpis.length <= 3 ? 'grid-cols-' + kpis.length : 'grid-cols-2 md:grid-cols-4'}`}>
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-bg-secondary border border-border rounded-xl p-4">
              <p className="text-text-secondary text-sm mb-2">{kpi.label}</p>
              <p className={`font-syne font-bold text-2xl ${STATUS_STYLES[kpi.status] || 'text-text-primary'}`}>
                {kpi.value}
              </p>
              {kpi.sub && <p className="text-text-secondary text-sm mt-1.5">{kpi.sub}</p>}
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

      {/* Insights + Recommendations */}
      {(insights.length > 0 || recommendations.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.length > 0 && (
            <div className="bg-bg-secondary border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={16} className="text-amber-400" />
                <span className="text-base font-semibold text-text-primary">Tahlil natijalari</span>
              </div>
              <div className="space-y-4">
                {insights.map((ins, i) => (
                  <div key={i}>
                    <p className="text-sm font-semibold text-text-primary">{ins.title}</p>
                    <p className="text-sm text-text-secondary mt-1 leading-relaxed">{ins.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="bg-bg-secondary border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={16} className={accentColor} />
                <span className="text-base font-semibold text-text-primary">Tavsiyalar</span>
              </div>
              <div className="space-y-4">
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
      )}
    </div>
  )
}
