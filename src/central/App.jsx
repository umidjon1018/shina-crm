import { useState, useEffect, useCallback } from 'react'
import { Building2, Server, Plus, RefreshCw, LogOut, X, Loader2, ExternalLink, Copy, Check, History, ShieldCheck, Smartphone } from 'lucide-react'

// SICRM markaziy boshqaruv paneli (admin.sicrm.uz) — backend central/index.js (pm2 sicrm-central)
const TOKEN_KEY = 'sicrm_central_token'
const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) } catch { return null } }
const setToken = (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY) } catch {} }

const api = async (path, { method = 'GET', body } = {}) => {
  const r = await fetch(`/api/central${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const d = await r.json().catch(() => ({}))
  if (r.status === 401 && d.code === 'AUTH') { setToken(null); window.dispatchEvent(new Event('central-logout')) }
  if (!r.ok) throw Object.assign(new Error(d.error || 'Xatolik'), { data: d })
  return d
}

// Mobil ilova (SICRM-App) ichida — kompaniya kodi ekraniga qaytish
const IN_APP = navigator.userAgent.includes('SICRM-App')
const changeCompany = () => {
  location.href = (/iPhone|iPad|iPod/.test(navigator.userAgent) ? 'capacitor://localhost' : 'https://localhost') + '/index.html?change=1'
}

const fmt = (v) => Math.round(Number(v) || 0).toLocaleString('ru-RU').replace(/,/g, ' ')
const mb = (b) => `${Math.round((Number(b) || 0) / 1048576)} MB`
const ddmm = (d) => (d ? new Date(d).toLocaleDateString('ru-RU', { timeZone: 'Asia/Tashkent' }) : '—')
const ago = (d) => {
  if (!d) return '—'
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 60) return `${Math.max(1, m)} daq oldin`
  if (m < 1440) return `${Math.round(m / 60)} soat oldin`
  return `${Math.round(m / 1440)} kun oldin`
}
const daysLeft = (d) => (d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null)

const STATE = {
  free: { text: 'Cheklovsiz', cls: 'bg-sky-500/15 text-sky-300' },
  active: { text: "To'langan", cls: 'bg-emerald-500/15 text-emerald-300' },
  trial: { text: 'Sinov', cls: 'bg-amber-500/15 text-amber-300' },
  expired: { text: 'Tugagan', cls: 'bg-red-500/15 text-red-300' },
  none: { text: "Obuna yo'q", cls: 'bg-gray-500/15 text-gray-300' },
}
const ACTIONS = {
  login: 'Panelga kirdi', login_failed: "Noto'g'ri parol", billing_trial: 'Sinov uzaytirildi', billing_paid: "To'lov qayd etildi",
  billing_free: 'Cheklovsiz qilindi', billing_stop: "To'xtatildi", billing_note: 'Izoh', restart: 'Qayta ishga tushirildi',
  tenant_create: 'Kompaniya yaratildi', tenant_create_failed: 'Kompaniya yaratilmadi', alias: 'Ilova kodi',
}

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={onClose}>
    <div className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-[var(--c-card)] border border-[var(--c-line)] p-5" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <button onClick={onClose} className="p-1 text-[var(--c-hint)]"><X size={20} /></button>
      </div>
      {children}
    </div>
  </div>
)
const Field = ({ label, hint, children }) => (
  <label className="block mb-3">
    <span className="block text-[13px] text-[var(--c-hint)] mb-1">{label}</span>
    {children}
    {hint && <span className="block text-[12px] text-[var(--c-hint)] mt-1">{hint}</span>}
  </label>
)
const ErrorText = ({ text }) => (text ? <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-[13px] text-red-300 whitespace-pre-wrap">{text}</div> : null)

// ─── Kirish ───
const Login = ({ onDone }) => {
  const [form, setForm] = useState({ username: '', password: '' })
  const [challenge, setChallenge] = useState(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      if (!challenge) {
        const d = await api('/login', { method: 'POST', body: form })
        setChallenge(d.challenge)
      } else {
        const d = await api('/verify', { method: 'POST', body: { challenge, code: code.trim() } })
        setToken(d.token)
        onDone()
      }
    } catch (e2) {
      setErr(e2.message)
      if (/qaytadan kiring/i.test(e2.message)) { setChallenge(null); setCode('') }
    } finally { setBusy(false) }
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-[var(--c-card)] border border-[var(--c-line)] p-6">
        <div className="flex items-center gap-2 mb-1"><ShieldCheck className="text-[var(--c-accent)]" size={22} /><h1 className="text-xl font-bold">SICRM boshqaruv</h1></div>
        <p className="text-[13px] text-[var(--c-hint)] mb-5">{challenge ? 'Kod SICRM xizmat botiga yuborildi (5 daqiqa amal qiladi)' : 'Faqat SICRM egasi uchun'}</p>
        <ErrorText text={err} />
        {!challenge ? (
          <>
            <Field label="Login"><input autoComplete="username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></Field>
            <Field label="Parol"><input type="password" autoComplete="current-password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></Field>
          </>
        ) : (
          <Field label="Telegram'dagi 6 xonali kod">
            <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} className="text-center tracking-[6px] text-lg" />
          </Field>
        )}
        <button disabled={busy} className="c-btn c-btn-primary w-full mt-2">{busy ? <Loader2 size={16} className="animate-spin" /> : challenge ? 'Kirish' : 'Davom etish'}</button>
        {challenge && <button type="button" onClick={() => { setChallenge(null); setCode(''); setErr('') }} className="w-full mt-3 text-[13px] text-[var(--c-hint)]">Orqaga</button>}
        {IN_APP && <button type="button" onClick={changeCompany} className="w-full mt-3 text-[13px] text-[var(--c-hint)]">Kompaniyani almashtirish</button>}
      </form>
    </div>
  )
}

// ─── Obuna amallari ───
const BillingModal = ({ t, onClose, onSaved }) => {
  const [plans, setPlans] = useState([])
  const [mode, setMode] = useState('trial')
  const [days, setDays] = useState(7)
  const [months, setMonths] = useState(1)
  const [plan, setPlan] = useState(t.billing?.plan || 'pro')
  const [note, setNote] = useState(t.billing?.note || '')
  const [phone, setPhone] = useState(t.billing?.phone || '')
  const [alias, setAlias] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  useEffect(() => { api(`/tenants/${t.code}/plans`).then(setPlans).catch(() => {}) }, [t.code])
  const act = async (body, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return
    setBusy(true); setErr('')
    try {
      if (body.alias !== undefined) await api(`/tenants/${t.code}/alias`, { method: 'POST', body })
      else await api(`/tenants/${t.code}/billing`, { method: 'POST', body })
      onSaved(); onClose()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  const tabs = [['trial', 'Sinov'], ['paid', "To'lov"], ['other', 'Boshqa']]
  return (
    <Modal title={`${t.name} — obuna`} onClose={onClose}>
      <ErrorText text={err} />
      <div className="flex gap-1 mb-4 rounded-xl bg-[var(--c-card2)] p-1">
        {tabs.map(([k, l]) => <button key={k} onClick={() => setMode(k)} className={`flex-1 rounded-lg py-2 text-[13px] font-medium ${mode === k ? 'bg-[var(--c-accent)] text-white' : 'text-[var(--c-hint)]'}`}>{l}</button>)}
      </div>
      {mode === 'trial' && (
        <>
          <Field label="Sinovni necha kunga uzaytirish" hint={t.billing?.trialUntil ? `Hozir: ${ddmm(t.billing.trialUntil)} gacha` : null}>
            <input type="number" min={1} max={90} value={days} onChange={e => setDays(e.target.value)} />
          </Field>
          <button disabled={busy} onClick={() => act({ action: 'trial', days: Number(days) })} className="c-btn c-btn-primary w-full">Uzaytirish</button>
        </>
      )}
      {mode === 'paid' && (
        <>
          <Field label="Tarif">
            <select value={plan} onChange={e => setPlan(e.target.value)}>{plans.map(p => <option key={p.code} value={p.code}>{p.name} — {fmt(p.price_month)} so'm/oy</option>)}</select>
          </Field>
          <Field label="Necha oy to'landi" hint={t.billing?.paidUntil ? `Hozir: ${ddmm(t.billing.paidUntil)} gacha — ustiga qo'shiladi` : null}>
            <input type="number" min={1} max={36} value={months} onChange={e => setMonths(e.target.value)} />
          </Field>
          <button disabled={busy} onClick={() => act({ action: 'paid', months: Number(months), plan })} className="c-btn c-btn-primary w-full">To'lovni qayd etish</button>
        </>
      )}
      {mode === 'other' && (
        <div className="space-y-4">
          <div>
            <Field label="Telefon"><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+998 ..." /></Field>
            <Field label="Izoh"><textarea rows={2} value={note} onChange={e => setNote(e.target.value)} /></Field>
            <button disabled={busy} onClick={() => act({ action: 'note', note, phone })} className="c-btn c-btn-ghost w-full">Saqlash</button>
          </div>
          {!t.main && (
            <div>
              <Field label="Mobil ilova kodi (taxallus)" hint={`Hozir: ${[t.code, ...t.aliases].join(', ')}`}>
                <input value={alias} onChange={e => setAlias(e.target.value.toLowerCase())} placeholder="masalan ceramix" />
              </Field>
              <button disabled={busy || !alias} onClick={() => act({ alias })} className="c-btn c-btn-ghost w-full">Qo'shish</button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--c-line)]">
            <button disabled={busy} onClick={() => act({ action: 'free' }, `${t.name}: barcha bo'limlar cheklovsiz va muddatsiz ochilsinmi?`)} className="c-btn c-btn-ghost">Cheklovsiz</button>
            {!t.main && <button disabled={busy} onClick={() => act({ action: 'stop' }, `${t.name} to'xtatilsinmi? Ilova faqat ko'rish rejimiga o'tadi (ma'lumot o'chmaydi).`)} className="c-btn c-btn-ghost text-red-300">To'xtatish</button>}
          </div>
        </div>
      )}
    </Modal>
  )
}

// ─── Yangi kompaniya ───
const CreateModal = ({ onClose, onSaved }) => {
  const [f, setF] = useState({ code: '', name: '', admin: 'admin', alias: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(null)
  const [copied, setCopied] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try { const d = await api('/tenants', { method: 'POST', body: f }); setDone(d); onSaved() }
    catch (e2) { setErr([e2.message, e2.data?.log].filter(Boolean).join('\n')) }
    finally { setBusy(false) }
  }
  if (done) {
    return (
      <Modal title="Kompaniya yaratildi" onClose={onClose}>
        <div className="space-y-2 text-[14px]">
          <div><span className="text-[var(--c-hint)]">Manzil: </span><a href={done.url} target="_blank" rel="noreferrer" className="text-sky-300">{done.url}</a></div>
          <div><span className="text-[var(--c-hint)]">Admin login: </span><b>{done.admin}</b></div>
          {done.password && (
            <div className="rounded-xl bg-[var(--c-card2)] border border-amber-500/30 p-3">
              <div className="text-[13px] text-amber-300 mb-1">Admin paroli — faqat hozir ko'rinadi, mijozga bering va kirgach almashtirsin</div>
              <div className="flex items-center justify-between gap-2">
                <code className="text-lg">{done.password}</code>
                <button onClick={() => { navigator.clipboard?.writeText(done.password); setCopied(true) }} className="c-btn c-btn-ghost">{copied ? <Check size={16} /> : <Copy size={16} />}</button>
              </div>
            </div>
          )}
          <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-black/40 p-2 text-[11px] text-[var(--c-hint)] whitespace-pre-wrap">{done.log}</pre>
        </div>
        <button onClick={onClose} className="c-btn c-btn-primary w-full mt-4">Yopish</button>
      </Modal>
    )
  }
  return (
    <Modal title="Yangi kompaniya" onClose={busy ? () => {} : onClose}>
      <form onSubmit={submit}>
        <ErrorText text={err} />
        <Field label="Kompaniya nomi"><input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Masalan: Alfa Shina" /></Field>
        <Field label="Domen kodi" hint={f.code ? `Manzil: https://${f.code}.sicrm.uz — avval pscloud.uz'da "${f.code}" A → 167.233.169.118 yozuvini qo'shing` : "Qisqa, lotin harflarida (masalan alfa)"}>
          <input value={f.code} onChange={e => setF({ ...f, code: e.target.value.toLowerCase().trim() })} placeholder="alfa" />
        </Field>
        <Field label="Mobil ilova kodi (ixtiyoriy)" hint="Ilovada domen kodi o'rniga yoziladigan nom (masalan alfashina)">
          <input value={f.alias} onChange={e => setF({ ...f, alias: e.target.value.toLowerCase().trim() })} />
        </Field>
        <Field label="Admin login"><input value={f.admin} onChange={e => setF({ ...f, admin: e.target.value.trim() })} /></Field>
        <p className="text-[12px] text-[var(--c-hint)] mb-3">Yaratiladi: alohida baza, server jarayoni, SSL, admin hisobi, 7 kunlik sinov. 1 daqiqagacha davom etadi.</p>
        <button disabled={busy || !f.code || !f.name || !f.admin} className="c-btn c-btn-primary w-full">{busy ? <><Loader2 size={16} className="animate-spin" /> Yaratilmoqda...</> : 'Yaratish'}</button>
      </form>
    </Modal>
  )
}

// ─── Kompaniya kartasi ───
const TenantCard = ({ t, onBilling, onRestart }) => {
  const st = STATE[t.state] || STATE.none
  const until = t.state === 'trial' ? t.billing?.trialUntil : t.state === 'active' ? t.billing?.paidUntil : null
  const left = daysLeft(until)
  const proc = t.process
  return (
    <div className="rounded-2xl bg-[var(--c-card)] border border-[var(--c-line)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[17px] font-semibold truncate">{t.name}</h3>
            <span className={`rounded-md px-2 py-0.5 text-[12px] font-medium ${st.cls}`}>{st.text}{left !== null ? ` · ${left} kun` : ''}</span>
          </div>
          <a href={t.url} target="_blank" rel="noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-[13px] text-sky-300">{t.url.replace('https://', '')} <ExternalLink size={12} /></a>
          <div className="mt-0.5 flex items-center gap-1 text-[12px] text-[var(--c-hint)]"><Smartphone size={12} /> ilova kodi: {[...t.aliases, t.code].join(', ')}</div>
        </div>
        <div className={`shrink-0 text-right text-[12px] ${proc?.status === 'online' ? 'text-emerald-300' : 'text-red-300'}`}>
          ● {proc?.status || "jarayon yo'q"}
          {proc && <div className="text-[var(--c-hint)]">{mb(proc.memory)} · {proc.restarts} restart</div>}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
        {[["Do'kon", t.shops], ['Xodim', t.employees], ['Tovar', t.products], ['Mijoz', t.customers]].map(([l, v]) => (
          <div key={l} className="rounded-xl bg-[var(--c-card2)] py-2"><div className="text-[16px] font-semibold">{fmt(v)}</div><div className="text-[11px] text-[var(--c-hint)]">{l}</div></div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[13px]">
        <div className="text-[var(--c-hint)]">30 kun savdo</div><div className="text-right">{fmt(t.sales30.count)} ta · {fmt(t.sales30.sum)} so'm</div>
        <div className="text-[var(--c-hint)]">Oxirgi savdo</div><div className="text-right">{ago(t.sales30.last)}</div>
        <div className="text-[var(--c-hint)]">Oxirgi kirish</div><div className="text-right">{ago(t.lastLogin)}</div>
        <div className="text-[var(--c-hint)]">Tarif · baza</div><div className="text-right">{t.billing?.plan || '—'} · {mb(t.dbBytes)}</div>
        {t.billing?.phone && <><div className="text-[var(--c-hint)]">Telefon</div><div className="text-right">{t.billing.phone}</div></>}
      </div>
      {t.billing?.note && <div className="mt-2 rounded-lg bg-[var(--c-card2)] px-3 py-2 text-[13px] text-[var(--c-hint)]">{t.billing.note}</div>}
      <div className="mt-3 flex gap-2">
        <button onClick={() => onBilling(t)} className="c-btn c-btn-primary flex-1">Obuna</button>
        <button onClick={() => onRestart(t)} className="c-btn c-btn-ghost" title="Qayta ishga tushirish"><RefreshCw size={16} /></button>
      </div>
    </div>
  )
}

const Audit = () => {
  const [rows, setRows] = useState(null)
  useEffect(() => { api('/audit').then(setRows).catch(() => setRows([])) }, [])
  if (!rows) return <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-[var(--c-hint)]" /></div>
  return (
    <div className="rounded-2xl bg-[var(--c-card)] border border-[var(--c-line)] divide-y divide-[var(--c-line)]">
      {rows.length === 0 && <div className="p-4 text-[var(--c-hint)] text-[14px]">Yozuv yo'q</div>}
      {rows.map((r, i) => (
        <div key={i} className="px-4 py-2.5 text-[13px] flex flex-wrap gap-x-3">
          <span className="text-[var(--c-hint)]">{new Date(r.created_at).toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' })}</span>
          <span className={r.action.includes('fail') ? 'text-red-300' : ''}>{ACTIONS[r.action] || r.action}</span>
          {r.tenant && <span className="text-sky-300">{r.tenant}</span>}
          {r.admin && <span className="text-[var(--c-hint)]">{r.admin}</span>}
          {r.details && <span className="text-[var(--c-hint)] truncate max-w-full">{Object.entries(r.details).map(([k, v]) => `${k}: ${v}`).join(', ')}</span>}
        </div>
      ))}
    </div>
  )
}

// ─── Asosiy ───
export default function App() {
  const [authed, setAuthed] = useState(!!getToken())
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [tab, setTab] = useState('tenants')
  const [billing, setBilling] = useState(null)
  const [creating, setCreating] = useState(false)
  const load = useCallback(() => {
    setErr('')
    api('/tenants').then(setData).catch(e => setErr(e.message))
  }, [])
  useEffect(() => {
    const out = () => { setAuthed(false); setData(null) }
    window.addEventListener('central-logout', out)
    return () => window.removeEventListener('central-logout', out)
  }, [])
  useEffect(() => { if (authed) load() }, [authed, load])

  if (!authed) return <Login onDone={() => setAuthed(true)} />

  const restart = async (t) => {
    if (!window.confirm(`${t.name} server jarayoni qayta ishga tushirilsinmi? (bir necha soniya ishlamay qoladi)`)) return
    try { await api(`/tenants/${t.code}/restart`, { method: 'POST' }); load() } catch (e) { setErr(e.message) }
  }
  const tenants = data?.tenants || []
  const count = (s) => tenants.filter(t => t.state === s).length
  const srv = data?.server
  return (
    <div className="mx-auto max-w-5xl px-4 pb-10" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
      <header className="flex items-center justify-between gap-3 py-2">
        <div className="flex items-center gap-2"><ShieldCheck className="text-[var(--c-accent)]" size={22} /><h1 className="text-lg font-bold">SICRM boshqaruv</h1></div>
        <div className="flex gap-2">
          {IN_APP && <button onClick={changeCompany} className="c-btn c-btn-ghost" title="Kompaniyani almashtirish"><Smartphone size={16} /></button>}
          <button onClick={load} className="c-btn c-btn-ghost" title="Yangilash"><RefreshCw size={16} /></button>
          <button onClick={() => { setToken(null); setAuthed(false) }} className="c-btn c-btn-ghost" title="Chiqish"><LogOut size={16} /></button>
        </div>
      </header>

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[['Kompaniyalar', tenants.length], ["To'langan / cheklovsiz", count('active') + count('free')], ['Sinovda', count('trial')], ['Tugagan', count('expired')]].map(([l, v]) => (
          <div key={l} className="rounded-2xl bg-[var(--c-card)] border border-[var(--c-line)] p-3"><div className="text-2xl font-bold">{data ? v : '—'}</div><div className="text-[12px] text-[var(--c-hint)]">{l}</div></div>
        ))}
      </div>
      {srv && (
        <div className="mt-2 rounded-2xl bg-[var(--c-card)] border border-[var(--c-line)] px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px]">
          <span className="flex items-center gap-1.5 font-medium"><Server size={15} /> Server</span>
          <span>RAM: {mb(srv.memTotal - srv.memFree)} / {mb(srv.memTotal)}</span>
          <span>Yuklama: {srv.load.toFixed(2)}</span>
          <span className="text-[var(--c-hint)]">{srv.processes.map(p => `${p.name} ${p.status === 'online' ? '✓' : '✗'}`).join(' · ')}</span>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex gap-1 rounded-xl bg-[var(--c-card)] border border-[var(--c-line)] p-1">
          {[['tenants', 'Kompaniyalar', Building2], ['audit', 'Jurnal', History]].map(([k, l, I]) => (
            <button key={k} onClick={() => setTab(k)} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium ${tab === k ? 'bg-[var(--c-accent)] text-white' : 'text-[var(--c-hint)]'}`}><I size={15} />{l}</button>
          ))}
        </div>
        {tab === 'tenants' && <button onClick={() => setCreating(true)} className="c-btn c-btn-primary"><Plus size={16} /> Yangi kompaniya</button>}
      </div>

      <div className="mt-3">
        <ErrorText text={err} />
        {tab === 'audit' ? <Audit /> : !data ? (
          <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-[var(--c-hint)]" /></div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {tenants.map(t => <TenantCard key={t.code} t={t} onBilling={setBilling} onRestart={restart} />)}
          </div>
        )}
      </div>

      {billing && <BillingModal t={billing} onClose={() => setBilling(null)} onSaved={load} />}
      {creating && <CreateModal onClose={() => setCreating(false)} onSaved={load} />}
    </div>
  )
}
