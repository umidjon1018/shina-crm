import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, FileText, Video, Plus, Check, X, ChevronDown, ChevronUp, Film, Clock, Trash2, Edit3, Map, CheckCircle2 } from 'lucide-react'
import { useAgentActivityStore } from '../../../store/agentActivityStore'
import { useDataStore } from '../../../store/dataStore'
import { useShopStore } from '../../../store/shopStore'
import { useAgentAnalysis } from '../hooks/useAgentAnalysis'
import { useMarketingStore } from '../../../store/marketingStore'
import AgentAnalysisPanel from '../components/AgentAnalysisPanel'
import AiChat from '../components/AiChat'

// Status config
const STATUS = {
  draft:            { label: 'Qoralama',          cls: 'bg-bg-secondary text-text-muted border-border' },
  approved:         { label: 'Tasdiqlangan',       cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
  video_generating: { label: 'Video tayyorlanmoqda', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  video_ready:      { label: 'Video tayyor',       cls: 'bg-accent-blue/15 text-accent-blue border-accent-blue/30' },
  posted:           { label: 'Joylandi',           cls: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
}

function ScenarioForm({ onSave, initial = null, onCancel }) {
  const [title, setTitle]       = useState(initial?.title || '')
  const [product, setProduct]   = useState(initial?.targetProduct || '')
  const [audience, setAudience] = useState(initial?.targetAudience || '')
  const [script, setScript]     = useState(initial?.script || '')
  const [caption, setCaption]   = useState(initial?.caption || '')
  const [hashtags, setHashtags] = useState(initial?.hashtags || '')

  const valid = title.trim() && script.trim()

  return (
    <div className="space-y-3 p-4 border border-border rounded-2xl bg-bg-secondary">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-text-secondary mb-1 block">Senariy sarlavhasi *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Masalan: Michelin qishki kampaniyasi"
            className="w-full bg-bg-primary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-orange" />
        </div>
        <div>
          <label className="text-xs text-text-secondary mb-1 block">Tovar / mahsulot</label>
          <input value={product} onChange={e => setProduct(e.target.value)} placeholder="Qaysi tovar uchun"
            className="w-full bg-bg-primary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-orange" />
        </div>
      </div>
      <div>
        <label className="text-xs text-text-secondary mb-1 block">Maqsadli auditoriya</label>
        <input value={audience} onChange={e => setAudience(e.target.value)} placeholder="Masalan: 25-45 yoshli avtomobil egalari"
          className="w-full bg-bg-primary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-orange" />
      </div>
      <div>
        <label className="text-xs text-text-secondary mb-1 block">Video skript (15-30 soniya) *</label>
        <textarea value={script} onChange={e => setScript(e.target.value)} rows={5}
          placeholder="Video uchun skript matni. Masalan:&#10;[0-3 sek] Do'kon exteryeri, logotip&#10;[3-10 sek] Tovar yaqindan ko'rsatiladi...&#10;[10-20 sek] Narx va aksiya e'lon qilinadi&#10;[20-30 sek] CTA: Manzil va telefon"
          className="w-full bg-bg-primary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-orange resize-none" />
      </div>
      <div>
        <label className="text-xs text-text-secondary mb-1 block">Instagram caption (post matni)</label>
        <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={3}
          placeholder="Instagram postiga yoziladigan matn (o'zbek/rus)"
          className="w-full bg-bg-primary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-orange resize-none" />
      </div>
      <div>
        <label className="text-xs text-text-secondary mb-1 block">Hashtaglar</label>
        <input value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="#goodtires #shina #toshkent"
          className="w-full bg-bg-primary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-orange" />
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave({ title, targetProduct: product, targetAudience: audience, script, caption, hashtags })}
          disabled={!valid}
          className="flex-1 py-2 rounded-xl bg-[#f97316] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2">
          <Check size={14} /> {initial ? 'Saqlash' : 'Senariy qo\'shish'}
        </button>
        {onCancel && (
          <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-border text-text-muted text-sm hover:bg-bg-primary transition-colors">
            Bekor
          </button>
        )}
      </div>
    </div>
  )
}

function ScenarioCard({ sc, onApprove, onReject, onDelete, onEdit, onSendHighsfield, onPostInstagram }) {
  const [expanded, setExpanded] = useState(false)
  const st = STATUS[sc.status] || STATUS.draft
  const higgsfieldConnected = false  // TODO: settingsStore dan aiApiKey || integrations.higgsfield.enabled
  const instagramConnected  = false  // TODO: make.com webhook ulanganda true

  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-bg-secondary/50 transition-colors" onClick={() => setExpanded(e => !e)}>
        <div className="w-9 h-9 rounded-xl bg-[#f97316]/10 border border-[#f97316]/20 flex items-center justify-center flex-shrink-0">
          <FileText size={15} className="text-[#f97316]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-text-primary text-sm truncate">{sc.title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {sc.targetProduct && <span className="text-xs text-text-muted">{sc.targetProduct}</span>}
            <span className={`text-xs px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
            <span className="text-xs text-text-muted flex items-center gap-1">
              <Clock size={10} /> {new Date(sc.createdAt).toLocaleDateString('uz-UZ')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
          {sc.status === 'draft' && (
            <>
              <button onClick={() => onEdit(sc)} className="p-1.5 rounded-lg hover:bg-bg-secondary text-text-muted hover:text-[#f97316] transition-colors" title="Tahrirlash">
                <Edit3 size={14} />
              </button>
              <button onClick={() => onApprove(sc.id)} className="p-1.5 rounded-lg hover:bg-green-500/10 text-text-muted hover:text-green-400 transition-colors" title="Tasdiqlash">
                <Check size={14} />
              </button>
            </>
          )}
          {sc.status === 'approved' && (
            <>
              <button onClick={() => onReject(sc.id)} className="p-1.5 rounded-lg hover:bg-bg-secondary text-text-muted transition-colors text-xs px-2" title="Qayta qoralamaga">
                <X size={14} />
              </button>
              <button
                onClick={() => higgsfieldConnected ? onSendHighsfield(sc.id) : null}
                title={higgsfieldConnected ? 'Higgsfield ga yuborish' : 'Higgsfield API ulanmagan'}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  higgsfieldConnected
                    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20 cursor-pointer'
                    : 'bg-bg-secondary text-text-muted border-border cursor-not-allowed opacity-50'
                }`}>
                <Film size={12} /> Video tayyorla
              </button>
            </>
          )}
          {sc.status === 'video_ready' && !sc.instagramPosted && (
            <button
              onClick={() => instagramConnected ? onPostInstagram(sc.id) : null}
              title={instagramConnected ? 'Instagramga joylash' : 'Instagram ulanmagan (make.com kerak)'}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                instagramConnected
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20 cursor-pointer'
                  : 'bg-bg-secondary text-text-muted border-border cursor-not-allowed opacity-50'
              }`}>
              <Film size={12} /> Joylash
            </button>
          )}
          <button onClick={() => onDelete(sc.id)} className="p-1.5 rounded-lg hover:bg-accent-red/10 text-text-muted hover:text-accent-red transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
        {expanded ? <ChevronUp size={15} className="text-text-muted flex-shrink-0" /> : <ChevronDown size={15} className="text-text-muted flex-shrink-0" />}
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border-t border-border overflow-hidden">
            <div className="p-4 space-y-4 bg-bg-secondary/30">
              {sc.targetAudience && (
                <div>
                  <p className="text-xs text-text-secondary mb-1">Maqsadli auditoriya</p>
                  <p className="text-sm text-text-primary">{sc.targetAudience}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-text-secondary mb-1 flex items-center gap-1"><Film size={11} /> Video skript</p>
                <pre className="text-sm text-text-primary whitespace-pre-wrap bg-bg-primary border border-border rounded-xl p-3 font-sans leading-relaxed">{sc.script}</pre>
              </div>
              {sc.caption && (
                <div>
                  <p className="text-xs text-text-secondary mb-1 flex items-center gap-1"><Film size={11} /> Caption</p>
                  <p className="text-sm text-text-primary bg-bg-primary border border-border rounded-xl p-3 whitespace-pre-wrap">{sc.caption}</p>
                </div>
              )}
              {sc.hashtags && (
                <div>
                  <p className="text-xs text-text-secondary mb-1">Hashtaglar</p>
                  <p className="text-sm text-purple-400">{sc.hashtags}</p>
                </div>
              )}
              {sc.videoUrl && (
                <div>
                  <p className="text-xs text-text-secondary mb-1 flex items-center gap-1"><Video size={11} /> Video</p>
                  <video src={sc.videoUrl} controls className="w-full rounded-xl border border-border max-h-64" />
                </div>
              )}
              {!higgsfieldConnected && sc.status === 'approved' && (
                <p className="text-xs text-text-muted bg-yellow-500/5 border border-yellow-500/20 rounded-xl px-3 py-2">
                  ⚡ Higgsfield API ulangandan keyin "Video tayyorla" tugmasi ishlaydi
                </p>
              )}
              {!instagramConnected && sc.status === 'video_ready' && (
                <p className="text-xs text-text-muted bg-purple-500/5 border border-purple-500/20 rounded-xl px-3 py-2">
                  📸 make.com + Instagram ulangandan keyin "Joylash" tugmasi ishlaydi
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MarketingTab({ aiData = {} }) {
  const { addActivity, getActivitiesByAgent } = useAgentActivityStore()
  const { version } = useDataStore()
  const { selectedShopId } = useShopStore()
  const { scenarios, addScenario, updateScenario, deleteScenario, approveScenario, rejectScenario, setVideoGenerating, setVideoReady, setInstagramPosted, roadmapItems, addRoadmapItem, toggleRoadmapItem, deleteRoadmapItem } = useMarketingStore()

  const [activeSection, setActiveSection] = useState('analysis')
  const [rmInput, setRmInput]   = useState({ '1oy': '', '3oy': '', '6oy': '' })
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingScenario, setEditingScenario] = useState(null)

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
  const MOCK_SALES   = filterShop(_allSales).filter(s => s.status !== 'cancelled')
  const MOCK_BATCHES = filterShop(_allBatches)
  const MOCK_USED    = _allUsedSales.filter(s => s.status !== 'cancelled')

  const currentMonth = new Date().getMonth() + 1
  const thisMonthKey = new Date().toISOString().slice(0, 7)
  const lastMonthKey = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7)
  const seasonLabel  = currentMonth >= 3 && currentMonth <= 8 ? 'YOZ' : 'QIŠ'

  const productVelocity = useMemo(() => {
    const counts = {}
    MOCK_SALES.forEach(s => s.items?.forEach(i => {
      const p = MOCK_PRODUCTS.find(pr => pr.id === i.productId)
      const name = p?.name || i.name || '?'
      if (!counts[name]) counts[name] = { name, brand: p?.brand || '', total: 0, thisMonth: 0, lastMonth: 0 }
      counts[name].total += (i.qty || 1)
      if (s.soldAt?.startsWith(thisMonthKey)) counts[name].thisMonth += (i.qty || 1)
      if (s.soldAt?.startsWith(lastMonthKey)) counts[name].lastMonth += (i.qty || 1)
    }))
    return Object.values(counts).sort((a, b) => b.total - a.total)
  }, [MOCK_SALES, MOCK_PRODUCTS])

  const topFast = productVelocity.slice(0, 5)
  const topSlow = [...productVelocity].sort((a, b) => a.total - b.total).filter(p => p.total > 0).slice(0, 5)
  const shopBatchIds = new Set(MOCK_BATCHES.map(b => b.id))
  const unsoldProducts = MOCK_PRODUCTS.filter(p => {
    const hasStock = MOCK_ITEMS.some(i => i.productId === p.id && i.status === 'in_stock' && (selectedShopId === 'all' || shopBatchIds.has(i.batchId)))
    return hasStock && !productVelocity.find(pv => pv.name === p.name)
  }).slice(0, 5)

  const vipCount   = MOCK_CUSTOMERS.filter(c => c.loyaltyLevel === 'gold').length
  const loyalCount = MOCK_CUSTOMERS.filter(c => c.loyaltyLevel === 'silver').length
  const newCount   = MOCK_CUSTOMERS.filter(c => !c.loyaltyLevel || c.loyaltyLevel === 'none').length
  const thisMonthRev = MOCK_SALES.filter(s => s.soldAt?.startsWith(thisMonthKey)).reduce((s, x) => s + x.total, 0)
  const lastMonthRev = MOCK_SALES.filter(s => s.soldAt?.startsWith(lastMonthKey)).reduce((s, x) => s + x.total, 0)
  const revGrowth    = lastMonthRev > 0 ? (((thisMonthRev - lastMonthRev) / lastMonthRev) * 100).toFixed(1) : 'n/a'
  const activePromos = MOCK_PROMOTIONS.filter(p => p.isActive)
  const inventoryAlerts = getActivitiesByAgent('inventory').filter(a => a.type === 'ALERT').slice(0, 3)
  const customerAlerts  = getActivitiesByAgent('customer').filter(a => a.type === 'ALERT').slice(0, 2)

  const { loading, analysis, error, refresh } = useAgentAnalysis({
    agentId: 'pr-agent',
    enabled: MOCK_PRODUCTS.length > 0,
    buildPrompt: () => `MARKETING VA KONTENT STRATEGIYASI MA'LUMOTLARI:

📅 FASL VA DAVR: ${currentMonth}-oy, fasl: ${seasonLabel}
Bu oy sotilgan: ${MOCK_SALES.filter(s => s.soldAt?.startsWith(thisMonthKey)).length} ta | O'tgan oy: ${MOCK_SALES.filter(s => s.soldAt?.startsWith(lastMonthKey)).length} ta | O'sish: ${revGrowth}%

🚀 ENG TEZ SOTILADIGAN (upsell uchun):
${topFast.map((p, i) => `${i+1}. ${p.name} (${p.brand}): jami ${p.total} ta, bu oy ${p.thisMonth} ta`).join('\n') || 'yo\'q'}

🐢 ENG SEKIN SOTILADIGAN (reklama senariysi kerak!):
${topSlow.map((p, i) => `${i+1}. ${p.name} (${p.brand}): jami ${p.total} ta`).join('\n') || 'yo\'q'}

📦 ZAXIRADA BOR, HECH SOTILMAGAN (tezkor reklama!):
${unsoldProducts.map(p => `- ${p.name} (${p.brand || '—'})`).join('\n') || 'yo\'q'}

👥 MIJOZLAR: VIP ${vipCount} | Sodiq ${loyalCount} | Yangi ${newCount} | Jami ${MOCK_CUSTOMERS.length}
🎯 FAOL AKSIYALAR: ${activePromos.map(p => p.name).join(', ') || 'yo\'q'}
📣 OMBOR SIGNALLARI: ${inventoryAlerts.map(a => a.message).join('; ') || 'yo\'q'}
📣 MIJOZ SIGNALLARI: ${customerAlerts.map(a => a.message).join('; ') || 'yo\'q'}

VAZIFALAR:
1. Sekin/sotilmagan tovarlar uchun 15-30 soniyalik video skript yoz (Higgsfield uchun)
2. Savdoni oshirish yo'l xaritasi (1 oy / 3 oy / 6 oy)
3. VIP va yangi mijozlarga farqli yondashuv taklif qil
4. Mijozlar agentiga: sodiqlik va sarafanniy reklama rejasi buyur`,
    deps: [version, selectedShopId, MOCK_PRODUCTS.length, MOCK_SALES.length],
  })

  useEffect(() => {
    if (analysis && !analysis.raw) {
      analysis.recommendations?.slice(0, 2).forEach(r => addActivity({ agentId: 'marketing', type: 'RECOMMENDATION', message: r.action }))
      analysis.alerts?.forEach(a => addActivity({ agentId: 'marketing', type: 'ALERT', message: a.message }))
    }
  }, [analysis])

  const handleSaveScenario = (data) => {
    if (editingScenario) {
      updateScenario(editingScenario.id, data)
      setEditingScenario(null)
    } else {
      addScenario(data)
      setShowAddForm(false)
    }
  }

  const draftCount    = scenarios.filter(s => s.status === 'draft').length
  const approvedCount = scenarios.filter(s => s.status === 'approved').length
  const videoCount    = scenarios.filter(s => ['video_ready', 'posted'].includes(s.status)).length

  const doneCount = roadmapItems.filter(r => r.done).length
  const SECTIONS = [
    { id: 'analysis',  label: 'Tahlil',      Icon: TrendingUp },
    { id: 'scenarios', label: `Ssenariylar${scenarios.length ? ` (${scenarios.length})` : ''}`, Icon: FileText },
    { id: 'videos',    label: `Videolar${videoCount ? ` (${videoCount})` : ''}`, Icon: Video },
    { id: 'roadmap',   label: `Yo'l xaritasi${roadmapItems.length ? ` (${doneCount}/${roadmapItems.length})` : ''}`, Icon: Map },
  ]

  return (
    <div className="space-y-5">
      {/* Bo'lim tanlash */}
      <div className="flex gap-2 flex-wrap">
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
        {activeSection === 'analysis' && (
          <motion.div key="analysis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <AgentAnalysisPanel loading={loading} analysis={analysis} error={error} refresh={refresh} accentColor="text-[#f97316]" />

            {/* AI tavsiya → senariyga aylantirish eslatmasi */}
            {analysis && !analysis.raw && analysis.recommendations?.length > 0 && (
              <div className="p-4 border border-[#f97316]/20 rounded-2xl bg-[#f97316]/5">
                <p className="text-xs text-[#f97316] font-medium mb-2">💡 AI tavsiyalardan senariy yasash</p>
                <p className="text-xs text-text-muted">AI taklif qilgan senariylarni "Ssenariylar" bo'limiga qo'shib, tasdiqlash va video tayyorlash jarayonini boshlang.</p>
                <button onClick={() => setActiveSection('scenarios')}
                  className="mt-2 text-xs text-[#f97316] hover:underline flex items-center gap-1">
                  Ssenariylarga o'tish <FileText size={11} />
                </button>
              </div>
            )}

            <AiChat agentId="pr-agent" colorClass="accent-orange" />
          </motion.div>
        )}

        {activeSection === 'scenarios' && (
          <motion.div key="scenarios" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Statistika */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Qoralama', value: draftCount, cls: 'text-text-muted' },
                { label: 'Tasdiqlangan', value: approvedCount, cls: 'text-green-400' },
                { label: 'Video tayyor', value: videoCount, cls: 'text-accent-blue' },
              ].map(s => (
                <div key={s.label} className="border border-border rounded-2xl p-3 bg-bg-secondary text-center">
                  <p className={`text-xl font-bold ${s.cls}`}>{s.value}</p>
                  <p className="text-xs text-text-muted mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Yangi senariy tugmasi / forma */}
            {!showAddForm && !editingScenario && (
              <button onClick={() => setShowAddForm(true)}
                className="w-full py-3 border border-dashed border-[#f97316]/40 rounded-2xl text-sm text-[#f97316] hover:bg-[#f97316]/5 transition-colors flex items-center justify-center gap-2">
                <Plus size={15} /> Yangi senariy qo'shish
              </button>
            )}
            {showAddForm && (
              <ScenarioForm onSave={handleSaveScenario} onCancel={() => setShowAddForm(false)} />
            )}
            {editingScenario && (
              <ScenarioForm initial={editingScenario} onSave={handleSaveScenario} onCancel={() => setEditingScenario(null)} />
            )}

            {/* Ssenariylar ro'yxati */}
            {scenarios.length === 0 ? (
              <div className="py-12 text-center text-text-muted text-sm border border-border rounded-2xl">
                <FileText size={32} className="mx-auto mb-3 opacity-30" />
                <p>Hozircha senariy yo'q.</p>
                <p className="text-xs mt-1">AI tahlildan kelib chiqib senariy qo'shing yoki AI chat dan so'rang.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scenarios.filter(s => !['video_ready', 'posted'].includes(s.status)).map(sc => (
                  <ScenarioCard key={sc.id} sc={sc}
                    onApprove={approveScenario}
                    onReject={rejectScenario}
                    onDelete={deleteScenario}
                    onEdit={s => { setEditingScenario(s); setShowAddForm(false) }}
                    onSendHighsfield={setVideoGenerating}
                    onPostInstagram={setInstagramPosted}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeSection === 'videos' && (
          <motion.div key="videos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {videoCount === 0 ? (
              <div className="py-12 text-center text-text-muted text-sm border border-border rounded-2xl">
                <Video size={32} className="mx-auto mb-3 opacity-30" />
                <p>Hali tayyor video yo'q.</p>
                <p className="text-xs mt-1">Senariyni tasdiqlang → Higgsfield ulangandan keyin video yarating.</p>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-yellow-400">
                  <Film size={12} /> Higgsfield API ulanishi kutilmoqda
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {scenarios.filter(s => ['video_ready', 'posted'].includes(s.status)).map(sc => (
                  <ScenarioCard key={sc.id} sc={sc}
                    onApprove={approveScenario}
                    onReject={rejectScenario}
                    onDelete={deleteScenario}
                    onEdit={s => { setEditingScenario(s); setActiveSection('scenarios') }}
                    onSendHighsfield={setVideoGenerating}
                    onPostInstagram={setInstagramPosted}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
        {activeSection === 'roadmap' && (
          <motion.div key="roadmap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <p className="text-xs text-text-muted">AI tahlil asosida yoki qo'lda rejalar kiriting. Bajarilganlarni belgilang.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { phase: '1oy',  label: '1 Oy',  color: 'text-[#22c55e]', border: 'border-[#22c55e]/30', bg: 'bg-[#22c55e]/5' },
                { phase: '3oy',  label: '3 Oy',  color: 'text-[#f97316]', border: 'border-[#f97316]/30', bg: 'bg-[#f97316]/5' },
                { phase: '6oy',  label: '6 Oy',  color: 'text-accent-blue', border: 'border-accent-blue/30', bg: 'bg-accent-blue/5' },
              ].map(({ phase, label, color, border, bg }) => {
                const items = roadmapItems.filter(r => r.phase === phase)
                const done  = items.filter(r => r.done).length
                return (
                  <div key={phase} className={`rounded-2xl border ${border} ${bg} p-4 space-y-3`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${color}`}>{label} rejasi</span>
                      {items.length > 0 && (
                        <span className="text-xs text-text-muted">{done}/{items.length} bajarildi</span>
                      )}
                    </div>

                    {/* Mavjud itemlar */}
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

                    {/* Yangi reja qo'shish */}
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
                        className={`px-2 py-1.5 rounded-xl text-xs font-medium ${color} border ${border} hover:${bg} transition-colors`}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* AI tavsiyalaridan avtomatik qo'shish */}
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
