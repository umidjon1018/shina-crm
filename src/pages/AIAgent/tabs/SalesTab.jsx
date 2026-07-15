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


function SalesTab({ aiData = {} }) {
  const { t } = useTranslation()
  const { addActivity } = useAgentActivityStore()
  const { version } = useDataStore()
  const { selectedShopId } = useShopStore()

  const {
    sales: _allSales = [],
    usedSales: _allUsedSales = [],
    batches: _allBatches = [],
    expenses: _allExpenses = [],
    capital: _allCapital = [],
    customers: MOCK_CUSTOMERS = [],
    promotions: MOCK_PROMOTIONS = [],
  } = aiData

  const filterShop = arr => selectedShopId === 'all' ? arr : arr.filter(x => String(x.shopId) === String(selectedShopId))

  const MOCK_SALES        = filterShop(_allSales)
  const MOCK_USED_SALES   = filterShop(_allUsedSales)
  const MOCK_BATCHES      = filterShop(_allBatches)
  const MOCK_EXPENSES     = filterShop(_allExpenses)
  const MOCK_CAPITAL      = filterShop(_allCapital)

  const completedSales    = MOCK_SALES.filter(s => s.status !== 'cancelled')
  const cancelledSales    = MOCK_SALES.filter(s => s.status === 'cancelled')
  const realCancelled     = cancelledSales.filter(s => !s._isExchange)
  const exchanged         = cancelledSales.filter(s => s._isExchange)
  const usedCompleted     = MOCK_USED_SALES.filter(s => s.status !== 'cancelled')

  // ---- SOTUV ----
  const newRevenue  = completedSales.reduce((s, x) => s + (x.total || 0), 0)
  const usedRevenue = usedCompleted.reduce((s, x) => s + (x.total || 0), 0)
  const totalRevenue = newRevenue + usedRevenue

  const newProfit  = completedSales.reduce((s, x) => s + getSaleProfit(x) - (x.paymentType === 'installment' ? (x.installmentCommissionAmount ?? 0) : 0), 0)
  const usedProfit = usedCompleted.reduce((s, x) => s + getSaleProfit(x) - (x.paymentType === 'installment' ? (x.installmentCommissionAmount ?? 0) : 0), 0)
  const totalProfit = newProfit + usedProfit

  const avgMargin   = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0
  const returnRate  = MOCK_SALES.length > 0 ? ((realCancelled.length / MOCK_SALES.length) * 100).toFixed(1) : 0

  // To'lov turi
  const payStats = useMemo(() => {
    const map = { cash: 0, card: 0, installment: 0 }
    ;[...completedSales, ...usedCompleted].forEach(s => { if (map[s.paymentType] !== undefined) map[s.paymentType]++ })
    return map
  }, [completedSales, usedCompleted])

  // Nasiya qarzlari (sotuv)
  const installmentSales    = completedSales.filter(s => s.paymentType === 'installment')
  const installmentDebt     = installmentSales.reduce((s, x) => s + (x.remainingDebt ?? 0), 0)
  const installmentReceived = installmentSales.reduce((s, x) => s + ((x.total || 0) - (x.remainingDebt ?? 0)), 0)

  // ---- KIRIM (Batches) ----
  const totalIncomeUSD     = MOCK_BATCHES.reduce((s, b) => s + (b.totalUSD || 0), 0)
  const totalPaidUSD       = MOCK_BATCHES.reduce((s, b) => s + (b.paidUSD || 0), 0)
  const totalDebtUSD       = MOCK_BATCHES.reduce((s, b) => s + (b.debtUSD || 0), 0)
  const unpaidBatches      = MOCK_BATCHES.filter(b => b.paymentStatus !== 'paid')
  const supplierMap        = useMemo(() => {
    const m = {}
    MOCK_BATCHES.forEach(b => {
      const name = b.supplierName || 'Noma\'lum'
      if (!m[name]) m[name] = { name, totalUSD: 0, paidUSD: 0, debtUSD: 0, count: 0 }
      m[name].totalUSD += b.totalUSD || 0
      m[name].paidUSD  += b.paidUSD  || 0
      m[name].debtUSD  += b.debtUSD  || 0
      m[name].count++
    })
    return Object.values(m).sort((a, b) => b.debtUSD - a.debtUSD)
  }, [MOCK_BATCHES])

  // ---- XARAJATLAR ----
  const totalExpenses   = MOCK_EXPENSES.reduce((s, e) => s + (e.amountUZS || 0), 0)
  const salaryExp       = MOCK_EXPENSES.filter(e => e.categoryId === '1' || (e.note || '').toLowerCase().includes('oylik')).reduce((s, e) => s + (e.amountUZS || 0), 0)
  const rentExp         = MOCK_EXPENSES.filter(e => e.categoryId === '2' || (e.note || '').toLowerCase().includes('ijara')).reduce((s, e) => s + (e.amountUZS || 0), 0)
  const otherExp        = totalExpenses - salaryExp - rentExp

  // ---- KAPITAL / JALB QILINGAN PULLAR ----
  const invested   = MOCK_CAPITAL.filter(c => c.type === 'invested').reduce((s, c) => s + (c.amountUZS || 0), 0)
  const withdrawn  = MOCK_CAPITAL.filter(c => c.type === 'withdrawn').reduce((s, c) => s + (c.amountUZS || 0), 0)
  const loan       = MOCK_CAPITAL.filter(c => c.type === 'loan').reduce((s, c) => s + (c.amountUZS || 0), 0)
  const loanRepaid = MOCK_CAPITAL.filter(c => c.type === 'loan_repaid').reduce((s, c) => s + (c.amountUZS || 0), 0)
  const netCapital = invested - withdrawn + loan - loanRepaid

  // ---- CHEGIRMALAR / AKSIYALAR ----
  const discountLoss = useMemo(() => {
    let loss = 0
    completedSales.forEach(s => s.items?.forEach(i => {
      if (i.discountAmount) loss += i.discountAmount
    }))
    return loss
  }, [completedSales])

  const loyaltyDiscountLoss = useMemo(() => {
    let loss = 0
    completedSales.forEach(s => {
      if (s.loyaltyDiscount) loss += s.loyaltyDiscount
    })
    return loss
  }, [completedSales])

  // Filiallar bo'yicha
  const shopBreakdown = useMemo(() => {
    if (selectedShopId !== 'all') return []
    const m = {}
    ;[..._allSales.filter(s => s.status !== 'cancelled'), ..._allUsedSales.filter(s => s.status !== 'cancelled')].forEach(s => {
      const sid = s.shopId || 'unknown'
      const sname = s.shopName || `Do'kon ${sid}`
      if (!m[sid]) m[sid] = { sid, name: sname, sales: 0, revenue: 0, profit: 0 }
      m[sid].sales++
      m[sid].revenue += s.total || 0
      m[sid].profit  += getSaleProfit(s)
    })
    return Object.values(m).sort((a, b) => b.revenue - a.revenue)
  }, [_allSales, _allUsedSales, selectedShopId])

  // Shu oy
  const thisMonth     = new Date().toISOString().slice(0, 7)
  const thisMonthSales = completedSales.filter(s => s.soldAt?.startsWith(thisMonth))
  const thisMonthRev   = thisMonthSales.reduce((s, x) => s + x.total, 0)

  const enabled = MOCK_SALES.length > 0 || MOCK_BATCHES.length > 0 || MOCK_EXPENSES.length > 0

  const { loading, analysis, error, refresh } = useAgentAnalysis({
    agentId: 'sales-agent',
    enabled,
    buildPrompt: () => {
      const shopLines = shopBreakdown.length > 1
        ? `\nFILIALLAR BO'YICHA:\n${shopBreakdown.map((sh, i) => `${i+1}. ${sh.name}: ${sh.sales} ta sotuv, ${fmtNum(sh.revenue, t)} so'm tushum, ${fmtNum(sh.profit, t)} so'm foyda`).join('\n')}`
        : ''

      return `MOLIYAVIY TAHLIL MA'LUMOTLARI:

📦 KIRIM (YETKAZIB BERUVCHILAR):
- Jami kirim: $${totalIncomeUSD.toFixed(0)} USD
- To'langan: $${totalPaidUSD.toFixed(0)} | Qarz: $${totalDebtUSD.toFixed(0)}
- To'lanmagan partiyalar: ${unpaidBatches.length} ta
${supplierMap.slice(0, 4).map((s, i) => `  ${i+1}. ${s.name}: $${s.totalUSD.toFixed(0)} (qarz: $${s.debtUSD.toFixed(0)})`).join('\n')}

💰 SOTUV:
- Tugallangan: ${completedSales.length} ta yangi + ${usedCompleted.length} ta B/U = ${completedSales.length + usedCompleted.length} ta
- Bekor (pul qaytarilgan — savdo hisoblanmaydi): ${realCancelled.length} ta
- Almashtirish (bekor emas, yangi sotuv boʻldi): ${exchanged.length} ta
- Bekor foizi: ${returnRate}% (${realCancelled.length} ta haqiqiy bekor / ${completedSales.length + realCancelled.length + exchanged.length} ta yangi sotuv urinish)
- Tushum: ${fmtNum(totalRevenue, t)} so'm (yangi: ${fmtNum(newRevenue, t)}, B/U: ${fmtNum(usedRevenue, t)})
- Sof foyda: ${fmtNum(totalProfit, t)} so'm (yangi: ${fmtNum(newProfit, t)}, B/U: ${fmtNum(usedProfit, t)})
- Marja: ${avgMargin}%
- To'lov: naqd ${payStats.cash} ta, karta ${payStats.card} ta, nasiya ${payStats.installment} ta
- Shu oy: ${fmtNum(thisMonthRev, t)} so'm (${thisMonthSales.length} ta)

📋 NASIYA QARZLARI (sotuv):
- Nasiya savdolar: ${installmentSales.length} ta
- Qabul qilingan: ${fmtNum(installmentReceived, t)} so'm
- Qolgan qarz: ${fmtNum(installmentDebt, t)} so'm

💸 XARAJATLAR:
- Jami: ${fmtNum(totalExpenses, t)} so'm
- Oyliklar: ${fmtNum(salaryExp, t)} so'm | Ijara: ${fmtNum(rentExp, t)} so'm | Boshqa: ${fmtNum(otherExp, t)} so'm
- Sof pul oqimi (foyda - xarajat): ${fmtNum(totalProfit - totalExpenses, t)} so'm

🏦 JALB QILINGAN MABLAG'LAR:
- Kiritilgan kapital: ${fmtNum(invested, t)} so'm
- Olingan qarz: ${fmtNum(loan, t)} so'm | Qaytarilgan: ${fmtNum(loanRepaid, t)} so'm
- Chiqarilgan: ${fmtNum(withdrawn, t)} so'm
- Sof kapital: ${fmtNum(netCapital, t)} so'm

🎁 CHEGIRMALAR VA AKSIYALAR:
- Chegirma evaziga yo'qotilgan: ${fmtNum(discountLoss, t)} so'm
- Sodiqlik bonus yo'qotishlari: ${fmtNum(loyaltyDiscountLoss, t)} so'm
- Aksiyalar soni: ${MOCK_PROMOTIONS.length} ta
- Mijozlar: ${MOCK_CUSTOMERS.length} ta (VIP: ${MOCK_CUSTOMERS.filter(c => c.loyaltyLevel === 'gold').length}, sodiq: ${MOCK_CUSTOMERS.filter(c => c.loyaltyLevel === 'silver').length})
${shopLines}`
    },
    deps: [version, selectedShopId, completedSales.length, totalRevenue, totalExpenses, MOCK_BATCHES.length],
  })

  useEffect(() => {
    if (analysis && !analysis.raw) {
      analysis.alerts?.forEach(a => addActivity({ agentId: 'sales', type: 'ALERT', message: a.message }))
      analysis.recommendations?.slice(0, 2).forEach(r => addActivity({ agentId: 'sales', type: 'RECOMMENDATION', message: r.action }))
    }
  }, [analysis])


  const salesSystemPrompt = useMemo(() => `Sen SAVDO AGENTI — shina/g'ildirak do'kon CRM tizimining moliyaviy tahlilchisisisan.

=== JORIY MOLIYAVIY MA'LUMOT ===
Sotuvlar: ${completedSales.length} ta yangi + ${usedCompleted.length} ta B/U = ${completedSales.length + usedCompleted.length} ta jami
Tushum: ${totalRevenue.toLocaleString()} so'm (yangi: ${newRevenue.toLocaleString()}, B/U: ${usedRevenue.toLocaleString()})
Sof foyda: ${totalProfit.toLocaleString()} so'm | Marja: ${avgMargin}%
Bekor (haqiqiy): ${realCancelled.length} ta (${returnRate}%) | Almashtirish: ${exchanged.length} ta
To'lov: naqd ${payStats.cash} ta, karta ${payStats.card} ta, nasiya ${payStats.installment} ta
Shu oy: ${thisMonthSales.length} ta sotuv, ${thisMonthRev.toLocaleString()} so'm

Kirim (yetkazib beruvchilar): $${totalIncomeUSD.toFixed(0)} USD | Qarz: $${totalDebtUSD.toFixed(0)}
Nasiya qarz (sotuvdan): ${installmentDebt.toLocaleString()} so'm | Qabul qilingan: ${installmentReceived.toLocaleString()} so'm
Xarajatlar: ${totalExpenses.toLocaleString()} so'm (oylik: ${salaryExp.toLocaleString()}, ijara: ${rentExp.toLocaleString()})
Sof pul oqimi: ${(totalProfit - totalExpenses).toLocaleString()} so'm
Kapital: kiritilgan ${invested.toLocaleString()}, chiqarilgan ${withdrawn.toLocaleString()}, qarz ${loan.toLocaleString()}, sof: ${netCapital.toLocaleString()} so'm
Chegirma yo'qotish: ${discountLoss.toLocaleString()} so'm | Sodiqlik bonus: ${loyaltyDiscountLoss.toLocaleString()} so'm

JAVOB USLUBI: O'zbek tilida, qisqa va aniq. Raqamlar bilan konkret misollar keltir.`, [completedSales.length, usedCompleted.length, totalRevenue, totalProfit, avgMargin, returnRate, totalExpenses, installmentDebt, netCapital])

  return (
    <div className="space-y-6">
      <AgentAnalysisPanel
        loading={loading}
        analysis={analysis}
        error={error}
        refresh={refresh}
        accentColor="text-[#22c55e]"
      />
      <AiChat agentId="sales-agent" colorClass="accent-green" systemPrompt={salesSystemPrompt} placeholder="Savdo, foyda, xarajat haqida so'rang..." />
    </div>
  )
}

export default SalesTab
