import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, AlertTriangle, Clock, Phone, Calendar, Package, X, Check, MessageCircle, MapPin, Info, Link2 } from 'lucide-react'

const IgIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
)
import { useAgentActivityStore } from '../../../store/agentActivityStore'
import { isExchangeCancel } from '../../../utils/profitHelpers'
import { useDataStore } from '../../../store/dataStore'
import { useShopStore } from '../../../store/shopStore'
import { useAgentAnalysis } from '../hooks/useAgentAnalysis'
import AgentAnalysisPanel from '../components/AgentAnalysisPanel'
import AiChat from '../components/AiChat'
import { createReservation, cancelReservation, getReservations } from '../../../api/reservationService'
import { getProducts } from '../../../api/productService'
import { getItems } from '../../../api/itemService'

function getDaysUntilBirthday(birthDate) {
  if (!birthDate) return 999
  const today = new Date()
  const b = new Date(birthDate)
  const next = new Date(today.getFullYear(), b.getMonth(), b.getDate())
  if (next <= today) next.setFullYear(today.getFullYear() + 1)
  return Math.ceil((next - today) / 86400000)
}

const LOYALTY_BADGE = {
  gold:   { label: 'VIP',   cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  silver: { label: 'Sodiq', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  none:   { label: 'Yangi', cls: 'bg-bg-secondary text-text-muted border-border' },
}

const SOURCE_LABELS = {
  instagram: 'Instagram',
  telegram:  'Telegram',
  walk_in:   'Ko\'chadan',
  referral:  'Tavsiya',
  other:     'Boshqa',
}

// ── Bron modali ──────────────────────────────────────────────────────────────
function ReservationModal({ customer, products, items, onClose, onDone }) {
  const [productId, setProductId] = useState('')
  const [hours, setHours] = useState('4')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const availableItems = items.filter(i => i.status === 'in_stock' && (productId ? i.productId === Number(productId) : true))
  const selectedProduct = products.find(p => p.id === Number(productId))

  const handleSubmit = async () => {
    if (!productId || !availableItems.length) return setError('Tovar tanlang')
    setLoading(true)
    setError(null)
    try {
      const item = availableItems[0]
      const reservedUntil = new Date(Date.now() + Number(hours) * 3600000).toISOString()
      await createReservation({
        itemId: item.id,
        productId: item.productId,
        customerName: customer.name,
        customerPhone: customer.phone,
        reservedUntil,
        notes: note,
      })
      onDone()
    } catch (e) {
      setError(e.response?.data?.error || 'Xato yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-bg-primary border border-border rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <Package size={16} className="text-accent-blue" /> Tovar bron qilish
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-bg-secondary text-text-muted"><X size={16} /></button>
        </div>
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-bg-secondary border border-border text-sm">
            <span className="text-text-muted">Mijoz: </span>
            <span className="font-medium text-text-primary">{customer.name}</span>
            {customer.phone && <span className="text-text-muted ml-2">{customer.phone}</span>}
          </div>
          <div>
            <label className="text-xs text-text-secondary mb-1.5 block">Tovar tanlang</label>
            <select value={productId} onChange={e => setProductId(e.target.value)}
              className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-blue">
              <option value="">— tanlang —</option>
              {products.filter(p => p.isActive && items.some(i => i.productId === p.id && i.status === 'in_stock')).map(p => (
                <option key={p.id} value={p.id}>{p.name} {p.brand ? `(${p.brand})` : ''}</option>
              ))}
            </select>
            {selectedProduct && availableItems.length > 0 && (
              <p className="text-xs text-accent-green mt-1">✓ {availableItems.length} ta zaxirada bor</p>
            )}
            {selectedProduct && availableItems.length === 0 && (
              <p className="text-xs text-accent-red mt-1">Zaxirada tovar yo'q</p>
            )}
          </div>
          <div>
            <label className="text-xs text-text-secondary mb-1.5 block">Bron muddati (maks 24 soat)</label>
            <div className="flex gap-2">
              {['2', '4', '8', '24'].map(h => (
                <button key={h} onClick={() => setHours(h)}
                  className={`flex-1 py-2 rounded-xl text-sm border transition-colors ${hours === h ? 'bg-accent-blue/20 border-accent-blue text-accent-blue' : 'border-border text-text-muted hover:bg-bg-secondary'}`}>
                  {h}h
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-1">
              {new Date(Date.now() + Number(hours) * 3600000).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })} gacha
            </p>
          </div>
          <div>
            <label className="text-xs text-text-secondary mb-1.5 block">Izoh (ixtiyoriy)</label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Masalan: kechqurun keladi"
              className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-blue" />
          </div>
          {error && <p className="text-xs text-accent-red bg-accent-red/10 rounded-lg px-3 py-2">{error}</p>}
          <button onClick={handleSubmit} disabled={loading || !productId || !availableItems.length}
            className="w-full py-2.5 rounded-xl bg-accent-blue text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2">
            {loading ? 'Saqlanmoqda...' : <><Check size={15} /> Bron qilish</>}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Mijoz profil modali ───────────────────────────────────────────────────────
function CustomerProfileModal({ customer, sales, reservations, onClose, onReserve }) {
  const badge = LOYALTY_BADGE[customer.loyaltyLevel || 'none'] || LOYALTY_BADGE.none
  const customerSales = sales.filter(s => s.customerId === customer.id && s.status !== 'cancelled')
  const cancelledSales = sales.filter(s => s.customerId === customer.id && s.status === 'cancelled' && !isExchangeCancel(s))
  const customerReservations = reservations.filter(r => r.customer_phone === customer.phone || r.customer_name === customer.name)
  const totalSpend = customerSales.reduce((s, x) => s + (x.total || 0), 0)
  const daysUntilBd = getDaysUntilBirthday(customer.birthDate)

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()}
        className="bg-bg-primary border border-border rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-bg-primary z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-lg font-bold text-accent-blue">
              {customer.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-semibold text-text-primary">{customer.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${badge.cls}`}>{badge.label}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-secondary text-text-muted"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Aloqa ma'lumotlari */}
          <div className="grid grid-cols-2 gap-3">
            {customer.phone && (
              <a href={`tel:${customer.phone}`} className="flex items-center gap-2 p-3 rounded-xl bg-bg-secondary border border-border hover:bg-bg-secondary/80 transition-colors">
                <Phone size={14} className="text-accent-blue flex-shrink-0" />
                <span className="text-sm text-text-primary truncate">{customer.phone}</span>
              </a>
            )}
            {customer.phone2 && (
              <a href={`tel:${customer.phone2}`} className="flex items-center gap-2 p-3 rounded-xl bg-bg-secondary border border-border">
                <Phone size={14} className="text-text-muted flex-shrink-0" />
                <span className="text-sm text-text-primary truncate">{customer.phone2}</span>
              </a>
            )}
            {customer.instagram && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-bg-secondary border border-border">
                <IgIcon size={14} className="text-pink-500 flex-shrink-0" />
                <span className="text-sm text-text-primary truncate">{customer.instagram}</span>
              </div>
            )}
            {customer.birthDate && (
              <div className={`flex items-center gap-2 p-3 rounded-xl border ${daysUntilBd <= 7 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-bg-secondary border-border'}`}>
                <Calendar size={14} className={daysUntilBd <= 7 ? 'text-yellow-400 flex-shrink-0' : 'text-text-muted flex-shrink-0'} />
                <span className="text-sm text-text-primary">{customer.birthDate} {daysUntilBd <= 7 && <span className="text-yellow-400">({daysUntilBd} kun)</span>}</span>
              </div>
            )}
            {customer.carModel && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-bg-secondary border border-border col-span-2">
                <Star size={14} className="text-text-muted flex-shrink-0" />
                <span className="text-sm text-text-primary">{customer.carModel}</span>
              </div>
            )}
          </div>

          {/* Statistika */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Jami xarid', value: customerSales.length + ' ta', color: 'text-accent-green' },
              { label: 'Jami summa', value: totalSpend > 0 ? (totalSpend / 1000000).toFixed(1) + ' mln' : '—', color: 'text-text-primary' },
              { label: 'Qarz', value: (customer.installmentDebt || 0) > 0 ? (customer.installmentDebt / 1000000).toFixed(1) + ' mln' : '—', color: (customer.installmentDebt || 0) > 0 ? 'text-accent-red' : 'text-text-muted' },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-3 rounded-xl bg-bg-secondary border border-border text-center">
                <p className={`text-base font-bold ${color}`}>{value}</p>
                <p className="text-xs text-text-muted mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Faol bronlar */}
          {customerReservations.length > 0 && (
            <div>
              <p className="text-xs font-medium text-text-secondary mb-2">Faol bronlar</p>
              <div className="space-y-2">
                {customerReservations.map(r => {
                  const until = new Date(r.reserved_until)
                  const mins = Math.round((until - Date.now()) / 60000)
                  return (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-accent-blue/5 border border-accent-blue/20 text-sm">
                      <span className="text-text-primary">{r.product_name || `Item #${r.item_id}`}</span>
                      <span className={`text-xs ${mins < 60 ? 'text-accent-red' : 'text-text-muted'}`}>
                        {mins < 60 ? `${mins} daqiqa` : `${Math.round(mins/60)} soat`} qoldi
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Bron tugmasi */}
          <button onClick={onReserve}
            className="w-full py-2.5 rounded-xl border border-accent-blue/30 text-accent-blue text-sm font-medium flex items-center justify-center gap-2 hover:bg-accent-blue/10 transition-colors">
            <Package size={14} /> Tovar bron qilish
          </button>

          {/* Xaridlar tarixi */}
          {customerSales.length > 0 && (
            <div>
              <p className="text-xs font-medium text-text-secondary mb-2">Xaridlar tarixi ({customerSales.length} ta)</p>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {[...customerSales].sort((a, b) => (b.soldAt || '') > (a.soldAt || '') ? 1 : -1).slice(0, 20).map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-bg-secondary border border-border text-sm">
                    <div>
                      <p className="text-text-primary font-medium">{s.total?.toLocaleString()} so'm</p>
                      <p className="text-xs text-text-muted">{s.soldAt?.slice(0, 10)} · {s.paymentType === 'cash' ? 'Naqd' : s.paymentType === 'card' ? 'Karta' : 'Nasiya'}</p>
                    </div>
                    <div className="text-right">
                      {s.items?.slice(0, 2).map((item, i) => (
                        <p key={i} className="text-xs text-text-muted">{item.name || item.productName}</p>
                      ))}
                      {s.items?.length > 2 && <p className="text-xs text-text-muted">+{s.items.length - 2} ta</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {cancelledSales.length > 0 && (
            <p className="text-xs text-text-muted">Bekor qilingan: {cancelledSales.length} ta sotuv</p>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ── Asosiy komponent ──────────────────────────────────────────────────────────
function CustomerTab({ aiData = {}, agentConfig = null }) {
  const { addActivity } = useAgentActivityStore()
  const { version } = useDataStore()
  const { selectedShopId } = useShopStore()

  const {
    customers: MOCK_CUSTOMERS = [],
    sales: _allSales = [],
    products: _allProducts = [],
    items: _allItems = [],
    promotions: MOCK_PROMOTIONS = [],
  } = aiData

  const [activeSection, setActiveSection] = useState('table')
  const [reservations, setReservations] = useState([])
  const [products, setProducts] = useState([])
  const [items, setItems] = useState([])
  const [reserveModal, setReserveModal] = useState(null)
  const [profileModal, setProfileModal] = useState(null)
  const [search, setSearch] = useState('')
  const [filterLoyalty, setFilterLoyalty] = useState('all')
  const [filterSource, setFilterSource] = useState('all')
  const [cancellingId, setCancellingId] = useState(null)

  // Admin Panel integratsiya sozlamalari
  const shopInfo = useMemo(() => {
    try {
      const raw = localStorage.getItem('goodtires-customer-integrations') || '{}'
      return JSON.parse(raw)
    } catch { return {} }
  }, [activeSection])

  const filterShop = arr => selectedShopId === 'all' ? arr : arr.filter(s => String(s.shopId) === String(selectedShopId))
  const shopCustomers = selectedShopId === 'all' ? MOCK_CUSTOMERS : MOCK_CUSTOMERS.filter(c => !c.shopId || String(c.shopId) === String(selectedShopId))
  const completedSales = filterShop(_allSales).filter(s => s.status !== 'cancelled')
  const cancelledSales = filterShop(_allSales).filter(s => s.status === 'cancelled' && !isExchangeCancel(s))
  const exchangedSales = filterShop(_allSales).filter(s => s._isExchange)

  useEffect(() => {
    Promise.all([getProducts(), getItems()]).then(([p, i]) => { setProducts(p); setItems(i) })
    loadReservations()
  }, [version])

  const loadReservations = async () => {
    try { setReservations(await getReservations()) } catch {}
  }

  const handleCancelReservation = async (id) => {
    setCancellingId(id)
    try { await cancelReservation(id); await loadReservations() } finally { setCancellingId(null) }
  }

  // Mijoz profillari
  const customerProfiles = useMemo(() => {
    const map = {}
    shopCustomers.forEach(c => {
      map[c.id] = { ...c, totalSpend: 0, totalOrders: 0, cancelCount: 0, discountUsed: 0, lastSaleDate: null }
    })
    completedSales.forEach(s => {
      if (!s.customerId || !map[s.customerId]) return
      const p = map[s.customerId]
      p.totalSpend  += s.total || 0
      p.totalOrders += 1
      p.discountUsed += s.discountAmount || 0
      if (!p.lastSaleDate || s.soldAt > p.lastSaleDate) p.lastSaleDate = s.soldAt
    })
    cancelledSales.forEach(s => { if (s.customerId && map[s.customerId]) map[s.customerId].cancelCount++ })
    return Object.values(map)
  }, [shopCustomers, completedSales, cancelledSales])

  // Filtr
  const filtered = useMemo(() => {
    let list = customerProfiles
    if (filterLoyalty !== 'all') list = list.filter(c => (c.loyaltyLevel || 'none') === filterLoyalty)
    if (filterSource !== 'all') list = list.filter(c => (c.source || 'other') === filterSource)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c => c.name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.phone2?.includes(q))
    }
    return list.sort((a, b) => b.totalSpend - a.totalSpend)
  }, [customerProfiles, search, filterLoyalty, filterSource])

  // Tahlil ko'rsatkichlari
  const vipCount       = shopCustomers.filter(c => c.loyaltyLevel === 'gold').length
  const loyalCount     = shopCustomers.filter(c => c.loyaltyLevel === 'silver').length
  const newCount       = shopCustomers.filter(c => !c.loyaltyLevel || c.loyaltyLevel === 'none').length
  const debtors        = shopCustomers.filter(c => (c.installmentDebt || 0) > 0)
  const totalDebt      = debtors.reduce((s, c) => s + (c.installmentDebt || 0), 0)
  const birthdaySoon7  = shopCustomers.filter(c => getDaysUntilBirthday(c.birthDate) <= 7)
  const birthdaySoon30 = shopCustomers.filter(c => getDaysUntilBirthday(c.birthDate) <= 30)
  const sixMonthsAgo   = new Date(Date.now() - 180 * 86400000).toISOString()
  const atRisk         = customerProfiles.filter(p => p.totalOrders > 0 && p.lastSaleDate && p.lastSaleDate < sixMonthsAgo).slice(0, 5)
  const topDiscount    = [...customerProfiles].sort((a, b) => b.discountUsed - a.discountUsed).filter(p => p.discountUsed > 0).slice(0, 5)
  const cancelReasons  = {}
  cancelledSales.forEach(s => { const r = s.cancelReason || "Ko'rsatilmagan"; cancelReasons[r] = (cancelReasons[r] || 0) + 1 })
  const activePromos   = MOCK_PROMOTIONS.filter(p => p.isActive)

  // Manba statistikasi
  const sourceCounts = useMemo(() => {
    const m = {}
    shopCustomers.forEach(c => { const s = c.source || 'other'; m[s] = (m[s] || 0) + 1 })
    return m
  }, [shopCustomers])

  // Zaxiradagi tovarlar (agent uchun)
  const stockInfo = useMemo(() => {
    return products.filter(p => p.isActive).map(p => {
      const inStock = items.filter(i => i.productId === p.id && i.status === 'in_stock').length
      return { name: p.name, brand: p.brand || '', price: p.cashPrice || 0, installmentPrice: p.installmentBasePrice || 0, inStock, category: p.category }
    }).filter(p => p.inStock > 0).sort((a, b) => b.inStock - a.inStock)
  }, [products, items])

  const hasTool = name => !agentConfig?.tools?.length || agentConfig.tools.includes(name)

  const { loading, analysis, error, refresh, triggerRun, triggering, source, lastRun } = useAgentAnalysis({
    agentId: 'customer-agent',
    enabled: shopCustomers.length > 0,
    buildPrompt: () => {
      const role = agentConfig?.systemPrompt || "Sen GoodTires do'konining MIJOZLAR AGENTISAN."
      return role + `\n\nMIJOZLAR TAHLILI — TO'LIQ MA'LUMOT:

👥 UMUMIY:
- Jami: ${shopCustomers.length} ta | VIP: ${vipCount} | Sodiq: ${loyalCount} | Yangi: ${newCount}
- Nasiya qarzdor: ${debtors.length} ta, jami qarz: ${totalDebt.toLocaleString()} so'm
- 7 kun ichida tug'ilgan kun: ${birthdaySoon7.length} ta (30 kun: ${birthdaySoon30.length} ta)

🎂 YAQIN TUG'ILGAN KUNLAR (7 kun):
${birthdaySoon7.slice(0, 5).map(c => `- ${c.name} (${c.phone}): ${getDaysUntilBirthday(c.birthDate)} kun qoldi`).join('\n') || 'yo\'q'}

🏆 TOP XARIDORLAR (top-5):
${[...customerProfiles].sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 5).map((p, i) => `${i+1}. ${p.name}: ${p.totalOrders} xarid, ${p.totalSpend.toLocaleString()} so'm`).join('\n') || 'yo\'q'}

⚠️ XAVF OSTIDA (6 oydan beri kelmagan):
${atRisk.map(p => `- ${p.name}: oxirgi ${p.lastSaleDate?.slice(0,10)}, jami ${p.totalSpend.toLocaleString()} so'm`).join('\n') || 'yo\'q'}

📱 MANBALAR: ${Object.entries(sourceCounts).map(([s,c]) => `${SOURCE_LABELS[s]||s}: ${c}`).join(', ') || 'yo\'q'}

❌ BEKOR: ${cancelledSales.length} ta (${((cancelledSales.length / Math.max(1, completedSales.length + cancelledSales.length)) * 100).toFixed(1)}%)
📦 FAOL BRONLAR: ${reservations.length} ta
🎯 FAOL AKSIYALAR: ${activePromos.length > 0 ? activePromos.map(p => p.name).join(', ') : 'yo\'q'}

VAZIFALAR:
1. Xavf ostidagi mijozlarni qayta jalb qilish rejasi
2. Tug'ilgan kunlilarga taklif rejasi
3. Bekor qilishlarning asosiy sababini bartaraf etish
4. Sodiqlik dasturi optimizatsiyasi`
    },
    deps: [version, selectedShopId, shopCustomers.length, completedSales.length, reservations.length, agentConfig?.tools?.join()],
  })

  useEffect(() => {
    if (analysis && !analysis.raw) {
      analysis.alerts?.forEach(a => addActivity({ agentId: 'customer', type: 'ALERT', message: a.message }))
      analysis.recommendations?.slice(0, 2).forEach(r => addActivity({ agentId: 'customer', type: 'RECOMMENDATION', message: r.action }))
    }
  }, [analysis])

  // AiChat uchun keng system prompt (bot funksiyalari bilan)
  const chatSystemPrompt = useMemo(() => {
    const base = agentConfig?.systemPrompt || "Sen GoodTires shina va disk do'konining MIJOZLAR AGENTI va SAVDO BOTisan."
    const shop = shopInfo?.shop || {}
    const igHandle = shopInfo?.instagram?.handle || ''

    const shopSection = (shop.name || shop.address || shop.hours) ? `
=== DO'KON MA'LUMOTI ===
${shop.name ? `Nomi: ${shop.name}` : ''}
${shop.address ? `Manzil: ${shop.address}` : ''}
${shop.hours ? `Ish vaqti: ${shop.hours}` : ''}
${shop.phone ? `Telefon: ${shop.phone}` : ''}
${shop.locationUrl ? `Lokatsiya: ${shop.locationUrl}` : ''}` : ''

    const stockSection = stockInfo.length > 0 ? `
=== ZAXIRADAGI TOVARLAR ===
${stockInfo.slice(0, 20).map(p => `- ${p.name}${p.brand ? ` (${p.brand})` : ''}: naqd ${p.price?.toLocaleString()} so'm, nasiya ${p.installmentPrice?.toLocaleString() || '?'} so'm | Zaxira: ${p.inStock} ta`).join('\n')}` : ''

    const customersSection = `
=== MIJOZLAR HOLATI ===
Jami: ${shopCustomers.length} ta | VIP: ${vipCount} | Sodiq: ${loyalCount} | Yangi: ${newCount}
Nasiya qarz: ${totalDebt.toLocaleString()} so'm (${debtors.length} ta mijoz)
Faol bronlar: ${reservations.length} ta`

    return base + shopSection + stockSection + customersSection + `

=== SENING VAZIFANG ===
1. INSTAGRAM/TELEGRAM SAVOLLARGA JAVOB: Mijoz tovar haqida so'rasa — narxini, o'lchamini, brendini, zaxirada borligini to'liq ayt
2. ALTERNATIVALAR TAKLIF ET: Mijoz ikkilansa — o'xshash tovarlarni solishtir, afzalliklarini tushuntir
3. SOTUV OCHIRGUNCHA OLIB BOR: Har bir savolni sotuvga yo'naltirishga harakat qil
4. DO'KON MA'LUMOTI: Ish vaqti, manzil so'rasa — berilgan ma'lumotlardan ayt
5. LOKATSIYA: Mijoz manzil/lokatsiya so'rasa Telegram uchun: ${shop.locationUrl || 'Manzil kiritilmagan (Admin Panel dan kiriting)'}
6. BRON QILISH: Mijoz tovarni bron qilmoqchi bo'lsa — maksimum 24 soatga, ombor agentiga buyruq berish mumkin. Bron uchun: mijoz ismi + telefon + tovar nomi + necha soatga kerak
7. NASIYA: Nasiya imkoniyati bor — instalment bazaviy narxda, tashkilot orqali

=== JAVOB USLUBI ===
- O'zbek tilida, samimiy va professional
- Qisqa, aniq — ortiqcha texnik tafsilot yozma
- Savdo tilida gapir: "Ha, bu tovar zaxirada bor", "Buning o'rniga ... ni ham ko'rish mumkin"
- Agar aniq tovar yo'q bo'lsa — o'xshash variantni taklif qil
${igHandle ? `- Instagram: ${igHandle}` : ''}`
  }, [agentConfig?.systemPrompt, shopInfo, stockInfo.length, shopCustomers.length, vipCount, loyalCount, totalDebt, debtors.length, reservations.length])

  const igEnabled = shopInfo?.instagram?.enabled
  const igWebhook = shopInfo?.instagram?.webhookUrl
  const igHandle  = shopInfo?.instagram?.handle

  const SECTIONS = [
    { id: 'table',        label: 'Mijozlar jadvali', Icon: Users },
    { id: 'reservations', label: `Bronlar${reservations.length ? ` (${reservations.length})` : ''}`, Icon: Package },
    { id: 'bot',          label: 'DM Bot',            Icon: MessageCircle },
  ]

  return (
    <div className="space-y-5">
      {/* Auto tahlil */}
      <AgentAnalysisPanel loading={loading} analysis={analysis} error={error} refresh={refresh} accentColor="text-[#3b82f6]" onTriggerRun={triggerRun} triggering={triggering} source={source} lastRun={lastRun} />

      {/* Statistika kartochkalari */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'VIP mijozlar',  value: vipCount,       sub: 'Oltin daraja',           color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
          { label: 'Sodiq',         value: loyalCount,     sub: 'Kumush daraja',           color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
          { label: 'Yangi',         value: newCount,       sub: 'Jalb qilish imkoni',      color: 'text-accent-green', bg: 'bg-accent-green/10', border: 'border-accent-green/20' },
          { label: 'Qarzdorlar',    value: debtors.length, sub: totalDebt > 0 ? (totalDebt/1000000).toFixed(1)+' mln so\'m' : '—', color: 'text-accent-red', bg: 'bg-accent-red/10', border: 'border-accent-red/20' },
        ].map(({ label, value, sub, color, bg, border }) => (
          <div key={label} className={`p-4 rounded-2xl border ${border} ${bg}`}>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-sm font-medium text-text-primary mt-0.5">{label}</p>
            <p className="text-xs text-text-muted mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Bo'lim tanlash */}
      <div className="flex gap-2 flex-wrap">
        {SECTIONS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setActiveSection(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              activeSection === id
                ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/30'
                : 'text-text-muted border-border hover:bg-bg-secondary'
            }`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── JADVAL ── */}
        {activeSection === 'table' && (
          <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Filtr qator */}
            <div className="flex gap-2 flex-wrap">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ism yoki telefon..."
                className="flex-1 min-w-44 bg-bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-blue" />

              {/* Daraja filtri */}
              <div className="flex gap-1">
                {['all', 'gold', 'silver', 'none'].map(lv => (
                  <button key={lv} onClick={() => setFilterLoyalty(lv)}
                    className={`px-3 py-2 rounded-xl text-xs border transition-colors ${filterLoyalty === lv ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/30' : 'border-border text-text-muted hover:bg-bg-secondary'}`}>
                    {lv === 'all' ? 'Barchasi' : lv === 'gold' ? 'VIP' : lv === 'silver' ? 'Sodiq' : 'Yangi'}
                  </button>
                ))}
              </div>

              {/* Manba filtri */}
              <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
                className="bg-bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none">
                <option value="all">Barcha manbalar</option>
                {Object.entries(SOURCE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label} ({sourceCounts[val] || 0})</option>
                ))}
              </select>
            </div>

            {/* Jadval */}
            <div className="border border-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-bg-secondary">
                      <th className="text-left px-4 py-3 text-text-secondary font-medium">Mijoz</th>
                      <th className="text-left px-4 py-3 text-text-secondary font-medium">Telefon</th>
                      <th className="text-center px-4 py-3 text-text-secondary font-medium">Daraja</th>
                      <th className="text-right px-4 py-3 text-text-secondary font-medium">Xaridlar</th>
                      <th className="text-right px-4 py-3 text-text-secondary font-medium">Jami</th>
                      <th className="text-right px-4 py-3 text-text-secondary font-medium">Qarz</th>
                      <th className="text-left px-4 py-3 text-text-secondary font-medium">Oxirgi xarid</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 50).map(c => {
                      const badge = LOYALTY_BADGE[c.loyaltyLevel || 'none'] || LOYALTY_BADGE.none
                      const daysSinceLast = c.lastSaleDate ? Math.floor((Date.now() - new Date(c.lastSaleDate)) / 86400000) : null
                      const isAtRisk = daysSinceLast !== null && daysSinceLast > 180
                      const hasBirthday = getDaysUntilBirthday(c.birthDate) <= 7
                      return (
                        <tr key={c.id}
                          onClick={() => setProfileModal(c)}
                          className={`border-b border-border/50 hover:bg-bg-secondary/50 transition-colors cursor-pointer ${isAtRisk ? 'bg-red-500/3' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="font-medium text-text-primary">{c.name}</p>
                                {c.carModel && <p className="text-xs text-text-muted">{c.carModel}</p>}
                              </div>
                              {hasBirthday && <Calendar size={13} className="text-yellow-400" title="Tug'ilgan kun yaqin" />}
                              {isAtRisk && <AlertTriangle size={13} className="text-accent-red" title="6 oydan beri kelmagan" />}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-text-muted">{c.phone || '—'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs border ${badge.cls}`}>{badge.label}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-text-primary">{c.totalOrders}</td>
                          <td className="px-4 py-3 text-right text-text-primary">{c.totalSpend > 0 ? c.totalSpend.toLocaleString() + " so'm" : '—'}</td>
                          <td className="px-4 py-3 text-right">
                            {(c.installmentDebt || 0) > 0
                              ? <span className="text-accent-red">{c.installmentDebt.toLocaleString()} so'm</span>
                              : <span className="text-text-muted">—</span>}
                          </td>
                          <td className="px-4 py-3 text-text-muted">{c.lastSaleDate ? c.lastSaleDate.slice(0, 10) : '—'}</td>
                          <td className="px-4 py-3">
                            <button onClick={e => { e.stopPropagation(); setReserveModal(c) }}
                              className="px-2.5 py-1 rounded-lg text-xs border border-accent-blue/30 text-accent-blue hover:bg-accent-blue/10 transition-colors flex items-center gap-1">
                              <Package size={11} /> Bron
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {filtered.length > 50 && (
                <div className="px-4 py-3 text-xs text-text-muted border-t border-border bg-bg-secondary">
                  {Math.min(50, filtered.length)} / {filtered.length} ta ko'rsatilmoqda
                </div>
              )}
              {filtered.length === 0 && (
                <div className="py-10 text-center text-text-muted text-sm">Mijoz topilmadi</div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── BRONLAR ── */}
        {activeSection === 'reservations' && (
          <motion.div key="reservations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {reservations.length === 0 ? (
              <div className="py-12 text-center text-text-muted text-sm border border-border rounded-2xl">Faol bron yo'q</div>
            ) : reservations.map(rv => {
              const prod = products.find(p => p.id === rv.product_id)
              const until = new Date(rv.reserved_until)
              const minutesLeft = Math.round((until - Date.now()) / 60000)
              return (
                <div key={rv.id} className="flex items-center justify-between p-4 border border-border rounded-2xl bg-bg-secondary">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center">
                      <Package size={15} className="text-accent-blue" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary text-sm">{rv.product_name || prod?.name || `Item #${rv.item_id}`}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {rv.customer_name && <span className="text-xs text-text-muted flex items-center gap-1"><Users size={10} />{rv.customer_name}</span>}
                        {rv.customer_phone && <span className="text-xs text-text-muted flex items-center gap-1"><Phone size={10} />{rv.customer_phone}</span>}
                      </div>
                      {rv.notes && <p className="text-xs text-text-muted mt-0.5 italic">{rv.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-medium text-text-primary flex items-center gap-1 justify-end">
                        <Clock size={11} /> {until.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })} gacha
                      </p>
                      <p className={`text-xs mt-0.5 ${minutesLeft < 60 ? 'text-accent-red' : 'text-text-muted'}`}>
                        {minutesLeft < 60 ? `${minutesLeft} daqiqa qoldi` : `${Math.round(minutesLeft / 60)} soat qoldi`}
                      </p>
                    </div>
                    <button onClick={() => handleCancelReservation(rv.id)} disabled={cancellingId === rv.id}
                      className="p-2 rounded-xl border border-accent-red/30 text-accent-red hover:bg-accent-red/10 transition-colors disabled:opacity-40">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </motion.div>
        )}

        {/* ── DM BOT ── */}
        {activeSection === 'bot' && (
          <motion.div key="bot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">

            {/* Holat kartasi */}
            <div className={`flex items-center gap-3 p-4 rounded-2xl border ${igEnabled && igWebhook ? 'border-pink-500/30 bg-pink-500/5' : 'border-border bg-bg-secondary'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${igEnabled && igWebhook ? 'bg-pink-500/15' : 'bg-bg-primary border border-border'}`}>
                <IgIcon size={18} className={igEnabled && igWebhook ? 'text-pink-500' : 'text-text-muted'} />
              </div>
              <div className="flex-1">
                {igEnabled && igHandle ? (
                  <>
                    <p className="text-sm font-semibold text-text-primary">{igHandle.startsWith('@') ? igHandle : `@${igHandle}`}</p>
                    <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5"><Link2 size={10} /> make.com orqali ulangan</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-text-secondary">Instagram DM Bot ulanmagan</p>
                    <p className="text-xs text-text-muted mt-0.5">Admin panel → AI Agentlar → Mijozlar agenti → Integratsiyalar</p>
                  </>
                )}
              </div>
              {igEnabled && igWebhook && (
                <span className="text-xs px-2 py-1 rounded-full bg-accent-green/10 text-accent-green border border-accent-green/20">Faol</span>
              )}
            </div>

            {/* Do'kon ma'lumoti holati */}
            <div className="p-4 rounded-2xl border border-border bg-bg-secondary space-y-2">
              <p className="text-xs font-medium text-text-secondary flex items-center gap-1.5"><Info size={12} /> Bot javoblar uchun do'kon ma'lumoti</p>
              {[
                { icon: MapPin, label: 'Manzil',     value: shopInfo?.shop?.address },
                { icon: Clock,  label: 'Ish vaqti',  value: shopInfo?.shop?.hours },
                { icon: Phone,  label: 'Telefon',    value: shopInfo?.shop?.phone },
                { icon: Link2,  label: 'Lokatsiya',  value: shopInfo?.shop?.locationUrl },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                  <Icon size={12} className={value ? 'text-accent-green' : 'text-text-muted'} />
                  <span className="text-text-muted w-20">{label}:</span>
                  <span className={value ? 'text-text-primary' : 'text-text-muted italic'}>{value || 'kiritilmagan'}</span>
                </div>
              ))}
              {!shopInfo?.shop?.address && (
                <p className="text-xs text-amber-400 mt-2">Admin panel → AI Agentlar → Mijozlar agenti → Integratsiyalar dan to'ldiring</p>
              )}
            </div>

            {/* Bot qanday ishlaydi */}
            {(!igEnabled || !igWebhook) && (
              <div className="p-4 rounded-2xl border border-amber-400/20 bg-amber-400/5">
                <p className="text-xs font-medium text-text-primary mb-3">make.com orqali ulash qadamlari:</p>
                <ol className="space-y-2 text-xs text-text-secondary">
                  <li className="flex gap-2"><span className="text-amber-400 font-bold flex-shrink-0">1.</span> make.com da yangi scenario yarating</li>
                  <li className="flex gap-2"><span className="text-amber-400 font-bold flex-shrink-0">2.</span> Trigger: <strong>Instagram → Watch Comments / Watch Direct Messages</strong></li>
                  <li className="flex gap-2"><span className="text-amber-400 font-bold flex-shrink-0">3.</span> Action: <strong>HTTP → Make a Request</strong> — bizning Webhook URL ga POST yuboring (mijoz xabari bilan)</li>
                  <li className="flex gap-2"><span className="text-amber-400 font-bold flex-shrink-0">4.</span> AI javob olganingizdan keyin: <strong>Instagram → Create a Comment Reply / Send a Direct Message</strong></li>
                  <li className="flex gap-2"><span className="text-amber-400 font-bold flex-shrink-0">5.</span> Webhook URL va Instagram handle ni Admin Panel → Integratsiyalar ga kiriting</li>
                </ol>
              </div>
            )}

            {/* AI suhbat (qo'lda test qilish) */}
            <div>
              <p className="text-xs font-medium text-text-secondary mb-2 flex items-center gap-1.5">
                <MessageCircle size={12} /> Mijoz savoli simulyatsiyasi — bot qanday javob berishini test qiling
              </p>
              <AiChat agentId="customer-agent" colorClass="accent-blue"
                systemPrompt={chatSystemPrompt}
                placeholder="Masalan: 205/55 R16 shina bormi? Narxi qancha? Qachon kelsa bo'ladi?" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Jadval tabi uchun AI chat */}
      {activeSection === 'table' && (
        <AiChat agentId="customer-agent" colorClass="accent-blue"
          systemPrompt={chatSystemPrompt}
          placeholder="Mijozlar, bronlar, sodiqlik haqida so'rang..." />
      )}

      {/* Mijoz profil modali */}
      {profileModal && (
        <CustomerProfileModal
          customer={profileModal}
          sales={_allSales}
          reservations={reservations}
          onClose={() => setProfileModal(null)}
          onReserve={() => { setReserveModal(profileModal); setProfileModal(null) }}
        />
      )}

      {/* Bron modali */}
      {reserveModal && (
        <ReservationModal
          customer={reserveModal}
          products={products}
          items={items}
          onClose={() => setReserveModal(null)}
          onDone={() => { setReserveModal(null); loadReservations(); setActiveSection('reservations') }}
        />
      )}
    </div>
  )
}

export default CustomerTab
