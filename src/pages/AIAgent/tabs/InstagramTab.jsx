import { useState, useMemo, useRef, useEffect } from 'react'
import { Globe, Users, ShoppingBag, AlertCircle, X, ChevronRight, Car, Zap, MessageCircle, TrendingUp, BarChart2, Send, Loader2, Clock, Phone, Package, CheckCircle, XCircle } from 'lucide-react'
import { streamChat, getInstagramConversations, getInstagramConversationDetail, getInstagramStats } from '../../../api/aiService'
import { useAgentAnalysis } from '../hooks/useAgentAnalysis'
import AgentAnalysisPanel from '../components/AgentAnalysisPanel'
import { useAgentActivityStore } from '../../../store/agentActivityStore'

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

const PS = 20

function Pagination({ page, total, onPage }) {
  const pages = Math.ceil(total / PS)
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-border text-xs text-text-muted">
      <span>{Math.min((page - 1) * PS + 1, total)} – {Math.min(page * PS, total)} / {total} ta</span>
      <div className="flex gap-1">
        <button disabled={page === 1} onClick={() => onPage(page - 1)}
          className="px-2 py-1 rounded-lg border border-border hover:bg-bg-secondary disabled:opacity-30 disabled:cursor-not-allowed">‹</button>
        <button disabled={page === pages} onClick={() => onPage(page + 1)}
          className="px-2 py-1 rounded-lg border border-border hover:bg-bg-secondary disabled:opacity-30 disabled:cursor-not-allowed">›</button>
      </div>
    </div>
  )
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

// ─────────── DM Suhbatlar ───────────
function DmConversationsPanel() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    getInstagramConversations({ limit: 50 })
      .then(setData)
      .catch(() => setData({ conversations: [], total: 0 }))
      .finally(() => setLoading(false))
  }, [])

  const openDetail = async (conv) => {
    setSelected(conv)
    setDetailLoading(true)
    setDetail(null)
    try {
      const d = await getInstagramConversationDetail(conv.senderId)
      setDetail(d.messages || [])
    } catch { setDetail([]) }
    finally { setDetailLoading(false) }
  }

  if (loading) return <div className="py-8 text-center text-text-muted text-sm"><Loader2 size={16} className="animate-spin inline mr-2" />Yuklanmoqda...</div>

  const convs = data?.conversations || []
  const paged = convs.slice((page - 1) * PS, page * PS)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <MessageCircle size={14} className="text-pink-400" />
          DM Suhbatlar
          <span className="text-xs text-text-muted font-normal">({data?.total || 0} ta foydalanuvchi)</span>
        </p>
      </div>

      {convs.length === 0 ? (
        <div className="py-8 text-center text-text-muted text-sm">Hali DM suhbat yo'q</div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-secondary text-xs text-text-muted">
                <th className="text-left px-4 py-2.5">Foydalanuvchi</th>
                <th className="text-right px-4 py-2.5 hidden sm:table-cell">Xabarlar</th>
                <th className="text-right px-4 py-2.5 hidden md:table-cell">So'nggi faollik</th>
                <th className="text-left px-4 py-2.5 hidden lg:table-cell">Oxirgi xabar</th>
                <th className="px-4 py-2.5 w-6" />
              </tr>
            </thead>
            <tbody>
              {paged.map((c, i) => (
                <tr
                  key={c.senderId}
                  onClick={() => openDetail(c)}
                  className={`border-b border-border/50 hover:bg-bg-secondary cursor-pointer transition-colors ${i % 2 === 0 ? '' : 'bg-bg-secondary/30'}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-pink-500/20 text-pink-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {(c.username || c.senderId)[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-text-primary font-medium text-xs">{c.username ? `@${c.username}` : c.senderId}</p>
                        <p className="text-xs text-text-muted">{c.userMsgs} savol</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-text-secondary hidden sm:table-cell">{c.msgCount} ta</td>
                  <td className="px-4 py-3 text-right text-xs text-text-muted hidden md:table-cell">
                    {c.lastMsg ? new Date(c.lastMsg).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <p className="text-xs text-text-secondary truncate max-w-xs">
                      {c.lastRole === 'assistant' ? '🤖 ' : '👤 '}{c.lastMessage}
                    </p>
                  </td>
                  <td className="px-4 py-3"><ChevronRight size={14} className="text-text-muted" /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} total={convs.length} onPage={setPage} />
        </div>
      )}

      {/* Suhbat detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-bg-primary border border-border rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <p className="font-semibold text-text-primary text-sm">
                {selected.username ? `@${selected.username}` : selected.senderId} — suhbat tarixi
              </p>
              <button onClick={() => setSelected(null)} className="text-text-muted hover:text-text-primary"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {detailLoading && <div className="text-center text-text-muted text-sm py-4"><Loader2 size={14} className="animate-spin inline mr-1" />Yuklanmoqda...</div>}
              {detail?.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-bg-secondary text-text-primary'
                      : 'bg-pink-500/20 text-pink-100'
                  }`}>
                    <p>{msg.message}</p>
                    <p className="text-text-muted text-[10px] mt-1">
                      {new Date(msg.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────── Bronlar va statistika ───────────
function BotStatsPanel() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getInstagramStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-8 text-center text-text-muted text-sm"><Loader2 size={16} className="animate-spin inline mr-2" />Yuklanmoqda...</div>
  if (!stats) return null

  const cs = stats.commentSummary || {}
  const dm = stats.dmSummary || {}
  const reservations = stats.reservations || []

  return (
    <div className="space-y-4">
      {/* Umumiy statistika */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'DM suhbatlar', value: dm.unique_senders || 0, sub: `${dm.total_messages || 0} ta xabar`, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
          { label: 'Kommentlar', value: cs.total || 0, sub: `${cs.unique_users || 0} ta foydalanuvchi`, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
          { label: 'Narx so\'rovlari', value: cs.price_inquiries || 0, sub: 'kommentdan', color: 'text-accent-green', bg: 'bg-accent-green/10', border: 'border-accent-green/20' },
          { label: 'Bot bronlar', value: reservations.length, sub: 'jami', color: 'text-accent-orange', bg: 'bg-accent-orange/10', border: 'border-accent-orange/20' },
        ].map(({ label, value, sub, color, bg, border }) => (
          <div key={label} className={`p-4 rounded-2xl border ${border} ${bg}`}>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-sm font-medium text-text-primary mt-0.5">{label}</p>
            <p className="text-xs text-text-muted mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Komment intent breakdown */}
      {cs.total > 0 && (
        <div className="p-4 rounded-2xl border border-border bg-bg-secondary">
          <p className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
            <BarChart2 size={14} className="text-blue-400" />
            Komment turlari
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {[
              { label: 'Narx so\'rovi', val: cs.price_inquiries, color: 'text-accent-green' },
              { label: 'Ijobiy', val: cs.positive_feedback, color: 'text-yellow-400' },
              { label: 'Emoji', val: cs.emoji_only, color: 'text-pink-400' },
              { label: 'Noaniq', val: cs.unclear, color: 'text-text-muted' },
            ].map(({ label, val, color }) => (
              <div key={label} className="p-2 rounded-xl bg-bg-primary border border-border text-center">
                <p className={`text-lg font-bold ${color}`}>{val || 0}</p>
                <p className="text-text-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bronlar jadvali */}
      <div>
        <p className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Package size={14} className="text-accent-orange" />
          Bot yaratgan bronlar
          <span className="text-xs text-text-muted font-normal">({reservations.length} ta)</span>
        </p>
        {reservations.length === 0 ? (
          <div className="py-6 text-center text-text-muted text-sm rounded-2xl border border-border">Hali bot orqali bron qilinmagan</div>
        ) : (
          <div className="rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-bg-secondary text-text-muted">
                  <th className="text-left px-4 py-2.5">Mijoz</th>
                  <th className="text-left px-4 py-2.5 hidden sm:table-cell">Tovar</th>
                  <th className="text-right px-4 py-2.5 hidden md:table-cell">Narx</th>
                  <th className="text-center px-4 py-2.5">Holat</th>
                  <th className="text-right px-4 py-2.5 hidden lg:table-cell">Vaqt</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r, i) => (
                  <tr key={r.id} className={`border-b border-border/50 ${i % 2 === 0 ? '' : 'bg-bg-secondary/30'}`}>
                    <td className="px-4 py-3">
                      <p className="text-text-primary font-medium">{r.customerName || '—'}</p>
                      {r.customerPhone && <p className="text-text-muted flex items-center gap-1"><Phone size={10} />{r.customerPhone}</p>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-text-secondary">
                      {r.brand && <span className="text-pink-400 mr-1">{r.brand}</span>}
                      {r.productName || '—'}
                      {r.size && <span className="text-text-muted ml-1">({r.size})</span>}
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell text-accent-green">
                      {r.cashPrice ? r.cashPrice.toLocaleString('uz-UZ') + " so'm" : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.status === 'active' && new Date(r.reservedUntil) > new Date()
                        ? <span className="flex items-center justify-center gap-1 text-accent-green"><CheckCircle size={12} />Aktiv</span>
                        : r.status === 'completed'
                          ? <span className="flex items-center justify-center gap-1 text-blue-400"><CheckCircle size={12} />Bajarildi</span>
                          : <span className="flex items-center justify-center gap-1 text-text-muted"><XCircle size={12} />Muddati o'tdi</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-right text-text-muted hidden lg:table-cell">
                      {new Date(r.createdAt).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────── Asosiy tab ───────────
export default function InstagramTab({ aiData, agentConfig, customerAgentConfig }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [custPage, setCustPage] = useState(1)

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
    setCustPage(1)
    const q = search.toLowerCase()
    return socialCustomers.filter(c =>
      !q || c.name.toLowerCase().includes(q) || c.instagram.toLowerCase().includes(q) || (c.carModel || '').toLowerCase().includes(q)
    )
  }, [socialCustomers, search])

  const pagedCustomers = useMemo(() => filtered.slice((custPage - 1) * PS, custPage * PS), [filtered, custPage])

  const customerAgentId = customerAgentConfig?.id
  const { addActivity } = useAgentActivityStore()

  const { loading: agLoading, analysis: agAnalysis, error: agError, refresh: agRefresh,
          triggerRun, triggering, source, lastRun } = useAgentAnalysis({
    agentId: 'instagram-agent',
    enabled: socialCustomers.length > 0,
    systemPrompt: agentConfig?.systemPrompt || "Sen GoodTires do'konining INSTAGRAM AGENTISAN.",
    buildPrompt: () => {
      const topBySpend = [...socialCustomers].sort((a, b) => b.spent - a.spent).slice(0, 5)
      const noSaleCustomers = socialCustomers.filter(c => c.count === 0)
      return `Instagram orqali kelgan mijozlarni tahlil qil.

INSTAGRAM MIJOZLAR HOLATI:
- Jami: ${socialCustomers.length} ta (instagram handle bor mijozlar)
- Jami xaridlar: ${fmtMoney(totalSpent)} so'm (${socialCustomers.reduce((s,c)=>s+c.count,0)} ta sotuv)
- Bu oy sotuvlar: ${thisMonth} ta
- Nasiya qarz: ${fmtMoney(totalDebt)} so'm

TOP 5 INSTAGRAM MIJOZLAR:
${topBySpend.map((c, i) => `${i+1}. @${c.instagram} — ${c.count} ta xarid, ${fmtMoney(c.spent)} so'm, qarz: ${fmtMoney(c.debt)} so'm`).join('\n') || 'yo\'q'}

XARID QILMAGAN INSTAGRAM MIJOZLAR: ${noSaleCustomers.length} ta
${noSaleCustomers.slice(0, 5).map(c => `- @${c.instagram} (${c.name})`).join('\n') || 'yo\'q'}

VAZIFALAR:
1. Instagram mijozlar segmentatsiyasi (aktiv/passiv/yangi) — KPI qilib saqlа
2. Xarid qilmagan Instagram follower'lar uchun jalb strategiyasi — tavsiya saqlа
3. Top Instagram mijozlar holati — KPI saqlа
4. Agar instagram integratsiya ulangan bo'lsa — bot samaradorligi bo'yicha tahlil`
    },
    deps: [socialCustomers.length, totalSpent, thisMonth],
  })

  useEffect(() => {
    if (agAnalysis && !agAnalysis.raw) {
      agAnalysis.alerts?.forEach(a => addActivity({ agentId: 'instagram', type: 'ALERT', message: a.message }))
      agAnalysis.recommendations?.slice(0, 2).forEach(r => addActivity({ agentId: 'instagram', type: 'RECOMMENDATION', message: r.action }))
      agAnalysis.insights?.slice(0, 1).forEach(i => addActivity({ agentId: 'instagram', type: 'INSIGHT', message: i.description || i.title }))
    }
  }, [agAnalysis])

  return (
    <div className="space-y-5">
      {/* Instagram agent tahlili */}
      <AgentAnalysisPanel
        loading={agLoading}
        analysis={agAnalysis}
        error={agError}
        refresh={agRefresh}
        accentColor="text-pink-400"
        onTriggerRun={triggerRun}
        triggering={triggering}
        source={source}
        lastRun={lastRun}
      />

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
                {pagedCustomers.map((c, i) => {
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
            <Pagination page={custPage} total={filtered.length} onPage={setCustPage} />
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

      {/* DM suhbatlar arxivi */}
      <div className="pt-2 border-t border-border">
        <DmConversationsPanel />
      </div>

      {/* Bot statistika va bronlar */}
      <div className="pt-2 border-t border-border">
        <BotStatsPanel />
      </div>
    </div>
  )
}
