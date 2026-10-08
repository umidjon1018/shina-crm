import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, PackageOpen, Search, X, Plus, Minus, AlertTriangle, Warehouse } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import { toast, errorText } from '../../../components/ui/Toast'
import DateMaskInput from '../../../components/DateMaskInput'
import { useShopStore } from '../../../store/shopStore'
import { useDataStore } from '../../../store/dataStore'
import { getWhClients, getWhProducts, createWhDoc } from '../../../api/wholesaleService'
import { formatNumber } from '../../../utils/format'
import { inputCls, labelCls, SourceBadge, MethodPicker, som, sizeOf } from './whHelpers'

const n = (v) => Number(v) || 0

// Yangi ulgurji sotuv yoki konsignatsiya (tovar dilerga sotish uchun beriladi)
const DocFormModal = ({ open, kind = 'sale', clientId: presetClient, onClose, onSaved }) => {
  const { t } = useTranslation()
  const { bump } = useDataStore()
  const whShops = useShopStore(s => s.shops).filter(s => s.kind === 'wholesale' && s.isActive)
  const isSale = kind === 'sale'
  const [clients, setClients] = useState([])
  const [clientId, setClientId] = useState('')
  const [shopId, setShopId] = useState('')
  const [products, setProducts] = useState([])
  const [lines, setLines] = useState([])
  const [q, setQ] = useState('')
  const [discount, setDiscount] = useState('')
  const [paid, setPaid] = useState('')
  const [method, setMethod] = useState('cash')
  const [due, setDue] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [limitMsg, setLimitMsg] = useState('')

  useEffect(() => {
    if (!open) return
    setLines([]); setQ(''); setDiscount(''); setPaid(''); setMethod('cash'); setDue(''); setNotes(''); setErr(''); setLimitMsg('')
    setClientId(presetClient || '')
    setShopId(whShops.length === 1 ? whShops[0].id : '')
    getWhClients().then(list => setClients(list.filter(c => c.isActive))).catch(() => setClients([]))
  }, [open])

  // Narxlar mijozga qarab hisoblanadi; qo'lda o'zgartirilmagan qatorlar yangilanadi
  useEffect(() => {
    if (!open || !shopId) { setProducts([]); return }
    getWhProducts({ shopId, clientId }).then(list => {
      setProducts(list)
      const byId = new Map(list.map(p => [p.id, p]))
      setLines(ls => ls.map(l => {
        const p = byId.get(l.productId)
        if (!p) return l
        return { ...l, stock: p.stock, ...(l.manual ? {} : { price: p.price, source: p.priceSource }) }
      }))
    }).catch(() => setProducts([]))
  }, [open, shopId, clientId])

  const client = clients.find(c => c.id === clientId)
  const found = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return []
    return products.filter(p => p.stock > 0 && `${p.name} ${p.size}`.toLowerCase().includes(s)).slice(0, 8)
  }, [q, products])

  const addLine = (p) => {
    setLines(ls => {
      const ex = ls.find(l => l.productId === p.id)
      if (ex) return ls.map(l => (l.productId === p.id ? { ...l, qty: Math.min(p.stock, l.qty + 1) } : l))
      return [...ls, { productId: p.id, name: p.name, size: p.size, unit: p.unit, stock: p.stock, qty: 1, price: p.price, source: p.priceSource, manual: false }]
    })
    setQ('')
  }
  const patch = (id, d) => setLines(ls => ls.map(l => (l.productId === id ? { ...l, ...d } : l)))

  const subtotal = lines.reduce((s, l) => s + n(l.price) * n(l.qty), 0)
  const disc = isSale ? Math.min(subtotal, Math.max(0, n(discount))) : 0
  const total = subtotal - disc
  const paidNow = isSale ? Math.min(total, Math.max(0, n(paid))) : 0
  const debtAfter = client ? client.debt + total - paidNow : 0
  const overLimit = isSale && client && client.creditLimit > 0 && debtAfter > client.creditLimit
  const badQty = lines.some(l => n(l.qty) < 1 || n(l.qty) > l.stock)

  const submit = async (force = false) => {
    setErr('')
    if (!clientId) return setErr(t('wh_err_client'))
    if (!shopId) return setErr(t('wh_err_shop'))
    if (!lines.length) return setErr(t('wh_err_lines'))
    if (badQty) return setErr(t('wh_err_qty'))
    setSaving(true)
    try {
      const res = await createWhDoc({
        kind, client_id: clientId, shop_id: shopId,
        lines: lines.map(l => ({ product_id: l.productId, qty: n(l.qty), price: n(l.price) })),
        discount: disc, paid_amount: paidNow, payment_method: method, due_date: due || undefined, notes: notes || undefined, force,
      })
      toast(t('wh_doc_saved', { no: res.no }))
      bump()
      onSaved?.(res)
    } catch (e) {
      if (e?.response?.data?.code === 'CREDIT_LIMIT') setLimitMsg(errorText(e))
      else setErr(errorText(e, t('exp_err_generic')))
    } finally { setSaving(false) }
  }

  const title = isSale ? t('wh_new_sale') : t('wh_new_consignment')
  return (
    <Modal open={open} onClose={onClose} size="lg" icon={isSale ? FileText : PackageOpen} title={title}
      subtitle={isSale ? t('wh_new_sale_sub') : t('wh_new_consignment_sub')}
      footer={
        <div className="space-y-2">
          {limitMsg && (
            <div className="flex flex-wrap items-center gap-2 bg-accent-orange/10 text-accent-orange rounded-xl px-3 py-2.5 text-sm">
              <AlertTriangle size={17} className="shrink-0" /><span className="flex-1 min-w-0">{limitMsg}</span>
              <button onClick={() => { setLimitMsg(''); submit(true) }} className="px-3 py-1.5 rounded-lg bg-accent-orange text-white font-bold">{t('wh_save_anyway')}</button>
            </div>
          )}
          {err && <div className="text-sm text-accent-red bg-accent-red/10 px-3 py-2.5 rounded-xl">{err}</div>}
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-muted">{t('wh_total')}</p>
              <p className="text-xl font-bold text-text-primary">{som(t, total)}</p>
            </div>
            <button onClick={() => submit(false)} disabled={saving || !lines.length}
              className="px-6 py-3 rounded-xl g-brand text-white font-bold disabled:opacity-50">{saving ? '...' : t('wh_save_doc')}</button>
          </div>
        </div>
      }>
      {!whShops.length ? (
        <div className="text-center py-10 space-y-2">
          <Warehouse size={36} className="mx-auto text-text-muted" />
          <p className="text-[15px] font-semibold text-text-primary">{t('wh_no_warehouse')}</p>
          <p className="text-sm text-text-muted">{t('wh_no_warehouse_hint')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t('wh_f_client')} *</label>
              <select value={clientId} onChange={e => setClientId(e.target.value)} className={inputCls}>
                <option value="">{t('wh_choose')}</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.debt > 0 ? ` · ${formatNumber(c.debt)}` : ''}</option>)}
              </select>
              {!clients.length && <p className="text-xs text-accent-orange mt-1">{t('wh_no_clients_hint')}</p>}
            </div>
            <div>
              <label className={labelCls}>{t('wh_f_warehouse')} *</label>
              <select value={shopId} onChange={e => { setShopId(e.target.value); setLines([]) }} className={inputCls}>
                <option value="">{t('wh_choose')}</option>
                {whShops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {client && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                [t('wh_col_debt'), som(t, client.debt), client.debt > 0 ? 'text-accent-red' : ''],
                [t('wh_f_limit'), client.creditLimit > 0 ? som(t, client.creditLimit) : t('wh_no_limit'), ''],
                [t('wh_f_days'), client.paymentDays > 0 ? t('wh_days_n', { n: client.paymentDays }) : '—', ''],
                [t('wh_debt_after'), isSale ? som(t, debtAfter) : '—', overLimit ? 'text-accent-orange' : ''],
              ].map(([l, v, c]) => (
                <div key={l} className="bg-bg-secondary border border-border rounded-xl px-3 py-2 min-w-0">
                  <p className="text-xs text-text-muted">{l}</p>
                  <p className={`text-[15px] font-semibold text-text-primary truncate ${c}`}>{v}</p>
                </div>
              ))}
            </div>
          )}
          {overLimit && (
            <p className="flex items-center gap-2 text-sm text-accent-orange"><AlertTriangle size={16} />{t('wh_limit_warn')}</p>
          )}

          {shopId && (
            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('wh_search_product')} className={inputCls + ' pl-10'} />
              {found.length > 0 && (
                <div className="absolute z-10 left-0 right-0 mt-1 panel !rounded-2xl p-1 shadow-xl max-h-80 overflow-y-auto">
                  {found.map(p => (
                    <button key={p.id} type="button" onClick={() => addLine(p)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-bg-tertiary text-left">
                      <span className="flex-1 min-w-0">
                        <span className="block text-[15px] font-semibold text-text-primary truncate">{p.name}</span>
                        <span className="block text-sm text-text-muted">{[sizeOf(p.name, p.size), t('wh_in_stock_n', { n: p.stock })].filter(Boolean).join(' · ')}</span>
                      </span>
                      <span className="text-right shrink-0">
                        <span className="block text-[15px] font-bold text-text-primary">{formatNumber(p.price)}</span>
                        <SourceBadge source={p.priceSource} t={t} />
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {q.trim() && !found.length && <p className="text-sm text-text-muted mt-2">{t('wh_nothing_found')}</p>}
            </div>
          )}

          {lines.length > 0 && (
            <div className="panel divide-y divide-border">
              {lines.map(l => (
                <div key={l.productId} className="p-3 sm:px-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <div className="flex-1 min-w-[180px]">
                    <p className="text-[15px] font-semibold text-text-primary">{l.name}</p>
                    <p className="text-sm text-text-muted flex items-center gap-2">{[sizeOf(l.name, l.size), t('wh_in_stock_n', { n: l.stock })].filter(Boolean).join(' · ')} <SourceBadge source={l.source} t={t} /></p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => patch(l.productId, { qty: Math.max(1, n(l.qty) - 1) })} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-bg-tertiary"><Minus size={16} /></button>
                    <input type="number" min="1" max={l.stock} value={l.qty} onChange={e => patch(l.productId, { qty: e.target.value })}
                      className={`w-16 text-center bg-bg-tertiary border rounded-lg py-1.5 text-[15px] font-semibold ${n(l.qty) > l.stock || n(l.qty) < 1 ? 'border-accent-red text-accent-red' : 'border-border text-text-primary'}`} />
                    <button type="button" onClick={() => patch(l.productId, { qty: Math.min(l.stock, n(l.qty) + 1) })} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-bg-tertiary"><Plus size={16} /></button>
                  </div>
                  <input type="number" min="0" value={l.price} onChange={e => patch(l.productId, { price: e.target.value, manual: true, source: 'manual' })}
                    className="w-32 text-right bg-bg-tertiary border border-border rounded-lg px-2.5 py-1.5 text-[15px] text-text-primary" title={t('wh_col_price')} />
                  <p className="w-32 text-right text-[15px] font-bold text-text-primary">{formatNumber(n(l.price) * n(l.qty))}</p>
                  <button type="button" onClick={() => setLines(ls => ls.filter(x => x.productId !== l.productId))}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:text-accent-red hover:bg-accent-red/10"><X size={17} /></button>
                </div>
              ))}
              <div className="px-3 sm:px-4 py-2.5 flex justify-between text-[15px]">
                <span className="text-text-muted">{t('wh_subtotal')} · {t('wh_qty_n', { n: lines.reduce((s, l) => s + n(l.qty), 0) })}</span>
                <span className="font-bold text-text-primary">{som(t, subtotal)}</span>
              </div>
            </div>
          )}

          {isSale && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>{t('wh_discount')}</label>
                <input type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('wh_paid_now')}</label>
                <input type="number" min="0" value={paid} onChange={e => setPaid(e.target.value)} placeholder="0" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('wh_due_date')}</label>
                <DateMaskInput value={due} onChange={e => setDue(e.target.value)} className={inputCls}
                  placeholder={client?.paymentDays ? t('wh_due_auto', { n: client.paymentDays }) : 'kk.oo.yyyy'} />
              </div>
              {paidNow > 0 && <div className="sm:col-span-3"><MethodPicker value={method} onChange={setMethod} t={t} /></div>}
            </div>
          )}
          <div>
            <label className={labelCls}>{t('wh_f_notes')}</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} className={inputCls + ' resize-none'} />
          </div>
        </div>
      )}
    </Modal>
  )
}

export default DocFormModal
