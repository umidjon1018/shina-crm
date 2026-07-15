import { useEffect, useMemo } from 'react'
import { useAgentActivityStore } from '../../../store/agentActivityStore'
import { useDataStore } from '../../../store/dataStore'
import { useShopStore } from '../../../store/shopStore'
import { useAgentAnalysis } from '../hooks/useAgentAnalysis'
import AgentAnalysisPanel from '../components/AgentAnalysisPanel'
import AiChat from '../components/AiChat'

function MarketingTab({ aiData = {} }) {
  const { addActivity, getActivitiesByAgent } = useAgentActivityStore()
  const { version } = useDataStore()
  const { selectedShopId } = useShopStore()

  const {
    customers: MOCK_CUSTOMERS = [],
    sales: _allSales = [],
    products: MOCK_PRODUCTS = [],
    items: MOCK_ITEMS = [],
    batches: _allBatches = [],
    usedSales: _allUsedSales = [],
    promotions: MOCK_PROMOTIONS = [],
  } = aiData

  const filterShop = arr => selectedShopId === 'all' ? arr : arr.filter(s => String(s.shopId) === String(selectedShopId))

  const MOCK_SALES    = filterShop(_allSales).filter(s => s.status !== 'cancelled')
  const MOCK_USED     = _allUsedSales.filter(s => s.status !== 'cancelled')
  const MOCK_BATCHES  = filterShop(_allBatches)

  const currentMonth  = new Date().getMonth() + 1
  const thisMonthKey  = new Date().toISOString().slice(0, 7)
  const lastMonthKey  = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7)
  const seasonLabel   = currentMonth >= 3 && currentMonth <= 8 ? 'YOZ' : 'QIŠ'

  // Sotuv tezligi bo'yicha tahlil (har mahsulot)
  const productVelocity = useMemo(() => {
    const counts = {}
    const lastMonth = {}
    MOCK_SALES.forEach(s => s.items?.forEach(i => {
      const name = MOCK_PRODUCTS.find(p => p.id === i.productId)?.name || i.name || '?'
      const brand = MOCK_PRODUCTS.find(p => p.id === i.productId)?.brand || ''
      const key = name
      counts[key] = counts[key] || { name, brand, total: 0, thisMonth: 0, lastMonth: 0 }
      counts[key].total += (i.qty || 1)
      if (s.soldAt?.startsWith(thisMonthKey)) counts[key].thisMonth += (i.qty || 1)
      if (s.soldAt?.startsWith(lastMonthKey)) counts[key].lastMonth += (i.qty || 1)
    }))
    return Object.values(counts).sort((a, b) => b.total - a.total)
  }, [MOCK_SALES, MOCK_PRODUCTS, thisMonthKey, lastMonthKey])

  const topFast = productVelocity.slice(0, 5)
  const topSlow = [...productVelocity].filter(p => p.total > 0).sort((a, b) => a.total - b.total).slice(0, 5)

  // Zaxirada bor lekin hech sotilmagan tovarlar
  const shopBatchIds = new Set(MOCK_BATCHES.map(b => b.id))
  const unsoldProducts = MOCK_PRODUCTS.filter(p => {
    const hasStock = MOCK_ITEMS.some(i => i.productId === p.id && i.status === 'in_stock' && (selectedShopId === 'all' || shopBatchIds.has(i.batchId)))
    const hasSales = productVelocity.find(pv => pv.name === p.name)
    return hasStock && !hasSales
  }).slice(0, 5)

  // Mijoz segmentlari
  const vipCount    = MOCK_CUSTOMERS.filter(c => c.loyaltyLevel === 'gold').length
  const loyalCount  = MOCK_CUSTOMERS.filter(c => c.loyaltyLevel === 'silver').length
  const newCount    = MOCK_CUSTOMERS.filter(c => !c.loyaltyLevel || c.loyaltyLevel === 'none').length
  const debtorCount = MOCK_CUSTOMERS.filter(c => (c.installmentDebt || 0) > 0).length

  // Aksiyalar
  const activePromos = MOCK_PROMOTIONS.filter(p => p.isActive)

  // Bu oy vs o'tgan oy
  const thisMonthRev  = MOCK_SALES.filter(s => s.soldAt?.startsWith(thisMonthKey)).reduce((s, x) => s + x.total, 0)
  const lastMonthRev  = MOCK_SALES.filter(s => s.soldAt?.startsWith(lastMonthKey)).reduce((s, x) => s + x.total, 0)
  const revGrowth     = lastMonthRev > 0 ? (((thisMonthRev - lastMonthRev) / lastMonthRev) * 100).toFixed(1) : 'n/a'

  // Boshqa agentlar signallari
  const inventoryAlerts = getActivitiesByAgent('inventory').filter(a => a.type === 'ALERT').slice(0, 3)
  const customerAlerts  = getActivitiesByAgent('customer').filter(a => a.type === 'ALERT').slice(0, 2)

  const { loading, analysis, error, refresh } = useAgentAnalysis({
    agentId: 'pr-agent',
    enabled: MOCK_PRODUCTS.length > 0,
    buildPrompt: () => `MARKETING VA KONTENT STRATEGIYASI MA'LUMOTLARI:

📅 FASL VA DAVR:
- Hozirgi oy: ${currentMonth}-oy, fasl: ${seasonLabel}
- Bu oy sotuv: ${thisMonthRev.toLocaleString()} so'm
- O'tgan oy: ${lastMonthRev.toLocaleString()} so'm
- O'sish: ${revGrowth}%

🚀 ENG TEZ SOTILADIGAN TOVARLAR (reklama qilish shart emas, lekin upsell qilish mumkin):
${topFast.map((p, i) => `${i+1}. ${p.name} (${p.brand}): jami ${p.total} ta, bu oy ${p.thisMonth} ta, o'tgan oy ${p.lastMonth} ta`).join('\n') || 'ma\'lumot yo\'q'}

🐢 ENG SEKIN SOTILADIGAN TOVARLAR (reklama senariysi kerak!):
${topSlow.map((p, i) => `${i+1}. ${p.name} (${p.brand}): jami ${p.total} ta sotilgan`).join('\n') || 'ma\'lumot yo\'q'}

📦 ZAXIRADA BOR, HECH SOTILMAGAN TOVARLAR (tezkor reklama kerak!):
${unsoldProducts.map(p => `- ${p.name} (${p.brand || '—'})`).join('\n') || 'yo\'q'}

👥 MIJOZ BAZASI:
- VIP (oltin): ${vipCount} ta
- Sodiq (kumush): ${loyalCount} ta
- Yangi: ${newCount} ta
- Nasiyada: ${debtorCount} ta
- Jami: ${MOCK_CUSTOMERS.length} ta

🎯 FAOL AKSIYALAR:
${activePromos.length > 0 ? activePromos.map(p => `- ${p.name}: ${p.discountPercent || p.discountAmount || ''}% chegirma`).join('\n') : 'hozircha aksiya yo\'q'}

📣 BOSHQA AGENTLAR SIGNALLARI:
Ombor: ${inventoryAlerts.map(a => a.message).join('; ') || 'yo\'q'}
Mijozlar: ${customerAlerts.map(a => a.message).join('; ') || 'yo\'q'}

VAZIFALAR:
1. Sekin/sotilmagan tovarlar uchun reklama senariysi taklif qil (Higgsfield video uchun)
2. Savdoni oshirish yo'l xaritasi (1 oy, 3 oy, 6 oy)
3. VIP va yangi mijozlarga farqli yondashuv
4. Mijozlar agentiga: sodiqlik va sarafanniy reklama bo'yicha reja buyur`,
    deps: [version, selectedShopId, MOCK_PRODUCTS.length, MOCK_SALES.length, MOCK_CUSTOMERS.length],
  })

  useEffect(() => {
    if (analysis && !analysis.raw) {
      analysis.recommendations?.slice(0, 2).forEach(r => addActivity({ agentId: 'marketing', type: 'RECOMMENDATION', message: r.action }))
      analysis.alerts?.forEach(a => addActivity({ agentId: 'marketing', type: 'ALERT', message: a.message }))
    }
  }, [analysis])

  return (
    <div className="space-y-6">
      <AgentAnalysisPanel
        loading={loading}
        analysis={analysis}
        error={error}
        refresh={refresh}
        accentColor="text-[#f97316]"
      />
      <AiChat agentId="pr-agent" colorClass="accent-orange" />
    </div>
  )
}

export default MarketingTab
