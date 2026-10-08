import React, { useState, useEffect, useMemo } from 'react'
import TableView from '../../../components/ui/TableView'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, BarChart2, Building, CheckCircle, ChevronRight, DollarSign, Edit3, Eye, EyeOff, Image as ImageIcon, MapPin, Package, Pencil, Plus, Search, Store, Tag, ToggleLeft, ToggleRight, Trash2, X, TrendingUp, TrendingDown } from 'lucide-react'
import { useSettingsStore } from '../../../store/settingsStore'
import { SortIcon } from '../whHelpers.jsx'
import { formatPrice } from '../../../utils/format'
import { getCategoryColor } from '../../../utils/categoryColors'
import { getItemStatus } from '../../../utils/itemStatus'
import { renameAttributeKey } from '../../../api/itemService'
import { bulkUpdatePrices } from '../../../api/productService'
import { compressImage } from '../../../api/productImageService'
import DualPriceInput from '../components/DualPriceInput'
import { productTitle } from '../../../utils/format'
import { StackGuard } from '../../../components/ui/Modal'

const ProductsTab = ({ ctx }) => {
  const tireFields = useSettingsStore(st => st.modules?.tireFields !== false)
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
    companyName, setCompanyName,
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
    priceListSettings, setPriceListSettings,
  } = ctx

  const { productImages, setProductImages, updateProductAttributeDef } = useSettingsStore()
  const [modalImages, setModalImages] = useState([])
  // Tovar oynasida narxlar qaysi valyutada kiritiladi (saqlanishi doim so'mda)
  const [priceCur, setPriceCur] = useState('uzs')
  const [priceRate, setPriceRate] = useState(usdRate || '')

  useEffect(() => {
    if (editingProduct?.isModal) {
      setModalImages(productImages[String(editingProduct.id)] || [])
    }
  }, [editingProduct?.id, editingProduct?.isModal])

  const handleModalImageUpload = (e) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      compressImage(file)
        .then(dataUrl => setModalImages(prev => [...prev, dataUrl]))
        .catch(() => alert(t('prod_img_upload_err')))
    })
    e.target.value = ''
  }

  const [newAttrLabel, setNewAttrLabel] = useState('')
  const [attrValueInputs, setAttrValueInputs] = useState({})

  // Ommaviy narx o'zgartirish
  const [selectedProductIds, setSelectedProductIds] = useState(new Set())
  const [bulkPriceModal, setBulkPriceModal] = useState(false)
  const [bulkFields, setBulkFields] = useState({ cash: true, min: false, installment: false })
  const [bulkDir, setBulkDir] = useState('+') // '+' | '-'
  const [bulkType, setBulkType] = useState('%') // '%' | 'sum'
  const [bulkValue, setBulkValue] = useState('')
  const [bulkSaving, setBulkSaving] = useState(false)

  const toggleSelectProduct = (id) => setSelectedProductIds(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })
  const toggleSelectAll = () => {
    if (selectedProductIds.size === pagedProducts.length && pagedProducts.every(p => selectedProductIds.has(p.id))) {
      setSelectedProductIds(new Set())
    } else {
      setSelectedProductIds(new Set(pagedProducts.map(p => p.id)))
    }
  }

  const applyBulkChange = (price) => {
    const v = parseFloat(bulkValue) || 0
    let delta = bulkType === '%' ? Math.round(price * v / 100) : v
    return bulkDir === '+' ? price + delta : Math.max(0, price - delta)
  }

  const bulkSelectedProducts = useMemo(
    () => (sortedProducts || []).filter(p => selectedProductIds.has(p.id)),
    [sortedProducts, selectedProductIds]
  )
  const [renamingAttrId, setRenamingAttrId] = useState(null)
  const [renameAttrValue, setRenameAttrValue] = useState('')
  const [deletingAttrDef, setDeletingAttrDef] = useState(null) // { id, label }
  const [renamingSaving, setRenamingSaving] = useState(false)
  const [attrDupError, setAttrDupError] = useState('')

  // Narxnoma dizayn local form
  const [plForm, setPlForm] = useState(() => ({
    headerColor:   priceListSettings?.headerColor   ?? '#1c1c2e',
    accentColor:   priceListSettings?.accentColor   ?? '#cc0000',
    logoTextColor: priceListSettings?.logoTextColor ?? '#ffffff',
    font:          priceListSettings?.font          ?? 'Arial',
    logoPosition:  priceListSettings?.logoPosition  ?? 'left',
    logoMode:      priceListSettings?.logoMode      ?? 'normal',
    footer:        priceListSettings?.footer        ?? '',
  }))
  const [plSaved, setPlSaved] = useState(false)
  const [showCrop, setShowCrop]   = useState(false)
  const [cropPad, setCropPad]     = useState({ top: 0, right: 0, bottom: 0, left: 0 })

  // Narxnoma uchun alohida logo — companyLogo bilan bog'liq EMAS
  const plLogo         = priceListSettings?.logo
  const plLogoOriginal = priceListSettings?.logoOriginal
  const srcLogo        = plLogoOriginal || plLogo

  const autoTrimLogo = () => {
    if (!srcLogo) return
    const img = new Image()
    img.onload = () => {
      const W = img.width, H = img.height
      const c = document.createElement('canvas')
      c.width = W; c.height = H
      const ctx = c.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const d = ctx.getImageData(0, 0, W, H).data
      const blank = (x, y) => { const i=(y*W+x)*4; return d[i+3]<20||(d[i]>240&&d[i+1]>240&&d[i+2]>240) }
      let t=0, b=H-1, l=0, r=W-1
      while (t<H && Array.from({length:W},(_,x)=>x).every(x=>blank(x,t))) t++
      while (b>t && Array.from({length:W},(_,x)=>x).every(x=>blank(x,b))) b--
      while (l<W && Array.from({length:H},(_,y)=>y).every(y=>blank(l,y))) l++
      while (r>l && Array.from({length:H},(_,y)=>y).every(y=>blank(r,y))) r--
      const p=6
      t=Math.max(0,t-p); b=Math.min(H-1,b+p); l=Math.max(0,l-p); r=Math.min(W-1,r+p)
      const out = document.createElement('canvas')
      out.width=r-l+1; out.height=b-t+1
      out.getContext('2d').drawImage(c, l, t, out.width, out.height, 0, 0, out.width, out.height)
      setPriceListSettings({ logo: out.toDataURL('image/png') })
    }
    img.src = srcLogo
  }

  const applyCropPad = () => {
    if (!srcLogo) return
    const img = new Image()
    img.onload = () => {
      const W = img.width, H = img.height
      const tPx = Math.round(H*cropPad.top/100), bPx = Math.round(H*cropPad.bottom/100)
      const lPx = Math.round(W*cropPad.left/100), rPx = Math.round(W*cropPad.right/100)
      const w = W-lPx-rPx, h = H-tPx-bPx
      if (w<=0||h<=0) return
      const canvas = document.createElement('canvas')
      canvas.width=w; canvas.height=h
      canvas.getContext('2d').drawImage(img, lPx, tPx, w, h, 0, 0, w, h)
      setPriceListSettings({ logo: canvas.toDataURL('image/png') })
      setShowCrop(false)
      setCropPad({ top:0, right:0, bottom:0, left:0 })
    }
    img.src = srcLogo
  }

  const restoreOriginalLogo = () => {
    if (plLogoOriginal) {
      setPriceListSettings({ logo: plLogoOriginal })
      setCropPad({ top:0, right:0, bottom:0, left:0 })
    }
  }

  const savePriceListSettings = () => {
    setPriceListSettings(plForm)
    setPlSaved(true)
    setTimeout(() => setPlSaved(false), 2000)
  }

  return (
          <motion.div key="products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 sm:space-y-6">
            
            {/* QISM 1 — Kategoriyalar bloki */}
            <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
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
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-bold text-xs uppercase">{t('col_name')}</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-bold text-xs uppercase">{t('mgmt_col_turnover')}</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-bold text-xs uppercase">{t('col_status')}</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-bold text-xs uppercase text-right">{t('mgmt_col_action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {productCategories.map(cat => {
                      const isEditing = editingCategory?.id === cat.id
                      return (
                        <tr key={cat.id} className={`hover:bg-bg-tertiary/20 transition-colors ${cat.isActive ? '' : 'opacity-50'}`}>
                          <td className="px-3 sm:px-4 py-2 sm:py-3">
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
                          <td className="px-3 sm:px-4 py-2 sm:py-3">
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
                          <td className="px-3 sm:px-4 py-2 sm:py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cat.isActive ? 'bg-accent-green/10 text-accent-green' : 'bg-bg-tertiary text-text-muted'}`}>
                              {cat.isActive ? t('mgmt_status_active') : t('mgmt_status_inactive')}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-right">
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
            <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-syne font-bold text-text-primary">Xususiyatlar</h3>
                  <p className="text-xs text-text-muted">Kirim qilishda batchga beriladigan xususiyat shablonlari (masalan: Rang, Material)</p>
                </div>
              </div>

              {/* Yangi xususiyat qo'shish */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <input
                    value={newAttrLabel}
                    onChange={e => { setNewAttrLabel(e.target.value); setAttrDupError('') }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && newAttrLabel.trim()) {
                        const label = newAttrLabel.trim()
                        if ((productAttributeDefs || []).some(d => d.label.toLowerCase() === label.toLowerCase())) {
                          setAttrDupError(`"${label}" xususiyati allaqachon mavjud`)
                          return
                        }
                        addProductAttributeDef(label)
                        setNewAttrLabel('')
                        setAttrDupError('')
                      }
                    }}
                    placeholder="Yangi xususiyat nomi (masalan: Rang)"
                    className={`flex-1 px-3 py-2 bg-bg-tertiary border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none ${attrDupError ? 'border-accent-red' : 'border-border focus:border-accent-blue'}`}
                  />
                  <button
                    onClick={() => {
                      const label = newAttrLabel.trim()
                      if (!label) return
                      if ((productAttributeDefs || []).some(d => d.label.toLowerCase() === label.toLowerCase())) {
                        setAttrDupError(`"${label}" xususiyati allaqachon mavjud`)
                        return
                      }
                      addProductAttributeDef(label)
                      setNewAttrLabel('')
                      setAttrDupError('')
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-accent-red text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity shadow-glow-red"
                  >
                    <Plus size={14} /> Qo'shish
                  </button>
                </div>
                {attrDupError && <p className="text-xs text-accent-red pl-1">{attrDupError}</p>}
              </div>

              {/* Xususiyatlar ro'yxati */}
              {(productAttributeDefs || []).length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">Hali xususiyat qo'shilmagan</p>
              ) : (
                <div className="space-y-3">
                  {(productAttributeDefs || []).map(def => (
                    <div key={def.id} className="border border-border rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        {renamingAttrId === def.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              value={renameAttrValue}
                              onChange={e => setRenameAttrValue(e.target.value)}
                              autoFocus
                              onKeyDown={async e => {
                                if (e.key === 'Escape') { setRenamingAttrId(null); setRenameAttrValue('') }
                                if (e.key === 'Enter') {
                                  const newLabel = renameAttrValue.trim()
                                  if (!newLabel || newLabel === def.label) { setRenamingAttrId(null); return }
                                  if ((productAttributeDefs || []).some(d => d.id !== def.id && d.label.toLowerCase() === newLabel.toLowerCase())) return
                                  setRenamingSaving(true)
                                  await renameAttributeKey(def.label, newLabel)
                                  updateProductAttributeDef(def.id, newLabel)
                                  setRenamingSaving(false)
                                  setRenamingAttrId(null)
                                  setRenameAttrValue('')
                                }
                              }}
                              className="flex-1 px-2 py-1 bg-bg-tertiary border border-accent-blue rounded-lg text-sm text-text-primary focus:outline-none"
                            />
                            <button
                              disabled={renamingSaving}
                              onClick={async () => {
                                const newLabel = renameAttrValue.trim()
                                if (!newLabel || newLabel === def.label) { setRenamingAttrId(null); return }
                                if ((productAttributeDefs || []).some(d => d.id !== def.id && d.label.toLowerCase() === newLabel.toLowerCase())) return
                                setRenamingSaving(true)
                                await renameAttributeKey(def.label, newLabel)
                                updateProductAttributeDef(def.id, newLabel)
                                setRenamingSaving(false)
                                setRenamingAttrId(null)
                                setRenameAttrValue('')
                              }}
                              className="p-1 hover:bg-accent-green/10 rounded text-accent-green transition-colors disabled:opacity-50"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button onClick={() => { setRenamingAttrId(null); setRenameAttrValue('') }} className="p-1 hover:bg-bg-tertiary rounded text-text-muted transition-colors">
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="font-bold text-text-primary text-sm flex-1">{def.label}</span>
                        )}
                        {renamingAttrId !== def.id && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { setRenamingAttrId(def.id); setRenameAttrValue(def.label) }}
                              className="p-1 hover:bg-accent-blue/10 rounded text-text-muted hover:text-accent-blue transition-colors"
                              title="Nomini o'zgartirish"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => setDeletingAttrDef(def)}
                              className="p-1 hover:bg-accent-red/10 rounded text-text-muted hover:text-accent-red transition-colors"
                              title="O'chirish"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
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

              {/* Delete confirmation modal */}
              <AnimatePresence>
                {deletingAttrDef && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[360] flex items-center justify-center p-4" onClick={() => setDeletingAttrDef(null)}>
                    <StackGuard onClose={() => setDeletingAttrDef(null)} />
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      onClick={e => e.stopPropagation()}
                      className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 w-full max-w-sm space-y-4"
                    >
                      {(() => {
                        const affectedCount = (items || []).filter(i => i.status === 'in_stock' && deletingAttrDef.label in (i.attributes || {})).length
                        return (
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-accent-red/10 flex items-center justify-center flex-shrink-0">
                              <AlertCircle size={20} className="text-accent-red" />
                            </div>
                            <div>
                              <h4 className="font-bold text-text-primary">Xususiyatni o'chirish</h4>
                              <p className="text-sm text-text-muted mt-1">
                                <span className="font-bold text-text-primary">"{deletingAttrDef.label}"</span> xususiyati o'chiriladi.
                                {affectedCount > 0
                                  ? <><br /><span className="text-amber-500 font-medium">{affectedCount} ta tovar</span> da bu xususiyat qiymati bor — xarid tarixi o'chadi, lekin tovarlar o'chmaYdi.</>
                                  : ' Birorta tovar da bu xususiyat belgilanmagan.'}
                              </p>
                            </div>
                          </div>
                        )
                      })()}
                      <div className="flex gap-3">
                        <button onClick={() => setDeletingAttrDef(null)} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-bold text-text-secondary hover:bg-bg-tertiary transition-colors">
                          Bekor qilish
                        </button>
                        <button
                          onClick={() => {
                            removeProductAttributeDef(deletingAttrDef.id)
                            setDeletingAttrDef(null)
                          }}
                          className="flex-1 px-4 py-2.5 bg-accent-red text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                        >
                          O'chirish
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* QISM 1.6 — Narxnoma dizayn sozlamalari */}
            <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-5">
              <div>
                <h3 className="text-xl font-syne font-bold text-text-primary">Narxnoma dizayni</h3>
                <p className="text-xs text-text-muted mt-0.5">Chop etilgan narxnomaning ko'rinishini sozlang</p>
              </div>

              {/* Logo yuklash */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Kompaniya logosi</label>
                <div className="flex items-start gap-4">
                  {/* Preview — bosib crop ochiladigan */}
                  <div
                    onClick={() => plLogo && setShowCrop(v => !v)}
                    title={plLogo ? 'Bosib kesish panelinii ochish' : ''}
                    className={`w-20 h-14 rounded-xl border border-border flex items-center justify-center overflow-hidden flex-shrink-0 transition-colors ${plLogo ? 'cursor-pointer hover:border-accent-blue' : 'bg-bg-tertiary'}`}
                    style={{ background: plLogo ? 'repeating-conic-gradient(#d0d0d0 0% 25%, #f8f8f8 0% 50%) 0/16px 16px' : undefined }}
                  >
                    {plLogo
                      ? <img src={plLogo} alt="logo" className="w-full h-full object-contain p-1" />
                      : <span className="text-[9px] text-text-muted text-center leading-tight px-1">Logo<br/>yo'q</span>
                    }
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <label className="flex items-center gap-2 px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-secondary cursor-pointer hover:bg-bg-primary hover:border-accent-blue transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const reader = new FileReader()
                          reader.onload = ev => {
                            setPriceListSettings({ logo: ev.target.result, logoOriginal: ev.target.result })
                            setShowCrop(false)
                            setCropPad({ top:0, right:0, bottom:0, left:0 })
                          }
                          reader.readAsDataURL(file)
                          e.target.value = ''
                        }}
                      />
                      Rasm yuklash (PNG, JPG, SVG)
                    </label>
                    {plLogo && (
                      <div className="flex gap-2">
                        <button
                          onClick={autoTrimLogo}
                          className="flex-1 px-3 py-2 bg-bg-tertiary text-text-secondary border border-border rounded-xl text-xs font-medium hover:bg-bg-primary hover:border-accent-blue transition-colors"
                        >
                          Oq fon kesish
                        </button>
                        <button
                          onClick={() => { setPriceListSettings({ logo: null, logoOriginal: null }); setShowCrop(false) }}
                          className="px-3 py-2 bg-accent-red/10 text-accent-red border border-accent-red/20 rounded-xl text-xs font-medium hover:bg-accent-red/20 transition-colors"
                        >
                          O'chirish
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Crop panel */}
                {showCrop && plLogo && (
                  <div className="rounded-xl border border-accent-blue/30 bg-bg-tertiary p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-accent-blue">Kesish (Crop)</p>
                      {plLogoOriginal && plLogo !== plLogoOriginal && (
                        <button
                          onClick={restoreOriginalLogo}
                          className="text-[10px] text-text-muted hover:text-accent-blue underline transition-colors"
                        >
                          Aslini tiklash
                        </button>
                      )}
                    </div>
                    {/* Preview — DOIM asl rasmdan clip ko'rsatiladi */}
                    <div
                      className="w-full h-28 flex items-center justify-center rounded-lg overflow-hidden"
                      style={{ background: 'repeating-conic-gradient(#c8c8c8 0% 25%, #f0f0f0 0% 50%) 0/16px 16px' }}
                    >
                      <img
                        src={srcLogo}
                        alt="crop preview"
                        style={{
                          maxWidth: '100%', maxHeight: '100%',
                          clipPath: `inset(${cropPad.top}% ${cropPad.right}% ${cropPad.bottom}% ${cropPad.left}%)`
                        }}
                      />
                    </div>
                    {[
                      { k: 'top',    label: 'Tepadan' },
                      { k: 'bottom', label: 'Pastdan' },
                      { k: 'left',   label: 'Chapdan' },
                      { k: 'right',  label: "O'ngdan" },
                    ].map(({ k, label }) => (
                      <div key={k} className="flex items-center gap-3">
                        <span className="text-xs text-text-muted w-16 flex-shrink-0">{label}</span>
                        <input
                          type="range" min="0" max="49" value={cropPad[k]}
                          onChange={e => setCropPad(p => ({ ...p, [k]: +e.target.value }))}
                          className="flex-1 accent-accent-blue h-1"
                        />
                        <span className="text-xs text-text-muted w-8 text-right font-mono">{cropPad[k]}%</span>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => { setShowCrop(false); setCropPad({ top:0, right:0, bottom:0, left:0 }) }}
                        className="flex-1 py-2 rounded-xl border border-border text-xs text-text-secondary hover:bg-bg-primary transition-colors"
                      >
                        Bekor
                      </button>
                      <button
                        onClick={applyCropPad}
                        className="flex-1 py-2 rounded-xl bg-accent-blue text-white text-xs font-bold hover:opacity-90 transition-colors"
                      >
                        Qo'llash
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">

                {/* Header rangi */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Header rangi</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={plForm.headerColor}
                      onChange={e => setPlForm(f => ({ ...f, headerColor: e.target.value }))}
                      className="w-10 h-10 rounded-xl border border-border cursor-pointer bg-bg-tertiary p-1"
                    />
                    <div
                      className="flex-1 h-10 rounded-xl flex items-center px-4"
                      style={{ background: plForm.headerColor }}
                    >
                      <span className="text-xs font-bold tracking-wider" style={{ color: plForm.logoTextColor }}>Michelin 65/265R15</span>
                    </div>
                  </div>
                </div>

                {/* Tovar nomi rangi */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Tovar nomi rangi</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={plForm.logoTextColor}
                      onChange={e => setPlForm(f => ({ ...f, logoTextColor: e.target.value }))}
                      className="w-10 h-10 rounded-xl border border-border cursor-pointer bg-bg-tertiary p-1"
                    />
                    <div
                      className="flex-1 h-10 rounded-xl flex items-center px-4"
                      style={{ background: plForm.headerColor }}
                    >
                      <span className="text-sm font-bold" style={{ color: plForm.logoTextColor }}>Michelin 65/265R15</span>
                    </div>
                  </div>
                </div>

                {/* Narx rangi */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Narx rangi</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={plForm.accentColor}
                      onChange={e => setPlForm(f => ({ ...f, accentColor: e.target.value }))}
                      className="w-10 h-10 rounded-xl border border-border cursor-pointer bg-bg-tertiary p-1"
                    />
                    <div className="flex-1 h-10 rounded-xl border border-border bg-bg-tertiary flex items-center px-4">
                      <span className="text-sm font-bold" style={{ color: plForm.accentColor }}>850 000 so'm</span>
                    </div>
                  </div>
                </div>

                {/* Shrift */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Shrift</label>
                  <select
                    value={plForm.font}
                    onChange={e => setPlForm(f => ({ ...f, font: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                    style={{ fontFamily: plForm.font }}
                  >
                    {['Arial', 'Times New Roman', 'Tahoma', 'Georgia', 'Verdana'].map(fn => (
                      <option key={fn} value={fn} style={{ fontFamily: fn }}>{fn}</option>
                    ))}
                  </select>
                </div>

                {/* Logo joylashuvi */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Logo joylashuvi</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'left',   label: 'Chap' },
                      { id: 'center', label: 'Markaz' },
                      { id: 'right',  label: "O'ng" },
                    ].map(pos => (
                      <button
                        key={pos.id}
                        onClick={() => setPlForm(f => ({ ...f, logoPosition: pos.id }))}
                        className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          plForm.logoPosition === pos.id
                            ? 'border-accent-blue bg-accent-blue/10 text-accent-blue'
                            : 'border-border bg-bg-tertiary text-text-secondary hover:border-text-muted'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logo ko'rinish rejimi */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Logo ko'rinish rejimi</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'normal',     label: 'Tepada (oddiy)' },
                      { id: 'background', label: 'Fon (prozrachli)' },
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={() => setPlForm(f => ({ ...f, logoMode: m.id }))}
                        className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          plForm.logoMode === m.id
                            ? 'border-accent-blue bg-accent-blue/10 text-accent-blue'
                            : 'border-border bg-bg-tertiary text-text-secondary hover:border-text-muted'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Kolontitul matni */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-text-muted">
                  Kolontitul (pastki matn)
                </label>
                <input
                  type="text"
                  value={plForm.footer}
                  onChange={e => setPlForm(f => ({ ...f, footer: e.target.value }))}
                  placeholder="Masalan: +998 90 123 45 67 · Toshkent, Chilonzor ko'chasi 12"
                  className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={savePriceListSettings}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    plSaved
                      ? 'bg-accent-green/10 text-accent-green border border-accent-green/30'
                      : 'bg-accent-red text-white hover:opacity-90 shadow-glow-red'
                  }`}
                >
                  {plSaved ? <CheckCircle size={16} /> : null}
                  {plSaved ? 'Saqlandi' : 'Saqlash'}
                </button>
              </div>
            </div>

            {/* QISM 2 — Barkodlar bloki */}
            <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 flex flex-col" style={{minHeight: '520px'}}>
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
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-bold text-xs uppercase">{t('mgmt_col_barcode')}</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-bold text-xs uppercase">{t('col_product')}</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-bold text-xs uppercase">{t('col_status')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {pagedBarcodeItems.map(item => {
                          const prod = apiProducts.find(p => p.id === item.productId)
                          const prodName = prod ? prod.name : t('mgmt_unknown')
                          const { label: statusLabel, cls: badgeColor, trCls } = getItemStatus(item, t)

                          return (
                            <tr key={item.id} className={`hover:bg-bg-tertiary/10 transition-colors ${trCls}`}>
                              <td className={`px-3 sm:px-4 py-2 sm:py-3 font-mono text-xs text-text-primary ${barcodeSelectClass}`}>
                                {item.barcode || '—'}
                              </td>
                              <td className="px-3 sm:px-4 py-2 sm:py-3 font-semibold text-text-primary">
                                {prodName}
                              </td>
                              <td className="px-3 sm:px-4 py-2 sm:py-3">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>
                                  {statusLabel}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                        {Array.from({ length: Math.max(0, ITEMS_PER_PAGE - pagedBarcodeItems.length) }).map((_, i) => (
                          <tr key={`empty-${i}`}>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 font-mono text-xs text-transparent select-none">&nbsp;</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 font-semibold text-transparent select-none">&nbsp;</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3">
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
              <div className="flex flex-col gap-3 px-4 sm:px-6 py-4 border-b border-border">
                <div className="flex flex-wrap items-center justify-between gap-2">
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

              {/* Ommaviy narx o'zgartirish tugmasi */}
              {selectedProductIds.size > 0 && (
                <div className="flex items-center justify-between px-2 py-2 bg-accent-blue/5 border border-accent-blue/20 rounded-xl">
                  <span className="text-xs font-bold text-accent-blue">{selectedProductIds.size} ta tovar tanlandi</span>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedProductIds(new Set())} className="px-3 py-1.5 text-xs font-bold text-text-muted hover:text-text-primary border border-border rounded-lg hover:bg-bg-tertiary transition-colors">
                      Bekor
                    </button>
                    <button
                      onClick={() => setBulkPriceModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-blue text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
                    >
                      <DollarSign size={13} /> Narx o'zgartirish
                    </button>
                  </div>
                </div>
              )}

              <TableView id="wh_products" optional={[t('mgmt_col_size_season'), t('mgmt_col_car_attr'), t('mgmt_col_installment'), t('mgmt_col_warranty_turnover'), t('mgmt_col_barcode_stock')]}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse table-fixed" style={{ minWidth: '1230px' }}>
                  <colgroup>
                    <col style={{ width: '36px' }} />
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
                      <th className="px-3 py-2 sm:py-3">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-accent-blue cursor-pointer"
                          checked={pagedProducts.length > 0 && pagedProducts.every(p => selectedProductIds.has(p.id))}
                          onChange={toggleSelectAll}
                        />
                      </th>
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
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-bold uppercase tracking-wider text-xs">{t('mgmt_col_car_attr')}</th>
                      <th
                        className="px-4 py-3 text-text-muted font-bold uppercase tracking-wider text-xs text-right cursor-pointer hover:text-text-primary select-none whitespace-nowrap"
                        onClick={() => handleSort('cashPrice')}
                      >
                        <span className="inline-flex items-center gap-1">
                          {t('mgmt_col_prices')} <SortIcon field="cashPrice" sortField={sortField} sortDir={sortDir} />
                        </span>
                      </th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-bold uppercase tracking-wider text-xs">{t('mgmt_col_installment')}</th>
                      <th
                        className="px-4 py-3 text-text-muted font-bold uppercase tracking-wider text-xs text-right cursor-pointer hover:text-text-primary select-none whitespace-nowrap"
                        onClick={() => handleSort('warrantyDays')}
                      >
                        <span className="inline-flex items-center gap-1">
                          {t('mgmt_col_warranty_turnover')} <SortIcon field="warrantyDays" sortField={sortField} sortDir={sortDir} />
                        </span>
                      </th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-bold uppercase tracking-wider text-xs text-right">{t('mgmt_col_stock')}</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-bold uppercase tracking-wider text-xs text-right">{t('mgmt_col_barcode_stock')}</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pagedProducts.map(p => {
                      const stock      = p.totalStock || 0
                      const barcoded   = p.barcodeReadyStock || 0
                      const noBarcode  = p.noBarcodeCount || 0
                      const isEditing  = editingProduct?.id === p.id && !editingProduct?.isModal
                      const pUnit = (items || []).find(i => i.productId === p.id && i.status === 'in_stock')?.unit
                        || (items || []).find(i => i.productId === p.id)?.unit
                        || 'dona'

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
                        <tr key={p.id} className={`transition-colors ${selectedProductIds.has(p.id) ? 'bg-accent-blue/5' : 'hover:bg-bg-tertiary/50'}`}>
                          <td className="px-3 py-2 sm:py-3">
                            <input
                              type="checkbox"
                              className="w-4 h-4 accent-accent-blue cursor-pointer"
                              checked={selectedProductIds.has(p.id)}
                              onChange={() => toggleSelectProduct(p.id)}
                              onClick={e => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3">
                            <div className="flex items-center gap-2">
                              {productImages[String(p.id)]?.[0] ? (
                                <img
                                  src={productImages[String(p.id)][0]}
                                  alt=""
                                  className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-border"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-bg-tertiary flex-shrink-0 border border-border flex items-center justify-center">
                                  <ImageIcon size={14} className="text-text-muted opacity-40" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-bold text-text-primary truncate">{p.name}</p>
                                <p className="text-xs text-text-muted truncate">{p.brand} • {t('country_' + p.country, { defaultValue: p.country })}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3">
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
                          <td className="px-3 sm:px-4 py-2 sm:py-3">
                            <p className="text-sm font-semibold text-text-primary">{p.size}</p>
                            <p className="text-xs text-text-muted">{seasonText}</p>
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3">
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
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-right">
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
                          <td className="px-3 sm:px-4 py-2 sm:py-3">
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
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-right">
                            <p className="text-sm font-semibold text-text-primary">{t('mgmt_warranty_label', { n: p.warrantyDays || 0 })}</p>
                            <p className="text-xs text-text-muted">{t('mgmt_turnover_label', { n: turnover })}</p>
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-right">
                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                              stock === 0 ? 'bg-accent-red/10 text-accent-red' :
                              stock <= threshold ? 'bg-accent-orange/10 text-accent-orange' :
                              'bg-accent-green/10 text-accent-green'
                            }`}>{stock} {pUnit}</span>
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-right">
                            <div>
                              <p className="text-xs font-bold text-accent-green">✓ {barcoded} {pUnit}</p>
                              <p className="text-xs font-bold text-accent-orange">✗ {noBarcode} {pUnit}</p>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-right">
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
              </TableView>

              {totalProductPages > 1 && (
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-border">
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

                {/* Ommaviy narx o'zgartirish modal */}
                <AnimatePresence>
                  {bulkPriceModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[330] flex items-center justify-center p-4" onClick={() => setBulkPriceModal(false)}>
                      <StackGuard onClose={() => setBulkPriceModal(false)} />
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-bg-secondary border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
                      >
                        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border flex-shrink-0">
                          <div>
                            <h3 className="font-syne font-bold text-text-primary">Narx o'zgartirish</h3>
                            <p className="text-xs text-text-muted mt-0.5">{bulkSelectedProducts.length} ta tovar tanlandi</p>
                          </div>
                          <button onClick={() => setBulkPriceModal(false)} className="p-2 rounded-xl hover:bg-bg-tertiary text-text-muted transition-colors"><X size={18} /></button>
                        </div>

                        <div className="overflow-y-auto no-scrollbar flex-1 p-4 sm:p-6 space-y-3 sm:space-y-5">
                          {/* Qaysi narxni o'zgartirish */}
                          <div className="space-y-2">
                            <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Qaysi narxni o'zgartirish</p>
                            <div className="flex gap-3">
                              {[
                                { key: 'cash', label: 'Naqd narx' },
                                { key: 'min', label: 'Minimal narx' },
                                { key: 'installment', label: 'Nasiya narxi' },
                              ].map(({ key, label }) => (
                                <label key={key} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={bulkFields[key]}
                                    onChange={e => setBulkFields(prev => ({ ...prev, [key]: e.target.checked }))}
                                    className="w-4 h-4 accent-accent-blue"
                                  />
                                  <span className="text-sm text-text-secondary">{label}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* O'zgartirish parametrlari */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Yo'nalish</p>
                              <div className="flex gap-2">
                                {[
                                  { v: '+', label: 'Oshirish', Icon: TrendingUp, cls: 'text-accent-green border-accent-green bg-accent-green/10' },
                                  { v: '-', label: 'Kamaytirish', Icon: TrendingDown, cls: 'text-accent-red border-accent-red bg-accent-red/10' },
                                ].map(({ v, label, Icon, cls }) => (
                                  <button
                                    key={v}
                                    onClick={() => setBulkDir(v)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 border rounded-xl text-xs font-bold transition-colors ${bulkDir === v ? cls : 'border-border text-text-muted hover:bg-bg-tertiary'}`}
                                  >
                                    <Icon size={13} /> {label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Tur</p>
                              <div className="flex gap-2">
                                {[{ v: '%', label: 'Foiz (%)' }, { v: 'sum', label: "So'm" }].map(({ v, label }) => (
                                  <button
                                    key={v}
                                    onClick={() => setBulkType(v)}
                                    className={`flex-1 py-2 border rounded-xl text-xs font-bold transition-colors ${bulkType === v ? 'border-accent-blue text-accent-blue bg-accent-blue/10' : 'border-border text-text-muted hover:bg-bg-tertiary'}`}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Miqdor</p>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  value={bulkValue}
                                  onChange={e => setBulkValue(e.target.value)}
                                  placeholder="0"
                                  className="w-full px-3 py-2 pr-8 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">
                                  {bulkType === '%' ? '%' : "so'm"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Preview jadval */}
                          {bulkValue && parseFloat(bulkValue) > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Ko'rib chiqish</p>
                              <div className="overflow-y-auto max-h-56 no-scrollbar border border-border rounded-xl">
                                <table className="w-full text-sm">
                                  <thead className="bg-bg-tertiary sticky top-0">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs font-bold text-text-muted">Tovar</th>
                                      {bulkFields.cash && <th className="px-3 py-2 text-right text-xs font-bold text-text-muted">Naqd</th>}
                                      {bulkFields.min && <th className="px-3 py-2 text-right text-xs font-bold text-text-muted">Minimal</th>}
                                      {bulkFields.installment && <th className="px-3 py-2 text-right text-xs font-bold text-text-muted">Nasiya</th>}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border">
                                    {bulkSelectedProducts.map(p => (
                                      <tr key={p.id} className="hover:bg-bg-tertiary/30">
                                        <td className="px-3 py-2">
                                          <p className="font-medium text-text-primary text-xs truncate max-w-[180px]">{p.name}</p>
                                        </td>
                                        {bulkFields.cash && (
                                          <td className="px-3 py-2 text-right whitespace-nowrap">
                                            <span className="text-text-muted text-xs">{(p.cashPrice||0).toLocaleString('uz-UZ')}</span>
                                            <span className="text-text-muted text-xs mx-1">→</span>
                                            <span className={`font-bold text-xs ${bulkDir === '+' ? 'text-accent-green' : 'text-accent-red'}`}>
                                              {applyBulkChange(p.cashPrice||0).toLocaleString('uz-UZ')}
                                            </span>
                                          </td>
                                        )}
                                        {bulkFields.min && (
                                          <td className="px-3 py-2 text-right whitespace-nowrap">
                                            <span className="text-text-muted text-xs">{(p.minSalePrice||0).toLocaleString('uz-UZ')}</span>
                                            <span className="text-text-muted text-xs mx-1">→</span>
                                            <span className={`font-bold text-xs ${bulkDir === '+' ? 'text-accent-green' : 'text-accent-red'}`}>
                                              {applyBulkChange(p.minSalePrice||0).toLocaleString('uz-UZ')}
                                            </span>
                                          </td>
                                        )}
                                        {bulkFields.installment && (
                                          <td className="px-3 py-2 text-right whitespace-nowrap">
                                            <span className="text-text-muted text-xs">{(p.installmentBasePrice||0).toLocaleString('uz-UZ')}</span>
                                            <span className="text-text-muted text-xs mx-1">→</span>
                                            <span className={`font-bold text-xs ${bulkDir === '+' ? 'text-accent-green' : 'text-accent-red'}`}>
                                              {applyBulkChange(p.installmentBasePrice||0).toLocaleString('uz-UZ')}
                                            </span>
                                          </td>
                                        )}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="px-4 sm:px-6 py-4 border-t border-border flex-shrink-0 flex gap-3">
                          <button onClick={() => setBulkPriceModal(false)} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-bold text-text-secondary hover:bg-bg-tertiary transition-colors">
                            Bekor qilish
                          </button>
                          <button
                            disabled={bulkSaving || !parseFloat(bulkValue) || (!bulkFields.cash && !bulkFields.min && !bulkFields.installment)}
                            onClick={async () => {
                              setBulkSaving(true)
                              try {
                                const updates = bulkSelectedProducts.map(p => ({
                                  id: p.id,
                                  ...(bulkFields.cash && { cashPrice: applyBulkChange(p.cashPrice||0) }),
                                  ...(bulkFields.min && { minSalePrice: applyBulkChange(p.minSalePrice||0) }),
                                  ...(bulkFields.installment && { installmentBasePrice: applyBulkChange(p.installmentBasePrice||0) }),
                                }))
                                await bulkUpdatePrices(updates)
                                await refreshProducts()
                                setBulkPriceModal(false)
                                setSelectedProductIds(new Set())
                                setBulkValue('')
                              } finally {
                                setBulkSaving(false)
                              }
                            }}
                            className="flex-1 px-4 py-2.5 bg-accent-blue text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            {bulkSaving ? 'Saqlanmoqda...' : `${bulkSelectedProducts.length} ta tovarga qo'llash`}
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* Edit Product Modal */}
                <AnimatePresence>
                  {editingProduct && editingProduct.isModal && (
                    <div
                      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[330] flex items-center justify-center p-4"
                      onClick={e => { if (e.target === e.currentTarget) setEditingProduct(null) }}
                    >
                      <StackGuard onClose={() => { setEditingProduct(null) }} />
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-bg-secondary border border-border rounded-[2rem] p-5 sm:p-8 w-full max-w-lg shadow-glow-red overflow-y-auto max-h-[90vh] no-scrollbar text-left"
                      >
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                          <div>
                            <h3 className="text-xl font-syne font-extrabold text-text-primary">
                              {editingProduct.isNew ? t('mgmt_add_product_title') : t('mgmt_edit_product_title')}
                            </h3>
                            {!editingProduct.isNew && (
                              <p className="text-xs text-text-muted mt-1">{productTitle(editingProduct.brand, editingProduct.name)}</p>
                            )}
                          </div>
                          <button onClick={() => setEditingProduct(null)} className="p-2 text-text-muted hover:text-text-primary transition-colors">
                            <X size={24} />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4 sm:mb-6">
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

                          <div className={tireFields ? '' : 'hidden'}>
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

                          <div className={`col-span-2 ${tireFields ? '' : 'hidden'}`}>
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

                          {/* SECTION 1.5: Rasmlar */}
                          <p className="col-span-2 text-[10px] font-extrabold uppercase tracking-widest text-text-muted border-b border-border pb-2 mb-1 mt-2">
                            Rasmlar
                          </p>

                          <div className="col-span-2 space-y-3">
                            <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-xl text-sm text-text-muted cursor-pointer hover:border-accent-blue hover:text-accent-blue transition-colors">
                              <ImageIcon size={16} />
                              Rasm yuklash (PNG, JPG, WEBP)
                              <input type="file" accept="image/*" multiple className="hidden" onChange={handleModalImageUpload} />
                            </label>
                            {modalImages.length > 0 && (
                              <div className="grid grid-cols-4 gap-2">
                                {modalImages.map((img, idx) => (
                                  <div key={idx} className="relative group aspect-square">
                                    <img src={img} alt="" className="w-full h-full object-cover rounded-xl border border-border" />
                                    {idx === 0 && (
                                      <span className="absolute top-1 left-1 text-[9px] bg-accent-green text-white px-1.5 py-0.5 rounded font-bold leading-none">
                                        Asosiy
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => setModalImages(prev => prev.filter((_, i) => i !== idx))}
                                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity flex"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            {modalImages.length > 1 && (
                              <p className="text-[10px] text-text-muted">Birinchi rasm asosiy (thumbnail) sifatida ishlatiladi</p>
                            )}
                          </div>

                          {/* SECTION 2: Narxlar */}
                          <div className="col-span-2 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 mb-1 mt-2">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('mgmt_section_prices')}</p>
                            <div className="flex items-center gap-2">
                              {priceCur === 'usd' && (
                                <label className="flex items-center gap-1.5 text-[10px] text-text-muted">
                                  {t('mgmt_price_rate')}
                                  <input type="number" min="0" value={priceRate || usdRate || ''} onChange={e => setPriceRate(e.target.value)}
                                    className="w-24 bg-bg-tertiary border border-border rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent-blue" />
                                </label>
                              )}
                              <div className="flex bg-bg-tertiary border border-border rounded-lg p-0.5">
                                {[['uzs', som], ['usd', 'USD']].map(([c, l]) => (
                                  <button type="button" key={c} onClick={() => setPriceCur(c)}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${priceCur === c ? 'bg-accent-blue text-white' : 'text-text-muted'}`}>{l}</button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('mgmt_field_cash_price')}</label>
                            <DualPriceInput key={"p_modal_cash-" + (editingProduct.id || "new")} id="p_modal_cash" defaultUzs={editingProduct.cashPrice} cur={priceCur} rate={Number(priceRate) || Number(usdRate) || 0} som={som}
                              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-blue" />
                          </div>

                          <div>
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('mgmt_field_min_price')}</label>
                            <DualPriceInput key={"p_modal_min-" + (editingProduct.id || "new")} id="p_modal_min" defaultUzs={editingProduct.minSalePrice} cur={priceCur} rate={Number(priceRate) || Number(usdRate) || 0} som={som}
                              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-sm text-accent-red focus:outline-none focus:border-accent-blue" />
                          </div>

                          <div className="col-span-2">
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('mgmt_field_inst_base')}</label>
                            <DualPriceInput key={"p_modal_inst_base-" + (editingProduct.id || "new")} id="p_modal_inst_base" defaultUzs={editingProduct.installmentBasePrice} cur={priceCur} rate={Number(priceRate) || Number(usdRate) || 0} som={som}
                              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-blue" />
                          </div>

                          {/* SECTION 3: Muddatli to'lov */}
                          <p className="col-span-2 text-[10px] font-extrabold uppercase tracking-widest text-text-muted border-b border-border pb-2 mb-1 mt-2">
                            {t('mgmt_section_installment')}
                          </p>

                          <div className="col-span-2 flex gap-3 sm:gap-6 py-2">
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
                            if (priceCur === 'usd' && !(Number(priceRate || usdRate) > 0)) { alert(t('mgmt_price_rate_required')); return }
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
                              const created = await createProduct({
                                name, brand, country, size, season,
                                cashPrice, minSalePrice, installmentBasePrice,
                                warrantyDays, lowStockThreshold,
                                category: categoryId,
                                attribute, carCategory, notes,
                                installmentMonths,
                              })
                              if (created?.id && modalImages.length > 0) {
                                try { await setProductImages(created.id, modalImages) }
                                catch (e) { alert(e?.response?.data?.error || t('prod_img_save_err')) }
                              }
                            } else {
                              await apiUpdateProduct(editingProduct.id, {
                                name, brand, country, size, season,
                                cashPrice, minSalePrice, installmentBasePrice,
                                warrantyDays, lowStockThreshold,
                                category: categoryId,
                                attribute, carCategory, notes,
                                installmentMonths,
                              })
                              try { await setProductImages(editingProduct.id, modalImages) }
                              catch (e) { alert(e?.response?.data?.error || t('prod_img_save_err')) }
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
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[340] flex items-center justify-center p-4"
                    onClick={e => { if (e.target === e.currentTarget) setDeleteProductConfirm(null) }}
                  >
                    <StackGuard onClose={() => { setDeleteProductConfirm(null) }} />
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-bg-secondary border border-accent-red/30 rounded-[2rem] p-5 sm:p-8 w-full max-w-sm shadow-glow-red"
                    >
                      <div className="text-center space-y-4 mb-4 sm:mb-6">
                        <div className="w-14 h-14 bg-accent-red/10 rounded-2xl flex items-center justify-center mx-auto">
                          <Trash2 size={24} className="text-accent-red" />
                        </div>
                        <div>
                          <h3 className="text-lg font-syne font-extrabold text-text-primary">{t('mgmt_delete_product_title')}</h3>
                          <p className="text-sm text-text-secondary mt-1">
                            <span className="font-bold text-text-primary">{productTitle(deleteProductConfirm.brand, deleteProductConfirm.name)}</span> {t('mgmt_delete_product_confirm')}
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
