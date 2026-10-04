import React from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

export const inputCls = 'w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-blue'
export const labelCls = 'text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-1.5 block'

export const SupModal = ({ title, subtitle, onClose, children, maxW = 'max-w-lg', footer }) => createPortal(
  <div
    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-end sm:items-center justify-center sm:p-4"
    onClick={e => { if (e.target === e.currentTarget) onClose() }}
  >
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`bg-bg-secondary border border-border rounded-t-[2rem] sm:rounded-[2rem] w-full ${maxW} max-h-[92vh] flex flex-col`}
    >
      <div className="flex items-start justify-between gap-3 px-5 sm:px-7 pt-5 sm:pt-6 pb-3">
        <div className="min-w-0">
          <h3 className="text-lg sm:text-xl font-syne font-extrabold text-text-primary">{title}</h3>
          {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
        </div>
        <button onClick={onClose} className="p-2 -mr-2 text-text-muted hover:text-text-primary shrink-0"><X size={22} /></button>
      </div>
      <div className="px-5 sm:px-7 pb-5 overflow-y-auto no-scrollbar flex-1">{children}</div>
      {footer && <div className="px-5 sm:px-7 py-4 border-t border-border">{footer}</div>}
    </motion.div>
  </div>,
  document.body
)

export const Field = ({ label, children, className = '' }) => (
  <div className={className}>
    <label className={labelCls}>{label}</label>
    {children}
  </div>
)

export const ErrorBox = ({ text }) => text
  ? <p className="text-accent-red text-sm bg-accent-red/10 border border-accent-red/30 rounded-xl px-4 py-2.5">{text}</p>
  : null

export const Pager = ({ page, setPage, total, pageSize }) => {
  const pages = Math.ceil(total / pageSize)
  if (total === 0) return null
  return (
    <div className="flex items-center justify-between px-4 py-3 text-xs text-text-muted">
      <span>{Math.min(page * pageSize, total)} / {total} ta</span>
      {pages > 1 && (
        <div className="flex items-center gap-1">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-1.5 rounded-lg border border-border disabled:opacity-30"><ChevronLeft size={14} /></button>
          <span className="px-2 font-bold text-text-primary">{page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="p-1.5 rounded-lg border border-border disabled:opacity-30"><ChevronRight size={14} /></button>
        </div>
      )}
    </div>
  )
}

export const PAY_TYPES = ['cash_uzs', 'cash_usd', 'transfer']
export const payTypeLabel = (t, type) =>
  type === 'cash_usd' ? t('inc_pay_cash_usd') : type === 'transfer' || type === 'bank' ? t('inc_pay_transfer') : t('inc_pay_cash_uzs')

export const ORDER_STATUS = {
  draft: { key: 'sup_st_draft', cls: 'bg-text-muted/10 text-text-muted' },
  sent: { key: 'sup_st_sent', cls: 'bg-accent-blue/10 text-accent-blue' },
  partial: { key: 'sup_st_partial', cls: 'bg-accent-orange/10 text-accent-orange' },
  received: { key: 'sup_st_received', cls: 'bg-accent-green/10 text-accent-green' },
  closed: { key: 'sup_st_closed', cls: 'bg-accent-green/10 text-accent-green' },
  cancelled: { key: 'sup_st_cancelled', cls: 'bg-accent-red/10 text-accent-red' },
}

export const usd = (n) => '$' + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString('uz-UZ')
export const fmtDate = (d) => d ? new Date(d).toLocaleDateString('uz-UZ') : '—'
export const dayKey = (d) => {
  if (!d) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(d))) return String(d)
  const x = new Date(d)
  if (isNaN(x.getTime())) return String(d).slice(0, 10)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}
export const todayISO = () => new Date().toISOString().split('T')[0]
export const batchUnitCost = (b) => b.quantityIn > 0 ? b.totalUSD / b.quantityIn : (b.purchasePriceUSD || 0)

export const orderTotals = (o) => {
  const total = o.items.reduce((s, i) => s + i.quantity * i.priceUSD, 0)
  const ordered = o.items.reduce((s, i) => s + i.quantity, 0)
  const received = o.items.reduce((s, i) => s + i.receivedQty, 0)
  const rejected = o.items.reduce((s, i) => s + i.rejectedQty, 0)
  const paid = o.payments.reduce((s, p) => s + p.amountUSD, 0)
  const unapplied = o.payments.reduce((s, p) => s + (p.amountUSD - p.appliedUSD), 0)
  return { total, ordered, received, rejected, paid, unapplied }
}

// Yetkazib beruvchi bilan o'zaro hisob-kitob yozuvlari (USD).
// plus = biz qarzdor bo'ladigan (kirim), minus = to'lov / qaytarish.
// Avansdan qoplangan kirim to'lovlari (orderPaymentId) avans sifatida bir marta hisoblanadi.
export const buildLedger = (t, { supplierId, batches, orders, returns }) => {
  const rows = []
  batches.filter(b => b.supplierId === supplierId).forEach(b => {
    rows.push({
      date: dayKey(b.receivedAt), kind: 'in', doc: b.batchNumber || `#${b.id}`,
      desc: `${b.productName} · ${b.quantityIn} ${b.unit || ''}`.trim(), plus: b.totalUSD, minus: 0,
    })
    ;(b.payments || []).filter(p => !p.orderPaymentId).forEach(p => {
      rows.push({
        date: dayKey(p.date), kind: 'pay', doc: b.batchNumber || `#${b.id}`,
        desc: `${t('sup_led_payment')} · ${payTypeLabel(t, p.type)}${p.note ? ' · ' + p.note : ''}`,
        plus: 0, minus: p.amountUSD, uzs: p.amountUZS,
      })
    })
  })
  orders.filter(o => o.supplierId === supplierId).forEach(o => {
    o.payments.forEach(p => {
      rows.push({
        date: dayKey(p.date), kind: 'adv', doc: o.orderNumber,
        desc: `${t('sup_led_advance')} · ${payTypeLabel(t, p.type)}${p.note ? ' · ' + p.note : ''}`,
        plus: 0, minus: p.amountUSD, uzs: p.amountUZS,
      })
    })
  })
  returns.filter(r => r.supplierId === supplierId && r.status === 'active').forEach(r => {
    rows.push({
      date: dayKey(r.createdAt), kind: 'ret', doc: r.returnNumber,
      desc: `${t('sup_led_return')} · ${r.productName} · ${r.quantity} ${t('unit_pcs')}`, plus: 0, minus: r.amountUSD,
    })
  })
  const order = { in: 0, adv: 1, pay: 2, ret: 3 }
  rows.sort((a, b) => a.date.localeCompare(b.date) || order[a.kind] - order[b.kind])
  return rows
}

export const ledgerSummary = (rows) => rows.reduce((s, r) => {
  if (r.kind === 'in') s.purchased += r.plus
  if (r.kind === 'pay' || r.kind === 'adv') s.paid += r.minus
  if (r.kind === 'ret') s.returned += r.minus
  s.balance += r.plus - r.minus
  return s
}, { purchased: 0, paid: 0, returned: 0, balance: 0 })

export const printHtml = (title, bodyHtml) => {
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>body{font-family:Arial,sans-serif;font-size:12px;color:#111;padding:24px}
    h2{margin:0 0 4px}table{width:100%;border-collapse:collapse;margin-top:12px}
    th,td{border:1px solid #999;padding:5px 7px;text-align:left}th{background:#eee}
    td.n,th.n{text-align:right}.muted{color:#555}.sign{margin-top:40px;display:flex;justify-content:space-between}</style>
    </head><body>${bodyHtml}</body></html>`)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 300)
}

export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

export default SupModal
