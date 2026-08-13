import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, BarChart2, Building, CheckCircle, ChevronRight, DollarSign, Edit3, Eye, EyeOff, MapPin, Package, Pencil, Plus, Search, Store, Tag, ToggleLeft, ToggleRight, Trash2, X } from 'lucide-react'
import { SortIcon, formatPrice } from '../components/mgmtHelpers'
import { getCategoryColor } from '../../../utils/categoryColors'
import { getItemStatus } from '../../../utils/itemStatus'

const ProductsTab = ({ ctx }) => {
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
    // products API
    apiProducts, refreshProducts,
    createProduct, updateProduct: apiUpdateProduct, deleteProduct, updateProductPrice,
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
    deleteCategoryConfirm, setDeleteCategoryConfirm, removeProductCategory,
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
    productSearch, setProductSearch,
    productCatFilter, setProductCatFilter,
    productAttributeDefs, addProductAttributeDef, removeProductAttributeDef, addAttributeValue, removeAttributeValue,
  } = ctx

  const [newAttrLabel, setNewAttrLabel] = useState('')
  const [attrValueInputs, setAttrValueInputs] = useState({})

  return (
          <motion.div key="products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            
            {/* QISM 1 — Kategoriyalar bloki */}
            <div className="bg-bg-secondary border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-syne font-bold text-text-primary">{t('mgmt_categories_title')}</h3>
                  <p className="text-xs text-text-muted">{t('mgmt_categories_subtitle')}</p>
                </div>
                <button
                  onClick={() => { setNewCategory({ label: '', turnoverDays: 30 }); setShowCategoryForm(true) }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-accent-red text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity shadow-glow-red"
                >
                  <Plus size={14} /> {t('mgmt_add_category')}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-bg-tertiary">
                    <tr>
                      <th className="px-4 py-3 text-text-muted font-bold text-xs uppercase">{t('col_name')}</th>
                      <th className="px-4 py-3 text-text-muted font-bold text-xs uppercase">{t('mgmt_col_turnover')}</th>
                      <th className="px-4 py-3 text-text-muted font-bold text-xs uppercase">{t('col_status')}</th>
                      <th className="px-4 py-3 text-text-muted font-bold text-xs uppercase text-right">{t('mgmt_col_action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {productCategories.map(cat => {
                      const isEditing = editingCategory?.id === cat.id
                      return (
                        <tr key={cat.id} className={`hover:bg-bg-tertiary/20 transition-colors ${cat.isActive ? '' : 'opacity-50'}`}>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingCategory.label}
                                onChange={e => setEditingCategory({ ...editingCategory, label: e.target.value })}
                                className="px-2 py-1 bg-bg-tertiary border border-border rounded-lg text-xs text-text-primary focus:outline-none w-32"
                                autoFocus
                              />
                            ) : (
                              (() => {
                                const catColor = getCategoryColor(cat.id, productCategories)
                                return (
                                  <span className={`font-semibold text-sm ${catColor.text}`}>
                                    {t('cat_' + cat.id, { defaultValue: cat.label })}
                                  </span>
                                )
                              })()
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editingCategory.turnoverDays}
                                onChange={e => setEditingCategory({ ...editingCategory, turnoverDays: Number(e.target.value) })}
                                className="px-2 py-1 bg-bg-tertiary border border-border rounded-lg text-xs text-text-primary focus:outline-none w-20"
                              />
                            ) : (
                              <span className="text-text-secondary">{t('mgmt_days_unit', { n: cat.turnoverDays })}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cat.isActive ? 'bg-accent-green/10 text-accent-green' : 'bg-bg-tertiary text-text-muted'}`}>
                              {cat.isActive ? t('mgmt_status_active') : t('mgmt_status_inactive')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    updateProductCategory(cat.id, {
                                      label: editingCategory.label,
                                      turnoverDays: editingCategory.turnoverDays
                                    })
                                    setEditingCategory(null)
                                  }}
                                  className="p-1 hover:bg-accent-green/10 rounded text-accent-green hover:text-accent-green"
                                  title={t('save')}
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button
                                  onClick={() => setEditingCategory(null)}
                                  className="p-1 hover:bg-accent-red/10 rounded text-text-secondary hover:text-accent-red"
                                  title={t('mgmt_title_cancel')}
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setEditingCategory(cat)}
                                  className="p-1 hover:bg-bg-tertiary rounded text-text-secondary hover:text-text-primary"
                                  title={t('edit')}
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() => toggleProductCategory(cat.id)}
                                  className="p-1 hover:bg-bg-tertiary rounded text-text-secondary hover:text-text-primary"
                                  title={cat.isActive ? t('mgmt_title_deactivate') : t('mgmt_title_activate')}
                                >
                                  {cat.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                </button>
                                <button
                                  onClick={() => setDeleteCategoryConfirm(cat)}
                                  className="p-1 hover:bg-accent-red/10 rounded text-text-secondary hover:text-accent-red"
                                  title="O'chirish"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* QISM 1.5 — Xususiyatlar shabloni bloki */}
            <div className="bg-bg-secondary border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-syne font-bold text-text-primary">Xususiyatlar</h3>
                  <p className="text-xs text-text-muted">Kirim qilishda batchga beriladigan xususiyat shablonlari (masalan: Rang, Material)</p>
                </div>
              </div>

              {/* Yangi xususiyat qo'shish */}
              <div className="flex items-center gap-2">
                <input
                  value={newAttrLabel}
                  onChange={e => setNewAttrLabel(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newAttrLabel.trim()) {
                      addProductAttributeDef(newAttrLabel.trim())
                      setNewAttrLabel('')
                    }
                  }}
                  placeholder="Yangi xususiyat nomi (masalan: Rang)"
                  className="flex-1 px-3 py-2 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue"
                />
                <button
                  onClick={() => {
                    if (!newAttrLabel.trim()) return
                    addProductAttributeDef(newAttrLabel.trim())
                    setNewAttrLabel('')
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-accent-red text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity shadow-glow-red"
                >
                  <Plus size={14} /> Qo'shish
                </button>
              </div>

              {/* Xususiyatlar ro'yxati */}
              {(productAttributeDefs || []).length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">Hali xususiyat qo'shilmagan</p>
              ) : (
                <div className="space-y-3">
                  {(productAttributeDefs || []).map(def => (
                    <div key={def.id} className="border border-border rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-text-primary text-sm">{def.label}</span>
                        <button
                          onClick={() => removeProductAttributeDef(def.id)}
                          className="p-1 hover:bg-accent-red/10 rounded text-text-muted hover:text-accent-red transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Qiymatlar */}
                      <div className="flex flex-wrap gap-2">
                        {def.values.map(val => (
                          <span
                            key={val}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-bg-tertiary border border-border rounded-lg text-xs text-text-primary"
                          >
                            {val}
                            <button
                              onClick={() => removeAttributeValue(def.id, val)}
                              className="text-text-muted hover:text-accent-red transition-colors ml-0.5"
                            >
                              <X size={11} />
                            </button>
                          </span>
                        ))}
                        {/* Yangi qiymat input */}
                        <div className="inline-flex items-center gap-1">
                          <input
                            value={attrValueInputs[def.id] || ''}
                            onChange={e => setAttrValueInputs(prev => ({ ...prev, [def.id]: e.target.value }))}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                const val = (attrValueInputs[def.id] || '').trim()
                                if (val && !def.values.includes(val)) {
                                  addAttributeValue(def.id, val)
                                  setAttrValueInputs(prev => ({ ...prev, [def.id]: '' }))
                                }
                              }
                            }}
                            placeholder="+ qiymat"
                            className="w-24 px-2 py-1 bg-bg-tertiary border border-border rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue"
                          />
                          <button
                            onClick={() => {
                              const val = (attrValueInputs[def.id] || '').trim()
                              if (val && !def.values.includes(val)) {
                                addAttributeValue(def.id, val)
                                setAttrValueInputs(prev => ({ ...prev, [def.id]: '' }))
                              }
                            }}
                            className="p-1 hover:bg-accent-green/10 rounded text-text-muted hover:text-accent-green transition-colors"
                          >
                            <CheckCircle size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* QISM 2 — Barkodlar bloki */}
            <div className="bg-bg-secondary border border-border rounded-2xl p-6 flex flex-col" style={{minHeight: '520px'}}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-xl font-syne font-bold text-text-primary">{t('mgmt_barcodes_title')}</h3>
                  <p className="text-xs text-text-muted">{t('mgmt_barcodes_subtitle')}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary font-bold">{t('mgmt_batch_label')}</span>
                  <select
                    value={selectedBatchId}
                    onChange={e => {
                      setSelectedBatchId(e.target.value)
                      setBarcodePage(1)
                    }}
                    className="bg-bg-tertiary border border-border rounded-xl px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-red font-semibold"
                  >
                    {[...batches].sort((a, b) => b.batchNumber.localeCompare(a.batchNumber)).map(b => (
                      <option key={b.id} value={b.id}>
                        {b.batchNumber}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {barcodeLoading ? (
                <div className="flex items-center justify-center flex-1">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-red"></div>
                </div>
              ) : (
                <div className="flex flex-col flex-1">
                  <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead className="bg-bg-tertiary">
                        <tr>
                          <th className="px-4 py-3 text-text-muted font-bold text-xs uppercase">{t('mgmt_col_barcode')}</th>
                          <th className="px-4 py-3 text-text-muted font-bold text-xs uppercase">{t('col_product')}</th>
                          <th className="px-4 py-3 text-text-muted font-bold text-xs uppercase">{t('col_status')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {pagedBarcodeItems.map(item => {
                          const prod = apiProducts.find(p => p.id === item.productId)
                          const prodName = prod ? prod.name : t('mgmt_unknown')
                          const { label: statusLabel, cls: badgeColor, trCls } = getItemStatus(item, t)

                          return (
                            <tr key={item.id} className={`hover:bg-bg-tertiary/10 transition-colors ${trCls}`}>
                              <td className={`px-4 py-3 font-mono text-xs text-text-primary ${barcodeSelectClass}`}>
                                {item.barcode || '—'}
                              </td>
                              <td className="px-4 py-3 font-semibold text-text-primary">
                                {prodName}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>
                                  {statusLabel}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                        {Array.from({ length: Math.max(0, ITEMS_PER_PAGE - pagedBarcodeItems.length) }).map((_, i) => (
                          <tr key={`empty-${i}`}>
                            <td className="px-4 py-3 font-mono text-xs text-transparent select-none">&nbsp;</td>
                            <td className="px-4 py-3 font-semibold text-transparent select-none">&nbsp;</td>
                            <td className="px-4 py-3">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-transparent text-transparent select-none">&nbsp;</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-auto pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-text-muted">
                        {Math.min(barcodePage * ITEMS_PER_PAGE, filteredBarcodeItems.length)} / {filteredBarcodeItems.length} ta
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setBarcodePage(p => Math.max(1, p - 1))}
                          disabled={barcodePage === 1}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-bg-tertiary text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"
                        >
                          ←
                        </button>
                        {Array.from({ length: totalBarcodePages }, (_, i) => i + 1).map(n => (
                          <button
                            key={n}
                            onClick={() => setBarcodePage(n)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                              barcodePage === n
                                ? 'bg-accent-red text-white'
                                : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                        <button
                          onClick={() => setBarcodePage(p => Math.min(totalBarcodePages, p + 1))}
                          disabled={barcodePage === totalBarcodePages}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-bg-tertiary text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"
                        >
                          →
                        </button>
                      </div>
                    </div>

                    {(user?.role === 'admin' || user?.role === 'manager') && (
                      <div className="flex justify-end gap-2 pt-3">
                        <button
                          onClick={toggleDownloadEnabled}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                            downloadEnabled
                              ? 'bg-accent-blue text-white border-accent-blue hover:opacity-90'
                              : 'bg-bg-tertiary text-text-secondary border-border hover:text-text-primary'
                          }`}
                        >
                          {downloadEnabled ? t('mgmt_download_on') : t('mgmt_download_off')}
                        </button>
                        <button
                          onClick={handleAllowReprint}
                          className="px-4 py-2 bg-accent-red text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity shadow-glow-red"
                        >
                          {t('mgmt_allow_reprint')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* QISM 3 — Tovarlar ro'yxati */}
            <div className="bg-bg-secondary border border-border rounded-3xl overflow-hidden">
              <div className="flex flex-col gap-3 px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-syne font-bold text-text-primary text-lg">{t('mgmt_products_list_title')}</h3>
                    <p className="text-xs text-text-muted">
                      {productSearch || productCatFilter !== 'all'
                        ? t('mgmt_found_count', { n: sortedProducts.length })
                        : t('mgmt_total_products', { n: apiProducts.length })}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingProduct({ isModal: true, isNew: true })}
                    className="flex items-center gap-2 px-4 py-2 bg-accent-red text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity shadow-glow-red"
                  >
                    <Plus size={14} /> {t('col_new_product')}
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    placeholder={t('mgmt_search_product_ph')}
                    value={productSearch}
                    onChange={e => { setProductSearch(e.target.value); setProductsPage(1) }}
                    className="flex-1 min-w-[180px] bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-red placeholder-text-muted"
                  />
                  <select
                    value={productCatFilter}
                    onChange={e => { setProductCatFilter(e.target.value); setProductsPage(1) }}
                    className="bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-red cursor-pointer"
                  >
                    <option value="all">{t('mgmt_all_categories')}</option>
                    {productCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse table-fixed" style={{ minWidth: '1200px' }}>
                  <colgroup>
                    <col style={{ width: '200px' }} />
                    <col style={{ width: '110px' }} />
                    <col style={{ width: '130px' }} />
                    <col style={{ width: '150px' }} />
                    <col style={{ width: '150px' }} />
                    <col style={{ width: '120px' }} />
                    <col style={{ width: '130px' }} />
                    <col style={{ width: '80px' }} />
                    <col style={{ width: '100px' }} />
                    <col style={{ width: '60px' }} />
                  </colgroup>
                  <thead className="bg-bg-tertiary">
                    <tr>
                      <th
                        className="px-4 py-3 text-text-muted font-bold uppercase tracking-wider text-xs cursor-pointer hover:text-text-primary select-none whitespace-nowrap"
                        onClick={() => handleSort('name')}
                      >
                        <span className="inline-flex items-center gap-1">
                          {t('mgmt_col_product_brand')} <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
                        </span>
                      </th>
                      <th
                        className="px-4 py-3 text-text-muted font-bold uppercase tracking-wider text-xs cursor-pointer hover:text-text-primary select-none whitespace-nowrap"
                        onClick={() => handleSort('category')}
                      >
                        <span className="inline-flex items-center gap-1">
                          {t('col_category')} <SortIcon field="category" sortField={sortField} sortDir={sortDir} />
                        </span>
                      </th>
                      <th
                        className="px-4 py-3 text-text-muted font-bold uppercase tracking-wider text-xs cursor-pointer hover:text-text-primary select-none whitespace-nowrap"
                        onClick={() => handleSort('size')}
                      >
                        <span className="inline-flex items-center gap-1">
                          {t('mgmt_col_size_season')} <SortIcon field="size" sortField={sortField} sortDir={sortDir} />
                        </span>
                      </th>
                      <th className="px-4 py-3 text-text-muted font-bold uppercase tracking-wider text-xs">{t('mgmt_col_car_attr')}</th>
                      <th
                        className="px-4 py-3 text-text-muted font-bold uppercase tracking-wider text-xs text-right cursor-pointer hover:text-text-primary select-none whitespace-nowrap"
                        onClick={() => handleSort('cashPrice')}
                      >
                        <span className="inline-flex items-center gap-1">
                          {t('mgmt_col_prices')} <SortIcon field="cashPrice" sortField={sortField} sortDir={sortDir} />
                        </span>
                      </th>
                      <th className="px-4 py-3 text-text-muted font-bold uppercase tracking-wider text-xs">{t('mgmt_col_installment')}</th>
                      <th
                        className="px-4 py-3 text-text-muted font-bold uppercase tracking-wider text-xs text-right cursor-pointer hover:text-text-primary select-none whitespace-nowrap"
                        onClick={() => handleSort('warrantyDays')}
                      >
                        <span className="inline-flex items-center gap-1">
                          {t('mgmt_col_warranty_turnover')} <SortIcon field="warrantyDays" sortField={sortField} sortDir={sortDir} />
                        </span>
                      </th>
                      <th className="px-4 py-3 text-text-muted font-bold uppercase tracking-wider text-xs text-right">{t('mgmt_col_stock')}</th>
                      <th className="px-4 py-3 text-text-muted font-bold uppercase tracking-wider text-xs text-right">{t('mgmt_col_barcode_stock')}</th>
                      <th className="px-4 py-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pagedProducts.map(p => {
                      const stock      = p.totalStock || 0
                      const barcoded   = p.barcodeReadyStock || 0
                      const noBarcode  = p.noBarcodeCount || 0
                      const isEditing  = editingProduct?.id === p.id && !editingProduct?.isModal

                      const catObj = productCategories.find(c => c.id === p.category)
                      const isCatInactive = catObj && !catObj.isActive
                      const catLabel = catObj ? t('cat_' + catObj.id, { defaultValue: catObj.label }) : p.categoryLabel
                      const seasonCodeMap = { SUMMER: 'mgmt_season_summer', WINTER: 'mgmt_season_winter', ALL_SEASON: 'mgmt_season_all' }
                      const seasonText = seasonCodeMap[p.season] ? t(seasonCodeMap[p.season]) : ''
                      const attrWordMap = { 'Yoz': 'mgmt_season_summer', 'Yozgi': 'mgmt_season_summer', 'Qish': 'mgmt_season_winter', 'Qishki': 'mgmt_season_winter', 'Butun yil': 'mgmt_season_all', 'Har fasl': 'mgmt_season_all', 'Barcha': 'mgmt_season_all', 'Barcha mavsum': 'mgmt_season_all' }
                      const attrText = p.attribute ? (attrWordMap[p.attribute] ? t(attrWordMap[p.attribute]) : p.attribute) : '—'
                      const turnover = p.turnoverDays || catObj?.turnoverDays || 30
                      const threshold = p.lowStockThreshold || 0

                      return (
                        <tr key={p.id} className="hover:bg-bg-tertiary/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-bold text-text-primary truncate">{p.name}</p>
                            <p className="text-xs text-text-muted truncate">{p.brand} • {t('country_' + p.country, { defaultValue: p.country })}</p>
                          </td>
                          <td className="px-4 py-3">
                            {(() => {
                              const catColor = getCategoryColor(p.category, productCategories)
                              return (
                                <span className={`font-semibold text-sm ${catColor.text} ${isCatInactive ? 'opacity-50' : ''}`}>
                                  {catLabel}
                                </span>
                              )
                            })()}
                            {isCatInactive && <span className="text-[10px] text-text-muted ml-1.5">{t('mgmt_cat_inactive')}</span>}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-semibold text-text-primary">{p.size}</p>
                            <p className="text-xs text-text-muted">{seasonText}</p>
                          </td>
                          <td className="px-4 py-3">
                            {p.carCategory ? (
                              <div>
                                <p className="text-xs text-text-muted mb-0.5 truncate" title={p.carCategory}>
                                  {p.carCategory.length > 20
                                    ? p.carCategory.slice(0, 20) + '...'
                                    : p.carCategory}
                                </p>
                                <p className="text-xs text-text-secondary">{attrText}</p>
                              </div>
                            ) : (
                              <p className="text-sm text-text-secondary">{attrText}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isEditing ? (
                              <div className="flex flex-col gap-1 items-end">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-text-muted">{t('mgmt_inline_sale')}</span>
                                  <input
                                    type="number"
                                    defaultValue={p.cashPrice}
                                    onBlur={e => { p.cashPrice = Number(e.target.value) }}
                                    className="w-24 text-right px-2 py-0.5 bg-bg-tertiary border border-accent-blue rounded-lg text-xs text-text-primary focus:outline-none font-bold"
                                    autoFocus
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-text-muted">{t('mgmt_inline_min')}</span>
                                  <input
                                    type="number"
                                    defaultValue={p.minSalePrice}
                                    onBlur={async e => {
                                      const newMin = Number(e.target.value)
                                      if (newMin > p.cashPrice) return
                                      await updateProductPrice(p.id, { cashPrice: p.cashPrice, minSalePrice: newMin })
                                      await refreshProducts()
                                      setEditingProduct(null)
                                    }}
                                    className="w-24 text-right px-2 py-0.5 bg-bg-tertiary border border-accent-orange rounded-lg text-xs text-text-primary focus:outline-none font-bold"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="text-right cursor-pointer hover:bg-bg-tertiary/40 rounded px-1" onClick={() => setEditingProduct(p)} title={t('mgmt_title_inline_edit')}>
                                <p className="font-bold text-text-primary">{p.cashPrice?.toLocaleString('uz-UZ')} {som}</p>
                                <p className="text-xs text-text-muted">min: {(p.minSalePrice ?? 0).toLocaleString('uz-UZ')} {som}</p>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {(p.installmentMonths || []).map(m => (
                                <span key={m} className="bg-accent-blue/10 text-accent-blue text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  {t('mgmt_months_unit', { n: m })}
                                </span>
                              ))}
                              {(!p.installmentMonths || p.installmentMonths.length === 0) && (
                                <span className="text-xs text-text-muted">—</span>
                              )}
                            </div>

                          </td>
                          <td className="px-4 py-3 text-right">
                            <p className="text-sm font-semibold text-text-primary">{t('mgmt_warranty_label', { n: p.warrantyDays || 0 })}</p>
                            <p className="text-xs text-text-muted">{t('mgmt_turnover_label', { n: turnover })}</p>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                              stock === 0 ? 'bg-accent-red/10 text-accent-red' :
                              stock <= threshold ? 'bg-accent-orange/10 text-accent-orange' :
                              'bg-accent-green/10 text-accent-green'
                            }`}>{t('mgmt_pcs_unit', { n: stock })}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div>
                              <p className="text-xs font-bold text-accent-green">✓ {t('mgmt_pcs_unit', { n: barcoded })}</p>
                              <p className="text-xs font-bold text-accent-orange">✗ {t('mgmt_pcs_unit', { n: noBarcode })}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setEditingProduct({ ...p, isModal: true })}
                                className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                                title={t('mgmt_title_detail_edit')}
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => setDeleteProductConfirm(p)}
                                className="p-2 rounded-lg text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors"
                                title={t('mgmt_delete_btn')}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {totalProductPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                  <p className="text-xs text-text-muted">
                    {Math.min(productsPage * ITEMS_PER_PAGE, sortedProducts.length)} / {sortedProducts.length} ta
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setProductsPage(p => Math.max(1, p - 1))}
                      disabled={productsPage === 1}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-bg-tertiary text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"
                    >
                      ←
                    </button>
                    {Array.from({ length: totalProductPages }, (_, i) => i + 1).map(n => (
                      <button
                        key={n}
                        onClick={() => setProductsPage(n)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                          productsPage === n
                            ? 'bg-accent-red text-white'
                            : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      onClick={() => setProductsPage(p => Math.min(totalProductPages, p + 1))}
                      disabled={productsPage === totalProductPages}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-bg-tertiary text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"
                    >
                      →
                    </button>
                  </div>
		</div>
                )}

                {/* Edit Product Modal */}
                <AnimatePresence>
                  {editingProduct && editingProduct.isModal && (
                    <div
                      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
                      onClick={e => { if (e.target === e.currentTarget) setEditingProduct(null) }}
                    >
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-bg-secondary border border-border rounded-[2rem] p-8 w-full max-w-lg shadow-glow-red overflow-y-auto max-h-[90vh] no-scrollbar text-left"
                      >
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-xl font-syne font-extrabold text-text-primary">
                              {editingProduct.isNew ? t('mgmt_add_product_title') : t('mgmt_edit_product_title')}
                            </h3>
                            {!editingProduct.isNew && (
                              <p className="text-xs text-text-muted mt-1">{editingProduct.brand} • {editingProduct.name}</p>
                            )}
                          </div>
                          <button onClick={() => setEditingProduct(null)} className="p-2 text-text-muted hover:text-text-primary transition-colors">
                            <X size={24} />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                          {/* SECTION 1: Asosiy ma'lumotlar */}
                          <p className="col-span-2 text-[10px] font-extrabold uppercase tracking-widest text-text-muted border-b border-border pb-2 mb-1">
                            {t('mgmt_section_basic')}
                          </p>

                          <div className="col-span-2">
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('col_product_name')}</label>
                            <input
                              type="text"
                              id="p_name"
                              defaultValue={editingProduct.name || ''}
                              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">
                              {t('col_category')} <span className="text-accent-red">*</span>
                            </label>
                            <select
                              id="p_category"
                              defaultValue={editingProduct.category || ''}
                              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-blue cursor-pointer"
                            >
                              <option value="">{t('mgmt_select_ph')}</option>
                              {productCategories.filter(c => c.isActive !== false).map(c => (
                                <option key={c.id} value={c.id}>{t('cat_' + c.id, { defaultValue: c.label })}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('mgmt_field_brand')}</label>
                            <input
                              type="text"
                              id="p_brand"
                              defaultValue={editingProduct.brand || ''}
                              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('col_country')}</label>
                            <input
                              type="text"
                              id="p_country"
                              defaultValue={editingProduct.country || ''}
                              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('mgmt_field_size')}</label>
                            <input
                              type="text"
                              id="p_size"
                              defaultValue={editingProduct.size || ''}
                              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('mgmt_field_season')}</label>
                            <select
                              id="p_season"
                              defaultValue={editingProduct.season || 'NA'}
                              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-blue cursor-pointer"
                            >
                              <option value="NA">{t('mgmt_season_na')}</option>
                              <option value="SUMMER">{t('mgmt_season_summer')}</option>
                              <option value="WINTER">{t('mgmt_season_winter')}</option>
                              <option value="ALL_SEASON">{t('mgmt_season_all')}</option>
                            </select>
                          </div>

                          <div className="col-span-2">
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('mgmt_field_attribute')}</label>
                            <input
                              type="text"
                              id="p_attribute"
                              defaultValue={editingProduct.attribute || ''}
                              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">
                              {t('mgmt_field_car_category')}
                            </label>
                            <input
                              type="text"
                              id="p_car_category"
                              defaultValue={editingProduct.carCategory || ''}
                              placeholder={t('mgmt_field_car_category_ph')}
                              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('col_note')}</label>
                            <textarea
                              id="p_notes"
                              defaultValue={editingProduct.notes || ''}
                              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-blue h-20 resize-none"
                              rows={3}
                            />
                          </div>

                          {/* SECTION 2: Narxlar */}
                          <p className="col-span-2 text-[10px] font-extrabold uppercase tracking-widest text-text-muted border-b border-border pb-2 mb-1 mt-2">
                            {t('mgmt_section_prices')}
                          </p>

                          <div>
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('mgmt_field_cash_price')}</label>
                            <input
                              type="number"
                              id="p_modal_cash"
                              defaultValue={editingProduct.cashPrice || ''}
                              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('mgmt_field_min_price')}</label>
                            <input
                              type="number"
                              id="p_modal_min"
                              defaultValue={editingProduct.minSalePrice || ''}
                              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-sm text-accent-red focus:outline-none focus:border-accent-blue"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('mgmt_field_inst_base')}</label>
                            <input
                              type="number"
                              id="p_modal_inst_base"
                              defaultValue={editingProduct.installmentBasePrice || ''}
                              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                            />
                          </div>

                          {/* SECTION 3: Muddatli to'lov */}
                          <p className="col-span-2 text-[10px] font-extrabold uppercase tracking-widest text-text-muted border-b border-border pb-2 mb-1 mt-2">
                            {t('mgmt_section_installment')}
                          </p>

                          <div className="col-span-2 flex gap-6 py-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" id="p_inst_3" value="3" defaultChecked={editingProduct.installmentMonths?.includes(3)} className="accent-accent-blue w-4 h-4" />
                              <span className="text-sm text-text-primary font-semibold">{t('mgmt_months_unit', { n: 3 })}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" id="p_inst_6" value="6" defaultChecked={editingProduct.installmentMonths?.includes(6)} className="accent-accent-blue w-4 h-4" />
                              <span className="text-sm text-text-primary font-semibold">{t('mgmt_months_unit', { n: 6 })}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" id="p_inst_12" value="12" defaultChecked={editingProduct.installmentMonths?.includes(12)} className="accent-accent-blue w-4 h-4" />
                              <span className="text-sm text-text-primary font-semibold">{t('mgmt_months_unit', { n: 12 })}</span>
                            </label>
                          </div>

                          {/* SECTION 4: Sozlamalar */}
                          <p className="col-span-2 text-[10px] font-extrabold uppercase tracking-widest text-text-muted border-b border-border pb-2 mb-1 mt-2">
                            {t('mgmt_tab_settings')}
                          </p>

                          <div>
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('mgmt_field_warranty')}</label>
                            <input
                              type="number"
                              id="p_modal_warranty"
                              defaultValue={editingProduct.warrantyDays || ''}
                              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('mgmt_field_low_stock')}</label>
                            <input
                              type="number"
                              id="p_modal_low"
                              defaultValue={editingProduct.lowStockThreshold || ''}
                              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                            />
                          </div>
                        </div>

                        <button
                          onClick={async () => {
                            const name = document.getElementById('p_name').value
                            const brand = document.getElementById('p_brand').value
                            const country = document.getElementById('p_country').value
                            const size = document.getElementById('p_size').value
                            const season = document.getElementById('p_season').value
                            const seasonLabelMap = { SUMMER: 'Yozgi', WINTER: 'Qishki', ALL_SEASON: 'Barcha mavsum', NA: '—' }
                            const seasonLabel = seasonLabelMap[season] || season
                            const attribute = document.getElementById('p_attribute').value
                            const carCategory = document.getElementById('p_car_category').value
                            const notes = document.getElementById('p_notes').value
                            const cashPrice = parseFloat(document.getElementById('p_modal_cash').value) || 0
                            const minSalePrice = parseFloat(document.getElementById('p_modal_min').value) || 0
                            const installmentBasePrice = parseFloat(document.getElementById('p_modal_inst_base').value) || 0
                            const warrantyDays = parseInt(document.getElementById('p_modal_warranty').value) || 0
                            const lowStockThreshold = parseInt(document.getElementById('p_modal_low').value) || 0
                            const installmentMonths = [3, 6, 12].filter(m =>
                              document.getElementById('p_inst_' + m)?.checked
                            )

                            const categoryId = document.getElementById('p_category')?.value || ''
                            if (editingProduct.isNew === true) {
                              await createProduct({
                                name, brand, country, size, season,
                                cashPrice, minSalePrice, installmentBasePrice,
                                warrantyDays, lowStockThreshold,
                                category: categoryId,
                                attribute, carCategory, notes,
                                installmentMonths,
                              })
                            } else {
                              await apiUpdateProduct(editingProduct.id, {
                                name, brand, country, size, season,
                                cashPrice, minSalePrice, installmentBasePrice,
                                warrantyDays, lowStockThreshold,
                                category: categoryId,
                                attribute, carCategory, notes,
                                installmentMonths,
                              })
                            }
                            await refreshProducts()
                            bump()
                            setEditingProduct(null)
                          }}
                          className="w-full py-4 bg-accent-red text-white rounded-2xl font-syne font-extrabold text-lg shadow-glow-red hover:opacity-90 transition-all"
                        >
                          {t('mgmt_btn_save')}
                        </button>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* Delete Product Modal */}
                {deleteProductConfirm && (
                  <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[120] flex items-center justify-center p-4"
                    onClick={e => { if (e.target === e.currentTarget) setDeleteProductConfirm(null) }}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-bg-secondary border border-accent-red/30 rounded-[2rem] p-8 w-full max-w-sm shadow-glow-red"
                    >
                      <div className="text-center space-y-4 mb-6">
                        <div className="w-14 h-14 bg-accent-red/10 rounded-2xl flex items-center justify-center mx-auto">
                          <Trash2 size={24} className="text-accent-red" />
                        </div>
                        <div>
                          <h3 className="text-lg font-syne font-extrabold text-text-primary">{t('mgmt_delete_product_title')}</h3>
                          <p className="text-sm text-text-secondary mt-1">
                            <span className="font-bold text-text-primary">{deleteProductConfirm.brand} {deleteProductConfirm.name}</span> {t('mgmt_delete_product_confirm')}
                          </p>
                          <p className="text-xs text-accent-orange mt-2">
                            {t('mgmt_delete_irreversible')}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setDeleteProductConfirm(null)}
                          className="py-3 bg-bg-tertiary border border-border text-text-primary rounded-2xl font-bold hover:bg-border transition-colors"
                        >
                          {t('mgmt_btn_cancel')}
                        </button>
                        <button
                          onClick={async () => {
                            await deleteProduct(deleteProductConfirm.id)
                            await refreshProducts()
                            bump()
                            setDeleteProductConfirm(null)
                          }}
                          className="py-3 bg-accent-red text-white rounded-2xl font-bold hover:opacity-90 transition-opacity shadow-glow-red"
                        >
                          {t('mgmt_btn_delete')}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
            </div>
          </motion.div>

  )
}

export default ProductsTab
