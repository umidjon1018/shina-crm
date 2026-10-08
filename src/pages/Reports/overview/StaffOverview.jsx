import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, Trophy, XCircle, Percent } from 'lucide-react'
import { getStaffOverview } from '../../../api/reportService'
import PeriodPicker from '../../Expenses/components/PeriodPicker'
import ReportTable from '../components/ReportTable'
import { HeroStat, MiniStat, ChartCard, TrendArea, GradientBars, PALETTE } from '../../../components/charts/Charts'
import { useSettingsStore } from '../../../store/settingsStore'
import { useOverview, money, delta, dmy, useLabels, Spinner, ErrorBox, LegacyLink } from './ovKit'


// Xodimlar hisoboti — server hisoblaydi (sotuv, chegirma, bekor qilish, ish soatlari, reja)
const StaffOverview = ({ onLegacy }) => {
  const { t } = useTranslation()
  const L = useLabels()
  const { preset, range, setPeriod, data, error } = useOverview(getStaffOverview)
  const employees = useSettingsStore(s => s.employees) || []
  const targets = useSettingsStore(s => s.employeeTargets) || {}
  const [pick, setPick] = useState('')
  const sp = data?.showProfit
  const monthKey = range.to.slice(0, 7)

  const rows = useMemo(() => (data?.rows || []).map(r => {
    const emp = employees.find(e => (e.name || '').trim().toLowerCase() === r.name.trim().toLowerCase())
    const target = Number(emp && targets[emp.id]?.[monthKey]) || 0
    const monthRev = r.monthly.find(m => m.key === monthKey)?.revenue || 0
    const targetPct = target > 0 ? Math.round(monthRev / target * 100) : null
    const kpi = Math.max(0, Math.min(100, Math.round((target > 0 ? monthRev / target * 60 : 0) - Math.min(30, r.cancelPct * 3) + Math.min(10, r.newCustomers * 2))))
    return { ...r, target, targetPct, kpi, role: emp?.role || '' }
  }), [data, employees, targets, monthKey])
  const sel = rows.find(r => r.name === pick) || rows[0]
  const months = useMemo(() => (sel?.monthly || []).map(m => ({ label: L.monthShort(m.key), revenue: m.revenue, profit: m.profit })), [sel])
  // Soatlar: kamida 8–21, sotuv bo'lgan kech/erta soatlar ham (do'kon 24 soat ishlashi mumkin)
  const HOURS = useMemo(() => {
    const hs = rows.flatMap(r => Object.keys(r.hours).map(Number))
    const a = Math.min(8, ...hs), b = Math.max(21, ...hs)
    return Array.from({ length: b - a + 1 }, (_, i) => i + a)
  }, [rows])

  if (!data) return <div className="space-y-4"><PeriodPicker preset={preset} range={range} onChange={setPeriod} /><ErrorBox error={error} />{!error && <Spinner />}</div>

  const top = rows[0]
  const lost = rows.reduce((s, r) => s + r.lostRevenue, 0)
  const cols = [
    { key: 'name', label: t('ov_col_employee'), className: 'font-medium' },
    { key: 'count', label: t('ov_sales_count'), align: 'right', sum: true },
    { key: 'revenue', label: t('ov_revenue'), align: 'right', sum: true, render: r => money(r.revenue), renderTotal: money },
    { optional: true, key: 'prevRevenue', label: t('ov_col_change'), align: 'right', value: r => delta(r.revenue, r.prevRevenue) ?? -999,
      render: r => { const d = delta(r.revenue, r.prevRevenue); return d == null ? '—' : <span className={d >= 0 ? 'text-accent-green' : 'text-accent-red'}>{d > 0 ? '+' : ''}{d}%</span> } },
    { key: 'avgCheck', label: t('ov_avg_check'), align: 'right', render: r => money(r.avgCheck) },
    ...(sp ? [{ key: 'profit', label: t('ov_col_profit'), align: 'right', sum: true, render: r => money(r.profit), renderTotal: money }] : []),
    { optional: true, key: 'newCustomers', label: t('ov_new_customers'), align: 'right', sum: true },
    { key: 'cancelled', label: t('ov_col_cancelled'), align: 'right', render: r => `${r.cancelled}${r.cancelPct ? ` (${r.cancelPct}%)` : ''}`, value: r => r.cancelPct },
    { optional: true, key: 'exchanged', label: t('rep_almashtirilgan'), align: 'right', sum: true },
    { optional: true, key: 'avgDiscount', label: t('ov_col_avg_discount'), align: 'right', render: r => (r.discountSales ? `${r.avgDiscount}% · ${t('ov_max')} ${r.maxDiscount}%` : '—') },
    { key: 'lostRevenue', label: t('ov_col_lost'), align: 'right', sum: true, render: r => money(r.lostRevenue), renderTotal: money },
    { optional: true, key: 'lastSale', label: t('ov_col_last_sale'), render: r => dmy(r.lastSale) },
    { key: 'targetPct', label: t('ov_col_target'), align: 'right', value: r => r.targetPct ?? -1, render: r => (r.targetPct == null ? '—' : `${r.targetPct}%`) },
    { key: 'kpi', label: 'KPI', align: 'right', render: r => (
      <span className="inline-flex items-center gap-2"><span className="w-14 h-1.5 rounded-full bg-bg-tertiary overflow-hidden inline-block">
        <span className={`block h-full ${r.kpi >= 70 ? 'bg-accent-green' : r.kpi >= 40 ? 'bg-accent-orange' : 'bg-accent-red'}`} style={{ width: `${r.kpi}%` }} /></span>{r.kpi}</span>) },
  ]
  const cancelCols = [
    { key: 'at', label: t('ov_col_date'), render: r => dmy(r.at) },
    { key: 'seller', label: t('ov_col_seller') },
    { key: 'customer', label: t('ov_col_customer'), render: r => r.customer || '—' },
    { key: 'reason', label: t('ov_col_reason'), render: r => L.reason(r.reason), value: r => L.reason(r.reason) },
    { optional: true, key: 'cancelledBy', label: t('ov_col_cancelled_by'), render: r => (r.cancelledBy && r.cancelledBy !== r.seller ? r.cancelledBy : '—') },
    { key: 'amount', label: t('ov_col_total'), align: 'right', sum: true, render: r => money(r.amount), renderTotal: money },
  ]
  const discCols = [
    { key: 'at', label: t('ov_col_date'), render: r => dmy(r.at) },
    { key: 'seller', label: t('ov_col_seller') },
    { key: 'customer', label: t('ov_col_customer'), render: r => r.customer || '—' },
    { key: 'percent', label: t('ov_col_discount'), align: 'right', render: r => (r.percent ? <span className={r.percent > 5 ? 'text-accent-red font-bold' : ''}>{r.percent}%</span> : r.bundle ? t('ov_bundle') : t('ov_promo')) },
    { optional: true, key: 'subtotal', label: t('ov_col_subtotal'), align: 'right', render: r => money(r.subtotal) },
    { key: 'lost', label: t('ov_col_lost'), align: 'right', sum: true, render: r => money(r.lost), renderTotal: money },
    { key: 'total', label: t('ov_col_total'), align: 'right', render: r => money(r.total) },
  ]

  return (
    <div className="space-y-4 sm:space-y-5">
      <PeriodPicker preset={preset} range={range} onChange={setPeriod} />
      <ErrorBox error={error} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <HeroStat gradient="cyan" icon={Trophy} label={t('ov_top_seller')} value={top ? top.name : '—'} sub={top ? `${money(top.revenue)} ${t('unit_som')} · ${t('ov_n_sales', { n: top.count })}` : ''} />
        <HeroStat gradient="violet" icon={Users} label={t('ov_active_sellers')} value={rows.filter(r => r.count > 0).length} sub={t('ov_avg_per_seller', { v: money(rows.length ? rows.reduce((s, r) => s + r.revenue, 0) / Math.max(1, rows.filter(r => r.count > 0).length) : 0) })} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <MiniStat icon={XCircle} tone="red" label={t('ov_cancelled_ex')} value={`${rows.reduce((s, r) => s + r.cancelled, 0)} · ${rows.reduce((s, r) => s + r.exchanged, 0)}`} />
        <MiniStat icon={Percent} tone="orange" label={t('ov_lost_discounts')} value={money(lost)} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <ChartCard title={t('ov_revenue_by_seller')}>
          <GradientBars horizontal data={rows.map(r => ({ label: r.name, value: r.revenue }))} name={t('ov_revenue')} height={Math.max(160, rows.length * 44)} />
        </ChartCard>
        <ChartCard title={t('ov_seller_monthly')} right={rows.length > 1 && (
          <select value={sel?.name || ''} onChange={e => setPick(e.target.value)} className="bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-sm text-text-primary">
            {rows.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
          </select>)}>
          <TrendArea data={months} series={[{ key: 'revenue', label: t('ov_revenue'), color: PALETTE[0] }, ...(sp ? [{ key: 'profit', label: t('ov_profit'), color: PALETTE[5], dashed: true }] : [])]} height={240} />
        </ChartCard>
      </div>
      <ReportTable title={t('ov_staff_rating')} fileName={`xodimlar_${range.from}_${range.to}`} columns={cols} rows={rows} tableId="ov_staff" />
      {rows.length > 0 && (
        <ChartCard title={t('ov_work_hours')} subtitle={t('ov_work_hours_sub')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr><th className="text-left py-2 pr-3 text-text-muted font-semibold">{t('ov_col_employee')}</th>
                {HOURS.map(h => <th key={h} className="px-1 py-2 text-text-muted font-semibold text-center">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map(r => {
                  const max = Math.max(1, ...Object.values(r.hours))
                  return (
                    <tr key={r.name} className="border-t border-border/50">
                      <td className="py-2 pr-3 text-text-primary whitespace-nowrap">{r.name}</td>
                      {HOURS.map(h => { const v = r.hours[h] || 0; return (
                        <td key={h} className="px-1 py-1 text-center">
                          <span className="block rounded-md py-1 text-xs font-semibold" style={{ background: v ? `rgba(168,107,255,${0.15 + v / max * 0.75})` : 'transparent', color: v ? '#fff' : 'var(--text-muted)' }}>{v || ''}</span>
                        </td>) })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </ChartCard>
      )}
      {(data.cancellations || []).length > 0 && <ReportTable title={t('ov_cancellations')} fileName={`bekorlar_${range.from}_${range.to}`} columns={cancelCols} rows={data.cancellations} searchKeys={['seller', 'customer']} tableId="ov_staff_cancel" />}
      {(data.discounts || []).length > 0 && <ReportTable title={t('ov_discount_control')} fileName={`chegirmalar_${range.from}_${range.to}`} columns={discCols} rows={data.discounts} searchKeys={['seller', 'customer']} tableId="ov_staff_disc" />}
      <LegacyLink onClick={onLegacy} />
    </div>
  )
}

export default StaffOverview
