import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { X, Pencil, History, Loader2, Search } from 'lucide-react'
import DateMaskInput from '../DateMaskInput'
import { updateSale, getSaleEdits } from '../../api/salesService'
import { toLocalISO } from '../../utils/tz'

const PAY_TYPES = ['cash', 'card', 'transfer']
const CARD_TYPES = [
  { id: 'uzcard', label: 'UzCard' },
  { id: 'humo', label: 'Humo' },
  { id: 'visa', label: 'Visa' },
  { id: 'mastercard', label: 'Mastercard' },
]

const fmtDate = (iso) => (iso || '').slice(0, 10).split('-').reverse().join('.')

// Sotuvni tahrirlash: to'lov turi, karta turi, mijoz, sana, izoh. Narx/tovar/miqdor o'zgarmaydi.
const EditSaleModal = ({ sale, customers = [], onClose, onSaved }) => {
  const { t } = useTranslation()
  const isInstallment = sale.paymentType === 'installment'
  const [payType, setPayType] = useState(sale.paymentType)
  const [cardType, setCardType] = useState(sale.cardType || null)
  const [customerId, setCustomerId] = useState(sale.customerId || null)
  const [custQuery, setCustQuery] = useState('')
  const [soldDate, setSoldDate] = useState(toLocalISO(sale.soldAt)?.slice(0, 10) || '')
  const [notes, setNotes] = useState(sale.notes || '')
  const [edits, setEdits] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (sale.editCount > 0) getSaleEdits(sale.id).then(setEdits).catch(() => {})
  }, [sale.id, sale.editCount])

  const payLabel = (p) => ({ cash: t('pay_cash'), card: t('pay_card'), transfer: t('sl_hist_pay_bank'), installment: t('pay_installment') }[p] || p)
  const selectedCustomer = customers.find(c => String(c.id) === String(customerId))
  const foundCustomers = useMemo(() => {
    const q = custQuery.trim().toLowerCase()
    if (!q) return []
    return customers.filter(c =>
      (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q) || (c.phone2 || '').includes(q)
    ).slice(0, 6)
  }, [customers, custQuery])

  const save = async () => {
    if (payType === 'card' && !cardType) { setError(t('sl_edit_err_card')); return }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(soldDate)) { setError(t('sl_edit_err_date')); return }
    setSaving(true)
    setError('')
    try {
      const body = {
        customer_id: customerId ? Number(customerId) : null,
        sold_date: soldDate,
        notes,
      }
      if (!isInstallment) {
        body.sale_type = payType
        body.card_type = payType === 'card' ? cardType : null
      }
      await updateSale(sale.id, body)
      onSaved?.()
      onClose()
    } catch (e) {
      setError(e?.response?.data?.error || t('sl_edit_err_save'))
    } finally {
      setSaving(false)
    }
  }

  const describe = (key, v) => {
    if (v == null || v === '') return '—'
    if (key === 'sale_type') return payLabel(v)
    if (key === 'card_type') return CARD_TYPES.find(c => c.id === v)?.label || v
    if (key === 'sold_date') return fmtDate(v)
    return String(v)
  }
  const fieldLabel = (key) => ({
    sale_type: t('sl_hist_th_payment'), card_type: t('sl_edit_card_type'),
    customer: t('col_customer'), sold_date: t('col_date'), notes: t('sl_edit_notes'),
  }[key] || key)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-bg-secondary border border-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-syne font-bold text-text-primary flex items-center gap-2"><Pencil size={16} /> {t('sl_edit_title')}</h3>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary"><X size={18} /></button>
        </div>

        <div className="text-xs text-text-muted mb-4 bg-bg-tertiary rounded-xl p-3">
          <div className="font-bold text-text-primary mb-1 truncate">{(sale.items || []).map(i => i.name).join(', ') || '—'}</div>
          {Math.round(sale.total).toLocaleString('uz-UZ')} {t('unit_som')} · {t('sl_edit_locked_hint')}
        </div>

        {/* Sana */}
        <label className="block text-xs font-bold text-text-secondary mb-1.5">{t('col_date')}</label>
        <DateMaskInput value={soldDate} onChange={e => setSoldDate(e.target.value)}
          className="w-full mb-4 bg-bg-tertiary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-red" />

        {/* To'lov turi */}
        <label className="block text-xs font-bold text-text-secondary mb-1.5">{t('sl_hist_th_payment')}</label>
        {isInstallment ? (
          <p className="text-xs text-text-muted mb-4 bg-bg-tertiary rounded-xl px-3 py-2.5">{payLabel('installment')} — {t('sl_edit_installment_locked')}</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {PAY_TYPES.map(p => (
                <button key={p} onClick={() => { setPayType(p); if (p !== 'card') setCardType(null) }}
                  className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${payType === p ? 'bg-accent-red text-white border-accent-red' : 'bg-bg-tertiary border-border text-text-secondary'}`}>
                  {payLabel(p)}
                </button>
              ))}
            </div>
            {payType === 'card' && (
              <div className="grid grid-cols-4 gap-2 mb-2">
                {CARD_TYPES.map(ct => (
                  <button key={ct.id} onClick={() => setCardType(ct.id)}
                    className={`py-2 rounded-xl border text-[11px] font-bold transition-all ${cardType === ct.id ? 'bg-accent-red text-white border-accent-red' : 'bg-bg-tertiary border-border text-text-secondary'}`}>
                    {ct.label}
                  </button>
                ))}
              </div>
            )}
            <div className="mb-2" />
          </>
        )}

        {/* Mijoz */}
        <label className="block text-xs font-bold text-text-secondary mb-1.5">{t('col_customer')}</label>
        <div className="flex items-center justify-between gap-2 mb-2 bg-bg-tertiary rounded-xl px-3 py-2.5 text-sm">
          <span className={selectedCustomer ? 'text-text-primary font-medium truncate' : 'text-text-muted italic'}>
            {selectedCustomer ? `${selectedCustomer.name}${selectedCustomer.phone ? ' · ' + selectedCustomer.phone : ''}` : t('sl_edit_no_customer')}
          </span>
          {selectedCustomer && (
            <button onClick={() => setCustomerId(null)} className="text-text-muted hover:text-accent-red flex-shrink-0"><X size={14} /></button>
          )}
        </div>
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={custQuery} onChange={e => setCustQuery(e.target.value)} placeholder={t('sl_edit_customer_search')}
            className="w-full pl-9 pr-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-red" />
          {foundCustomers.length > 0 && (
            <div className="absolute z-10 left-0 right-0 mt-1 bg-bg-secondary border border-border rounded-xl shadow-lg overflow-hidden">
              {foundCustomers.map(c => (
                <button key={c.id} onClick={() => { setCustomerId(c.id); setCustQuery('') }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-bg-tertiary text-text-primary">
                  {c.name} <span className="text-text-muted text-xs">{c.phone}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Izoh */}
        <label className="block text-xs font-bold text-text-secondary mb-1.5">{t('sl_edit_notes')}</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
          className="w-full mb-4 bg-bg-tertiary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-red resize-none" />

        {error && <p className="text-xs text-accent-red font-semibold mb-3">{error}</p>}

        <button onClick={save} disabled={saving}
          className="w-full py-3 bg-accent-red text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
          {saving && <Loader2 size={16} className="animate-spin" />} {t('sl_edit_save')}
        </button>

        {/* Tahrirlar tarixi */}
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

export default EditSaleModal
