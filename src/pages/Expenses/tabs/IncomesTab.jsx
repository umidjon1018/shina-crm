import { matchPeriod } from '../../../utils/period'
import React, { useState, useEffect, useMemo } from 'react'
import TableView from '../../../components/ui/TableView'
import { motion, AnimatePresence } from 'framer-motion'
import { Banknote, CreditCard, Landmark, MoreHorizontal, Pencil, Plus, Search, Trash2, TrendingUp, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useShopStore } from '../../../store/shopStore'
import { useDataStore } from '../../../store/dataStore'
import { ShopPickerModal } from '../../../components/ShopPickerModal'
import { getIncomes, deleteIncome } from '../../../api/financeService'
import { useFinanceCategories } from '../components/useFinanceCategories'
import { fmtUZS, fmtNum, fmtDate, CURRENT_MONTH, getCatLabel, PAGE_SIZE, StatCard, MonthFilterBar, Pagination, ICON_MAP, colorCls, pmLabel } from '../components/expHelpers'
import IncomeFormModal from '../components/IncomeFormModal'
import DeleteModal from '../components/DeleteModal'

const IncomesTab = ({ currentUser }) => {
  const { t } = useTranslation()
  const { bump } = useDataStore()
  const { selectedShopId } = useShopStore()
  const { categories, activeCategories } = useFinanceCategories('income')
  const [incomes, setIncomes] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [shopPick, setShopPick] = useState(false)
  const [filterMonth, setFilterMonth] = useState(CURRENT_MONTH)
  const [filterCategory, setFilterCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const resetPage = () => setPage(1)

  useEffect(() => {
    getIncomes().then(setIncomes).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const getCat = (id) => categories.find(c => c.id === id)

  const shopIncomes = useMemo(() =>
    selectedShopId !== 'all' ? incomes.filter(i => i.shopId === String(selectedShopId)) : incomes,
  [incomes, selectedShopId])

  const months = useMemo(() => {
    const s = new Set(shopIncomes.map(i => i.date.slice(0, 7)))
    s.add(CURRENT_MONTH)
    return Array.from(s).sort().reverse()
  }, [shopIncomes])

  const monthList = useMemo(() =>
    filterMonth ? shopIncomes.filter(i => matchPeriod(i.date, filterMonth)) : shopIncomes,
  [shopIncomes, filterMonth])

  const filtered = useMemo(() => {
    let l = monthList
    if (filterCategory !== 'all') l = l.filter(i => i.categoryId === filterCategory)
    if (search.trim()) {
      const q = search.toLowerCase()
      l = l.filter(i =>
        i.note.toLowerCase().includes(q) ||
        i.responsibleName.toLowerCase().includes(q) ||
        getCatLabel(getCat(i.categoryId), t).toLowerCase().includes(q))
    }
    return [...l].sort((a, b) => b.date.localeCompare(a.date) || Number(b.id) - Number(a.id))
  }, [monthList, filterCategory, search, categories])

  const byMethod = useMemo(() => {
    const m = { cash: 0, card: 0, transfer: 0 }
    monthList.forEach(i => { m[i.paymentMethod] = (m[i.paymentMethod] || 0) + i.amountUZS })
    return m
  }, [monthList])
  const total = monthList.reduce((s, i) => s + i.amountUZS, 0)

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const openAdd = () => {
    if (selectedShopId !== 'all') setForm({ shopId: selectedShopId })
    else setShopPick(true)
  }

  const handleSave = (inc) => {
    setIncomes(prev => {
      const idx = prev.findIndex(i => i.id === inc.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = inc; return n }
      return [inc, ...prev]
    })
    bump()
  }

  const handleDelete = async () => {
    await deleteIncome(deleteTarget.id)
    setIncomes(prev => prev.filter(i => i.id !== deleteTarget.id))
    setDeleteTarget(null)
    bump()
  }

  return (
    <div className="space-y-3 sm:space-y-5">
      <MonthFilterBar months={months} filterMonth={filterMonth} setFilterMonth={setFilterMonth} resetPage={resetPage} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={TrendingUp} label={t('fin_inc_total')} value={fmtUZS(total)} sub={`${monthList.length} ${t('exp_records')}`} color="bg-green-500/10 text-green-500" />
        <StatCard icon={Banknote} label={t('fin_pm_cash')} value={fmtUZS(byMethod.cash)} color="bg-emerald-500/10 text-emerald-500" />
        <StatCard icon={CreditCard} label={t('fin_pm_card')} value={fmtUZS(byMethod.card)} color="bg-blue-500/10 text-blue-500" />
        <StatCard icon={Landmark} label={t('fin_pm_transfer')} value={fmtUZS(byMethod.transfer)} color="bg-purple-500/10 text-purple-500" />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent-red text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity shrink-0">
          <Plus size={16} /> {t('fin_inc_add')}
        </button>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          <input value={search} onChange={e => { setSearch(e.target.value); resetPage() }} placeholder={t('exp_search_placeholder')}
            className="w-full bg-bg-secondary border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-red" />
        </div>
        <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); resetPage() }}
          className="bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-red cursor-pointer">
          <option value="all">{t('fin_all_categories')}</option>
          {categories.map(c => <option key={c.id} value={c.id}>{getCatLabel(c, t)}</option>)}
        </select>
      </div>

      <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-accent-red border-t-transparent rounded-full animate-spin" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="p-12 flex flex-col items-center gap-3">
            <TrendingUp size={36} className="text-text-secondary opacity-40" />
            <p className="text-text-secondary text-sm">{t('fin_inc_empty')}</p>
          </div>
        ) : (
          <TableView id="exp_incomes" optional={[t('exp_col_responsible'), t('fin_payment_method')]}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('col_date')}</th>
                  <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('col_category')}</th>
                  <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('col_note')}</th>
                  <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('exp_col_responsible')}</th>
                  <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('fin_payment_method')}</th>
                  <th className="text-right px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('col_amount')}</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium text-center">{t('exp_col_action')}</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(inc => {
                  const cat = getCat(inc.categoryId)
                  const Icon = cat ? (ICON_MAP[cat.icon] || MoreHorizontal) : MoreHorizontal
                  return (
                    <motion.tr key={inc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="border-b border-border/50 hover:bg-bg-tertiary/50 transition-colors">
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-secondary whitespace-nowrap">{fmtDate(inc.date)}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        {cat ? (
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${colorCls(cat.color)}`}>
                            <Icon size={12} /> {getCatLabel(cat, t)}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-primary max-w-[200px] truncate">{inc.note || '—'}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-secondary">
                        <div className="flex items-center gap-1.5"><User size={13} className="shrink-0" />{inc.responsibleName || '—'}</div>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-secondary text-xs whitespace-nowrap">{pmLabel(inc.paymentMethod, t)}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-right font-semibold text-accent-green whitespace-nowrap">
                        +{fmtUZS(inc.amountUZS)}
                        {inc.currency === 'USD' && <div className="text-text-secondary text-xs font-normal">${fmtNum(inc.amount)} @ {fmtNum(inc.usdRate)}</div>}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setForm({ edit: inc })}
                            className="p-1.5 hover:bg-blue-500/10 hover:text-blue-400 text-text-secondary rounded-lg transition-colors">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => setDeleteTarget(inc)}
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
        {form && (
          <IncomeFormModal
            onClose={() => setForm(null)}
            onSave={handleSave}
            categories={categories.filter(c => c.isActive || c.id === form.edit?.categoryId)}
            currentUser={currentUser}
            editData={form.edit || null}
            shopId={form.shopId}
          />
        )}
        {shopPick && (
          <ShopPickerModal
            onConfirm={(shopId) => { setShopPick(false); setForm({ shopId }) }}
            onCancel={() => setShopPick(false)}
          />
        )}
        {deleteTarget && (
          <DeleteModal
            title={`${getCatLabel(getCat(deleteTarget.categoryId), t)} — ${fmtUZS(deleteTarget.amountUZS)}`}
            desc={fmtDate(deleteTarget.date)}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default IncomesTab
