import { useState, useEffect } from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { ArrowDownRight, ArrowUpRight, Boxes, Receipt, ShoppingBag, TrendingUp, UserPlus, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useShopStore } from '../store/shopStore'
import { useDataStore } from '../store/dataStore'
import { getDashboardReport } from '../api/reportService'
import { presetRange } from '../pages/Expenses/components/PeriodPicker'

const fmt = (n) => Math.round(Number(n) || 0).toLocaleString('uz-UZ')
const short = (v) => (v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? Math.round(v / 1e3) + 'K' : v)
const PIE = ['#E63946', '#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6']
const PRESETS = ['today', 'week', 'month', 'last_month']

const Trend = ({ cur, prev }) => {
  if (!prev) return null
  const d = Math.round(((cur - prev) / Math.abs(prev)) * 100)
  if (!Number.isFinite(d)) return null
  return (
    <span className={`inline-flex items-center text-xs font-bold ${d >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
      {d >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{Math.abs(d)}%
    </span>
  )
}

const Kpi = ({ icon: Icon, label, value, cur, prev, color }) => (
  <div className="bg-bg-secondary border border-border rounded-2xl p-4 min-w-0">
    <div className="flex items-center justify-between mb-2">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}><Icon size={18} /></div>
      <Trend cur={cur} prev={prev} />
    </div>
    <p className="text-text-secondary text-xs">{label}</p>
    <p className="text-lg sm:text-xl font-syne font-bold leading-tight [overflow-wrap:anywhere]">{value}</p>
  </div>
)

const DashboardSummary = ({ supplierDebtUSD = 0 }) => {
  const { t } = useTranslation()
  const { selectedShopId } = useShopStore()
  const { version } = useDataStore()
  const [preset, setPreset] = useState('today')
  const [data, setData] = useState(null)

  useEffect(() => {
    getDashboardReport({ ...presetRange(preset), shop_id: selectedShopId }).then(setData).catch(() => setData(null))
  }, [preset, selectedShopId, version])

  const c = data?.current, p = data?.previous
  const payLabel = (k) => ({ cash: t('pay_cash'), card: t('pay_card'), installment: t('pay_installment'), transfer: t('sl_ns_pay_transfer') }[k] || k)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {PRESETS.map(k => (
          <button key={k} onClick={() => setPreset(k)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${preset === k ? 'bg-accent-red text-white' : 'bg-bg-secondary border border-border text-text-secondary'}`}>
            {t('fin_period_' + k)}
          </button>
        ))}
        {data && <span className="text-xs text-text-muted ml-2 whitespace-nowrap">{t('dash_vs_prev')}</span>}
      </div>

      {!c ? <div className="h-28 rounded-2xl bg-bg-secondary border border-border animate-pulse" /> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <Kpi icon={TrendingUp} label={t('dash_k_revenue')} value={fmt(c.revenue)} cur={c.revenue} prev={p.revenue} color="bg-green-500/10 text-green-500" />
            <Kpi icon={Receipt} label={t('dash_k_checks')} value={c.salesCount} cur={c.salesCount} prev={p.salesCount} color="bg-blue-500/10 text-blue-500" />
            <Kpi icon={ShoppingBag} label={t('dash_k_avg')} value={fmt(c.avgCheck)} cur={c.avgCheck} prev={p.avgCheck} color="bg-purple-500/10 text-purple-500" />
            <Kpi icon={Boxes} label={t('dash_k_items')} value={c.itemsSold} cur={c.itemsSold} prev={p.itemsSold} color="bg-orange-500/10 text-orange-500" />
            {c.profit !== undefined
              ? <Kpi icon={Wallet} label={t('dash_k_profit')} value={fmt(c.profit)} cur={c.profit} prev={p.profit} color="bg-emerald-500/10 text-emerald-500" />
              : <Kpi icon={Wallet} label={t('dash_k_returns')} value={fmt(c.returnsAmount)} color="bg-red-500/10 text-red-500" />}
            <Kpi icon={UserPlus} label={t('dash_k_new_customers')} value={c.newCustomers} cur={c.newCustomers} prev={p.newCustomers} color="bg-pink-500/10 text-pink-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-bg-secondary border border-border rounded-2xl p-4">
              <p className="font-syne font-bold text-sm mb-3">{t('dash_chart_period')}</p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.daily.map(d => ({ ...d, day: d.date.slice(8, 10) + '.' + d.date.slice(5, 7) }))}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={short} tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v) => [fmt(v), t('dash_k_revenue')]} />
                    <Area type="monotone" dataKey="revenue" stroke="#E63946" fill="#E63946" fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-bg-secondary border border-border rounded-2xl p-4">
              <p className="font-syne font-bold text-sm mb-3">{t('dash_payments')}</p>
              {data.payments.length === 0 ? <p className="text-text-muted text-sm">—</p> : (
                <>
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data.payments} dataKey="amount" nameKey="type" innerRadius={35} outerRadius={60}>
                          {data.payments.map((x, i) => <Cell key={x.type} fill={PIE[i % PIE.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v, n) => [fmt(v), payLabel(n)]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1 mt-2">
                    {data.payments.map((x, i) => (
                      <div key={x.type} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-text-secondary"><span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE[i % PIE.length] }} />{payLabel(x.type)} · {x.count}</span>
                        <span className="font-semibold text-text-primary">{fmt(x.amount)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              { title: t('dash_top_products'), list: data.topProducts.map(x => ({ name: x.name, a: `${x.qty} ${t('unit_pcs')}`, b: x.revenue })) },
              { title: t('dash_top_sellers'), list: data.topSellers.map(x => ({ name: x.name, a: `${x.count} ${t('dash_checks_short')}`, b: x.revenue })) },
            ].map(block => (
              <div key={block.title} className="bg-bg-secondary border border-border rounded-2xl p-4">
                <p className="font-syne font-bold text-sm mb-3">{block.title}</p>
                {block.list.length === 0 ? <p className="text-text-muted text-sm">—</p> : (
                  <div className="space-y-2">
                    {block.list.map((x, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <span className="w-6 h-6 rounded-lg bg-bg-tertiary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <span className="flex-1 min-w-0 truncate text-text-primary">{x.name}</span>
                        <span className="text-xs text-text-muted whitespace-nowrap">{x.a}</span>
                        <span className="font-semibold whitespace-nowrap">{fmt(x.b)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-bg-secondary border border-border rounded-2xl p-4">
              <p className="text-text-secondary text-xs">{t('dash_debt')}</p>
              <p className="font-syne font-bold text-lg">{supplierDebtUSD > 0 ? '$' + fmt(supplierDebtUSD) : '—'}</p>
              <p className="text-xs text-text-muted">{t('dash_debt_sub')}</p>
            </div>
            <div className="bg-bg-secondary border border-border rounded-2xl p-4">
              <p className="text-text-secondary text-xs">{t('dash_stock_now')}</p>
              <p className="font-syne font-bold text-lg">{fmt(data.stock.qty)} {t('unit_pcs')}</p>
              <p className="text-xs text-text-muted">{t('dash_stock_retail', { v: fmt(data.stock.retail) })}</p>
            </div>
            <div className="bg-bg-secondary border border-border rounded-2xl p-4">
              <p className="text-text-secondary text-xs">{t('dash_installment_debt')}</p>
              <p className="font-syne font-bold text-lg">{fmt(data.installmentDebt)}</p>
              <p className="text-xs text-text-muted">{t('dash_installment_debt_sub')}</p>
            </div>
            <div className="bg-bg-secondary border border-border rounded-2xl p-4">
              <p className="text-text-secondary text-xs">{t('dash_k_returns')}</p>
              <p className="font-syne font-bold text-lg">{fmt(c.returnsAmount)}</p>
              <p className="text-xs text-text-muted">{c.returnsCount} {t('unit_pcs')}</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default DashboardSummary
