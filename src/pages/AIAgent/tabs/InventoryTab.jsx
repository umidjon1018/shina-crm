import { useMemo, useEffect } from 'react'
import { useAgentActivityStore } from '../../../store/agentActivityStore'
import { useDataStore } from '../../../store/dataStore'
import { useShopStore } from '../../../store/shopStore'
import { useAgentAnalysis } from '../hooks/useAgentAnalysis'
import AgentAnalysisPanel from '../components/AgentAnalysisPanel'
import AiChat from '../components/AiChat'

function InventoryTab({ aiData = {}, agentConfig = null }) {
  const { addActivity } = useAgentActivityStore()
  const { version } = useDataStore()
  const { selectedShopId } = useShopStore()

  const {
    products: MOCK_PRODUCTS = [],
    items: MOCK_ITEMS = [],
    batches: _allBatches = [],
    usedSales: _allUsedSales = [],
    usedStock: _allUsedStock = [],
  } = aiData

  const filterShop = arr => selectedShopId === 'all' ? arr : arr.filter(x => String(x.shopId) === String(selectedShopId))

  const MOCK_BATCHES  = filterShop(_allBatches)
  const MOCK_USED_SALES  = filterShop(_allUsedSales)
  const MOCK_USED_STOCK  = filterShop(_allUsedStock)

  // --- KIRIM PARTIYALAR ---
  const batchByShop = useMemo(() => {
    const m = {}
    _allBatches.forEach(b => {
      const sid = b.shopId || 'unknown'
      const sname = b.shopName || `Do'kon ${sid}`
      if (!m[sid]) m[sid] = { name: sname, count: 0, totalQty: 0, remaining: 0, suppliers: new Set() }
      m[sid].count++
      m[sid].totalQty    += b.quantityIn || 0
      m[sid].remaining   += b.quantityRemaining || 0
      if (b.supplierName) m[sid].suppliers.add(b.supplierName)
    })
    return Object.values(m).map(s => ({ ...s, suppliers: s.suppliers.size })).sort((a, b) => b.remaining - a.remaining)
  }, [_allBatches])

  // --- BARKODLAR ---
  const barcodeStats = useMemo(() => {
    const shopBatchIds = new Set(MOCK_BATCHES.map(b => b.id))
    const relevant = selectedShopId === 'all' ? MOCK_ITEMS : MOCK_ITEMS.filter(i => shopBatchIds.has(i.batchId))
    return {
      total:      relevant.length,
      inStock:    relevant.filter(i => i.status === 'in_stock').length,
      sold:       relevant.filter(i => i.status === 'sold').length,
      noBarcodeInStock: relevant.filter(i => i.status === 'in_stock' && !i.barcode).length,
      printed:    relevant.filter(i => i.barcodeStatus === 'printed').length,
      downloaded: relevant.filter(i => i.barcodeStatus === 'downloaded').length,
      active:     relevant.filter(i => i.barcodeStatus === 'active').length,
    }
  }, [MOCK_ITEMS, MOCK_BATCHES, selectedShopId])

  // --- OMBOR HOLATI (mahsulot bo'yicha) ---
  const stockByProduct = useMemo(() => {
    const shopBatchIds = new Set(MOCK_BATCHES.map(b => b.id))
    return MOCK_PRODUCTS
      .filter(p => p.isActive)
      .map(p => {
        const inStock = MOCK_ITEMS.filter(i =>
          i.productId === p.id &&
          i.status === 'in_stock' &&
          (selectedShopId === 'all' || shopBatchIds.has(i.batchId))
        ).length
        return { name: p.name, brand: p.brand || '—', category: p.category, season: p.season || '—', stock: inStock, minLimit: p.lowStockThreshold || 3 }
      })
      .filter(p => p.stock > 0 || MOCK_BATCHES.some(b => b.productId === p.id))
      .sort((a, b) => a.stock - b.stock)
  }, [MOCK_PRODUCTS, MOCK_ITEMS, MOCK_BATCHES, selectedShopId])

  const lowStock  = stockByProduct.filter(p => p.stock <= p.minLimit)
  const zeroStock = stockByProduct.filter(p => p.stock === 0)

  // --- B/U TOVAR ---
  const usedInStock   = MOCK_USED_STOCK.filter(u => u.status === 'in_stock')
  const usedScrapped  = MOCK_USED_STOCK.filter(u => u.status === 'scrapped')  // utilizatsiya
  const usedCompleted = MOCK_USED_SALES.filter(s => s.status !== 'cancelled')
  const usedCancelled = MOCK_USED_SALES.filter(s => s.status === 'cancelled' && !s._isExchange)
  const usedExchanged = MOCK_USED_SALES.filter(s => s._isExchange)

  // B/U kategoriya bo'yicha
  const usedByCategory = useMemo(() => {
    const m = {}
    MOCK_USED_STOCK.forEach(u => {
      const cat = u.categoryLabel || u.category || 'Boshqa'
      if (!m[cat]) m[cat] = { cat, total: 0, inStock: 0, sold: 0, scrapped: 0 }
      m[cat].total++
      if (u.status === 'in_stock') m[cat].inStock++
      else if (u.status === 'sold') m[cat].sold++
      else if (u.status === 'scrapped') m[cat].scrapped++
    })
    return Object.values(m).sort((a, b) => b.total - a.total)
  }, [MOCK_USED_STOCK])

  // Do'kon bo'yicha B/U zaxira
  const usedByShop = useMemo(() => {
    if (selectedShopId !== 'all') return []
    const m = {}
    _allUsedStock.forEach(u => {
      const sid = u.shopId || 'unknown'
      if (!m[sid]) m[sid] = { sid, inStock: 0, sold: 0, scrapped: 0 }
      if (u.status === 'in_stock') m[sid].inStock++
      else if (u.status === 'sold') m[sid].sold++
      else if (u.status === 'scrapped') m[sid].scrapped++
    })
    return Object.values(m)
  }, [_allUsedStock, selectedShopId])

  const enabled = stockByProduct.length > 0 || MOCK_USED_STOCK.length > 0
  const hasTool = name => !agentConfig?.tools?.length || agentConfig.tools.includes(name)

  const { loading, analysis, error, refresh } = useAgentAnalysis({
    agentId: 'product-agent',
    enabled,
    buildPrompt: () => {
      const season = new Date().getMonth() + 1
      const seasonLabel = season >= 3 && season <= 8 ? 'YOZ' : 'QIŠ'
      const shopLines = batchByShop.length > 1 ? `\nHAR BIR DO'KON OMBORI:\n${batchByShop.map((s, i) => `${i+1}. ${s.name}: ${s.count} ta partiya, ${s.remaining} ta qoldi`).join('\n')}` : ''
      const usedShopLines = usedByShop.length > 1 ? `\nB/U DO'KON BO'YICHA:\n${usedByShop.map(s => `Do'kon ${s.sid}: ${s.inStock} ta zaxirada, ${s.sold} ta sotilgan`).join('\n')}` : ''
      const role = agentConfig?.systemPrompt || "Sen GoodTires do'konining OMBOR VA TOVAR AGENTISAN."
      const parts = [role, '']
      if (hasTool('get_top_products') || hasTool('get_low_stock')) parts.push(`📊 YANGI TOVAR OMBORI:\n- Faol tovar turlari: ${stockByProduct.length} ta | Fasl: ${seasonLabel}\n- Kam zaxira: ${lowStock.length} ta | Tugagan: ${zeroStock.length} ta\n${lowStock.slice(0,8).map(p=>`  - ${p.name} (${p.brand}): ${p.stock} ta (min: ${p.minLimit})`).join('\n')}${shopLines}`)
      if (hasTool('get_barcodes_summary')) parts.push(`🔖 BARKODLAR:\n- Jami: ${barcodeStats.total} ta | Zaxirada: ${barcodeStats.inStock} ta | Sotilgan: ${barcodeStats.sold} ta\n- Barkod yo'q (sotilib ketmaydi!): ${barcodeStats.noBarcodeInStock} ta`)
      parts.push(`🔄 B/U TOVAR:\n- Zaxirada: ${usedInStock.length} ta | Sotilgan: ${usedCompleted.length} ta | Utilizatsiya: ${usedScrapped.length} ta\n${usedByCategory.map(c=>`  - ${c.cat}: ${c.inStock} zaxira, ${c.sold} sotilgan`).join('\n')}${usedShopLines}`)
      return parts.join('\n')
    },
    deps: [version, selectedShopId, stockByProduct.length, MOCK_USED_STOCK.length, barcodeStats.total, agentConfig?.tools?.join()],
  })

  useEffect(() => {
    if (analysis && !analysis.raw) {
      analysis.alerts?.forEach(a => addActivity({ agentId: 'inventory', type: 'ALERT', message: a.message }))
      analysis.recommendations?.slice(0, 2).forEach(r => addActivity({ agentId: 'inventory', type: 'RECOMMENDATION', message: r.action }))
    }
  }, [analysis])

  const inventorySystemPrompt = useMemo(() => {
    const base = agentConfig?.systemPrompt || "Sen GoodTires do'konining OMBOR VA TOVAR AGENTISAN."
    const ctx = []
    if (hasTool('get_top_products') || hasTool('get_low_stock')) ctx.push(`Faol tovar turlari: ${stockByProduct.length} ta | Kam zaxira: ${lowStock.length} ta (${lowStock.slice(0,3).map(p=>`${p.name}: ${p.stock}`).join(', ')}) | Tugagan: ${zeroStock.length} ta`)
    if (hasTool('get_barcodes_summary')) ctx.push(`Barkod: jami ${barcodeStats.total} ta, zaxirada ${barcodeStats.inStock} ta, barkod yo'q: ${barcodeStats.noBarcodeInStock} ta`)
    ctx.push(`B/U: zaxirada ${usedInStock.length} ta, sotilgan ${usedCompleted.length} ta, utilizatsiya ${usedScrapped.length} ta`)
    return base + (ctx.length ? '\n\n=== JORIY OMBOR HOLATI ===\n' + ctx.join('\n') : '')
  }, [agentConfig?.systemPrompt, agentConfig?.tools?.join(), stockByProduct.length, lowStock.length, zeroStock.length, barcodeStats.inStock, barcodeStats.noBarcodeInStock, usedInStock.length])

  return (
    <div className="space-y-6">
      <AgentAnalysisPanel
        loading={loading}
        analysis={analysis}
        error={error}
        refresh={refresh}
        accentColor="text-[#E63946]"
      />
      <AiChat agentId="product-agent" colorClass="accent-red" systemPrompt={inventorySystemPrompt} placeholder="Ombor, tovar zaxirasi, barkodlar haqida so'rang..." />
    </div>
  )
}

export default InventoryTab
