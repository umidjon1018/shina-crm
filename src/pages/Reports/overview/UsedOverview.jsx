import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Recycle, TrendingUp, ShoppingCart, PackagePlus, Warehouse, Trash2, CreditCard, Percent } from 'lucide-react'
import { getUsedOverview } from '../../../api/reportService'
import PeriodPicker from '../../Expenses/components/PeriodPicker'
import ReportTable from '../components/ReportTable'
import { HeroStat, MiniStat, ChartCard, TrendArea, GradientBars, PALETTE } from '../../../components/charts/Charts'
import { useOverview, money, delta, dmy, useLabels, Spinner, ErrorBox, LegacyLink } from './ovKit'

// B/U (ishlatilgan tovar) hisoboti — server hisoblaydi
const UsedOverview = ({ onLegacy }) => {
  const { t } = useTranslation()
  const L = useLabels()
  const { preset, range, setPeriod, data, error } = useOverview(getUsedOverview)
  const sp = data?.showProfit
  const k = data?.kpis, pv = data?.prev
  const monthly = useMemo(() => (data?.monthly || []).map(m => ({ label: L.monthShort(m.key), revenue: m.revenue, profit: m.profit })), [data])

  if (!data) return <div className="space-y-4"><PeriodPicker preset={preset} range={range} onChange={setPeriod} /><ErrorBox error={error} />{!error && <Spinner />}</div>

  const listCols = [
    { key: 'at', label: t('ov_col_date'), render: r => <span className="whitespace-nowrap">{dmy(r.at)}</span> },
    { key: 'customer', label: t('ov_col_customer') },
    { key: 'items', label: t('ov_col_items'), render: r => <span className="block max-w-[240px] truncate" title={r.items}>{r.items}</span> },
    { optional: true, key: 'payment', label: t('ov_col_payment'), render: r => L.pay(r.payment), value: r => L.pay(r.payment) },
    { optional: true, key: 'seller', label: t('ov_col_seller') },
    { key: 'status', label: t('ov_col_status'), render: r => r.status === 'cancelled'
      ? <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-accent-red/10 text-accent-red">{t('ov_cancelled')}</span>
      : r.scrap ? <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-bg-tertiary text-text-muted">{t('ov_scrap')}</span>
      : r.debt > 0 ? <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-accent-orange/10 text-accent-orange">{t('pay_installment')} · {money(r.debt)}</span>
      : <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-accent-green/10 text-accent-green">{t('ov_done')}</span> },
    { key: 'total', label: t('ov_col_total'), align: 'right', sum: true, render: r => money(r.total), renderTotal: money },
    ...(sp ? [{ key: 'profit', label: t('ov_col_profit'), align: 'right', sum: true, render: r => <span className={r.profit >= 0 ? 'text-accent-green' : 'text-accent-red'}>{money(r.profit)}</span>, renderTotal: money }] : []),
  ]
  const stockCols = [
    { key: 'acquired', label: t('ov_col_acquired'), render: r => dmy(r.acquired) },
    { key: 'name', label: t('ov_col_product'), className: 'font-medium' },
    { key: 'category', label: t('ov_col_category'), render: r => r.categoryLabel || L.cat(r.category), value: r => r.categoryLabel || L.cat(r.category) },
    { optional: true, key: 'fromCustomer', label: t('ov_col_from_customer') },
    { optional: true, key: 'employee', label: t('ov_col_employee') },
    ...(sp ? [{ key: 'price', label: t('ov_col_cost'), align: 'right', sum: true, render: r => money(r.price), renderTotal: money }] : []),
  ]

  return (
    <div className="space-y-4 sm:space-y-5">
      <PeriodPicker preset={preset} range={range} onChange={setPeriod} />
      <ErrorBox error={error} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <HeroStat gradient="green" icon={Recycle} label={t('ov_used_revenue')} value={money(k.revenue)} unit={t('unit_som')}
          trend={delta(k.revenue, pv.revenue)} sub={t('ov_n_sales', { n: k.count })} />
        {sp
          ? <HeroStat gradient="violet" icon={TrendingUp} label={t('ov_profit')} value={money(k.profit)} unit={t('unit_som')} trend={delta(k.profit, pv.profit)}
              sub={t('ov_margin_n', { n: k.revenue ? Math.round(k.profit / k.revenue * 1000) / 10 : 0 })} />
          : <HeroStat gradient="cyan" icon={ShoppingCart} label={t('ov_sales_count')} value={k.count} trend={delta(k.count, pv.count)} />}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <MiniStat icon={PackagePlus} tone="blue" label={t('ov_used_acquired')} value={`${k.acquiredCount} · ${money(k.acquiredValue)}`} />
        <MiniStat icon={Warehouse} tone="cyan" label={t('ov_used_in_stock')} value={`${k.inStockCount} · ${money(k.inStockValue)}`} />
        <MiniStat icon={Trash2} tone="red" label={t('ov_used_scrapped')} value={`${k.scrappedCount} · ${money(k.scrappedGot)}`} />
        <MiniStat icon={CreditCard} tone="orange" label={t('ov_installment_debt')} value={`${money(k.installmentDebt)} · ${k.installmentCount}`} />
        {sp && <MiniStat icon={Percent} tone="violet" label={t('ov_margin')} value={`${k.revenue ? Math.round(k.profit / k.revenue * 1000) / 10 : 0}%`} />}
        {k.scrapCount > 0 && <MiniStat icon={Recycle} tone="pink" label={t('ov_scrap_sales')} value={`${k.scrapCount} · ${money(k.scrapRevenue)}`} />}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <ChartCard title={t('ov_categories_title')}>
          <GradientBars data={(data.categories || []).map(c => ({ label: c.label || L.cat(c.key), value: c.revenue }))} name={t('ov_revenue')} colors={['#2ED47A', '#1E9BD7']} />
        </ChartCard>
        <ChartCard title={t('ov_monthly_title')}>
          <TrendArea data={monthly} series={[{ key: 'revenue', label: t('ov_revenue'), color: PALETTE[5] }, ...(sp ? [{ key: 'profit', label: t('ov_profit'), color: PALETTE[1], dashed: true }] : [])]} height={240} />
        </ChartCard>
      </div>
      <ReportTable title={t('ov_used_sales_list')} fileName={`bu_sotuvlar_${range.from}_${range.to}`} columns={listCols} rows={data.list || []} searchKeys={['customer', 'items', 'seller']} tableId="ov_used_list" />
      <ReportTable title={t('ov_used_stock_list')} fileName="bu_qoldiq" columns={stockCols} rows={data.stock || []} searchKeys={['name', 'fromCustomer']} tableId="ov_used_stock" />
      <LegacyLink onClick={onLegacy} />
    </div>
  )
}

export default UsedOverview
