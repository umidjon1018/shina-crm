import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Eye, EyeOff, MoreHorizontal, Pencil, Plus, Trash2, TrendingDown, TrendingUp, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDataStore } from '../../../store/dataStore'
import { createFinanceCategory, updateFinanceCategory, deleteFinanceCategory } from '../../../api/financeService'
import { useFinanceCategories } from '../components/useFinanceCategories'
import { ICON_MAP, COLOR_CLS, colorCls, getCatLabel, sortedCategories } from '../components/expHelpers'

const CategoryFormModal = ({ kind, editData, onClose, onSaved }) => {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    label: editData?.label || '',
    labelRu: editData?.labelRu && editData.labelRu !== editData.label ? editData.labelRu : '',
    icon: editData?.icon || 'MoreHorizontal',
    color: editData?.color || 'gray',
    isFixed: !!editData?.isFixed,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.label.trim()) return setError(t('fin_cat_err_name'))
    setSaving(true); setError('')
    try {
      const payload = { ...form, label: form.label.trim(), labelRu: form.labelRu.trim() || form.label.trim(), kind }
      const saved = editData ? await updateFinanceCategory(editData.id, payload) : await createFinanceCategory(payload)
      onSaved(saved)
      onClose()
    } catch (e) {
      setError(e?.response?.data?.error || t('exp_err_generic'))
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-red'
  const PreviewIcon = ICON_MAP[form.icon] || MoreHorizontal

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-bg-secondary border border-border rounded-2xl w-full max-w-md shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border sticky top-0 bg-bg-secondary">
          <h3 className="font-syne font-bold text-lg text-text-primary">
            {editData ? t('fin_cat_edit') : kind === 'income' ? t('fin_cat_add_income') : t('fin_cat_add_expense')}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-bg-tertiary rounded-lg"><X size={18} className="text-text-secondary" /></button>
        </div>
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorCls(form.color)}`}><PreviewIcon size={22} /></div>
            <div className="flex-1 space-y-2">
              <input value={form.label} onChange={e => set('label', e.target.value)} placeholder={t('fin_cat_name_uz')} className={inputCls} autoFocus />
              <input value={form.labelRu} onChange={e => set('labelRu', e.target.value)} placeholder={t('fin_cat_name_ru')} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="text-text-secondary text-sm mb-1.5 block">{t('fin_cat_icon')}</label>
            <div className="grid grid-cols-7 gap-1.5">
              {Object.entries(ICON_MAP).map(([name, Icon]) => (
                <button key={name} type="button" onClick={() => set('icon', name)}
                  className={`h-9 rounded-lg flex items-center justify-center border transition-all ${form.icon === name ? 'border-accent-red bg-accent-red/10 text-accent-red' : 'border-border bg-bg-tertiary text-text-secondary hover:border-accent-red/50'}`}>
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-text-secondary text-sm mb-1.5 block">{t('fin_cat_color')}</label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(COLOR_CLS).map(c => (
                <button key={c} type="button" onClick={() => set('color', c)}
                  className={`w-8 h-8 rounded-lg border-2 ${COLOR_CLS[c]} ${form.color === c ? 'border-accent-red' : 'border-transparent'}`}>
                  <span className="block w-3 h-3 rounded-full bg-current mx-auto" />
                </button>
              ))}
            </div>
          </div>
          {kind === 'expense' && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.isFixed} onChange={e => set('isFixed', e.target.checked)} className="w-4 h-4 accent-[#E63946]" />
              <span className="text-sm text-text-primary">{t('fin_cat_fixed')}<span className="block text-xs text-text-muted">{t('fin_cat_fixed_hint')}</span></span>
            </label>
          )}
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 px-3 py-2 rounded-lg"><AlertCircle size={15} /> {error}</div>
          )}
        </div>
        <div className="flex gap-3 p-4 sm:p-5 border-t border-border sticky bottom-0 bg-bg-secondary">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary hover:bg-bg-tertiary text-sm font-medium">{t('cancel')}</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-accent-red text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50">
            {saving ? t('exp_form_saving') : editData ? t('save') : t('add')}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

const CategoriesTab = () => {
  const { t } = useTranslation()
  const { bump } = useDataStore()
  const { categories, reload } = useFinanceCategories()
  const [modal, setModal] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [msg, setMsg] = useState('')

  const refresh = () => { reload(); bump() }

  const toggleActive = async (cat) => {
    await updateFinanceCategory(cat.id, { isActive: !cat.isActive })
    refresh()
  }

  const doDelete = async () => {
    const cat = confirmDel
    setConfirmDel(null)
    try {
      const r = await deleteFinanceCategory(cat.id)
      setMsg(r.deactivated ? t('fin_cat_deactivated_msg', { name: getCatLabel(cat, t) }) : t('fin_cat_deleted_msg', { name: getCatLabel(cat, t) }))
      refresh()
    } catch (e) {
      setMsg(e?.response?.data?.error || t('exp_err_generic'))
    }
  }

  const Section = ({ kind, title, icon: TitleIcon, cls }) => {
    const list = sortedCategories(categories.filter(c => c.kind === kind))
    return (
      <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-syne font-bold text-text-primary flex items-center gap-2">
            <TitleIcon size={17} className={cls} /> {title} <span className="text-text-muted text-xs font-normal">({list.length})</span>
          </h3>
          <button onClick={() => setModal({ kind })}
            className="flex items-center gap-1.5 px-3 py-2 bg-accent-red text-white rounded-xl font-semibold text-xs hover:opacity-90">
            <Plus size={14} /> {t('add')}
          </button>
        </div>
        <div className="divide-y divide-border/50">
          {list.length === 0 && <p className="px-4 py-4 sm:py-6 text-center text-text-muted text-sm">{t('fin_no_categories')}</p>}
          {list.map(cat => {
            const Icon = ICON_MAP[cat.icon] || MoreHorizontal
            return (
              <div key={cat.id} className={`flex items-center gap-3 px-4 py-3 ${cat.isActive ? '' : 'bg-bg-tertiary/40'}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colorCls(cat.color)}`}><Icon size={16} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-text-primary text-sm font-semibold truncate">{getCatLabel(cat, t)}</span>
                    {cat.isFixed && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-accent-blue/10 text-accent-blue">{t('exp_type_fixed')}</span>}
                    {!cat.isActive && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-500/10 text-gray-500">{t('fin_cat_inactive')}</span>}
                  </div>
                  <p className="text-text-muted text-xs">{t('fin_cat_used', { count: cat.usedCount || 0 })}</p>
                </div>
                <button onClick={() => toggleActive(cat)} title={cat.isActive ? t('fin_cat_hide') : t('fin_cat_show')}
                  className="p-1.5 rounded-lg text-text-secondary hover:bg-bg-tertiary">
                  {cat.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button onClick={() => setModal({ kind, edit: cat })} className="p-1.5 rounded-lg text-text-secondary hover:bg-blue-500/10 hover:text-blue-400">
                  <Pencil size={14} />
                </button>
                <button onClick={() => setConfirmDel(cat)} className="p-1.5 rounded-lg text-text-secondary hover:bg-accent-red/10 hover:text-accent-red">
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-text-secondary text-sm">{t('fin_cat_desc')}</p>
      {msg && (
        <div className="flex items-center justify-between gap-2 text-sm bg-accent-blue/10 text-accent-blue px-4 py-2.5 rounded-xl">
          <span>{msg}</span><button onClick={() => setMsg('')}><X size={14} /></button>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <Section kind="expense" title={t('fin_cat_expense_title')} icon={TrendingDown} cls="text-accent-red" />
        <Section kind="income" title={t('fin_cat_income_title')} icon={TrendingUp} cls="text-accent-green" />
      </div>

      <AnimatePresence>
        {modal && (
          <CategoryFormModal kind={modal.kind} editData={modal.edit} onClose={() => setModal(null)} onSaved={refresh} />
        )}
        {confirmDel && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDel(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-bg-secondary border border-border rounded-2xl w-full max-w-sm shadow-2xl z-10 p-4 sm:p-5 space-y-4">
              <h3 className="font-syne font-bold text-text-primary">{t('fin_cat_delete_title', { name: getCatLabel(confirmDel, t) })}</h3>
              <p className="text-text-secondary text-sm">
                {confirmDel.usedCount ? t('fin_cat_delete_used', { count: confirmDel.usedCount }) : t('fin_cat_delete_unused')}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDel(null)} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-medium">{t('cancel')}</button>
                <button onClick={doDelete} className="flex-1 py-2.5 rounded-xl bg-accent-red text-white font-semibold text-sm">
                  {confirmDel.usedCount ? t('fin_cat_hide') : t('delete')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CategoriesTab
