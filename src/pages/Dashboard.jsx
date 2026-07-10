import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import {
  ShoppingCart, Package, Users, TrendingUp, AlertTriangle, ArrowRight
} from 'lucide-react'
import { getSales } from '../api/salesService'
import { getProducts } from '../api/productService'
import { getCustomers } from '../api/customerService'
import { getIncomeBatches } from '../api/incomeService'
import { getItems } from '../api/itemService'
import { useDataStore } from '../store/dataStore'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLangStore } from '../store/langStore'
import { useShopStore } from '../store/shopStore'

const fmt = (n) => new Intl.NumberFormat('uz-UZ').format(Math.round(n))

const KpiCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="bg-bg-secondary border border-border rounded-2xl p-5 flex flex-col gap-3">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-text-secondary text-sm">{label}</p>
      <p className="text-2xl font-syne font-bold mt-0.5">{value}</p>
      {sub && <p className="text-text-muted text-xs mt-1">{sub}</p>}
    </div>
  </div>
)

export const Dashboard = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { lang } = useLangStore()
  const { selectedShopId } = useShopStore()
  const { version } = useDataStore()
  const today = new Date().toISOString().slice(0, 10)
  const locale = lang === 'ru' ? 'ru-RU' : 'uz-UZ'

  const [MOCK_SALES, setMockSales] = useState([])
  const [MOCK_PRODUCTS, setMockProducts] = useState([])
  const [MOCK_CUSTOMERS, setMockCustomers] = useState([])
  const [MOCK_INCOME_BATCHES, setMockIncomeBatches] = useState([])
  const [MOCK_ITEMS, setMockItems] = useState([])
  const MOCK_BATCHES = MOCK_INCOME_BATCHES

  useEffect(() => {
    Promise.all([getSales(), getProducts(), getCustomers(), getIncomeBatches(), getItems()])
      .then(([sales, products, customers, batches, items]) => {
        setMockSales(sales)
        setMockProducts(products)
        setMockCustomers(customers)
        setMockIncomeBatches(batches)
        setMockItems(items)
      })
  }, [version])

  const stats = useMemo(() => {
    const shopSales = selectedShopId === 'all' ? MOCK_SALES : MOCK_SALES.filter(s => s.shopId === selectedShopId)
    const shopIncomeBatches = selectedShopId === 'all' ? MOCK_INCOME_BATCHES : MOCK_INCOME_BATCHES.filter(b => b.shopId === selectedShopId)
    const completed = shopSales.filter(s => s.status === 'completed')

    const todaySales = completed.filter(s => s.soldAt.slice(0, 10) === today)
    const todayTotal = todaySales.reduce((s, x) => s + x.total, 0)
    const todaySalesCount = todaySales.length

    const shopBatchIds = new Set(
      (selectedShopId === 'all' ? MOCK_BATCHES : MOCK_BATCHES.filter(b => b.shopId === selectedShopId)).map(b => b.id)
    )
    const inStock = MOCK_ITEMS.filter(i => i.status === 'in_stock' && shopBatchIds.has(i.batchId)).length

    const debtUSD = shopIncomeBatches
      ? shopIncomeBatches.reduce((s, b) => s + (b.debtUSD || 0), 0)
      : 0

    const customerIds = selectedShopId === 'all'
      ? new Set(MOCK_CUSTOMERS.map(c => c.id))
      : new Set(shopSales.filter(s => s.customerId).map(s => s.customerId))
    const customers = customerIds.size

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return d.toISOString().slice(0, 10)
    })

    const uzDays = ['Yak', 'Du', 'Se', 'Cho', 'Pay', 'Ju', 'Sha']
    const chart = days.map(day => {
      const d = new Date(day + 'T12:00:00')
      const dayName = lang === 'uz'
        ? `${uzDays[d.getDay()]} ${d.getDate()}`
        : d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' })
      const total = completed
        .filter(s => s.soldAt.slice(0, 10) === day)
        .reduce((s, x) => s + x.total, 0)
      return { day: dayName, total }
    })

    const recent = [...shopSales]
      .sort((a, b) => new Date(b.soldAt) - new Date(a.soldAt))
      .slice(0, 5)

    const shopBatchesArr = selectedShopId === 'all' ? MOCK_BATCHES : MOCK_BATCHES.filter(b => b.shopId === selectedShopId)
    const lowStock = MOCK_PRODUCTS.filter(p => {
      if (!p.isActive) return false
      if (!shopBatchesArr.some(b => b.productId === p.id)) return false
      const stock = MOCK_ITEMS.filter(i => i.productId === p.id && i.status === 'in_stock' && shopBatchIds.has(i.batchId)).length
      return p.lowStockThreshold != null && stock <= p.lowStockThreshold
    }).map(p => ({
      ...p,
      currentStock: MOCK_ITEMS.filter(i => i.productId === p.id && i.status === 'in_stock' && shopBatchIds.has(i.batchId)).length
    }))

    return { todayTotal, todaySalesCount, inStock, debtUSD, customers, chart, recent, lowStock }
  }, [today, lang, selectedShopId, MOCK_SALES, MOCK_PRODUCTS, MOCK_ITEMS, MOCK_INCOME_BATCHES, MOCK_CUSTOMERS])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-syne font-extrabold tracking-tight">{t('dashboard')}</h1>
          <p className="text-text-secondary">{t('dash_subtitle')}</p>
        </div>
        <div className="bg-bg-secondary px-4 py-2 rounded-xl border border-border text-sm font-medium">
          {t('dash_today')}: <span className="text-accent-blue">
            {new Date().toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={TrendingUp}
          label={t('dash_today_sales')}
          value={stats.todayTotal > 0 ? fmt(stats.todayTotal) + ' ' + t('dash_so_m') : '—'}
          sub={t('dash_sales_count', { count: stats.todaySalesCount })}
          color="bg-green-500/10 text-green-500"
        />
        <KpiCard
          icon={Package}
          label={t('col_in_stock')}
          value={stats.inStock + ' ' + t('unit_pcs')}
          sub={t('dash_all_products')}
          color="bg-blue-500/10 text-blue-500"
        />
        <KpiCard
          icon={ShoppingCart}
          label={t('dash_debt')}
          value={stats.debtUSD > 0 ? '$' + fmt(stats.debtUSD) : '—'}
          sub={t('dash_debt_sub')}
          color="bg-red-600/10 text-red-500"
        />
        <KpiCard
          icon={Users}
          label={t('customers')}
          value={stats.customers + ' ' + t('unit_pcs')}
          sub={t('dash_customers_sub')}
          color="bg-purple-500/10 text-purple-500"
        />
      </div>

      {/* Chart */}
      <div className="bg-bg-secondary border border-border rounded-2xl p-6">
        <h2 className="font-syne font-bold text-lg mb-5">{t('dash_chart_title')}</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stats.chart} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: '#888' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}
            />
            <Tooltip
              formatter={(v) => [fmt(v) + ' ' + t('dash_so_m'), t('sales')]}
              contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, fontSize: 13, color: '#fff' }}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            />
            <Bar dataKey="total" fill="#E63946" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Oxirgi sotuvlar */}
        <div className="bg-bg-secondary border border-border rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-syne font-bold text-base">{t('dash_recent_sales')}</h2>
            <button
              onClick={() => navigate('/sales?tab=history')}
              className="text-text-muted hover:text-text-primary flex items-center gap-1 text-sm transition-colors"
            >
              {t('filter_all')} <ArrowRight size={14} />
            </button>
          </div>
          <div className="space-y-2 flex-1">
            {stats.recent.map(sale => (
              <div key={sale.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{sale.customerName}</p>
                  <p className="text-xs text-text-muted">
                    {new Date(sale.soldAt).toLocaleString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {' · '}{t('pay_' + sale.paymentType) || sale.paymentType}
                  </p>
                </div>
                {sale.status === 'cancelled'
                ? <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-medium">{t('cancelled') || 'Bekor'}</span>
                : <span className="text-sm font-semibold text-green-500">{fmt(sale.total)} {t('dash_so_m')}</span>
              }
              </div>
            ))}
          </div>
        </div>

        {/* Kam qolgan tovarlar */}
        <div className="bg-bg-secondary border border-border rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-syne font-bold text-base">{t('dash_low_stock')}</h2>
            <button
              onClick={() => navigate('/warehouse')}
              className="text-text-muted hover:text-text-primary flex items-center gap-1 text-sm transition-colors"
            >
              {t('dash_to_warehouse')} <ArrowRight size={14} />
            </button>
          </div>
          <div className="space-y-2 flex-1">
            {stats.lowStock.length === 0 && (
              <p className="text-text-muted text-sm py-4 text-center">{t('dash_all_ok')}</p>
            )}
            {stats.lowStock.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle size={15} className="text-amber-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-text-muted">{t('cat_' + p.category, { defaultValue: p.categoryLabel })}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-amber-500">
                  {p.currentStock} / {p.lowStockThreshold} {t('unit_pcs')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default Dashboard
