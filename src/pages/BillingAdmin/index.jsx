import { useState, useEffect } from 'react'
import { Crown, Loader2, Plus, Save, CheckCircle2 } from 'lucide-react'
import {
  getBillingAdmin, saveBillingPlan, saveBillingAddon, saveBillingSettings, saveBillingTenant,
  getBillingAdminInvoices, markBillingInvoicePaid,
} from '../../api/billingService'
import { useBillingStore } from '../../store/billingStore'

const fmt = (n) => Math.round(n ?? 0).toLocaleString('uz-UZ')
const fmtDate = (s) => s ? new Date(s).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
const toInput = (s) => s ? new Date(s).toISOString().slice(0, 10) : ''
const TABS = [['plans', 'Tariflar'], ['addons', "Qo'shimchalar"], ['tenants', 'Mijozlar'], ['invoices', "To'lovlar"], ['settings', 'Sozlamalar']]
const PROVIDERS = { payme: 'Payme', click: 'Click', uzum: 'Uzum Bank' }
const TENANT_STATUS = { trial: 'Sinov', active: 'Pullik', free: 'Cheklovsiz (bepul)' }
const STATE = { free: 'Cheklovsiz', trial: 'Sinov', active: 'Faol', grace: 'Imtiyoz', expired: 'Tugagan', none: '—' }

const inputCls = 'w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-red'
const Field = ({ label, children, className = '' }) => (
  <label className={`block ${className}`}><span className="text-xs text-text-muted mb-1 block">{label}</span>{children}</label>
)
const SaveBtn = ({ busy, onClick, label = 'Saqlash' }) => (
  <button disabled={busy} onClick={onClick} className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent-red text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50">
    {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {label}
  </button>
)
const numOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v))

const PlanCard = ({ plan, features, onSave, isNew }) => {
  const [f, setF] = useState(plan)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const save = async () => {
    setBusy(true); setMsg('')
    try {
      await onSave(f.code, { ...f, priceMonth: Number(f.priceMonth), maxShops: numOrNull(f.maxShops), maxEmployees: numOrNull(f.maxEmployees), sort: Number(f.sort) || 0 })
      setMsg('Saqlandi')
    } catch (err) { setMsg(err?.response?.data?.error || 'Xatolik') } finally { setBusy(false) }
  }
  return (
    <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-5 space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Kod (o'zgarmaydi)"><input className={inputCls} value={f.code} disabled={!isNew} onChange={e => set('code', e.target.value.toLowerCase())} placeholder="masalan: econom" /></Field>
        <Field label="Nomi"><input className={inputCls} value={f.name} onChange={e => set('name', e.target.value)} /></Field>
        <Field label="Narxi (so'm / oy)"><input type="number" min="0" className={inputCls} value={f.priceMonth} onChange={e => set('priceMonth', e.target.value)} /></Field>
        <Field label="Tavsif" className="sm:col-span-3"><input className={inputCls} value={f.description} onChange={e => set('description', e.target.value)} /></Field>
        <Field label="Do'konlar soni (bo'sh = cheksiz)"><input type="number" min="1" className={inputCls} value={f.maxShops ?? ''} onChange={e => set('maxShops', e.target.value)} /></Field>
        <Field label="Xodimlar soni (bo'sh = cheksiz)"><input type="number" min="1" className={inputCls} value={f.maxEmployees ?? ''} onChange={e => set('maxEmployees', e.target.value)} /></Field>
        <Field label="Tartib"><input type="number" min="0" className={inputCls} value={f.sort} onChange={e => set('sort', e.target.value)} /></Field>
      </div>
      <div>
        <p className="text-xs text-text-muted mb-1.5">Tarifga kiradigan xizmatlar (asosiy bo'limlar — kassa, ombor, kirim, mijozlar, nasiya, hisobotlar — har doim kiradi)</p>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {features.map(ft => (
            <label key={ft.key} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={f.features.includes(ft.key)}
                onChange={e => set('features', e.target.checked ? [...f.features, ft.key] : f.features.filter(k => k !== ft.key))} />
              {ft.label}
            </label>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.popular} onChange={e => set('popular', e.target.checked)} /> "Mashhur" belgisi</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isActive} onChange={e => set('isActive', e.target.checked)} /> Sotuvda (faol)</label>
        <div className="ml-auto flex items-center gap-2">
          {msg && <span className={`text-xs ${msg === 'Saqlandi' ? 'text-accent-green' : 'text-accent-red'}`}>{msg}</span>}
          <SaveBtn busy={busy} onClick={save} />
        </div>
      </div>
    </div>
  )
}

const AddonCard = ({ addon, plans, onSave }) => {
  const [f, setF] = useState(addon)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const allPlans = f.plans === null
  const save = async () => {
    setBusy(true); setMsg('')
    try { await onSave(f.code, { ...f, priceMonth: Number(f.priceMonth) }); setMsg('Saqlandi') }
    catch (err) { setMsg(err?.response?.data?.error || 'Xatolik') } finally { setBusy(false) }
  }
  return (
    <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-5 space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Nomi"><input className={inputCls} value={f.name} onChange={e => set('name', e.target.value)} /></Field>
        <Field label="Narxi (so'm / oy)"><input type="number" min="0" className={inputCls} value={f.priceMonth} onChange={e => set('priceMonth', e.target.value)} /></Field>
        <Field label="Turi"><input className={inputCls} disabled value={f.kind === 'shop' ? "Qo'shimcha do'kon (dona)" : 'Xizmat'} /></Field>
        <Field label="Tavsif" className="sm:col-span-3"><input className={inputCls} value={f.description} onChange={e => set('description', e.target.value)} /></Field>
      </div>
      <div>
        <p className="text-xs text-text-muted mb-1.5">Qaysi tariflarga qo'shish mumkin</p>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={allPlans} onChange={e => set('plans', e.target.checked ? null : [])} /> Hammasiga</label>
          {!allPlans && plans.map(p => (
            <label key={p.code} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={f.plans.includes(p.code)} onChange={e => set('plans', e.target.checked ? [...f.plans, p.code] : f.plans.filter(c => c !== p.code))} /> {p.name}
            </label>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isActive} onChange={e => set('isActive', e.target.checked)} /> Sotuvda (faol)</label>
        <div className="ml-auto flex items-center gap-2">
          {msg && <span className={`text-xs ${msg === 'Saqlandi' ? 'text-accent-green' : 'text-accent-red'}`}>{msg}</span>}
          <SaveBtn busy={busy} onClick={save} />
        </div>
      </div>
    </div>
  )
}

const TenantRow = ({ t, plans, addons, onSave }) => {
  const [f, setF] = useState({ ...t, trialUntil: toInput(t.trialUntil), paidUntil: toInput(t.paidUntil) })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const addMonths = (n) => {
    const base = f.paidUntil && new Date(f.paidUntil) > new Date() ? new Date(f.paidUntil) : new Date()
    base.setMonth(base.getMonth() + n)
    set('paidUntil', toInput(base.toISOString()))
  }
  const save = async () => {
    setBusy(true); setMsg('')
    try {
      await onSave(t.slug, { name: f.name, phone: f.phone, note: f.note, status: f.status, plan: f.plan, extraShops: Number(f.extraShops) || 0, addons: f.addons,
        trialUntil: f.trialUntil ? new Date(f.trialUntil + 'T23:59:59').toISOString() : null,
        paidUntil: f.paidUntil ? new Date(f.paidUntil + 'T23:59:59').toISOString() : null })
      setMsg('Saqlandi')
    } catch (err) { setMsg(err?.response?.data?.error || 'Xatolik') } finally { setBusy(false) }
  }
  return (
    <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-5 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-bold text-text-primary">{t.slug}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-bg-tertiary text-text-secondary">{STATE[t.state] || t.state}{t.daysLeft != null && t.state !== 'free' ? ` · ${t.daysLeft} kun` : ''}</span>
        <span className="text-xs text-text-muted ml-auto">Qo'shilgan: {fmtDate(t.createdAt)}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="Korxona nomi"><input className={inputCls} value={f.name} onChange={e => set('name', e.target.value)} /></Field>
        <Field label="Telefon"><input className={inputCls} value={f.phone} onChange={e => set('phone', e.target.value)} /></Field>
        <Field label="Holat">
          <select className={inputCls} value={f.status} onChange={e => set('status', e.target.value)}>
            {Object.entries(TENANT_STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </Field>
        <Field label="Tarif">
          <select className={inputCls} value={f.plan || ''} onChange={e => set('plan', e.target.value)}>
            {plans.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Sinov tugashi"><input type="date" className={inputCls} value={f.trialUntil} onChange={e => set('trialUntil', e.target.value)} /></Field>
        <Field label="To'langan muddat">
          <input type="date" className={inputCls} value={f.paidUntil} onChange={e => set('paidUntil', e.target.value)} />
        </Field>
        <Field label="Qo'shimcha do'kon"><input type="number" min="0" className={inputCls} value={f.extraShops} onChange={e => set('extraShops', e.target.value)} /></Field>
        <div className="flex items-end gap-1">
          {[1, 12].map(n => <button key={n} type="button" onClick={() => addMonths(n)} className="px-3 py-2 border border-border rounded-xl text-xs font-bold hover:bg-bg-tertiary">+{n} oy</button>)}
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        {addons.filter(a => a.kind === 'feature').map(a => (
          <label key={a.code} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.addons.includes(a.code)} onChange={e => set('addons', e.target.checked ? [...f.addons, a.code] : f.addons.filter(c => c !== a.code))} /> {a.name}
          </label>
        ))}
      </div>
      <Field label="Izoh"><input className={inputCls} value={f.note} onChange={e => set('note', e.target.value)} /></Field>
      <div className="flex items-center justify-end gap-2">
        {msg && <span className={`text-xs ${msg === 'Saqlandi' ? 'text-accent-green' : 'text-accent-red'}`}>{msg}</span>}
        <SaveBtn busy={busy} onClick={save} />
      </div>
    </div>
  )
}

const SettingsForm = ({ settings, plans, onSave }) => {
  const [f, setF] = useState(settings)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const setP = (p, k, v) => setF(s => ({ ...s, [p]: { ...s[p], [k]: v } }))
  const save = async () => {
    setBusy(true); setMsg('')
    try { const d = await onSave(f); setF(d.settings); setMsg('Saqlandi') } catch (err) { setMsg(err?.response?.data?.error || 'Xatolik') } finally { setBusy(false) }
  }
  const secret = (p, k, label) => (
    <Field label={label}>
      <input type="password" autoComplete="new-password" className={inputCls} value={f[p][k]} placeholder={f[p][k + 'Set'] ? "saqlangan — o'zgartirish uchun yangisini kiriting" : ''} onChange={e => setP(p, k, e.target.value)} />
    </Field>
  )
  const plain = (p, k, label) => <Field label={label}><input className={inputCls} value={f[p][k]} onChange={e => setP(p, k, e.target.value)} /></Field>
  const head = (p) => (
    <div className="flex flex-wrap items-center gap-4">
      <p className="font-bold text-text-primary">{PROVIDERS[p]}</p>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f[p].enabled} onChange={e => setP(p, 'enabled', e.target.checked)} /> Yoqilgan</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f[p].test} onChange={e => setP(p, 'test', e.target.checked)} /> Sinov rejimi</label>
    </div>
  )
  const origin = import.meta.env.VITE_API_URL || window.location.origin
  return (
    <div className="space-y-4">
      <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-5 grid gap-3 sm:grid-cols-5">
        <Field label="Sinov muddati (kun)"><input type="number" min="0" className={inputCls} value={f.trialDays} onChange={e => set('trialDays', e.target.value)} /></Field>
        <Field label="Sinovdagi tarif">
          <select className={inputCls} value={f.trialPlan} onChange={e => set('trialPlan', e.target.value)}>
            {plans.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Imtiyoz (kun)"><input type="number" min="0" className={inputCls} value={f.graceDays} onChange={e => set('graceDays', e.target.value)} /></Field>
        <Field label="Ogohlantirish (kun oldin)"><input type="number" min="0" className={inputCls} value={f.warnDays} onChange={e => set('warnDays', e.target.value)} /></Field>
        <Field label="Yillik chegirma (%)"><input type="number" min="0" max="90" className={inputCls} value={f.yearlyDiscountPct} onChange={e => set('yearlyDiscountPct', e.target.value)} /></Field>
      </div>
      <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-5 space-y-3">
        {head('payme')}
        <div className="grid gap-3 sm:grid-cols-3">
          {plain('payme', 'merchantId', 'Merchant ID')}
          {secret('payme', 'key', 'Kalit (ishchi)')}
          {secret('payme', 'testKey', 'Kalit (sinov)')}
        </div>
        <p className="text-xs text-text-muted">Kabinetdagi manzil: <code>{origin}/api/billing/pay/payme</code> · hisob maydoni: <code>order_id</code></p>
      </div>
      <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-5 space-y-3">
        {head('click')}
        <div className="grid gap-3 sm:grid-cols-4">
          {plain('click', 'serviceId', 'Service ID')}
          {plain('click', 'merchantId', 'Merchant ID')}
          {plain('click', 'merchantUserId', 'Merchant user ID')}
          {secret('click', 'secretKey', 'Secret key')}
        </div>
        <p className="text-xs text-text-muted">Prepare: <code>{origin}/api/billing/pay/click/prepare</code> · Complete: <code>{origin}/api/billing/pay/click/complete</code></p>
      </div>
      <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-5 space-y-3">
        {head('uzum')}
        <div className="grid gap-3 sm:grid-cols-3">
          {plain('uzum', 'serviceId', 'Service ID')}
          {plain('uzum', 'login', 'Login')}
          {secret('uzum', 'password', 'Parol')}
          <Field label="To'lov havolasi shabloni" className="sm:col-span-3"><input className={inputCls} value={f.uzum.linkTemplate} onChange={e => setP('uzum', 'linkTemplate', e.target.value)} /></Field>
        </div>
        <p className="text-xs text-text-muted">Manzil: <code>{origin}/api/billing/pay/uzum/</code>{'{check|create|confirm|reverse|status}'}</p>
      </div>
      <div className="flex items-center justify-end gap-2">
        {msg && <span className={`text-xs ${msg === 'Saqlandi' ? 'text-accent-green' : 'text-accent-red'}`}>{msg}</span>}
        <SaveBtn busy={busy} onClick={save} />
      </div>
    </div>
  )
}

const BillingAdmin = () => {
  const reloadStatus = useBillingStore(s => s.load)
  const [tab, setTab] = useState('plans')
  const [data, setData] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [error, setError] = useState('')
  const [newPlan, setNewPlan] = useState(null)
  const [busyPay, setBusyPay] = useState(null)

  const load = async () => {
    try { setData(await getBillingAdmin()) } catch (err) { setError(err?.response?.data?.error || 'Xatolik yuz berdi') }
  }
  useEffect(() => { load() }, [])
  useEffect(() => { if (tab === 'invoices') getBillingAdminInvoices().then(setInvoices).catch(() => {}) }, [tab])

  const after = async (d) => { setData(d); await reloadStatus(); return d }
  const savePlan = async (code, body) => { await after(await saveBillingPlan(code, body)); setNewPlan(null) }
  const saveAddon = async (code, body) => after(await saveBillingAddon(code, body))
  const saveSettings = async (body) => after(await saveBillingSettings(body))
  const saveTenant = async (slug, body) => after(await saveBillingTenant(slug, body))
  const markPaid = async (id) => {
    if (!window.confirm("Bu hisobni to'langan deb belgilaysizmi? Mijoz obunasi uzayadi.")) return
    setBusyPay(id)
    try { setInvoices(await markBillingInvoicePaid(id)); await load(); await reloadStatus() }
    catch (err) { setError(err?.response?.data?.error || 'Xatolik') } finally { setBusyPay(null) }
  }

  if (!data) return error ? <p className="text-sm text-accent-red">{error}</p> : <div className="flex justify-center py-20"><Loader2 className="animate-spin text-text-muted" /></div>

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="font-syne font-bold text-2xl sm:text-3xl text-text-primary flex items-center gap-2"><Crown size={26} /> SICRM boshqaruvi</h1>
      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${tab === k ? 'bg-accent-red text-white' : 'bg-bg-secondary border border-border text-text-secondary hover:bg-bg-tertiary'}`}>{l}</button>
        ))}
      </div>
      {error && <p className="text-sm text-accent-red">{error}</p>}

      {tab === 'plans' && (
        <div className="space-y-3">
          {data.plans.map(p => <PlanCard key={p.code} plan={p} features={data.features} onSave={savePlan} />)}
          {newPlan
            ? <PlanCard plan={newPlan} features={data.features} onSave={savePlan} isNew />
            : (
              <button onClick={() => setNewPlan({ code: '', name: '', description: '', priceMonth: 0, maxShops: 1, maxEmployees: 5, features: [], sort: data.plans.length + 1, popular: false, isActive: true })}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-border rounded-xl text-sm font-bold hover:bg-bg-tertiary"><Plus size={14} /> Yangi tarif</button>
            )}
        </div>
      )}

      {tab === 'addons' && (
        <div className="space-y-3">
          {data.addons.map(a => <AddonCard key={a.code} addon={a} plans={data.plans} onSave={saveAddon} />)}
        </div>
      )}

      {tab === 'tenants' && (
        <div className="space-y-3">
          {data.tenants.map(t => <TenantRow key={t.slug} t={t} plans={data.plans} addons={data.addons} onSave={saveTenant} />)}
        </div>
      )}

      {tab === 'invoices' && (
        <div className="bg-bg-secondary border border-border rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-text-muted text-left">
              <th className="px-3 sm:px-4 py-2">#</th><th className="px-3 sm:px-4 py-2">Sana</th><th className="px-3 sm:px-4 py-2">Mijoz</th><th className="px-3 sm:px-4 py-2">Tarif</th>
              <th className="px-3 sm:px-4 py-2">Summa</th><th className="px-3 sm:px-4 py-2">Tizim</th><th className="px-3 sm:px-4 py-2">Holat</th><th />
            </tr></thead>
            <tbody>
              {invoices.map(i => (
                <tr key={i.id} className="border-t border-border">
                  <td className="px-3 sm:px-4 py-2.5">{i.id}</td>
                  <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap">{fmtDate(i.createdAt)}</td>
                  <td className="px-3 sm:px-4 py-2.5">{i.tenant}</td>
                  <td className="px-3 sm:px-4 py-2.5">{data.plans.find(p => p.code === i.plan)?.name || i.plan} · {i.period === 'year' ? 'yillik' : 'oylik'}{i.extraShops ? ` · +${i.extraShops} do'kon` : ''}</td>
                  <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap">{fmt(i.amount)} so'm</td>
                  <td className="px-3 sm:px-4 py-2.5">{PROVIDERS[i.provider] || i.provider}{i.test ? ' (sinov)' : ''}</td>
                  <td className="px-3 sm:px-4 py-2.5">{i.status === 'paid' ? <span className="text-accent-green font-bold flex items-center gap-1"><CheckCircle2 size={13} /> {fmtDate(i.paidAt)}</span> : i.status === 'pending' ? 'Kutilmoqda' : 'Bekor'}</td>
                  <td className="px-3 sm:px-4 py-2.5 text-right">
                    {i.status === 'pending' && (
                      <button disabled={busyPay === i.id} onClick={() => markPaid(i.id)} className="px-3 py-1 border border-border rounded-lg text-xs font-bold hover:bg-bg-tertiary whitespace-nowrap disabled:opacity-50">To'landi deb belgilash</button>
                    )}
                  </td>
                </tr>
              ))}
              {!invoices.length && <tr><td colSpan={8} className="px-4 py-6 text-center text-text-muted text-sm">Hali to'lov yo'q</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'settings' && <SettingsForm settings={data.settings} plans={data.plans} onSave={saveSettings} />}
    </div>
  )
}

export default BillingAdmin
