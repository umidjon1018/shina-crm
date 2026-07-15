import { useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAgentActivityStore } from '../../../store/agentActivityStore'
import { useDataStore } from '../../../store/dataStore'
import { useShopStore } from '../../../store/shopStore'
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
  const { sales: _allSales = [], usedSales: _allUsedSales = [] } = aiData
  const MOCK_SALES = selectedShopId === 'all' ? _allSales : _allSales.filter(s => s.shopId === selectedShopId)
  const MOCK_USED_COMPLETED = _allUsedSales.filter(s => s.status !== 'cancelled')

  const staffStats = useMemo(() => {
    const map = {}
    const allSales = [...MOCK_SALES, ...MOCK_USED_COMPLETED]
    allSales.forEach(sale => {
      const sid = sale.soldBy || 'unknown'
      const name = sale.soldByName || sale.cashierName || 'Noma\'lum'
      if (!map[sid]) map[sid] = { id: sid, name, sales: 0, revenue: 0, profit: 0, cancelled: 0 }
      if (sale.status === 'cancelled' && !sale._isExchange) map[sid].cancelled++
      else {
        map[sid].sales++
        map[sid].revenue += sale.total || 0
        map[sid].profit += getSaleProfit(sale)
      }
    })
    return Object.values(map).sort((a, b) => b.revenue - a.revenue)
  }, [MOCK_SALES, MOCK_USED_COMPLETED, version])

  const totalRevenue = staffStats.reduce((s, x) => s + x.revenue, 0)
  const totalSales = staffStats.reduce((s, x) => s + x.sales, 0)
  const thisMonth = new Date().toISOString().slice(0, 7)
  const thisMonthSales = MOCK_SALES.filter(s => s.status !== 'cancelled' && s.soldAt?.startsWith(thisMonth))

  const { loading, analysis, error, refresh } = useAgentAnalysis({
    agentId: 'staff-agent',
    enabled: staffStats.length > 0,
    buildPrompt: () => `XODIMLAR SAMARADORLIGI MA'LUMOTLARI:

Jami xodimlar: ${staffStats.length} ta
Umumiy sotuvlar: ${totalSales} ta
Umumiy tushum: ${fmtNum(totalRevenue, t)} so'm
Bu oy sotuvlar: ${thisMonthSales.length} ta

XODIM REYTINGI (tushum bo'yicha):
${staffStats.map((s, i) => `${i+1}. ${s.name}: ${s.sales} ta sotuv, ${fmtNum(s.revenue, t)} so'm, ${fmtNum(s.profit, t)} so'm foyda, ${s.cancelled} ta HAQIQIY BEKOR (almashtirish hisobsiz)`).join('\n')}

${staffStats.length > 1 ? `Eng samarali: ${staffStats[0].name} (${fmtNum(staffStats[0].revenue, t)} so'm)
Eng ko'p bekor: ${[...staffStats].sort((a,b) => b.cancelled - a.cancelled)[0].name} (${[...staffStats].sort((a,b) => b.cancelled - a.cancelled)[0].cancelled} ta bekor)` : ''}`,
    deps: [version, selectedShopId, staffStats.length, totalRevenue],
  })

  useEffect(() => {
    if (analysis && !analysis.raw) {
      analysis.recommendations?.slice(0, 2).forEach(r => addActivity({ agentId: 'staff', type: 'RECOMMENDATION', message: r.action }))
    }
  }, [analysis])

  const top = staffStats[0]

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
