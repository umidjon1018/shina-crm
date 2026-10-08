import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, BarChart2, Bell, BellOff, CheckCircle, ChevronRight, DollarSign, Eye, EyeOff, KeyRound, MapPin, Package, Pencil, Percent, Plus, Settings, ShieldAlert, Store, Target, ToggleLeft, ToggleRight, Trash2, TrendingUp, User, X } from 'lucide-react'
import { getRolePriority } from './salesHelpers'

const SalesRulesSection = ({ ctx, show = {} }) => {
  const { t, i18n } = useTranslation()
  const {
    // auth & stores
    user, notifications, notificationSettings,
    markRead, markAllRead, removeNotification, removeAllNotifications, updateNotification, getUnreadCount,
    employees, addEmployee, updateEmployee, removeEmployee, requestEmployeeDeletion,
    employeeEditLocked, addEmployeeEditHistory,
    productCategories, addProductCategory, updateProductCategory, toggleProductCategory,
    sources, addSource, updateSource, toggleSource, removeSource,
    deleteSourceConfirm, setDeleteSourceConfirm,
    installmentOrganizations, addInstallmentOrg, updateInstallmentOrg, toggleInstallmentOrg, removeInstallmentOrg,
    monthlyTargets, setMonthlyTarget, employeeTargets, setEmployeeTarget,
    toggleNotification,
    loyaltyVisitsRequired, loyaltyDiscountPercent, silverVisits,
    discountSmallMax, discountMediumMax,
    companyName, companyLogo, setCompanyName, setCompanyLogo,
    sidebarLabels, hiddenPages, setSidebarLabel, toggleHiddenPage,
    aiApiKey, aiApiProvider, setAiApiKey, setAiApiProvider,
    roleAccessTrees, customRoles,
    downloadEnabled, toggleDownloadEnabled,
    shops, bump,
    // state
    activeTab, setActiveTab,
    filterType, setFilterType,
    searchQuery, setSearchQuery,
    editingProduct, setEditingProduct,
    deleteProductConfirm, setDeleteProductConfirm,
    barcodeInfoModal, setBarcodeInfoModal,
    showTransferredModal, setShowTransferredModal,
    promos, setPromos, showPromoModal, setShowPromoModal,
    editingPromo, setEditingPromo, promoForm, setPromoForm,
    deletePromoTarget, setDeletePromoTarget, promoFormError, setPromoFormError,
    reloadPromos, openAddPromo, openEditPromo, savePromo, togglePromoActive, removePromo,
    loyaltyForm, setLoyaltyForm, discountForm, setDiscountForm, saved, setSaved,
    batches, setBatches, items, setItems,
    selectedBatchId, setSelectedBatchId,
    barcodePage, setBarcodePage, productsPage, setProductsPage, ITEMS_PER_PAGE,
    barcodeLoading, setBarcodeLoading,
    showCategoryForm, setShowCategoryForm, newCategory, setNewCategory,
    editingCategory, setEditingCategory,
    selectedEmployee, setSelectedEmployee,
    showEmpForm, setShowEmpForm, editingEmployee, setEditingEmployee,
    empDeleteTarget, setEmpDeleteTarget,
    empModalTab, setEmpModalTab, empForm, setEmpForm,
    showEmpPassword, setShowEmpPassword,
    showEmpPassValue, setShowEmpPassValue,
    empPasswordForm, setEmpPasswordForm, empPasswordSaved, setEmpPasswordSaved,
    statsMonth, setStatsMonth, closeEmpModal,
    editingSilverVisits, setEditingSilverVisits,
    editingGoldVisits, setEditingGoldVisits,
    usdForm, setUsdForm, usdSaved, setUsdSaved,
    companyNameForm, setCompanyNameForm, companySaved, setCompanySaved,
    monthlyTargetMonth, setMonthlyTargetMonth,
    monthlyTargetAmount, setMonthlyTargetAmount,
    monthlyTargetSaved, setMonthlyTargetSaved,
    empTargetId, setEmpTargetId, empTargetMonth, setEmpTargetMonth,
    empTargetAmount, setEmpTargetAmount, empTargetSaved, setEmpTargetSaved,
    showSourceModal, setShowSourceModal, newSourceLabel, setNewSourceLabel,
    editingSourceId, setEditingSourceId, editingSourceValue, setEditingSourceValue,
    showOrgModal, setShowOrgModal, editingOrg, setEditingOrg,
    deleteOrgConfirm, setDeleteOrgConfirm, orgForm, setOrgForm,
    showAiKey, setShowAiKey,
    sortedProducts, pagedProducts, totalProductPages, sortField, sortDir, handleSort,
    sortConfig,
    filteredBarcodeItems, totalBarcodePages, pagedBarcodeItems,
    filteredNotifications, unreadCount,
    flattenedEmployeeTargets,
    handleSave, handleAllowReprint, getMonthOptions,
    formatDate, MONTHS, som, pcs, ALL_TERM_OPTIONS,
    roleLabels, barcodeSelectClass,
    currentYear, currentMonth,
    PROMO_TYPES_MG, usdRate, setUsdRate,
    updateSettings,
    refreshProducts, productSearch, setProductSearch,
    productCatFilter, setProductCatFilter,
    MOCK_SALES, MOCK_CUSTOMERS, MOCK_PRODUCTS, MOCK_BATCHES,
  } = ctx

  return (
    <>
          <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 sm:space-y-6 max-w-2xl">
            
            {show.usd !== false && (<>
            {/* BLOK 1 — USD kursi */}
            <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-green/10 text-accent-green rounded-xl flex items-center justify-center">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h3 className="font-syne font-bold text-text-primary text-base">{t('mgmt_usd_title')}</h3>
                  <p className="text-xs text-text-muted">{t('mgmt_usd_subtitle')}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">1 USD =</span>
                  <input
                    type="number"
                    value={usdForm}
                    onChange={e => setUsdForm(Number(e.target.value))}
                    className="w-full bg-bg-tertiary border border-border rounded-xl pl-16 pr-12 py-2.5 text-text-primary focus:outline-none focus:border-accent-red font-semibold text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">{som}</span>
                </div>
                <button
                  onClick={() => {
                    setUsdRate(Number(usdForm))
                    setUsdSaved(true)
                    setTimeout(() => setUsdSaved(false), 2000)
                  }}
                  className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-1 flex-shrink-0 ${
                    usdSaved ? 'bg-accent-green text-white' : 'bg-accent-red text-white hover:opacity-90 shadow-glow-red'
                  }`}
                >
                  {usdSaved ? <CheckCircle size={16} /> : t('mgmt_btn_save')}
                </button>
              </div>
            </div>

            </>)}
            {show.targets !== false && (<>
            {/* BLOK 2 — Do'kon oylik maqsadi */}
            <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-red/10 text-accent-red rounded-xl flex items-center justify-center">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h3 className="font-syne font-bold text-text-primary text-base">{t('mgmt_shop_target_title')}</h3>
                  <p className="text-xs text-text-muted">{t('mgmt_shop_target_subtitle')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">{t('mgmt_shop_target_select_month')}</label>
                  <select
                    value={monthlyTargetMonth}
                    onChange={e => setMonthlyTargetMonth(e.target.value)}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-text-primary text-xs focus:outline-none focus:border-accent-red font-semibold"
                  >
                    {getMonthOptions().map(o => (
                      <option key={o.key} value={o.key}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-text-secondary text-xs block">{t('mgmt_shop_target_amount_label')} ({som})</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={monthlyTargetAmount}
                      onChange={e => setMonthlyTargetAmount(e.target.value)}
                      placeholder={t('mgmt_shop_target_ph')}
                      className="flex-1 bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-text-primary text-xs focus:outline-none focus:border-accent-red font-semibold"
                    />
                    <button
                      onClick={() => {
                        if (!monthlyTargetMonth || !monthlyTargetAmount) return
                        setMonthlyTarget(monthlyTargetMonth, Number(monthlyTargetAmount))
                        setMonthlyTargetSaved(true)
                        setMonthlyTargetAmount('')
                        setTimeout(() => setMonthlyTargetSaved(false), 2000)
                      }}
                      className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                        monthlyTargetSaved ? 'bg-accent-green text-white' : 'bg-accent-red text-white hover:opacity-90 shadow-glow-red'
                      }`}
                    >
                      {monthlyTargetSaved ? '✅' : t('mgmt_btn_save')}
                    </button>
                  </div>
                </div>
              </div>

              {Object.keys(monthlyTargets).length > 0 && (
                <div className="pt-4 border-t border-border/50">
                  <p className="text-xs text-text-muted mb-2 uppercase font-semibold">{t('mgmt_saved_targets')}</p>
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                    {Object.entries(monthlyTargets)
                      .sort((a, b) => b[0].localeCompare(a[0]))
                      .map(([month, amt]) => {
                        const [y, m] = month.split('-').map(Number)
                        const monthLabel = `${MONTHS[m - 1]} ${y}`
                        const isCurrent = y === currentYear && m === currentMonth
                        const isPast = y < currentYear || (y === currentYear && m < currentMonth)
                        
                        return (
                          <div
                            key={month}
                            className={`py-3 text-xs border-b border-border/30 last:border-b-0 space-y-2 transition-opacity ${
                              isPast ? 'opacity-70' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-text-secondary">{monthLabel}</span>
                                {isCurrent && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-accent-green/10 text-accent-green">
                                    {t('mgmt_current_month')}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-text-primary">
                                  {amt.toLocaleString('uz-UZ')} {som}
                                </span>
                                {isCurrent && (
                                  <button
                                    onClick={() => {
                                      setMonthlyTargetMonth(month)
                                      setMonthlyTargetAmount(amt)
                                    }}
                                    className="p-1 hover:bg-bg-tertiary rounded text-text-secondary hover:text-text-primary transition-colors"
                                    title={t('edit')}
                                  >
                                    <Pencil size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {/* Progress bar */}
                            {(() => {
                              const actual = MOCK_SALES
                                .filter(s => s.status !== 'cancelled' && (s.soldAt || '').startsWith(month))
                                .reduce((sum, s) => sum + (s.total || 0), 0)
                              const pct = amt > 0 ? Math.min(100, Math.round(actual / amt * 100)) : 0
                              return (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[10px] text-text-muted">
                                    <span>{t('mgmt_actual_sales')} {actual.toLocaleString('uz-UZ')} {som}</span>
                                    <span className={pct >= 100 ? 'text-accent-green font-bold' : ''}>{pct}%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                                    <div className={`h-full transition-all duration-300 ${pct >= 100 ? 'bg-accent-green' : pct >= 70 ? 'bg-accent-blue' : 'bg-accent-orange'}`} style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              )
                            })()}
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* BLOK 3 — Xodim oylik maqsadi */}
            <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-blue/10 text-accent-blue rounded-xl flex items-center justify-center">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-syne font-bold text-text-primary text-base">{t('mgmt_emp_target_title')}</h3>
                  <p className="text-xs text-text-muted">{t('mgmt_emp_target_subtitle')}</p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-text-secondary text-xs mb-1.5 block">{t('col_employee')}</label>
                    <select
                      value={empTargetId}
                      onChange={e => setEmpTargetId(e.target.value)}
                      className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-text-primary text-xs focus:outline-none focus:border-accent-red font-semibold"
                    >
                      {employees.filter(e => e.isActive).map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-text-secondary text-xs mb-1.5 block">{t('mgmt_month_label')}</label>
                    <select
                      value={empTargetMonth}
                      onChange={e => setEmpTargetMonth(e.target.value)}
                      className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-text-primary text-xs focus:outline-none focus:border-accent-red font-semibold"
                    >
                      {getMonthOptions().map(o => (
                        <option key={o.key} value={o.key}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">{t('mgmt_plan_label')} ({som})</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={empTargetAmount}
                      onChange={e => setEmpTargetAmount(e.target.value)}
                      placeholder="6000000"
                      className="flex-1 bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-text-primary text-xs focus:outline-none focus:border-accent-red font-semibold"
                    />
                    <button
                      onClick={() => {
                        if (!empTargetId || !empTargetMonth || !empTargetAmount) return
                        setEmployeeTarget(empTargetId, empTargetMonth, Number(empTargetAmount))
                        setEmpTargetSaved(true)
                        setEmpTargetAmount('')
                        setTimeout(() => setEmpTargetSaved(false), 2000)
                      }}
                      className={`px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center flex-shrink-0 ${
                        empTargetSaved ? 'bg-accent-green text-white' : 'bg-accent-red text-white hover:opacity-90 shadow-glow-red'
                      }`}
                    >
                      {empTargetSaved ? '✅ ' + t('mgmt_saved') : t('mgmt_btn_save')}
                    </button>
                  </div>
                </div>
              </div>

              {flattenedEmployeeTargets.length > 0 && (
                <div className="pt-4 border-t border-border/50">
                  <p className="text-xs text-text-muted mb-2 uppercase font-semibold">{t('mgmt_emp_targets_list')}</p>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {flattenedEmployeeTargets.map((item, idx) => {
                      const [y, m] = item.month.split('-').map(Number)
                      const monthLabel = `${MONTHS[m - 1]} ${y}`
                      const isCurrent = y === currentYear && m === currentMonth
                      const isPast = y < currentYear || (y === currentYear && m < currentMonth)
                      
                      return (
                        <div
                          key={idx}
                          className={`py-3 text-xs border-b border-border/30 last:border-b-0 space-y-2 transition-opacity ${
                            isPast ? 'opacity-70' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-text-secondary">
                                {item.empName} — {monthLabel}
                              </span>
                              {isCurrent && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-accent-green/10 text-accent-green">
                                  {t('mgmt_current_month')}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-text-primary">
                                {item.amount.toLocaleString('uz-UZ')} {som}
                              </span>
                              {isCurrent && (
                                <button
                                  onClick={() => {
                                    setEmpTargetId(item.empId)
                                    setEmpTargetMonth(item.month)
                                    setEmpTargetAmount(item.amount)
                                  }}
                                  className="p-1 hover:bg-bg-tertiary rounded text-text-secondary hover:text-text-primary transition-colors"
                                  title={t('edit')}
                                >
                                  <Pencil size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {/* Progress bar */}
                          {(() => {
                            const actual = MOCK_SALES
                              .filter(s => s.status !== 'cancelled' && String(s.soldBy) === String(item.empId) && (s.soldAt || '').startsWith(item.month))
                              .reduce((sum, s) => sum + (s.total || 0), 0)
                            const pct = item.amount > 0 ? Math.min(100, Math.round(actual / item.amount * 100)) : 0
                            return (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[10px] text-text-muted">
                                  <span>{t('mgmt_actual_sales')} {actual.toLocaleString('uz-UZ')} {som}</span>
                                  <span className={pct >= 100 ? 'text-accent-green font-bold' : ''}>{pct}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                                  <div className={`h-full transition-all duration-300 ${pct >= 100 ? 'bg-accent-green' : pct >= 70 ? 'bg-accent-blue' : 'bg-accent-orange'}`} style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            </>)}
            {show.sources !== false && (<>
            {/* BLOK 4 — Manbalar */}
            <div id="customer-sources" className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent-orange/10 text-accent-orange rounded-xl flex items-center justify-center">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3 className="font-syne font-bold text-text-primary text-base">{t('mgmt_sources_title')}</h3>
                    <p className="text-xs text-text-muted">{t('mgmt_sources_subtitle')}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setNewSourceLabel(''); setShowSourceModal(true) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-red text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity shadow-glow-red"
                >
                  <Plus size={14} /> {t('emp_form_add_btn')}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-bg-tertiary">
                    <tr>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-bold text-xs uppercase">{t('col_source')}</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-bold text-xs uppercase">{t('col_status')}</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-bold text-xs uppercase text-right">{t('mgmt_col_actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sources.map(src => {
                      const isEditing = editingSourceId === src.id
                      return (
                        <tr key={src.id} className={`hover:bg-bg-tertiary/20 transition-colors ${src.isActive ? '' : 'opacity-50'}`}>
                          <td className="px-3 sm:px-4 py-2 sm:py-3">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingSourceValue}
                                onChange={e => setEditingSourceValue(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    updateSource(src.id, { label: editingSourceValue })
                                    setEditingSourceId(null)
                                  }
                                }}
                                onBlur={() => {
                                  updateSource(src.id, { label: editingSourceValue })
                                  setEditingSourceId(null)
                                }}
                                className="px-2 py-1 bg-bg-tertiary border border-border rounded-lg text-xs text-text-primary focus:outline-none w-48 font-bold"
                                autoFocus
                              />
                            ) : (
                              <span className="font-semibold text-text-primary">{t('source_' + src.id, { defaultValue: src.label })}</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${src.isActive ? 'bg-accent-green/10 text-accent-green' : 'bg-bg-tertiary text-text-muted'}`}>
                              {src.isActive ? t('mgmt_status_active') : t('mgmt_src_inactive')}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => { setEditingSourceId(src.id); setEditingSourceValue(src.label) }}
                                className="p-1 hover:bg-bg-tertiary rounded text-text-secondary hover:text-text-primary"
                                title={t('edit')}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => toggleSource(src.id)}
                                className="p-1 hover:bg-bg-tertiary rounded text-text-secondary hover:text-text-primary"
                                title={src.isActive ? t('mgmt_toggle_deactivate') : t('mgmt_toggle_activate')}
                              >
                                {src.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                              </button>
                              <button
                                onClick={() => setDeleteSourceConfirm(src)}
                                className="p-1 hover:bg-accent-red/10 rounded text-text-secondary hover:text-accent-red"
                                title="O'chirish"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            </>)}
            {show.orgs !== false && (<>
            {/* BLOK 5 — Nasiya tashkilotlari */}
            <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent-red/10 text-accent-red rounded-xl flex items-center justify-center">
                    <Percent size={20} />
                  </div>
                  <div>
                    <h3 className="font-syne font-bold text-text-primary text-base">{t('mgmt_installment_title')}</h3>
                    <p className="text-xs text-text-muted">{t('mgmt_installment_subtitle')}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingOrg(null)
                    setOrgForm({
                      name: '',
                      commissionPercent: 0,
                      paymentSchedule: 'weekly_2x',
                      maxTermMonths: 12,
                      availableTerms: [],
                      startDate: new Date().toISOString().split('T')[0]
                    })
                    setShowOrgModal(true)
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-red text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity shadow-glow-red"
                >
                  <Plus size={14} /> {t('mgmt_add_org')}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {installmentOrganizations.map(org => {
                  const scheduleLabel =
                    org.paymentSchedule === 'weekly_2x' ? t('mgmt_schedule_weekly2x') :
                    org.paymentSchedule === 'biweekly' ? t('mgmt_schedule_biweekly') :
                    org.paymentSchedule === 'custom' ? t('mgmt_schedule_custom') : org.paymentSchedule

                  return (
                    <div
                      key={org.id}
                      className={`p-4 rounded-xl border transition-all space-y-3 bg-bg-tertiary/20 flex flex-col justify-between ${
                        org.isActive ? 'border-border' : 'border-border/40 opacity-60'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-text-primary text-base break-words">
                            {org.name}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                              org.isActive ? 'bg-accent-green/10 text-accent-green' : 'bg-bg-tertiary text-text-muted'
                            }`}
                          >
                            {org.isActive ? t('mgmt_shop_active') : t('mgmt_shop_inactive')}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs text-text-secondary">
                          <div className="flex justify-between">
                            <span>{t('mgmt_org_col_percent')}</span>
                            <span className="font-semibold text-text-primary">
                              {org.commissionPercent === 0 ? t('mgmt_org_free') : `${org.commissionPercent}%`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t('mgmt_org_col_schedule')}</span>
                            <span className="font-semibold text-text-primary">{scheduleLabel}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t('mgmt_org_col_max_term')}</span>
                            <span className="font-semibold text-text-primary">{org.maxTermMonths} {t('mgmt_org_month_suffix')}</span>
                          </div>
                          {org.startDate && (
                            <div className="flex justify-between">
                              <span>{t('mgmt_org_col_start_date')}</span>
                              <span className="font-semibold text-text-primary">{(() => { if (!org.startDate) return '—'; const dt = new Date(org.startDate); return isNaN(dt.getTime()) ? org.startDate : `${dt.getUTCDate()} ${MONTHS[dt.getUTCMonth()]} ${dt.getUTCFullYear()}` })()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 mt-auto pt-3 border-t border-border/50 w-full justify-between">
                        <button
                          onClick={() => {
                            setEditingOrg(org)
                            setOrgForm({
                              name: org.name || '',
                              commissionPercent: org.commissionPercent || 0,
                              paymentSchedule: org.paymentSchedule || 'weekly_2x',
                              maxTermMonths: org.maxTermMonths || 12,
                              availableTerms: org.availableTerms || [],
                              startDate: org.startDate || ''
                            })
                            setShowOrgModal(true)
                          }}
                          className="p-2 bg-bg-secondary hover:bg-bg-tertiary border border-border rounded-lg text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center shrink-0"
                          title={t('edit')}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => toggleInstallmentOrg(org.id)}
                          className={`p-1.5 border rounded-lg transition-colors text-xs font-semibold flex items-center gap-1 shrink-0 ${
                            org.isActive
                              ? 'bg-accent-red/10 border-accent-red/20 text-accent-red hover:bg-accent-red/20'
                              : 'bg-accent-green/10 border-accent-green/20 text-accent-green hover:bg-accent-green/20'
                          }`}
                          title={org.isActive ? t('mgmt_toggle_deactivate') : t('mgmt_toggle_activate')}
                        >
                          {org.isActive ? (
                            <>
                              <ToggleRight size={14} /> {t('mgmt_org_toggle_inactive')}
                            </>
                          ) : (
                            <>
                              <ToggleLeft size={14} /> {t('mgmt_org_toggle_active')}
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setDeleteOrgConfirm(org)}
                          className="px-2.5 py-1.5 rounded-lg border border-accent-red/20 bg-accent-red/10 text-accent-red text-xs font-semibold hover:bg-accent-red/20 transition-colors shrink-0"
                        >
                          {t('mgmt_btn_delete')}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            </>)}
            {show.notifications !== false && (<>
            {/* BLOK 6 — Ogohlantirish sozlamalari */}
            <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-orange/10 text-accent-orange rounded-xl flex items-center justify-center">
                  <Bell size={20} />
                </div>
                <div>
                  <h3 className="font-syne font-bold text-text-primary text-base">{t('mgmt_notif_settings_title')}</h3>
                  <p className="text-xs text-text-muted">{t('mgmt_notif_subtitle')}</p>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { type: 'BARCODE_NOT_PRINTED',  labelKey: 'mgmt_notif_type_barcode_not_printed', icon: '🏷️' },
                  { type: 'BARCODE_REPRINTED',     labelKey: 'mgmt_notif_type_barcode_reprinted',  icon: '🖨️' },
                  { type: 'BARCODE_SOLD_RESCAN',   labelKey: 'mgmt_notif_type_barcode_sold_rescan',icon: '📷' },
                  { type: 'SALE_NO_CUSTOMER',      labelKey: 'mgmt_notif_type_sale_no_customer',   icon: '👤' },
                  { type: 'DEVICE_LOGIN_ATTEMPT',  labelKey: 'mgmt_notif_type_device_login',       icon: '📱' },
                  { type: 'REPRINT_ALLOWED',       labelKey: 'mgmt_notif_type_reprint_allowed',    icon: '✅' },
                  { type: 'DEVICE_APPROVED',       labelKey: 'mgmt_notif_type_device_approved',    icon: '🔓' },
                ].map(({ type, labelKey, icon }) => {
                  const enabled = notificationSettings?.[type] ?? true
                  return (
                    <div key={type} className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                      enabled ? 'border-border bg-bg-tertiary' : 'border-border/50 bg-bg-primary opacity-60'
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className="text-base">{icon}</span>
                        <span className="text-sm text-text-primary">{t(labelKey)}</span>
                      </div>
                      <button
                        onClick={() => toggleNotification(type)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          enabled
                            ? 'bg-accent-green/10 text-accent-green border-accent-green/30 hover:bg-accent-green/20'
                            : 'bg-bg-secondary text-text-muted border-border hover:bg-bg-tertiary'
                        }`}
                      >
                        {enabled ? <><Bell size={12} /> {t('mgmt_notif_on')}</> : <><BellOff size={12} /> {t('mgmt_notif_off')}</>}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            </>)}
          </motion.div>

    </>
  )
}

export default SalesRulesSection
