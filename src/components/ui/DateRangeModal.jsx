import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarRange } from 'lucide-react'
import Modal from './Modal'
import DateMaskInput from '../DateMaskInput'
import { presetRange, ymd } from '../../utils/period'

// Sanalar oralig'ini tanlash: ikkala sana kiritilib "Tasdiqlash" bosilganda qo'llanadi
const DateRangeModal = ({ open, initial, onClose, onApply }) => {
  const { t } = useTranslation()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!open) return
    const def = presetRange('month')
    setFrom(initial?.from && initial.from > '2000-01-01' ? initial.from : def.from)
    setTo(initial?.to || ymd(new Date()))
    setErr('')
  }, [open])

  const apply = () => {
    if (!from || !to) { setErr(t('period_err_both')); return }
    if (from > to) { setErr(t('period_err_order')); return }
    onApply(from, to)
  }
  const inputCls = 'w-full bg-bg-secondary border border-border rounded-xl px-4 py-3 text-base text-text-primary focus:outline-none focus:border-accent-red'

  return (
    <Modal open={open} onClose={onClose} size="sm" icon={CalendarRange} title={t('period_custom_title')}
      footer={(
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onClose} className="py-3 rounded-xl border border-border text-text-secondary font-semibold">{t('cancel')}</button>
          <button onClick={apply} className="py-3 rounded-xl g-brand text-white font-bold">{t('period_apply')}</button>
        </div>
      )}>
      <div className="space-y-3">
        <div>
          <label className="text-sm text-text-muted mb-1 block">{t('period_from')}</label>
          <DateMaskInput value={from} onChange={e => { setFrom(e.target.value); setErr('') }} className={inputCls} />
        </div>
        <div>
          <label className="text-sm text-text-muted mb-1 block">{t('period_to')}</label>
          <DateMaskInput value={to} onChange={e => { setTo(e.target.value); setErr('') }} className={inputCls} />
        </div>
        {err && <p className="text-sm text-accent-red">{err}</p>}
      </div>
    </Modal>
  )
}

export default DateRangeModal
