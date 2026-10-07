import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, AlertTriangle, AlertCircle, Info, CheckCircle2, RefreshCw, Loader2, FileText, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react'
import { getAiStatsOverview, getWeeklyReports, generateWeeklyReport } from '../../../api/aiStatsService'
import { useShopStore } from '../../../store/shopStore'
import { useAuthStore } from '../../../store/authStore'
import { useDataStore } from '../../../store/dataStore'
import AiChat from '../components/AiChat'

const num = (v) => Math.round(Number(v) || 0).toLocaleString('uz-UZ')

const Change = ({ value, invert = false }) => {
  if (value === null || value === undefined) return <span className="text-[11px] text-text-muted">—</span>
  const good = invert ? value < 0 : value > 0
  const bad = invert ? value > 0 : value < 0
  const Icon = value >= 0 ? TrendingUp : TrendingDown
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${good ? 'text-accent-green' : bad ? 'text-accent-red' : 'text-text-muted'}`}>
      <Icon size={11} />{value > 0 ? '+' : ''}{String(value).replace('.', ',')}%
    </span>
  )
}

const SEVERITY = {
  danger:  { Icon: AlertCircle,   cls: 'border-accent-red/30 bg-accent-red/5',     icon: 'text-accent-red' },
  warning: { Icon: AlertTriangle, cls: 'border-accent-orange/30 bg-accent-orange/5', icon: 'text-accent-orange' },
  success: { Icon: CheckCircle2,  cls: 'border-accent-green/30 bg-accent-green/5', icon: 'text-accent-green' },
  info:    { Icon: Info,          cls: 'border-accent-blue/30 bg-accent-blue/5',   icon: 'text-accent-blue' },
}

const anomalyDesc = (a, t) => {
  const p = a.params || {}
  const som = t('unit_som')
  switch (a.code) {
    case 'sales_drop':
    case 'sales_up': return t(`ais_${a.code}_desc`, { current: `${num(p.current)} ${som}`, avg: `${num(p.avg)} ${som}`, value: Math.abs(a.value) })
    case 'cancel_rate': return t('ais_cancel_rate_desc', { cancelled: p.cancelled, total: p.total, value: a.value })
    case 'overdue_installments': return t('ais_overdue_installments_desc', { value: a.value, amount: `${num(p.amount)} ${som}` })
    case 'supplier_overdue': return t('ais_supplier_overdue_desc', { value: a.value, usd: num(p.usd) })
    case 'below_cost': return t('ais_below_cost_desc', { value: a.value, amount: `${num(p.loss)} ${som}` })
    default: return t(`ais_${a.code}_desc`, { value: a.value })
  }
}

const itemLine = (code, it, t) => {
  const som = t('unit_som')
  switch (code) {
    case 'low_stock': return t('ais_item_low_stock', { stock: it.value, sold: it.extra })
    case 'overdue_installments': return t('ais_item_overdue', { amount: `${num(it.value)} ${som}`, days: it.extra })
    case 'supplier_overdue': return `$${num(it.value)}`
    case 'below_cost': return t('ais_item_below_cost', { amount: `${num(it.value)} ${som}`, seller: it.extra })
    case 'slow_moving': return t('ais_item_slow', { qty: it.value, days: it.extra })
    case 'birthdays': return it.value === 0 ? t('ais_item_bd_today') : t('ais_item_bd_days', { days: it.value })
    default: return String(it.value ?? '')
  }
}

const AnomalyCard = ({ a, t }) => {
  const [open, setOpen] = useState(false)
  const s = SEVERITY[a.severity] || SEVERITY.info
  const hasItems = a.items?.length > 0
  return (
    <div className={`border rounded-xl p-3 ${s.cls}`}>
      <button type="button" onClick={() => hasItems && setOpen(o => !o)} className={`w-full flex items-start gap-2.5 text-left ${hasItems ? 'cursor-pointer' : 'cursor-default'}`}>
        <s.Icon size={16} className={`${s.icon} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary">{t(`ais_${a.code}_title`)}</p>
          <p className="text-xs text-text-secondary mt-0.5">{anomalyDesc(a, t)}</p>
        </div>
        {hasItems && (open ? <ChevronUp size={14} className="text-text-muted mt-0.5" /> : <ChevronDown size={14} className="text-text-muted mt-0.5" />)}
      </button>
      {open && hasItems && (
        <div className="mt-2 pl-6 space-y-1">
          {a.items.map((it, i) => (
            <div key={i} className="flex items-center justify-between gap-3 text-xs">
              <span className="text-text-primary truncate">{it.name}</span>
              <span className="text-text-muted flex-shrink-0">{itemLine(a.code, it, t)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const PeriodCard = ({ title, sub, data, showProfit, t }) => {
  if (!data) return null
  const c = data.current, ch = data.change
  const som = t('unit_som')
  const rows = [
    { label: t('ais_sales_count'), value: num(c.salesCount), change: ch.salesCount },
    { label: t('ais_avg_check'), value: `${num(c.avgCheck)} ${som}`, change: ch.avgCheck },
    ...(showProfit ? [{ label: t('ais_profit'), value: `${num(c.profit)} ${som}`, change: ch.profit }] : []),
  ]
  return (
    <div className="bg-bg-secondary border border-border rounded-xl p-3 sm:p-4">
      <p className="text-xs font-semibold text-text-primary">{title}</p>
      <p className="text-[11px] text-text-muted">{sub}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="text-lg sm:text-xl font-bold text-text-primary leading-tight">{num(c.revenue)} <span className="text-xs font-medium text-text-muted">{som}</span></p>
        <Change value={ch.revenue} />
      </div>
      <p className="text-[11px] text-text-muted">{t('ais_prev')}: {num(data.previous.revenue)} {som}</p>
      <div className="mt-2 pt-2 border-t border-border space-y-1">
        {rows.map(r => (
          <div key={r.label} className="flex items-center justify-between gap-2 text-xs">
            <span className="text-text-muted">{r.label}</span>
            <span className="flex items-center gap-2"><span className="text-text-primary font-medium">{r.value}</span><Change value={r.change} /></span>
          </div>
        ))}
      </div>
    </div>
  )
}

const renderSummary = (text) => text.split('\n').filter(l => l.trim()).map((line, i) => {
  if (/^#+\s/.test(line.trim())) return <p key={i} className="text-xs font-bold text-text-primary">{line.replace(/^\s*#+\s/, '')}</p>
  const isItem = /^[-*•]\s/.test(line.trim())
  const parts = line.replace(/^\s*[-*•]\s/, '').split(/\*\*(.+?)\*\*/g)
  const content = parts.map((p, j) => (j % 2 ? <b key={j}>{p}</b> : p))
  return isItem
    ? <div key={i} className="flex gap-1.5 text-xs text-text-primary"><span className="flex-shrink-0">•</span><span>{content}</span></div>
    : <p key={i} className="text-xs text-text-primary">{content}</p>
})

const WeeklyReport = ({ reports, idx, setIdx, canGenerate, onGenerate, generating, showProfit, t }) => {
  const rep = reports[idx]
  const som = t('unit_som')
  return (
    <div className="bg-bg-secondary border border-border rounded-xl p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-accent-blue" />
          <p className="text-sm font-semibold text-text-primary">{t('ais_weekly_title')}</p>
        </div>
        <div className="flex items-center gap-2">
          {reports.length > 0 && (
            <select value={idx} onChange={e => setIdx(Number(e.target.value))}
              className="text-xs bg-bg-primary border border-border rounded-lg px-2 py-1.5 text-text-primary focus:outline-none">
              {reports.map((r, i) => <option key={r.id} value={i}>{r.data.weekStart.split('-').reverse().join('.')} – {r.data.weekEnd.split('-').reverse().join('.')}</option>)}
            </select>
          )}
          {canGenerate && (
            <button onClick={onGenerate} disabled={generating}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-accent-blue/15 text-accent-blue hover:bg-accent-blue/25 disabled:opacity-50">
              {generating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              <span className="hidden sm:inline">{t('ais_weekly_generate')}</span>
            </button>
          )}
        </div>
      </div>

      {!rep ? (
        <p className="text-xs text-text-muted py-4 text-center">{t('ais_weekly_none')}</p>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: t('ais_revenue'), value: `${num(rep.data.current.revenue)} ${som}`, ch: rep.data.change.revenue },
              { label: t('ais_sales_count'), value: num(rep.data.current.salesCount), ch: rep.data.change.salesCount },
              { label: t('ais_avg_check'), value: `${num(rep.data.current.avgCheck)} ${som}`, ch: rep.data.change.avgCheck },
              ...(showProfit && rep.data.current.profit !== null ? [{ label: t('ais_profit'), value: `${num(rep.data.current.profit)} ${som}`, ch: rep.data.change.profit }] : []),
            ].map(k => (
              <div key={k.label} className="bg-bg-primary border border-border rounded-lg p-2.5">
                <p className="text-[11px] text-text-muted">{k.label}</p>
                <p className="text-sm font-bold text-text-primary">{k.value}</p>
                <Change value={k.ch} />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-text-muted -mt-1">{t('ais_weekly_vs')}</p>

          {rep.summary && (
            <div className="bg-bg-primary border border-border rounded-lg p-3 space-y-1">
              <p className="text-[11px] font-semibold text-accent-blue uppercase tracking-wide mb-1">{t('ais_weekly_ai')}</p>
              {renderSummary(rep.summary)}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { title: t('ais_weekly_top_products'), rows: rep.data.topProducts.map(p => [p.name, `${p.qty} ${t('ais_pcs')}`]) },
              { title: t('ais_weekly_top_sellers'), rows: rep.data.topSellers.map(s => [s.name, `${num(s.revenue)} ${som}`]) },
            ].map(b => (
              <div key={b.title}>
                <p className="text-xs font-semibold text-text-secondary mb-1">{b.title}</p>
                {b.rows.length === 0 ? <p className="text-xs text-text-muted">—</p> : b.rows.map(([a, v], i) => (
                  <div key={i} className="flex justify-between gap-3 text-xs py-0.5">
                    <span className="text-text-primary truncate">{i + 1}. {a}</span>
                    <span className="text-text-muted flex-shrink-0">{v}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const StatsTab = () => {
  const { t } = useTranslation()
  const { selectedShopId } = useShopStore()
  const { user } = useAuthStore()
  const { version } = useDataStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reports, setReports] = useState([])
  const [repIdx, setRepIdx] = useState(0)
  const [generating, setGenerating] = useState(false)
  const canGenerate = user?.role === 'admin' || user?.role === 'manager'

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    getAiStatsOverview({ shop: selectedShopId })
      .then(setData)
      .catch(err => setError(err?.response?.data?.error || err.message))
      .finally(() => setLoading(false))
    getWeeklyReports().then(r => { setReports(r); setRepIdx(0) }).catch(() => {})
  }, [selectedShopId])

  useEffect(() => { load() }, [load, version])

  const generate = async () => {
    setGenerating(true)
    try {
      await generateWeeklyReport()
      const r = await getWeeklyReports()
      setReports(r)
      setRepIdx(0)
    } catch (err) {
      setError(err?.response?.data?.error || err.message)
    } finally {
      setGenerating(false)
    }
  }

  const som = t('unit_som')
  const cmp = data?.comparison
  const fmtDay = (d) => d.slice(8, 10) + '.' + d.slice(5, 7)

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-text-primary">{t('ais_cmp_title')}</p>
        <button onClick={load} disabled={loading} className="p-1.5 rounded-lg hover:bg-bg-secondary text-text-muted hover:text-text-primary disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && <p className="text-xs text-accent-red bg-accent-red/10 border border-accent-red/20 rounded-lg px-3 py-2">{error}</p>}

      {!data && loading ? (
        <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-text-muted" /></div>
      ) : cmp && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <PeriodCard title={t('ais_p_day')} sub={t('ais_p_day_sub')} data={cmp.day} showProfit={data.showProfit} t={t} />
            <PeriodCard title={t('ais_p_week')} sub={t('ais_p_week_sub')} data={cmp.week} showProfit={data.showProfit} t={t} />
            <PeriodCard title={t('ais_p_month')} sub={t('ais_p_month_sub')} data={cmp.month} showProfit={data.showProfit} t={t} />
            <PeriodCard title={t('ais_p_year')} sub={t('ais_p_year_sub')} data={cmp.year} showProfit={data.showProfit} t={t} />
          </div>

          <div className="bg-bg-secondary border border-border rounded-xl p-3 sm:p-4">
            <p className="text-xs font-semibold text-text-primary mb-2">{t('ais_trend_title')}</p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.trend} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="date" tickFormatter={fmtDay} tick={{ fontSize: 10, fill: 'var(--text-muted, #888)' }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(127,127,127,0.1)' }}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    labelFormatter={(d) => d.split('-').reverse().join('.')}
                    formatter={(v, _n, p) => [`${num(v)} ${som} · ${p.payload.salesCount} ${t('ais_sales_short')}`, t('ais_revenue')]}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-text-primary mb-2">{t('ais_anom_title')}</p>
            {data.anomalies.length === 0 ? (
              <p className="text-xs text-text-muted bg-bg-secondary border border-border rounded-xl px-3 py-4 text-center">{t('ais_anom_none')}</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {data.anomalies.map(a => <AnomalyCard key={a.code} a={a} t={t} />)}
              </div>
            )}
          </div>
        </>
      )}

      <WeeklyReport reports={reports} idx={repIdx} setIdx={setRepIdx} canGenerate={canGenerate} onGenerate={generate}
        generating={generating} showProfit={data?.showProfit !== false} t={t} />

      <div>
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare size={15} className="text-accent-blue" />
          <p className="text-sm font-semibold text-text-primary">{t('ais_ask_title')}</p>
        </div>
        <AiChat agentId="stats-agent" colorClass="accent-blue" placeholder={t('ais_ask_ph')}
          suggestions={[t('ais_q1'), t('ais_q2'), t('ais_q3'), t('ais_q4')]} />
      </div>
    </div>
  )
}

export default StatsTab
