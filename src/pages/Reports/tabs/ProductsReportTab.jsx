import React, { useState, useEffect, useMemo } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { BarChart3, Boxes, Package, Percent, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useShopStore } from '../../../store/shopStore'
import { getProductsReport } from '../../../api/reportService'
import PeriodPicker, { presetRange } from '../../Expenses/components/PeriodPicker'
import { StatCard } from '../../Expenses/components/expHelpers'
import ReportTable from '../components/ReportTable'
import { C } from '../components/shared'
import { useCategoryLabels } from '../components/useCategoryLabels'

const money = (v) => Math.round(Number(v) || 0).toLocaleString('uz-UZ')
const ABC_CLS = { A: 'bg-accent-green/10 text-accent-green', B: 'bg-accent-blue/10 text-accent-blue', C: 'bg-accent-orange/10 text-accent-orange', '—': 'bg-gray-500/10 text-gray-500' }

const ProductsReportTab = () => {
  const { t } = useTranslation()
  const { selectedShopId } = useShopStore()
  const [preset, setPreset] = useState('month')
  const [range, setRange] = useState(presetRange('month'))
  const [view, setView] = useState('sales')
  const [category, setCategory] = useState('all')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const catLabel = useCategoryLabels()

  useEffect(() => {
    setError('')
    getProductsReport({ ...range, shop_id: selectedShopId }).then(setData).catch(e => setError(e?.response?.data?.error || t('exp_err_generic')))
  }, [range.from, range.to, selectedShopId])

  const rows = useMemo(() => (data?.rows || []).filter(r => category === 'all' || r.category === category), [data, category])
  const categories = useMemo(() => [...new Set((data?.rows || []).map(r => r.category))], [data])
  const sp = data?.showProfit
  const name = (r) => [r.brand, r.name].filter(Boolean).join(' ') + (r.size ? ` (${r.size})` : '')
  const tot = rows.reduce((a, r) => ({ qty: a.qty + r.soldQty, rev: a.rev + r.revenue, profit: a.profit + (r.profit || 0) }), { qty: 0, rev: 0, profit: 0 })
  const abcCount = (k) => rows.filter(r => r.abc === k).length
  const top = [...rows].filter(r => r.revenue > 0).slice(0, 10).map(r => ({ name: name(r).slice(0, 22), revenue: r.revenue }))
  const abcPie = ['A', 'B', 'C'].map(k => ({ name: k, value: rows.filter(r => r.abc === k).reduce((s, r) => s + r.revenue, 0) })).filter(x => x.value > 0)

  const salesCols = [
    { key: 'name', label: t('rpt_col_product'), value: name, className: 'text-text-primary font-medium' },
    { key: 'soldQty', label: t('rpt_col_sold_qty'), align: 'right', sum: true },
    { key: 'revenue', label: t('rpt_col_revenue'), align: 'right', sum: true, render: r => money(r.revenue), renderTotal: money },
    { key: 'avgPrice', label: t('rpt_col_avg_price'), align: 'right', render: r => money(r.avgPrice) },
    ...(sp ? [
      { key: 'cost', label: t('rpt_col_cost'), align: 'right', sum: true, render: r => money(r.cost), renderTotal: money },
      { key: 'profit', label: t('rpt_col_profit'), align: 'right', sum: true, render: r => <span className={r.profit >= 0 ? 'text-accent-green' : 'text-accent-red'}>{money(r.profit)}</span>, renderTotal: money },
      { key: 'margin', label: t('rpt_col_margin'), align: 'right', render: r => `${r.margin}%` },
    ] : []),
    { key: 'returnedQty', label: t('rpt_col_returned'), align: 'right', sum: true },
    { key: 'revenueShare', label: t('rpt_col_share'), align: 'right', render: r => `${r.revenueShare}%` },
  ]
  const effCols = [
    { key: 'name', label: t('rpt_col_product'), value: name, className: 'text-text-primary font-medium' },
    { key: 'abc', label: 'ABC', align: 'center', render: r => <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${ABC_CLS[r.abc]}`}>{r.abc}</span> },
    { key: 'soldQty', label: t('rpt_col_sold_qty'), align: 'right', sum: true },
    { key: 'stockQty', label: t('rpt_col_stock'), align: 'right', sum: true },
    { key: 'sellThrough', label: t('rpt_col_sell_through'), align: 'right', render: r => `${r.sellThrough}%` },
    { key: 'coverDays', label: t('rpt_col_cover_days'), align: 'right', value: r => (r.coverDays == null ? 99999 : r.coverDays), render: r => (r.coverDays == null ? '∞' : r.coverDays), excelValue: r => (r.coverDays == null ? '∞' : r.coverDays) },
    { key: 'daysSinceSale', label: t('rpt_col_days_since_sale'), align: 'right', value: r => (r.daysSinceSale == null ? 99999 : r.daysSinceSale), render: r => (r.daysSinceSale == null ? t('rpt_never') : r.daysSinceSale) },
    { key: 'stockAgeDays', label: t('rpt_col_stock_age'), align: 'right', render: r => r.stockAgeDays ?? '—' },
    { key: 'stockRetail', label: t('rpt_col_stock_retail'), align: 'right', sum: true, render: r => money(r.stockRetail), renderTotal: money },
    ...(sp ? [{ key: 'stockCost', label: t('rpt_col_stock_cost'), align: 'right', sum: true, render: r => money(r.stockCost), renderTotal: money }] : []),
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <PeriodPicker preset={preset} range={range} onChange={(p, r) => { setPreset(p); setRange(r) }} />
        <div className="flex gap-1 bg-bg-secondary border border-border rounded-xl p-1">
          {['sales', 'efficiency'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${view === v ? 'bg-accent-red text-white' : 'text-text-secondary'}`}>{t('rpt_prod_view_' + v)}</button>
          ))}
        </div>
      </div>
      {error && <div className="text-sm text-accent-red bg-accent-red/10 px-4 py-3 rounded-xl">{error}</div>}
      {!data ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-accent-red border-t-transparent rounded-full animate-spin" /></div> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard icon={TrendingUp} label={t('rpt_col_revenue')} value={money(tot.rev)} color="bg-green-500/10 text-green-500" />
            <StatCard icon={Package} label={t('rpt_col_sold_qty')} value={tot.qty} color="bg-blue-500/10 text-blue-500" />
            {sp ? <StatCard icon={Percent} label={t('rpt_col_profit')} value={money(tot.profit)} sub={tot.rev ? `${t('rpt_col_margin')} ${Math.round(tot.profit / tot.rev * 1000) / 10}%` : ''} color="bg-emerald-500/10 text-emerald-500" />
              : <StatCard icon={Boxes} label={t('rpt_col_stock')} value={rows.reduce((s, r) => s + r.stockQty, 0)} color="bg-emerald-500/10 text-emerald-500" />}
            <StatCard icon={BarChart3} label={t('rpt_abc')} value={`A ${abcCount('A')} · B ${abcCount('B')} · C ${abcCount('C')}`} sub={t('rpt_abc_hint')} color="bg-purple-500/10 text-purple-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-bg-secondary border border-border rounded-2xl p-4">
              <p className="font-syne font-bold text-text-primary text-sm mb-3">{t('rpt_top10')}</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #333)" opacity={0.3} />
                    <XAxis type="number" tickFormatter={v => `${Math.round(v / 1e6)}M`} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => money(v)} />
                    <Bar dataKey="revenue" fill={C.red} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-bg-secondary border border-border rounded-2xl p-4">
              <p className="font-syne font-bold text-text-primary text-sm mb-3">{t('rpt_abc_share')}</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={abcPie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} label={e => e.name}>
                      {abcPie.map(x => <Cell key={x.name} fill={x.name === 'A' ? C.green : x.name === 'B' ? C.blue : C.orange} />)}
                    </Pie>
                    <Tooltip formatter={v => money(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <ReportTable
            title={view === 'sales' ? t('rpt_prod_sales_title') : t('rpt_prod_eff_title')}
            fileName={`${view === 'sales' ? 'tovarlar-savdosi' : 'tovar-samaradorligi'}_${range.from}_${range.to}`}
            columns={view === 'sales' ? salesCols : effCols}
            rows={view === 'sales' ? rows.filter(r => r.soldQty > 0 || r.returnedQty > 0) : rows}
            searchKeys={['name', 'brand', 'size']}
            initialSort={{ key: view === 'sales' ? 'revenue' : 'soldQty', dir: 'desc' }}
            extraFilters={(
              <select value={category} onChange={e => setCategory(e.target.value)} className="bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-sm text-text-primary">
                <option value="all">{t('rpt_all_categories')}</option>
                {categories.map(c => <option key={c} value={c}>{catLabel(c)}</option>)}
              </select>
            )}
            footerNote={view === 'efficiency' ? t('rpt_eff_note') : undefined}
          />
        </>
      )}
    </div>
  )
}

export default ProductsReportTab
