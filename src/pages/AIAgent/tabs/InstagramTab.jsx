import { useState, useMemo, useRef, useEffect } from 'react'
import { Globe, Users, ShoppingBag, AlertCircle, X, ChevronRight, Car, Star, Zap, MessageCircle, TrendingUp, BarChart2, Send, Loader2 } from 'lucide-react'
import { streamChat } from '../../../api/aiService'

// ─────────── helpers ───────────
function fmtMoney(n) {
  if (!n) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' mln'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + ' ming'
  return String(n)
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const LOYALTY_LABEL = {
  vip: { label: 'VIP', color: 'text-yellow-400 bg-yellow-400/10' },
  gold: { label: 'Oltin', color: 'text-yellow-400 bg-yellow-400/10' },
  silver: { label: 'Kumush', color: 'text-blue-400 bg-blue-400/10' },
  loyal: { label: 'Sodiq', color: 'text-accent-green bg-accent-green/10' },
  none: { label: 'Yangi', color: 'text-text-muted bg-bg-secondary' },
}

// ─────────── Per-customer stats ───────────
function buildCustomerStats(customers, sales) {
  const byId = {}
  sales.forEach(s => {
    if (!s.customerId) return
    if (!byId[s.customerId]) byId[s.customerId] = { spent: 0, count: 0, debt: 0, last: null, purchases: [] }
    const row = byId[s.customerId]
    if (s.status === 'completed') {
      row.spent += s.total || 0
      row.count++
      if (!row.last || s.createdAt > row.last) row.last = s.createdAt
      row.purchases.unshift(s)
    }
    if (s.installmentDebt) row.debt += s.installmentDebt
  })
  return customers.map(c => ({ ...c, ...byId[c.id] || { spent: 0, count: 0, debt: 0, last: null, purchases: [] } }))
}

// ─────────── Monthly chart ───────────
function MonthlyChart({ sales, socialIds }) {
  const months = useMemo(() => {
    const now = new Date()
    const result = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toISOString().slice(0, 7)
      result.push({ key, label: d.toLocaleDateString('uz-UZ', { month: 'short' }), count: 0, amount: 0 })
    }
    sales.forEach(s => {
      if (!s.customerId || !socialIds.has(s.customerId) || s.status !== 'completed') return
      const mo = (s.createdAt || '').slice(0, 7)
      const bucket = result.find(r => r.key === mo)
      if (bucket) { bucket.count++; bucket.amount += s.total || 0 }
    })
    return result
  }, [sales, socialIds])

  const maxCount = Math.max(...months.map(m => m.count), 1)

  return (
    <div className="p-4 rounded-2xl border border-border bg-bg-secondary">
      <p className="text-sm font-medium text-text-primary mb-4 flex items-center gap-2">
        <BarChart2 size={14} className="text-pink-400" />
        So'nggi 6 oy — ijtimoiy tarmoq xaridlari
      </p>
      <div className="flex items-end gap-2 h-24">
        {months.map(m => (
          <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs text-text-muted">{m.count || ''}</span>
            <div
              className="w-full rounded-t bg-pink-500/60 hover:bg-pink-500 transition-colors min-h-[4px]"
              style={{ height: `${Math.max((m.count / maxCount) * 80, 4)}px` }}
              title={`${m.count} ta xarid — ${fmtMoney(m.amount)} so'm`}
            />
            <span className="text-xs text-text-muted">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────── AI tahlil panel ───────────
function AiAnalysisPanel({ customer, customerAgentId }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const abortRef = useRef(false)

  const run = () => {
    abortRef.current = false
    setLoading(true)
    setStarted(true)
    setText('')

    const purchases = (customer.purchases || []).slice(0, 5)
      .map(s => `- ${fmtDate(s.createdAt)}: ${fmtMoney(s.total)} so'm${s.installmentDebt ? ' (nasiya)' : ''}`)
      .join('\n')

    const userMsg = `Bu mijoz haqida chuqur tahlil qil:

MIJOZ MA'LUMOTI:
- Ism: ${customer.name}
- Telefon: ${customer.phone || "yo'q"}
- Instagram: ${customer.instagram ? '@' + customer.instagram : "yo'q"}
- Avtomobil: ${customer.carModel || "noma'lum"}
- Sodiqlik: ${LOYALTY_LABEL[customer.loyaltyLevel || 'none']?.label || 'Yangi'}

XARIDLAR:
- Jami: ${customer.count} ta xarid, ${fmtMoney(customer.spent)} so'm sarflagan
- Qarz: ${customer.debt ? fmtMoney(customer.debt) + " so'm" : "yo'q"}
- So'nggi xarid: ${fmtDate(customer.last)}
${purchases ? `\nSo'nggi xaridlar:\n` + purchases : ''}

Quyidagilarni tahlil qil va strukturalangan javob ber:
1. XARAKTER PROFILI: Qanday mijoz? Xarid qilish odati, xulq-atvori
2. AVTOMOBIL EHTIYOJI: ${customer.carModel || 'noma\'lum'} uchun qanday shina/disk kerak bo'lishi mumkin? Qachon almashtirishi mumkin?
3. AKSIYA/CHEGIRMA: U chegirmalarni qanday kutadi va qabul qiladi? Qaysi turdagi aksiyalar ta'sirchan?
4. MULOQOT USLUBI: U bilan qanday suhbat qurish kerak? Nima deb murojaat qilish, nima taklif qilish?
5. KEYINGI QADAM: Hozir nima qilish kerak? Qo'ng'iroq/SMS matni yozib ber.`

    streamChat({
      messages: [{ role: 'user', content: userMsg }],
      agentId: customerAgentId,
      onToken: (tok) => { if (!abortRef.current) setText(p => p + tok) },
      onDone: () => { if (!abortRef.current) setLoading(false) },
      onError: (err) => { if (!abortRef.current) { setText('Xato: ' + err); setLoading(false) } },
    })
  }

  useEffect(() => () => { abortRef.current = true }, [])

  if (!started) return (
    <button
      onClick={run}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 text-sm font-medium hover:bg-pink-500/20 transition-colors"
    >
      <Zap size={14} />
      Mijozlar agenti bilan tahlil qilish
    </button>
  )

  return (
    <div className="rounded-xl border border-border bg-bg-primary p-3">
      <div className="flex items-center gap-2 mb-2">
        <Zap size={12} className="text-pink-400" />
        <span className="text-xs font-medium text-pink-400">Mijozlar agenti tahlili</span>
        {loading && <Loader2 size={12} className="text-text-muted animate-spin ml-auto" />}
      </div>
      <div className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
        {text || <span className="text-text-muted animate-pulse">Tahlil qilinmoqda...</span>}
      </div>
    </div>
  )
}

// ─────────── Mijoz profil modali ───────────
function CustomerModal({ customer, onClose, customerAgentId }) {
  const loyaltyInfo = LOYALTY_LABEL[customer.loyaltyLevel || 'none'] || LOYALTY_LABEL.none

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-bg-primary border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 font-bold">
              {customer.name[0]}
            </div>
            <div>
              <p className="font-semibold text-text-primary">{customer.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {customer.instagram && (
                  <span className="text-xs text-pink-400 flex items-center gap-1">
                    <Globe size={10} /> @{customer.instagram}
                  </span>
                )}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${loyaltyInfo.color}`}>{loyaltyInfo.label}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Asosiy info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Xaridlar', value: customer.count, color: 'text-accent-green' },
              { label: 'Sarflagan', value: fmtMoney(customer.spent) + ' so\'m', color: 'text-text-primary' },
              { label: 'Qarz', value: customer.debt ? fmtMoney(customer.debt) + ' so\'m' : '—', color: customer.debt ? 'text-accent-red' : 'text-text-muted' },
              { label: "So'nggi xarid", value: fmtDate(customer.last), color: 'text-text-secondary' },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-3 rounded-xl bg-bg-secondary border border-border">
                <p className="text-xs text-text-muted mb-1">{label}</p>
                <p className={`text-sm font-semibold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Kontakt va avtomobil */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-bg-secondary border border-border">
              <p className="text-xs text-text-muted mb-1">Telefon</p>
              <p className="text-sm text-text-primary">{customer.phone || '—'}</p>
              {customer.phone2 && <p className="text-xs text-text-muted">{customer.phone2}</p>}
            </div>
            <div className="p-3 rounded-xl bg-bg-secondary border border-border flex items-center gap-2">
              <Car size={14} className="text-pink-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-text-muted">Avtomobil</p>
                <p className="text-sm text-text-primary">{customer.carModel || "Noma'lum"}</p>
              </div>
            </div>
          </div>

          {/* Xaridlar tarixi */}
          {(customer.purchases || []).length > 0 && (
            <div>
              <p className="text-xs text-text-muted mb-2 font-medium">So'nggi xaridlar</p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {(customer.purchases || []).slice(0, 6).map((s, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-bg-secondary text-xs">
                    <span className="text-text-muted">{fmtDate(s.createdAt)}</span>
                    <span className="text-text-primary font-medium">{fmtMoney(s.total)} so'm</span>
                    {s.installmentDebt ? <span className="text-amber-400">nasiya</span> : <span className="text-accent-green">naqd</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Tahlil */}
          <AiAnalysisPanel customer={customer} customerAgentId={customerAgentId} />
        </div>
      </div>
    </div>
  )
}

// ─────────── Asosiy tab ───────────
export default function InstagramTab({ aiData, agentConfig, customerAgentConfig }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const customers = aiData?.customers || []
  const sales = aiData?.sales || []

  const igEnabled = agentConfig?.integrations?.instagram?.enabled || false
  const igHandle  = agentConfig?.integrations?.instagram?.handle || ''

  // Social media customers (instagram bor)
  const socialCustomers = useMemo(() => {
    const enriched = buildCustomerStats(customers, sales)
    return enriched.filter(c => c.instagram)
  }, [customers, sales])

  const socialIds = useMemo(() => new Set(socialCustomers.map(c => c.id)), [socialCustomers])

  // Stats
  const totalSpent = socialCustomers.reduce((s, c) => s + c.spent, 0)
  const totalDebt  = socialCustomers.reduce((s, c) => s + c.debt, 0)
  const thisMonth  = useMemo(() => {
    const mo = new Date().toISOString().slice(0, 7)
    return sales.filter(s => socialIds.has(s.customerId) && s.status === 'completed' && (s.createdAt || '').startsWith(mo)).length
  }, [sales, socialIds])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return socialCustomers.filter(c =>
      !q || c.name.toLowerCase().includes(q) || c.instagram.toLowerCase().includes(q) || (c.carModel || '').toLowerCase().includes(q)
    )
  }, [socialCustomers, search])

  const customerAgentId = customerAgentConfig?.id

  return (
    <div className="space-y-5">
      {/* Bot holati banner */}
      {!igEnabled && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-400">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>Instagram komment boti o'chirilgan. <strong>Admin Panel → AI Agentlar → Instagram agenti</strong> da yoqing.</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Instagram mijozlar', value: socialCustomers.length, sub: igHandle ? '@' + igHandle : 'Ulangan akkaunt yo\'q', Icon: Globe, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
          { label: 'Jami xaridlar (so\'m)', value: fmtMoney(totalSpent), sub: socialCustomers.reduce((s,c)=>s+c.count,0) + ' ta sotuv', Icon: ShoppingBag, color: 'text-accent-green', bg: 'bg-accent-green/10', border: 'border-accent-green/20' },
          { label: 'Bu oy xaridlar', value: thisMonth, sub: 'ta sotuv', Icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
          { label: 'Nasiya qarz', value: fmtMoney(totalDebt), sub: totalDebt > 0 ? 'so\'m' : 'Qarz yo\'q', Icon: AlertCircle, color: totalDebt > 0 ? 'text-accent-red' : 'text-text-muted', bg: totalDebt > 0 ? 'bg-accent-red/10' : 'bg-bg-secondary', border: totalDebt > 0 ? 'border-accent-red/20' : 'border-border' },
        ].map(({ label, value, sub, Icon, color, bg, border }) => (
          <div key={label} className={`p-4 rounded-2xl border ${border} ${bg}`}>
            <Icon size={14} className={`${color} mb-2`} />
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-sm font-medium text-text-primary mt-0.5">{label}</p>
            <p className="text-xs text-text-muted mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Oylik grafik */}
      <MonthlyChart sales={sales} socialIds={socialIds} />

      {/* Mijozlar jadvali */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Users size={14} className="text-pink-400" />
            Instagram mijozlar jadvali
            <span className="text-xs text-text-muted font-normal">({socialCustomers.length} ta)</span>
          </p>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Qidirish..."
            className="px-3 py-1.5 text-xs rounded-lg bg-bg-secondary border border-border text-text-primary focus:outline-none focus:border-pink-500/40 w-40"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="py-10 text-center text-text-muted text-sm">
            {socialCustomers.length === 0
              ? 'Hali Instagram bilan bog\'langan mijoz yo\'q. Mijozlar sahifasida Instagram handle kiriting.'
              : 'Qidiruv bo\'yicha natija topilmadi.'}
          </div>
        ) : (
          <div className="rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-secondary text-xs text-text-muted">
                  <th className="text-left px-4 py-2.5">Mijoz</th>
                  <th className="text-left px-4 py-2.5 hidden sm:table-cell">Instagram</th>
                  <th className="text-left px-4 py-2.5 hidden md:table-cell">Avtomobil</th>
                  <th className="text-right px-4 py-2.5">Xaridlar</th>
                  <th className="text-right px-4 py-2.5 hidden md:table-cell">Sarflagan</th>
                  <th className="text-right px-4 py-2.5 hidden lg:table-cell">Qarz</th>
                  <th className="px-4 py-2.5 w-6" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const li = LOYALTY_LABEL[c.loyaltyLevel || 'none'] || LOYALTY_LABEL.none
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelected(c)}
                      className={`border-b border-border/50 hover:bg-bg-secondary cursor-pointer transition-colors ${i % 2 === 0 ? '' : 'bg-bg-secondary/30'}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-pink-500/20 text-pink-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {c.name[0]}
                          </div>
                          <div>
                            <p className="text-text-primary font-medium text-xs">{c.name}</p>
                            <span className={`text-xs px-1 py-0.5 rounded ${li.color}`}>{li.label}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs text-pink-400">@{c.instagram}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-text-secondary">{c.carModel || '—'}</td>
                      <td className="px-4 py-3 text-right text-xs font-medium text-text-primary">{c.count}</td>
                      <td className="px-4 py-3 text-right hidden md:table-cell text-xs text-accent-green">{fmtMoney(c.spent)} so'm</td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell text-xs">
                        {c.debt ? <span className="text-accent-red">{fmtMoney(c.debt)} so'm</span> : <span className="text-text-muted">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight size={14} className="text-text-muted" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Profil modali */}
      {selected && (
        <CustomerModal
          customer={selected}
          customerAgentId={customerAgentId}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
