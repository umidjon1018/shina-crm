import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, Wallet, Banknote, Receipt, Scale, Percent, Recycle, Building2 } from 'lucide-react'
import { getProfitOverview } from '../../../api/reportService'
import PeriodPicker from '../../Expenses/components/PeriodPicker'
import ReportTable from '../components/ReportTable'
import { HeroStat, MiniStat, ChartCard, TrendArea, DonutChart, PALETTE } from '../../../components/charts/Charts'
import { useOverview, money, delta, useLabels, Spinner, ErrorBox } from './ovKit'

// Foyda hisoboti — Moliya → Foyda va zarar bilan bir xil formula (server): kanallar, xarajatlar, 12 oy dinamikasi
const ProfitOverview = () => {
  const { t, i18n } = useTranslation()
  const L = useLabels()
  const { preset, range, setPeriod, data, error } = useOverview(getProfitOverview)
  const k = data?.kpis, pv = data?.prev
  const monthly = useMemo(() => (data?.monthly || []).map(m => ({ ...m, label: L.monthShort(m.key) })), [data])

  if (!data) return <div className="space-y-4"><PeriodPicker preset={preset} range={range} onChange={setPeriod} /><ErrorBox error={error} />{!error && <Spinner />}</div>

  const coverage = k.expenses > 0 ? Math.round((k.gross - k.commission - k.cashback) / k.expenses * 100) : null
  const cols = [
    { key: 'key', label: t('ov_col_month'), render: r => L.month(r.key) },
    { key: 'revenue', label: t('ov_revenue'), align: 'right', sum: true, render: r => money(r.revenue), renderTotal: money },
    { optional: true, key: 'retailProfit', label: t('ov_ch_retail'), align: 'right', sum: true, render: r => money(r.retailProfit), renderTotal: money },
    { optional: true, key: 'usedProfit', label: t('ov_ch_used'), align: 'right', sum: true, render: r => money(r.usedProfit), renderTotal: money },
    { optional: true, key: 'wholesaleProfit', label: t('ov_ch_wholesale'), align: 'right', sum: true, render: r => money(r.wholesaleProfit), renderTotal: money },
    { key: 'gross', label: t('ov_gross'), align: 'right', sum: true, render: r => money(r.gross), renderTotal: money },
    { key: 'expenses', label: t('ov_expenses'), align: 'right', sum: true, render: r => money(r.expenses), renderTotal: money },
    { optional: true, key: 'fixed', label: t('ov_fixed'), align: 'right', sum: true, render: r => money(r.fixed), renderTotal: money },
    { key: 'net', label: t('ov_net'), align: 'right', sum: true, render: r => <span className={r.net >= 0 ? 'text-accent-green font-semibold' : 'text-accent-red font-semibold'}>{money(r.net)}</span>, renderTotal: money },
    { optional: true, key: 'margin', label: t('ov_margin'), align: 'right', render: r => `${r.margin}%` },
  ]
  const chan = [
    { id: 'retail', icon: Banknote, tone: 'cyan', rev: k.retail, profit: k.retailProfit },
    { id: 'used', icon: Recycle, tone: 'green', rev: k.used, profit: k.usedProfit },
    { id: 'wholesale', icon: Building2, tone: 'violet', rev: k.wholesale, profit: k.wholesaleProfit },
  ].filter(c => c.rev || c.profit)

  return (
    <div className="space-y-4 sm:space-y-5">
      <PeriodPicker preset={preset} range={range} onChange={setPeriod} />
      <ErrorBox error={error} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <HeroStat gradient="green" icon={TrendingUp} label={t('ov_net')} value={money(k.net)} unit={t('unit_som')} trend={delta(k.net, pv.net)} sub={t('ov_margin_n', { n: k.margin })} />
        <HeroStat gradient="violet" icon={Wallet} label={t('ov_gross')} value={money(k.gross)} unit={t('unit_som')} trend={delta(k.gross, pv.gross)} sub={t('ov_prev_period', { v: money(pv.gross) })} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <MiniStat icon={Banknote} tone="cyan" label={t('ov_revenue')} value={money(k.revenue)} delta={delta(k.revenue, pv.revenue)} />
        <MiniStat icon={Receipt} tone="red" label={t('ov_expenses')} value={money(k.expenses)} delta={delta(k.expenses, pv.expenses)} invert />
        <MiniStat icon={Percent} tone="orange" label={t('ov_comm_cashback')} value={money(k.commission + k.cashback)} invert />
        <MiniStat icon={Scale} tone={coverage == null || coverage >= 100 ? 'green' : 'red'} label={t('ov_break_even')} value={coverage == null ? '—' : `${coverage}%`} />
      </div>
      {chan.length > 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {chan.map(c => <MiniStat key={c.id} icon={c.icon} tone={c.tone} label={t('ov_ch_' + c.id)} value={`${money(c.rev)} · ${money(c.profit)}`} />)}
        </div>
      )}
      <ChartCard title={t('ov_profit_dynamics')} subtitle={t('ov_12_months')}>
        <TrendArea data={monthly} series={[
          { key: 'revenue', label: t('ov_revenue'), color: PALETTE[0] }, { key: 'gross', label: t('ov_gross'), color: PALETTE[1], dashed: true },
          { key: 'net', label: t('ov_net'), color: PALETTE[5] }, { key: 'expenses', label: t('ov_expenses'), color: PALETTE[6], dashed: true },
        ]} height={280} />
      </ChartCard>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <ChartCard title={t('ov_expense_structure')} subtitle={`${t('ov_fixed')}: ${money(k.fixed)} · ${t('ov_variable')}: ${money(k.variable)}`}>
          <DonutChart data={(data.expenses || []).map(e => ({ name: (i18n.language === 'ru' && e.labelRu) || e.label || e.categoryId || '—', value: e.total }))} centerLabel={t('ov_expenses')} />
        </ChartCard>
        <ChartCard title={t('ov_fixed_variable')}>
          <TrendArea data={monthly} series={[{ key: 'fixed', label: t('ov_fixed'), color: PALETTE[3] }, { key: 'variable', label: t('ov_variable'), color: PALETTE[4], dashed: true }]} height={240} />
        </ChartCard>
      </div>
      <ReportTable title={t('ov_monthly_table')} fileName={`foyda_12oy_${range.to}`} columns={cols} rows={[...monthly].reverse()} tableId="ov_profit_months" />
    </div>
  )
}

export default ProfitOverview
