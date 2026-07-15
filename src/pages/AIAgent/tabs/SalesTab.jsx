import { useState, useMemo, useEffect } from 'react'
import { BarChart3, TrendingUp, AlertTriangle, Star, Info, Bell, CheckCircle, X, Zap } from 'lucide-react'
import AiChat from '../components/AiChat'
import { useTranslation } from 'react-i18next'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAgentActivityStore } from '../../../store/agentActivityStore'
import { useDataStore } from '../../../store/dataStore'
import { useShopStore } from '../../../store/shopStore'
import { getSaleProfit } from '../../../utils/profitHelpers'
import { fmtNum } from '../aiHelpers'
import KpiCard from '../components/KpiCard'

const _loggedInsightKeys = new Set()

function SalesTab({ aiData = {} }) {
  const { t, i18n } = useTranslation()
  const som = t('unit_som')
  const { addActivity } = useAgentActivityStore()
  const { version } = useDataStore()
  const { selectedShopId } = useShopStore()
  const { sales: _allSales = [], products: MOCK_PRODUCTS = [], batches: MOCK_INCOME_BATCHES = [], usedSales: _allUsedSales = [] } = aiData
  const MOCK_SALES = selectedShopId === 'all' ? _allSales : _allSales.filter(s => s.shopId === selectedShopId)
  const MOCK_USED_COMPLETED = _allUsedSales.filter(s => s.status !== 'cancelled')
  const MOCK_EXPENSES = []
  const [insightRead, setInsightRead] = useState(new Set())
  const [insightDeleted, setInsightDeleted] = useState(new Set())
  const [insightPage, setInsightPage] = useState(0)

  const completedSales = useMemo(() => MOCK_SALES.filter(s => s.status !== 'cancelled'), [version, selectedShopId])
  const cancelledSales = useMemo(() => MOCK_SALES.filter(s => s.status === 'cancelled'), [version, selectedShopId])
  const totalExpensesUZS = useMemo(() => MOCK_EXPENSES.reduce((s, e) => s + (e.amountUZS || e.amount || 0), 0), [version, selectedShopId])

  const brandData = useMemo(() => {
    const map = {}
    completedSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!item.purchasePrice) return
        const prod = MOCK_PRODUCTS.find(p => p.id === item.productId)
        const brand = prod?.brand || 'Boshqa'
        if (!map[brand]) map[brand] = { brand, qty: 0, revenue: 0, cost: 0 }
        map[brand].qty += 1
        map[brand].revenue += item.salePrice
        map[brand].cost += item.purchasePrice
      })
    })
    return Object.values(map).map(b => ({
      ...b,
      margin: b.revenue > 0 ? ((b.revenue - b.cost) / b.revenue * 100).toFixed(1) : 0,
      profit: b.revenue - b.cost,
    })).sort((a, b) => b.profit - a.profit)
  }, [completedSales, version])

  const totalRevenue = completedSales.reduce((s, x) => s + x.total, 0) + MOCK_USED_COMPLETED.reduce((s, x) => s + (x.total || 0), 0)
  const totalCost = completedSales.reduce((sum, sale) => sum + sale.items.reduce((s, i) => s + (i.purchasePrice || 0), 0), 0)
  const totalProfit = completedSales.reduce((s, x) => s + getSaleProfit(x) - (x.paymentType === 'installment' ? (x.installmentCommissionAmount ?? 0) : 0), 0)
  const avgMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0
  const returnRate = MOCK_SALES.length > 0 ? ((cancelledSales.length / MOCK_SALES.length) * 100).toFixed(1) : 0
  const capitalState = totalProfit - totalExpensesUZS

  const MONTH_SHORT = i18n.language === 'ru'
    ? ['\u042f\u043d\u0432','\u0424\u0435\u0432','\u041c\u0430\u0440','\u0410\u043f\u0440','\u041c\u0430\u0439','\u0418\u044e\u043d','\u0418\u044e\u043b','\u0410\u0432\u0433','\u0421\u0435\u043d','\u041e\u043a\u0442','\u041d\u043e\u044f','\u0414\u0435\u043a']
    : ['Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek']

  const flowData = useMemo(() => {
    const months = {}
    const slot = (dateStr) => {
      const d = new Date(dateStr)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = MONTH_SHORT[d.getMonth()] + " '" + String(d.getFullYear()).slice(2)
      if (!months[key]) months[key] = { month: label, kirim: 0, chiqim: 0, _key: key }
      return months[key]
    }
    completedSales.forEach(sale => { slot(sale.soldAt).kirim += sale.total })
    MOCK_EXPENSES.forEach(e => { slot(e.date || e.createdAt).chiqim += e.amountUZS || e.amount || 0 })
    MOCK_INCOME_BATCHES.forEach(batch => {
      batch.payments?.forEach(pay => { slot(pay.date).chiqim += pay.amountUZS || 0 })
    })
    return Object.values(months).sort((a, b) => a._key.localeCompare(b._key))
  }, [completedSales, version])

  const insights = useMemo(() => {
    const list = []
    brandData.forEach(b => {
      if (parseFloat(b.margin) < 20) list.push({ type: 'ALERT', msg: t('ai_insight_low_margin', { brand: b.brand, margin: b.margin }) })
    })
    if (parseFloat(returnRate) > 20) list.push({ type: 'ALERT', msg: t('ai_insight_high_return', { rate: returnRate }) })
    const topBrand = brandData[0]
    if (topBrand) list.push({ type: 'RECOMMENDATION', msg: t('ai_insight_top_brand', { brand: topBrand.brand, profit: fmtNum(topBrand.profit, t), som, margin: topBrand.margin }) })
    if (capitalState > 0) list.push({ type: 'ANALYSIS', msg: t('ai_insight_capital_ok', { amount: fmtNum(capitalState, t), som }) })
    else list.push({ type: 'ALERT', msg: t('ai_insight_capital_neg', { amount: fmtNum(Math.abs(capitalState), t), som }) })
    return list
  }, [brandData, returnRate, capitalState, version, t, selectedShopId])

  useEffect(() => {
    insights.forEach(ins => {
      const key = ins.type + ':' + ins.msg
      if (!_loggedInsightKeys.has(key)) {
        _loggedInsightKeys.add(key)
        addActivity({ agentId: 'sales', type: ins.type, message: ins.msg })
      }
    })
  }, [insights, addActivity])

  const salesSystemPrompt = useMemo(() => `Sen GoodTires shina do'koni uchun savdo tahlilchisi agentisan.

\ud83d\udcca Hozirgi savdo ma'lumotlari:
- Jami sotuvlar: ${completedSales.length} ta (bekor: ${cancelledSales.length} ta, ${returnRate}%)
- Umumiy tushum: ${fmtNum(totalRevenue, t)} so'm
- Sof foyda: ${fmtNum(totalProfit, t)} so'm
- O'rtacha marja: ${avgMargin}%
- Kapital holati: ${fmtNum(capitalState, t)} so'm

\ud83c\udfc6 Brend bo'yicha marja (top 5):
${brandData.slice(0, 5).map(b => `  ${b.brand}: ${b.qty} ta sotilgan, marja ${b.margin}%, foyda ${fmtNum(b.profit, t)} so'm`).join('\n')}

MUHIM QOIDALAR:
- To'liq, to'g'ri o'zbek adabiy tilida yoz. Grammatika: ega + to'ldiruvchi + kesim tartibida.
- "Bu mahsulot ko'p sotiladi" — to'g'ri. "Ko'p sotiladi bu mahsulot" — NOTO'G'RI.
- Raqamlarni so'm yoki % bilan ko'rsat.
- Markdown ishlatishingiz mumkin: **qalin**, - ro'yxat, ## sarlavha.
- Qisqa va amaliy tavsiyalar ber.`, [completedSales.length, totalRevenue, totalProfit, avgMargin, capitalState, brandData])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label={t('ai_kpi_total_sales')} value={fmtNum(totalRevenue, t) + ' ' + t('unit_som')} sub={t('ai_kpi_all_time')} color="text-[#22c55e]" />
        <KpiCard label={t('col_net_profit')} value={fmtNum(totalProfit, t) + ' ' + t('unit_som')} sub={t('ai_kpi_excl_cost')} color="text-[#22c55e]" />
        <KpiCard label={t('ai_kpi_avg_margin')} value={avgMargin + '%'} sub={t('ai_kpi_all_brands')} />
        <KpiCard label={t('ai_kpi_returns')} value={cancelledSales.length + ' ' + t('unit_pcs')} sub={returnRate + t('ai_kpi_return_share')} color={parseFloat(returnRate) > 20 ? 'text-[#E63946]' : 'text-text-primary'} />
        <KpiCard label={t('ai_kpi_capital')} value={fmtNum(capitalState, t) + ' ' + t('unit_som')} sub={t('ai_kpi_from_balance')} color={capitalState > 0 ? 'text-[#22c55e]' : 'text-[#E63946]'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <BarChart3 size={15} className="text-[#22c55e]" /> {t('ai_brand_margin_table')}
          </h3>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  {[t('brand'), t('sold'), t('margin_pct'), t('profit')].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-text-muted font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {brandData.map(b => (
                  <tr key={b.brand} className="border-b border-border/50 hover:bg-bg-secondary/50">
                    <td className="px-3 py-2 font-medium text-text-primary">{b.brand}</td>
                    <td className="px-3 py-2 text-text-muted">{b.qty} {t('unit_pcs')}</td>
                    <td className="px-3 py-2">
                      <span className={parseFloat(b.margin) >= 23 ? 'text-[#22c55e]' : parseFloat(b.margin) >= 20 ? 'text-amber-400' : 'text-[#E63946]'}>
                        {b.margin}%
                      </span>
                    </td>
                    <td className="px-3 py-2 text-text-primary">{fmtNum(b.profit, t)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <TrendingUp size={15} className="text-[#3b82f6]" /> {t('ai_capital_flow')}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={flowData} margin={{ top: 16, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} padding={{ right: 20 }} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={v => { const s = fmtNum(v, t); return s.replace(/\.0 /, ' ') }} width={52} />
                <Tooltip formatter={v => fmtNum(v, t) + ' ' + som} contentStyle={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="kirim" stroke="#22c55e" fill="#22c55e20" name={t('ai_chart_income')} strokeWidth={2} />
                <Area type="monotone" dataKey="chiqim" stroke="#E63946" fill="#E6394620" name={t('ai_chart_expense')} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {insights.length > 0 && (() => {
        const INSIGHT_PAGE_SIZE = 3
        const indexed = insights.map((ins, i) => ({ ...ins, idx: i }))
        const visible = indexed.filter(ins => !insightDeleted.has(ins.idx))
        const unread = visible.filter(ins => !insightRead.has(ins.idx)).length
        const total = Math.max(1, Math.ceil(visible.length / INSIGHT_PAGE_SIZE))
        const safe = Math.min(insightPage, total - 1)
        const shown = visible.slice(safe * INSIGHT_PAGE_SIZE, (safe + 1) * INSIGHT_PAGE_SIZE)
        return (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Zap size={15} className="text-amber-400" /> {t('ai_financial_insights')}
                {unread > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400">{unread}</span>}
              </h3>
              {unread > 0 && (
                <button onClick={() => setInsightRead(new Set(visible.map(ins => ins.idx)))} className="text-xs px-2.5 py-1 rounded-lg border border-border hover:bg-bg-secondary text-text-muted transition-colors flex items-center gap-1">
                  <CheckCircle size={11} /> {t('ai_mark_all_read')}
                </button>
              )}
            </div>
            <div className="space-y-2">
              {shown.map(ins => (
                <div key={ins.idx} className={`flex gap-2 p-3 rounded-xl border transition-colors ${insightRead.has(ins.idx) ? 'opacity-60 border-border/50' : ins.type === 'ALERT' ? 'border-[#E63946]/30 bg-[#E63946]/5' : ins.type === 'RECOMMENDATION' ? 'border-[#22c55e]/30 bg-[#22c55e]/5' : 'border-[#3b82f6]/30 bg-[#3b82f6]/5'}`}>
                  {!insightRead.has(ins.idx) && (
                    <Bell size={12} className={`flex-shrink-0 mt-1 ${ins.type === 'ALERT' ? 'text-[#E63946]' : ins.type === 'RECOMMENDATION' ? 'text-[#22c55e]' : 'text-[#3b82f6]'}`} />
                  )}
                  {ins.type === 'ALERT' ? <AlertTriangle size={14} className="text-[#E63946] flex-shrink-0 mt-0.5" /> :
                   ins.type === 'RECOMMENDATION' ? <Star size={14} className="text-[#22c55e] flex-shrink-0 mt-0.5" /> :
                   <Info size={14} className="text-[#3b82f6] flex-shrink-0 mt-0.5" />}
                  <p className={`text-sm flex-1 ${insightRead.has(ins.idx) ? 'text-text-muted' : 'text-text-primary'}`}>{ins.msg}</p>
                  <div className="flex-shrink-0 flex items-start gap-0.5">
                    {!insightRead.has(ins.idx) && (
                      <button onClick={() => setInsightRead(s => new Set([...s, ins.idx]))} title={t('ai_mark_all_read')} className="p-1 rounded hover:bg-bg-primary text-text-muted hover:text-[#22c55e] transition-colors">
                        <CheckCircle size={13} />
                      </button>
                    )}
                    <button onClick={() => { setInsightDeleted(s => new Set([...s, ins.idx])); setInsightPage(0) }} title={t('delete')} className="p-1 rounded hover:bg-bg-primary text-text-muted hover:text-[#E63946] transition-colors">
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {total > 1 && (
              <div className="flex items-center justify-between pt-2">
                <button onClick={() => setInsightPage(p => Math.max(0, p - 1))} disabled={safe === 0} className="text-xs px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-bg-secondary text-text-muted transition-colors">{t('ai_prev')}</button>
                <span className="text-xs text-text-muted">{safe + 1} / {total}</span>
                <button onClick={() => setInsightPage(p => Math.min(total - 1, p + 1))} disabled={safe >= total - 1} className="text-xs px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-bg-secondary text-text-muted transition-colors">{t('ai_next')}</button>
              </div>
            )}
          </div>
        )
      })()}

      <AiChat
        agentId="sales-agent"
        systemPrompt={salesSystemPrompt}
        placeholder="Savdo, marja, foyda haqida so'rang..."
        colorClass="accent-green"
      />
    </div>
  )
}

export default SalesTab
