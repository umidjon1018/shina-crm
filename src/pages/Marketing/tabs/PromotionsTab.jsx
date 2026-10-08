import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Percent, BadgeMinus, Tag, Layers, Store, Receipt, Gift, Copy, Package, PackagePlus, Repeat, Cake, Clock, CalendarDays, UserPlus, Users, Ticket, Plus, Pencil, Trash2, Power, X, Search, Sparkles, Wand2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDataStore } from '../../../store/dataStore'
import { getPromotions, getPromotionStats, togglePromotion, deletePromotion } from '../../../api/promotionService'
import { getProducts } from '../../../api/productService'
import { getCategories } from '../../../api/categoryService'
import { getCustomers } from '../../../api/customerService'
import PromoFormModal from '../components/PromoFormModal'
import { SIMPLE_TEMPLATES, ADVANCED_TEMPLATES, fromTemplate, emptyPromo } from '../components/promoTemplates'
import { promoSummary, promoStatus, STATUS_CLS, fmtMoney, fmtD } from '../components/mkHelpers'
import { StackGuard } from '../../../components/ui/Modal'

const TPL_ICONS = { Percent, BadgeMinus, Tag, Layers, Store, Receipt, Gift, Copy, Package, PackagePlus, Repeat, Cake, Clock, CalendarDays, UserPlus, Users, Ticket }

const TemplatePicker = ({ onPick, onClose }) => {
  const { t } = useTranslation()
  const Card = ({ tpl }) => {
    const Icon = TPL_ICONS[tpl.icon] || Tag
    return (
      <button onClick={() => onPick(tpl)}
        className="flex items-start gap-3 p-3 rounded-xl border border-border bg-bg-tertiary hover:border-accent-red/60 text-left transition-all">
        <div className="w-9 h-9 rounded-xl bg-accent-red/10 text-accent-red flex items-center justify-center shrink-0"><Icon size={17} /></div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-text-primary">{t('mkt_tpl_' + tpl.id)}</p>
          <p className="text-[11px] text-text-muted leading-snug">{t('mkt_tpl_' + tpl.id + '_desc')}</p>
        </div>
      </button>
    )
  }
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4">
      <StackGuard onClose={onClose} />
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-bg-secondary border border-border rounded-2xl w-full max-w-3xl shadow-2xl z-10 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border sticky top-0 bg-bg-secondary z-10">
          <h3 className="font-syne font-bold text-lg text-text-primary">{t('mkt_tpl_title')}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-bg-tertiary rounded-lg"><X size={18} className="text-text-secondary" /></button>
        </div>
        <div className="p-4 sm:p-5 space-y-3 sm:space-y-5">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-text-muted mb-2 flex items-center gap-1.5"><Sparkles size={13} /> {t('mkt_tpl_simple')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{SIMPLE_TEMPLATES.map(tpl => <Card key={tpl.id} tpl={tpl} />)}</div>
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-text-muted mb-2 flex items-center gap-1.5"><Wand2 size={13} /> {t('mkt_tpl_advanced')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{ADVANCED_TEMPLATES.map(tpl => <Card key={tpl.id} tpl={tpl} />)}</div>
          </div>
          <button onClick={() => onPick(null)} className="w-full py-2.5 rounded-xl border border-dashed border-border text-sm text-text-secondary hover:border-accent-red/60">
            {t('mkt_tpl_blank')}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

const PromotionsTab = () => {
  const { t } = useTranslation()
  const { bump } = useDataStore()
  const [promos, setPromos] = useState([])
  const [stats, setStats] = useState({})
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [picker, setPicker] = useState(false)
  const [form, setForm] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState('')

  const load = () => Promise.all([
    getPromotions().then(setPromos),
    getPromotionStats().then(list => setStats(Object.fromEntries(list.map(s => [s.promoId, s])))).catch(() => {}),
  ]).finally(() => setLoading(false))

  useEffect(() => {
    load()
    getProducts().then(setProducts).catch(() => {})
    getCategories().then(setCategories).catch(() => {})
    getCustomers().then(list => setGroups([...new Set(list.map(c => c.group).filter(Boolean))].sort())).catch(() => {})
  }, [])

  const visible = useMemo(() => promos
    .filter(p => !(p.requiresCode && /^(Promokod|Vaucher):/.test(p.name)))
    .filter(p => filter === 'all' || promoStatus(p) === filter)
    .filter(p => !search.trim() || p.name.toLowerCase().includes(search.toLowerCase())), [promos, filter, search])

  const onSaved = (p) => {
    setPromos(prev => prev.some(x => x.id === p.id) ? prev.map(x => x.id === p.id ? p : x) : [p, ...prev])
    bump()
  }
  const toggle = async (p) => { onSaved(await togglePromotion(p.id)) }
  const remove = async (p) => {
    if (!window.confirm(t('mkt_promo_delete_confirm', { name: p.name }))) return
    const r = await deletePromotion(p.id)
    if (r.deactivated) { setMsg(t('mkt_promo_deactivated')); load() } else setPromos(prev => prev.filter(x => x.id !== p.id))
    bump()
  }

  const FILTERS = ['all', 'active', 'scheduled', 'ended', 'off']

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setPicker(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent-red text-white rounded-xl font-semibold text-sm hover:opacity-90 shrink-0">
          <Plus size={16} /> {t('mkt_promo_new')}
        </button>
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('mkt_promo_search')}
            className="w-full bg-bg-secondary border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-red" />
        </div>
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap ${filter === f ? 'bg-accent-red text-white' : 'bg-bg-secondary border border-border text-text-secondary'}`}>
              {t('mkt_status_' + f)}
            </button>
          ))}
        </div>
      </div>
      {msg && <div className="text-sm bg-accent-blue/10 text-accent-blue px-4 py-2.5 rounded-xl flex justify-between"><span>{msg}</span><button onClick={() => setMsg('')}><X size={14} /></button></div>}

      {loading ? (
        <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-accent-red border-t-transparent rounded-full animate-spin" /></div>
      ) : visible.length === 0 ? (
        <div className="bg-bg-secondary border border-border rounded-2xl p-12 text-center text-text-secondary text-sm">{t('mkt_promo_empty')}</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {visible.map(p => {
            const st = promoStatus(p)
            const s = stats[p.id]
            return (
              <div key={p.id} className="bg-bg-secondary border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-text-primary truncate">{p.name}</p>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${STATUS_CLS[st]}`}>{t('mkt_status_' + st)}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-accent-orange/10 text-accent-orange">{t('mkt_kind_' + p.kind)}</span>
                      {p.requiresCode && <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-500">{t('mkt_badge_code')}</span>}
                    </div>
                    {p.description && <p className="text-xs text-text-muted mt-0.5">{p.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggle(p)} title={p.isActive ? t('mkt_turn_off') : t('mkt_turn_on')}
                      className={`p-1.5 rounded-lg ${p.isActive ? 'text-accent-green hover:bg-accent-green/10' : 'text-text-muted hover:bg-bg-tertiary'}`}><Power size={14} /></button>
                    <button onClick={() => setForm(p)} className="p-1.5 rounded-lg text-text-secondary hover:bg-blue-500/10 hover:text-blue-400"><Pencil size={14} /></button>
                    <button onClick={() => remove(p)} className="p-1.5 rounded-lg text-text-secondary hover:bg-accent-red/10 hover:text-accent-red"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="text-xs text-text-secondary">{promoSummary(p, t, products, categories)}</p>
                <div className="flex items-center justify-between gap-2 text-[11px] text-text-muted flex-wrap">
                  <span>{p.startDate || p.endDate ? `${fmtD(p.startDate)} — ${fmtD(p.endDate)}` : t('mkt_no_period')}</span>
                  <span>{t('mkt_promo_stats', { sales: s?.sales || 0, discount: fmtMoney(s?.discount || 0) })}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {picker && <TemplatePicker onClose={() => setPicker(false)} onPick={(tpl) => { setPicker(false); setForm(tpl ? fromTemplate(tpl, t('mkt_tpl_' + tpl.id)) : emptyPromo()) }} />}
        {form && (
          <PromoFormModal initial={form} onClose={() => setForm(null)} onSaved={(p) => { onSaved(p); getPromotionStats().then(list => setStats(Object.fromEntries(list.map(s => [s.promoId, s])))).catch(() => {}) }}
            products={products} categories={categories} customerGroups={groups} />
        )}
      </AnimatePresence>
    </div>
  )
}

export default PromotionsTab
