import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, UserPlus, Eye, X, CreditCard,
  History, Calendar, TrendingUp, AlertCircle,
  CheckCircle, Star, Phone, DollarSign, Package,
  Check, Info, User, Pencil, Trash2, GitMerge, Link2, Recycle, ArrowDownToLine, ArrowUpFromLine
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '../../store/settingsStore'
import { getCustomers, addCustomer, updateCustomer, deleteCustomer, mergeCustomers } from '../../api/customerService'
import { getUsedSales, getUsedStock } from '../../api/usedService'
import { getSales, makeInstallmentPayment } from '../../api/salesService'
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

const formatPriceRaw = (n) => n?.toLocaleString('uz-UZ')

const LOYALTY_CONFIG = {
  bronze: { label: 'Bronze', color: 'bg-orange-100 text-orange-700', next: 5, nextLabel: 'Silver' },
  silver: { label: 'Silver', color: 'bg-slate-100 text-slate-700', next: 10, nextLabel: 'Gold' },
  gold:   { label: 'Gold',   color: 'bg-yellow-100 text-yellow-700', next: null, nextLabel: null },
}

const Customers = () => {
  const { t } = useTranslation()
  const formatPrice = (n) => formatPriceRaw(n) + ' ' + t('unit_som')
  const { user } = useAuthStore()
  const barcodeSelectClass = user?.role === 'admin' ? '' : 'select-none'
  const { loyaltyMinAmount, loyaltyVisitsRequired, loyaltyDiscountPercent, silverVisits, usdRate } = useSettingsStore()
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
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [addError, setAddError] = useState('')
  const [newCust, setNewCust] = useState({ name: '', phone: '+998', birthDate: '', instagram: '', carModel: '' })
  const [modalTab, setModalTab] = useState('general')
  const [activeFilter, setActiveFilter] = useState(null)

  // Edit modal
  const [editCustomer, setEditCustomer] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', phone: '', birthDate: '', instagram: '', carModel: '' })
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
    const [custs, sales] = await Promise.all([getCustomers(), getSales()])
    setCustomers(custs)
    setAllSales(sales)
    if (selectedCustomer) {
      const updated = custs.find(c => c.id === selectedCustomer.id)
      if (updated) setSelectedCustomer(updated)
    }
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

  const handleEditOpen = (c) => {
    setEditCustomer(c)
    setEditForm({ name: c.name, phone: c.phone, phone2: c.phone2 || '', birthDate: c.birthDate || '', instagram: c.instagram || '', carModel: c.carModel || '' })
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
      setNewCust({ name: '', phone: '+998', birthDate: '', instagram: '', carModel: '' })
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
        setNewCust({ name: '', phone: '+998', birthDate: '', instagram: '', carModel: '' })
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
    selectedShopId === 'all' ? MOCK_USED_SALES : MOCK_USED_SALES.filter(s => !s.shopId || s.shopId === selectedShopId),
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

  // Loyalti uchun: allSales + MOCK_USED_SALES dan qualified kelishlar (har sotuv = 1 kelish)
  const getQualifiedVisits = (customer) => [
    ...getCustomerSales(customer).filter(s => s.total >= loyaltyMinAmount),
    ...getCustomerUsedSales(customer).filter(s => s.total >= loyaltyMinAmount),
  ]

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

  // loyaltyLevel: allSales + MOCK_USED_SALES + settingsStore thresholds asosida dinamik
  const computeLoyaltyLevel = (customer) => {
    const q = getQualifiedVisits(customer).length
    if (q >= loyaltyVisitsRequired) return 'gold'
    if (q >= (silverVisits || 5)) return 'silver'
    return 'bronze'
  }

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
      result = result.filter(c => getQualifiedVisits(c).length >= loyaltyVisitsRequired)
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
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return dir === 'asc' ? cmp : -cmp
    })
    return result
  }, [customers, search, activeFilter, loyaltyMinAmount, loyaltyVisitsRequired, custSort, selectedShopId, shopCustomerIds, shopSales, shopUsedSales, version])

  // Pagination reset when filter/search/sort changes
  useEffect(() => { setCustomersPage(1) }, [search, activeFilter, custSort])

  // Stats
  const stats = useMemo(() => {
    const today = new Date()
    const visibleCustomers = selectedShopId === 'all' ? customers
      : customers.filter(c => shopCustomerIds && shopCustomerIds.has(String(c.id)))
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

    const goldCount = visibleCustomers.filter(c => getQualifiedVisits(c).length >= loyaltyVisitsRequired).length

    return { total, activeInstallments, latePayments, goldCount }
  }, [customers, selectedShopId, shopCustomerIds, shopSales, loyaltyMinAmount, loyaltyVisitsRequired, version])

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
        setNewCust({ name: '', phone: '+998', birthDate: '', instagram: '', carModel: '' })
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
    LOYALTY_CONFIG, formatPrice: formatPriceRaw,
    loyaltyMinAmount, loyaltyVisitsRequired, loyaltyDiscountPercent, silverVisits,
    CustSortIcon,
    allSales, MOCK_USED_SALES, MOCK_USED_STOCK,
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
      className="space-y-6"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-syne font-extrabold tracking-tight text-text-primary">{t('cust_title')}</h1>
          <p className="text-text-secondary text-sm">{t('cust_subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
              type="text" 
              placeholder={t('cust_search_ph')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-accent-red w-full md:w-64 transition-all"
            />
          </div>
          <button 
            onClick={() => requireShop(() => setShowAddModal(true))}
            className="flex items-center gap-2 px-6 py-2.5 bg-accent-red text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-glow-red shrink-0"
          >
            <UserPlus size={18} /> <span className="hidden sm:inline">{t('cust_new')}</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { id: 'all',         label: t('cust_stat_total'), value: stats.total, icon: Users, color: 'text-accent-blue bg-accent-blue/10' },
          { id: 'installment', label: t('cust_stat_installment'), value: stats.activeInstallments, icon: Calendar, color: 'text-accent-green bg-accent-green/10' },
          { id: 'overdue',     label: t('cust_stat_overdue'), value: stats.latePayments, icon: AlertCircle, color: 'text-accent-red bg-accent-red/10' },
          { id: 'gold',        label: t('cust_stat_gold'), value: stats.goldCount, icon: Star, color: 'text-yellow-500 bg-yellow-500/10' },
        ].map((s, i) => (
          <div 
            key={i} 
            onClick={() => {
              if (s.id === 'overdue') { setShowOverdueModal(true); return }
              setActiveFilter(activeFilter === s.id ? null : s.id)
            }}
            className={`bg-bg-secondary border rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all ${
              (activeFilter === s.id || (s.id === 'all' && activeFilter === null))
                ? 'border-accent-red ring-2 ring-accent-red/20 shadow-glow-red/10' 
                : 'border-border hover:border-text-muted'
            }`}
          >
            <div className={`w-12 h-12 ${s.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <s.icon size={24} />
            </div>
            <div>
              <p className="text-2xl font-extrabold font-syne text-text-primary">{s.value}</p>
              <p className="text-xs text-text-muted font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Customers Table */}
      <div className="bg-bg-secondary border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" style={{minWidth:'1340px'}}>
            <colgroup>
              <col style={{width:'50px'}} />
              <col style={{width:'200px'}} />
              <col style={{width:'160px'}} />
              <col style={{width:'150px'}} />
              <col style={{width:'80px'}} />
              <col style={{width:'100px'}} />
              <col style={{width:'80px'}} />
              <col style={{width:'90px'}} />
              <col style={{width:'160px'}} />
              <col style={{width:'150px'}} />
              <col style={{width:'110px'}} />
              <col style={{width:'10px'}} />
            </colgroup>
            <thead className="bg-bg-tertiary">
              <tr>
                <th className="px-6 py-4 text-text-muted font-bold uppercase tracking-wider text-[10px]">#</th>
                <th className="px-6 py-4 text-text-muted font-bold uppercase tracking-wider text-[10px] cursor-pointer select-none hover:text-text-primary" onClick={() => toggleCustSort('name')}>{t('col_customer')} <CustSortIcon col="name" /></th>
                <th className="px-6 py-4 text-text-muted font-bold uppercase tracking-wider text-[10px] cursor-pointer select-none hover:text-text-primary" onClick={() => toggleCustSort('phone')}>{t('col_phone')} <CustSortIcon col="phone" /></th>
                <th className="px-6 py-4 text-text-muted font-bold uppercase tracking-wider text-[10px]">{t('cust_th_car')}</th>
                <th className="px-6 py-4 text-text-muted font-bold uppercase tracking-wider text-[10px] text-center cursor-pointer select-none hover:text-text-primary" onClick={() => toggleCustSort('visits')}>{t('cust_th_visits')} <CustSortIcon col="visits" /></th>
                <th className="px-6 py-4 text-text-muted font-bold uppercase tracking-wider text-[10px] text-center">{t('cust_th_qualified')}</th>
                <th className="px-6 py-4 text-text-muted font-bold uppercase tracking-wider text-[10px] text-center">{t('col_product')}</th>
                <th className="px-6 py-4 text-text-muted font-bold uppercase tracking-wider text-[10px] text-center">{t('cust_th_used_items')}</th>
                <th className="px-6 py-4 text-text-muted font-bold uppercase tracking-wider text-[10px] text-right cursor-pointer select-none hover:text-text-primary" onClick={() => toggleCustSort('totalSpent')}>{t('cust_th_total')} <CustSortIcon col="totalSpent" /></th>
                <th className="px-6 py-4 text-text-muted font-bold uppercase tracking-wider text-[10px] text-right">{t('col_debt')}</th>
                <th className="px-6 py-4 text-text-muted font-bold uppercase tracking-wider text-[10px] cursor-pointer select-none hover:text-text-primary" onClick={() => toggleCustSort('loyaltyLevel')}>{t('col_tier')} <CustSortIcon col="loyaltyLevel" /></th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.slice((customersPage - 1) * CUSTOMERS_PER_PAGE, customersPage * CUSTOMERS_PER_PAGE).map((c, idx) => (
                <tr key={c.id} className="hover:bg-bg-tertiary/50 transition-colors group">
                  <td className="px-6 py-4 text-text-muted font-mono">{(customersPage - 1) * CUSTOMERS_PER_PAGE + idx + 1}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-text-primary">{c.name}</p>
                    <p className="text-[10px] text-text-muted font-mono">{c.id}</p>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    <div>{c.phone}</div>
                    {c.phone2 && <div className="text-text-muted text-[10px]">{c.phone2} <span className="bg-bg-tertiary px-1 rounded">2</span></div>}
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-sm">
                    {c.carModel || <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-bg-tertiary px-2 py-1 rounded-lg font-bold text-text-primary">
                      {getTotalVisits(c)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-accent-green/10 text-accent-green px-2 py-1 rounded-lg font-bold">
                      {getQualifiedVisits(c).length}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-bg-tertiary px-2 py-1 rounded-lg font-bold text-text-primary">
                      {getTotalItems(c)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getUsedItemsCount(c) > 0
                      ? <span className="bg-accent-orange/10 text-accent-orange px-2 py-1 rounded-lg font-bold">{getUsedItemsCount(c)}</span>
                      : <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-text-primary whitespace-nowrap">
                    {formatPrice(getTotalSpent(c))}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    {(() => {
                      const debt = allSales.filter(s => s.customerId === c.id && s.paymentType === 'installment' && s.status !== 'cancelled').reduce((sum, s) => sum + (s.installmentDebt ?? s.total ?? 0), 0)
                      return debt > 0
                        ? <span className="font-bold text-accent-red">{formatPrice(debt)}</span>
                        : <span className="text-text-muted">—</span>
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-tight ${LOYALTY_CONFIG[computeLoyaltyLevel(c)].color}`}>
                        {computeLoyaltyLevel(c) === 'gold' && <Star size={10} className="inline mr-1 mb-0.5" />}
                        {LOYALTY_CONFIG[computeLoyaltyLevel(c)].label}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setSelectedCustomer(c); setModalTab('general') }}
                        className="p-2 text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 rounded-lg transition-all"
                        title="Ko'rish"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleEditOpen(c)}
                        className="p-2 text-text-muted hover:text-accent-orange hover:bg-accent-orange/10 rounded-lg transition-all"
                        title="Tahrirlash"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleManualMergeClick(c)}
                        className={`p-2 rounded-lg transition-all ${
                          mergeSource?.id === c.id
                            ? 'text-white bg-accent-blue'
                            : mergeSource
                            ? 'text-accent-blue bg-accent-blue/10 animate-pulse'
                            : 'text-text-muted hover:text-accent-blue hover:bg-accent-blue/10'
                        }`}
                        title={mergeSource ? (mergeSource.id === c.id ? 'Bekor qilish' : 'Shu bilan birlashtirish') : 'Birlashtirish'}
                      >
                        <GitMerge size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(c)}
                        className="p-2 text-text-muted hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-all"
                        title="O'chirish"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-6 py-20 text-center">
                    <Users size={40} className="mx-auto text-text-muted mb-4 opacity-20" />
                    <p className="text-text-muted">{t('cust_not_found')}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {filtered.length > CUSTOMERS_PER_PAGE && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <span className="text-sm text-text-muted">
              {(customersPage - 1) * CUSTOMERS_PER_PAGE + 1}–{Math.min(customersPage * CUSTOMERS_PER_PAGE, filtered.length)} / {filtered.length} ta
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCustomersPage(p => Math.max(1, p - 1))}
                disabled={customersPage === 1}
                className="px-3 py-1.5 rounded-lg text-sm font-bold border border-border disabled:opacity-40 hover:bg-bg-tertiary transition-colors"
              >←</button>
              {Array.from({ length: Math.ceil(filtered.length / CUSTOMERS_PER_PAGE) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setCustomersPage(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors ${p === customersPage ? 'bg-accent-red text-white border-accent-red' : 'border-border hover:bg-bg-tertiary'}`}
                >{p}</button>
              ))}
              <button
                onClick={() => setCustomersPage(p => Math.min(Math.ceil(filtered.length / CUSTOMERS_PER_PAGE), p + 1))}
                disabled={customersPage === Math.ceil(filtered.length / CUSTOMERS_PER_PAGE)}
                className="px-3 py-1.5 rounded-lg text-sm font-bold border border-border disabled:opacity-40 hover:bg-bg-tertiary transition-colors"
              >→</button>
            </div>
          </div>
        )}
      </div>
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
