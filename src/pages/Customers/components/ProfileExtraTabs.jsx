import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Heart, MessageSquare, Wallet, Trash2, Plus, Minus, SlidersHorizontal, Send, CheckCircle } from 'lucide-react'
import {
  getCustomerNotes, addCustomerNote, deleteCustomerNote,
  getCustomerBalance, addCustomerBalanceTx, payCustomerDebt,
} from '../../../api/customerService'
import { useSettingsStore } from '../../../store/settingsStore'

const fmt = (n) => Math.round(Number(n) || 0).toLocaleString('uz-UZ')
const errText = (e) => e?.response?.data?.error || e?.message || 'Xato'
const inputCls = 'w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue'
const labelCls = 'text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-1.5 block'
const Empty = ({ icon: Icon, text }) => (
  <div className="py-12 text-center bg-bg-secondary border border-border rounded-2xl border-dashed">
    <Icon size={32} className="mx-auto text-text-muted mb-3 opacity-20" />
    <p className="text-text-muted">{text}</p>
  </div>
)
const fmtDT = (d) => d ? new Date(d).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

// ===================== AFZALLIKLAR =====================
export const PreferencesTab = ({ sales, products }) => {
  const { t } = useTranslation()
  const { productAttributeDefs } = useSettingsStore()
  const prefs = useMemo(() => {
    const attrLabel = (k) => (productAttributeDefs || []).find(d => String(d.id) === String(k))?.label
      || (/^\d{6,}$/.test(k) ? t('cust_pref_attribute') : k)
    const byId = Object.fromEntries((products || []).map(p => [String(p.id), p]))
    const count = (arr) => Object.entries(arr.reduce((m, k) => { if (k) m[k] = (m[k] || 0) + 1; return m }, {}))
      .sort((a, b) => b[1] - a[1])
    const items = sales.flatMap(s => s.items || [])
    const prod = items.map(i => i.productName || i.name)
    const cats = items.map(i => {
      const c = i.productCategory || i.category || byId[i.productId]?.category
      return c === 'tire' ? t('cat_tire') : c === 'wheel' ? t('cat_wheel') : c === 'accessory' ? t('cat_accessory') : c
    })
    const sizes = items.map(i => byId[i.productId]?.size)
    const brands = items.map(i => byId[i.productId]?.brand)
    const seasons = items.map(i => { const p = byId[i.productId]; return p && p.season && p.season !== 'NA' ? p.seasonLabel : null })
    const attrs = {}
    items.forEach(i => Object.entries(i.attributes || {}).forEach(([k, v]) => {
      if (v == null || v === '') return
      ;(attrs[attrLabel(k)] ||= []).push(String(v))
    }))
    return {
      total: items.length,
      groups: [
        [t('cust_pref_products'), count(prod)],
        [t('cust_pref_categories'), count(cats)],
        [t('cust_pref_sizes'), count(sizes)],
        [t('cust_pref_brands'), count(brands)],
        [t('cust_pref_seasons'), count(seasons)],
        ...Object.entries(attrs).map(([k, v]) => [k, count(v)]),
      ].filter(([, v]) => v.length > 0),
    }
  }, [sales, products, productAttributeDefs, t])

  if (prefs.total === 0) return <Empty icon={Heart} text={t('cust_pref_empty')} />
  return (
    <div className="space-y-5">
      <p className="text-xs text-text-muted">{t('cust_pref_hint', { n: prefs.total })}</p>
      {prefs.groups.map(([label, list]) => {
        const max = list[0][1]
        return (
          <div key={label} className="bg-bg-secondary border border-border rounded-2xl p-4">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-3">{label}</h4>
            <div className="space-y-2">
              {list.slice(0, 5).map(([name, n], idx) => (
                <div key={name} className="flex items-center gap-3">
                  <span className={`text-sm w-2/5 truncate ${idx === 0 ? 'font-bold text-text-primary' : 'text-text-secondary'}`}>{name}</span>
                  <div className="flex-1 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${idx === 0 ? 'bg-accent-red' : 'bg-accent-blue/60'}`} style={{ width: `${(n / max) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-text-primary w-12 text-right">{n} {t('unit_pcs')}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ===================== IZOHLAR =====================
export const NotesTab = ({ customer, user }) => {
  const { t } = useTranslation()
  const [notes, setNotes] = useState([])
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)
  const load = () => getCustomerNotes(customer.id).then(setNotes).catch(e => setErr(errText(e)))
  useEffect(() => { load() }, [customer.id])
  const isPriv = ['admin', 'manager'].includes(user?.role)
  const myName = user?.full_name || user?.fullName || user?.username

  const add = async () => {
    if (!text.trim()) return
    setErr(''); setSaving(true)
    try { await addCustomerNote(customer.id, text.trim()); setText(''); await load() }
    catch (e) { setErr(errText(e)) } finally { setSaving(false) }
  }
  const remove = async (n) => {
    setErr('')
    try { await deleteCustomerNote(customer.id, n.id); await load() } catch (e) { setErr(errText(e)) }
  }

  return (
    <div className="space-y-4">
      <div className="bg-bg-secondary border border-border rounded-2xl p-3 space-y-2">
        <textarea value={text} onChange={e => setText(e.target.value)} rows={3} placeholder={t('cust_note_ph')}
          className="w-full bg-transparent text-sm text-text-primary focus:outline-none resize-none" />
        <div className="flex justify-end">
          <button disabled={saving || !text.trim()} onClick={add}
            className="px-4 py-2 bg-accent-blue text-white rounded-xl text-xs font-bold disabled:opacity-40 flex items-center gap-1.5">
            <Send size={13} /> {t('cust_note_add')}
          </button>
        </div>
      </div>
      {err && <p className="text-sm text-accent-red">{err}</p>}
      {notes.length === 0 ? <Empty icon={MessageSquare} text={t('cust_note_empty')} /> : (
        <div className="space-y-2">
          {notes.map(n => (
            <div key={n.id} className="bg-bg-secondary border border-border rounded-2xl p-4">
              <p className="text-sm text-text-primary whitespace-pre-wrap">{n.text}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-text-muted">{n.createdByName} · {fmtDT(n.createdAt)}</span>
                {(isPriv || n.createdByName === myName) && (
                  <button onClick={() => remove(n)} className="p-1 text-text-muted hover:text-accent-red"><Trash2 size={14} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ===================== BALANS =====================
const TX_LABEL = { deposit: 'cust_tx_deposit', withdraw: 'cust_tx_withdraw', adjust: 'cust_tx_adjust', debt_payment: 'cust_tx_debt_payment' }
const METHOD_LABEL = { cash: 'pay_cash', card: 'pay_card', transfer: 'pay_transfer' }

export const BalanceTab = ({ customer, user, selectedShopId, onChanged }) => {
  const { t } = useTranslation()
  const [data, setData] = useState({ balance: customer.balance || 0, transactions: [] })
  const [mode, setMode] = useState(null)
  const [f, setF] = useState({ amount: '', method: 'cash', note: '', sign: '+' })
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)
  const isPriv = ['admin', 'manager'].includes(user?.role)
  const load = () => getCustomerBalance(customer.id).then(setData).catch(e => setErr(errText(e)))
  useEffect(() => { load() }, [customer.id])

  const submit = async () => {
    setErr('')
    const amt = Math.round(Number(f.amount))
    if (!(amt > 0)) return setErr(t('cust_bal_err_amount'))
    if (mode === 'withdraw' && amt > data.balance) return setErr(t('cust_bal_err_low', { n: fmt(data.balance) }))
    if (mode === 'adjust' && !f.note.trim()) return setErr(t('cust_bal_err_reason'))
    setSaving(true)
    try {
      await addCustomerBalanceTx(customer.id, {
        type: mode, amount: mode === 'adjust' && f.sign === '-' ? -amt : amt,
        method: f.method, note: f.note, shopId: selectedShopId,
      })
      setMode(null); setF({ amount: '', method: 'cash', note: '', sign: '+' })
      await load(); onChanged()
    } catch (e) { setErr(errText(e)) } finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">
      <div className="bg-bg-secondary border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('cust_balance')}</p>
          <p className={`text-3xl font-syne font-extrabold ${data.balance > 0 ? 'text-accent-green' : data.balance < 0 ? 'text-accent-red' : 'text-text-primary'}`}>{fmt(data.balance)} {t('unit_som')}</p>
          <p className="text-xs text-text-muted mt-1">{t('cust_balance_hint')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setMode('deposit'); setErr('') }} className="px-3 py-2 rounded-xl bg-accent-green text-white text-xs font-bold flex items-center gap-1.5"><Plus size={14} />{t('cust_bal_deposit')}</button>
          <button onClick={() => { setMode('withdraw'); setErr('') }} disabled={data.balance <= 0} className="px-3 py-2 rounded-xl bg-bg-tertiary border border-border text-text-primary text-xs font-bold flex items-center gap-1.5 disabled:opacity-40"><Minus size={14} />{t('cust_bal_withdraw')}</button>
          {isPriv && <button onClick={() => { setMode('adjust'); setErr('') }} className="px-3 py-2 rounded-xl bg-bg-tertiary border border-border text-text-primary text-xs font-bold flex items-center gap-1.5"><SlidersHorizontal size={14} />{t('cust_bal_adjust')}</button>}
        </div>
      </div>

      {mode && (
        <div className="bg-bg-secondary border border-accent-blue/40 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-bold text-text-primary">{t(TX_LABEL[mode])}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className={mode === 'adjust' ? '' : 'col-span-2 sm:col-span-1'}>
              <label className={labelCls}>{t('col_amount')} ({t('unit_som')})</label>
              <input type="number" min="0" autoFocus value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} className={inputCls} />
            </div>
            {mode === 'adjust' ? (
              <div>
                <label className={labelCls}>{t('cust_bal_direction')}</label>
                <select value={f.sign} onChange={e => setF({ ...f, sign: e.target.value })} className={inputCls}>
                  <option value="+">+ {t('cust_bal_increase')}</option>
                  <option value="-">− {t('cust_bal_decrease')}</option>
                </select>
              </div>
            ) : (
              <div className="col-span-2 sm:col-span-1">
                <label className={labelCls}>{t('inc_pay_method')}</label>
                <select value={f.method} onChange={e => setF({ ...f, method: e.target.value })} className={inputCls}>
                  {Object.keys(METHOD_LABEL).map(m => <option key={m} value={m}>{t(METHOD_LABEL[m])}</option>)}
                </select>
              </div>
            )}
            <div className="col-span-2">
              <label className={labelCls}>{mode === 'adjust' ? t('cust_bal_reason') + ' *' : t('col_note')}</label>
              <input value={f.note} onChange={e => setF({ ...f, note: e.target.value })} className={inputCls} />
            </div>
          </div>
          {err && <p className="text-sm text-accent-red">{err}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setMode(null)} className="px-4 py-2 rounded-xl bg-bg-tertiary border border-border text-xs font-bold text-text-muted">{t('cancel')}</button>
            <button disabled={saving} onClick={submit} className="px-4 py-2 rounded-xl bg-accent-blue text-white text-xs font-bold disabled:opacity-50">{t('cust_bal_save')}</button>
          </div>
        </div>
      )}
      {!mode && err && <p className="text-sm text-accent-red">{err}</p>}

      {data.transactions.length === 0 ? <Empty icon={Wallet} text={t('cust_bal_empty')} /> : (
        <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[520px]">
              <thead className="bg-bg-tertiary text-text-muted">
                <tr>
                  <th className="px-3 py-2 text-left">{t('col_date')}</th>
                  <th className="px-3 py-2 text-left">{t('cust_bal_operation')}</th>
                  <th className="px-3 py-2 text-right">{t('col_amount')}</th>
                  <th className="px-3 py-2 text-left">{t('col_note')}</th>
                  <th className="px-3 py-2 text-left">{t('col_employee')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data.transactions.map(x => (
                  <tr key={x.id}>
                    <td className="px-3 py-2 text-text-muted whitespace-nowrap">{fmtDT(x.createdAt)}</td>
                    <td className="px-3 py-2 text-text-primary">{t(TX_LABEL[x.type] || x.type)}{x.method ? <span className="text-text-muted"> · {t(METHOD_LABEL[x.method] || x.method)}</span> : null}</td>
                    <td className={`px-3 py-2 text-right font-bold whitespace-nowrap ${x.amount >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>{x.amount > 0 ? '+' : ''}{fmt(x.amount)}</td>
                    <td className="px-3 py-2 text-text-secondary">{x.note}{x.shopName ? <span className="text-text-muted"> · {x.shopName}</span> : null}</td>
                    <td className="px-3 py-2 text-text-secondary">{x.createdByName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ===================== QARZNI TO'LASH (umumiy) =====================
export const DebtPayPanel = ({ customer, totalDebt, selectedShopId, onPaid }) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [source, setSource] = useState('cash')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [saving, setSaving] = useState(false)
  const balance = customer.balance || 0
  if (totalDebt <= 0) return null

  const submit = async () => {
    setErr(''); setOk('')
    const amt = Math.round(Number(amount))
    if (!(amt > 0)) return setErr(t('cust_bal_err_amount'))
    if (amt > totalDebt) return setErr(t('cust_debt_err_over', { n: fmt(totalDebt) }))
    if (source === 'balance' && amt > balance) return setErr(t('cust_bal_err_low', { n: fmt(balance) }))
    setSaving(true)
    try {
      const r = await payCustomerDebt(customer.id, { amount: amt, source, shopId: selectedShopId })
      setOk(t('cust_debt_paid_ok', { n: fmt(r.paid), s: r.sales.length }))
      setAmount(''); setOpen(false)
      await onPaid()
    } catch (e) { setErr(errText(e)) } finally { setSaving(false) }
  }

  return (
    <div className="bg-accent-red/5 border border-accent-red/30 rounded-2xl p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('cust_debt_total')}</p>
          <p className="text-2xl font-syne font-extrabold text-accent-red">{fmt(totalDebt)} {t('unit_som')}</p>
        </div>
        {!open && (
          <button onClick={() => { setOpen(true); setAmount(String(Math.round(totalDebt))); setErr('') }}
            className="px-4 py-2 rounded-xl bg-accent-red text-white text-xs font-bold">{t('cust_debt_pay_all')}</button>
        )}
      </div>
      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
          <div>
            <label className={labelCls}>{t('col_amount')}</label>
            <input type="number" autoFocus value={amount} onChange={e => setAmount(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t('cust_debt_source')}</label>
            <select value={source} onChange={e => setSource(e.target.value)} className={inputCls}>
              <option value="cash">{t('pay_cash')}</option>
              <option value="card">{t('pay_card')}</option>
              <option value="transfer">{t('pay_transfer')}</option>
              {balance > 0 && <option value="balance">{t('cust_debt_from_balance', { n: fmt(balance) })}</option>}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl bg-bg-tertiary border border-border text-xs font-bold text-text-muted">{t('cancel')}</button>
            <button disabled={saving} onClick={submit} className="flex-1 py-2.5 rounded-xl bg-accent-red text-white text-xs font-bold disabled:opacity-50">{t('cust_inst_accept')}</button>
          </div>
        </div>
      )}
      {open && <p className="text-[11px] text-text-muted">{t('cust_debt_fifo_hint')}</p>}
      {err && <p className="text-sm text-accent-red">{err}</p>}
      {ok && <p className="text-sm text-accent-green flex items-center gap-1.5"><CheckCircle size={14} />{ok}</p>}
    </div>
  )
}
