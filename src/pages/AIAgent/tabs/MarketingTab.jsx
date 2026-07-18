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

  const { loading, analysis, error, refresh } = useAgentAnalysis({
    agentId: 'pr-agent',
    enabled: MOCK_PRODUCTS.length > 0 || MOCK_SALES.length > 0,
    buildPrompt: () => `Sen GoodTires marketing agentisan. Quyidagi ma'lumotlar asosida brend, mijozlar oqimi va tovar aylanmasini yaxshilash bo'yicha aniq takliflar ber.

📅 FASL: ${seasonLabel} (${currentMonth}-oy)

📦 TOVAR AYLANMASI:
Bu oy sotilgan: ${thisMonthSales.length} ta | O'tgan oy: ${lastMonthSales.length} ta | O'sish: ${revGrowth}%

ENG TEZ SOTILADIGAN (kuchaytirilsin):
${topFast.map((p, i) => `${i+1}. ${p.name} (${p.brand}): bu oy ${p.thisMonth} ta, jami ${p.total} ta`).join('\n') || 'ma\'lumot yo\'q'}

ENG SEKIN SOTILADIGAN (kampaniya kerak!):
${topSlow.map((p, i) => `${i+1}. ${p.name} (${p.brand}): ${p.total} ta`).join('\n') || 'yo\'q'}

ZAXIRADA BOR, HECH SOTILMAGAN (tezkor harakatlar kerak):
${unsoldProducts.map(p => `- ${p.name} (${p.brand || '—'})`).join('\n') || 'yo\'q'}

👥 MIJOZLAR OQIMI (${MOCK_CUSTOMERS.length} ta jami):
- VIP: ${vipCount} ta — ushlab qolish strategiyasi kerak
- Sodiq: ${loyalCount} ta — VIP ga ko'tarilishi mumkin
- Yangi/bir martalik: ${newCount} ta — qayta jalb kerak
- Nasiyadorlar: ${debtors} ta — muloqot va eslatma strategiyasi

🎯 FAOL AKSIYALAR: ${activePromos.map(p => p.name).join(', ') || 'hozircha yo\'q'}

TAHLIL VA TAKLIFLAR:
1. Qotib qolgan tovarlarni tezroq sotish uchun kampaniya g'oyalari
2. Yangi mijozlarni jalb qilish va mavjudlarini ushlab qolish yo'llari
3. GoodTires brendini ko'tarish — sodiqlik, referral, takroriy xarid
4. Sezoniy marketing — ${seasonLabel} faslida qaysi tovar, qaysi auditoriya
5. 1 oy, 3 oy, 6 oylik marketing yo'l xaritasi`,
    deps: [version, selectedShopId, MOCK_SALES.length, MOCK_CUSTOMERS.length, topFast.length, unsoldProducts.length],
  })

  useEffect(() => {
    if (analysis && !analysis.raw) {
      analysis.recommendations?.slice(0, 2).forEach(r => addActivity({ agentId: 'marketing', type: 'RECOMMENDATION', message: r.action }))
      analysis.alerts?.forEach(a => addActivity({ agentId: 'marketing', type: 'ALERT', message: a.message }))
    }
  }, [analysis])

  const systemPrompt = useMemo(() => `Sen GoodTires do'konining MARKETING AGENTI — brend, mijozlar oqimi va tovar aylanmasiga ixtisoslashgansa.

=== JORIY MARKETING MA'LUMOTI ===
Fasl: ${seasonLabel} | Oy: ${currentMonth}
Bu oy: ${thisMonthSales.length} ta sotuv | O'tgan oy: ${lastMonthSales.length} ta | O'sish: ${revGrowth}%
Eng tez sotiladigan: ${topFast.slice(0,3).map(p => p.name).join(', ') || 'yo\'q'}
Eng sekin sotiladigan: ${topSlow.slice(0,3).map(p => p.name).join(', ') || 'yo\'q'}
Sotilmagan (zaxirada): ${unsoldProducts.slice(0,3).map(p => p.name).join(', ') || 'yo\'q'}
Mijozlar: ${MOCK_CUSTOMERS.length} ta (VIP: ${vipCount}, sodiq: ${loyalCount}, yangi: ${newCount}, nasiyador: ${debtors})
Faol aksiyalar: ${activePromos.length} ta

SENGA TEGISHLI: Brend ko'tarish, mijoz jalb qilish/ushlab qolish, qotib qolgan tovarlarni sotish, sezoniy kampaniyalar.
SENGA TEGISHLI EMAS: Moliyaviy tahlil, foyda/marja/xarajat hisob-kitoblari — bu Savdo agentining ishi.
JAVOB: O'zbek tilida, ijodiy va amaliy.`, [currentMonth, seasonLabel, thisMonthSales.length, lastMonthSales.length, revGrowth, MOCK_CUSTOMERS.length, vipCount, loyalCount, newCount, debtors, activePromos.length])

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
