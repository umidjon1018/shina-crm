import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { ShoppingCart, Award, TrendingUp, Target, Recycle, ArrowDownRight, X } from 'lucide-react'
import { C, DetailButton, GrowthBadge, Modal, ModalTable, MonthYearFilter, MonthlyDynamicsChart, fmtItems, fmtNum, fmtSoldAt, fmtUZS } from '../components/shared'
import { getSaleProfit, getUsedSaleProfit } from '../../../utils/profitHelpers'

const ProfitTab = ({ ctx }) => {
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
    MOCK_SALES, MOCK_PRODUCTS, MOCK_INCOME_BATCHES, MOCK_EXPENSES, MOCK_CAPITAL,
    MOCK_USED_SALES,
  } = ctx

  const activeBundles = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('shina_crm_bundles') || '[]').filter(b => b.isActive) }
    catch { return [] }
  }, [])
  const productIdToName = useMemo(() => {
    const map = {}
    MOCK_SALES.forEach(sale => { (sale.items || []).forEach(it => { if (it.productId && (it.productName || it.name)) map[String(it.productId)] = (it.productName || it.name).trim() }) })
    return map
  }, [MOCK_SALES])
  const enrichSale = (s) => {
    const existing = Number(s.bundleDiscountAmount) || 0
    const saleNames = new Set((s.items || []).map(it => (it.productName || it.name || '').trim()).filter(Boolean))
    const matched = activeBundles.find(b => b.products?.length > 0 && b.products.every(bp => { const n = productIdToName[String(bp.productId)]; return n ? saleNames.has(n) : false }))
    if (!matched && existing === 0 && !s.isBundle) return s
    const saleItemsTotal = (s.items || []).reduce((a, i) => a + (i.price || 0), 0)
    const discAmt = existing > 0 ? existing : (matched?.discount > 0 ? Math.round(saleItemsTotal * matched.discount / (100 - matched.discount)) : 0)
    return { ...s, isBundle: true, bundleDiscountAmount: discAmt, bundleDiscountPercent: matched?.discount || 0 }
  }

  // Oylik yangi+B/U birlashgan chart ma'lumoti
  const combinedMonthlyChart = React.useMemo(() => {
    const usedAll = (MOCK_USED_SALES || []).filter(s => s.status !== 'cancelled')
    return profitStats.monthlyChart.map(m => {
      const monthUsed = usedAll.filter(s => s.soldAt && s.soldAt.startsWith(m.month))
      const sotuv_bu  = monthUsed.reduce((s,x) => s + (x.total||0), 0)
      const foyda_bu  = monthUsed.reduce((s,x) => s + getUsedSaleProfit(x) - (x.paymentType==='installment'?(x.installmentCommissionAmount??0):0), 0)
      return { ...m, sotuv_bu, sotuv_total: m.sotuv + sotuv_bu, foyda_bu, foyda_total: m.foyda + foyda_bu, sof_total: m.sof + foyda_bu }
    })
  }, [profitStats.monthlyChart, MOCK_USED_SALES])

  return (
          !isPrivileged ? <LockedTab /> : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="cursor-pointer" onClick={() => openModal('profitSalesTotalModal')}>
                  <StatCard icon={ShoppingCart} label={t('rep_profit_total_sales')} value={fmtUZS(profitStats.totalSalesAmt)} sub={t('rep_profit_selected_period')} />
                </div>
                <div className="cursor-pointer" onClick={() => openModal('grossProfitModal')}>
                  <StatCard icon={Award} label={t('rep_profit_gross_label')} value={fmtUZS(profitStats.totalProfit)} sub={t('rep_profit_gross_sub')} color="bg-accent-blue/10 text-accent-blue" />
                </div>
                <div className="cursor-pointer" onClick={() => openModal('combinedProfitModal')}>
                  <StatCard icon={Recycle} label={t('rep_profit_combined_label')} value={fmtUZS(profitStats.totalProfit + usedData.totalProfit)} sub={t('rep_profit_combined_sub', { newProfit: fmtUZS(profitStats.totalProfit), usedProfit: fmtUZS(usedData.totalProfit) })} color="bg-purple-500/10 text-purple-500" />
                </div>
                <div className="cursor-pointer" onClick={() => openModal('netProfitModal')}>
                  <StatCard
                    icon={TrendingUp}
                    label={t('col_net_profit')}
                    value={fmtUZS(profitStats.netProfit + usedData.totalProfit)}
                    sub={t('rep_profit_net_bu_sub', { value: fmtUZS(usedData.totalProfit) })}
                    color={(profitStats.netProfit + usedData.totalProfit) >= 0 ? "bg-accent-green/10 text-accent-green" : "bg-accent-red/10 text-accent-red"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-bg-secondary border border-border rounded-2xl p-5 cursor-pointer hover:border-accent-blue/40 transition-colors" onClick={() => openModal('breakEvenModal')}>
                  <p className="text-text-secondary text-sm font-medium mb-1">{t('rep_profit_breakeven')}</p>
                  <h3 className="text-xl font-syne font-bold text-text-primary mb-2">{fmtUZS(profitStats.breakEven)}</h3>
                  <div className="w-full bg-bg-tertiary rounded-full h-2 mb-2">
                    <div className="h-2 rounded-full bg-accent-blue transition-all" style={{ width: `${Math.min(100, (profitStats.totalSalesAmt / (profitStats.breakEven || 1)) * 100)}%` }} />
                  </div>
                  {profitStats.totalSalesAmt >= profitStats.breakEven ? (
                    <p className="text-xs font-bold text-accent-green">{t('rep_profit_covered')}</p>
                  ) : (
                    <p className="text-xs font-bold text-accent-red">X {t('rep_profit_short', { value: fmtUZS(profitStats.breakEven - profitStats.totalSalesAmt) })}</p>
                  )}
                </div>
                <div className="bg-bg-secondary border border-border rounded-2xl p-5 cursor-pointer hover:border-accent-red/40 transition-colors" onClick={() => openModal('fixedExpModal')}>
                  <p className="text-text-secondary text-sm font-medium mb-1">{t('rep_profit_fixed_exp')}</p>
                  <h3 className="text-xl font-syne font-bold text-text-primary mb-1">{fmtUZS(profitStats.fixedExpenses)}</h3>
                  <p className="text-xs text-text-muted">{t('rep_profit_fixed_exp_hint')}</p>
                </div>
                <div className="bg-bg-secondary border border-border rounded-2xl p-5 cursor-pointer hover:border-accent-orange/40 transition-colors" onClick={() => openModal('varExpModal')}>
                  <p className="text-text-secondary text-sm font-medium mb-1">{t('rep_profit_var_exp')}</p>
                  <h3 className="text-xl font-syne font-bold text-text-primary mb-1">{fmtUZS(profitStats.varExpenses)}</h3>
                  <p className="text-xs text-text-muted">{t('rep_profit_var_exp_hint')}</p>
                </div>
                <div className="cursor-pointer" onClick={() => openModal('totalExpModal')}>
                  <StatCard icon={ArrowDownRight} label={t('rep_profit_total_exp')} value={fmtUZS(profitStats.totalExpenses)} sub={t('rep_profit_total_exp_sub')} color="bg-accent-red/10 text-accent-red" />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-bg-secondary border border-border rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-syne font-bold text-text-primary">{t('rep_profit_dynamics_title')}</h4>
                      <p className="text-text-secondary text-sm">{t('rep_profit_dynamics_sub')}</p>
                    </div>
                    <DetailButton onClick={() => openModal('profitDynamicsModal')} />
                  </div>
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={combinedMonthlyChart}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="name" fontSize={10} stroke="var(--text-muted)" />
                        <YAxis hide />
                        <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', borderRadius: '12px', color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)', fontSize: '12px' }} offset={10} isAnimationActive={false} wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }} formatter={v => fmtUZS(v)} />
                        <Legend iconType="circle" />
                        <Bar dataKey="sotuv"    fill={C.blue}   radius={[4,4,0,0]} name="Yangi sotuv" />
                        <Bar dataKey="sotuv_bu" fill="#f59e0b"  radius={[4,4,0,0]} name="B/U sotuv" />
                        <Bar dataKey="xarajat"  fill={C.red}    radius={[4,4,0,0]} name={t('rep_chart_expense')} />
                        <Bar dataKey="foyda"    fill={C.green}  radius={[4,4,0,0]} name={t('rep_profit_gross_label')} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-bg-secondary border border-border rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-syne font-bold text-text-primary">{t('rep_profit_exp_dist_title')}</h4>
                      <p className="text-text-secondary text-sm">{t('rep_profit_exp_dist_sub')}</p>
                    </div>
                    <DetailButton onClick={() => openModal('expDistModal')} />
                  </div>
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={profitStats.expChart}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          isAnimationActive={false}
                        >
                          {profitStats.expChart.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={[C.red, C.orange, C.blue, C.green, C.purple, C.pink][index % 6]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val) => fmtUZS(val)} contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', borderRadius: '12px', color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)', fontSize: '12px' }} offset={10} isAnimationActive={false} wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-bg-secondary border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-syne font-bold text-text-primary">{t('rep_profit_exp_trend_title')}</h4>
                    <p className="text-text-secondary text-sm">{t('rep_profit_exp_trend_sub')}</p>
                  </div>
                  <DetailButton onClick={() => openModal('expTrendModal')} />
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={profitStats.expByMonth}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" fontSize={11} stroke={C.muted} />
                    <YAxis hide />
                    <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} formatter={(val) => fmtUZS(val)} contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', borderRadius: '12px', color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)', fontSize: '12px' }} offset={10} isAnimationActive={false} wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }} />
                    <Legend iconType="circle" />
                    <Bar dataKey="doimiy" stackId="a" fill={C.red} name={t('rep_profit_fixed_short')} />
                    <Bar dataKey="ozgaruvchan" stackId="a" fill={C.orange} name={t('rep_profit_var_short')} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* === MODAL: Foyda tabida Jami sotuv === */}
              {modal === 'profitSalesTotalModal' && (() => {
                const usedList = (MOCK_USED_SALES || []).filter(s => s.status !== 'cancelled')
                const newFiltered = modalFilter === 'all'
                  ? MOCK_SALES.filter(s => s.status !== 'cancelled')
                  : MOCK_SALES.filter(s => s.status !== 'cancelled' && s.soldAt && s.soldAt.startsWith(modalFilter))
                const usedFiltered = modalFilter === 'all'
                  ? usedList
                  : usedList.filter(s => s.soldAt && s.soldAt.startsWith(modalFilter))
                const filtered = [...newFiltered, ...usedFiltered].sort((a,b)=>(b.soldAt||'').localeCompare(a.soldAt||''))
                const newAmt = newFiltered.reduce((s,x) => s + (x.total||0), 0)
                const usedAmt = usedFiltered.reduce((s,x) => s + (x.total||0), 0)
                const totalAmt = newAmt + usedAmt

                // Oylik chart: yangi + B/U alohida
                const combinedChart = profitStats.monthlyChart.map(m => {
                  const usedMonth = usedList.filter(s => s.soldAt && s.soldAt.startsWith(m.month))
                  const sotuv_bu = usedMonth.reduce((s,x) => s + (x.total||0), 0)
                  return { ...m, sotuv_bu }
                })

                return (
                  <Modal open title={t('rep_modal_profit_sales_title')} subtitle={t('rep_modal_profit_sales_sub')} size="xl" onClose={closeModal}>
                    <div className="flex items-center justify-between mb-5">
                      <MonthYearFilter value={modalFilter} onChange={setModalFilter} />
                      <div className="flex items-center gap-2 text-xs flex-wrap justify-end">
                        <span className="px-2 py-0.5 rounded-full bg-accent-blue/10 text-accent-blue font-bold">{newFiltered.length} Yangi · {fmtUZS(newAmt)}</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 font-bold">{usedFiltered.length} B/U · {fmtUZS(usedAmt)}</span>
                        <span className="text-text-muted">{filtered.length} {t('unit_pcs')} · {fmtUZS(totalAmt)}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {[...combinedChart].reverse().map(m => (
                        <div key={m.month} className="bg-bg-tertiary rounded-xl p-4">
                          <p className="text-text-muted text-xs mb-1">{m.name}</p>
                          <p className="font-syne font-bold text-text-primary text-lg">{fmtUZS(m.sotuv + m.sotuv_bu)}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] text-accent-blue">Yangi: {fmtUZS(m.sotuv)}</span>
                            {m.sotuv_bu > 0 && <span className="text-[10px] text-amber-400">B/U: {fmtUZS(m.sotuv_bu)}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Sotuv: Yangi vs B/U ustunlar */}
                    <div className="mb-4">
                      <p className="text-text-secondary text-sm font-medium mb-2">Yangi va B/U sotuv taqqoslash</p>
                      <div className="h-[180px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={combinedChart}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                            <XAxis dataKey="name" fontSize={10} stroke="var(--text-muted)" />
                            <YAxis hide />
                            <Tooltip
                              cursor={{ fill:'rgba(255,255,255,0.04)' }}
                              offset={10}
                              isAnimationActive={false}
                              wrapperStyle={{ zIndex:9999, pointerEvents:'none' }}
                              contentStyle={{ backgroundColor:'var(--bg-secondary)', borderColor:'var(--border)', borderRadius:'12px', color:'var(--text-primary)' }}
                              itemStyle={{ color:'var(--text-primary)', fontSize:'12px' }}
                              formatter={v => fmtUZS(v)}
                            />
                            <Legend iconType="circle" iconSize={8} />
                            <Bar dataKey="sotuv"    fill={C.blue}   radius={[4,4,0,0]} name="Yangi sotuv" />
                            <Bar dataKey="sotuv_bu" fill="#f59e0b"  radius={[4,4,0,0]} name="B/U sotuv" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <MonthlyDynamicsChart data={combinedChart} dataKey="sotuv" color={C.blue} formatter={v => fmtUZS(v)} name="Yangi sotuv" />
                    <p className="text-text-secondary text-sm font-medium mt-6 mb-3">{t('rep_profit_sales_list')}</p>
                    <ModalTable
                      data={filtered}
                      pageSize={10}
                      columns={[
                        { key:'soldAt',       label:t('col_date'),      render: r => <span className="whitespace-nowrap text-xs">{fmtSoldAt(r.soldAt)}</span> },
                        { key:'items', label:t('col_product'), render: r => <span className="text-xs text-text-secondary">{r.isUsedSale ? (r.items?.[0]?.name || '—') : fmtItems(r.items)}{r.isUsedSale && <span className="ml-1 px-1 py-0.5 rounded bg-amber-400/10 text-amber-400 text-[9px] font-bold">B/U</span>}</span> },
                        { key:'customerName', label:t('col_customer'), render: r => <span className="font-medium text-text-primary text-xs">{r.customerName}</span> },
                        { key:'soldByName',   label:t('col_employee'), render: r => <span className="text-xs text-text-secondary">{r.soldByName||'—'}</span> },
                        { key:'qty',          label:t('rep_col_qty'), align:'center', render: r => <span className="font-bold">{r.isUsedSale ? (r.qty||1) : (r.items?.reduce((s,i)=>s+(i.qty||1),0)||1)}</span> },
                        { key:'discount', label:t('col_discount'), align:'center', render: r => {
                          const er = enrichSale(r)
                          if (r.discount > 0) return <span className="text-accent-orange font-bold text-xs">-{r.discount}%</span>
                          if (er.bundleDiscountAmount > 0) return <span className="text-accent-orange font-bold text-xs whitespace-nowrap">{er.bundleDiscountPercent > 0 ? `-${er.bundleDiscountPercent}% ` : ''}({fmtNum(er.bundleDiscountAmount)} so'm)</span>
                          return <span className="text-text-muted">—</span>
                        }},
                        { key:'total',        label:t('wh_in_total'), align:'right', render: r => <span className="font-bold text-text-primary">{fmtUZS(r.total)}</span> },
                      ]}
                    />
                  </Modal>
                )
              })()}

              {/* === MODAL: Sotuv foydasi === */}
              {modal === 'grossProfitModal' && (() => {
                const filtered = modalFilter === 'all'
                  ? MOCK_SALES.filter(s => s.status !== 'cancelled').sort((a,b)=>(b.soldAt||'').localeCompare(a.soldAt||''))
                  : MOCK_SALES.filter(s => s.status !== 'cancelled' && s.soldAt && s.soldAt.startsWith(modalFilter)).sort((a,b)=>(b.soldAt||'').localeCompare(a.soldAt||''))
                return (
                  <Modal open title={t('rep_modal_gross_title')} subtitle={t('rep_modal_gross_sub')} size="3xl" onClose={closeModal}>
                    <div className="flex items-center justify-between mb-5">
                      <MonthYearFilter value={modalFilter} onChange={setModalFilter} />
                      <span className="text-text-muted text-xs">
                        {t('wh_in_total')}: {(() => { const total = filtered.reduce((s,x) => s+getSaleProfit(x)-(x.paymentType==='installment'?(x.installmentCommissionAmount??0):0), 0); return <span className={`font-bold ${total >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>{fmtUZS(total)}</span> })()}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {[...profitStats.monthlyChart].reverse().map(m => (
                        <div key={m.month} className="bg-bg-tertiary rounded-xl p-4">
                          <p className="text-text-muted text-xs mb-1">{m.name}</p>
                          <p className="font-syne font-bold text-accent-green text-lg">{fmtUZS(m.foyda)}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-text-muted text-xs">
                              {m.sotuv > 0 ? Math.round(m.foyda/m.sotuv*100) : 0}{t('rep_profit_margin_pct')}
                            </span>
                            {m.growthFoyda !== null && <GrowthBadge current={m.foyda} previous={m.foyda/(1+m.growthFoyda/100)} />}
                          </div>
                        </div>
                      ))}
                    </div>
                    <MonthlyDynamicsChart data={profitStats.monthlyChart} dataKey="foyda" color={C.green} formatter={v => fmtUZS(v)} name={t('rep_chart_profit')} />

                    {/* Top-5 foydali tovar */}
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
                      const top5 = Object.entries(prodMap).sort((a,b) => b[1].profit-a[1].profit).slice(0,5)
                      if (top5.length === 0) return null
                      return (
                        <div className="mb-6 mt-6">
                          <p className="text-text-secondary text-sm font-medium mb-3">{t('rep_profit_top5')}</p>
                          <div className="space-y-2">
                            {top5.map(([name, v], i) => (
                              <div key={name} className="flex items-center gap-3 bg-bg-tertiary rounded-xl px-4 py-3">
                                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                  style={{ backgroundColor:[C.green,C.blue,C.orange,C.purple,C.teal][i]+'22', color:[C.green,C.blue,C.orange,C.purple,C.teal][i] }}>
                                  {i+1}
                                </span>
                                <span className="flex-1 text-text-primary text-sm font-medium truncate">{name}</span>
                                <div className="text-right">
                                  <p className="font-bold text-accent-green text-sm">{fmtUZS(Math.round(v.profit))}</p>
                                  <p className="text-text-muted text-xs">{v.count} {t('unit_pcs')}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })()}

                    <p className="text-text-secondary text-sm font-medium mt-6 mb-3">{t('rep_profit_gross_list')}</p>
                    <ModalTable
                      data={filtered}
                      pageSize={10}
                      columns={[
                        { key:'soldAt',       label:t('col_date'),           render: r => <span className="whitespace-nowrap text-xs">{fmtSoldAt(r.soldAt)}</span> },
                        { key:'items',        label:t('col_product'),           render: r => <span className="text-xs text-text-secondary">{fmtItems(r.items)}</span> },
                        { key:'category', label:t('col_category'), render: r => {
                          const er = enrichSale(r)
                          if (er.isBundle) return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase" style={{ backgroundColor:'#E6394622', color:'#E63946' }}>Komplekt</span>
                          const cat = r.items?.[0]?.productId ? (MOCK_PRODUCTS.find(p=>p.id===r.items[0].productId)?.category||'—') : '—'
                          return renderCatBadge(cat)
                        }},
                        { key:'customerName', label:t('col_customer'),           render: r => <span className="font-medium text-text-primary text-xs">{r.customerName}</span> },
                        { key:'soldByName',   label:t('col_employee'),           render: r => <span className="text-xs text-text-secondary">{r.soldByName||'—'}</span> },
                        { key:'purchasePrice',label:t('rep_profit_purchase_price'),       align:'right', render: r => {
                          const total = r.items?.reduce((s,i) => s + (i.purchasePrice || 0) * (i.qty || 1), 0) || 0
                          return <span className="text-text-secondary text-xs">{fmtUZS(total)}</span>
                        }},
                        { key:'total',        label:t('rep_profit_sale_price'),  align:'right', render: r => <span className="text-text-primary text-xs">{fmtUZS(r.total)}</span> },
                        { key:'qty',          label:t('rep_col_qty'), align:'center', render: r => <span className="font-bold">{r.items?.reduce((s,i)=>s+(i.qty||1),0)||1}</span> },
                        { key:'paymentType',  label:t('rep_col_pay_type'), align:'center', render: r => (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="px-2 py-0.5 rounded bg-bg-tertiary border border-border text-[10px] font-bold uppercase text-text-secondary">
                              {{ cash: t('pay_cash'), card: t('pay_card'), installment: t('pay_installment'), transfer: t('sl_hist_pay_bank') }[r.paymentType] || r.paymentType || '—'}
                            </span>
                            {r.paymentType === 'card' && r.cardType && (
                              <span className="text-[10px] text-text-muted font-bold uppercase">{r.cardType}</span>
                            )}
                          </div>
                        )},
                        { key:'profit',       label:t('col_net_profit'),          align:'right', render: r => { const p = getSaleProfit(r); return <span className={`font-bold ${p >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>{fmtUZS(p)}</span> } },
                      ]}
                    />
                  </Modal>
                )
              })()}

              {/* === MODAL: Jami xarajat === */}
              {modal === 'totalExpModal' && (() => {
                const filteredExp = modalFilter === 'all'
                  ? MOCK_EXPENSES
                  : MOCK_EXPENSES.filter(e => e.date && e.date.startsWith(modalFilter))
                const totalOp = filteredExp.reduce((s,e) => s+e.amountUZS, 0)
                const filteredBatches = MOCK_INCOME_BATCHES.filter(x => x.paidUSD > 0 &&
                  (modalFilter === 'all' || x.receivedAt?.startsWith(modalFilter)))
                const totalInventory = filteredBatches.reduce((s,x) => s + Math.round(x.paidUSD * USD_RATE), 0)
                const filteredCap = MOCK_CAPITAL.filter(c => c.type === 'return' &&
                  (modalFilter === 'all' || c.date?.startsWith(modalFilter)))
                const totalCapReturn = filteredCap.reduce((s,c) => s+c.amountUZS, 0)
                return (
                  <Modal open title={t('rep_modal_total_exp_title')} subtitle={t('rep_modal_total_exp_sub')} size="xl" onClose={closeModal}>
                    <div className="flex items-center justify-between mb-5">
                      <MonthYearFilter value={modalFilter} onChange={setModalFilter} />
                      <span className="text-text-muted text-xs">
                        {t('wh_in_total')}: <span className="font-bold text-accent-red">{fmtUZS(totalOp)}</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {profitStats.monthlyChart.map(m => (
                        <div key={m.month} className="bg-bg-tertiary rounded-xl p-4">
                          <p className="text-text-muted text-xs mb-1">{m.name}</p>
                          <p className="font-syne font-bold text-accent-red text-lg">{fmtUZS(m.xarajat)}</p>
                          {m.growthXarajat !== null && <GrowthBadge current={m.xarajat} previous={m.xarajat/(1+m.growthXarajat/100)} />}
                        </div>
                      ))}
                    </div>
                    <MonthlyDynamicsChart data={profitStats.monthlyChart} dataKey="xarajat" color={C.red} formatter={v => fmtUZS(v)} name={t('rep_chart_expense')} />
                    <p className="text-text-secondary text-sm font-medium mt-6 mb-3">{t('rep_profit_exp_list')}</p>
                    <ModalTable
                      data={filteredExp.sort((a,b) => (b.date||'').localeCompare(a.date||''))}
                      pageSize={10}
                      columns={[
                        { key:'date',          label:t('col_date') },
                        { key:'note',          label:t('col_name'), render: r => <span className="font-medium text-text-primary">{getExpNote(r)}</span> },
                        { key:'expenseType',   label:t('rep_profit_type_col'), render: r => (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.expenseType==='fixed' ? 'bg-accent-blue/10 text-accent-blue' : 'bg-accent-orange/10 text-accent-orange'}`}>
                            {r.expenseType === 'fixed' ? t('rep_profit_fixed_short') : t('rep_profit_var_short')}
                          </span>
                        )},
                        { key:'amountUZS', label:t('col_amount'), align:'right', render: r => <span className="font-bold text-accent-red">{fmtUZS(r.amountUZS)}</span> },
                      ]}
                    />
                    {(totalInventory > 0 || totalCapReturn > 0) && (
                      <div className="mt-6 border border-border/50 rounded-xl p-4 bg-bg-tertiary/50">
                        <p className="text-text-muted text-xs font-medium mb-3">{t('rep_profit_extra_outflow')}</p>
                        <div className="flex items-center gap-6">
                          {totalInventory > 0 && (
                            <div>
                              <p className="text-text-muted text-xs">{t('rep_profit_inventory_paid')}</p>
                              <p className="font-bold text-accent-blue">{fmtUZS(totalInventory)}</p>
                            </div>
                          )}
                          {totalCapReturn > 0 && (
                            <div>
                              <p className="text-text-muted text-xs">{t('rep_profit_capital_return')}</p>
                              <p className="font-bold text-accent-orange">{fmtUZS(totalCapReturn)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Modal>
                )
              })()}

              {/* === MODAL: Sof foyda === */}
              {modal === 'netProfitModal' && (() => {
                const filtered = (modalFilter === 'all'
                  ? profitStats.dailyBreakdown
                  : profitStats.dailyBreakdown.filter(d => d.date.startsWith(modalFilter))
                ).slice().sort((a,b) => b.date.localeCompare(a.date))
                return (
                  <Modal open title={t('rep_modal_net_title')} subtitle={t('rep_modal_net_sub')} size="xl" onClose={closeModal}>
                    <div className="flex items-center justify-between mb-5">
                      <MonthYearFilter value={modalFilter} onChange={setModalFilter} />
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-text-muted">{t('rep_profit_total_net_prefix')} <span className="font-bold" style={{ color: (profitStats.netProfit + usedData.totalProfit)>=0?C.green:C.red }}>{fmtUZS(profitStats.netProfit + usedData.totalProfit)}</span></span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {profitStats.monthlyChart.map(m => (
                        <div key={m.month} className="bg-bg-tertiary rounded-xl p-4">
                          <p className="text-text-muted text-xs mb-1">{m.name}</p>
                          <p className="font-syne font-bold text-lg" style={{ color: m.sof>=0?C.green:C.red }}>{fmtUZS(m.sof)}</p>
                          {m.growthSof !== null && <GrowthBadge current={m.sof} previous={m.sof/(1+m.growthSof/100)} />}
                        </div>
                      ))}
                    </div>
                    <MonthlyDynamicsChart data={profitStats.monthlyChart} dataKey="sof" color={C.green} formatter={v => fmtUZS(v)} name={t('col_net_profit')} />
                    <p className="text-text-secondary text-sm font-medium mt-6 mb-3">{t('rep_profit_daily_breakdown')}</p>
                    <ModalTable
                      data={filtered}
                      pageSize={10}
                      columns={[
                        { key:'date',     label:t('col_date') },
                        { key:'revenue',  label:t('rep_profit_revenue_col'),  align:'right', render: r => fmtUZS(r.revenue) },
                        { key:'profit',   label:t('col_gross_profit'), align:'right', render: r => <span className="text-accent-green font-bold">{fmtUZS(r.profit)}</span> },
                        { key:'usedProfit', label: t('rep_bu_col_profit'), align:'right', render: r => <span className="text-accent-orange font-bold">{fmtUZS(r.usedProfit)}</span> },
                        { key:'expenses', label:t('rep_profit_expense_col'),  align:'right', render: r => <span className="text-accent-red">{fmtUZS(r.expenses)}</span> },
                        { key:'net',      label:t('col_net_profit'), align:'right', render: r => (
                          <span className="font-bold" style={{ color: r.net>=0?C.green:C.red }}>{fmtUZS(r.net)}</span>
                        )},
                      ]}
                    />
                  </Modal>
                )
              })()}

              {modal === 'combinedProfitModal' && (() => {
                const rows = [...profitStats.monthlyChart].reverse().map(m => {
                  const usedSales = MOCK_USED_SALES.filter(s => s.status !== 'cancelled' && s.soldAt && s.soldAt.startsWith(m.month))
                  const usedProfit = usedSales.reduce((s,x) => {
                    const commission = x.paymentType === 'installment' ? (x.installmentCommissionAmount ?? 0) : 0
                    return s + getUsedSaleProfit(x) - commission
                  }, 0)
                  return { month: m.month, name: m.name, newProfit: m.foyda, usedProfit, total: m.foyda + usedProfit }
                })
                const filtered = modalFilter === 'all' ? rows : rows.filter(r => r.month === modalFilter)
                return (
                  <Modal open title={t('rep_profit_combined_modal_title')} subtitle={t('rep_profit_combined_modal_sub')} size="lg" onClose={closeModal}>
                    <div className="flex items-center justify-between mb-5">
                      <MonthYearFilter value={modalFilter} onChange={setModalFilter} />
                      <span className="text-text-muted text-xs">
                        {t('rep_bu_modal_total')}: <span className="font-bold text-purple-500">{fmtUZS(profitStats.totalProfit + usedData.totalProfit)}</span>
                      </span>
                    </div>
                    <ModalTable
                      data={filtered}
                      pageSize={12}
                      columns={[
                        { key:'name',       label: t('rep_bu_col_month') },
                        { key:'newProfit',  label: t('rep_profit_col_new_profit'), align:'right', render: r => <span className="font-bold text-accent-blue">{fmtUZS(r.newProfit)}</span> },
                        { key:'usedProfit', label: t('rep_bu_col_profit'),         align:'right', render: r => <span className="font-bold text-accent-orange">{fmtUZS(r.usedProfit)}</span> },
                        { key:'total',      label: t('rep_profit_col_combined_total'), align:'right', render: r => <span className="font-bold text-purple-500">{fmtUZS(r.total)}</span> },
                      ]}
                    />
                  </Modal>
                )
              })()}

              {modal === 'breakEvenModal' && (() => {
                const _beMonthsSet = new Set()
                _beMonthsSet.add(new Date().toISOString().slice(0, 7))
                MOCK_SALES.forEach(s => { if (s.soldAt) _beMonthsSet.add(s.soldAt.slice(0, 7)) })
                MOCK_EXPENSES.forEach(e => { if (e.date) _beMonthsSet.add(e.date.slice(0, 7)) })
                const MONTHS_BE = Array.from(_beMonthsSet).sort().reverse()
                const monthNames_BE = {}
                MONTHS_BE.forEach(m => { monthNames_BE[m] = getMonthLabel(m) })
                const filteredMonths_BE = modalFilter === 'all'
                  ? MONTHS_BE
                  : MONTHS_BE.filter(m => m === modalFilter)

                // Filtr bo'yicha sotuv va xarajat
                const filtSales = modalFilter === 'all'
                  ? MOCK_SALES.filter(s => s.status !== 'cancelled')
                  : MOCK_SALES.filter(s => s.status !== 'cancelled' && s.soldAt && s.soldAt.startsWith(modalFilter))
                const filtUsed = (MOCK_USED_SALES || []).filter(s => s.status !== 'cancelled' &&
                  (modalFilter === 'all' || (s.soldAt && s.soldAt.startsWith(modalFilter))))
                const filtExp = modalFilter === 'all'
                  ? MOCK_EXPENSES
                  : MOCK_EXPENSES.filter(e => e.date && e.date.startsWith(modalFilter))
                const filtSalesAmt = filtSales.reduce((s,x) => s+x.total, 0) + filtUsed.reduce((s,x) => s+(x.total||0), 0)
                const filtBreakEven = filtExp.reduce((s,x) => s+x.amountUZS, 0)
                const filtPct = filtBreakEven > 0 ? Math.min(100, Math.round(filtSalesAmt/filtBreakEven*100)) : 0

                return (
                <Modal open title={t('rep_profit_breakeven')} subtitle={t('rep_modal_breakeven_sub')} size="lg" onClose={closeModal}>
                  {/* Filtr */}
                  <div className="flex items-center justify-between mb-5">
                    <MonthYearFilter value={modalFilter} onChange={setModalFilter} />
                    <span className="text-text-muted text-xs">
                      {modalFilter === 'all' ? t('rep_profit_filter_all_time') : monthNames_BE[modalFilter]}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-bg-tertiary rounded-xl p-5">
                      <p className="text-text-muted text-xs mb-1">{t('rep_profit_breakeven')}</p>
                      <p className="font-syne font-bold text-accent-blue text-2xl">{fmtUZS(filtBreakEven)}</p>
                      <p className="text-text-muted text-xs mt-1">{t('rep_profit_total_expenses_hint')}</p>
                    </div>
                    <div className="bg-bg-tertiary rounded-xl p-5">
                      <p className="text-text-muted text-xs mb-1">{t('rep_profit_current_sales')}</p>
                      <p className="font-syne font-bold text-text-primary text-2xl">{fmtUZS(filtSalesAmt)}</p>
                      <p className={`text-xs mt-1 font-bold ${filtSalesAmt >= filtBreakEven ? 'text-accent-green' : 'text-accent-red'}`}>
                        {filtSalesAmt >= filtBreakEven
                          ? t('rep_profit_covered')
                          : t('rep_profit_short', { value: fmtUZS(filtBreakEven - filtSalesAmt) })}
                      </p>
                    </div>
                  </div>
                  <div className="mb-6">
                    <p className="text-text-secondary text-sm font-medium mb-2">{t('rep_profit_coverage_level')}</p>
                    <div className="w-full bg-bg-tertiary rounded-full h-5">
                      <div className="h-5 rounded-full transition-all flex items-center justify-end pr-2"
                        style={{
                          width: `${filtPct}%`,
                          backgroundColor: filtSalesAmt >= filtBreakEven ? C.green : C.red,
                          minWidth: filtPct > 0 ? '2.5rem' : 0
                        }}>
                        <span className="text-white text-[10px] font-bold">{filtPct}%</span>
                      </div>
                    </div>
                  </div>
                  {/* Oylik jadval */}
                  <p className="text-text-secondary text-sm font-medium mb-3">{t('rep_profit_monthly_history')}</p>
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-bg-tertiary border-b border-border">
                          <th className="text-left px-4 py-3 font-medium text-text-secondary flex items-center gap-2">{t('rep_profit_month_col')} <MonthSortBtn /></th>
                          <th className="text-right px-4 py-3 font-medium text-text-secondary">{t('rep_profit_breakeven_col')}</th>
                          <th className="text-right px-4 py-3 font-medium text-text-secondary">{t('rep_chart_sales')}</th>
                          <th className="text-right px-4 py-3 font-medium text-text-secondary">{t('rep_profit_gross_label')}</th>
                          <th className="text-center px-4 py-3 font-medium text-text-secondary">{t('col_status')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {(msd==='desc' ? [...filteredMonths_BE].sort((a,b)=>b.localeCompare(a)) : [...filteredMonths_BE].sort((a,b)=>a.localeCompare(b))).map(m => {
                          const mData = combinedMonthlyChart.find(x => x.month === m)
                          if (!mData) return null
                          return (
                            <tr key={m} className="hover:bg-bg-tertiary transition-colors">
                              <td className="px-4 py-3 font-medium text-text-primary">{monthNames_BE[m]}</td>
                              <td className="px-4 py-3 text-right text-text-secondary">{fmtUZS(mData.xarajat)}</td>
                              <td className="px-4 py-3 text-right font-bold text-text-primary">
                                {fmtUZS(mData.sotuv_total)}
                                {mData.sotuv_bu > 0 && <span className="block text-[10px] text-amber-400 font-normal">+{fmtUZS(mData.sotuv_bu)} B/U</span>}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-accent-green">{fmtUZS(mData.foyda || 0)}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${mData.sotuv_total >= mData.xarajat ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>
                                  {mData.sotuv_total >= mData.xarajat ? t('rep_profit_status_ok') : t('rep_profit_status_fail')}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </Modal>
                )
              })()}

              {/* === MODAL: Doimiy xarajatlar === */}
              {modal === 'fixedExpModal' && (() => {
                const fixedList = MOCK_EXPENSES.filter(e => e.expenseType === 'fixed')
                return (
                  <Modal open title={t('rep_profit_fixed_exp')} subtitle={t('rep_modal_fixed_exp_sub')} size="lg" onClose={closeModal}>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-bg-tertiary rounded-xl p-4">
                        <p className="text-text-muted text-xs mb-1">{t('rep_profit_current_period')}</p>
                        <p className="font-syne font-bold text-accent-red text-xl">{fmtUZS(profitStats.fixedExpenses)}</p>
                      </div>
                      <div className="bg-bg-tertiary rounded-xl p-4">
                        <p className="text-text-muted text-xs mb-1">{t('rep_profit_next_month_forecast')}</p>
                        <p className="font-syne font-bold text-accent-orange text-xl">{fmtUZS(financeStats.fixedNextMonth)}</p>
                      </div>
                    </div>
                    {/* Oylik dinamika */}
                    <div className="mb-6">
                      <p className="text-text-secondary text-sm font-medium mb-3">{t('rep_profit_monthly_fixed')}</p>
                      <div className="space-y-2 overflow-y-auto max-h-[200px] mb-6">
                        {sortMonths(profitStats.expByMonth).map(m => (
                          <div key={m.month} className="flex items-center justify-between bg-bg-tertiary rounded-xl px-4 py-3">
                            <span className="font-medium text-text-primary">{m.name}</span>
                            <div className="flex items-center gap-3">
                              {m.growthDoimiy !== null && <GrowthBadge current={m.doimiy} previous={m.doimiy/(1+m.growthDoimiy/100)} />}
                              <span className="font-bold text-accent-red">{fmtUZS(m.doimiy)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="text-text-secondary text-sm font-medium mb-3">{t('rep_profit_fixed_list')}</p>
                    <ModalTable
                      data={fixedList}
                      pageSize={10}
                      columns={[
                        { key:'date',          label:t('col_date') },
                        { key:'note', label:t('col_name'), render: r => <span className="font-medium text-text-primary">{getExpNote(r)}</span> },
                        { key:'amountUZS',     label:t('col_amount'), align:'right', render: r => <span className="font-bold text-accent-red">{fmtUZS(r.amountUZS)}</span> },
                      ]}
                    />
                  </Modal>
                )
              })()}

              {/* === MODAL: O'zgaruvchan xarajatlar === */}
              {modal === 'varExpModal' && (() => {
                const allVar = MOCK_EXPENSES.filter(e => e.expenseType === 'variable')
                const varList = varMonthFilter === 'all' ? allVar : allVar.filter(e => e.date && e.date.startsWith(varMonthFilter))
                const catMap = {}
                varList.forEach(e => {
                  const key = i18n.language === 'ru' ? (e.noteRu || e.note || e.categoryLabel || 'Прочее') : (e.note || e.categoryLabel || 'Boshqa')
                  catMap[key] = (catMap[key]||0) + e.amountUZS
                })
                const varTotal = varList.reduce((s,e) => s+e.amountUZS, 0)
                const catData = Object.entries(catMap).sort((a,b) => b[1]-a[1])
                const totalVar = varList.reduce((s,e) => s+e.amountUZS, 0)
                const colors = [C.orange, C.blue, C.purple, C.teal, C.pink, C.green]
                return (
                  <Modal open title={t('rep_profit_var_exp')} subtitle={t('rep_modal_var_exp_sub')} size="lg" onClose={closeModal}>
                    <div className="flex items-center justify-between mb-5">
                      <MonthYearFilter value={varMonthFilter} onChange={setVarMonthFilter} />
                      <span className="text-text-muted text-xs">{t('wh_in_total')}: <span className="font-bold text-accent-orange">{fmtUZS(varTotal)}</span></span>
                    </div>
                    <div className="mb-6">
                      <p className="text-text-secondary text-sm font-medium mb-3">{t('rep_profit_cat_dist')}</p>
                      <div className="space-y-2">
                        {catData.map(([name, val], i) => {
                          const pct = totalVar > 0 ? Math.round(val/totalVar*100) : 0
                          return (
                            <div key={name}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-text-primary text-sm">{name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-text-muted text-xs">{pct}%</span>
                                  <span className="font-bold text-text-primary">{fmtUZS(val)}</span>
                                </div>
                              </div>
                              <div className="w-full bg-bg-tertiary rounded-full h-2">
                                <div className="h-2 rounded-full" style={{ width:`${pct}%`, backgroundColor: colors[i%colors.length] }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    <p className="text-text-secondary text-sm font-medium mb-3">{t('rep_profit_detail_list')}</p>
                    <ModalTable
                      data={varList.sort((a,b) => b.amountUZS - a.amountUZS)}
                      pageSize={10}
                      columns={[
                        { key:'date',          label:t('col_date') },
                        { key:'note', label:t('col_name'), render: r => <span className="font-medium text-text-primary">{getExpNote(r)}</span> },
                        { key:'amountUZS',     label:t('col_amount'), align:'right', render: r => <span className="font-bold text-accent-orange">{fmtUZS(r.amountUZS)}</span> },
                      ]}
                    />
                  </Modal>
                )
              })()}

              {/* === MODAL: Foyda dinamikasi === */}
              {modal === 'profitDynamicsModal' && (
                <Modal open title={t('rep_modal_profit_dyn_title')} subtitle={t('rep_modal_profit_dyn_sub')} size="xl" onClose={closeModal}>
                  {/* Yillik summary */}
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    <div className="bg-bg-tertiary rounded-xl p-4">
                      <p className="text-text-muted text-xs mb-1">{t('rep_profit_total_sales_label')}</p>
                      <p className="font-syne font-bold text-lg" style={{ color: C.blue }}>
                        {fmtUZS(combinedMonthlyChart.reduce((s,m) => s + m.sotuv_total, 0))}
                      </p>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] text-accent-blue">Yangi: {fmtUZS(combinedMonthlyChart.reduce((s,m)=>s+m.sotuv,0))}</span>
                        <span className="text-[10px] text-amber-400">B/U: {fmtUZS(combinedMonthlyChart.reduce((s,m)=>s+m.sotuv_bu,0))}</span>
                      </div>
                    </div>
                    <div className="bg-bg-tertiary rounded-xl p-4">
                      <p className="text-text-muted text-xs mb-1">{t('rep_profit_total_exp_label')}</p>
                      <p className="font-syne font-bold text-lg" style={{ color: C.red }}>
                        {fmtUZS(combinedMonthlyChart.reduce((s,m) => s+m.xarajat, 0))}
                      </p>
                    </div>
                    <div className="bg-bg-tertiary rounded-xl p-4">
                      <p className="text-text-muted text-xs mb-1">{t('col_gross_profit')}</p>
                      <p className="font-syne font-bold text-lg" style={{ color: C.green }}>
                        {fmtUZS(combinedMonthlyChart.reduce((s,m) => s+m.foyda_total, 0))}
                      </p>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] text-accent-green">Yangi: {fmtUZS(combinedMonthlyChart.reduce((s,m)=>s+m.foyda,0))}</span>
                        <span className="text-[10px] text-amber-400">B/U: {fmtUZS(combinedMonthlyChart.reduce((s,m)=>s+m.foyda_bu,0))}</span>
                      </div>
                    </div>
                    <div className="bg-bg-tertiary rounded-xl p-4">
                      <p className="text-text-muted text-xs mb-1">{t('col_net_profit')}</p>
                      <p className="font-syne font-bold text-lg" style={{ color: C.teal }}>
                        {fmtUZS(combinedMonthlyChart.reduce((s,m) => s+m.sof_total, 0))}
                      </p>
                    </div>
                  </div>
                  {/* Grafik */}
                  <div className="h-[280px] w-full mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={combinedMonthlyChart}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="name" fontSize={11} stroke="var(--text-muted)" />
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
                        <Bar dataKey="sotuv"       fill={C.blue}   radius={[4,4,0,0]} name="Yangi sotuv" />
                        <Bar dataKey="sotuv_bu"    fill="#f59e0b"  radius={[4,4,0,0]} name="B/U sotuv" />
                        <Bar dataKey="xarajat"     fill={C.red}    radius={[4,4,0,0]} name={t('rep_chart_expense')} />
                        <Bar dataKey="foyda_total" fill={C.green}  radius={[4,4,0,0]} name={t('rep_profit_gross_label')} />
                        <Bar dataKey="sof_total"   fill={C.teal}   radius={[4,4,0,0]} name={t('col_net_profit')} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Jadval */}
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-bg-tertiary border-b border-border">
                          <th className="text-left px-4 py-3 font-medium text-text-secondary flex items-center gap-2">{t('rep_profit_month_col')} <MonthSortBtn /></th>
                          <th className="text-right px-4 py-3 font-medium" style={{ color: C.blue }}>Yangi sotuv</th>
                          <th className="text-right px-4 py-3 font-medium" style={{ color: '#f59e0b' }}>B/U sotuv</th>
                          <th className="text-right px-4 py-3 font-medium text-text-secondary">Jami sotuv</th>
                          <th className="text-right px-4 py-3 font-medium" style={{ color: C.red }}>{t('rep_chart_expense')}</th>
                          <th className="text-right px-4 py-3 font-medium" style={{ color: C.green }}>{t('rep_profit_gross_label')}</th>
                          <th className="text-right px-4 py-3 font-medium" style={{ color: C.teal }}>{t('col_net_profit')}</th>
                          <th className="text-center px-4 py-3 font-medium text-text-secondary">{t('rep_profit_growth_col')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {sortMonths(combinedMonthlyChart).map(m => (
                          <tr key={m.month} className="hover:bg-bg-tertiary transition-colors">
                            <td className="px-4 py-3 font-medium text-text-primary">{m.name}</td>
                            <td className="px-4 py-3 text-right text-accent-blue">{fmtUZS(m.sotuv)}</td>
                            <td className="px-4 py-3 text-right text-amber-400">{fmtUZS(m.sotuv_bu)}</td>
                            <td className="px-4 py-3 text-right font-bold text-text-primary">{fmtUZS(m.sotuv_total)}</td>
                            <td className="px-4 py-3 text-right text-accent-red">{fmtUZS(m.xarajat)}</td>
                            <td className="px-4 py-3 text-right text-accent-green font-bold">{fmtUZS(m.foyda_total)}</td>
                            <td className="px-4 py-3 text-right font-bold" style={{ color: m.sof_total>=0?C.teal:C.red }}>{fmtUZS(m.sof_total)}</td>
                            <td className="px-4 py-3 text-center">
                              {m.growthSof !== null
                                ? <GrowthBadge current={m.sof} previous={m.sof/(1+m.growthSof/100)} />
                                : <span className="text-text-muted text-xs">—</span>
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Modal>
              )}

              {/* === MODAL: Xarajatlar taqsimoti === */}
              {modal === 'expDistModal' && (() => {
                const filtered = modalFilter === 'all'
                  ? MOCK_EXPENSES
                  : MOCK_EXPENSES.filter(e => e.date && e.date.startsWith(modalFilter))
                const catMap = {}
                filtered.forEach(e => {
                  const key = i18n.language === 'ru' ? (e.noteRu || e.note || e.categoryLabel || 'Прочее') : (e.note || e.categoryLabel || 'Boshqa')
                  catMap[key] = (catMap[key]||0) + e.amountUZS
                })
                const catData = Object.entries(catMap).sort((a,b) => b[1]-a[1])
                const total = filtered.reduce((s,e) => s+e.amountUZS, 0)
                const colors = [C.red, C.orange, C.blue, C.green, C.purple, C.pink, C.teal, C.muted]
                return (
                  <Modal open title={t('rep_profit_exp_dist_title')} subtitle={t('rep_modal_exp_dist_sub')} size="lg" onClose={closeModal}>
                    <div className="flex items-center justify-between mb-5">
                      <MonthYearFilter value={modalFilter} onChange={setModalFilter} />
                      <span className="text-text-muted text-xs">{t('wh_in_total')}: <span className="font-bold text-accent-red">{fmtUZS(total)}</span></span>
                    </div>
                    <div className="space-y-3 mb-6">
                      {catData.map(([name, val], i) => {
                        const pct = total > 0 ? Math.round(val/total*100) : 0
                        return (
                          <div key={name} className="bg-bg-tertiary rounded-xl px-4 py-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i%colors.length] }} />
                                <span className="text-text-primary text-sm font-medium">{name}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-text-muted text-xs">{pct}%</span>
                                <span className="font-bold text-text-primary">{fmtUZS(val)}</span>
                              </div>
                            </div>
                            <div className="w-full bg-bg-secondary rounded-full h-1.5">
                              <div className="h-1.5 rounded-full" style={{ width:`${pct}%`, backgroundColor: colors[i%colors.length] }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {/* Oylik o'sish */}
                    <p className="text-text-secondary text-sm font-medium mb-3">{t('rep_profit_monthly_exp_dynamics')}</p>
                    <MonthlyDynamicsChart data={profitStats.monthlyChart} dataKey="xarajat" color={C.red} formatter={v => fmtUZS(v)} name={t('rep_chart_expense')} />
                  </Modal>
                )
              })()}

              {/* === MODAL: Xarajat trendi === */}
              {modal === 'expTrendModal' && (
                <Modal open title={t('rep_modal_exp_trend_title')} subtitle={t('rep_modal_exp_trend_sub')} size="xl" onClose={closeModal}>
                  <div className="h-[280px] w-full mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={profitStats.expByMonth}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="name" fontSize={11} stroke={C.muted} />
                        <YAxis hide />
                        <Tooltip
                          cursor={{ fill:'rgba(255,255,255,0.04)' }}
                          formatter={v => fmtUZS(v)}
                          contentStyle={{ backgroundColor:'var(--bg-secondary)', borderColor:'var(--border)', borderRadius:'12px', color:'var(--text-primary)' }}
                          itemStyle={{ color:'var(--text-primary)', fontSize:'12px' }}
                          offset={10}
                          isAnimationActive={false}
                          wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }} />
                        <Legend iconType="circle" />
                        <Bar dataKey="doimiy"      stackId="a" fill={C.red}    name={t('rep_profit_fixed_short')} />
                        <Bar dataKey="ozgaruvchan" stackId="a" fill={C.orange} name={t('rep_profit_var_short')} radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-bg-tertiary border-b border-border">
                          <th className="text-left px-4 py-3 font-medium text-text-secondary flex items-center gap-2">{t('rep_profit_month_col')} <MonthSortBtn /></th>
                          <th className="text-right px-4 py-3 font-medium" style={{ color: C.red }}>{t('rep_profit_fixed_short')}</th>
                          <th className="text-right px-4 py-3 font-medium" style={{ color: C.orange }}>{t('rep_profit_var_short')}</th>
                          <th className="text-right px-4 py-3 font-medium text-text-secondary">{t('wh_in_total')}</th>
                          <th className="text-center px-4 py-3 font-medium text-text-secondary">{t('rep_profit_fixed_short')} %</th>
                          <th className="text-center px-4 py-3 font-medium" style={{ color: C.orange }}>{t('rep_profit_var_short')} %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {sortMonths(profitStats.expByMonth).map(m => {
                          const total = m.doimiy + m.ozgaruvchan
                          const fixedPct = total > 0 ? Math.round(m.doimiy/total*100) : 0
                          const varPct = total > 0 ? 100 - fixedPct : 0
                          return (
                            <tr key={m.month} className="hover:bg-bg-tertiary transition-colors">
                              <td className="px-4 py-3 font-medium text-text-primary">{m.name}</td>
                              <td className="px-4 py-3 text-right" style={{ color: C.red }}>{fmtUZS(m.doimiy)}</td>
                              <td className="px-4 py-3 text-right" style={{ color: C.orange }}>{fmtUZS(m.ozgaruvchan)}</td>
                              <td className="px-4 py-3 text-right font-bold text-text-primary">{fmtUZS(total)}</td>
                              <td className="px-4 py-3 text-center">
                                <span className="font-bold text-sm" style={{ color: fixedPct>70?C.red:fixedPct>50?C.orange:C.green }}>
                                  {fixedPct}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="font-bold text-sm" style={{ color: varPct>70?C.orange:C.green }}>
                                  {varPct}%
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </Modal>
              )}
            </>
          )

  )
}

export default ProfitTab
