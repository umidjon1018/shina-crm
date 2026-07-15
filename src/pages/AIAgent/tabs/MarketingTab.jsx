import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAgentActivityStore } from '../../../store/agentActivityStore'
import { useDataStore } from '../../../store/dataStore'
import { useShopStore } from '../../../store/shopStore'
import { MOCK_CALENDAR } from '../../../constants/calendar'
import { fmtNum } from '../aiHelpers'
import { useAgentAnalysis } from '../hooks/useAgentAnalysis'
import AgentAnalysisPanel from '../components/AgentAnalysisPanel'
import AiChat from '../components/AiChat'


function MarketingTab({ aiData = {} }) {
  const { t } = useTranslation()
  const { addActivity, getActivitiesByAgent } = useAgentActivityStore()
  const { version } = useDataStore()
  const { selectedShopId } = useShopStore()
  const { customers: MOCK_CUSTOMERS = [], sales: _allSales = [], products: MOCK_PRODUCTS = [], usedSales: _allUsedSales = [] } = aiData
  const MOCK_SALES = (selectedShopId === 'all' ? _allSales : _allSales.filter(s => s.shopId === selectedShopId)).filter(s => s.status !== 'cancelled')
  const MOCK_USED_COMPLETED = _allUsedSales.filter(s => s.status !== 'cancelled')

  const currentMonth = new Date().getMonth() + 1
  const thisMonthKey = new Date().toISOString().slice(0, 7)
  const thisMonthSales = MOCK_SALES.filter(s => s.soldAt?.startsWith(thisMonthKey))
  const thisMonthUsed = MOCK_USED_COMPLETED.filter(s => s.soldAt?.startsWith(thisMonthKey))
  const thisMonthRev = thisMonthSales.reduce((s, x) => s + x.total, 0) + thisMonthUsed.reduce((s, x) => s + (x.total || 0), 0)

  // Segmentlar
  const vipCount = MOCK_CUSTOMERS.filter(c => c.loyaltyLevel === 'gold').length
  const loyalCount = MOCK_CUSTOMERS.filter(c => c.loyaltyLevel === 'silver').length
  const newCount = MOCK_CUSTOMERS.filter(c => !c.loyaltyLevel || c.loyaltyLevel === 'none').length

  // Eng ko'p sotilgan tovarlar
  const productSales = {}
  MOCK_SALES.forEach(s => s.items?.forEach(i => {
    const name = MOCK_PRODUCTS.find(p => p.id === i.productId)?.name || i.name || '?'
    productSales[name] = (productSales[name] || 0) + (i.qty || 1)
  }))
  const topProducts = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // Boshqa agentlardan signallar
  const inventoryAlerts = getActivitiesByAgent('inventory').filter(a => a.type === 'ALERT').slice(0, 3)
  const salesAlerts = getActivitiesByAgent('sales').filter(a => a.type === 'ALERT').slice(0, 3)

  // Calendar
  const plannedPosts = MOCK_CALENDAR?.length || 0

  const { loading, analysis, error, refresh } = useAgentAnalysis({
    agentId: 'pr-agent',
    enabled: true,
    buildPrompt: () => `MARKETING TAHLILI MA'LUMOTLARI:

Hozirgi oy: ${currentMonth}-oy (${currentMonth >= 3 && currentMonth <= 8 ? 'YOZ' : 'QIŠ'} fasl)
Bu oy sotuv: ${fmtNum(thisMonthRev, t)} so'm (yangi: ${thisMonthSales.length} ta, B/U: ${thisMonthUsed.length} ta)
Rejalangan postlar: ${plannedPosts} ta

MIJOZ SEGMENTLARI:
- VIP (oltin): ${vipCount} ta
- Sodiq (kumush): ${loyalCount} ta
- Yangi: ${newCount} ta
- Jami: ${MOCK_CUSTOMERS.length} ta

ENG KO'P SOTILGAN TOVARLAR (top-5):
${topProducts.map(([ name, qty], i) => `${i+1}. ${name}: ${qty} ta`).join('\n') || 'ma\'lumot yo\'q'}

BOSHQA AGENTLARDAN SIGNALLAR:
Ombor ogohlantirishlari: ${inventoryAlerts.map(a => a.message).join('; ') || 'yo\'q'}
Savdo ogohlantirishlari: ${salesAlerts.map(a => a.message).join('; ') || 'yo\'q'}

Marketing strategiyasi uchun: fasl, top mahsulotlar, VIP mijozlar va agentlar signallarini hisobga ol.`,
    deps: [version, selectedShopId, MOCK_CUSTOMERS.length, MOCK_SALES.length],
  })

  useEffect(() => {
    if (analysis && !analysis.raw) {
      analysis.recommendations?.slice(0, 2).forEach(r => addActivity({ agentId: 'marketing', type: 'RECOMMENDATION', message: r.action }))
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
