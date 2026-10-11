import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { XCircle, Loader2 } from 'lucide-react'
import Modal from './ui/Modal'

const PRESETS = ['cr_reason_no_stock', 'cr_reason_no_contact', 'cr_reason_customer_refused', 'cr_reason_price_changed']

// Bronni bekor qilish: sabab mijozga (botda) xabar bilan boradi
const CancelReasonModal = ({ open, title, subtitle, required = true, busy, onClose, onConfirm }) => {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')
  useEffect(() => { if (open) setReason('') }, [open])
  const ok = !required || reason.trim().length > 0
  return (
    <Modal open={open} onClose={onClose} title={title || t('cr_title')} subtitle={subtitle} icon={XCircle} size="sm">
      <div className="space-y-3">
        <p className="text-sm text-text-secondary">{t('cr_hint')}</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(k => (
            <button key={k} type="button" onClick={() => setReason(t(k))}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${reason === t(k) ? 'border-accent-red bg-accent-red/10 text-accent-red' : 'border-border text-text-secondary'}`}>{t(k)}</button>
          ))}
        </div>
        <textarea value={reason} onChange={e => setReason(e.target.value.slice(0, 300))} rows={3} placeholder={t('cr_placeholder')}
          className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-red resize-none" />
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onClose} className="py-2.5 rounded-xl border border-border text-sm font-bold text-text-secondary">{t('cancel')}</button>
          <button onClick={() => onConfirm(reason.trim())} disabled={!ok || busy}
            className="py-2.5 rounded-xl bg-accent-red text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1.5">
            {busy && <Loader2 size={14} className="animate-spin" />}{t('cr_confirm')}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default CancelReasonModal
