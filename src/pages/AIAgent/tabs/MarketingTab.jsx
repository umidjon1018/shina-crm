import { useState, useMemo, useEffect, useRef } from 'react'
import AiChat from '../components/AiChat'
import DateMaskInput from '../../../components/DateMaskInput'
import { motion } from 'framer-motion'
import {
  Zap, Calendar, Bell, CheckCircle, X, Plus, Tag, Share2, Video,
  Circle, Filter,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAgentActivityStore } from '../../../store/agentActivityStore'
import { useDataStore } from '../../../store/dataStore'
import { useShopStore } from '../../../store/shopStore'
import { MOCK_CALENDAR } from '../../../constants/calendar'
import { ShopPickerModal } from '../../../components/ShopPickerModal'
import Modal from '../components/Modal'

function getMarketingIdeasFromInventoryAlerts(activities, t) {
  const seenTitles = new Set()
  return activities
    .filter(a => (a.agentId === 'inventory' || a.agentId === 'sales') && (a.type === 'ALERT' || a.type === 'RECOMMENDATION'))
    .map(a => {
      const signal = a.messageKey ? t(a.messageKey) : a.message
      const lower = signal.toLowerCase()
      let title = null
      if (lower.includes('qish') || lower.includes('зим')) title = t('ai_idea_winter_title')
      else if (lower.includes('yoz') || lower.includes('summer') || lower.includes('лет')) title = t('ai_idea_summer_title')
      else if (lower.includes('marja') || lower.includes('foydali') || lower.includes('маржа') || lower.includes('прибыл')) title = t('ai_idea_popular_title')
      if (!title || seenTitles.has(title)) return null
      seenTitles.add(title)
      return { id: a.id, title, signal, platform: 'Instagram' }
    })
    .filter(Boolean)
}

function getIdeaDetails(idea, t) {
  const lower = (idea.title + ' ' + idea.signal).toLowerCase()
  if (lower.includes('qish') || lower.includes('зим') || lower.includes('winter')) return {
    scenario: t('ai_idea_winter_scenario'),
    caption: t('ai_idea_winter_caption'),
    hashtags: t('ai_idea_winter_hashtags'),
    timing: t('ai_idea_winter_timing'),
    audience: t('ai_idea_winter_audience'),
    videoIdea: t('ai_idea_winter_video'),
  }
  if (lower.includes('yoz') || lower.includes('mashhur') || lower.includes('foydali') || lower.includes('маржа') || lower.includes('прибыл') || lower.includes('лет')) return {
    scenario: t('ai_idea_summer_scenario'),
    caption: t('ai_idea_summer_caption'),
    hashtags: t('ai_idea_summer_hashtags'),
    timing: t('ai_idea_summer_timing'),
    audience: t('ai_idea_summer_audience'),
    videoIdea: t('ai_idea_summer_video'),
  }
  return {
    scenario: t('ai_idea_default_scenario'),
    caption: t('ai_idea_default_caption'),
    hashtags: t('ai_idea_default_hashtags'),
    timing: t('ai_idea_default_timing'),
    audience: t('ai_idea_default_audience'),
    videoIdea: t('ai_idea_default_video'),
  }
}

function MarketingTab({ aiData = {} }) {
  const { t, i18n } = useTranslation()
  const { activities, addActivity } = useAgentActivityStore()
  const { version } = useDataStore()
  const { selectedShopId, shops: MOCK_SHOPS } = useShopStore()
  const { customers: MOCK_CUSTOMERS = [], products: MOCK_PRODUCTS = [] } = aiData
  const shopCustomers = selectedShopId === 'all' ? MOCK_CUSTOMERS : MOCK_CUSTOMERS.filter(c => !c.shopId || c.shopId === selectedShopId)

  // G'oya detail modal
  const [ideaModal, setIdeaModal] = useState(null)
  // Video buyurtma modal — yaratish va qayta ishlash uchun
  const [videoOrderModal, setVideoOrderModal] = useState(null) // { idea, revisionVideoId }
  const [orderInstructions, setOrderInstructions] = useState('')
  const [orderSelectedImages, setOrderSelectedImages] = useState([]) // tanlangan rasmlar

  // Kontent kalendari state
  const [calReadIds, setCalReadIds] = useState(new Set())
  const [calDeletedIds, setCalDeletedIds] = useState(new Set())
  const [calPage, setCalPage] = useState(0)
  const CAL_PAGE_SIZE = 5
  const [calForm, setCalForm] = useState({ date: '', title: '', platform: 'Instagram' })
  const [calFormOpen, setCalFormOpen] = useState(false)
  const [calTick, setCalTick] = useState(0)

  // Higgsfield state — localStorage ga saqlanadi
  const [higgsfieldConnected, setHiggsfieldConnected] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hf_connected') || 'false') } catch { return false }
  })
  const [higgsfieldSettingsOpen, setHiggsfieldSettingsOpen] = useState(false)
  const [hSettings, setHSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hf_settings') || 'null') || { personas: [], locations: [], carModels: [], brandRules: '', images: [] } } catch { return { personas: [], locations: [], carModels: [], brandRules: '', images: [] } }
  })
  // personas: [{ id, name, photo }], locations: [{ id, name, image }]
  const [hPersonaForm, setHPersonaForm] = useState({ name: '', photo: '' })
  const [hLocationForm, setHLocationForm] = useState({ name: '', images: [] })
  const [hInput, setHInput] = useState({ carModel: '' })
  const [creatingVideoFor, setCreatingVideoFor] = useState(null)
  const [createdVideos, setCreatedVideos] = useState([])
  const [massNotifSent, setMassNotifSent] = useState(false)
  const [dismissedIdeaIds, setDismissedIdeaIds] = useState(new Set())
  const [shopPickCallback, setShopPickCallback] = useState(null)
  const requireShop = (cb) => {
    if (selectedShopId !== 'all') { cb(selectedShopId) }
    else { setShopPickCallback(() => cb) }
  }

  // localStorage sync
  useEffect(() => { localStorage.setItem('hf_connected', JSON.stringify(higgsfieldConnected)) }, [higgsfieldConnected])
  useEffect(() => { localStorage.setItem('hf_settings', JSON.stringify(hSettings)) }, [hSettings])

  const contentIdeas = useMemo(() => getMarketingIdeasFromInventoryAlerts(activities, t), [activities, version, i18n.language])

  // Kalendar hisob — calTick o'zgarganda MOCK_CALENDAR qayta o'qiladi
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const visibleCal = useMemo(() => MOCK_CALENDAR.filter(item => !calDeletedIds.has(item.id)), [calDeletedIds, calTick])
  const calUnread = visibleCal.filter(item => !calReadIds.has(item.id)).length
  const calTotalPages = Math.max(1, Math.ceil(visibleCal.length / CAL_PAGE_SIZE))
  const safeCalPage = Math.min(calPage, calTotalPages - 1)
  const shownCal = visibleCal.slice(safeCalPage * CAL_PAGE_SIZE, (safeCalPage + 1) * CAL_PAGE_SIZE)

  const handleCreateVideo = ({ idea, instructions = '', selectedImages = [], isAuto = false, revisionVideoId = null }) => {
    setCreatingVideoFor(idea.id)
    setTimeout(() => {
      const personaObj = hSettings.personas[0] || null
      const persona = personaObj ? (typeof personaObj === 'string' ? personaObj : personaObj.name) : t('ai_standart_persona')
      const personaPhoto = personaObj && typeof personaObj !== 'string' ? personaObj.photo : null
      // Location: g'oya mavzusiga mos rasmni tanlash (mock: rasmlar ko'p bo'lsa tasodifiy biri)
      const locObj = hSettings.locations[0] || null
      const location = locObj ? (typeof locObj === 'string' ? locObj : locObj.name) : t('ai_default_location')
      const locImages = locObj && typeof locObj !== 'string' ? (locObj.images || (locObj.image ? [locObj.image] : [])) : []
      const chosenLocImage = locImages.length > 1
        ? locImages[Math.floor(Math.random() * locImages.length)]
        : locImages[0] || null
      const usedImages = selectedImages.length > 0 ? selectedImages : [...hSettings.images]
      const usedCarModels = [...hSettings.carModels]
      const newVideo = {
        id: 'vid-' + Date.now(),
        ideaId: idea.id,
        title: idea.title,
        status: 'ready',
        persona,
        personaPhoto,
        location,
        locationBg: chosenLocImage,
        images: usedImages,
        carModels: usedCarModels,
        brandRules: hSettings.brandRules,
        instructions,
        autoCreated: isAuto,
        createdAt: new Date().toISOString(),
      }
      if (revisionVideoId) {
        setCreatedVideos(prev => prev.map(v => v.id === revisionVideoId ? newVideo : v))
      } else {
        setCreatedVideos(prev => [...prev, newVideo])
      }
      setCreatingVideoFor(null)
      const assetsSummary = [
        usedImages.length ? t('ai_act_images', { count: usedImages.length }) : '',
        usedCarModels.length ? t('ai_act_cars', { count: usedCarModels.length }) : '',
        instructions ? t('ai_act_instructions') : '',
      ].filter(Boolean).join(', ')
      const actor = isAuto ? t('ai_act_agent') : t('ai_act_user_lbl')
      const action = revisionVideoId ? t('ai_act_video_revised') : t('ai_act_video_created')
      addActivity({
        agentId: 'marketing',
        type: 'NOTE',
        message: `${actor} ${action}: "${idea.title}"${assetsSummary ? ` (${assetsSummary})` : ''}. ${t('ai_act_notify_admin')}`,
      })
    }, isAuto ? 4000 : 3000)
  }

  const handleAutoCreateAll = () => {
    const alreadyHas = new Set(createdVideos.map(v => v.ideaId))
    const pending = contentIdeas.filter(idea => !alreadyHas.has(idea.id) && !dismissedIdeaIds.has(idea.id))
    if (pending.length === 0) return
    pending.forEach((idea, i) => {
      setTimeout(() => handleCreateVideo({ idea, isAuto: true }), i * 2500)
    })
    addActivity({ agentId: 'marketing', type: 'NOTE', message: t('ai_act_auto_start', { count: pending.length }) })
  }

  const openVideoOrder = (idea, revisionVideoId = null) => {
    setOrderInstructions(revisionVideoId ? (createdVideos.find(v => v.id === revisionVideoId)?.instructions || '') : '')
    setOrderSelectedImages(revisionVideoId ? (createdVideos.find(v => v.id === revisionVideoId)?.images || []) : [...hSettings.images])
    setVideoOrderModal({ idea, revisionVideoId })
  }

  const submitVideoOrder = () => {
    if (!videoOrderModal) return
    handleCreateVideo({
      idea: videoOrderModal.idea,
      instructions: orderInstructions,
      selectedImages: orderSelectedImages,
      isAuto: false,
      revisionVideoId: videoOrderModal.revisionVideoId,
    })
    setVideoOrderModal(null)
    setOrderInstructions('')
    setOrderSelectedImages([])
  }

  const approveVideo = (id) => setCreatedVideos(prev => prev.map(v => v.id === id ? { ...v, status: 'approved' } : v))

  const postVideo = (id) => {
    const v = createdVideos.find(x => x.id === id)
    setCreatedVideos(prev => prev.map(x => x.id === id ? { ...x, status: 'posted' } : x))
    if (v) addActivity({ agentId: 'marketing', type: 'NOTE', message: t('ai_act_posted', { title: v.title }) })
  }

  const addPersona = () => {
    if (!hPersonaForm.name.trim()) return
    setHSettings(s => ({ ...s, personas: [...s.personas, { id: Date.now(), name: hPersonaForm.name.trim(), photo: hPersonaForm.photo }] }))
    setHPersonaForm({ name: '', photo: '' })
  }
  const addLocation = () => {
    if (!hLocationForm.name.trim()) return
    setHSettings(s => ({ ...s, locations: [...s.locations, { id: Date.now(), name: hLocationForm.name.trim(), images: hLocationForm.images }] }))
    setHLocationForm({ name: '', images: [] })
  }
  const addHItem = (key, inputKey) => {
    const val = hInput[inputKey].trim()
    if (!val) return
    setHSettings(s => ({ ...s, [key]: [...s[key], val] }))
    setHInput(s => ({ ...s, [inputKey]: '' }))
  }
  const removeHItem = (key, idx) => setHSettings(s => ({ ...s, [key]: s[key].filter((_, i) => i !== idx) }))

  const videoStatusBadge = { ready: { label: t('ai_status_pending'), cls: 'text-amber-400 bg-amber-400/10' }, approved: { label: t('ai_status_approved'), cls: 'text-[#22c55e] bg-[#22c55e]/10' }, posted: { label: t('ai_status_posted'), cls: 'text-[#3b82f6] bg-[#3b82f6]/10' } }

  return (
    <div className="space-y-6">
      {shopPickCallback && (
        <ShopPickerModal
          onConfirm={(shopId) => { const cb = shopPickCallback; setShopPickCallback(null); cb(shopId) }}
          onCancel={() => setShopPickCallback(null)}
        />
      )}

      {/* ── Signal asosidagi post g'oyalari ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Zap size={15} className="text-[#f97316]" /> {t('ai_signal_ideas')}
          </h3>
          {higgsfieldConnected && contentIdeas.filter(i => !dismissedIdeaIds.has(i.id)).length > 0 && (
            <button
              onClick={handleAutoCreateAll}
              disabled={contentIdeas.filter(i => !dismissedIdeaIds.has(i.id)).every(idea => createdVideos.some(v => v.ideaId === idea.id))}
              className="text-xs px-3 py-1.5 rounded-lg bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/30 hover:bg-[#f97316]/20 transition-colors disabled:opacity-40 flex items-center gap-1"
            >
              <Zap size={11} /> {t('ai_auto_create_all')}
            </button>
          )}
        </div>
        {contentIdeas.filter(i => !dismissedIdeaIds.has(i.id)).length === 0 ? (
          <p className="text-sm text-text-muted text-center py-6 border border-border rounded-xl">
            {t('ai_no_signals')}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {contentIdeas.filter(i => !dismissedIdeaIds.has(i.id)).map(idea => {
              const hasVideo = createdVideos.some(v => v.ideaId === idea.id)
              return (
                <motion.div
                  key={idea.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setIdeaModal(idea)}
                  className="p-4 rounded-xl border border-[#f97316]/30 bg-[#f97316]/5 cursor-pointer hover:border-[#f97316]/60 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <Tag size={14} className="text-[#f97316] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">{idea.title}</p>
                      <p className="text-xs text-text-muted mt-1 line-clamp-2">{t('ai_signal_prefix')} {idea.signal}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#f97316]/20 text-[#f97316]">
                          <Share2 size={9} className="inline mr-1" />{idea.platform}
                        </span>
                        <span className="text-xs text-[#f97316]">{t('ai_more_details')}</span>
                        {higgsfieldConnected && !hasVideo && (
                          <button
                            onClick={e => { e.stopPropagation(); openVideoOrder(idea) }}
                            disabled={creatingVideoFor === idea.id}
                            className="text-xs px-2 py-0.5 rounded-lg bg-[#f97316]/20 text-[#f97316] hover:bg-[#f97316]/30 transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            <Video size={10} />
                            {creatingVideoFor === idea.id ? t('ai_creating') : t('ai_video_order')}
                          </button>
                        )}
                        {hasVideo && <span className="text-xs text-[#22c55e] flex items-center gap-0.5"><CheckCircle size={10} /> {t('ai_video_ready')}</span>}
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setDismissedIdeaIds(s => new Set([...s, idea.id])) }}
                      className="flex-shrink-0 p-1 rounded hover:bg-[#f97316]/20 text-text-muted hover:text-[#E63946] transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Tayyor videolar (Higgsfield) ── */}
      {createdVideos.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Video size={15} className="text-[#f97316]" /> {t('ai_ready_videos')}
          </h3>
          <div className="space-y-2">
            {createdVideos.map(v => {
              const badge = videoStatusBadge[v.status]
              const idea = contentIdeas.find(i => i.id === v.ideaId) || { id: v.ideaId, title: v.title, signal: '', platform: 'Instagram' }
              return (
                <div key={v.id} className="p-3 rounded-xl border border-border bg-bg-secondary">
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-text-primary truncate">{v.title}</p>
                        {v.autoCreated && <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#f97316]/10 text-[#f97316] flex-shrink-0">Agent</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${badge.cls}`}>{badge.label}</span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        👤 {v.persona}{v.personaPhoto && <span className="ml-1 text-[#22c55e]" title={v.personaPhoto}>🖼</span>}
                        {' · '}📍 {v.location}{v.locationBg && <span className="ml-1 text-[#3b82f6]" title={`Fon: ${v.locationBg}`}>🖼</span>}
                      </p>
                      {(v.images?.length > 0 || v.carModels?.length > 0) && (
                        <p className="text-xs text-text-muted mt-0.5">
                          {v.images?.length > 0 && `🖼️ ${t('ai_act_images', { count: v.images.length })}`}
                          {v.images?.length > 0 && v.carModels?.length > 0 && ' · '}
                          {v.carModels?.length > 0 && `🚗 ${v.carModels.join(', ')}`}
                        </p>
                      )}
                      {v.instructions && (
                        <p className="text-xs text-[#f97316] mt-0.5 line-clamp-1">📝 {v.instructions}</p>
                      )}
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0 flex-wrap">
                      {v.status === 'ready' && (
                        <button onClick={() => approveVideo(v.id)} className="text-xs px-2.5 py-1 rounded-lg bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/20 transition-colors">
                          <CheckCircle size={11} className="inline mr-1" />{t('confirm')}
                        </button>
                      )}
                      {v.status === 'approved' && (
                        <button onClick={() => postVideo(v.id)} className="text-xs px-2.5 py-1 rounded-lg bg-[#3b82f6]/10 text-[#3b82f6] hover:bg-[#3b82f6]/20 transition-colors">
                          <Share2 size={11} className="inline mr-1" />{t('ai_post_instagram')}
                        </button>
                      )}
                      {v.status !== 'posted' && (
                        <button
                          onClick={() => openVideoOrder(idea, v.id)}
                          disabled={creatingVideoFor === v.ideaId}
                          className="text-xs px-2.5 py-1 rounded-lg border border-border hover:bg-bg-primary text-text-muted transition-colors disabled:opacity-40"
                        >
                          {creatingVideoFor === v.ideaId ? t('ai_reworking') : t('ai_rework')}
                        </button>
                      )}
                      <button onClick={() => setCreatedVideos(prev => prev.filter(x => x.id !== v.id))} className="p-1 rounded hover:bg-bg-primary text-text-muted hover:text-[#E63946] transition-colors">
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Kontent kalendari ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Calendar size={15} className="text-[#3b82f6]" /> {t('ai_content_calendar')}
            {calUnread > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#3b82f6]/10 text-[#3b82f6]">{calUnread}</span>}
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCalFormOpen(v => !v)}
              className="text-xs px-2.5 py-1 rounded-lg border border-border hover:bg-bg-secondary text-text-muted transition-colors flex items-center gap-1"
            >
              <Plus size={11} /> {t('ai_new_post')}
            </button>
            {calUnread > 0 && (
              <button
                onClick={() => setCalReadIds(new Set(visibleCal.map(i => i.id)))}
                className="text-xs px-2.5 py-1 rounded-lg border border-border hover:bg-bg-secondary text-text-muted transition-colors flex items-center gap-1"
              >
                <CheckCircle size={11} /> {t('ai_mark_all_read')}
              </button>
            )}
          </div>
        </div>
        {calFormOpen && (
          <div className="mb-3 p-3 rounded-xl border border-[#3b82f6]/30 bg-[#3b82f6]/5 space-y-2">
            <DateMaskInput
              value={calForm.date}
              onChange={e => setCalForm(f => ({ ...f, date: e.target.value }))}
              className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary"
            />
            <input
              type="text"
              placeholder={t('ai_post_title_ph')}
              value={calForm.title}
              onChange={e => setCalForm(f => ({ ...f, title: e.target.value }))}
              className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary"
            />
            <div className="flex gap-2">
              <select
                value={calForm.platform}
                onChange={e => setCalForm(f => ({ ...f, platform: e.target.value }))}
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary"
              >
                <option>Instagram</option>
                <option>Telegram</option>
                <option>Facebook</option>
              </select>
              <button
                type="button"
                disabled={!calForm.date || !calForm.title.trim()}
                onClick={() => {
                  MOCK_CALENDAR.push({ id: 'cal-' + Date.now(), date: calForm.date, title: calForm.title.trim(), platform: calForm.platform, status: 'planned' })
                  setCalTick(prev => prev + 1)
                  setCalForm({ date: '', title: '', platform: 'Instagram' })
                  setCalFormOpen(false)
                  setCalPage(0)
                }}
                className="text-xs px-4 py-2 rounded-lg bg-[#3b82f6] text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                {t('ai_add')}
              </button>
            </div>
          </div>
        )}
        <div className="space-y-2">
          {shownCal.map(item => {
            const isRead = calReadIds.has(item.id)
            return (
              <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isRead ? 'border-border/50 opacity-60' : 'border-border bg-bg-secondary'}`}>
                {!isRead && <Bell size={12} className="text-[#3b82f6] flex-shrink-0" />}
                <div className="text-xs text-text-muted w-20 flex-shrink-0">{item.date}</div>
                <div className="flex-1">
                  <p className={`text-sm ${isRead ? 'text-text-muted' : 'text-text-primary'}`}>{item.title}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] flex-shrink-0">
                  <Share2 size={9} className="inline mr-1" />{item.platform}
                </span>
                <div className="flex gap-0.5 flex-shrink-0">
                  {!isRead && (
                    <button onClick={() => setCalReadIds(s => new Set([...s, item.id]))} title={t('ai_mark_read')} className="p-1 rounded hover:bg-bg-primary text-text-muted hover:text-[#22c55e] transition-colors">
                      <CheckCircle size={13} />
                    </button>
                  )}
                  <button onClick={() => { setCalDeletedIds(s => new Set([...s, item.id])); setCalPage(0) }} title={t('delete')} className="p-1 rounded hover:bg-bg-primary text-text-muted hover:text-[#E63946] transition-colors">
                    <X size={13} />
                  </button>
                </div>
              </div>
            )
          })}
          {visibleCal.length === 0 && <p className="text-xs text-text-muted text-center py-4 border border-border rounded-xl">{t('ai_cal_empty')}</p>}
        </div>
        {calTotalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <button onClick={() => setCalPage(p => Math.max(0, p - 1))} disabled={safeCalPage === 0} className="text-xs px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-bg-secondary text-text-muted transition-colors">{t('ai_prev')}</button>
            <span className="text-xs text-text-muted">{safeCalPage + 1} / {calTotalPages}</span>
            <button onClick={() => setCalPage(p => Math.min(calTotalPages - 1, p + 1))} disabled={safeCalPage >= calTotalPages - 1} className="text-xs px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-bg-secondary text-text-muted transition-colors">{t('ai_next')}</button>
          </div>
        )}
      </div>

      {/* ── Mavsum xabardorlik ── */}
      <div className="p-4 rounded-xl border border-[#f97316]/30 bg-[#f97316]/5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Bell size={15} className="text-[#f97316]" /> {t('ai_seasonal_notif')}
            </h3>
            <p className="text-xs text-text-muted mt-1">{t('ai_season_notif_desc', { count: shopCustomers.length })}</p>
          </div>
          {massNotifSent
            ? <span className="text-xs text-[#22c55e] flex items-center gap-1"><CheckCircle size={12} /> {t('ai_sent_badge', { count: shopCustomers.length })}</span>
            : (
              <button
                type="button"
                onClick={() => requireShop(() => {
                  setMassNotifSent(true)
                  addActivity({ agentId: 'marketing', type: 'NOTE', message: t('ai_act_mass_notif', { count: shopCustomers.length }) })
                })}
                className="text-xs px-3 py-2 rounded-lg bg-[#f97316]/20 text-[#f97316] hover:bg-[#f97316]/30 transition-colors"
              >
                {t('ai_send_all_demo')}
              </button>
            )
          }
        </div>
      </div>

      {/* ── Higgsfield MCP ── */}
      <div className="p-4 rounded-xl border border-border bg-bg-secondary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#f97316]/10 flex items-center justify-center">
              <Video size={16} className="text-[#f97316]" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Higgsfield MCP</p>
              <p className="text-xs text-text-muted">{t('ai_hf_subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${higgsfieldConnected ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'bg-[#E63946]/10 text-[#E63946]'}`}>
              <Circle size={9} /> {higgsfieldConnected ? t('ai_higgsfield_connected') : t('ai_higgsfield_disconnected')}
            </span>
            <button
              onClick={() => setHiggsfieldSettingsOpen(true)}
              className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-bg-primary text-text-primary transition-colors flex items-center gap-1"
            >
              <Zap size={11} /> {t('ai_hf_settings')}
            </button>
          </div>
        </div>
        {higgsfieldConnected && (hSettings.personas.length > 0 || hSettings.locations.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {hSettings.personas.map((p, i) => <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[#f97316]/10 text-[#f97316]">👤 {typeof p === 'string' ? p : p.name}</span>)}
            {hSettings.locations.map((l, i) => <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[#3b82f6]/10 text-[#3b82f6]">📍 {typeof l === 'string' ? l : l.name}</span>)}
            {hSettings.carModels.map((m, i) => <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-bg-primary border border-border text-text-muted">🚗 {m}</span>)}
          </div>
        )}
      </div>

      {/* ── VIDEO BUYURTMA MODALI ── */}
      <Modal
        open={!!videoOrderModal}
        onClose={() => setVideoOrderModal(null)}
        title={videoOrderModal?.revisionVideoId ? t('ai_video_revise_title') : t('ai_video_order_title')}
      >
        {videoOrderModal && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-[#f97316]/5 border border-[#f97316]/20">
              <p className="text-xs text-text-muted mb-0.5">{t('ai_idea_label')}</p>
              <p className="text-sm font-medium text-text-primary">{videoOrderModal.idea.title}</p>
            </div>

            {/* Tekst ko'rsatma */}
            <div>
              <label className="text-xs font-medium text-text-muted block mb-1.5">
                📝 {t('ai_instructions_label')}
              </label>
              <textarea
                value={orderInstructions}
                onChange={e => setOrderInstructions(e.target.value)}
                placeholder={videoOrderModal.revisionVideoId ? t('ai_instructions_ph_revise') : t('ai_instructions_ph_new')}
                rows={3}
                className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-[#f97316]/50 resize-none"
              />
            </div>

            {/* Rasm tanlash */}
            {hSettings.images.length > 0 && (
              <div>
                <label className="text-xs font-medium text-text-muted block mb-1.5">
                  🖼️ {t('ai_images_label', { selected: orderSelectedImages.length, total: hSettings.images.length })}
                </label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {hSettings.images.map((img, i) => {
                    const isSelected = orderSelectedImages.includes(img)
                    return (
                      <label key={i} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'border-[#f97316]/40 bg-[#f97316]/5' : 'border-border hover:bg-bg-secondary'}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => setOrderSelectedImages(prev =>
                            isSelected ? prev.filter(x => x !== img) : [...prev, img]
                          )}
                          className="accent-[#f97316]"
                        />
                        <span className="text-xs text-text-primary truncate">{img}</span>
                      </label>
                    )
                  })}
                </div>
                <div className="flex gap-2 mt-1.5">
                  <button onClick={() => setOrderSelectedImages([...hSettings.images])} className="text-xs text-text-muted hover:text-text-primary transition-colors">{t('ai_select_all')}</button>
                  <span className="text-text-muted text-xs">·</span>
                  <button onClick={() => setOrderSelectedImages([])} className="text-xs text-text-muted hover:text-text-primary transition-colors">{t('ai_deselect')}</button>
                </div>
              </div>
            )}

            {hSettings.images.length === 0 && (
              <p className="text-xs text-text-muted bg-bg-secondary rounded-lg p-2">
                {t('ai_no_images')}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={submitVideoOrder}
                disabled={creatingVideoFor === videoOrderModal.idea.id}
                className="flex-1 py-2 rounded-xl bg-[#f97316]/20 border border-[#f97316]/30 text-[#f97316] text-sm hover:bg-[#f97316]/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <Video size={13} />
                {creatingVideoFor === videoOrderModal.idea.id ? t('ai_creating') : (videoOrderModal.revisionVideoId ? t('ai_rework') : t('ai_create'))}
              </button>
              <button onClick={() => setVideoOrderModal(null)} className="flex-1 py-2 rounded-xl bg-bg-secondary border border-border text-sm text-text-muted hover:bg-bg-primary transition-colors">
                {t('ai_cancel_btn')}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── G'OYA DETAIL MODALI ── */}
      <Modal open={!!ideaModal} onClose={() => setIdeaModal(null)} title={t('ai_idea_modal_title')}>
        {ideaModal && (() => {
          const det = getIdeaDetails(ideaModal, t)
          return (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-[#f97316]" />
                <p className="text-sm font-semibold text-text-primary">{ideaModal.title}</p>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-text-muted mb-1">📌 {t('ai_scenario')}</p>
                  <p className="text-sm text-text-primary bg-bg-secondary rounded-lg p-3">{det.scenario}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-text-muted mb-1">✍️ {t('ai_caption')}</p>
                  <pre className="text-xs text-text-primary bg-bg-secondary rounded-lg p-3 whitespace-pre-wrap font-sans">{det.caption}</pre>
                </div>
                <div>
                  <p className="text-xs font-medium text-text-muted mb-1">🏷️ {t('ai_hashtags')}</p>
                  <p className="text-xs text-[#3b82f6] bg-bg-secondary rounded-lg p-2">{det.hashtags}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-text-muted mb-1">{t('ai_timing')}</p>
                    <p className="text-xs text-text-primary bg-bg-secondary rounded-lg p-2">{det.timing}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text-muted mb-1">{t('ai_audience')}</p>
                    <p className="text-xs text-text-primary bg-bg-secondary rounded-lg p-2">{det.audience}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-text-muted mb-1">{t('ai_video_idea')}</p>
                  <p className="text-xs text-text-primary bg-[#f97316]/5 border border-[#f97316]/20 rounded-lg p-2">{det.videoIdea}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setIdeaModal(null); openVideoOrder(ideaModal) }}
                  disabled={creatingVideoFor === ideaModal.id}
                  className="flex-1 py-2 rounded-xl bg-[#f97316]/20 border border-[#f97316]/30 text-[#f97316] text-sm hover:bg-[#f97316]/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  <Video size={13} /> {t('ai_video_order')}
                </button>
                <button onClick={() => setIdeaModal(null)} className="flex-1 py-2 rounded-xl bg-bg-secondary border border-border text-sm text-text-muted hover:bg-bg-primary transition-colors">
                  {t('close')}
                </button>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* ── HIGGSFIELD SOZLAMALAR MODALI ── */}
      <Modal open={higgsfieldSettingsOpen} onClose={() => setHiggsfieldSettingsOpen(false)} title={t('ai_higgsfield_title')}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Ulanish toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-bg-secondary">
            <div>
              <p className="text-sm font-medium text-text-primary">{t('ai_hf_connection')}</p>
              <p className="text-xs text-text-muted">{t('ai_demo_mode')}</p>
            </div>
            <button
              onClick={() => setHiggsfieldConnected(p => !p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${higgsfieldConnected ? 'bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30' : 'bg-bg-primary border border-border text-text-muted'}`}
            >
              {higgsfieldConnected ? t('ai_hf_connected_btn') : t('ai_connect')}
            </button>
          </div>

          {/* Personajlar */}
          <div>
            <p className="text-xs font-medium text-text-muted mb-2">{t('ai_personas_label')}</p>
            <div className="space-y-2 mb-2">
              <input
                value={hPersonaForm.name}
                onChange={e => setHPersonaForm(s => ({ ...s, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addPersona()}
                placeholder={t('ai_persona_name_ph')}
                className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary outline-none focus:border-[#f97316]/50"
              />
              <div className="flex gap-2">
                {hPersonaForm.photo ? (
                  <div className="flex-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#22c55e]/40 bg-[#22c55e]/5 text-xs text-[#22c55e]">
                    <span className="truncate flex-1">✓ {hPersonaForm.photo}</span>
                    <button type="button" onClick={() => setHPersonaForm(s => ({ ...s, photo: '' }))} className="hover:text-[#E63946] flex-shrink-0"><X size={12} /></button>
                  </div>
                ) : (
                  <label className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-border bg-bg-secondary hover:bg-bg-primary cursor-pointer transition-colors text-xs text-text-muted">
                    <Plus size={12} /> {t('ai_persona_photo')}
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      const f = e.target.files?.[0]
                      if (f) setHPersonaForm(s => ({ ...s, photo: f.name }))
                      e.target.value = ''
                    }} />
                  </label>
                )}
                <button type="button" onClick={addPersona} disabled={!hPersonaForm.name.trim()} className="px-3 py-1.5 rounded-lg bg-[#f97316]/10 text-[#f97316] hover:bg-[#f97316]/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-xs">{t('ai_add')}</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(hSettings.personas || []).map((p, i) => {
                const name = typeof p === 'string' ? p : p.name
                const photo = typeof p === 'string' ? null : p.photo
                return (
                  <span key={i} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#f97316]/10 text-[#f97316]">
                    {photo && <span title={photo}>🖼</span>} {name}
                    <button type="button" onClick={() => removeHItem('personas', i)} className="hover:text-[#E63946]"><X size={10} /></button>
                  </span>
                )
              })}
            </div>
          </div>

          {/* Joylar */}
          <div>
            <p className="text-xs font-medium text-text-muted mb-2">{t('ai_locations_label')}</p>
            {/* Do'konlar manzili avtomatik */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {MOCK_SHOPS.filter(s => s.isActive && s.address).map(shop => (
                <button
                  key={shop.id}
                  type="button"
                  onClick={() => setHLocationForm(s => ({ ...s, name: shop.address }))}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${hLocationForm.name === shop.address ? 'border-[#3b82f6] bg-[#3b82f6]/10 text-[#3b82f6]' : 'border-border bg-bg-secondary text-text-muted hover:border-[#3b82f6]/50'}`}
                >
                  {shop.name}
                </button>
              ))}
            </div>
            <div className="space-y-2 mb-2">
              <input
                value={hLocationForm.name}
                onChange={e => setHLocationForm(s => ({ ...s, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addLocation()}
                placeholder={t('ai_location_ph')}
                className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary outline-none focus:border-[#3b82f6]/50"
              />
              <div className="flex gap-2">
                <label className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-border bg-bg-secondary hover:bg-bg-primary cursor-pointer transition-colors text-xs text-text-muted">
                  <Plus size={12} /> {t('ai_add_bg_images')}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={e => {
                    const files = Array.from(e.target.files || [])
                    if (files.length) setHLocationForm(s => ({ ...s, images: [...s.images, ...files.map(f => f.name)] }))
                    e.target.value = ''
                  }} />
                </label>
                <button type="button" onClick={addLocation} disabled={!hLocationForm.name.trim()} className="px-3 py-1.5 rounded-lg bg-[#3b82f6]/10 text-[#3b82f6] hover:bg-[#3b82f6]/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-xs">{t('ai_add')}</button>
              </div>
            </div>
            {/* Yuklangan rasmlar preview (qo'shishdan oldin) */}
            {hLocationForm.images.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {hLocationForm.images.map((img, i) => (
                  <span key={i} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-bg-secondary border border-border text-text-muted">
                    🖼 <span className="truncate max-w-[100px]">{img}</span>
                    <button type="button" onClick={() => setHLocationForm(s => ({ ...s, images: s.images.filter((_, j) => j !== i) }))} className="hover:text-[#E63946]"><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {(hSettings.locations || []).map((l, i) => {
                const name = typeof l === 'string' ? l : l.name
                const imgs = typeof l === 'string' ? [] : (l.images || (l.image ? [l.image] : []))
                return (
                  <span key={i} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#3b82f6]/10 text-[#3b82f6]">
                    {imgs.length > 0 && <span title={imgs.join(', ')}>🖼{imgs.length > 1 ? imgs.length : ''}</span>} {name}
                    <button type="button" onClick={() => removeHItem('locations', i)} className="hover:text-[#E63946]"><X size={10} /></button>
                  </span>
                )
              })}
            </div>
          </div>

          {/* Avtomobil modellari */}
          <div>
            <p className="text-xs font-medium text-text-muted mb-1">{t('ai_car_models_label')}</p>
            <p className="text-xs text-text-muted mb-2 opacity-60">{t('ai_car_models_hint')}</p>
            <div className="flex gap-2 mb-2">
              <input value={hInput.carModel} onChange={e => setHInput(s => ({ ...s, carModel: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addHItem('carModels', 'carModel')} placeholder={t('ai_car_model_ph')} className="flex-1 bg-bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary outline-none focus:border-border" />
              <button type="button" onClick={() => addHItem('carModels', 'carModel')} disabled={!hInput.carModel.trim()} className="p-1.5 rounded-lg bg-bg-secondary border border-border text-text-muted hover:bg-bg-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"><Plus size={14} /></button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {hSettings.carModels.map((m, i) => (
                <span key={i} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-bg-primary border border-border text-text-muted">
                  {m} <button type="button" onClick={() => removeHItem('carModels', i)} className="hover:text-[#E63946]"><X size={10} /></button>
                </span>
              ))}
            </div>
          </div>

          {/* Rasmlar (shina/disk) */}
          <div>
            <p className="text-xs font-medium text-text-muted mb-2">{t('ai_tire_images_label')}</p>
            <label className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-dashed border-border bg-bg-secondary hover:bg-bg-primary cursor-pointer transition-colors text-xs text-text-muted">
              <Plus size={13} /> {t('ai_select_image')}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => {
                  const files = Array.from(e.target.files || [])
                  const names = files.map(f => f.name)
                  setHSettings(s => ({ ...s, images: [...s.images, ...names] }))
                  e.target.value = ''
                }}
              />
            </label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {hSettings.images.map((img, i) => (
                <span key={i} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-bg-primary border border-border text-text-muted max-w-[160px]">
                  <span className="truncate">{img}</span>
                  <button type="button" onClick={() => removeHItem('images', i)} className="hover:text-[#E63946] flex-shrink-0"><X size={10} /></button>
                </span>
              ))}
            </div>
          </div>

          {/* Brand qoidalari */}
          <div>
            <p className="text-xs font-medium text-text-muted mb-2">{t('ai_brand_rules_label')}</p>
            <textarea
              value={hSettings.brandRules}
              onChange={e => setHSettings(s => ({ ...s, brandRules: e.target.value }))}
              placeholder={t('ai_brand_rules_ph')}
              rows={3}
              className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-[#f97316]/50 resize-none"
            />
          </div>

          <button onClick={() => setHiggsfieldSettingsOpen(false)} className="w-full py-2 rounded-xl bg-[#f97316]/20 border border-[#f97316]/30 text-[#f97316] text-sm hover:bg-[#f97316]/30 transition-colors">
            {t('save')}
          </button>
        </div>
      </Modal>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Zap size={15} className="text-[#f97316]" /> AI Agent — Marketing va kontent
        </h3>
        <AiChat
          agentId="pr-agent"
          systemPrompt={`Sen GoodTires shina do'koni marketing va PR agentisan.

🏪 Do'kon haqida:
- Nomi: GoodTires
- Mahsulotlar: avtomobil shinasi, disk va aksessuarlar
- Mijozlar soni: ${shopCustomers.length} ta
- Top mahsulotlar: ${MOCK_PRODUCTS.slice(0, 5).map(p => p.name).join(', ')}

📱 Qila olasanlar:
- Instagram post va story matni yozish
- Aksiya va chegirma e'lonlari
- Mavsumiy reklama kampaniyalari
- Mijozlarni qaytarishga undash xabarlari
- Brend ovozi va uslub

MUHIM QOIDALAR:
- To'liq, to'g'ri o'zbek adabiy tilida yoz. Grammatika: ega + to'ldiruvchi + kesim tartibida.
- Post matni so'ralsa — emoji bilan, qisqa va jalb etarli qilib yoz.
- Grammatik xato bo'lmasin: "Yangi shina keldi!" — to'g'ri. "Keldi yangi shina!" — NOTO'G'RI.
- Markdown ishlatishingiz mumkin: **qalin**, - ro'yxat.`}
          placeholder="Post matni, aksiya e'loni, reklama so'rang..."
          colorClass="accent-orange"
        />
      </div>
    </div>
  )
}

export default MarketingTab
