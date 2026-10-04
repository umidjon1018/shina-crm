import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Copy, Gift, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import DateMaskInput from '../DateMaskInput'
import { useDataStore } from '../../store/dataStore'
import { sellGiftCard } from '../../api/marketingService'
import { getCustomers } from '../../api/customerService'
import { PaymentMethodPicker } from '../../pages/Expenses/components/expHelpers'

const inputCls = 'w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-red'
const Label = ({ children }) => <label className="text-text-secondary text-xs font-semibold mb-1.5 block">{children}</label>
const NOMINALS = [100000, 200000, 300000, 500000, 1000000]
const fmt = (n) => Math.round(Number(n) || 0).toLocaleString('uz-UZ')

const GiftCardSellModal = ({ shopId, onClose, onSold, presetCode = '' }) => {
  const { t } = useTranslation()
  const { bump } = useDataStore()
  const [mode, setMode] = useState(presetCode ? 'existing' : 'new')
  const [code, setCode] = useState(presetCode)
  const [nominal, setNominal] = useState(200000)
  const [price, setPrice] = useState('')
  const [method, setMethod] = useState('cash')
  const [expires, setExpires] = useState(() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().slice(0, 10) })
  const [customers, setCustomers] = useState([])
  const [custQ, setCustQ] = useState('')
  const [customer, setCustomer] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [sold, setSold] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => { getCustomers().then(setCustomers).catch(() => {}) }, [])
  const found = useMemo(() => {
    const q = custQ.trim().toLowerCase()
    if (q.length < 2) return []
    return customers.filter(c => `${c.name} ${c.phone || ''}`.toLowerCase().includes(q)).slice(0, 6)
  }, [customers, custQ])

  const submit = async () => {
    setError('')
    if (mode === 'existing' && !code.trim()) return setError(t('mkt_gc_err_code'))
    if (mode === 'new' && !(Number(nominal) > 0)) return setError(t('mkt_gc_err_nominal'))
    setSaving(true)
    try {
      const r = await sellGiftCard({
        shop_id: shopId, payment_method: method, customer_id: customer?.id || null, expires_at: expires || null,
        ...(mode === 'existing' ? { code: code.trim() } : { nominal: Number(nominal) }),
        ...(price !== '' ? { price: Number(price) } : {}),
      })
      setSold(r)
      bump()
      onSold?.(r)
    } catch (e) {
      setError(e?.response?.data?.error || t('exp_err_generic'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-bg-secondary border border-border rounded-2xl w-full max-w-md shadow-2xl z-10 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border sticky top-0 bg-bg-secondary z-10">
          <h3 className="font-syne font-bold text-lg text-text-primary flex items-center gap-2"><Gift size={18} className="text-accent-red" /> {t('mkt_gc_sell_title')}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-bg-tertiary rounded-lg"><X size={18} className="text-text-secondary" /></button>
        </div>
        {sold ? (
          <div className="p-6 space-y-4 text-center">
            <CheckCircle2 size={40} className="mx-auto text-accent-green" />
            <p className="text-text-secondary text-sm">{t('mkt_gc_sold_msg', { amount: fmt(sold.nominal) })}</p>
            <div className="rounded-2xl border-2 border-dashed border-accent-red/40 bg-accent-red/5 p-5">
              <p className="text-[11px] uppercase tracking-widest text-text-muted mb-1">{t('mkt_gc_code')}</p>
              <p className="font-mono font-extrabold text-2xl text-text-primary tracking-wider break-all">{sold.code}</p>
              <p className="text-sm text-accent-red font-bold mt-1">{fmt(sold.nominal)} {t('unit_som')}</p>
              {sold.expiresAt && <p className="text-[11px] text-text-muted mt-1">{t('mkt_gc_valid_until', { date: sold.expiresAt })}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigator.clipboard?.writeText(sold.code).then(() => setCopied(true)).catch(() => {})}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-secondary flex items-center justify-center gap-1.5">
                <Copy size={14} /> {copied ? t('mkt_copied') : t('mkt_copy')}
              </button>
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-accent-red text-white text-sm font-semibold">{t('mkt_done')}</button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-2 gap-1.5">
                {['new', 'existing'].map(m => (
                  <button key={m} type="button" onClick={() => setMode(m)}
                    className={`px-2 py-2 rounded-xl border text-xs font-semibold ${mode === m ? 'border-accent-red bg-accent-red/10 text-accent-red' : 'border-border bg-bg-tertiary text-text-secondary'}`}>
                    {t('mkt_gc_mode_' + m)}
                  </button>
                ))}
              </div>
              {mode === 'existing' ? (
                <div>
                  <Label>{t('mkt_gc_code')}</Label>
                  <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="GC-XXXXXXXX" className={inputCls + ' uppercase font-mono'} autoFocus />
                </div>
              ) : (
                <div>
                  <Label>{t('mkt_gc_nominal')}</Label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {NOMINALS.map(n => (
                      <button key={n} type="button" onClick={() => setNominal(n)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${Number(nominal) === n ? 'border-accent-red bg-accent-red/10 text-accent-red' : 'border-border bg-bg-tertiary text-text-secondary'}`}>
                        {fmt(n)}
                      </button>
                    ))}
                  </div>
                  <input type="number" min="0" value={nominal} onChange={e => setNominal(e.target.value)} className={inputCls} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{t('mkt_gc_price')}</Label>
                  <input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder={mode === 'new' ? fmt(nominal) : t('mkt_gc_price_ph')} className={inputCls} />
                </div>
                <div>
                  <Label>{t('mkt_expires')}</Label>
                  <DateMaskInput value={expires} onChange={e => setExpires(e.target.value)} className={inputCls} />
                </div>
              </div>
              <div>
                <Label>{t('fin_payment_method')}</Label>
                <PaymentMethodPicker value={method} onChange={setMethod} />
              </div>
              <div>
                <Label>{t('mkt_gc_customer')}</Label>
                {customer ? (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-bg-tertiary border border-border text-sm">
                    <span className="text-text-primary">{customer.name} <span className="text-text-muted">{customer.phone}</span></span>
                    <button onClick={() => setCustomer(null)}><X size={14} className="text-text-muted" /></button>
                  </div>
                ) : (
                  <>
                    <input value={custQ} onChange={e => setCustQ(e.target.value)} placeholder={t('mkt_gc_customer_ph')} className={inputCls} />
                    {found.length > 0 && (
                      <div className="mt-1 rounded-xl border border-border divide-y divide-border/50">
                        {found.map(c => (
                          <button key={c.id} onClick={() => { setCustomer(c); setCustQ('') }} className="w-full text-left px-3 py-2 text-xs hover:bg-bg-tertiary">
                            <span className="text-text-primary font-semibold">{c.name}</span> <span className="text-text-muted">{c.phone}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              {error && <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 px-3 py-2 rounded-lg"><AlertCircle size={15} /> {error}</div>}
            </div>
            <div className="flex gap-3 p-4 sm:p-5 border-t border-border sticky bottom-0 bg-bg-secondary">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-medium">{t('cancel')}</button>
              <button onClick={submit} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-accent-red text-white font-semibold text-sm disabled:opacity-50">
                {saving ? t('exp_form_saving') : t('mkt_gc_sell_btn')}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default GiftCardSellModal
