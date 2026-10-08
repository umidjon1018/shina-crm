import React, { useState, useMemo } from 'react'
import TableView from '../../../components/ui/TableView'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ClipboardList, Plus, Search, Trash2, Send, PackageCheck, Ban, Edit3, Wallet, Printer, AlertTriangle } from 'lucide-react'
import DateMaskInput from '../../../components/DateMaskInput'
import { useShopStore } from '../../../store/shopStore'
import {
  createPurchaseOrder, updatePurchaseOrder, setPurchaseOrderStatus, receivePurchaseOrder,
  addPurchaseOrderPayment, deletePurchaseOrderPayment,
} from '../../../api/supplierOpsService'
import {
  SupModal, Field, ErrorBox, Pager, inputCls, labelCls, ORDER_STATUS, PAY_TYPES, payTypeLabel,
  usd, fmtDate, todayISO, orderTotals, printHtml, esc,
} from '../components/supShared'

const PS = 15
const errText = (e) => e?.response?.data?.error || e?.message || 'Xato'

const ProductPicker = ({ products, onPick, t }) => {
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return []
    return products.filter(p => p.name?.toLowerCase().includes(s)).slice(0, 8)
  }, [q, products])
  return (
    <div className="relative">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
      <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('sup_add_product_ph')} className={inputCls + ' pl-9'} />
      {list.length > 0 && (
        <div className="absolute z-10 left-0 right-0 mt-1 bg-bg-secondary border border-border rounded-xl shadow-xl overflow-hidden">
          {list.map(p => (
            <button key={p.id} onClick={() => { onPick(p); setQ('') }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-bg-tertiary text-text-primary">
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const OrderFormModal = ({ initial, suppliers, products, shops, defaultShopId, onClose, onSaved, t }) => {
  const [form, setForm] = useState(() => initial ? {
    supplierId: initial.supplierId, shopId: initial.shopId, expectedDate: initial.expectedDate, notes: initial.notes,
    items: initial.items.map(i => ({ productId: i.productId, productName: i.productName, quantity: i.quantity, priceUSD: i.priceUSD, unit: i.unit, attributes: i.attributes })),
  } : { supplierId: '', shopId: defaultShopId !== 'all' ? defaultShopId : '', expectedDate: '', notes: '', items: [] })
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setItem = (idx, k, v) => setForm(f => ({ ...f, items: f.items.map((it, i) => i === idx ? { ...it, [k]: v } : it) }))
  const total = form.items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.priceUSD) || 0), 0)

  const save = async (status) => {
    setErr('')
    if (!form.supplierId) return setErr(t('sup_err_supplier'))
    if (!form.shopId) return setErr(t('sup_err_shop'))
    if (form.items.length === 0) return setErr(t('sup_err_items'))
    if (form.items.some(i => !(Number(i.quantity) > 0))) return setErr(t('sup_err_qty'))
    setSaving(true)
    try {
      const saved = initial ? await updatePurchaseOrder(initial.id, form) : await createPurchaseOrder({ ...form, status })
      onSaved(saved)
    } catch (e) { setErr(errText(e)) } finally { setSaving(false) }
  }

  return (
    <SupModal title={initial ? `${t('edit')} · ${initial.orderNumber}` : t('sup_new_order')} onClose={onClose} maxW="max-w-3xl"
      footer={
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 text-sm text-text-muted self-center">{t('sup_total')}: <span className="font-extrabold text-text-primary">{usd(total)}</span></div>
          {initial ? (
            <button disabled={saving} onClick={() => save()} className="px-5 py-3 bg-accent-blue text-white rounded-xl font-bold disabled:opacity-50">{t('inc_save_btn')}</button>
          ) : (
            <>
              <button disabled={saving} onClick={() => save('draft')} className="px-5 py-3 bg-bg-tertiary border border-border rounded-xl font-bold text-text-primary disabled:opacity-50">{t('sup_save_draft')}</button>
              <button disabled={saving} onClick={() => save('sent')} className="px-5 py-3 bg-accent-blue text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"><Send size={16} />{t('sup_save_send')}</button>
            </>
          )}
        </div>
      }>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={t('sup_supplier') + ' *'}>
            <select value={form.supplierId} onChange={e => set('supplierId', e.target.value)} className={inputCls}>
              <option value="">{t('sup_select')}</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label={t('sup_shop') + ' *'}>
            <select value={form.shopId} onChange={e => set('shopId', e.target.value)} className={inputCls}>
              <option value="">{t('sup_select')}</option>
              {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label={t('sup_expected_date')}>
            <DateMaskInput value={form.expectedDate} onChange={e => set('expectedDate', e.target.value)} className={inputCls} />
          </Field>
          <Field label={t('col_note')}>
            <input value={form.notes} onChange={e => set('notes', e.target.value)} className={inputCls} />
          </Field>
        </div>

        <div>
          <label className={labelCls}>{t('sup_items')}</label>
          <ProductPicker products={products} t={t} onPick={p => {
            if (form.items.some(i => i.productId === p.id)) return
            setForm(f => ({ ...f, items: [...f.items, { productId: p.id, productName: p.name, quantity: 1, priceUSD: '', unit: 'dona', attributes: {} }] }))
          }} />
          <div className="mt-3 space-y-2">
            {form.items.map((it, idx) => (
              <div key={it.productId} className="bg-bg-tertiary border border-border rounded-xl p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-bold text-text-primary">{it.productName}</p>
                  <button onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))} className="text-text-muted hover:text-accent-red"><Trash2 size={16} /></button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Field label={t('sup_qty')}>
                    <input type="number" min="1" value={it.quantity} onChange={e => setItem(idx, 'quantity', e.target.value)} className={inputCls} />
                  </Field>
                  <Field label={t('sup_price_usd')}>
                    <input type="number" min="0" step="0.01" value={it.priceUSD} onChange={e => setItem(idx, 'priceUSD', e.target.value)} className={inputCls} />
                  </Field>
                  <Field label={t('sup_sum')}>
                    <p className="py-2.5 text-sm font-bold text-text-primary">{usd((Number(it.quantity) || 0) * (Number(it.priceUSD) || 0))}</p>
                  </Field>
                </div>
              </div>
            ))}
            {form.items.length === 0 && <p className="text-xs text-text-muted text-center py-4">{t('sup_no_items')}</p>}
          </div>
        </div>
        <ErrorBox text={err} />
      </div>
    </SupModal>
  )
}

const ReceiveModal = ({ order, usdRate, onClose, onSaved, t }) => {
  const [rate, setRate] = useState(usdRate || '')
  const [receivedAt, setReceivedAt] = useState(todayISO())
  const [dueDate, setDueDate] = useState('')
  const [note, setNote] = useState('')
  const [lines, setLines] = useState(() => order.items
    .map(i => ({ itemId: i.id, productName: i.productName, left: i.quantity - i.receivedQty - i.rejectedQty, accepted: i.quantity - i.receivedQty - i.rejectedQty, rejected: 0, reason: '', priceUSD: i.priceUSD }))
    .filter(l => l.left > 0))
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)
  const setLine = (idx, k, v) => setLines(ls => ls.map((l, i) => i === idx ? { ...l, [k]: v } : l))

  const submit = async () => {
    setErr('')
    if (!(Number(rate) > 0)) return setErr(t('sup_err_rate'))
    for (const l of lines) {
      const a = Number(l.accepted) || 0, r = Number(l.rejected) || 0
      if (a < 0 || r < 0 || a + r > l.left) return setErr(`${l.productName}: ${t('sup_err_over', { n: l.left })}`)
      if (r > 0 && !l.reason.trim()) return setErr(`${l.productName}: ${t('sup_err_reason')}`)
    }
    if (!lines.some(l => (Number(l.accepted) || 0) + (Number(l.rejected) || 0) > 0)) return setErr(t('sup_err_nothing'))
    setSaving(true)
    try { onSaved(await receivePurchaseOrder(order.id, { entryUsdRate: rate, receivedAt, dueDate, note, lines })) }
    catch (e) { setErr(errText(e)) } finally { setSaving(false) }
  }

  return (
    <SupModal title={t('sup_receive_title')} subtitle={`${order.orderNumber} · ${order.supplierName}`} onClose={onClose} maxW="max-w-3xl"
      footer={<button disabled={saving} onClick={submit} className="w-full py-3.5 bg-accent-green text-white rounded-xl font-extrabold disabled:opacity-50 flex items-center justify-center gap-2"><PackageCheck size={18} />{t('sup_receive_btn')}</button>}>
      <div className="space-y-4">
        <p className="text-xs text-text-muted bg-bg-tertiary rounded-xl px-3 py-2">{t('sup_receive_hint')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label={t('inc_pay_usd_rate') + ' *'}><input type="number" value={rate} onChange={e => setRate(e.target.value)} className={inputCls} /></Field>
          <Field label={t('sup_received_date')}><DateMaskInput value={receivedAt} onChange={e => setReceivedAt(e.target.value)} className={inputCls} /></Field>
          <Field label={t('inc_debt_due_date')}><DateMaskInput value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} /></Field>
        </div>
        <div className="space-y-2">
          {lines.map((l, idx) => {
            const a = Number(l.accepted) || 0, r = Number(l.rejected) || 0
            const diff = l.left - a - r
            return (
              <div key={l.itemId} className={`border rounded-xl p-3 ${r > 0 || diff > 0 ? 'border-accent-orange/40 bg-accent-orange/5' : 'border-border bg-bg-tertiary'}`}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-sm font-bold text-text-primary">{l.productName}</p>
                  <span className="text-xs text-text-muted shrink-0">{t('sup_expected')}: <b className="text-text-primary">{l.left}</b></span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Field label={t('sup_accepted')}><input type="number" min="0" value={l.accepted} onChange={e => setLine(idx, 'accepted', e.target.value)} className={inputCls} /></Field>
                  <Field label={t('sup_rejected')}><input type="number" min="0" value={l.rejected} onChange={e => setLine(idx, 'rejected', e.target.value)} className={inputCls} /></Field>
                  <Field label={t('sup_price_usd')}><input type="number" min="0" step="0.01" value={l.priceUSD} onChange={e => setLine(idx, 'priceUSD', e.target.value)} className={inputCls} /></Field>
                </div>
                {r > 0 && (
                  <input value={l.reason} onChange={e => setLine(idx, 'reason', e.target.value)} placeholder={t('sup_reject_reason_ph')} className={inputCls + ' mt-2'} />
                )}
                {diff > 0 && <p className="text-[11px] text-accent-orange mt-1.5">{t('sup_shortage_note', { n: diff })}</p>}
              </div>
            )
          })}
        </div>
        <Field label={t('col_note')}><input value={note} onChange={e => setNote(e.target.value)} className={inputCls} /></Field>
        <ErrorBox text={err} />
      </div>
    </SupModal>
  )
}

const OrderPaymentModal = ({ order, usdRate, onClose, onSaved, t }) => {
  const [f, setF] = useState({ amountUSD: '', usdRate: usdRate || '', type: 'cash_uzs', date: todayISO(), note: '' })
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)
  const submit = async () => {
    setErr('')
    if (!(Number(f.amountUSD) > 0) || !(Number(f.usdRate) > 0)) return setErr(t('sup_err_amount'))
    setSaving(true)
    try { onSaved(await addPurchaseOrderPayment(order.id, f)) } catch (e) { setErr(errText(e)) } finally { setSaving(false) }
  }
  return (
    <SupModal title={t('sup_advance_title')} subtitle={order.orderNumber} onClose={onClose}
      footer={<button disabled={saving} onClick={submit} className="w-full py-3.5 bg-accent-blue text-white rounded-xl font-extrabold disabled:opacity-50">{t('inc_save_payment')}</button>}>
      <PaymentFields f={f} setF={setF} t={t} />
      <p className="text-xs text-text-muted mt-3">{t('sup_advance_hint')}</p>
      <div className="mt-3"><ErrorBox text={err} /></div>
    </SupModal>
  )
}

export const PaymentFields = ({ f, setF, t }) => (
  <div className="grid grid-cols-2 gap-3">
    <Field label={t('inc_pay_amount_usd') + ' *'} className="col-span-2">
      <input type="number" min="0" step="0.01" value={f.amountUSD} onChange={e => setF({ ...f, amountUSD: e.target.value })} className={inputCls} />
    </Field>
    <Field label={t('inc_pay_usd_rate') + ' *'}>
      <input type="number" value={f.usdRate} onChange={e => setF({ ...f, usdRate: e.target.value })} className={inputCls} />
    </Field>
    <Field label={t('inc_pay_method')}>
      <select value={f.type} onChange={e => setF({ ...f, type: e.target.value })} className={inputCls}>
        {PAY_TYPES.map(p => <option key={p} value={p}>{payTypeLabel(t, p)}</option>)}
      </select>
    </Field>
    <Field label={t('col_date')}>
      <DateMaskInput value={f.date} onChange={e => setF({ ...f, date: e.target.value })} className={inputCls} />
    </Field>
    <Field label={'UZS'}>
      <p className="py-2.5 text-sm font-bold text-text-primary">{Math.round((Number(f.amountUSD) || 0) * (Number(f.usdRate) || 0)).toLocaleString('uz-UZ')}</p>
    </Field>
    <Field label={t('col_note')} className="col-span-2">
      <input value={f.note} onChange={e => setF({ ...f, note: e.target.value })} className={inputCls} />
    </Field>
  </div>
)

const printOrder = (o, t) => {
  const tot = orderTotals(o)
  printHtml(o.orderNumber, `
    <h2>${esc(t('sup_order_doc'))} ${esc(o.orderNumber)}</h2>
    <div class="muted">${esc(t('col_date'))}: ${fmtDate(o.createdAt)} · ${esc(t('sup_expected_date'))}: ${o.expectedDate ? fmtDate(o.expectedDate) : '—'}</div>
    <div>${esc(t('sup_supplier'))}: <b>${esc(o.supplierName)}</b> · ${esc(t('sup_shop'))}: <b>${esc(o.shopName)}</b></div>
    <table><thead><tr><th>#</th><th>${esc(t('col_product'))}</th><th class="n">${esc(t('sup_qty'))}</th><th class="n">${esc(t('sup_price_usd'))}</th><th class="n">${esc(t('sup_sum'))}</th></tr></thead>
    <tbody>${o.items.map((i, k) => `<tr><td>${k + 1}</td><td>${esc(i.productName)}</td><td class="n">${i.quantity} ${esc(i.unit)}</td><td class="n">${usd(i.priceUSD)}</td><td class="n">${usd(i.quantity * i.priceUSD)}</td></tr>`).join('')}
    <tr><th colspan="4" class="n">${esc(t('sup_total'))}</th><th class="n">${usd(tot.total)}</th></tr></tbody></table>
    ${o.notes ? `<p>${esc(t('col_note'))}: ${esc(o.notes)}</p>` : ''}
    <div class="sign"><span>${esc(t('sup_sign_buyer'))}: ____________</span><span>${esc(t('sup_sign_supplier'))}: ____________</span></div>`)
}

const OrderDetailModal = ({ order, usdRate, onClose, onChanged, onEdit, t }) => {
  const [sub, setSub] = useState(null)
  const [err, setErr] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)
  const tot = orderTotals(order)
  const st = ORDER_STATUS[order.status] || ORDER_STATUS.draft
  const open = ['draft', 'sent', 'partial'].includes(order.status)

  const act = async (fn) => {
    setErr('')
    try { onChanged(await fn()) } catch (e) { setErr(errText(e)) }
  }

  if (sub === 'receive') return <ReceiveModal order={order} usdRate={usdRate} t={t} onClose={() => setSub(null)} onSaved={o => { setSub(null); onChanged(o, true) }} />
  if (sub === 'pay') return <OrderPaymentModal order={order} usdRate={usdRate} t={t} onClose={() => setSub(null)} onSaved={o => { setSub(null); onChanged(o, true) }} />

  return (
    <SupModal title={order.orderNumber} subtitle={`${order.supplierName} · ${order.shopName}`} onClose={onClose} maxW="max-w-4xl">
      <div className="space-y-3 sm:space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${st.cls}`}>{t(st.key)}</span>
          <span className="text-xs text-text-muted">{t('col_date')}: {fmtDate(order.createdAt)} · {order.createdByName}</span>
          {order.expectedDate && <span className="text-xs text-text-muted">· {t('sup_expected_date')}: {fmtDate(order.expectedDate)}</span>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            [t('sup_total'), usd(tot.total), 'text-text-primary'],
            [t('sup_received_qty'), `${tot.received} / ${tot.ordered}`, 'text-accent-green'],
            [t('sup_rejected'), tot.rejected, tot.rejected > 0 ? 'text-accent-red' : 'text-text-primary'],
            [t('sup_advance_paid'), usd(tot.paid), 'text-accent-blue'],
          ].map(([l, v, c]) => (
            <div key={l} className="bg-bg-tertiary rounded-xl p-3">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{l}</p>
              <p className={`text-base font-syne font-extrabold ${c}`}>{v}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {order.status === 'draft' && <button onClick={() => act(() => setPurchaseOrderStatus(order.id, 'sent'))} className="px-3 py-2 rounded-xl bg-accent-blue/10 text-accent-blue text-sm font-bold flex items-center gap-1.5"><Send size={15} />{t('sup_mark_sent')}</button>}
          {open && <button onClick={() => setSub('receive')} className="px-3 py-2 rounded-xl bg-accent-green text-white text-sm font-bold flex items-center gap-1.5"><PackageCheck size={15} />{t('sup_receive_btn')}</button>}
          {order.status !== 'cancelled' && <button onClick={() => setSub('pay')} className="px-3 py-2 rounded-xl bg-bg-tertiary border border-border text-text-primary text-sm font-bold flex items-center gap-1.5"><Wallet size={15} />{t('sup_add_advance')}</button>}
          {['draft', 'sent'].includes(order.status) && <button onClick={onEdit} className="px-3 py-2 rounded-xl bg-bg-tertiary border border-border text-text-primary text-sm font-bold flex items-center gap-1.5"><Edit3 size={15} />{t('edit')}</button>}
          <button onClick={() => printOrder(order, t)} className="px-3 py-2 rounded-xl bg-bg-tertiary border border-border text-text-primary text-sm font-bold flex items-center gap-1.5"><Printer size={15} />{t('sup_print')}</button>
          {open && (confirmCancel
            ? <button onClick={() => act(() => setPurchaseOrderStatus(order.id, 'cancel'))} className="px-3 py-2 rounded-xl bg-accent-red text-white text-sm font-bold">{order.status === 'partial' ? t('sup_confirm_close') : t('sup_confirm_cancel')}</button>
            : <button onClick={() => setConfirmCancel(true)} className="px-3 py-2 rounded-xl bg-accent-red/10 text-accent-red text-sm font-bold flex items-center gap-1.5"><Ban size={15} />{order.status === 'partial' ? t('sup_close_order') : t('sup_cancel_order')}</button>)}
        </div>
        <ErrorBox text={err} />

        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-xs min-w-[560px]">
            <thead className="bg-bg-tertiary text-text-muted">
              <tr>
                <th className="px-3 py-2 text-left">{t('col_product')}</th>
                <th className="px-3 py-2 text-right">{t('sup_qty')}</th>
                <th className="px-3 py-2 text-right">{t('sup_accepted')}</th>
                <th className="px-3 py-2 text-right">{t('sup_rejected')}</th>
                <th className="px-3 py-2 text-right">{t('sup_remaining')}</th>
                <th className="px-3 py-2 text-right">{t('sup_price_usd')}</th>
                <th className="px-3 py-2 text-right">{t('sup_sum')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {order.items.map(i => {
                const left = i.quantity - i.receivedQty - i.rejectedQty
                return (
                  <tr key={i.id}>
                    <td className="px-3 py-2 font-medium text-text-primary">{i.productName}</td>
                    <td className="px-3 py-2 text-right">{i.quantity}</td>
                    <td className="px-3 py-2 text-right text-accent-green font-bold">{i.receivedQty}</td>
                    <td className={`px-3 py-2 text-right ${i.rejectedQty ? 'text-accent-red font-bold' : ''}`}>{i.rejectedQty}</td>
                    <td className="px-3 py-2 text-right">{order.status === 'closed' ? '—' : left}</td>
                    <td className="px-3 py-2 text-right">{usd(i.priceUSD)}</td>
                    <td className="px-3 py-2 text-right font-bold">{usd(i.quantity * i.priceUSD)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {order.payments.length > 0 && (
          <div>
            <h4 className={labelCls}>{t('sup_advances')}</h4>
            <div className="space-y-1.5">
              {order.payments.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-2 bg-bg-tertiary rounded-xl px-3 py-2 text-xs">
                  <span className="text-text-muted">{fmtDate(p.date)} · {payTypeLabel(t, p.type)}{p.note ? ` · ${p.note}` : ''}</span>
                  <span className="flex items-center gap-2">
                    <b className="text-text-primary">{usd(p.amountUSD)}</b>
                    <span className="text-text-muted">({Math.round(p.amountUZS).toLocaleString('uz-UZ')})</span>
                    {p.appliedUSD > 0
                      ? <span className="text-accent-green">{t('sup_applied')} {usd(p.appliedUSD)}</span>
                      : <button onClick={() => act(() => deletePurchaseOrderPayment(order.id, p.id))} className="text-text-muted hover:text-accent-red"><Trash2 size={14} /></button>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {order.receipts.length > 0 && (
          <div>
            <h4 className={labelCls}>{t('sup_receipts')}</h4>
            <div className="space-y-2">
              {order.receipts.map(r => (
                <div key={r.id} className="border border-border rounded-xl p-3 text-xs">
                  <p className="text-text-muted mb-1.5">{fmtDate(r.receivedAt)} · {r.receivedByName} · {t('col_rate')}: {Number(r.entryUsdRate).toLocaleString('uz-UZ')}{r.note ? ` · ${r.note}` : ''}</p>
                  {r.lines.map(l => (
                    <p key={l.itemId} className="text-text-primary">
                      {l.productName}: <b className="text-accent-green">+{l.accepted}</b>
                      {l.rejected > 0 && <span className="text-accent-red"> · {t('sup_rejected')} {l.rejected} ({l.reason})</span>}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </SupModal>
  )
}

const OrdersTab = ({ ctx }) => {
  const { t } = useTranslation()
  const { orders, setOrders, suppliers, MOCK_PRODUCTS, selectedShopId, usdRate, refreshAll } = ctx
  const { shops } = useShopStore()
  const [search, setSearch] = useState('')
  const [fStatus, setFStatus] = useState('open')
  const [fSupplier, setFSupplier] = useState('all')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState(null)
  const [detailId, setDetailId] = useState(null)

  const shopOrders = selectedShopId === 'all' ? orders : orders.filter(o => o.shopId === selectedShopId)
  const filtered = useMemo(() => shopOrders.filter(o => {
    if (fStatus === 'open' && !['draft', 'sent', 'partial'].includes(o.status)) return false
    if (fStatus !== 'open' && fStatus !== 'all' && o.status !== fStatus) return false
    if (fSupplier !== 'all' && o.supplierId !== fSupplier) return false
    const q = search.trim().toLowerCase()
    if (q && !o.orderNumber.toLowerCase().includes(q) && !o.items.some(i => i.productName.toLowerCase().includes(q))) return false
    return true
  }), [shopOrders, fStatus, fSupplier, search])
  const paged = filtered.slice((page - 1) * PS, page * PS)
  const detail = orders.find(o => o.id === detailId)

  const upsert = (o) => setOrders(prev => prev.some(x => x.id === o.id) ? prev.map(x => x.id === o.id ? o : x) : [o, ...prev])
  const today = todayISO()

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder={t('sup_search_orders')} className={inputCls + ' pl-9'} />
        </div>
        <div className="flex gap-2">
          <select value={fStatus} onChange={e => { setFStatus(e.target.value); setPage(1) }} className={inputCls + ' sm:w-44'}>
            <option value="open">{t('sup_f_open')}</option>
            <option value="all">{t('sup_f_all')}</option>
            {Object.keys(ORDER_STATUS).map(k => <option key={k} value={k}>{t(ORDER_STATUS[k].key)}</option>)}
          </select>
          <select value={fSupplier} onChange={e => { setFSupplier(e.target.value); setPage(1) }} className={inputCls + ' sm:w-48'}>
            <option value="all">{t('sup_all_suppliers')}</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <button onClick={() => setForm({})} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-accent-blue text-white rounded-xl font-bold whitespace-nowrap">
          <Plus size={18} /> {t('sup_new_order')}
        </button>
      </div>

      <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
        <TableView id="inc_orders" optional={[t('sup_expected_date'), t('sup_received_qty'), t('sup_advance_paid')]}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-bg-tertiary text-text-muted text-xs">
              <tr>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">{t('sup_order_no')}</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">{t('sup_supplier')}</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">{t('col_date')}</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">{t('sup_expected_date')}</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-right">{t('sup_received_qty')}</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-right">{t('sup_total')}</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-right">{t('sup_advance_paid')}</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">{t('col_status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paged.map(o => {
                const tot = orderTotals(o)
                const st = ORDER_STATUS[o.status] || ORDER_STATUS.draft
                const late = o.expectedDate && o.expectedDate < today && ['draft', 'sent', 'partial'].includes(o.status)
                return (
                  <tr key={o.id} onClick={() => setDetailId(o.id)} className="hover:bg-bg-tertiary/50 cursor-pointer">
                    <td className="px-3 sm:px-4 py-2 sm:py-3 font-bold text-text-primary">{o.orderNumber}<p className="text-[11px] font-normal text-text-muted">{o.shopName}</p></td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-primary">{o.supplierName}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted">{fmtDate(o.createdAt)}</td>
                    <td className={`px-3 sm:px-4 py-2 sm:py-3 ${late ? 'text-accent-red font-bold' : 'text-text-muted'}`}>
                      <span className="inline-flex items-center gap-1">{late && <AlertTriangle size={13} />}{o.expectedDate ? fmtDate(o.expectedDate) : '—'}</span>
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-right">{tot.received}/{tot.ordered}{tot.rejected > 0 && <span className="text-accent-red"> (−{tot.rejected})</span>}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-right font-bold text-text-primary">{usd(tot.total)}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-right text-accent-blue">{tot.paid > 0 ? usd(tot.paid) : '—'}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3"><span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${st.cls}`}>{t(st.key)}</span></td>
                  </tr>
                )
              })}
              {paged.length === 0 && (
                <tr><td colSpan="8" className="px-3 sm:px-4 py-12 text-center text-text-muted">
                  <ClipboardList size={32} className="mx-auto mb-2 opacity-40" />{t('sup_no_orders')}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        </TableView>
        <Pager page={page} setPage={setPage} total={filtered.length} pageSize={PS} />
      </div>

      {form && (
        <OrderFormModal
          initial={form.order || null} suppliers={suppliers.filter(s => s.isActive !== false)} products={MOCK_PRODUCTS}
          shops={shops} defaultShopId={selectedShopId} t={t}
          onClose={() => setForm(null)}
          onSaved={o => { upsert(o); setForm(null); setDetailId(o.id) }}
        />
      )}
      {detail && !form && (
        <OrderDetailModal
          order={detail} usdRate={usdRate} t={t}
          onClose={() => setDetailId(null)}
          onEdit={() => setForm({ order: detail })}
          onChanged={(o, affectsStock) => { upsert(o); if (affectsStock) refreshAll() }}
        />
      )}
    </div>
  )
}

export default OrdersTab
