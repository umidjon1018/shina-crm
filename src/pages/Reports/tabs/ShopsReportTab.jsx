import React, { useState, useEffect } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import { useTranslation } from 'react-i18next'
import { getShopsReport } from '../../../api/reportService'
import PeriodPicker, { presetRange } from '../../Expenses/components/PeriodPicker'
import ReportTable from '../components/ReportTable'
import { C } from '../components/shared'

const money = (v) => Math.round(Number(v) || 0).toLocaleString('uz-UZ')

const ShopsReportTab = () => {
  const { t } = useTranslation()
  const [preset, setPreset] = useState('month')
  const [range, setRange] = useState(presetRange('month'))
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setError('')
    getShopsReport(range).then(setData).catch(e => setError(e?.response?.data?.error || t('exp_err_generic')))
  }, [range.from, range.to])

  const sp = data?.showProfit
  const rows = data?.rows || []
  const cols = [
    { key: 'name', label: t('rpt_col_shop'), className: 'text-text-primary font-medium' },
    { key: 'revenue', label: t('rpt_col_revenue'), align: 'right', sum: true, render: r => money(r.revenue), renderTotal: money },
    { key: 'salesCount', label: t('rpt_col_checks'), align: 'right', sum: true },
    { key: 'avgCheck', label: t('rpt_col_avg_check'), align: 'right', render: r => money(r.avgCheck) },
    { key: 'itemsSold', label: t('rpt_col_sold_qty'), align: 'right', sum: true },
    ...(sp ? [
      { key: 'profit', label: t('rpt_col_gross_profit'), align: 'right', sum: true, render: r => money(r.profit), renderTotal: money },
      { key: 'expenses', label: t('rpt_col_expenses'), align: 'right', sum: true, render: r => money(r.expenses), renderTotal: money },
      { key: 'netProfit', label: t('rpt_col_net_profit'), align: 'right', sum: true, render: r => <span className={r.netProfit >= 0 ? 'text-accent-green font-semibold' : 'text-accent-red font-semibold'}>{money(r.netProfit)}</span>, renderTotal: money },
    ] : []),
    { key: 'returnsAmount', label: t('rpt_col_returns'), align: 'right', sum: true, render: r => money(r.returnsAmount), renderTotal: money },
    { key: 'customers', label: t('rpt_col_customers'), align: 'right' },
    { key: 'newCustomers', label: t('rpt_col_new_customers'), align: 'right', sum: true },
    { key: 'stockQty', label: t('rpt_col_stock'), align: 'right', sum: true },
    { key: 'stockRetail', label: t('rpt_col_stock_retail'), align: 'right', sum: true, render: r => money(r.stockRetail), renderTotal: money },
    { key: 'installmentDebt', label: t('rpt_col_installment_debt'), align: 'right', sum: true, render: r => money(r.installmentDebt), renderTotal: money },
  ]

  return (
    <div className="space-y-3 sm:space-y-5">
      <PeriodPicker preset={preset} range={range} onChange={(p, r) => { setPreset(p); setRange(r) }} />
      {error && <div className="text-sm text-accent-red bg-accent-red/10 px-4 py-3 rounded-xl">{error}</div>}
      {!data ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-accent-red border-t-transparent rounded-full animate-spin" /></div> : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rows.map(r => (
              <div key={r.id} className="bg-bg-secondary border border-border rounded-2xl p-4 space-y-2">
                <p className="font-syne font-bold text-text-primary">{r.name}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><p className="text-text-muted">{t('rpt_col_revenue')}</p><p className="font-bold text-text-primary text-sm">{money(r.revenue)}</p></div>
                  <div><p className="text-text-muted">{t('rpt_col_checks')}</p><p className="font-bold text-text-primary text-sm">{r.salesCount} · {money(r.avgCheck)}</p></div>
                  {sp && <div><p className="text-text-muted">{t('rpt_col_net_profit')}</p><p className={`font-bold text-sm ${r.netProfit >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>{money(r.netProfit)}</p></div>}
                  <div><p className="text-text-muted">{t('rpt_col_stock')}</p><p className="font-bold text-text-primary text-sm">{r.stockQty} · {money(r.stockRetail)}</p></div>
                </div>
              </div>
            ))}
          </div>
          {rows.length > 0 && (
            <div className="bg-bg-secondary border border-border rounded-2xl p-4">
              <p className="font-syne font-bold text-text-primary text-sm mb-3">{t('rpt_shops_compare')}</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rows}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => `${Math.round(v / 1e6)}M`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => money(v)} />
                    <Legend />
                    <Bar dataKey="revenue" name={t('rpt_col_revenue')} fill={C.blue} radius={[4, 4, 0, 0]} />
                    {sp && <Bar dataKey="netProfit" name={t('rpt_col_net_profit')} fill={C.green} radius={[4, 4, 0, 0]} />}
                    {sp && <Bar dataKey="expenses" name={t('rpt_col_expenses')} fill={C.red} radius={[4, 4, 0, 0]} />}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          <ReportTable title={t('rpt_shops_title')} fileName={`dokonlar_${range.from}_${range.to}`} columns={cols} rows={rows} />
        </>
      )}
    </div>
  )
}

export default ShopsReportTab
