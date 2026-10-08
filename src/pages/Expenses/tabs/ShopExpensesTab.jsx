import { matchPeriod } from '../../../utils/period'
import React, { useState, useEffect, useMemo } from 'react'
import TableView from '../../../components/ui/TableView'
import { motion, AnimatePresence } from 'framer-motion'
import { DollarSign, Filter, MoreHorizontal, Pencil, Plus, RefreshCw, Search, Store, Trash2, TrendingDown, User, Wallet, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../../store/authStore'
import { useShopStore } from '../../../store/shopStore'
import { ShopPickerModal } from '../../../components/ShopPickerModal'
import ShopRequiredGuard from '../../../components/ShopRequiredGuard'
import { useFinanceCategories } from '../components/useFinanceCategories'
import { getExpenses, deleteExpense } from '../../../api/expenseService'
import { fmtUZS, fmtNum, fmtDate, today, CURRENT_MONTH, sortedCategories, getCatLabel, PAGE_SIZE, StatCard, MonthFilterBar, Pagination, ICON_MAP, monthLabel, colorCls, pmLabel } from '../components/expHelpers'
import ExpenseFormModal from '../components/ExpenseFormModal'
import DeleteModal from '../components/DeleteModal'
import { useDataStore } from '../../../store/dataStore'

const ShopExpensesTab = ({ currentUser }) => {
  const { t, i18n } = useTranslation()
  const { bump } = useDataStore()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const { shops, selectedShopId } = useShopStore()
  const [shopPickCallback, setShopPickCallback] = useState(null)
  const requireShop = (cb) => {
    if (selectedShopId !== 'all') { cb(selectedShopId) }
    else { setShopPickCallback(() => cb) }
  }
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterCurrency, setFilterCurrency] = useState('all')
  const [filterMonth, setFilterMonth] = useState(CURRENT_MONTH)
  const [page, setPage] = useState(1)
  const resetPage = () => setPage(1)
  const { categories: MOCK_EXPENSE_CATEGORIES, activeCategories } = useFinanceCategories('expense')

  useEffect(() => {
    getExpenses().then(d => { setExpenses(d); setLoading(false) })
  }, [])

  const months = useMemo(() => {
    const s = new Set(expenses.map(e => e.date.slice(0, 7)))
    return Array.from(s).sort().reverse()
  }, [expenses])

  const monthExpenses = useMemo(() => {
    let list = filterMonth ? expenses.filter(e => matchPeriod(e.date, filterMonth)) : expenses
    if (selectedShopId !== 'all') list = list.filter(e => e.shopId === selectedShopId)
    return list
  }, [expenses, filterMonth, selectedShopId])

  const monthTotal = useMemo(() => monthExpenses.reduce((s, e) => s + e.amountUZS, 0), [monthExpenses])

  const categoryTotals = useMemo(() => {
    const map = {}
    monthExpenses.forEach(e => { map[e.categoryId] = (map[e.categoryId] || 0) + e.amountUZS })
    return map
  }, [monthExpenses])

  const topCategory = useMemo(() => {
    let top = null, topVal = 0
    Object.entries(categoryTotals).forEach(([id, val]) => { if (val > topVal) { topVal = val; top = id } })
    return top ? MOCK_EXPENSE_CATEGORIES.find(c => c.id === top) : null
  }, [categoryTotals, MOCK_EXPENSE_CATEGORIES])

  const filtered = useMemo(() => {
    let list = [...expenses]
    if (selectedShopId !== 'all') list = list.filter(e => e.shopId === selectedShopId)
    if (filterMonth) list = list.filter(e => matchPeriod(e.date, filterMonth))
    if (filterCategory !== 'all') list = list.filter(e => e.categoryId === filterCategory)
    if (filterCurrency !== 'all') list = list.filter(e => e.currency === filterCurrency)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.note?.toLowerCase().includes(q) ||
        e.responsibleName?.toLowerCase().includes(q) ||
        getCatLabel(MOCK_EXPENSE_CATEGORIES.find(c => c.id === e.categoryId), t).toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [expenses, selectedShopId, filterMonth, filterCategory, filterCurrency, search, MOCK_EXPENSE_CATEGORIES])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const getCat = (id) => MOCK_EXPENSE_CATEGORIES.find(c => c.id === id)

  const handleSave = (exp) => {
    setExpenses(prev => {
      const idx = prev.findIndex(e => e.id === exp.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = exp; return next }
      return [exp, ...prev]
    })
    bump()
  }

  const handleDelete = async () => {
    await deleteExpense(deleteTarget.id)
    setExpenses(prev => prev.filter(e => e.id !== deleteTarget.id))
    setDeleteTarget(null)
    bump()
  }

  return (
    <ShopRequiredGuard>
    <div className="space-y-3 sm:space-y-5">
      {/* Month filter */}
      <MonthFilterBar months={months} filterMonth={filterMonth} setFilterMonth={setFilterMonth} resetPage={resetPage} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingDown} label={filterMonth ? `${monthLabel(filterMonth, t)} ${t('exp_month_total')}` : t('expenses')} value={fmtUZS(monthTotal)} sub={`${monthExpenses.length} ${t('exp_records')}`} color="bg-accent-red/10 text-accent-red" />
        <StatCard icon={DollarSign} label={t('exp_usd_expenses')} value={fmtUZS(monthExpenses.filter(e => e.currency==='USD').reduce((s,e)=>s+e.amountUZS,0))} sub={`${monthExpenses.filter(e=>e.currency==='USD').length} ${t('unit_pcs')}`} color="bg-green-500/10 text-green-500" />
        <StatCard icon={topCategory ? (ICON_MAP[topCategory.icon]||MoreHorizontal) : TrendingDown} label={t('exp_top_category')} value={topCategory ? getCatLabel(topCategory, t) : '—'} sub={topCategory ? fmtUZS(categoryTotals[topCategory.id]||0) : ''} color="bg-purple-500/10 text-purple-500" />
        <StatCard icon={Filter} label={t('exp_filtered')} value={`${filtered.length} ${t('unit_pcs')}`} sub={`${t('exp_filtered_total')} ${fmtUZS(filtered.reduce((s,e)=>s+e.amountUZS,0))}`} color="bg-blue-500/10 text-blue-500" />
      </div>

      {/* Kategoriya breakdown */}
      {monthExpenses.length > 0 && (
        <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-5">
          <h3 className="font-syne font-bold text-text-primary mb-4 text-sm">{t('exp_category_breakdown')}</h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
            {sortedCategories(MOCK_EXPENSE_CATEGORIES.filter(c => c.isActive || categoryTotals[c.id])).map(cat => {
              const Icon = ICON_MAP[cat.icon] || MoreHorizontal
              const total = categoryTotals[cat.id] || 0
              const pct = monthTotal > 0 ? Math.round((total / monthTotal) * 100) : 0
              return (
                <button key={cat.id}
                  onClick={() => { setFilterCategory(cat.id === filterCategory ? 'all' : cat.id); resetPage() }}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all
                    ${filterCategory === cat.id ? 'border-accent-red bg-accent-red/10' : 'border-border bg-bg-tertiary hover:border-accent-red/40'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorCls(cat.color)}`}>
                    <Icon size={14} />
                  </div>
                  <span className="text-text-primary text-xs font-semibold text-center leading-tight">{getCatLabel(cat, t)}</span>
                  <span className="text-text-secondary text-xs">{pct}%</span>
                  {total > 0 && <span className="text-text-primary text-xs font-medium">{fmtNum(Math.round(total/1000))}k</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => requireShop(() => { setEditTarget(null); setShowForm(true) })}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent-red text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity shrink-0"
        >
          <Plus size={16} /> {t('exp_add_expense')}
        </button>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          <input value={search} onChange={e => { setSearch(e.target.value); resetPage() }} placeholder={t('exp_search_placeholder')}
            className="w-full bg-bg-secondary border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-red" />
        </div>
        <select value={filterCurrency} onChange={e => { setFilterCurrency(e.target.value); resetPage() }}
          className="bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-red cursor-pointer">
          <option value="all">{t('exp_all_currency')}</option>
          <option value="UZS">UZS</option>
          <option value="USD">USD</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-accent-red border-t-transparent rounded-full animate-spin" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="p-12 flex flex-col items-center gap-3">
            <Wallet size={36} className="text-text-secondary opacity-40" />
            <p className="text-text-secondary text-sm">{t('exp_not_found')}</p>
          </div>
        ) : (
          <TableView id="exp_shop" optional={[t('exp_col_period'), t('col_type'), t('exp_col_responsible'), t('col_uzs')]}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('col_date')}</th>
                  <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('exp_col_period')}</th>
                  <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('col_category')}</th>
                  <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('col_type')}</th>
                  <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('col_note')}</th>
                  <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('exp_col_responsible')}</th>
                  <th className="text-right px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('col_amount')}</th>
                  <th className="text-right px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('col_uzs')}</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium text-center">{t('exp_col_action')}</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((exp, idx) => {
                  const cat = getCat(exp.categoryId)
                  const Icon = cat ? (ICON_MAP[cat.icon] || MoreHorizontal) : MoreHorizontal
                  return (
                    <motion.tr key={exp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                      className="border-b border-border/50 hover:bg-bg-tertiary/50 transition-colors">
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-secondary whitespace-nowrap">{fmtDate(exp.date)}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-secondary text-xs whitespace-nowrap">
                        {exp.period ? monthLabel(exp.period, t) : <span className="opacity-30">—</span>}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        {cat && (
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${colorCls(cat.color)}`}>
                            <Icon size={12} /> {getCatLabel(cat, t)}
                          </div>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        {exp.expenseType === 'variable'
                          ? <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-accent-orange/10 text-accent-orange">{t('exp_type_variable')}</span>
                          : <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-accent-blue/10 text-accent-blue">{t('exp_type_fixed')}</span>
                        }
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-primary max-w-[180px] truncate">{(i18n.language === 'ru' ? exp.noteRu || exp.note : exp.note) || '—'}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-secondary">
                        <div className="flex items-center gap-1.5"><User size={13} className="shrink-0" />{exp.responsibleName}</div>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-right font-semibold text-text-primary whitespace-nowrap">
                        {exp.currency === 'USD' ? `$${fmtNum(exp.amount)}` : fmtUZS(exp.amount)}
                        {exp.currency === 'USD' && <span className="text-text-secondary text-xs ml-1">@ {fmtNum(exp.usdRate)}</span>}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-right text-text-secondary whitespace-nowrap">
                        {fmtUZS(exp.amountUZS)}
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          {exp.source === 'cashbox' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-accent-orange/10 text-accent-orange">{t('fin_cashbox_badge')}</span>}
                          <span className="text-[10px] text-text-muted">{pmLabel(exp.paymentMethod, t)}</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setEditTarget(exp); setShowForm(true) }}
                            className="p-1.5 hover:bg-blue-500/10 hover:text-blue-400 text-text-secondary rounded-lg transition-colors">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => setDeleteTarget(exp)}
                            className="p-1.5 hover:bg-accent-red/10 hover:text-accent-red text-text-secondary rounded-lg transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          </TableView>
        )}
        <Pagination page={page} totalPages={totalPages} total={filtered.length} setPage={setPage} />
      </div>

      <AnimatePresence>
        {showForm && (
          <ExpenseFormModal
            onClose={() => { setShowForm(false); setEditTarget(null) }}
            onSave={handleSave}
            categories={MOCK_EXPENSE_CATEGORIES.filter(c => c.isActive || c.id === editTarget?.categoryId)}
            currentUser={currentUser}
            editData={editTarget}
            shops={shops}
            defaultShopId={selectedShopId !== 'all' ? selectedShopId : null}
          />
        )}
        {shopPickCallback && (
          <ShopPickerModal
            onConfirm={(shopId) => { const cb = shopPickCallback; setShopPickCallback(null); cb(shopId) }}
            onCancel={() => setShopPickCallback(null)}
          />
        )}
        {deleteTarget && (
          <DeleteModal
            title={`${(() => { const c = getCat(deleteTarget.categoryId); return c ? getCatLabel(c, t) : '—' })()} — ${fmtUZS(deleteTarget.amountUZS)}`}
            desc={fmtDate(deleteTarget.date)}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
    </ShopRequiredGuard>
  )
}

// ═══════════════════════════════════════════════════════════
// TAB 2 — YETKAZIB BERUVCHI TO'LOVLARI (readonly)
// ═══════════════════════════════════════════════════════════
// TAB 2 — YETKAZIB BERUVCHI TO'LOVLARI (readonly)
// ═══════════════════════════════════════════════════════════

export default ShopExpensesTab
