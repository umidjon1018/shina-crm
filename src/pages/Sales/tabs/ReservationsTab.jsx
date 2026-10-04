import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Bookmark, Plus, X, Phone, ShoppingCart, Loader2, Search, Clock } from 'lucide-react'
import { getReservations, createReservation, cancelReservation } from '../../../api/reservationService'
import { getProducts } from '../../../api/productService'
import { getItems } from '../../../api/itemService'
import { toLocalISO } from '../../../utils/tz'

const DURATIONS = [
  { hours: 3, key: 'sl_resv_dur_3h' },
  { hours: 24, key: 'sl_resv_dur_1d' },
  { hours: 48, key: 'sl_resv_dur_2d' },
  { hours: 72, key: 'sl_resv_dur_3d' },
  { hours: 168, key: 'sl_resv_dur_7d' },
]

const fmtUntil = (iso) => {
  const l = toLocalISO(iso) || ''
  return `${l.slice(8, 10)}.${l.slice(5, 7)} ${l.slice(11, 16)}`
}
const leftLabel = (iso, t) => {
  const ms = new Date(iso) - Date.now()
  if (ms <= 0) return t('sl_resv_expired')
  const h = Math.floor(ms / 3600000)
  return h >= 24 ? t('sl_resv_left_days', { n: Math.floor(h / 24) }) : t('sl_resv_left_hours', { n: Math.max(1, h) })
}

const NewReservationModal = ({ shopId, customers, onClose, onCreated }) => {
  const { t } = useTranslation()
  const [products, setProducts] = useState([])
  const [query, setQuery] = useState('')
  const [product, setProduct] = useState(null)
  const [custQuery, setCustQuery] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [hours, setHours] = useState(24)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { getProducts().then(setProducts).catch(() => {}) }, [])

  const found = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    return products.filter(p => p.barcodeReadyStock > 0 && (
      (p.name || '').toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q) || (p.size || '').toLowerCase().includes(q)
    )).slice(0, 8)
  }, [products, query])

  const foundCustomers = useMemo(() => {
    const q = custQuery.trim().toLowerCase()
    if (!q) return []
    return customers.filter(c => (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q)).slice(0, 5)
  }, [customers, custQuery])

  const save = async () => {
    if (!product) { setError(t('sl_resv_err_product')); return }
    if (!name.trim() && !phone.trim()) { setError(t('sl_resv_err_customer')); return }
    setSaving(true)
    setError('')
    try {
      await createReservation({
        productId: product.id, shopId,
        customerName: name.trim(), customerPhone: phone.trim(),
        reservedUntil: new Date(Date.now() + hours * 3600000).toISOString(),
        notes: notes.trim() || null,
      })
      onCreated()
      onClose()
    } catch (e) {
      setError(e?.response?.data?.error || t('sl_edit_err_save'))
    } finally {
      setSaving(false)
    }
  }

  const input = 'w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-red'
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-bg-secondary border border-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-5 shadow-xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-syne font-bold text-text-primary flex items-center gap-2"><Bookmark size={16} /> {t('sl_resv_new')}</h3>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary"><X size={18} /></button>
        </div>

        <label className="block text-xs font-bold text-text-secondary mb-1.5">{t('col_product_name')}</label>
        {product ? (
          <div className="flex items-center justify-between gap-2 mb-4 bg-bg-tertiary rounded-xl px-3 py-2.5 text-sm">
            <span className="font-medium text-text-primary truncate">{product.name} <span className="text-text-muted text-xs">· {product.barcodeReadyStock} {t('sl_resv_in_stock')}</span></span>
            <button onClick={() => setProduct(null)} className="text-text-muted hover:text-accent-red"><X size={14} /></button>
          </div>
        ) : (
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('sl_resv_product_search')} className={input + ' pl-9'} />
            {found.length > 0 && (
              <div className="absolute z-10 left-0 right-0 mt-1 bg-bg-secondary border border-border rounded-xl shadow-lg overflow-hidden">
                {found.map(p => (
                  <button key={p.id} onClick={() => { setProduct(p); setQuery('') }} className="w-full text-left px-3 py-2 text-sm hover:bg-bg-tertiary text-text-primary">
                    {p.name} <span className="text-text-muted text-xs">· {p.barcodeReadyStock} {t('sl_resv_in_stock')}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <label className="block text-xs font-bold text-text-secondary mb-1.5">{t('col_customer')}</label>
        <div className="relative mb-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={custQuery} onChange={e => setCustQuery(e.target.value)} placeholder={t('sl_edit_customer_search')} className={input + ' pl-9'} />
          {foundCustomers.length > 0 && (
            <div className="absolute z-10 left-0 right-0 mt-1 bg-bg-secondary border border-border rounded-xl shadow-lg overflow-hidden">
              {foundCustomers.map(c => (
                <button key={c.id} onClick={() => { setName(c.name || ''); setPhone(c.phone || ''); setCustQuery('') }} className="w-full text-left px-3 py-2 text-sm hover:bg-bg-tertiary text-text-primary">
                  {c.name} <span className="text-text-muted text-xs">{c.phone}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <input value={name} onChange={e => setName(e.target.value)} placeholder={t('sl_resv_name')} className={input} />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder={t('sl_resv_phone')} inputMode="tel" className={input} />
        </div>

        <label className="block text-xs font-bold text-text-secondary mb-1.5">{t('sl_resv_duration')}</label>
        <div className="grid grid-cols-5 gap-1.5 mb-4">
          {DURATIONS.map(d => (
            <button key={d.hours} onClick={() => setHours(d.hours)}
              className={`py-2 rounded-xl border text-[11px] font-bold transition-all ${hours === d.hours ? 'bg-accent-red text-white border-accent-red' : 'bg-bg-tertiary border-border text-text-secondary'}`}>
              {t(d.key)}
            </button>
          ))}
        </div>

        <label className="block text-xs font-bold text-text-secondary mb-1.5">{t('sl_edit_notes')}</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={input + ' mb-4 resize-none'} />

        {error && <p className="text-xs text-accent-red font-semibold mb-3">{error}</p>}
        <button onClick={save} disabled={saving}
          className="w-full py-3 bg-accent-red text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
          {saving && <Loader2 size={16} className="animate-spin" />} {t('sl_resv_create')}
        </button>
      </motion.div>
    </div>
  )
}

const ReservationsTab = ({ ctx }) => {
  const { t } = useTranslation()
  const { selectedShopId, allCustomers, addToCart, setActiveTab, requireShop } = ctx
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [newShopId, setNewShopId] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    getReservations(selectedShopId).then(setList).catch(() => setList([])).finally(() => setLoading(false))
  }, [selectedShopId])
  useEffect(() => { load() }, [load])

  const openNew = () => requireShop((shopId) => { setNewShopId(shopId); setShowNew(true) })

  const doCancel = async (rv) => {
    if (!window.confirm(t('sl_resv_cancel_confirm', { name: rv.customer_name || rv.customer_phone || '' }))) return
    setBusyId(rv.id)
    try { await cancelReservation(rv.id); load() } catch (e) { setError(e?.response?.data?.error || t('sl_edit_err_save')) }
    finally { setBusyId(null) }
  }

  // Bron qilingan aynan o'sha birlik savatga qo'shiladi (bron tekshiruvini chetlab)
  const doSell = async (rv) => {
    setBusyId(rv.id)
    setError('')
    try {
      const [items, products] = await Promise.all([getItems({ productId: rv.product_id }), getProducts()])
      const item = items.find(i => String(i.id) === String(rv.item_id))
      const product = products.find(p => String(p.id) === String(rv.product_id))
      if (!item || !product || item.status !== 'in_stock') { setError(t('sl_resv_err_unavailable')); return }
      addToCart({ item, product: { ...product, purchasePrice: item.purchasePrice ?? product.purchasePrice } })
      setActiveTab('new_sale')
    } catch {
      setError(t('sl_resv_err_unavailable'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <motion.div key="reservations" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-4">
      <div className="bg-bg-secondary border border-border rounded-3xl p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-syne font-bold text-text-primary text-lg">{t('sl_tab_reservations')}</h3>
            <p className="text-xs text-text-muted">{t('sl_resv_subtitle')}</p>
          </div>
          <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2.5 bg-accent-red text-white rounded-xl text-xs font-bold shrink-0">
            <Plus size={14} /> {t('sl_resv_new')}
          </button>
        </div>
        {error && <p className="text-xs text-accent-red font-semibold mb-3">{error}</p>}

        {loading ? (
          <div className="py-12 flex justify-center text-text-muted"><Loader2 size={22} className="animate-spin" /></div>
        ) : list.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-sm">{t('sl_resv_empty')}</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {list.map(rv => (
              <div key={rv.id} className="bg-bg-tertiary border border-border rounded-2xl p-4 flex flex-col gap-2 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-text-primary text-sm leading-tight [overflow-wrap:anywhere]">{rv.product_name || '—'}</p>
                  <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-accent-orange bg-accent-orange/10 px-2 py-0.5 rounded-full">
                    <Clock size={10} /> {leftLabel(rv.reserved_until, t)}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-text-muted">{rv.barcode || '—'}</p>
                <div className="text-xs text-text-secondary">
                  <span className="font-semibold text-text-primary">{rv.customer_name || '—'}</span>
                  {rv.customer_phone && (
                    <a href={`tel:${rv.customer_phone}`} className="ml-2 inline-flex items-center gap-1 text-accent-blue"><Phone size={11} />{rv.customer_phone}</a>
                  )}
                </div>
                <p className="text-[11px] text-text-muted">{t('sl_resv_until')}: {fmtUntil(rv.reserved_until)} · {rv.created_by || '—'}</p>
                {rv.notes && <p className="text-[11px] text-text-secondary italic [overflow-wrap:anywhere]">{rv.notes}</p>}
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button onClick={() => doSell(rv)} disabled={busyId === rv.id}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-accent-green/15 text-accent-green text-xs font-bold disabled:opacity-50">
                    {busyId === rv.id ? <Loader2 size={13} className="animate-spin" /> : <ShoppingCart size={13} />} {t('sl_resv_sell')}
                  </button>
                  <button onClick={() => doCancel(rv)} disabled={busyId === rv.id}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-accent-red/10 text-accent-red text-xs font-bold disabled:opacity-50">
                    <X size={13} /> {t('sl_resv_cancel')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showNew && (
        <NewReservationModal shopId={newShopId} customers={allCustomers} onClose={() => setShowNew(false)} onCreated={load} />
      )}
    </motion.div>
  )
}

export default ReservationsTab
