import { matchPeriod } from '../../../utils/period'
import React, { useState, useEffect, useMemo, Fragment } from 'react'
import TableView from '../../../components/ui/TableView'
import { motion } from 'framer-motion'
import { Truck, Package, DollarSign, Search, Store, Filter, TrendingDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useShopStore } from '../../../store/shopStore'
import { getIncomeBatches, getSuppliers } from '../../../api/incomeService'
import { fmtUZS, fmtNum, fmtDate, PAGE_SIZE, monthLabel, StatCard, MonthFilterBar, Pagination } from '../components/expHelpers'

const SupplierPaymentsTab = () => {
  const { t, i18n } = useTranslation()
  const { selectedShopId } = useShopStore()
  const [MOCK_INCOME_BATCHES, setMockIncomeBatches] = useState([])
  const [MOCK_SUPPLIERS, setMockSuppliers] = useState([])
  const [filterMonth, setFilterMonth] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const resetPage = () => setPage(1)

  useEffect(() => {
    Promise.all([getIncomeBatches(), getSuppliers()]).then(([b, s]) => {
      setMockIncomeBatches(b)
      setMockSuppliers(s)
    })
  }, [])

  const resolveSupplierName = (batch) => {
    const found = MOCK_SUPPLIERS.find(s => s.id === batch.supplierId)
    return found ? found.name : (batch.supplierName || batch.supplierId)
  }

  const allPayments = useMemo(() => {
    const list = []
    MOCK_INCOME_BATCHES.forEach(batch => {
      ;(batch.payments || []).forEach(pay => {
        list.push({
          id: pay.id,
          date: pay.date,
          batchId: batch.id,
          productName: batch.productName,
          supplierId: batch.supplierId,
          supplierName: resolveSupplierName(batch),
          amountUSD: pay.amountUSD || 0,
          usdRate: pay.usdRate || 0,
          amountUZS: pay.amountUZS || 0,
          type: pay.type,
          note: pay.note,
          noteRu: pay.noteRu,
          shopId: batch.shopId,
        })
      })
    })
    return list.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [MOCK_INCOME_BATCHES, MOCK_SUPPLIERS])

  const months = useMemo(() => {
    const s = new Set(allPayments.map(p => p.date.slice(0, 7)))
    return Array.from(s).sort().reverse()
  }, [allPayments])

  const filtered = useMemo(() => {
    let list = [...allPayments]
    if (filterMonth) list = list.filter(p => matchPeriod(p.date, filterMonth))
    if (selectedShopId !== 'all') list = list.filter(p => p.shopId === selectedShopId)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.productName?.toLowerCase().includes(q) ||
        p.supplierName?.toLowerCase().includes(q) ||
        p.note?.toLowerCase().includes(q)
      )
    }
    return list
  }, [allPayments, filterMonth, selectedShopId, search])

  const paginatedPayments = useMemo(() => {
    const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    const map = {}
    slice.forEach(p => {
      if (!map[p.supplierId]) map[p.supplierId] = { supplierId: p.supplierId, supplierName: p.supplierName, payments: [] }
      map[p.supplierId].payments.push(p)
    })
    Object.values(map).forEach(g => {
      g.totalUSD = g.payments.reduce((s, p) => s + p.amountUSD, 0)
      g.totalUZS = g.payments.reduce((s, p) => s + p.amountUZS, 0)
    })
    return Object.values(map).sort((a, b) => b.totalUZS - a.totalUZS)
  }, [filtered, page])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const monthTotal = useMemo(() => filtered.reduce((s, p) => s + p.amountUZS, 0), [filtered])

  return (
    <div className="space-y-3 sm:space-y-5">
      <MonthFilterBar months={months} filterMonth={filterMonth} setFilterMonth={(m) => { setFilterMonth(m); resetPage() }} resetPage={resetPage} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard icon={Package} label={filterMonth ? `${monthLabel(filterMonth, t)} ${t('exp_sup_payments')}` : t('expenses')} value={fmtUZS(monthTotal)} sub={`${filtered.length} ${t('unit_pcs')} ${t('exp_sup_payments')}`} color="bg-purple-500/10 text-purple-500" />
        <StatCard icon={TrendingDown} label={t('exp_sup_total_count')} value={`${allPayments.length} ${t('unit_pcs')}`} sub={t('exp_sup_all_time')} color="bg-blue-500/10 text-blue-500" />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          <input value={search} onChange={e => { setSearch(e.target.value); resetPage() }} placeholder={t('exp_sup_search_placeholder')}
            className="w-full bg-bg-secondary border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-red" />
        </div>
      </div>

      <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
        {paginatedPayments.length === 0 ? (
          <div className="p-12 flex flex-col items-center gap-3">
            <Package size={36} className="text-text-secondary opacity-40" />
            <p className="text-text-secondary text-sm">{t('exp_sup_not_found')}</p>
          </div>
        ) : (<>
          {/* Telefon: yetkazib beruvchi bo'yicha guruhlangan kartochkalar */}
          <div className="sm:hidden divide-y divide-border">
            {paginatedPayments.map(group => (
              <div key={group.supplierId} className="p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 min-w-0">
                    <Truck size={14} className="text-purple-400 shrink-0" />
                    <span className="font-bold text-accent-orange truncate">{group.supplierName}</span>
                  </span>
                  <span className="text-right shrink-0">
                    <span className="block font-bold text-text-primary">${fmtNum(group.totalUSD)}</span>
                    <span className="block text-xs text-text-muted">{fmtUZS(group.totalUZS)}</span>
                  </span>
                </div>
                {group.payments.map(pay => (
                  <div key={pay.id} className="flex items-start justify-between gap-2 pl-6 text-sm">
                    <span className="min-w-0">
                      <span className="block text-text-primary truncate">{pay.productName}</span>
                      <span className="block text-xs text-text-muted">{fmtDate(pay.date)} · {pay.type === 'cash_uzs' ? t('exp_pay_cash_uzs') : pay.type === 'cash_usd' ? t('exp_pay_cash_usd') : pay.type === 'transfer' ? t('exp_pay_bank') : pay.type}</span>
                    </span>
                    <span className="font-semibold text-text-primary whitespace-nowrap">${fmtNum(pay.amountUSD)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="hidden sm:block">
          <TableView id="exp_sup_pay" optional={[t('exp_sup_col_pay_type'), t('col_note'), 'UZS']}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('col_date')}</th>
                  <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('col_product')}</th>
                  <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('exp_sup_col_pay_type')}</th>
                  <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('col_note')}</th>
                  <th className="text-right px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">USD</th>
                  <th className="text-right px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">UZS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPayments.map(group => (
                  <Fragment key={group.supplierId}>
                    <tr className="bg-bg-tertiary border-b border-border">
                      <td colSpan={4} className="px-3 sm:px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Truck size={12} className="text-purple-400" />
                          </div>
                          <span className="font-syne font-bold text-accent-orange text-sm">{group.supplierName}</span>
                          <span className="text-text-secondary text-xs bg-bg-secondary border border-border px-2 py-0.5 rounded-full">
                            {group.payments.length} {t('exp_sup_payments_count')}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 text-right">
                        <p className="font-bold text-text-primary text-sm">${fmtNum(group.totalUSD)}</p>
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 text-right">
                        <p className="text-text-secondary text-xs">{fmtUZS(group.totalUZS)}</p>
                      </td>
                    </tr>
                    {group.payments.map(pay => (
                      <tr key={pay.id} className="border-b border-border/30 hover:bg-bg-tertiary/50 transition-colors">
                        <td className="px-3 sm:px-4 py-2.5 text-text-secondary whitespace-nowrap text-xs">{fmtDate(pay.date)}</td>
                        <td className="px-3 sm:px-4 py-2.5 text-text-primary max-w-[180px] truncate">{pay.productName}</td>
                        <td className="px-3 sm:px-4 py-2.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-400">
                            {pay.type === 'cash_uzs' ? t('exp_pay_cash_uzs') : pay.type === 'cash_usd' ? t('exp_pay_cash_usd') : pay.type === 'transfer' ? t('exp_pay_bank') : pay.type}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 text-text-secondary max-w-[140px] truncate text-xs">{(() => {
                          const raw = pay.note || ''
                          if (raw === "Dastlabki tolov" || raw === "Dastlabki to'lov") return t('pay_note_initial')
                          return raw || '—'
                        })()}</td>
                        <td className="px-3 sm:px-4 py-2.5 text-right font-semibold text-text-primary whitespace-nowrap">
                          ${fmtNum(pay.amountUSD)}
                          <span className="text-text-secondary text-xs ml-1">@ {fmtNum(pay.usdRate)}</span>
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 text-right text-text-secondary whitespace-nowrap text-xs">{fmtUZS(pay.amountUZS)}</td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          </TableView>
          </div>
        </>)}
        <Pagination page={page} totalPages={totalPages} total={filtered.length} setPage={setPage} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// MAIN EXPENSES COMPONENT
// ═══════════════════════════════════════════════════════════

export default SupplierPaymentsTab
