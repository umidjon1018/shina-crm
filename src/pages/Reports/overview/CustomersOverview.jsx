import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, Repeat, UserPlus, Gem, AlertTriangle, Wallet, Cake, ShoppingBag } from 'lucide-react'
import { getCustomersOverview } from '../../../api/reportService'
import PeriodPicker from '../../Expenses/components/PeriodPicker'
import ReportTable from '../components/ReportTable'
import { HeroStat, MiniStat, ChartCard, TrendArea, PALETTE } from '../../../components/charts/Charts'
import { useOverview, money, dmy, useLabels, Spinner, ErrorBox, RankList, Chips } from './ovKit'

const RISK = { high: 'bg-accent-red/10 text-accent-red', medium: 'bg-accent-orange/10 text-accent-orange', low: 'bg-accent-blue/10 text-accent-blue' }

// Mijozlar tahlili — server hisoblaydi (LTV, qaytish, xavf, sodiqlik darajalari)
const CustomersOverview = () => {
  const { t } = useTranslation()
  const L = useLabels()
  const { preset, range, setPeriod, data, error } = useOverview(getCustomersOverview)
  const [view, setView] = useState('all')
  const k = data?.kpis
  const monthly = useMemo(() => (data?.monthly || []).map(m => ({ label: L.monthShort(m.key), newCustomers: m.newCustomers, returning: m.returning })), [data])
  const rows = data?.rows || []
  const shown = rows.filter(r => view === 'all' ? true : view === 'active' ? r.curVisits > 0 : view === 'new' ? r.isNew : view === 'risk' ? (r.risk === 'high' || r.risk === 'medium') : view === 'debt' ? r.debt > 0 : true)

  if (!data) return <div className="space-y-4"><PeriodPicker preset={preset} range={range} onChange={setPeriod} /><ErrorBox error={error} />{!error && <Spinner />}</div>

  const tierName = (lvl) => (lvl ? t('ov_tier_n', { n: lvl, p: data.tiers[lvl - 1]?.percent ?? 0 }) : '—')
  const cols = [
    { key: 'name', label: t('ov_col_customer'), className: 'font-medium' },
    { key: 'phone', label: t('ov_col_phone') },
    { key: 'visits', label: t('ov_col_visits'), align: 'right' },
    { key: 'spent', label: t('ov_col_spent'), align: 'right', sum: true, render: r => money(r.spent), renderTotal: money },
    { optional: true, key: 'avgCheck', label: t('ov_avg_check'), align: 'right', render: r => money(r.avgCheck) },
    { optional: true, key: 'tier', label: t('ov_col_tier'), render: r => tierName(r.tier), value: r => r.tier },
    { key: 'last', label: t('ov_col_last_visit'), value: r => r.last || '', render: r => (r.last ? `${dmy(r.last)} · ${t('ov_days_ago', { n: r.sinceLast })}` : '—') },
    { optional: true, key: 'nextVisit', label: t('ov_col_next_visit'), render: r => dmy(r.nextVisit) },
    { key: 'risk', label: t('ov_col_risk'), value: r => ({ high: 3, medium: 2, low: 1 }[r.risk] || 0),
      render: r => (r.risk ? <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${RISK[r.risk]}`}>{t('ov_risk_' + r.risk)}</span> : '—') },
    { optional: true, key: 'ltv12m', label: 'LTV 12m', align: 'right', render: r => money(r.ltv12m) },
    { optional: true, key: 'curSpent', label: t('ov_col_spent_period'), align: 'right', sum: true, render: r => money(r.curSpent), renderTotal: money },
    { key: 'debt', label: t('ov_col_debt'), align: 'right', sum: true, render: r => (r.debt ? <span className="text-accent-red">{money(r.debt)}</span> : '—'), renderTotal: money },
  ]

  return (
    <div className="space-y-4 sm:space-y-5">
      <PeriodPicker preset={preset} range={range} onChange={setPeriod} />
      <ErrorBox error={error} />
      {data.birthdays.length > 0 && (
        <div className="panel p-4 flex flex-wrap items-center gap-2">
          <Cake size={18} className="text-pink-400" />
          <span className="text-sm font-semibold text-text-primary">{t('ov_birthdays_month', { n: data.birthdays.length })}</span>
          <span className="text-sm text-text-secondary truncate">{data.birthdays.slice(0, 8).map(b => `${b.name} (${b.birth.slice(8, 10)}.${b.birth.slice(5, 7)})`).join(', ')}</span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <HeroStat gradient="pink" icon={Users} label={t('ov_buyers')} value={money(k.buyers)} sub={t('ov_customers_total', { n: k.total })} />
        <HeroStat gradient="violet" icon={Repeat} label={t('ov_retention')} value={`${k.retention}%`} sub={t('ov_new_ret_n', { a: k.newInPeriod, b: k.returningInPeriod })} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <MiniStat icon={ShoppingBag} tone="cyan" label={t('ov_active_period')} value={k.activeInPeriod} onClick={() => setView(v => v === 'active' ? 'all' : 'active')} active={view === 'active'} />
        <MiniStat icon={UserPlus} tone="green" label={t('ov_new_period')} value={k.newInPeriod} onClick={() => setView(v => v === 'new' ? 'all' : 'new')} active={view === 'new'} />
        <MiniStat icon={AlertTriangle} tone="orange" label={t('ov_at_risk')} value={k.atRisk} onClick={() => setView(v => v === 'risk' ? 'all' : 'risk')} active={view === 'risk'} />
        <MiniStat icon={Wallet} tone="red" label={t('ov_col_debt')} value={money(k.debt)} onClick={() => setView(v => v === 'debt' ? 'all' : 'debt')} active={view === 'debt'} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <ChartCard title={t('ov_new_vs_returning')}>
          <TrendArea data={monthly} series={[{ key: 'newCustomers', label: t('ov_new'), color: PALETTE[5] }, { key: 'returning', label: t('ov_returning'), color: PALETTE[1], dashed: true }]} height={240} valueFormatter={v => v} yFormatter={v => v} />
        </ChartCard>
        <ChartCard title={t('ov_sources_title')}>
          <RankList rows={(data.sources || []).map(s => ({ label: L.source(s.key), value: s.revenue, count: s.count, customers: s.customers }))} sub={r => t('ov_n_sales', { n: r.count })} />
        </ChartCard>
      </div>
      {data.tiers.length > 0 && (
        <ChartCard title={t('ov_tiers_title')} right={<span className="text-sm text-text-muted">{t('ov_avg_ltv')}: {money(k.avgLtv)}</span>}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="panel p-3"><p className="text-sm text-text-muted">{t('ov_tier_none')}</p><p className="text-xl font-bold">{rows.filter(r => !r.tier).length}</p></div>
            {data.tiers.map(tr => (
              <div key={tr.level} className="panel p-3 flex items-start gap-2"><Gem size={16} className="text-accent-blue mt-1" />
                <div><p className="text-sm text-text-muted">{tierName(tr.level)} · {money(tr.minAmount)}+</p><p className="text-xl font-bold">{tr.count}</p></div></div>
            ))}
          </div>
        </ChartCard>
      )}
      <Chips value={view} onChange={setView} items={[
        { id: 'all', label: t('filter_all'), count: rows.length }, { id: 'active', label: t('ov_active_period') }, { id: 'new', label: t('ov_new') },
        { id: 'risk', label: t('ov_at_risk') }, { id: 'debt', label: t('ov_col_debt') },
      ]} />
      <ReportTable title={t('ov_customers_list')} fileName={`mijozlar_${range.from}_${range.to}`} columns={cols} rows={shown}
        searchKeys={['name', 'phone', 'instagram']} initialSort={{ key: 'spent', dir: 'desc' }} tableId="ov_customers" />
    </div>
  )
}

export default CustomersOverview
