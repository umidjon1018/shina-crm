import { useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAgentActivityStore } from '../../../store/agentActivityStore'
import { useDataStore } from '../../../store/dataStore'
import { useShopStore } from '../../../store/shopStore'
import { fmtNum } from '../aiHelpers'
import { useAgentAnalysis } from '../hooks/useAgentAnalysis'
import AgentAnalysisPanel from '../components/AgentAnalysisPanel'
import AiChat from '../components/AiChat'


function InventoryTab({ aiData = {} }) {
  const { t } = useTranslation()
  const { addActivity } = useAgentActivityStore()
  const { version } = useDataStore()
  const { selectedShopId } = useShopStore()
  const { sales: _allSales = [], products: MOCK_PRODUCTS = [], items: MOCK_ITEMS = [], batches: MOCK_BATCHES = [] } = aiData
  const MOCK_SALES = selectedShopId === 'all' ? _allSales : _allSales.filter(s => s.shopId === selectedShopId)
  const currentMonth = new Date().getMonth() + 1

  const inventoryData = useMemo(() => {
    const shopBatches = selectedShopId === 'all' ? MOCK_BATCHES : MOCK_BATCHES.filter(b => b.shopId === selectedShopId)
    const shopBatchIds = new Set(shopBatches.map(b => b.id))
    const getStock = (pid) => MOCK_ITEMS.filter(i => i.productId === pid && i.status === 'in_stock' && (selectedShopId === 'all' || shopBatchIds.has(i.batchId))).length
    const windowStart = new Date(Date.now() - 90 * 86400000)

    return MOCK_PRODUCTS.filter(p => p.isActive && shopBatches.some(b => b.productId === p.id)).map(product => {
      const stock = getStock(product.id)
      const soldInWindow = MOCK_SALES.filter(s => s.status !== 'cancelled' && new Date(s.soldAt) >= windowStart)
        .reduce((sum, s) => sum + s.items.filter(i => i.productId === product.id).reduce((a, i) => a + (i.qty || 1), 0), 0)
      const soldLast30 = Math.round(soldInWindow * 30 / 90)
      const dailyRate = soldInWindow / 90
      const daysLeft = dailyRate > 0 ? Math.floor(stock / dailyRate) : null
      const minLimit = product.lowStockThreshold || 3
      return { name: product.name, brand: product.brand || '—', category: product.category, season: product.season || 'NA', stock, soldLast30, daysLeft, minLimit, isLow: stock <= minLimit }
    })
  }, [version, selectedShopId])

  const lowStock = inventoryData.filter(p => p.isLow)
  const criticalStock = inventoryData.filter(p => p.stock === 0)
  const totalItems = inventoryData.reduce((s, p) => s + p.stock, 0)

  const { loading, analysis, error, refresh } = useAgentAnalysis({
    agentId: 'product-agent',
    enabled: inventoryData.length > 0,
    buildPrompt: () => `INVENTAR TAHLILI MA'LUMOTLARI:

Hozirgi oy: ${currentMonth}-oy
Jami faol mahsulotlar: ${inventoryData.length} ta
Jami zaxira: ${totalItems} ta birlik
Kam zaxira (limitdan past): ${lowStock.length} ta mahsulot
Tugagan mahsulotlar: ${criticalStock.length} ta

KAM ZAXIRA MAHSULOTLAR (limit=${3}):
${lowStock.slice(0, 10).map(p => `- ${p.name} (${p.brand}): ${p.stock} ta qoldi, 30 kunda ${p.soldLast30} ta sotilgan, ${p.daysLeft !== null ? p.daysLeft + ' kunga yetadi' : 'harakatsiz'}`).join('\n') || 'yo\'q'}

BARCHA MAHSULOTLAR HOLATI (top-15 eng kam zaxirali):
${[...inventoryData].sort((a,b) => a.stock - b.stock).slice(0, 15).map(p => `${p.name}: ${p.stock} ta/${p.minLimit} (min), ${p.soldLast30} ta/oy sotilgan, fasl: ${p.season}`).join('\n')}

Hozirgi fasl: ${currentMonth >= 3 && currentMonth <= 8 ? 'YOZ (yozgi shinalar faol)' : 'QIŠ (qishki shinalar faol)'}`,
    deps: [version, selectedShopId, inventoryData.length],
  })

  useEffect(() => {
    if (analysis && !analysis.raw) {
      analysis.alerts?.forEach(a => addActivity({ agentId: 'inventory', type: 'ALERT', message: a.message }))
      analysis.recommendations?.slice(0, 2).forEach(r => addActivity({ agentId: 'inventory', type: 'RECOMMENDATION', message: r.action }))
    }
  }, [analysis])


  return (
    <div className="space-y-6">
      <AgentAnalysisPanel
        loading={loading}
        analysis={analysis}
        error={error}
        refresh={refresh}
        accentColor="text-[#E63946]"
      />
      <AiChat agentId="product-agent" colorClass="accent-red" />
    </div>
  )
}

export default InventoryTab
