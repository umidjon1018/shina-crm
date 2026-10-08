import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, RefreshCw, Loader2 } from 'lucide-react'
import { getAiSection } from '../../../api/aiStatsService'
import { useShopStore } from '../../../store/shopStore'
import { useDataStore } from '../../../store/dataStore'

const num = (v) => Math.round(Number(v) || 0).toLocaleString('uz-UZ')
const pct = (cur, prev) => (prev > 0 ? Math.round((cur - prev) / prev * 1000) / 10 : null)

// KPI, ro'yxat va ustun nomlari backenddan o'zbekcha keladi (defaultValue); rus tili uchun aisec_* kalitlari
// Qiymatni birligiga qarab ko'rsatish
export const fmtValue = (v, unit, t) => {
  if (v === null || v === undefined || v === '') return '—'
  switch (unit) {
    case 'som': return `${num(v)} ${t('unit_som')}`
    case 'usd': return `$${num(v)}`
    case 'pct': return `${String(v).replace('.', ',')}%`
    case 'pcs': return num(v)
    case 'days': return t('aisec_days', { n: num(v) })
    case 'date': return String(v).slice(0, 10).split('-').reverse().join('.')
    case 'bool': return v ? '✓' : '—'
    case 'pay': return t(`pay_${v}`, { defaultValue: v })
    case 'segment': return t(`rpt_seg_${v}`, { defaultValue: v })
    case 'source': return t(`aisec_src_${v}`, { defaultValue: v })
    default: return String(v)
  }
}

const Change = ({ cur, prev, invert }) => {
  const c = pct(cur, prev)
  if (c === null) return null
  const good = invert ? c < 0 : c > 0
  const bad = invert ? c > 0 : c < 0
  const Icon = c >= 0 ? TrendingUp : TrendingDown
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${good ? 'text-accent-green' : bad ? 'text-accent-red' : 'text-text-muted'}`}>
      <Icon size={11} />{c > 0 ? '+' : ''}{String(c).replace('.', ',')}%
    </span>
  )
}

export const KpiCard = ({ k, t }) => (
  <div className="bg-bg-secondary border border-border rounded-xl p-3 sm:p-4 min-w-0">
    <p className="text-[11px] sm:text-xs text-text-muted leading-tight line-clamp-2">{t(`aisec_kpi_${k.key}`, { defaultValue: k.label, ...(k.params || {}) })}</p>
    <p className="text-base sm:text-xl font-bold text-text-primary mt-1.5 leading-tight break-words">{fmtValue(k.value, k.unit, t)}</p>
    {k.prev != null && (
      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
        <Change cur={k.value} prev={k.prev} invert={k.invert} />
        <span className="text-[11px] text-text-muted">{t('aisec_prev')}: {fmtValue(k.prev, k.unit, t)}</span>
      </div>
    )}
  </div>
)

export const KpiGrid = ({ kpis, t }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
    {kpis.map(k => <KpiCard key={k.key} k={k} t={t} />)}
  </div>
)

export const ListTable = ({ list, t }) => {
  if (!list.rows.length) return null
  return (
    <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
      <p className="text-xs font-semibold text-text-primary px-3 sm:px-4 pt-3 pb-2">{t(`aisec_list_${list.key}`, { defaultValue: list.label })}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-y border-border text-text-muted">
              {list.columns.map((c, i) => (
                <th key={c.key} className={`px-3 sm:px-4 py-2 font-medium whitespace-nowrap ${i === 0 ? 'text-left' : 'text-right'}`}>
                  {t(`aisec_col_${list.key}_${c.key}`, { defaultValue: c.label })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.rows.map((r, ri) => (
              <tr key={ri} className="border-b border-border/50 last:border-0">
                {list.columns.map((c, i) => (
                  <td key={c.key} className={`px-3 sm:px-4 py-2 ${i === 0 ? 'text-left text-text-primary' : 'text-right text-text-secondary whitespace-nowrap'}`}>
                    {fmtValue(r[c.key], c.unit, t)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Bo'lim raqamlari (SQL): KPI kartalar + ro'yxatlar. Do'kon tanloviga bog'liq
export default function SectionData({ section, onLoaded, hideLists = [] }) {
  const { t } = useTranslation()
  const { selectedShopId } = useShopStore()
  const { version } = useDataStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    getAiSection(section, { shop: selectedShopId })
      .then(d => { setData(d); onLoaded?.(d) })
      .catch(err => setError(err?.response?.data?.error || err.message))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, selectedShopId])

  useEffect(() => { load() }, [load, version])

  if (error) return <p className="text-xs text-accent-red bg-accent-red/10 border border-accent-red/20 rounded-lg px-3 py-2">{error}</p>
  if (!data) return loading ? <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin text-text-muted" /></div> : null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-text-muted">{t('aisec_period', { from: fmtValue(data.period.from, 'date', t), to: fmtValue(data.period.to, 'date', t) })}</p>
        <button onClick={load} disabled={loading} className="p-1 rounded-lg hover:bg-bg-secondary text-text-muted hover:text-text-primary disabled:opacity-50">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <KpiGrid kpis={data.kpis} t={t} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {data.lists.filter(l => !hideLists.includes(l.key)).map(l => <ListTable key={l.key} list={l} t={t} />)}
      </div>
    </div>
  )
}
