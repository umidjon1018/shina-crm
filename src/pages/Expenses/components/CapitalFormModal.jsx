import React, { useState, useMemo } from 'react'
import DateMaskInput from '../../../components/DateMaskInput'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowDownCircle, ArrowUpCircle, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '../../../store/settingsStore'
import { useShopStore } from '../../../store/shopStore'
import { addCapital, updateCapital } from '../../../api/capitalService'
import { today, fmtUZS, fmtNum, PaymentMethodPicker } from './expHelpers'

// ─── CAPITAL FORM MODAL (qo'shish + tahrirlash) ──────────
const CapitalFormModal = ({ onClose, onSave, editData }) => {
  const { t } = useTranslation()
  const isEdit = !!editData
  const { usdRate: settingsUsdRate } = useSettingsStore()
  const { selectedShopId } = useShopStore()
  const defaultUsdRate = String(settingsUsdRate || 12700)
  const [form, setForm] = useState(isEdit ? {
    type: editData.type,
    amount: String(editData.amount),
    currency: editData.currency,
    usdRate: editData.usdRate ? String(editData.usdRate) : defaultUsdRate,
    date: editData.date,
    source: editData.source || '',
    note: editData.note || '',
    paymentMethod: editData.paymentMethod || 'cash',
  } : {
    type: 'inject',
    amount: '',
    currency: 'UZS',
    usdRate: defaultUsdRate,
    date: today(),
    source: '',
    note: '',
    paymentMethod: 'cash',
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
    if (!form.amount || Number(form.amount) <= 0) return setError(t('exp_cap_err_no_amount'))
    if (form.currency === 'USD' && Number(form.usdRate) <= 0) return setError(t('exp_cap_err_no_usd_rate'))
    if (!form.date) return setError(t('exp_cap_err_no_date'))
    if (!form.source.trim()) return setError(t('exp_cap_err_no_source'))
    setLoading(true); setError('')
    const payload = {
      shopId: selectedShopId && selectedShopId !== 'all' ? selectedShopId : '1',
      type: form.type,
      amount: Number(form.amount),
      currency: form.currency,
      usdRate: form.currency === 'USD' ? Number(form.usdRate) : null,
      amountUZS,
      date: form.date,
      source: form.source.trim(),
      note: form.note.trim(),
      paymentMethod: form.paymentMethod,
    }
    let res
    if (isEdit) res = await updateCapital(editData.id, payload)
    else res = await addCapital(payload)
    setLoading(false)
    if (res.success) { onSave(res.entry || { ...editData, ...payload }); onClose() }
    else setError(t('exp_err_generic'))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-bg-secondary border border-border rounded-2xl w-full max-w-md shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-syne font-bold text-lg text-text-primary">
            {isEdit ? t('exp_cap_form_edit_title') : t('exp_tab_capital')}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-bg-tertiary rounded-lg transition-colors">
            <X size={18} className="text-text-secondary" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Tur */}
          <div>
            <label className="text-text-secondary text-sm mb-1.5 block">{t('exp_cap_form_type')}</label>
            <div className="flex gap-2">
              <button onClick={() => set('type', 'inject')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all text-sm font-semibold
                  ${form.type === 'inject' ? 'border-green-500 bg-green-500/10 text-green-500' : 'border-border bg-bg-tertiary text-text-secondary hover:border-green-500/50'}`}>
                <ArrowDownCircle size={16} /> {t('exp_cap_inject')}
              </button>
              <button onClick={() => set('type', 'return')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all text-sm font-semibold
                  ${form.type === 'return' ? 'border-accent-red bg-accent-red/10 text-accent-red' : 'border-border bg-bg-tertiary text-text-secondary hover:border-accent-red/50'}`}>
                <ArrowUpCircle size={16} /> {t('exp_cap_return')}
              </button>
            </div>
          </div>
          {/* Manba */}
          <div>
            <label className="text-text-secondary text-sm mb-1.5 block">{t('exp_cap_form_source')}</label>
            <input type="text" value={form.source} onChange={e => set('source', e.target.value)}
              placeholder={t('exp_cap_form_source_placeholder')}
              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-red" />
          </div>
          {/* To'lov usuli */}
          <div>
            <label className="text-text-secondary text-sm mb-1.5 block">{t('fin_payment_method')}</label>
            <PaymentMethodPicker value={form.paymentMethod} onChange={v => set('paymentMethod', v)} />
          </div>
          {/* Summa */}
          <div>
            <label className="text-text-secondary text-sm mb-1.5 block">{t('col_amount')}</label>
            <div className="flex gap-2">
              <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0"
                className="flex-1 bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-red" />
              <div className="flex border border-border rounded-xl overflow-hidden">
                {['UZS','USD'].map(cur => (
                  <button key={cur} onClick={() => set('currency', cur)}
                    className={`px-3 py-2 text-sm font-semibold transition-colors
                      ${form.currency === cur ? 'bg-accent-red text-white' : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'}`}>
                    {cur}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* USD kurs */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-text-secondary text-sm">{t('exp_cap_form_usd_rate')}</label>
              {String(settingsUsdRate) !== form.usdRate && form.usdRate && (
                <button type="button" onClick={() => set('usdRate', defaultUsdRate)}
                  className="text-xs text-accent-red hover:underline">
                  {t('exp_cap_form_get_from_settings')} ({fmtNum(settingsUsdRate)})
                </button>
              )}
            </div>
            <input type="number" value={form.usdRate} onChange={e => set('usdRate', e.target.value)}
              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-red" />
            {form.currency === 'USD' && amountUZS > 0 && (
              <p className="text-text-secondary text-xs mt-1">≈ {fmtUZS(amountUZS)}</p>
            )}
          </div>
          {/* Sana */}
          <div>
            <label className="text-text-secondary text-sm mb-1.5 block">{t('col_date')}</label>
            <DateMaskInput value={form.date} onChange={e => set('date', e.target.value)}
              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-red" />
          </div>
          {/* Izoh */}
          <div>
            <label className="text-text-secondary text-sm mb-1.5 block">{t('col_note')}</label>
            <textarea value={form.note} onChange={e => set('note', e.target.value)} rows={2} placeholder={t('exp_form_note_placeholder')}
              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-red resize-none" />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 px-3 py-2 rounded-lg">
              <AlertCircle size={15} /> {error}
            </div>
          )}
        </div>
        <div className="flex gap-3 p-5 border-t border-border">
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


export default CapitalFormModal
