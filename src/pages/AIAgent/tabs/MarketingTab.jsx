import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Map, CheckCircle2, Plus, X } from 'lucide-react'
import { useAgentActivityStore } from '../../../store/agentActivityStore'
import { useDataStore } from '../../../store/dataStore'
import { useShopStore } from '../../../store/shopStore'
import { useAgentAnalysis } from '../hooks/useAgentAnalysis'
import { useMarketingStore } from '../../../store/marketingStore'
import AgentAnalysisPanel from '../components/AgentAnalysisPanel'
import AiChat from '../components/AiChat'
import { getSaleProfit } from '../../../utils/profitHelpers'

function MarketingTab({ aiData = {} }) {
  const { addActivity, getActivitiesByAgent } = useAgentActivityStore()
  const { version } = useDataStore()
  const { selectedShopId } = useShopStore()
  const {
    roadmapItems, addRoadmapItem, toggleRoadmapItem, deleteRoadmapItem,
  } = useMarketingStore()

  const [activeSection, setActiveSection] = useState('analysis')
  const [rmInput, setRmInput] = useState({ '1oy': '', '3oy': '', '6oy': '' })

  const {
    customers: MOCK_CUSTOMERS = [],
    sales: _allSales = [],
    products: MOCK_PRODUCTS = [],
    items: MOCK_ITEMS = [],
    batches: _allBatches = [],
    usedSales: _allUsedSales = [],
    promotions: MOCK_PROMOTIONS = [],
    expenses: _allExpenses = [],
  } = aiData

  const filterShop = arr => selectedShopId === 'all' ? arr : arr.filter(s => String(s.shopId) === String(selectedShopId))
  const MOCK_SALES     = filterShop(_allSales).filter(s => s.status !== 'cancelled')
  const MOCK_USED_SALES = filterShop(_allUsedSales).filter(s => s.status !== 'cancelled')
  const MOCK_BATCHES   = filterShop(_allBatches)
  const MOCK_EXPENSES  = filterShop(_allExpenses)

  const currentMonth  = new Date().getMonth() + 1
  const thisMonthKey  = new Date().toISOString().slice(0, 7)
  const lastMonthKey  = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7)
  const seasonLabel   = currentMonth >= 3 && currentMonth <= 8 ? 'YOZ' : 'QIŠ'

  // Sotuv statistikasi
  const allCompleted   = [...MOCK_SALES, ...MOCK_USED_SALES]
  const totalRevenue   = allCompleted.reduce((s, x) => s + (x.total || 0), 0)
  const totalProfit    = allCompleted.reduce((s, x) => s + getSaleProfit(x), 0)
  const avgMargin      = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0

  const thisMonthSales = allCompleted.filter(s => (s.soldAt || s.createdAt || '').startsWith(thisMonthKey))
  const lastMonthSales = allCompleted.filter(s => (s.soldAt || s.createdAt || '').startsWith(lastMonthKey))
  const thisMonthRev   = thisMonthSales.reduce((s, x) => s + (x.total || 0), 0)
  const lastMonthRev   = lastMonthSales.reduce((s, x) => s + (x.total || 0), 0)
  const revGrowth      = lastMonthRev > 0 ? (((thisMonthRev - lastMonthRev) / lastMonthRev) * 100).toFixed(1) : 'n/a'

  // Mijozlar tahlili
  const vipCount    = MOCK_CUSTOMERS.filter(c => c.loyaltyLevel === 'gold').length
  const loyalCount  = MOCK_CUSTOMERS.filter(c => c.loyaltyLevel === 'silver').length
  const newCount    = MOCK_CUSTOMERS.filter(c => !c.loyaltyLevel || c.loyaltyLevel === 'none').length
  const debtors     = MOCK_CUSTOMERS.filter(c => (c.installmentDebt || 0) > 0).length

  // To'lov turi
  const payStats = useMemo(() => {
    const m = { cash: 0, card: 0, installment: 0 }
    allCompleted.forEach(s => { if (m[s.paymentType] !== undefined) m[s.paymentType]++ })
    return m
  }, [allCompleted])

  // Tovar tezligi
  const productVelocity = useMemo(() => {
    const counts = {}
    MOCK_SALES.forEach(s => s.items?.forEach(i => {
      const p = MOCK_PRODUCTS.find(pr => pr.id === i.productId)
      const name = p?.name || i.name || '?'
      if (!counts[name]) counts[name] = { name, brand: p?.brand || '', total: 0, thisMonth: 0, lastMonth: 0 }
      counts[name].total += (i.qty || 1)
      if ((s.soldAt || '').startsWith(thisMonthKey)) counts[name].thisMonth += (i.qty || 1)
      if ((s.soldAt || '').startsWith(lastMonthKey)) counts[name].lastMonth += (i.qty || 1)
    }))
    return Object.values(counts).sort((a, b) => b.total - a.total)
  }, [MOCK_SALES, MOCK_PRODUCTS])

  const topFast    = productVelocity.slice(0, 5)
  const topSlow    = [...productVelocity].sort((a, b) => a.total - b.total).filter(p => p.total > 0).slice(0, 5)
  const shopBatchIds = new Set(MOCK_BATCHES.map(b => b.id))
  const unsoldProducts = MOCK_PRODUCTS.filter(p => {
    const hasStock = MOCK_ITEMS.some(i => i.productId === p.id && i.status === 'in_stock' && (selectedShopId === 'all' || shopBatchIds.has(i.batchId)))
    return hasStock && !productVelocity.find(pv => pv.name === p.name)
  }).slice(0, 5)

  const activePromos   = MOCK_PROMOTIONS.filter(p => p.isActive)
  const totalExpenses  = MOCK_EXPENSES.reduce((s, e) => s + (e.amountUZS || 0), 0)
  const netCashFlow    = totalProfit - totalExpenses
  const inventoryAlerts = getActivitiesByAgent('inventory').filter(a => a.type === 'ALERT').slice(0, 3)

  const { loading, analysis, error, refresh } = useAgentAnalysis({
    agentId: 'pr-agent',
    enabled: MOCK_PRODUCTS.length > 0 || MOCK_SALES.length > 0,
    buildPrompt: () => `Sen tajribali marketing menejeri va biznes strategistisan. Quyidagi do'kon ma'lumotlari asosida chuqur tahlil qil va aniq amaliy takliflar ber.

📅 DAVR: ${currentMonth}-oy, fasl: ${seasonLabel}

💰 MOLIYAVIY KO'RSATKICHLAR:
- Jami tushum: ${totalRevenue.toLocaleString()} so'm
- Sof foyda: ${totalProfit.toLocaleString()} so'm | Marja: ${avgMargin}%
- Bu oy: ${thisMonthRev.toLocaleString()} so'm (${thisMonthSales.length} ta sotuv)
- O'tgan oy: ${lastMonthRev.toLocaleString()} so'm (${lastMonthSales.length} ta sotuv)
- O'sish: ${revGrowth}%
- Sof pul oqimi (foyda - xarajat): ${netCashFlow.toLocaleString()} so'm
- To'lov: naqd ${payStats.cash} ta, karta ${payStats.card} ta, nasiya ${payStats.installment} ta

👥 MIJOZLAR (${MOCK_CUSTOMERS.length} ta jami):
- VIP (gold): ${vipCount} ta
- Sodiq (silver): ${loyalCount} ta
- Yangi/oddiy: ${newCount} ta
- Nasiyadorlar: ${debtors} ta

🚀 ENG TEZ SOTILADIGAN:
${topFast.map((p, i) => `${i+1}. ${p.name} (${p.brand}): ${p.total} ta jami, bu oy ${p.thisMonth} ta`).join('\n') || 'ma\'lumot yo\'q'}

🐢 ENG SEKIN SOTILADIGAN (diqqat kerak):
${topSlow.map((p, i) => `${i+1}. ${p.name} (${p.brand}): ${p.total} ta`).join('\n') || 'yo\'q'}

📦 ZAXIRADA BOR, HECH SOTILMAGAN:
${unsoldProducts.map(p => `- ${p.name} (${p.brand || '—'})`).join('\n') || 'yo\'q'}

🎯 FAOL AKSIYALAR: ${activePromos.map(p => p.name).join(', ') || 'yo\'q'}
⚠️ OMBOR SIGNALLARI: ${inventoryAlerts.map(a => a.message).join('; ') || 'yo\'q'}

TAHLIL QILING:
1. Savdoni oshirish uchun eng muhim 3 ta qadamni bering
2. Mijozlar oqimini ko'paytirish strategiyasi (VIP, yangi, nasiyadorlar bo'yicha)
3. Sekin sotiladigan tovarlarni tezroq sotish yo'llari
4. Narx/aksiya strategiyasi — foyda marjasini saqlab savdoni oshirish
5. 1 oy, 3 oy, 6 oylik aniq o'sish rejasi`,
    deps: [version, selectedShopId, MOCK_SALES.length, totalRevenue, MOCK_CUSTOMERS.length],
  })

  useEffect(() => {
    if (analysis && !analysis.raw) {
      analysis.recommendations?.slice(0, 2).forEach(r => addActivity({ agentId: 'marketing', type: 'RECOMMENDATION', message: r.action }))
      analysis.alerts?.forEach(a => addActivity({ agentId: 'marketing', type: 'ALERT', message: a.message }))
    }
  }, [analysis])

  const systemPrompt = useMemo(() => `Sen tajribali MARKETING MENEJERI va biznes strategistisan — shina/g'ildirak do'kon CRM tizimida ishlaysan.

=== JORIY DO'KON MA'LUMOTI ===
Davr: ${currentMonth}-oy, fasl: ${seasonLabel}
Bu oy sotilgan: ${thisMonthSales.length} ta | Tushum: ${thisMonthRev.toLocaleString()} so'm | O'sish: ${revGrowth}%
Sof foyda: ${totalProfit.toLocaleString()} so'm | Marja: ${avgMargin}%
Sof pul oqimi: ${netCashFlow.toLocaleString()} so'm
Mijozlar: ${MOCK_CUSTOMERS.length} ta (VIP: ${vipCount}, sodiq: ${loyalCount}, yangi: ${newCount}, nasiyador: ${debtors})
Eng tez sotiladigan: ${topFast.slice(0,3).map(p => p.name).join(', ') || 'ma\'lumot yo\'q'}
Eng sekin sotiladigan: ${topSlow.slice(0,3).map(p => p.name).join(', ') || 'yo\'q'}
Sotilmagan (zaxirada): ${unsoldProducts.slice(0,3).map(p => p.name).join(', ') || 'yo\'q'}
Faol aksiyalar: ${activePromos.length} ta
To'lov: naqd ${payStats.cash}, karta ${payStats.card}, nasiya ${payStats.installment}

VAZIFANG: Savdoni oshirish, mijozlar oqimini ko'paytirish, strategik reja tuzish. O'zbek tilida, aniq va amaliy tavsiyalar ber.`, [currentMonth, seasonLabel, thisMonthSales.length, thisMonthRev, revGrowth, totalProfit, avgMargin, netCashFlow, MOCK_CUSTOMERS.length, vipCount, loyalCount, newCount, debtors])

  const doneCount = roadmapItems.filter(r => r.done).length
  const SECTIONS = [
    { id: 'analysis', label: 'Tahlil',     Icon: TrendingUp },
    { id: 'roadmap',  label: `Yo'l xaritasi${roadmapItems.length ? ` (${doneCount}/${roadmapItems.length})` : ''}`, Icon: Map },
  ]

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {SECTIONS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setActiveSection(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              activeSection === id
                ? 'bg-[#f97316]/10 text-[#f97316] border-[#f97316]/30'
                : 'text-text-muted border-border hover:bg-bg-secondary'
            }`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── TAHLIL ── */}
        {activeSection === 'analysis' && (
          <motion.div key="analysis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <AgentAnalysisPanel loading={loading} analysis={analysis} error={error} refresh={refresh} accentColor="text-[#f97316]" />
            <AiChat agentId="pr-agent" colorClass="accent-orange" systemPrompt={systemPrompt}
              placeholder="Marketing strategiyasi, savdoni oshirish, mijozlar haqida so'rang..." />
          </motion.div>
        )}

        {/* ── YO'L XARITASI ── */}
        {activeSection === 'roadmap' && (
          <motion.div key="roadmap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <p className="text-xs text-text-muted">AI tahlil asosida yoki qo'lda rejalar kiriting. Bajarilganlarni belgilang.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { phase: '1oy', label: '1 Oy',  color: 'text-[#22c55e]', border: 'border-[#22c55e]/30', bg: 'bg-[#22c55e]/5' },
                { phase: '3oy', label: '3 Oy',  color: 'text-[#f97316]', border: 'border-[#f97316]/30', bg: 'bg-[#f97316]/5' },
                { phase: '6oy', label: '6 Oy',  color: 'text-accent-blue', border: 'border-accent-blue/30', bg: 'bg-accent-blue/5' },
              ].map(({ phase, label, color, border, bg }) => {
                const items = roadmapItems.filter(r => r.phase === phase)
                const done  = items.filter(r => r.done).length
                return (
                  <div key={phase} className={`rounded-2xl border ${border} ${bg} p-4 space-y-3`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${color}`}>{label} rejasi</span>
                      {items.length > 0 && <span className="text-xs text-text-muted">{done}/{items.length} bajarildi</span>}
                    </div>
                    <div className="space-y-2">
                      {items.map(r => (
                        <div key={r.id} className="flex items-start gap-2 group">
                          <button onClick={() => toggleRoadmapItem(r.id)} className={`mt-0.5 flex-shrink-0 ${r.done ? color : 'text-text-muted'}`}>
                            <CheckCircle2 size={15} />
                          </button>
                          <span className={`text-sm flex-1 leading-snug ${r.done ? 'line-through text-text-muted' : 'text-text-primary'}`}>{r.text}</span>
                          <button onClick={() => deleteRoadmapItem(r.id)} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-[#E63946] transition-all flex-shrink-0">
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={rmInput[phase]}
                        onChange={e => setRmInput(prev => ({ ...prev, [phase]: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && rmInput[phase].trim()) {
                            addRoadmapItem(phase, rmInput[phase].trim())
                            setRmInput(prev => ({ ...prev, [phase]: '' }))
                          }
                        }}
                        placeholder="Reja qo'shish..."
                        className="flex-1 bg-bg-primary border border-border rounded-xl px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-[#f97316]/50"
                      />
                      <button
                        onClick={() => {
                          if (rmInput[phase].trim()) {
                            addRoadmapItem(phase, rmInput[phase].trim())
                            setRmInput(prev => ({ ...prev, [phase]: '' }))
                          }
                        }}
                        className={`px-2 py-1.5 rounded-xl text-xs font-medium ${color} border ${border}`}>
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* AI tavsiyalaridan yo'l xaritasiga qo'shish */}
            {analysis && !analysis.raw && analysis.recommendations?.length > 0 && (
              <div className="p-4 border border-[#f97316]/20 rounded-2xl bg-[#f97316]/5">
                <p className="text-xs text-[#f97316] font-medium mb-3">🤖 AI tavsiyalari — yo'l xaritasiga qo'shish</p>
                <div className="space-y-2">
                  {analysis.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                        rec.priority === 'high' ? 'bg-[#E63946]/10 text-[#E63946]' :
                        rec.priority === 'medium' ? 'bg-amber-400/10 text-amber-400' :
                        'bg-[#22c55e]/10 text-[#22c55e]'
                      }`}>{rec.priority === 'high' ? 'Shoshilinch' : rec.priority === 'medium' ? "O'rta" : 'Keyinroq'}</span>
                      <span className="text-xs text-text-secondary flex-1">{rec.action}</span>
                      <div className="flex gap-1 flex-shrink-0">
                        {['1oy','3oy','6oy'].map(ph => (
                          <button key={ph} onClick={() => addRoadmapItem(ph, rec.action)}
                            className="text-xs px-2 py-0.5 rounded border border-border text-text-muted hover:bg-bg-secondary transition-colors">
                            +{ph}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MarketingTab
