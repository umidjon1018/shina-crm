import { useMemo } from 'react'
import { UserCheck, TrendingUp, Star, AlertTriangle } from 'lucide-react'
import AiChat from '../components/AiChat'
import { useTranslation } from 'react-i18next'
import { useDataStore } from '../../../store/dataStore'
import { useShopStore } from '../../../store/shopStore'
import { fmtNum } from '../aiHelpers'
import KpiCard from '../components/KpiCard'
import { getSaleProfit } from '../../../utils/profitHelpers'

function StaffTab({ aiData = {} }) {
  const { t } = useTranslation()
  const { version } = useDataStore()
  const { selectedShopId } = useShopStore()
  const { sales: _allSales = [] } = aiData

  const MOCK_SALES = selectedShopId === 'all'
    ? _allSales
    : _allSales.filter(s => s.shopId === selectedShopId)

  const staffStats = useMemo(() => {
    const map = {}
    MOCK_SALES.forEach(sale => {
      const sid = sale.soldBy || 'unknown'
      const name = sale.soldByName || sale.cashierName || sid
      if (!map[sid]) map[sid] = { id: sid, name, sales: 0, revenue: 0, profit: 0, cancelled: 0 }
      if (sale.status === 'cancelled') {
        map[sid].cancelled += 1
      } else {
        map[sid].sales += 1
        map[sid].revenue += sale.total || 0
        map[sid].profit += getSaleProfit(sale)
      }
    })
    return Object.values(map).sort((a, b) => b.revenue - a.revenue)
  }, [MOCK_SALES, version])

  const totalSales = staffStats.reduce((s, x) => s + x.sales, 0)
  const totalRevenue = staffStats.reduce((s, x) => s + x.revenue, 0)
  const totalProfit = staffStats.reduce((s, x) => s + x.profit, 0)
  const topStaff = staffStats[0]

  const systemPrompt = useMemo(() => `Sen GoodTires shina do'konining xodimlar faoliyati tahlilchisi agentisan.

📊 Xodimlar bo'yicha sotuv statistikasi:
${staffStats.map(s =>
  `  ${s.name}: ${s.sales} ta sotuv, tushum ${fmtNum(s.revenue, t)} so'm, foyda ${fmtNum(s.profit, t)} so'm, bekor ${s.cancelled} ta`
).join('\n')}

Umumiy: ${totalSales} ta sotuv, ${fmtNum(totalRevenue, t)} so'm tushum, ${fmtNum(totalProfit, t)} so'm foyda.

MUHIM QOIDALAR:
- To'liq, to'g'ri o'zbek adabiy tilida yoz.
- Har bir xodimni xolis baholab, tavsiyalar ber.
- Markdown ishlatishingiz mumkin: **qalin**, - ro'yxat, ## sarlavha.
- KPI taqqoslash, motivatsiya tavsiyalari, mehnat unumdorligini oshirish yo'llari haqida gapir.`, [staffStats])

  const autoPrompt = `Xodimlar faoliyatini tahlil qil: kim eng samarali ishlayabdi, kim diqqat talab, va umumiy tavsiyalar ber.`

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Jami xodimlar" value={staffStats.length + ' ta'} sub="Sotuvda qatnashgan" />
        <KpiCard label="Jami sotuvlar" value={totalSales + ' ta'} sub="Barcha xodimlar" color="text-[#22c55e]" />
        <KpiCard label="Jami tushum" value={fmtNum(totalRevenue, t) + ' so\'m'} sub="Barcha vaqt" color="text-[#22c55e]" />
        <KpiCard label="Eng yaxshi" value={topStaff?.name || '—'} sub={topStaff ? fmtNum(topStaff.revenue, t) + ' so\'m' : ''} color="text-amber-400" />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <TrendingUp size={15} className="text-[#a855f7]" /> Xodimlar reytingi
        </h3>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-bg-secondary">
                {['#', 'Xodim', 'Sotuvlar', 'Tushum', 'Foyda', 'Bekor'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-text-muted font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staffStats.map((s, i) => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-bg-secondary/50">
                  <td className="px-3 py-2">
                    {i === 0 ? <Star size={12} className="text-amber-400" /> : <span className="text-text-muted">{i + 1}</span>}
                  </td>
                  <td className="px-3 py-2 font-medium text-text-primary">{s.name}</td>
                  <td className="px-3 py-2 text-[#22c55e]">{s.sales} ta</td>
                  <td className="px-3 py-2 text-text-primary">{fmtNum(s.revenue, t)} so'm</td>
                  <td className="px-3 py-2 text-text-primary">{fmtNum(s.profit, t)} so'm</td>
                  <td className="px-3 py-2">
                    {s.cancelled > 0
                      ? <span className="text-[#E63946] flex items-center gap-1"><AlertTriangle size={11} />{s.cancelled}</span>
                      : <span className="text-text-muted">0</span>}
                  </td>
                </tr>
              ))}
              {staffStats.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-text-muted">Ma'lumot yo'q</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AiChat
        agentId="staff-agent"
        systemPrompt={systemPrompt}
        autoPrompt={autoPrompt}
        placeholder="Xodimlar faoliyati, mehnat unumdorligi haqida so'rang..."
        colorClass="accent-orange"
      />
    </div>
  )
}

export default StaffTab
