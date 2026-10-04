import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Scale, Search, FileText, Wallet, Printer } from 'lucide-react'
import DateMaskInput from '../../../components/DateMaskInput'
import { paySupplierFIFO } from '../../../api/supplierOpsService'
import { getDueDays } from '../components/incHelpers'
import {
  SupModal, Field, ErrorBox, inputCls, usd, fmtDate, todayISO, buildLedger, ledgerSummary, printHtml, esc,
} from '../components/supShared'
import { PaymentFields } from './OrdersTab'

const errText = (e) => e?.response?.data?.error || e?.message || 'Xato'

const balanceCls = (b) => b > 0.005 ? 'text-accent-red' : b < -0.005 ? 'text-accent-green' : 'text-text-primary'

const LedgerModal = ({ supplier, rows, shopLabel, onClose, t }) => {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const opening = rows.filter(r => from && r.date < from).reduce((s, r) => s + r.plus - r.minus, 0)
  const inRange = rows.filter(r => (!from || r.date >= from) && (!to || r.date <= to))
  let run = opening
  const lines = inRange.map(r => { run += r.plus - r.minus; return { ...r, balance: run } })
  const sum = ledgerSummary(inRange)
  const closing = opening + sum.balance

  const print = () => printHtml(`${t('sup_act_title')} — ${supplier.name}`, `
    <h2>${esc(t('sup_act_title'))}</h2>
    <div>${esc(t('sup_supplier'))}: <b>${esc(supplier.name)}</b>${supplier.inn ? ` · INN ${esc(supplier.inn)}` : ''} · ${esc(shopLabel)}</div>
    <div class="muted">${esc(t('sup_period'))}: ${from ? fmtDate(from) : '…'} — ${to ? fmtDate(to) : fmtDate(todayISO())}</div>
    <table><thead><tr><th>${esc(t('col_date'))}</th><th>${esc(t('sup_document'))}</th><th>${esc(t('sup_description'))}</th>
      <th class="n">${esc(t('sup_led_debit'))}</th><th class="n">${esc(t('sup_led_credit'))}</th><th class="n">${esc(t('sup_balance'))}</th></tr></thead>
    <tbody><tr><td colspan="5"><b>${esc(t('sup_opening'))}</b></td><td class="n"><b>${usd(opening)}</b></td></tr>
    ${lines.map(l => `<tr><td>${fmtDate(l.date)}</td><td>${esc(l.doc)}</td><td>${esc(l.desc)}</td>
      <td class="n">${l.plus ? usd(l.plus) : ''}</td><td class="n">${l.minus ? usd(l.minus) : ''}</td><td class="n">${usd(l.balance)}</td></tr>`).join('')}
    <tr><th colspan="3">${esc(t('sup_turnover'))}</th><th class="n">${usd(sum.purchased)}</th><th class="n">${usd(sum.paid + sum.returned)}</th><th></th></tr>
    <tr><th colspan="5">${esc(t('sup_closing'))}</th><th class="n">${usd(closing)}</th></tr></tbody></table>
    <p class="muted">${esc(t('sup_balance_hint'))}</p>
    <div class="sign"><span>${esc(t('sup_sign_buyer'))}: ____________</span><span>${esc(t('sup_sign_supplier'))}: ____________</span></div>`)

  return (
    <SupModal title={t('sup_act_title')} subtitle={supplier.name} onClose={onClose} maxW="max-w-4xl">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <Field label={t('sup_from')} className="sm:w-44"><DateMaskInput value={from} onChange={e => setFrom(e.target.value)} className={inputCls} /></Field>
          <Field label={t('sup_to')} className="sm:w-44"><DateMaskInput value={to} onChange={e => setTo(e.target.value)} className={inputCls} /></Field>
          <button onClick={print} className="sm:ml-auto px-4 py-2.5 rounded-xl bg-bg-tertiary border border-border text-text-primary text-sm font-bold flex items-center justify-center gap-2"><Printer size={16} />{t('sup_print')}</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[[t('sup_opening'), opening], [t('sup_led_debit'), sum.purchased], [t('sup_led_credit'), sum.paid + sum.returned], [t('sup_closing'), closing]].map(([l, v], i) => (
            <div key={l} className="bg-bg-tertiary rounded-xl p-3">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{l}</p>
              <p className={`text-base font-syne font-extrabold ${i === 0 || i === 3 ? balanceCls(v) : 'text-text-primary'}`}>{usd(v)}</p>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-xs min-w-[620px]">
            <thead className="bg-bg-tertiary text-text-muted">
              <tr>
                <th className="px-3 py-2 text-left">{t('col_date')}</th>
                <th className="px-3 py-2 text-left">{t('sup_document')}</th>
                <th className="px-3 py-2 text-left">{t('sup_description')}</th>
                <th className="px-3 py-2 text-right">{t('sup_led_debit')}</th>
                <th className="px-3 py-2 text-right">{t('sup_led_credit')}</th>
                <th className="px-3 py-2 text-right">{t('sup_balance')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {lines.map((l, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 text-text-muted whitespace-nowrap">{fmtDate(l.date)}</td>
                  <td className="px-3 py-2 font-medium text-text-primary whitespace-nowrap">{l.doc}</td>
                  <td className="px-3 py-2 text-text-secondary">{l.desc}</td>
                  <td className="px-3 py-2 text-right text-text-primary">{l.plus ? usd(l.plus) : ''}</td>
                  <td className="px-3 py-2 text-right text-accent-green">{l.minus ? usd(l.minus) : ''}</td>
                  <td className={`px-3 py-2 text-right font-bold ${balanceCls(l.balance)}`}>{usd(l.balance)}</td>
                </tr>
              ))}
              {lines.length === 0 && <tr><td colSpan="6" className="px-3 py-8 text-center text-text-muted">{t('sup_no_entries')}</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-text-muted">{t('sup_balance_hint')}</p>
      </div>
    </SupModal>
  )
}

const PaySupplierModal = ({ supplier, debt, selectedShopId, usdRate, onClose, onDone, t }) => {
  const [f, setF] = useState({ amountUSD: '', usdRate: usdRate || '', type: 'cash_uzs', date: todayISO(), note: '' })
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)
  const submit = async () => {
    setErr('')
    const amt = Number(f.amountUSD)
    if (!(amt > 0) || !(Number(f.usdRate) > 0)) return setErr(t('sup_err_amount'))
    if (amt > debt + 0.01) return setErr(t('sup_err_over_debt', { n: usd(debt) }))
    setSaving(true)
    try { await paySupplierFIFO(supplier.id, { ...f, shopId: selectedShopId }); onDone() }
    catch (e) { setErr(errText(e)) } finally { setSaving(false) }
  }
  return (
    <SupModal title={t('sup_pay_supplier')} subtitle={supplier.name} onClose={onClose}
      footer={<button disabled={saving} onClick={submit} className="w-full py-3.5 bg-accent-blue text-white rounded-xl font-extrabold disabled:opacity-50">{t('inc_save_payment')}</button>}>
      <div className="bg-bg-tertiary rounded-xl p-3 mb-4 flex items-center justify-between">
        <span className="text-xs text-text-muted">{t('sup_open_debt')}</span>
        <span className="text-lg font-syne font-extrabold text-accent-red">{usd(debt)}</span>
      </div>
      <PaymentFields f={f} setF={setF} t={t} />
      <p className="text-xs text-text-muted mt-3">{t('sup_fifo_hint')}</p>
      <div className="mt-3"><ErrorBox text={err} /></div>
    </SupModal>
  )
}

const SettlementsTab = ({ ctx }) => {
  const { t } = useTranslation()
  const { suppliers, shopBatches, orders, returns, selectedShopId, usdRate, refreshAll } = ctx
  const [search, setSearch] = useState('')
  const [onlyDebt, setOnlyDebt] = useState(false)
  const [ledgerFor, setLedgerFor] = useState(null)
  const [payFor, setPayFor] = useState(null)

  const shopOrders = selectedShopId === 'all' ? orders : orders.filter(o => o.shopId === selectedShopId)
  const shopReturns = selectedShopId === 'all' ? returns : returns.filter(r => r.shopId === selectedShopId)

  const rowsBySupplier = useMemo(() => {
    const m = {}
    suppliers.forEach(s => { m[s.id] = buildLedger(t, { supplierId: s.id, batches: shopBatches, orders: shopOrders, returns: shopReturns }) })
    return m
  }, [suppliers, shopBatches, shopOrders, shopReturns, t])

  const stats = useMemo(() => suppliers.map(s => {
    const sum = ledgerSummary(rowsBySupplier[s.id] || [])
    const debtBatches = shopBatches.filter(b => b.supplierId === s.id && b.debtUSD > 0)
    const openDebt = debtBatches.reduce((a, b) => a + b.debtUSD, 0)
    const overdue = debtBatches.filter(b => { const d = getDueDays(b.dueDate); return d !== null && d < 0 }).length
    return { s, ...sum, openDebt, overdue, hasActivity: (rowsBySupplier[s.id] || []).length > 0 }
  }), [suppliers, rowsBySupplier, shopBatches])

  const list = stats.filter(x => {
    if (!x.hasActivity && x.s.isActive === false) return false
    if (onlyDebt && Math.abs(x.balance) < 0.005) return false
    const q = search.trim().toLowerCase()
    return !q || x.s.name.toLowerCase().includes(q) || (x.s.phone || '').includes(q)
  }).sort((a, b) => b.balance - a.balance)

  const total = stats.reduce((a, x) => ({
    purchased: a.purchased + x.purchased, paid: a.paid + x.paid, returned: a.returned + x.returned,
    owe: a.owe + Math.max(0, x.balance), credit: a.credit + Math.max(0, -x.balance),
  }), { purchased: 0, paid: 0, returned: 0, owe: 0, credit: 0 })

  const shopLabel = selectedShopId === 'all' ? t('sup_all_shops') : (shopBatches[0]?.shopName || '')

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        {[
          [t('sup_purchased'), total.purchased, 'text-text-primary'],
          [t('sup_paid'), total.paid, 'text-accent-blue'],
          [t('sup_returned'), total.returned, 'text-accent-orange'],
          [t('sup_we_owe'), total.owe, 'text-accent-red'],
          [t('sup_they_owe'), total.credit, 'text-accent-green'],
        ].map(([l, v, c]) => (
          <div key={l} className="bg-bg-secondary border border-border rounded-2xl p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{l}</p>
            <p className={`text-lg font-syne font-extrabold ${c}`}>{usd(v)}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('sup_search_supplier')} className={inputCls + ' pl-9'} />
        </div>
        <label className="flex items-center gap-2 text-sm text-text-secondary px-2 cursor-pointer">
          <input type="checkbox" checked={onlyDebt} onChange={e => setOnlyDebt(e.target.checked)} />
          {t('sup_only_balance')}
        </label>
      </div>

      <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-bg-tertiary text-text-muted text-xs">
              <tr>
                <th className="px-4 py-3 text-left">{t('sup_supplier')}</th>
                <th className="px-4 py-3 text-right">{t('sup_purchased')}</th>
                <th className="px-4 py-3 text-right">{t('sup_paid')}</th>
                <th className="px-4 py-3 text-right">{t('sup_returned')}</th>
                <th className="px-4 py-3 text-right">{t('sup_balance')}</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {list.map(x => (
                <tr key={x.s.id} className="hover:bg-bg-tertiary/40">
                  <td className="px-4 py-3">
                    <p className="font-bold text-text-primary">{x.s.name}</p>
                    <p className="text-[11px] text-text-muted">{x.s.phone}{x.overdue > 0 && <span className="text-accent-red font-bold"> · {t('sup_overdue_n', { n: x.overdue })}</span>}</p>
                  </td>
                  <td className="px-4 py-3 text-right">{usd(x.purchased)}</td>
                  <td className="px-4 py-3 text-right text-accent-blue">{usd(x.paid)}</td>
                  <td className="px-4 py-3 text-right text-accent-orange">{x.returned ? usd(x.returned) : '—'}</td>
                  <td className={`px-4 py-3 text-right font-extrabold ${balanceCls(x.balance)}`}>
                    {usd(Math.abs(x.balance))}
                    <p className="text-[10px] font-normal text-text-muted">{x.balance > 0.005 ? t('sup_we_owe') : x.balance < -0.005 ? t('sup_they_owe') : t('sup_settled')}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => setLedgerFor(x.s)} title={t('sup_act_title')} className="px-2.5 py-1.5 rounded-lg bg-bg-tertiary border border-border text-text-primary text-xs font-bold flex items-center gap-1"><FileText size={14} />{t('sup_act_short')}</button>
                      {x.openDebt > 0 && <button onClick={() => setPayFor(x)} className="px-2.5 py-1.5 rounded-lg bg-accent-blue text-white text-xs font-bold flex items-center gap-1"><Wallet size={14} />{t('sup_pay_short')}</button>}
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan="6" className="px-4 py-12 text-center text-text-muted"><Scale size={32} className="mx-auto mb-2 opacity-40" />{t('sup_no_entries')}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {ledgerFor && <LedgerModal supplier={ledgerFor} rows={rowsBySupplier[ledgerFor.id] || []} shopLabel={shopLabel} t={t} onClose={() => setLedgerFor(null)} />}
      {payFor && (
        <PaySupplierModal supplier={payFor.s} debt={payFor.openDebt} selectedShopId={selectedShopId} usdRate={usdRate} t={t}
          onClose={() => setPayFor(null)} onDone={() => { setPayFor(null); refreshAll() }} />
      )}
    </div>
  )
}

export default SettlementsTab
