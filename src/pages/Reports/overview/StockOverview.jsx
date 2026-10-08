import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Boxes, Wallet, TrendingUp, AlertTriangle, PackageX, Snail, Clock } from 'lucide-react'
import { getStockOverview } from '../../../api/reportService'
import ReportTable from '../components/ReportTable'
import { HeroStat, MiniStat, ChartCard, GradientBars, DonutChart } from '../../../components/charts/Charts'
import { useOverview, money, qtyFmt, daysAgo, dmy, useLabels, Spinner, ErrorBox, LegacyLink, Chips } from './ovKit'
import { localToday } from '../../../utils/tz'

const TURN = { fast: 'bg-accent-green/10 text-accent-green', normal: 'bg-accent-blue/10 text-accent-blue', slow: 'bg-accent-red/10 text-accent-red', out: 'bg-bg-tertiary text-text-muted', unknown: 'bg-bg-tertiary text-text-muted' }
const ST = { ok: 'bg-accent-green/10 text-accent-green', low: 'bg-accent-orange/10 text-accent-orange', out: 'bg-accent-red/10 text-accent-red' }

// Qoldiq hisoboti — hozirgi holat (server): aylanish, muzlagan kapital, tugayotganlar
const StockOverview = ({ onLegacy }) => {
  const { t } = useTranslation()
  const L = useLabels()
  const { data, error } = useOverview(getStockOverview, { period: false })
  const [cat, setCat] = useState('all')
  const [view, setView] = useState('all')
  const [staleDays, setStaleDays] = useState(60)
  const today = localToday()
  const sc = data?.showCost

  const rows = useMemo(() => (data?.rows || []).map(r => {
    const std = L.catStd(r.category)
    const turnover = r.qty <= 0 ? 'out' : r.daysLeft == null ? 'unknown' : r.daysLeft > std * 1.5 ? 'slow' : r.daysLeft > std ? 'normal' : 'fast'
    const since = daysAgo(r.lastSold, today)
    return { ...r, std, turnover, since, stale: r.qty > 0 && (since == null || since > staleDays) }
  }), [data, staleDays])
  const inCat = cat === 'all' ? rows : rows.filter(r => r.category === cat)
  const shown = inCat.filter(r => view === 'all' ? true : view === 'stale' ? r.stale : view === 'slow' ? r.turnover === 'slow' : r.status === view)
  const sum = (l, k) => l.reduce((s, r) => s + (Number(r[k]) || 0), 0)
  const serialUnits = sum(inCat.filter(r => !r.bulk), 'qty')
  const capital = sum(inCat, 'capital'), retail = sum(inCat, 'retail')
  const cats = useMemo(() => {
    const m = new Map()
    rows.forEach(r => { const x = m.get(r.category) || { key: r.category, qty: 0, capital: 0, retail: 0 }; if (!r.bulk) x.qty += r.qty; x.capital += r.capital || 0; x.retail += r.retail; m.set(r.category, x) })
    return [...m.values()].sort((a, b) => b.retail - a.retail)
  }, [rows])

  if (!data) return <div className="space-y-4"><ErrorBox error={error} />{!error && <Spinner />}</div>

  const cols = [
    { key: 'name', label: t('ov_col_product'), className: 'font-medium' },
    { optional: true, key: 'category', label: t('ov_col_category'), render: r => L.cat(r.category), value: r => L.cat(r.category) },
    { key: 'qty', label: t('ov_col_stock'), align: 'right', render: r => `${qtyFmt(r.qty)} ${r.unit}` },
    { key: 'daysLeft', label: t('ov_col_days_left'), align: 'right', value: r => r.daysLeft ?? 99999,
      render: r => (r.daysLeft == null ? '—' : <span className={r.daysLeft <= 7 ? 'text-accent-red font-bold' : r.daysLeft <= 30 ? 'text-accent-orange font-semibold' : ''}>{r.daysLeft}</span>) },
    { key: 'turnover', label: t('ov_col_turnover'), render: r => <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${TURN[r.turnover]}`}>{t('ov_turn_' + r.turnover)}</span> },
    { optional: true, key: 'sold30', label: t('ov_col_sold30'), align: 'right', render: r => qtyFmt(r.sold30) },
    ...(sc ? [
      { optional: true, key: 'cost', label: t('ov_col_cost'), align: 'right', render: r => (r.cost == null ? '—' : money(r.cost)) },
      { optional: true, key: 'margin', label: t('ov_col_margin'), align: 'right', render: r => (r.margin == null ? '—' : `${r.margin}%`) },
      { key: 'capital', label: t('ov_col_capital'), align: 'right', sum: true, render: r => money(r.capital), renderTotal: money },
    ] : []),
    { optional: true, key: 'retail', label: t('ov_col_retail'), align: 'right', sum: true, render: r => money(r.retail), renderTotal: money },
    { key: 'lastSold', label: t('ov_col_last_sold'), value: r => r.lastSold || '', render: r => (r.lastSold ? <span className={r.since > staleDays ? 'text-accent-blue' : ''}>{dmy(r.lastSold)} · {t('ov_days_ago', { n: r.since })}</span> : <span className="text-text-muted">{t('ov_never')}</span>) },
    { optional: true, key: 'lastReceived', label: t('ov_col_last_received'), render: r => dmy(r.lastReceived) },
    { key: 'status', label: t('ov_col_status'), render: r => <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${ST[r.status]}`}>{t('ov_st_' + r.status)}</span> },
  ]

  return (
    <div className="space-y-4 sm:space-y-5">
      <ErrorBox error={error} />
      <Chips value={cat} onChange={setCat} items={[{ id: 'all', label: t('filter_all') }, ...cats.map(c => ({ id: c.key, label: L.cat(c.key) }))]} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <HeroStat gradient="blue" icon={Boxes} label={t('ov_units')} value={money(serialUnits)} unit={t('unit_pcs')}
          sub={t('ov_products_n', { n: inCat.filter(r => r.qty > 0).length })} />
        {sc
          ? <HeroStat gradient="orange" icon={Wallet} label={t('ov_frozen_capital')} value={money(capital)} unit={t('unit_som')} sub={t('ov_potential_profit', { v: money(retail - capital) })} />
          : <HeroStat gradient="green" icon={TrendingUp} label={t('ov_potential_revenue')} value={money(retail)} unit={t('unit_som')} />}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <MiniStat icon={TrendingUp} tone="green" label={t('ov_potential_revenue')} value={money(retail)} />
        <MiniStat icon={AlertTriangle} tone="orange" label={t('ov_st_low')} value={inCat.filter(r => r.status === 'low').length} onClick={() => setView(v => v === 'low' ? 'all' : 'low')} active={view === 'low'} />
        <MiniStat icon={PackageX} tone="red" label={t('ov_st_out')} value={inCat.filter(r => r.status === 'out').length} onClick={() => setView(v => v === 'out' ? 'all' : 'out')} active={view === 'out'} />
        <MiniStat icon={Snail} tone="violet" label={t('ov_turn_slow')} value={inCat.filter(r => r.turnover === 'slow').length} onClick={() => setView(v => v === 'slow' ? 'all' : 'slow')} active={view === 'slow'} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <ChartCard title={sc ? t('ov_capital_by_cat') : t('ov_retail_by_cat')}>
          <GradientBars horizontal data={cats.map(c => ({ label: L.cat(c.key), value: sc ? c.capital : c.retail }))} name={sc ? t('ov_col_capital') : t('ov_col_retail')} height={Math.max(160, cats.length * 46)} />
        </ChartCard>
        <ChartCard title={t('ov_turnover_by_cat')}>
          <div className="space-y-2.5">
            {cats.map(c => {
              const list = rows.filter(r => r.category === c.key && r.qty > 0 && r.daysLeft != null)
              const avg = list.length ? Math.round(list.reduce((s, r) => s + r.daysLeft, 0) / list.length) : null
              const std = L.catStd(c.key)
              return (
                <div key={c.key} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-text-primary font-medium">{L.cat(c.key)}</span>
                  <span className="text-text-secondary">{t('ov_avg_days', { n: avg ?? '—' })} / {t('ov_std_days', { n: std })}</span>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${avg == null ? TURN.unknown : avg <= std ? TURN.fast : avg <= std * 1.5 ? TURN.normal : TURN.slow}`}>
                    {avg == null ? '—' : avg <= std ? t('ov_turn_good') : avg <= std * 1.5 ? t('ov_turn_normal') : t('ov_turn_slow')}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="mt-4">
            <DonutChart height={170} data={cats.map(c => ({ name: L.cat(c.key), value: c.qty }))} centerLabel={t('unit_pcs')} valueFormatter={money} />
          </div>
        </ChartCard>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button type="button" onClick={() => setView(v => v === 'stale' ? 'all' : 'stale')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border font-semibold ${view === 'stale' ? 'bg-accent-red text-white border-accent-red' : 'border-border text-text-secondary hover:bg-bg-tertiary'}`}>
          <Clock size={15} /> {t('ov_stale_btn', { n: rows.filter(r => r.stale && (cat === 'all' || r.category === cat)).length })}
        </button>
        <label className="flex items-center gap-2 text-text-secondary">
          {t('ov_stale_days')}
          <input type="number" min="1" value={staleDays} onChange={e => setStaleDays(Math.max(1, Number(e.target.value) || 1))} aria-label={t('ov_stale_days')}
            className="w-20 bg-bg-tertiary border border-border rounded-lg px-2 py-1.5 text-text-primary" />
        </label>
        {view !== 'all' && <button type="button" onClick={() => setView('all')} className="text-accent-red font-semibold">{t('ov_clear_filter')}</button>}
      </div>
      <ReportTable title={t('ov_stock_list')} fileName={`qoldiq_${today}`} columns={cols} rows={shown} searchKeys={['name']} tableId="ov_stock_list" />
      <LegacyLink onClick={onLegacy} />
    </div>
  )
}

export default StockOverview
