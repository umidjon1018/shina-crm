import React, { useState, useMemo } from 'react'
import TableView from '../../../components/ui/TableView'
import { useTranslation } from 'react-i18next'
import { History, Search } from 'lucide-react'
import DateMaskInput from '../../../components/DateMaskInput'
import { Pager, inputCls, usd, fmtDate, dayKey, PAY_TYPES, payTypeLabel } from '../components/supShared'

const PS = 20

const PaymentsHistoryTab = ({ ctx }) => {
  const { t } = useTranslation()
  const { suppliers, shopBatches, orders, selectedShopId } = ctx
  const [search, setSearch] = useState('')
  const [fSupplier, setFSupplier] = useState('all')
  const [fType, setFType] = useState('all')
  const [fKind, setFKind] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  const supName = (id) => suppliers.find(s => s.id === id)?.name || t('inc_not_assigned')

  const rows = useMemo(() => {
    const list = []
    shopBatches.forEach(b => (b.payments || []).filter(p => !p.orderPaymentId).forEach(p => list.push({
      key: 'b' + p.id, kind: 'batch', date: dayKey(p.date), supplierId: b.supplierId, doc: b.batchNumber || `#${b.id}`,
      what: b.productName, amountUSD: p.amountUSD, usdRate: p.usdRate, amountUZS: p.amountUZS, type: p.type, note: p.note,
    })))
    const shopOrders = selectedShopId === 'all' ? orders : orders.filter(o => o.shopId === selectedShopId)
    shopOrders.forEach(o => o.payments.forEach(p => list.push({
      key: 'o' + p.id, kind: 'order', date: dayKey(p.date), supplierId: o.supplierId, doc: o.orderNumber,
      what: `${t('sup_led_advance')}${p.appliedUSD > 0 ? ` · ${t('sup_applied')} ${usd(p.appliedUSD)}` : ''}`,
      amountUSD: p.amountUSD, usdRate: p.usdRate, amountUZS: p.amountUZS, type: p.type, note: p.note,
    })))
    return list.sort((a, b) => b.date.localeCompare(a.date))
  }, [shopBatches, orders, selectedShopId, t])

  const filtered = rows.filter(r => {
    if (fSupplier !== 'all' && r.supplierId !== fSupplier) return false
    if (fType !== 'all' && (r.type === 'bank' ? 'transfer' : r.type) !== fType) return false
    if (fKind !== 'all' && r.kind !== fKind) return false
    if (from && r.date < from) return false
    if (to && r.date > to) return false
    const q = search.trim().toLowerCase()
    if (q && ![r.doc, r.what, r.note, supName(r.supplierId)].some(v => (v || '').toLowerCase().includes(q))) return false
    return true
  })
  const sumUSD = filtered.reduce((s, r) => s + r.amountUSD, 0)
  const sumUZS = filtered.reduce((s, r) => s + r.amountUZS, 0)
  const paged = filtered.slice((page - 1) * PS, page * PS)
  const reset = (fn) => (v) => { fn(v); setPage(1) }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <div className="relative col-span-2 lg:col-span-2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={e => reset(setSearch)(e.target.value)} placeholder={t('sup_search_payments')} className={inputCls + ' pl-9'} />
        </div>
        <select value={fSupplier} onChange={e => reset(setFSupplier)(e.target.value)} className={inputCls}>
          <option value="all">{t('sup_all_suppliers')}</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={fKind} onChange={e => reset(setFKind)(e.target.value)} className={inputCls}>
          <option value="all">{t('sup_kind_all')}</option>
          <option value="batch">{t('sup_kind_batch')}</option>
          <option value="order">{t('sup_kind_order')}</option>
        </select>
        <select value={fType} onChange={e => reset(setFType)(e.target.value)} className={inputCls}>
          <option value="all">{t('sup_all_methods')}</option>
          {PAY_TYPES.map(p => <option key={p} value={p}>{payTypeLabel(t, p)}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2 col-span-2 sm:col-span-1 lg:col-span-1">
          <DateMaskInput value={from} onChange={e => reset(setFrom)(e.target.value)} placeholder={t('sup_from')} className={inputCls} />
          <DateMaskInput value={to} onChange={e => reset(setTo)(e.target.value)} placeholder={t('sup_to')} className={inputCls} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="bg-bg-secondary border border-border rounded-2xl px-4 py-3">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('sup_total')} USD</p>
          <p className="text-lg font-syne font-extrabold text-accent-blue">{usd(sumUSD)}</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-2xl px-4 py-3">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('sup_total')} UZS</p>
          <p className="text-lg font-syne font-extrabold text-text-primary">{Math.round(sumUZS).toLocaleString('uz-UZ')}</p>
        </div>
      </div>

      <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
        <TableView id="inc_pay_hist" optional={[t('sup_document'), t('sup_description'), t('col_rate')]}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead className="bg-bg-tertiary text-text-muted text-xs">
              <tr>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">{t('col_date')}</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">{t('sup_supplier')}</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">{t('sup_document')}</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">{t('sup_description')}</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-right">USD</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-right">{t('col_rate')}</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-right">UZS</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">{t('inc_pay_method')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paged.map(r => (
                <tr key={r.key} className="hover:bg-bg-tertiary/40">
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted whitespace-nowrap">{fmtDate(r.date)}</td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 font-medium text-text-primary">{supName(r.supplierId)}</td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${r.kind === 'order' ? 'bg-accent-blue/10 text-accent-blue' : 'bg-bg-tertiary text-text-secondary'}`}>{r.doc}</span>
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-secondary text-xs">{r.what}{r.note ? <span className="text-text-muted"> · {r.note}</span> : null}</td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-right font-bold text-text-primary">{usd(r.amountUSD)}</td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-right text-text-muted">{Number(r.usdRate).toLocaleString('uz-UZ')}</td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-right">{Math.round(r.amountUZS).toLocaleString('uz-UZ')}</td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs">{payTypeLabel(t, r.type)}</td>
                </tr>
              ))}
              {paged.length === 0 && <tr><td colSpan="8" className="px-3 sm:px-4 py-12 text-center text-text-muted"><History size={32} className="mx-auto mb-2 opacity-40" />{t('sup_no_entries')}</td></tr>}
            </tbody>
          </table>
        </div>
        </TableView>
        <Pager page={page} setPage={setPage} total={filtered.length} pageSize={PS} />
      </div>
    </div>
  )
}

export default PaymentsHistoryTab
