import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAgentActivityStore } from '../../../store/agentActivityStore'
import { useDataStore } from '../../../store/dataStore'
import { useShopStore } from '../../../store/shopStore'
import { fmtNum } from '../aiHelpers'
import { useAgentAnalysis } from '../hooks/useAgentAnalysis'
import AgentAnalysisPanel from '../components/AgentAnalysisPanel'
import AiChat from '../components/AiChat'

const SYSTEM_PROMPT = `Sen GoodTires shina do'koni mijozlar munosabatlari agentisan. Berilgan mijoz ma'lumotlarini tahlil qilib, mijoz segmentatsiyasi, loyallik holati, tug'ilgan kunlar va nasiya bo'yicha aniq JSON formatida javob berasan. Faqat o'zbek tilida yoz.`

function getDaysUntilBirthday(birthDate) {
  if (!birthDate) return 999
  const today = new Date()
  const b = new Date(birthDate)
  const next = new Date(today.getFullYear(), b.getMonth(), b.getDate())
  if (next <= today) next.setFullYear(today.getFullYear() + 1)
  return Math.ceil((next - today) / 86400000)
}

function CustomerTab({ aiData = {} }) {
  const { t } = useTranslation()
  const { addActivity } = useAgentActivityStore()
  const { version } = useDataStore()
  const { selectedShopId } = useShopStore()
  const { customers: MOCK_CUSTOMERS = [], sales: _allSales = [] } = aiData
  const shopCustomers = selectedShopId === 'all' ? MOCK_CUSTOMERS : MOCK_CUSTOMERS.filter(c => !c.shopId || c.shopId === selectedShopId)
  const MOCK_SALES = (selectedShopId === 'all' ? _allSales : _allSales.filter(s => s.shopId === selectedShopId)).filter(s => s.status !== 'cancelled')

  // Statistika
  const totalCustomers = shopCustomers.length
  const birthdaySoon = shopCustomers.filter(c => getDaysUntilBirthday(c.birthDate) <= 7)
  const vipCustomers = shopCustomers.filter(c => c.loyaltyLevel === 'gold' || c.segment === 'vip')
  const loyalCustomers = shopCustomers.filter(c => c.loyaltyLevel === 'silver' || c.segment === 'loyal')
  const installmentCustomers = shopCustomers.filter(c => c.installmentDebt > 0)
  const totalDebt = installmentCustomers.reduce((s, c) => s + (c.installmentDebt || 0), 0)

  // Top mijozlar (sotuvlar bo'yicha)
  const customerSpend = {}
  MOCK_SALES.forEach(s => { if (s.customerId) customerSpend[s.customerId] = (customerSpend[s.customerId] || 0) + s.total })
  const topCustomers = shopCustomers
    .map(c => ({ ...c, spend: customerSpend[c.id] || 0 }))
    .filter(c => c.spend > 0)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5)

  const { loading, analysis, error, refresh } = useAgentAnalysis({
    agentId: 'customer-agent',
    systemPrompt: SYSTEM_PROMPT,
    enabled: shopCustomers.length > 0,
    buildPrompt: () => `MIJOZLAR TAHLILI MA'LUMOTLARI:

Jami mijozlar: ${totalCustomers} ta
VIP mijozlar (oltin): ${vipCustomers.length} ta
Sodiq mijozlar (kumush): ${loyalCustomers.length} ta
Nasiya qarzdorlar: ${installmentCustomers.length} ta, umumiy qarz: ${fmtNum(totalDebt, t)} so'm
7 kun ichida tug'ilgan kun: ${birthdaySoon.length} ta

Tug'ilgan kun yaqin mijozlar:
${birthdaySoon.slice(0, 5).map(c => `- ${c.name}: ${getDaysUntilBirthday(c.birthDate)} kundan keyin`).join('\n') || 'yo\'q'}

Eng ko'p xarid qilgan mijozlar (top-5):
${topCustomers.map((c, i) => `${i+1}. ${c.name}: ${fmtNum(c.spend, t)} so'm xarid`).join('\n') || 'ma\'lumot yo\'q'}

Nasiya qaydlar (eng katta qarz):
${installmentCustomers.sort((a,b) => b.installmentDebt - a.installmentDebt).slice(0, 5).map(c => `- ${c.name}: ${fmtNum(c.installmentDebt, t)} so'm qarz`).join('\n') || 'yo\'q'}`,
    deps: [version, selectedShopId, shopCustomers.length],
  })

  useEffect(() => {
    if (analysis && !analysis.raw) {
      analysis.alerts?.forEach(a => addActivity({ agentId: 'customer', type: 'ALERT', message: a.message }))
      analysis.recommendations?.slice(0, 2).forEach(r => addActivity({ agentId: 'customer', type: 'RECOMMENDATION', message: r.action }))
    }
  }, [analysis])

  const chatSystemPrompt = `Sen GoodTires mijozlar munosabatlari agentisan.

Mijoz holati:
- Jami: ${totalCustomers} ta mijoz
- VIP: ${vipCustomers.length} ta
- Nasiya qaydlar: ${installmentCustomers.length} ta (${fmtNum(totalDebt, t)} so'm)
- Tug'ilgan kun yaqin: ${birthdaySoon.length} ta

O'zbek tilida qisqa javob ber.`

  return (
    <div className="space-y-6">
      <AgentAnalysisPanel
        loading={loading}
        analysis={analysis}
        error={error}
        refresh={refresh}
        accentColor="text-[#3b82f6]"
      />
      <AiChat agentId="customer-agent" systemPrompt={chatSystemPrompt} colorClass="accent-blue" />
    </div>
  )
}

export default CustomerTab
