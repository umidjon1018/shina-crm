import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Banknote, ShoppingCart, Receipt, Package, Percent, XCircle, CreditCard, UserPlus, Target, TrendingUp } from 'lucide-react'
import { getSalesOverview } from '../../../api/reportService'
import PeriodPicker from '../../Expenses/components/PeriodPicker'
import ReportTable from '../components/ReportTable'
import { HeroStat, MiniStat, ChartCard, TrendArea, GradientBars, DonutChart, PALETTE } from '../../../components/charts/Charts'
import { useSettingsStore } from '../../../store/settingsStore'
import { useOverview, money, delta, dmy, useLabels, Spinner, ErrorBox, LegacyLink, RankList } from './ovKit'

const WD = [1, 2, 3, 4, 5, 6, 7]

// Savdo hisoboti — server hisoblaydi (davr va oldingi teng davr bilan solishtirma)
const SalesOverview = ({ onLegacy }) => {
  const { t } = useTranslation()
  const L = useLabels()
  const { preset, range, setPeriod, data, error } = useOverview(getSalesOverview)
  const targets = useSettingsStore(s => s.monthlyTargets) || {}
  const sp = data?.showProfit
  const k = data?.kpis, pv = data?.prev

  const daily = useMemo(() => (data?.daily || []).map(d => ({ label: d.key.slice(8, 10) + '.' + d.key.slice(5, 7), revenue: d.revenue, profit: d.profit })), [data])
  const monthly = useMemo(() => (data?.monthly || []).map(d => ({ label: L.monthShort(d.key), value: d.revenue })), [data])
  const hours = useMemo(() => {
    const m = new Map((data?.hours || []).map(h => [h.key, h.count]))
    const a = Math.min(8, ...m.keys()), b = Math.max(21, ...m.keys())
    return Array.from({ length: b - a + 1 }, (_, i) => i + a).map(h => ({ label: String(h), value: m.get(h) || 0 }))
  }, [data])
  const wdays = useMemo(() => {
    const m = new Map((data?.weekdays || []).map(h => [h.key, h.revenue]))
    return WD.map(d => ({ label: t('ov_wd_' + d), value: m.get(d) || 0 }))
  }, [data])
  const monthKey = range.to.slice(0, 7)
  const target = Number(targets[monthKey]) || 0
  const monthRev = (data?.monthly || []).find(m => m.key === monthKey)?.revenue || 0

  if (!data) return <div className="space-y-4"><PeriodPicker preset={preset} range={range} onChange={setPeriod} /><ErrorBox error={error} />{!error && <Spinner />}</div>

  const cols = [
    { key: 'at', label: t('ov_col_date'), render: r => <span className="whitespace-nowrap">{dmy(r.at)}</span> },
    { key: 'customer', label: t('ov_col_customer'), render: r => r.customer || <span className="text-text-muted">{t('ov_anon')}</span> },
    { key: 'items', label: t('ov_col_items'), render: r => <span className="block max-w-[260px] truncate" title={r.items}>{r.items}</span> },
    { optional: true, key: 'seller', label: t('ov_col_seller') },
    { optional: true, key: 'payment', label: t('ov_col_payment'), render: r => L.pay(r.payment), value: r => L.pay(r.payment) },
    { optional: true, key: 'source', label: t('ov_col_source'), render: r => L.source(r.source), value: r => L.source(r.source) },
    { key: 'status', label: t('ov_col_status'), value: r => r.status, render: r => r.status === 'cancelled'
      ? <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-accent-red/10 text-accent-red">{r.exchange ? t('rep_almashtirilgan') : t('ov_cancelled')}</span>
      : r.status === 'active' ? <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-accent-orange/10 text-accent-orange">{t('pay_installment')}</span>
      : <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-accent-green/10 text-accent-green">{t('ov_done')}</span> },
    { optional: true, key: 'discountAmount', label: t('ov_col_discount'), align: 'right', render: r => (r.discountAmount ? `−${money(r.discountAmount)}${r.discount ? ` (${r.discount}%)` : ''}` : '—') },
    { key: 'total', label: t('ov_col_total'), align: 'right', sum: true, render: r => money(r.total), renderTotal: money },
    ...(sp ? [{ key: 'profit', label: t('ov_col_profit'), align: 'right', sum: true, render: r => <span className={r.profit >= 0 ? 'text-accent-green' : 'text-accent-red'}>{money(r.profit)}</span>, renderTotal: money }] : []),
  ]
  const topCols = [
    { key: 'name', label: t('ov_col_product'), className: 'font-medium' },
    { key: 'category', label: t('ov_col_category'), render: r => L.cat(r.category), value: r => L.cat(r.category) },
    { key: 'qty', label: t('ov_col_qty'), align: 'right', render: r => `${r.qty}${r.unit ? ' ' + r.unit : ''}` },
    { key: 'revenue', label: t('ov_col_revenue'), align: 'right', render: r => money(r.revenue) },
    ...(sp ? [{ key: 'profit', label: t('ov_col_profit'), align: 'right', render: r => money(r.profit) }] : []),
  ]

  return (
    <div className="space-y-4 sm:space-y-5">
      <PeriodPicker preset={preset} range={range} onChange={setPeriod} />
      <ErrorBox error={error} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <HeroStat gradient="violet" icon={Banknote} label={t('ov_revenue')} value={money(k.revenue)} unit={t('unit_som')}
          trend={delta(k.revenue, pv.revenue)} sub={t('ov_prev_period', { v: money(pv.revenue) })} />
        {sp
          ? <HeroStat gradient="green" icon={TrendingUp} label={t('ov_profit')} value={money(k.profit)} unit={t('unit_som')}
              trend={delta(k.profit, pv.profit)} sub={t('ov_margin_n', { n: k.revenue ? Math.round(k.profit / k.revenue * 1000) / 10 : 0 })} />
          : <HeroStat gradient="cyan" icon={ShoppingCart} label={t('ov_sales_count')} value={k.count} trend={delta(k.count, pv.count)} />}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <MiniStat icon={ShoppingCart} tone="cyan" label={t('ov_sales_count')} value={k.count} delta={delta(k.count, pv.count)} />
        <MiniStat icon={Receipt} tone="violet" label={t('ov_avg_check')} value={money(k.avgCheck)} delta={delta(k.avgCheck, pv.avgCheck)} />
        <MiniStat icon={Package} tone="blue" label={t('ov_items_sold')} value={money(k.qty)} delta={delta(k.qty, pv.qty)} />
        <MiniStat icon={Percent} tone="orange" label={t('ov_discounts')} value={money(k.discount)} delta={delta(k.discount, pv.discount)} invert />
        <MiniStat icon={XCircle} tone="red" label={t('ov_cancelled_ex')} value={`${k.cancelled} · ${k.exchanged}`} />
        <MiniStat icon={CreditCard} tone="pink" label={t('ov_installment_debt')} value={`${money(k.installment.debt)} · ${k.installment.count}`} />
        <MiniStat icon={UserPlus} tone="green" label={t('ov_new_returning')} value={`${k.newCustomers} · ${k.returningCustomers}`} />
        {target > 0
          ? <MiniStat icon={Target} tone={monthRev >= target ? 'green' : 'orange'} label={t('ov_month_target', { m: L.month(monthKey) })}
              value={`${Math.min(999, Math.round(monthRev / target * 100))}% · ${money(target)}`} />
          : <MiniStat icon={Target} tone="blue" label={t('ov_anonymous')} value={k.anonymous} />}
      </div>

      <ChartCard title={t('ov_daily_title')} subtitle={`${dmy(range.from)} — ${dmy(range.to)}`}>
        <TrendArea data={daily} series={[{ key: 'revenue', label: t('ov_revenue'), color: PALETTE[0] }, ...(sp ? [{ key: 'profit', label: t('ov_profit'), color: PALETTE[5], dashed: true }] : [])]} />
      </ChartCard>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <ChartCard title={t('ov_monthly_title')}><GradientBars data={monthly} name={t('ov_revenue')} /></ChartCard>
        <ChartCard title={t('ov_payments_title')}>
          <DonutChart data={(data.payments || []).map(p => ({ name: `${L.pay(p.key)} · ${p.count}`, value: p.revenue }))} centerLabel={t('ov_revenue')} />
        </ChartCard>
        <ChartCard title={t('ov_categories_title')}>
          <DonutChart data={(data.categories || []).map(c => ({ name: L.cat(c.key), value: c.revenue }))} centerLabel={t('ov_revenue')} />
        </ChartCard>
        <ChartCard title={t('ov_sources_title')}>
          <RankList rows={(data.sources || []).map(s => ({ label: L.source(s.key), value: s.revenue, count: s.count }))} sub={r => t('ov_n_sales', { n: r.count })} />
        </ChartCard>
        <ChartCard title={t('ov_hours_title')} subtitle={t('ov_hours_sub')}><GradientBars data={hours} name={t('ov_sales_count')} colors={['#F062C0', '#A86BFF']} /></ChartCard>
        <ChartCard title={t('ov_weekdays_title')}><GradientBars data={wdays} name={t('ov_revenue')} colors={['#4F8CFF', '#2BD4F0']} /></ChartCard>
      </div>
      {(data.cancelReasons || []).length > 0 && (
        <ChartCard title={t('ov_cancel_title')}>
          <RankList rows={data.cancelReasons.map(c => ({ label: L.reason(c.key), value: c.count, amount: c.amount }))} fmt={v => v} sub={r => money(r.amount)} />
        </ChartCard>
      )}
      <ReportTable title={t('ov_top_products')} fileName={`top_tovarlar_${range.from}_${range.to}`} columns={topCols} rows={data.topProducts || []} />
      <ReportTable title={t('ov_sales_list')} fileName={`sotuvlar_${range.from}_${range.to}`} columns={cols} rows={data.list || []}
        searchKeys={['customer', 'items', 'seller', 'id']} tableId="ov_sales_list" />
      <LegacyLink onClick={onLegacy} />
    </div>
  )
}

export default SalesOverview
