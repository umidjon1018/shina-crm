import { useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAgentActivityStore } from '../../../store/agentActivityStore'
import { useDataStore } from '../../../store/dataStore'
import { useShopStore } from '../../../store/shopStore'
import { useSettingsStore } from '../../../store/settingsStore'
import { fmtNum } from '../aiHelpers'
import { getNetSaleProfit, getUsedSaleProfit, isExchangeCancel } from '../../../utils/profitHelpers'
import { useAgentAnalysis } from '../hooks/useAgentAnalysis'
import AgentAnalysisPanel from '../components/AgentAnalysisPanel'
import AiChat from '../components/AiChat'

function StaffTab({ aiData = {}, agentConfig = null }) {
  const { t } = useTranslation()
  const { addActivity } = useAgentActivityStore()
  const { version } = useDataStore()
  const { selectedShopId } = useShopStore()
  const { employees: storeEmployees } = useSettingsStore()

  const {
    sales: _allSales = [],
    usedSales: _allUsedSales = [],
    batches: _allBatches = [],
    expenses: _allExpenses = [],
  } = aiData

  const filterShop = arr => selectedShopId === 'all' ? arr : arr.filter(x => String(x.shopId) === String(selectedShopId))

  const MOCK_SALES    = filterShop(_allSales)
  const MOCK_USED     = filterShop(_allUsedSales)
  const MOCK_BATCHES  = filterShop(_allBatches)
  const MOCK_EXPENSES = filterShop(_allExpenses)

  const thisMonth = new Date().toISOString().slice(0, 7)
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7)

  // Per-xodim statistika
  const staffStats = useMemo(() => {
    const map = {}

    const ensureEntry = (id, name) => {
      if (!map[id]) map[id] = {
        id, name,
        sales: 0, usedSales: 0, revenue: 0, profit: 0,
        cancelled: 0,
        belowMinPrice: 0,         // minSalePrice dan past sotuv (qoida buzilishi)
        discountCount: 0,
        discountTotal: 0,
        discountToCustomers: {},  // { customerId: { name, count, total } }
        incomeEntries: 0,
        expenseEntries: 0,
        thisMonthSales: 0,
        lastMonthSales: 0,
        thisMonthRevenue: 0,
        lastMonthRevenue: 0,
        avgDiscountPct: 0,
        discountPcts: [],
      }
      return map[id]
    }

    // Yangi sotuvlar
    MOCK_SALES.forEach(s => {
      const id = s.soldBy || 'unknown'
      const name = s.soldByName || s.cashierName || 'Noma\'lum'
      const e = ensureEntry(id, name)

      if (s.status === 'cancelled' && !isExchangeCancel(s)) {
        e.cancelled++
        return
      }
      if (s.status === 'cancelled') return

      e.sales++
      e.revenue += s.total || 0
      e.profit  += getNetSaleProfit(s)

      if (s.soldAt?.startsWith(thisMonth)) {
        e.thisMonthSales++
        e.thisMonthRevenue += s.total || 0
      }
      if (s.soldAt?.startsWith(lastMonth)) {
        e.lastMonthSales++
        e.lastMonthRevenue += s.total || 0
      }

      // Chegirma tahlili
      if (s.discount > 0) {
        e.discountCount++
        e.discountPcts.push(s.discount)
        const discAmt = Math.round((s.subtotal || s.total || 0) * s.discount / 100)
        e.discountTotal += discAmt
        const cid = s.customerId || 'anonymous'
        const cname = s.customerName || 'Noma\'lum'
        if (!e.discountToCustomers[cid]) e.discountToCustomers[cid] = { name: cname, count: 0, total: 0 }
        e.discountToCustomers[cid].count++
        e.discountToCustomers[cid].total += discAmt
      }

      // Qoida buzilishi: minSalePrice dan past sotuv
      if (s.items) {
        const hasViolation = s.items.some(item => {
          if (!item.minSalePrice || !item.price) return false
          return item.price < item.minSalePrice
        })
        if (hasViolation) e.belowMinPrice++
      }
    })

    // B/U sotuvlar
    MOCK_USED.forEach(s => {
      if (s.status === 'cancelled') return
      const id = s.soldBy || s.cashierId || 'unknown'
      const name = s.soldByName || s.cashierName || 'Noma\'lum'
      const e = ensureEntry(id, name)
      e.usedSales++
      e.revenue += s.total || 0
      e.profit  += getUsedSaleProfit(s) - (s.paymentType === 'installment' ? (s.installmentCommissionAmount ?? 0) : 0)
      if (s.soldAt?.startsWith(thisMonth)) {
        e.thisMonthSales++
        e.thisMonthRevenue += s.total || 0
      }
    })

    // Kirim partiyalar
    MOCK_BATCHES.forEach(b => {
      const id = b.addedBy || b.createdBy || b.userId || null
      if (!id) return
      const name = b.addedByName || b.createdByName || 'Noma\'lum'
      const e = ensureEntry(id, name)
      e.incomeEntries++
    })

    // Xarajatlar
    MOCK_EXPENSES.forEach(ex => {
      const id = ex.createdBy || ex.addedBy || null
      if (!id) return
      const name = ex.createdByName || ex.addedByName || 'Noma\'lum'
      const e = ensureEntry(id, name)
      e.expenseEntries++
    })

    // O'rtacha chegirma foizini hisoblash
    Object.values(map).forEach(e => {
      e.avgDiscountPct = e.discountPcts.length > 0
        ? (e.discountPcts.reduce((s, x) => s + x, 0) / e.discountPcts.length).toFixed(1)
        : 0
    })

    return Object.values(map).sort((a, b) => b.revenue - a.revenue)
  }, [MOCK_SALES, MOCK_USED, MOCK_BATCHES, MOCK_EXPENSES, version])

  const empList = useMemo(() => storeEmployees.filter(e => e.isActive !== false), [storeEmployees])

  const totalRevenue = staffStats.reduce((s, x) => s + x.revenue, 0)
  const totalSales   = staffStats.reduce((s, x) => s + x.sales + x.usedSales, 0)
  const totalProfit  = staffStats.reduce((s, x) => s + x.profit, 0)

  const topDiscounter  = [...staffStats].sort((a, b) => b.discountTotal - a.discountTotal)[0]
  const topSeller      = staffStats[0]
  const mostCancelled  = [...staffStats].sort((a, b) => b.cancelled - a.cancelled)[0]
  const mostViolations = [...staffStats].sort((a, b) => b.belowMinPrice - a.belowMinPrice)[0]

  // Shubhali chegirma: 1 xodim → 1 mijozga 3+ marta
  const suspiciousDiscounts = staffStats.flatMap(e =>
    Object.entries(e.discountToCustomers)
      .filter(([, c]) => c.count >= 3)
      .map(([cid, c]) => ({ empId: e.id, empName: e.name, custName: c.name, count: c.count, total: c.total }))
  )

  // Jami maosh xarajati
  const totalSalary = empList.reduce((s, e) => s + (e.salary || 0), 0)

  // Oy-oy o'sish
  const growthLines = staffStats
    .filter(e => e.thisMonthSales > 0 || e.lastMonthSales > 0)
    .map(e => {
      const growth = e.lastMonthSales > 0
        ? (((e.thisMonthSales - e.lastMonthSales) / e.lastMonthSales) * 100).toFixed(0)
        : 'n/a'
      return `${e.name}: bu oy ${e.thisMonthSales} ta (${fmtNum(e.thisMonthRevenue, t)} so'm) | o'tgan oy ${e.lastMonthSales} ta | o'sish: ${growth}%`
    })

  const salaryLines = empList
    .filter(e => e.salary)
    .map(e => {
      const stat = staffStats.find(s => String(s.id) === String(e.id))
      const revenue = stat?.revenue || 0
      const roi = revenue > 0 && e.salary > 0
        ? `tushum/maosh nisbati: ${(revenue / e.salary).toFixed(1)}x`
        : ''
      return `${e.name} (${e.role || '?'}): oylik ${e.salary?.toLocaleString()} so'm | Jami tushum: ${fmtNum(revenue, t)} so'm ${roi ? '| ' + roi : ''} | ishga kirgan: ${e.hiredAt || '?'}`
    })

  const hasTool = name => !agentConfig?.tools?.length || agentConfig.tools.includes(name)

  // ─── Analysis prompt ────────────────────────────────────────────────────────
  const buildPrompt = () => (agentConfig?.systemPrompt || "Sen GoodTires do'konining XODIMLAR AGENTISAN.") + `\n\nXODIMLAR FAOLIYATI VA SAMARADORLIGI — TO'LIQ TAHLIL:

👥 UMUMIY KO'RSATKICHLAR:
- Faol xodimlar: ${empList.length} ta | Tizimda faoliyat: ${staffStats.length} ta
- Jami sotuvlar: ${totalSales} ta | Jami tushum: ${fmtNum(totalRevenue, t)} so'm | Foyda: ${fmtNum(totalProfit, t)} so'm
- Jami maosh xarajati: ${fmtNum(totalSalary, t)} so'm/oy
- Tushum/maosh nisbati: ${totalSalary > 0 ? (totalRevenue / totalSalary).toFixed(1) + 'x' : 'n/a'}

📊 XODIM SAMARADORLIGI (tushum bo'yicha tartiblangan):
${staffStats.map((e, i) => {
  const share = totalRevenue > 0 ? ((e.revenue / totalRevenue) * 100).toFixed(1) : 0
  const discRate = (e.sales + e.usedSales) > 0 ? ((e.discountCount / (e.sales + e.usedSales)) * 100).toFixed(0) : 0
  return `${i + 1}. ${e.name}:
   - Sotuv: ${e.sales} yangi + ${e.usedSales} B/U = ${e.sales + e.usedSales} ta | Tushum: ${fmtNum(e.revenue, t)} so'm (ulush: ${share}%)
   - Foyda: ${fmtNum(e.profit, t)} so'm | Kirim partiya kiritdi: ${e.incomeEntries} ta | Xarajat kiritdi: ${e.expenseEntries} ta
   - Bekor sotuvlar (haqiqiy): ${e.cancelled} ta
   - Chegirma: ${e.discountCount} marta (${discRate}% sotuvda) | O'rtacha chegirma: ${e.avgDiscountPct}% | Yo'qotish: ${fmtNum(e.discountTotal, t)} so'm
   - Qoida buzilishi (minSalePrice dan past sotuv): ${e.belowMinPrice} ta`
}).join('\n')}

📅 OY-OY SOTUV O'SISHI:
${growthLines.join('\n') || 'ma\'lumot yo\'q'}

⚠️ QOIDA BUZILISHLARI XULOSA:
- Eng ko'p bekor sotuv: ${mostCancelled ? `${mostCancelled.name} (${mostCancelled.cancelled} ta)` : 'yo\'q'}
- Eng ko'p minSalePrice buzilish: ${mostViolations?.belowMinPrice > 0 ? `${mostViolations.name} (${mostViolations.belowMinPrice} ta sotuv)` : 'hech kim buzilish qilmagan'}

🎁 CHEGIRMA TAHLILI:
- Eng ko'p chegirma bergan: ${topDiscounter ? `${topDiscounter.name} (${fmtNum(topDiscounter.discountTotal, t)} so'm yo'qotish, ${topDiscounter.discountCount} sotuv, o'rtacha ${topDiscounter.avgDiscountPct}%)` : 'yo\'q'}
${suspiciousDiscounts.length > 0
  ? `⚠️ SHUBHALI CHEGIRMA (1 xodim → 1 mijozga 3+ marta chegirma):\n${suspiciousDiscounts.map(d => `- ${d.empName} → ${d.custName}: ${d.count} marta, jami ${fmtNum(d.total, t)} so'm chegirma`).join('\n')}`
  : '- Shubhali chegirma pattern aniqlanmadi'}

💰 MAOSH VA SAMARADORLIK:
${salaryLines.length > 0 ? salaryLines.join('\n') : 'Maosh ma\'lumoti kiritilmagan'}

VAZIFALAR:
1. Har bir xodim samaradorligini tahlil qil — kim yaxshi, kim zaif va nima uchun
2. Qoida buzilishlari (bekor sotuv, narx buzilishi, chegirma suiiste'mol) bo'yicha xavf baholash
3. Shubhali chegirma pattern aniqlansa — bu nimani anglatishi mumkin?
4. Maosh/tushum nisbati bo'yicha: kimni rag'batlantirish, kimni monitoring qilish kerak
5. Tavsiyalar: xodimlar motivatsiyasi, nazorat mexanizmlari, bonus tizimi`

  // ─── System prompt for AiChat ───────────────────────────────────────────────
  const systemPrompt = useMemo(() => {
    const base = agentConfig?.systemPrompt || "Sen XODIMLAR AGENTI — shina/g'ildirak do'kon CRM tizimining xodimlar tahlilchisisisan."
    const staffLines = staffStats.map((e, i) => {
      const share = totalRevenue > 0 ? ((e.revenue / totalRevenue) * 100).toFixed(1) : 0
      const discRate = (e.sales + e.usedSales) > 0
        ? ((e.discountCount / (e.sales + e.usedSales)) * 100).toFixed(0) : 0

      const suspForEmp = Object.entries(e.discountToCustomers)
        .filter(([, c]) => c.count >= 3)
        .map(([, c]) => `${c.name}: ${c.count} marta, ${fmtNum(c.total, t)} so'm`)

      const topCust = Object.values(e.discountToCustomers)
        .sort((a, b) => b.total - a.total)
        .slice(0, 3)
        .map(c => `${c.name} (${c.count} marta, ${fmtNum(c.total, t)} so'm)`)

      return `${i + 1}. ${e.name} (ID: ${e.id}):
  Sotuv: ${e.sales} yangi + ${e.usedSales} B/U = ${e.sales + e.usedSales} ta
  Tushum: ${fmtNum(e.revenue, t)} so'm (barcha tushumning ${share}%)
  Foyda: ${fmtNum(e.profit, t)} so'm
  Bekor sotuv (pul qaytarilgan): ${e.cancelled} ta
  Narx qoidasi buzilishi: ${e.belowMinPrice} ta sotuv
  Chegirma: ${e.discountCount} marta (${discRate}% sotuvlarda), o'rtacha ${e.avgDiscountPct}%, jami yo'qotish: ${fmtNum(e.discountTotal, t)} so'm
  Chegirma berilgan asosiy mijozlar: ${topCust.length > 0 ? topCust.join('; ') : 'yo\'q'}
  Shubhali chegirma (3+ marta bitta mijozga): ${suspForEmp.length > 0 ? suspForEmp.join('; ') : 'yo\'q'}
  Kirim partiya kiritdi: ${e.incomeEntries} ta | Xarajat kiritdi: ${e.expenseEntries} ta
  Bu oy: ${e.thisMonthSales} ta sotuv, ${fmtNum(e.thisMonthRevenue, t)} so'm
  O'tgan oy: ${e.lastMonthSales} ta sotuv, ${fmtNum(e.lastMonthRevenue, t)} so'm`
    }).join('\n\n')

    const empLines = empList.map(e => {
      const stat = staffStats.find(s => String(s.id) === String(e.id))
      return `${e.name}: rol=${e.role || '?'}, maosh=${e.salary ? e.salary.toLocaleString() + ' so\'m/oy' : 'kiritilmagan'}, ishga kirgan=${e.hiredAt || '?'}, tushum=${stat ? fmtNum(stat.revenue, t) : '0'} so'm`
    }).join('\n')

    return base + `

MENING VAZIFALARIM:
- Xodimlarning sotuv samaradorligini tahlil qilish (kim ko'p sotyapti, kim kam)
- Qoida buzilishlarini aniqlash (bekor sotuvlar, narx buzilishi, chegirma suiiste'moli)
- Shubhali chegirma patternlarini tushuntirish
- Maosh vs tushum nisbatini baholash
- Oy-oy o'sish/pasayish dinamikasini ko'rish
- Motivatsiya va nazorat bo'yicha tavsiya berish

=== JORIY XODIMLAR MA'LUMOTI ===

Umumiy: ${totalSales} ta sotuv, ${fmtNum(totalRevenue, t)} so'm tushum, ${fmtNum(totalProfit, t)} so'm foyda
Jami maosh: ${fmtNum(totalSalary, t)} so'm/oy | Tushum/maosh: ${totalSalary > 0 ? (totalRevenue / totalSalary).toFixed(1) + 'x' : 'n/a'}

--- XODIM STATISTIKALARI ---
${staffLines || 'Ma\'lumot yo\'q'}

--- XODIMLAR RO\'YXATI (settingsdan) ---
${empLines || 'Xodimlar kiritilmagan'}

--- CHEGIRMA XULOSA ---
Eng ko'p chegirma: ${topDiscounter ? topDiscounter.name + ' (' + fmtNum(topDiscounter.discountTotal, t) + ' so\'m yo\'qotish)' : 'yo\'q'}
Shubhali patternlar: ${suspiciousDiscounts.length > 0 ? suspiciousDiscounts.map(d => d.empName + ' → ' + d.custName + ': ' + d.count + ' marta').join('; ') : 'aniqlanmadi'}

=== JAVOB USLUBI ===
- O'zbek tilida, qisqa va aniq
- Raqamlar bilan konkret misol keltir
- Muammo aniqlasang — sabab va yechim ayt
- Agar xodim haqida so'rasalar — aniq raqamlar bilan javob ber`
  }, [agentConfig?.systemPrompt, agentConfig?.tools?.join(), staffStats, empList, totalRevenue, totalSales, totalProfit, totalSalary, topDiscounter, suspiciousDiscounts, version])

  // ─── Auto analysis ──────────────────────────────────────────────────────────
  const { loading, analysis, error, refresh, triggerRun, triggering, source, lastRun } = useAgentAnalysis({
    agentId: 'staff-agent',
    enabled: staffStats.length > 0,
    buildPrompt,
    deps: [version, selectedShopId, staffStats.length, totalRevenue, empList.length],
  })

  useEffect(() => {
    if (analysis && !analysis.raw) {
      analysis.alerts?.forEach(a => addActivity({ agentId: 'staff', type: 'ALERT', message: a.message }))
      analysis.recommendations?.slice(0, 2).forEach(r => addActivity({ agentId: 'staff', type: 'RECOMMENDATION', message: r.action }))
    }
  }, [analysis])

  return (
    <div className="space-y-6">
      <AgentAnalysisPanel
        loading={loading}
        analysis={analysis}
        error={error}
        refresh={refresh}
        accentColor="text-[#a855f7]"
        onTriggerRun={triggerRun}
        triggering={triggering}
        source={source}
        lastRun={lastRun}
      />
      <AiChat
        agentId="staff-agent"
        colorClass="accent-purple"
        systemPrompt={systemPrompt}
        placeholder="Xodim haqida so'rang: sotuv, chegirma, qoida buzilishi..."
      />
    </div>
  )
}

export default StaffTab
