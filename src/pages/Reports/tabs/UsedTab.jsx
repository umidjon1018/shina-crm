import React from 'react'
import { localToday, localMonth } from '../../../utils/tz'
import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { AlertTriangle, Award, CreditCard, DollarSign, Package, Recycle, ShoppingCart, TrendingUp, Wallet } from 'lucide-react'
import { C, Modal, ModalTable, fmtItems, fmtNum, fmtSoldAt, fmtUZS } from '../components/shared'
import { getUsedSaleProfit } from '../../../utils/profitHelpers'

const UsedTab = ({ ctx }) => {
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
    usedInstallmentMonth, setUsedInstallmentMonth,
    usedChartCategories,
    getMonthlySalesChart,
    USD_RATE,
    storeInstallmentOrgs, storeMonthlyTargets, storeEmployeeTargets,
    storeCompanyName,
  } = ctx

  return (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="cursor-pointer" onClick={() => openModal('usedRevenueModal')}>
                <StatCard icon={Recycle} label={t('rep_bu_card_revenue')} value={fmtUZS(usedData.totalRevenue)} sub={t('dash_sales_count', { count: usedData.salesCount })} color="bg-accent-orange/10 text-accent-orange" />
              </div>
              <div className="cursor-pointer" onClick={() => openModal('usedProfitModal')}>
                <StatCard icon={TrendingUp} label={t('rep_bu_card_profit')} value={fmtUZS(usedData.totalProfit)} sub={t('rep_bu_card_profit_sub')} color={usedData.totalProfit >= 0 ? "bg-accent-green/10 text-accent-green" : "bg-accent-red/10 text-accent-red"} />
              </div>
              <div className="cursor-pointer" onClick={() => openModal('usedAcquiredModal')}>
                <StatCard icon={Package} label={t('rep_bu_card_acquired')} value={fmtUZS(usedData.acquiredValue)} sub={t('rep_bu_card_acquired_sub', { count: usedData.acquiredCount })} color="bg-accent-blue/10 text-accent-blue" />
              </div>
              <div className="cursor-pointer" onClick={() => openModal('usedInStockModal')}>
                <StatCard icon={Wallet} label={t('rep_bu_card_in_stock')} value={fmtUZS(usedData.inStockValue)} sub={`${usedData.inStockCount} ta`} color="bg-purple-500/10 text-purple-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="cursor-pointer" onClick={() => openModal('usedSoldModal')}>
                <StatCard icon={ShoppingCart} label={t('rep_bu_card_sold')} value={usedData.soldCount} sub={t('rep_bu_card_sold_sub')} color="bg-accent-green/10 text-accent-green" />
              </div>
              <div className="cursor-pointer" onClick={() => openModal('usedScrappedModal')}>
                <StatCard icon={AlertTriangle} label={t('rep_bu_card_scrapped')} value={usedData.scrappedCount} sub={fmtUZS(usedData.scrappedValue)} color="bg-accent-red/10 text-accent-red" />
              </div>
              <div className="cursor-pointer" onClick={() => openModal('usedMarginModal')}>
                <StatCard icon={Award} label={t('rep_bu_card_margin')} value={usedData.totalRevenue > 0 ? `${Math.round(usedData.totalProfit / usedData.totalRevenue * 100)}%` : '—'} sub={t('rep_bu_card_margin_sub')} color="bg-yellow-500/10 text-yellow-500" />
              </div>
              <div className="cursor-pointer" onClick={() => openModal('usedInstallmentModal')}>
                <StatCard icon={CreditCard} label={t('rep_bu_card_installment')} value={fmtUZS(usedData.instDebt)} sub={t('rep_bu_card_installment_sub', { count: usedData.instCount })} color="bg-purple-500/10 text-purple-500" />
              </div>
            </div>

            <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <SectionTitle title={t('rep_bu_section_chart_title')} desc={t('rep_bu_section_chart_desc')} />
                <MonthFilterSelect value={usedChartMonth} onChange={setUsedChartMonth} />
              </div>
              {usedChartCategories.length === 0 ? (
                <div className="py-10 text-center text-text-muted text-sm">{t('rep_bu_empty')}</div>
              ) : (
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={usedChartCategories}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="label" fontSize={11} stroke="var(--text-muted)" />
                      <YAxis hide />
                      <Tooltip
                        cursor={{ fill:'rgba(255,255,255,0.04)' }}
                        contentStyle={{ backgroundColor:'var(--bg-secondary)', borderColor:'var(--border)', borderRadius:'12px', color:'var(--text-primary)' }}
                        itemStyle={{ color:'var(--text-primary)', fontSize:'12px' }}
                        formatter={v => fmtUZS(v)}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="revenue" name={t('rep_bu_chart_revenue')} fill={C.orange} radius={[4,4,0,0]} />
                      <Bar dataKey="profit" name={t('rep_chart_profit')} fill={C.green} radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <SectionTitle title={t('rep_bu_section_history_title')} desc={t('rep_bu_section_history_desc')} />
                <MonthFilterSelect value={usedHistoryMonth} onChange={setUsedHistoryMonth} />
              </div>
              <ModalTable
                data={usedHistorySales}
                pageSize={15}
                columns={[
                  { key: 'soldAt', label: t('col_date'), render: r => <span className="text-text-secondary text-xs">{r.soldAt?.slice(0,10)}</span> },
                  { key: 'customerName', label: t('col_customer') },
                  { key: 'items', label: t('mgmt_tab_products'), sortable: false, render: r => <span className="text-text-secondary text-xs">{(r.items||[]).map(i => i.name).join(', ')}</span> },
                  { key: 'total', label: t('col_total_sum'), align: 'right', render: r => <span className="font-bold text-text-primary">{fmtUZS(r.total)}</span> },
                  { key: 'profit', label: t('rep_bu_col_profit_loss'), align: 'right', render: r => {
                      const commission = r.paymentType === 'installment' ? (r.installmentCommissionAmount ?? 0) : 0
                      const profit = getUsedSaleProfit(r) - commission
                      return <span className={`font-bold ${profit >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>{fmtUZS(profit)}</span>
                    }
                  },
                  { key: 'paymentType', label: t('rep_bu_col_payment'), render: r => (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-text-secondary text-xs">{{ installment: t('pay_installment'), transfer: t('rep_bu_pay_transfer'), cash: t('pay_cash'), card: t('pay_card') }[r.paymentType] || r.paymentType}</span>
                      {r.paymentType === 'card' && r.cardType && (
                        <span className="text-[10px] text-text-muted font-bold uppercase">{r.cardType}</span>
                      )}
                    </div>
                  )},
                  { key: 'soldByName', label: t('col_employee') },
                  { key: 'status', label: t('col_status'), render: r => (
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap ${r.status === 'cancelled' ? 'bg-accent-red/10 text-accent-red' : 'bg-accent-green/10 text-accent-green'}`}>
                        {r.status === 'cancelled' ? t('rep_bu_status_cancelled') : r.status === 'pending' ? t('pay_installment') : t('rep_bu_status_completed')}
                      </span>
                    )
                  },
                ]}
              />
            </div>

            {modal === 'usedRevenueModal' && (() => {
              const filtered = filterUsedByMonth(usedData.completedUsed, 'soldAt', usedRevenueMonth)
              const total = filtered.reduce((s, x) => s + (x.total || 0), 0)
              return (
              <Modal open title={t('rep_bu_modal_revenue_title')} subtitle={t('rep_bu_modal_revenue_sub')} size="xl" onClose={closeModal}>
                <div className="mb-4 flex items-center justify-between gap-3 flex-wrap text-xs text-text-muted">
                  <span>{t('rep_bu_modal_total')}: <span className="font-bold text-accent-orange">{fmtUZS(total)}</span> · {t('dash_sales_count', { count: filtered.length })}</span>
                  <MonthFilterSelect value={usedRevenueMonth} onChange={setUsedRevenueMonth} />
                </div>
                <ModalTable
                  data={filtered}
                  pageSize={10}
                  columns={[
                    { key: 'soldAt', label: t('col_date'), render: r => <span className="text-text-secondary text-xs">{r.soldAt?.slice(0,10)}</span> },
                    { key: 'customerName', label: t('col_customer') },
                    { key: 'items', label: t('mgmt_tab_products'), sortable: false, render: r => <span className="text-text-secondary text-xs">{(r.items||[]).map(i => i.name).join(', ')}</span> },
                    { key: 'total', label: t('col_total_sum'), align: 'right', render: r => <span className="font-bold text-text-primary">{fmtUZS(r.total)}</span> },
                    { key: 'soldByName', label: t('col_employee') },
                  ]}
                />
              </Modal>
              )
            })()}

            {modal === 'usedProfitModal' && (() => {
              const filtered = filterUsedByMonth(usedData.completedUsed, 'soldAt', usedProfitMonth)
              const totalProfit = filtered.reduce((s, x) => {
                const commission = x.paymentType === 'installment' ? (x.installmentCommissionAmount ?? 0) : 0
                return s + getUsedSaleProfit(x) - commission
              }, 0)
              return (
              <Modal open title={t('rep_bu_modal_profit_title')} subtitle={t('rep_bu_modal_profit_sub')} size="xl" onClose={closeModal}>
                <div className="mb-4 flex items-center justify-between gap-3 flex-wrap text-xs text-text-muted">
                  <span>{t('rep_bu_modal_total')}: <span className={`font-bold ${totalProfit >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>{fmtUZS(totalProfit)}</span></span>
                  <MonthFilterSelect value={usedProfitMonth} onChange={setUsedProfitMonth} />
                </div>
                <ModalTable
                  data={filtered}
                  pageSize={10}
                  columns={[
                    { key: 'soldAt', label: t('col_date'), render: r => <span className="text-text-secondary text-xs">{r.soldAt?.slice(0,10)}</span> },
                    { key: 'customerName', label: t('col_customer') },
                    { key: 'items', label: t('mgmt_tab_products'), sortable: false, render: r => <span className="text-text-secondary text-xs">{(r.items||[]).map(i => i.name).join(', ')}</span> },
                    { key: 'total', label: t('col_total_sum'), align: 'right', render: r => <span className="font-bold text-text-primary">{fmtUZS(r.total)}</span> },
                    { key: 'profit', label: t('rep_bu_col_profit_loss'), align: 'right', render: r => {
                        const commission = r.paymentType === 'installment' ? (r.installmentCommissionAmount ?? 0) : 0
                        const profit = getUsedSaleProfit(r) - commission
                        return <span className={`font-bold ${profit >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>{fmtUZS(profit)}</span>
                      }
                    },
                  ]}
                />
              </Modal>
              )
            })()}

            {modal === 'usedAcquiredModal' && (() => {
              const acquired = filterUsedByMonth(usedData.acquiredStock, 'acquiredAt', usedAcquiredMonth)
              const totalValue = acquired.reduce((s, x) => s + (x.acquiredPrice || 0), 0)
              return (
                <Modal open title={t('rep_bu_modal_acquired_title')} subtitle={t('rep_bu_modal_acquired_sub')} size="xl" onClose={closeModal}>
                  <div className="mb-4 flex items-center justify-between gap-3 flex-wrap text-xs text-text-muted">
                    <span>{t('rep_bu_modal_total')}: <span className="font-bold text-accent-blue">{fmtUZS(totalValue)}</span> · {t('rep_bu_modal_count_suffix', { count: acquired.length })}</span>
                    <MonthFilterSelect value={usedAcquiredMonth} onChange={setUsedAcquiredMonth} />
                  </div>
                  <ModalTable
                    data={acquired}
                    pageSize={10}
                    columns={[
                      { key: 'acquiredAt', label: t('col_date'), render: r => <span className="text-text-secondary text-xs">{r.acquiredAt?.slice(0,10)}</span> },
                      { key: 'name', label: t('col_name') },
                      { key: 'categoryLabel', label: t('col_category'), render: r => getCategoryLabel(r) },
                      { key: 'customerName', label: t('col_customer') },
                      { key: 'acquiredPrice', label: t('rep_bu_col_cost'), align: 'right', render: r => fmtUZS(r.acquiredPrice) },
                      { key: 'employeeName', label: t('col_employee') },
                    ]}
                  />
                </Modal>
              )
            })()}

            {modal === 'usedInStockModal' && (() => {
              const filtered = filterUsedByMonth(usedData.allInStock, 'acquiredAt', usedInStockMonth)
              const totalValue = filtered.reduce((s, x) => s + (x.acquiredPrice || 0), 0)
              return (
                <Modal open title={t('rep_bu_modal_instock_title')} subtitle={t('rep_bu_modal_instock_sub')} size="xl" onClose={closeModal}>
                  <div className="mb-4 flex items-center justify-between gap-3 flex-wrap text-xs text-text-muted">
                    <span>{t('rep_bu_modal_total')}: <span className="font-bold text-purple-500">{fmtUZS(totalValue)}</span> · {t('rep_bu_modal_count_suffix', { count: filtered.length })}</span>
                    <MonthFilterSelect value={usedInStockMonth} onChange={setUsedInStockMonth} />
                  </div>
                  <ModalTable
                    data={filtered}
                    pageSize={10}
                    columns={[
                      { key: 'acquiredAt', label: t('rep_bu_col_acquired_date'), render: r => <span className="text-text-secondary text-xs">{r.acquiredAt?.slice(0,10)}</span> },
                      { key: 'name', label: t('col_name') },
                      { key: 'categoryLabel', label: t('col_category'), render: r => getCategoryLabel(r) },
                      { key: 'acquiredPrice', label: t('rep_bu_col_cost'), align: 'right', render: r => fmtUZS(r.acquiredPrice) },
                      { key: 'employeeName', label: t('col_employee') },
                    ]}
                  />
                </Modal>
              )
            })()}

            {modal === 'usedSoldModal' && (() => {
              const filtered = filterUsedByMonth(usedData.allSold, 'soldAt', usedSoldMonth)
              return (
                <Modal open title={t('rep_bu_modal_sold_title')} subtitle={t('rep_bu_modal_sold_sub')} size="xl" onClose={closeModal}>
                  <div className="mb-4 flex items-center justify-between gap-3 flex-wrap text-xs text-text-muted">
                    <span>{t('rep_bu_modal_sold_count', { count: filtered.length })}</span>
                    <MonthFilterSelect value={usedSoldMonth} onChange={setUsedSoldMonth} />
                  </div>
                  <ModalTable
                    data={filtered}
                    pageSize={10}
                    columns={[
                      { key: 'soldAt', label: t('col_sold_date'), render: r => <span className="text-text-secondary text-xs">{r.soldAt?.slice(0,10) || '—'}</span> },
                      { key: 'name', label: t('col_name') },
                      { key: 'categoryLabel', label: t('col_category'), render: r => getCategoryLabel(r) },
                      { key: 'acquiredPrice', label: t('rep_bu_col_cost'), align: 'right', render: r => fmtUZS(r.acquiredPrice) },
                      { key: 'sellPrice', label: t('rep_bu_col_sell_price'), align: 'right', render: r => fmtUZS(r.sellPrice) },
                      { key: 'profit', label: t('rep_bu_col_profit'), align: 'right', render: r => {
                          const profit = (r.sellPrice || 0) - (r.acquiredPrice || 0)
                          return <span className={`font-bold ${profit >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>{fmtUZS(profit)}</span>
                        }
                      },
                    ]}
                  />
                </Modal>
              )
            })()}

            {modal === 'usedScrappedModal' && (() => {
              const filtered = usedScrappedMonth === 'all'
                ? usedData.allScrapped
                : usedData.allScrapped.filter(x => (x.scrapAt || x.soldAt)?.startsWith(usedScrappedMonth))
              const totalValue = filtered.reduce((s, x) => s + (x.acquiredPrice || 0), 0)
              return (
                <Modal open title={t('rep_bu_modal_scrapped_title')} subtitle={t('rep_bu_modal_scrapped_sub')} size="xl" onClose={closeModal}>
                  <div className="mb-4 flex items-center justify-between gap-3 flex-wrap text-xs text-text-muted">
                    <span>{t('rep_bu_modal_total')}: <span className="font-bold text-accent-red">{fmtUZS(totalValue)}</span> · {t('rep_bu_modal_count_suffix', { count: filtered.length })}</span>
                    <MonthFilterSelect value={usedScrappedMonth} onChange={setUsedScrappedMonth} />
                  </div>
                  <ModalTable
                    data={filtered}
                    pageSize={10}
                    columns={[
                      { key: 'scrapAt', label: t('col_date'), render: r => <span className="text-text-secondary text-xs">{(r.scrapAt || r.soldAt)?.slice(0,10) || '—'}</span> },
                      { key: 'name', label: t('col_name') },
                      { key: 'categoryLabel', label: t('col_category'), render: r => getCategoryLabel(r) },
                      { key: 'acquiredPrice', label: t('rep_bu_col_cost'), align: 'right', render: r => fmtUZS(r.acquiredPrice) },
                      { key: 'scrapPrice', label: t('rep_bu_col_scrap_price'), align: 'right', render: r => fmtUZS(r.scrapPrice ?? r.sellPrice ?? 0) },
                      { key: 'scrapBuyer', label: t('rep_bu_col_buyer'), render: r => r.scrapBuyer || (r.soldSaleId ? t('rep_bu_scrap_sale_label') : '—') },
                      { key: 'scrapNote', label: t('col_note'), sortable: false, render: r => <span className="text-text-secondary text-xs">{r.scrapNote || (r.soldSaleId ? t('rep_bu_scrap_sale_label') : '—')}</span> },
                    ]}
                  />
                </Modal>
              )
            })()}

            {modal === 'usedInstallmentModal' && (() => {
              const filtered = filterUsedByMonth(usedData.instSales, 'soldAt', usedInstallmentMonth)
              const totalDebt = filtered.reduce((s, x) => s + (x.installmentDebt || 0), 0)
              const totalPaid = filtered.reduce((s, x) => s + (x.installmentPaidAmount || 0), 0)
              return (
                <Modal open title={t('rep_bu_modal_installment_title')} subtitle={t('rep_bu_modal_installment_sub')} size="3xl" onClose={closeModal}>
                  <div className="mb-4 flex items-center justify-between gap-3 flex-wrap text-xs text-text-muted">
                    <span>
                      {t('rep_bu_modal_inst_debt')}: <span className="font-bold text-purple-500">{fmtUZS(totalDebt)}</span>
                      {' · '}
                      {t('rep_bu_modal_inst_paid')}: <span className="font-bold text-accent-green">{fmtUZS(totalPaid)}</span>
                    </span>
                    <MonthFilterSelect value={usedInstallmentMonth} onChange={setUsedInstallmentMonth} />
                  </div>
                  <ModalTable
                    data={filtered}
                    pageSize={10}
                    columns={[
                      { key: 'soldAt',              label: t('col_date'),         render: r => <span className="text-text-secondary text-xs">{r.soldAt?.slice(0,10)}</span> },
                      { key: 'customerName',         label: t('col_customer'),     render: r => <span className="font-medium text-text-primary">{r.customerName}</span> },
                      { key: 'items',               label: t('mgmt_tab_products'), sortable: false, render: r => <span className="text-text-secondary text-xs">{(r.items||[]).map(i => i.name).join(', ')}</span> },
                      { key: 'total',               label: t('col_total_sum'),    align: 'right', render: r => <span className="font-bold text-text-primary">{fmtUZS(r.total)}</span> },
                      { key: 'installmentPaidAmount', label: t('rep_fin_col_paid'), align: 'right', render: r => <span className="font-bold text-accent-green">{fmtUZS(r.installmentPaidAmount || 0)}</span> },
                      { key: 'installmentDebt',     label: t('rep_fin_col_debt_rem'), align: 'right', render: r => <span className={`font-bold ${(r.installmentDebt||0) > 0 ? 'text-accent-orange' : 'text-accent-green'}`}>{fmtUZS(r.installmentDebt || 0)}</span> },
                      { key: 'installmentDueDate',  label: t('rep_fin_col_next_pay'), align: 'center', render: r => {
                        const due = r.installmentDueDate
                        const today = localToday()
                        return <span className={`text-xs ${due && due < today ? 'text-accent-red font-bold' : 'text-text-secondary'}`}>{due || '—'}</span>
                      }},
                      { key: 'installmentOrgName',  label: t('rep_fin_col_installment'), render: r => { const orgName = r.installmentOrgName || (storeInstallmentOrgs || []).find(o => o.id === r.installmentOrgId)?.name || null; return <span className="text-text-secondary text-xs">{orgName || '—'}</span> } },
                      { key: 'soldByName',          label: t('col_employee'),     render: r => <span className="text-text-secondary text-xs">{r.soldByName || '—'}</span> },
                    ]}
                  />
                </Modal>
              )
            })()}

            {modal === 'usedMarginModal' && (() => {
              const filtered = filterUsedByMonth(usedData.completedUsed, 'soldAt', usedMarginMonth)
              const total = filtered.reduce((s, x) => s + (x.total || 0), 0)
              const profit = filtered.reduce((s, x) => {
                const commission = x.paymentType === 'installment' ? (x.installmentCommissionAmount ?? 0) : 0
                return s + getUsedSaleProfit(x) - commission
              }, 0)
              return (
              <Modal open title={t('rep_bu_modal_margin_title')} subtitle={t('rep_bu_modal_margin_sub')} size="xl" onClose={closeModal}>
                <div className="mb-4 flex items-center justify-between gap-3 flex-wrap text-xs text-text-muted">
                  <span>{t('rep_bu_modal_margin_total')}: <span className="font-bold text-yellow-500">{total > 0 ? `${Math.round(profit / total * 100)}%` : '—'}</span></span>
                  <MonthFilterSelect value={usedMarginMonth} onChange={setUsedMarginMonth} />
                </div>
                <ModalTable
                  data={filtered}
                  pageSize={10}
                  columns={[
                    { key: 'soldAt', label: t('col_date'), render: r => <span className="text-text-secondary text-xs">{r.soldAt?.slice(0,10)}</span> },
                    { key: 'customerName', label: t('col_customer') },
                    { key: 'total', label: t('col_total_sum'), align: 'right', render: r => fmtUZS(r.total) },
                    { key: 'profit', label: t('rep_bu_col_profit'), align: 'right', render: r => {
                        const commission = r.paymentType === 'installment' ? (r.installmentCommissionAmount ?? 0) : 0
                        const profit = getUsedSaleProfit(r) - commission
                        return <span className={`font-bold ${profit >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>{fmtUZS(profit)}</span>
                      }
                    },
                    { key: 'margin', label: t('col_margin'), align: 'right', render: r => {
                        const commission = r.paymentType === 'installment' ? (r.installmentCommissionAmount ?? 0) : 0
                        const profit = getUsedSaleProfit(r) - commission
                        const margin = r.total > 0 ? Math.round(profit / r.total * 100) : 0
                        return <span className="font-bold text-yellow-500">{margin}%</span>
                      }
                    },
                  ]}
                />
              </Modal>
              )
            })()}
          </>

  )
}

export default UsedTab
