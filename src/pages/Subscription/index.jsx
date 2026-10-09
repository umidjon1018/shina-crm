import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, Check, X, Store, Users, Plus, Minus, Loader2, ExternalLink, CheckCircle2, Crown, Clock } from 'lucide-react'
import { getBillingCatalog, getBillingQuote, createBillingInvoice, getBillingInvoices, getBillingInvoice } from '../../api/billingService'
import { useBillingStore } from '../../store/billingStore'
import { StackGuard } from '../../components/ui/Modal'

const fmt = (n) => Math.round(n ?? 0).toLocaleString('uz-UZ')
const fmtDate = (s) => s ? new Date(s).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
const PROVIDERS = { payme: 'Payme', click: 'Click', uzum: 'Uzum Bank' }
const STATE = {
  free: ['Cheklovsiz', 'text-accent-green bg-accent-green/10'],
  trial: ['Sinov muddati', 'text-accent-blue bg-accent-blue/10'],
  active: ['Faol', 'text-accent-green bg-accent-green/10'],
  grace: ["To'lov kutilmoqda", 'text-accent-orange bg-accent-orange/10'],
  expired: ['Muddati tugagan', 'text-accent-red bg-accent-red/10'],
  none: ['—', 'text-text-muted bg-bg-tertiary'],
}
const INV_STATUS = { pending: ['Kutilmoqda', 'text-accent-orange'], paid: ["To'langan", 'text-accent-green'], cancelled: ['Bekor', 'text-text-muted'], refunded: ['Qaytarilgan', 'text-text-muted'] }

const Subscription = () => {
  const loadStatus = useBillingStore(s => s.load)
  const liveLimits = useBillingStore(s => s.status?.limits)
  const [cat, setCat] = useState(null)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState('month')
  const [plan, setPlan] = useState(null)
  const [extraShops, setExtraShops] = useState(0)
  const [addons, setAddons] = useState([])
  const [quote, setQuote] = useState(null)
  const [paying, setPaying] = useState(null) // provider id
  const [invoice, setInvoice] = useState(null) // kutilayotgan to'lov
  const [invoices, setInvoices] = useState([])
  const pollRef = useRef(null)

  const load = async () => {
    try {
      const c = await getBillingCatalog()
      setCat(c)
      setPlan(p => p || c.current.plan || c.plans.find(x => x.popular)?.code || c.plans[0]?.code)
      setExtraShops(e => e || c.current.extraShops || 0)
      setAddons(a => a.length ? a : (c.current.addons || []))
      setInvoices(await getBillingInvoices())
    } catch (err) {
      setError(err?.response?.data?.error || 'Xatolik yuz berdi')
    }
  }
  useEffect(() => { load(); return () => clearInterval(pollRef.current) }, [])

  const shopAddon = cat?.addons.find(a => a.kind === 'shop')
  const shopAllowed = !!shopAddon && (!shopAddon.plans || shopAddon.plans.includes(plan))
  const featureAddons = (cat?.addons || []).filter(a => a.kind === 'feature' && (!a.plans || a.plans.includes(plan)))
  const selectedPlan = cat?.plans.find(p => p.code === plan)
  // Tarifda allaqachon bor xizmat qo'shimcha sifatida sotilmaydi
  const addonAvailable = (a) => !selectedPlan?.features.includes(a.feature)

  useEffect(() => {
    if (!plan || !cat) return
    const body = {
      plan, period,
      extraShops: shopAllowed ? extraShops : 0,
      addons: addons.filter(code => featureAddons.some(a => a.code === code && addonAvailable(a))),
    }
    let alive = true
    getBillingQuote(body).then(q => alive && setQuote(q)).catch(err => alive && setError(err?.response?.data?.error || ''))
    return () => { alive = false }
  }, [plan, period, extraShops, addons, cat])

  const pay = async (provider) => {
    if (!quote) return
    setPaying(provider)
    setError('')
    try {
      const inv = await createBillingInvoice({ plan: quote.plan, period: quote.period, extraShops: quote.extraShops, addons: quote.addons, provider })
      setInvoice(inv)
      if (inv.link) window.open(inv.link, '_blank', 'noopener')
      clearInterval(pollRef.current)
      pollRef.current = setInterval(async () => {
        try {
          const cur = await getBillingInvoice(inv.id)
          if (cur.status !== 'pending') {
            clearInterval(pollRef.current)
            setInvoice(cur)
            if (cur.status === 'paid') { await loadStatus(); await load() }
          }
        } catch {}
      }, 4000)
    } catch (err) {
      setError(err?.response?.data?.error || 'Xatolik yuz berdi')
    } finally { setPaying(null) }
  }
  const closeInvoice = () => { clearInterval(pollRef.current); setInvoice(null); getBillingInvoices().then(setInvoices).catch(() => {}) }

  const featureLabel = useMemo(() => Object.fromEntries((cat?.features || []).map(f => [f.key, f.label])), [cat])

  if (!cat) {
    return error
      ? <p className="text-sm text-accent-red">{error}</p>
      : <div className="flex justify-center py-20"><Loader2 className="animate-spin text-text-muted" /></div>
  }
  const cur = cat.current
  const [stLabel, stCls] = STATE[cur.state] || STATE.none
  const curPlan = cat.plans.find(p => p.code === (cur.state === 'trial' ? null : cur.plan))
  const limitTxt = (used, max) => `${used} / ${max == null ? '∞' : max}`
  const planShops = selectedPlan?.maxShops == null ? null : selectedPlan.maxShops

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-syne font-bold text-2xl sm:text-3xl text-text-primary flex items-center gap-2"><CreditCard size={26} /> Obuna</h1>
      </div>

      {/* Joriy holat */}
      <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 grid gap-4 sm:grid-cols-4">
        <div>
          <p className="text-xs text-text-muted mb-1">Holat</p>
          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${stCls}`}>{stLabel}</span>
        </div>
        <div>
          <p className="text-xs text-text-muted mb-1">Tarif</p>
          <p className="font-bold text-text-primary">{cur.state === 'trial' ? 'Sinov (barcha imkoniyatlar)' : curPlan?.name || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted mb-1">Amal qilish muddati</p>
          <p className="font-bold text-text-primary">{cur.state === 'free' ? 'Cheklanmagan' : fmtDate(cur.until)}
            {cur.daysLeft != null && cur.state !== 'free' && <span className="text-xs text-text-muted font-normal"> · {cur.daysLeft > 0 ? `${cur.daysLeft} kun qoldi` : 'tugagan'}</span>}
          </p>
        </div>
        <div className="flex gap-4">
          <div><p className="text-xs text-text-muted mb-1 flex items-center gap-1"><Store size={12} /> Do'konlar</p><p className="font-bold">{limitTxt(cat.usage.shops, liveLimits ? liveLimits.shops : null)}</p></div>
          <div><p className="text-xs text-text-muted mb-1 flex items-center gap-1"><Users size={12} /> Xodimlar</p><p className="font-bold">{limitTxt(cat.usage.employees, liveLimits ? liveLimits.employees : null)}</p></div>
        </div>
      </div>

      {/* Davr */}
      <div className="flex items-center gap-2">
        {[['month', 'Oylik'], ['year', `Yillik${cat.yearlyDiscountPct ? ` (−${cat.yearlyDiscountPct}%)` : ''}`]].map(([k, l]) => (
          <button key={k} onClick={() => setPeriod(k)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${period === k ? 'bg-accent-red text-white' : 'bg-bg-secondary border border-border text-text-secondary hover:bg-bg-tertiary'}`}>{l}</button>
        ))}
      </div>

      {/* Tariflar */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
        {cat.plans.map(p => {
          const perMonth = period === 'year' ? p.priceMonth * (1 - cat.yearlyDiscountPct / 100) : p.priceMonth
          const active = plan === p.code
          return (
            <button key={p.code} type="button" onClick={() => setPlan(p.code)}
              className={`relative text-left bg-bg-secondary border-2 rounded-2xl p-4 sm:p-5 transition-colors ${active ? 'border-accent-red' : 'border-border hover:border-text-muted'}`}>
              {p.popular && <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-accent-red text-white text-[10px] font-bold flex items-center gap-1"><Crown size={10} /> Mashhur</span>}
              {cur.plan === p.code && cur.state !== 'trial' && <span className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full bg-accent-green text-white text-[10px] font-bold">Joriy</span>}
              <p className="font-syne font-bold text-lg text-text-primary">{p.name}</p>
              {p.description && <p className="text-xs text-text-muted">{p.description}</p>}
              <p className="mt-3"><span className="text-2xl font-bold text-text-primary">{fmt(perMonth)}</span> <span className="text-xs text-text-muted">so'm / oy</span></p>
              {period === 'year' && <p className="text-xs text-text-muted">Yiliga {fmt(perMonth * 12)} so'm</p>}
              <div className="mt-3 space-y-1 text-xs">
                <p className="flex items-center gap-1.5 text-text-primary"><Store size={13} /> {p.maxShops == null ? "Do'konlar cheklanmagan" : `${p.maxShops} ta do'kon`}</p>
                <p className="flex items-center gap-1.5 text-text-primary"><Users size={13} /> {p.maxEmployees == null ? 'Xodimlar cheklanmagan' : `${p.maxEmployees} ta xodim`}</p>
                {cat.features.filter(f => f.key !== 'customer_bot').map(f => (
                  <p key={f.key} className={`flex items-center gap-1.5 ${p.features.includes(f.key) ? 'text-text-primary' : 'text-text-muted opacity-60'}`}>
                    {p.features.includes(f.key) ? <Check size={13} className="text-accent-green flex-shrink-0" /> : <X size={13} className="flex-shrink-0" />} {f.label}
                  </p>
                ))}
              </div>
            </button>
          )
        })}
      </div>

      {/* Qo'shimchalar */}
      {(shopAllowed || featureAddons.some(addonAvailable)) && (
        <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-5 space-y-3">
          <p className="font-bold text-text-primary text-sm">Qo'shimchalar</p>
          {shopAllowed && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm text-text-primary">{shopAddon.name}</p>
                <p className="text-xs text-text-muted">{fmt(shopAddon.priceMonth)} so'm / oy · tarifda {planShops ?? '∞'} ta</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setExtraShops(n => Math.max(0, n - 1))} className="p-1.5 rounded-lg border border-border hover:bg-bg-tertiary"><Minus size={14} /></button>
                <span className="w-8 text-center font-bold">{extraShops}</span>
                <button onClick={() => setExtraShops(n => Math.min(100, n + 1))} className="p-1.5 rounded-lg border border-border hover:bg-bg-tertiary"><Plus size={14} /></button>
              </div>
            </div>
          )}
          {featureAddons.filter(addonAvailable).map(a => (
            <label key={a.code} className="flex items-center justify-between gap-2 cursor-pointer">
              <div>
                <p className="text-sm text-text-primary">{a.name}</p>
                <p className="text-xs text-text-muted">{a.description ? `${a.description} · ` : ''}{fmt(a.priceMonth)} so'm / oy</p>
              </div>
              <input type="checkbox" className="w-4 h-4" checked={addons.includes(a.code)}
                onChange={e => setAddons(list => e.target.checked ? [...list, a.code] : list.filter(c => c !== a.code))} />
            </label>
          ))}
        </div>
      )}

      {/* Jami va to'lov */}
      {quote && (
        <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="space-y-1 text-sm">
            {quote.lines.map((l, i) => (
              <div key={i} className="flex justify-between gap-2"><span className="text-text-secondary">{l.label}</span><span className="text-text-primary">{fmt(l.amount)} so'm / oy</span></div>
            ))}
            {quote.months > 1 && <div className="flex justify-between gap-2 text-text-muted"><span>{quote.months} oy</span><span>{fmt(quote.gross)} so'm</span></div>}
            {quote.discountPct > 0 && <div className="flex justify-between gap-2 text-accent-green"><span>Yillik chegirma {quote.discountPct}%</span><span>−{fmt(quote.gross - quote.amount)} so'm</span></div>}
            <div className="flex justify-between gap-2 pt-2 border-t border-border font-bold text-base"><span>Jami</span><span>{fmt(quote.amount)} so'm</span></div>
          </div>
          {cat.usage.shops > (planShops == null ? Infinity : planShops + (shopAllowed ? extraShops : 0)) && (
            <p className="text-xs text-accent-orange">Hozir {cat.usage.shops} ta faol do'kon bor — bu tarif va qo'shimchalar bilan yangi do'kon qo'shib bo'lmaydi.</p>
          )}
          {selectedPlan?.maxEmployees != null && cat.usage.employees > selectedPlan.maxEmployees && (
            <p className="text-xs text-accent-orange">Hozir {cat.usage.employees} ta faol xodim bor — bu tarifda {selectedPlan.maxEmployees} ta. Yangi xodim qo'shib bo'lmaydi.</p>
          )}
          {cat.providers.length === 0
            ? <p className="text-xs text-text-muted">Onlayn to'lov hali ulanmagan. SICRM bilan bog'laning.</p>
            : (
              <div className="flex flex-col sm:flex-row gap-2">
                {cat.providers.map(p => (
                  <button key={p.id} disabled={!!paying} onClick={() => pay(p.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-accent-red text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50">
                    {paying === p.id ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                    {PROVIDERS[p.id]} orqali to'lash{p.test ? ' (sinov)' : ''}
                  </button>
                ))}
              </div>
            )}
          <p className="text-[11px] text-text-muted">To'lov qilganingizda ommaviy oferta shartlarini qabul qilgan hisoblanasiz. Tarif o'zgarsa, oldingi to'lovning qolgan muddati yangi tarif narxiga mutanosib qo'shiladi.</p>
        </div>
      )}
      {error && <p className="text-sm text-accent-red">{error}</p>}

      {/* To'lovlar tarixi */}
      {invoices.length > 0 && (
        <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
          <p className="px-4 sm:px-5 py-3 border-b border-border font-bold text-sm">To'lovlar tarixi</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-text-muted text-left">
                <th className="px-3 sm:px-4 py-2">Sana</th><th className="px-3 sm:px-4 py-2">Tarif</th><th className="px-3 sm:px-4 py-2">Davr</th>
                <th className="px-3 sm:px-4 py-2">Summa</th><th className="px-3 sm:px-4 py-2">Tizim</th><th className="px-3 sm:px-4 py-2">Holat</th>
              </tr></thead>
              <tbody>
                {invoices.map(i => {
                  const [l, c] = INV_STATUS[i.status] || [i.status, '']
                  return (
                    <tr key={i.id} className="border-t border-border">
                      <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap">{fmtDate(i.createdAt)}</td>
                      <td className="px-3 sm:px-4 py-2.5">{cat.plans.find(p => p.code === i.plan)?.name || i.plan}</td>
                      <td className="px-3 sm:px-4 py-2.5">{i.period === 'year' ? 'Yillik' : 'Oylik'}</td>
                      <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap">{fmt(i.amount)} so'm</td>
                      <td className="px-3 sm:px-4 py-2.5">{PROVIDERS[i.provider] || i.provider}</td>
                      <td className={`px-3 sm:px-4 py-2.5 font-bold ${c}`}>{l}{i.status === 'paid' && i.appliedUntil ? <span className="font-normal text-text-muted"> · {fmtDate(i.appliedUntil)} gacha</span> : ''}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* To'lov kutilmoqda */}
      <AnimatePresence>
        {invoice && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[360] flex items-center justify-center p-4" onClick={closeInvoice}>
            <StackGuard onClose={closeInvoice} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()} className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 w-full max-w-sm space-y-4 text-center">
              {invoice.status === 'paid' ? (
                <>
                  <CheckCircle2 size={44} className="mx-auto text-accent-green" />
                  <p className="font-bold text-text-primary">To'lov qabul qilindi</p>
                  <p className="text-sm text-text-muted">Obuna {fmtDate(invoice.appliedUntil)} gacha faol.</p>
                </>
              ) : invoice.status === 'pending' ? (
                <>
                  <Clock size={40} className="mx-auto text-accent-orange" />
                  <p className="font-bold text-text-primary">To'lov kutilmoqda</p>
                  <p className="text-sm text-text-muted">{PROVIDERS[invoice.provider]} sahifasida {fmt(invoice.amount)} so'm to'lang. To'lov tushishi bilan obuna avtomatik faollashadi.</p>
                  {invoice.link && (
                    <a href={invoice.link} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent-red text-white rounded-xl text-sm font-bold"><ExternalLink size={14} /> To'lov sahifasini ochish</a>
                  )}
                  <p className="text-xs text-text-muted flex items-center justify-center gap-1"><Loader2 size={12} className="animate-spin" /> Tekshirilmoqda...</p>
                </>
              ) : (
                <>
                  <X size={40} className="mx-auto text-text-muted" />
                  <p className="font-bold text-text-primary">To'lov bekor qilindi</p>
                </>
              )}
              <button onClick={closeInvoice} className="w-full px-4 py-2.5 border border-border rounded-xl text-sm font-bold text-text-secondary hover:bg-bg-tertiary">Yopish</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Subscription
