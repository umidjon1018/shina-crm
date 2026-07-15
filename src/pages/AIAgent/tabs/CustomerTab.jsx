import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, AlertTriangle, Star, Clock, Phone, Calendar, Package, X, Check } from 'lucide-react'
import { useAgentActivityStore } from '../../../store/agentActivityStore'
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
            <label className="text-xs text-text-secondary mb-1.5 block">Bron muddati</label>
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

function CustomerTab({ aiData = {} }) {
  const { addActivity } = useAgentActivityStore()
  const { version } = useDataStore()
  const { selectedShopId } = useShopStore()

  const {
    customers: MOCK_CUSTOMERS = [],
    sales: _allSales = [],
    products: _allProducts = [],
    promotions: MOCK_PROMOTIONS = [],
  } = aiData

  const [activeSection, setActiveSection] = useState('table') // 'table' | 'reservations'
  const [reservations, setReservations] = useState([])
  const [products, setProducts] = useState([])
  const [items, setItems] = useState([])
  const [reserveModal, setReserveModal] = useState(null) // customer object
  const [search, setSearch] = useState('')
  const [filterLoyalty, setFilterLoyalty] = useState('all')
  const [cancellingId, setCancellingId] = useState(null)

  const filterShop = arr => selectedShopId === 'all' ? arr : arr.filter(s => String(s.shopId) === String(selectedShopId))
  const shopCustomers = selectedShopId === 'all' ? MOCK_CUSTOMERS : MOCK_CUSTOMERS.filter(c => !c.shopId || String(c.shopId) === String(selectedShopId))
  const completedSales = filterShop(_allSales).filter(s => s.status !== 'cancelled')
  const cancelledSales = filterShop(_allSales).filter(s => s.status === 'cancelled' && !s._isExchange)
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

  // Har mijoz uchun profil
  const customerProfiles = useMemo(() => {
    const map = {}
    shopCustomers.forEach(c => {
      map[c.id] = {
        ...c,
        totalSpend: 0, totalOrders: 0, cancelCount: 0,
        discountUsed: 0, lastSaleDate: null,
      }
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

  // Jadval filtri
  const filtered = useMemo(() => {
    let list = customerProfiles
    if (filterLoyalty !== 'all') list = list.filter(c => (c.loyaltyLevel || 'none') === filterLoyalty)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c => c.name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.phone2?.includes(q))
    }
    return list.sort((a, b) => b.totalSpend - a.totalSpend)
  }, [customerProfiles, search, filterLoyalty])

  // Tahlil uchun
  const vipCount    = shopCustomers.filter(c => c.loyaltyLevel === 'gold').length
  const loyalCount  = shopCustomers.filter(c => c.loyaltyLevel === 'silver').length
  const newCount    = shopCustomers.filter(c => !c.loyaltyLevel || c.loyaltyLevel === 'none').length
  const debtors     = shopCustomers.filter(c => (c.installmentDebt || 0) > 0)
  const totalDebt   = debtors.reduce((s, c) => s + (c.installmentDebt || 0), 0)
  const birthdaySoon7  = shopCustomers.filter(c => getDaysUntilBirthday(c.birthDate) <= 7)
  const birthdaySoon30 = shopCustomers.filter(c => getDaysUntilBirthday(c.birthDate) <= 30)
  const sixMonthsAgo   = new Date(Date.now() - 180 * 86400000).toISOString()
  const atRisk = customerProfiles.filter(p => p.totalOrders > 0 && p.lastSaleDate && p.lastSaleDate < sixMonthsAgo).slice(0, 5)
  const topDiscount = [...customerProfiles].sort((a, b) => b.discountUsed - a.discountUsed).filter(p => p.discountUsed > 0).slice(0, 5)
  const cancelReasons = {}
  cancelledSales.forEach(s => { const r = s.cancelReason || "Ko'rsatilmagan"; cancelReasons[r] = (cancelReasons[r] || 0) + 1 })
  const activePromos = MOCK_PROMOTIONS.filter(p => p.isActive)

  const { loading, analysis, error, refresh } = useAgentAnalysis({
    agentId: 'customer-agent',
    enabled: shopCustomers.length > 0,
    buildPrompt: () => `MIJOZLAR TAHLILI — TO'LIQ MA'LUMOT:

👥 UMUMIY:
- Jami: ${shopCustomers.length} ta | VIP: ${vipCount} | Sodiq: ${loyalCount} | Yangi: ${newCount}
- Nasiya qarzdor: ${debtors.length} ta, jami qarz: ${totalDebt.toLocaleString()} so'm
- 7 kun ichida tug'ilgan kun: ${birthdaySoon7.length} ta (30 kun: ${birthdaySoon30.length} ta)

🎂 YAQIN TUG'ILGAN KUNLAR (7 kun):
${birthdaySoon7.slice(0, 5).map(c => `- ${c.name} (${c.phone}): ${getDaysUntilBirthday(c.birthDate)} kun qoldi`).join('\n') || 'yo\'q'}

🏆 TOP XARIDORLAR (top-5):
${[...customerProfiles].sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 5).map((p, i) => `${i+1}. ${p.name}: ${p.totalOrders} xarid, ${p.totalSpend.toLocaleString()} so'm, chegirma: ${p.discountUsed.toLocaleString()} so'm`).join('\n') || 'yo\'q'}

⚠️ XAVF OSTIDA (6 oydan beri kelmagan):
${atRisk.map(p => `- ${p.name}: oxirgi ${p.lastSaleDate?.slice(0,10)}, jami ${p.totalSpend.toLocaleString()} so'm sarflagan`).join('\n') || 'yo\'q'}

💰 CHEGIRMAGA SEZGIR:
${topDiscount.map(p => `- ${p.name}: ${p.discountUsed.toLocaleString()} so'm chegirma, ${p.totalOrders} xarid`).join('\n') || 'yo\'q'}

❌ HAQIQIY BEKOR (pul qaytarilgan): ${cancelledSales.length} ta — bekor foizi: ${((cancelledSales.length / Math.max(1, completedSales.length + cancelledSales.length)) * 100).toFixed(1)}%
🔄 ALMASHTIRISH (bu BEKOR EMAS — tovar almashtirildi, yangi sotuv yaratildi): ${exchangedSales.length} ta
Bekor sabablari: ${Object.entries(cancelReasons).sort((a,b) => b[1]-a[1]).slice(0,3).map(([r,n]) => `${r}(${n})`).join(', ') || 'yo\'q'}

📦 FAOL BRONLAR: ${reservations.length} ta
🎯 FAOL AKSIYALAR: ${activePromos.length > 0 ? activePromos.map(p => p.name).join(', ') : 'yo\'q'}

VAZIFALAR:
1. Xavf ostidagi mijozlarni qayta jalb qilish rejasi
2. Chegirmaga sezgirlarga optimal taklif
3. Tug'ilgan kunlilarga Telegram tabrik xabari rejasi
4. Bekor qilishlarning asosiy sababini bartaraf etish
5. Marketing agenti bilan: sodiqlik + sarafanniy reklama rejasi`,
    deps: [version, selectedShopId, shopCustomers.length, completedSales.length, reservations.length],
  })

  useEffect(() => {
    if (analysis && !analysis.raw) {
      analysis.alerts?.forEach(a => addActivity({ agentId: 'customer', type: 'ALERT', message: a.message }))
      analysis.recommendations?.slice(0, 2).forEach(r => addActivity({ agentId: 'customer', type: 'RECOMMENDATION', message: r.action }))
    }
  }, [analysis])

  return (
    <div className="space-y-6">
      <AgentAnalysisPanel loading={loading} analysis={analysis} error={error} refresh={refresh} accentColor="text-[#3b82f6]" />

      {/* Bo'lim tanlash */}
      <div className="flex gap-2">
        {[
          { id: 'table', label: 'Mijozlar jadvali', Icon: Users },
          { id: 'reservations', label: `Bronlar${reservations.length ? ` (${reservations.length})` : ''}`, Icon: Package },
        ].map(({ id, label, Icon }) => (
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
        {activeSection === 'table' && (
          <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Filter qator */}
            <div className="flex gap-2 flex-wrap">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ism yoki telefon..."
                className="flex-1 min-w-48 bg-bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-blue" />
              {['all', 'gold', 'silver', 'none'].map(lv => (
                <button key={lv} onClick={() => setFilterLoyalty(lv)}
                  className={`px-3 py-2 rounded-xl text-xs border transition-colors ${filterLoyalty === lv ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/30' : 'border-border text-text-muted hover:bg-bg-secondary'}`}>
                  {lv === 'all' ? 'Barchasi' : lv === 'gold' ? 'VIP' : lv === 'silver' ? 'Sodiq' : 'Yangi'}
                </button>
              ))}
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
                      <th className="text-right px-4 py-3 text-text-secondary font-medium">Jami sarflagan</th>
                      <th className="text-right px-4 py-3 text-text-secondary font-medium">Qarz</th>
                      <th className="text-left px-4 py-3 text-text-secondary font-medium">Oxirgi xarid</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 50).map((c, idx) => {
                      const badge = LOYALTY_BADGE[c.loyaltyLevel || 'none'] || LOYALTY_BADGE.none
                      const daysSinceLast = c.lastSaleDate ? Math.floor((Date.now() - new Date(c.lastSaleDate)) / 86400000) : null
                      const isAtRisk = daysSinceLast !== null && daysSinceLast > 180
                      const hasBirthday = getDaysUntilBirthday(c.birthDate) <= 7
                      return (
                        <tr key={c.id} className={`border-b border-border/50 hover:bg-bg-secondary/50 transition-colors ${isAtRisk ? 'bg-red-500/3' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="font-medium text-text-primary">{c.name}</p>
                                {c.carModel && <p className="text-xs text-text-muted">{c.carModel}</p>}
                              </div>
                              {hasBirthday && <span title="Tug'ilgan kun yaqin"><Calendar size={13} className="text-yellow-400" /></span>}
                              {isAtRisk && <span title="6 oydan beri kelmagan"><AlertTriangle size={13} className="text-accent-red" /></span>}
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
                          <td className="px-4 py-3 text-text-muted text-sm">
                            {c.lastSaleDate ? c.lastSaleDate.slice(0, 10) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => setReserveModal(c)}
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

        {activeSection === 'reservations' && (
          <motion.div key="reservations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {reservations.length === 0 ? (
              <div className="py-12 text-center text-text-muted text-sm border border-border rounded-2xl">
                Faol bron yo'q
              </div>
            ) : reservations.map(rv => {
              const prod = products.find(p => p.id === rv.product_id)
              const until = new Date(rv.reserved_until)
              const minutesLeft = Math.round((until - Date.now()) / 60000)
              return (
                <div key={rv.id} className="flex items-center justify-between p-4 border border-border rounded-2xl bg-bg-secondary hover:bg-bg-secondary/80 transition-colors">
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
      </AnimatePresence>

      <AiChat agentId="customer-agent" colorClass="accent-blue"
        systemPrompt={`Sen MIJOZLAR AGENTI — shina/g'ildirak do'kon CRM tizimining mijoz muloqoti tahlilchisisisan.

=== JORIY MIJOZLAR MA'LUMOTI ===
Jami mijozlar: ${shopCustomers.length} ta | VIP: ${vipCount} | Sodiq: ${loyalCount} | Yangi: ${newCount}
Nasiya qarzdor: ${debtors.length} ta, jami qarz: ${totalDebt.toLocaleString()} so'm
7 kun ichida tug'ilgan kun: ${birthdaySoon7.length} ta | 30 kun: ${birthdaySoon30.length} ta
Xavf ostida (6 oy kelmagan): ${atRisk.length} ta
Faol bronlar: ${reservations.length} ta
Tugallangan sotuvlar: ${completedSales.length} ta | Haqiqiy bekor: ${cancelledSales.length} ta

JAVOB USLUBI: O'zbek tilida, qisqa va aniq. Mijozlar, sodiqlik, bronlar haqida savollarga javob ber.`}
        placeholder="Mijozlar, bronlar, sodiqlik haqida so'rang..." />

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
