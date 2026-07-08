import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { AlertTriangle, Award, MapPin, Repeat, Star, UserCheck, UserX, Users } from 'lucide-react'
import { C, DetailButton, GrowthBadge, InstagramDM, Modal, ModalTable, MonthlyDynamicsChart, Pagination, fmtItems, fmtNum, fmtSoldAt, fmtUZS } from '../components/shared'

const CustomersTab = ({ ctx }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
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
    GOLD_THRESHOLD, SILVER_THRESHOLD,
    storeInstallmentOrgs, storeMonthlyTargets, storeEmployeeTargets,
    storeCompanyName,
    MOCK_SALES, MOCK_CUSTOMERS, MOCK_PRODUCTS,
  } = ctx

  return (
          <>
            {customerStats.birthdayList.length > 0 && (
              <div className="bg-accent-blue/5 border border-accent-blue/30 rounded-2xl px-5 py-4 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎂</span>
                  <div>
                    <p className="font-syne font-bold text-text-primary">
                      {t('rep_cust_birthday_title')} {customerStats.birthdayList.map(c => c.name).join(', ')}
                    </p>
                    <p className="text-text-muted text-xs mt-0.5">{t('rep_cust_birthday_tip')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {customerStats.birthdayList.map(c => (
                    <button key={c.id}
                      onClick={() => { setSelectedCustomer(c); openModal('customerProfileModal') }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 transition-colors">
                      {c.name.split(' ')[0]}{t('rep_cust_send_dm')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="cursor-pointer" onClick={() => openModal('allCustomersModal')}>
                <StatCard icon={Users} label={t('rep_cust_total')} value={customerStats.totalCustomers} sub={t('rep_cust_total_sub')} color="bg-accent-blue/10 text-accent-blue" />
              </div>
              <div className="cursor-pointer" onClick={() => openModal('retentionModal')}>
                <StatCard icon={Repeat} label={t('rep_cust_retention')} value={`${customerStats.retentionRate}%`} sub={t('rep_cust_retention_sub')} color="bg-accent-green/10 text-accent-green" />
              </div>
              <div className="cursor-pointer" onClick={() => openModal('ltvModal')}>
                <StatCard icon={Star} label={t('rep_cust_avg_ltv')} value={fmtUZS(customerStats.avgLTV)} sub={t('rep_cust_ltv_sub')} color="bg-purple-500/10 text-purple-500" />
              </div>
              <div className="cursor-pointer" onClick={() => openModal('silverPlusModal')}>
                <StatCard icon={Award} label={t('rep_cust_silver_plus')} value={customerStats.loyaltyStats.silver + customerStats.loyaltyStats.gold} sub={t('rep_cust_loyalty_sub')} color="bg-yellow-500/10 text-yellow-500" />
              </div>
            </div>

            <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-border flex items-center gap-2">
                <Star size={16} className="text-yellow-500" />
                <h4 className="font-syne font-bold text-text-primary">{t('rep_cust_ltv_title')}</h4>
                <span className="text-text-muted text-xs ml-auto">{t('rep_cust_ltv_desc')}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-bg-tertiary border-b border-border">
                      <th className="text-left px-6 py-3 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('ltv', 'name')}>
                        {t('col_customer')} <SortIcon table="ltv" col="name" />
                      </th>
                      <th className="text-left px-6 py-3 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('ltv', 'phone')}>
                        {t('rep_col_contact')} <SortIcon table="ltv" col="phone" />
                      </th>
                      <th className="text-center px-6 py-3 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('ltv', 'totalVisits')}>
                        {t('rep_col_visits')} <SortIcon table="ltv" col="totalVisits" />
                      </th>
                      <th className="text-right px-6 py-3 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('ltv', 'totalSpent')}>
                        {t('rep_col_total_spent')} <SortIcon table="ltv" col="totalSpent" />
                      </th>
                      <th className="text-right px-6 py-3 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('ltv', 'avgCheck')}>
                        {t('rep_col_avg_check')} <SortIcon table="ltv" col="avgCheck" />
                      </th>
                      <th className="text-center px-6 py-3 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('ltv', 'cancelCount')}>
                        {t('rep_cancelled')} <SortIcon table="ltv" col="cancelCount" />
                      </th>
                      <th className="text-center px-6 py-3 font-medium text-text-secondary">
                        {t('rep_col_next_visit')}
                      </th>
                      <th className="text-center px-6 py-3 font-medium text-text-secondary">{t('rep_col_risk_level')}</th>
                      <th className="text-left px-6 py-3 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('ltv', 'lastVisit')}>
                        {t('rep_col_last_visit')} <SortIcon table="ltv" col="lastVisit" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {sortedData(
                        sortConfig.table === 'ltv'
                          ? customerStats.ltvList
                          : [...customerStats.ltvList].sort((a,b) => a.name.localeCompare(b.name)),
                        'ltv'
                      ).slice((customersPage-1)*CUSTOMERS_PAGE_SIZE, customersPage*CUSTOMERS_PAGE_SIZE)
                      .map(c => (
                      <tr key={c.id} className="hover:bg-bg-tertiary transition-colors cursor-pointer"
                        onClick={() => { setSelectedCustomer(c); openModal('customerProfileModal') }}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent-blue/10 text-accent-blue flex items-center justify-center font-bold text-sm flex-shrink-0">{c.name[0]}</div>
                            <div>
                              <span className="font-medium text-text-primary block">{c.name}</span>
                              <span className={`px-2 py-0.5 rounded mt-1 inline-block text-[10px] font-bold uppercase ${
                                c.loyaltyLevel === 'gold'   ? 'bg-yellow-500/10 text-yellow-500' :
                                c.loyaltyLevel === 'silver' ? 'bg-gray-400/10 text-gray-400' :
                                'bg-orange-700/10 text-orange-700'
                              }`}>{c.loyaltyLevel}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-text-secondary text-xs">
                          <p>{c.phone || '—'}</p>
                          {c.instagram && <p className="text-accent-blue mt-0.5">@{c.instagram}</p>}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-text-primary">{c.totalVisits}</td>
                        <td className="px-6 py-4 text-right font-bold text-text-primary">{fmtUZS(c.totalSpent)}</td>
                        <td className="px-6 py-4 text-right font-medium text-text-primary">{fmtUZS(c.avgCheck)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-bold text-sm ${c.cancelledSales.length > 0 ? 'text-accent-red' : 'text-text-muted'}`}>
                            {c.cancelledSales.length > 0 ? `${c.cancelledSales.length} ${t('unit_pcs')}` : '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-xs text-text-secondary">
                          {c.avgInterval !== null && c.lastVisit ? (() => {
                            const next = new Date(c.lastVisit)
                            next.setDate(next.getDate() + c.avgInterval)
                            return next.toISOString().slice(0,10)
                          })() : '—'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {c.churnRisk === 'none' ? <span className="text-accent-green text-xs font-bold">{t('rep_cust_active_badge')}</span> :
                           c.churnRisk === 'low' ? <span className="text-yellow-500 text-xs font-bold">{t('rep_risk_low')}</span> :
                           c.churnRisk === 'medium' ? <span className="text-accent-orange text-xs font-bold">{t('rep_risk_medium')}</span> :
                           <span className="text-accent-red text-xs font-bold">{t('rep_risk_high')}</span>}
                        </td>
                        <td className="px-6 py-4 text-text-secondary text-xs">
                          <p>{c.lastVisit}</p>
                          <p className="mt-0.5 font-medium text-accent-orange">{t('rep_days_ago', { days: c.daysSinceLastVisit })}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                total={customerStats.ltvList.length}
                pageSize={CUSTOMERS_PAGE_SIZE}
                page={customersPage}
                onPageChange={setCustomersPage}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-bg-secondary border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-syne font-bold text-text-primary">{t('rep_loyalty_status_title')}</h4>
                  <DetailButton onClick={() => openModal('loyaltyDetailModal')} />
                </div>
                <div className="space-y-4">
                  {[
                    { label:t('rep_tier_bronze'), count:customerStats.loyaltyStats.bronze, color:C.orange, desc:`1-${SILVER_THRESHOLD-1} ${t('rep_visits_suffix')}` },
                    { label:t('rep_tier_silver'), count:customerStats.loyaltyStats.silver, color:C.muted,  desc:`${SILVER_THRESHOLD}-${GOLD_THRESHOLD-1} ${t('rep_visits_suffix')}` },
                    { label:t('rep_tier_gold'),   count:customerStats.loyaltyStats.gold,   color:'#F59E0B', desc:`${GOLD_THRESHOLD}+ ${t('rep_visits_suffix')}` },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-3">
                      <div className="w-16 text-xs font-bold" style={{ color: l.color }}>{l.label}</div>
                      <div className="flex-1 bg-bg-tertiary rounded-full h-6 overflow-hidden">
                        <div className="h-6 rounded-full flex items-center px-2 text-white text-xs font-bold transition-all"
                          style={{ width:`${Math.max(15, (l.count / Math.max(1, customerStats.totalCustomers)) * 100)}%`, backgroundColor: l.color }}>
                          {l.count} {t('unit_pcs')}
                        </div>
                      </div>
                      <div className="text-text-muted text-xs w-24 text-right">{l.desc}</div>
                    </div>
                  ))}
                </div>
                <div className="px-0 py-3 border-t border-border/50 mt-3 flex items-center justify-between gap-3">
                  <button
                    onClick={() => navigate('/management?tab=discounts')}
                    className="text-xs text-accent-blue hover:underline">
                    {t('rep_btn_go_discounts')}
                  </button>
                  <button
                    onClick={() => navigate('/customers')}
                    className="text-xs text-accent-orange hover:underline">
                    {t('rep_btn_go_customers')}
                  </button>
                </div>
              </div>

              <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <div>
                    <h4 className="font-syne font-bold text-text-primary">{t('rep_sources_title')}</h4>
                    <p className="text-text-secondary text-sm">{t('rep_cust_sources_sub')}</p>
                  </div>
                  <DetailButton onClick={() => openModal('customerSourceModal')} />
                </div>
                <div className="divide-y divide-border/50 overflow-y-auto max-h-[220px]">
                  {customerStats.chartSources.map((s, i) => {
                    const total = customerStats.chartSources.reduce((sum, x) => sum + x.count, 0)
                    return (
                      <div key={s.name} className="px-6 py-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-text-primary text-sm">{s.name}</span>
                          <span className="font-bold text-text-primary">{s.count} {t('unit_pcs')}</span>
                        </div>
                        <div className="w-full bg-bg-tertiary rounded-full h-1.5">
                          <div className="h-1.5 rounded-full" style={{
                            width:`${(s.count / total) * 100}%`,
                            backgroundColor: [C.blue,C.green,C.orange,C.purple,C.teal][i % 5]
                          }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {customerStats.churnRiskList.length > 0 && (
              <div className="bg-accent-orange/5 border border-accent-orange/30 rounded-2xl p-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={20} className="text-accent-orange" />
                  <h4 className="font-syne font-bold text-text-primary">
                    {t('rep_risk_warning_title')} — {customerStats.churnRiskList.length} {t('rep_cust_count_suffix')}
                  </h4>
                </div>
                <div className="space-y-2">
                  {customerStats.churnRiskList.map(c => (
                    <div key={c.id}
                      className="bg-bg-secondary rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:border-accent-orange/40 border border-transparent transition-colors"
                      onClick={() => { setSelectedCustomer(c); openModal('customerProfileModal') }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent-orange/10 text-accent-orange flex items-center justify-center font-bold text-sm">
                          {c.name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary text-sm">{c.name}</p>
                          <p className="text-text-muted text-xs">{c.daysSinceLastVisit} {t('rep_days_no_visit_suffix')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.churnRisk === 'high'   ? 'bg-accent-red/10 text-accent-red' :
                          c.churnRisk === 'medium' ? 'bg-accent-orange/10 text-accent-orange' :
                          'bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {c.churnRisk === 'high' ? t('rep_risk_high') : c.churnRisk === 'medium' ? t('rep_risk_medium') : t('rep_risk_low')}
                        </span>
                        {c.instagram && (
                          <a href={`https://ig.me/m/${c.instagram}`} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-border hover:border-accent-blue/40 text-text-secondary hover:text-accent-blue transition-colors">
                            {t('rep_btn_send_dm')}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

             {/* === MODAL: Jami mijozlar === */}
            {modal === 'allCustomersModal' && (() => {
              const q = cstmSearch.toLowerCase()
              const allRows = [...customerStats.ltvList]
                .sort((a,b) => a.name.localeCompare(b.name))
                .filter(r => !q || r.name.toLowerCase().includes(q) || (r.phone||'').includes(q))
              return (
                <Modal open title={t('rep_modal_all_cust_title')} subtitle={t('rep_modal_all_cust_sub')} size="xl" onClose={closeModal}>
                  <input
                    value={cstmSearch} onChange={e => setCstmSearch(e.target.value)}
                    placeholder={t('rep_search_customer')}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-blue/50 mb-4"
                  />
                  <ModalTable
                    data={allRows}
                    pageSize={10}
                    columns={[
                      { key:'name', label:t('rep_col_full_name'), render: r => (
                        <div className="flex items-center gap-3 cursor-pointer"
                          onClick={() => { setSelectedCustomer(r); openModal('customerProfileModal') }}>
                          <div className="w-8 h-8 rounded-full bg-accent-blue/10 text-accent-blue flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {r.name[0]}
                          </div>
                          <div>
                            <p className="font-medium text-text-primary whitespace-nowrap">{r.name}</p>
                            <p className="text-text-muted text-[10px]">{r.birthDate || ''}{r.isBirthdayMonth ? ' 🎂' : ''}</p>
                          </div>
                        </div>
                      )},
                      { key:'phone', label:t('rep_col_tel_ig'), render: r => (
                        <div className="text-xs">
                          <p className="text-text-secondary whitespace-nowrap">{r.phone || '—'}</p>
                          {r.instagram && <p className="text-accent-blue mt-0.5 whitespace-nowrap">@{r.instagram.replace(/^@/,'')}</p>}
                        </div>
                      )},
                      { key:'visits', label:t('rep_col_visit_short'), align:'center', render: r => (
                        <div className="text-center text-xs">
                          <p className="font-bold text-accent-green">{r.qualifiedVisits ?? 0} {t('rep_lbl_qualified')}</p>
                          <p className="text-text-muted">{r.totalVisits} {t('rep_lbl_total')}</p>
                        </div>
                      )},
                      { key:'totalSpent', label:t('rep_col_total_spent'), align:'right', render: r => <span className="font-bold text-text-primary whitespace-nowrap">{fmtUZS(r.totalSpent)}</span> },
                      { key:'loyaltyLevel', label:t('col_tier'), align:'center', render: r => (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase whitespace-nowrap ${
                          r.loyaltyLevel === 'gold'   ? 'bg-yellow-500/10 text-yellow-500' :
                          r.loyaltyLevel === 'silver' ? 'bg-gray-400/10 text-gray-400' :
                          'bg-orange-700/10 text-orange-700'
                        }`}>{r.loyaltyLevel}</span>
                      )},
                      { key:'lastVisit', label:t('rep_col_last_visit'), render: r => (
                        <div className="text-xs">
                          <p className="text-text-secondary whitespace-nowrap">{r.lastVisit}</p>
                          <p className="text-accent-orange mt-0.5">{t('rep_days_ago', { days: r.daysSinceLastVisit })}</p>
                        </div>
                      )},
                      { key:'churnRisk', label:t('rep_col_risk_level'), align:'center', render: r => {
                        if (r.churnRisk === 'none') return <span className="text-accent-green text-xs font-bold">{t('rep_cust_active_badge')}</span>
                        const cls = { high:'text-accent-red', medium:'text-accent-orange', low:'text-yellow-500' }
                        const lbl = { high:t('rep_risk_high_short'), medium:t('rep_risk_medium_short'), low:t('rep_risk_low_short') }
                        return <span className={`text-xs font-bold ${cls[r.churnRisk]}`}>{lbl[r.churnRisk]}</span>
                      }},
                    ]}
                  />
                </Modal>
              )
            })()}

            {/* === MODAL: Mijoz profili === */}
            {modal === 'customerProfileModal' && selectedCustomer && (() => {
              const c = selectedCustomer
              return (
                <Modal open title={c.name} subtitle={[c.phone, c.instagram ? `@${c.instagram}` : null].filter(Boolean).join(' • ') || '—'} size="xl" onClose={closeModal}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {[
                      { label:t('rep_cust_stat_total_spent'), value: fmtUZS(c.totalSpent),  color: C.green  },
                      { label:t('rep_col_visits'),     value: `${c.totalVisits} ${t('unit_pcs')}`, color: C.blue   },
                      { label:t('rep_col_avg_check'),  value: fmtUZS(c.avgCheck),    color: C.orange },
                      { label:t('rep_cust_stat_ltv12m'),      value: fmtUZS(c.ltv12m),      color: C.purple },
                    ].map(item => (
                      <div key={item.label} className="bg-bg-tertiary rounded-xl p-4 text-center">
                        <p className="text-text-muted text-xs mb-1">{item.label}</p>
                        <p className="font-syne font-bold text-lg" style={{ color: item.color }}>{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-bg-tertiary rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                        c.loyaltyLevel === 'gold'   ? 'bg-yellow-500/10 text-yellow-500' :
                        c.loyaltyLevel === 'silver' ? 'bg-gray-400/10 text-gray-400' :
                        'bg-orange-700/10 text-orange-700'
                      }`}>{ { gold: t('rep_tier_gold'), silver: t('rep_tier_silver'), bronze: t('rep_tier_bronze') }[c.loyaltyLevel] || c.loyaltyLevel }</span>
                      <div>
                        <p className="text-text-secondary text-xs">
                          {c.loyaltyReason === "Tashrif soni to'ldi" ? t('rep_cust_level_reason_visits') : (c.loyaltyReason || t('rep_cust_level_reason_visits'))}
                        </p>
                        <p className="text-text-muted text-xs">{c.loyaltyGrantedAt ? `${c.loyaltyGrantedAt}${t('rep_cust_level_granted_suffix')}` : '—'}</p>
                      </div>
                    </div>
                    {c.nextLevel && (
                      <p className="text-text-muted text-xs text-right">
                        <span className="font-bold text-accent-orange">+{c.nextLevel.need} {t('rep_visits_suffix')}</span> → {c.nextLevel.level.toUpperCase()}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                    <div className="bg-bg-tertiary rounded-xl p-3">
                      <p className="text-text-muted text-xs mb-0.5">{t('rep_cust_first_visit')}</p>
                      <p className="font-medium text-text-primary">{c.firstVisit}</p>
                    </div>
                    <div className="bg-bg-tertiary rounded-xl p-3">
                      <p className="text-text-muted text-xs mb-0.5">{t('rep_col_last_visit')}</p>
                      <p className="font-medium text-text-primary">{c.lastVisit}</p>
                      <p className="text-text-muted text-xs">({t('rep_days_ago', { days: c.daysSinceLastVisit })})</p>
                    </div>
                    <div className="bg-bg-tertiary rounded-xl p-3">
                      <p className="text-text-muted text-xs mb-0.5">{t('rep_cust_visit_interval')}</p>
                      <p className="font-medium text-text-primary">{c.avgInterval !== null ? `~${c.avgInterval} ${t('rep_days_suffix')}` : '—'}</p>
                    </div>
                  </div>

                  {(c.instagram || c.phone) && <InstagramDM instagram={c.instagram} phone={c.phone} name={c.name} isBirthdayMonth={c.isBirthdayMonth} birthDate={c.birthDate} />}

                  <p className="text-text-secondary text-sm font-medium mb-3">{t('rep_cust_sales_history_title')} ({c.customerSales.length} {t('unit_pcs')})</p>
                  {c.customerSales.length === 0
                    ? <p className="text-text-muted text-sm text-center py-4">{t('rep_no_sales')}</p>
                    : <ModalTable
                        data={[...c.customerSales].sort((a,b) => b.soldAt.localeCompare(a.soldAt))}
                        pageSize={5}
                        columns={[
                          { key:'soldAt',      label:t('col_date'),     render: r => fmtSoldAt(r.soldAt) },
                          { key:'items',       label:t('col_product'),    render: r => <span className="text-xs text-text-secondary">{fmtItems(r.items)}</span> },
                          { key:'total',       label:t('col_amount'),    align:'right', render: r => <span className="font-bold text-text-primary">{fmtUZS(r.total)}</span> },
                          { key:'discount',    label:t('col_discount'), align:'center', render: r => r.discount > 0 ? <span className="text-accent-orange font-bold">{r.discount}%</span> : '—' },
                          { key:'paymentType', label:t('rep_col_payment'),   align:'center', render: r => (
                            <span className="px-2 py-0.5 rounded bg-bg-tertiary border border-border text-[10px] font-bold uppercase text-text-secondary">
                              {{ cash: t('pay_cash'), card: t('pay_card'), installment: t('pay_installment') }[r.paymentType]}
                            </span>
                          )},
                        ]}
                      />
                  }
                  {c.discountSales.length > 0 && (
                    <div className="mt-4 bg-accent-orange/5 border border-accent-orange/20 rounded-xl px-4 py-3">
                      <p className="text-accent-orange text-xs font-bold">
                        {t('rep_cust_promo_used_prefix')}{c.discountSales.length}{t('rep_times_dot_suffix')}
                        {t('rep_cust_saved_amount_prefix')}{fmtUZS(c.discountSales.reduce((s,x) => s+(x.subtotal-x.total), 0))}
                      </p>
                    </div>
                  )}
                </Modal>
              )
            })()}

            {/* === MODAL: Qaytish darajasi === */}
            {modal === 'retentionModal' && (() => {
              const q = cstmSearch.toLowerCase()
              const retRows = [...customerStats.ltvList]
                .filter(c => c.qualifiedVisits > 1 && (!q || c.name.toLowerCase().includes(q)))
                .sort((a,b) => a.name.localeCompare(b.name))
              return (
              <Modal open title={t('rep_modal_retention_title')} subtitle={t('rep_modal_retention_sub')} size="xl" onClose={closeModal}>
                {/* Oylik kartochkalar — gorizontal scroll */}
                <div className="flex items-center justify-end mb-2"><MonthSortBtn /></div>
                <div className="flex gap-3 overflow-x-auto pb-2 mb-4">
                  {sortMonths(customerStats.monthlyRetention).map(m => (
                    <div key={m.month} className="bg-bg-tertiary rounded-xl p-4 min-w-[180px] flex-shrink-0">
                      <p className="text-text-muted text-xs font-medium mb-1">{m.name}</p>
                      <p className="font-syne font-bold text-accent-green text-2xl">{m.retentionRate}%</p>
                      <div className="flex justify-between mt-2 text-xs">
                        <span className="text-text-muted">{t('rep_lbl_new_colon')}<span className="font-bold" style={{ color: C.blue }}>{m.newCount}</span></span>
                        <span className="text-text-muted">{t('rep_lbl_return_colon')}<span className="font-bold" style={{ color: C.green }}>{m.returnCount}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Trend grafik */}
                <div className="mb-4">
                  <p className="text-text-secondary text-sm font-medium mb-2">{t('rep_retention_trend_title')}</p>
                  <MonthlyDynamicsChart data={[...customerStats.monthlyRetention].reverse()} dataKey="retentionRate" color={C.green} formatter={v => `${v}%`} name={t('rep_cust_retention')} />
                </div>
                {/* Qayta kelgan mijozlar to'liq tarixi */}
                <div className="flex items-center justify-between mb-3">
                  <p className="text-text-secondary text-sm font-medium">{t('rep_retention_list_title')}</p>
                </div>
                <input
                  value={cstmSearch} onChange={e => setCstmSearch(e.target.value)}
                  placeholder={t('rep_search_name')}
                  className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-blue/50 mb-3"
                />
                <div className="space-y-3 mb-6">
                  {retRows.map(c => (
                    <div key={c.id} className="bg-bg-tertiary rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent-green/10 text-accent-green flex items-center justify-center font-bold text-sm">{c.name[0]}</div>
                          <div>
                            <p className="font-medium text-text-primary">{c.name}</p>
                            <p className="text-text-muted text-xs">{c.qualifiedVisits}{t('rep_lbl_qualified_slash')}{c.totalVisits}{t('rep_lbl_total_visits_suffix')}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.churnRisk === 'none' ? 'bg-accent-green/10 text-accent-green' :
                          c.churnRisk === 'low'  ? 'bg-yellow-500/10 text-yellow-500' :
                          c.churnRisk === 'medium' ? 'bg-accent-orange/10 text-accent-orange' :
                          'bg-accent-red/10 text-accent-red'
                        }`}>
                          {c.churnRisk === 'none' ? t('rep_cust_active_badge') : c.churnRisk === 'low' ? t('rep_risk_low') : c.churnRisk === 'medium' ? t('rep_risk_medium') : t('rep_risk_high')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2 max-h-20 overflow-y-auto pr-1">
                        {c.customerSales.map((s,i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-accent-green/10 text-accent-green text-[10px] font-bold whitespace-nowrap">
                            {s.soldAt?.slice(0,10)} — {fmtUZS(s.total)}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-muted">{t('rep_col_last_visit')}: <span className="font-bold text-text-primary">{c.lastVisit}</span></span>
                        <span className="text-text-muted">{t('rep_days_ago', { days: c.daysSinceLastVisit })}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Uzoqlashish xavfi */}
                {customerStats.churnRiskList.length > 0 && (
                  <div>
                    <p className="text-text-secondary text-sm font-medium mb-3">
                      {t('rep_churn_risk_warning_prefix')}{customerStats.churnRiskList.length} {t('rep_cust_count_suffix')}
                    </p>
                    <div className="space-y-2">
                      {customerStats.churnRiskList.map(c => (
                        <div key={c.id} className="bg-bg-tertiary rounded-xl px-4 py-3 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-text-primary text-sm">{c.name}</p>
                            <p className="text-text-muted text-xs">
                              {t('rep_col_last_visit_prefix')}{c.lastVisit} — <span className="font-bold text-accent-orange">{t('rep_days_ago', { days: c.daysSinceLastVisit })}</span>
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.churnRisk === 'high' ? 'bg-accent-red/10 text-accent-red' :
                            c.churnRisk === 'medium' ? 'bg-accent-orange/10 text-accent-orange' :
                            'bg-yellow-500/10 text-yellow-500'
                          }`}>
                            {c.churnRisk === 'high' ? t('rep_risk_high_short') : c.churnRisk === 'medium' ? t('rep_risk_medium_short') : t('rep_risk_low_short')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Modal>
              )
            })()}

            {/* === MODAL: LTV tahlili === */}
            {modal === 'ltvModal' && (() => {
              const q = cstmSearch.toLowerCase()
              const ltvRows = [...customerStats.ltvList]
                .sort((a,b) => a.name.localeCompare(b.name))
                .filter(r => !q || r.name.toLowerCase().includes(q))
              return (
              <Modal open title={t('rep_modal_ltv_title')} subtitle={t('rep_modal_ltv_sub')} size="lg" onClose={closeModal}>
                <div className="bg-bg-tertiary rounded-xl p-4 mb-4 text-center">
                  <p className="text-text-muted text-xs mb-1">{t('rep_cust_ltv_sub')}</p>
                  <p className="font-syne font-bold text-3xl" style={{ color: C.purple }}>{fmtUZS(customerStats.avgLTV)}</p>
                </div>
                <input
                  value={cstmSearch} onChange={e => setCstmSearch(e.target.value)}
                  placeholder={t('rep_search_name')}
                  className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-blue/50 mb-4"
                />
                <div className="space-y-3">
                  {ltvRows.map((c, i) => (
                    <div key={c.id}
                      className="bg-bg-tertiary rounded-xl px-4 py-4 cursor-pointer hover:bg-bg-secondary transition-colors"
                      onClick={() => { setSelectedCustomer(c); openModal('customerProfileModal') }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ backgroundColor:[C.purple,C.blue,C.teal][i%3]+'22', color:[C.purple,C.blue,C.teal][i%3] }}>
                            {i+1}
                          </span>
                          <div>
                            <p className="font-medium text-text-primary">{c.name}</p>
                            <p className="text-text-muted text-xs">{c.qualifiedVisits ?? c.totalVisits}{t('rep_qualified_visits_suffix')}{c.avgInterval ? <>• ~{c.avgInterval} {t('rep_days_interval_suffix')}</> : ''}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-syne font-bold" style={{ color: C.purple }}>{fmtUZS(c.ltv12m)}</p>
                          <p className="text-text-muted text-xs">{t('rep_cust_ltv_desc')}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-center">
                        <div><p className="text-text-muted">{t('rep_lbl_total_sum')}</p><p className="font-bold text-text-primary">{fmtUZS(c.totalSpent)}</p></div>
                        <div><p className="text-text-muted">{t('rep_lbl_monthly')}</p><p className="font-bold text-text-primary">{fmtUZS(c.avgMonthly)}</p></div>
                        <div><p className="text-text-muted">{t('rep_col_avg_check')}</p><p className="font-bold text-text-primary">{fmtUZS(c.avgCheck)}</p></div>
                      </div>
                      {c.nextLevel && (
                        <div className="mt-2 pt-2 border-t border-border/50 text-xs text-text-muted">
                          {c.nextLevel.level.toUpperCase()}{t('rep_loyalty_need_prefix')}<span className="font-bold text-accent-orange">{c.nextLevel.need} {t('rep_visits_suffix')}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Modal>
              )
            })()}

            {/* === MODAL: Silver+ mijozlar === */}
            {modal === 'silverPlusModal' && (() => {
              const q = cstmSearch.toLowerCase()
              const silverRows = [...customerStats.ltvList]
                .filter(c => c.loyaltyLevel !== 'bronze')
                .sort((a,b) => a.name.localeCompare(b.name))
                .filter(r => !q || r.name.toLowerCase().includes(q))
              return (
              <Modal open title={t('rep_modal_silver_gold_title')} subtitle={t('rep_modal_silver_gold_sub')} size="lg" onClose={closeModal}>
                <input
                  value={cstmSearch} onChange={e => setCstmSearch(e.target.value)}
                  placeholder={t('rep_search_name')}
                  className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-blue/50 mb-4"
                />
                {silverRows.length === 0
                  ? <p className="text-text-muted text-center py-8">{t('rep_no_silver_plus')}</p>
                  : <div className="space-y-4">
                      {silverRows.map(c => {
                        const beforeSales = c.customerSales.filter(s => s.soldAt < c.loyaltyGrantedAt)
                        const afterSales  = c.customerSales.filter(s => s.soldAt >= c.loyaltyGrantedAt)
                        const beforeAvg   = beforeSales.length > 0 ? Math.round(beforeSales.reduce((s,x)=>s+x.total,0)/beforeSales.length) : 0
                        const afterAvg    = afterSales.length  > 0 ? Math.round(afterSales.reduce((s,x)=>s+x.total,0)/afterSales.length)   : 0
                        return (
                          <div key={c.id}
                            className="bg-bg-tertiary rounded-xl p-5 cursor-pointer hover:bg-bg-secondary transition-colors"
                            onClick={() => { setSelectedCustomer(c); openModal('customerProfileModal') }}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center font-bold">
                                  {c.name[0]}
                                </div>
                                <div>
                                  <p className="font-syne font-bold text-text-primary">{c.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                      c.loyaltyLevel === 'gold' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-gray-400/10 text-gray-400'
                                    }`}>{{ gold: t('rep_tier_gold'), silver: t('rep_tier_silver') }[c.loyaltyLevel] || c.loyaltyLevel}</span>
                                    <span className="text-text-muted text-xs">{c.qualifiedVisits ?? 0} {t('rep_lbl_qualified')}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-text-muted text-xs mb-0.5">{t('rep_col_granted_date')}</p>
                                <p className="text-text-primary font-medium">{c.loyaltyGrantedAt}</p>
                                <p className="text-text-muted text-xs mb-0.5 mt-2">{t('rep_col_grant_reason')}</p>
                                <p className="text-text-primary text-sm font-medium">
                                  {c.loyaltyReason === "Tashrif soni to'ldi" ? t('rep_cust_level_reason_visits') : c.loyaltyReason}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-3">
                              <div className="bg-bg-secondary rounded-xl p-4">
                                <p className="text-text-muted text-xs mb-2">{t('rep_lbl_before_tier_avg')}</p>
                                <p className="font-syne font-bold text-text-primary text-lg">{beforeAvg > 0 ? fmtUZS(beforeAvg) : t('rep_no_data')}</p>
                                <p className="text-text-muted text-xs mt-1">{beforeSales.length} {t('rep_sales_base_suffix')}</p>
                              </div>
                              <div className="bg-bg-secondary rounded-xl p-4">
                                <p className="text-text-muted text-xs mb-2">{t('rep_lbl_after_tier_avg')}</p>
                                <p className="font-syne font-bold text-accent-green text-lg">{afterAvg > 0 ? fmtUZS(afterAvg) : t('rep_no_data')}</p>
                                <p className="text-text-muted text-xs mt-1">{afterSales.length} {t('rep_sales_base_suffix')}</p>
                              </div>
                            </div>
                            {beforeAvg > 0 && afterAvg > 0 && (
                              <div className="mt-2 text-xs text-center">
                                <GrowthBadge current={afterAvg} previous={beforeAvg} />
                                <span className="text-text-muted ml-1">{t('rep_lbl_after_tier_badge_desc')}</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                }
              </Modal>
              )
            })()}

            {/* === MODAL: Sodiqlik dasturi batafsil === */}
            {modal === 'loyaltyDetailModal' && (() => {
              const q = cstmSearch.toLowerCase()
              return (
              <Modal open title={t('rep_cust_loyalty_sub')} subtitle={t('rep_modal_loyalty_detail_sub')} size="lg" onClose={closeModal}>
                <input
                  value={cstmSearch} onChange={e => setCstmSearch(e.target.value)}
                  placeholder={t('rep_search_name')}
                  className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-blue/50 mb-4"
                />
                {[
                  { level:'gold',   label:t('rep_tier_gold'),   color:'#F59E0B', desc:`${GOLD_THRESHOLD}+ ${t('rep_visits_suffix')}` },
                  { level:'silver', label:t('rep_tier_silver'), color: C.muted,  desc:`${SILVER_THRESHOLD}-${GOLD_THRESHOLD-1} ${t('rep_visits_suffix')}` },
                  { level:'bronze', label:t('rep_tier_bronze'), color: C.orange, desc:`1-${SILVER_THRESHOLD-1} ${t('rep_visits_suffix')}` },
                ].map(tier => {
                  const members = [...customerStats.ltvList]
                    .filter(c => c.loyaltyLevel === tier.level && (!q || c.name.toLowerCase().includes(q)))
                    .sort((a,b) => a.name.localeCompare(b.name))
                  return (
                    <div key={tier.level} className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tier.color }} />
                        <h4 className="font-syne font-bold text-text-primary">{tier.label}</h4>
                        <span className="text-text-muted text-xs">({tier.desc})</span>
                        <span className="ml-auto font-bold text-text-primary">{members.length} {t('unit_pcs')}</span>
                      </div>
                      {members.length === 0
                        ? <p className="text-text-muted text-sm text-center py-3 bg-bg-tertiary rounded-xl">{t('rep_no_data')}</p>
                        : <div className="space-y-2">
                            {members.map(c => (
                              <div key={c.id}
                                className="bg-bg-tertiary rounded-xl px-4 py-4 flex items-center justify-between cursor-pointer hover:bg-bg-secondary transition-colors"
                                onClick={() => { setSelectedCustomer(c); openModal('customerProfileModal') }}>
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                                    style={{ backgroundColor: tier.color+'22', color: tier.color }}>
                                    {c.name[0]}
                                  </div>
                                  <div>
                                    <p className="font-syne font-bold text-text-primary">{c.name}</p>
                                    <p className="text-text-muted text-sm mt-0.5">{c.totalVisits} {t('rep_visits_suffix')} • {fmtUZS(c.totalSpent)}</p>
                                  </div>
                                </div>
                                {c.nextLevel && (
                                  <div className="text-right">
                                    <p className="text-text-muted text-xs">{t('rep_lbl_next_level')}</p>
                                    <p className="font-bold text-sm" style={{ color: tier.color }}>
                                      +{c.nextLevel.need} {t('rep_visits_suffix')} → {c.nextLevel.level.toUpperCase()}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                      }
                    </div>
                  )
                })}
              </Modal>
              )
            })()}

            {/* === MODAL: Mijoz manbalari batafsil === */}
            {modal === 'customerSourceModal' && (
              <Modal open title={t('rep_sources_title')} subtitle={t('rep_modal_sources_detail_sub')} size="lg" onClose={closeModal}>
                <div className="space-y-4">
                  {customerStats.chartSources.map((s, i) => {
                    const colors = [C.blue, C.green, C.orange, C.purple, C.teal]
                    const color  = colors[i % colors.length]
                    const members = customerStats.ltvList.filter(c =>
                      MOCK_SALES.some(sale => sale.customerId === c.id && sale.source === s.key)
                    )
                    return (
                      <div key={s.key} className="bg-bg-tertiary rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                            <h4 className="font-syne font-bold text-text-primary">{s.name}</h4>
                          </div>
                          <span className="font-bold text-text-primary">{fmtUZS(s.revenue)}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-3 text-xs text-center">
                          <div className="bg-bg-secondary rounded-lg p-2">
                            <p className="text-text-muted">{t('perm_sales')}</p>
                            <p className="font-bold text-text-primary">{s.count} {t('unit_pcs')}</p>
                          </div>
                          <div className="bg-bg-secondary rounded-lg p-2">
                            <p className="text-text-muted">{t('rep_col_unique_customers')}</p>
                            <p className="font-bold text-text-primary">{s.uniqueCustomers} {t('unit_pcs')}</p>
                          </div>
                          <div className="bg-bg-secondary rounded-lg p-2">
                            <p className="text-text-muted">{t('rep_col_avg_check')}</p>
                            <p className="font-bold text-text-primary">{fmtUZS(s.avgCheck)}</p>
                          </div>
                        </div>
                        {members.length > 0 && (
                          <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
                            {[...members].sort((a,b) => a.name.localeCompare(b.name)).map(c => (
                              <span key={c.id}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-bg-secondary border border-border text-text-primary cursor-pointer hover:border-accent-red/40 transition-colors whitespace-nowrap"
                                onClick={() => { setSelectedCustomer(c); openModal('customerProfileModal') }}>
                                {c.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                  <p className="text-text-muted text-sm">{t('rep_lbl_add_new_source')}</p>
                  <button
                    onClick={() => {
                      closeModal()
                      // Boshqaruv sahifasi → Sozlamalar tab → Mijoz manbalari kartasiga
                      navigate('/management?tab=settings')
                    }}
                    className="px-4 py-2 rounded-xl text-sm font-bold bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 border border-accent-blue/30 transition-colors">
                    {t('rep_btn_go_management')}
                  </button>
                </div>
              </Modal>
            )}
          </>

  )
}

export default CustomersTab
