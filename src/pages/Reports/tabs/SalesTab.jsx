import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { Activity, Award, BarChart3, ChevronDown, CircleX, Clock, CreditCard, DollarSign, Eye, MapPin, RefreshCw, Repeat, ShoppingCart, Star, Target, TrendingUp, UserX, Users } from 'lucide-react'
import { C, SOURCE_LABELS, DetailButton, GrowthBadge, Modal, ModalTable, MonthYearFilter, MonthlyDynamicsChart, Pagination, TODAY, fmtItems, fmtNum, fmtSoldAt, fmtUSD, fmtUZS } from '../components/shared'
import { getSaleProfit } from '../../../utils/profitHelpers'

const SalesTab = ({ ctx }) => {
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
    MOCK_SALES, MOCK_PRODUCTS,
  } = ctx

  return (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="cursor-pointer" onClick={() => openModal('salesTotalModal')}>
                <StatCard icon={ShoppingCart} label={t('rep_total_sales')} value={fmtUZS(salesData.totalSales)} trend={salesData.growthPct} sub={period === 'all' ? t('rep_all_time') : t('rep_selected_period')} />
              </div>
              <div className={isPrivileged ? 'cursor-pointer' : ''} onClick={() => isPrivileged && openModal('salsProfitModal')}>
                <StatCard icon={TrendingUp} label={t('rep_total_profit')} value={isPrivileged ? fmtUZS(salesData.totalProfit) : '—'} sub={t('rep_sales_profit_sub')} color="bg-accent-green/10 text-accent-green" />
              </div>
              <div className="cursor-pointer" onClick={() => openModal('salesTotalModal')}>
                <StatCard icon={DollarSign} label={t('rep_avg_check')} value={fmtUZS(salesData.avgCheck)} sub={t('rep_avg_check_sub')} color="bg-accent-blue/10 text-accent-blue" />
              </div>
              <div className="cursor-pointer" onClick={() => openModal('salesCountModal')}>
                <StatCard icon={BarChart3} label={t('rep_sales_count')} value={salesData.salesCount} sub={`${salesData.cancelledCount} ${t('rep_stat_cancelled')} · ${salesData.exchangedCount} ${t('rep_stat_exchanged')}`} color="bg-purple-500/10 text-purple-500" trend={salesData.countGrowth} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-bg-secondary border border-border rounded-2xl p-5 lg:col-span-2 cursor-pointer hover:border-accent-red/40 transition-colors" onClick={() => openModal('salesTargetModal')}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-text-secondary text-sm font-medium">{t('rep_monthly_target')}</p>
                    <h3 className="text-2xl font-syne font-bold text-text-primary">{fmtUZS(salesData.targetMonthSales)}</h3>
                    <p className="text-text-muted text-xs">{t('rep_target_label')}: {fmtUZS(salesData.target)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-accent-blue/10 text-accent-blue flex items-center justify-center">
                    <Target size={22} />
                  </div>
                </div>
                <div className="w-full bg-bg-tertiary rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all"
                    style={{ width: `${salesData.targetPct}%`, backgroundColor: salesData.targetPct >= 100 ? C.green : salesData.targetPct >= 70 ? C.orange : C.red }}
                  />
                </div>
                <p className="text-text-muted text-xs mt-1">{t('rep_target_done', { pct: salesData.targetPct })}</p>
              </div>

              <div className="bg-bg-secondary border border-border rounded-2xl p-5 cursor-pointer hover:border-accent-orange/40 transition-colors" onClick={() => openModal('installmentModal')}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-text-secondary text-sm font-medium">{t('rep_installment_debt')}</p>
                  <CreditCard size={20} className="text-accent-orange" />
                </div>
                <h3 className="text-2xl font-syne font-bold text-accent-orange">{fmtUZS(salesData.installmentTotal)}</h3>
                <p className="text-text-muted text-xs">{t('rep_installment_sales', { n: salesData.completed.filter(s => s.paymentType === 'installment').length })}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-bg-secondary border border-border rounded-2xl p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-syne font-bold text-text-primary">{t('rep_daily_dynamics')}</h4>
                    <p className="text-text-secondary text-sm">
                      {getMonthLabel(period === 'all' ? new Date().toISOString().slice(0,7) : period)} — {t('rep_daily_results')}
                    </p>
                  </div>
                  <DetailButton onClick={() => openModal('dailyChartModal')} />
                </div>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(() => {
                      const curMonth = period === 'all' ? new Date().toISOString().slice(0,7) : period
                      const dailyMap = {}
                      const daysInMonth = new Date(parseInt(curMonth.split('-')[0]), parseInt(curMonth.split('-')[1]), 0).getDate()
                      for (let d = 1; d <= daysInMonth; d++) {
                        const key = `${curMonth}-${String(d).padStart(2,'0')}`
                        dailyMap[key] = 0
                      }
                      MOCK_SALES.filter(s => s.status !== 'cancelled' && s.soldAt && s.soldAt.startsWith(curMonth))
                        .forEach(s => { if (!s.soldAt) return; const date = s.soldAt.slice(0,10); dailyMap[date] = (dailyMap[date]||0) + s.total })
                      return Object.entries(dailyMap).map(([date, total]) => ({ date, total, day: parseInt(date.split('-')[2]) }))
                    })()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="day" fontSize={9} stroke="var(--text-muted)" interval={2} />
                      <YAxis hide />
                      <Tooltip
                        cursor={{ fill:'rgba(255,255,255,0.04)' }}
                        contentStyle={{ backgroundColor:'var(--bg-secondary)', borderColor:'var(--border)', borderRadius:'12px', color:'var(--text-primary)' }}
                        itemStyle={{ color:'var(--text-primary)', fontSize:'12px' }}
                        formatter={v => fmtUZS(v)}
                        labelFormatter={d => `${d}${t('rep_day_suffix')}`}
                        offset={10}
                        isAnimationActive={false}
                        wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }} />
                      <Bar dataKey="total" fill={C.red} radius={[3,3,0,0]} name={t('rep_chart_sales')} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-bg-secondary border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-syne font-bold text-text-primary">{t('rep_pay_types')}</h4>
                    <p className="text-text-secondary text-sm">{t('rep_pay_types_sub')}</p>
                  </div>
                  <DetailButton onClick={() => openModal('payTypeModal')} />
                </div>
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={salesData.chartTypes}
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                        isAnimationActive={false}
                      >
                        {salesData.chartTypes.map((entry) => {
                          const colorMap = { cash: C.green, card: C.blue, installment: C.orange, transfer: C.purple }
                          return <Cell key={entry.name} fill={colorMap[entry.typeKey] || C.muted} />
                        })}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', borderRadius: '12px', color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)', fontSize: '12px' }} offset={10} isAnimationActive={false} wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }} />
                      <Legend iconType="circle" iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <h4 className="font-syne font-bold text-text-primary">{t('rep_top_products')}</h4>
                  <DetailButton onClick={() => openModal('topProductsModal')} />
                  {/* MOCK — replace with: GET /api/sales/top-products */}
                </div>
                <div className="divide-y divide-border/50">
                  {salesData.topProducts.map((p, i) => (
                    <div key={p.name} className="px-6 py-3 flex items-center justify-between hover:bg-bg-tertiary transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: [C.red,C.orange,C.blue,C.green,C.purple][i]+'22', color: [C.red,C.orange,C.blue,C.green,C.purple][i] }}>
                          {i+1}
                        </span>
                        <span className="text-text-primary text-sm font-medium">{p.name}</span>
                      </div>
                      <span className="font-bold text-text-primary">{p.count} {t('unit_pcs')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
                {/* MOCK — replace with: GET /api/sales/seasonal */}
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <div>
                    <h4 className="font-syne font-bold text-text-primary">{t('rep_seasonal')}</h4>
                    <p className="text-text-secondary text-sm">{t('rep_seasonal_sub')}</p>
                  </div>
                  <DetailButton onClick={() => openModal('seasonalModal')} />
                </div>
                <div className="grid grid-cols-3 divide-x divide-border">
                  {salesData.chartCategories.map(s => (
                    <div key={s.label} className="p-6 text-center">
                      <div className="text-3xl font-syne font-extrabold mb-1" style={{ color: s.color }}>{s.count}</div>
                      <div className="text-text-secondary text-sm">{s.label}</div>
                      <div className="text-text-muted text-xs mt-1">{s.pct}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="bg-bg-secondary border border-border rounded-2xl p-6 cursor-pointer hover:border-accent-green/40 transition-colors" onClick={() => openModal('newReturnModal')}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-syne font-bold text-text-primary">{t('rep_new_vs_return')}</h4>
                    <p className="text-text-secondary text-sm">{t('rep_loyalty_level')}</p>
                  </div>
                </div>
                {(() => {
                  const total = (salesData.newCount + salesData.returnCount) || 1
                  const newPct = Math.round(salesData.newCount / total * 100)
                  const retPct = 100 - newPct
                  return (
                    <>
                      <div className="flex items-center justify-between mb-3 mt-2">
                        <div className="text-center">
                          <p className="text-text-secondary text-sm font-medium mb-1">{t('rep_new_label')}</p>
                          <p className="text-2xl font-syne font-bold text-accent-blue">{salesData.newCount}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-text-secondary text-sm font-medium mb-1">{t('rep_return_label')}</p>
                          <p className="text-2xl font-syne font-bold text-accent-green">{salesData.returnCount}</p>
                        </div>
                      </div>
                      <div className="w-full rounded-full h-3 mb-1 overflow-hidden flex" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <div className="h-3 transition-all" style={{ width: `${newPct}%`, backgroundColor: C.blue }} />
                        <div className="h-3 transition-all" style={{ width: `${retPct}%`, backgroundColor: C.green }} />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[11px] font-bold" style={{ color: C.blue }}>{newPct}% {t('rep_new_label')}</span>
                        <span className="text-[11px] font-bold" style={{ color: C.green }}>{retPct}% {t('rep_return_label')}</span>
                      </div>
                    </>
                  )
                })()}
              </div>

              <div className="bg-bg-secondary border border-border rounded-2xl p-6 cursor-pointer hover:border-accent-purple/40 transition-colors" onClick={() => openModal('hourModal')}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-syne font-bold text-text-primary">{t('rep_hour_analysis')}</h4>
                    <p className="text-text-secondary text-sm">{t('rep_time_sub')}</p>
                  </div>
                </div>
                <div className="h-[120px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesData.chartHours}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="slot" fontSize={10} stroke="var(--text-muted)" />
                      <YAxis hide />
                      <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', borderRadius: '12px', color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)', fontSize: '12px' }} offset={10} isAnimationActive={false} wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }} />
                      <Bar dataKey="count" fill={C.purple} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-accent-blue" />
                    <h4 className="font-syne font-bold text-text-primary">{t('rep_sources_title')}</h4>
                  </div>
                  <DetailButton onClick={() => openModal('sourceModal')} />
                </div>
                <div className="divide-y divide-border/50">
                  {salesData.chartSources.sort((a,b)=>b.count-a.count).map((s, i) => (
                    <div key={s.name} className="px-6 py-3 flex items-center justify-between hover:bg-bg-tertiary transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-bg-tertiary text-text-secondary">{i+1}</span>
                        <span className="text-text-primary text-sm font-medium">{s.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-text-primary">{s.count} {t('unit_pcs')}</div>
                        <div className="text-xs text-text-muted">{fmtUZS(s.revenue)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserX size={18} className="text-accent-red" />
                    <h4 className="font-syne font-bold text-text-primary">{t('rep_cancel_reasons_title')}</h4>
                  </div>
                  <DetailButton onClick={() => openModal('cancelModal')} />
                </div>
                {salesData.chartCancelReasons.length === 0 ? (
                  <div className="p-6 text-center text-text-muted text-sm">{t('rep_no_cancelled_sales')}</div>
                ) : (
                  <>
                    <div className="px-6 py-2.5 bg-bg-tertiary/60 border-b border-border flex items-center justify-between">
                      <span className="text-text-muted text-xs">{t('rep_cancel_total')}</span>
                      <span className="font-bold text-accent-red text-sm">{salesData.chartCancelReasons.reduce((s,r)=>s+r.count,0)} {t('unit_pcs')}</span>
                    </div>
                    <div className="divide-y divide-border/50">
                      {salesData.chartCancelReasons.sort((a,b)=>b.count-a.count).map((r) => {
                        const total = salesData.chartCancelReasons.reduce((s,x)=>s+x.count,0) || 1
                        const pct = Math.round(r.count/total*100)
                        return (
                          <div key={r.name} className="px-6 py-3 hover:bg-bg-tertiary transition-colors">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-text-primary text-sm font-medium">{r.name}</span>
                              <span className="font-bold text-accent-red text-sm">{r.count} {t('unit_pcs')} <span className="text-text-muted text-xs font-normal">({pct}%)</span></span>
                            </div>
                            <div className="w-full bg-bg-tertiary rounded-full h-1.5">
                              <div className="h-1.5 rounded-full bg-accent-red" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden mt-6">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h4 className="font-syne font-bold text-text-primary">{t('rep_top_sales')}</h4>
                <span className="text-xs text-text-muted">
                  {salesData.filtered.length} {t('unit_pcs')} ({salesData.salesCount} {t('rep_stat_done')}, {salesData.cancelledCount} {t('rep_stat_cancelled')}, {salesData.exchangedCount} {t('rep_stat_exchanged')})
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-bg-tertiary border-b border-border">
                      <th className="text-left px-6 py-3 font-medium text-text-secondary">#</th>
                      <th className="text-left px-6 py-3 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('sales', 'soldAt')}>
                        {t('col_date')} <SortIcon table="sales" col="soldAt" />
                      </th>
                      <th className="text-left px-6 py-3 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('sales', 'customerName')}>
                        {t('col_customer')} <SortIcon table="sales" col="customerName" />
                      </th>
                      <th className="text-left px-6 py-3 font-medium text-text-secondary">{t('col_source')}</th>
                      <th className="text-left px-6 py-3 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('sales', 'total')}>
                        {t('col_product')} <SortIcon table="sales" col="total" />
                      </th>
                      <th className="text-right px-6 py-3 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('sales', 'total')}>
                        {t('col_amount')} <SortIcon table="sales" col="total" />
                      </th>
                      <th className="text-center px-6 py-3 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('sales', 'discount')}>
                        {t('col_discount')} <SortIcon table="sales" col="discount" />
                      </th>
                      <th className="text-center px-6 py-3 font-medium text-text-secondary">{t('rep_col_payment')}</th>
                      <th className="text-left px-6 py-3 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('sales', 'soldByName')}>
                        {t('role_seller')} <SortIcon table="sales" col="soldByName" />
                      </th>
                      <th className="text-right px-6 py-3 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('sales', 'status')}>
                        {t('col_status')} <SortIcon table="sales" col="status" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {sortedData(
                      sortConfig.table === 'sales' && sortConfig.key
                        ? salesData.filtered
                        : [...salesData.filtered].sort((a,b) => b.total - a.total),
                      'sales'
                    )
                      .slice((salesTablePage - 1) * SALES_PAGE_SIZE, salesTablePage * SALES_PAGE_SIZE)
                      .map((s, idx) => (
                        <tr key={s.id} className="hover:bg-bg-tertiary transition-colors">
                          <td className="px-6 py-4 text-text-muted">{(salesTablePage - 1) * SALES_PAGE_SIZE + idx + 1}</td>
                          <td className="px-6 py-4 text-text-primary whitespace-nowrap text-sm">{s.soldAt ? fmtSoldAt(s.soldAt) : '—'}</td>
                          <td className="px-6 py-4 font-medium text-text-primary">
                            {s.customerName}
                            {s.isNewCustomer && <span className="ml-2 px-1.5 py-0.5 rounded bg-accent-blue/10 text-accent-blue text-[9px] font-bold uppercase tracking-wider">{t('rep_new_badge')}</span>}
                          </td>
                          <td className="px-6 py-4 text-text-secondary text-xs">{getSourceLabel(s.source)}</td>
                          <td className="px-6 py-4 font-medium text-text-primary text-sm">{fmtItems(s.items)}</td>
                          <td className="px-6 py-4 text-right font-bold text-text-primary">{fmtNum(s.total)}</td>
                          <td className="px-6 py-4 text-center text-text-muted">
                            {s.discount > 0 ? <span className="text-accent-orange font-bold">{s.discount}%</span> : '—'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex px-2 py-0.5 rounded-lg bg-bg-tertiary border border-border text-[10px] font-bold uppercase text-text-secondary">
                              {{ cash: t('pay_cash'), card: t('pay_card'), installment: t('pay_installment'), transfer: t('rep_pay_bank') }[s.paymentType] || s.paymentType}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-text-secondary">{s.soldByName}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              s.status !== 'cancelled' ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'
                            }`}>
                              {s.status !== 'cancelled' ? t('rep_completed') : t('rep_cancelled')}
                            </span>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
              <Pagination
                total={salesData.filtered.length}
                pageSize={SALES_PAGE_SIZE}
                page={salesTablePage}
                onPageChange={setSalesTablePage}
              />
            </div>
      {modal === 'salesTotalModal' && (() => {
        const monthlyData = getMonthlySalesChart()
        const filtered = (modalFilter === 'all'
          ? MOCK_SALES.filter(s => s.status !== 'cancelled')
          : MOCK_SALES.filter(s => s.status !== 'cancelled' && s.soldAt && s.soldAt.startsWith(modalFilter))
        ).sort((a,b) => b.total - a.total)

        return (
          <Modal open title={t('rep_sales_modal_title')} subtitle={t('rep_sales_modal_sub')} size="xl" onClose={closeModal}>
            {/* Filtr */}
            <div className="flex items-center justify-between mb-5">
              <MonthYearFilter value={modalFilter} onChange={setModalFilter} />
              <span className="text-text-muted text-xs">{filtered.length} {t('unit_pcs')} {t('rep_monthly_sales_suffix')}</span>
            </div>

            {/* Oylik dinamika */}
            <div className="mb-6">
              <p className="text-text-secondary text-sm font-medium mb-3">{t('rep_monthly_dynamics')}</p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {monthlyData.map(m => (
                  <div key={m.month} className="bg-bg-tertiary rounded-xl p-4">
                    <p className="text-text-muted text-xs mb-1">{m.name}</p>
                    <p className="font-syne font-bold text-text-primary text-lg">{fmtUZS(m.total)}</p>
                    <div className="mt-1">
                      {m.growthTotal !== null
                        ? <GrowthBadge current={m.total} previous={m.total / (1 + m.growthTotal / 100)} />
                        : <span className="text-text-muted text-xs">{t('rep_first_month')}</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
              <MonthlyDynamicsChart
                data={monthlyData}
                dataKey="total"
                color={C.red}
                formatter={(v) => fmtUZS(v)}
                name={t('rep_chart_sales')}
              />
            </div>

            {/* Jadval */}
            <p className="text-text-secondary text-sm font-medium mb-3">{t('rep_sales_list')}</p>
            <ModalTable
              data={filtered}
              pageSize={10}
              columns={[
                { key:'soldAt',       label:t('col_date'),      render: r => <span className="whitespace-nowrap text-xs">{fmtSoldAt(r.soldAt)}</span> },
                { key:'items',        label:t('col_product'),      render: r => <span className="text-xs text-text-secondary">{fmtItems(r.items)}</span> },
                { key:'customerName', label:t('col_customer'),      render: r => (
                  <span className="font-medium text-text-primary text-xs">
                    {r.customerName}
                    {r.isNewCustomer && <span className="ml-1 px-1 py-0.5 rounded bg-accent-blue/10 text-accent-blue text-[9px] font-bold">{t('rep_new_badge', 'YANGI')}</span>}
                  </span>
                )},
                { key:'soldByName',   label:t('col_employee'),      render: r => <span className="text-xs text-text-secondary">{r.soldByName || '—'}</span> },
                { key:'qty',          label:t('rep_col_qty'), align:'center', render: r => <span className="font-bold">{r.items?.reduce((s,i)=>s+(i.qty||1),0) || 1}</span> },
                { key:'discount',     label:t('col_discount'), align:'center', render: r => r.discount > 0
                  ? <span className="text-accent-orange font-bold text-xs">-{r.discount}%</span>
                  : <span className="text-text-muted">—</span>
                },
                { key:'total',        label:t('col_amount'), align:'right', render: r => <span className="font-bold text-text-primary">{fmtUZS(r.total)}</span> },
              ]}
            />
          </Modal>
        )
      })()}

      {/* === MODAL: Jami foyda === */}
      {modal === 'salsProfitModal' && (() => {
        const monthlyData = getMonthlySalesChart()
        const effectiveFilter = modalFilter !== 'all' ? modalFilter : (period !== 'all' ? period : null)
        const filtered = (effectiveFilter
          ? MOCK_SALES.filter(s => s.status !== 'cancelled' && s.soldAt && s.soldAt.startsWith(effectiveFilter))
          : MOCK_SALES.filter(s => s.status !== 'cancelled')
        ).sort((a,b) => (b.soldAt||'').localeCompare(a.soldAt||''))

        return (
          <Modal open title={t('rep_modal_profit_title')} subtitle={t('rep_modal_profit_sub')} size="3xl" onClose={closeModal}>
            <div className="flex items-center justify-between mb-5">
              <MonthYearFilter value={modalFilter} onChange={setModalFilter} />
              <span className="text-text-muted text-xs">
                {t('wh_in_total')}: {fmtUZS(filtered.reduce((s,x) => s+getSaleProfit(x)-(x.paymentType==='installment'?(x.installmentCommissionAmount??0):0), 0))}
              </span>
            </div>

            {/* Oylik dinamika */}
            <div className="mb-6">
              <p className="text-text-secondary text-sm font-medium mb-3">{t('rep_monthly_profit_chart')}</p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {monthlyData.map(m => (
                  <div key={m.month} className="bg-bg-tertiary rounded-xl p-4">
                    <p className="text-text-muted text-xs mb-1">{m.name}</p>
                    <p className="font-syne font-bold text-accent-green text-lg">{fmtUZS(m.profit)}</p>
                    <div className="mt-1">
                      {m.growthProfit !== null
                        ? <GrowthBadge current={m.profit} previous={m.profit / (1 + m.growthProfit / 100)} />
                        : <span className="text-text-muted text-xs">{t('rep_first_month')}</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
              <MonthlyDynamicsChart data={monthlyData} dataKey="profit" color={C.green} formatter={v => fmtUZS(v)} name={t('rep_chart_profit')} />
            </div>

            {/* Top-5 foydali tovar */}
            <div className="mb-6">
              <p className="text-text-secondary text-sm font-medium mb-3">{t('rep_top_products')}</p>
              <div className="space-y-2">
                {(() => {
                  const prodMap = {}
                  filtered.forEach(s => {
                    s.items.forEach(item => {
                      const name = typeof item === 'object' ? (item.name || '') : item.split(' x')[0]
                      if (!prodMap[name]) prodMap[name] = { profit: 0, count: 0 }
                      prodMap[name].profit += getSaleProfit(s) / (s.items?.length || 1)
                      prodMap[name].count  += typeof item === 'object' ? (item.qty || 1) : parseInt(item.split(' x')[1] || '1')
                    })
                  })
                  return Object.entries(prodMap)
                    .sort((a, b) => b[1].profit - a[1].profit)
                    .slice(0, 5)
                    .map(([name, v], i) => (
                      <div key={name} className="flex items-center justify-between bg-bg-tertiary rounded-xl px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ backgroundColor: [C.green,C.blue,C.orange,C.purple,C.teal][i]+'22', color: [C.green,C.blue,C.orange,C.purple,C.teal][i] }}>
                            {i+1}
                          </span>
                          <span className="text-text-primary text-sm font-medium">{name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-accent-green text-sm">{fmtUZS(Math.round(v.profit))}</p>
                          <p className="text-text-muted text-xs">{v.count} {t('unit_pcs')}</p>
                        </div>
                      </div>
                    ))
                })()}
              </div>
            </div>

            {/* Jadval */}
            <p className="text-text-secondary text-sm font-medium mb-3">{t('rep_profit_list')}</p>
            <ModalTable
              data={filtered}
              pageSize={10}
              columns={[
                { key:'soldAt',       label:t('col_date'),           render: r => <span className="whitespace-nowrap text-xs">{fmtSoldAt(r.soldAt)}</span> },
                { key:'items',        label:t('col_product'),        render: r => <span className="text-xs text-text-secondary">{fmtItems(r.items)}</span> },
                { key:'category',     label:t('col_category'),       render: r => {
                  const cat = r.items?.[0]?.productId ? (MOCK_PRODUCTS.find(p => p.id === r.items[0].productId)?.category || '—') : '—'
                  return renderCatBadge(cat)
                }},
                { key:'customerName', label:t('col_customer'),       render: r => <span className="font-medium text-text-primary text-xs">{r.customerName}</span> },
                { key:'soldByName',   label:t('col_employee'),       render: r => <span className="text-xs text-text-secondary">{r.soldByName || '—'}</span> },
                { key:'purchasePrice',label:t('rep_col_purchase_price'), align:'right', render: r => {
                  const total = r.items?.reduce((s,i) => {
                    const pp = i.purchasePrice || Math.round((i.price || i.salePrice || 0) * 0.8)
                    return s + pp * (i.qty||1)
                  }, 0) || 0
                  return <span className="text-text-secondary text-xs">{fmtUZS(total)}</span>
                }},
                { key:'total',        label:t('rep_col_sale_price'),     align:'right', render: r => <span className="text-text-primary text-xs">{fmtUZS(r.total)}</span> },
                { key:'qty',          label:t('rep_col_qty'),            align:'center', render: r => <span className="font-bold">{r.items?.reduce((s,i)=>s+(i.qty||1),0) || 1}</span> },
                { key:'profit',       label:t('rep_col_total_profit'),   align:'right', render: r => <span className="font-bold text-accent-green">{fmtUZS(getSaleProfit(r))}</span> },
              ]}
            />
          </Modal>
        )
      })()}

      {/* === MODAL: Sotuvlar soni === */}
      {modal === 'salesCountModal' && (() => {
        const monthlyData = getMonthlySalesChart()
        const tableData = modalFilter === 'all'
          ? monthlyData
          : monthlyData.filter(m => m.month === modalFilter)
        return (
          <Modal open title={t('rep_modal_count_title')} subtitle={t('rep_modal_count_sub')} size="lg" onClose={closeModal}>
            <div className="flex items-center justify-between mb-5">
              <MonthYearFilter value={modalFilter} onChange={setModalFilter} />
              <span className="text-text-muted text-xs">{monthlyData.reduce((s,m)=>s+m.count,0)} {t('unit_pcs')} {t('rep_total_count_suffix')}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {monthlyData.map(m => (
                <div key={m.month} className="bg-bg-tertiary rounded-xl p-4 text-center">
                  <p className="text-text-muted text-xs mb-1">{m.name}</p>
                  <p className="font-syne font-bold text-text-primary text-3xl">{m.count}</p>
                  <p className="text-text-muted text-xs mb-1">{t('rep_monthly_sales_suffix')}</p>
                  <div className="mt-2">
                    {m.growthCount !== null
                      ? <GrowthBadge current={m.count} previous={m.count / (1 + m.growthCount / 100)} />
                      : <span className="text-text-muted text-xs">{t('rep_first_month')}</span>
                    }
                  </div>
                </div>
              ))}
            </div>
            <MonthlyDynamicsChart data={monthlyData} dataKey="count" color={C.purple} formatter={v => `${v} ${t('unit_pcs')}`} name={t('rep_chart_count')} />

            {/* Oylar jadval */}
            <div className="mt-6">
              <ModalTable
                data={[...monthlyData].reverse()}
                initialSortKey="month"
                initialSortDir="desc"
                columns={[
                  { key: 'name', label: t('rep_col_month') },
                  { key: 'count', label: t('perm_sales'), align: 'center', render: r => <span className="font-bold text-text-primary">{r.count} {t('unit_pcs')}</span> },
                  { key: 'growthCount', label: t('rep_col_growth'), align: 'center', render: r => r.growthCount !== null
                    ? <GrowthBadge current={r.count} previous={r.count / (1 + r.growthCount / 100)} />
                    : <span className="text-text-muted text-xs">—</span>
                  },
                  { key: 'total', label: t('col_amount'), align: 'right', render: r => fmtUZS(r.total) },
                ]}
              />
            </div>
          </Modal>
        )
      })()}

      {/* === MODAL: Oylik maqsad === */}
      {modal === 'salesTargetModal' && (() => {
        const monthlyData = [...getMonthlySalesChart()].reverse()
        return (
          <Modal open title={t('rep_modal_target_title')} subtitle={t('rep_modal_target_sub')} size="lg" onClose={closeModal}>
            <div className="space-y-3 mb-6 overflow-y-auto max-h-[280px] pr-1">
              {monthlyData.map(m => (
                <div key={m.month} className="bg-bg-tertiary rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-syne font-bold text-text-primary">{m.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-text-muted text-xs">{t('rep_target_label')}: {fmtUZS(m.target)}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.targetPct !== null && m.targetPct >= 100 ? 'bg-accent-green/10 text-accent-green'
                        : m.targetPct !== null && m.targetPct >= 70  ? 'bg-accent-orange/10 text-accent-orange'
                        : 'bg-accent-red/10 text-accent-red'
                      }`}>
                        {m.targetPct !== null ? `${m.targetPct}%` : t('rep_no_target')}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-bg-secondary rounded-full h-2.5 mb-2">
                    <div className="h-2.5 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, m.targetPct || 0)}%`,
                        backgroundColor: (m.targetPct || 0) >= 100 ? C.green : (m.targetPct || 0) >= 70 ? C.orange : C.red
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text-primary">{fmtUZS(m.total)}</span>
                    {m.target > 0 && m.total < m.target && (
                      <span className="text-accent-red text-xs font-bold">
                        -{fmtUZS(m.target - m.total)} {t('rep_shortfall')}
                      </span>
                    )}
                    {m.target > 0 && m.total >= m.target && (
                      <span className="text-accent-green text-xs font-bold">
                        +{fmtUZS(m.total - m.target)} {t('rep_surplus')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Jadval */}
            <ModalTable
              data={monthlyData}
              initialSortKey="month"
              initialSortDir="desc"
              columns={[
                { key: 'name', label: t('rep_col_month') },
                { key: 'target', label: t('rep_target_label'), align: 'right', render: r => r.target ? fmtUZS(r.target) : '—' },
                { key: 'total', label: t('col_done'), align: 'right', render: r => <span className="font-bold text-text-primary">{fmtUZS(r.total)}</span> },
                { key: 'targetPct', label: '%', align: 'center', render: r => (
                  <span className={`font-bold text-sm ${(r.targetPct||0) >= 100 ? 'text-accent-green' : (r.targetPct||0) >= 70 ? 'text-accent-orange' : 'text-accent-red'}`}>
                    {r.targetPct !== null ? `${r.targetPct}%` : '—'}
                  </span>
                )},
                { key: 'diff', label: t('rep_col_diff'), align: 'right', sortable: false, render: r => r.target > 0
                  ? <span className={`font-bold text-sm ${r.total >= r.target ? 'text-accent-green' : 'text-accent-red'}`}>{r.total >= r.target ? '+' : ''}{fmtUZS(r.total - r.target)}</span>
                  : '—'
                },
              ]}
            />
          </Modal>
        )
      })()}

      {/* === MODAL: Muddatli to'lov === */}
      {modal === 'installmentModal' && (() => {
        const monthlyData = getMonthlySalesChart()
        // financeStats.installmentSales - instStatusMap dan hisoblangan (Sales.jsx bilan mos)
        const allInstallments = financeStats.installmentSales
        const filtered = modalFilter === 'all'
          ? allInstallments
          : allInstallments.filter(s => s.soldAt && s.soldAt.startsWith(modalFilter))

        return (
          <Modal open title={t('rep_modal_installment_title')} subtitle={t('rep_modal_installment_sub')} size="2xl" onClose={closeModal}>
            <div className="flex items-center justify-between mb-5">
              <MonthYearFilter value={modalFilter} onChange={setModalFilter} />
              <div className="flex items-center gap-4 text-sm">
                <span className="text-text-muted">{t('inc_stat_debt')}: <span className="font-bold text-accent-orange">{fmtUZS(filtered.reduce((s,x) => s+x.installmentDebt, 0))}</span></span>
                <span className="text-text-muted">{t('rep_paid_amount')}: <span className="font-bold text-accent-green">{fmtUZS(filtered.reduce((s,x) => s+(x.installmentPaidAmount||0), 0))}</span></span>
              </div>
            </div>

            {/* Oylik dinamika */}
            <div className="mb-6">
              <p className="text-text-secondary text-sm font-medium mb-3">{t('rep_monthly_installment_chart')}</p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {monthlyData.map(m => (
                  <div key={m.month} className="bg-bg-tertiary rounded-xl p-4">
                    <p className="text-text-muted text-xs mb-1">{m.name}</p>
                    <p className="font-syne font-bold text-accent-orange text-lg">{fmtUZS(m.installmentTotal)}</p>
                    <p className="text-text-muted text-xs mt-1">
                      {MOCK_SALES.filter(s => s.soldAt && s.soldAt.startsWith(m.month) && s.paymentType === 'installment' && s.status !== 'cancelled').length} {t('unit_pcs')} {t('rep_monthly_sales_suffix')}
                    </p>
                  </div>
                ))}
              </div>
              <MonthlyDynamicsChart data={monthlyData} dataKey="installmentTotal" color={C.orange} formatter={v => fmtUZS(v)} name={t('rep_chart_installment')} />
            </div>

            {/* Jadval */}
            <p className="text-text-secondary text-sm font-medium mb-3">{t('rep_installment_list')}</p>
            <ModalTable
              data={filtered}
              pageSize={10}
              columns={[
                { key:'soldAt',       label:t('col_date'),          render: r => <span className="whitespace-nowrap text-xs">{fmtSoldAt(r.soldAt)}</span> },
                { key:'items',        label:t('col_product'),        render: r => <span className="text-xs text-text-secondary">{fmtItems(r.items)}</span> },
                { key:'customerName', label:t('col_customer'),       render: r => <span className="font-medium text-text-primary text-xs">{r.customerName}</span> },
                { key:'soldByName',   label:t('col_employee'),       render: r => <span className="text-xs text-text-secondary">{r.soldByName || '—'}</span> },
                { key:'total',        label:t('col_amount'),         align:'right', render: r => <span className="font-bold text-text-primary">{fmtUZS(r.total)}</span> },
                { key:'org',          label:t('rep_col_installment_total'), render: r => <span className="text-xs text-text-secondary">{r.installmentOrgName || '—'}</span> },
                { key:'term',         label:t('rep_col_month'),          align:'center', render: r => <span className="text-xs">{r.installmentTermMonths ? `${r.installmentTermMonths} ${t('rep_col_month')}` : '—'}</span> },
                { key:'debt',         label:t('col_debt'),           align:'right', render: r => <span className="text-accent-orange font-bold text-xs">{fmtUZS(r.installmentDebt || 0)}</span> },
                { key:'dueDate',      label:t('rep_col_pay_date'),       align:'center', render: r => (
                  <span className={`text-xs ${r.installmentDueDate && r.installmentDueDate < TODAY ? 'text-accent-red font-bold' : 'text-text-secondary'}`}>
                    {r.installmentDueDate || '—'}
                  </span>
                )},
              ]}
            />
          </Modal>
        )
      })()}
      {/* === MODAL: Kunlik sotuv tarixi === */}
      {modal === 'dailyChartModal' && (() => {
        const monthsSet = new Set()
        const currentMonth = new Date().toISOString().slice(0, 7)
        monthsSet.add(currentMonth)
        MOCK_SALES.forEach(s => { if (s.soldAt) monthsSet.add(s.soldAt.slice(0, 7)) })
        const mNamesArr = t('exp_month_names', { returnObjects: true })
        const allMonths = Array.from(monthsSet).sort().reverse()
        const monthNames = {}
        allMonths.forEach(m => {
          const [y, mo] = m.split('-')
          monthNames[m] = `${mNamesArr[parseInt(mo) - 1] || mo} ${y}`
        })
        const displayedMonths = modalFilter === 'all'
          ? allMonths
          : allMonths.filter(m => m === modalFilter)
        return (
          <Modal open title={t('rep_modal_daily_title')} subtitle={t('rep_modal_daily_sub')} size="xl" onClose={closeModal}>
            <div className="flex justify-end mb-4">
              <div className="relative inline-block">
                <select
                  value={modalFilter}
                  onChange={e => setModalFilter(e.target.value)}
                  className="appearance-none bg-bg-tertiary border border-border rounded-xl pl-3 pr-8 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-red transition-all cursor-pointer"
                >
                  <option value="all">{t('filter_all')}</option>
                  {allMonths.map(m => (
                    <option key={m} value={m}>{monthNames[m]}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
              </div>
            </div>
            <div className="space-y-8">
              {displayedMonths.map(m => {
                const daysInMonth = new Date(parseInt(m.split('-')[0]), parseInt(m.split('-')[1]), 0).getDate()
                const dailyMap = {}
                for (let d = 1; d <= daysInMonth; d++) {
                  const key = `${m}-${String(d).padStart(2,'0')}`
                  dailyMap[key] = 0
                }
                MOCK_SALES.filter(s => s.status !== 'cancelled' && s.soldAt && s.soldAt.startsWith(m))
                  .forEach(s => { if (!s.soldAt) return; const date = s.soldAt.slice(0,10); dailyMap[date] = (dailyMap[date]||0) + s.total })
                const chartData = Object.entries(dailyMap).map(([date,total]) => ({ date, total, day: parseInt(date.split('-')[2]) }))
                const monthTotal = chartData.reduce((s,x) => s+x.total, 0)
                const activeDays = chartData.filter(x => x.total > 0).length
                return (
                  <div key={m}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-syne font-bold text-text-primary">{monthNames[m]}</h4>
                      <div className="flex items-center gap-4 text-xs text-text-muted">
                        <span>{t('wh_in_total')}: <span className="font-bold text-text-primary">{fmtUZS(monthTotal)}</span></span>
                        <span>{t('rep_active_days')}: <span className="font-bold text-text-primary">{activeDays}</span></span>
                      </div>
                    </div>
                    <div className="h-[140px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                          <XAxis dataKey="day" fontSize={9} stroke="var(--text-muted)" interval={2} />
                          <YAxis hide />
                          <Tooltip
                            cursor={{ fill:'rgba(255,255,255,0.04)' }}
                            contentStyle={{ backgroundColor:'var(--bg-secondary)', borderColor:'var(--border)', borderRadius:'12px', color:'var(--text-primary)' }}
                            itemStyle={{ color:'var(--text-primary)', fontSize:'12px' }}
                            formatter={v => fmtUZS(v)}
                            labelFormatter={d => `${d}${t('rep_day_suffix')}`}
                            offset={10}
                            isAnimationActive={false}
                            wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }} />
                          <Bar dataKey="total" fill={C.red} radius={[3,3,0,0]} name={t('rep_chart_sales')} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )
              })}
            </div>
          </Modal>
        )
      })()}

      {/* === MODAL: To'lov turlari tarixi === */}
      {modal === 'payTypeModal' && (() => {
        const monthsSet = new Set()
        const currentMonth = new Date().toISOString().slice(0, 7)
        monthsSet.add(currentMonth)
        MOCK_SALES.forEach(s => { if (s.soldAt) monthsSet.add(s.soldAt.slice(0, 7)) })
        const monthNamesArr = t('exp_month_names', { returnObjects: true })
        const allMonths = Array.from(monthsSet).sort().reverse()
        const monthNames = {}
        allMonths.forEach(m => {
          const [y, mo] = m.split('-')
          monthNames[m] = `${monthNamesArr[parseInt(mo) - 1] || mo} ${y}`
        })
        const months = modalFilter === 'all' ? allMonths : allMonths.filter(m => m === modalFilter)
        const payLabels = { cash: t('pay_cash'), card: t('pay_card'), installment: t('pay_installment') }
        const payColors = { cash: C.green, card: C.blue, installment: C.orange }

        const tableData = months.map(m => {
          const sales = MOCK_SALES.filter(s => s.status !== 'cancelled' && s.soldAt && s.soldAt.startsWith(m))
          const cash        = sales.filter(s => s.paymentType === 'cash').length
          const card        = sales.filter(s => s.paymentType === 'card').length
          const installment = sales.filter(s => s.paymentType === 'installment').length
          const transfer    = sales.filter(s => s.paymentType === 'transfer').length
          const total = sales.length || 1
          return { month: monthNames[m], rawMonth: m, cash, card, installment, transfer, total: sales.length,
            cashPct: Math.round(cash/total*100), cardPct: Math.round(card/total*100),
            instPct: Math.round(installment/total*100), transferPct: Math.round(transfer/total*100) }
        })

        return (
          <Modal open title={t('rep_modal_paytype_title')} subtitle={t('rep_modal_paytype_sub')} size="lg" onClose={closeModal}>
            <div className="flex justify-end mb-4">
              <div className="relative inline-block">
                <select
                  value={modalFilter}
                  onChange={e => setModalFilter(e.target.value)}
                  className="appearance-none bg-bg-tertiary border border-border rounded-xl pl-3 pr-8 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-red transition-all cursor-pointer"
                >
                  <option value="all">{t('filter_all')}</option>
                  {allMonths.map(m => (
                    <option key={m} value={m}>{monthNames[m]}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
              </div>
            </div>
            <div className="rounded-xl border border-border overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bg-tertiary border-b border-border">
                    <th className="text-left px-4 py-3 font-medium text-text-secondary flex items-center gap-2">{t('rep_col_month')} <MonthSortBtn /></th>
                    <th className="text-center px-4 py-3 font-medium text-text-secondary">{t('wh_in_total')}</th>
                    <th className="text-center px-4 py-3 font-medium" style={{ color: C.green }}>{t('pay_cash')}</th>
                    <th className="text-center px-4 py-3 font-medium" style={{ color: C.blue }}>{t('pay_card')}</th>
                    <th className="text-center px-4 py-3 font-medium" style={{ color: C.orange }}>{t('pay_installment')}</th>
                    <th className="text-center px-4 py-3 font-medium" style={{ color: C.purple }}>{t('rep_pay_bank')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {(msd==='desc'?[...tableData].sort((a,b)=>b.rawMonth?.localeCompare(a.rawMonth||'')||0):[...tableData].sort((a,b)=>a.rawMonth?.localeCompare(b.rawMonth||'')||0)).map(row => (
                    <tr key={row.month} className="hover:bg-bg-tertiary transition-colors">
                      <td className="px-4 py-3 font-medium text-text-primary">{row.month}</td>
                      <td className="px-4 py-3 text-center font-bold text-text-primary">{row.total} {t('unit_pcs')}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold" style={{ color: C.green }}>{row.cash} {t('unit_pcs')}</span>
                        <span className="text-text-muted text-xs ml-1">({row.cashPct}%)</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold" style={{ color: C.blue }}>{row.card} {t('unit_pcs')}</span>
                        <span className="text-text-muted text-xs ml-1">({row.cardPct}%)</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold" style={{ color: C.orange }}>{row.installment} {t('unit_pcs')}</span>
                        <span className="text-text-muted text-xs ml-1">({row.instPct}%)</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold" style={{ color: C.purple }}>{row.transfer} {t('unit_pcs')}</span>
                        <span className="text-text-muted text-xs ml-1">({row.transferPct}%)</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vizual taqsimot */}
            <p className="text-text-secondary text-sm font-medium mb-3">{t('rep_pay_types')}</p>
            <div className="space-y-4">
              {tableData.map(row => (
                <div key={row.month}>
                  <p className="text-text-muted text-xs mb-1">{row.month}</p>
                  <div className="flex rounded-full overflow-hidden h-6">
                    {row.cash > 0 && <div style={{ width:`${row.cashPct}%`, backgroundColor: C.green }} className="flex items-center justify-center text-white text-[10px] font-bold">{row.cashPct}%</div>}
                    {row.card > 0 && <div style={{ width:`${row.cardPct}%`, backgroundColor: C.blue }} className="flex items-center justify-center text-white text-[10px] font-bold">{row.cardPct}%</div>}
                    {row.installment > 0 && <div style={{ width:`${row.instPct}%`, backgroundColor: C.orange }} className="flex items-center justify-center text-white text-[10px] font-bold">{row.instPct}%</div>}
                    {row.transfer > 0 && <div style={{ width:`${row.transferPct}%`, backgroundColor: C.purple }} className="flex items-center justify-center text-white text-[10px] font-bold">{row.transferPct}%</div>}
                  </div>
                </div>
              ))}
            </div>
          </Modal>
        )
      })()}

      {/* === MODAL: Eng ko'p sotilgan tovarlar tarixi === */}
      {modal === 'topProductsModal' && (() => {
        const monthsSet = new Set()
        const currentMonth = new Date().toISOString().slice(0, 7)
        monthsSet.add(currentMonth)
        MOCK_SALES.forEach(s => { if (s.soldAt) monthsSet.add(s.soldAt.slice(0, 7)) })
        const allMonths = Array.from(monthsSet).sort().reverse()
        const monthNames = {}
        allMonths.forEach(m => { monthNames[m] = getMonthLabel(m) })
        const months = modalFilter === 'all' ? allMonths : allMonths.filter(m => m === modalFilter)
        const catLabels = {
          tire:      getCatLabel('tire'),
          wheel:     getCatLabel('wheel'),
          accessory: getCatLabel('accessory'),
        }
        const catColors = Object.fromEntries((storeProductCategories||[]).map(c => [c.id, getCatColorHex(c.id)]))
        const catMap = {}
        stockStats.withDaysLeft.forEach(p => {
          catMap[p.productName.split(' ')[0].toLowerCase()] = p.category
        })

        return (
          <Modal open title={t('rep_top_products_modal_title')} subtitle={t('rep_top_products_modal_sub')} size="xl" onClose={closeModal}>
            <div className="flex justify-end mb-4">
              <div className="relative inline-block">
                <select
                  value={modalFilter}
                  onChange={e => setModalFilter(e.target.value)}
                  className="appearance-none bg-bg-tertiary border border-border rounded-xl pl-3 pr-8 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-red transition-all cursor-pointer"
                >
                  <option value="all">{t('filter_all')}</option>
                  {allMonths.map(m => (
                    <option key={m} value={m}>{monthNames[m]}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
              </div>
            </div>
            <div className="space-y-8">
              {months.map(m => {
                const sales = MOCK_SALES.filter(s => s.status !== 'cancelled' && s.soldAt && s.soldAt.startsWith(m))
                const prodMap = {}
                const catCount = { tire:0, wheel:0, accessory:0 }
                sales.forEach(s => {
                  s.items.forEach(item => {
                    const name = typeof item === 'object' ? (item.name || '') : item.split(' x')[0]
                    const qty  = typeof item === 'object' ? (item.qty || 1) : parseInt(item.split(' x')[1] || '1')
                    prodMap[name] = (prodMap[name] || 0) + qty
                    const cat = catMap[name.split(' ')[0].toLowerCase()] || 'tire'
                    catCount[cat] = (catCount[cat] || 0) + qty
                  })
                })
                const topProds = Object.entries(prodMap).sort((a,b) => b[1]-a[1]).slice(0, 5)
                const totalQty = Object.values(prodMap).reduce((s,x) => s+x, 0) || 1

                return (
                  <div key={m}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-syne font-bold text-text-primary">{monthNames[m]}</h4>
                      <div className="flex items-center gap-2">
                        {Object.entries(catCount).map(([cat, count]) => count > 0 && (
                          <span key={cat} className="px-2 py-0.5 rounded text-[10px] font-bold"
                            style={{ backgroundColor: catColors[cat]+'22', color: catColors[cat] }}>
                            {catLabels[cat]}: {count} {t('unit_pcs')}
                          </span>
                        ))}
                      </div>
                    </div>
                    {topProds.length === 0
                      ? <p className="text-text-muted text-sm py-4 text-center">{t('rep_no_data')}</p>
                      : <div className="space-y-2">
                          {topProds.map(([name, count], i) => {
                            const cat = catMap[name.split(' ')[0].toLowerCase()] || 'tire'
                            const pct = Math.round(count / totalQty * 100)
                            return (
                              <div key={name} className="flex items-center gap-3 bg-bg-tertiary rounded-xl px-4 py-3">
                                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                  style={{ backgroundColor: [C.red,C.orange,C.blue,C.green,C.purple][i]+'22', color: [C.red,C.orange,C.blue,C.green,C.purple][i] }}>
                                  {i+1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-text-primary text-sm font-medium truncate">{name}</span>
                                    <span className="font-bold text-text-primary ml-2 flex-shrink-0">{count} {t('unit_pcs')}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-bg-secondary rounded-full h-1.5">
                                      <div className="h-1.5 rounded-full" style={{ width:`${pct}%`, backgroundColor: catColors[cat] }} />
                                    </div>
                                    <span className="text-text-muted text-xs w-8 text-right">{pct}%</span>
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                                      style={{ backgroundColor: catColors[cat]+'22', color: catColors[cat] }}>
                                      {catLabels[cat]}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                    }
                  </div>
                )
              })}
            </div>
          </Modal>
        )
      })()}

      {/* === MODAL: Mavsumiy tahlil === */}
      {/* === MODAL: Mavsumiy tahlil === */}
      {modal === 'seasonalModal' && (() => {
        const availableYears = ['2026', '2025']
        const seasons = [
          { key:'winter', label:t('season_winter'),   months:[`${seasonYear}-12`,`${seasonYear}-01`,`${seasonYear}-02`], color: C.blue },
          { key:'spring', label:t('season_spring'),  months:[`${seasonYear}-03`,`${seasonYear}-04`,`${seasonYear}-05`], color: C.green },
          { key:'summer', label:t('season_summer'),    months:[`${seasonYear}-06`,`${seasonYear}-07`,`${seasonYear}-08`], color: C.orange },
          { key:'autumn', label:t('season_autumn'),    months:[`${seasonYear}-09`,`${seasonYear}-10`,`${seasonYear}-11`], color: C.red },
        ]
        const catLabels = { tire: getCatLabelPlural('tire'), wheel: getCatLabelPlural('wheel'), accessory: getCatLabelPlural('accessory') }
        const catColors = Object.fromEntries((storeProductCategories||[]).map(c => [c.id, getCatColorHex(c.id)]))
        const catMap = {}
        stockStats.withDaysLeft.forEach(p => { catMap[p.productName.split(' ')[0].toLowerCase()] = p.category })

        return (
          <Modal open title={t('rep_seasonal_modal_title')} subtitle={t('rep_seasonal_modal_sub')} size="lg" onClose={closeModal}>
            <div className="flex items-center justify-between mb-5">
              <p className="text-text-secondary text-sm font-medium">{t('rep_seasonal_by_year')}</p>
              <select
                value={seasonYear}
                onChange={e => setSeasonYear(e.target.value)}
                className="appearance-none bg-bg-tertiary border border-border rounded-xl pl-3 pr-8 py-1.5 text-xs text-text-primary focus:outline-none cursor-pointer"
              >
                {availableYears.map(y => <option key={y} value={y}>{t('rep_year_suffix', { year: y })}</option>)}
              </select>
            </div>
            <div className="space-y-6">
              {seasons.map(season => {
                const sales = MOCK_SALES.filter(s => s.status !== 'cancelled' && season.months.some(m => s.soldAt && s.soldAt.startsWith(m)))
                const catCount = { tire:0, wheel:0, accessory:0 }
                let totalQty = 0
                sales.forEach(s => {
                  s.items.forEach(item => {
                    const name = typeof item === 'object' ? (item.name || '') : item.split(' x')[0]
                    const qty  = typeof item === 'object' ? (item.qty || 1) : parseInt(item.split(' x')[1] || '1')
                    const cat  = catMap[name.split(' ')[0].toLowerCase()] || 'tire'
                    catCount[cat] = (catCount[cat] || 0) + qty
                    totalQty += qty
                  })
                })
                return (
                  <div key={season.key} className="bg-bg-tertiary rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-syne font-bold text-text-primary">{season.label}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-text-muted text-xs">{t('wh_in_total')}: <span className="font-bold text-text-primary">{totalQty} {t('unit_pcs')}</span></span>
                        <span className="text-text-muted text-xs">{sales.length} {t('rep_monthly_sales_suffix')}</span>
                      </div>
                    </div>
                    {totalQty === 0
                      ? <p className="text-text-muted text-sm text-center py-2">{t('rep_no_data')}</p>
                      : <div className="space-y-3">
                          {Object.entries(catCount).map(([cat, count]) => {
                            const pct = Math.round(count / totalQty * 100)
                            return (
                              <div key={cat}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-text-secondary text-sm">{catLabels[cat]}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-text-primary">{count} {t('unit_pcs')}</span>
                                    <span className="text-text-muted text-xs">{pct}%</span>
                                  </div>
                                </div>
                                <div className="w-full bg-bg-secondary rounded-full h-2">
                                  <div className="h-2 rounded-full transition-all"
                                    style={{ width:`${pct}%`, backgroundColor: catColors[cat] }} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                    }
                  </div>
                )
              })}
            </div>
          </Modal>
        )
      })()}

      {/* === MODAL: Yangi vs Qaytuvchi === */}
      {modal === 'newReturnModal' && (() => {
        const monthsSet = new Set()
        const currentMonth = new Date().toISOString().slice(0, 7)
        monthsSet.add(currentMonth)
        MOCK_SALES.forEach(s => { if (s.soldAt) monthsSet.add(s.soldAt.slice(0, 7)) })
        const allMonths = Array.from(monthsSet).sort().reverse()
        const monthNames = {}
        allMonths.forEach(m => { monthNames[m] = getMonthLabel(m) })
        const months = modalFilter === 'all' ? allMonths : allMonths.filter(m => m === modalFilter)

        const tableData = months.map(m => {
          const sales = MOCK_SALES.filter(s => s.status !== 'cancelled' && s.soldAt && s.soldAt.startsWith(m))
          const newC  = sales.filter(s => s.isNewCustomer).length
          const retC  = sales.filter(s => !s.isNewCustomer).length
          const total = newC + retC || 1
          return {
            month: monthNames[m], newCount: newC, returnCount: retC, total: newC + retC,
            retentionRate: Math.round(retC / total * 100),
            newRate: Math.round(newC / total * 100),
            newRevenue: sales.filter(s => s.isNewCustomer).reduce((s,x) => s+x.total, 0),
            retRevenue: sales.filter(s => !s.isNewCustomer).reduce((s,x) => s+x.total, 0),
          }
        })

        return (
          <Modal open title={t('rep_new_vs_return')} subtitle={t('rep_new_vs_return_sub')} size="xl" onClose={closeModal}>
            <div className="flex justify-end mb-4">
              <div className="relative inline-block">
                <select
                  value={modalFilter}
                  onChange={e => setModalFilter(e.target.value)}
                  className="appearance-none bg-bg-tertiary border border-border rounded-xl pl-3 pr-8 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-red transition-all cursor-pointer"
                >
                  <option value="all">{t('filter_all')}</option>
                  {allMonths.map(m => (
                    <option key={m} value={m}>{monthNames[m]}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
              </div>
            </div>

            {/* Oylik kartochkalar */}
            <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-thin">
              {tableData.map(row => {
                const total = row.total || 1
                const newPct = Math.round(row.newCount / total * 100)
                const retPct = 100 - newPct
                return (
                  <div key={row.month} className="bg-bg-tertiary rounded-xl p-4 min-w-[240px] flex-1">
                    <p className="text-text-muted text-xs font-medium mb-3">{row.month}</p>
                    <div className="flex justify-between mb-2">
                      <div>
                        <p className="text-text-muted text-xs">{t('rep_new_label')}</p>
                        <p className="font-syne font-bold text-accent-blue text-xl">{row.newCount}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-text-muted text-xs">{t('rep_return_label')}</p>
                        <p className="font-syne font-bold text-accent-green text-xl">{row.returnCount}</p>
                      </div>
                    </div>
                    <div className="w-full rounded-full h-2 mb-1 overflow-hidden flex" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <div className="h-2 transition-all" style={{ width:`${newPct}%`, backgroundColor: C.blue }} />
                      <div className="h-2 transition-all" style={{ width:`${retPct}%`, backgroundColor: C.green }} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] font-bold" style={{ color: C.blue }}>{newPct}% {t('rep_new_label')}</span>
                      <span className="text-[10px] font-bold" style={{ color: C.green }}>{retPct}% {t('rep_return_label')}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Jadval */}
            <ModalTable
              data={tableData}
              initialSortKey="month"
              initialSortDir="desc"
              columns={[
                { key: 'month', label: t('rep_col_month') },
                { key: 'total', label: t('wh_in_total'), align: 'center', render: r => <span className="font-bold text-text-primary">{r.total}</span> },
                { key: 'newCount', label: t('rep_new_label'), align: 'center', render: r => <span className="font-bold" style={{ color: C.blue }}>{r.newCount}</span> },
                { key: 'newRate', label: t('rep_new_rate'), align: 'center', render: r => <span className="font-bold" style={{ color: C.blue }}>{r.newRate}%</span> },
                { key: 'returnCount', label: t('rep_return_label'), align: 'center', render: r => <span className="font-bold" style={{ color: C.green }}>{r.returnCount}</span> },
                { key: 'retentionRate', label: t('rep_return_rate'), align: 'center', render: r => (
                  <span className={`font-bold ${r.retentionRate >= 50 ? 'text-accent-green' : r.retentionRate >= 30 ? 'text-accent-orange' : 'text-accent-red'}`}>{r.retentionRate}%</span>
                )},
                { key: 'newRevenue', label: t('rep_new_revenue'), align: 'right', render: r => fmtUZS(r.newRevenue) },
                { key: 'retRevenue', label: t('rep_return_revenue'), align: 'right', render: r => fmtUZS(r.retRevenue) },
              ]}
            />
          </Modal>
        )
      })()}

      {/* === MODAL: Sotuv vaqt tahlili === */}
      {modal === 'hourModal' && (() => {
        const monthsSet = new Set()
        const currentMonth = new Date().toISOString().slice(0, 7)
        monthsSet.add(currentMonth)
        MOCK_SALES.forEach(s => { if (s.soldAt) monthsSet.add(s.soldAt.slice(0, 7)) })
        const MONTHS_LIST = Array.from(monthsSet).sort().reverse()
        const monthNames = {}
        MONTHS_LIST.forEach(m => { monthNames[m] = getMonthLabel(m) })
        const slots = ['07-09','09-11','11-13','13-15','15-17','17-19','19-21','21-22']

        const getHourSlot = h =>
          h < 9  ? '07-09' : h < 11 ? '09-11' : h < 13 ? '11-13'
          : h < 15 ? '13-15' : h < 17 ? '15-17' : h < 19 ? '17-19'
          : h < 21 ? '19-21' : '21-22'

        // Tanlangan oy (kunlik tab uchun)
        const selectedMonth = (modalFilter === 'all' || !MONTHS_LIST.includes(modalFilter)) ? MONTHS_LIST[0] : modalFilter

        // Kunlik tab: tanlangan oy ichidagi har kun uchun soat tahlili
        const daysInMonth = new Date(
          parseInt(selectedMonth.split('-')[0]),
          parseInt(selectedMonth.split('-')[1]),
          0
        ).getDate()

        const dailyHourGrid = (() => {
          const grid = {}
          for (let d = 1; d <= daysInMonth; d++) {
            grid[d] = {}
            slots.forEach(sl => { grid[d][sl] = 0 })
          }
          MOCK_SALES.filter(s => s.status !== 'cancelled' && s.soldAt && s.soldAt.startsWith(selectedMonth))
            .forEach(s => {
              const day  = new Date(s.soldAt).getDate()
              const slot = getHourSlot(new Date(s.soldAt).getHours())
              grid[day][slot] = (grid[day][slot] || 0) + 1
            })
          return grid
        })()

        const activeDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)

        // Oylik tab: joriy yilning 12 oyi (Z-A)
        const curYear = new Date().getFullYear()
        const allYearMonths = Array.from({ length: 12 }, (_, i) => {
          const mo = String(12 - i).padStart(2, '0')
          return `${curYear}-${mo}`
        })
        const monthlyHourData = allYearMonths.map(m => {
          const sales = MOCK_SALES.filter(s => s.status !== 'cancelled' && s.soldAt && s.soldAt.startsWith(m))
          const hMap  = {}
          slots.forEach(sl => { hMap[sl] = 0 })
          sales.forEach(s => { hMap[getHourSlot(new Date(s.soldAt).getHours())]++ })

          // Bu oy kun-soat grid (expand uchun)
          const mDays = new Date(parseInt(m.split('-')[0]), parseInt(m.split('-')[1]), 0).getDate()
          const dayGrid = {}
          for (let d = 1; d <= mDays; d++) {
            dayGrid[d] = {}
            slots.forEach(sl => { dayGrid[d][sl] = 0 })
          }
          sales.forEach(s => {
            const day  = new Date(s.soldAt).getDate()
            const slot = getHourSlot(new Date(s.soldAt).getHours())
            dayGrid[day][slot] = (dayGrid[day][slot] || 0) + 1
          })
          const mActiveDays = Array.from({ length: mDays }, (_, i) => i + 1)

          const peak = Object.entries(hMap).sort((a, b) => b[1] - a[1])[0]
          return {
            month: m, name: monthNames[m], sales: sales.length,
            hMap, peak, dayGrid, mActiveDays
          }
        })

        return (
          <Modal open title={t('rep_hour_analysis')} subtitle={t('rep_modal_hour_sub')} size="xl" onClose={closeModal}>
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-border pb-4">
              {[
                { key: 'daily',   label: t('rep_hour_tab_daily') },
                { key: 'monthly', label: t('rep_hour_tab_monthly') },
              ].map(t => (
                <button key={t.key} onClick={() => setHourTab(t.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    hourTab === t.key
                      ? 'bg-accent-red text-white'
                      : 'bg-bg-tertiary text-text-secondary hover:text-text-primary border border-border'
                  }`}>{t.label}</button>
              ))}
            </div>

            {/* ======= KUNLIK TAB ======= */}
            {hourTab === 'daily' && (
              <div>
                {/* Oy tanlash */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-text-secondary text-sm font-medium">
                    {monthNames[selectedMonth]} — {t('rep_active_days')} {t('rep_hour_daily_sub')}
                  </p>
                  <MonthYearFilter value={modalFilter} onChange={setModalFilter} includeAll={false} />
                </div>

                {activeDays.length === 0 ? (
                  <div className="py-12 text-center text-text-muted">
                    <Clock size={32} className="mx-auto mb-3 opacity-30" />
                    <p>{t('rep_hour_no_data')}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="text-xs w-full min-w-[600px]">
                      <thead>
                        <tr className="bg-bg-tertiary border-b border-border">
                          <th className="text-left px-3 py-2.5 font-medium text-text-secondary sticky left-0 bg-bg-tertiary z-10 whitespace-nowrap">
                            {t('rep_col_day')}
                          </th>
                          {slots.map(sl => (
                            <th key={sl} className="px-2 py-2.5 text-center font-medium text-text-secondary whitespace-nowrap">
                              {sl}
                            </th>
                          ))}
                          <th className="px-3 py-2.5 text-center font-medium text-text-secondary">{t('wh_in_total')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {activeDays.map(d => {
                          const dayTotal = Object.values(dailyHourGrid[d]).reduce((s, v) => s + v, 0)
                          const maxSlotVal = Math.max(...Object.values(dailyHourGrid[d]), 0)
                          return (
                            <tr key={d} className="hover:bg-bg-tertiary transition-colors">
                              <td className="px-3 py-2.5 font-bold text-text-primary sticky left-0 bg-bg-secondary hover:bg-bg-tertiary z-10 whitespace-nowrap">
                                {d}{t('rep_day_suffix')}
                              </td>
                              {slots.map(sl => {
                                const v = dailyHourGrid[d][sl]
                                const isPeak = v > 0 && v === maxSlotVal
                                return (
                                  <td key={sl} className="px-2 py-2.5 text-center">
                                    {v > 0 ? (
                                      <span
                                        className="inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold"
                                        style={{
                                          backgroundColor: isPeak ? C.red : C.purple + '33',
                                          color: isPeak ? '#fff' : C.purple,
                                        }}>
                                        {v}
                                      </span>
                                    ) : (
                                      <span className="text-border">·</span>
                                    )}
                                  </td>
                                )
                              })}
                              <td className="px-3 py-2.5 text-center">
                                <span className="font-bold text-text-primary">{dayTotal}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      {/* Jami satr */}
                      <tfoot>
                        <tr className="bg-bg-tertiary border-t border-border font-bold">
                          <td className="px-3 py-2.5 text-text-primary sticky left-0 bg-bg-tertiary z-10">Jami</td>
                          {slots.map(sl => {
                            const total = activeDays.reduce((s, d) => s + dailyHourGrid[d][sl], 0)
                            return (
                              <td key={sl} className="px-2 py-2.5 text-center">
                                {total > 0
                                  ? <span className="font-bold text-text-primary">{total}</span>
                                  : <span className="text-text-muted">—</span>}
                              </td>
                            )
                          })}
                          <td className="px-3 py-2.5 text-center font-bold text-accent-red">
                            {activeDays.reduce((s, d) =>
                              s + Object.values(dailyHourGrid[d]).reduce((ss, v) => ss + v, 0), 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}

            {hourTab === 'monthly' && (
              <div className="space-y-3">
                {monthlyHourData.map(mData => {
                  const isExpanded = expandedMonth === mData.month
                  const maxH = Math.max(...Object.values(mData.hMap), 1)

                  return (
                    <div key={mData.month} className="bg-bg-tertiary rounded-2xl overflow-hidden">
                      {/* Oy sarlavhasi — bosish uchun */}
                      <button
                        className="w-full px-5 py-4 flex items-center justify-between hover:bg-bg-secondary transition-colors"
                        onClick={() => setExpandedMonth(isExpanded ? null : mData.month)}>
                        <div className="flex items-center gap-3">
                          <span className="font-syne font-bold text-text-primary">{mData.name}</span>
                          <span className="text-text-muted text-sm">{mData.sales} {t('rep_monthly_sales_suffix')}</span>
                          {mData.peak && mData.peak[1] > 0 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold"
                              style={{ backgroundColor: C.purple + '22', color: C.purple }}>
                              Faol: {mData.peak[0]}
                            </span>
                          )}
                        </div>
                        <ChevronDown size={16}
                          className={`text-text-muted transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Oy soat grafigi (har doim ko'rinadi) */}
                      <div className="px-5 pb-2">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="flex items-center gap-1 text-[9px] text-text-muted">
                            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: C.purple }} /> Eng faol soat
                          </span>
                          <span className="flex items-center gap-1 text-[9px] text-text-muted">
                            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--border)' }} /> Boshqa soatlar
                          </span>
                        </div>
                        <div className="grid grid-cols-8 gap-1.5">
                          {slots.map(sl => {
                            const v = mData.hMap[sl]
                            const pct = maxH > 0 ? Math.round((v / maxH) * 100) : 0
                            return (
                              <div key={sl} className="text-center">
                                <div className="h-14 flex items-end justify-center mb-1">
                                  <div className="w-full rounded-t transition-all"
                                    style={{
                                      height: `${Math.max(v > 0 ? 8 : 2, pct)}%`,
                                      backgroundColor: v === maxH && v > 0 ? C.purple : 'var(--border)'
                                    }} />
                                </div>
                                <p className="text-[9px] text-text-muted leading-tight">{sl}</p>
                                <p className="text-[11px] font-bold mt-0.5"
                                  style={{ color: v === maxH && v > 0 ? C.purple : 'var(--text-muted)' }}>
                                  {v || '—'}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Expand: kun-soat jadvali */}
                      {isExpanded && (
                        <div className="border-t border-border px-5 py-4">
                          <p className="text-text-secondary text-sm font-medium mb-3">
                            {mData.name} — kunlar bo'yicha soat tahlili
                          </p>
                          {mData.mActiveDays.length === 0 ? (
                            <p className="text-text-muted text-sm text-center py-4">Ma'lumot yo'q</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="text-xs w-full min-w-[600px]">
                                <thead>
                                  <tr className="border-b border-border">
                                    <th className="text-left py-2 pr-3 text-text-muted font-medium">Kun</th>
                                    {slots.map(sl => (
                                      <th key={sl} className="py-2 px-1.5 text-center text-text-muted font-medium whitespace-nowrap">
                                        {sl}
                                      </th>
                                    ))}
                                    <th className="py-2 px-3 text-center text-text-muted font-medium">Jami</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                  {mData.mActiveDays.map(d => {
                                    const dayTotal = Object.values(mData.dayGrid[d]).reduce((s, v) => s + v, 0)
                                    const maxDayVal = Math.max(...Object.values(mData.dayGrid[d]), 0)
                                    return (
                                      <tr key={d} className="hover:bg-bg-secondary transition-colors">
                                        <td className="py-2 pr-3 font-bold text-text-primary whitespace-nowrap">{d}-kun</td>
                                        {slots.map(sl => {
                                          const v = mData.dayGrid[d][sl]
                                          const isPeak = v > 0 && v === maxDayVal
                                          return (
                                            <td key={sl} className="py-2 px-1.5 text-center">
                                              {v > 0 ? (
                                                <span
                                                  className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold"
                                                  style={{
                                                    backgroundColor: isPeak ? C.red : C.purple + '22',
                                                    color: isPeak ? '#fff' : C.purple,
                                                  }}>
                                                  {v}
                                                </span>
                                              ) : (
                                                <span className="text-border opacity-40">·</span>
                                              )}
                                            </td>
                                          )
                                        })}
                                        <td className="py-2 px-3 text-center font-bold text-text-primary">{dayTotal}</td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Modal>
        )
      })()}

      {/* === MODAL: Mijoz manbalari tarixi === */}
      {modal === 'sourceModal' && (() => {
        const monthsSet = new Set()
        const currentMonth = new Date().toISOString().slice(0, 7)
        monthsSet.add(currentMonth)
        MOCK_SALES.forEach(s => { if (s.soldAt) monthsSet.add(s.soldAt.slice(0, 7)) })
        const mNamesArr = t('exp_month_names', { returnObjects: true })
        const allMonths = Array.from(monthsSet).sort().reverse()
        const monthNames = {}
        allMonths.forEach(m => {
          const [y, mo] = m.split('-')
          monthNames[m] = `${mNamesArr[parseInt(mo) - 1] || mo} ${y}`
        })
        const months = modalFilter === 'all' ? allMonths : allMonths.filter(m => m === modalFilter)
        const srcKeys = Object.keys(SOURCE_LABELS)
        const colors = [C.blue, C.green, C.orange, C.purple, C.teal]

        return (
          <Modal open title={t('rep_modal_source_title')} subtitle={t('rep_modal_source_sub')} size="xl" onClose={closeModal}>
            <div className="flex justify-between items-center gap-4 mb-4">
              <div className="p-3 bg-bg-tertiary rounded-xl flex-1">
                <p className="text-text-muted text-xs">
                  {t('rep_sources_tip')}
                </p>
              </div>
              <div className="relative inline-block flex-shrink-0">
                <select
                  value={modalFilter}
                  onChange={e => setModalFilter(e.target.value)}
                  className="appearance-none bg-bg-tertiary border border-border rounded-xl pl-3 pr-8 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-red transition-all cursor-pointer"
                >
                  <option value="all">{t('filter_all')}</option>
                  {allMonths.map(m => (
                    <option key={m} value={m}>{monthNames[m]}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
              </div>
            </div>

            <div className="rounded-xl border border-border overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="bg-bg-tertiary border-b border-border">
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">{t('col_source')}</th>
                    {months.map(m => (
                      <th key={m} colSpan={2} className="text-center px-4 py-3 font-medium text-text-secondary border-l border-border">
                        {monthNames[m]}
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-bg-tertiary border-b border-border">
                    <th className="text-left px-4 py-3 text-text-muted text-xs"></th>
                    {months.map(m => (
                      <React.Fragment key={m}>
                        <th className="text-center px-3 py-2 text-text-muted text-xs border-l border-border">{t('rep_col_qty')}</th>
                        <th className="text-right px-3 py-2 text-text-muted text-xs">{t('rep_col_revenue')}</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {srcKeys.map((key, i) => (
                    <tr key={key} className="hover:bg-bg-tertiary transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-sm" style={{ color: colors[i % colors.length] }}>
                          {getSourceLabel(key)}
                        </span>
                      </td>
                      {months.map(m => {
                        const sales = MOCK_SALES.filter(s => s.status !== 'cancelled' && s.soldAt && s.soldAt.startsWith(m) && s.source === key)
                        return (
                          <React.Fragment key={m}>
                            <td className="px-3 py-3 text-center font-bold text-text-primary border-l border-border/50">
                              {sales.length > 0 ? sales.length : <span className="text-text-muted">—</span>}
                            </td>
                            <td className="px-3 py-3 text-right text-text-secondary text-xs">
                              {sales.length > 0 ? fmtUZS(sales.reduce((s,x) => s+x.total, 0)) : '—'}
                            </td>
                          </React.Fragment>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Modal>
        )
      })()}

      {/* === MODAL: Bekor qilish sabablari === */}
      {modal === 'cancelModal' && (() => {
        const cancelled = modalFilter === 'all'
          ? MOCK_SALES.filter(s => s.status === 'cancelled')
          : MOCK_SALES.filter(s => s.status === 'cancelled' && s.soldAt && s.soldAt.startsWith(modalFilter))

        return (
          <Modal open title={t('rep_modal_cancelled_title')} subtitle={t('rep_modal_cancelled_sub')} size="xl" onClose={closeModal}>
            <div className="flex items-center justify-between mb-5">
              <MonthYearFilter value={modalFilter} onChange={setModalFilter} />
              <span className="text-text-muted text-xs">{cancelled.length} {t('rep_cancel_count')}</span>
            </div>

            {cancelled.length === 0
              ? <div className="py-12 text-center text-text-muted">
                  <UserX size={32} className="mx-auto mb-3 opacity-30" />
                  <p>{t('rep_no_cancelled_sales')}</p>
                </div>
              : <ModalTable
                  data={cancelled}
                  pageSize={10}
                  columns={[
                    { key:'soldAt', label:t('col_date'), render: r => fmtSoldAt(r.soldAt) },
                    { key:'customerName', label:t('col_customer'), render: r => (
                      <span className="font-medium text-text-primary">{r.customerName}</span>
                    )},
                    { key:'items', label:t('col_product'), render: r => (
                      <span className="text-xs text-text-secondary">{fmtItems(r.items)}</span>
                    )},
                    { key:'subtotal', label:t('col_amount'), align:'right', render: r => fmtUZS(r.subtotal) },
                    { key:'cancelReason', label:t('col_reason'), render: r => {
                      const label = getCancelLabel(r.cancelReason);
                      const isExchange = r.cancelReason === 'almashtirish' || r.cancelReason === 'exchange';
                      return (
                        <span className={`text-xs font-medium ${isExchange ? 'text-accent-blue' : 'text-accent-red'}`}>
                          {label}
                        </span>
                      );
                    }},
                    { key:'refundType', label:t('rep_col_resolution'), render: r => {
                      if (!r.refundType) return <span className="text-text-muted">—</span>
                      const type = r.refundType.toLowerCase();
                      if (type === 'money' || type === 'refund' || type === 'cancel') {
                        return (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-red/10 text-accent-red">{t('rep_refund_money')}</span>
                        )
                      }
                      if (type === 'exchange' || type === 'almashtirish') {
                        return (
                          <div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-blue/10 text-accent-blue">{t('col_exchange')}</span>
                            {r.exchangeExtra !== null && r.exchangeExtra !== undefined && (
                              <p className="text-xs mt-0.5 text-text-muted">
                                {r.exchangeExtra > 0
                                  ? <span className="text-accent-green">+{fmtUZS(r.exchangeExtra)} {t('rep_exchange_paid')}</span>
                                  : r.exchangeExtra < 0
                                    ? <span className="text-accent-orange">{fmtUZS(Math.abs(r.exchangeExtra))} {t('rep_refunded_suffix')}</span>
                                    : t('rep_equal')
                                }
                              </p>
                            )}
                          </div>
                        )
                      }
                      return <span className="text-text-muted text-xs">{r.refundType}</span>
                    }},
                    { key:'soldByName', label:t('role_seller') },
                    { key:'cancelledByName', label:t('rep_col_cancelled_by'), render: r => (
                      <span className="text-xs font-medium text-accent-orange">{r.cancelledByName || r.soldByName || '—'}</span>
                    )},
                  ]}
                />
            }
          </Modal>
        )
      })()}
          </>

  )
}

export default SalesTab
