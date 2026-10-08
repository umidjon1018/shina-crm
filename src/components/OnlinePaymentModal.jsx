import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import QRCode from 'qrcode'
import { AlertCircle, CheckCircle2, Copy, ExternalLink, Loader2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { createOnlinePayment, getOnlinePayment, cancelOnlinePayment, simulateOnlinePayment } from '../api/integrationService'

const NAMES = { payme: 'Payme', click: 'Click', uzum: 'Uzum Bank' }
const COLORS = { payme: 'bg-[#00CCCC]/10 text-[#00A6A6] border-[#00CCCC]/40', click: 'bg-[#0073FF]/10 text-[#0073FF] border-[#0073FF]/40', uzum: 'bg-[#7000FF]/10 text-[#7000FF] border-[#7000FF]/40' }
const fmt = (v) => Math.round(Number(v) || 0).toLocaleString('uz-UZ')

// purpose: 'sale' — kassadagi sotuv uchun, 'link' — alohida to'lov havolasi
const OnlinePaymentModal = ({ amount, providers, shopId, customerId, purpose = 'sale', note = '', onPaid, onClose, paidActionLabel }) => {
  const { t } = useTranslation()
  const [provider, setProvider] = useState(providers.length === 1 ? providers[0].id : '')
  const [payment, setPayment] = useState(null)
  const [qr, setQr] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    if (!provider || payment) return
    setError('')
    createOnlinePayment({ provider, amount, shop_id: shopId, customer_id: customerId, purpose, note })
      .then(p => { setPayment(p); return QRCode.toDataURL(p.link, { width: 260, margin: 1 }) })
      .then(setQr)
      .catch(e => setError(e?.response?.data?.error || t('exp_err_generic')))
  }, [provider])

  useEffect(() => {
    if (!payment || payment.status !== 'pending') return
    timer.current = setInterval(async () => {
      try { const p = await getOnlinePayment(payment.id); if (p.status !== 'pending') setPayment(p) } catch {}
    }, 3000)
    return () => clearInterval(timer.current)
  }, [payment?.id, payment?.status])

  const close = async () => {
    if (payment?.status === 'pending') await cancelOnlinePayment(payment.id).catch(() => {})
    onClose()
  }
  const simulate = async () => { await simulateOnlinePayment(payment.id); setPayment(await getOnlinePayment(payment.id)) }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={payment?.status === 'paid' ? undefined : close} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-bg-secondary border border-border rounded-2xl w-full max-w-sm shadow-2xl z-10 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-syne font-bold text-lg text-text-primary">{t('int_pay_title')}</h3>
          {payment?.status !== 'paid' && <button onClick={close} className="p-1.5 hover:bg-bg-tertiary rounded-lg"><X size={18} className="text-text-secondary" /></button>}
        </div>
        <div className="p-4 space-y-4">
          <p className="text-center text-2xl font-syne font-extrabold text-text-primary">{fmt(amount)} <span className="text-sm text-text-muted">{t('unit_som')}</span></p>
          {!provider && (
            <div className="grid gap-2">
              {providers.map(p => (
                <button key={p.id} onClick={() => setProvider(p.id)} className={`py-3 rounded-xl border font-bold ${COLORS[p.id]}`}>
                  {NAMES[p.id]}{p.test ? ` · ${t('int_test')}` : ''}
                </button>
              ))}
            </div>
          )}
          {error && <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 px-3 py-2 rounded-lg"><AlertCircle size={15} /> {error}</div>}
          {provider && !payment && !error && <div className="flex justify-center py-5 sm:py-8"><Loader2 className="animate-spin text-text-muted" /></div>}
          {payment && payment.status === 'pending' && (
            <>
              <p className="text-center text-xs text-text-secondary">{t('int_pay_scan', { name: NAMES[payment.provider] })}</p>
              {qr && <img src={qr} alt="QR" className="mx-auto rounded-xl bg-white p-2" />}
              <div className="flex gap-2">
                <button onClick={() => navigator.clipboard?.writeText(payment.link).then(() => setCopied(true)).catch(() => {})}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-xs font-semibold text-text-secondary">
                  <Copy size={13} /> {copied ? t('mkt_copied') : t('int_copy_link')}
                </button>
                <a href={payment.link} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-xs font-semibold text-text-secondary">
                  <ExternalLink size={13} /> {t('int_open_link')}
                </a>
              </div>
              <p className="flex items-center justify-center gap-2 text-xs text-text-muted"><Loader2 size={13} className="animate-spin" /> {t('int_pay_waiting')}</p>
              {payment.test && (
                <button onClick={simulate} className="w-full py-2 rounded-xl border border-dashed border-accent-orange text-accent-orange text-xs font-bold">{t('int_simulate')}</button>
              )}
            </>
          )}
          {payment && payment.status === 'paid' && (
            <div className="text-center space-y-3">
              <CheckCircle2 size={44} className="mx-auto text-accent-green" />
              <p className="font-bold text-text-primary">{t('int_pay_paid')}</p>
              <button onClick={() => onPaid(payment)} className="w-full py-2.5 rounded-xl bg-accent-green text-white font-bold text-sm">
                {paidActionLabel || t('mkt_done')}
              </button>
            </div>
          )}
          {payment && ['cancelled', 'refunded'].includes(payment.status) && (
            <div className="text-center space-y-3">
              <AlertCircle size={40} className="mx-auto text-accent-red" />
              <p className="text-sm text-text-secondary">{t('int_pay_cancelled')}</p>
              <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-border text-sm">{t('cancel')}</button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default OnlinePaymentModal
