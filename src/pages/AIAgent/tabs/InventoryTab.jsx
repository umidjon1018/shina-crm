import { useMemo, useEffect } from 'react'
import { useAgentActivityStore } from '../../../store/agentActivityStore'
import { useDataStore } from '../../../store/dataStore'
import { useShopStore } from '../../../store/shopStore'
import { useAgentAnalysis } from '../hooks/useAgentAnalysis'
import AgentAnalysisPanel from '../components/AgentAnalysisPanel'
import AiChat from '../components/AiChat'

function InventoryTab({ aiData = {} }) {
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

  const { loading, analysis, error, refresh } = useAgentAnalysis({
    agentId: 'product-agent',
    enabled,
    buildPrompt: () => {
      const season = new Date().getMonth() + 1
      const seasonLabel = season >= 3 && season <= 8 ? 'YOZ' : 'QIŠ'

      const shopLines = batchByShop.length > 1
        ? `\nHAR BIR DO'KON OMBORI:\n${batchByShop.map((s, i) => `${i+1}. ${s.name}: ${s.count} ta partiya, ${s.totalQty} ta kirim, ${s.remaining} ta qoldi, ${s.suppliers} ta yetkazib beruvchi`).join('\n')}`
        : ''

      const usedShopLines = usedByShop.length > 1
        ? `\nB/U DO'KON BO'YICHA:\n${usedByShop.map(s => `Do'kon ${s.sid}: ${s.inStock} ta zaxirada, ${s.sold} ta sotilgan, ${s.scrapped} ta utilizatsiya`).join('\n')}`
        : ''

      return `OMBOR TAHLILI MA'LUMOTLARI (moliyaviy emas — faqat son va holat):

📦 KIRIM PARTIYALAR:
- Jami partiyalar: ${MOCK_BATCHES.length} ta
- Yetkazib beruvchilar: ${new Set(MOCK_BATCHES.map(b => b.supplierName).filter(Boolean)).size} ta
${shopLines}

🔖 BARKODLAR:
- Jami birliklar: ${barcodeStats.total} ta
- Zaxirada (in_stock): ${barcodeStats.inStock} ta
- Sotilgan: ${barcodeStats.sold} ta
- Barkod chiqarilmagan (zaxirada): ${barcodeStats.noBarcodeInStock} ta ← bular sotilib ketmaydi!
- Chop etilgan: ${barcodeStats.printed} ta
- Yuklab olingan: ${barcodeStats.downloaded} ta

📊 YANGI TOVAR OMBORI:
- Faol mahsulot turlari: ${stockByProduct.length} ta
- Kam zaxira (limitdan past): ${lowStock.length} ta
- Tugagan: ${zeroStock.length} ta
- Hozirgi fasl: ${seasonLabel}

KAM ZAXIRALILAR (top-8):
${lowStock.slice(0, 8).map(p => `- ${p.name} (${p.brand}): ${p.stock} ta qoldi (min: ${p.minLimit}), fasl: ${p.season}`).join('\n') || 'yo\'q'}

🔄 B/U TOVAR:
- Zaxirada: ${usedInStock.length} ta
- Sotilgan: ${usedCompleted.length} ta
- Bekor (qaytarilgan): ${usedCancelled.length} ta
- Almashtirish: ${usedExchanged.length} ta
- Utilizatsiya qilingan: ${usedScrapped.length} ta

B/U KATEGORIYALAR:
${usedByCategory.map(c => `- ${c.cat}: ${c.inStock} zaxira, ${c.sold} sotilgan, ${c.scrapped} utilizatsiya`).join('\n') || 'ma\'lumot yo\'q'}
${usedShopLines}`
    },
    deps: [version, selectedShopId, stockByProduct.length, MOCK_USED_STOCK.length, barcodeStats.total],
  })

  useEffect(() => {
    if (analysis && !analysis.raw) {
      analysis.alerts?.forEach(a => addActivity({ agentId: 'inventory', type: 'ALERT', message: a.message }))
      analysis.recommendations?.slice(0, 2).forEach(r => addActivity({ agentId: 'inventory', type: 'RECOMMENDATION', message: r.action }))
    }
  }, [analysis])

  const inventorySystemPrompt = useMemo(() => `Sen OMBOR AGENTI — shina/g'ildirak do'kon CRM tizimining ombor va tovar tahlilchisisisan.

=== JORIY OMBOR MA'LUMOTI ===
Partiyalar: ${MOCK_BATCHES.length} ta
Birliklar: jami ${barcodeStats.total} ta, zaxirada ${barcodeStats.inStock} ta, sotilgan ${barcodeStats.sold} ta
Barkod yo'q (sotilib ketmaydi!): ${barcodeStats.noBarcodeInStock} ta
Faol mahsulot turlari: ${stockByProduct.length} ta
Kam zaxira (limitdan past): ${lowStock.length} ta — ${lowStock.slice(0, 5).map(p => `${p.name}: ${p.stock} ta`).join(', ') || 'yo\'q'}
Tugagan: ${zeroStock.length} ta
B/U zaxira: ${usedInStock.length} ta | Sotilgan: ${usedCompleted.length} ta | Utilizatsiya: ${usedScrapped.length} ta

JAVOB USLUBI: O'zbek tilida, qisqa va aniq. Ombor, tovar holati, barkodlar haqida savollarga javob ber.`, [MOCK_BATCHES.length, barcodeStats.inStock, barcodeStats.noBarcodeInStock, lowStock.length, zeroStock.length, usedInStock.length])

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
