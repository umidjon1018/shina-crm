import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, SlidersHorizontal, ShoppingCart, Package, LayoutGrid, Minus, Plus, Trash2, X, ImageOff, ShieldCheck, Clock, Wallet, Star, Tag, CheckCircle2, ChevronDown, Loader2 } from 'lucide-react'
import { api, imageUrl, haptic, fmt, initData } from './api'

const tg = () => window.Telegram?.WebApp
const TERM_ICON = { shield: ShieldCheck, clock: Clock, wallet: Wallet, star: Star, tag: Tag, check: CheckCircle2 }
const SORTS = [['default', 'Mos'], ['cheap', 'Arzonroq'], ['expensive', 'Qimmatroq'], ['name', 'Nomi bo\'yicha']]
const STOCK = { low: { text: 'Kam qoldi', cls: 'bg-amber-100 text-amber-800' }, out: { text: 'Tugagan', cls: 'bg-gray-200 text-gray-600' } }

const Img = ({ id, className = '' }) => {
  const [err, setErr] = useState(false)
  const src = imageUrl(id)
  if (!src || err) return <div className={`flex items-center justify-center bg-white text-gray-300 ${className}`}><ImageOff size={28} /></div>
  return <img src={src} alt="" loading="lazy" onError={() => setErr(true)} className={`bg-white object-contain ${className}`} />
}

const Stepper = ({ qty, onChange, busy, small }) => (
  <div className={`flex items-center justify-between rounded-xl bg-[var(--s-accent-soft)] ${small ? 'h-9' : 'h-11'}`}>
    <button onClick={() => onChange(qty - 1)} disabled={busy} className={`${small ? 'w-9' : 'w-11'} h-full flex items-center justify-center text-[var(--s-accent)]`}>{qty <= 1 ? <Trash2 size={16} /> : <Minus size={18} />}</button>
    <span className="font-semibold text-[15px]">{busy ? <Loader2 size={16} className="animate-spin" /> : qty}</span>
    <button onClick={() => onChange(qty + 1)} disabled={busy} className={`${small ? 'w-9' : 'w-11'} h-full flex items-center justify-center text-[var(--s-accent)]`}><Plus size={18} /></button>
  </div>
)

const Sheet = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
    <div className="w-full max-h-[75vh] overflow-y-auto rounded-t-2xl bg-[var(--s-card)] p-4 safe-bottom" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[17px]">{title}</h3>
        <button onClick={onClose} className="p-1 text-[var(--s-hint)]"><X size={20} /></button>
      </div>
      {children}
    </div>
  </div>
)

// ─── Katalog kartasi ───
const Card = ({ p, role, onOpen, onQty, busy }) => (
  <div className="flex flex-col rounded-2xl bg-[var(--s-card)] overflow-hidden">
    <button onClick={onOpen} className="relative block">
      <Img id={p.imageId} className="w-full aspect-square p-2" />
      {STOCK[p.stock] && <span className={`absolute left-2 top-2 text-[11px] font-medium px-2 py-0.5 rounded-md ${STOCK[p.stock].cls}`}>{STOCK[p.stock].text}</span>}
    </button>
    <button onClick={onOpen} className="px-2.5 pt-2 text-left flex-1">
      <div className="text-[17px] font-bold leading-tight">{fmt(p.price)} <span className="text-[13px] font-semibold">so'm</span>{p.unit !== 'dona' && <span className="text-[12px] font-normal text-[var(--s-hint)]"> / {p.unit}</span>}</div>
      {role === 'retail' && p.monthly > 0 && (
        <div className="mt-1 inline-block rounded-md bg-[var(--s-monthly)] px-1.5 py-0.5 text-[12px] font-medium text-gray-900">{fmt(p.monthly)} so'm/oy · {p.months} oy</div>
      )}
      <div className="mt-1 text-[13px] leading-snug line-clamp-2">{p.title}</div>
    </button>
    <div className="p-2.5 pt-2">
      {p.stock === 'out' && role === 'retail' ? (
        <div className="h-9 flex items-center justify-center rounded-xl bg-[var(--s-soft)] text-[13px] text-[var(--s-hint)]">Tugagan</div>
      ) : p.inCart > 0 ? (
        <Stepper small qty={p.inCart} busy={busy} onChange={q => onQty(p, q)} />
      ) : (
        <button onClick={() => onQty(p, 1)} disabled={busy} className="w-full h-9 flex items-center justify-center gap-1.5 rounded-xl bg-[var(--s-accent-soft)] text-[var(--s-accent)] text-[14px] font-medium">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <><ShoppingCart size={16} /> Savatga</>}
        </button>
      )}
    </div>
  </div>
)

// ─── Tovar ichi ───
const Detail = ({ id, role, onQty, busyId, goCart }) => {
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')
  const [slide, setSlide] = useState(0)
  const [term, setTerm] = useState(null)
  const load = useCallback(() => api(`/products/${id}`).then(x => { setD(x); setTerm(t => t ?? (x.installment ? x.installment.terms[x.installment.terms.length - 1].months : null)) }).catch(e => setErr(e.message)), [id])
  useEffect(() => { load() }, [load])
  if (err) return <div className="p-6 text-center text-[var(--s-hint)]">{err}</div>
  if (!d) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-[var(--s-hint)]" /></div>
  const imgs = d.images.length ? d.images : [null]
  const cur = d.installment?.terms.find(t => t.months === term)
  const change = async (q) => { await onQty(d, q); load() }
  return (
    <div className="pb-28">
      <div className="bg-white">
        <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar" onScroll={e => setSlide(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
          {imgs.map((im, i) => <div key={i} className="w-full shrink-0 snap-center"><Img id={im} className="w-full aspect-square p-4" /></div>)}
        </div>
        {imgs.length > 1 && <div className="flex justify-center gap-1.5 pb-3">{imgs.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === slide ? 'w-4 bg-[var(--s-accent)]' : 'w-1.5 bg-gray-300'}`} />)}</div>}
      </div>
      <div className="m-3 rounded-2xl bg-[var(--s-card)] p-4">
        <div className="text-[26px] font-bold leading-tight">{fmt(d.price)} so'm{d.unit !== 'dona' && <span className="text-[15px] font-normal text-[var(--s-hint)]"> / {d.unit}</span>}</div>
        {role === 'wholesale' && <div className="mt-1 text-[13px] text-[var(--s-accent)] font-medium">Sizning ulgurji narxingiz</div>}
        <h1 className="mt-2 text-[16px] leading-snug">{d.title}</h1>
        <div className="mt-2 text-[13px]">
          {d.stock === 'out' ? <span className="text-gray-500">Omborda yo'q</span> : d.stock === 'low' ? <span className="text-amber-600">Omborda kam qoldi</span> : <span className="text-green-600">Omborda bor</span>}
        </div>
      </div>

      {d.installment && (
        <div className="m-3 rounded-2xl bg-[var(--s-card)] p-4">
          <div className="font-semibold text-[15px] mb-2">Muddatli to'lov</div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {d.installment.terms.map(t => (
              <button key={t.months} onClick={() => setTerm(t.months)}
                className={`shrink-0 rounded-xl px-3 py-2 text-[13px] border ${t.months === term ? 'border-[var(--s-accent)] bg-[var(--s-accent-soft)] font-semibold' : 'border-[var(--s-line)]'}`}>{t.months} oy</button>
            ))}
          </div>
          {cur && (
            <div className="mt-3 flex items-baseline justify-between">
              <span className="inline-block rounded-md bg-[var(--s-monthly)] px-2 py-1 text-[16px] font-bold text-gray-900">{fmt(cur.monthly)} so'm/oy</span>
              <span className="text-[13px] text-[var(--s-hint)]">jami {fmt(d.installment.price)} so'm</span>
            </div>
          )}
          {d.installmentOrgs?.length > 0 && <div className="mt-2 text-[13px] text-[var(--s-hint)]">Rasmiylashtirish: {d.installmentOrgs.join(', ')} · do'konda pasport bilan</div>}
        </div>
      )}

      <div className="m-3 rounded-2xl bg-[var(--s-card)] p-4 space-y-3">
        <div className="font-semibold text-[15px]">Shartlar</div>
        {d.terms.map((t, i) => { const I = TERM_ICON[t.icon] || CheckCircle2; return <div key={i} className="flex gap-3 text-[14px] leading-snug"><I size={18} className="shrink-0 text-[var(--s-accent)] mt-0.5" /><span>{t.text}</span></div> })}
      </div>

      {d.specs.length > 0 && (
        <div className="m-3 rounded-2xl bg-[var(--s-card)] p-4">
          <div className="font-semibold text-[15px] mb-1">Xususiyatlari</div>
          {d.specs.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2 border-b border-[var(--s-line)] last:border-0 text-[14px]">
              <span className="text-[var(--s-hint)]">{k}</span><span className="text-right">{v}</span>
            </div>
          ))}
        </div>
      )}
      {d.description && <div className="m-3 rounded-2xl bg-[var(--s-card)] p-4 text-[14px] whitespace-pre-line"><div className="font-semibold text-[15px] mb-1">Tavsif</div>{d.description}</div>}

      <div className="fixed bottom-0 inset-x-0 z-40 bg-[var(--s-card)] border-t border-[var(--s-line)] px-3 pt-2 safe-bottom">
        {d.stock === 'out' && role === 'retail' ? (
          <div className="h-12 flex items-center justify-center rounded-xl bg-[var(--s-soft)] text-[var(--s-hint)]">Omborda yo'q</div>
        ) : d.inCart > 0 ? (
          <div className="flex gap-2">
            <div className="w-36"><Stepper qty={d.inCart} busy={busyId === d.id} onChange={change} /></div>
            <button onClick={goCart} className="flex-1 h-11 rounded-xl bg-[var(--s-accent)] text-white font-semibold">Savatga o'tish</button>
          </div>
        ) : (
          <button onClick={() => change(1)} disabled={busyId === d.id} className="w-full h-12 rounded-xl bg-[var(--s-accent)] text-white font-semibold flex items-center justify-center gap-2">
            {busyId === d.id ? <Loader2 size={18} className="animate-spin" /> : <><ShoppingCart size={18} /> Savatga qo'shish</>}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Savat ───
const Cart = ({ cart, onQty, busyId, onClear, onOrder, ordering, onOpen }) => {
  if (!cart) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-[var(--s-hint)]" /></div>
  if (!cart.lines.length) return (
    <div className="p-10 text-center text-[var(--s-hint)]"><ShoppingCart size={44} className="mx-auto mb-3 opacity-50" />Savat bo'sh</div>
  )
  return (
    <div className="pb-40">
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <h2 className="text-[20px] font-bold">Savat</h2>
        <button onClick={onClear} className="text-[13px] text-[var(--s-hint)]">Tozalash</button>
      </div>
      {cart.lines.map(l => (
        <div key={l.productId} className="mx-3 my-2 flex gap-3 rounded-2xl bg-[var(--s-card)] p-3">
          <button onClick={() => onOpen(l.productId)} className="shrink-0"><Img id={l.imageId} className="w-20 h-20 rounded-xl" /></button>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] leading-snug line-clamp-2">{l.title}</div>
            <div className="mt-1 font-bold text-[15px]">{fmt(l.sum)} so'm</div>
            {l.qty > 1 && <div className="text-[12px] text-[var(--s-hint)]">{l.qty} × {fmt(l.price)}</div>}
            {l.short && <div className="text-[12px] text-amber-600">Omborda yetarli emas</div>}
            <div className="mt-2 w-32"><Stepper small qty={l.qty} busy={busyId === l.productId} onChange={q => onQty({ id: l.productId }, q)} /></div>
          </div>
        </div>
      ))}
      <div className="fixed bottom-[60px] inset-x-0 z-30 bg-[var(--s-card)] border-t border-[var(--s-line)] px-4 pt-3 pb-3">
        <div className="flex justify-between text-[16px] font-bold mb-1"><span>Jami</span><span>{fmt(cart.total)} so'm</span></div>
        <div className="text-[12px] text-[var(--s-hint)] mb-2">{cart.note}</div>
        <button onClick={onOrder} disabled={ordering} className="w-full h-12 rounded-xl bg-[var(--s-accent)] text-white font-semibold flex items-center justify-center">
          {ordering ? <Loader2 size={18} className="animate-spin" /> : 'Buyurtma berish'}
        </button>
      </div>
    </div>
  )
}

const Orders = ({ orders, onCancel }) => {
  if (!orders) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-[var(--s-hint)]" /></div>
  if (!orders.length) return <div className="p-10 text-center text-[var(--s-hint)]"><Package size={44} className="mx-auto mb-3 opacity-50" />Hali buyurtma yo'q</div>
  return (
    <div className="pb-24">
      <h2 className="px-4 pt-3 pb-1 text-[20px] font-bold">Buyurtmalarim</h2>
      {orders.map(o => (
        <div key={o.id} className="mx-3 my-2 rounded-2xl bg-[var(--s-card)] p-4">
          <div className="flex justify-between text-[14px]">
            <span className="font-semibold">#{o.id}</span>
            <span className="text-[var(--s-hint)]">{new Date(o.at).toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="mt-1 text-[13px] text-[var(--s-hint)]">{o.lines.map(l => `${l.title} × ${l.qty}`).join(', ')}</div>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-[13px]">{o.status}</span>
            <span className="font-bold">{fmt(o.total)} so'm</span>
          </div>
          {o.cancellable && <button onClick={() => onCancel(o)} className="mt-3 w-full h-9 rounded-xl border border-[var(--s-line)] text-[13px] text-[var(--s-accent)]">Bekor qilish</button>}
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const [me, setMe] = useState(null)
  const [fatal, setFatal] = useState('')
  const [tab, setTab] = useState('catalog')
  const [detailId, setDetailId] = useState(null)
  const [cats, setCats] = useState([])
  const [cat, setCat] = useState('')
  const [q, setQ] = useState('')
  const [qInput, setQInput] = useState('')
  const [sort, setSort] = useState('default')
  const [brand, setBrand] = useState('')
  const [items, setItems] = useState([])
  const [brands, setBrands] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [sheet, setSheet] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [cart, setCart] = useState(null)
  const [orders, setOrders] = useState(null)
  const [ordering, setOrdering] = useState(false)
  const [toast, setToast] = useState('')
  const [done, setDone] = useState(null)
  const reqId = useRef(0)
  const role = me?.role

  const flash = (t) => { setToast(t); setTimeout(() => setToast(''), 2500) }

  useEffect(() => {
    if (!initData()) {
      const inTg = tg()?.platform && tg().platform !== 'unknown'
      setFatal(inTg ? "Do'konni chatdagi «Katalog» xabaridagi «Do'konni ochish» tugmasi yoki pastki chapdagi «Do'kon» (Menu) tugmasi orqali oching" : "Bu sahifa Telegram bot ichida ochiladi")
      return
    }
    api('/me').then(setMe).catch(e => setFatal(e.message))
    api('/categories').then(setCats).catch(() => {})
  }, [])

  const loadList = useCallback(async (pg = 0) => {
    const id = ++reqId.current
    setLoading(true)
    try {
      const qs = new URLSearchParams({ page: String(pg), sort, ...(cat ? { cat } : {}), ...(q ? { q } : {}), ...(brand ? { brand } : {}) })
      const r = await api(`/products?${qs}`)
      if (id !== reqId.current) return
      setItems(prev => (pg === 0 ? r.items : [...prev, ...r.items]))
      setTotal(r.total); setPage(pg); setBrands(r.brands)
    } catch (e) { flash(e.message) } finally { if (id === reqId.current) setLoading(false) }
  }, [cat, q, sort, brand])
  useEffect(() => { if (role) loadList(0) }, [role, loadList])

  const loadCart = useCallback(() => api('/cart').then(c => { setCart(c); setMe(m => m && ({ ...m, cartCount: c.lines.reduce((s, l) => s + l.qty, 0) })) }).catch(e => flash(e.message)), [])
  useEffect(() => { if (role && tab === 'cart') loadCart() }, [role, tab, loadCart])
  useEffect(() => { if (role && tab === 'orders') { setOrders(null); api('/orders').then(setOrders).catch(e => flash(e.message)) } }, [role, tab])

  // Telegram "orqaga" tugmasi: tovar ichidan / savatdan katalogga
  useEffect(() => {
    const b = tg()?.BackButton
    if (!b) return
    const back = () => { if (detailId) setDetailId(null); else setTab('catalog') }
    if (detailId || tab !== 'catalog') b.show(); else b.hide()
    b.onClick(back)
    return () => b.offClick(back)
  }, [detailId, tab])

  const setQty = async (p, qty) => {
    setBusyId(p.id)
    try {
      const r = await api(`/cart/${p.id}`, { method: 'PUT', body: { qty: Math.max(0, qty) } })
      haptic(qty > (p.inCart || 0) ? 'light' : 'soft')
      if (r.limited) flash(r.qty ? `Ko'pi bilan ${r.qty} ta` : "Omborda qolmadi")
      setItems(list => list.map(x => (x.id === p.id ? { ...x, inCart: r.qty } : x)))
      setCart(r.cart)
      setMe(m => m && ({ ...m, cartCount: r.cart.lines.reduce((s, l) => s + l.qty, 0) }))
    } catch (e) { flash(e.message); haptic('error') } finally { setBusyId(null) }
  }

  const order = async () => {
    setOrdering(true)
    try {
      const r = await api('/order', { method: 'POST' })
      haptic('success')
      setDone(r)
      setCart({ ...cart, lines: [], total: 0 })
      setMe(m => m && ({ ...m, cartCount: 0 }))
      setItems(list => list.map(x => ({ ...x, inCart: 0 })))
    } catch (e) { flash(e.message); haptic('error') } finally { setOrdering(false) }
  }

  const cancelOrder = (o) => {
    const go = async () => {
      try { await api(`/orders/${o.id}/cancel`, { method: 'POST' }); setOrders(await api('/orders')); flash('Bekor qilindi') } catch (e) { flash(e.message) }
    }
    if (tg()?.showConfirm) tg().showConfirm(`#${o.id} buyurtmani bekor qilasizmi?`, ok => ok && go())
    else if (confirm(`#${o.id} buyurtmani bekor qilasizmi?`)) go()
  }

  if (fatal) return <div className="min-h-screen flex items-center justify-center p-8 text-center text-[15px] text-[var(--s-hint)]">{fatal}</div>
  if (!me) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[var(--s-hint)]" /></div>

  const openDetail = (id) => { setDetailId(id); window.scrollTo(0, 0) }
  const goTab = (t) => { setDetailId(null); setDone(null); setTab(t); window.scrollTo(0, 0) }
  const submitSearch = (e) => { e.preventDefault(); setQ(qInput.trim()); document.activeElement?.blur() }

  let body
  if (detailId) body = <Detail key={detailId} id={detailId} role={role} onQty={setQty} busyId={busyId} goCart={() => goTab('cart')} />
  else if (done) body = (
    <div className="p-6 text-center">
      <CheckCircle2 size={56} className="mx-auto text-green-500 mt-6" />
      <div className="mt-3 text-[20px] font-bold">Buyurtma #{done.orderId} qabul qilindi</div>
      <div className="mt-3 text-[14px] text-left whitespace-pre-line rounded-2xl bg-[var(--s-card)] p-4">{done.text}</div>
      <button onClick={() => goTab('orders')} className="mt-4 w-full h-12 rounded-xl bg-[var(--s-accent)] text-white font-semibold">Buyurtmalarim</button>
      <button onClick={() => goTab('catalog')} className="mt-2 w-full h-11 rounded-xl text-[var(--s-accent)]">Katalogga qaytish</button>
    </div>
  )
  else if (tab === 'cart') body = <Cart cart={cart} onQty={setQty} busyId={busyId} ordering={ordering} onOrder={order} onOpen={openDetail}
    onClear={async () => { try { setCart(await api('/cart', { method: 'DELETE' })); setMe(m => ({ ...m, cartCount: 0 })); setItems(l => l.map(x => ({ ...x, inCart: 0 }))) } catch (e) { flash(e.message) } }} />
  else if (tab === 'orders') body = <Orders orders={orders} onCancel={cancelOrder} />
  else body = (
    <div className="pb-24">
      <div className="sticky top-0 z-20 bg-[var(--s-bg)] px-3 pt-3 pb-2">
        <div className="flex gap-2">
          <form onSubmit={submitSearch} className="flex-1 flex items-center gap-2 h-11 rounded-xl bg-[var(--s-card)] px-3">
            <Search size={18} className="text-[var(--s-hint)]" />
            <input value={qInput} onChange={e => { setQInput(e.target.value); if (!e.target.value) setQ('') }} placeholder="Nomi yoki o'lcham: 205/55R16" enterKeyHint="search"
              className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-[var(--s-hint)]" />
            {qInput && <button type="button" onClick={() => { setQInput(''); setQ('') }} className="text-[var(--s-hint)]"><X size={16} /></button>}
          </form>
          <button onClick={() => setSheet('sort')} className="w-11 h-11 rounded-xl bg-[var(--s-card)] flex items-center justify-center"><SlidersHorizontal size={18} /></button>
        </div>
        <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
          {[{ id: '', label: 'Barchasi' }, ...cats].map(c => (
            <button key={c.id} onClick={() => { setCat(c.id); setBrand('') }}
              className={`shrink-0 h-9 px-3.5 rounded-full text-[14px] ${cat === c.id ? 'bg-[var(--s-text)] text-[var(--s-card)]' : 'bg-[var(--s-card)]'}`}>{c.label}</button>
          ))}
          {brands.length > 1 && (
            <button onClick={() => setSheet('brand')} className={`shrink-0 h-9 px-3.5 rounded-full text-[14px] flex items-center gap-1 ${brand ? 'bg-[var(--s-accent)] text-white' : 'bg-[var(--s-card)]'}`}>{brand || 'Brend'} <ChevronDown size={14} /></button>
          )}
        </div>
      </div>
      {role === 'retail' && me.discount > 0 && <div className="mx-3 mb-2 rounded-xl bg-[var(--s-accent-soft)] px-3 py-2 text-[13px]">⭐ Sizning chegirmangiz {me.discount}% — kassada qo'llanadi</div>}
      {role === 'wholesale' && <div className="mx-3 mb-2 rounded-xl bg-[var(--s-accent-soft)] px-3 py-2 text-[13px]">Ulgurji narxlar · {me.name}{me.paymentDays ? ` · to'lov muddati ${me.paymentDays} kun` : ''}</div>}
      <div className="grid grid-cols-2 gap-2 px-2">
        {items.map(p => <Card key={p.id} p={p} role={role} busy={busyId === p.id} onOpen={() => openDetail(p.id)} onQty={setQty} />)}
      </div>
      {!loading && !items.length && <div className="p-10 text-center text-[var(--s-hint)]">Hech narsa topilmadi</div>}
      {loading && <div className="p-6 flex justify-center"><Loader2 className="animate-spin text-[var(--s-hint)]" /></div>}
      {!loading && items.length < total && (
        <button onClick={() => loadList(page + 1)} className="mx-3 mt-3 w-[calc(100%-1.5rem)] h-11 rounded-xl bg-[var(--s-card)] text-[14px]">Yana ko'rsatish ({total - items.length})</button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen">
      {body}
      {sheet === 'sort' && (
        <Sheet title="Saralash" onClose={() => setSheet(null)}>
          {SORTS.map(([k, label]) => (
            <button key={k} onClick={() => { setSort(k); setSheet(null) }} className="w-full flex justify-between py-3 border-b border-[var(--s-line)] last:border-0 text-[15px]">
              {label}{sort === k && <CheckCircle2 size={18} className="text-[var(--s-accent)]" />}
            </button>
          ))}
        </Sheet>
      )}
      {sheet === 'brand' && (
        <Sheet title="Brend" onClose={() => setSheet(null)}>
          {['', ...brands].map(b => (
            <button key={b || 'all'} onClick={() => { setBrand(b); setSheet(null) }} className="w-full flex justify-between py-3 border-b border-[var(--s-line)] last:border-0 text-[15px]">
              {b || 'Barcha brendlar'}{brand === b && <CheckCircle2 size={18} className="text-[var(--s-accent)]" />}
            </button>
          ))}
        </Sheet>
      )}
      {toast && <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-50 rounded-xl bg-black/80 px-4 py-2 text-[14px] text-white">{toast}</div>}
      {!detailId && (
        <nav className="fixed bottom-0 inset-x-0 z-40 flex bg-[var(--s-card)] border-t border-[var(--s-line)] safe-bottom">
          {[['catalog', 'Katalog', LayoutGrid], ['cart', 'Savat', ShoppingCart], ['orders', 'Buyurtmalar', Package]].map(([k, label, I]) => (
            <button key={k} onClick={() => goTab(k)} className={`relative flex-1 flex flex-col items-center gap-0.5 pt-2 text-[11px] ${tab === k && !done ? 'text-[var(--s-accent)]' : 'text-[var(--s-hint)]'}`}>
              <I size={22} />{label}
              {k === 'cart' && me.cartCount > 0 && <span className="absolute top-1 left-1/2 ml-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--s-accent)] text-white text-[11px] leading-[18px]">{me.cartCount}</span>}
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
