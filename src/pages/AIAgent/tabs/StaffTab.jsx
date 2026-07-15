import { useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAgentActivityStore } from '../../../store/agentActivityStore'
import { useDataStore } from '../../../store/dataStore'
import { useShopStore } from '../../../store/shopStore'
import { useSettingsStore } from '../../../store/settingsStore'
import { fmtNum } from '../aiHelpers'
import { getSaleProfit } from '../../../utils/profitHelpers'
import { useAgentAnalysis } from '../hooks/useAgentAnalysis'
import AgentAnalysisPanel from '../components/AgentAnalysisPanel'
import AiChat from '../components/AiChat'

function StaffTab({ aiData = {} }) {
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
        cancelled: 0,         // haqiqiy bekor (exchange emas)
        discountCount: 0,     // necha marta chegirma bergan
        discountTotal: 0,     // jami chegirma so'mda
        discountToCustomers: {}, // { customerId: { name, count, total } }
        incomeEntries: 0,     // kirim partiyalar
        thisMonthSales: 0,
        lastMonthSales: 0,
        lateDays: [],         // data kiritish kechikish kunlari (agar bor bo'lsa)
      }
      return map[id]
    }

    // Yangi sotuvlar
    MOCK_SALES.forEach(s => {
      const id = s.soldBy || 'unknown'
      const name = s.soldByName || s.cashierName || 'Noma\'lum'
      const e = ensureEntry(id, name)

      if (s.status === 'cancelled' && !s._isExchange) {
        e.cancelled++
      } else if (s.status !== 'cancelled') {
        e.sales++
        e.revenue += s.total || 0
        e.profit  += getSaleProfit(s)
        if (s.soldAt?.startsWith(thisMonth)) e.thisMonthSales++
        if (s.soldAt?.startsWith(lastMonth)) e.lastMonthSales++
        if (s.discount > 0) {
          e.discountCount++
          const discAmt = Math.round((s.subtotal || s.total || 0) * s.discount / 100)
          e.discountTotal += discAmt
          const cid = s.customerId || 'anonymous'
          const cname = s.customerName || 'Noma\'lum'
          if (!e.discountToCustomers[cid]) e.discountToCustomers[cid] = { name: cname, count: 0, total: 0 }
          e.discountToCustomers[cid].count++
          e.discountToCustomers[cid].total += discAmt
        }
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
      e.profit  += getSaleProfit(s)
      if (s.soldAt?.startsWith(thisMonth)) e.thisMonthSales++
    })

    // Kirim partiyalar (ombor operatsiyalari)
    MOCK_BATCHES.forEach(b => {
      const id = b.addedBy || b.createdBy || b.userId || null
      if (!id) return
      const name = b.addedByName || b.createdByName || 'Noma\'lum'
      const e = ensureEntry(id, name)
      e.incomeEntries++
    })

    return Object.values(map).sort((a, b) => b.revenue - a.revenue)
  }, [MOCK_SALES, MOCK_USED, MOCK_BATCHES, version])

  // Xodimlar ro'yxati (settingsStore dan — salary, role, hiredAt)
  const empList = useMemo(() => {
    return storeEmployees.filter(e => e.isActive !== false)
  }, [storeEmployees])

  const totalRevenue = staffStats.reduce((s, x) => s + x.revenue, 0)
  const totalSales   = staffStats.reduce((s, x) => s + x.sales + x.usedSales, 0)

  // Eng ko'p chegirma bergan xodim
  const topDiscounter = [...staffStats].sort((a, b) => b.discountTotal - a.discountTotal)[0]

  // Shubhali chegirma pattern: bitta xodim bitta mijozga 3+ marta
  const suspiciousDiscounts = staffStats.flatMap(e => {
    return Object.values(e.discountToCustomers)
      .filter(c => c.count >= 3)
      .map(c => ({ empName: e.name, custName: c.name, count: c.count, total: c.total }))
  })

  // Oy-oy sotuv o'sishi
  const growthLines = staffStats
    .filter(e => e.thisMonthSales > 0 || e.lastMonthSales > 0)
    .map(e => {
      const growth = e.lastMonthSales > 0
        ? (((e.thisMonthSales - e.lastMonthSales) / e.lastMonthSales) * 100).toFixed(0)
        : 'n/a'
      return `${e.name}: bu oy ${e.thisMonthSales} ta (o'tgan oy ${e.lastMonthSales} ta, o'sish: ${growth}%)`
    })

  // Salary summary (settingsStore dan)
  const salaryLines = empList
    .filter(e => e.salary)
    .map(e => `${e.name} (${e.role || '?'}): oylik ${e.salary?.toLocaleString()} so'm, ishga kirgan: ${e.hiredAt || '?'}`)

  const { loading, analysis, error, refresh } = useAgentAnalysis({
    agentId: 'staff-agent',
    enabled: staffStats.length > 0,
    buildPrompt: () => `XODIMLAR FAOLIYATI VA SAMARADORLIGI — TO'LIQ TAHLIL:

👥 UMUMIY:
- Faol xodimlar: ${empList.length} ta | Tizimda faoliyat ko'rsatgan: ${staffStats.length} ta
- Jami sotuvlar: ${totalSales} ta | Jami tushum: ${fmtNum(totalRevenue, t)} so'm
- Xarajatlar (maosh va boshqa): ${fmtNum(MOCK_EXPENSES.reduce((s,e) => s + (e.amountUZS||0), 0), t)} so'm

📊 XODIM SAMARADORLIGI (tushum bo'yicha):
${staffStats.map((e, i) => {
  const sharePercent = totalRevenue > 0 ? ((e.revenue / totalRevenue) * 100).toFixed(1) : 0
  const discountedSales = e.discountCount
  const discountRate = (e.sales + e.usedSales) > 0 ? ((discountedSales / (e.sales + e.usedSales)) * 100).toFixed(0) : 0
  return `${i+1}. ${e.name}:
   - Sotuv: ${e.sales} yangi + ${e.usedSales} B/U = ${e.sales + e.usedSales} ta | Tushum: ${fmtNum(e.revenue, t)} so'm (ulush: ${sharePercent}%)
   - Foyda: ${fmtNum(e.profit, t)} so'm | Kirim partiyalar: ${e.incomeEntries} ta
   - Haqiqiy bekor (pul qaytarilgan): ${e.cancelled} ta
   - Chegirma: ${discountedSales} ta sotuvda (${discountRate}%) | Jami chegirma yo'qotish: ${fmtNum(e.discountTotal, t)} so'm`
}).join('\n')}

📅 OY-OY O'SISH:
${growthLines.join('\n') || 'ma\'lumot yo\'q'}

🎁 CHEGIRMA TAHLILI:
- Eng ko'p chegirma bergan: ${topDiscounter ? `${topDiscounter.name} (${fmtNum(topDiscounter.discountTotal, t)} so'm, ${topDiscounter.discountCount} sotuv)` : 'yo\'q'}
${suspiciousDiscounts.length > 0
  ? `⚠️ SHUBHALI CHEGIRMA PATTERN (1 xodim → 1 mijozga 3+ marta chegirma):\n${suspiciousDiscounts.map(d => `- ${d.empName} → ${d.custName}: ${d.count} marta, ${fmtNum(d.total, t)} so'm chegirma`).join('\n')}`
  : '- Shubhali chegirma pattern aniqlanmadi'}

💰 MAOSH VA ROL (ma\'lumot mavjud bo'lsa):
${salaryLines.length > 0 ? salaryLines.join('\n') : 'Maosh ma\'lumoti kiritilmagan'}

VAZIFALAR:
1. Har bir xodimning samaradorligi va muammolarini tahlil qil
2. Shubhali chegirma patternlari aniqlasa — sabab va xavfni tushuntir
3. Maosh vs tushum nisbati bo'yicha izoh ber
4. Yaxshi xodimlarni rag'batlantirishga va zaif xodimlarni o'qitishga tavsiya`,
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
      />
      <AiChat agentId="staff-agent" colorClass="accent-purple" />
    </div>
  )
}

export default StaffTab
