import React from 'react'
import DateMaskInput from '../../../components/DateMaskInput'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, AlertTriangle, CheckCircle, Pencil, Plus, Tag, ToggleLeft, ToggleRight, Trash2, X } from 'lucide-react'

const PromotionsTab = ({ ctx }) => {
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
    MOCK_PRODUCTS,
  } = ctx

  const supplierPromos = batches.filter(b => b.promoDiscount && b.promoPassToCustomer)

  return (
          <motion.div key="promotions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

            {/* Yetkazib beruvchi chegirmalari */}
            {supplierPromos.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-3">Yetkazib beruvchi chegirmalari</h3>
                <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-bg-tertiary">
                      <tr>
                        {['Aksiya nomi', 'Tovar', 'Chegirma (%)', 'Yetkazib beruvchi', 'Sana'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-text-muted uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {supplierPromos.map(b => (
                        <tr key={b.id} className="hover:bg-bg-tertiary transition-colors">
                          <td className="px-4 py-3 text-text-primary font-medium">{b.promoNote || '—'}</td>
                          <td className="px-4 py-3 text-text-secondary">{b.productName}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-accent-green/10 text-accent-green">
                              -{b.promoDiscount}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-text-secondary">{b.supplierName || '—'}</td>
                          <td className="px-4 py-3 text-text-muted text-xs">
                            {b.receivedAt ? new Date(b.receivedAt).toLocaleDateString('uz-UZ') : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-text-muted text-sm">{promos.length} {t('mgmt_promo_count')}</p>
              <button onClick={openAddPromo} className="flex items-center gap-1.5 px-4 py-2.5 bg-accent-red text-white rounded-xl text-sm font-bold hover:opacity-90 shadow-glow-red">
                <Plus size={16} /> {t('mgmt_promo_add')}
              </button>
            </div>

            <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-bg-tertiary">
                  <tr>
                    {[
                      t('mgmt_promo_col_name'), t('col_type'), t('col_discount'),
                      t('mgmt_promo_col_period'), t('mgmt_promo_col_shop'), t('col_status'), t('mgmt_promo_col_actions')
                    ].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-text-muted uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {promos.map(p => {
                    const isExpiredP = p.endDate && p.endDate < new Date().toISOString().slice(0,10)
                    const targetLabel = p.type === 'product'
                      ? (MOCK_PRODUCTS.find(x => String(x.id) === String(p.targetId))?.name || p.targetId || '—')
                      : p.type === 'category'
                      ? (productCategories.find(x => String(x.id) === String(p.targetId))?.label || p.targetId || '—')
                      : '—'
                    return (
                      <tr key={p.id} className={`hover:bg-bg-tertiary/20 transition-colors ${isExpiredP ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3 font-semibold text-text-primary">{p.name}</td>
                        <td className="px-4 py-3">
                          <div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-blue/10 text-accent-blue">
                              {(() => { const pt = PROMO_TYPES_MG.find(x => x.key === p.type); return pt ? t(pt.labelKey) : p.type })()}
                            </span>
                            {p.type !== 'qty' && (
                              <p className="text-xs text-text-secondary mt-1">{targetLabel}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-accent-red">{p.discountPercent}%</td>
                        <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                          {p.startDate || '—'}{p.endDate ? ` → ${p.endDate}` : ''}
                        </td>
                        <td className="px-4 py-3 text-xs text-text-muted">
                          {p.shopId === 'all' ? t('filter_all') : shops.find(s => s.id === p.shopId)?.name || p.shopId}
                        </td>
                        <td className="px-4 py-3">
                          {isExpiredP
                            ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-bg-tertiary text-text-muted">{t('mgmt_promo_expired')}</span>
                            : p.isActive
                              ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-green/10 text-accent-green">{t('mgmt_promo_active')}</span>
                              : <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-bg-tertiary text-text-muted">{t('mgmt_promo_inactive')}</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEditPromo(p)} className="p-1.5 hover:bg-bg-tertiary rounded-lg text-text-muted hover:text-text-primary"><Pencil size={14}/></button>
                            <button onClick={() => togglePromoActive(p)} className="p-1.5 hover:bg-bg-tertiary rounded-lg text-text-muted hover:text-text-primary">
                              {p.isActive ? <ToggleRight size={16}/> : <ToggleLeft size={16}/>}
                            </button>
                            <button onClick={() => setDeletePromoTarget(p)} className="p-1.5 hover:bg-accent-red/10 rounded-lg text-text-muted hover:text-accent-red"><Trash2 size={14}/></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {promos.length === 0 && <div className="text-center py-12 text-text-muted text-sm">{t('mgmt_promo_empty')}</div>}
            </div>

            <AnimatePresence>
              {showPromoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPromoModal(false)} />
                  <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                    className="relative bg-bg-secondary border border-border rounded-2xl w-full max-w-md shadow-2xl z-10 max-h-[90vh] flex flex-col">
                    <div className="flex items-center justify-between p-5 border-b border-border">
                      <h3 className="font-syne font-bold text-lg">{editingPromo ? t('mgmt_promo_edit_title') : t('mgmt_promo_add_title')}</h3>
                      <button onClick={() => setShowPromoModal(false)} className="p-1.5 hover:bg-bg-tertiary rounded-lg"><X size={18} className="text-text-secondary"/></button>
                    </div>
                    <div className="p-5 space-y-4 overflow-y-auto">
                      {promoFormError && <p className="text-sm text-accent-red">{promoFormError}</p>}
                      <div>
                        <label className="text-xs text-text-muted mb-1 block">{t('mgmt_promo_field_name')}</label>
                        <input value={promoForm.name} onChange={e => setPromoForm(f => ({...f, name: e.target.value}))} className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-red" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">{t('col_type')}</label>
                          <select value={promoForm.type} onChange={e => setPromoForm(f => ({...f, type: e.target.value, targetId: ''}))} className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-red">
                            {PROMO_TYPES_MG.map(x => <option key={x.key} value={x.key}>{t(x.labelKey)}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">{t('mgmt_promo_field_discount')}</label>
                          <input type="number" value={promoForm.discountPercent} onChange={e => setPromoForm(f => ({...f, discountPercent: e.target.value}))} min="1" max="100" className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-red" />
                        </div>
                      </div>
                      {promoForm.type === 'category' && (
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">{t('col_category')}</label>
                          <select value={promoForm.targetId} onChange={e => setPromoForm(f => ({...f, targetId: e.target.value}))} className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-red">
                            <option value="">{t('mgmt_promo_select_ph')}</option>
                            {productCategories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                          </select>
                        </div>
                      )}
                      {promoForm.type === 'product' && (
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">{t('mgmt_promo_field_product')}</label>
                          <select value={promoForm.targetId} onChange={e => setPromoForm(f => ({...f, targetId: e.target.value}))} className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-red">
                            <option value="">{t('mgmt_promo_select_ph')}</option>
                            {MOCK_PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                      )}
                      {promoForm.type === 'qty' && (
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">{t('mgmt_promo_field_min_qty')}</label>
                          <input type="number" value={promoForm.minQty} onChange={e => setPromoForm(f => ({...f, minQty: e.target.value}))} min="1" className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-red" />
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">{t('mgmt_promo_field_start')}</label>
                          <DateMaskInput value={promoForm.startDate} onChange={e => setPromoForm(f => ({...f, startDate: e.target.value}))} className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-red" />
                        </div>
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">{t('mgmt_promo_field_end')}</label>
                          <DateMaskInput value={promoForm.endDate} onChange={e => setPromoForm(f => ({...f, endDate: e.target.value}))} className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-red" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-text-muted mb-1 block">{t('mgmt_promo_field_shop')}</label>
                        <select value={promoForm.shopId} onChange={e => setPromoForm(f => ({...f, shopId: e.target.value}))} className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-red">
                          <option value="all">{t('mgmt_promo_all_shops_opt')}</option>
                          {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3 p-5 border-t border-border">
                      <button onClick={() => setShowPromoModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary text-sm">{t('mgmt_btn_cancel')}</button>
                      <button onClick={savePromo} className="flex-1 py-2.5 rounded-xl bg-accent-red text-white font-semibold text-sm hover:opacity-90 shadow-glow-red">{editingPromo ? t('mgmt_btn_save') : t('emp_form_add_btn')}</button>
                    </div>
                  </motion.div>
                </div>
              )}
              {deletePromoTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeletePromoTarget(null)} />
                  <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                    className="relative bg-bg-secondary border border-border rounded-2xl w-full max-w-sm shadow-2xl z-10">
                    <div className="p-6 text-center space-y-4">
                      <div className="w-14 h-14 bg-accent-red/10 rounded-2xl flex items-center justify-center mx-auto"><AlertTriangle size={28} className="text-accent-red"/></div>
                      <div>
                        <h3 className="font-syne font-bold text-lg">{t('mgmt_promo_delete_title')}</h3>
                        <p className="text-text-secondary text-sm mt-1">{t('mgmt_promo_delete_confirm', { name: deletePromoTarget.name })}</p>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setDeletePromoTarget(null)} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary text-sm">{t('mgmt_btn_cancel')}</button>
                        <button onClick={() => removePromo(deletePromoTarget)} className="flex-1 py-2.5 rounded-xl bg-accent-red text-white font-semibold text-sm">{t('mgmt_btn_delete')}</button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>

  )
}

export default PromotionsTab
