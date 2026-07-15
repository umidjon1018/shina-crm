import { useEffect, useMemo } from 'react'
import { useAgentActivityStore } from '../../../store/agentActivityStore'
import { useDataStore } from '../../../store/dataStore'
import { useShopStore } from '../../../store/shopStore'
import { useAgentAnalysis } from '../hooks/useAgentAnalysis'
import AgentAnalysisPanel from '../components/AgentAnalysisPanel'
import AiChat from '../components/AiChat'

function getDaysUntilBirthday(birthDate) {
  if (!birthDate) return 999
  const today = new Date()
  const b = new Date(birthDate)
  const next = new Date(today.getFullYear(), b.getMonth(), b.getDate())
  if (next <= today) next.setFullYear(today.getFullYear() + 1)
  return Math.ceil((next - today) / 86400000)
}

function CustomerTab({ aiData = {} }) {
  const { addActivity } = useAgentActivityStore()
  const { version } = useDataStore()
  const { selectedShopId } = useShopStore()

  const {
    customers: MOCK_CUSTOMERS = [],
    sales: _allSales = [],
    products: MOCK_PRODUCTS = [],
    promotions: MOCK_PROMOTIONS = [],
  } = aiData

  const filterShop = arr => selectedShopId === 'all' ? arr : arr.filter(s => String(s.shopId) === String(selectedShopId))

  const shopCustomers = selectedShopId === 'all'
    ? MOCK_CUSTOMERS
    : MOCK_CUSTOMERS.filter(c => !c.shopId || String(c.shopId) === String(selectedShopId))

  const allSales    = filterShop(_allSales)
  const completedSales   = allSales.filter(s => s.status !== 'cancelled')
  const cancelledSales   = allSales.filter(s => s.status === 'cancelled' && !s._isExchange)
  const exchangedSales   = allSales.filter(s => s._isExchange)

  // Har mijoz uchun xarid profili
  const customerProfiles = useMemo(() => {
    const map = {}
    shopCustomers.forEach(c => {
      map[c.id] = {
        id: c.id, name: c.name, phone: c.phone,
        loyaltyLevel: c.loyaltyLevel || 'none',
        birthDate: c.birthDate,
        installmentDebt: c.installmentDebt || 0,
        totalSpend: 0, totalOrders: 0, cancelCount: 0,
        discountUsed: 0, lastSaleDate: null, categories: {},
      }
    })

    completedSales.forEach(s => {
      if (!s.customerId || !map[s.customerId]) return
      const p = map[s.customerId]
      p.totalSpend  += s.total || 0
      p.totalOrders += 1
      p.discountUsed += s.discountAmount || 0
      if (!p.lastSaleDate || s.soldAt > p.lastSaleDate) p.lastSaleDate = s.soldAt
      s.items?.forEach(i => {
        const cat = MOCK_PRODUCTS.find(pr => pr.id === i.productId)?.category || 'other'
        p.categories[cat] = (p.categories[cat] || 0) + (i.qty || 1)
      })
    })

    cancelledSales.forEach(s => {
      if (s.customerId && map[s.customerId]) map[s.customerId].cancelCount++
    })

    return Object.values(map)
  }, [shopCustomers, completedSales, cancelledSales, MOCK_PRODUCTS])

  // Segmentlar
  const vipCustomers     = shopCustomers.filter(c => c.loyaltyLevel === 'gold')
  const loyalCustomers   = shopCustomers.filter(c => c.loyaltyLevel === 'silver')
  const newCustomers     = shopCustomers.filter(c => !c.loyaltyLevel || c.loyaltyLevel === 'none')
  const debtors          = shopCustomers.filter(c => (c.installmentDebt || 0) > 0)
  const totalDebt        = debtors.reduce((s, c) => s + (c.installmentDebt || 0), 0)

  // Tug'ilgan kun
  const birthdaySoon7    = shopCustomers.filter(c => getDaysUntilBirthday(c.birthDate) <= 7)
  const birthdaySoon30   = shopCustomers.filter(c => getDaysUntilBirthday(c.birthDate) <= 30)

  // Xavfli mijozlar (6 oydan ko'p kelmagan, lekin oldin xarid qilgan)
  const sixMonthsAgo = new Date(Date.now() - 180 * 86400000).toISOString()
  const atRiskCustomers = customerProfiles
    .filter(p => p.totalOrders > 0 && p.lastSaleDate && p.lastSaleDate < sixMonthsAgo)
    .sort((a, b) => b.totalSpend - a.totalSpend)
    .slice(0, 5)

  // Eng ko'p chegirma ishlatganlar (chegirmaga sezgir)
  const discountSensitive = customerProfiles
    .filter(p => p.discountUsed > 0)
    .sort((a, b) => b.discountUsed - a.discountUsed)
    .slice(0, 5)

  // Bekor qilish sababi — kategoriya bo'yicha
  const cancelReasons = {}
  cancelledSales.forEach(s => {
    const r = s.cancelReason || 'Sabab ko\'rsatilmagan'
    cancelReasons[r] = (cancelReasons[r] || 0) + 1
  })
  const topCancelReasons = Object.entries(cancelReasons).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // Top xaridorlar
  const topCustomers = [...customerProfiles]
    .sort((a, b) => b.totalSpend - a.totalSpend)
    .slice(0, 5)

  // Aksiyalar
  const activePromos = MOCK_PROMOTIONS.filter(p => p.isActive)

  const { loading, analysis, error, refresh } = useAgentAnalysis({
    agentId: 'customer-agent',
    enabled: shopCustomers.length > 0,
    buildPrompt: () => `MIJOZLAR TAHLILI — TO'LIQ MA'LUMOT:

👥 UMUMIY:
- Jami mijozlar: ${shopCustomers.length} ta
- VIP (oltin): ${vipCustomers.length} ta
- Sodiq (kumush): ${loyalCustomers.length} ta
- Yangi: ${newCustomers.length} ta
- Nasiya qarzdor: ${debtors.length} ta, umumiy qarz: ${totalDebt.toLocaleString()} so'm
- 7 kun ichida tug'ilgan kun: ${birthdaySoon7.length} ta (30 kun: ${birthdaySoon30.length} ta)

🎂 YAQIN TUG'ILGAN KUNLAR (7 kun):
${birthdaySoon7.slice(0, 5).map(c => `- ${c.name} (${c.phone}): ${getDaysUntilBirthday(c.birthDate)} kun qoldi`).join('\n') || 'yo\'q'}

🏆 ENG KO'P XARID QILGANLAR (top-5):
${topCustomers.map((p, i) => `${i+1}. ${p.name}: ${p.totalOrders} ta xarid, ${p.totalSpend.toLocaleString()} so'm, chegirma: ${p.discountUsed.toLocaleString()} so'm`).join('\n') || 'yo\'q'}

⚠️ XAVF OSTIDAGI MIJOZLAR (6 oydan beri kelmagan, lekin oldin faol bo'lgan):
${atRiskCustomers.map(p => `- ${p.name}: oxirgi xarid ${p.lastSaleDate?.slice(0, 10)}, jami ${p.totalSpend.toLocaleString()} so'm sarflagan`).join('\n') || 'yo\'q'}

💰 CHEGIRMAGA SEZGIR MIJOZLAR (top-5):
${discountSensitive.map(p => `- ${p.name}: ${p.discountUsed.toLocaleString()} so'm chegirma olgan, ${p.totalOrders} ta xarid`).join('\n') || 'yo\'q'}

❌ BEKOR QILISHLAR:
- Jami bekor: ${cancelledSales.length} ta
- Almashtirish: ${exchangedSales.length} ta
- Bekor sabablari:
${topCancelReasons.map(([r, n]) => `  • ${r}: ${n} ta`).join('\n') || '  sabab ko\'rsatilmagan'}

🎯 FAOL AKSIYALAR: ${activePromos.length > 0 ? activePromos.map(p => p.name).join(', ') : 'yo\'q'}

VAZIFALAR:
1. Xavf ostidagi mijozlarni qayta jalb qilish rejasi
2. Chegirmaga sezgirlarga optimal taklif strategiyasi
3. Tug'ilgan kunlilarga Telegram tabrik xabari rejasi
4. Bekor qilishlarning asosiy sababini bartaraf etish choralari
5. Marketing agenti bilan: sodiqlik va sarafanniy reklama rejasi`,
    deps: [version, selectedShopId, shopCustomers.length, completedSales.length],
  })

  useEffect(() => {
    if (analysis && !analysis.raw) {
      analysis.alerts?.forEach(a => addActivity({ agentId: 'customer', type: 'ALERT', message: a.message }))
      analysis.recommendations?.slice(0, 2).forEach(r => addActivity({ agentId: 'customer', type: 'RECOMMENDATION', message: r.action }))
    }
  }, [analysis])

  return (
    <div className="space-y-6">
      <AgentAnalysisPanel
        loading={loading}
        analysis={analysis}
        error={error}
        refresh={refresh}
        accentColor="text-[#3b82f6]"
      />
      <AiChat agentId="customer-agent" colorClass="accent-blue" />
    </div>
  )
}

export default CustomerTab
