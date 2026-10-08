import { matchPeriod } from '../../../utils/period'
import React, { useState, useEffect, useMemo } from 'react'
import TableView from '../../../components/ui/TableView'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDownCircle, ArrowUpCircle, BarChart3, Landmark, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../../store/authStore'
import { getCapital, deleteCapital } from '../../../api/capitalService'
import { fmtUZS, fmtNum, fmtDate, today, CURRENT_MONTH, PAGE_SIZE, StatCard, MonthFilterBar, Pagination } from '../components/expHelpers'
import CapitalFormModal from '../components/CapitalFormModal'
import DeleteModal from '../components/DeleteModal'
import { useDataStore } from '../../../store/dataStore'

const CapitalTabWithHeader = () => {
  const { t, i18n } = useTranslation()
  const { bump } = useDataStore()
  const [capital, setCapital] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [filterMonth, setFilterMonth] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const resetPage = () => setPage(1)

  useEffect(() => { getCapital().then(d => { setCapital(d); setLoading(false) }) }, [])

  const months = useMemo(() => {
    const s = new Set(capital.map(c => c.date.slice(0, 7)))
    return Array.from(s).sort().reverse()
  }, [capital])

  const filtered = useMemo(() => {
    let l = [...capital]
    if (filterMonth) l = l.filter(c => matchPeriod(c.date, filterMonth))
    if (filterType !== 'all') l = l.filter(c => c.type === filterType)
    if (search.trim()) {
      const q = search.toLowerCase()
      l = l.filter(c =>
        c.source?.toLowerCase().includes(q) ||
        c.note?.toLowerCase().includes(q)
      )
    }
    return l.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [capital, filterMonth, filterType, search])

  const totalInjected = useMemo(() => filtered.filter(c => c.type === 'inject').reduce((s, c) => s + c.amountUZS, 0), [filtered])
  const totalReturned = useMemo(() => filtered.filter(c => c.type === 'return').reduce((s, c) => s + c.amountUZS, 0), [filtered])
  const balance = totalInjected - totalReturned
  const allBalance = useMemo(() => capital.filter(c => c.type === 'inject').reduce((s, c) => s + c.amountUZS, 0) - capital.filter(c => c.type === 'return').reduce((s, c) => s + c.amountUZS, 0), [capital])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSave = (entry) => {
    setCapital(prev => {
      const idx = prev.findIndex(c => c.id === entry.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = entry; return n }
      return [entry, ...prev]
    })
    bump()
  }
  const handleDelete = async () => {
    await deleteCapital(deleteTarget.id)
    setCapital(prev => prev.filter(c => c.id !== deleteTarget.id))
    setDeleteTarget(null)
    bump()
  }

  return (
    <div className="space-y-3 sm:space-y-5">
      <div className="flex justify-end">
        <button onClick={() => { setEditTarget(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent-red text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
          <Plus size={16} /> {t('exp_cap_add')}
        </button>
      </div>

      <MonthFilterBar months={months} filterMonth={filterMonth} setFilterMonth={(m) => { setFilterMonth(m); resetPage() }} resetPage={resetPage} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ArrowDownCircle} label={t('exp_cap_injected')} value={fmtUZS(totalInjected)} sub={`${filtered.filter(c => c.type === 'inject').length} ${t('unit_pcs')}`} color="bg-green-500/10 text-green-500" />
        <StatCard icon={ArrowUpCircle} label={t('exp_cap_returned')} value={fmtUZS(totalReturned)} sub={`${filtered.filter(c => c.type === 'return').length} ${t('unit_pcs')}`} color="bg-accent-red/10 text-accent-red" />
        <StatCard icon={Landmark} label={t('exp_cap_balance')} value={fmtUZS(balance)} sub={balance >= 0 ? t('exp_cap_balance_positive') : t('exp_cap_balance_negative')} color={balance >= 0 ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'} />
        <StatCard icon={BarChart3} label={t('exp_cap_all_balance')} value={fmtUZS(allBalance)} sub={t('exp_sup_all_time')} color="bg-purple-500/10 text-purple-500" />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          <input value={search} onChange={e => { setSearch(e.target.value); resetPage() }} placeholder={t('exp_cap_search_placeholder')}
            className="w-full bg-bg-secondary border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-red" />
        </div>
        <div className="flex gap-1 bg-bg-secondary border border-border rounded-xl p-1">
          {[
            { value: 'all', label: t('filter_all') },
            { value: 'inject', label: t('exp_cap_inject') },
            { value: 'return', label: t('exp_cap_return') },
          ].map(opt => (
            <button key={opt.value} onClick={() => { setFilterType(opt.value); resetPage() }}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors
                ${filterType === opt.value ? 'bg-accent-red text-white' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-accent-red border-t-transparent rounded-full animate-spin" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="p-12 flex flex-col items-center gap-3">
            <Landmark size={36} className="text-text-secondary opacity-40" />
            <p className="text-text-secondary text-sm">{t('exp_cap_not_found')}</p>
          </div>
        ) : (<>
          {/* Telefon: kartochkalar (bosilsa — tahrirlash) */}
          <div className="sm:hidden divide-y divide-border/60">
            {paginated.map(cap => {
              const note = (i18n.language === 'ru' ? cap.noteRu || cap.note : cap.note) || ''
              return (
                <div key={cap.id} onClick={() => { setEditTarget(cap); setShowForm(true) }} className="p-3.5 space-y-1.5 active:bg-bg-tertiary/50">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${cap.type === 'inject' ? 'bg-green-500/10 text-green-500' : 'bg-accent-red/10 text-accent-red'}`}>
                      {cap.type === 'inject' ? <ArrowDownCircle size={11} /> : <ArrowUpCircle size={11} />}
                      {cap.type === 'inject' ? t('exp_cap_inject') : t('exp_cap_return')}
                    </span>
                    <span className="text-[15px] font-bold text-text-primary whitespace-nowrap">{cap.currency === 'USD' ? `$${fmtNum(cap.amount)}` : fmtUZS(cap.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-sm text-text-muted">
                    <span className="truncate">{fmtDate(cap.date)} · {(i18n.language === 'ru' ? cap.sourceRu || cap.source : cap.source)}</span>
                    {cap.currency === 'USD' && <span className="text-xs shrink-0">{fmtUZS(cap.amountUZS)}</span>}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-text-secondary truncate">{note}</p>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(cap) }} className="p-2 -m-1 shrink-0 text-text-muted hover:text-accent-red rounded-lg"><Trash2 size={15} /></button>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="hidden sm:block">
          <TableView id="exp_capital" optional={[t('col_source'), t('col_uzs')]}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('col_date')}</th>
                  <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('col_type')}</th>
                  <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('col_source')}</th>
                  <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('col_note')}</th>
                  <th className="text-right px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('col_amount')}</th>
                  <th className="text-right px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('col_uzs')}</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium text-center">{t('exp_cap_col_action')}</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((cap, idx) => (
                  <motion.tr key={cap.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                    className="border-b border-border/50 hover:bg-bg-tertiary/50 transition-colors">
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-secondary whitespace-nowrap">{fmtDate(cap.date)}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${cap.type === 'inject' ? 'bg-green-500/10 text-green-500' : 'bg-accent-red/10 text-accent-red'}`}>
                        {cap.type === 'inject' ? <ArrowDownCircle size={11} /> : <ArrowUpCircle size={11} />}
                        {cap.type === 'inject' ? t('exp_cap_inject') : t('exp_cap_return')}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-primary max-w-[160px] truncate">{(i18n.language === 'ru' ? cap.sourceRu || cap.source : cap.source)}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-secondary max-w-[160px] truncate">{(i18n.language === 'ru' ? cap.noteRu || cap.note : cap.note) || '—'}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-right font-semibold text-text-primary whitespace-nowrap">
                      {cap.currency === 'USD' ? `$${fmtNum(cap.amount)}` : fmtUZS(cap.amount)}
                      {cap.currency === 'USD' && <span className="text-text-secondary text-xs ml-1">@ {fmtNum(cap.usdRate)}</span>}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-right text-text-secondary whitespace-nowrap">{fmtUZS(cap.amountUZS)}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setEditTarget(cap); setShowForm(true) }} className="p-1.5 hover:bg-blue-500/10 hover:text-blue-400 text-text-secondary rounded-lg transition-colors"><Pencil size={13} /></button>
                        <button onClick={() => setDeleteTarget(cap)} className="p-1.5 hover:bg-accent-red/10 hover:text-accent-red text-text-secondary rounded-lg transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          </TableView>
          </div>
        </>)}
        <Pagination page={page} totalPages={totalPages} total={filtered.length} setPage={setPage} />
      </div>

      <AnimatePresence>
        {showForm && <CapitalFormModal onClose={() => { setShowForm(false); setEditTarget(null) }} onSave={handleSave} editData={editTarget} />}
        {deleteTarget && <DeleteModal title={`${deleteTarget.type === 'inject' ? t('exp_cap_inject') : t('exp_cap_return')} — ${fmtUZS(deleteTarget.amountUZS)}`} desc={deleteTarget.source} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />}
      </AnimatePresence>
    </div>
  )
}

export default CapitalTabWithHeader
