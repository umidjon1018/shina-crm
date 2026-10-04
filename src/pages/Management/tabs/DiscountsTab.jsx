import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle, DollarSign, Percent, Star, Tag, TrendingUp } from 'lucide-react'
import { formatPrice } from '../components/mgmtHelpers'
import LoyaltyProgramCard from '../components/LoyaltyProgramCard'

const DiscountsTab = ({ ctx }) => {
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
  } = ctx

  return (
          <motion.div key="discounts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5 sm:space-y-8 max-w-2xl">
            <LoyaltyProgramCard canEdit={['admin', 'manager'].includes(user?.role)} />

            {/* Blok 2 — Chegirma darajalari */}
            <div className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 border-t border-border">
              <div>
                <h3 className="text-xl font-syne font-bold text-text-primary">{t('mgmt_discount_levels_title')}</h3>
                <p className="text-sm text-text-secondary">{t('mgmt_discount_subtitle')}</p>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-primary">{t('mgmt_discount_small')}</label>
                  <p className="text-[10px] text-text-muted">{t('mgmt_discount_small_hint')}</p>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={discountForm.discountSmallMax}
                    onChange={e => setDiscountForm({ ...discountForm, discountSmallMax: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-xl focus:outline-none focus:border-accent-red text-sm font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-primary">{t('mgmt_discount_medium')}</label>
                  <p className="text-[10px] text-text-muted">{t('mgmt_discount_medium_hint')}</p>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={discountForm.discountMediumMax}
                    onChange={e => setDiscountForm({ ...discountForm, discountMediumMax: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-xl focus:outline-none focus:border-accent-red text-sm font-semibold"
                  />
                </div>

                {discountForm.discountSmallMax >= discountForm.discountMediumMax && (
                  <div className="flex items-center gap-2 p-3 bg-accent-red/10 border border-accent-red/30 rounded-xl text-accent-red text-xs font-bold">
                    <AlertCircle size={13} className="shrink-0" />
                    {t('mgmt_discount_level_error')}
                  </div>
                )}
                <p className="text-sm text-text-secondary mt-2 p-3 bg-bg-tertiary rounded-xl border border-border">
                  {t('mgmt_discount_summary', { s: discountForm.discountSmallMax, s1: discountForm.discountSmallMax + 1, m: discountForm.discountMediumMax, m1: discountForm.discountMediumMax + 1 })}
                </p>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={discountForm.discountSmallMax >= discountForm.discountMediumMax}
              className={`px-5 sm:px-8 py-3 rounded-2xl font-syne font-extrabold text-lg transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
                saved ? 'bg-accent-green text-white' : 'bg-accent-red text-white hover:opacity-90 shadow-glow-red'
              }`}
            >
              {saved ? t('mgmt_saved') : t('mgmt_save_settings')}
            </button>
          </motion.div>

  )
}

export default DiscountsTab
