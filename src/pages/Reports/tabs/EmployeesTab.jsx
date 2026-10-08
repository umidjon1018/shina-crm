import React, { useMemo } from 'react'
import TableView from '../../../components/ui/TableView'
import { localToday, localMonth } from '../../../utils/tz'
import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList
} from 'recharts'
import { Activity, AlertTriangle, Award, ChevronDown, CircleX, Clock, Target, TrendingUp, Users } from 'lucide-react'
import { C, DetailButton, GrowthBadge, Modal, ModalTable, MonthYearFilter, MonthlyDynamicsChart, fmtItems, fmtNum, fmtSoldAt, fmtUZS } from '../components/shared'

const EmployeesTab = ({ ctx }) => {
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
    storeCompanyName,
    MOCK_SALES, MOCK_CUSTOMERS, MOCK_RETURNS,
  } = ctx

  const activeBundles = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('shina_crm_bundles') || '[]').filter(b => b.isActive) }
    catch { return [] }
  }, [])

  const productIdToName = useMemo(() => {
    const map = {}
    MOCK_SALES.forEach(sale => {
      (sale.items || []).forEach(it => {
        if (it.productId && (it.productName || it.name)) {
          map[String(it.productId)] = (it.productName || it.name).trim()
        }
      })
    })
    return map
  }, [MOCK_SALES])

  const enrichSale = (s) => {
    const existing = Number(s.bundleDiscountAmount) || 0
    const saleNames = new Set((s.items || []).map(it => (it.productName || it.name || '').trim()).filter(Boolean))
    const matchedBundle = activeBundles.find(b =>
      b.products?.length > 0 &&
      b.products.every(bp => {
        const bpName = productIdToName[String(bp.productId)]
        return bpName ? saleNames.has(bpName) : false
      })
    )
    if (!matchedBundle && existing === 0 && !s.isBundle) return s
    const saleItemsTotal = (s.items || []).reduce((acc, it) => acc + (it.price || 0), 0)
    const discAmt = existing > 0
      ? existing
      : (matchedBundle?.discount > 0 ? Math.round(saleItemsTotal * matchedBundle.discount / (100 - matchedBundle.discount)) : 0)
    return { ...s, isBundle: true, bundleDiscountAmount: discAmt, bundleDiscountPercent: matchedBundle?.discount || 0 }
  }

  return (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="cursor-pointer" onClick={() => openModal('activeEmpModal')}>
                <StatCard icon={Users} label={t('rep_emp_active_title')} value={employeeStats.activeCount} sub={t('rep_emp_selected_period')} color="bg-accent-blue/10 text-accent-blue" />
              </div>
              <div className="cursor-pointer" onClick={() => openModal('topSellerModal')}>
                <StatCard icon={Award} label={t('rep_emp_top_seller')}
                  value={employeeStats.topSeller?.name || '—'}
                  sub={employeeStats.topSeller ? fmtUZS(employeeStats.topSeller.totalSales) : ''}
                  color="bg-yellow-500/10 text-yellow-500" />
              </div>
              <div className="cursor-pointer" onClick={() => openModal('cancelByEmpModal')}>
                <StatCard icon={CircleX} label={t('rep_emp_total_cancelled')}
                  value={employeeStats.totalCancelled}
                  sub={t('rep_emp_all_employees_sub')}
                  color="bg-accent-red/10 text-accent-red" />
              </div>
            </div>

            <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 mt-4 sm:mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h4 className="font-syne font-bold text-text-primary">{t('rep_emp_performance_title')}</h4>
                  <p className="text-text-secondary text-sm">{t('rep_emp_comparative_analysis')}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { key:'total',  label:t('col_amount') },
                    { key:'count',  label:t('rep_emp_metric_count') },
                    { key:'profit', label:t('rep_emp_metric_profit') },
                  ].map(m => (
                    <button key={m.key}
                      onClick={() => setEmpChartMetric(m.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        empChartMetric === m.key
                          ? 'bg-accent-red text-white'
                          : 'bg-bg-tertiary text-text-secondary hover:text-text-primary border border-border'
                      }`}>
                      {m.label}
                    </button>
                  ))}
                  <DetailButton onClick={() => openModal('empChartModal')} />
                </div>
              </div>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={employeeStats.empStats.map(e => ({
                    name: e.name,
                    value: empChartMetric === 'total'  ? e.totalSales  :
                           empChartMetric === 'count'  ? e.salesCount  :
                           e.totalProfit
                  }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" fontSize={10} width={80} stroke="var(--text-muted)" />
                    <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} formatter={v => empChartMetric === 'count' ? `${v} ${t('unit_pcs')}` : fmtUZS(v)} contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', borderRadius: '12px', color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)', fontSize: '12px' }} offset={10} isAnimationActive={false} wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }} />
                    <Bar dataKey="value" name={empChartMetric === 'total' ? t('col_amount') : empChartMetric === 'count' ? t('rep_emp_metric_count') : t('rep_emp_metric_profit')} fill={C.blue} radius={[0, 4, 4, 0]} cursor={{ fill: 'rgba(255,255,255,0.05)' }}>
                      <LabelList dataKey="value" position="insideRight" dx={-12} style={{ fill: '#fff', fontSize: 13, fontWeight: 700 }}
                        formatter={v => empChartMetric === 'count' ? `${v} ta` : fmtUZS(v)} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden mt-4 sm:mt-6">
              <div className="px-4 sm:px-6 py-4 border-b border-border">
                <h4 className="font-syne font-bold text-text-primary">{t('rep_emp_rating_title')}</h4>
              </div>
              <TableView id="rep_emp_main" optional={[t('rep_emp_col_avg_check'), t('rep_emp_col_new'), t('rep_emp_col_cancel_pct'), t('rep_emp_col_last_sale'), t('rep_emp_col_cancel_count'), t('rep_emp_col_discount_pct')]}>
              <div className="overflow-x-auto">
                <table className="w-auto min-w-full text-sm whitespace-nowrap">
                  <thead>
                    <tr className="bg-bg-tertiary border-b border-border">
                      <th className="text-left px-3 py-2.5 font-medium text-text-secondary">#</th>
                      <th className="text-left px-3 py-2.5 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('employees', 'name')}>
                        {t('role_seller')} <SortIcon table="employees" col="name" />
                      </th>
                      <th className="text-center px-3 py-2.5 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('employees', 'salesCount')}>
                        {t('perm_sales')} <SortIcon table="employees" col="salesCount" />
                      </th>
                      <th className="text-right px-3 py-2.5 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('employees', 'totalSales')}>
                        {t('rep_emp_col_total_sum')} <SortIcon table="employees" col="totalSales" />
                      </th>
                      <th className="text-right px-3 py-2.5 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('employees', 'avgCheck')}>
                        {t('rep_emp_col_avg_check')} <SortIcon table="employees" col="avgCheck" />
                      </th>
                      <th className="text-center px-3 py-2.5 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('employees', 'newCustomers')}>
                        {t('rep_emp_col_new')} <SortIcon table="employees" col="newCustomers" />
                      </th>
                      <th className="text-center px-3 py-2.5 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('employees', 'cancelPct')}>
                        {t('rep_emp_col_cancel_pct')} <SortIcon table="employees" col="cancelPct" />
                      </th>
                      <th className="text-center px-3 py-2.5 font-medium text-text-secondary">{t('rep_emp_col_last_sale')}</th>
                      <th className="text-center px-3 py-2.5 font-medium text-text-secondary">{t('rep_emp_col_target_pct')}</th>
                      <th className="text-center px-3 py-2.5 font-medium text-text-secondary">{t('rep_emp_col_kpi')}</th>
                      {isPrivileged && (
                        <th className="text-right px-3 py-2.5 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('employees', 'totalProfit')}>
                          {t('rep_emp_col_profit')} <SortIcon table="employees" col="totalProfit" />
                        </th>
                      )}
                      {isPrivileged && <th className="text-center px-3 py-2.5 font-medium text-text-secondary">{t('rep_emp_col_cancel_count')}</th>}
                      {isPrivileged && (
                        <th className="text-right px-3 py-2.5 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('employees', 'avgDiscount')}>
                          {t('rep_emp_col_discount_pct')} <SortIcon table="employees" col="avgDiscount" />
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {sortedData(employeeStats.empStats, 'employees').map((e, idx) => (
                      <tr key={e.id}
                        className="hover:bg-bg-tertiary transition-colors cursor-pointer"
                        onClick={() => { setSelectedEmployee(e); openModal('empProfileModal') }}>
                        <td className="px-3 py-2 sm:py-3 text-text-muted">
                          {idx === 0 ? <Award size={14} className="text-yellow-500" /> :
                           idx === 1 ? <Award size={14} className="text-gray-400" /> :
                           idx === 2 ? <Award size={14} className="text-orange-400" /> :
                           idx + 1}
                        </td>
                        <td className="px-3 py-2 sm:py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-accent-blue/10 text-accent-blue flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                              {e.name[0]}
                            </div>
                            <span className="font-medium text-text-primary">{e.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 sm:py-3 text-center text-text-primary font-bold">{e.salesCount}</td>
                        <td className="px-3 py-2 sm:py-3 text-right text-text-primary font-bold">{fmtUZS(e.totalSales)}</td>
                        <td className="px-3 py-2 sm:py-3 text-right font-bold text-text-primary">{fmtUZS(e.avgCheck)}</td>
                        <td className="px-3 py-2 sm:py-3 text-center font-bold text-accent-blue">{e.newCustomers}</td>
                        <td className="px-3 py-2 sm:py-3 text-center font-bold" style={{ color: e.cancelPct > 20 ? C.red : e.cancelPct > 10 ? C.orange : C.green }}>{e.cancelPct}%</td>
                        <td className="px-3 py-2 sm:py-3 text-center text-text-muted">{e.lastSale || '—'}</td>
                        <td className="px-3 py-2 sm:py-3 text-center">
                          {e.targetPct !== null
                            ? <span className={`font-bold ${e.targetPct >= 100 ? 'text-accent-green' : e.targetPct >= 70 ? 'text-accent-orange' : 'text-accent-red'}`}>{e.targetPct}%</span>
                            : <span className="text-text-muted">—</span>}
                        </td>
                        <td className="px-3 py-2 sm:py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="w-10 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                              <div className="h-1.5 rounded-full" style={{ width:`${e.kpi}%`, backgroundColor: e.kpi>=70?C.green:e.kpi>=40?C.orange:C.red }} />
                            </div>
                            <span className="font-bold" style={{ color: e.kpi>=70?C.green:e.kpi>=40?C.orange:C.red }}>{e.kpi}</span>
                          </div>
                        </td>
                        {isPrivileged && <td className="px-3 py-2 sm:py-3 text-right text-accent-green font-medium">{fmtUZS(e.totalProfit)}</td>}
                        {isPrivileged && <td className="px-3 py-2 sm:py-3 text-center text-accent-red">{e.cancelCount}</td>}
                        {isPrivileged && <td className="px-3 py-2 sm:py-3 text-right text-text-muted">{e.avgDiscount}%</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </TableView>
            </div>

            {isPrivileged && (
              <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden mt-4 sm:mt-6">
                <div className="px-4 sm:px-6 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} className="text-accent-orange" />
                    <h4 className="font-syne font-bold text-text-primary">{t('rep_emp_discount_control')}</h4>
                  </div>
                  <DetailButton onClick={() => openModal('discountDetailModal')} />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-bg-tertiary border-b border-border">
                        <th className="text-left px-4 sm:px-6 py-2 sm:py-3 text-text-secondary font-medium">{t('role_seller')}</th>
                        <th className="text-center px-4 sm:px-6 py-2 sm:py-3 text-text-secondary font-medium">{t('rep_emp_discount_given')}</th>
                        <th className="text-center px-4 sm:px-6 py-2 sm:py-3 text-text-secondary font-medium">{t('rep_emp_discount_avg')}</th>
                        <th className="text-center px-4 sm:px-6 py-2 sm:py-3 text-text-secondary font-medium">{t('rep_emp_discount_max')}</th>
                        <th className="text-right px-4 sm:px-6 py-2 sm:py-3 text-text-secondary font-medium">{t('rep_emp_discount_lost')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {employeeStats.empStats.map(e => {
                        return (
                          <tr key={e.id} className="hover:bg-bg-tertiary transition-colors">
                            <td className="px-4 sm:px-6 py-2.5 sm:py-4 font-medium text-text-primary">{e.name}</td>
                            <td className="px-4 sm:px-6 py-2.5 sm:py-4 text-center text-text-primary">{e.discountSales.length} {t('unit_pcs')}</td>
                            <td className="px-4 sm:px-6 py-2.5 sm:py-4 text-center font-bold" style={{ color: e.avgDiscount > 5 ? C.red : e.avgDiscount > 2 ? C.orange : C.green }}>
                              {e.avgDiscount}%
                            </td>
                            <td className="px-4 sm:px-6 py-2.5 sm:py-4 text-center font-bold" style={{ color: e.maxDiscount >= 10 ? C.red : e.maxDiscount >= 5 ? C.orange : C.muted }}>
                              {e.maxDiscount > 0 ? e.maxDiscount + '%' : '—'}
                            </td>
                            <td className="px-4 sm:px-6 py-2.5 sm:py-4 text-right text-accent-red font-bold">{e.lostRevenue > 0 ? fmtUZS(e.lostRevenue) : '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden mt-4 sm:mt-6">
              <div className="px-4 sm:px-6 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h4 className="font-syne font-bold text-text-primary">{t('rep_emp_time_analysis')}</h4>
                  <p className="text-text-secondary text-sm">{t('rep_emp_time_analysis_sub')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <MonthYearFilter value={modalFilter} onChange={setModalFilter} />
                  <DetailButton onClick={() => openModal('workHoursModal')} />
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
                  {employeeStats.empStats.map(e => {
                    const slots = ['07-09','09-11','11-13','13-15','15-17','17-19','19-21','21-22']
                    const maxVal = Math.max(...slots.map(s => e.hourMap[s]||0), 1)
                    return (
                      <div key={e.id} className="bg-bg-tertiary rounded-xl p-4">
                        <p className="font-syne font-bold text-text-primary mb-3">{e.name}</p>
                        <div className="grid grid-cols-4 gap-1">
                          {slots.map(slot => {
                            const val = e.hourMap[slot] || 0
                            const pct = Math.round((val/maxVal)*100)
                            return (
                              <div key={slot} className="text-center">
                                <div className="h-12 flex items-end justify-center mb-1">
                                  <div className="w-full rounded-t transition-all"
                                    style={{
                                      height: `${Math.max(4, pct)}%`,
                                      backgroundColor: val === maxVal && val > 0 ? C.red : C.muted+'33'
                                    }} />
                                </div>
                                <p className="text-[9px] text-text-muted">{slot}</p>
                                <p className="text-[10px] font-bold" style={{ color: val === maxVal && val > 0 ? C.red : undefined }}>
                                  {val > 0 ? val : ''}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 mt-4 sm:mt-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h4 className="font-syne font-bold text-text-primary">{t('rep_emp_monthly_target_vs_result')}</h4>
                  <p className="text-text-secondary text-sm">{t('rep_emp_by_employee')}</p>
                </div>
              </div>
              <div className="space-y-4 sm:space-y-6">
                {employeeStats.empStats.map(e => (
                  <div key={e.id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-syne font-bold text-text-primary">{e.name}</span>
                      <span className="text-text-muted text-xs px-2 py-0.5 rounded bg-bg-tertiary border border-border">
                        {{ admin: t('role_admin'), manager: t('role_manager'), employee: t('role_seller'), seller: t('role_seller'), storekeeper: t('role_storekeeper'), technician: t('role_technician') }[e.role] || e.role}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {sortMonths(e.monthly).map(m => (
                        <div key={m.month}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-text-secondary text-xs">{m.name}</span>
                            <div className="flex items-center gap-3 text-xs">
                              {m.target > 0 && <span className="text-text-muted">{t('rep_emp_monthly_goal')}{fmtUZS(m.target)}</span>}
                              <span className="font-bold text-text-primary">{fmtUZS(m.total)}</span>
                              {m.targetPct !== null && (
                                <span className={`font-bold ${
                                  m.targetPct >= 100 ? 'text-accent-green' :
                                  m.targetPct >= 70  ? 'text-accent-orange' : 'text-accent-red'
                                }`}>{m.targetPct}%</span>
                              )}
                            </div>
                          </div>
                          <div className="w-full bg-bg-tertiary rounded-full h-2">
                            <div className="h-2 rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, m.targetPct || 0)}%`,
                                backgroundColor: (m.targetPct||0) >= 100 ? C.green : (m.targetPct||0) >= 70 ? C.orange : C.red
                              }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* === MODAL: Faol xodimlar === */}
            {modal === 'activeEmpModal' && (
              <Modal open title={t('rep_emp_modal_activity_title')} subtitle={t('rep_emp_modal_activity_sub')} size="lg" onClose={closeModal}>
                <div className="flex gap-3 overflow-x-auto pb-2 mb-4 sm:mb-6">
                  {sortMonths(employeeStats.monthlyActivity).map(m => (
                    <div key={m.month} className="bg-bg-tertiary rounded-xl p-4 min-w-[180px] flex-shrink-0">
                      <p className="text-text-muted text-xs mb-1">{m.name}</p>
                      <p className="font-syne font-bold text-accent-blue text-2xl sm:text-3xl">{m.count}</p>
                      <p className="text-text-muted text-xs mt-1">{t('rep_emp_modal_active_count_suffix')}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {m.emps.map(name => (
                          <span key={name} className="px-2 py-0.5 rounded bg-accent-blue/10 text-accent-blue text-[10px] font-bold">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <MonthlyDynamicsChart
                  data={employeeStats.monthlyActivity}
                  dataKey="count"
                  color={C.blue}
                  formatter={v => `${v} ${t('unit_pcs')}`}
                  name={t('rep_chart_count')}
                />
                <p className="text-text-secondary text-sm font-medium mt-4 sm:mt-6 mb-3">{t('rep_emp_modal_all_employees')}</p>
                <div className="space-y-2">
                  {employeeStats.empStats.map(e => (
                    <div key={e.id}
                      className="bg-bg-tertiary rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-bg-secondary transition-colors"
                      onClick={() => { setSelectedEmployee(e); openModal('empProfileModal') }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent-blue/10 text-accent-blue flex items-center justify-center font-bold text-sm">
                          {e.name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{e.name}</p>
                          <p className="text-text-muted text-xs">
                            {{ admin: t('role_admin'), manager: t('role_manager'), employee: t('role_seller'), seller: t('role_seller') }[e.role] || e.role}
                            {' '}• {e.phone} • {e.hiredAt}{t('rep_emp_modal_hired_since')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-text-primary text-sm">{e.salesCount}{t('rep_emp_modal_sales_count')}</p>
                        <p className="text-text-muted text-xs">{e.isActive ? t('rep_emp_modal_active') : t('rep_emp_modal_inactive')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Modal>
            )}

            {/* === MODAL: Eng yaxshi sotuvchi === */}
            {modal === 'topSellerModal' && (
              <Modal open title={t('rep_emp_top_seller')} subtitle={t('rep_emp_modal_top_seller_sub')} size="lg" onClose={closeModal}>
                <div className="space-y-4 sm:space-y-6">
                  {(employeeStats.empStats[0]?.monthly || []).map((m) => {
                    const getEmpMonth = (e) => e.monthly?.find(x => x.month === m.month)
                    const monthRanking = [...employeeStats.empStats]
                      .sort((a,b) => (getEmpMonth(b)?.total || 0) - (getEmpMonth(a)?.total || 0))
                    const topByProfit = [...employeeStats.empStats]
                      .sort((a,b) => (getEmpMonth(b)?.profit || 0) - (getEmpMonth(a)?.profit || 0))[0]
                    return (
                      <div key={m.month} className="bg-bg-tertiary rounded-2xl p-4 sm:p-5">
                        <h4 className="font-syne font-bold text-text-primary mb-4">{m.name}</h4>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-bg-secondary rounded-xl p-3">
                            <p className="text-text-muted text-xs mb-1">{t('rep_emp_modal_by_sales')}</p>
                            <p className="font-syne font-bold text-yellow-500">{monthRanking[0]?.name}</p>
                            <p className="text-text-muted text-xs">{fmtUZS(getEmpMonth(monthRanking[0])?.total || 0)}</p>
                          </div>
                          <div className="bg-bg-secondary rounded-xl p-3">
                            <p className="text-text-muted text-xs mb-1">{t('rep_emp_modal_by_profit')}</p>
                            <p className="font-syne font-bold text-accent-green">{topByProfit?.name}</p>
                            <p className="text-text-muted text-xs">{fmtUZS(getEmpMonth(topByProfit)?.profit || 0)}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {monthRanking.map((e, rank) => {
                            const empM = getEmpMonth(e)
                            return (
                            <div key={e.id} className="flex items-center gap-3 bg-bg-secondary rounded-xl px-3 py-2.5">
                              <span className="w-6 text-center font-bold text-sm"
                                style={{ color: rank===0?C.orange:rank===1?C.muted:C.muted }}>
                                {rank===0?'🥇':rank===1?'🥈':rank===2?'🥉':`${rank+1}.`}
                              </span>
                              <span className="flex-1 font-medium text-text-primary text-sm">{e.name}</span>
                              <span className="font-bold text-text-primary">{fmtUZS(empM?.total || 0)}</span>
                              {empM?.growth != null && (
                                <GrowthBadge current={empM.total} previous={empM.total / (1 + empM.growth / 100)} />
                              )}
                            </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Modal>
            )}

            {/* === MODAL: Bekor qilingan — xodim bo'yicha === */}
            {modal === 'cancelByEmpModal' && (() => {
              const isExchangeRow = x => x.cancelReason === 'almashtirish' || x.cancelReason === 'exchange' || x._isExchange
              const calcLost = (det) => det.filter(x => !isExchangeRow(x)).reduce((s,x)=>s+(x.subtotal||x.total||0),0)
              const filtered = modalFilter === 'all'
                ? employeeStats.cancelByEmp
                : employeeStats.cancelByEmp.map(e => {
                    const det = e.details.filter(s => s.soldAt && s.soldAt.startsWith(modalFilter))
                    return { ...e, details: det, cancelCount: det.length, lostRevenue: calcLost(det) }
                  }).filter(e => e.cancelCount > 0)
              const totalLost = filtered.reduce((s,e) => s + e.lostRevenue, 0)
              const totalCount = filtered.reduce((s,e) => s + e.cancelCount, 0)
              return (
                <Modal open title={t('rep_emp_modal_cancelled_title')} subtitle={t('rep_emp_modal_cancelled_sub')} size="xl" onClose={closeModal}>
                  <div className="flex items-center justify-between mb-4">
                    <MonthYearFilter value={modalFilter} onChange={setModalFilter} />
                    <span className="text-text-muted text-xs">
                      {t('rep_emp_modal_cancelled_total')}<span className="font-bold text-accent-red">{totalCount} {t('unit_pcs')}</span>
                    </span>
                  </div>
                  {totalLost > 0 && (
                    <div className="bg-accent-red/10 border border-accent-red/30 rounded-xl px-5 py-4 mb-5 flex items-center justify-between">
                      <div>
                        <p className="text-accent-red text-xs font-bold uppercase tracking-wider mb-0.5">
                          {modalFilter === 'all' ? t('rep_emp_modal_cancelled_total_lost') : t('rep_emp_modal_cancelled_monthly_lost')}
                        </p>
                        <p className="font-syne font-bold text-2xl text-accent-red">{fmtUZS(totalLost)}</p>
                      </div>
                      <div className="text-right text-xs text-text-muted">
                        <p>{totalCount}{t('rep_emp_modal_cancelled_sales')}</p>
                        {totalCount > 0 && <p className="mt-0.5">{t('rep_emp_modal_cancelled_avg')}<span className="font-bold text-text-primary">{fmtUZS(Math.round(totalLost/totalCount))}</span></p>}
                      </div>
                    </div>
                  )}
                  {filtered.length === 0
                    ? <p className="text-text-muted text-center py-5 sm:py-8">{t('rep_emp_modal_cancelled_no_data')}</p>
                    : <div className="space-y-4">
                        {filtered.map(e => (
                          <div key={e.id} className="bg-bg-tertiary rounded-xl p-4 sm:p-5">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-accent-red/10 text-accent-red flex items-center justify-center font-bold">
                                  {e.name[0]}
                                </div>
                                <div>
                                  <p className="font-syne font-bold text-text-primary">{e.name}</p>
                                  <p className="text-text-muted text-xs">{{ admin: t('role_admin'), manager: t('role_manager'), seller: t('role_seller'), employee: t('role_seller'), storekeeper: t('role_storekeeper'), technician: t('role_technician') }[e.role] || e.role}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-accent-red">{e.cancelCount} {t('rep_emp_col_cancel_count')}</p>
                                <p className="font-bold text-accent-red text-sm">{fmtUZS(e.lostRevenue)}</p>
                              </div>
                            </div>
                            <ModalTable
                              data={e.details}
                              pageSize={5}
                              columns={[
                                { key:'soldAt', label:t('col_date'), render: r => fmtSoldAt(r.soldAt) },
                                { key:'customerName', label:t('col_customer') },
                                { key:'items', label:t('col_product'), render: r => <span className="text-xs text-text-secondary">{fmtItems(r.items)}</span> },
                                { key:'subtotal', label:t('col_amount'), align:'right', render: r => fmtUZS(r.subtotal || r.total || 0) },
                                { key:'cancelReason', label:t('col_reason'), render: r => {
                                   const label = getCancelLabel(r.cancelReason);
                                   const isExchange = r.cancelReason === 'almashtirish' || r.cancelReason === 'exchange';
                                   return (
                                     <span className={`text-xs font-medium ${isExchange ? 'text-accent-blue' : 'text-accent-red'}`}>
                                       {label}
                                     </span>
                                   );
                                 }},
                                { key:'cancelledByName', label:t('rep_emp_modal_cancelled_col_cancelled_by'), render: r => {
                                   if (!r.cancelledBy || String(r.cancelledBy) === String(r.soldBy)) {
                                     return <span className="text-text-muted text-xs">—</span>
                                   }
                                   return <span className="text-xs font-semibold text-accent-orange">{r.cancelledByName || '—'}</span>
                                 }},
                              ]}
                            />
                          </div>
                        ))}
                      </div>
                  }
                </Modal>
              )
            })()}

            {/* === MODAL: Grafik batafsil === */}
            {modal === 'empChartModal' && (
              <Modal open title={t('rep_emp_performance_title')} subtitle={t('rep_emp_modal_performance_dynamics')} size="xl" onClose={closeModal}>
                <div className="space-y-4 sm:space-y-6">
                  {(employeeStats.empStats[0]?.monthly || []).map((m, mi) => (
                    <div key={m.month}>
                      <p className="text-text-secondary text-sm font-medium mb-3">{m.name}</p>
                      <div className="h-[160px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={employeeStats.empStats.map(e => ({
                            name: e.name,
                            Sotuv:  e.monthly?.[mi]?.total || 0,
                            Foyda:  e.monthly?.[mi]?.profit || 0,
                            Soni:   e.monthly?.[mi]?.count || 0,
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                            <XAxis dataKey="name" fontSize={11} stroke={C.muted} />
                            <YAxis hide />
                            <Tooltip
                              cursor={{ fill:'rgba(255,255,255,0.04)' }}
                              contentStyle={{ backgroundColor:'var(--bg-secondary)', borderColor:'var(--border)', borderRadius:'12px', color:'var(--text-primary)' }}
                              itemStyle={{ color:'var(--text-primary)', fontSize:'12px' }}
                              formatter={v => fmtUZS(v)}
                              offset={10}
                              isAnimationActive={false}
                              wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }} />
                            <Legend iconType="circle" />
                            <Bar dataKey="Sotuv"  fill={C.blue}  radius={[4,4,0,0]} name={t('rep_emp_modal_performance_sales_legend')}>
                              <LabelList dataKey="Sotuv" position="center" style={{ fill:'#fff', fontSize:10, fontWeight:700 }} formatter={v => v > 0 ? fmtUZS(v) : ''} />
                            </Bar>
                            <Bar dataKey="Foyda"  fill={C.green} radius={[4,4,0,0]} name={t('rep_emp_modal_performance_profit_legend')}>
                              <LabelList dataKey="Foyda" position="center" style={{ fill:'#fff', fontSize:10, fontWeight:700 }} formatter={v => v > 0 ? fmtUZS(v) : ''} />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ))}
                </div>
              </Modal>
            )}

            {/* === MODAL: Xodim profili === */}
            {modal === 'empProfileModal' && selectedEmployee && (() => {
              const e = selectedEmployee
              return (
                <Modal open title={e.name} subtitle={`${{ admin: t('role_admin'), manager: t('role_manager'), employee: t('role_seller') }[e.role] || e.role} • ${e.phone} • ${e.hiredAt}${t('rep_emp_modal_hired_since')}`} size="xl" onClose={closeModal}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 sm:mb-6">
                    {[
                      { label:t('rep_emp_modal_profile_total_sales'),  value: fmtUZS(e.totalSales),  color: C.blue  },
                      { label:t('perm_sales'),    value: `${e.salesCount} ${t('unit_pcs')}`,   color: C.green },
                      { label:t('rep_emp_col_cancel_pct'),     value: `${e.cancelPct}%`,      color: e.cancelPct > 10 ? C.red : C.muted },
                      { label:t('rep_emp_col_kpi'),         value: e.kpi,                  color: e.kpi >= 70 ? C.green : e.kpi >= 40 ? C.orange : C.red },
                    ].map(item => (
                      <div key={item.label} className="bg-bg-tertiary rounded-xl p-4 text-center">
                        <p className="text-text-muted text-xs mb-1">{item.label}</p>
                        <p className="font-syne font-bold text-xl" style={{ color: item.color }}>{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Shaxsiy ma'lumotlar — faqat privileged */}
                  {isPrivileged && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 sm:mb-6">
                      <div className="bg-bg-tertiary rounded-xl p-4">
                        <p className="text-text-muted text-xs mb-1">{t('rep_emp_modal_profile_salary')}</p>
                        <p className="font-syne font-bold text-lg text-accent-green">{e.salary ? fmtUZS(e.salary) : '—'}</p>
                      </div>
                      <div className="bg-bg-tertiary rounded-xl p-4">
                        <p className="text-text-muted text-xs mb-1">{t('rep_emp_modal_profile_role')}</p>
                        <p className="font-syne font-bold text-lg text-text-primary">
                          {{ admin: t('role_admin'), manager: t('role_manager'), seller: t('role_seller'), storekeeper: t('role_storekeeper'), technician: t('role_technician') }[e.role] || e.role}
                        </p>
                      </div>
                      <div className="bg-bg-tertiary rounded-xl p-4">
                        <p className="text-text-muted text-xs mb-1">{t('rep_emp_modal_profile_hired_date')}</p>
                        <p className="font-syne font-bold text-lg text-text-primary">{e.hiredAt || '—'}</p>
                      </div>
                      <div className="bg-bg-tertiary rounded-xl p-4">
                        <p className="text-text-muted text-xs mb-1">{t('col_phone')}</p>
                        <p className="font-syne font-bold text-lg text-text-primary">{e.phone || '—'}</p>
                      </div>
                    </div>
                  )}

                  {/* Oylik maqsad */}
                  <div className="mb-4 sm:mb-6">
                    <p className="text-text-secondary text-sm font-medium mb-3">{t('rep_emp_monthly_target_vs_result')}</p>
                    <div className="space-y-3">
                      {sortMonths(e.monthly).map(m => (
                        <div key={m.month} className="bg-bg-tertiary rounded-xl px-4 py-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-text-primary text-sm">{m.name}</span>
                            <div className="flex items-center gap-3 text-xs">
                              {m.target > 0 && <span className="text-text-muted">{t('rep_emp_monthly_goal')}{fmtUZS(m.target)}</span>}
                              <span className="font-bold text-text-primary">{fmtUZS(m.total)}</span>
                              {m.targetPct !== null && (
                                <span className={`font-bold ${m.targetPct>=100?'text-accent-green':m.targetPct>=70?'text-accent-orange':'text-accent-red'}`}>
                                  {m.targetPct}%
                                </span>
                              )}
                              {m.growth !== null && <GrowthBadge current={m.total} previous={m.total/(1+m.growth/100)} />}
                            </div>
                          </div>
                          {m.target > 0 && (
                            <div className="w-full bg-bg-secondary rounded-full h-2">
                              <div className="h-2 rounded-full transition-all"
                                style={{
                                  width:`${Math.min(100,m.targetPct||0)}%`,
                                  backgroundColor:(m.targetPct||0)>=100?C.green:(m.targetPct||0)>=70?C.orange:C.red
                                }} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sotuvlar tarixi */}
                  {(() => {
                    const allEmpSales = MOCK_SALES
                      .filter(s => String(s.soldBy) === String(e.id) && s.status !== 'cancelled')
                      .sort((a,b) => b.soldAt.localeCompare(a.soldAt))
                    return (
                      <>
                        <p className="text-text-secondary text-sm font-medium mb-3">
                          {t('rep_emp_modal_profile_all_sales')} ({allEmpSales.length} {t('unit_pcs')})
                        </p>
                        <ModalTable
                          data={allEmpSales}
                          pageSize={8}
                          columns={[
                            { key:'soldAt',       label:t('col_date'),   render: r => fmtSoldAt(r.soldAt) },
                            { key:'customerName', label:t('col_customer'),  render: r => <span className="font-medium text-text-primary">{r.customerName}</span> },
                            { key:'items',        label:t('col_product'),  render: r => <span className="text-xs text-text-secondary">{fmtItems(r.items)}</span> },
                            { key:'total',        label:t('col_amount'),  align:'right', render: r => <span className="font-bold text-text-primary">{fmtUZS(r.total)}</span> },
                            { key:'discount',     label:t('rep_emp_col_discount_pct'), align:'center', render: r => r.discount > 0
                              ? <span className="text-accent-orange font-bold">{r.discount}%</span> : '—'
                            },
                            { key:'paymentType',  label:t('rep_col_payment'), align:'center', render: r => (
                              <span className="px-2 py-0.5 rounded bg-bg-tertiary border border-border text-[10px] font-bold uppercase text-text-secondary">
                                {{ cash: t('pay_cash'), card: t('pay_card'), installment: t('pay_installment') }[r.paymentType]}
                              </span>
                            )},
                          ]}
                        />
                      </>
                    )
                  })()}

                  {/* Bekor qilinganlar */}
                  {(() => {
                    // Bekor qilingan: MOCK_SALES dan, soldBy = bu xodim, status = 'cancelled'
                    const cancelledRows = MOCK_SALES
                      .filter(s => String(s.soldBy) === String(e.id) && s.status === 'cancelled')
                      .map(s => ({ ...s, _rowKind: 'cancel' }))
                    // Almashtirish: MOCK_SALES dan, soldBy = bu xodim, _isExchange = true
                    const exchangeRows = MOCK_SALES
                      .filter(s => String(s.soldBy) === String(e.id) && s._isExchange === true)
                      .map(s => ({ ...s, _rowKind: 'exchange' }))
                    const allRows = [...cancelledRows, ...exchangeRows]
                      .sort((a, b) => (b.soldAt || '').localeCompare(a.soldAt || ''))

                    // Exchange juftlari uchun fon rangi (HistoryTab kabi)
                    const palette = [
                      'rgba(59,130,246,0.15)', 'rgba(139,92,246,0.15)', 'rgba(20,184,166,0.15)',
                      'rgba(249,115,22,0.13)', 'rgba(236,72,153,0.13)', 'rgba(99,102,241,0.15)'
                    ]
                    const pairColors = {}
                    let pidx = 0
                    ;(MOCK_RETURNS || []).forEach(ret => {
                      if (ret.type === 'exchange' && ret.originalSaleId && ret.exchangeSaleId) {
                        const color = palette[pidx % palette.length]
                        pairColors[String(ret.originalSaleId)] = color
                        pairColors[String(ret.exchangeSaleId)] = color
                        pidx++
                      }
                    })
                    const rowStyle = (r) => pairColors[String(r.id)] ? { backgroundColor: pairColors[String(r.id)] } : {}
                    if (allRows.length === 0) return null
                    // Bekor qiluvchi boshqa xodim bo'lganmi?
                    const hasDiffCanceller = allRows.some(
                      r => r._rowKind === 'cancel' && r.cancelledBy && String(r.cancelledBy) !== String(r.soldBy)
                    )
                    return (
                      <div className="mt-4 sm:mt-6">
                        <p className="text-text-secondary text-sm font-medium mb-3">
                          {t('rep_emp_modal_profile_cancellations')} ({allRows.length} {t('unit_pcs')})
                        </p>
                        <ModalTable
                          data={allRows}
                          pageSize={8}
                          rowStyle={rowStyle}
                          columns={[
                            { key:'soldAt',       label:t('col_date'),  render: r => fmtSoldAt(r.soldAt) },
                            { key:'customerName', label:t('col_customer'), render: r => <span className="font-medium text-text-primary">{r.customerName}</span> },
                            { key:'total',        label:t('col_amount'), align:'right', render: r => (
                              <span className="font-bold" style={{ color: r._rowKind === 'exchange' ? C.green : C.red }}>{fmtUZS(r.total)}</span>
                            )},
                            { key:'cancelReason', label:t('col_reason'), render: r => {
                              if (r._rowKind === 'exchange') return <span className="text-xs font-medium text-accent-green">{t('col_exchange')}</span>
                              const LABELS = {
                                almashtirish:          t('col_exchange'),
                                exchange:              t('col_exchange'),
                                narx_mos_emas:         t('sl_cancel_r_price'),
                                tovar_yoq:             t('rep_emp_modal_cancelled_reason_out_of_stock'),
                                mijoz_fikr_ozgartirdi: t('rep_emp_modal_cancelled_reason_changed_mind'),
                                boshqa:                t('rep_emp_modal_cancelled_reason_other'),
                              }
                              const label = LABELS[r.cancelReason] || t('rep_emp_modal_cancelled_reason_default')
                              return <span className="text-xs font-medium text-accent-red">{label}</span>
                            }},
                            // Bekor qiluvchi boshqa bo'lsa — ustun ko'rsatiladi
                            ...(hasDiffCanceller ? [{
                              key: 'cancelledByName',
                              label: t('rep_emp_modal_cancelled_col_cancelled_by'),
                              render: r => {
                                if (r._rowKind === 'exchange') return <span className="text-text-muted text-xs">—</span>
                                if (!r.cancelledBy || String(r.cancelledBy) === String(r.soldBy)) {
                                  return <span className="text-text-muted text-xs">—</span>
                                }
                                return (
                                  <span className="text-xs font-semibold text-accent-red">
                                    {r.cancelledByName || '—'}
                                  </span>
                                )
                              }
                            }] : []),
                          ]}
                        />
                      </div>
                    )
                  })()}


                  {/* Chegirmalar */}
                  {e.discountSales.length > 0 && (
                    <div className="mt-4 sm:mt-6">
                      <p className="text-text-secondary text-sm font-medium mb-3">
                        {t('rep_emp_modal_profile_discount_sales')} ({e.discountSales.length} {t('unit_pcs')})
                      </p>
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="bg-bg-tertiary rounded-xl p-3 text-center">
                          <p className="text-text-muted text-xs mb-0.5">{t('rep_emp_discount_avg')}</p>
                          <p className="font-bold text-accent-orange">{e.avgDiscount}%</p>
                        </div>
                        <div className="bg-bg-tertiary rounded-xl p-3 text-center">
                          <p className="text-text-muted text-xs mb-0.5">{t('rep_emp_discount_max')}</p>
                          <p className="font-bold text-accent-red">{e.maxDiscount}%</p>
                        </div>
                        <div className="bg-bg-tertiary rounded-xl p-3 text-center">
                          <p className="text-text-muted text-xs mb-0.5">{t('rep_emp_discount_lost')}</p>
                          <p className="font-bold text-accent-red">{fmtUZS(e.lostRevenue)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </Modal>
              )
            })()}

            {/* === MODAL: Chegirma nazorati batafsil === */}
            {modal === 'discountDetailModal' && (() => {
              const baseSales = modalFilter === 'all'
                ? MOCK_SALES.filter(s => s.status !== 'cancelled')
                : MOCK_SALES.filter(s => s.status !== 'cancelled' && s.soldAt && s.soldAt.startsWith(modalFilter))
              const discountSales = baseSales
                .map(s => enrichSale(s))
                .filter(s => s.discount > 0 || (s.isBundle && s.bundleDiscountAmount > 0))
              const getLost = r => r.discount > 0 ? ((r.subtotal ?? r.total) - r.total) : (r.bundleDiscountAmount || 0)
              return (
                <Modal open title={t('rep_emp_modal_discount_title')} subtitle={t('rep_emp_modal_discount_sub')} size="2xl" onClose={closeModal}>
                  <div className="flex items-center justify-between mb-5">
                    <MonthYearFilter value={modalFilter} onChange={setModalFilter} />
                    <span className="text-text-muted text-xs">
                      {t('rep_emp_modal_discount_lost')}<span className="font-bold text-accent-red">{fmtUZS(discountSales.reduce((s,x) => s + getLost(x), 0))}</span>
                    </span>
                  </div>
                  <div className="bg-accent-orange/5 border border-accent-orange/20 rounded-xl p-3 mb-5">
                    <p className="text-accent-orange text-sm font-bold flex items-center gap-2">
                      <AlertTriangle size={16} />
                      {t('rep_emp_modal_discount_limit_warning')}
                    </p>
                    <p className="text-text-muted text-xs mt-1">
                      {t('rep_emp_modal_discount_limit_stats')
                        .replace('{count}', discountSales.filter(s => s.discount > 5).length)
                        .replace('{amount}', fmtUZS(discountSales.filter(s => s.discount > 5).reduce((s,x) => s + getLost(x), 0)))}
                    </p>
                  </div>
                  <ModalTable
                    data={[...discountSales].sort((a,b) => b.soldAt.localeCompare(a.soldAt))}
                    pageSize={10}
                    columns={[
                      { key:'soldAt',       label:t('col_date'),     render: r => fmtSoldAt(r.soldAt) },
                      { key:'hour', label:t('rep_emp_modal_discount_col_time'), align:'center', render: r => {
                        const h = new Date(r.soldAt).getHours()
                        return <span className="text-text-secondary text-xs">{String(h).padStart(2,'0')}:00</span>
                      }},
                      { key:'soldByName',   label:t('role_seller'),  render: r => <span className="font-medium text-text-primary">{r.soldByName}</span> },
                      { key:'customerName', label:t('col_customer') },
                      { key:'items',        label:t('col_product'),    render: r => <span className="text-xs text-text-secondary">{fmtItems(r.items)}</span> },
                      { key:'subtotal',     label:t('rep_emp_modal_discount_col_orig_price'), align:'right', render: r => fmtUZS(r.subtotal) },
                      { key:'discount',     label:t('rep_emp_col_discount_pct'), align:'center', render: r => r.discount > 0
                        ? <span className="font-bold text-accent-orange">{r.discount}%</span>
                        : <span className="font-bold text-accent-orange whitespace-nowrap">{r.bundleDiscountPercent > 0 ? `${r.bundleDiscountPercent}%` : ''} Komplekt</span>
                      },
                      { key:'total',        label:t('rep_emp_modal_discount_col_sale'),    align:'right', render: r => <span className="font-bold text-text-primary">{fmtUZS(r.total)}</span> },
                      { key:'lost',         label:t('rep_emp_discount_lost'), align:'right', render: r => (
                        <span className="font-bold text-accent-red">{fmtUZS(getLost(r))}</span>
                      )},
                    ]}
                  />
                </Modal>
              )
            })()}
            {modal === 'workHoursModal' && (() => {
              const slots = ['07-09','09-11','11-13','13-15','15-17','17-19','19-21','21-22']
              const _mSet4 = new Set(); MOCK_SALES.forEach(s => { if (s.soldAt) _mSet4.add(s.soldAt.slice(0,7)) })
              const MONTHS_LIST = Array.from(_mSet4).sort().reverse()
              const wrkMonthNames = Object.fromEntries(MONTHS_LIST.map(m => [m, getMonthLabel(m)]))
              const getSlot = h => h<9?'07-09':h<11?'09-11':h<13?'11-13':h<15?'13-15':h<17?'15-17':h<19?'17-19':h<21?'19-21':'21-22'
              return (
                <Modal open title={t('rep_emp_time_analysis')} subtitle={t('rep_emp_time_analysis_sub')} size="xl" onClose={closeModal}>
                  <div className="flex items-center justify-between mb-4 sm:mb-6 border-b border-border pb-4">
                    <div className="flex gap-2">
                      {[{key:'daily', label:t('rep_emp_modal_work_hours_daily')}, {key:'monthly', label:t('rep_emp_modal_work_hours_monthly')}].map(tab => (
                        <button key={tab.key} onClick={() => setHourTab(tab.key)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            hourTab === tab.key ? 'bg-accent-red text-white' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary border border-border'
                          }`}>{tab.label}</button>
                      ))}
                    </div>
                    <MonthYearFilter value={modalFilter} onChange={setModalFilter} />
                  </div>
                  {hourTab === 'daily' && (() => {
                    const selMonth = modalFilter === 'all' ? localMonth() : modalFilter
                    const selMonthName = wrkMonthNames[selMonth] || selMonth
                    const [yr, mo] = selMonth.split('-').map(Number)
                    const daysInMonth = new Date(yr, mo, 0).getDate()
                    return (
                      <div>
                        <p className="text-text-secondary text-sm font-medium mb-4">{selMonthName}{t('rep_emp_modal_work_hours_daily_sub')}</p>
                        <div className="space-y-4">
                          {employeeStats.empStats.map(e => {
                            const empSales = MOCK_SALES.filter(s => String(s.soldBy) === String(e.id) && s.status !== 'cancelled' && s.soldAt && s.soldAt.startsWith(selMonth))
                            const daySlotMap = {}
                            for (let d = 1; d <= daysInMonth; d++) {
                              daySlotMap[d] = {}
                              slots.forEach(sl => { daySlotMap[d][sl] = 0 })
                            }
                            empSales.forEach(s => {
                              const day = new Date(s.soldAt).getDate()
                              const slot = getSlot(new Date(s.soldAt).getHours())
                              if (daySlotMap[day]) daySlotMap[day][slot] = (daySlotMap[day][slot]||0) + 1
                            })
                            const activeDays = Array.from({length: daysInMonth}, (_,i) => i+1)
                              .filter(d => Object.values(daySlotMap[d]).some(v => v > 0))
                            if (activeDays.length === 0) return (
                              <div key={e.id} className="bg-bg-tertiary rounded-xl p-4">
                                <p className="font-medium text-text-primary">{e.name}</p>
                                <p className="text-text-muted text-sm mt-1">{t('rep_emp_modal_work_hours_no_sales_month')}</p>
                              </div>
                            )
                            return (
                              <div key={e.id} className="bg-bg-tertiary rounded-xl p-4">
                                <p className="font-syne font-bold text-text-primary mb-3">{e.name}</p>
                                <div className="overflow-x-auto">
                                  <table className="text-xs w-full min-w-[600px]">
                                    <thead>
                                      <tr className="border-b border-border">
                                        <th className="text-left py-2 pr-3 text-text-muted font-medium">{t('rep_emp_modal_work_hours_col_day')}</th>
                                        {slots.map(sl => <th key={sl} className="py-2 px-2 text-center text-text-muted font-medium whitespace-nowrap">{sl}</th>)}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30">
                                      {activeDays.map(d => (
                                        <tr key={d} className="hover:bg-bg-secondary transition-colors">
                                          <td className="py-2 pr-3 font-bold text-text-primary whitespace-nowrap">{selMonth}-{String(d).padStart(2,'0')}</td>
                                          {slots.map(sl => {
                                            const v = daySlotMap[d][sl]
                                            return (
                                              <td key={sl} className="py-2 px-2 text-center">
                                                {v > 0
                                                  ? <span className="inline-flex w-6 h-6 rounded-full text-white text-[10px] font-bold items-center justify-center"
                                                      style={{ backgroundColor: C.red }}>{v}</span>
                                                  : <span className="text-text-muted opacity-30">·</span>
                                                }
                                              </td>
                                            )
                                          })}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })()}
                  {hourTab === 'monthly' && (
                    <div className="space-y-4">
                      {(() => {
                        const displayMonths = modalFilter !== 'all'
                          ? MONTHS_LIST.filter(m => m === modalFilter)
                          : MONTHS_LIST
                        if (displayMonths.length === 0) return (
                          <p className="text-text-muted text-sm text-center py-5 sm:py-8">{t('rep_emp_modal_work_hours_no_data')}</p>
                        )
                        return displayMonths.map(m => {
                        const mSales = MOCK_SALES.filter(s => s.status !== 'cancelled' && s.soldAt && s.soldAt.startsWith(m))
                        const hMap = {}
                        slots.forEach(sl => { hMap[sl] = 0 })
                        mSales.forEach(s => { hMap[getSlot(new Date(s.soldAt).getHours())]++ })
                        const maxV = Math.max(...Object.values(hMap), 1)
                        const isExpanded = expandedMonth === m || displayMonths.length === 1
                        return (
                          <div key={m} className="bg-bg-tertiary rounded-xl overflow-hidden">
                            <button
                              className="w-full px-4 py-3 flex items-center justify-between hover:bg-bg-secondary transition-colors"
                              onClick={() => setExpandedMonth(isExpanded ? null : m)}>
                              <span className="font-syne font-bold text-text-primary">{wrkMonthNames[m]}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-text-muted text-sm">{mSales.length}{t('rep_emp_modal_sales_count')}</span>
                                <ChevronDown size={16} className={`text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </div>
                            </button>
                            {isExpanded && (
                              <div className="px-4 pb-4">
                                <div className="grid grid-cols-4 gap-2 mb-4">
                                  {slots.map(sl => {
                                    const v = hMap[sl]
                                    return (
                                      <div key={sl} className="bg-bg-secondary rounded-xl p-3 text-center">
                                        <p className="text-text-muted text-[10px] mb-1">{sl}</p>
                                        <div className="h-10 flex items-end justify-center mb-1">
                                          <div className="w-full rounded-t"
                                            style={{ height:`${Math.max(4,(v/maxV)*100)}%`, backgroundColor: v===maxV&&v>0?C.red:C.muted+'33' }} />
                                        </div>
                                        <p className="text-xs font-bold" style={{ color: v===maxV&&v>0?C.red:undefined }}>{v||'—'}</p>
                                      </div>
                                    )
                                  })}
                                </div>
                                <div className="space-y-2">
                                  {employeeStats.empStats.map(e => {
                                    const empMSales = mSales.filter(s => String(s.soldBy) === String(e.id))
                                    const empHMap = {}
                                    slots.forEach(sl => { empHMap[sl] = 0 })
                                    empMSales.forEach(s => { empHMap[getSlot(new Date(s.soldAt).getHours())]++ })
                                    const peak = Object.entries(empHMap).sort((a,b)=>b[1]-a[1])[0]
                                    return (
                                      <div key={e.id} className="flex items-center justify-between bg-bg-secondary rounded-xl px-3 py-2">
                                        <span className="font-medium text-text-primary text-sm">{e.name}</span>
                                        <div className="flex items-center gap-2">
                                          {peak && peak[1] > 0 && (
                                            <span className="text-text-muted text-xs">
                                              {t('rep_emp_modal_work_hours_peak_active')}<span className="font-bold" style={{ color: C.red }}>{peak[0]}</span>
                                            </span>
                                          )}
                                          <span className="font-bold text-text-primary">{empMSales.length} {t('unit_pcs')}</span>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })
                      })()}
                    </div>
                  )}
                </Modal>
              )
            })()}
          </>

  )
}

export default EmployeesTab
