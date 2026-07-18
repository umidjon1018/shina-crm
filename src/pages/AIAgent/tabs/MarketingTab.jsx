import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Map, CheckCircle2, Plus, X, RefreshCw, Heart, MessageCircle, AlertCircle, Link2 } from 'lucide-react'

const IgIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
)
import { useAgentActivityStore } from '../../../store/agentActivityStore'
import { useDataStore } from '../../../store/dataStore'
import { useShopStore } from '../../../store/shopStore'
import { useAgentAnalysis } from '../hooks/useAgentAnalysis'
import { useMarketingStore } from '../../../store/marketingStore'
import AgentAnalysisPanel from '../components/AgentAnalysisPanel'
import AiChat from '../components/AiChat'

function MarketingTab({ aiData = {}, agentConfig = null }) {
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
  } = aiData

  const filterShop = arr => selectedShopId === 'all' ? arr : arr.filter(s => String(s.shopId) === String(selectedShopId))
  const MOCK_SALES      = filterShop(_allSales).filter(s => s.status !== 'cancelled')
  const MOCK_USED_SALES = filterShop(_allUsedSales).filter(s => s.status !== 'cancelled')
  const MOCK_BATCHES    = filterShop(_allBatches)

  const currentMonth  = new Date().getMonth() + 1
  const thisMonthKey  = new Date().toISOString().slice(0, 7)
  const lastMonthKey  = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7)
  const seasonLabel   = currentMonth >= 3 && currentMonth <= 8 ? 'YOZ' : 'QIŠ'

  const allCompleted   = [...MOCK_SALES, ...MOCK_USED_SALES]
  const thisMonthSales = allCompleted.filter(s => (s.soldAt || s.createdAt || '').startsWith(thisMonthKey))
  const lastMonthSales = allCompleted.filter(s => (s.soldAt || s.createdAt || '').startsWith(lastMonthKey))
  const lastMonthCount = lastMonthSales.length
  const revGrowth      = lastMonthCount > 0 ? (((thisMonthSales.length - lastMonthCount) / lastMonthCount) * 100).toFixed(1) : 'n/a'

  const vipCount    = MOCK_CUSTOMERS.filter(c => c.loyaltyLevel === 'gold').length
  const loyalCount  = MOCK_CUSTOMERS.filter(c => c.loyaltyLevel === 'silver').length
  const newCount    = MOCK_CUSTOMERS.filter(c => !c.loyaltyLevel || c.loyaltyLevel === 'none').length
  const debtors     = MOCK_CUSTOMERS.filter(c => (c.installmentDebt || 0) > 0).length

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

  const activePromos    = MOCK_PROMOTIONS.filter(p => p.isActive)
  const inventoryAlerts = getActivitiesByAgent('inventory').filter(a => a.type === 'ALERT').slice(0, 3)

  // Mijozlar manbalari tahlili
  const sourceCounts = useMemo(() => {
    const counts = {}
    MOCK_SALES.forEach(s => {
      const src = s.source || 'walk_in'
      counts[src] = (counts[src] || 0) + 1
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [MOCK_SALES])

  // Qayta kelgan mijozlar
  const repeatCustomers = useMemo(() => {
    const counts = {}
    MOCK_SALES.forEach(s => { if (s.customerId) counts[s.customerId] = (counts[s.customerId] || 0) + 1 })
    return Object.values(counts).filter(n => n > 1).length
  }, [MOCK_SALES])

  // So'nggi 3 oylik trend
  const monthTrend = useMemo(() => {
    const months = []
    for (let i = 2; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      const key = d.toISOString().slice(0, 7)
      const label = `${d.getMonth() + 1}-oy`
      const count = [...MOCK_SALES, ...MOCK_USED_SALES].filter(s => (s.soldAt || s.createdAt || '').startsWith(key) && s.status !== 'cancelled').length
      months.push({ label, count })
    }
    return months
  }, [MOCK_SALES, MOCK_USED_SALES])

  // Brend bo'yicha sotuv
  const brandCounts = useMemo(() => {
    const counts = {}
    MOCK_SALES.forEach(s => s.items?.forEach(i => {
      const p = MOCK_PRODUCTS.find(pr => pr.id === i.productId)
      const brand = p?.brand || 'Noma\'lum'
      counts[brand] = (counts[brand] || 0) + (i.qty || 1)
    }))
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [MOCK_SALES, MOCK_PRODUCTS])

  const hasTool = name => !agentConfig?.tools?.length || agentConfig.tools.includes(name)

  const { loading, analysis, error, refresh } = useAgentAnalysis({
    agentId: 'pr-agent',
    enabled: MOCK_PRODUCTS.length > 0 || MOCK_SALES.length > 0,
    buildPrompt: () => {
      const role = agentConfig?.systemPrompt || "Sen GoodTires shina va disk do'konining marketing menejeri/strategistisan. Quyidagi CRM ma'lumotlarini to'liq tahlil qilib, savdoni oshirish, yangi mijozlarni jalb qilish va mavjudlarini ushlab qolish bo'yicha aniq, amaliy reja tuz."
      return role + `

━━━ DO'KON HOLATI ━━━
Fasl: ${seasonLabel} (${currentMonth}-oy)
Jami mijozlar: ${MOCK_CUSTOMERS.length} ta | Jami tovar turlari: ${MOCK_PRODUCTS.length} ta

━━━ SOTUV TRENDI (3 OY) ━━━
${monthTrend.map(m => `${m.label}: ${m.count} ta sotuv`).join(' → ')}
Bu oy o'sish: ${revGrowth}%

━━━ MIJOZLAR SEGMENTI ━━━
VIP (oltin): ${vipCount} ta — ushlab qolish, maxsus taklif kerak
Sodiq (kumush): ${loyalCount} ta — VIP ga ko'tarish imkoni bor
Yangi / bir martalik: ${newCount} ta — qayta jalb qilish kerak
Nasiyadorlar: ${debtors} ta — aktiv muloqot va eslatma zarur
Qayta kelgan mijozlar: ${repeatCustomers} ta (${MOCK_CUSTOMERS.length ? Math.round(repeatCustomers / MOCK_CUSTOMERS.length * 100) : 0}% retention)

━━━ MIJOZLAR MANBALARI ━━━
${sourceCounts.slice(0, 5).map(([src, cnt]) => `${src}: ${cnt} ta (${Math.round(cnt / Math.max(MOCK_SALES.length, 1) * 100)}%)`).join('\n') || 'ma\'lumot yo\'q'}

━━━ TOVAR AYLANMASI ━━━
ENG TEZ SOTILADIGAN (kuchaytirish kerak):
${topFast.map((p, i) => `${i+1}. ${p.name} (${p.brand}): bu oy ${p.thisMonth} ta, jami ${p.total} ta`).join('\n') || 'yo\'q'}

ENG SEKIN SOTILADIGAN (kampaniya zarur):
${topSlow.map((p, i) => `${i+1}. ${p.name} (${p.brand}): ${p.total} ta`).join('\n') || 'yo\'q'}

ZAXIRADA BOR, HECH SOTILMAGAN (tezkor harakat kerak):
${unsoldProducts.map(p => `- ${p.name} (${p.brand || '—'})`).join('\n') || 'yo\'q'}

━━━ BREND TAHLILI ━━━
${brandCounts.map(([brand, cnt]) => `${brand}: ${cnt} ta sotilgan`).join('\n') || 'yo\'q'}

━━━ FAOL AKSIYALAR ━━━
${activePromos.length ? activePromos.map(p => `- ${p.name}`).join('\n') : 'Hozircha faol aksiya yo\'q'}

━━━ KERAKLI TAHLIL VA REJA ━━━
1. SAVDONI OSHIRISH: Qaysi tovarlar, qaysi segment, qaysi kanal orqali — aniq raqamlar bilan
2. YANGI MIJOZLAR: Qaysi manbadan ko'proq kelmoqda, qayerga e'tibor berish kerak
3. RETENTION STRATEGIYA: VIP, sodiq, bir martalik — har biri uchun alohida yondashuv
4. QOTIB QOLGAN TOVARLAR: Ularni tezda sotish uchun kampaniya g'oyalari
5. SEZONIY MARKETING: ${seasonLabel} faslida eng dolzarb harakatlar
6. INSTAGRAM: Ohvatni oshirish, qanday kontentlar qo'yish, qachon post qilish
7. YO'L XARITASI: 1 oy — tezkor harakatlar; 3 oy — o'rta muddatli; 6 oy — strategik`
    },
    deps: [version, selectedShopId, MOCK_SALES.length, MOCK_CUSTOMERS.length, topFast.length, unsoldProducts.length, repeatCustomers, sourceCounts.length, agentConfig?.tools?.join()],
  })

  useEffect(() => {
    if (analysis && !analysis.raw) {
      analysis.recommendations?.slice(0, 2).forEach(r => addActivity({ agentId: 'marketing', type: 'RECOMMENDATION', message: r.action }))
      analysis.alerts?.forEach(a => addActivity({ agentId: 'marketing', type: 'ALERT', message: a.message }))
    }
  }, [analysis])

  const systemPrompt = useMemo(() => {
    const base = agentConfig?.systemPrompt || "Sen GoodTires shina va disk do'konining MARKETING MENEJERI VA STRATEGISTISAN."
    return base + `

=== JORIY HOLAT ===
Fasl: ${seasonLabel} (${currentMonth}-oy)
3 oylik trend: ${monthTrend.map(m => `${m.label}: ${m.count} ta`).join(' → ')} | Bu oy o'sish: ${revGrowth}%
Mijozlar: ${MOCK_CUSTOMERS.length} ta jami (VIP: ${vipCount} | Sodiq: ${loyalCount} | Yangi: ${newCount} | Nasiyador: ${debtors})
Retention: ${repeatCustomers} ta qayta kelgan (${MOCK_CUSTOMERS.length ? Math.round(repeatCustomers / MOCK_CUSTOMERS.length * 100) : 0}%)
Eng yaxshi manbalar: ${sourceCounts.slice(0, 3).map(([s, c]) => `${s}(${c})`).join(', ') || 'yo\'q'}
Eng tez sotiladigan: ${topFast.slice(0,3).map(p => p.name).join(', ') || 'yo\'q'}
Eng sekin sotiladigan: ${topSlow.slice(0,3).map(p => p.name).join(', ') || 'yo\'q'}
Sotilmagan (zaxirada): ${unsoldProducts.slice(0,3).map(p => p.name).join(', ') || 'yo\'q'}
Faol aksiyalar: ${activePromos.length ? activePromos.map(p => p.name).join(', ') : 'yo\'q'}

=== SENING VAZIFANG ===
— Savdoni oshirish: to'g'ri tovar, to'g'ri vaqt, to'g'ri kanal
— Yangi mijozlarni jalb qilish: qaysi manbani kuchaytirish, qanday kampaniya
— Mavjud mijozlarni ushlab qolish: VIP dasturi, eslatmalar, maxsus takliflar
— Qotib qolgan tovarlarni sotish: chegirma, paket, aksiya g'oyalari
— Instagram strategiyasi: qanday kontentlar, hashtag, posting vaqti, engagement oshirish
— Yo'l xaritasi tuzish: 1/3/6 oylik rejalashtirilgan harakatlar

=== CHEGARA ===
Foyda/zarar/marja/xarajat hisob-kitoblari SENING ISHINGMAS — bu Savdo agentining vazifasi.
JAVOB: O'zbek tilida, aniq va amaliy.`
  }, [agentConfig?.systemPrompt, agentConfig?.tools?.join(), currentMonth, seasonLabel, monthTrend, thisMonthSales.length, lastMonthSales.length, revGrowth, MOCK_CUSTOMERS.length, vipCount, loyalCount, newCount, debtors, activePromos.length, repeatCustomers, sourceCounts, topFast, topSlow, unsoldProducts])

  // Instagram integratsiya
  const igConfig = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('goodtires-pr-integrations') || '{}') } catch { return {} }
  }, [activeSection])
  const igHandle  = igConfig?.instagram?.handle || ''
  const igWebhook = igConfig?.instagram?.webhookUrl || ''
  const igEnabled = igConfig?.instagram?.enabled || false

  const [igData,    setIgData]    = useState(null)   // { username, followers, posts: [] }
  const [igLoading, setIgLoading] = useState(false)
  const [igError,   setIgError]   = useState(null)

  const fetchIgData = async () => {
    if (!igWebhook) return
    setIgLoading(true)
    setIgError(null)
    try {
      const res = await fetch(igWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_insights' }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setIgData(data)
    } catch (e) {
      setIgError(e.message || 'Xato')
    } finally {
      setIgLoading(false)
    }
  }

  const igSystemPrompt = useMemo(() => {
    if (!igData) return null
    const posts = igData.posts || []
    const avgLikes    = posts.length ? Math.round(posts.reduce((s, p) => s + (p.likes || 0), 0) / posts.length) : 0
    const avgComments = posts.length ? Math.round(posts.reduce((s, p) => s + (p.comments || 0), 0) / posts.length) : 0
    const topPost     = [...posts].sort((a, b) => (b.likes || 0) - (a.likes || 0))[0]
    const worstPost   = [...posts].sort((a, b) => (a.likes || 0) - (b.likes || 0))[0]
    return `Sen GoodTires do'konining INSTAGRAM TAHLIL AGENTISAN.

=== INSTAGRAM MA'LUMOTLARI ===
Akkaunt: ${igData.username || igHandle}
Obunachilar: ${igData.followers || 'noma\'lum'}
Oxirgi ${posts.length} ta post:
- O'rtacha like: ${avgLikes}
- O'rtacha komment: ${avgComments}
- Eng yaxshi post: "${topPost?.caption?.slice(0, 80) || '—'}" — ${topPost?.likes || 0} like
- Eng kam ohvat olgan: "${worstPost?.caption?.slice(0, 80) || '—'}" — ${worstPost?.likes || 0} like

POSTLAR RO'YXATI:
${posts.slice(0, 10).map((p, i) => `${i+1}. ${p.likes || 0} ❤️ ${p.comments || 0} 💬 | ${(p.caption || '').slice(0, 60)}`).join('\n')}

VAZIFANG: Ohvatni oshirish uchun aniq, amaliy tavsiyalar ber:
- Qaysi turdagi kontentlar yaxshi ishlayapti
- Qanday caption yozish kerak
- Hashtag strategiyasi
- Posting vaqti va chastotasi
- Engagement oshirish yo'llari
JAVOB: O'zbek tilida, qisqa va amaliy.`
  }, [igData, igHandle])

  const doneCount = roadmapItems.filter(r => r.done).length
  const SECTIONS = [
    { id: 'analysis',  label: 'Tahlil',     Icon: TrendingUp },
    { id: 'roadmap',   label: `Yo'l xaritasi${roadmapItems.length ? ` (${doneCount}/${roadmapItems.length})` : ''}`, Icon: Map },
    { id: 'instagram', label: 'Instagram',   Icon: IgIcon },
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
        {/* ── INSTAGRAM ── */}
        {activeSection === 'instagram' && (
          <motion.div key="instagram" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">

            {/* Akkaunt holati + yangilash */}
            <div className={`flex items-center gap-3 p-4 rounded-2xl border ${igEnabled && igHandle ? 'border-pink-500/30 bg-pink-500/5' : 'border-border bg-bg-secondary'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${igEnabled && igHandle ? 'bg-pink-500/15' : 'bg-bg-primary border border-border'}`}>
                <IgIcon size={18} className={igEnabled && igHandle ? 'text-pink-500' : 'text-text-muted'} />
              </div>
              <div className="flex-1 min-w-0">
                {igEnabled && igHandle ? (
                  <>
                    <p className="text-sm font-semibold text-text-primary">{igHandle.startsWith('@') ? igHandle : `@${igHandle}`}</p>
                    <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5"><Link2 size={10} /> make.com orqali ulangan</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-text-secondary">Instagram ulanmagan</p>
                    <p className="text-xs text-text-muted mt-0.5">Admin panel → AI Agentlar → Marketing agenti → Integratsiyalar</p>
                  </>
                )}
              </div>
              {igEnabled && igWebhook && (
                <button
                  onClick={fetchIgData}
                  disabled={igLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-pink-500/30 text-pink-500 text-xs font-medium hover:bg-pink-500/10 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={12} className={igLoading ? 'animate-spin' : ''} />
                  {igLoading ? 'Yuklanmoqda...' : igData ? 'Yangilash' : 'Ma\'lumot olish'}
                </button>
              )}
            </div>

            {/* Xato */}
            {igError && (
              <div className="flex items-start gap-2 p-3 rounded-xl border border-accent-red/30 bg-accent-red/5">
                <AlertCircle size={14} className="text-accent-red mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-accent-red">Webhook xatosi: {igError}</p>
                  <p className="text-xs text-text-muted mt-0.5">make.com scenario da "Webhook Response" modulida <code className="bg-bg-secondary px-1 rounded">Access-Control-Allow-Origin: *</code> headerini qo'shing</p>
                </div>
              </div>
            )}

            {/* Ma'lumotlar kelgan bo'lsa */}
            {igData && !igLoading && (
              <>
                {/* Statistika kartalari */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Obunachilar',    value: igData.followers?.toLocaleString('uz-UZ') || '—' },
                    { label: 'O\'rtacha like',  value: igData.posts?.length ? Math.round(igData.posts.reduce((s,p) => s+(p.likes||0),0)/igData.posts.length) : '—' },
                    { label: 'O\'rtacha izoh',  value: igData.posts?.length ? Math.round(igData.posts.reduce((s,p) => s+(p.comments||0),0)/igData.posts.length) : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-3 rounded-xl border border-pink-500/20 bg-pink-500/5 text-center">
                      <p className="text-lg font-bold text-text-primary">{value}</p>
                      <p className="text-xs text-text-muted mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Postlar ro'yxati */}
                {igData.posts?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-text-secondary">Oxirgi postlar</p>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {igData.posts.slice(0, 10).map((post, i) => (
                        <div key={post.id || i} className="flex items-start gap-3 p-3 rounded-xl bg-bg-secondary border border-border">
                          <span className="text-xs text-text-muted w-4 flex-shrink-0 mt-0.5">{i+1}.</span>
                          <p className="text-xs text-text-primary flex-1 leading-relaxed line-clamp-2">{post.caption || '(matn yo\'q)'}</p>
                          <div className="flex items-center gap-2 flex-shrink-0 text-xs text-text-muted">
                            <span className="flex items-center gap-1"><Heart size={11} className="text-pink-500" />{post.likes || 0}</span>
                            <span className="flex items-center gap-1"><MessageCircle size={11} />{post.comments || 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI tahlil chat */}
                {igSystemPrompt && (
                  <AiChat
                    agentId="pr-agent-ig"
                    colorClass="accent-pink"
                    systemPrompt={igSystemPrompt}
                    placeholder="Instagram ohvatini oshirish, kontentlar, hashtaglar haqida so'rang..."
                  />
                )}
              </>
            )}

            {/* Ma'lumot yo'q holati */}
            {!igData && !igLoading && igEnabled && igWebhook && (
              <div className="text-center py-10 text-text-muted">
                <IgIcon size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">"Ma'lumot olish" tugmasini bosing</p>
                <p className="text-xs mt-1">make.com Instagram dan so'nggi postlarni olib keladi</p>
              </div>
            )}

            {/* Ulanmagan holat */}
            {(!igEnabled || !igWebhook) && (
              <div className="p-4 rounded-2xl border border-amber-400/20 bg-amber-400/5 flex items-start gap-3">
                <AlertCircle size={15} className="text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-text-secondary space-y-1">
                  <p className="font-medium text-text-primary">Sozlash kerak:</p>
                  <p>1. make.com da scenario yarating: <strong>Webhook → Instagram: Get User Media → Webhook Response</strong></p>
                  <p>2. Webhook Response da header qo'shing: <code className="bg-bg-secondary px-1 rounded">Access-Control-Allow-Origin: *</code></p>
                  <p>3. Admin panel → AI Agentlar → PR-Agent → Integratsiyalar ga webhook URL va akkaunt kiriting</p>
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
