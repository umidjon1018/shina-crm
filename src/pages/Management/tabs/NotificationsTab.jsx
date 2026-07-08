import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, AlertTriangle, Bell, BellOff, CheckCircle, Clock, Eye, EyeOff, Filter, Info, Search, ShieldAlert, Trash2, User, X } from 'lucide-react'
import { severityConfig, VIOLATION_LABELS, VIOLATION_FILTER_KEYS, typeLabel } from '../components/mgmtHelpers'

const NotificationsTab = ({ ctx }) => {
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
    MOCK_PRODUCTS, MOCK_ITEMS, MOCK_SALES,
  } = ctx

  return (
    <>
          <motion.div key="notif" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

            {/* O'chirilgan turlar haqida xabar */}
            {notificationSettings && Object.entries(notificationSettings).some(([, v]) => !v) && (
              <div className="flex items-center gap-3 px-4 py-3 bg-accent-orange/10 border border-accent-orange/30 rounded-xl">
                <BellOff size={16} className="text-accent-orange shrink-0" />
                <p className="text-xs text-accent-orange font-medium">
                  {t('mgmt_notif_disabled_types')}
                  <button onClick={() => setActiveTab('settings')} className="ml-1 underline font-bold">{t('mgmt_notif_settings_link')}</button> {t('mgmt_notif_manage_suffix')}
                </p>
              </div>
            )}

            {/* Amallar qatori */}
            {notifications.length > 0 && (
              <div className="flex justify-end gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-bg-tertiary border border-border rounded-xl transition-colors"
                  >
                    <CheckCircle size={13} /> {t('mgmt_mark_all_read')}
                  </button>
                )}
                {user?.role === 'admin' && (
                  <button
                    onClick={() => removeAllNotifications()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-accent-red hover:bg-accent-red/10 border border-accent-red/30 rounded-xl transition-colors"
                  >
                    <Trash2 size={13} /> {t('mgmt_delete_all')}
                  </button>
                )}
              </div>
            )}

            {/* Pending chegirma so'rovlari — alohida blok */}
            {(() => {
              const pendingReqs = notifications.filter(n =>
                n.type === 'DISCOUNT_REQUEST' && n.status === 'pending' &&
                (user?.role === 'admin' || n.requiredRole === 'manager')
              )
              if (pendingReqs.length === 0) return null
              return (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-accent-orange flex items-center gap-1.5">
                    <AlertCircle size={13} /> {pendingReqs.length} {t('mgmt_discount_pending')}
                  </p>
                  {pendingReqs.map(n => (
                    <div key={n.id} className="bg-accent-orange/5 border border-accent-orange/30 rounded-2xl p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-text-primary">{n.titleKey ? t(n.titleKey, n.titleParams) : n.title}</p>
                          <p className="text-xs text-text-muted mt-0.5">{n.messageKey ? t(n.messageKey, n.messageParams) : n.message}</p>
                          <p className="text-[10px] text-text-muted mt-1">{new Date(n.createdAt).toLocaleString('uz-UZ')}</p>
                        </div>
                        <span className={`shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold ${n.requiredRole === 'admin' ? 'bg-accent-red/10 text-accent-red' : 'bg-accent-orange/10 text-accent-orange'}`}>
                          {n.requiredRole === 'admin' ? 'Admin' : 'Manager'}
                        </span>
                      </div>
                      {n.cartSummary && (
                        <div className="bg-bg-tertiary rounded-xl p-3 text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-text-muted">{t('mgmt_items_label')}</span>
                            <span className="text-text-primary font-medium">{n.cartSummary.items?.map(i => `${i.name} (${i.qty})`).join(', ')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-muted">{t('mgmt_total_amount')}</span>
                            <span className="font-bold text-text-primary">{n.cartSummary.subtotal?.toLocaleString('uz-UZ')} {som}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-muted">{t('mgmt_after_discount')}</span>
                            <span className="font-bold text-accent-green">{n.cartSummary.afterDiscount?.toLocaleString('uz-UZ')} {som}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-muted">{t('mgmt_requested_discount')}</span>
                            <span className="font-bold text-accent-red">{n.requestedDiscount}%</span>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => { updateNotification(n.id, { status: 'rejected', isRead: true }); bump() }}
                          className="py-2 rounded-xl border border-border text-xs font-bold text-text-secondary hover:text-accent-red hover:border-accent-red/40 transition-colors"
                        >
                          {t('mgmt_reject')}
                        </button>
                        <button
                          onClick={() => { updateNotification(n.id, { status: 'approved', isRead: true }); bump() }}
                          className="py-2 rounded-xl bg-accent-green text-white text-xs font-bold hover:opacity-90 transition-opacity"
                        >
                          {t('mgmt_approve')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              {['all', 'BARCODE_NOT_PRINTED', 'BARCODE_REPRINTED', 'BARCODE_SOLD_RESCAN', 'SALE_NO_CUSTOMER', 'DEVICE_LOGIN_ATTEMPT', 'REPRINT_ALLOWED', 'DEVICE_APPROVED'].map(f => {
                const isDisabled = f !== 'all' && notificationSettings?.[f] === false
                return (
                  <button
                    key={f}
                    onClick={() => setFilterType(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                      filterType === f
                        ? 'bg-accent-red text-white border-accent-red'
                        : isDisabled
                        ? 'bg-bg-secondary border-border text-text-muted opacity-50'
                        : 'bg-bg-secondary border-border text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {isDisabled && <BellOff size={10} />}
                    {f === 'all' ? t('filter_all') : t(VIOLATION_FILTER_KEYS[f])}
                  </button>
                )
              })}
              <div className="relative ml-auto">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('mgmt_search_ph')}
                  className="pl-8 pr-4 py-1.5 bg-bg-secondary border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-accent-red w-48"
                />
              </div>
            </div>

            {/* Notification list */}
            {filteredNotifications.length === 0 ? (
              <div className="bg-bg-secondary border border-border rounded-3xl p-16 text-center">
                <Bell size={40} className="mx-auto text-text-muted mb-4 opacity-30" />
                <p className="text-text-muted">{t('mgmt_no_notifications')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map(n => {
                  const sev = severityConfig[n.severity] || severityConfig.info
                  const SevIcon = sev.icon
                  return (
                    <motion.div
                      key={n.id}
                      layout
                      className={`bg-bg-secondary border rounded-2xl p-4 flex items-start gap-4 transition-all cursor-pointer hover:border-${sev.color}/50 ${
                        n.isRead ? 'border-border opacity-60' : `border-${sev.color}/30`
                      }`}
                      onClick={() => markRead(n.id)}
                    >
                      <div className={`w-10 h-10 bg-${sev.color}/10 text-${sev.color} rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <SevIcon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-text-primary">{n.titleKey ? t(n.titleKey, n.titleParams) : n.title}</p>
                            <p className="text-xs text-text-muted mt-0.5">{n.messageKey ? t(n.messageKey, n.messageParams) : n.message}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!n.isRead && (
                              <span className={`w-2 h-2 rounded-full bg-${sev.color}`} />
                            )}
                            {user?.role === 'admin' && (
                              <button
                                onClick={e => { e.stopPropagation(); removeNotification(n.id) }}
                                className="p-1 text-text-muted hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"
                                title={t('mgmt_delete_btn')}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          {n.sellerName && (
                            <span className="flex items-center gap-1 text-xs text-text-secondary font-medium">
                              <User size={12} /> {n.sellerName}
                            </span>
                          )}
                          {n.barcode && (
                            <span
                              className="text-xs font-mono font-bold text-accent-blue underline underline-offset-2 cursor-pointer hover:text-accent-blue/70 transition-colors"
                              onClick={e => {
                                e.stopPropagation()
                                // 1. MOCK_ITEMS dan qidir (har qanday status)
                                const item = MOCK_ITEMS.find(i => i.barcode === n.barcode) || null
                                // 2. Product: item → notification.productId → MOCK_SALES ichidan
                                let product = item
                                  ? MOCK_PRODUCTS.find(p => p.id === item.productId)
                                  : n.productId
                                    ? MOCK_PRODUCTS.find(p => p.id === n.productId)
                                    : null
                                // 3. MOCK_SALES items arrayidan qidir
                                if (!product) {
                                  for (const sale of MOCK_SALES) {
                                    const si = (sale.items || []).find(s => s.barcode === n.barcode)
                                    if (si) {
                                      product = (si.productId ? MOCK_PRODUCTS.find(p => p.id === si.productId) : null)
                                        || (si.name ? MOCK_PRODUCTS.find(p => p.name === si.name || `${p.brand} ${p.name}` === si.name) : null)
                                        || (si.product ? MOCK_PRODUCTS.find(p => p.name === si.product || `${p.brand} ${p.name}` === si.product) : null)
                                        || null
                                      break
                                    }
                                  }
                                }
                                // 4. Hali topilmasa — barcode'dan SKU ajratib qidir (format: SKU-XXXXXX)
                                if (!product && n.barcode) {
                                  const skuFromBarcode = n.barcode.replace(/-\d{6}$/, '')
                                  if (skuFromBarcode !== n.barcode) {
                                    product = MOCK_PRODUCTS.find(p => p.sku === skuFromBarcode) || null
                                  }
                                }
                                setBarcodeInfoModal({ barcode: n.barcode, item, product, notification: n })
                              }}
                            >{n.barcode}</span>
                          )}
                          <span className="flex items-center gap-1 text-xs text-text-secondary ml-auto">
                            <Clock size={12} /> {new Date(n.createdAt).toLocaleString('uz-UZ')}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>

        {/* Barcode Info Modal */}
        <AnimatePresence>
          {barcodeInfoModal && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
              onClick={() => setBarcodeInfoModal(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-bg-secondary border border-border rounded-[2rem] p-6 w-full max-w-sm shadow-glow-red"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-syne font-extrabold text-text-primary">{t('mgmt_barcode_info_title')}</h3>
                  <button onClick={() => setBarcodeInfoModal(null)} className="p-2 text-text-muted hover:text-text-primary transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="bg-bg-tertiary rounded-2xl px-4 py-3 flex items-center gap-3">
                    <span className="text-2xl">🔖</span>
                    <span className="font-mono font-bold text-accent-blue text-sm">{barcodeInfoModal.barcode}</span>
                  </div>

                  {barcodeInfoModal.product ? (
                    <div className="bg-bg-tertiary rounded-2xl p-4 space-y-2">
                      {(() => {
                        const seasonLabelMap = { SUMMER: 'Yozgi', WINTER: 'Qishki', ALL_SEASON: 'Barcha mavsum', NA: '', Summer: 'Yozgi', Winter: 'Qishki', 'All Season': 'Barcha mavsum' }
                        const countryMap = { Germany: 'Germaniya', Japan: 'Yaponiya', China: 'Xitoy', Korea: 'Koreya', Finland: 'Finlyandiya', France: 'Fransiya', USA: 'AQSh', Italy: 'Italiya', Russia: 'Rossiya' }
                        const p = barcodeInfoModal.product
                        const season = p.seasonLabel || seasonLabelMap[p.season] || p.season
                        const _rawCountry = countryMap[p.country] || p.country
                        const country = t('country_' + _rawCountry, { defaultValue: _rawCountry })
                        return (
                          <>
                            <p className="font-syne font-extrabold text-text-primary text-base">{p.name}</p>
                            <p className="text-sm text-text-secondary">{p.brand}{country ? ` · ${country}` : ''}</p>
                            {p.size && (
                              <p className="text-xs text-text-muted">{t('mgmt_size_label')} <span className="font-bold text-text-primary">{p.size}</span></p>
                            )}
                            {season && (
                              <p className="text-xs text-text-muted">{t('mgmt_season_label')} <span className="font-bold text-text-primary">{season}</span></p>
                            )}
                          </>
                        )
                      })()}
                      {barcodeInfoModal.product.cashPrice > 0 && (
                        <p className="text-xs text-text-muted">{t('mgmt_price_label')} <span className="font-bold text-accent-green">{barcodeInfoModal.product.cashPrice?.toLocaleString('uz-UZ')} {som}</span></p>
                      )}
                      <div className="border-t border-border pt-2 mt-2">
                        {barcodeInfoModal.item ? (
                          (() => {
                            const { label, cls } = getItemStatus(barcodeInfoModal.item, t)
                            return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>{label}</span>
                          })()
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent-orange/10 text-accent-orange">{t('mgmt_sold_archived')}</span>
                        )}
                      </div>
                    </div>
                  ) : barcodeInfoModal.notification?.productName ? (
                    <div className="bg-bg-tertiary rounded-2xl p-4 space-y-2">
                      <p className="font-syne font-extrabold text-text-primary text-base">{barcodeInfoModal.notification.productName}</p>
                      <div className="border-t border-border pt-2 mt-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent-orange/10 text-accent-orange">{t('mgmt_sold_archived')}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-bg-tertiary rounded-2xl p-4 text-center text-sm text-text-muted">
                      {t('mgmt_barcode_not_found')}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
    </>
  )
}

export default NotificationsTab
