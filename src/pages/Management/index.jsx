import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import DateMaskInput from '../../components/DateMaskInput'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, BellOff, AlertTriangle, CheckCircle, Info, Package, Building,
  TrendingUp, TrendingDown, User, Clock, Filter,
  ChevronRight, X, Eye, EyeOff, DollarSign, Edit3, Search,
  ShieldAlert, Shield, BarChart2, Tag, Percent, Settings,
  Store, MapPin, Plus, Trash2, Pencil, ToggleLeft, ToggleRight, AlertCircle, KeyRound, Target
} from 'lucide-react'
import { PERMISSION_TREE } from '../../config/permissionTree'
import { useAuthStore } from '../../store/authStore'
import { useNotificationStore } from '../../store/notificationStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useShopStore } from '../../store/shopStore'
import { getSaleProfit } from '../../utils/profitHelpers'
import { getPromotions, createPromotion, updatePromotion, togglePromotion, deletePromotion } from '../../api/promotionService'
import { getIncomeBatches } from '../../api/incomeService'
import { getItems, updateBarcodeStatus } from '../../api/itemService'
import { getSales } from '../../api/salesService'
import { getCustomers } from '../../api/customerService'
import { getProducts, createProduct, updateProduct as apiUpdateProduct, deleteProduct, updateProductPrice } from '../../api/productService'
import { getCategoryColor } from '../../utils/categoryColors'
import { getItemStatus } from '../../utils/itemStatus'
import { useDataStore } from '../../store/dataStore'
import {
  isPrivileged, formatPrice, MONTHS_UZ, MONTHS_RU, formatDateWithMonths,
  SortIcon, TABS, severityConfig, typeLabel, VIOLATION_LABELS, VIOLATION_FILTER_KEYS,
  ROLE_LABELS, getRoleLabels, rolePriority, getRolePriority, canManageEmployee
} from './components/mgmtHelpers'
import NotificationsTab from './tabs/NotificationsTab'
import ProductsTab      from './tabs/ProductsTab'
import EmployeesTab     from './tabs/EmployeesTab'
import DiscountsTab     from './tabs/DiscountsTab'
import SettingsTab      from './tabs/SettingsTab'
import BundlesTab      from './tabs/BundlesTab'

export const Management = () => {
  const { t, i18n } = useTranslation()
  const MONTHS = i18n.language === 'ru' ? MONTHS_RU : MONTHS_UZ
  const formatDate = (d) => formatDateWithMonths(d, MONTHS)
  const som = t('unit_som')
  const pcs = t('unit_pcs')
  const { user } = useAuthStore()
  const barcodeSelectClass = user?.role === 'admin' ? '' : 'select-none'
  const { notifications, addNotification, markRead, markAllRead, getUnreadCount, removeNotification, removeAllNotifications, updateNotification } = useNotificationStore()
  const { bump } = useDataStore()
  const [activeTab, setActiveTab]     = useState(() => {
    // URL dan tab parametrini o'qish
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    const validTabs = ['notifications','products','employees','discounts','bundles','settings']
    return validTabs.includes(tab) ? tab : 'notifications'
  })
  const [filterType, setFilterType]   = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingProduct, setEditingProduct] = useState(null)
  const [deleteProductConfirm, setDeleteProductConfirm] = useState(null)
  const [barcodeInfoModal, setBarcodeInfoModal] = useState(null) // { barcode, item, product }

  const { shops } = useShopStore()
  const [showTransferredModal, setShowTransferredModal] = useState(false)

  // Aksiyalar
  const PROMO_TYPES_MG = [
    { key: 'category', labelKey: 'mgmt_promo_type_category' },
    { key: 'product',  labelKey: 'mgmt_promo_type_product' },
    { key: 'qty',      labelKey: 'mgmt_promo_type_qty' },
  ]
  const emptyPromoForm = { name: '', type: 'category', targetId: '', discountPercent: 10, minQty: 1, startDate: '', endDate: '', shopId: 'all' }
  const [promos, setPromos] = useState([])
  const [showPromoModal, setShowPromoModal] = useState(false)
  const [editingPromo, setEditingPromo] = useState(null)
  const [promoForm, setPromoForm] = useState(emptyPromoForm)
  const [deletePromoTarget, setDeletePromoTarget] = useState(null)
  const [promoFormError, setPromoFormError] = useState('')
  const reloadPromos = () => getPromotions().then(setPromos)
  const openAddPromo = () => { setEditingPromo(null); setPromoForm(emptyPromoForm); setPromoFormError(''); setShowPromoModal(true) }
  const openEditPromo = (p) => {
    setEditingPromo(p)
    setPromoForm({ name: p.name, type: p.type, targetId: p.targetId || '', discountPercent: p.discountPercent, minQty: p.minQty || 1, startDate: p.startDate || '', endDate: p.endDate || '', shopId: p.shopId || 'all' })
    setPromoFormError('')
    setShowPromoModal(true)
  }
  const savePromo = async () => {
    if (!promoForm.name.trim()) { setPromoFormError(t('mgmt_promo_error_name')); return }
    const dp = Number(promoForm.discountPercent)
    if (!dp || dp < 1 || dp > 100) { setPromoFormError(t('mgmt_promo_error_discount')); return }
    if (promoForm.type === 'category' && !promoForm.targetId) { setPromoFormError(t('mgmt_promo_error_category')); return }
    if (promoForm.type === 'product' && !promoForm.targetId) { setPromoFormError(t('mgmt_promo_error_product')); return }
    setPromoFormError('')
    const entry = { ...promoForm, discountPercent: dp, minQty: Number(promoForm.minQty), endDate: promoForm.endDate || null }
    if (editingPromo) {
      await updatePromotion(editingPromo.id, entry)
    } else {
      await createPromotion(entry)
    }
    reloadPromos(); setShowPromoModal(false)
  }
  const togglePromoActive = async (p) => {
    await togglePromotion(p.id)
    reloadPromos()
  }
  const removePromo = async (p) => {
    await deletePromotion(p.id)
    setDeletePromoTarget(null); reloadPromos()
  }

  const {
    loyaltyMinAmount, loyaltyVisitsRequired, loyaltyDiscountPercent,
    discountSmallMax, discountMediumMax, updateSettings,
    usdRate, setUsdRate,
    sources, addSource, updateSource, toggleSource, removeSource,
    productCategories, addProductCategory, updateProductCategory, toggleProductCategory, removeProductCategory,
    productAttributeDefs, addProductAttributeDef, removeProductAttributeDef, addAttributeValue, removeAttributeValue,
    monthlyTargets, setMonthlyTarget,
    employeeTargets, setEmployeeTarget,
    employees, addEmployee, updateEmployee, removeEmployee, requestEmployeeDeletion,
    employeeEditLocked, addEmployeeEditHistory,
    silverVisits,
    installmentOrganizations, addInstallmentOrg, updateInstallmentOrg, toggleInstallmentOrg, removeInstallmentOrg,
    downloadEnabled, toggleDownloadEnabled,
    notificationSettings, toggleNotification,
    companyName, companyLogo, companyLogoOriginal, setCompanyName, setCompanyLogo, setCompanyLogoOriginal,
    priceListSettings, setPriceListSettings,
    sidebarLabels, hiddenPages, setSidebarLabel, toggleHiddenPage,
    aiApiKey, aiApiProvider, setAiApiKey, setAiApiProvider,
    roleAccessTrees, customRoles,
  } = useSettingsStore()
  const roleLabels = {
    admin:       t('mgmt_role_admin'),
    manager:     t('mgmt_role_manager'),
    seller:      t('role_seller'),
    storekeeper: t('role_storekeeper'),
    technician:  t('mgmt_role_technician'),
    ...Object.fromEntries((customRoles || []).map(r => [r.id, r.label])),
  }
  const [showAiKey, setShowAiKey] = useState(false)

  // Local state — saqlash bosilganda updateSettings chaqiriladi
  const [loyaltyForm, setLoyaltyForm] = useState({
    loyaltyMinAmount, loyaltyVisitsRequired, loyaltyDiscountPercent, silverVisits
  })
  const [discountForm, setDiscountForm] = useState({
    discountSmallMax, discountMediumMax
  })
  const [saved, setSaved] = useState(false)

  // TAB 2: Products
  const [apiProducts, setApiProducts] = useState([])
  const [batches, setBatches] = useState([])
  const [items, setItems] = useState([])
  const [MOCK_SALES, setMockSales] = useState([])
  const [MOCK_CUSTOMERS, setMockCustomers] = useState([])
  const MOCK_BATCHES = batches
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [barcodePage, setBarcodePage] = useState(1)
  const [productsPage, setProductsPage] = useState(1)
  const ITEMS_PER_PAGE = 10
  const [barcodeLoading, setBarcodeLoading] = useState(true)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [newCategory, setNewCategory] = useState({ label: '', turnoverDays: 30 })
  const [editingCategory, setEditingCategory] = useState(null)

  // TAB 3: Employees
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [showEmpForm, setShowEmpForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [empDeleteTarget, setEmpDeleteTarget] = useState(null)
  const [empModalTab, setEmpModalTab] = useState('general')
  const [empForm, setEmpForm] = useState({
    name: '', phone: '', role: 'seller', hiredAt: '', salary: 0, username: '', password: '', shopId: ''
  })
  const [hiredAtDisplay, setHiredAtDisplay] = useState('')
  const [showEmpPassword, setShowEmpPassword] = useState(false)
  const [showEmpPassValue, setShowEmpPassValue] = useState(false)
  const [empPasswordForm, setEmpPasswordForm] = useState({ newPass: '', confirmPass: '' })
  const [empPasswordSaved, setEmpPasswordSaved] = useState(false)
  const [statsMonth, setStatsMonth] = useState('all')
  const closeEmpModal = () => {
    setSelectedEmployee(null)
    setEmpPasswordForm({ newPass: '', confirmPass: '' })
    setShowEmpPassword(false)
    setShowEmpPassValue(false)
    setEmpPasswordSaved(false)
    setStatsMonth('all')
  }

  // TAB 4: Loyalty Levels Edit
  const [editingSilverVisits, setEditingSilverVisits] = useState(false)
  const [editingGoldVisits, setEditingGoldVisits] = useState(false)

  // TAB 6: Settings
  const [usdForm, setUsdForm] = useState(usdRate)
  const [usdSaved, setUsdSaved] = useState(false)
  const [companyNameForm, setCompanyNameForm] = useState(companyName)
  const [companySaved, setCompanySaved] = useState(false)

  const [monthlyTargetMonth, setMonthlyTargetMonth] = useState(() => {
    const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`
  })
  const [monthlyTargetAmount, setMonthlyTargetAmount] = useState('')
  const [monthlyTargetSaved, setMonthlyTargetSaved] = useState(false)

  const [empTargetId, setEmpTargetId] = useState('')
  const [empTargetMonth, setEmpTargetMonth] = useState(() => {
    const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`
  })
  const [empTargetAmount, setEmpTargetAmount] = useState('')
  const [empTargetSaved, setEmpTargetSaved] = useState(false)

  const [showSourceModal, setShowSourceModal] = useState(false)
  const [newSourceLabel, setNewSourceLabel] = useState('')
  const [editingSourceId, setEditingSourceId] = useState(null)
  const [editingSourceValue, setEditingSourceValue] = useState('')

  const [showOrgModal, setShowOrgModal] = useState(false)
  const [editingOrg, setEditingOrg] = useState(null)
  const [deleteOrgConfirm, setDeleteOrgConfirm] = useState(null)
  const [deleteSourceConfirm, setDeleteSourceConfirm] = useState(null)
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState(null)
  const [orgForm, setOrgForm] = useState({
    name: '',
    commissionPercent: 0,
    paymentSchedule: 'weekly_2x',
    maxTermMonths: 12,
    availableTerms: [],
    startDate: ''
  })

  const ALL_TERM_OPTIONS = [
    { value: 0.25, label: `1 ${t('mgmt_term_week')}` },
    { value: 0.5,  label: `2 ${t('mgmt_term_week')}` },
    { value: 1,    label: `1 ${t('mgmt_term_month')}` },
    { value: 3,    label: `3 ${t('mgmt_term_month')}` },
    { value: 6,    label: `6 ${t('mgmt_term_month')}` },
    { value: 12,   label: `12 ${t('mgmt_term_month')}` },
    { value: 24,   label: `24 ${t('mgmt_term_month')}` },
  ]

  // Load and refresh barcode/batch details
  useEffect(() => {
    // URL hash bo'lsa o'sha elementga scroll
    const hash = window.location.hash
    if (hash) {
      setTimeout(() => {
        const el = document.querySelector(hash)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
    }
  }, [activeTab])

  useEffect(() => {
    getProducts().then(setApiProducts).catch(() => {})
    getSales().then(setMockSales)
    getCustomers().then(setMockCustomers)
    getPromotions().then(setPromos)
    Promise.all([getIncomeBatches(), getItems()]).then(([b, i]) => {
      setBatches(b)
      setItems(i)
      if (b.length > 0) setSelectedBatchId(b[0].id)
      setBarcodeLoading(false)
    }).catch(() => {
      setBarcodeLoading(false)
    })
  }, [activeTab])

  const filteredBarcodeItems = items.filter(i => i.batchId === selectedBatchId)
  const totalBarcodePages = Math.ceil(filteredBarcodeItems.length / ITEMS_PER_PAGE)
  const pagedBarcodeItems = filteredBarcodeItems.slice(
    (barcodePage - 1) * ITEMS_PER_PAGE,
    barcodePage * ITEMS_PER_PAGE
  )

  const [sortField, setSortField] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [productsTick, setProductsTick] = useState(0)
  const [productSearch, setProductSearch] = useState('')
  const [productCatFilter, setProductCatFilter] = useState('all')

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const refreshProducts = () => getProducts().then(setApiProducts).catch(() => {})

  const sortedProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim()
    let list = [...apiProducts]
    if (q) {
      list = list.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q) ||
        (p.size || '').toLowerCase().includes(q) ||
        (p.country || '').toLowerCase().includes(q)
      )
    }
    if (productCatFilter !== 'all') {
      list = list.filter(p => p.category === productCatFilter)
    }
    if (!sortField) return list
    return list.sort((a, b) => {
      const av = (a[sortField] ?? '').toString().toLowerCase()
      const bv = (b[sortField] ?? '').toString().toLowerCase()
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }, [sortField, sortDir, apiProducts, productSearch, productCatFilter])

  const pagedProducts = sortedProducts.slice(
    (productsPage - 1) * ITEMS_PER_PAGE,
    productsPage * ITEMS_PER_PAGE
  )
  const totalProductPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE)

  // Sync settings usdRate
  useEffect(() => {
    setUsdForm(usdRate)
  }, [usdRate])

  // Initialize targets month selectors
  useEffect(() => {
    const now = new Date()
    const yyyymm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    setMonthlyTargetMonth(yyyymm)
    setEmpTargetMonth(yyyymm)
  }, [])

  // Set default employee select target
  useEffect(() => {
    const activeEmps = employees.filter(e => e.isActive)
    if (activeEmps.length > 0 && !empTargetId) {
      setEmpTargetId(activeEmps[0].id)
    }
  }, [employees, empTargetId])

  const handleSave = () => {
    updateSettings({ ...loyaltyForm, ...discountForm })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleAllowReprint = async () => {
    const itemsToUpdate = items.filter(i =>
      i.batchId === selectedBatchId &&
      (i.barcodeStatus === 'printed' || i.barcodeStatus === 'downloaded') &&
      i.status !== 'sold' && i.status !== 'returned'
    )
    if (itemsToUpdate.length === 0) return
    const ids = itemsToUpdate.map(i => i.id)
    await updateBarcodeStatus(ids, { reprintAllowed: true })
    const i = await getItems()
    setItems(i)
    if (notificationSettings?.REPRINT_ALLOWED !== false) {
      addNotification({
        type: 'REPRINT_ALLOWED',
        severity: 'warning',
        title: 'Barkod qayta chop/yuklash ruxsati berildi',
        message: `${itemsToUpdate.length} ta tovar uchun barkod qayta chop va yuklash ruxsati berildi`,
        titleKey: 'notif_title_reprint_allowed',
        messageKey: 'notif_msg_reprint_allowed',
        messageParams: { count: itemsToUpdate.length },
        sellerId: user?.id,
        sellerName: user?.name,
        count: itemsToUpdate.length,
      })
    }
  }

  // Monthly date generator: last 6 + next 3
  const getMonthOptions = () => {
    const options = []
    const now = new Date()
    for (let i = -6; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const key = `${yyyy}-${mm}`
      const label = `${MONTHS[d.getMonth()]} ${yyyy}`
      options.push({ key, label })
    }
    return options
  }

  const flattenedEmployeeTargets = []
  Object.entries(employeeTargets).forEach(([empId, monthsObj]) => {
    const emp = employees.find(e => e.id === empId)
    if (!emp) return
    Object.entries(monthsObj).forEach(([month, amount]) => {
      flattenedEmployeeTargets.push({
        empId,
        empName: emp.name,
        month,
        amount
      })
    })
  })
  flattenedEmployeeTargets.sort((a, b) => b.month.localeCompare(a.month))

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  if (!isPrivileged(user?.role)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-text-muted">{t('mgmt_no_access')}</p>
      </div>
    )
  }

  const unreadCount = getUnreadCount()

  // Filtered notifications
  const filteredNotifications = notifications.filter(n => {
    if (filterType !== 'all' && n.type !== filterType) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return n.productName?.toLowerCase().includes(q) ||
             n.sellerName?.toLowerCase().includes(q) ||
             n.barcode?.toLowerCase().includes(q)
    }
    return true
  })


  // ── ctx ───────────────────────────────────────────────────────────────────
  const ctx = {
    // auth & stores
    user, notifications, notificationSettings,
    markRead, markAllRead, removeNotification, removeAllNotifications, updateNotification, getUnreadCount,
    employees, addEmployee, updateEmployee, removeEmployee, requestEmployeeDeletion,
    employeeEditLocked, addEmployeeEditHistory,
    productCategories, addProductCategory, updateProductCategory, toggleProductCategory, removeProductCategory,
    productAttributeDefs, addProductAttributeDef, removeProductAttributeDef, addAttributeValue, removeAttributeValue,
    sources, addSource, updateSource, toggleSource, removeSource,
    installmentOrganizations, addInstallmentOrg, updateInstallmentOrg, toggleInstallmentOrg, removeInstallmentOrg,
    monthlyTargets, setMonthlyTarget, employeeTargets, setEmployeeTarget,
    toggleNotification,
    loyaltyVisitsRequired, loyaltyDiscountPercent, silverVisits,
    discountSmallMax, discountMediumMax,
    companyName, companyLogo, companyLogoOriginal, setCompanyName, setCompanyLogo, setCompanyLogoOriginal,
    priceListSettings, setPriceListSettings,
    sidebarLabels, hiddenPages, setSidebarLabel, toggleHiddenPage,
    aiApiKey, aiApiProvider, setAiApiKey, setAiApiProvider,
    roleAccessTrees, customRoles,
    downloadEnabled, toggleDownloadEnabled,
    shops, bump,
    // products API
    apiProducts, setApiProducts, refreshProducts,
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
    deleteSourceConfirm, setDeleteSourceConfirm,
    deleteCategoryConfirm, setDeleteCategoryConfirm,
    showAiKey, setShowAiKey,
    sortedProducts, pagedProducts, totalProductPages, sortField, sortDir, handleSort,
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
    MOCK_SALES, MOCK_CUSTOMERS, MOCK_BATCHES,
    MOCK_PRODUCTS: apiProducts,
    MOCK_ITEMS: items,
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-syne font-extrabold tracking-tight">{t('mgmt_title')}</h1>
          <p className="text-text-secondary">{t('mgmt_subtitle')}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('mgmt_stat_unread'),      value: unreadCount, color: 'accent-red',    icon: Bell },
          { label: t('mgmt_stat_total_notif'), value: notifications.length, color: 'accent-blue', icon: BarChart2 },
          { label: t('mgmt_stat_employees'),   value: employees.filter(e => e.isActive).length, color: 'accent-orange', icon: User },
          { label: t('mgmt_tab_products'),    value: apiProducts.filter(p => p.totalStock > 0).length, color: 'accent-green', icon: Package },
        ].map((s, i) => (
          <div key={i} className="bg-bg-secondary border border-border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 min-w-0">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-${s.color}/10 text-${s.color} rounded-2xl flex items-center justify-center flex-shrink-0`}>
              <s.icon size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-extrabold font-syne text-text-primary">{s.value}</p>
              <p className="text-xs text-text-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-bg-secondary border border-border rounded-2xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id ? 'bg-accent-red text-white shadow-glow-red' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <tab.icon size={16} />
            {t(tab.labelKey)}
            {tab.id === 'notifications' && unreadCount > 0 && (
              <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {activeTab === 'notifications' && <NotificationsTab ctx={ctx} />}
        {activeTab === 'products'      && <ProductsTab ctx={ctx} />}
        {activeTab === 'employees'     && <EmployeesTab ctx={ctx} />}
        {activeTab === 'discounts'     && <DiscountsTab ctx={ctx} />}
        {activeTab === 'bundles'       && <BundlesTab ctx={ctx} />}
        {activeTab === 'settings'      && <SettingsTab ctx={ctx} />}
      </AnimatePresence>
      {/* Categories form modals & Employee detail / edit modals */}
      <AnimatePresence>
        {showCategoryForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCategoryForm(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-bg-secondary border border-border rounded-2xl w-full max-w-sm shadow-2xl z-10"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-syne font-bold text-text-primary text-base">{t('mgmt_add_category')}</h3>
                <button onClick={() => setShowCategoryForm(false)} className="p-1 hover:bg-bg-tertiary rounded-lg">
                  <X size={16} className="text-text-secondary" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">{t('mgmt_cat_name_label')} *</label>
                  <input
                    type="text"
                    value={newCategory.label}
                    onChange={e => setNewCategory({ ...newCategory, label: e.target.value })}
                    placeholder={t('mgmt_cat_name_ph')}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-text-primary text-xs focus:outline-none focus:border-accent-red font-semibold"
                  />
                </div>
                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">{t('mgmt_cat_turnover_label')} *</label>
                  <input
                    type="number"
                    value={newCategory.turnoverDays}
                    onChange={e => setNewCategory({ ...newCategory, turnoverDays: Number(e.target.value) })}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-text-primary text-xs focus:outline-none focus:border-accent-red font-semibold"
                  />
                </div>
              </div>
              <div className="flex gap-2 p-4 border-t border-border">
                <button onClick={() => setShowCategoryForm(false)}
                  className="flex-1 py-2 rounded-xl border border-border text-text-secondary hover:bg-bg-tertiary transition-colors text-xs font-semibold">
                  {t('mgmt_btn_cancel')}
                </button>
                <button
                  onClick={() => {
                    if (!newCategory.label.trim()) return
                    addProductCategory({
                      id: newCategory.label.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(),
                      label: newCategory.label,
                      turnoverDays: newCategory.turnoverDays
                    })
                    setShowCategoryForm(false)
                  }}
                  className="flex-1 py-2 rounded-xl bg-accent-red text-white font-bold text-xs hover:opacity-90 transition-opacity shadow-glow-red"
                >
                  {t('save')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Employee Detail Modal */}
      <AnimatePresence>
        {selectedEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => closeEmpModal()} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-bg-secondary border border-border rounded-2xl w-full max-w-3xl h-[88vh] shadow-2xl z-10 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div>
                  <h3 className="font-syne font-bold text-lg text-text-primary">{selectedEmployee.name}</h3>
                  <p className="text-xs text-text-muted">{roleLabels[selectedEmployee.role] || selectedEmployee.role}</p>
                </div>
                <button onClick={() => closeEmpModal()} className="p-1.5 hover:bg-bg-tertiary rounded-lg transition-colors">
                  <X size={18} className="text-text-secondary" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border px-5 py-2 gap-4 bg-bg-tertiary/20">
                <button
                  onClick={() => setEmpModalTab('general')}
                  className={`pb-2 text-sm font-bold border-b-2 transition-all ${
                    empModalTab === 'general' ? 'border-accent-red text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {t('emp_tab_general')}
                </button>
                <button
                  onClick={() => setEmpModalTab('stats')}
                  className={`pb-2 text-sm font-bold border-b-2 transition-all ${
                    empModalTab === 'stats' ? 'border-accent-red text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {t('emp_tab_stats')}
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {empModalTab === 'general' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-bg-secondary p-5 border border-border rounded-2xl">
                      <div className="space-y-3">
                        <p className="text-xs text-text-muted uppercase font-semibold">{t('emp_section_info')}</p>
                        <div>
                          <span className="text-xs text-text-secondary block">{t('emp_full_name')}</span>
                          <span className="text-sm font-bold text-text-primary">{selectedEmployee.name}</span>
                        </div>
                        <div>
                          <span className="text-xs text-text-secondary block">{t('emp_phone')}</span>
                          <span className="text-sm font-bold font-mono text-text-primary">{selectedEmployee.phone}</span>
                        </div>
                        <div>
                          <span className="text-xs text-text-secondary block">{t('emp_role')}</span>
                          <span className="text-sm font-bold text-text-primary">{roleLabels[selectedEmployee.role] || selectedEmployee.role}</span>
                        </div>
                        <div>
                          <span className="text-xs text-text-secondary block">Username</span>
                          <span className="text-sm font-bold font-mono text-text-primary">{selectedEmployee.username}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-xs text-text-muted uppercase font-semibold">{t('emp_section_work')}</p>
                        <div>
                          <span className="text-xs text-text-secondary block">{t('emp_hired_date')}</span>
                          <span className="text-sm font-bold text-text-primary">
                            {selectedEmployee.hiredAt
                              ? formatDate(selectedEmployee.hiredAt)
                              : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-text-secondary block">{t('emp_monthly_salary')}</span>
                          <span className="text-sm font-bold text-text-primary">{selectedEmployee.salary?.toLocaleString('uz-UZ')} {som}</span>
                        </div>
                        <div>
                          <span className="text-xs text-text-secondary block">{t('col_status')}</span>
                          <span className={`text-sm font-bold ${selectedEmployee.isBlocked ? 'text-accent-red' : 'text-accent-green'}`}>
                            {selectedEmployee.isBlocked ? t('emp_status_blocked') : t('mgmt_status_active')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ruxsatlar */}
                    {(() => {
                      const _permColorMap = {
                        warehouse: 'bg-accent-blue/10 text-accent-blue',
                        sales:     'bg-accent-green/10 text-accent-green',
                        income:    'bg-accent-orange/10 text-accent-orange',
                        expenses:  'bg-purple-500/10 text-purple-500',
                        reports:   'bg-accent-blue/10 text-accent-blue',
                        ai_agent:  'bg-pink-500/10 text-pink-500',
                        management:'bg-accent-red/10 text-accent-red',
                        customers: 'bg-accent-green/10 text-accent-green',
                        dashboard: 'bg-bg-tertiary text-text-secondary',
                      }
                      const _buildPermMap = (nodes) => nodes.reduce((acc, n) => {
                        const c = _permColorMap[n.id.split('.')[0]] || 'bg-bg-tertiary text-text-secondary'
                        acc[n.id] = { label: t('perm_' + n.id.replace(/\./g, '_'), { defaultValue: n.label }), color: c }
                        if (n.children) Object.assign(acc, _buildPermMap(n.children))
                        return acc
                      }, {})
                      const permLabels = {
                        all: { label: t('perm_all'), color: 'bg-accent-red/10 text-accent-red' },
                        ..._buildPermMap(PERMISSION_TREE),
                      }
                      const perms = selectedEmployee.role === 'admin'
                        ? ['all']
                        : (roleAccessTrees[selectedEmployee.role] || []).filter(p => !p.includes('.'))
                      return (
                        <div className="bg-bg-secondary p-5 border border-border rounded-2xl">
                          <p className="text-xs text-text-muted uppercase font-semibold mb-3">{t('emp_section_perms')}</p>
                          <div className="flex flex-wrap gap-2">
                            {perms.map(p => {
                              const pl = permLabels[p] || { label: p, color: 'bg-bg-tertiary text-text-secondary' }
                              return (
                                <span key={p} className={`px-3 py-1 rounded-full text-xs font-bold ${pl.color}`}>{pl.label}</span>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })()}

                    {/* Admin uchun: login/parolni ko'rish */}
                    {user?.role === 'admin' && (
                      <div className="bg-bg-secondary p-5 border border-accent-orange/20 rounded-2xl">
                        <p className="text-xs text-text-muted uppercase font-semibold mb-3 flex items-center gap-2">
                          <KeyRound size={12} /> {t('emp_login_info')}
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-text-secondary">Username</span>
                            <span className="text-sm font-bold font-mono text-text-primary">{selectedEmployee.username || '—'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-text-secondary">{t('password')}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold font-mono text-text-primary">
                                {showEmpPassValue ? (selectedEmployee.password || '—') : '••••••••'}
                              </span>
                              <button
                                onClick={() => setShowEmpPassValue(v => !v)}
                                className="p-1 text-text-muted hover:text-text-primary transition-colors"
                              >
                                {showEmpPassValue ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Xodim o'z parolini o'zgartirishi */}
                    {String(user?.id) === String(selectedEmployee.id) && (
                      <div className="bg-bg-secondary p-5 border border-border rounded-2xl">
                        <button
                          onClick={() => setShowEmpPassword(v => !v)}
                          className="flex items-center gap-2 text-xs font-bold text-accent-blue hover:opacity-80 transition-opacity mb-3"
                        >
                          <KeyRound size={12} />
                          {showEmpPassword ? t('close') : t('emp_change_pass')}
                        </button>
                        {showEmpPassword && (
                          <div className="space-y-3">
                            <input
                              type="password"
                              placeholder={t('emp_new_pass_ph')}
                              value={empPasswordForm.newPass}
                              onChange={e => setEmpPasswordForm(f => ({ ...f, newPass: e.target.value }))}
                              className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-red"
                            />
                            <input
                              type="password"
                              placeholder={t('emp_confirm_pass_ph')}
                              value={empPasswordForm.confirmPass}
                              onChange={e => setEmpPasswordForm(f => ({ ...f, confirmPass: e.target.value }))}
                              className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-red"
                            />
                            {empPasswordForm.newPass && empPasswordForm.newPass !== empPasswordForm.confirmPass && (
                              <p className="text-xs text-accent-red">{t('emp_pass_mismatch')}</p>
                            )}
                            <button
                              disabled={!empPasswordForm.newPass || empPasswordForm.newPass !== empPasswordForm.confirmPass}
                              onClick={() => {
                                updateEmployee(selectedEmployee.id, { password: empPasswordForm.newPass })
                                setEmpPasswordSaved(true)
                                setEmpPasswordForm({ newPass: '', confirmPass: '' })
                                setShowEmpPassword(false)
                                setTimeout(() => setEmpPasswordSaved(false), 2500)
                              }}
                              className="w-full py-2 bg-accent-red text-white rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-40 transition-all"
                            >
                              {t('save')}
                            </button>
                            {empPasswordSaved && (
                              <p className="text-xs text-accent-green text-center">{t('emp_pass_saved')}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Oylik filter */}
                    <div className="col-span-2 flex items-center gap-2">
                      <span className="text-xs text-text-muted font-semibold">{t('exp_month_label')}</span>
                      <select
                        value={statsMonth}
                        onChange={e => setStatsMonth(e.target.value)}
                        className="bg-bg-tertiary border border-border rounded-xl px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-red cursor-pointer"
                      >
                        <option value="all">{t('emp_all_time')}</option>
                        {Array.from(new Set(
                          MOCK_SALES
                            .filter(s => selectedEmployee.name && s.soldByName ? s.soldByName.trim().toLowerCase() === selectedEmployee.name.trim().toLowerCase() : String(s.soldBy) === String(selectedEmployee.id))
                            .map(s => (s.soldAt || '').slice(0, 7))
                            .filter(Boolean)
                        )).sort((a,b) => b.localeCompare(a)).map(m => (
                          <option key={m} value={m}>{MONTHS[parseInt(m.slice(5))-1]} {m.slice(0,4)}</option>
                        ))}
                      </select>
                    </div>

                    {(() => {
                      const matchEmpSale = (s) => selectedEmployee.name && s.soldByName ? s.soldByName.trim().toLowerCase() === selectedEmployee.name.trim().toLowerCase() : String(s.soldBy) === String(selectedEmployee.id)
                      const allEmpSales = MOCK_SALES.filter(s => matchEmpSale(s))
                      const filtered = statsMonth === 'all'
                        ? allEmpSales
                        : allEmpSales.filter(s => (s.soldAt || '').startsWith(statsMonth))

                      const empSales      = filtered.filter(s => s.status !== 'cancelled')
                      const cancelledSales = filtered.filter(s => s.status === 'cancelled')
                      const totalRevenue  = empSales.reduce((sum, s) => sum + (s.total || 0), 0)
                      const totalProfit   = empSales.reduce((sum, s) => sum + getSaleProfit(s), 0)
                      const discountedSales = empSales.filter(s => (s.discount || 0) > 0)
                      const discountLost  = empSales.reduce((sum, s) => sum + ((s.subtotal || s.total || 0) - (s.total || 0)), 0)
                      const cancelledLost = cancelledSales.reduce((sum, s) => sum + (s.total || 0), 0)
                      const newCustomers  = empSales.filter(s => s.isNewCustomer).length
                      const returningCustomers = empSales.filter(s => !s.isNewCustomer && s.customerId).length
                      const installmentSales = empSales.filter(s => s.paymentType === 'installment')
                      const installmentTotal = installmentSales.reduce((sum, s) => sum + (s.total || 0), 0)
                      const batchDays = MOCK_BATCHES
                        .filter(b => String(b.receivedBy) === String(selectedEmployee.id))
                        .filter(b => statsMonth === 'all' || (b.receivedAt || '').startsWith(statsMonth))
                        .map(b => (b.receivedAt || '').slice(0, 10))
                      const workedDays = new Set([
                        ...filtered.filter(s => s.soldAt).map(s => s.soldAt.slice(0, 10)),
                        ...batchDays.filter(Boolean)
                      ]).size
                      const daysInMonth = statsMonth !== 'all'
                        ? new Date(parseInt(statsMonth.slice(0,4)), parseInt(statsMonth.slice(5)), 0).getDate()
                        : null

                      const sorted = [...empSales].sort((a,b) => new Date(b.soldAt||0) - new Date(a.soldAt||0))
                      const lastSale = sorted[0] || null

                      // Boshqa sotuvchiga o'tgan (barcha vaqt uchun, filter qilinmaydi)
                      const allEmpCompleted = MOCK_SALES.filter(s => matchEmpSale(s) && s.status !== 'cancelled')
                      const empCustomerIds = new Set(allEmpCompleted.filter(s => s.customerId).map(s => s.customerId))
                      const transferred = [...empCustomerIds].filter(cId => {
                        return MOCK_SALES.some(s =>
                          s.customerId === cId &&
                          !matchEmpSale(s) &&
                          s.status !== 'cancelled'
                        )
                      })

                      return (
                        <>
                          <div className="bg-bg-tertiary rounded-xl p-4">
                            <p className="text-text-muted text-xs mb-1">{t('emp_stat_sales_count')}</p>
                            <p className="font-syne font-bold text-text-primary text-xl">{t('mgmt_pcs_unit', { n: empSales.length })}</p>
                            <p className="text-text-muted text-xs mt-1">{t('emp_stat_sales_done')}</p>
                          </div>

                          <div className="bg-bg-tertiary rounded-xl p-4">
                            <p className="text-text-muted text-xs mb-1">{t('emp_stat_worked_days')}</p>
                            <p className="font-syne font-bold text-accent-blue text-xl">{t('mgmt_days_unit', { n: workedDays })}</p>
                            <p className="text-text-muted text-xs mt-1">
                              {daysInMonth ? t('emp_stat_of_days', { n: daysInMonth }) : t('emp_stat_days_note')}
                            </p>
                          </div>

                          <div className="bg-bg-tertiary rounded-xl p-4">
                            <p className="text-text-muted text-xs mb-1">{t('emp_stat_batches')}</p>
                            <p className="font-syne font-bold text-accent-purple text-xl">{t('mgmt_pcs_unit', { n: batchDays.length })}</p>
                            <p className="text-text-muted text-xs mt-1">{t('emp_stat_received')}</p>
                          </div>

                          <div className="bg-bg-tertiary rounded-xl p-4">
                            <p className="text-text-muted text-xs mb-1">{t('emp_stat_revenue')}</p>
                            <p className="font-syne font-bold text-accent-blue text-xl">{totalRevenue.toLocaleString('uz-UZ')}</p>
                            <p className="text-text-muted text-xs mt-1">{som} {t('emp_stat_total_income')}</p>
                          </div>

                          <div className="bg-bg-tertiary rounded-xl p-4">
                            <p className="text-text-muted text-xs mb-1">{t('col_net_profit')}</p>
                            <p className="font-syne font-bold text-accent-green text-xl">{totalProfit.toLocaleString('uz-UZ')}</p>
                            <p className="text-text-muted text-xs mt-1">{som}</p>
                          </div>

                          <div className="bg-bg-tertiary rounded-xl p-4">
                            <p className="text-text-muted text-xs mb-1">{t('emp_stat_cancelled')}</p>
                            <p className="font-syne font-bold text-accent-red text-xl">{t('mgmt_pcs_unit', { n: cancelledSales.length })}</p>
                            <p className="text-text-muted text-xs mt-1">{t('emp_stat_lost')} {cancelledLost.toLocaleString('uz-UZ')} {som}</p>
                          </div>

                          <div className="bg-bg-tertiary rounded-xl p-4">
                            <p className="text-text-muted text-xs mb-1">{t('emp_stat_installment')}</p>
                            <p className="font-syne font-bold text-accent-blue text-xl">{t('mgmt_pcs_unit', { n: installmentSales.length })}</p>
                            <p className="text-text-muted text-xs mt-1">{installmentTotal.toLocaleString('uz-UZ')} {som}</p>
                          </div>

                          <div className="bg-bg-tertiary rounded-xl p-4">
                            <p className="text-text-muted text-xs mb-1">{t('emp_stat_discounted')}</p>
                            <p className="font-syne font-bold text-accent-orange text-xl">{t('mgmt_pcs_unit', { n: discountedSales.length })}</p>
                            <p className="text-text-muted text-xs mt-1">{t('emp_stat_lost')} {discountLost.toLocaleString('uz-UZ')} {som}</p>
                          </div>

                          <div className="bg-bg-tertiary rounded-xl p-4">
                            <p className="text-text-muted text-xs mb-1">{t('emp_stat_new_cust')}</p>
                            <p className="font-syne font-bold text-accent-blue text-xl">{t('mgmt_pcs_unit', { n: newCustomers })}</p>
                            <p className="text-text-muted text-xs mt-1">{t('emp_stat_first_time')}</p>
                          </div>

                          <div className="bg-bg-tertiary rounded-xl p-4">
                            <p className="text-text-muted text-xs mb-1">{t('emp_stat_returning')}</p>
                            <p className="font-syne font-bold text-accent-green text-xl">{t('mgmt_pcs_unit', { n: returningCustomers })}</p>
                            <p className="text-text-muted text-xs mt-1">{t('emp_stat_came_back')}</p>
                          </div>

                          <div
                            className="bg-bg-tertiary rounded-xl p-4 cursor-pointer hover:border hover:border-accent-orange/40 transition-all"
                            onClick={() => setShowTransferredModal(true)}
                          >
                            <p className="text-text-muted text-xs mb-1">{t('emp_stat_transferred')}</p>
                            <p className="font-syne font-bold text-accent-red text-xl">{t('mgmt_pcs_unit', { n: transferred.length })}</p>
                            <p className="text-xs text-accent-blue mt-1">{t('emp_stat_details')}</p>
                          </div>

                          <div className="bg-bg-tertiary rounded-xl p-4">
                            <p className="text-text-muted text-xs mb-1">{t('emp_stat_last_sale')}</p>
                            {lastSale ? (
                              <>
                                <p className="font-syne font-bold text-text-primary text-base">{formatDate(lastSale.soldAt)}</p>
                                <p className="text-text-muted text-xs mt-1">{lastSale.total?.toLocaleString('uz-UZ')} {som}</p>
                              </>
                            ) : (
                              <p className="font-syne font-bold text-text-muted text-xl">—</p>
                            )}
                          </div>
                        </>
                      )
                    })()}

                    {/* Kirim qilgan partiyalar ro'yxati */}
                    {(() => {
                      const empBatches = MOCK_BATCHES
                        .filter(b => String(b.receivedBy) === String(selectedEmployee.id))
                        .filter(b => statsMonth === 'all' || (b.receivedAt || '').startsWith(statsMonth))
                        .sort((a, b) => new Date(b.receivedAt || 0) - new Date(a.receivedAt || 0))
                      if (empBatches.length === 0) return null
                      return (
                        <div className="bg-bg-tertiary rounded-xl p-4 space-y-3">
                          <p className="text-sm font-bold text-text-primary flex items-center gap-2">
                            <Package size={15} className="text-accent-purple" />
                            {t('emp_batches_title')}
                          </p>
                          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                            {empBatches.map(b => {
                              const prod = apiProducts.find(p => p.id === b.productId)
                              const productName = prod ? `${prod.brand} ${prod.name}` : (b.productName || b.productId)
                              return (
                                <div key={b.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                  <div>
                                    <p className="text-sm text-text-primary font-medium">{productName}</p>
                                    <p className="text-xs text-text-muted">{formatDate(b.receivedAt)}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-bold text-text-primary">{b.quantityIn} {b.unit || 'dona'}</p>
                                    <p className="text-xs text-text-muted">{t('emp_batch_received')}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          {empBatches.length > 3 && (
                            <p className="text-xs text-text-muted text-right pt-1">
                              {t('emp_batches_summary', { batches: empBatches.length, items: empBatches.reduce((s, b) => s + (b.quantityIn || 0), 0) })}
                            </p>
                          )}
                        </div>
                      )
                    })()}

                    {/* Manfiy ko'rsatgichlar */}
                    {(() => {
                      const SELLER_VIOLATIONS    = ['BARCODE_NOT_PRINTED', 'BARCODE_REPRINTED', 'BARCODE_REDOWNLOADED', 'BARCODE_SOLD_RESCAN', 'SALE_NO_CUSTOMER', 'DEVICE_LOGIN_ATTEMPT']
                      const MANAGER_VIOLATIONS   = [...SELLER_VIOLATIONS, 'REPRINT_ALLOWED', 'DEVICE_APPROVED']

                      const applicableTypes = ['admin', 'manager'].includes(selectedEmployee.role)
                        ? MANAGER_VIOLATIONS
                        : SELLER_VIOLATIONS

                      const empNotifs = notifications.filter(n =>
                        selectedEmployee.name && n.sellerName
                          ? n.sellerName.trim().toLowerCase() === selectedEmployee.name.trim().toLowerCase()
                          : String(n.sellerId) === String(selectedEmployee.id)
                      )
                      const byType = {}
                      applicableTypes.forEach(type => {
                        byType[type] = empNotifs.filter(n => n.type === type).length
                      })
                      const total = Object.values(byType).reduce((a, b) => a + b, 0)

                      return (
                        <div className="bg-bg-tertiary border border-accent-orange/20 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <ShieldAlert size={16} className="text-accent-orange" />
                              <p className="text-sm font-bold text-text-primary">{t('emp_violations_title')}</p>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              total === 0
                                ? 'bg-accent-green/10 text-accent-green'
                                : total <= 3
                                ? 'bg-accent-orange/10 text-accent-orange'
                                : 'bg-accent-red/10 text-accent-red'
                            }`}>
                              {t('emp_violations_total', { n: total })}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {Object.entries(byType).map(([type, count]) => (
                              <div key={type} className="flex items-center justify-between">
                                <span className="text-xs text-text-secondary">{t(VIOLATION_FILTER_KEYS[type])}</span>
                                <span className={`text-xs font-bold ${count > 0 ? 'text-accent-red' : 'text-text-muted'}`}>
                                  {t('mgmt_pcs_unit', { n: count })}
                                </span>
                              </div>
                            ))}
                          </div>
                          {total === 0 && (
                            <p className="text-xs text-accent-green text-center py-1">{t('emp_no_violations')}</p>
                          )}
                        </div>
                      )
                    })()}

                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-border flex justify-end">
                <button
                  onClick={() => closeEmpModal()}
                  className="px-5 py-2 bg-bg-tertiary border border-border hover:bg-bg-tertiary/80 text-text-primary rounded-xl text-xs font-bold transition-colors"
                >
                  {t('close')}
                </button>
              </div>

              {/* Boshqa sotuvchiga o'tgan mijozlar modal */}
              <AnimatePresence>
                {showTransferredModal && (
                  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                      onClick={() => setShowTransferredModal(false)} />
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="relative bg-bg-secondary border border-border rounded-2xl w-full max-w-lg shadow-2xl z-10 p-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-syne font-bold text-text-primary">
                          {t('emp_transferred_title')}
                        </h3>
                        <button onClick={() => setShowTransferredModal(false)}>
                          <X size={18} className="text-text-secondary" />
                        </button>
                      </div>
                      {(() => {
                        const _matchEmp = (s) => selectedEmployee.name && s.soldByName ? s.soldByName.trim().toLowerCase() === selectedEmployee.name.trim().toLowerCase() : String(s.soldBy) === String(selectedEmployee.id)
                        const empSales = MOCK_SALES.filter(s => _matchEmp(s) && s.status !== 'cancelled')
                        const empCustomerIds = new Set(empSales.filter(s => s.customerId).map(s => s.customerId))
                        const transferredList = [...empCustomerIds].map(cId => {
                          const laterSales = MOCK_SALES.filter(s => s.customerId === cId && !_matchEmp(s) && s.status !== 'cancelled')
                          if (laterSales.length === 0) return null
                          const customer = MOCK_CUSTOMERS.find(c => c.id === cId)
                          const lastSeller = laterSales.sort((a,b) => new Date(b.soldAt||0) - new Date(a.soldAt||0))[0]
                          return { customer, lastSeller, count: laterSales.length }
                        }).filter(Boolean)

                        if (transferredList.length === 0) return (
                          <div className="py-10 text-center text-text-muted text-sm">{t('emp_transferred_empty')}</div>
                        )

                        return (
                          <div className="space-y-2 max-h-72 overflow-y-auto">
                            {transferredList.map(({ customer, lastSeller, count }) => (
                              <div key={customer?.id} className="flex items-center justify-between bg-bg-tertiary rounded-xl px-4 py-3">
                                <div>
                                  <p className="text-sm font-bold text-text-primary">{customer?.name || t('mgmt_unknown')}</p>
                                  <p className="text-xs text-text-muted">{customer?.phone || ''}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-text-secondary">{t('emp_transferred_to', { name: lastSeller.soldByName || '—' })}</p>
                                  <p className="text-xs text-accent-orange font-bold">{t('emp_purchase_count', { n: count })}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      })()}
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Yangi xodim qo'shish / tahrirlash modal */}
      <AnimatePresence>
        {showEmpForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEmpForm(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-bg-secondary border border-border rounded-2xl w-full max-w-lg shadow-2xl z-10"
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h3 className="font-syne font-bold text-lg text-text-primary">
                  {editingEmployee ? t('emp_edit_title') : t('emp_add_title')}
                </h3>
                <button onClick={() => setShowEmpForm(false)} className="p-1.5 hover:bg-bg-tertiary rounded-lg transition-colors">
                  <X size={18} className="text-text-secondary" />
                </button>
              </div>
              
              <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-text-secondary text-xs mb-1.5 block">{t('emp_form_name')} *</label>
                    <input
                      type="text"
                      value={empForm.name}
                      onChange={e => setEmpForm({ ...empForm, name: e.target.value })}
                      placeholder={t('emp_form_name_ph')}
                      className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:border-accent-red text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-text-secondary text-xs mb-1.5 block">{t('emp_form_phone')} *</label>
                    <input
                      type="text"
                      value={empForm.phone}
                      onChange={e => setEmpForm({ ...empForm, phone: e.target.value })}
                      placeholder="+998901234567"
                      className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:border-accent-red font-mono text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-text-secondary text-xs mb-1.5 block">{t('adm_field_role')} *</label>
                    <select
                      value={empForm.role}
                      onChange={e => setEmpForm({ ...empForm, role: e.target.value })}
                      className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:border-accent-red text-xs font-semibold"
                    >
                      {Object.entries(roleLabels)
                        .filter(([k]) => k !== 'admin' && getRolePriority(k) < getRolePriority(user?.role))
                        .map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-text-secondary text-xs mb-1.5 block">{t('emp_form_hired_date')}</label>
                    <input
                      type="text"
                      value={hiredAtDisplay}
                      onChange={e => {
                        const raw = e.target.value.replace(/\D/g,'').slice(0,8)
                        const d=raw.slice(0,2), m=raw.slice(2,4), y=raw.slice(4,8)
                        let display = d
                        if (raw.length >= 2) display += '.' + m
                        if (raw.length >= 4) display += '.' + y
                        setHiredAtDisplay(display)
                        if (raw.length === 8) setEmpForm(f=>({...f, hiredAt:`${y}-${m}-${d}`}))
                        else setEmpForm(f=>({...f, hiredAt:''}))
                      }}
                      placeholder="kk.oo.yyyy"
                      className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:border-accent-red text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">{t('mgmt_tab_shops')}</label>
                  <select
                    value={empForm.shopId || ''}
                    onChange={e => setEmpForm({ ...empForm, shopId: e.target.value })}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:border-accent-red text-xs font-semibold"
                  >
                    <option value="">{t('all_shops')}</option>
                    {shops.filter(s => s.isActive).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-text-secondary text-xs mb-1.5 block">{t('emp_form_salary')} ({som})</label>
                    <input
                      type="number"
                      value={empForm.salary}
                      onChange={e => setEmpForm({ ...empForm, salary: Number(e.target.value) })}
                      placeholder="3000000"
                      className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:border-accent-red text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-text-secondary text-xs mb-1.5 block">{t('emp_form_username')} *</label>
                    <input
                      type="text"
                      value={empForm.username}
                      onChange={e => setEmpForm({ ...empForm, username: e.target.value })}
                      placeholder="umidjon"
                      className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:border-accent-red text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">
                    {editingEmployee ? t('emp_form_password_opt') : `${t('password')} *`}
                  </label>
                  <input
                    type="password"
                    value={empForm.password}
                    onChange={e => setEmpForm({ ...empForm, password: e.target.value })}
                    placeholder={editingEmployee ? t('emp_form_pass_ph') : '••••••••'}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:border-accent-red text-xs font-semibold"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 p-5 border-t border-border">
                <button onClick={() => setShowEmpForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary hover:bg-bg-tertiary transition-colors text-sm font-medium">
                  {t('mgmt_btn_cancel')}
                </button>
                <button
                  onClick={() => {
                    if (!empForm.name.trim() || !empForm.phone.trim() || !empForm.username.trim()) return
                    if (!editingEmployee && !empForm.password) return

                    if (editingEmployee) {
                      const changes = {
                        name: empForm.name,
                        phone: empForm.phone,
                        role: empForm.role,
                        hiredAt: empForm.hiredAt,
                        salary: empForm.salary,
                        username: empForm.username,
                        shopId: empForm.shopId || null,
                        ...(empForm.password ? { password: empForm.password } : {})
                      }
                      if (user?.role !== 'admin') {
                        const before = {}
                        const after = {}
                        Object.keys(changes).forEach(key => {
                          if (editingEmployee[key] !== changes[key]) {
                            before[key] = editingEmployee[key]
                            after[key] = changes[key]
                          }
                        })
                        if (Object.keys(after).length > 0) {
                          addEmployeeEditHistory({
                            employeeId: editingEmployee.id,
                            employeeName: editingEmployee.name,
                            editedBy: user?.name,
                            editedByRole: user?.role,
                            timestamp: new Date().toISOString(),
                            before,
                            after,
                          })
                        }
                      }
                      updateEmployee(editingEmployee.id, { ...changes, lastEditedBy: user?.role })
                    } else {
                      addEmployee({
                        id: Date.now().toString(),
                        name: empForm.name,
                        phone: empForm.phone,
                        role: empForm.role,
                        hiredAt: empForm.hiredAt,
                        salary: empForm.salary,
                        username: empForm.username,
                        password: empForm.password,
                        shopId: empForm.shopId || null,
                        createdBy: user?.role,
                        lastEditedBy: user?.role,
                      })
                    }
                    setShowEmpForm(false)
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-accent-red text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-glow-red"
                >
                  {editingEmployee ? t('mgmt_btn_save') : t('emp_form_add_btn')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Employee Delete confirm */}
      <AnimatePresence>
        {empDeleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEmpDeleteTarget(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-bg-secondary border border-border rounded-2xl w-full max-w-sm shadow-2xl z-10 p-6"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-accent-red/10 flex items-center justify-center">
                  <Trash2 size={24} className="text-accent-red" />
                </div>
                <div>
                  <h3 className="font-syne font-bold text-lg text-text-primary">{t('emp_delete_title')}</h3>
                  <p className="text-text-secondary text-sm mt-1 font-semibold">{empDeleteTarget.name}</p>
                  <p className="text-text-secondary text-xs mt-1">
                    {user?.role === 'admin' ? t('emp_delete_admin_msg') : t('emp_delete_request_msg')}
                  </p>
                </div>
                <div className="flex gap-3 w-full">
                  <button onClick={() => setEmpDeleteTarget(null)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary hover:bg-bg-tertiary transition-colors text-sm font-medium">
                    {t('mgmt_btn_cancel')}
                  </button>
                  <button
                    onClick={() => {
                      if (user?.role === 'admin') removeEmployee(empDeleteTarget.id)
                      else requestEmployeeDeletion(empDeleteTarget.id)
                      setEmpDeleteTarget(null)
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-accent-red text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                  >
                    {t('mgmt_btn_delete')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manba qo'shish modali */}
      <AnimatePresence>
        {showSourceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSourceModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-bg-secondary border border-border rounded-2xl w-full max-w-sm shadow-2xl z-10"
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h3 className="font-syne font-bold text-lg text-text-primary">{t('mgmt_source_modal_title')}</h3>
                <button onClick={() => setShowSourceModal(false)} className="p-1.5 hover:bg-bg-tertiary rounded-lg transition-colors">
                  <X size={18} className="text-text-secondary" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-text-secondary text-sm mb-1.5 block">{t('mgmt_source_field_name')} *</label>
                  <input
                    type="text"
                    value={newSourceLabel}
                    onChange={e => setNewSourceLabel(e.target.value)}
                    placeholder={t('mgmt_source_field_ph')}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-red text-sm"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex gap-3 p-5 border-t border-border">
                <button onClick={() => setShowSourceModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary hover:bg-bg-tertiary transition-colors text-sm font-medium">
                  {t('mgmt_btn_cancel')}
                </button>
                <button
                  onClick={() => {
                    if (!newSourceLabel.trim()) return
                    addSource({ id: newSourceLabel.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(), label: newSourceLabel, isActive: true })
                    setShowSourceModal(false)
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-accent-red text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  {t('emp_form_add_btn')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Nasiya tashkilotlari modal */}
      <AnimatePresence>
        {showOrgModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowOrgModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-bg-secondary border border-border rounded-2xl w-full max-w-md shadow-2xl z-10"
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h3 className="font-syne font-bold text-lg text-text-primary">
                  {editingOrg ? t('mgmt_org_edit_title') : t('mgmt_org_add_title')}
                </h3>
                <button onClick={() => setShowOrgModal(false)} className="p-1.5 hover:bg-bg-tertiary rounded-lg transition-colors">
                  <X size={18} className="text-text-secondary" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">{t('mgmt_org_field_name')} *</label>
                  <input
                    type="text"
                    value={orgForm.name}
                    onChange={e => setOrgForm(f => ({ ...f, name: e.target.value }))}
                    placeholder={t('mgmt_org_name_ph')}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:border-accent-red text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">{t('mgmt_org_field_percent')}</label>
                  <input
                    type="number"
                    value={orgForm.commissionPercent}
                    onChange={e => setOrgForm(f => ({ ...f, commissionPercent: Number(e.target.value) }))}
                    placeholder="0"
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:border-accent-red text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">{t('mgmt_org_field_schedule')}</label>
                  <select
                    value={orgForm.paymentSchedule}
                    onChange={e => setOrgForm(f => ({ ...f, paymentSchedule: e.target.value }))}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:border-accent-red text-xs font-semibold"
                  >
                    <option value="weekly_2x">{t('mgmt_schedule_weekly2x')}</option>
                    <option value="biweekly">{t('mgmt_schedule_biweekly')}</option>
                    <option value="custom">{t('mgmt_schedule_custom')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">{t('mgmt_org_field_max_term')}</label>
                  <input
                    type="number"
                    value={orgForm.maxTermMonths}
                    onChange={e => setOrgForm(f => ({ ...f, maxTermMonths: Number(e.target.value) }))}
                    placeholder="12"
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:border-accent-red text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-text-secondary text-xs mb-2 block">{t('mgmt_org_field_terms')}</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_TERM_OPTIONS.map(opt => {
                      const selected = (orgForm.availableTerms || []).includes(opt.value)
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setOrgForm(f => ({
                            ...f,
                            availableTerms: selected
                              ? f.availableTerms.filter(v => v !== opt.value)
                              : [...(f.availableTerms || []), opt.value].sort((a, b) => a - b)
                          }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            selected
                              ? 'bg-accent-blue text-white border-accent-blue'
                              : 'bg-bg-tertiary border-border text-text-secondary hover:border-accent-blue'
                          }`}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                  {(orgForm.availableTerms || []).length === 0 && (
                    <p className="text-[10px] text-text-muted mt-1.5">{t('mgmt_org_terms_hint')}</p>
                  )}
                </div>
                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">{t('mgmt_org_field_start')}</label>
                  <DateMaskInput
                    value={orgForm.startDate}
                    onChange={e => setOrgForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:border-accent-red text-xs font-semibold"
                  />
                </div>
              </div>
              <div className="flex gap-3 p-5 border-t border-border">
                <button onClick={() => setShowOrgModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary hover:bg-bg-tertiary transition-colors text-sm font-medium">
                  {t('mgmt_btn_cancel')}
                </button>
                <button
                  onClick={() => {
                    if (!orgForm.name.trim()) return
                    if (editingOrg) {
                      updateInstallmentOrg(editingOrg.id, orgForm)
                    } else {
                      const newId = orgForm.name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now()
                      addInstallmentOrg({
                        id: newId,
                        ...orgForm
                      })
                    }
                    setShowOrgModal(false)
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-accent-red text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-glow-red"
                >
                  {editingOrg ? t('mgmt_btn_save') : t('emp_form_add_btn')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Partner Organization Deletion Modal */}
      <AnimatePresence>
        {deleteCategoryConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg-secondary border border-border p-6 rounded-3xl max-w-sm w-full space-y-6 shadow-2xl"
            >
              <div className="space-y-2">
                <h3 className="font-syne font-bold text-text-primary text-base">Kategoriya o'chirish</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  <span className="font-bold text-text-primary">"{deleteCategoryConfirm.label}"</span> kategoriyasini o'chirasizmi?
                  Ombordagi mavjud tovarlar va savdo tarixi saqlanib qoladi — faqat yangi kirimlarda bu kategoriya ko'rinmaydi.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDeleteCategoryConfirm(null)}
                  className="py-3 bg-bg-tertiary border border-border rounded-xl text-text-primary text-xs font-bold hover:bg-border transition-colors"
                >
                  Bekor
                </button>
                <button
                  onClick={() => { removeProductCategory(deleteCategoryConfirm.id); setDeleteCategoryConfirm(null) }}
                  className="py-3 bg-accent-red text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity shadow-glow-red"
                >
                  O'chirish
                </button>
              </div>
            </motion.div>
          </div>
        )}
                {deleteSourceConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg-secondary border border-border p-6 rounded-3xl max-w-sm w-full space-y-6 shadow-2xl"
            >
              <div className="space-y-2">
                <h3 className="font-syne font-bold text-text-primary text-base">Manba o'chirish</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  <span className="font-bold text-text-primary">"{deleteSourceConfirm.label}"</span> manbasini o'chirasizmi? Bu amal qaytarib bo'lmaydi.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDeleteSourceConfirm(null)}
                  className="py-3 bg-bg-tertiary border border-border rounded-xl text-text-primary text-xs font-bold hover:bg-border transition-colors"
                >
                  Bekor
                </button>
                <button
                  onClick={() => { removeSource(deleteSourceConfirm.id); setDeleteSourceConfirm(null) }}
                  className="py-3 bg-accent-red text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity shadow-glow-red"
                >
                  O'chirish
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {deleteOrgConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-bg-secondary border border-border p-6 rounded-3xl max-w-sm w-full space-y-6 shadow-2xl"
            >
              <div className="space-y-2">
                <h3 className="font-syne font-bold text-text-primary text-base">{t('mgmt_org_delete_title')}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {t('mgmt_org_delete_confirm', { name: deleteOrgConfirm.name })}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDeleteOrgConfirm(null)}
                  className="py-3 bg-bg-tertiary border border-border rounded-xl text-text-primary text-xs font-bold hover:bg-border transition-colors"
                >
                  {t('mgmt_btn_cancel')}
                </button>
                <button
                  onClick={() => {
                    removeInstallmentOrg(deleteOrgConfirm.id)
                    setDeleteOrgConfirm(null)
                  }}
                  className="py-3 bg-accent-red text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity shadow-glow-red"
                >
                  {t('mgmt_btn_delete')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default Management
