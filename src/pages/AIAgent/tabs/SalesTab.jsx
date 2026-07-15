import { useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAgentActivityStore } from '../../../store/agentActivityStore'
import { useDataStore } from '../../../store/dataStore'
import { useShopStore } from '../../../store/shopStore'
import { getSaleProfit } from '../../../utils/profitHelpers'
import { fmtNum } from '../aiHelpers'
import { useAgentAnalysis } from '../hooks/useAgentAnalysis'
import AgentAnalysisPanel from '../components/AgentAnalysisPanel'
import AiChat from '../components/AiChat'

const SYSTEM_PROMPT = `Sen GoodTires shina do'koni savdo tahlilchisi agentisan. Berilgan savdo ma'lumotlarini tahlil qilib, aniq KPI, ogohlantirishlar, tahlil natijalari va tavsiyalar bilan JSON formatida javob berasan. Faqat o'zbek tilida yoz. Raqamlarni so'm yoki % bilan ko'rsat.`

function SalesTab({ aiData = {} }) {
  const { t, i18n } = useTranslation()
  const { addActivity } = useAgentActivityStore()
  const { version } = useDataStore()
  const { selectedShopId } = useShopStore()
  const { sales: _allSales = [], products: MOCK_PRODUCTS = [], batches: MOCK_INCOME_BATCHES = [], usedSales: _allUsedSales = [] } = aiData
  const MOCK_SALES = selectedShopId === 'all' ? _allSales : _allSales.filter(s => s.shopId === selectedShopId)
  const MOCK_USED_COMPLETED = _allUsedSales.filter(s => s.status !== 'cancelled')

  const completedSales = MOCK_SALES.filter(s => s.status !== 'cancelled')
  const cancelledSales = MOCK_SALES.filter(s => s.status === 'cancelled')
  // Haqiqiy bekor (pul qaytarilgan) vs almashtirish (exchange)
  const realCancelled = cancelledSales.filter(s => !s._isExchange)
  const exchanged = cancelledSales.filter(s => s._isExchange)
  const totalNewRevenue = completedSales.reduce((s, x) => s + x.total, 0)
  const totalUsedRevenue = MOCK_USED_COMPLETED.reduce((s, x) => s + (x.total || 0), 0)
  const totalRevenue = totalNewRevenue + totalUsedRevenue
  const totalNewProfit = completedSales.reduce((s, x) => s + getSaleProfit(x) - (x.paymentType === 'installment' ? (x.installmentCommissionAmount ?? 0) : 0), 0)
  const totalUsedProfit = MOCK_USED_COMPLETED.reduce((s, x) => s + getSaleProfit(x) - (x.paymentType === 'installment' ? (x.installmentCommissionAmount ?? 0) : 0), 0)
  const totalProfit = totalNewProfit + totalUsedProfit
  const avgMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0
  const returnRate = MOCK_SALES.length > 0 ? ((realCancelled.length / MOCK_SALES.length) * 100).toFixed(1) : 0

  const brandData = useMemo(() => {
    const map = {}
    completedSales.forEach(sale => sale.items.forEach(item => {
      if (!item.purchasePrice) return
      const brand = MOCK_PRODUCTS.find(p => p.id === item.productId)?.brand || 'Boshqa'
      if (!map[brand]) map[brand] = { brand, qty: 0, revenue: 0, cost: 0 }
      map[brand].qty++
      map[brand].revenue += item.salePrice
      map[brand].cost += item.purchasePrice
    }))
    return Object.values(map).map(b => ({
      ...b,
      margin: b.revenue > 0 ? ((b.revenue - b.cost) / b.revenue * 100).toFixed(1) : 0,
      profit: b.revenue - b.cost,
    })).sort((a, b) => b.profit - a.profit)
  }, [completedSales, version])

  // To'lov turi bo'yicha
  const payStats = useMemo(() => {
    const map = {}
    completedSales.forEach(s => { map[s.paymentType] = (map[s.paymentType] || 0) + 1 })
    return map
  }, [completedSales])

  // Oxirgi oy sotuv
  const thisMonth = new Date().toISOString().slice(0, 7)
  const thisMonthSales = completedSales.filter(s => s.soldAt?.startsWith(thisMonth))
  const thisMonthRev = thisMonthSales.reduce((s, x) => s + x.total, 0)

  const { loading, analysis, error, refresh } = useAgentAnalysis({
    agentId: 'sales-agent',
    systemPrompt: SYSTEM_PROMPT,
    enabled: MOCK_SALES.length > 0 || MOCK_USED_COMPLETED.length > 0,
    buildPrompt: () => `SAVDO TAHLILI MA'LUMOTLARI:

Jami sotuvlar: ${completedSales.length} ta yangi + ${MOCK_USED_COMPLETED.length} ta B/U = ${completedSales.length + MOCK_USED_COMPLETED.length} ta
Bekor (pul qaytarilgan): ${realCancelled.length} ta
Almashtirish (exchange): ${exchanged.length} ta
Umumiy tushum: ${fmtNum(totalRevenue, t)} so'm (yangi: ${fmtNum(totalNewRevenue, t)}, B/U: ${fmtNum(totalUsedRevenue, t)})
Sof foyda: ${fmtNum(totalProfit, t)} so'm (yangi: ${fmtNum(totalNewProfit, t)}, B/U: ${fmtNum(totalUsedProfit, t)})
O'rtacha marja: ${avgMargin}%
Shu oy sotuv: ${fmtNum(thisMonthRev, t)} so'm (${thisMonthSales.length} ta)
To'lov usuli: naqd ${payStats.cash||0} ta, karta ${payStats.card||0} ta, nasiya ${payStats.installment||0} ta

Brend tahlili (top-${Math.min(5, brandData.length)}):
${brandData.slice(0, 5).map((b, i) => `${i+1}. ${b.brand}: ${b.qty} ta, ${b.margin}% marja, ${fmtNum(b.profit, t)} so'm foyda`).join('\n')}
Past marja (<20%): ${brandData.filter(b => parseFloat(b.margin) < 20).map(b => b.brand + ' (' + b.margin + '%)').join(', ') || 'yo\'q'}`,
    deps: [version, selectedShopId, completedSales.length, totalRevenue],
  })

  useEffect(() => {
    if (analysis && !analysis.raw) {
      analysis.alerts?.forEach(a => addActivity({ agentId: 'sales', type: 'ALERT', message: a.message }))
      analysis.recommendations?.slice(0, 2).forEach(r => addActivity({ agentId: 'sales', type: 'RECOMMENDATION', message: r.action }))
    }
  }, [analysis])

  const chatSystemPrompt = `Sen GoodTires shina do'koni savdo tahlilchisi agentisan.

📊 Savdo holati:
- Jami tushum: ${fmtNum(totalRevenue, t)} so'm (${completedSales.length + MOCK_USED_COMPLETED.length} ta sotuv)
- Sof foyda: ${fmtNum(totalProfit, t)} so'm, marja ${avgMargin}%
- Bekor: ${cancelledSales.length} ta (${returnRate}%)
- Eng foydali brend: ${brandData[0]?.brand || '—'} (${brandData[0]?.margin || 0}% marja)

O'zbek tilida qisqa va amaliy javob ber.`

  return (
    <div className="space-y-6">
      <AgentAnalysisPanel
        loading={loading}
        analysis={analysis}
        error={error}
        refresh={refresh}
        accentColor="text-[#22c55e]"
      />
      <AiChat agentId="sales-agent" systemPrompt={chatSystemPrompt} colorClass="accent-green" />
    </div>
  )
}

export default SalesTab
