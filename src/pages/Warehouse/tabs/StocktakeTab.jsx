import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ClipboardList, CheckCircle2, Clock, Trash2, X, ChevronRight, ChevronLeft, Search, AlertTriangle, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { useShopStore } from '../../../store/shopStore'
import { getStocktakes, getStocktake, createStocktake, updateStocktakeItem, completeStocktake, reopenStocktake, deleteStocktake } from '../../../api/stocktakeService'
import { StackGuard } from '../../../components/ui/Modal'
import { useDataStore } from '../../../store/dataStore'
import { useAuthStore } from '../../../store/authStore'

const fmt = (n) => (n ?? 0).toLocaleString('uz-UZ')
const fmtDate = (s) => s ? new Date(s).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

const DiffBadge = ({ diff }) => {
  if (diff === null || diff === undefined) return <span className="text-text-muted text-xs">—</span>
  if (diff === 0) return <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-accent-green/10 text-accent-green rounded-full text-xs font-bold"><CheckCircle2 size={11} /> 0</span>
  if (diff > 0) return <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-accent-green/10 text-accent-green rounded-full text-xs font-bold"><TrendingUp size={11} />+{diff}</span>
  return <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-accent-red/10 text-accent-red rounded-full text-xs font-bold"><TrendingDown size={11} />{diff}</span>
}

const StocktakeTab = () => {
  const { selectedShopId } = useShopStore()
  const { bump } = useDataStore()
  const canWriteOff = useAuthStore(s => s.hasPermission('warehouse.writeoff'))
  const [askWriteoff, setAskWriteoff] = useState(false)
  const [completeError, setCompleteError] = useState('')
  const [writeoffResult, setWriteoffResult] = useState(null) // { writtenOff, notWrittenOff }
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [newNotes, setNewNotes] = useState('')
  const [createError, setCreateError] = useState('')
  const [selected, setSelected] = useState(null) // { ...stocktake, items: [] }
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [localActual, setLocalActual] = useState({}) // { itemId: string (input value) }
  const [saving, setSaving] = useState({}) // { itemId: bool }
  const [completing, setCompleting] = useState(false)
  const [reopening, setReopening] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // 'all' | 'ok' | 'diff' | 'unseen'
  const saveTimers = useRef({})

  const loadList = async () => {
    setLoading(true)
    try { setList(await getStocktakes(selectedShopId)) } finally { setLoading(false) }
  }

  const openDetail = async (id) => {
    setLoadingDetail(true)
    setLocalActual({})
    try {
      const st = await getStocktake(id)
      setSelected(st)
    } finally { setLoadingDetail(false) }
  }

  useEffect(() => { loadList() }, [selectedShopId])

  const handleCreate = async () => {
    setCreateLoading(true)
    setCreateError('')
    try {
      const st = await createStocktake({ shopId: selectedShopId, notes: newNotes.trim() || null })
      setNewNotes('')
      setCreating(false)
      await loadList()
      await openDetail(st.id)
    } catch (err) {
      setCreateError(err?.response?.data?.error || 'Xatolik yuz berdi')
    } finally { setCreateLoading(false) }
  }

  const handleActualChange = (item, val) => {
    setLocalActual(prev => ({ ...prev, [item.id]: val }))
    clearTimeout(saveTimers.current[item.id])
    saveTimers.current[item.id] = setTimeout(async () => {
      const num = val === '' ? null : parseInt(val, 10)
      if (num !== null && isNaN(num)) return
      setSaving(prev => ({ ...prev, [item.id]: true }))
      try {
        const updated = await updateStocktakeItem(selected.id, item.id, { actualQty: num })
        setSelected(prev => ({
          ...prev,
          items: prev.items.map(i => i.id === item.id ? { ...i, actualQty: updated.actualQty } : i),
        }))
      } finally {
        setSaving(prev => ({ ...prev, [item.id]: false }))
      }
    }, 600)
  }

  const handleCompleteClick = () => {
    setCompleteError('')
    if (shortages.length && canWriteOff && selected.shopId && !selected.writeoffAt) setAskWriteoff(true)
    else handleComplete(false)
  }

  const handleComplete = async (autoWriteoff) => {
    setCompleting(true)
    setCompleteError('')
    try {
      const updated = await completeStocktake(selected.id, autoWriteoff)
      setSelected(prev => ({ ...prev, status: updated.status, completedAt: updated.completedAt, writeoffAt: updated.writeoffAt }))
      setAskWriteoff(false)
      if (autoWriteoff) {
        setWriteoffResult({ writtenOff: updated.writtenOff, notWrittenOff: updated.notWrittenOff })
        bump()
      }
      await loadList()
    } catch (err) {
      setCompleteError(err?.response?.data?.error || 'Xatolik yuz berdi')
    } finally { setCompleting(false) }
  }

  const handleReopen = async () => {
    setReopening(true)
    try {
      const updated = await reopenStocktake(selected.id)
      setSelected(prev => ({ ...prev, status: updated.status, completedAt: null }))
      await loadList()
    } finally { setReopening(false) }
  }

  const handleDelete = async (id) => {
    await deleteStocktake(id)
    setDeleting(null)
    if (selected?.id === id) setSelected(null)
    await loadList()
  }

  const getActualVal = (item) => {
    if (item.id in localActual) return localActual[item.id]
    return item.actualQty != null ? String(item.actualQty) : ''
  }
  const getActualNum = (item) => {
    const v = getActualVal(item)
    return v === '' ? null : parseInt(v, 10)
  }
  const getDiff = (item) => {
    const a = getActualNum(item)
    if (a === null || isNaN(a)) return null
    return a - item.expectedQty
  }

  const filteredItems = useMemo(() => {
    if (!selected) return []
    const q = search.toLowerCase()
    return selected.items.filter(i => {
      if (q && !i.productName.toLowerCase().includes(q)) return false
      if (filter === 'ok') { const d = getDiff(i); return d === 0 }
      if (filter === 'diff') { const d = getDiff(i); return d !== null && d !== 0 }
      if (filter === 'unseen') return getActualNum(i) === null
      return true
    })
  }, [selected, search, filter, localActual])

  const summary = useMemo(() => {
    if (!selected) return null
    const items = selected.items
    const filled = items.filter(i => getActualNum(i) !== null)
    const ok = filled.filter(i => getDiff(i) === 0).length
    const diff = filled.filter(i => { const d = getDiff(i); return d !== null && d !== 0 }).length
    return { total: items.length, filled: filled.length, ok, diff }
  }, [selected, localActual])

  // Kamomad bo'lsa (va hali chiqarilmagan bo'lsa) — avtomatik hisobdan chiqarishni so'raymiz
  const shortages = useMemo(() => (selected?.items || [])
    .map(i => ({ name: i.productName, qty: -(getDiff(i) ?? 0) }))
    .filter(x => x.qty > 0), [selected, localActual])

  return (
    <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[500px]">
      {/* Chap panel — ro'yxat */}
      {/* Telefonda: ro'yxat yoki tafsilot — bittasi ko'rinadi */}
      <div className={`${selected || loadingDetail ? 'hidden lg:flex' : 'flex'} w-full lg:w-72 flex-shrink-0 bg-bg-secondary border border-border rounded-2xl flex-col overflow-hidden`}>
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="font-syne font-bold text-text-primary text-sm">Inventarizatsiyalar</span>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1 px-2 py-1 bg-accent-red text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
          >
            <Plus size={13} /> Yangi
          </button>
        </div>

        {/* Yangi yaratish form */}
        <AnimatePresence>
          {creating && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-border"
            >
              <div className="px-4 py-3 space-y-2">
                <textarea
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Izoh (ixtiyoriy)"
                  rows={2}
                  className="w-full px-2 py-1.5 bg-bg-tertiary border border-border rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue resize-none"
                />
                {createError && <p className="text-[11px] text-accent-red">{createError}</p>}
                <div className="flex gap-2">
                  <button onClick={() => { setCreating(false); setCreateError('') }} className="flex-1 py-1.5 border border-border rounded-lg text-xs font-bold text-text-muted hover:bg-bg-tertiary transition-colors">Bekor</button>
                  <button onClick={handleCreate} disabled={createLoading} className="flex-1 py-1.5 bg-accent-red text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-1">
                    {createLoading && <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />}
                    Yaratish
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ro'yxat */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-10"><div className="w-5 h-5 border-2 border-accent-red border-t-transparent rounded-full animate-spin" /></div>
          ) : list.length === 0 ? (
            <div className="py-10 text-center text-text-muted text-xs">Inventarizatsiya yo'q</div>
          ) : list.map(st => (
            <div
              key={st.id}
              onClick={() => openDetail(st.id)}
              className={`px-4 py-3 cursor-pointer border-b border-border transition-colors flex items-start justify-between gap-2 ${selected?.id === st.id ? 'bg-accent-blue/5 border-l-2 border-l-accent-blue' : 'hover:bg-bg-tertiary/50'}`}
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-text-primary truncate">{st.notes || fmtDate(st.createdAt)}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {st.status === 'complete'
                    ? <CheckCircle2 size={11} className="text-accent-green flex-shrink-0" />
                    : <Clock size={11} className="text-accent-orange flex-shrink-0" />
                  }
                  <span className={`text-[11px] font-semibold ${st.status === 'complete' ? 'text-accent-green' : 'text-accent-orange'}`}>
                    {st.status === 'complete' ? 'Yakunlangan' : 'Draft'}
                  </span>
                  <span className="text-[11px] text-text-muted">· {st.itemCount} ta</span>
                </div>
                {st.notes && <p className="text-[11px] text-text-muted mt-0.5">{fmtDate(st.createdAt)}</p>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {st.status === 'draft' && (
                  <button
                    onClick={e => { e.stopPropagation(); setDeleting(st) }}
                    className="p-1 rounded hover:bg-accent-red/10 text-text-muted hover:text-accent-red transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
                <ChevronRight size={13} className="text-text-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* O'ng panel — detal */}
      <div className={`${selected || loadingDetail ? 'flex' : 'hidden lg:flex'} flex-1 min-w-0 bg-bg-secondary border border-border rounded-2xl flex-col overflow-hidden`}>
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-5 sm:p-8">
            <ClipboardList size={40} className="text-text-muted opacity-30" />
            <p className="text-text-muted text-sm">Inventarizatsiyani tanlang yoki yangi yarating</p>
          </div>
        ) : loadingDetail ? (
          <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-accent-red border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <>
            {/* Header */}
            <div className="px-3 sm:px-5 py-3.5 border-b border-border flex items-center justify-between gap-2 flex-wrap flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
              <button onClick={() => setSelected(null)} className="lg:hidden p-1.5 -ml-1 rounded-lg text-text-secondary hover:bg-bg-tertiary"><ChevronLeft size={18} /></button>
              <div className="min-w-0">
                <p className="font-bold text-text-primary text-sm">{selected.notes || fmtDate(selected.createdAt)}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {selected.status === 'complete'
                    ? <span className="inline-flex items-center gap-1 text-xs font-bold text-accent-green bg-accent-green/10 px-2 py-0.5 rounded-full"><CheckCircle2 size={11} /> Yakunlangan</span>
                    : <span className="inline-flex items-center gap-1 text-xs font-bold text-accent-orange bg-accent-orange/10 px-2 py-0.5 rounded-full"><Clock size={11} /> Draft</span>
                  }
                  {selected.notes && <span className="text-xs text-text-muted">{fmtDate(selected.createdAt)}</span>}
                </div>
              </div>
              </div>
              <div className="flex gap-2">
                {selected.status === 'complete' && (
                  <button
                    disabled={reopening}
                    onClick={handleReopen}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-text-secondary rounded-xl text-xs font-bold hover:bg-bg-tertiary transition-colors disabled:opacity-50"
                  >
                    <Clock size={14} /> {reopening ? '...' : 'Tahrirlash'}
                  </button>
                )}
                {selected.status === 'draft' && (
                  <button
                    disabled={completing || !summary || summary.filled === 0 || Object.values(saving).some(Boolean)}
                    onClick={handleCompleteClick}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-green text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} /> {completing ? 'Yakunlanmoqda...' : 'Yakunlash'}
                  </button>
                )}
              </div>
            </div>

            {/* Summary chips */}
            {summary && (
              <div className="px-5 py-2.5 border-b border-border flex items-center gap-3 flex-shrink-0 flex-wrap">
                <span className="text-xs text-text-muted">Jami: <strong className="text-text-primary">{summary.total}</strong></span>
                <span className="text-xs text-text-muted">Tekshirildi: <strong className="text-accent-blue">{summary.filled}</strong></span>
                <span className="text-xs text-text-muted">Mos: <strong className="text-accent-green">{summary.ok}</strong></span>
                <span className="text-xs text-text-muted">Farq: <strong className="text-accent-red">{summary.diff}</strong></span>
                <div className="ml-auto flex items-center gap-1">
                  {['all', 'unseen', 'ok', 'diff'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors ${filter === f ? 'bg-accent-blue text-white' : 'bg-bg-tertiary text-text-muted hover:text-text-primary'}`}>
                      {f === 'all' ? 'Barchasi' : f === 'unseen' ? 'Tekshirilmagan' : f === 'ok' ? 'Mos' : 'Farq bor'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search */}
            <div className="px-5 py-2 border-b border-border flex-shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tovar nomi bo'yicha qidirish..."
                  className="w-full pl-8 pr-3 py-1.5 bg-bg-tertiary border border-border rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue"
                />
              </div>
            </div>

            {/* Jadval */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col />
                  <col style={{ width: '90px' }} />
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '90px' }} />
                </colgroup>
                <thead className="bg-bg-tertiary sticky top-0 z-10">
                  <tr>
                    <th className="px-3 sm:px-4 py-2.5 text-left text-xs font-bold text-text-muted">Mahsulot</th>
                    <th className="px-3 sm:px-4 py-2.5 text-right text-xs font-bold text-text-muted">Tizimda</th>
                    <th className="px-3 sm:px-4 py-2.5 text-right text-xs font-bold text-text-muted">Haqiqatda</th>
                    <th className="px-3 sm:px-4 py-2.5 text-right text-xs font-bold text-text-muted">Farq</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredItems.length === 0 ? (
                    <tr><td colSpan={4} className="py-10 text-center text-text-muted text-xs">Mahsulot topilmadi</td></tr>
                  ) : filteredItems.map(item => {
                    const diff = getDiff(item)
                    const hasDiff = diff !== null && diff !== 0
                    return (
                      <tr key={item.id} className={`transition-colors ${hasDiff ? 'bg-accent-red/5' : diff === 0 ? 'bg-accent-green/5' : ''} hover:bg-bg-tertiary/40`}>
                        <td className="px-3 sm:px-4 py-2.5">
                          <span className="text-sm font-medium text-text-primary">{item.productName}</span>
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 text-right">
                          <span className="text-sm font-bold text-text-secondary">{fmt(item.expectedQty)}</span>
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 text-right">
                          {selected.status === 'draft' ? (
                            <div className="flex items-center justify-end gap-1 pr-1">
                              {saving[item.id] && <div className="w-3 h-3 flex-shrink-0 border border-accent-blue border-t-transparent rounded-full animate-spin" />}
                              <input
                                type="number"
                                min="0"
                                value={getActualVal(item)}
                                onChange={e => handleActualChange(item, e.target.value)}
                                placeholder="—"
                                className="w-16 text-right px-2 py-1 bg-bg-tertiary border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent-blue"
                              />
                            </div>
                          ) : (
                            <span className="text-sm font-bold text-text-primary">
                              {item.actualQty != null ? fmt(item.actualQty) : '—'}
                            </span>
                          )}
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 text-right">
                          <DiffBadge diff={diff} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Yakunlash: kamomadni avtomatik hisobdan chiqarish so'rovi */}
      <AnimatePresence>
        {askWriteoff && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[360] flex items-center justify-center p-4" onClick={() => !completing && setAskWriteoff(false)}>
            <StackGuard onClose={() => !completing && setAskWriteoff(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 w-full max-w-md space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-orange/10 flex items-center justify-center flex-shrink-0">
                  <TrendingDown size={20} className="text-accent-orange" />
                </div>
                <div>
                  <h4 className="font-bold text-text-primary">Kamomadni avtomatik hisobdan chiqarilsinmi?</h4>
                  <p className="text-sm text-text-muted mt-1">
                    {shortages.length} ta tovarda jami {fmt(shortages.reduce((s, x) => s + x.qty, 0))} dona kam chiqdi.
                    "Ha" — shu tovarlar hozir hisobdan chiqariladi. "Yo'q" — inventarizatsiya yakunlanadi, hisobdan chiqarishni qo'lda qilasiz.
                  </p>
                </div>
              </div>
              <div className="max-h-40 overflow-y-auto border border-border rounded-xl divide-y divide-border">
                {shortages.map((x, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-1.5 text-xs">
                    <span className="text-text-primary truncate pr-2">{x.name}</span>
                    <span className="text-accent-red font-bold flex-shrink-0">−{fmt(x.qty)}</span>
                  </div>
                ))}
              </div>
              {completeError && <p className="text-xs text-accent-red">{completeError}</p>}
              <div className="flex flex-col sm:flex-row gap-2">
                <button disabled={completing} onClick={() => setAskWriteoff(false)} className="sm:flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-bold text-text-secondary hover:bg-bg-tertiary transition-colors disabled:opacity-50">Bekor</button>
                <button disabled={completing} onClick={() => handleComplete(false)} className="sm:flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-bold text-text-primary hover:bg-bg-tertiary transition-colors disabled:opacity-50">Yo'q, qo'lda</button>
                <button disabled={completing} onClick={() => handleComplete(true)} className="sm:flex-1 px-4 py-2.5 bg-accent-red text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50">{completing ? '...' : 'Ha, chiqarilsin'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Avtomatik hisobdan chiqarish natijasi */}
      <AnimatePresence>
        {writeoffResult && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[360] flex items-center justify-center p-4" onClick={() => setWriteoffResult(null)}>
            <StackGuard onClose={() => setWriteoffResult(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 w-full max-w-md space-y-4"
            >
              <h4 className="font-bold text-text-primary flex items-center gap-2"><CheckCircle2 size={18} className="text-accent-green" /> Hisobdan chiqarildi</h4>
              <div className="max-h-48 overflow-y-auto border border-border rounded-xl divide-y divide-border">
                {writeoffResult.writtenOff.map((x, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-1.5 text-xs">
                    <span className="text-text-primary truncate pr-2">{x.product_name}</span>
                    <span className="text-text-secondary flex-shrink-0">{fmt(x.quantity)} ta · {fmt(x.amount)} so'm</span>
                  </div>
                ))}
                {!writeoffResult.writtenOff.length && <p className="px-3 py-2 text-xs text-text-muted">Hech narsa chiqarilmadi</p>}
              </div>
              {writeoffResult.notWrittenOff.length > 0 && (
                <div className="text-xs text-accent-orange space-y-1">
                  <p className="font-bold">Omborda yetarli qoldiq yo'q (sanashdan keyin sotilgan yoki bron qilingan) — qo'lda tekshiring:</p>
                  {writeoffResult.notWrittenOff.map((x, i) => <p key={i}>{x.product_name}: {fmt(x.quantity)} ta</p>)}
                </div>
              )}
              <button onClick={() => setWriteoffResult(null)} className="w-full px-4 py-2.5 bg-accent-blue text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">Yopish</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleting && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[360] flex items-center justify-center p-4" onClick={() => setDeleting(null)}>
            <StackGuard onClose={() => setDeleting(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 w-full max-w-sm space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-red/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={20} className="text-accent-red" />
                </div>
                <div>
                  <h4 className="font-bold text-text-primary">Inventarizatsiyani o'chirish</h4>
                  <p className="text-sm text-text-muted mt-1">{fmtDate(deleting.createdAt)} dagi draft o'chiriladi. Bu amalni bekor qilib bo'lmaydi.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleting(null)} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-bold text-text-secondary hover:bg-bg-tertiary transition-colors">Bekor</button>
                <button onClick={() => handleDelete(deleting.id)} className="flex-1 px-4 py-2.5 bg-accent-red text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">O'chirish</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default StocktakeTab
