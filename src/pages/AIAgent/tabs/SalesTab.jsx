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


function SalesTab({ aiData = {}, agentConfig = null }) {
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
  const hasTool = name => !agentConfig?.tools?.length || agentConfig.tools.includes(name)

  const { loading, analysis, error, refresh } = useAgentAnalysis({
    agentId: 'sales-agent',
    enabled,
    buildPrompt: () => {
      const role = agentConfig?.systemPrompt || "Sen GoodTires do'konining SAVDO VA MOLIYA AGENTISAN."
      const shopLines = shopBreakdown.length > 1
        ? `\nFILIALLAR BO'YICHA:\n${shopBreakdown.map((sh, i) => `${i+1}. ${sh.name}: ${sh.sales} ta sotuv, ${fmtNum(sh.revenue, t)} so'm tushum, ${fmtNum(sh.profit, t)} so'm foyda`).join('\n')}`
        : ''
      const parts = [role, '']
      if (hasTool('get_supplier_debts'))   parts.push(`📦 KIRIM (YETKAZIB BERUVCHILAR):\n- Jami kirim: $${totalIncomeUSD.toFixed(0)} USD\n- To'langan: $${totalPaidUSD.toFixed(0)} | Qarz: $${totalDebtUSD.toFixed(0)}\n- To'lanmagan partiyalar: ${unpaidBatches.length} ta\n${supplierMap.slice(0, 4).map((s, i) => `  ${i+1}. ${s.name}: $${s.totalUSD.toFixed(0)} (qarz: $${s.debtUSD.toFixed(0)})`).join('\n')}`)
      if (hasTool('get_sales_summary'))    parts.push(`💰 SOTUV:\n- Tugallangan: ${completedSales.length} ta yangi + ${usedCompleted.length} ta B/U = ${completedSales.length + usedCompleted.length} ta\n- Bekor (pul qaytarilgan): ${realCancelled.length} ta | Almashtirish: ${exchanged.length} ta\n- Bekor foizi: ${returnRate}%\n- Tushum: ${fmtNum(totalRevenue, t)} so'm | Sof foyda: ${fmtNum(totalProfit, t)} so'm | Marja: ${avgMargin}%\n- To'lov: naqd ${payStats.cash} ta, karta ${payStats.card} ta, nasiya ${payStats.installment} ta\n- Shu oy: ${fmtNum(thisMonthRev, t)} so'm (${thisMonthSales.length} ta)${shopLines}`)
      if (hasTool('get_customer_debts'))   parts.push(`📋 NASIYA QARZLARI:\n- Nasiya savdolar: ${installmentSales.length} ta\n- Qabul qilingan: ${fmtNum(installmentReceived, t)} so'm | Qolgan qarz: ${fmtNum(installmentDebt, t)} so'm`)
      if (hasTool('get_expenses_summary')) parts.push(`💸 XARAJATLAR:\n- Jami: ${fmtNum(totalExpenses, t)} so'm\n- Oyliklar: ${fmtNum(salaryExp, t)} | Ijara: ${fmtNum(rentExp, t)} | Boshqa: ${fmtNum(otherExp, t)}\n- Sof pul oqimi: ${fmtNum(totalProfit - totalExpenses, t)} so'm`)
      if (hasTool('get_capital_summary'))  parts.push(`🏦 KAPITAL:\n- Kiritilgan: ${fmtNum(invested, t)} | Chiqarilgan: ${fmtNum(withdrawn, t)} | Qarz: ${fmtNum(loan, t)} | Sof: ${fmtNum(netCapital, t)} so'm`)
      if (hasTool('get_discounts_summary'))parts.push(`🎁 CHEGIRMALAR:\n- Yo'qotish: ${fmtNum(discountLoss, t)} so'm | Sodiqlik bonus: ${fmtNum(loyaltyDiscountLoss, t)} so'm\n- Aksiyalar: ${MOCK_PROMOTIONS.length} ta | Mijozlar: ${MOCK_CUSTOMERS.length} ta (VIP: ${MOCK_CUSTOMERS.filter(c => c.loyaltyLevel === 'gold').length}, sodiq: ${MOCK_CUSTOMERS.filter(c => c.loyaltyLevel === 'silver').length})`)
      return parts.join('\n')
    },
    deps: [version, selectedShopId, completedSales.length, totalRevenue, totalExpenses, MOCK_BATCHES.length, agentConfig?.tools?.join()],
  })

  useEffect(() => {
    if (analysis && !analysis.raw) {
      analysis.alerts?.forEach(a => addActivity({ agentId: 'sales', type: 'ALERT', message: a.message }))
      analysis.recommendations?.slice(0, 2).forEach(r => addActivity({ agentId: 'sales', type: 'RECOMMENDATION', message: r.action }))
    }
  }, [analysis])


  const salesSystemPrompt = useMemo(() => {
    const base = agentConfig?.systemPrompt || "Sen GoodTires do'konining SAVDO VA MOLIYA AGENTISAN."
    const ctx = []
    if (hasTool('get_sales_summary'))    ctx.push(`Sotuvlar: ${completedSales.length+usedCompleted.length} ta | Tushum: ${totalRevenue.toLocaleString()} so'm | Foyda: ${totalProfit.toLocaleString()} so'm | Marja: ${avgMargin}% | Bekor: ${realCancelled.length} ta (${returnRate}%) | Shu oy: ${thisMonthSales.length} ta`)
    if (hasTool('get_supplier_debts'))   ctx.push(`Yetkazib beruvchi qarz: $${totalDebtUSD.toFixed(0)} USD (${unpaidBatches.length} ta to'lanmagan partiya)`)
    if (hasTool('get_customer_debts'))   ctx.push(`Nasiya qarz: ${installmentDebt.toLocaleString()} so'm (${installmentSales.length} ta nasiya savdo)`)
    if (hasTool('get_expenses_summary')) ctx.push(`Xarajatlar: ${totalExpenses.toLocaleString()} so'm | Sof oqim: ${(totalProfit-totalExpenses).toLocaleString()} so'm`)
    if (hasTool('get_capital_summary'))  ctx.push(`Kapital: sof ${netCapital.toLocaleString()} so'm`)
    if (hasTool('get_discounts_summary'))ctx.push(`Chegirma yo'qotish: ${discountLoss.toLocaleString()} so'm`)
    return base + (ctx.length ? '\n\n=== JORIY HOLAT ===\n' + ctx.join('\n') : '')
  }, [agentConfig?.systemPrompt, agentConfig?.tools?.join(), completedSales.length, usedCompleted.length, totalRevenue, totalProfit, avgMargin, returnRate, totalExpenses, installmentDebt, netCapital])

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
