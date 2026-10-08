import React, { useState, useMemo } from 'react'
import DateMaskInput from '../../../components/DateMaskInput'
import { motion } from 'framer-motion'
import { AlertCircle, MoreHorizontal, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '../../../store/settingsStore'
import { addIncome, updateIncome } from '../../../api/financeService'
import { ICON_MAP, fmtUZS, today, sortedCategories, getCatLabel, PaymentMethodPicker } from './expHelpers'
import { StackGuard } from '../../../components/ui/Modal'

const IncomeFormModal = ({ onClose, onSave, categories, currentUser, editData, shopId }) => {
  const { t } = useTranslation()
  const isEdit = !!editData
  const { usdRate: settingsUsdRate } = useSettingsStore()
  const [form, setForm] = useState(isEdit ? {
    categoryId: editData.categoryId || '',
    amount: String(editData.amount),
    currency: editData.currency,
    usdRate: editData.usdRate ? String(editData.usdRate) : String(settingsUsdRate || 12700),
    date: editData.date,
    paymentMethod: editData.paymentMethod || 'cash',
    responsibleName: editData.responsibleName || '',
    note: editData.note || '',
  } : {
    categoryId: sortedCategories(categories)[0]?.id || '',
    amount: '',
    currency: 'UZS',
    usdRate: String(settingsUsdRate || 12700),
    date: today(),
    paymentMethod: 'cash',
    responsibleName: currentUser?.fullName || currentUser?.username || '',
    note: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const amountUZS = useMemo(() => {
    if (!form.amount) return 0
    if (form.currency === 'UZS') return Number(form.amount)
    return Number(form.amount) * Number(form.usdRate || 0)
  }, [form.amount, form.currency, form.usdRate])

  const handleSubmit = async () => {
    if (!form.categoryId) return setError(t('exp_err_no_category'))
    if (!form.amount || Number(form.amount) <= 0) return setError(t('exp_err_no_amount'))
    if (form.currency === 'USD' && Number(form.usdRate) <= 0) return setError(t('exp_err_no_usd_rate'))
    if (!form.date) return setError(t('exp_err_no_date'))
    setLoading(true); setError('')
    const payload = {
      shopId: isEdit ? editData.shopId : shopId,
      categoryId: form.categoryId,
      amount: Number(form.amount),
      currency: form.currency,
      usdRate: form.currency === 'USD' ? Number(form.usdRate) : null,
      amountUZS,
      paymentMethod: form.paymentMethod,
      date: form.date,
      note: form.note.trim(),
      responsibleName: form.responsibleName.trim(),
    }
    try {
      const saved = isEdit ? await updateIncome(editData.id, payload) : await addIncome(payload)
      onSave(saved)
      onClose()
    } catch (e) {
      setError(e?.response?.data?.error || t('exp_err_generic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <StackGuard onClose={onClose} />
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-bg-secondary border border-border rounded-2xl w-full max-w-md shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border sticky top-0 bg-bg-secondary">
          <h3 className="font-syne font-bold text-lg text-text-primary">
            {isEdit ? t('fin_inc_edit_title') : t('fin_inc_add_title')}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-bg-tertiary rounded-lg transition-colors">
            <X size={18} className="text-text-secondary" />
          </button>
        </div>
        <div className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="text-text-secondary text-sm mb-1.5 block">{t('col_category')}</label>
            {categories.length === 0 ? (
              <p className="text-text-muted text-sm">{t('fin_no_categories')}</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {sortedCategories(categories).map(cat => {
                  const Icon = ICON_MAP[cat.icon] || MoreHorizontal
                  const active = form.categoryId === cat.id
                  return (
                    <button key={cat.id} onClick={() => set('categoryId', cat.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all text-xs font-medium text-left
                        ${active ? 'border-accent-red bg-accent-red/10 text-accent-red' : 'border-border bg-bg-tertiary text-text-secondary hover:border-accent-red/50'}`}>
                      <Icon size={14} className="shrink-0" />
                      <span className="truncate">{getCatLabel(cat, t)}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <div>
            <label className="text-text-secondary text-sm mb-1.5 block">{t('col_amount')}</label>
            <div className="flex gap-2">
              <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0"
                className="flex-1 min-w-0 bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-red" />
              <div className="flex border border-border rounded-xl overflow-hidden">
                {['UZS', 'USD'].map(cur => (
                  <button key={cur} onClick={() => set('currency', cur)}
                    className={`px-3 py-2 text-sm font-semibold transition-colors
                      ${form.currency === cur ? 'bg-accent-red text-white' : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'}`}>
                    {cur}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {form.currency === 'USD' && (
            <div>
              <label className="text-text-secondary text-sm mb-1.5 block">{t('exp_form_usd_rate')}</label>
              <input type="number" value={form.usdRate} onChange={e => set('usdRate', e.target.value)}
                className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-red" />
              {amountUZS > 0 && <p className="text-text-secondary text-xs mt-1">≈ {fmtUZS(amountUZS)}</p>}
            </div>
          )}
          <div>
            <label className="text-text-secondary text-sm mb-1.5 block">{t('fin_payment_method')}</label>
            <PaymentMethodPicker value={form.paymentMethod} onChange={v => set('paymentMethod', v)} />
          </div>
          <div>
            <label className="text-text-secondary text-sm mb-1.5 block">{t('col_date')}</label>
            <DateMaskInput value={form.date} onChange={e => set('date', e.target.value)}
              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-red" />
          </div>
          <div>
            <label className="text-text-secondary text-sm mb-1.5 block">{t('exp_form_responsible')}</label>
            <input type="text" value={form.responsibleName} onChange={e => set('responsibleName', e.target.value)}
              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-red" />
          </div>
          <div>
            <label className="text-text-secondary text-sm mb-1.5 block">{t('col_note')}</label>
            <textarea value={form.note} onChange={e => set('note', e.target.value)} rows={2} placeholder={t('fin_inc_note_ph')}
              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-red resize-none" />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 px-3 py-2 rounded-lg">
              <AlertCircle size={15} /> {error}
            </div>
          )}
        </div>
        <div className="flex gap-3 p-4 sm:p-5 border-t border-border sticky bottom-0 bg-bg-secondary">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary hover:bg-bg-tertiary transition-colors text-sm font-medium">{t('cancel')}</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-accent-red text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? t('exp_form_saving') : isEdit ? t('save') : t('add')}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default IncomeFormModal
