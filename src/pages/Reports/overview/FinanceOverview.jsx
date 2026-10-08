import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Truck, CreditCard, Landmark, ArrowDownCircle, ArrowUpCircle, AlertTriangle, ArrowRight, Wallet } from 'lucide-react'
import { getFinanceOverview } from '../../../api/reportService'
import PeriodPicker from '../../Expenses/components/PeriodPicker'
import ReportTable from '../components/ReportTable'
import { HeroStat, MiniStat, ChartCard, TrendArea, PALETTE } from '../../../components/charts/Charts'
import { useOverview, money, dmy, useLabels, Spinner, ErrorBox } from './ovKit'

const DST = { overdue: 'bg-accent-red/10 text-accent-red', soon: 'bg-accent-orange/10 text-accent-orange', ok: 'bg-accent-green/10 text-accent-green', none: 'bg-bg-tertiary text-text-muted' }
const usd = (v) => '$' + (Math.round((Number(v) || 0) * 100) / 100).toLocaleString('en-US')

// Moliya hisoboti — server: yetkazib beruvchi qarzi, nasiya tashkilotlari, kapital, pul oqimi
const FinanceOverview = () => {
  const { t } = useTranslation()
  const L = useLabels()
  const navigate = useNavigate()
  const { preset, range, setPeriod, data, error } = useOverview(getFinanceOverview)
  const flow = useMemo(() => (data?.cashflow || []).map(m => ({ ...m, label: L.monthShort(m.key) })), [data])

  if (!data) return <div className="space-y-4"><PeriodPicker preset={preset} range={range} onChange={setPeriod} /><ErrorBox error={error} />{!error && <Spinner />}</div>

  const st = data.supplierTotals
  const receivable = data.installmentOrgs.reduce((s, o) => s + o.debt, 0) + data.usedInstallment.debt
  const debtCols = [
    { key: 'supplier', label: t('ov_col_supplier'), className: 'font-medium' },
    { key: 'product', label: t('ov_col_product') },
    { optional: true, key: 'received', label: t('ov_col_received'), render: r => dmy(r.received) },
    { optional: true, key: 'total', label: t('ov_col_total'), align: 'right', render: r => usd(r.total) },
    { optional: true, key: 'paid', label: t('ov_col_paid'), align: 'right', render: r => usd(r.paid) },
    { key: 'debt', label: t('ov_col_debt'), align: 'right', sum: true, render: r => usd(r.debt), renderTotal: usd },
    { key: 'due', label: t('ov_col_due'), value: r => r.due || '9999', render: r => dmy(r.due) },
    { key: 'status', label: t('ov_col_status'), render: r => <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${DST[r.status]}`}>{t('ov_due_' + r.status)}</span> },
  ]
  const orgCols = [
    { key: 'org', label: t('ov_col_org'), className: 'font-medium' },
    { key: 'count', label: t('ov_sales_count'), align: 'right', sum: true },
    { key: 'total', label: t('ov_col_total'), align: 'right', sum: true, render: r => money(r.total), renderTotal: money },
    { key: 'paid', label: t('ov_col_paid'), align: 'right', sum: true, render: r => money(r.paid), renderTotal: money },
    { key: 'debt', label: t('ov_col_debt'), align: 'right', sum: true, render: r => money(r.debt), renderTotal: money },
    { optional: true, key: 'commission', label: t('ov_col_commission'), align: 'right', sum: true, render: r => money(r.commission), renderTotal: money },
    { key: 'overdue', label: t('ov_col_overdue_n'), align: 'right', render: r => (r.overdue ? <span className="text-accent-red font-bold">{r.overdue}</span> : '—') },
  ]
  const flowCols = [
    { key: 'key', label: t('ov_col_month'), render: r => L.month(r.key) },
    { key: 'cashIn', label: t('ov_cash_in'), align: 'right', sum: true, render: r => money(r.cashIn), renderTotal: money },
    { key: 'supplier', label: t('ov_supplier_pay'), align: 'right', sum: true, render: r => money(r.supplier), renderTotal: money },
    { key: 'expenses', label: t('ov_expenses'), align: 'right', sum: true, render: r => money(r.expenses), renderTotal: money },
    { key: 'operating', label: t('ov_operating'), align: 'right', sum: true, render: r => money(r.operating), renderTotal: money },
    { optional: true, key: 'capital', label: t('ov_capital_move'), align: 'right', sum: true, render: r => money(r.capital), renderTotal: money },
    { key: 'net', label: t('ov_net_flow'), align: 'right', sum: true, render: r => <span className={r.net >= 0 ? 'text-accent-green' : 'text-accent-red'}>{money(r.net)}</span>, renderTotal: money },
  ]
  const capCols = [
    { key: 'date', label: t('ov_col_date'), render: r => dmy(r.date) },
    { key: 'type', label: t('ov_col_type'), render: r => (r.type === 'inject' ? t('exp_cap_inject') : t('exp_cap_return')) },
    { key: 'source', label: t('ov_col_source') },
    { optional: true, key: 'note', label: t('col_note') },
    { key: 'amount', label: t('ov_col_total'), align: 'right', render: r => <span className={r.type === 'inject' ? 'text-accent-green' : 'text-accent-red'}>{r.type === 'inject' ? '+' : '−'}{money(r.amount)}</span> },
    { key: 'running', label: t('ov_col_running'), align: 'right', render: r => money(r.running) },
  ]

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PeriodPicker preset={preset} range={range} onChange={setPeriod} />
        <button type="button" onClick={() => navigate('/expenses')} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-bg-tertiary">
          <Wallet size={16} /> {t('ov_open_finance')} <ArrowRight size={15} />
        </button>
      </div>
      <ErrorBox error={error} />
      {st.overdueCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-accent-red/10 text-accent-red text-sm font-semibold">
          <AlertTriangle size={17} /> {t('ov_overdue_banner', { n: st.overdueCount, v: usd(st.overdue) })}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <HeroStat gradient="orange" icon={Truck} label={t('ov_supplier_debt')} value={usd(st.debt)} sub={t('ov_soon_n', { n: st.soonCount })} />
        <HeroStat gradient="blue" icon={CreditCard} label={t('ov_receivable')} value={money(receivable)} unit={t('unit_som')}
          sub={data.usedInstallment.debt ? t('ov_incl_used', { v: money(data.usedInstallment.debt) }) : ''} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MiniStat icon={ArrowDownCircle} tone="green" label={t('ov_capital_in')} value={money(data.capital.injected)} />
        <MiniStat icon={ArrowUpCircle} tone="red" label={t('ov_capital_out')} value={money(data.capital.returned)} />
        <MiniStat icon={Landmark} tone="violet" label={t('ov_capital_net')} value={money(data.capital.net)} />
      </div>
      <ChartCard title={t('ov_cashflow')} subtitle={t('ov_cashflow_sub')}>
        <TrendArea data={flow} series={[{ key: 'cashIn', label: t('ov_cash_in'), color: PALETTE[0] }, { key: 'operating', label: t('ov_operating'), color: PALETTE[5], dashed: true }, { key: 'net', label: t('ov_net_flow'), color: PALETTE[1] }]} height={260} />
      </ChartCard>
      <ReportTable title={t('ov_cashflow')} fileName={`pul_oqimi_${range.to}`} columns={flowCols} rows={[...flow].reverse()} tableId="ov_fin_flow" />
      {data.installmentOrgs.length > 0 && <ReportTable title={t('ov_inst_orgs')} fileName="nasiya_tashkilotlar" columns={orgCols} rows={data.installmentOrgs} tableId="ov_fin_orgs" />}
      {data.supplierDebts.length > 0 && <ReportTable title={t('ov_supplier_debts')} fileName="yetkazib_beruvchi_qarzi" columns={debtCols} rows={data.supplierDebts} searchKeys={['supplier', 'product']} tableId="ov_fin_debts" />}
      {data.capital.list.length > 0 && <ReportTable title={t('ov_capital_moves')} fileName="kapital" columns={capCols} rows={data.capital.list} tableId="ov_fin_cap" />}
    </div>
  )
}

export default FinanceOverview
