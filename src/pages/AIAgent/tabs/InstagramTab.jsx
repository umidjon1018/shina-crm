import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import TableView from '../../../components/ui/TableView'
import { useTranslation } from 'react-i18next'
import { Globe, Users, AlertCircle, X, ChevronRight, Car, Zap, MessageCircle, BarChart2, Send, Loader2, Clock, Phone, Package, CheckCircle, XCircle } from 'lucide-react'
import { streamChat, getInstagramConversations, getInstagramConversationDetail, getInstagramStats } from '../../../api/aiService'
import { getAiSection } from '../../../api/aiStatsService'
import { useShopStore } from '../../../store/shopStore'
import { useNavigate } from 'react-router-dom'
import Modal from '../../../components/ui/Modal'
import { getCustomers, updateCustomer } from '../../../api/customerService'
import { useDataStore } from '../../../store/dataStore'
import AiChat from '../components/AiChat'
import { KpiGrid } from '../components/SectionData'

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
  gold: { label: 'VIP', color: 'text-yellow-400 bg-yellow-400/10' },
  silver: { label: 'Sodiq', color: 'text-blue-400 bg-blue-400/10' },
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

// Daraja xaridlar soniga qarab: VIP 3+, sodiq 2, yangi 0-1
const levelOf = (visits) => (visits >= 3 ? 'gold' : visits === 2 ? 'silver' : 'none')
const handleOf = (h) => String(h || '').replace(/^@+/, '')

// ─────────── Monthly chart ───────────
const MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']
function MonthlyChart({ rows }) {
  const maxCount = Math.max(...rows.map(m => m.cnt), 1)
  return (
    <div className="p-4 rounded-2xl border border-border bg-bg-secondary">
      <p className="text-sm font-medium text-text-primary mb-4 flex items-center gap-2">
        <BarChart2 size={14} className="text-pink-400" />
        So'nggi 6 oy — Instagram mijozlari xaridlari
      </p>
      <div className="flex items-end gap-2 h-24">
        {rows.map(m => {
          const mo = Number(m.month.split('-')[1])
          return (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-text-muted">{m.cnt || ''}</span>
              <div
                className="w-full rounded-t bg-pink-500/60 hover:bg-pink-500 transition-colors min-h-[4px]"
                style={{ height: `${Math.max((m.cnt / maxCount) * 80, 4)}px` }}
                title={`${m.cnt} ta xarid — ${fmtMoney(m.rev)} so'm`}
              />
              <span className="text-xs text-text-muted">{MONTHS[mo - 1]}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────── AI tahlil panel ───────────
function AiAnalysisPanel({ customer }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const abortRef = useRef(false)

  const run = () => {
    abortRef.current = false
    setLoading(true)
    setStarted(true)
    setText('')

    const userMsg = `Mijozni tahlil qil (customer_id: ${customer.id}). Avval get_customer_purchase_history bilan xaridlarini ol.

MIJOZ: ${customer.name}, telefon: ${customer.phone || "yo'q"}, Instagram: @${handleOf(customer.instagram)}, avtomobil: ${customer.car || "noma'lum"}.
Jami: ${customer.visits} ta xarid, ${customer.spent} so'm; nasiya qarzi: ${customer.debt || 0} so'm; oxirgi xarid: ${customer.last || "yo'q"}.

Qisqa javob ber:
1. Qanday mijoz (xarid odati).
2. Avtomobiliga qanday shina/disk kerak bo'lishi mumkin va qachon.
3. Hozir nima qilish kerak — Instagram DM yoki SMS uchun tayyor qisqa matn yozib ber.`

    streamChat({
      messages: [{ role: 'user', content: userMsg }],
      agentId: 'ai-assistant',
      section: 'instagram',
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
      AI yordamchi bilan tahlil qilish
    </button>
  )

  return (
    <div className="rounded-xl border border-border bg-bg-primary p-3">
      <div className="flex items-center gap-2 mb-2">
        <Zap size={12} className="text-pink-400" />
        <span className="text-xs font-medium text-pink-400">AI yordamchi tahlili</span>
        {loading && <Loader2 size={12} className="text-text-muted animate-spin ml-auto" />}
      </div>
      <div className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
        {text || <span className="text-text-muted animate-pulse">Tahlil qilinmoqda...</span>}
      </div>
    </div>
  )
}

// ─────────── Mijoz profil modali ───────────
function CustomerModal({ customer, onClose }) {
  const loyaltyInfo = LOYALTY_LABEL[levelOf(customer.visits)] || LOYALTY_LABEL.none

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-bg-primary border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 font-bold">
              {customer.name[0]}
            </div>
            <div>
              <p className="font-semibold text-text-primary">{customer.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {customer.instagram && (
                  <span className="text-xs text-pink-400 flex items-center gap-1">
                    <Globe size={10} /> @{handleOf(customer.instagram)}
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

        <div className="p-4 sm:p-5 space-y-4">
          {/* Asosiy info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Xaridlar', value: customer.visits, color: 'text-accent-green' },
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
            </div>
            <div className="p-3 rounded-xl bg-bg-secondary border border-border flex items-center gap-2">
              <Car size={14} className="text-pink-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-text-muted">Avtomobil</p>
                <p className="text-sm text-text-primary">{customer.car || "Noma'lum"}</p>
              </div>
            </div>
          </div>

          {/* AI Tahlil */}
          <AiAnalysisPanel customer={customer} />
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

  const navigate = useNavigate()
  const [linking, setLinking] = useState(null)
  const loadConvs = () => getInstagramConversations({ limit: 50 })
    .then(setData)
    .catch(() => setData({ conversations: [], total: 0 }))
    .finally(() => setLoading(false))
  useEffect(() => { loadConvs() }, [])
  const openCustomer = (id) => navigate(`/customers?customer=${id}`)

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

  if (loading) return <div className="py-5 sm:py-8 text-center text-text-muted text-sm"><Loader2 size={16} className="animate-spin inline mr-2" />Yuklanmoqda...</div>

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
        <div className="py-5 sm:py-8 text-center text-text-muted text-sm">Hali DM suhbat yo'q</div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-secondary text-xs text-text-muted">
                <th className="text-left px-3 sm:px-4 py-2.5">Foydalanuvchi</th>
                <th className="text-left px-3 sm:px-4 py-2.5">Mijoz</th>
                <th className="text-right px-3 sm:px-4 py-2.5 hidden sm:table-cell">Xabarlar</th>
                <th className="text-right px-3 sm:px-4 py-2.5 hidden md:table-cell">So'nggi faollik</th>
                <th className="text-left px-3 sm:px-4 py-2.5 hidden lg:table-cell">Oxirgi xabar</th>
                <th className="px-3 sm:px-4 py-2.5 w-6" />
              </tr>
            </thead>
            <tbody>
              {paged.map((c, i) => (
                <tr
                  key={c.senderId}
                  onClick={() => openDetail(c)}
                  className={`border-b border-border/50 hover:bg-bg-secondary cursor-pointer transition-colors ${i % 2 === 0 ? '' : 'bg-bg-secondary/30'}`}
                >
                  <td className="px-3 sm:px-4 py-2 sm:py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-pink-500/20 text-pink-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {(c.username || c.senderId)[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-text-primary font-medium text-xs">{c.username ? `@${c.username}` : c.senderId}</p>
                        {c.username && <p className="text-[10px] text-text-muted/60 leading-none mb-0.5">{c.senderId}</p>}
                        <p className="text-xs text-text-muted">{c.userMsgs} savol</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3" onClick={e => e.stopPropagation()}>
                    {c.customer ? (
                      <button onClick={() => openCustomer(c.customer.id)} className="text-left hover:underline">
                        <p className="text-sm font-semibold text-accent-green">{c.customer.name}</p>
                        <p className="text-xs text-text-muted">{c.customer.phone}</p>
                      </button>
                    ) : c.username && !/^\d+$/.test(c.username) ? (
                      <button onClick={() => setLinking(c)} className="px-2.5 py-1 rounded-lg border border-border text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-border-bright">
                        Mijozga bog'lash
                      </button>
                    ) : <span className="text-xs text-text-muted">—</span>}
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs text-text-secondary hidden sm:table-cell">{c.msgCount} ta</td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs text-text-muted hidden md:table-cell">
                    {c.lastMsg ? new Date(c.lastMsg).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 hidden lg:table-cell">
                    <p className="text-xs text-text-secondary truncate max-w-xs">
                      {c.lastRole === 'assistant' ? '🤖 ' : '👤 '}{c.lastMessage}
                    </p>
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3"><ChevronRight size={14} className="text-text-muted" /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} total={convs.length} onPage={setPage} />
        </div>
      )}

      <LinkCustomerModal conv={linking} onClose={() => setLinking(null)} onLinked={() => { setLinking(null); loadConvs() }} />

      {/* Suhbat detail modal */}
      {selected && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-bg-primary border border-border rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <p className="font-semibold text-text-primary text-sm">
                  {selected.username ? `@${selected.username}` : selected.senderId} — suhbat tarixi
                </p>
                {selected.customer && (
                  <button onClick={() => openCustomer(selected.customer.id)} className="text-xs text-accent-green hover:underline">
                    {selected.customer.name} · {selected.customer.phone} — profilni ochish
                  </button>
                )}
              </div>
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

// Instagram foydalanuvchisini Mijozlar bazasidagi mijozga bog'lash (mijozning Instagram maydoniga yoziladi)
function LinkCustomerModal({ conv, onClose, onLinked }) {
  const [list, setList] = useState(null)
  const [q, setQ] = useState('')
  const [saving, setSaving] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    if (!conv) return
    setQ(''); setErr('')
    getCustomers().then(setList).catch(() => setList([]))
  }, [conv])
  const found = useMemo(() => {
    const s = q.trim().toLowerCase()
    const l = list || []
    return (s ? l.filter(c => `${c.name} ${c.phone} ${c.phone2 || ''} ${c.instagram || ''}`.toLowerCase().includes(s)) : l).slice(0, 30)
  }, [list, q])
  const link = async (c) => {
    setSaving(c.id); setErr('')
    try {
      await updateCustomer(c.id, { ...c, instagram: conv.username })
      onLinked()
    } catch (e) { setErr(e?.response?.data?.error || e?.message || 'Xatolik') }
    finally { setSaving(null) }
  }
  return (
    <Modal open={!!conv} onClose={onClose} size="md" title={conv ? `@${conv.username} — mijozga bog'lash` : ''}
      subtitle="Tanlangan mijozning Instagram maydoniga shu username yoziladi">
      <div className="space-y-3">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Ism yoki telefon..." autoFocus
          className="w-full bg-bg-secondary border border-border rounded-xl px-4 py-2.5 text-[15px] text-text-primary focus:outline-none focus:border-accent-red" />
        {err && <p className="text-sm text-accent-red">{err}</p>}
        {list === null ? <p className="text-sm text-text-muted py-6 text-center"><Loader2 size={14} className="animate-spin inline mr-1" />Yuklanmoqda...</p> : (
          <div className="panel divide-y divide-border">
            {found.map(c => (
              <button key={c.id} onClick={() => link(c)} disabled={!!saving}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-bg-tertiary/50 disabled:opacity-50">
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-semibold text-text-primary truncate">{c.name}</span>
                  <span className="block text-sm text-text-muted">{c.phone}{c.instagram ? ` · @${c.instagram.replace(/^@/, '')}` : ''}</span>
                </span>
                {saving === c.id ? <Loader2 size={16} className="animate-spin text-text-muted" /> : <ChevronRight size={16} className="text-text-muted" />}
              </button>
            ))}
            {!found.length && <p className="text-sm text-text-muted py-6 text-center">Topilmadi</p>}
          </div>
        )}
      </div>
    </Modal>
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

  if (loading) return <div className="py-5 sm:py-8 text-center text-text-muted text-sm"><Loader2 size={16} className="animate-spin inline mr-2" />Yuklanmoqda...</div>
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
          <div className="py-4 sm:py-6 text-center text-text-muted text-sm rounded-2xl border border-border">Hali bot orqali bron qilinmagan</div>
        ) : (
          <div className="rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-bg-secondary text-text-muted">
                  <th className="text-left px-3 sm:px-4 py-2.5">Mijoz</th>
                  <th className="text-left px-3 sm:px-4 py-2.5 hidden sm:table-cell">Tovar</th>
                  <th className="text-right px-3 sm:px-4 py-2.5 hidden md:table-cell">Narx</th>
                  <th className="text-center px-3 sm:px-4 py-2.5">Holat</th>
                  <th className="text-right px-3 sm:px-4 py-2.5 hidden lg:table-cell">Vaqt</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r, i) => (
                  <tr key={r.id} className={`border-b border-border/50 ${i % 2 === 0 ? '' : 'bg-bg-secondary/30'}`}>
                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      <p className="text-text-primary font-medium">{r.customerName || '—'}</p>
                      {r.customerPhone && <p className="text-text-muted flex items-center gap-1"><Phone size={10} />{r.customerPhone}</p>}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 hidden sm:table-cell text-text-secondary">
                      {r.brand && <span className="text-pink-400 mr-1">{r.brand}</span>}
                      {r.productName || '—'}
                      {r.size && <span className="text-text-muted ml-1">({r.size})</span>}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-right hidden md:table-cell text-accent-green">
                      {r.cashPrice ? r.cashPrice.toLocaleString('uz-UZ') + " so'm" : '—'}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-center">
                      {r.status === 'active' && new Date(r.reservedUntil) > new Date()
                        ? <span className="flex items-center justify-center gap-1 text-accent-green"><CheckCircle size={12} />Aktiv</span>
                        : r.status === 'completed'
                          ? <span className="flex items-center justify-center gap-1 text-blue-400"><CheckCircle size={12} />Bajarildi</span>
                          : <span className="flex items-center justify-center gap-1 text-text-muted"><XCircle size={12} />Muddati o'tdi</span>
                      }
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-right text-text-muted hidden lg:table-cell">
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
// Raqamlar serverdan (aiSections 'instagram'); bot sozlamalari va webhooklarga tegilmaydi
export default function InstagramTab({ agentConfig }) {
  const { t } = useTranslation()
  const { selectedShopId } = useShopStore()
  const { version } = useDataStore()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [custPage, setCustPage] = useState(1)
  const [report, setReport] = useState(null)
  const [loadError, setLoadError] = useState(null)

  const load = useCallback(() => {
    getAiSection('instagram', { shop: selectedShopId })
      .then(setReport)
      .catch(err => setLoadError(err?.response?.data?.error || err.message))
  }, [selectedShopId])
  useEffect(() => { load() }, [load, version])

  // Mijozlar botining Instagram kanallari (komment yoki DM) yoqilganmi
  const igEnabled = agentConfig?.isActive !== false && (agentConfig?.integrations?.instagram?.enabled === true || agentConfig?.integrations?.instagram?.dmEnabled === true)

  const socialCustomers = useMemo(() => report?.lists?.find(l => l.key === 'ig_customers')?.rows || [], [report])
  const monthly = useMemo(() => report?.lists?.find(l => l.key === 'ig_monthly')?.rows || [], [report])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return socialCustomers.filter(c =>
      !q || c.name.toLowerCase().includes(q) || handleOf(c.instagram).toLowerCase().includes(q) || (c.car || '').toLowerCase().includes(q)
    )
  }, [socialCustomers, search])
  useEffect(() => { setCustPage(1) }, [search])

  const pagedCustomers = useMemo(() => filtered.slice((custPage - 1) * PS, custPage * PS), [filtered, custPage])

  return (
    <div className="space-y-3 sm:space-y-5">
      {loadError && <p className="text-xs text-accent-red bg-accent-red/10 border border-accent-red/20 rounded-lg px-3 py-2">{loadError}</p>}

      {/* Instagram mijozlari va bot statistikasi (oxirgi 30 kun) */}
      {report && <KpiGrid kpis={report.kpis} t={t} />}

      {/* Bot holati banner */}
      {!igEnabled && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-400">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>Instagram bot o'chiq (komment va DM). <strong>Admin Panel → AI Agentlar → Mijozlar boti → Kanallar</strong> da yoqiladi.</span>
        </div>
      )}

      {/* Oylik grafik */}
      {monthly.length > 0 && <MonthlyChart rows={monthly} />}

      {/* Mijozlar jadvali */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
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
          <TableView id="ai_ig_customers" optional={['Avtomobil', 'Xaridlar']}>
          <div className="rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-secondary text-xs text-text-muted">
                  <th className="text-left px-3 sm:px-4 py-2.5">Mijoz</th>
                  <th className="text-left px-3 sm:px-4 py-2.5 hidden sm:table-cell">Instagram</th>
                  <th className="text-left px-3 sm:px-4 py-2.5 hidden md:table-cell">Avtomobil</th>
                  <th className="text-right px-3 sm:px-4 py-2.5">Xaridlar</th>
                  <th className="text-right px-3 sm:px-4 py-2.5 hidden md:table-cell">Sarflagan</th>
                  <th className="text-right px-3 sm:px-4 py-2.5 hidden lg:table-cell">Qarz</th>
                  <th className="px-3 sm:px-4 py-2.5 w-6" />
                </tr>
              </thead>
              <tbody>
                {pagedCustomers.map((c, i) => {
                  const li = LOYALTY_LABEL[levelOf(c.visits)] || LOYALTY_LABEL.none
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelected(c)}
                      className={`border-b border-border/50 hover:bg-bg-secondary cursor-pointer transition-colors ${i % 2 === 0 ? '' : 'bg-bg-secondary/30'}`}
                    >
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
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
                      <td className="px-3 sm:px-4 py-2 sm:py-3 hidden sm:table-cell">
                        <span className="text-xs text-pink-400">@{handleOf(c.instagram)}</span>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 hidden md:table-cell text-xs text-text-secondary">{c.car || '—'}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-text-primary">{c.visits}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-right hidden md:table-cell text-xs text-accent-green">{fmtMoney(c.spent)} so'm</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-right hidden lg:table-cell text-xs">
                        {c.debt ? <span className="text-accent-red">{fmtMoney(c.debt)} so'm</span> : <span className="text-text-muted">—</span>}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <ChevronRight size={14} className="text-text-muted" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <Pagination page={custPage} total={filtered.length} onPage={setCustPage} />
          </div>
          </TableView>
        )}
      </div>

      {/* Profil modali */}
      {selected && <CustomerModal customer={selected} onClose={() => setSelected(null)} />}

      {/* DM suhbatlar arxivi */}
      <div className="pt-2 border-t border-border">
        <DmConversationsPanel />
      </div>

      {/* Bot statistika va bronlar */}
      <div className="pt-2 border-t border-border">
        <BotStatsPanel />
      </div>

      {/* AI yordamchi — Instagram bo'limi konteksti bilan */}
      <div className="pt-2 border-t border-border">
        <AiChat
          agentId="ai-assistant"
          chatKey="ai-assistant:instagram"
          section="instagram"
          colorClass="accent-pink"
          placeholder="Instagram mijozlar, DM, bot statistika haqida so'rang..."
        />
      </div>
    </div>
  )
}
