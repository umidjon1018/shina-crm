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

const SYSTEM_PROMPT = `Sen GoodTires shina do'koni marketing va PR agentisan. Savdo ma'lumotlari, fasl holati va mijoz segmentatsiyasi asosida marketing strategiyasi, post rejalari va aksiyalar bo'yicha aniq JSON formatida javob berasan. Faqat o'zbek tilida yoz.`

function MarketingTab({ aiData = {} }) {
  const { t } = useTranslation()
  const { addActivity, getActivitiesByAgent } = useAgentActivityStore()
  const { version } = useDataStore()
  const { selectedShopId } = useShopStore()
  const { customers: MOCK_CUSTOMERS = [], sales: _allSales = [], products: MOCK_PRODUCTS = [] } = aiData
  const MOCK_SALES = (selectedShopId === 'all' ? _allSales : _allSales.filter(s => s.shopId === selectedShopId)).filter(s => s.status !== 'cancelled')

  const currentMonth = new Date().getMonth() + 1
  const thisMonthSales = MOCK_SALES.filter(s => s.soldAt?.startsWith(new Date().toISOString().slice(0, 7)))
  const thisMonthRev = thisMonthSales.reduce((s, x) => s + x.total, 0)

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
    systemPrompt: SYSTEM_PROMPT,
    enabled: true,
    buildPrompt: () => `MARKETING TAHLILI MA'LUMOTLARI:

Hozirgi oy: ${currentMonth}-oy (${currentMonth >= 3 && currentMonth <= 8 ? 'YOZ' : 'QIŠ'} fasl)
Bu oy sotuv: ${fmtNum(thisMonthRev, t)} so'm (${thisMonthSales.length} ta)
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

  const chatSystemPrompt = `Sen GoodTires marketing agentisan.

Holat:
- ${MOCK_CUSTOMERS.length} ta mijoz (VIP: ${vipCount}, sodiq: ${loyalCount}, yangi: ${newCount})
- Bu oy: ${fmtNum(thisMonthRev, t)} so'm sotuv
- Hozirgi fasl: ${currentMonth >= 3 && currentMonth <= 8 ? 'Yoz' : 'Qish'}
- Rejalangan postlar: ${plannedPosts} ta

O'zbek tilida qisqa javob ber.`

  return (
    <div className="space-y-6">
      <AgentAnalysisPanel
        loading={loading}
        analysis={analysis}
        error={error}
        refresh={refresh}
        accentColor="text-[#f97316]"
      />
      <AiChat agentId="pr-agent" systemPrompt={chatSystemPrompt} colorClass="accent-orange" />
    </div>
  )
}

export default MarketingTab
