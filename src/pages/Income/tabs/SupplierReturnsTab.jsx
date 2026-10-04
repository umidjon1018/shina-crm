import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Undo2, Plus, Search, RotateCcw } from 'lucide-react'
import { createSupplierReturn, cancelSupplierReturn } from '../../../api/supplierOpsService'
import { SupModal, Field, ErrorBox, Pager, inputCls, usd, fmtDate, batchUnitCost } from '../components/supShared'

const PS = 20
const REASONS = ['sup_rr_defect', 'sup_rr_wrong', 'sup_rr_damaged', 'sup_rr_expired', 'sup_rr_other']
const errText = (e) => e?.response?.data?.error || e?.message || 'Xato'

const NewReturnModal = ({ suppliers, batches, onClose, onDone, t }) => {
  const [supplierId, setSupplierId] = useState('')
  const [batchId, setBatchId] = useState('')
  const [qty, setQty] = useState(1)
  const [reasonKey, setReasonKey] = useState(REASONS[0])
  const [reasonText, setReasonText] = useState('')
  const [q, setQ] = useState('')
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)

  const supBatches = useMemo(() => batches
    .filter(b => b.supplierId === supplierId && b.quantityRemaining > 0)
    .filter(b => !q.trim() || b.productName.toLowerCase().includes(q.trim().toLowerCase()) || (b.batchNumber || '').toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt)), [batches, supplierId, q])
  const batch = batches.find(b => b.id === batchId)
  const unit = batch ? batchUnitCost(batch) : 0
  const amount = unit * (Number(qty) || 0)

  const submit = async () => {
    setErr('')
    if (!batch) return setErr(t('sup_err_batch'))
    const n = Math.floor(Number(qty))
    if (!(n >= 1) || n > batch.quantityRemaining) return setErr(t('sup_err_over', { n: batch.quantityRemaining }))
    const reason = reasonKey === 'sup_rr_other' ? reasonText.trim() : [t(reasonKey), reasonText.trim()].filter(Boolean).join(' — ')
    if (!reason) return setErr(t('sup_err_reason'))
    setSaving(true)
    try { await createSupplierReturn({ batchId: batch.id, quantity: n, reason }); onDone() }
    catch (e) { setErr(errText(e)) } finally { setSaving(false) }
  }

  return (
    <SupModal title={t('sup_new_return')} onClose={onClose} maxW="max-w-2xl"
      footer={<button disabled={saving || !batch} onClick={submit} className="w-full py-3.5 bg-accent-red text-white rounded-xl font-extrabold disabled:opacity-50 flex items-center justify-center gap-2"><Undo2 size={18} />{t('sup_do_return')}</button>}>
      <div className="space-y-4">
        <Field label={t('sup_supplier') + ' *'}>
          <select value={supplierId} onChange={e => { setSupplierId(e.target.value); setBatchId('') }} className={inputCls}>
            <option value="">{t('sup_select')}</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        {supplierId && (
          <Field label={t('sup_pick_batch') + ' *'}>
            <div className="relative mb-2">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('sup_search_batch')} className={inputCls + ' pl-9'} />
            </div>
            <div className="max-h-56 overflow-y-auto space-y-1.5 no-scrollbar">
              {supBatches.map(b => (
                <button key={b.id} onClick={() => { setBatchId(b.id); setQty(1) }}
                  className={`w-full text-left border rounded-xl px-3 py-2 transition-colors ${batchId === b.id ? 'border-accent-red bg-accent-red/5' : 'border-border bg-bg-tertiary hover:border-text-muted'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-text-primary">{b.productName}</span>
                    <span className="text-xs text-text-muted shrink-0">{t('sup_in_stock')}: <b className="text-text-primary">{b.quantityRemaining}</b></span>
                  </div>
                  <p className="text-[11px] text-text-muted">{b.batchNumber} · {fmtDate(b.receivedAt)} · {usd(batchUnitCost(b))} / {b.unit || 'dona'}{b.shopName ? ` · ${b.shopName}` : ''}</p>
                </button>
              ))}
              {supBatches.length === 0 && <p className="text-xs text-text-muted text-center py-4">{t('sup_no_batches_stock')}</p>}
            </div>
          </Field>
        )}
        {batch && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('sup_qty') + ` (max ${batch.quantityRemaining})`}>
                <input type="number" min="1" max={batch.quantityRemaining} value={qty} onChange={e => setQty(e.target.value)} className={inputCls} />
              </Field>
              <Field label={t('sup_return_amount')}>
                <p className="py-2.5 text-base font-syne font-extrabold text-accent-red">{usd(amount)}</p>
              </Field>
              <Field label={t('sup_reason') + ' *'}>
                <select value={reasonKey} onChange={e => setReasonKey(e.target.value)} className={inputCls}>
                  {REASONS.map(r => <option key={r} value={r}>{t(r)}</option>)}
                </select>
              </Field>
              <Field label={t('col_note')}>
                <input value={reasonText} onChange={e => setReasonText(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <p className="text-xs text-text-muted bg-bg-tertiary rounded-xl px-3 py-2">{t('sup_return_hint')}</p>
          </>
        )}
        <ErrorBox text={err} />
      </div>
    </SupModal>
  )
}

const SupplierReturnsTab = ({ ctx }) => {
  const { t } = useTranslation()
  const { suppliers, shopBatches, returns, selectedShopId, refreshAll, user } = ctx
  const [showNew, setShowNew] = useState(false)
  const [search, setSearch] = useState('')
  const [fSupplier, setFSupplier] = useState('all')
  const [page, setPage] = useState(1)
  const [confirmId, setConfirmId] = useState(null)
  const [err, setErr] = useState('')

  const shopReturns = selectedShopId === 'all' ? returns : returns.filter(r => r.shopId === selectedShopId)
  const filtered = shopReturns.filter(r => {
    if (fSupplier !== 'all' && r.supplierId !== fSupplier) return false
    const q = search.trim().toLowerCase()
    return !q || [r.returnNumber, r.productName, r.reason, r.supplierName, r.batchNumber].some(v => (v || '').toLowerCase().includes(q))
  })
  const active = filtered.filter(r => r.status === 'active')
  const paged = filtered.slice((page - 1) * PS, page * PS)

  const cancel = async (id) => {
    setErr('')
    try { await cancelSupplierReturn(id); setConfirmId(null); refreshAll() } catch (e) { setErr(errText(e)) }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder={t('sup_search_returns')} className={inputCls + ' pl-9'} />
        </div>
        <select value={fSupplier} onChange={e => { setFSupplier(e.target.value); setPage(1) }} className={inputCls + ' lg:w-56'}>
          <option value="all">{t('sup_all_suppliers')}</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button onClick={() => setShowNew(true)} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-accent-red text-white rounded-xl font-bold whitespace-nowrap">
          <Plus size={18} /> {t('sup_new_return')}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="bg-bg-secondary border border-border rounded-2xl px-4 py-3">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('sup_returned_qty')}</p>
          <p className="text-lg font-syne font-extrabold text-text-primary">{active.reduce((s, r) => s + r.quantity, 0)} {t('unit_pcs')}</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-2xl px-4 py-3">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('sup_return_amount')}</p>
          <p className="text-lg font-syne font-extrabold text-accent-orange">{usd(active.reduce((s, r) => s + r.amountUSD, 0))}</p>
        </div>
      </div>
      <ErrorBox text={err} />

      <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead className="bg-bg-tertiary text-text-muted text-xs">
              <tr>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">{t('sup_document')}</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">{t('col_date')}</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">{t('sup_supplier')}</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">{t('col_product')}</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-right">{t('sup_qty')}</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-right">{t('sup_return_amount')}</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">{t('sup_reason')}</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paged.map(r => (
                <tr key={r.id} className={r.status === 'cancelled' ? 'bg-accent-red/5' : 'hover:bg-bg-tertiary/40'}>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 font-bold text-text-primary whitespace-nowrap">
                    {r.returnNumber}
                    {r.status === 'cancelled' && <span className="ml-1.5 px-1.5 py-0.5 rounded bg-accent-red/10 text-accent-red text-[10px]">{t('sup_cancelled_badge')}</span>}
                    <p className="text-[11px] font-normal text-text-muted">{r.batchNumber}</p>
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted whitespace-nowrap">{fmtDate(r.createdAt)}<p className="text-[11px]">{r.createdByName}</p></td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-primary">{r.supplierName}</td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-primary">{r.productName}</td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-right font-bold">{r.quantity}</td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-right font-bold text-accent-orange">{usd(r.amountUSD)}</td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs text-text-secondary max-w-[220px]">{r.reason}</td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-right">
                    {r.status === 'active' && ['admin', 'manager'].includes(user?.role) && (confirmId === r.id
                      ? <button onClick={() => cancel(r.id)} className="px-2.5 py-1.5 rounded-lg bg-accent-red text-white text-xs font-bold whitespace-nowrap">{t('sup_confirm_undo')}</button>
                      : <button onClick={() => setConfirmId(r.id)} title={t('sup_undo_return')} className="p-1.5 text-text-muted hover:text-accent-red"><RotateCcw size={16} /></button>)}
                  </td>
                </tr>
              ))}
              {paged.length === 0 && <tr><td colSpan="8" className="px-3 sm:px-4 py-12 text-center text-text-muted"><Undo2 size={32} className="mx-auto mb-2 opacity-40" />{t('sup_no_returns')}</td></tr>}
            </tbody>
          </table>
        </div>
        <Pager page={page} setPage={setPage} total={filtered.length} pageSize={PS} />
      </div>

      {showNew && (
        <NewReturnModal suppliers={suppliers} batches={shopBatches} t={t}
          onClose={() => setShowNew(false)} onDone={() => { setShowNew(false); refreshAll() }} />
      )}
    </div>
  )
}

export default SupplierReturnsTab
