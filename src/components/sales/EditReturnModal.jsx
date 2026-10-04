import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { X, Pencil, History, Loader2 } from 'lucide-react'
import { updateReturn, getReturnEdits } from '../../api/returnService'
import { toLocalISO } from '../../utils/tz'

const METHODS = ['cash', 'card', 'transfer']
const fmtDate = (iso) => (iso || '').slice(0, 10).split('-').reverse().join('.')

// Qaytarishni tahrirlash: sabab, izoh; pul qaytarishda qaytarish usuli. Summa va tovarlar o'zgarmaydi.
const EditReturnModal = ({ ret, onClose, onSaved }) => {
  const { t } = useTranslation()
  const isExchange = ret.type === 'exchange' || ret._isExchange
  const [reason, setReason] = useState(ret.returnReason || '')
  const [notes, setNotes] = useState(ret.notes || '')
  const [method, setMethod] = useState(ret.paymentMethod || 'cash')
  const [edits, setEdits] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (ret.editCount > 0) getReturnEdits(ret.id).then(setEdits).catch(() => {})
  }, [ret.id, ret.editCount])

  const methodLabel = (m) => ({ cash: t('pay_cash'), card: t('pay_card'), transfer: t('sl_hist_pay_bank') }[m] || m || '—')
  const fieldLabel = (k) => ({ return_reason: t('col_reason'), notes: t('sl_edit_notes'), payment_method: t('sl_rh_th_payment') }[k] || k)
  const describe = (k, v) => (v == null || v === '' ? '—' : k === 'payment_method' ? methodLabel(v) : String(v))

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const body = { return_reason: reason, notes }
      if (!isExchange) body.payment_method = method
      await updateReturn(ret.id, body)
      onSaved?.()
      onClose()
    } catch (e) {
      setError(e?.response?.data?.error || t('sl_edit_err_save'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-bg-secondary border border-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-syne font-bold text-text-primary flex items-center gap-2"><Pencil size={16} /> {t('sl_edit_return_title')}</h3>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary"><X size={18} /></button>
        </div>

        <div className="text-xs text-text-muted mb-4 bg-bg-tertiary rounded-xl p-3">
          <span className="font-bold text-text-primary">{isExchange ? t('col_exchange') : t('sl_rh_type_cancel')}</span> · {ret.customerName || '—'} · {t('sl_edit_return_locked')}
        </div>

        {!isExchange && (
          <>
            <label className="block text-xs font-bold text-text-secondary mb-1.5">{t('sl_rh_th_payment')}</label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {METHODS.map(m => (
                <button key={m} onClick={() => setMethod(m)}
                  className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${method === m ? 'bg-accent-red text-white border-accent-red' : 'bg-bg-tertiary border-border text-text-secondary'}`}>
                  {methodLabel(m)}
                </button>
              ))}
            </div>
          </>
        )}

        <label className="block text-xs font-bold text-text-secondary mb-1.5">{t('col_reason')}</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
          className="w-full mb-4 bg-bg-tertiary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-red resize-none" />

        <label className="block text-xs font-bold text-text-secondary mb-1.5">{t('sl_edit_notes')}</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
          className="w-full mb-4 bg-bg-tertiary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-red resize-none" />

        {error && <p className="text-xs text-accent-red font-semibold mb-3">{error}</p>}

        <button onClick={save} disabled={saving}
          className="w-full py-3 bg-accent-red text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
          {saving && <Loader2 size={16} className="animate-spin" />} {t('sl_edit_save')}
        </button>

        {edits.length > 0 && (
          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-xs font-bold text-text-secondary mb-2 flex items-center gap-1.5"><History size={13} /> {t('sl_edit_history')}</p>
            <div className="space-y-2">
              {edits.map(e => (
                <div key={e.id} className="bg-bg-tertiary rounded-xl p-2.5 text-[11px]">
                  <div className="text-text-muted mb-1">{fmtDate(toLocalISO(e.created_at))} {toLocalISO(e.created_at)?.slice(11, 16)} · <span className="font-bold text-text-secondary">{e.edited_by_name || '—'}</span></div>
                  {Object.entries(e.changes || {}).map(([k, v]) => (
                    <div key={k} className="text-text-primary">
                      <span className="text-text-muted">{fieldLabel(k)}:</span> {describe(k, v.from)} → <span className="font-bold">{describe(k, v.to)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default EditReturnModal
