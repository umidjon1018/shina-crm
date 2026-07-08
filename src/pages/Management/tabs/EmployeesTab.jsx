import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Plus, Trash2, Pencil, Eye, EyeOff, Shield, ShieldAlert, KeyRound, X, CheckCircle, Clock, BarChart2, DollarSign, MapPin, Store } from 'lucide-react'
import { ROLE_LABELS, getRoleLabels, canManageEmployee, formatPrice } from '../components/mgmtHelpers'

const isoToDisplay = (iso) => {
  if (!iso) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-')
    return `${d}.${m}.${y}`
  }
  const dt = new Date(iso)
  if (!isNaN(dt.getTime())) {
    const d = String(dt.getUTCDate()).padStart(2,'0')
    const m = String(dt.getUTCMonth()+1).padStart(2,'0')
    return `${d}.${m}.${dt.getUTCFullYear()}`
  }
  return ''
}

const EmployeesTab = ({ ctx }) => {
  const { t, i18n } = useTranslation()
  const {
    // auth & stores
    user, notifications, notificationSettings,
    markRead, markAllRead, removeNotification, removeAllNotifications, updateNotification, getUnreadCount,
    employees, addEmployee, updateEmployee, removeEmployee, requestEmployeeDeletion,
    employeeEditLocked, addEmployeeEditHistory,
    productCategories, addProductCategory, updateProductCategory, toggleProductCategory,
    sources, addSource, updateSource, toggleSource,
    installmentOrganizations, addInstallmentOrg, updateInstallmentOrg, toggleInstallmentOrg, removeInstallmentOrg,
    monthlyTargets, setMonthlyTarget, employeeTargets, setEmployeeTarget,
    notificationSettings: _ns, toggleNotification,
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
    empModalTab, setEmpModalTab, empForm, setEmpForm, hiredAtDisplay, setHiredAtDisplay,
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
  } = ctx

  return (
          <motion.div key="employees" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-syne font-bold text-text-primary">{t('mgmt_employees_title')}</h3>
                <p className="text-sm text-text-secondary">{t('emp_subtitle')}</p>
                {employeeEditLocked && user?.role !== 'admin' && (
                  <p className="text-xs text-accent-red font-semibold mt-1">
                    {t('emp_edit_locked')}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setEmpForm({ name: '', phone: '+998', role: 'seller', hiredAt: '', salary: 0, username: '', password: '', shopId: '' })
                  setHiredAtDisplay('')
                  setEditingEmployee(null)
                  setShowEmpForm(true)
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-accent-red text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity shadow-glow-red"
              >
                <Plus size={15} /> {t('mgmt_add_employee')}
              </button>
            </div>

            {/* Employees list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employees.filter(e => e.isActive && !e.pendingDelete).map(emp => {
                let badgeColor = 'bg-accent-blue/10 text-accent-blue'
                if (emp.role === 'admin') badgeColor = 'bg-accent-red/10 text-accent-red'
                else if (emp.role === 'manager') badgeColor = 'bg-accent-orange/10 text-accent-orange'
                else if (emp.role === 'storekeeper') badgeColor = 'bg-accent-green/10 text-accent-green'
                else if (emp.role === 'technician') badgeColor = 'bg-purple-500/10 text-purple-500'

                return (
                  <motion.div
                    key={emp.id}
                    layout
                    className="bg-bg-secondary border border-border rounded-2xl p-5 flex items-start gap-4 hover:border-border-hover transition-all"
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-accent-red/10 text-accent-red rounded-2xl flex items-center justify-center font-extrabold text-lg flex-shrink-0">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <p className="font-syne font-bold text-text-primary truncate">{emp.name}</p>
                          {emp.isBlocked && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-red/10 text-accent-red flex-shrink-0">
                              {t('emp_blocked_badge')}
                            </span>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>
                          {roleLabels[emp.role] || emp.role}
                        </span>
                      </div>
                      
                      <div className="space-y-1 mt-2 text-xs text-text-secondary">
                        <p className="font-mono">{emp.phone}</p>
                        <p>{emp.hiredAt ? formatDate(emp.hiredAt) : '—'} {t('emp_hired_since')}</p>
                        <p className="font-semibold text-text-primary">{t('mgmt_emp_salary')} {emp.salary?.toLocaleString('uz-UZ')} {som}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border/50">
                        {/* Ko'rish — hammaga ruxsat */}
                        <button
                          onClick={() => { setSelectedEmployee(emp); setEmpModalTab('general') }}
                          className="p-1.5 hover:bg-bg-tertiary rounded-lg text-text-secondary hover:text-text-primary transition-colors"
                          title={t('emp_view_btn')}
                        >
                          <Eye size={16} />
                        </button>

                        {/* Bloklash, Tahrirlash, O'chirish — faqat ruxsatli, Admin bloklamagan bo'lsa */}
                        {canManageEmployee(user, emp) && !(employeeEditLocked && user?.role !== 'admin') && (
                          <>
                            <button
                              onClick={() => {
                                if (emp.isBlocked && emp.blockedByAdmin) return
                                updateEmployee(emp.id, { isBlocked: !emp.isBlocked })
                              }}
                              disabled={emp.isBlocked && emp.blockedByAdmin}
                              className={`p-1.5 rounded-lg transition-colors ${
                                emp.isBlocked
                                  ? 'bg-accent-red/10 text-accent-red hover:bg-accent-red/20'
                                  : 'text-text-secondary hover:bg-bg-tertiary hover:text-accent-orange'
                              } ${emp.isBlocked && emp.blockedByAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={
                                emp.isBlocked && emp.blockedByAdmin
                                  ? t('emp_blocked_by_admin')
                                  : emp.isBlocked ? t('emp_unblock_btn') : t('emp_block_btn')
                              }
                            >
                              {emp.isBlocked ? <ShieldAlert size={16} /> : <Shield size={16} />}
                            </button>
                            <button
                              onClick={() => {
                                setEmpForm({
                                  name: emp.name, phone: emp.phone, role: emp.role,
                                  hiredAt: emp.hiredAt || '', salary: emp.salary,
                                  username: emp.username, password: '',
                                  shopId: emp.shopId || ''
                                })
                                setHiredAtDisplay(isoToDisplay(emp.hiredAt || ''))
                                setEditingEmployee(emp)
                                setShowEmpForm(true)
                              }}
                              className="p-1.5 hover:bg-bg-tertiary rounded-lg text-text-secondary hover:text-text-primary transition-colors"
                              title={t('edit')}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => setEmpDeleteTarget(emp)}
                              className="p-1.5 hover:bg-accent-red/10 text-text-secondary hover:text-accent-red rounded-lg transition-colors"
                              title={t('mgmt_delete_btn')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

  )
}

export default EmployeesTab
