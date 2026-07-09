import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, CreditCard, DollarSign, Package, TrendingUp, Truck, Users, Wallet } from 'lucide-react'
import { C, DetailButton, Modal, ModalTable, MonthYearFilter, MonthlyDynamicsChart, TODAY, fmtItems, fmtNum, fmtSoldAt, fmtUSD, fmtUZS } from '../components/shared'

const FinanceTab = ({ ctx }) => {
  const { t, i18n } = useTranslation()
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
    MOCK_SALES, MOCK_INCOME_BATCHES, MOCK_EXPENSES, MOCK_CAPITAL, MOCK_PRODUCTS, MOCK_SUPPLIERS,
  } = ctx

  return (
          !isPrivileged ? <LockedTab /> : (
            <>
              {financeStats.overdueDebts.length > 0 && (
                <div className="bg-accent-red/15 border-2 border-accent-red/40 rounded-2xl p-5 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={18} className="text-accent-red" />
                      <span className="font-syne font-bold text-accent-red">
                        {t('rep_fin_overdue_alert', { count: financeStats.overdueDebts.length })}
                      </span>
                    </div>
                    <DetailButton onClick={() => openModal('overdueAlertModal')} />
                  </div>
                  <div className="space-y-2">
                    {financeStats.overdueDebts.map(x => (
                      <div key={x.id} className="flex items-center justify-between bg-accent-red/5 rounded-xl px-4 py-2.5">
                        <div>
                          <span className="text-text-primary text-sm font-medium">{x.productName}</span>
                          {x.supplierName && (
                            <span className="text-text-muted text-xs ml-2">• {x.supplierName}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-accent-red text-xs font-bold px-2 py-0.5 rounded bg-accent-red/10">
                            {t('rep_fin_days_overdue', { days: financeStats.getDaysOverdue(x.dueDate) })}
                          </span>
                          <span className="font-bold text-accent-red text-sm">${x.debtUSD}</span>
                          {x.supplierPhone && (
                            <span className="text-text-muted text-xs">{x.supplierPhone}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {financeStats.urgentDebts.length > 0 && (
                <div className="bg-accent-orange/10 border border-accent-orange/30 rounded-2xl p-5 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={18} className="text-accent-orange" />
                      <span className="font-syne font-bold text-accent-orange">
                        {t('rep_fin_urgent_alert', { count: financeStats.urgentDebts.length })}
                      </span>
                    </div>
                    <DetailButton onClick={() => openModal('urgentAlertModal')} />
                  </div>
                  <div className="space-y-2">
                    {financeStats.urgentDebts.map(x => (
                      <div key={x.id} className="flex items-center justify-between bg-accent-orange/5 rounded-xl px-4 py-2.5">
                        <div>
                          <span className="text-text-primary text-sm font-medium">{x.productName}</span>
                          {x.supplierName && (
                            <span className="text-text-muted text-xs ml-2">• {x.supplierName}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-accent-orange text-xs font-bold px-2 py-0.5 rounded bg-accent-orange/10">
                            {t('rep_fin_days_left', { days: financeStats.getDaysUntil(x.dueDate) })}
                          </span>
                          <span className="font-bold text-accent-orange text-sm">${x.debtUSD}</span>
                          <span className="text-text-muted text-xs">{x.dueDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 1-qator */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="cursor-pointer" onClick={() => openModal('inventoryPayModal')}>
                  <StatCard icon={Package} label={t('rep_fin_inventory_purchases')} value={fmtUZS(profitStats.inventoryTotal)} sub={t('rep_fin_payments_to_suppliers')} color="bg-accent-blue/10 text-accent-blue" />
                </div>
                <div className="cursor-pointer" onClick={() => openModal('supplierDebtModal')}>
                  <StatCard icon={CreditCard} label={t('rep_fin_supplier_debt')}
                    value={`$${financeStats.totalDebtUSD}`}
                    sub={t('rep_fin_equivalent', { amount: fmtUZS(Math.round(financeStats.totalDebtUSD * USD_RATE)) })}
                    color="bg-accent-orange/10 text-accent-orange" />
                </div>
                <div className="cursor-pointer" onClick={() => openModal('receivableModal')}>
                  <StatCard icon={Users} label={t('rep_fin_expected_from_customers')}
                    value={fmtUZS(financeStats.installmentReceivable)}
                    sub={t('rep_fin_installment_sales_count', { count: financeStats.installmentSales.length })}
                    color="bg-purple-500/10 text-purple-500" />
                </div>
                <div className="bg-bg-secondary border border-border rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-text-secondary text-sm font-medium">{t('rep_fin_usd_rate')}</p>
                    <DollarSign size={20} className="text-accent-green" />
                  </div>
                  <h3 className="text-2xl font-syne font-bold text-text-primary">{USD_RATE.toLocaleString()}</h3>
                  <p className="text-text-muted text-xs mt-1">{t('rep_fin_usd_rate_desc')}</p>
                </div>
              </div>

              {/* 2-qator */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div className="cursor-pointer" onClick={() => openModal('injectedModal')}>
                  <StatCard icon={ArrowUpRight} label={t('rep_fin_capital_injected')}
                    value={fmtUZS(financeStats.totalInjected)}
                    sub={period === 'all' ? t('rep_all_time') : t('rep_selected_period')}
                    color="bg-accent-green/10 text-accent-green" />
                </div>
                <div className="cursor-pointer" onClick={() => openModal('returnedModal')}>
                  <StatCard icon={ArrowDownRight} label={t('rep_fin_capital_returned')}
                    value={fmtUZS(financeStats.totalReturned)}
                    sub={t('rep_fin_returned_pct', { pct: financeStats.returnPct })}
                    color="bg-accent-red/10 text-accent-red" />
                </div>
                <div className="cursor-pointer" onClick={() => openModal('netCapitalModal')}>
                  <StatCard icon={Wallet} label={t('rep_fin_net_capital_balance')}
                    value={fmtUZS(financeStats.netCapital)}
                    sub={t('rep_fin_injected_minus_returned')}
                    color="bg-accent-blue/10 text-accent-blue" />
                </div>
                <div className="bg-bg-secondary border border-border rounded-2xl p-5 cursor-pointer hover:border-accent-green/40 transition-colors" onClick={() => openModal('roiModal')}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-text-secondary text-sm font-medium">{t('rep_fin_roi')}</p>
                    <TrendingUp size={20} className="text-accent-purple" />
                  </div>
                  <h3 className="text-2xl font-syne font-bold" style={{ color: financeStats.roi !== null ? (financeStats.roi >= 0 ? C.green : C.red) : C.muted }}>
                    {financeStats.roi !== null ? `${financeStats.roi}%` : '—'}
                  </h3>
                  <p className="text-text-muted text-xs mt-1">{t('rep_fin_roi_desc')}</p>
                </div>
              </div>

              {/* MOCK — replace with: GET /api/finance/cash-balance */}
              <div className={`rounded-2xl p-6 border-2 mt-6 cursor-pointer hover:opacity-90 transition-opacity ${financeStats.cashBalance >= 0 ? 'border-accent-green bg-accent-green/5' : 'border-accent-red bg-accent-red/5'}`}
                onClick={() => openModal('cashFlowModal')}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-text-secondary text-sm font-medium mb-1">{t('rep_fin_cash_balance')}</p>
                    <h2 className="text-4xl font-syne font-extrabold" style={{ color: financeStats.cashBalance >= 0 ? C.green : C.red }}>
                      {fmtUZS(financeStats.cashBalance)}
                    </h2>
                    <p className="text-text-muted text-xs mt-1">{t('rep_fin_cash_balance_desc')}</p>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-text-secondary text-sm font-medium mb-1">{t('rep_fin_next_month_fixed_exp')}</p>
                      <p className="text-xl font-syne font-bold text-text-primary">{fmtUZS(financeStats.fixedNextMonth)}</p>
                    </div>
                    <Activity size={48} style={{ color: financeStats.cashBalance >= 0 ? C.green : C.red, opacity: 0.3 }} />
                  </div>
                </div>
              </div>

              {/* Nasiya tashkilotlari hisoboti */}
              {financeStats.orgStats && financeStats.orgStats.length > 0 && (
                <div className="bg-bg-secondary border border-border rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h4 className="font-syne font-bold text-text-primary">{t('rep_fin_installment_org_report')}</h4>
                      <p className="text-text-secondary text-sm">{t('rep_fin_installment_status_desc')}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-muted">
                      <span>{t('rep_fin_total_commission')} <span className="font-bold text-accent-red">{fmtUZS(financeStats.totalInstallmentCommission)}</span></span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                    {financeStats.orgStats.map(org => (
                      <div key={org.id} className="bg-bg-tertiary rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-syne font-bold text-text-primary">{org.name}</p>
                            <p className="text-text-muted text-xs">{t('rep_fin_org_sales_info', { count: org.salesCount, pct: org.commissionPercent })}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            org.paidPct >= 80 ? 'bg-accent-green/10 text-accent-green' :
                            org.paidPct >= 50 ? 'bg-accent-orange/10 text-accent-orange' :
                            'bg-accent-red/10 text-accent-red'
                          }`}>
                            {t('rep_fin_pct_paid', { pct: org.paidPct })}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-bg-secondary rounded-xl p-3">
                            <p className="text-text-muted text-xs mb-0.5">{t('rep_fin_col_total_amount')}</p>
                            <p className="font-bold text-text-primary">{fmtUZS(org.totalAmount)}</p>
                          </div>
                          <div className="bg-bg-secondary rounded-xl p-3">
                            <p className="text-text-muted text-xs mb-0.5">{t('rep_fin_col_paid')}</p>
                            <p className="font-bold text-accent-green">{fmtUZS(org.totalPaid)}</p>
                          </div>
                          <div className="bg-bg-secondary rounded-xl p-3">
                            <p className="text-text-muted text-xs mb-0.5">{t('rep_fin_col_debt')}</p>
                            <p className="font-bold text-accent-orange">{fmtUZS(org.totalDebt)}</p>
                          </div>
                          <div className="bg-bg-secondary rounded-xl p-3">
                            <p className="text-text-muted text-xs mb-0.5">{t('rep_fin_col_commission')}</p>
                            <p className="font-bold text-accent-red">{fmtUZS(org.totalCommission)}</p>
                          </div>
                        </div>

                        {/* To'lov progressi */}
                        <div className="w-full bg-bg-secondary rounded-full h-2">
                          <div className="h-2 rounded-full transition-all"
                            style={{
                              width: `${org.paidPct}%`,
                              backgroundColor: org.paidPct >= 80 ? C.green : org.paidPct >= 50 ? C.orange : C.red
                            }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Grafik */}
                  {financeStats.orgStats.some(o => o.totalAmount > 0) && (
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={financeStats.orgStats.filter(o => o.totalAmount > 0)}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                          <XAxis dataKey="name" fontSize={11} stroke="var(--text-muted)" />
                          <YAxis hide />
                          <Tooltip
                             cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                             contentStyle={{ backgroundColor:'var(--bg-secondary)', borderColor:'var(--border)', borderRadius:'12px', color:'var(--text-primary)' }}
                             itemStyle={{ color:'var(--text-primary)', fontSize:'12px' }}
                             formatter={v => fmtUZS(v)}
                             offset={10}
                             isAnimationActive={false}
                             wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }}
                          />
                          <Legend iconType="circle" />
                          <Bar dataKey="totalPaid"   name={t('rep_fin_col_paid')}    fill={C.green}  radius={[4,4,0,0]} />
                          <Bar dataKey="totalDebt"   name={t('rep_fin_col_debt')}  fill={C.orange} radius={[4,4,0,0]} />
                          <Bar dataKey="totalCommission" name={t('rep_fin_col_commission')} fill={C.red}   radius={[4,4,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-bg-secondary border border-border rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h4 className="font-syne font-bold text-text-primary">{t('rep_fin_cash_flow')}</h4>
                    <p className="text-text-secondary text-sm">{t('rep_fin_cash_flow_desc')}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setShowAllCfMonths(v => !v)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-accent-red transition-colors"
                    >
                      {showAllCfMonths ? t('rep_fin_last_3_months') : t('rep_fin_all_months', { count: financeStats.monthlyCashFlow.length })}
                    </button>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C.green }} />
                      <span className="text-text-secondary text-xs">{t('col_margin')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C.red }} />
                      <span className="text-text-secondary text-xs">{t('rep_fin_legend_total_expense')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C.blue }} />
                      <span className="text-text-secondary text-xs">{t('rep_fin_flow_monthly_net')}</span>
                    </div>
                  </div>
                </div>
                <div className="h-[220px] w-full mb-5">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={showAllCfMonths ? financeStats.monthlyCashFlow : financeStats.monthlyCashFlow.slice(-3)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="name" fontSize={11} stroke="var(--text-muted)" />
                      <YAxis hide />
                      <Tooltip
                        cursor={{ stroke:'var(--border)', strokeWidth:1 }}
                        contentStyle={{ backgroundColor:'var(--bg-secondary)', borderColor:'var(--border)', borderRadius:'12px', color:'var(--text-primary)' }}
                        itemStyle={{ color:'var(--text-primary)', fontSize:'12px' }}
                        formatter={v => fmtUZS(v)}
                        offset={10}
                        isAnimationActive={false}
                        wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }} />
                      <Line type="monotone" dataKey="margin"   stroke={C.green} strokeWidth={2.5} dot={{ fill:C.green, r:4 }} name={t('col_margin')} />
                      <Line type="monotone" dataKey="chiqim"   stroke={C.red}   strokeWidth={2}   dot={{ fill:C.red,   r:3 }} name={t('rep_fin_legend_total_expense')} strokeDasharray="4 3" />
                      <Line type="monotone" dataKey="net"      stroke={C.blue}  strokeWidth={2.5} dot={{ fill:C.blue,  r:4 }} name={t('col_net_profit')} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {(showAllCfMonths ? financeStats.monthlyCashFlow : financeStats.monthlyCashFlow.slice(-3)).map(m => (
                    <div key={m.month} className="bg-bg-tertiary rounded-xl p-4">
                      <p className="text-text-muted text-xs font-bold mb-2">{m.name}</p>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-text-muted text-xs">{t('rep_fin_flow_sales_margin')}</span>
                        <span className="font-bold text-accent-green text-xs">+{fmtUZS(m.margin)}</span>
                      </div>
                      {m.qarz > 0 && (
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-text-muted text-xs">{t('rep_fin_flow_new_debt')}</span>
                          <span className="text-accent-red text-xs">−{fmtUZS(m.qarz)}</span>
                        </div>
                      )}
                      {m.invPayment > 0 && (
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-text-muted text-xs">{t('rep_fin_flow_supplier_payment')}</span>
                          <span className="text-accent-green text-xs">+{fmtUZS(m.invPayment)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-text-muted text-xs">{t('rep_fin_flow_shop_expense')}</span>
                        <span className="text-accent-red text-xs">−{fmtUZS(m.shopExp)}</span>
                      </div>
                      {m.jalb > 0 && (
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-text-muted text-xs">{t('rep_fin_flow_capital_inject')}</span>
                          <span className="text-accent-green text-xs">+{fmtUZS(m.jalb)}</span>
                        </div>
                      )}
                      {m.capReturn > 0 && (
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-text-muted text-xs">{t('rep_fin_flow_capital_return')}</span>
                          <span className="text-accent-red text-xs">−{fmtUZS(m.capReturn)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1 border-t border-border/50 mt-1">
                        <span className="text-text-muted text-xs font-bold">{t('rep_fin_flow_monthly_net')}</span>
                        <span className="font-bold text-xs" style={{ color: m.net >= 0 ? C.blue : C.red }}>{m.net >= 0 ? '+' : ''}{fmtUZS(m.net)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-text-muted text-xs font-bold">{t('rep_fin_flow_total_balance')}</span>
                        <span className="font-bold text-xs" style={{ color: m.cumNet >= 0 ? C.green : C.red }}>{fmtUZS(m.cumNet)}</span>
                      </div>
                      {m.growth !== null && (
                        <div className="mt-1">
                          <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${m.growth >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                            {m.growth >= 0 ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                            {Math.abs(m.growth)}%
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-6 mt-6">
                {/* Kapital harakati */}
                <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden w-full">
                  <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <h4 className="font-syne font-bold text-text-primary">{t('exp_tab_capital')}</h4>
                    <MonthYearFilter value={modalFilter} onChange={setModalFilter} />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-bg-tertiary border-b border-border">
                          <th className="text-left px-4 py-3 font-medium text-text-secondary whitespace-nowrap cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('capital', 'date')}>
                            {t('col_date')} <SortIcon table="capital" col="date" />
                          </th>
                          <th className="text-center px-4 py-3 font-medium text-text-secondary whitespace-nowrap cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('capital', 'type')}>
                            {t('rep_fin_col_type')} <SortIcon table="capital" col="type" />
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-text-secondary">{t('col_source')}</th>
                          <th className="text-right px-4 py-3 font-medium text-text-secondary whitespace-nowrap cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('capital', 'amountUZS')}>
                            {t('col_amount')} <SortIcon table="capital" col="amountUZS" />
                          </th>
                          <th className="text-right px-4 py-3 font-medium text-text-secondary whitespace-nowrap">{t('rep_fin_col_balance')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {(() => {
                          const filteredCapData = modalFilter === 'all'
                            ? financeStats.capitalWithRunning
                            : financeStats.capitalWithRunning.filter(c => c.date && c.date.startsWith(modalFilter))
                          return filteredCapData.map((c) => (
                          <tr key={c.id} className="hover:bg-bg-tertiary transition-colors">
                            <td className="px-4 py-3 text-text-muted whitespace-nowrap">{c.date}</td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                c.type === 'inject' ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-blue/10 text-accent-blue'
                              }`}>
                                {c.type === 'inject' ? t('rep_fin_badge_inject') : t('rep_fin_badge_return')}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-text-secondary text-sm">{i18n.language === 'ru' ? (c.sourceRu || c.source) : c.source}</td>
                            <td className="px-4 py-3 text-right font-bold text-text-primary whitespace-nowrap">{fmtUZS(c.amountUZS)}</td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <span className={`font-bold text-sm ${c.runningTotal >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                                {fmtUZS(c.runningTotal)}
                              </span>
                            </td>
                          </tr>
                        ))})()}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-bg-tertiary">
                    <div className="flex items-center gap-6 text-sm">
                      <span className="text-text-muted">{t('rep_fin_total_injected_label')} <span className="font-bold text-accent-green">{fmtUZS(financeStats.totalInjected)}</span></span>
                      <span className="text-text-muted">{t('rep_fin_total_returned_label')} <span className="font-bold text-accent-red">{fmtUZS(financeStats.totalReturned)}</span></span>
                      <span className="text-text-muted">{t('rep_fin_total_net_label')} <span className="font-bold text-accent-blue">{fmtUZS(financeStats.netCapital)}</span></span>
                    </div>
                  </div>
                </div>
                {/* Kirim qarzlar jadvali */}
                <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden w-full">
                  <div className="px-6 py-4 border-b border-border">
                    <h4 className="font-syne font-bold text-text-primary">{t('rep_fin_incoming_debts')}</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm table-fixed">
                      <thead>
                        <tr className="bg-bg-tertiary border-b border-border">
                          <th style={{ width: '20%' }} className="text-left px-3 py-2.5 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('debts', 'productName')}>
                            {t('col_product')} <SortIcon table="debts" col="productName" />
                          </th>
                          <th style={{ width: '16%' }} className="text-left px-3 py-2.5 font-medium text-text-secondary">{t('col_supplier')}</th>
                          <th style={{ width: '10%' }} className="text-right px-3 py-2.5 font-medium text-text-secondary">{t('rep_fin_col_total_usd')}</th>
                          <th style={{ width: '10%' }} className="text-right px-3 py-2.5 font-medium text-text-secondary">{t('rep_fin_col_paid_usd')}</th>
                          <th style={{ width: '16%' }} className="text-center px-3 py-2.5 font-medium text-text-secondary">{t('rep_fin_col_progress')}</th>
                          <th style={{ width: '10%' }} className="text-right px-3 py-2.5 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('debts', 'debtUSD')}>
                            {t('rep_fin_col_debt')} <SortIcon table="debts" col="debtUSD" />
                          </th>
                          <th style={{ width: '11%' }} className="text-center px-3 py-2.5 font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('debts', 'dueDate')}>
                            {t('rep_fin_col_due')} <SortIcon table="debts" col="dueDate" />
                          </th>
                          <th style={{ width: '7%' }} className="text-right px-3 py-2.5 font-medium text-text-secondary">{t('col_status')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {sortedData(financeStats.incomeBatchDebts.filter(x => x.debtUSD > 0), 'debts').map(b => (
                          <tr key={b.id} className={`hover:bg-bg-tertiary transition-colors ${b.dueDate && b.dueDate < TODAY ? 'bg-accent-red/5' : ''}`}>
                            <td className="px-3 py-2.5 font-medium text-text-primary truncate">
                              {b.dueDate && b.dueDate < TODAY && <AlertTriangle size={12} className="inline mr-1 text-accent-red" />}
                              {b.productName}
                            </td>
                            <td className="px-3 py-2.5 text-text-secondary text-xs truncate">{b.supplierName || '—'}</td>
                            <td className="px-3 py-2.5 text-right font-bold text-text-primary whitespace-nowrap">${b.totalUSD}</td>
                            <td className="px-3 py-2.5 text-right text-accent-green font-bold whitespace-nowrap">${b.paidUSD}</td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-1">
                                <div className="flex-1 bg-bg-tertiary rounded-full h-1.5 min-w-[40px]">
                                  <div className="h-1.5 rounded-full transition-all"
                                    style={{
                                      width: `${b.totalUSD > 0 ? Math.round((b.paidUSD/b.totalUSD)*100) : 0}%`,
                                      backgroundColor: b.paidUSD >= b.totalUSD ? C.green : C.orange
                                    }} />
                                </div>
                                <span className="text-xs text-text-muted w-6 text-right">
                                  {b.totalUSD > 0 ? Math.round((b.paidUSD/b.totalUSD)*100) : 0}%
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-right font-bold text-accent-red">{fmtUSD(b.debtUSD)}</td>
                            <td className="px-3 py-2.5 text-center text-xs">
                              {b.dueDate ? (
                                <span style={{ color: b.dueDate < TODAY ? C.red : C.muted }}>
                                  {b.dueDate}
                                </span>
                              ) : '—'}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                b.paymentStatus === 'unpaid' ? 'bg-accent-red/10 text-accent-red'
                                : b.paymentStatus === 'partial' ? 'bg-accent-orange/10 text-accent-orange'
                                : 'bg-accent-green/10 text-accent-green'
                              }`}>
                                {b.paymentStatus === 'unpaid' ? t('rep_fin_status_unpaid')
                                 : b.paymentStatus === 'partial' ? t('inc_filter_partial')
                                 : t('rep_fin_status_paid')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-6 py-3 border-t border-border bg-bg-tertiary flex items-center gap-6 text-sm">
                    <span className="text-text-muted">{t('rep_fin_total_debt_label')} <span className="font-bold text-accent-red">${financeStats.totalDebtUSD}</span></span>
                    <span className="text-text-muted">{t('rep_fin_total_paid_label')} <span className="font-bold text-accent-green">${MOCK_INCOME_BATCHES.reduce((s,x)=>s+x.paidUSD,0)}</span></span>
                    <span className="text-text-muted">{t('rep_fin_uzs_equivalent_label')} <span className="font-bold text-accent-orange">{fmtUZS(Math.round(financeStats.totalDebtUSD * USD_RATE))}</span></span>
                  </div>
                </div>
              </div>
              {/* === MODAL: Muddati o'tgan qarzlar tarixi === */}
              {modal === 'overdueAlertModal' && (
                <Modal open title={t('rep_fin_modal_overdue_title')} subtitle={t('rep_fin_modal_overdue_sub')} size="xl" onClose={closeModal}>
                  <div className="space-y-4">
                    {/* Hal qilinmagan */}
                    <div>
                      <p className="text-text-secondary text-sm font-medium mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-accent-red" />
                        {t('rep_fin_modal_unresolved', { count: financeStats.overdueDebts.length })}
                      </p>
                      <div className="space-y-2">
                        {financeStats.overdueDebts.map(x => (
                          <div key={x.id} className="bg-accent-red/5 border border-accent-red/20 rounded-xl px-4 py-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium text-text-primary">{x.productName}</p>
                                <p className="text-text-muted text-xs">{x.supplierName} • {x.supplierPhone}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-accent-red">${x.debtUSD}</p>
                                <p className="text-text-muted text-xs">{fmtUZS(Math.round(x.debtUSD * USD_RATE))}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-text-muted">{t('rep_fin_modal_due_label')} <span className="font-bold text-text-primary">{x.dueDate}</span></span>
                              <span className="px-2 py-0.5 rounded bg-accent-red/10 text-accent-red font-bold">
                                {t('rep_fin_days_overdue', { days: financeStats.getDaysOverdue(x.dueDate) })}
                              </span>
                            </div>
                            {x.alertTriggeredAt && (
                              <p className="text-text-muted text-xs mt-1">{t('warning')}: {x.alertTriggeredAt}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Hal qilingan */}
                    {MOCK_INCOME_BATCHES.filter(x => x.paymentStatus === 'paid').length > 0 && (
                      <div>
                        <p className="text-text-secondary text-sm font-medium mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-accent-green" />
                          {t('rep_fin_modal_resolved', { count: MOCK_INCOME_BATCHES.filter(x => x.paymentStatus === 'paid').length })}
                        </p>
                        <div className="space-y-2">
                          {MOCK_INCOME_BATCHES.filter(x => x.paymentStatus === 'paid').map(x => (
                            <div key={x.id} className="bg-accent-green/5 border border-accent-green/20 rounded-xl px-4 py-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-text-primary text-sm">{x.productName}</p>
                                  <p className="text-text-muted text-xs">{x.supplierName}</p>
                                </div>
                                <div className="text-right text-xs">
                                  <p className="text-accent-green font-bold">{t('rep_fin_modal_status_paid')}</p>
                                  <p className="text-text-muted">{t('rep_fin_modal_paid_at', { date: [...(x.payments||[])].sort((a,b)=>(a.date||'').localeCompare(b.date||'')).slice(-1)[0]?.date || '—' })}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Modal>
              )}

              {/* === MODAL: Urgent qarzlar tarixi === */}
              {modal === 'urgentAlertModal' && (
                <Modal open title={t('rep_fin_modal_urgent_title')} subtitle={t('rep_fin_modal_urgent_sub')} size="xl" onClose={closeModal}>
                  <ModalTable
                    data={financeStats.alertHistory}
                    pageSize={10}
                    columns={[
                      { key:'productName', label:t('col_product'), render: r => <span className="font-medium text-text-primary">{r.productName}</span> },
                      { key:'supplierName', label:t('col_supplier'), render: r => r.supplierName || '—' },
                      { key:'debtUSD', label:t('rep_fin_col_debt'), align:'right', render: r => <span className="font-bold text-accent-orange">${r.debtUSD}</span> },
                      { key:'dueDate', label:t('rep_fin_col_due'), align:'center' },
                      { key:'alertTriggeredAt', label:t('warning'), align:'center', render: r => r.alertTriggeredAt || '—' },
                      { key:'status', label:t('col_status'), align:'center', render: r => {
                        const cfg = {
                          resolved: { label:t('rep_fin_modal_status_paid'),  cls:'bg-accent-green/10 text-accent-green' },
                          overdue:  { label:t('rep_fin_modal_status_overdue'), cls:'bg-accent-red/10 text-accent-red'   },
                          pending:  { label:t('rep_fin_modal_status_pending'),   cls:'bg-accent-orange/10 text-accent-orange' },
                        }[r.status] || { label: r.status, cls:'' }
                        return <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${cfg.cls}`}>{cfg.label}</span>
                      }},
                      { key:'resolvedAt', label:t('rep_fin_col_paid_date'), align:'center', render: r => r.resolvedAt
                        ? <span className="text-accent-green text-xs">{r.resolvedAt} ✓</span>
                        : r.daysOverdue !== null
                          ? <span className="text-accent-red text-xs font-bold">{t('rep_fin_days_overdue', { days: r.daysOverdue })}</span>
                          : r.daysUntil !== null
                            ? <span className="text-accent-orange text-xs">{t('rep_fin_days_left', { days: r.daysUntil })}</span>
                            : '—'
                      },
                    ]}
                  />
                </Modal>
              )}

              {/* === MODAL: Jalb qilingan === */}
              {modal === 'injectedModal' && (
                <Modal open title={t('rep_fin_modal_injected_title')} subtitle={t('rep_fin_modal_injected_sub')} size="lg" onClose={closeModal}>
                  <div className="flex items-center justify-between mb-5">
                    <MonthYearFilter value={modalFilter} onChange={setModalFilter} />
                    <span className="text-text-muted text-xs">
                      {t('rep_fin_modal_injections_count', { count: MOCK_CAPITAL.filter(c => c.type==='inject' && (modalFilter==='all' || c.date && c.date.startsWith(modalFilter))).length })}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {financeStats.monthlyInjected.map(m => (
                      <div key={m.month} className="bg-bg-tertiary rounded-xl p-4 text-center">
                        <p className="text-text-muted text-xs mb-1">{m.name}</p>
                        <p className="font-syne font-bold text-accent-green text-xl">{fmtUZS(m.value)}</p>
                      </div>
                    ))}
                  </div>
                  <MonthlyDynamicsChart data={financeStats.monthlyInjected} dataKey="value" color={C.green} formatter={v => fmtUZS(v)} name={t('rep_fin_modal_value')} />
                  <p className="text-text-secondary text-sm font-medium mt-6 mb-3">{t('rep_fin_modal_inject_history')}</p>
                  <ModalTable
                    data={MOCK_CAPITAL.filter(c => c.type==='inject' && (modalFilter==='all'||c.date && c.date.startsWith(modalFilter))).sort((a,b) => b.date.localeCompare(a.date))}
                    pageSize={10}
                    columns={[
                      { key:'date',      label:t('col_date') },
                      { key:'source',    label:t('col_source'), render: r => <span className="font-medium text-text-primary">{i18n.language === 'ru' ? (r.sourceRu || r.source) : r.source}</span> },
                      { key:'amountUZS', label:t('col_amount'), align:'right', render: r => <span className="font-bold text-accent-green">{fmtUZS(r.amountUZS)}</span> },
                    ]}
                  />
                </Modal>
              )}

              {/* === MODAL: Qaytarilgan === */}
              {modal === 'returnedModal' && (
                <Modal open title={t('rep_fin_modal_returned_title')} subtitle={t('rep_fin_modal_returned_sub')} size="lg" onClose={closeModal}>
                  <div className="flex items-center justify-between mb-5">
                    <MonthYearFilter value={modalFilter} onChange={setModalFilter} />
                  </div>
                  <div className="bg-bg-tertiary rounded-xl p-4 mb-6 flex items-center justify-between">
                    <div>
                      <p className="text-text-muted text-xs mb-1">{t('rep_fin_modal_total_returned')}</p>
                      <p className="font-syne font-bold text-accent-red text-2xl">{fmtUZS(financeStats.totalReturned)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-text-muted text-xs mb-1">{t('rep_fin_modal_of_injected')}</p>
                      <p className="font-syne font-bold text-accent-orange text-2xl">{financeStats.returnPct}%</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {financeStats.monthlyReturned.map(m => (
                      <div key={m.month} className="bg-bg-tertiary rounded-xl p-4 text-center">
                        <p className="text-text-muted text-xs mb-1">{m.name}</p>
                        <p className="font-syne font-bold text-accent-red text-xl">{m.value > 0 ? fmtUZS(m.value) : '—'}</p>
                      </div>
                    ))}
                  </div>
                  <MonthlyDynamicsChart data={financeStats.monthlyReturned} dataKey="value" color={C.red} formatter={v => fmtUZS(v)} name={t('rep_fin_modal_value')} />
                  <p className="text-text-secondary text-sm font-medium mt-6 mb-3">{t('rep_fin_modal_return_history')}</p>
                  <ModalTable
                    data={MOCK_CAPITAL.filter(c => c.type==='return' && (modalFilter==='all'||c.date && c.date.startsWith(modalFilter))).sort((a,b) => b.date.localeCompare(a.date))}
                    pageSize={10}
                    columns={[
                      { key:'date',      label:t('col_date') },
                      { key:'source',    label:t('col_source'), render: r => <span className="font-medium text-text-primary">{i18n.language === 'ru' ? (r.sourceRu || r.source) : r.source}</span> },
                      { key:'amountUZS', label:t('col_amount'), align:'right', render: r => <span className="font-bold text-accent-red">{fmtUZS(r.amountUZS)}</span> },
                    ]}
                  />
                </Modal>
              )}

              {/* === MODAL: Tashqi kapital balansi === */}
              {modal === 'netCapitalModal' && (
                <Modal open title={t('rep_fin_modal_net_title')} subtitle={t('rep_fin_modal_net_sub')} size="lg" onClose={closeModal}>
                  <div className="flex items-center justify-between mb-5">
                    <MonthYearFilter value={modalFilter} onChange={setModalFilter} />
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-accent-green/5 border border-accent-green/20 rounded-xl p-4 text-center">
                      <p className="text-text-muted text-xs mb-1">{t('rep_fin_capital_injected')}</p>
                      <p className="font-syne font-bold text-accent-green text-xl">{fmtUZS(financeStats.totalInjected)}</p>
                    </div>
                    <div className="bg-accent-red/5 border border-accent-red/20 rounded-xl p-4 text-center">
                      <p className="text-text-muted text-xs mb-1">{t('rep_fin_capital_returned')}</p>
                      <p className="font-syne font-bold text-accent-red text-xl">{fmtUZS(financeStats.totalReturned)}</p>
                    </div>
                    <div className="bg-accent-blue/5 border border-accent-blue/20 rounded-xl p-4 text-center">
                      <p className="text-text-muted text-xs mb-1">{t('rep_fin_modal_net_balance')}</p>
                      <p className="font-syne font-bold text-accent-blue text-xl">{fmtUZS(financeStats.netCapital)}</p>
                    </div>
                  </div>
                  <MonthlyDynamicsChart data={financeStats.monthlyCapital} dataKey="net" color={C.blue} formatter={v => fmtUZS(v)} name={t('col_net_profit')} />
                  <p className="text-text-secondary text-sm font-medium mt-6 mb-3">{t('rep_fin_modal_history')}</p>
                  <ModalTable
                    data={financeStats.capitalWithRunning.filter(c => modalFilter==='all'||c.date && c.date.startsWith(modalFilter))}
                    pageSize={10}
                    columns={[
                      { key:'date',         label:t('col_date'),   width:'120px' },
                      { key:'type',         label:t('rep_fin_col_type'),    width:'110px', render: r => (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.type==='inject'?'bg-accent-green/10 text-accent-green':'bg-accent-red/10 text-accent-red'}`}>
                          {r.type==='inject'?t('rep_fin_badge_inject'):t('rep_fin_badge_return')}
                        </span>
                      )},
                      { key:'source',       label:t('col_source'),  tdClass:'whitespace-normal', render: r => <span className="text-text-primary">{i18n.language === 'ru' ? (r.sourceRu || r.source) : r.source}</span> },
                      { key:'amountUZS',    label:t('col_amount'),  width:'180px', align:'right', render: r => (
                        <span className={`font-bold ${r.type==='inject'?'text-accent-green':'text-accent-red'}`}>
                          {r.type==='inject'?'+':'-'}{fmtUZS(r.amountUZS)}
                        </span>
                      )},
                      { key:'runningTotal', label:t('rep_fin_col_balance'), width:'180px', align:'right', render: r => (
                        <span className={`font-bold ${r.runningTotal>=0?'text-accent-blue':'text-accent-red'}`}>
                          {fmtUZS(r.runningTotal)}
                        </span>
                      )},
                    ]}
                  />
                </Modal>
              )}

              {/* === MODAL: Yetkazib beruvchi qarzi === */}
              {modal === 'supplierDebtModal' && (
                <Modal open title={t('rep_fin_modal_supplier_debt_title')} subtitle={t('rep_fin_modal_supplier_debt_sub')} size="xl" onClose={closeModal}>
                  <div className="flex items-center justify-between mb-5">
                    <MonthYearFilter value={modalFilter} onChange={setModalFilter} />
                  </div>
                  {/* 3 bo'lim */}
                  {[
                    { key:'overdue', label:t('rep_fin_modal_overdue_section'), color:'accent-red',    items: financeStats.debtItems.filter(x => x.dueDate && x.dueDate < TODAY && x.paymentStatus !== 'paid' && (modalFilter==='all'||x.dueDate.startsWith(modalFilter))) },
                    { key:'urgent',  label:t('rep_fin_modal_urgent_section'), color:'accent-orange', items: financeStats.urgentDebts.filter(x => modalFilter==='all'||x.dueDate.startsWith(modalFilter)) },
                    { key:'normal',  label:t('rep_fin_modal_normal_section'),  color:'accent-green',  items: financeStats.debtItems.filter(x => {
                      if (!x.dueDate || x.paymentStatus === 'paid') return false
                      const diff = Math.round((new Date(x.dueDate)-new Date(TODAY))/86400000)
                      return diff > 10 && (modalFilter==='all'||x.dueDate.startsWith(modalFilter))
                    })},
                  ].map(section => section.items.length > 0 && (
                    <div key={section.key} className="mb-6">
                      <p className={`text-sm font-bold mb-3 text-${section.color}`}>
                        {section.label} — {t('rep_fin_modal_items_count', { count: section.items.length })}
                      </p>
                      <ModalTable
                        data={section.items}
                        pageSize={5}
                        columns={[
                          { key:'productName',  label:t('col_product'),           render: r => <span className="font-medium text-text-primary">{r.productName}</span> },
                          { key:'supplierName', label:t('col_supplier'), render: r => r.supplierName || '—' },
                          { key:'supplierPhone', label:t('col_phone') },
                          { key:'totalUSD',    label:t('rep_fin_col_total_usd'),             align:'right', render: r => `$${r.totalUSD}` },
                          { key:'paidUSD',     label:t('rep_fin_col_paid'),        align:'right', render: r => <span className="text-accent-green font-bold">${r.paidUSD}</span> },
                          { key:'debtUSD',     label:t('rep_fin_col_debt'),             align:'right', render: r => <span className="font-bold text-accent-red">${r.debtUSD}</span> },
                          { key:'dueDate',     label:t('rep_fin_col_due'),           align:'center', render: r => (
                            <span className={r.dueDate < TODAY ? 'text-accent-red font-bold' : 'text-text-secondary'}>
                              {r.dueDate}
                            </span>
                          )},
                        ]}
                      />
                    </div>
                  ))}
                </Modal>
              )}

              {/* === MODAL: Mijozlardan kutilgan === */}
              {modal === 'receivableModal' && (
                <Modal open title={t('rep_fin_modal_receivable_title')} subtitle={t('rep_fin_modal_receivable_sub')} size="3xl" onClose={closeModal}>
                  <div className="flex items-center justify-between mb-5">
                    <MonthYearFilter value={modalFilter} onChange={setModalFilter} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-bg-tertiary rounded-xl p-4">
                      <p className="text-text-muted text-xs mb-1">{t('rep_fin_modal_total_expected')}</p>
                      <p className="font-syne font-bold text-purple-500 text-2xl">{fmtUZS(financeStats.installmentReceivable)}</p>
                    </div>
                    <div className="bg-bg-tertiary rounded-xl p-4">
                      <p className="text-text-muted text-xs mb-1">{t('rep_fin_modal_total_paid')}</p>
                      <p className="font-syne font-bold text-accent-green text-2xl">
                        {fmtUZS(financeStats.installmentSales.reduce((s,x)=>s+(x.installmentPaidAmount||0),0))}
                      </p>
                    </div>
                  </div>
                  <ModalTable
                    data={financeStats.installmentSales.filter(s => modalFilter==='all'||(s.soldAt && s.soldAt.startsWith(modalFilter)))}
                    pageSize={10}
                    columns={[
                      { key:'soldAt',       label:t('col_sold_date'), render: r => <span className="whitespace-nowrap text-xs">{fmtSoldAt(r.soldAt)}</span> },
                      { key:'items',        label:t('col_product_name'),    render: r => <span className="text-xs text-text-secondary">{fmtItems(r.items)}</span> },

                      { key:'category',     label:t('col_category'),    render: r => {
                        const cat = r.items?.[0]?.productId ? (MOCK_PRODUCTS.find(p=>p.id===r.items[0].productId)?.category||'—') : '—'
                        return renderCatBadge(cat)
                      }},
                      { key:'soldByName',   label:t('col_employee'),         render: r => <span className="text-xs text-text-secondary">{r.soldByName||'—'}</span> },
                      { key:'customerName', label:t('col_customer'),         render: r => <span className="font-medium text-text-primary text-xs">{r.customerName}</span> },
                      { key:'qty',          label:t('rep_fin_col_qty'), align:'center', render: r => <span className="font-bold">{r.items?.reduce((s,i)=>s+(i.qty||1),0)||1}</span> },
                      { key:'total',        label:t('col_total_sum'),       align:'right', render: r => <span className="font-bold text-text-primary">{fmtUZS(r.total)}</span> },
                      { key:'org',          label:t('rep_fin_col_installment'),        render: r => <span className="text-xs text-text-secondary">{r.installmentOrgName||'—'}</span> },
                      { key:'term',         label:t('rep_fin_col_term'), align:'center', render: r => <span className="text-xs">{r.installmentTermMonths ? t('rep_fin_term_months', { count: r.installmentTermMonths }) : '—'}</span> },
                      { key:'debt',         label:t('rep_fin_col_debt_rem'),   align:'right', render: r => <span className="text-accent-orange font-bold text-xs">{fmtUZS(r.installmentDebt||0)}</span> },
                      { key:'dueDate',      label:t('rep_fin_col_next_pay'), align:'center', render: r => (
                        <span className={`text-xs ${r.installmentDueDate && r.installmentDueDate < TODAY ? 'text-accent-red font-bold' : 'text-text-secondary'}`}>
                          {r.installmentDueDate || '—'}
                        </span>
                      )},
                    ]}
                  />
                </Modal>
              )}

              {/* === MODAL: Kassa balansi / Cash Flow === */}
              {modal === 'cashFlowModal' && (() => {
                const cf = financeStats.cfTotal
                // Verdict: operatsion oqim asosida baho
                const verdict = cf.operatsion >= 0
                  ? { color: C.green,  icon: '✓', title: t('rep_fin_verdict_good_title'),          desc: t('rep_fin_verdict_good_desc') }
                  : { color: '#F4A261', icon: '⚠', title: t('rep_fin_verdict_bad_title'), desc: t('rep_fin_verdict_bad_desc') }
                const filteredRows = financeStats.monthlyCashFlow.filter(m => modalFilter === 'all' || m.month === modalFilter)
                const totRev = filteredRows.reduce((s,m)=>s+m.revenue,0)
                const totMar = filteredRows.reduce((s,m)=>s+m.margin,0)
                const totQar = filteredRows.reduce((s,m)=>s+m.qarz,0)
                const totInv = filteredRows.reduce((s,m)=>s+m.invPayment,0)
                const totExp = filteredRows.reduce((s,m)=>s+m.shopExp,0)
                const totOp  = filteredRows.reduce((s,m)=>s+m.operatsion,0)
                const totMol = filteredRows.reduce((s,m)=>s+m.moliyaviy,0)
                const totNet = filteredRows.reduce((s,m)=>s+m.net,0)
                return (
                <Modal open title={t('rep_fin_modal_cf_title')} subtitle={t('rep_fin_modal_cf_sub')} size="xl" onClose={closeModal}>

                  {/* === Verdict kartasi — kompakt, 1 qator === */}
                  <div className="rounded-xl px-4 py-3 mb-4 border-2 flex items-center gap-4 flex-wrap" style={{ borderColor: verdict.color + '44', backgroundColor: verdict.color + '0d' }}>
                    {/* Status badge */}
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <span className="text-lg">{verdict.icon}</span>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{t('rep_fin_verdict_label')}</p>
                        <p className="font-syne font-extrabold text-sm leading-tight" style={{ color: verdict.color }}>{verdict.title}</p>
                      </div>
                    </div>
                    {/* 3 raqam — inline */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="text-center">
                        <p className="text-[10px] text-text-muted uppercase tracking-wider">{t('rep_fin_category_operating')}</p>
                        <p className="font-syne font-extrabold text-sm" style={{ color: cf.operatsion >= 0 ? C.green : C.red }}>
                          {cf.operatsion >= 0 ? '+' : ''}{fmtUZS(cf.operatsion)}
                        </p>
                      </div>
                      <span className="text-text-muted text-xs">+</span>
                      <div className="text-center">
                        <p className="text-[10px] text-text-muted uppercase tracking-wider">{t('rep_fin_category_financial')}</p>
                        <p className="font-syne font-extrabold text-sm" style={{ color: cf.moliyaviy >= 0 ? C.blue : C.red }}>
                          {cf.moliyaviy >= 0 ? '+' : ''}{fmtUZS(cf.moliyaviy)}
                        </p>
                      </div>
                      <span className="text-text-muted text-xs">=</span>
                      <div className="text-center px-3 py-1 rounded-lg border" style={{ borderColor: verdict.color + '66', backgroundColor: verdict.color + '15' }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: verdict.color }}>{t('rep_fin_real_balance')}</p>
                        <p className="font-syne font-extrabold text-base" style={{ color: verdict.color }}>{fmtUZS(cf.realBalance)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Filtr */}
                  <div className="flex items-center justify-between mb-3">
                    <MonthYearFilter value={modalFilter} onChange={setModalFilter} />
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded inline-block" style={{ backgroundColor: C.red }}/> {t('rep_fin_legend_total_expense')}</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded inline-block" style={{ backgroundColor: C.teal }}/> {t('rep_fin_category_operating')}</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded inline-block" style={{ backgroundColor: '#F4A261' }}/> {t('rep_fin_flow_monthly_net')}</span>
                    </div>
                  </div>

                  {/* Grafik */}
                  <div className="h-[180px] w-full mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={filteredRows}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="name" fontSize={11} stroke="var(--text-muted)" />
                        <YAxis hide />
                        <Tooltip
                          cursor={{ stroke:'var(--border)', strokeWidth:1 }}
                          contentStyle={{ backgroundColor:'var(--bg-secondary)', borderColor:'var(--border)', borderRadius:'12px', color:'var(--text-primary)' }}
                          itemStyle={{ color:'var(--text-primary)', fontSize:'12px' }}
                          formatter={v => fmtUZS(v)}
                          isAnimationActive={false}
                          wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }} />
                        <Line type="monotone" dataKey="chiqim"     stroke={C.red}    strokeWidth={2}   dot={{ fill:C.red,    r:3 }} name={t('rep_fin_legend_total_expense')} strokeDasharray="4 3" />
                        <Line type="monotone" dataKey="operatsion" stroke={C.teal}   strokeWidth={2.5} dot={{ fill:C.teal,    r:4 }} name={t('rep_fin_category_operating')} />
                        <Line type="monotone" dataKey="net"        stroke="#F4A261"  strokeWidth={2.5} dot={{ fill:'#F4A261', r:4 }} name={t('col_net_profit')} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Jadval */}
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-bg-tertiary border-b border-border text-[11px]">
                          <th className="text-left px-3 py-2.5 font-medium text-text-secondary whitespace-nowrap">{t('rep_fin_col_month')}</th>
                          <th className="text-right px-2 py-2.5 font-medium text-accent-green whitespace-nowrap">{t('rep_fin_cf_margin')}</th>
                          <th className="text-right px-2 py-2.5 font-medium text-accent-red whitespace-nowrap">{t('rep_fin_cf_new_batch')}</th>
                          <th className="text-right px-2 py-2.5 font-medium text-accent-red whitespace-nowrap">{t('rep_fin_cf_supplier_pay')}</th>
                          <th className="text-right px-2 py-2.5 font-medium text-accent-red whitespace-nowrap">{t('rep_fin_cf_shop_exp')}</th>
                          <th className="text-right px-2 py-2.5 font-medium whitespace-nowrap" style={{ color: C.teal }}>{t('rep_fin_cf_operating')}</th>
                          <th className="text-right px-2 py-2.5 font-medium whitespace-nowrap" style={{ color: C.blue }}>{t('rep_fin_cf_financial')}</th>
                          <th className="text-right px-2 py-2.5 font-medium whitespace-nowrap" style={{ color: '#F4A261' }}>{t('rep_fin_cf_net')}</th>
                          <th className="text-center px-2 py-2.5 font-medium text-text-secondary whitespace-nowrap">{t('rep_fin_cf_growth')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {sortMonths(filteredRows).map(m => (
                          <tr key={m.month} className="hover:bg-bg-tertiary transition-colors text-[11px]">
                            <td className="px-3 py-2.5 font-semibold text-text-primary whitespace-nowrap">{m.name}</td>
                            <td className="px-2 py-2.5 text-right text-accent-green font-semibold whitespace-nowrap">{m.margin > 0 ? '+'+fmtUZS(m.margin) : '—'}</td>
                            <td className="px-2 py-2.5 text-right text-accent-red whitespace-nowrap">{m.qarz > 0 ? '−'+fmtUZS(m.qarz) : '—'}</td>
                            <td className="px-2 py-2.5 text-right text-accent-green whitespace-nowrap">{m.invPayment > 0 ? '+'+fmtUZS(m.invPayment) : '—'}</td>
                            <td className="px-2 py-2.5 text-right text-accent-red whitespace-nowrap">{m.shopExp > 0 ? '−'+fmtUZS(m.shopExp) : '—'}</td>
                            <td className="px-2 py-2.5 text-right font-bold whitespace-nowrap" style={{ color: m.operatsion>=0?C.teal:C.red }}>{m.operatsion>=0?'+':''}{fmtUZS(m.operatsion)}</td>
                            <td className="px-2 py-2.5 text-right whitespace-nowrap" style={{ color: m.moliyaviy>0?C.blue:m.moliyaviy<0?C.red:'var(--text-muted)' }}>{m.moliyaviy!==0?(m.moliyaviy>0?'+':'')+fmtUZS(m.moliyaviy):'—'}</td>
                            <td className="px-2 py-2.5 text-right font-bold whitespace-nowrap" style={{ color: m.net>=0?'#F4A261':C.red }}>{m.net>=0?'+':''}{fmtUZS(m.net)}</td>
                            <td className="px-2 py-2.5 text-center whitespace-nowrap">
                              {m.growth !== null
                                ? <span className={`inline-flex items-center gap-0.5 font-bold ${m.growth >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                                    {m.growth >= 0 ? <ArrowUpRight size={11}/> : <ArrowDownRight size={11}/>}{Math.abs(m.growth)}%
                                  </span>
                                : <span className="text-text-muted">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="text-[11px]">
                        <tr className="border-t-2 border-border bg-bg-tertiary font-bold">
                          <td className="px-3 py-2.5 text-text-secondary uppercase whitespace-nowrap">{t('rep_fin_total_row')}</td>
                          <td className="px-2 py-2.5 text-right text-accent-green whitespace-nowrap">{totMar>0?'+'+fmtUZS(totMar):'—'}</td>
                          <td className="px-2 py-2.5 text-right text-accent-red whitespace-nowrap">{totQar>0?'−'+fmtUZS(totQar):'—'}</td>
                          <td className="px-2 py-2.5 text-right text-accent-green whitespace-nowrap">{totInv>0?'+'+fmtUZS(totInv):'—'}</td>
                          <td className="px-2 py-2.5 text-right text-accent-red whitespace-nowrap">{totExp>0?'−'+fmtUZS(totExp):'—'}</td>
                          <td className="px-2 py-2.5 text-right whitespace-nowrap" style={{ color: totOp>=0?C.teal:C.red }}>{totOp>=0?'+':''}{fmtUZS(totOp)}</td>
                          <td className="px-2 py-2.5 text-right whitespace-nowrap" style={{ color: totMol>=0?C.blue:C.red }}>{totMol!==0?(totMol>0?'+':'')+fmtUZS(totMol):'—'}</td>
                          <td className="px-2 py-2.5 text-right whitespace-nowrap" style={{ color: totNet>=0?'#F4A261':C.red }}>{totNet>=0?'+':''}{fmtUZS(totNet)}</td>
                          <td />
                        </tr>
                        <tr className="border-t border-border/50 bg-bg-secondary font-bold">
                          <td className="px-3 py-2.5 uppercase whitespace-nowrap" style={{ color: verdict.color }}>{t('rep_fin_real_balance')}</td>
                          <td colSpan={6} className="px-2 py-2.5 text-text-muted font-normal text-[10px]">
                            {t('rep_fin_category_operating')} ({totOp>=0?'+':''}{fmtUZS(totOp)}) + {t('rep_fin_category_financial')} ({totMol>=0?'+':''}{fmtUZS(totMol)})
                          </td>
                          <td className="px-2 py-2.5 text-right font-syne font-extrabold text-sm whitespace-nowrap" style={{ color: verdict.color }}>
                            {fmtUZS(cf.realBalance)}
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </Modal>
                )
              })()}

              {modal === 'roiModal' && (
                <Modal open title={t('rep_fin_modal_roi_title')} subtitle={t('rep_fin_modal_roi_sub')} size="md" onClose={closeModal}>
                  {(() => {
                    const d = financeStats.roiDetails
                    return (
                      <>
                        {/* Sof foyda tarkibi */}
                        <div className="bg-bg-tertiary rounded-xl p-4 mb-4 space-y-2">
                          <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-3">{t('rep_fin_net_profit_calc')}</p>
                          <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">{t('rep_fin_sales_profit_gross')}</span>
                            <span className="font-semibold text-accent-green">+{fmtUZS(d.totalSalesProfit)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">{t('rep_fin_shop_expenses')}</span>
                            <span className="font-semibold text-accent-red">−{fmtUZS(d.totalShopExpenses)}</span>
                          </div>
                          <div className="flex justify-between text-sm opacity-50">
                            <span className="text-text-secondary">{t('rep_fin_supplier_payments')} <span className="text-xs">(COGS ichida)</span></span>
                            <span className="font-semibold text-text-muted">{fmtUZS(d.totalSupplierPayments)}</span>
                          </div>
                          <div className="flex justify-between text-sm pt-2 border-t border-border font-bold">
                            <span className="text-text-primary">{t('col_net_profit')}</span>
                            <span style={{ color: d.netProfit >= 0 ? C.green : C.red }}>{d.netProfit >= 0 ? '+' : ''}{fmtUZS(d.netProfit)}</span>
                          </div>
                        </div>

                        {/* Kapital */}
                        <div className="bg-bg-tertiary rounded-xl p-4 mb-4 space-y-2">
                          <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-3">{t('rep_fin_weighted_cap_title')}</p>
                          <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">{t('rep_fin_accounting_period')}</span>
                            <span className="font-semibold text-text-primary">{t('rep_fin_period_days_suffix', { count: d.totalPeriodDays })}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">{t('rep_fin_weighted_cap')}</span>
                            <span className="font-semibold text-accent-blue">{fmtUZS(Math.round(d.weightedCapital))}</span>
                          </div>
                          <p className="text-text-muted text-xs mt-1">{t('rep_fin_weighted_cap_desc')}</p>
                        </div>

                        {/* ROI natija */}
                        <div className="bg-bg-tertiary rounded-xl p-5 text-center mb-4">
                          <p className="text-text-muted text-xs mb-2">{t('rep_fin_roi')}</p>
                          <p className="font-syne font-bold text-4xl" style={{ color: (financeStats.roi||0) >= 0 ? C.green : C.red }}>
                            {financeStats.roi}%
                          </p>
                          <p className="text-text-muted text-sm mt-2">
                            {(financeStats.roi||0) >= 20 ? t('rep_fin_roi_high') :
                             (financeStats.roi||0) >= 10 ? t('rep_fin_roi_medium') : t('rep_fin_roi_low')}
                          </p>
                        </div>

                        {/* Formula */}
                        <div className="bg-bg-tertiary rounded-xl p-4">
                          <p className="text-text-muted text-xs mb-1">{t('rep_fin_formula_title')}</p>
                          <p className="text-text-primary text-sm font-mono">{t('rep_fin_formula_roi')}</p>
                          <p className="text-text-muted text-xs mt-1">{t('rep_fin_formula_weighted')}</p>
                          <p className="text-text-muted text-xs mt-0.5">{t('rep_fin_formula_sales')}</p>
                        </div>
                      </>
                    )
                  })()}
                </Modal>
              )}

              {/* === MODAL: Tovar xaridlari === */}
              {modal === 'inventoryPayModal' && (() => {
                const months = Object.entries(profitStats.inventoryByMonth).sort((a,b) => b[0].localeCompare(a[0]))
                const MONTH_NAMES_INV = Object.fromEntries(
                  Array.from(new Set(MOCK_INCOME_BATCHES.map(x => x.receivedAt?.slice(0,7)).filter(Boolean)))
                    .map(m => [m, getMonthLabel(m)])
                )
                return (
                  <Modal open title={t('rep_fin_modal_inv_pay_title')} subtitle={t('rep_fin_modal_inv_pay_sub')} size="xl" onClose={closeModal}>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {months.map(([m, d]) => (
                        <div key={m} className="bg-bg-tertiary rounded-xl p-4">
                          <p className="text-text-muted text-xs mb-1">{MONTH_NAMES_INV[m] || m}</p>
                          <p className="font-syne font-bold text-accent-blue text-lg">{fmtUZS(d.total)}</p>
                        </div>
                      ))}
                    </div>
                    <ModalTable
                      data={months.flatMap(([m, d]) => d.items.map(i => ({ ...i, month: MONTH_NAMES_INV[m] || m })))}
                      pageSize={10}
                      columns={[
                        { key:'month',   label:t('rep_fin_col_month') },
                        { key:'date',    label:t('col_date') },
                        { key:'name',    label:t('col_product'), render: r => <span className="font-medium text-text-primary">{r.name}</span> },
                        { key:'usdRate', label:t('rep_fin_col_rate'), align:'right', render: r => <span className="text-text-secondary text-xs">{(r.usdRate||0).toLocaleString('uz-UZ')} so'm</span> },
                        { key:'paidUSD', label:'USD', render: r => <span className="font-bold text-accent-blue">${r.paidUSD}</span> },
                        { key:'paidUZS', label:'UZS', align:'right', render: r => <span className="font-bold text-text-primary">{fmtUZS(r.paidUZS)}</span> },
                      ]}
                    />
                  </Modal>
                )
              })()}

              {/* === MODAL: Kapital qaytarish === */}
            </>
          )

  )
}

export default FinanceTab
