import { useState, useMemo, useEffect } from 'react'
import { getLoyaltySettings } from '../../api/settingsService'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, UserPlus, Eye, X, CreditCard,
  History, Calendar, TrendingUp, AlertCircle,
  CheckCircle, Star, Phone, DollarSign, Package,
  Check, Info, User, Pencil, Trash2, GitMerge, Link2, Recycle, ArrowDownToLine, ArrowUpFromLine,
  ChevronRight,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '../../store/settingsStore'
import { getCustomers, addCustomer, updateCustomer, deleteCustomer, mergeCustomers } from '../../api/customerService'
import { getUsedSales, getUsedStock } from '../../api/usedService'
import { getSales, makeInstallmentPayment } from '../../api/salesService'
import { getProducts } from '../../api/productService'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { useShopStore } from '../../store/shopStore'
import { ShopPickerModal } from '../../components/ShopPickerModal'
import ShopRequiredGuard from '../../components/ShopRequiredGuard'
import AddCustomerModal     from './components/AddCustomerModal'
import CustomerProfileModal from './components/CustomerProfileModal'
import EditCustomerModal    from './components/EditCustomerModal'
import DeleteModal          from './components/DeleteModal'
import MergeModal           from './components/MergeModal'
import DataTable from '../../components/ui/DataTable'
import { PageHeader, Badge } from '../../components/ui/Kit'
import { HeroStat, MiniStat, ChartCard, GradientBars } from '../../components/charts/Charts'
import { monthShort } from '../../utils/format'

const formatPriceRaw = (n) => n?.toLocaleString('uz-UZ')
const EMPTY_CUST = { name: '', phone: '+998', birthDate: '', instagram: '', carModel: '', gender: '', address: '', email: '', group: '', tags: [] }

// Sodiqlik dasturi darajalari ranglari (Boshqaruv → Chegirmalar dagi jamg'arma chegirma darajalari tartibida)
const TIER_COLORS = ['bg-orange-100 text-orange-700', 'bg-slate-100 text-slate-700', 'bg-yellow-100 text-yellow-700', 'bg-purple-100 text-purple-700']

const Customers = () => {
  const { t, i18n } = useTranslation()
  const formatPrice = (n) => formatPriceRaw(n) + ' ' + t('unit_som')
  const { user } = useAuthStore()
  const barcodeSelectClass = user?.role === 'admin' ? '' : 'select-none'
  const { loyaltyMinAmount, loyaltyVisitsRequired, loyaltyDiscountPercent, silverVisits, usdRate } = useSettingsStore()
  const [loyaltyCfg, setLoyaltyCfg] = useState(null)
  useEffect(() => { getLoyaltySettings().then(setLoyaltyCfg).catch(() => {}) }, [])
  const { bump, version } = useDataStore()
  const som = t('unit_som')
  const { selectedShopId } = useShopStore()
  const [shopPickCallback, setShopPickCallback] = useState(null)
  const requireShop = (cb) => {
    if (selectedShopId !== 'all') { cb(selectedShopId) }
    else { setShopPickCallback(() => cb) }
  }
  const [customers, setCustomers] = useState([])
  const [allSales, setAllSales] = useState([])
  const [MOCK_USED_SALES, setUsedSales] = useState([])
  const [MOCK_USED_STOCK, setUsedStock] = useState([])
  const [products, setProducts] = useState([])
  const [filterGroup, setFilterGroup] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [addError, setAddError] = useState('')
  const [newCust, setNewCust] = useState(EMPTY_CUST)
  const [modalTab, setModalTab] = useState('general')
  const [activeFilter, setActiveFilter] = useState(null)

  // Edit modal
  const [editCustomer, setEditCustomer] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', phone: '', birthDate: '', instagram: '', carModel: '', gender: '', address: '', email: '', group: '', tags: [] })
  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null)
  // Merge
  const [mergeModal, setMergeModal] = useState(null)
  /* mergeModal = {
    keep: customer,       // qoladigan mijoz
    remove: customer,     // o'chiriladigan mijoz
    pendingForm: null|editForm,
    diffName: bool,       // turli ismli, bir xil telefon
    step: 'main'|'phone'|'phone_pick'|'separate_phone',
  } */
  const [mergeSource, setMergeSource] = useState(null) // qo'lda birlashtirish uchun birinchi tanlangan

  // Installment payment (Customers modal)
  const [instPaymentSaleId, setInstPaymentSaleId] = useState(null)
  const [instPaymentAmount, setInstPaymentAmount] = useState('')
  const [instPaymentSuccess, setInstPaymentSuccess] = useState(false)
  const [showOverdueModal, setShowOverdueModal] = useState(false)
  const [customersPage, setCustomersPage] = useState(1)
  const CUSTOMERS_PER_PAGE = 20
  const [custSort, setCustSort] = useState({ key: 'name', dir: 'asc' })
  const toggleCustSort = (key) => setCustSort(prev =>
    prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
  )
  const CustSortIcon = ({ col }) => {
    const active = custSort.key === col
    return (
      <span className="ml-1 inline-flex flex-col leading-none" style={{ fontSize: 7 }}>
        <span style={{ opacity: active && custSort.dir === 'asc' ? 1 : 0.3 }}>▲</span>
        <span style={{ opacity: active && custSort.dir === 'desc' ? 1 : 0.3 }}>▼</span>
      </span>
    )
  }

  const handleInstPaymentSubmit = async (e) => {
    e.preventDefault()
    const amt = Number(instPaymentAmount)
    if (!amt || amt <= 0 || !instPaymentSaleId) return
    await makeInstallmentPayment(instPaymentSaleId, amt)
    setInstPaymentAmount('')
    setInstPaymentSaleId(null)
    setInstPaymentSuccess(true)
    setTimeout(() => setInstPaymentSuccess(false), 3000)
    await reloadCustomerData()
  }

  const reloadCustomerData = async () => {
    const [custs, sales] = await Promise.all([getCustomers(), getSales()])
    setCustomers(custs)
    setAllSales(sales)
    setSelectedCustomer(prev => prev ? (custs.find(c => c.id === prev.id) || prev) : prev)
    bump()
  }

  useEffect(() => {
    Promise.all([getCustomers(), getSales(), getUsedSales(), getUsedStock()]).then(([custs, sales, usedSales, usedStock]) => {
      setCustomers(custs)
      setAllSales(sales)
      setUsedSales(usedSales)
      setUsedStock(usedStock)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [version])

  useEffect(() => { getProducts().then(setProducts).catch(() => {}) }, [])

  const handleEditOpen = (c) => {
    setEditCustomer(c)
    setEditForm({ name: c.name, phone: c.phone, phone2: c.phone2 || '', birthDate: c.birthDate || '', instagram: c.instagram || '', carModel: c.carModel || '',
      gender: c.gender || '', address: c.address || '', email: c.email || '', group: c.group || '', tags: c.tags || [] })
  }

  const handleEditSave = async (e) => {
    e.preventDefault()
    if (!editForm.name || !editForm.phone) return
    const phone = editForm.phone.trim()
    const isRealPhone = phone && phone !== '+998' && phone.length > 4
    const collision = isRealPhone
      ? customers.find(c => c.id !== editCustomer.id && c.phone === phone)
      : null
    if (collision) {
      const diffName = collision.name.toLowerCase() !== editCustomer.name.toLowerCase()
      setMergeModal({ keep: editCustomer, remove: collision, pendingForm: editForm, diffName, step: 'main' })
      return
    }
    const res = await updateCustomer(editCustomer.id, {
      name: editForm.name, phone,
      phone2: editForm.phone2 || null,
      birthDate: editForm.birthDate || null,
      instagram: editForm.instagram || null,
      carModel: editForm.carModel || null,
      gender: editForm.gender || '',
      address: editForm.address || '',
      email: editForm.email || '',
      group: editForm.group || '',
      tags: editForm.tags || [],
    })
    if (res.success) {
      setCustomers(prev => prev.map(c => c.id === editCustomer.id ? { ...c, ...editForm } : c))
      bump(); setEditCustomer(null)
    }
  }

  // Ikki mijozni birlashtiradi. phoneData = { phone, phone2? }
  const doMerge = async (phoneData) => {
    const { keep, remove, pendingForm, addMode } = mergeModal
    if (addMode) {
      // Yangi mijoz yaratilmagan — mavjud (remove) mijozni yangilash va add modal yopish
      await updateCustomer(remove.id, {
        name: pendingForm.name,
        phone: phoneData.phone,
        phone2: phoneData.phone2 || null,
        birthDate: pendingForm.birthDate || remove.birthDate || null,
        instagram: pendingForm.instagram || remove.instagram || null,
      })
      const updated = await getCustomers()
      setCustomers(updated)
      bump(); setMergeModal(null)
      setShowAddModal(false)
      setNewCust(EMPTY_CUST)
      return
    }
    const keepCar = pendingForm?.carModel || keep.carModel || ''
    const removeCar = remove.carModel || ''
    const mergedCarModel = !keepCar ? (removeCar || null)
      : !removeCar ? keepCar
      : keepCar.toLowerCase() === removeCar.toLowerCase() ? keepCar
      : `${keepCar}, ${removeCar}`
    await updateCustomer(keep.id, {
      name: pendingForm?.name || keep.name,
      phone: phoneData.phone,
      phone2: phoneData.phone2 || null,
      birthDate: pendingForm?.birthDate || keep.birthDate || null,
      instagram: pendingForm?.instagram || keep.instagram || null,
      carModel: mergedCarModel,
    })
    const res = await mergeCustomers(keep.id, remove.id)
    if (res.success) {
      const updated = await getCustomers()
      setCustomers(updated)
      if (selectedCustomer?.id === remove.id) setSelectedCustomer(null)
      bump()
    }
    setMergeModal(null); setEditCustomer(null)
  }

  // Alohida saqlash: telefon muammosini hal qil
  const doSeparate = async (removeOldPhone) => {
    const { keep, remove, pendingForm, addMode } = mergeModal
    if (removeOldPhone) {
      await updateCustomer(remove.id, { phone: '' })
    }
    if (addMode) {
      // Yangi mustaqil mijoz yarat
      const result = await addCustomer({ name: pendingForm.name, phone: pendingForm.phone, birthDate: pendingForm.birthDate || null, instagram: pendingForm.instagram || null, shopId: selectedShopId !== 'all' ? selectedShopId : null })
      if (result.success) {
        const updated = await getCustomers()
        setCustomers(updated)
        bump(); setMergeModal(null)
        setShowAddModal(false)
        setNewCust(EMPTY_CUST)
      }
      return
    }
    await updateCustomer(keep.id, {
      name: pendingForm?.name || keep.name,
      phone: pendingForm.phone,
      birthDate: pendingForm?.birthDate || keep.birthDate || null,
      instagram: pendingForm?.instagram || keep.instagram || null,
    })
    const updated = await getCustomers()
    setCustomers(updated)
    bump(); setMergeModal(null); setEditCustomer(null)
  }

  // Qo'lda birlashtirish: jadvaldan bosib ikki mijoz tanlanadi
  const handleManualMergeClick = (c) => {
    if (!mergeSource) {
      setMergeSource(c); return
    }
    if (mergeSource.id === c.id) {
      setMergeSource(null); return
    }
    setMergeModal({ keep: mergeSource, remove: c, pendingForm: null, diffName: false, step: 'main' })
    setMergeSource(null)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    const res = await deleteCustomer(deleteTarget.id)
    if (res.success) {
      setCustomers(prev => prev.filter(c => c.id !== deleteTarget.id))
      bump()
      setDeleteTarget(null)
    }
  }

  // Helpers

  // shopId bo'yicha filtrlangan bazalar
  const shopSales = useMemo(() =>
    selectedShopId === 'all' ? allSales : allSales.filter(s => s.shopId === selectedShopId),
    [allSales, selectedShopId]
  )
  const shopUsedSales = useMemo(() =>
    selectedShopId === 'all' ? MOCK_USED_SALES : MOCK_USED_SALES.filter(s => s.shopId === selectedShopId),
    [MOCK_USED_SALES, selectedShopId]
  )

  // Statistika uchun: faqat faol sotuvlar (shop filtri bilan)
  const getCustomerSales = (customer) =>
    shopSales.filter(s => s.customerId === customer.id && s.status !== 'cancelled')

  // Tarix uchun: barcha sotuvlar (cancelled, exchanged ham)
  const getAllCustomerSales = (customer) =>
    shopSales.filter(s => s.customerId === customer.id)

  // B/U sotuvlar (faol, shop filtri bilan)
  const getCustomerUsedSales = (customer) =>
    shopUsedSales.filter(s => s.customerId === customer.id && s.status !== 'cancelled')

  // Yangi + B/U sotuvlar birgalikda — kelish, tovar va summa shularga qarab hisoblanadi
  const getCustomerAllSales = (customer) => [
    ...getCustomerSales(customer),
    ...getCustomerUsedSales(customer),
  ]

  const getTotalVisits = (customer) => getCustomerAllSales(customer).length

  const getTotalItems = (customer) =>
    getCustomerAllSales(customer).reduce((sum, s) => sum + (s.items?.length || 0), 0)

  const getTotalSpent = (customer) =>
    getCustomerAllSales(customer).reduce((sum, s) => sum + (s.total || 0), 0)

  // B/U tovarlar soni (alohida ustun uchun)
  const getUsedItemsCount = (customer) =>
    getCustomerUsedSales(customer).reduce((sum, s) => sum + (s.items?.length || 0), 0)

  // Sodiqlik darajasi: jami xarid summasi bo'yicha (kassadagi jamg'arma chegirma bilan bir xil qoida)
  const computeLoyaltyLevel = (customer) => {
    const tiers = loyaltyCfg?.discountEnabled ? (loyaltyCfg.discountTiers || []) : []
    const spent = getTotalSpent(customer)
    let idx = -1
    tiers.forEach((tr, i) => { if (spent >= tr.minAmount) idx = i })
    const tier = idx >= 0 ? tiers[idx] : null
    return {
      enabled: tiers.length > 0, idx, spent,
      percent: tier?.percent || 0,
      next: tiers[idx + 1] || null,
      isTop: idx >= 0 && idx === tiers.length - 1,
      color: idx < 0 ? 'bg-bg-tertiary text-text-muted' : TIER_COLORS[Math.min(idx, TIER_COLORS.length - 1)],
      label: tier ? t('cust_tier_label', { n: tier.percent }) : t('cust_tier_none'),
    }
  }

  const getLastVisit = (customer) => {
    let last = ''
    getCustomerAllSales(customer).forEach(s => { if (s.soldAt && s.soldAt > last) last = s.soldAt })
    return last || null
  }

  const customerGroups = useMemo(() =>
    [...new Set(customers.map(c => c.group).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [customers])
  const customerTags = useMemo(() =>
    [...new Set(customers.flatMap(c => c.tags || []))].sort((a, b) => a.localeCompare(b)), [customers])

  // Bizdan B/U tovar olingan (trade-in) yozuvlar
  const getCustomerUsedStock = (customer) =>
    MOCK_USED_STOCK.filter(u => u.customerId === customer.id)

  // Shu do'konda savdosi bor mijozlar ID lari
  const shopCustomerIds = useMemo(() => {
    if (selectedShopId === 'all') return null
    const ids = new Set()
    shopSales.forEach(s => { if (s.customerId) ids.add(String(s.customerId)) })
    shopUsedSales.forEach(s => { if (s.customerId) ids.add(String(s.customerId)) })
    return ids
  }, [shopSales, shopUsedSales, selectedShopId])

  // Filtering
  const filtered = useMemo(() => {
    let result = customers.filter(c => {
      if (selectedShopId !== 'all') {
        const inShop = c.shopId === selectedShopId ||
          (shopCustomerIds && shopCustomerIds.has(String(c.id)))
        if (!inShop) return false
      }
      if (filterGroup && c.group !== filterGroup) return false
      if (filterTag && !(c.tags || []).includes(filterTag)) return false
      return c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        (c.phone2 || '').includes(search)
    })

    if (activeFilter === 'installment') {
      result = result.filter(c =>
        shopSales.some(s => s.customerId === c.id && s.paymentType === 'installment' && s.status !== 'cancelled' && (s.installmentDebt ?? s.total) > 0)
      )
    }
    if (activeFilter === 'overdue') {
      result = result.filter(c =>
        shopSales.some(s =>
          s.customerId === c.id &&
          s.paymentType === 'installment' &&
          s.status !== 'cancelled' &&
          (s.installmentDebt ?? s.total) > 0 &&
          s.installmentDueDate && new Date(s.installmentDueDate) < new Date()
        )
      )
    }
    if (activeFilter === 'gold') {
      result = result.filter(c => computeLoyaltyLevel(c).percent > 0)
    }
    if (activeFilter === 'balance') {
      result = result.filter(c => Math.abs(c.balance || 0) > 0)
    }

    const { key, dir } = custSort
    result.sort((a, b) => {
      let av = a[key] ?? '', bv = b[key] ?? ''
      if (key === 'visits') {
        av = getTotalVisits(a)
        bv = getTotalVisits(b)
      }
      if (key === 'totalSpent') {
        av = getTotalSpent(a)
        bv = getTotalSpent(b)
      }
      if (key === 'lastVisit') {
        av = getLastVisit(a) || ''
        bv = getLastVisit(b) || ''
      }
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return dir === 'asc' ? cmp : -cmp
    })
    return result
  }, [customers, search, activeFilter, loyaltyMinAmount, loyaltyVisitsRequired, custSort, selectedShopId, shopCustomerIds, shopSales, shopUsedSales, version, filterGroup, filterTag])

  const metrics = useMemo(() => {
    const m = {}
    filtered.forEach(c => {
      const debt = shopSales.filter(s => s.customerId === c.id && s.paymentType === 'installment' && s.status !== 'cancelled')
        .reduce((sum, s) => sum + Math.max(0, s.installmentDebt ?? s.total ?? 0), 0)
      m[c.id] = { visits: getTotalVisits(c), spent: getTotalSpent(c), debt, last: getLastVisit(c), level: computeLoyaltyLevel(c) }
    })
    return m
  }, [filtered, shopSales, loyaltyCfg])

  // Pagination reset when filter/search/sort changes
  useEffect(() => { setCustomersPage(1) }, [search, activeFilter, custSort, filterGroup, filterTag])

  // Stats
  const stats = useMemo(() => {
    const today = new Date()
    const visibleCustomers = selectedShopId === 'all' ? customers
      : customers.filter(c => c.shopId === selectedShopId || (shopCustomerIds && shopCustomerIds.has(String(c.id))))
    const total = visibleCustomers.length

    const activeInstallments = visibleCustomers.filter(c =>
      shopSales.some(s => s.customerId === c.id && s.paymentType === 'installment' && s.status !== 'cancelled' && (s.installmentDebt ?? s.total) > 0)
    ).length

    const latePayments = visibleCustomers.filter(c =>
      shopSales.some(s =>
        s.customerId === c.id &&
        s.paymentType === 'installment' &&
        s.status !== 'cancelled' &&
        (s.installmentDebt ?? s.total) > 0 &&
        s.installmentDueDate && new Date(s.installmentDueDate) < today
      )
    ).length

    const goldCount = visibleCustomers.filter(c => computeLoyaltyLevel(c).percent > 0).length

    const balanceCount = visibleCustomers.filter(c => Math.abs(c.balance || 0) > 0).length

    return { total, activeInstallments, latePayments, goldCount, balanceCount }
  }, [customers, selectedShopId, shopCustomerIds, shopSales, loyaltyCfg, version])

  // Yangi mijozlar: shu oy va oxirgi 6 oy
  const growth = useMemo(() => {
    const now = new Date()
    const visible = selectedShopId === 'all' ? customers
      : customers.filter(c => c.shopId === selectedShopId || (shopCustomerIds && shopCustomerIds.has(String(c.id))))
    const months = []
    for (let k = 5; k >= 0; k--) {
      const d = new Date(now.getFullYear(), now.getMonth() - k, 1)
      months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: monthShort(d.getMonth(), i18n.language), value: 0 })
    }
    for (const c of visible) {
      const slot = months.find(m => m.key === (c.createdAt || '').slice(0, 7))
      if (slot) slot.value++
    }
    return { months, thisMonth: months[5].value }
  }, [customers, selectedShopId, shopCustomerIds, i18n.language])

  // ?customer=ID — boshqa sahifadan (masalan, Instagram suhbatidan) mijoz profili ochiladi
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('customer')
    if (!id || !customers.length) return
    const c = customers.find(x => String(x.id) === String(id))
    if (c) { setSelectedCustomer(c); setModalTab('general') }
    const url = new URL(window.location.href); url.searchParams.delete('customer'); window.history.replaceState(window.history.state, '', url)
  }, [customers.length])

  const handleAddCustomer = async (e) => {
    e.preventDefault()
    if (!newCust.name || !newCust.phone || saving) return
    const phone = newCust.phone.trim()
    const isRealPhone = phone && phone !== '+998' && phone.length > 6
    if (isRealPhone) {
      const collision = customers.find(c => c.phone === phone)
      if (collision) {
        setMergeModal({
          keep: null,
          remove: collision,
          pendingForm: { ...newCust, phone },
          diffName: collision.name.toLowerCase() !== newCust.name.trim().toLowerCase(),
          step: 'main',
          addMode: true,
        })
        return
      }
    }
    setAddError('')
    setSaving(true)
    try {
      const result = await addCustomer({ ...newCust, phone, shopId: selectedShopId !== 'all' ? selectedShopId : null })
      if (result.success) {
        setCustomers(prev => [...prev, result.customer])
        bump()
        setShowAddModal(false)
        setNewCust(EMPTY_CUST)
      }
    } catch (err) {
      setAddError(err?.response?.data?.error || err?.message || 'Xatolik yuz berdi')
    } finally {
      setSaving(false)
    }
  }


  const ctx = {
    customers, setCustomers, loading,
    search, setSearch,
    customersPage, setCustomersPage, CUSTOMERS_PER_PAGE,
    showAddModal, setShowAddModal,
    selectedCustomer, setSelectedCustomer,
    modalTab, setModalTab,
    editCustomer, setEditCustomer,
    editForm, setEditForm,
    deleteTarget, setDeleteTarget,
    mergeModal, setMergeModal,
    showOverdueModal, setShowOverdueModal,
    newCust, setNewCust,
    shopPickCallback, setShopPickCallback,
    activeFilter, setActiveFilter,
    custSort, setCustSort,
    mergeSource, setMergeSource,
    usdRate, som, user, bump, saving, addError, setAddError,
    computeLoyaltyLevel,
    handleAddCustomer, handleEditSave, handleEditOpen,
    handleDeleteConfirm, doMerge, doSeparate, handleManualMergeClick,
    handleInstPaymentSubmit,
    instPaymentSaleId, setInstPaymentSaleId,
    instPaymentAmount, setInstPaymentAmount,
    instPaymentSuccess,
    selectedShopId,
    stats, filtered,
    formatPrice: formatPriceRaw,
    loyaltyMinAmount, loyaltyVisitsRequired, loyaltyDiscountPercent, silverVisits,
    CustSortIcon,
    allSales: shopSales, MOCK_USED_SALES: shopUsedSales, MOCK_USED_STOCK,
    customerGroups, customerTags, products, getLastVisit, reloadCustomerData,
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-2 border-accent-red border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <ShopRequiredGuard>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 sm:space-y-6"
    >
      <PageHeader title={t('cust_title')} subtitle={t('cust_subtitle')} actions={
        <button onClick={() => requireShop(() => setShowAddModal(true))}
          className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-accent-red text-white rounded-xl font-bold hover:opacity-90 shadow-glow-red">
          <UserPlus size={18} /> {t('cust_new')}
        </button>
      } />

      {/* Umumiy ko'rinish — kartalar bosilsa ro'yxat filtrlanadi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <HeroStat gradient="violet" icon={Users} label={t('cust_stat_total')} value={stats.total}
          sub={`${t('cust_ov_new_month')}: ${growth.thisMonth}`} onClick={() => setActiveFilter(null)} />
        <HeroStat gradient="cyan" icon={Calendar} label={t('cust_stat_installment')} value={stats.activeInstallments}
          sub={`${t('cust_stat_overdue')}: ${stats.latePayments}`} onClick={() => setActiveFilter(activeFilter === 'installment' ? null : 'installment')} />
        <div className="grid grid-cols-1 gap-3">
          <MiniStat icon={Star} tone="orange" label={t('cust_stat_gold')} value={stats.goldCount}
            active={activeFilter === 'gold'} onClick={() => setActiveFilter(activeFilter === 'gold' ? null : 'gold')} />
          <MiniStat icon={CreditCard} tone="green" label={t('cust_stat_balance')} value={stats.balanceCount}
            active={activeFilter === 'balance'} onClick={() => setActiveFilter(activeFilter === 'balance' ? null : 'balance')} />
        </div>
        <ChartCard title={t('cust_ov_new_6m')}>
          <GradientBars height={150} name={t('cust_ov_new_month')} valueFormatter={v => v} data={growth.months} />
        </ChartCard>
      </div>
      {stats.latePayments > 0 && (
        <button onClick={() => setShowOverdueModal(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-accent-red/10 border border-accent-red/30 text-accent-red text-[15px] font-semibold text-left">
          <AlertCircle size={20} className="shrink-0" />
          <span className="flex-1">{t('cust_ov_overdue_banner', { n: stats.latePayments })}</span>
          <ChevronRight size={18} />
        </button>
      )}
      {activeFilter && (
        <div className="flex items-center gap-2 text-[15px] text-text-secondary">
          <Badge color="bg-accent-red/10 text-accent-red">{t({ installment: 'cust_stat_installment', gold: 'cust_stat_gold', balance: 'cust_stat_balance' }[activeFilter] || 'filter_all')}</Badge>
          <button onClick={() => setActiveFilter(null)} className="text-sm underline">{t('cust_ov_clear_filter')}</button>
        </div>
      )}

      {/* Qidiruv va filtrlar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input type="text" placeholder={t('cust_search_ph')} value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-bg-secondary border border-border rounded-xl text-[15px] focus:outline-none focus:border-accent-red w-full" />
        </div>
        {customerGroups.length > 0 && (
          <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)}
            className="px-3 py-2.5 bg-bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-accent-red max-w-[170px]">
            <option value="">{t('cust_all_groups')}</option>
            {customerGroups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        )}
        {customerTags.length > 0 && (
          <select value={filterTag} onChange={e => setFilterTag(e.target.value)}
            className="px-3 py-2.5 bg-bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-accent-red max-w-[170px]">
            <option value="">{t('cust_all_tags')}</option>
            {customerTags.map(g => <option key={g} value={g}>#{g}</option>)}
          </select>
        )}
      </div>

      {/* Birlashtirish rejimi: ikkinchi mijozni tanlash */}
      {mergeSource && (
        <div className="flex flex-wrap items-center gap-3 bg-accent-blue/10 border border-accent-blue/30 rounded-2xl px-4 py-3 text-[15px] text-accent-blue">
          <GitMerge size={18} />
          <span className="flex-1">{t('cust_merge_pick_second', { name: mergeSource.name })}</span>
          <button onClick={() => setMergeSource(null)} className="px-3 py-1.5 rounded-xl border border-accent-blue/40 text-sm font-semibold">{t('cancel')}</button>
        </div>
      )}

      <DataTable
        rows={filtered}
        resetKey={`${search}|${activeFilter}|${filterGroup}|${filterTag}`}
        onRowClick={(c) => { if (mergeSource) { handleManualMergeClick(c); return } setSelectedCustomer(c); setModalTab('general') }}
        rowClass={(c) => (mergeSource?.id === c.id ? 'ring-2 ring-accent-blue/50' : '')}
        empty={<><Users size={40} className="mx-auto mb-3 opacity-20" />{t('cust_not_found')}</>}
        columns={[
          { key: 'name', label: t('col_customer'), sortValue: c => c.name, render: c => (
            <div className="min-w-0">
              <p className="font-bold text-text-primary">{c.name}</p>
              <p className="text-sm text-text-muted">{c.phone}{c.phone2 ? ` · ${c.phone2}` : ''}</p>
              {(c.group || c.tags?.length > 0) && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {c.group && <Badge color="bg-accent-orange/10 text-accent-orange">{c.group}</Badge>}
                  {(c.tags || []).slice(0, 3).map(tg => <Badge key={tg} color="bg-accent-blue/10 text-accent-blue">#{tg}</Badge>)}
                </div>
              )}
            </div>
          ) },
          { key: 'spent', label: t('cust_th_total'), align: 'right', sortValue: c => metrics[c.id]?.spent || 0, render: c => (
            <div><p className="font-bold whitespace-nowrap">{formatPrice(metrics[c.id]?.spent || 0)}</p><p className="text-sm text-text-muted">{t('cust_visits_n', { n: metrics[c.id]?.visits || 0 })}</p></div>
          ) },
          { key: 'debt', label: t('col_debt'), align: 'right', sortValue: c => metrics[c.id]?.debt || 0, render: c => (
            (metrics[c.id]?.debt || 0) > 0 ? <span className="font-bold text-accent-red whitespace-nowrap">{formatPrice(metrics[c.id].debt)}</span> : <span className="text-text-muted">—</span>
          ) },
          { key: 'tier', label: t('col_tier'), sortValue: c => metrics[c.id]?.level?.idx ?? -1, render: c => (
            <Badge color={metrics[c.id]?.level?.color}>{metrics[c.id]?.level?.isTop && <Star size={11} />}{metrics[c.id]?.level?.label}</Badge>
          ) },
          { key: 'last', label: t('cust_th_last_visit'), sortValue: c => metrics[c.id]?.last || '', render: c => {
            const lv = metrics[c.id]?.last
            if (!lv) return <span className="text-text-muted">—</span>
            const days = Math.floor((Date.now() - new Date(lv)) / 86400000)
            return <div className="whitespace-nowrap"><p>{new Date(lv).toLocaleDateString('ru-RU')}</p><p className="text-sm text-text-muted">{days <= 0 ? t('cust_today') : t('cust_days_ago', { n: days })}</p></div>
          } },
          { key: 'car', label: t('cust_field_car'), optional: true, sortValue: c => c.carModel || '', render: c => c.carModel || <span className="text-text-muted">—</span> },
          { key: 'birth', label: t('cust_field_birthday'), optional: true, sortValue: c => c.birthDate || '', render: c => c.birthDate ? new Date(c.birthDate).toLocaleDateString('ru-RU') : <span className="text-text-muted">—</span> },
          { key: 'instagram', label: 'Instagram', optional: true, sortValue: c => c.instagram || '', render: c => c.instagram ? <span className="text-accent-pink">@{c.instagram.replace(/^@/, '')}</span> : <span className="text-text-muted">—</span> },
          { key: 'avg', label: t('cust_stat_avg_check'), optional: true, align: 'right', sortValue: c => (metrics[c.id]?.visits ? (metrics[c.id].spent / metrics[c.id].visits) : 0), render: c => metrics[c.id]?.visits ? <span className="whitespace-nowrap">{formatPrice(Math.round(metrics[c.id].spent / metrics[c.id].visits))}</span> : '—' },
          { key: 'created', label: t('cust_registered'), optional: true, sortValue: c => c.createdAt || '', render: c => c.createdAt ? new Date(c.createdAt).toLocaleDateString('ru-RU') : <span className="text-text-muted">—</span> },
        ]}
        tableId="customers_list"
        mobileCard={(c) => {
          const m = metrics[c.id] || {}
          return (
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-text-primary">{c.name}</p>
                <p className="text-sm text-text-muted">{c.phone}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {m.level && <Badge color={m.level.color}>{m.level.label}</Badge>}
                  <span className="text-sm text-text-muted">{t('cust_visits_n', { n: m.visits || 0 })}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[15px] font-bold text-text-primary">{formatPrice(m.spent || 0)}</p>
                {(m.debt || 0) > 0 && <p className="text-sm font-bold text-accent-red">{t('col_debt')}: {formatPrice(m.debt)}</p>}
              </div>
            </div>
          )
        }}
      />
      <AddCustomerModal     ctx={ctx} />
      <CustomerProfileModal ctx={ctx} />
      <EditCustomerModal    ctx={ctx} />
      <DeleteModal          ctx={ctx} />
      <MergeModal           ctx={ctx} />
    </motion.div>
    </ShopRequiredGuard>
  )
}


export default Customers
