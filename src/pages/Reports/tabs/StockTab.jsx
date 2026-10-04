import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { Package, TrendingUp, Wallet, AlertTriangle, Target, Clock } from 'lucide-react'
import { C, DetailButton, GrowthBadge, Modal, ModalTable, MonthYearFilter, TODAY, fmtItems, fmtNum, fmtSoldAt, fmtUZS } from '../components/shared'

const StockTab = ({ ctx }) => {
  const { t } = useTranslation()
  const {
    // state
    period, modal, openModal, closeModal,
    salesData, stockStats, profitStats, customerStats, employeeStats, financeStats, usedData,
    isPrivileged,
    // inner components
    StatCard, SectionTitle, MonthFilterSelect, LockedTab, SortIcon, MonthSortBtn,
    // helpers
    filterByPeriod, filterUsedByMonth, sortedData, toggleSort, sortConfig,
    fmtSoldAt: ctxFmtSoldAt, fmtItems: ctxFmtItems,
    getSourceLabel, getCategoryLabel, getCancelLabel, getCatLabel, getCatLabelPlural,
    getCatColor, getCatColorHex, renderCatBadge, getExpNote, getMonthLabel,
    // state setters
    setSelectedCustomer, selectedCustomer, customersPage, setCustomersPage, CUSTOMERS_PAGE_SIZE,
    cstmSearch, setCstmSearch, selectedEmployee, setSelectedEmployee,
    empChartMetric, setEmpChartMetric, hourTab, setHourTab,
    expandedMonth, setExpandedMonth, seasonYear, setSeasonYear,
    modalFilter, setModalFilter, varMonthFilter, setVarMonthFilter,
    slowRotIdx, setSlowRotIdx, staleIdx, setStaleIdx, notSoldDays, setNotSoldDays,
    msd, sortMonths,
    showAllCfMonths, setShowAllCfMonths,
    salesTablePage, setSalesTablePage, SALES_PAGE_SIZE,
    stockCategory, setStockCategory,
    periodOptions,
    usedChartMonth, setUsedChartMonth,
    usedHistoryMonth, setUsedHistoryMonth, usedHistorySales,
    usedRevenueMonth, setUsedRevenueMonth,
    usedProfitMonth, setUsedProfitMonth,
    usedAcquiredMonth, setUsedAcquiredMonth,
    usedInStockMonth, setUsedInStockMonth,
    usedSoldMonth, setUsedSoldMonth,
    usedScrappedMonth, setUsedScrappedMonth,
    usedMarginMonth, setUsedMarginMonth,
    usedChartCategories,
    getMonthlySalesChart,
    USD_RATE,
    storeInstallmentOrgs, storeMonthlyTargets, storeEmployeeTargets,
    storeCompanyName, storeProductCategories,
    MOCK_INCOME_BATCHES, MOCK_SALES, MOCK_PRODUCTS, MOCK_ITEMS, MOCK_BATCHES,
  } = ctx

  const filteredStock = stockCategory === 'all'
    ? stockStats.withDaysLeft
    : stockStats.withDaysLeft.filter(x => x.category === stockCategory)

  return (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 sm:mb-6">
              <div className="cursor-pointer" onClick={() => openModal('totalItemsModal')}>
                <StatCard icon={Package} label={t('rep_stock_total')} value={stockStats.totalItems} sub={t('rep_stock_in_warehouse_sub')} />
              </div>
              <div className={isPrivileged ? 'cursor-pointer' : ''} onClick={() => isPrivileged && openModal('frozenCapModal')}>
                <StatCard icon={Wallet} label={t('rep_stock_frozen')} value={isPrivileged ? fmtUZS(stockStats.frozenCapital) : '—'} sub={t('rep_stock_purchase_price_sub')} color="bg-accent-blue/10 text-accent-blue" />
              </div>
              <div className={isPrivileged ? 'cursor-pointer' : ''} onClick={() => isPrivileged && openModal('potentialModal')}>
                <StatCard icon={TrendingUp} label={t('rep_stock_potential')} value={isPrivileged ? fmtUZS(stockStats.potentialRevenue) : '—'} sub={isPrivileged ? `+${fmtUZS(stockStats.potentialProfit)} ${t('rep_stock_potential_profit_suffix')}` : t('rep_stock_sale_price_sub')} color="bg-accent-green/10 text-accent-green" />
              </div>
              <div className="cursor-pointer" onClick={() => openModal('lowStockModal')}>
                <StatCard icon={AlertTriangle} label={t('rep_stock_low_out_sub')} value={`${stockStats.lowStockCount} / ${stockStats.outOfStockCount}`} sub={t('rep_min_threshold_sub')} color="bg-accent-orange/10 text-accent-orange" />
              </div>
            </div>

            {isPrivileged && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-6">
                <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-syne font-bold text-text-primary">{t('rep_modal_capital_dist_title')}</h4>
                      <p className="text-text-secondary text-sm">{t('rep_capital_dist_desc')}</p>
                    </div>
                    <DetailButton onClick={() => openModal('capitalDistModal')} />
                  </div>
                  <div className="h-[140px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stockStats.chartCapitalByCategory} layout="vertical" margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" fontSize={11} width={90} stroke="var(--text-muted)" />
                        <Tooltip
                          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                          formatter={(val) => fmtUZS(val)}
                          contentStyle={{ backgroundColor:'var(--bg-secondary)', borderColor:'var(--border)', borderRadius:'12px', color:'var(--text-primary)' }}
                          itemStyle={{ color:'var(--text-primary)', fontSize:'12px' }}
                          offset={10}
                          isAnimationActive={false}
                          wrapperStyle={{ zIndex:9999, pointerEvents:'none' }}
                        />
                        <Bar dataKey="value" name={t('rep_stock_frozen')} radius={[0, 4, 4, 0]} label={{
                          position: 'insideRight',
                          formatter: (v) => {
                            const total = stockStats.frozenCapital || 1
                            const pct = Math.round(v/total*100)
                            return pct >= 8 ? `${pct}%` : ''
                          },
                          fontSize: 12,
                          fontWeight: 'bold',
                          fill: '#ffffff'
                        }}>
                          {stockStats.chartCapitalByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={[C.red, C.blue, C.green][index % 3]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 overflow-hidden">
                  <h4 className="font-syne font-bold text-text-primary mb-1">{t('rep_turnover_standards')}</h4>
                  <p className="text-text-secondary text-sm mb-4">{t('rep_standard_vs_current')}</p>
                  <div className="space-y-3 overflow-y-auto max-h-[220px]">
                    {stockStats.turnoverStandards.map(s => {
                      const statusColor = s.status === 'good' ? C.green : s.status === 'warning' ? C.orange : s.status === 'slow' ? C.red : C.muted
                      const statusLabel = s.status === 'good' ? t('rep_status_good') : s.status === 'warning' ? t('rep_status_warning') : s.status === 'slow' ? t('rep_status_slow') : '—'
                      return (
                        <div key={s.category} className="bg-bg-tertiary rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                               <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getCatColorHex(s.category) }} />
                              <span className="text-text-primary text-sm font-medium">{s.label}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: statusColor+'22', color: statusColor }}>
                              {statusLabel}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-text-muted">{t('rep_col_standard')}: <span className="font-bold text-text-secondary">{s.stdDays} {t('rep_days_suffix')}</span></span>
                            <span className="text-text-muted">{t('rep_current_average')}: <span className="font-bold" style={{ color: statusColor }}>
                              {s.avgDays !== null ? `${s.avgDays} ${t('rep_days_suffix')}` : t('rep_no_data')}
                            </span></span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div
                    className="pt-3 border-t border-border mt-3 cursor-pointer hover:text-accent-red transition-colors"
                    onClick={() => {
                      if (!stockStats.staleItems.length) return
                      const next = (slowRotIdx + 1) % stockStats.staleItems.length
                      setSlowRotIdx(next)
                      setStaleIdx(-1)
                      setTimeout(() => {
                        const el = document.querySelector('.stale-highlighted-row')
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }, 50)
                    }}
                  >
                    <span className="text-accent-red font-bold text-sm">{stockStats.staleCount} ta</span>
                    <span className="text-text-muted text-xs ml-2">
                      {t('rep_slow_moving_hint')}
                      {slowRotIdx >= 0 ? ` — ${slowRotIdx + 1}/${stockStats.staleCount}` : ''})
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 flex-wrap mb-4">
              {(() => {
                const map = { tire: getCatLabelPlural('tire'), wheel: getCatLabelPlural('wheel'), accessory: getCatLabelPlural('accessory') }
                const cats = Array.from(new Set(stockStats.withDaysLeft.map(x => x.category)))
                const filters = [{ value: 'all', label: t('filter_all') }, ...cats.map(c => ({ value: c, label: map[c] || c }))]
                return filters.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setStockCategory(f.value)}
                    className={`px-4 py-1.5 rounded-xl text-sm font-bold border transition-all ${
                      stockCategory === f.value
                        ? 'bg-accent-red text-white border-accent-red'
                        : 'bg-bg-secondary border-border text-text-secondary hover:border-accent-red/50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))
              })()}
            </div>

            <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-border flex items-center justify-between">
                <h4 className="font-syne font-bold text-text-primary">{t('rep_warehouse_stock')}</h4>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <div className="w-2 h-2 rounded-full bg-accent-red" /> {t('stock_empty')}
                  <div className="w-2 h-2 rounded-full bg-accent-orange ml-2" /> {t('rep_status_low')}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-bg-tertiary border-b border-border">
                      <th className="text-left px-4 sm:px-6 py-2 sm:py-3 font-medium text-text-secondary whitespace-nowrap">#</th>
                      <th className="text-left px-4 sm:px-6 py-2 sm:py-3 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary whitespace-nowrap" onClick={() => toggleSort('stock', 'productName')}>
                        <span className="inline-flex items-center gap-1">
                          {t('col_product')} <SortIcon table="stock" col="productName" />
                        </span>
                      </th>
                      <th className="text-left px-4 sm:px-6 py-2 sm:py-3 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary whitespace-nowrap" onClick={() => toggleSort('stock', 'category')}>
                        <span className="inline-flex items-center gap-1">
                          {t('col_category')} <SortIcon table="stock" col="category" />
                        </span>
                      </th>
                      <th className="text-center px-4 sm:px-6 py-2 sm:py-3 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary whitespace-nowrap" onClick={() => toggleSort('stock', 'inStock')}>
                        <span className="inline-flex items-center gap-1 justify-center w-full">
                          {t('rep_col_remaining')} <SortIcon table="stock" col="inStock" />
                        </span>
                      </th>
                      <th className="text-center px-4 sm:px-6 py-2 sm:py-3 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary whitespace-nowrap" onClick={() => toggleSort('stock', 'daysLeft')}>
                        <span className="inline-flex items-center gap-1 justify-center w-full">
                          {t('rep_col_est_out')} <SortIcon table="stock" col="daysLeft" />
                        </span>
                      </th>
                      <th className="text-center px-4 sm:px-6 py-2 sm:py-3 font-medium text-text-secondary whitespace-nowrap">{t('rep_col_turnover')}</th>
                      {isPrivileged && <th className="text-right px-4 sm:px-6 py-2 sm:py-3 font-medium text-text-secondary whitespace-nowrap">{t('rep_col_purchase_price')}</th>}
                      {isPrivileged && (
                        <th className="text-right px-4 sm:px-6 py-2 sm:py-3 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary whitespace-nowrap" onClick={() => toggleSort('stock', 'margin')}>
                          <span className="inline-flex items-center gap-1 justify-end w-full">
                            {t('col_margin')} % <SortIcon table="stock" col="margin" />
                          </span>
                        </th>
                      )}
                      {isPrivileged && <th className="text-right px-4 sm:px-6 py-2 sm:py-3 font-medium text-text-secondary whitespace-nowrap">{t('rep_col_capital')}</th>}
                      <th className="text-center px-4 sm:px-6 py-2 sm:py-3 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary whitespace-nowrap" onClick={() => toggleSort('stock', 'lastSoldAt')}>
                        <span className="inline-flex items-center gap-1 justify-center w-full">
                          {t('rep_col_last_sold')} <SortIcon table="stock" col="lastSoldAt" />
                        </span>
                      </th>
                      {isPrivileged && (
                        <th className="text-center px-4 sm:px-6 py-2 sm:py-3 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary whitespace-nowrap" onClick={() => toggleSort('stock', 'lastReceivedAt')}>
                          <span className="inline-flex items-center gap-1 justify-center w-full">
                            {t('rep_col_receive_date')} <SortIcon table="stock" col="lastReceivedAt" />
                          </span>
                        </th>
                      )}
                      <th className="text-right px-4 sm:px-6 py-2 sm:py-3 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary whitespace-nowrap" onClick={() => toggleSort('stock', 'inStock')}>
                        <span className="inline-flex items-center gap-1 justify-end w-full">
                          {t('col_status')} <SortIcon table="stock" col="inStock" />
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {sortedData(filteredStock, 'stock').map((s, idx) => {
                      const isOut   = s.inStock === 0
                      const isLow   = s.inStock > 0 && s.inStock <= s.lowStockThreshold
                      const slowRotHighlight = slowRotIdx >= 0 && stockStats.staleItems[slowRotIdx]?.productId === s.productId
                      const notSoldHighlight = staleIdx >= 0 && stockStats.notSoldItems[staleIdx]?.productId === s.productId
                      const isStale = slowRotHighlight || notSoldHighlight
                      return (
                        <tr key={s.productId} className={`transition-colors ${
                          isStale ? 'bg-accent-blue/10 border-l-4 border-accent-blue stale-highlighted-row font-medium' :
                          isOut   ? 'bg-accent-red/10 border-l-4 border-l-accent-red out-of-stock-row font-medium' :
                          isLow   ? 'bg-accent-orange/5' :
                          'hover:bg-bg-tertiary'
                        }`}>
                          <td className="px-4 sm:px-6 py-2.5 sm:py-4 text-text-muted">{idx + 1}</td>
                          <td className="px-4 sm:px-6 py-2.5 sm:py-4 font-medium text-text-primary">{s.productName}</td>
                          <td className="px-4 sm:px-6 py-2.5 sm:py-4">
                            {renderCatBadge(s.category)}
                          </td>
                          <td className="px-4 sm:px-6 py-2.5 sm:py-4 text-center font-bold text-text-primary">{s.inStock} <span className="text-xs text-text-muted font-normal">{s.unit || 'dona'}</span></td>
                          <td className="px-4 sm:px-6 py-2.5 sm:py-4 text-center">
                            {s.inStock === 0 ? (
                              <span className="text-accent-red text-xs font-bold">{t('stock_empty')}</span>
                            ) : s.daysLeft === null ? (
                              <span className="text-text-muted text-xs">{t('rep_status_unknown')}</span>
                            ) : s.daysLeft <= 7 ? (
                              <span className="text-accent-red text-xs font-bold">{s.daysLeft} {t('rep_days_suffix')}</span>
                            ) : s.daysLeft <= 30 ? (
                              <span className="text-accent-orange text-xs font-bold">{s.daysLeft} {t('rep_days_suffix')}</span>
                            ) : (
                              <span className="text-accent-green text-xs">{s.daysLeft} {t('rep_days_suffix')}</span>
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-2.5 sm:py-4 text-center">
                            {s.turnoverStatus === 'out' ? (
                              <span className="text-text-muted text-xs">—</span>
                            ) : s.turnoverStatus === 'slow' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-blue/10 text-accent-blue">{t('rep_turnover_slow')}</span>
                            ) : s.turnoverStatus === 'fast' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-green/10 text-accent-green">{t('rep_turnover_fast')}</span>
                            ) : s.turnoverStatus === 'unknown' ? (
                              <span className="text-text-muted text-xs">—</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-bg-tertiary text-text-secondary">{t('rep_turnover_normal')}</span>
                            )}
                          </td>
                          {isPrivileged && <td className="px-4 sm:px-6 py-2.5 sm:py-4 text-right text-text-secondary">{fmtNum(s.purchasePrice)}</td>}
                          {isPrivileged && (
                            <td className="px-4 sm:px-6 py-2.5 sm:py-4 text-right text-sm font-bold" style={{ color: s.margin >= 20 ? C.green : s.margin >= 10 ? C.orange : C.red }}>
                              {s.margin}%
                            </td>
                          )}
                          {isPrivileged && <td className="px-4 sm:px-6 py-2.5 sm:py-4 text-right font-bold text-accent-blue">{fmtNum(s.inStock * s.purchasePrice)}</td>}
                          <td className="px-4 sm:px-6 py-2.5 sm:py-4 text-center text-xs">
                            {s.lastSoldAt ? (
                              <span className={s.daysSinceLastSold !== null && s.daysSinceLastSold > 60 ? 'text-accent-blue font-bold' : 'text-text-muted'}>
                                {s.lastSoldAt}
                                {s.daysSinceLastSold !== null && (
                                  <span className="block text-[10px] mt-0.5">({t('rep_days_ago', { days: s.daysSinceLastSold })})</span>
                                )}
                              </span>
                            ) : <span className="text-text-muted">—</span>}
                          </td>
                          {isPrivileged && (
                            <td className="px-4 sm:px-6 py-2.5 sm:py-4 text-center text-text-muted text-xs">{s.lastReceivedAt || '—'}</td>
                          )}
                          <td className="px-4 sm:px-6 py-2.5 sm:py-4 text-right">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              isOut ? 'bg-accent-red/10 text-accent-red' :
                              isLow ? 'bg-accent-orange/10 text-accent-orange' :
                              'bg-accent-green/10 text-accent-green'
                            }`}>
                              {isOut ? t('stock_empty') : isLow ? t('rep_status_low') : t('rep_status_normal')}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-4 sm:px-6 py-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
                <span>{stockStats.withDaysLeft.length} {t('rep_total_types')}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      if (!stockStats.notSoldItems.length) return
                      const next = (staleIdx + 1) % stockStats.notSoldItems.length
                      setStaleIdx(next)
                      setSlowRotIdx(-1)
                      setTimeout(() => {
                        const el = document.querySelector('.stale-highlighted-row')
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }, 50)
                    }}
                    className="text-accent-orange hover:text-accent-red transition-colors font-medium text-xs"
                  >
                    {stockStats.notSoldCount} {t('rep_total_products')}{staleIdx >= 0 ? ` (${staleIdx + 1}/${stockStats.notSoldCount})` : ''} —
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={notSoldDays}
                    onChange={e => { const v = parseInt(e.target.value); if (v > 0) { setNotSoldDays(v); setStaleIdx(-1) } }}
                    onClick={e => e.stopPropagation()}
                    className="w-12 text-center text-xs font-bold bg-transparent border-b border-accent-orange text-accent-orange focus:outline-none"
                  />
                  <span className="text-xs">{t('rep_not_sold_marked_hint')}</span>
                </div>
              </div>
            </div>

            {modal === 'totalItemsModal' && (() => {
              const catColors = Object.fromEntries((storeProductCategories||[]).map(c => [c.id, getCatColorHex(c.id)]))
              const catLabels = { tire: getCatLabelPlural('tire'), wheel: getCatLabelPlural('wheel'), accessory: getCatLabelPlural('accessory') }
              const _mSet = new Set(); MOCK_SALES.forEach(s => { if (s.soldAt) _mSet.add(s.soldAt.slice(0,7)) }); MOCK_INCOME_BATCHES.forEach(b => { if (b.receivedAt) _mSet.add(b.receivedAt.slice(0,7)) })
              const MONTHS = Array.from(_mSet).sort().reverse()
              const monthNames = Object.fromEntries(MONTHS.map(m => [m, getMonthLabel(m)]))

              const allCats = [...new Set(stockStats.withDaysLeft.map(x => x.category))]
              const prevMonth = MONTHS[1] || MONTHS[0] // o'tgan oy

              const catColorFallbacks = ['#E2E8F0', '#F59E0B', C.blue, C.green, C.red]

              const currentItems = stockStats.withDaysLeft
              const cats = allCats.map((cat, idx) => {
                const items = currentItems.filter(x => x.category === cat)
                const total = items.reduce((s,x) => s+x.inStock, 0)
                
                const prevIncome = MOCK_INCOME_BATCHES.filter(b => {
                  const stockItem = stockStats.withDaysLeft.find(s => s.productName === b.productName)
                  return stockItem?.category === cat && b.receivedAt?.startsWith(prevMonth)
                }).reduce((s,b) => s+b.quantity, 0)
                
                const prevSales = MOCK_SALES.filter(s => s.status !== 'cancelled' && s.soldAt?.startsWith(prevMonth))
                  .reduce((s, salesItem) => {
                    let qty = 0
                    salesItem.items.forEach(it => {
                      const name = typeof it === 'object' ? (it.name || '') : it.split(' x')[0]
                      const q    = typeof it === 'object' ? (it.qty || 1) : parseInt(it.split(' x')[1] || '1')
                      const stockItem = stockStats.withDaysLeft.find(st => st.productName === name)
                      if (stockItem?.category === cat) qty += q
                    })
                    return s + qty
                  }, 0)

                const prevTotal = Math.max(0, total - prevIncome + prevSales)

                return {
                  cat,
                  label: catLabels[cat] || (cat.charAt(0).toUpperCase() + cat.slice(1)),
                  color: catColors[cat] || getCatColorHex(cat),
                  total,
                  items,
                  prevTotal
                }
              })

              return (
                <Modal open title={t('rep_modal_total_stock_title')} subtitle={t('rep_modal_total_stock_sub')} size="lg" onClose={closeModal}>
                  <div className="grid gap-3 mb-4 sm:mb-6" style={{ gridTemplateColumns: `repeat(${cats.length}, minmax(0, 1fr))` }}>
                    {cats.map(c => (
                      <div key={c.cat} className="bg-bg-tertiary rounded-xl p-4 text-center flex flex-col justify-between">
                        <div>
                          <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center"
                            style={{ backgroundColor: c.color+'22', color: c.color }}>
                            <Package size={16} />
                          </div>
                          <p className="text-text-muted text-xs mb-1">{c.label}</p>
                          <p className="font-syne font-bold text-text-primary text-2xl">{c.total}</p>
                          {c.prevTotal > 0 && c.prevTotal !== c.total && (
                            <div className="mt-1.5 flex justify-center">
                              <GrowthBadge current={c.total} previous={c.prevTotal} />
                            </div>
                          )}
                        </div>
                        <p className="text-text-muted text-xs mt-2">{c.items.length} {t('rep_total_types')}</p>
                      </div>
                    ))}
                  </div>

                  {/* Vizual taqsimot */}
                  <div className="mb-4 sm:mb-6">
                    <p className="text-text-secondary text-sm font-medium mb-2">{t('rep_distribution')}</p>
                    <div className="flex rounded-full overflow-hidden h-6 bg-bg-tertiary/20">
                      {cats.map(c => {
                        const pct = stockStats.totalItems > 0 ? Math.round(c.total/stockStats.totalItems*100) : 0
                        const isLight = c.color === '#E2E8F0' || c.color === '#ffffff'
                        return pct > 0 ? (
                          <div key={c.cat} style={{ width:`${pct}%`, backgroundColor: c.color, color: isLight ? '#374151' : '#ffffff', border: isLight ? '1px solid #CBD5E1' : 'none' }}
                            className="flex items-center justify-center text-[10px] font-bold">
                            {pct > 6 ? `${pct}%` : ''}
                          </div>
                        ) : null
                      })}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      {cats.map(c => (
                        <div key={c.cat} className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                          <span className="text-text-secondary text-xs">{c.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Kirim dinamikasi */}
                  <p className="text-text-secondary text-sm font-medium mb-3">{t('rep_monthly_income_dynamics')}</p>
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-bg-tertiary border-b border-border">
                          <th className="text-left px-3 sm:px-4 py-2 sm:py-3 font-medium text-text-secondary flex items-center gap-2">{t('rep_col_month')} <MonthSortBtn /></th>
                          {cats.map(c => (
                            <th key={c.cat} className="text-center px-3 sm:px-4 py-2 sm:py-3 font-medium" style={{ color: c.color }}>{c.label}</th>
                          ))}
                          <th className="text-right px-3 sm:px-4 py-2 sm:py-3 font-medium text-text-secondary">{t('rep_col_total', 'Jami')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {(msd==='desc'?[...MONTHS]:([...MONTHS].reverse())).map(m => {
                          const catMap = {}
                          MOCK_INCOME_BATCHES.forEach(b => {
                            const stockItem = stockStats.withDaysLeft.find(s => s.productName === b.productName)
                            const cat = stockItem?.category || 'accessory'
                            if (b.receivedAt?.startsWith(m)) catMap[cat] = (catMap[cat]||0) + b.quantity
                          })
                          const total = Object.values(catMap).reduce((s,x) => s+x, 0)
                          return (
                            <tr key={m} className="hover:bg-bg-tertiary transition-colors">
                              <td className="px-3 sm:px-4 py-2 sm:py-3 font-medium text-text-primary">{monthNames[m]}</td>
                              {cats.map(c => (
                                <td key={c.cat} className="px-3 sm:px-4 py-2 sm:py-3 text-center font-bold" style={{ color: c.color }}>{catMap[c.cat]||0} {t('unit_pcs')}</td>
                              ))}
                              <td className="px-3 sm:px-4 py-2 sm:py-3 text-right font-bold text-text-primary">{total} {t('unit_pcs')}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </Modal>
              )
            })()}

            {modal === 'potentialModal' && (() => {
              const allCats = [...new Set(stockStats.withDaysLeft.map(x => x.category))]
              const catColors = Object.fromEntries((storeProductCategories||[]).map(c => [c.id, getCatColorHex(c.id)]))
              const catLabels = { tire: getCatLabelPlural('tire'), wheel: getCatLabelPlural('wheel'), accessory: getCatLabelPlural('accessory') }
              const catColorFallbacks = ['#E2E8F0', '#F59E0B', C.blue, C.green, C.red]

              const avgMargin = stockStats.frozenCapital > 0
                ? Math.round((stockStats.potentialProfit / stockStats.potentialRevenue) * 100) : 0

              const catData = allCats.map((cat, idx) => {
                const items = stockStats.withDaysLeft.filter(x => x.category === cat && x.inStock > 0)
                const revenue = items.reduce((s,x) => s + x.inStock * x.cashPrice, 0)
                const profit  = items.reduce((s,x) => s + x.inStock * (x.cashPrice - x.purchasePrice), 0)
                const margin  = revenue > 0 ? Math.round(profit/revenue*100) : 0
                // Kategoriya jami qoldig'i ÷ kategoriya jami kunlik tezligi
                const totalStock = items.reduce((s,x) => s + x.inStock, 0)
                const totalDailyRate = items.reduce((s,x) => s + x.dailySalesRate, 0)
                const avgDays = totalDailyRate > 0 ? Math.round(totalStock / totalDailyRate) : null
                
                return {
                  cat,
                  label: catLabels[cat] || (cat.charAt(0).toUpperCase() + cat.slice(1)),
                  color: catColors[cat] || getCatColorHex(cat),
                  revenue,
                  profit,
                  margin,
                  avgDays,
                  items: items.length
                }
              })

              return (
                <Modal open title={t('rep_modal_potential_profit_title')} subtitle={t('rep_modal_potential_profit_sub')} size="lg" onClose={closeModal}>
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-3 mb-4 sm:mb-6">
                    <div className="bg-bg-tertiary rounded-xl p-4 text-center">
                      <p className="text-text-muted text-xs mb-1">{t('rep_stock_potential')}</p>
                      <p className="font-syne font-bold text-accent-green text-xl">{fmtUZS(stockStats.potentialRevenue)}</p>
                    </div>
                    <div className="bg-bg-tertiary rounded-xl p-4 text-center">
                      <p className="text-text-muted text-xs mb-1">{t('rep_col_potential_profit')}</p>
                      <p className="font-syne font-bold text-accent-blue text-xl">{fmtUZS(stockStats.potentialProfit)}</p>
                    </div>
                    <div className="bg-bg-tertiary rounded-xl p-4 text-center">
                      <p className="text-text-muted text-xs mb-1">{t('rep_average_margin')}</p>
                      <p className="font-syne font-bold text-text-primary text-xl">{avgMargin}%</p>
                    </div>
                  </div>

                  {/* Kategoriya bo'yicha */}
                  <p className="text-text-secondary text-sm font-medium mb-3">{t('rep_potential_by_category')}</p>
                  <div className="space-y-3 mb-4 sm:mb-6">
                    {catData.sort((a,b) => b.profit-a.profit).map((c,i) => (
                      <div key={c.cat} className="bg-bg-tertiary rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold" style={{ color: c.color }}>
                              {i===0 ? '🏆 ' : ''}{c.label}
                            </span>
                            <span className="text-text-muted text-xs">{c.items} {t('rep_total_types')}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold"
                            style={{ backgroundColor: c.color+'22', color: c.color }}>
                            {c.margin}% {t('col_margin').toLowerCase()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-text-muted mb-0.5">{t('rep_stock_potential')}</p>
                            <p className="font-bold text-text-primary">{fmtUZS(c.revenue)}</p>
                          </div>
                          <div>
                            <p className="text-text-muted mb-0.5">{t('rep_col_potential_profit')}</p>
                            <p className="font-bold" style={{ color: c.color }}>{fmtUZS(c.profit)}</p>
                          </div>
                        </div>
                        {c.avgDays !== null && (
                          <p className="text-text-muted text-xs mt-2">
                            {t('rep_estimated_sell_time')}: <span className="font-bold text-text-primary">~{c.avgDays} {t('rep_days_suffix')}</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </Modal>
              )
            })()}

            {/* === MODAL: Kapital taqsimoti === */}
            {modal === 'capitalDistModal' && (() => {
              const allCats = [...new Set(stockStats.withDaysLeft.map(x => x.category))]
              const catColors = Object.fromEntries((storeProductCategories||[]).map(c => [c.id, getCatColorHex(c.id)]))
              const catLabels = { tire: getCatLabelPlural('tire'), wheel: getCatLabelPlural('wheel'), accessory: getCatLabelPlural('accessory') }
              const catColorFallbacks = ['#E2E8F0', '#F59E0B', C.blue, C.green, C.red]
              const _mSet2 = new Set(); MOCK_SALES.forEach(s => { if (s.soldAt) _mSet2.add(s.soldAt.slice(0,7)) }); MOCK_INCOME_BATCHES.forEach(b => { if (b.receivedAt) _mSet2.add(b.receivedAt.slice(0,7)) })
              const MONTHS = Array.from(_mSet2).sort().reverse()
              const monthNames = Object.fromEntries(MONTHS.map(m => [m, getMonthLabel(m)]))

              const dynamicCats = allCats.map((cat, idx) => {
                const items = stockStats.withDaysLeft.filter(x => x.category === cat && x.inStock > 0)
                const value = items.reduce((sum, x) => sum + x.inStock * x.purchasePrice, 0)
                const label = catLabels[cat] || (cat.charAt(0).toUpperCase() + cat.slice(1))
                const color = catColors[cat] || getCatColorHex(cat)
                return { cat, label, color, value, itemsCount: items.length }
              })

              const totalFrozenCapital = dynamicCats.reduce((s, x) => s + x.value, 0)

              return (
                <Modal open title={t('rep_modal_capital_dist_title')} subtitle={t('rep_modal_capital_dist_sub')} size="xl" onClose={closeModal}>
                  {/* Controls / Filters */}
                  <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
                    <p className="text-text-secondary text-sm font-medium">{t('rep_detailed_capital_dist')}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-text-muted text-xs">{t('rep_filter_by_month')}</span>
                      <MonthYearFilter value={modalFilter} onChange={setModalFilter} />
                    </div>
                  </div>

                  {/* Multi-grid layout */}
                  <div className="grid gap-3 mb-4 sm:mb-6" style={{ gridTemplateColumns: `repeat(${dynamicCats.length}, minmax(0, 1fr))` }}>
                    {dynamicCats.map(c => {
                      const pct = totalFrozenCapital > 0 ? Math.round(c.value / totalFrozenCapital * 100) : 0
                      return (
                        <div key={c.cat} className="bg-bg-tertiary rounded-xl p-4 flex flex-col justify-between">
                          <div>
                            <p className="text-text-muted text-xs mb-1">{c.label}</p>
                            <p className="font-syne font-bold text-text-primary text-xl">{fmtUZS(c.value)}</p>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
                            <span className="text-text-muted text-xs">{c.itemsCount} {t('rep_total_products')}</span>
                            <span className="font-bold text-xs px-2 py-0.5 rounded"
                              style={{ backgroundColor: c.color+'22', color: c.color }}>
                              {pct}%
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Vizual taqsimot */}
                  <div className="mb-4 sm:mb-6 bg-bg-tertiary/40 border border-border/50 rounded-2xl p-4">
                    <p className="text-text-secondary text-sm font-medium mb-3">{t('rep_total_share_ratio')}</p>
                    <div className="flex rounded-full overflow-hidden h-8 bg-bg-tertiary">
                      {dynamicCats.map(c => {
                        const pct = totalFrozenCapital > 0 ? Math.round(c.value / totalFrozenCapital * 100) : 0
                        const isLight = c.color === '#E2E8F0' || c.color === '#ffffff'
                        return pct > 0 ? (
                          <div key={c.cat}
                            style={{ width:`${pct}%`, backgroundColor: c.color, color: isLight ? '#374151' : '#ffffff', border: isLight ? '1px solid #CBD5E1' : 'none' }}
                            className="flex items-center justify-center text-xs font-bold transition-all">
                            {pct > 8 ? `${pct}%` : ''}
                          </div>
                        ) : null
                      })}
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      {dynamicCats.map(c => (
                        <div key={c.cat} className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                          <span className="text-text-secondary text-xs font-medium">{c.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Jadval 1 — Mahsulot bo'yicha kapital */}
                  <p className="text-text-secondary text-sm font-medium mb-3">{t('rep_capital_by_product')}</p>
                  <ModalTable
                    data={stockStats.frozenByProduct}
                    pageSize={8}
                    columns={[
                      { key:'productName', label:t('col_product'), render: r => (
                        <span className="font-medium text-text-primary">{r.productName}</span>
                      )},
                      { key:'category', label:t('col_category'), render: r => (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                          style={{ backgroundColor: (catColors[r.category]||'#E2E8F0')+'22', color: catColors[r.category]||'#E2E8F0' }}>
                          {catLabels[r.category] || r.category}
                        </span>
                      )},
                      { key:'inStock', label:t('rep_col_remaining'), align:'center', render: r => (
                        <span className="font-bold text-text-primary">{r.inStock} <span className="text-xs font-normal text-text-muted">{r.unit || 'dona'}</span></span>
                      )},
                      { key:'purchasePrice', label:t('rep_col_purchase_price'), align:'right', render: r => fmtUZS(r.purchasePrice) },
                      { key:'capital', label:t('rep_col_capital'), align:'right', render: r => (
                        <span className="font-bold text-accent-blue">{fmtUZS(r.inStock * r.purchasePrice)}</span>
                      )},
                      { key:'margin', label:t('col_margin'), align:'center', render: r => (
                        <span className="text-sm font-bold" style={{ color: r.margin >= 20 ? C.green : r.margin >= 10 ? C.orange : C.red }}>
                          {r.margin}%
                        </span>
                      )},
                      { key:'turnoverStatus', label:t('rep_col_turnover'), align:'center', render: r => {
                        const map = { fast: t('rep_turnover_fast'), normal: t('rep_turnover_normal'), slow: t('rep_turnover_slow'), out: t('stock_empty'), unknown: '—' }
                        const cls = { fast:'bg-accent-green/10 text-accent-green', normal:'bg-bg-tertiary text-text-secondary', slow:'bg-accent-blue/10 text-accent-blue', out:'bg-accent-red/10 text-accent-red', unknown:'' }
                        return <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${cls[r.turnoverStatus]}`}>{map[r.turnoverStatus]}</span>
                      }},
                    ]}
                  />

                  {/* Jadval 2 — Oylik kirim partiyalari (tagida, full width) */}
                  <p className="text-text-secondary text-sm font-medium mb-3 mt-5 sm:mt-8">{t('rep_monthly_income_batches')}</p>
                  <ModalTable
                    data={MOCK_INCOME_BATCHES.sort((a,b) => {
                      const aDate = a.dueDate || ''
                      const bDate = b.dueDate || ''
                      return bDate.localeCompare(aDate)
                    })}
                    pageSize={8}
                    columns={[
                      { key:'productName', label:t('col_product'), render: r => <span className="font-medium text-text-primary">{r.productName}</span> },
                      { key:'quantity', label:t('rep_col_qty'), align:'center', render: r => <span className="font-bold text-text-primary">{r.quantity} {t('unit_pcs')}</span> },
                      { key:'totalUZS_atEntry', label:t('rep_col_total_uzs'), align:'right', render: r => (
                        <span className="font-bold text-accent-blue">{fmtUZS(r.totalUZS_atEntry)}</span>
                      )},
                      { key:'paidUSD', label:t('rep_col_paid_usd'), align:'right', render: r => (
                        <span className="font-bold text-accent-green">${r.paidUSD}</span>
                      )},
                      { key:'debtUSD', label:t('col_debt_usd'), align:'right', render: r => r.debtUSD > 0 ? (
                        <span className="font-bold text-accent-red">${r.debtUSD}</span>
                      ) : <span className="text-text-muted">—</span> },
                      { key:'dueDate', label:t('rep_col_due_date'), align:'center', render: r => r.dueDate ? (
                        <span className={`text-sm font-medium ${r.dueDate < TODAY && r.debtUSD > 0 ? 'text-accent-red font-bold' : 'text-text-secondary'}`}>
                          {r.dueDate}
                        </span>
                      ) : <span className="text-text-muted text-sm">—</span> },
                    ]}
                  />
                </Modal>
              )
            })()}

            {/* === MODAL: Qotib qolgan kapital === */}
            {modal === 'frozenCapModal' && (() => {
              const _mSet3 = new Set(); MOCK_SALES.forEach(s => { if (s.soldAt) _mSet3.add(s.soldAt.slice(0,7)) }); MOCK_INCOME_BATCHES.forEach(b => { if (b.receivedAt) _mSet3.add(b.receivedAt.slice(0,7)) })
              const MONTHS_LIST = Array.from(_mSet3).sort().reverse()
              const prevMonth = MONTHS_LIST[1] || MONTHS_LIST[0]
              
              const prevIncomeCapital = MOCK_INCOME_BATCHES.filter(b => b.receivedAt?.startsWith(prevMonth))
                .reduce((s, b) => {
                  const stockItem = stockStats.withDaysLeft.find(st => st.productName === b.productName)
                  const price = stockItem ? stockItem.purchasePrice : 0
                  return s + b.quantity * price
                }, 0)

              const prevSalesCapital = MOCK_SALES.filter(s => s.status !== 'cancelled' && s.soldAt?.startsWith(prevMonth))
                .reduce((s, sale) => {
                  let cap = 0
                  sale.items.forEach(it => {
                    const name = typeof it === 'object' ? (it.name || '') : it.split(' x')[0]
                    const q    = typeof it === 'object' ? (it.qty || 1) : parseInt(it.split(' x')[1] || '1')
                    const stockItem = stockStats.withDaysLeft.find(st => st.productName === name)
                    if (stockItem) cap += q * stockItem.purchasePrice
                  })
                  return s + cap
                }, 0)

              const prevCapital = Math.max(0, stockStats.frozenCapital - prevIncomeCapital + prevSalesCapital)
              const diff = stockStats.frozenCapital - prevCapital
              const isUp = diff >= 0

              return (
                <Modal open title={t('rep_modal_frozen_capital_title')} subtitle={t('rep_modal_frozen_capital_sub')} size="2xl" onClose={closeModal}>
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-3 mb-4 sm:mb-6">
                    <div className="bg-bg-tertiary rounded-xl p-4 text-center flex flex-col justify-between items-center">
                      <div>
                        <p className="text-text-muted text-xs mb-1">{t('rep_total_frozen')}</p>
                        <p className="font-syne font-bold text-accent-blue text-xl">{fmtUZS(stockStats.frozenCapital)}</p>
                      </div>
                      <div className="mt-2 flex flex-col items-center gap-0.5">
                        <GrowthBadge current={stockStats.frozenCapital} previous={prevCapital} />
                        {diff !== 0 && (
                          <span className={`text-[10px] font-bold ${isUp ? 'text-accent-red font-medium' : 'text-accent-green font-medium'}`}>
                            {isUp ? `↑ ${t('rep_increased')}` : `↓ ${t('rep_decreased')}`} ({fmtUZS(Math.abs(diff))})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="bg-bg-tertiary rounded-xl p-4 text-center">
                      <p className="text-text-muted text-xs mb-1">{t('rep_col_potential_profit')}</p>
                      <p className="font-syne font-bold text-accent-green text-xl">{fmtUZS(stockStats.potentialProfit)}</p>
                      <p className="text-text-muted text-xs mt-1">{t('rep_sales_minus_purchase')}</p>
                    </div>
                    <div className="bg-bg-tertiary rounded-xl p-4 text-center flex flex-col justify-center">
                      <p className="text-text-muted text-xs mb-1">{t('rep_slow_moving_capital')}</p>
                      <p className="font-syne font-bold text-accent-orange text-xl">
                        {fmtUZS(stockStats.withDaysLeft.filter(x => x.turnoverStatus === 'slow').reduce((s,x) => s + x.inStock * x.purchasePrice, 0))}
                      </p>
                    </div>
                  </div>

                  {/* Sekin aylanuvchilar alohida */}
                  {stockStats.withDaysLeft.filter(x => x.turnoverStatus === 'slow').length > 0 && (
                    <div className="mb-4 sm:mb-6 bg-accent-orange/5 border border-accent-orange/20 rounded-xl p-4">
                      <p className="text-accent-orange font-bold text-sm mb-3 flex items-center gap-2">
                        <AlertTriangle size={16} />
                        {t('rep_slow_moving_capital_alert')}
                      </p>
                      <div className="space-y-2">
                        {stockStats.withDaysLeft.filter(x => x.turnoverStatus === 'slow').map(x => (
                          <div key={x.productId} className="flex items-center justify-between bg-bg-secondary rounded-lg px-4 py-2.5">
                            <span className="text-text-primary text-sm font-medium">{x.productName}</span>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-text-muted text-xs">
                                {x.inStock} {x.unit || 'dona'} {t('rep_col_remaining').toLowerCase()}
                                {x.daysLeft !== null
                                  ? <> · ~{x.daysLeft} {t('rep_days_ends_suffix')}</>
                                  : <> · {t('rep_no_sales')}</>}
                              </span>
                              <span className="font-bold text-accent-orange">{fmtUZS(x.inStock * x.purchasePrice)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* To'liq jadval */}
                  <p className="text-text-secondary text-sm font-medium mb-3">{t('rep_all_products_list')}</p>
                  <ModalTable
                    data={stockStats.frozenByProduct}
                    pageSize={8}
                    columns={[
                      { key:'productName', label:t('col_product'), render: r => <span className="font-medium text-text-primary">{r.productName}</span> },
                      { key:'inStock', label:t('rep_col_remaining'), align:'center', render: r => `${r.inStock} ${r.unit || 'dona'}` },
                      { key:'purchasePrice', label:t('wh_th_purchase_price'), align:'right', render: r => fmtUZS(r.purchasePrice) },
                      { key:'capital', label:t('rep_col_capital'), align:'right', render: r => (
                        <span className="font-bold text-accent-blue">{fmtUZS(r.inStock * r.purchasePrice)}</span>
                      )},
                      { key:'daysSinceLastSold', label:t('rep_days_not_sold_header'), align:'center', render: r => {
                        if (r.daysSinceLastSold === null) return <span className="text-text-muted text-xs">{t('rep_not_sold')}</span>
                        return <span className="text-text-secondary text-xs">{r.daysSinceLastSold} {t('rep_days_suffix')}</span>
                      }},
                      { key:'status', label:t('col_status'), align:'center', render: r => {
                        const days = r.daysSinceLastSold
                        if (days === null || days > 90) return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-red/10 text-accent-red uppercase">{t('rep_status_critical')}</span>
                        if (days > 60) return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-orange/10 text-accent-orange uppercase">{t('rep_status_bad')}</span>
                        if (days > 30) return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-500 uppercase">{t('rep_status_warning_short')}</span>
                        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-green/10 text-accent-green uppercase">{t('rep_status_good_short')}</span>
                      }},
                      { key:'potentialProfit', label:t('rep_col_potential_profit'), align:'right', render: r => (
                        <span className="font-bold text-accent-green">{fmtUZS(r.inStock * (r.cashPrice - r.purchasePrice))}</span>
                      )},
                      { key:'margin', label:t('col_margin'), align:'center', render: r => {
                        const m = r.inStock * r.cashPrice > 0 ? Math.round((r.cashPrice - r.purchasePrice)/r.cashPrice*100) : 0
                        return <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m >= 20 ? 'bg-accent-green/10 text-accent-green' : m >= 10 ? 'bg-accent-orange/10 text-accent-orange' : 'bg-accent-red/10 text-accent-red'}`}>{m}%</span>
                      }},
                    ]}
                  />
                </Modal>
              )
            })()}

            {/* === MODAL: Kam / Tugagan tovarlar === */}
            {modal === 'lowStockModal' && (() => {
              return (
                <Modal open title={t('rep_modal_low_stock_title')} subtitle={t('rep_modal_low_stock_sub')} size="lg" onClose={closeModal}>
                  {/* Tugagan tovarlar */}
                  <div className="mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-accent-red" />
                      <p className="text-text-primary font-syne font-bold">{t('rep_out_of_stock_title')} — {stockStats.outOfStockItems.length} {t('unit_pcs')}</p>
                    </div>
                    {stockStats.outOfStockItems.length === 0
                      ? <p className="text-text-muted text-sm text-center py-4">{t('rep_no_out_of_stock')}</p>
                      : <div className="space-y-2">
                          {stockStats.outOfStockItems.map(x => (
                            <div key={x.productId} className="bg-accent-red/5 border border-accent-red/20 rounded-xl px-4 py-3 flex items-center justify-between">
                              <div>
                                <p className="font-medium text-text-primary text-sm">{x.productName}</p>
                                <p className="text-text-muted text-xs mt-0.5">
                                  {t('rep_col_last_sold_prefix')}{x.lastSoldAt || '—'}
                                  {x.daysSinceLastSold !== null && ` (${t('rep_days_ago', { days: x.daysSinceLastSold })})`}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-red/10 text-accent-red">{t('stock_empty')}</span>
                                <p className="text-text-muted text-xs mt-1">
                                  {t('rep_recommendation_prefix')}<span className="font-bold text-accent-red">{t('rep_rec_urgent_order')}</span>
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                    }
                  </div>

                  {/* Kam qolgan tovarlar */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-accent-orange" />
                      <p className="text-text-primary font-syne font-bold">{t('rep_low_stock_title')} — {stockStats.lowStockItems.length} {t('unit_pcs')}</p>
                    </div>
                    {stockStats.lowStockItems.length === 0
                      ? <p className="text-text-muted text-sm text-center py-4">{t('rep_no_low_stock')}</p>
                      : <div className="space-y-2">
                          {stockStats.lowStockItems.map(x => (
                            <div key={x.productId} className="bg-accent-orange/5 border border-accent-orange/20 rounded-xl px-4 py-3 flex items-center justify-between">
                              <div>
                                <p className="font-medium text-text-primary text-sm">{x.productName}</p>
                                <p className="text-text-muted text-xs mt-0.5">
                                  {t('rep_col_remaining')}: <span className="font-bold text-accent-orange">{x.inStock} {x.unit || 'dona'}</span>
                                  {' '}/ {t('rep_threshold_prefix')}{x.lowStockThreshold} {x.unit || 'dona'}
                                  {x.daysLeft !== null && ` • ~${x.daysLeft} ${t('rep_days_suffix')}`}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-orange/10 text-accent-orange">{t('rep_status_low')}</span>
                                <p className="text-text-muted text-xs mt-1">
                                  {t('rep_recommendation_prefix')}<span className="font-bold text-accent-orange">
                                    {x.daysLeft !== null && x.daysLeft <= 14 ? t('rep_rec_fast_order') : t('rep_rec_plan_order')}
                                  </span>
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                    }
                  </div>
                </Modal>
              )
            })()}
          </>

  )
}

export default StockTab
