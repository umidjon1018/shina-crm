import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import DateMaskInput from '../../components/DateMaskInput'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, Truck, AlertCircle, Edit3, Search, Plus,
  DollarSign, Clock, ChevronDown, ChevronUp, Check, X,
  Trash2, ExternalLink, Filter, Info, CheckCircle, Wallet,
  BarChart3, TrendingUp, ChevronLeft, ChevronRight,
  ClipboardList, Scale, History, Undo2
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useSettingsStore } from '../../store/settingsStore'
import { getCategoryColor } from '../../utils/categoryColors'
import {
  getIncomeBatches, addBatch, updateBatch, addPaymentToBatch, deletePaymentFromBatch,
  getSuppliers, addSupplier, updateSupplier, deleteSupplier, linkBatchToSupplier
} from '../../api/incomeService'
import { getProducts } from '../../api/productService'
import { getItems } from '../../api/itemService'
import { useDataStore } from '../../store/dataStore'
import { useShopStore } from '../../store/shopStore'
import { formatPrice, formatUSD, statusConfig, getDueDays, calcRateDiff, calcPaymentRateDiff } from './components/incHelpers'
import BatchesTab   from './tabs/BatchesTab'
import SuppliersTab from './tabs/SuppliersTab'
import DebtsTab     from './tabs/DebtsTab'
import OrdersTab from './tabs/OrdersTab'
import SettlementsTab from './tabs/SettlementsTab'
import PaymentsHistoryTab from './tabs/PaymentsHistoryTab'
import SupplierReturnsTab from './tabs/SupplierReturnsTab'
import { getPurchaseOrders, getSupplierReturns } from '../../api/supplierOpsService'
import UnitInput from '../../components/UnitInput'

const Income = () => {
  const { t } = useTranslation()
  const som = t('unit_som')
  const { user } = useAuthStore()
  const { productCategories, usdRate, productAttributeDefs, productImages } = useSettingsStore()
  const { bump } = useDataStore()
  const { selectedShopId } = useShopStore()
  const isPrivileged = user?.role === 'admin' || user?.role === 'manager'

  const [batches, setBatches] = useState([])
  const [MOCK_PRODUCTS, setMockProducts] = useState([])
  const [MOCK_ITEMS, setMockItems] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [orders, setOrders] = useState([])
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('batches')

  // Modals
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [supplierModalError, setSupplierModalError] = useState('')
  const [deleteSupplierConfirm, setDeleteSupplierConfirm] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(null)
  const [expandedBatch, setExpandedBatch] = useState(null)
  const [showLinkModal, setShowLinkModal] = useState(null)

  // Filters
  const [filterSupplier, setFilterSupplier] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Yangi kirim modal
  const [showNewBatchModal, setShowNewBatchModal] = useState(false)
  const [newBatchForm, setNewBatchForm] = useState({
    productId: '', isNewProduct: false, newProductName: '',
    supplierId: '', quantity: 1, unit: '', purchasePriceUSD: '',
    entryUsdRate: usdRate || '', paymentStatus: 'unpaid', paidUSD: 0,
    dueDate: '', promoDiscount: '', promoNote: '', notes: '', attributes: {}
  })
  const [editingBatch, setEditingBatch] = useState(null)
  const [ebImgIdx, setEbImgIdx] = useState(0)
  const [ebFsOpen, setEbFsOpen] = useState(false)
  const [ebPaidDate, setEbPaidDate] = useState('')
  const [ebDueDate, setEbDueDate] = useState('')
  useEffect(() => {
    if (editingBatch) {
      setEbDueDate(editingBatch.dueDate || '')
      setEbPaidDate(new Date().toISOString().split('T')[0])
      setEbImgIdx(0)
      setEbFsOpen(false)
    }
  }, [editingBatch])
  const [editingPayment, setEditingPayment] = useState(null)
  const [showSupplierDetail, setShowSupplierDetail] = useState(null)
  const [contractDialog, setContractDialog] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 15

  // Jadval 1 uchun
  const [search1, setSearch1] = useState('')
  const [filter1Supplier, setFilter1Supplier] = useState('all')
  const [filter1Status, setFilter1Status] = useState('all')
  const [page1, setPage1] = useState(1)

  // Jadval 2 uchun
  const [search2, setSearch2] = useState('')
  const [filter2Supplier, setFilter2Supplier] = useState('all')
  const [filter2Status, setFilter2Status] = useState('all')
  const [page2, setPage2] = useState(1)

  const PAGE_SIZE = 15
  const [deletePaymentConfirm, setDeletePaymentConfirm] = useState(null)

  const normalizeBatches = (b) => b.map(x => {
    if ((x.debtUSD || 0) <= 0) return { ...x, paymentStatus: 'paid' }
    if ((x.paidUSD || 0) > 0) return { ...x, paymentStatus: 'partial' }
    const status = x.paymentStatus === 'credit' ? 'credit' : 'unpaid'
    return { ...x, paymentStatus: status }
  })

  useEffect(() => {
    Promise.all([getIncomeBatches(), getSuppliers(), getProducts(), getItems()]).then(([b, s, prods, items]) => {
      setMockProducts(prods)
      setMockItems(items)
      setBatches(normalizeBatches(b))
      setSuppliers(s)
    }).catch((e) => { console.error('Income load error:', e?.response?.data || e?.message || e) }).finally(() => setLoading(false))
    Promise.all([getPurchaseOrders(), getSupplierReturns()])
      .then(([o, r]) => { setOrders(o); setReturns(r) })
      .catch((e) => { console.error('Supplier ops load error:', e?.response?.data || e?.message || e) })
  }, [])

  const refreshAll = async () => {
    try {
      const [b, o, r] = await Promise.all([getIncomeBatches(), getPurchaseOrders(), getSupplierReturns()])
      setBatches(normalizeBatches(b))
      setOrders(o)
      setReturns(r)
    } catch (e) { console.error('Income refresh error:', e?.response?.data || e?.message || e) }
    bump()
  }

  const shopBatches = selectedShopId === 'all' ? batches : batches.filter(b => b.shopId === selectedShopId)

  const filteredBatches = useMemo(() => shopBatches
    .filter(b => {
      if (filterSupplier !== 'all' && b.supplierId !== filterSupplier) return false
      if (filterStatus !== 'all' && b.paymentStatus !== filterStatus) return false
      if (searchQuery && !b.productName?.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
    .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt))
  , [shopBatches, filterSupplier, filterStatus, searchQuery])

  const totalPages = Math.ceil(filteredBatches.length / ITEMS_PER_PAGE)
  const paginatedBatches = filteredBatches.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [filterSupplier, filterStatus, searchQuery])

  // Jadval 1 uchun useMemo
  const filtered1 = useMemo(() => shopBatches
    .filter(b => {
      if (filter1Supplier !== 'all' && b.supplierId !== filter1Supplier) return false
      if (filter1Status !== 'all' && b.paymentStatus !== filter1Status) return false
      if (search1 && !b.productName?.toLowerCase().includes(search1.toLowerCase())) return false
      return true
    })
    .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt))
  , [shopBatches, filter1Supplier, filter1Status, search1])

  const totalPages1 = Math.ceil(filtered1.length / PAGE_SIZE)
  const paged1 = filtered1.slice((page1 - 1) * PAGE_SIZE, page1 * PAGE_SIZE)

  // Jadval 2 uchun useMemo
  const filtered2 = useMemo(() => shopBatches
    .filter(b => {
      if (filter2Supplier !== 'all' && b.supplierId !== filter2Supplier) return false
      if (filter2Status !== 'all' && b.paymentStatus !== filter2Status) return false
      if (search2 && !b.productName?.toLowerCase().includes(search2.toLowerCase())) return false
      return true
    })
    .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt))
  , [shopBatches, filter2Supplier, filter2Status, search2])

  const totalPages2 = Math.ceil(filtered2.length / PAGE_SIZE)
  const paged2 = filtered2.slice((page2 - 1) * PAGE_SIZE, page2 * PAGE_SIZE)

  useEffect(() => { setPage1(1) }, [filter1Supplier, filter1Status, search1])
  useEffect(() => { setPage2(1) }, [filter2Supplier, filter2Status, search2])

  const getSupplierName = (supplierId) =>
    suppliers.find(s => s.id === supplierId)?.name || t('inc_not_assigned')

  if (!isPrivileged) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-text-muted">{t('inc_access_denied')}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Inventory matching logic
  const shopBatchIds_inv = new Set(shopBatches.map(b => b.id))
  const invProducts = MOCK_PRODUCTS.filter(p => shopBatches.some(b => b.productId === p.id))
  const inventoryCheck = invProducts.map(p => {
    const totalIn = shopBatches
      .filter(b => b.productId === p.id)
      .reduce((sum, b) => sum + b.quantity, 0)
    const sold = MOCK_ITEMS.filter(i => i.productId === p.id && i.status === 'sold' && shopBatchIds_inv.has(i.batchId)).length
    const inStock = MOCK_ITEMS.filter(i => i.productId === p.id && i.status === 'in_stock' && shopBatchIds_inv.has(i.batchId)).length
    const isMatch = totalIn === sold + inStock
    return { product: p, totalIn, sold, inStock, isMatch }
  })
  const allMatch = inventoryCheck.every(c => c.isMatch)

  const TABS = [
    { id: 'batches', label: t('inc_tab_batches'), icon: Package },
    { id: 'suppliers', label: t('suppliers'), icon: Truck },
    { id: 'debts', label: t('inc_tab_debts'), icon: AlertCircle },
    { id: 'orders', label: t('sup_tab_orders'), icon: ClipboardList },
    { id: 'settlements', label: t('sup_tab_settlements'), icon: Scale },
    { id: 'payments', label: t('sup_tab_payments'), icon: History },
    { id: 'returns', label: t('sup_tab_returns'), icon: Undo2 },
  ]


  const onDeleteSupplier = (s) => setDeleteSupplierConfirm(s)

  const confirmDeleteSupplier = async () => {
    const s = deleteSupplierConfirm
    setDeleteSupplierConfirm(null)
    try {
      await deleteSupplier(s.id)
      setSuppliers(prev => prev.filter(x => x.id !== s.id))
    } catch (err) {
      setSupplierModalError(err?.response?.data?.error || err?.message || 'Xato')
    }
  }

  const ctx = {
    user, isPrivileged, som,
    batches, setBatches, suppliers, setSuppliers, loading, selectedShopId,
    activeTab, setActiveTab,
    shopBatches, filteredBatches,
    showSupplierModal, setShowSupplierModal,
    editingSupplier, setEditingSupplier,
    showPaymentModal, setShowPaymentModal,
    expandedBatch, setExpandedBatch,
    showLinkModal, setShowLinkModal,
    filterSupplier, setFilterSupplier,
    filterStatus, setFilterStatus,
    searchQuery, setSearchQuery,
    showNewBatchModal, setShowNewBatchModal,
    newBatchForm, setNewBatchForm,
    editingBatch, setEditingBatch,
    editingPayment, setEditingPayment,
    showSupplierDetail, setShowSupplierDetail,
    contractDialog, setContractDialog,
    currentPage, setCurrentPage, ITEMS_PER_PAGE,
    search1, setSearch1, filter1Supplier, setFilter1Supplier,
    filter1Status, setFilter1Status, page1, setPage1,
    search2, setSearch2, filter2Supplier, setFilter2Supplier,
    filter2Status, setFilter2Status, page2, setPage2,
    PAGE_SIZE, deletePaymentConfirm, setDeletePaymentConfirm,
    usdRate, productCategories, bump,
    onDeleteSupplier,
    paged1, totalPages1, total1: filtered1.length, paged2, totalPages2, total2: filtered2.length,
    getSupplierName,
    inventoryCheck, allMatch,
    MOCK_PRODUCTS,
    orders, setOrders, returns, refreshAll,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-12"
    >
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-syne font-extrabold tracking-tight">{t('inc_title')}</h1>
          <p className="text-text-secondary text-sm">{t('inc_subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-4">
          {[
            {
              label: t('inc_stat_total'),
              value: shopBatches.length + ' ' + t('unit_pcs'),
              color: 'text-accent-blue',
              icon: Package
            },
            {
              label: t('inc_stat_debt'),
              value: formatUSD(shopBatches.reduce((s, b) => s + (b.debtUSD || 0), 0)),
              color: 'text-accent-red',
              icon: DollarSign
            },
            {
              label: t('inc_stat_due'),
              value: shopBatches.filter(b => {
                const d = getDueDays(b.dueDate)
                return d !== null && d <= 3 && d >= 0 && b.debtUSD > 0
              }).length + ' ' + t('unit_pcs'),
              color: 'text-accent-orange',
              icon: Clock
            },
          ].map((s, i) => (
            <div key={i} className="bg-bg-secondary border border-border rounded-2xl px-5 py-3 flex items-center gap-3">
              <s.icon size={20} className={s.color} />
              <div>
                <p className={`text-lg font-extrabold font-syne ${s.color}`}>{s.value}</p>
                <p className="text-xs text-text-muted">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex gap-2 p-1 bg-bg-secondary border border-border rounded-2xl w-fit max-w-full overflow-x-auto no-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.id
              ? 'bg-bg-tertiary text-text-primary shadow-sm'
              : 'text-text-muted hover:text-text-primary'
              }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="min-h-[500px]">
        {activeTab === 'batches'   && <BatchesTab   ctx={ctx} />}
        {activeTab === 'suppliers' && <SuppliersTab ctx={ctx} />}
        {activeTab === 'debts'     && <DebtsTab     ctx={ctx} />}
        {activeTab === 'orders'    && <OrdersTab    ctx={ctx} />}
        {activeTab === 'settlements' && <SettlementsTab ctx={ctx} />}
        {activeTab === 'payments'  && <PaymentsHistoryTab ctx={ctx} />}
        {activeTab === 'returns'   && <SupplierReturnsTab ctx={ctx} />}
      {/* MODALS */}
      <AnimatePresence>
        {/* Payment Modal */}
        {showPaymentModal && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowPaymentModal(null) }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-secondary border border-border rounded-[2.5rem] p-8 w-full max-w-md shadow-glow-red"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-syne font-extrabold text-text-primary">{t('inc_add_payment')}</h3>
                  <p className="text-xs text-text-muted mt-1">{showPaymentModal.productName}</p>
                </div>
                <button onClick={() => setShowPaymentModal(null)} className="p-2 text-text-muted hover:text-text-primary transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-bg-tertiary rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-1">{t('inc_debt_remaining')}</p>
                    <p className="text-2xl font-syne font-extrabold text-accent-red">{formatUSD(showPaymentModal.debtUSD)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-1">{t('inc_debt_due_date')}</p>
                    <p className="text-sm font-bold text-text-primary">{showPaymentModal.dueDate || t('inc_debt_no_due')}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('inc_pay_amount_usd')}</label>
                    <div className="relative">
                      <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        type="number"
                        placeholder="0.00"
                        className="w-full bg-bg-tertiary border border-border rounded-xl pl-12 pr-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue"
                        id="paymentAmount"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('inc_pay_usd_rate')}</label>
                      <input
                        type="number"
                        placeholder="12,800"
                        defaultValue={usdRate || ''}
                        className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue"
                        id="usdRate"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('inc_pay_method')}</label>
                      <select className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue" id="paymentType">
                        <option value="cash_uzs">{t('inc_pay_cash_uzs')}</option>
                        <option value="cash_usd">{t('inc_pay_cash_usd')}</option>
                        <option value="transfer">{t('inc_pay_transfer')}</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('col_note')}</label>
                    <textarea
                      placeholder={t('inc_pay_note_ph')}
                      className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-blue h-20 resize-none"
                      id="paymentNote"
                    />
                  </div>
                </div>

                <button
                  onClick={async () => {
                    const amountUSD = parseFloat(document.getElementById('paymentAmount').value)
                    const usdRate = parseFloat(document.getElementById('usdRate').value)
                    const type = document.getElementById('paymentType').value
                    const note = document.getElementById('paymentNote').value

                    if (!amountUSD || !usdRate) return

                    await addPaymentToBatch(showPaymentModal.id, {
                      amountUSD, usdRate,
                      amountUZS: amountUSD * usdRate,
                      type, note,
                      date: new Date().toISOString().split('T')[0],
                    })
                    const refreshed = await getIncomeBatches()
                    setBatches(refreshed)
                    bump()
                    setShowPaymentModal(null)
                  }}
                  className="w-full py-4 bg-accent-blue text-white rounded-2xl font-syne font-extrabold text-lg shadow-glow-blue hover:opacity-90 transition-all"
                >
                  {t('inc_save_payment')}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Supplier o'chirish tasdiqlash modali */}
        {deleteSupplierConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-bg-secondary border border-border rounded-[2rem] p-8 w-full max-w-sm shadow-glow-red">
              <h3 className="text-lg font-syne font-extrabold text-text-primary mb-2">O'chirishni tasdiqlang</h3>
              <p className="text-sm text-text-secondary mb-6">
                <span className="font-bold text-text-primary">"{deleteSupplierConfirm.name}"</span> ni o'chirishni xohlaysizmi? Ma'lumotlar bazada saqlanib qoladi.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteSupplierConfirm(null)}
                  className="flex-1 py-3 rounded-2xl border border-border text-text-secondary hover:border-accent-blue hover:text-text-primary transition-all font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={confirmDeleteSupplier}
                  className="flex-1 py-3 rounded-2xl bg-accent-red text-white font-bold hover:opacity-90 transition-all"
                >
                  O'chirish
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Supplier Modal */}
        {showSupplierModal && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) { setShowSupplierModal(false); setSupplierModalError('') } }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-secondary border border-border rounded-[2.5rem] p-8 w-full max-w-lg shadow-glow-red"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-syne font-extrabold text-text-primary">
                  {editingSupplier ? t('edit') : t('inc_add_supplier')}
                </h3>
                <button onClick={() => { setShowSupplierModal(false); setSupplierModalError('') }} className="p-2 text-text-muted hover:text-text-primary transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="col-span-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('col_name')}</label>
                  <input
                    defaultValue={editingSupplier?.name}
                    id="supp_name"
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('col_phone')}</label>
                  <input
                    defaultValue={editingSupplier?.phone}
                    id="supp_phone"
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('inc_supplier_inn')}</label>
                  <input
                    defaultValue={editingSupplier?.inn}
                    id="supp_inn"
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('inc_contract_number')}</label>
                  <input
                    defaultValue={editingSupplier?.contractNumber}
                    id="supp_contract"
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('col_address')}</label>
                  <input
                    defaultValue={editingSupplier?.address}
                    id="supp_address"
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('sup_contact_person')}</label>
                  <input
                    defaultValue={editingSupplier?.contactPerson}
                    id="supp_contact_person"
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('col_note')}</label>
                  <input
                    defaultValue={editingSupplier?.notes}
                    id="supp_notes"
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('inc_contract_amount')} ({som})</label>
                  <input
                    type="number"
                    defaultValue={editingSupplier?.contractAmount}
                    id="supp_contract_amount"
                    placeholder="200000000"
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('inc_contract_file')}</label>
                  <div className="flex items-center gap-3">
                    <input type="file" id="supp_contract_file" className="hidden" />
                    <button
                      onClick={() => document.getElementById('supp_contract_file').click()}
                      className="flex items-center gap-2 px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-sm text-text-secondary hover:border-accent-blue transition-colors w-full whitespace-nowrap"
                    >
                      <Plus size={16} /> {t('inc_supp_attach_file')}
                    </button>
                  </div>
                </div>

                {/* Yangi shartnoma — faqat tahrirlashda */}
                {editingSupplier && <div className="col-span-2 border-t border-border pt-4 mt-2">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-extrabold uppercase tracking-widest text-text-muted">{t('inc_new_contract_optional')}</p>
                    {editingSupplier && (() => {
                      const supplierBatches = shopBatches.filter(b => b.supplierId === editingSupplier.id)
                      const contractUsed = supplierBatches.reduce((sum, b) =>
                        sum + (b.payments?.reduce((ps, p) => ps + p.amountUZS, 0) || 0), 0)
                      const contractRemaining = (editingSupplier.contractAmount || 0) - contractUsed
                      return contractRemaining < 5000000 ? (
                        <span className="text-xs bg-accent-red/10 text-accent-red px-2 py-1 rounded-full font-bold">
                          {t('inc_supplier_contract_warning')}
                        </span>
                      ) : null
                    })()}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('inc_new_contract_number')}</label>
                      <input
                        id="supp_new_contract_number"
                        placeholder={t('inc_new_contract_number_ph')}
                        className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('inc_new_contract_amount')} ({som})</label>
                      <input
                        type="number"
                        id="supp_new_contract_amount"
                        placeholder="200000000"
                        className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('inc_new_contract_file')}</label>
                      <div className="flex items-center gap-3">
                        <input type="file" accept=".pdf,.doc,.docx" id="supp_new_contract_file" className="hidden" />
                        <button
                          onClick={() => document.getElementById('supp_new_contract_file').click()}
                          className="flex items-center gap-2 px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-secondary hover:border-accent-blue transition-colors whitespace-nowrap"
                        >
                          <Plus size={16} /> {t('inc_supp_attach_file')}
                        </button>
                        <p className="text-xs text-text-muted">{t('inc_new_contract_archive_note')}</p>
                      </div>
                    </div>
                  </div>
                </div>}
              </div>

              {supplierModalError && (
                <p className="text-accent-red text-sm bg-accent-red/10 border border-accent-red/30 rounded-xl px-4 py-3 mb-2">
                  {supplierModalError}
                </p>
              )}

              <button
                onClick={async () => {
                  setSupplierModalError('')
                  const data = {
                    name: document.getElementById('supp_name').value,
                    phone: document.getElementById('supp_phone').value,
                    inn: document.getElementById('supp_inn').value,
                    contractNumber: document.getElementById('supp_contract').value,
                    address: document.getElementById('supp_address').value,
                    contactPerson: document.getElementById('supp_contact_person').value,
                    notes: document.getElementById('supp_notes').value,
                    contractAmount: parseFloat(document.getElementById('supp_contract_amount')?.value) || 0,
                  }

                  const newContractNumber = document.getElementById('supp_new_contract_number')?.value?.trim()
                  const newContractAmount = parseFloat(document.getElementById('supp_new_contract_amount')?.value) || null

                  if (editingSupplier && (newContractNumber || newContractAmount)) {
                    // Tahrirlashda yangi shartnoma: eski shartnoma qoldig'ini hisoblash
                    const supplierBatches = shopBatches.filter(b => b.supplierId === editingSupplier?.id)
                    const contractUsed = supplierBatches.reduce((sum, b) =>
                      sum + (b.payments?.reduce((ps, p) => ps + p.amountUZS, 0) || 0), 0)
                    const contractRemaining = (editingSupplier?.contractAmount || 0) - contractUsed

                    setShowSupplierModal(false)
                    setContractDialog({
                      supplier: editingSupplier,
                      baseData: data,
                      newContractNumber,
                      newContractAmount,
                      contractRemaining,
                    })
                    return
                  }

                  // Yangi supplier yoki tahrirlashda yangi shartnoma yo'q:
                  // "Yangi shartnoma" maydonlari asosiy contract sifatida ishlatilsin
                  if (!editingSupplier) {
                    if (newContractNumber) data.contractNumber = newContractNumber
                    if (newContractAmount) data.contractAmount = newContractAmount
                  }

                  try {
                    let savedSupplier;
                    if (editingSupplier) {
                      savedSupplier = await updateSupplier(editingSupplier.id, data)
                    } else {
                      savedSupplier = await addSupplier(data)
                    }

                    if (savedSupplier) {
                      const newSupps = editingSupplier
                        ? suppliers.map(s => s.id === savedSupplier.id ? savedSupplier : s)
                        : [...suppliers, savedSupplier]
                      setSuppliers(newSupps)
                      setShowSupplierModal(false)
                    }
                  } catch (err) {
                    setSupplierModalError(err?.response?.data?.error || err?.message || 'Noma\'lum xato')
                  }
                }}
                className="w-full py-4 bg-accent-blue text-white rounded-2xl font-syne font-extrabold text-lg shadow-glow-blue hover:opacity-90 transition-all"
              >
                {t('inc_save_btn')}
              </button>
            </motion.div>
          </div>
        )}

        {/* Link Supplier Modal */}
        {showLinkModal && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowLinkModal(null) }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-secondary border border-border rounded-[2.5rem] p-8 w-full max-w-sm shadow-glow-red text-center"
            >
              <h3 className="text-xl font-syne font-extrabold text-text-primary mb-2">{t('inc_link_modal_title')}</h3>
              <p className="text-xs text-text-muted mb-6">{showLinkModal.productName}</p>

              <select
                id="link_supplier"
                className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary mb-6 focus:outline-none focus:border-accent-blue"
              >
                <option value="">Tanlang...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowLinkModal(null)} className="py-3 bg-bg-tertiary border border-border rounded-xl text-text-primary font-bold hover:bg-border transition-colors">Bekor qilish</button>
                <button
                  onClick={async () => {
                    const sid = document.getElementById('link_supplier').value
                    if (!sid) return
                    const res = await linkBatchToSupplier(showLinkModal.id, sid)
                    if (res.success) {
                      setBatches(prev => prev.map(b => b.id === showLinkModal.id ? { ...b, supplierId: sid } : b))
                      setShowLinkModal(null)
                    }
                  }}
                  className="py-3 bg-accent-blue text-white rounded-xl font-bold hover:opacity-90"
                >
                  Saqlash
                </button>
              </div>
            </motion.div>
          </div>
        )}


        {showNewBatchModal && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) { setShowNewBatchModal(false); setNewBatchForm(f => ({ ...f, unit: '' })) } }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-secondary border border-border rounded-[2.5rem] p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-syne font-extrabold text-text-primary">{t('inc_new_batch_modal_title')}</h3>
                <button onClick={() => { setShowNewBatchModal(false); setNewBatchForm(f => ({ ...f, unit: '' })) }} className="p-2 text-text-muted hover:text-text-primary">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Tovar tanlash yoki yangi */}
                <div className="col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('inc_product_label')}</label>
                    <button
                      onClick={() => setNewBatchForm(f => ({ ...f, isNewProduct: !f.isNewProduct, productId: '', newProductName: '' }))}
                      className="text-xs text-accent-blue hover:underline"
                    >
                      {newBatchForm.isNewProduct ? t('inc_existing_product') : t('inc_new_product_link')}
                    </button>
                  </div>
                  {newBatchForm.isNewProduct ? (
                    <input
                      value={newBatchForm.newProductName}
                      onChange={e => setNewBatchForm(f => ({ ...f, newProductName: e.target.value }))}
                      placeholder={t('inc_new_product_ph')}
                      className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue"
                    />
                  ) : (
                    <select
                      value={newBatchForm.productId}
                      onChange={e => setNewBatchForm(f => ({ ...f, productId: e.target.value }))}
                      className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue"
                    >
                      <option value="">{t('inc_select_product_ph')}</option>
                      {MOCK_PRODUCTS.map(p => (
                        <option key={p.id} value={p.id}>{p.brand} {p.name} ({p.size})</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Yetkazib beruvchi */}
                <div className="col-span-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('inc_supplier_required')}</label>
                  <select
                    value={newBatchForm.supplierId}
                    onChange={e => setNewBatchForm(f => ({ ...f, supplierId: e.target.value }))}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue"
                  >
                    <option value="">{t('inc_link_select_ph')}</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                {/* Soni + Birlik */}
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('inc_qty_label')}</label>
                  <div className="flex gap-2">
                    <input
                      type="number" min="1"
                      value={newBatchForm.quantity}
                      onChange={e => setNewBatchForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))}
                      className="w-28 bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue"
                    />
                    <UnitInput
                      value={newBatchForm.unit || ''}
                      onChange={v => setNewBatchForm(f => ({ ...f, unit: v }))}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Dona narxi USD */}
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('inc_unit_price_label')}</label>
                  <input
                    type="number"
                    value={newBatchForm.purchasePriceUSD}
                    onChange={e => setNewBatchForm(f => ({ ...f, purchasePriceUSD: parseFloat(e.target.value) || '' }))}
                    placeholder="0.00"
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>

                {/* Kelish kuni USD kursi */}
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('inc_entry_rate_label')}</label>
                  <input
                    type="number"
                    value={newBatchForm.entryUsdRate}
                    onChange={e => setNewBatchForm(f => ({ ...f, entryUsdRate: parseFloat(e.target.value) || '' }))}
                    placeholder="12800"
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>

                {/* To'lov holati */}
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('inc_pay_status_label')}</label>
                  <select
                    value={newBatchForm.paymentStatus}
                    onChange={e => setNewBatchForm(f => ({ ...f, paymentStatus: e.target.value }))}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue"
                  >
                    <option value="unpaid">{t('inc_filter_unpaid')}</option>
                    <option value="partial">{t('inc_filter_partial')}</option>
                    <option value="credit">{t('inc_filter_credit')}</option>
                    <option value="paid">{t('inc_filter_paid')}</option>
                  </select>
                </div>

                {/* To'langan USD */}
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('inc_paid_usd_label')}</label>
                  <input
                    type="number" min="0"
                    value={newBatchForm.paidUSD}
                    onChange={e => setNewBatchForm(f => ({ ...f, paidUSD: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>

                {/* To'lov muddati */}
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('inc_due_date_label')}</label>
                  <DateMaskInput
                    value={newBatchForm.dueDate}
                    onChange={e => setNewBatchForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue"

                  />
                </div>

                {/* Aksiya */}
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('inc_promo_pct_label')}</label>
                  <input
                    type="number" min="0" max="100"
                    value={newBatchForm.promoDiscount}
                    onChange={e => setNewBatchForm(f => ({ ...f, promoDiscount: parseFloat(e.target.value) || '' }))}
                    placeholder="0"
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('inc_promo_name_label')}</label>
                  <input
                    value={newBatchForm.promoNote}
                    onChange={e => setNewBatchForm(f => ({ ...f, promoNote: e.target.value }))}
                    placeholder={t('inc_promo_name_ph')}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('col_note')}</label>
                  <textarea
                    value={newBatchForm.notes}
                    onChange={e => setNewBatchForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder={t('inc_notes_ph')}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue h-20 resize-none"
                  />
                </div>
              </div>

              {/* Xususiyatlar */}
              {(productAttributeDefs || []).length > 0 && (
                <div className="mt-4 p-4 bg-bg-tertiary border border-border rounded-2xl space-y-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">Xususiyatlar</p>
                  <div className="space-y-2">
                    {(productAttributeDefs || []).map(def => {
                      const checked = def.label in newBatchForm.attributes
                      return (
                        <div key={def.id} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id={`attr-${def.id}`}
                            checked={checked}
                            onChange={e => {
                              if (e.target.checked) {
                                setNewBatchForm(f => ({ ...f, attributes: { ...f.attributes, [def.label]: def.values[0] || '' } }))
                              } else {
                                setNewBatchForm(f => {
                                  const a = { ...f.attributes }
                                  delete a[def.label]
                                  return { ...f, attributes: a }
                                })
                              }
                            }}
                            className="w-4 h-4 accent-accent-red cursor-pointer"
                          />
                          <label htmlFor={`attr-${def.id}`} className="text-sm text-text-secondary font-medium cursor-pointer min-w-[80px]">
                            {def.label}
                          </label>
                          {checked && (
                            <select
                              value={newBatchForm.attributes[def.label] === null ? '__none__' : (newBatchForm.attributes[def.label] || '')}
                              onChange={e => {
                                const val = e.target.value === '__none__' ? null : e.target.value
                                setNewBatchForm(f => ({ ...f, attributes: { ...f.attributes, [def.label]: val } }))
                              }}
                              className="flex-1 px-3 py-1.5 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                            >
                              {def.values.map(v => <option key={v} value={v}>{v}</option>)}
                              <option value="__none__">Xususiyatsiz</option>
                            </select>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Preview */}
              {newBatchForm.purchasePriceUSD && newBatchForm.entryUsdRate && newBatchForm.quantity && (
                <div className="bg-bg-tertiary border border-border rounded-2xl p-4 mb-6 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-text-muted">{t('inc_preview_total_usd')}</p>
                    <p className="text-lg font-extrabold font-syne text-text-primary">
                      ${(newBatchForm.purchasePriceUSD * newBatchForm.quantity).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">{t('inc_preview_entry_uzs')}</p>
                    <p className="text-lg font-extrabold font-syne text-accent-blue">
                      {formatPrice(newBatchForm.purchasePriceUSD * newBatchForm.quantity * newBatchForm.entryUsdRate)} {som}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">{t('col_debt_usd')}</p>
                    <p className="text-lg font-extrabold font-syne text-accent-red">
                      ${Math.max(0, newBatchForm.purchasePriceUSD * newBatchForm.quantity - newBatchForm.paidUSD).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={async () => {
                  const { productId, isNewProduct, newProductName, supplierId, quantity, purchasePriceUSD, entryUsdRate, paymentStatus, paidUSD, dueDate, promoDiscount, promoNote, notes } = newBatchForm
                  if ((!productId && !newProductName) || !purchasePriceUSD || !entryUsdRate) return
                  if (!newBatchForm.unit?.trim()) { alert(t('wh_in_err_unit')); return }
                  const product = MOCK_PRODUCTS.find(p => p.id === productId)
                  const totalUSD = purchasePriceUSD * quantity
                  const debtUSD = Math.max(0, totalUSD - paidUSD)
                  const receivedAt = new Date().toISOString()

                  // Yangi tovar bo'lsa — backend ga ham qo'shamiz
                  let finalProductId = productId
                  if (isNewProduct && newProductName) {
                    const { createProduct } = await import('../../api/productService')
                    const newProd = await createProduct({
                      name: newProductName,
                      category: 'accessory',
                      cashPrice: 0,
                      minSalePrice: 0,
                      installmentBasePrice: 0,
                    })
                    finalProductId = newProd.id
                  }

                  const newBatch = await addBatch({
                    productId: finalProductId,
                    supplierId,
                    shopId: selectedShopId !== 'all' ? selectedShopId : (shops[0]?.id || '1'),
                    quantity,
                    unit: newBatchForm.unit || 'dona',
                    purchasePrice: purchasePriceUSD * entryUsdRate,
                    purchasePriceUSD,
                    entryUsdRate,
                    paymentStatus,
                    paidUSD,
                    dueDate: dueDate || null,
                    notes: notes || null,
                    promoDiscount: promoDiscount || null,
                    promoNote: promoNote || null,
                    attributes: Object.fromEntries(
                      Object.entries(newBatchForm.attributes || {}).filter(([k]) =>
                        (productAttributeDefs || []).some(d => d.label === k)
                      )
                    ),
                  })
                  setBatches(prev => [newBatch, ...prev])
                  bump()
                  setShowNewBatchModal(false)
                  setNewBatchForm({
                    productId: '', isNewProduct: false, newProductName: '',
                    supplierId: '', quantity: 1, unit: '', purchasePriceUSD: '',
                    entryUsdRate: usdRate || '', paymentStatus: 'unpaid', paidUSD: 0,
                    dueDate: '', promoDiscount: '', promoNote: '', notes: '', attributes: {}
                  })
                }}
                disabled={(!newBatchForm.productId && !newBatchForm.newProductName) || !newBatchForm.purchasePriceUSD || !newBatchForm.entryUsdRate}
                className="w-full py-4 bg-accent-blue text-white rounded-2xl font-syne font-extrabold text-lg hover:opacity-90 transition-all disabled:opacity-40"
              >
                {t('inc_save_batch')}
              </button>
            </motion.div>
          </div>
        )}

        {editingBatch && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setEditingBatch(null) }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-secondary border border-border rounded-[2.5rem] p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-syne font-extrabold text-text-primary">{t('inc_edit_batch_title')}</h3>
                  <p className="text-sm text-text-muted">{editingBatch.productName}</p>
                  {editingBatch.isFromWarehouse && (
                    <span className="text-xs bg-accent-blue/10 text-accent-blue px-2 py-0.5 rounded-full">{t('inc_warehouse_badge')}</span>
                  )}
                </div>
                <button onClick={() => setEditingBatch(null)} className="p-2 text-text-muted hover:text-text-primary">
                  <X size={24} />
                </button>
              </div>

              {(() => {
                const imgs = productImages[String(editingBatch.productId)] || []
                if (!imgs.length) return null
                return (
                  <div className="mb-5 space-y-2">
                    <div
                      className="relative w-full rounded-2xl overflow-hidden bg-bg-tertiary cursor-pointer group"
                      style={{ aspectRatio: '16/7' }}
                      onClick={() => setEbFsOpen(true)}
                    >
                      <img src={imgs[ebImgIdx]} alt="" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold bg-black/50 px-3 py-1 rounded-full">Kattalashtirish</span>
                      </div>
                      {imgs.length > 1 && (
                        <>
                          <button onClick={e => { e.stopPropagation(); setEbImgIdx(i => (i - 1 + imgs.length) % imgs.length) }} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"><ChevronLeft size={16} /></button>
                          <button onClick={e => { e.stopPropagation(); setEbImgIdx(i => (i + 1) % imgs.length) }} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"><ChevronRight size={16} /></button>
                          <div className="absolute bottom-2 right-3 text-[10px] bg-black/50 text-white px-2 py-0.5 rounded-full font-bold">{ebImgIdx + 1} / {imgs.length}</div>
                        </>
                      )}
                    </div>
                    {imgs.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {imgs.map((img, i) => (
                          <button key={i} onClick={() => setEbImgIdx(i)} className={`w-14 h-10 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${i === ebImgIdx ? 'border-accent-red' : 'border-border opacity-60 hover:opacity-90'}`}>
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="col-span-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('col_supplier')}</label>
                  <select
                    defaultValue={editingBatch.supplierId || ''}
                    id="eb_supplier"
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue"
                  >
                    <option value="">{t('inc_link_select_ph')}</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('inc_qty_label')}</label>
                  <input type="number" id="eb_qty" defaultValue={editingBatch.quantity}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue" />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('inc_unit_price_label')}</label>
                  <input type="number" id="eb_price" defaultValue={editingBatch.purchasePriceUSD || ''}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue" />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('inc_entry_rate_label')}</label>
                  <input type="number" id="eb_rate" defaultValue={editingBatch.entryUsdRate || ''}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue" />
                </div>
                 <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('inc_pay_status_label')}</label>
                  <select id="eb_status" defaultValue={editingBatch.paymentStatus}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue">
                    <option value="unpaid">{t('inc_filter_unpaid')}</option>
                    <option value="partial">{t('inc_filter_partial')}</option>
                    <option value="credit">{t('inc_filter_credit')}</option>
                    <option value="paid">{t('inc_filter_paid')}</option>
                  </select>
                </div>

                {/* Dastlabki to'lov — faqat paidUSD 0 bo'lsa va payments bo'sh bo'lsa */}
                {!editingBatch.payments?.length && (
                  <div className="col-span-2 border-t border-border/50 pt-4 space-y-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('inc_init_payment')}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">To'langan (USD)</label>
                        <input type="number" min="0" id="eb_paid_usd" defaultValue=""
                          placeholder="0"
                          className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue" />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('inc_paid_rate')}</label>
                        <input type="number" id="eb_paid_rate" defaultValue={editingBatch.entryUsdRate || ''}
                          placeholder="12800"
                          className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue" />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('inc_paid_date')}</label>
                        <DateMaskInput value={ebPaidDate} onChange={e => setEbPaidDate(e.target.value)}
                          className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue" />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('inc_paid_method')}</label>
                        <select id="eb_paid_type"
                          className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue">
                          <option value="cash_uzs">{t('inc_pay_cash_uzs')}</option>
                          <option value="cash_usd">{t('inc_pay_cash_usd')}</option>
                          <option value="transfer">{t('inc_pay_bank')}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('inc_due_date_label')}</label>
                  <DateMaskInput value={ebDueDate} onChange={e => setEbDueDate(e.target.value)}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue" />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('inc_promo_pct_label')}</label>
                  <input type="number" id="eb_promo" defaultValue={editingBatch.promoDiscount || ''}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('inc_promo_name_label')}</label>
                  <input id="eb_promo_note" defaultValue={editingBatch.promoNote || ''}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('col_note')}</label>
                  <textarea id="eb_notes" defaultValue={editingBatch.notes || ''}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue h-20 resize-none" />
                </div>
              </div>

              <button
                onClick={async () => {
                  const supplierId = document.getElementById('eb_supplier').value
                  const quantity = parseInt(document.getElementById('eb_qty').value) || editingBatch.quantity
                  const purchasePriceUSD = parseFloat(document.getElementById('eb_price').value) || null
                  const entryUsdRate = parseFloat(document.getElementById('eb_rate').value) || null
                  const paymentStatus = document.getElementById('eb_status').value
                  const dueDate = ebDueDate || null
                   const promoRaw = document.getElementById('eb_promo').value.trim()
                  const promoDiscount = promoRaw !== '' && !isNaN(parseFloat(promoRaw)) && parseFloat(promoRaw) > 0
                    ? parseFloat(promoRaw)
                    : null
                  const promoNote = document.getElementById('eb_promo_note').value || null
                  const notes = document.getElementById('eb_notes').value || null
                  const totalUSD = purchasePriceUSD ? purchasePriceUSD * quantity : null
                  const totalUZS_atEntry = totalUSD && entryUsdRate ? totalUSD * entryUsdRate : null

                  // Dastlabki to'lov
                  const initPaidUSD = parseFloat(document.getElementById('eb_paid_usd')?.value) || 0
                  const initPaidRate = parseFloat(document.getElementById('eb_paid_rate')?.value) || entryUsdRate || 0
                  const initPaidDate = ebPaidDate || new Date().toISOString().split('T')[0]
                  const initPaidType = document.getElementById('eb_paid_type')?.value || 'cash_uzs'

                  const hasInitPayment = initPaidUSD > 0 && initPaidRate > 0 && !editingBatch.payments?.length
                  const initPayment = hasInitPayment ? [{
                    id: 'pay' + Date.now(),
                    date: initPaidDate,
                    amountUSD: initPaidUSD,
                    usdRate: initPaidRate,
                    amountUZS: initPaidUSD * initPaidRate,
                    type: initPaidType,
                    note: 'Dastlabki to\'lov',
                  }] : editingBatch.payments || []

                  const newPaidUSD = hasInitPayment ? initPaidUSD : (editingBatch.paidUSD || 0)
                  const newDebtUSD = totalUSD ? Math.max(0, totalUSD - newPaidUSD) : editingBatch.debtUSD

                  try {
                    const saved = await updateBatch(editingBatch.id, {
                      supplierId, quantity, purchasePriceUSD,
                      purchasePrice: purchasePriceUSD && entryUsdRate ? purchasePriceUSD * entryUsdRate : null,
                      entryUsdRate, paymentStatus, dueDate,
                      promoDiscount, promoNote, notes,
                    })
                    setBatches(prev => prev.map(b => b.id === editingBatch.id ? {
                      ...saved,
                      payments: initPayment,
                      paidUSD: newPaidUSD,
                      debtUSD: newDebtUSD,
                      paymentStatus: newDebtUSD === 0 ? 'paid' : newPaidUSD > 0 ? 'partial' : paymentStatus,
                    } : b))
                  } catch (err) {
                    alert(err?.response?.data?.error || err?.message || 'Saqlashda xato')
                    return
                  }
                  setEditingBatch(null)
                }}
                className="w-full py-4 bg-accent-blue text-white rounded-2xl font-syne font-extrabold text-lg hover:opacity-90 transition-all"
              >
                {t('inc_save_btn')}
              </button>
            </motion.div>
          </div>
        )}

        {editingPayment && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setEditingPayment(null) }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-secondary border border-border rounded-[2.5rem] p-8 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-syne font-extrabold text-text-primary">{t('inc_edit_payment_title')}</h3>
                <button onClick={() => setEditingPayment(null)} className="p-2 text-text-muted hover:text-text-primary"><X size={24} /></button>
              </div>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">Summa (USD)</label>
                  <input type="number"
                    value={editingPayment.payment.amountUSD}
                    onChange={e => setEditingPayment(ep => ({ ...ep, payment: { ...ep.payment, amountUSD: parseFloat(e.target.value) || 0, amountUZS: (parseFloat(e.target.value) || 0) * ep.payment.usdRate } }))}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">USD Kursi</label>
                  <input type="number"
                    value={editingPayment.payment.usdRate}
                    onChange={e => setEditingPayment(ep => ({ ...ep, payment: { ...ep.payment, usdRate: parseFloat(e.target.value) || 0, amountUZS: ep.payment.amountUSD * (parseFloat(e.target.value) || 0) } }))}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">To'lov usuli</label>
                  <select
                    value={editingPayment.payment.type}
                    onChange={e => setEditingPayment(ep => ({ ...ep, payment: { ...ep.payment, type: e.target.value } }))}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue"
                  >
                    <option value="cash_uzs">Naqd (UZS)</option>
                    <option value="cash_usd">Naqd (USD)</option>
                    <option value="transfer">Bank o'tkazma</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('col_note')}</label>
                  <input
                    value={editingPayment.payment.note}
                    onChange={e => setEditingPayment(ep => ({ ...ep, payment: { ...ep.payment, note: e.target.value } }))}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <div className="bg-bg-tertiary rounded-xl p-3 text-center">
                  <p className="text-xs text-text-muted">UZS ekvivalenti</p>
                  <p className="text-lg font-extrabold text-accent-blue">{formatPrice(editingPayment.payment.amountUZS)} {som}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setBatches(prev => prev.map(b => {
                    if (b.id !== editingPayment.batchId) return b
                    const newPayments = b.payments.map(p => p.id === editingPayment.payment.id ? editingPayment.payment : p)
                    const newPaidUSD = newPayments.reduce((s, p) => s + p.amountUSD, 0)
                    const newDebtUSD = Math.max(0, b.totalUSD - newPaidUSD)
                    const newStatus = newDebtUSD === 0 ? 'paid' : newPaidUSD > 0 ? 'partial' : 'unpaid'
                    return { ...b, payments: newPayments, paidUSD: newPaidUSD, debtUSD: newDebtUSD, paymentStatus: newStatus }
                  }))
                  setEditingPayment(null)
                }}
                className="w-full py-4 bg-accent-blue text-white rounded-2xl font-syne font-extrabold hover:opacity-90 transition-all"
              >
                {t('inc_save_btn')}
              </button>
            </motion.div>
          </div>
        )}

        {showSupplierDetail && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowSupplierDetail(null) }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-secondary border border-border rounded-[2.5rem] p-8 w-full max-w-5xl max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-syne font-extrabold text-text-primary">{showSupplierDetail.name}</h3>
                  <p className="text-sm text-text-muted">{showSupplierDetail.contractNumber}</p>
                </div>
                <button onClick={() => setShowSupplierDetail(null)} className="p-2 text-text-muted hover:text-text-primary">
                  <X size={24} />
                </button>
              </div>

              {/* Shartnoma holati */}
              {(() => {
                const supplierBatches = batches.filter(b => b.supplierId === showSupplierDetail.id)
                const contractUsed = supplierBatches.reduce((sum, b) => {
                  const activatedAt = showSupplierDetail.contractActivatedAt || null
                  return sum + (b.payments || [])
                    .filter(p => !activatedAt || new Date(p.date) >= new Date(activatedAt))
                    .reduce((ps, p) => ps + p.amountUZS, 0)
                }, 0)
                const contractRemaining = (() => {
                  if (showSupplierDetail.contractStatus === 'pending_completion') {
                    return (showSupplierDetail.pendingRemaining || 0) + (showSupplierDetail.newContractAmount || 0) - contractUsed
                  }
                  return (showSupplierDetail.contractAmount || 0) - contractUsed
                })()
                const contractPct = showSupplierDetail.contractAmount
                  ? Math.min(100, (contractUsed / showSupplierDetail.contractAmount) * 100)
                  : 0

                return (
                  <div className="space-y-6">
                    {/* Shartnoma summary */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-bg-tertiary rounded-2xl p-4 text-center">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-1">{t('col_amount')}</p>
                        <p className="text-lg font-syne font-extrabold text-text-primary">{formatPrice(showSupplierDetail.contractAmount)} {som}</p>
                      </div>
                      <div className="bg-bg-tertiary rounded-2xl p-4 text-center">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-1">{t('inc_supplier_used')}</p>
                        <p className="text-lg font-syne font-extrabold text-accent-orange">{formatPrice(contractUsed)} {som}</p>
                      </div>
                      <div className={`rounded-2xl p-4 text-center ${contractRemaining < 5000000 ? 'bg-accent-red/10' : 'bg-bg-tertiary'}`}>
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-1">{t('inc_contract_rem_label')}</p>
                        <p className={`text-lg font-syne font-extrabold ${contractRemaining < 5000000 ? 'text-accent-red' : 'text-accent-green'}`}>
                          {formatPrice(contractRemaining)} {som}
                        </p>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="h-3 bg-bg-tertiary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${contractPct}%` }}
                          className={`h-full rounded-full ${contractPct > 90 ? 'bg-accent-red' : 'bg-accent-green'}`}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-text-muted">
                        <span>{t('inc_contract_used_pct', { n: contractPct.toFixed(1) })}</span>
                        <span>{t('inc_contract_rem_pct', { n: (100 - contractPct).toFixed(1) })}</span>
                      </div>
                    </div>

                    {/* Shartnomalar arxivi */}
                    {(() => {
                      const contracts = [
                        ...(showSupplierDetail.previousContracts || []),
                      ]
                      const activeContract = {
                        contractNumber: showSupplierDetail.contractNumber,
                        contractAmount: showSupplierDetail.contractAmount,
                        contractStatus: showSupplierDetail.contractStatus || 'active',
                        isPending: showSupplierDetail.contractStatus === 'pending_completion',
                        pendingRemaining: showSupplierDetail.pendingRemaining || 0,
                      }

                      if (contracts.length === 0 && activeContract.contractStatus === 'active' && !activeContract.isPending) return null

                      return (
                        <div>
                          <h4 className="text-xs font-extrabold uppercase tracking-widest text-text-muted mb-3">{t('inc_contracts_title')}</h4>
                          <div className="space-y-3">
                            {/* Joriy shartnoma */}
                            <div className={`border rounded-2xl p-4 flex items-center justify-between ${
                              activeContract.isPending ? 'border-accent-orange/40 bg-accent-orange/5' : 'border-accent-green/40 bg-accent-green/5'
                            }`}>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                                    activeContract.isPending ? 'bg-accent-orange/20 text-accent-orange' : 'bg-accent-green/20 text-accent-green'
                                  }`}>
                                    {activeContract.isPending ? t('inc_contract_ending') : t('mgmt_status_active')}
                                  </span>
                                  <span className="text-sm font-bold text-text-primary">{activeContract.contractNumber}</span>
                                </div>
                                <p className="text-xs text-text-muted">
                                  {t('col_amount')}: {formatPrice(activeContract.contractAmount)} {som}
                                  {activeContract.isPending && ` · ${t('inc_contract_rem_label')}: ${formatPrice(activeContract.pendingRemaining)} ${som}`}
                                </p>
                              </div>
                              {activeContract.isPending && (
                                <button
                                  onClick={async () => {
                                    const archivedAt = new Date().toISOString()
                                    const newActivatedAt = showSupplierDetail.newContractActivatedAt || archivedAt

                                    // Eski shartnoma (pending) davridagi to'lovlarni hisoblash
                                    const supplierBatches = batches.filter(b => b.supplierId === showSupplierDetail.id)
                                    const oldPayments = supplierBatches.flatMap(b =>
                                      (b.payments || []).filter(p => {
                                        const from = showSupplierDetail.contractActivatedAt
                                        return from ? new Date(p.date) >= new Date(from) && new Date(p.date) < new Date(newActivatedAt) : true
                                      })
                                    )
                                    const oldPaidUZS = oldPayments.reduce((s, p) => s + p.amountUZS, 0)
                                    const oldPaidUSD = oldPayments.reduce((s, p) => s + p.amountUSD, 0)

                                    const updated = {
                                      ...showSupplierDetail,
                                      previousContracts: [
                                        ...(showSupplierDetail.previousContracts || []),
                                        {
                                          contractNumber: showSupplierDetail.contractNumber,
                                          contractAmount: showSupplierDetail.contractAmount,
                                          contractStatus: 'completed',
                                          contractActivatedAt: showSupplierDetail.contractActivatedAt || null,
                                          archivedAt,
                                          paidUZS: oldPaidUZS,
                                          paidUSD: oldPaidUSD,
                                          contractFile: showSupplierDetail.contractFile || null,
                                        }
                                      ],
                                      contractNumber: showSupplierDetail.newContractNumber,
                                      contractAmount: showSupplierDetail.newContractAmount,
                                      contractStatus: 'active',
                                      contractActivatedAt: newActivatedAt,
                                      pendingRemaining: 0,
                                      newContractNumber: null,
                                      newContractAmount: null,
                                      newContractActivatedAt: null,
                                    }
                                    const saved = await updateSupplier(showSupplierDetail.id, updated)
                                    setSuppliers(prev => prev.map(s => s.id === saved.id ? saved : s))
                                    setShowSupplierDetail(saved)
                                  }}
                                  className="px-3 py-2 bg-accent-green/20 text-accent-green text-xs font-bold rounded-xl hover:bg-accent-green/30 transition-colors"
                                >
                                  {t('inc_contract_mark_done')}
                                </button>
                              )}
                            </div>

                            {/* Navbatdagi yangi shartnoma — pending holatida */}
                            {activeContract.isPending && showSupplierDetail.newContractNumber && (
                              <div className="border border-accent-blue/40 bg-accent-blue/5 rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-accent-blue/20 text-accent-blue">
                                    {t('inc_contract_pending')}
                                  </span>
                                  <span className="text-sm font-bold text-text-primary">{showSupplierDetail.newContractNumber}</span>
                                </div>
                                <p className="text-xs text-text-muted">
                                  {t('col_amount')}: {formatPrice(showSupplierDetail.newContractAmount)} {som}
                                </p>
                                <p className="text-xs text-text-muted mt-1">
                                  {t('inc_pending_contract_note', { amount: formatPrice(showSupplierDetail.pendingRemaining), som })}
                                </p>
                              </div>
                            )}

                            {/* Arxiv shartnomalar */}
                            {contracts.map((c, idx) => (
                              <div key={idx} className="border border-border rounded-2xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-bg-tertiary text-text-muted">
                                      {t('inc_contract_archive')}
                                    </span>
                                    <span className="text-sm font-bold text-text-secondary">{c.contractNumber || '—'}</span>
                                  </div>
                                  {c.contractFile && (
                                    <button
                                      onClick={() => window.open(c.contractFile, '_blank')}
                                      className="text-xs text-accent-blue hover:underline flex items-center gap-1"
                                    >
                                      {t('inc_view_file')}
                                    </button>
                                  )}
                                </div>
                                <div className="grid grid-cols-3 gap-3 text-center">
                                  <div className="bg-bg-tertiary rounded-xl py-2">
                                    <p className="text-[10px] text-text-muted">{t('col_amount')}</p>
                                    <p className="text-xs font-bold text-text-secondary">{formatPrice(c.contractAmount)} {som}</p>
                                  </div>
                                  <div className="bg-bg-tertiary rounded-xl py-2">
                                    <p className="text-[10px] text-text-muted">{t('inc_paid_uzs')}</p>
                                    <p className="text-xs font-bold text-accent-green">{formatPrice(c.paidUZS || 0)} {som}</p>
                                  </div>
                                  <div className="bg-bg-tertiary rounded-xl py-2">
                                    <p className="text-[10px] text-text-muted">{t('inc_paid_usd')}</p>
                                    <p className="text-xs font-bold text-accent-blue">${(c.paidUSD || 0).toFixed(0)}</p>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-text-muted">
                                  {c.contractActivatedAt && (
                                    <span>{t('inc_contract_started')}: {new Date(c.contractActivatedAt).toLocaleDateString('uz-UZ')}</span>
                                  )}
                                  {c.archivedAt && (
                                    <span>{t('inc_contract_archived')}: {new Date(c.archivedAt).toLocaleDateString('uz-UZ')}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })()}

                    {/* To'lovlar tarixi */}
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-widest text-text-muted mb-3">{t('inc_payments_history')}</h4>
                      <div className="bg-bg-tertiary border border-border rounded-2xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-bg-secondary text-text-muted">
                            <tr>
                              <th className="px-4 py-3">{t('col_product')}</th>
                              <th className="px-4 py-3">{t('col_date')}</th>
                              <th className="px-4 py-3">{t('inc_paid_usd')}</th>
                              <th className="px-4 py-3">{t('col_rate')}</th>
                              <th className="px-4 py-3">UZS</th>
                              <th className="px-4 py-3">{t('inc_pay_method')}</th>
                              <th className="px-4 py-3">{t('inc_debt_remaining')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                              {supplierBatches.map(b => {
                                const paidUZS = b.payments?.reduce((s, p) => s + p.amountUZS, 0) || 0;
                                const paymentMethods = b.payments && b.payments.length > 0
                                  ? Array.from(new Set(b.payments.map(p => {
                                      if (p.type === 'cash_uzs') return t('inc_pay_cash_uzs');
                                      if (p.type === 'cash_usd') return t('inc_pay_cash_usd');
                                      return t('inc_pay_transfer_short');
                                    }))).join(', ')
                                  : '—';
                                return (
                                  <tr key={b.id} className="hover:bg-bg-secondary/50">
                                    <td className="px-4 py-3 font-medium text-text-primary">{b.productName}</td>
                                    <td className="px-4 py-3 text-text-muted">
                                      {b.payments && b.payments.length > 0
                                        ? [...b.payments].sort((a,x)=>(a.date||'').localeCompare(x.date||'')).slice(-1)[0]?.date
                                        : new Date(b.receivedAt).toLocaleDateString('uz-UZ')}
                                    </td>
                                    <td className="px-4 py-3 font-bold text-text-primary">
                                      {b.paidUSD > 0 ? `$${b.paidUSD}` : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-text-muted">{formatPrice(b.entryUsdRate)}</td>
                                    <td className="px-4 py-3 text-text-primary">
                                      {paidUZS > 0 ? `${formatPrice(paidUZS)} ${som}` : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="bg-bg-secondary px-2 py-0.5 rounded text-[10px] uppercase">
                                        {paymentMethods}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className={`text-xs font-bold ${b.debtUSD > 0 ? 'text-accent-red' : 'text-accent-green'}`}>
                                        {b.debtUSD > 0 ? `$${b.debtUSD}` : t('inc_debt_paid_full')}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                              {supplierBatches.length === 0 && (
                                <tr><td colSpan="7" className="px-4 py-6 text-center text-text-muted">{t('inc_no_batches')}</td></tr>
                              )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </motion.div>
          </div>
        )}
        {contractDialog && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg-secondary border border-border rounded-[2rem] p-8 w-full max-w-md shadow-glow-red"
            >
              <h3 className="text-xl font-syne font-extrabold text-text-primary mb-2">
                Eski shartnoma qoldig'i
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                Joriy shartnomada <span className="font-bold text-accent-orange">
                  {formatPrice(contractDialog.contractRemaining)} {som}
                </span> qolgan.
              </p>
              <div className="bg-bg-tertiary rounded-2xl p-4 mb-6 space-y-2 text-sm">
                <p className="text-text-secondary">
                  <span className="font-bold text-accent-blue">Ha</span> — Eski qoldiq yangi shartnomaga qo'shiladi. Keyingi to'lovlar avval eski shartnomadan ayiriladi.
                </p>
                <p className="text-text-secondary">
                  <span className="font-bold text-accent-red">Yo'q</span> — Eski shartnoma shu zahoti bajarildi deb belgilanadi. Qoldiq hisobga olinmaydi.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={async () => {
                    const activatedAt = new Date().toISOString()
                    // Eski shartnoma davridagi to'lovlarni hisoblash
                    const supplierBatches = batches.filter(b => b.supplierId === contractDialog.supplier?.id)
                    const oldContractPayments = supplierBatches.flatMap(b =>
                      (b.payments || []).filter(p => {
                        const prevActivatedAt = contractDialog.supplier?.contractActivatedAt
                        if (!prevActivatedAt) return true
                        return new Date(p.date) >= new Date(prevActivatedAt)
                      })
                    )
                    const oldContractPaidUZS = oldContractPayments.reduce((s, p) => s + p.amountUZS, 0)
                    const oldContractPaidUSD = oldContractPayments.reduce((s, p) => s + p.amountUSD, 0)

                    const data = {
                      ...contractDialog.baseData,
                      previousContracts: [
                        ...(contractDialog.supplier?.previousContracts || []),
                        {
                          contractNumber: contractDialog.supplier?.contractNumber,
                          contractAmount: contractDialog.supplier?.contractAmount,
                          contractStatus: 'completed',
                          contractActivatedAt: contractDialog.supplier?.contractActivatedAt || null,
                          archivedAt: activatedAt,
                          paidUZS: oldContractPaidUZS,
                          paidUSD: oldContractPaidUSD,
                          contractFile: contractDialog.supplier?.contractFile || null,
                        }
                      ],
                      contractNumber: contractDialog.newContractNumber || contractDialog.supplier?.contractNumber,
                      contractAmount: contractDialog.newContractAmount || contractDialog.supplier?.contractAmount,
                      contractStatus: 'active',
                      contractActivatedAt: activatedAt,
                      pendingRemaining: 0,
                      newContractNumber: null,
                      newContractAmount: null,
                    }
                    const saved = await updateSupplier(contractDialog.supplier.id, data)
                    setSuppliers(prev => prev.map(s => s.id === saved.id ? saved : s))
                    setContractDialog(null)
                    setEditingSupplier(null)
                  }}
                  className="py-3 bg-accent-red/10 border border-accent-red/30 text-accent-red rounded-2xl font-bold hover:bg-accent-red/20 transition-colors"
                >
                  Yo'q — Qoldiqni e'tiborsiz qoldirish
                </button>
                <button
                  onClick={async () => {
                    const activatedAt = new Date().toISOString()
                    const data = {
                      ...contractDialog.baseData,
                      previousContracts: contractDialog.supplier?.previousContracts || [],
                      contractStatus: 'pending_completion',
                      contractActivatedAt: contractDialog.supplier?.contractActivatedAt || null,
                      pendingRemaining: contractDialog.contractRemaining,
                      newContractNumber: contractDialog.newContractNumber,
                      newContractAmount: contractDialog.newContractAmount,
                      newContractActivatedAt: activatedAt,
                    }
                    const saved = await updateSupplier(contractDialog.supplier.id, data)
                    setSuppliers(prev => prev.map(s => s.id === saved.id ? saved : s))
                    setContractDialog(null)
                    setEditingSupplier(null)
                  }}
                  className="py-3 bg-accent-green/10 border border-accent-green/30 text-accent-green rounded-2xl font-bold hover:bg-accent-green/20 transition-colors"
                >
                  Ha — Qoldiqni yangi shartnomaga o'tkazish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>

      {editingBatch && ebFsOpen && (() => {
        const imgs = productImages[String(editingBatch.productId)] || []
        return createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center" onClick={() => setEbFsOpen(false)}>
            <button onClick={() => setEbFsOpen(false)} className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"><X size={20} /></button>
            {imgs.length > 1 && (
              <>
                <button onClick={e => { e.stopPropagation(); setEbImgIdx(i => (i - 1 + imgs.length) % imgs.length) }} className="absolute left-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"><ChevronLeft size={22} /></button>
                <button onClick={e => { e.stopPropagation(); setEbImgIdx(i => (i + 1) % imgs.length) }} className="absolute right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"><ChevronRight size={22} /></button>
              </>
            )}
            <div className="bg-[#f4f4f5] rounded-2xl p-3 shadow-2xl" onClick={e => e.stopPropagation()}>
              <img src={imgs[ebImgIdx]} alt="" className="max-w-[85vw] max-h-[82vh] object-contain block rounded-xl" />
            </div>
            {imgs.length > 1 && (
              <div className="absolute bottom-5 flex gap-1.5">
                {imgs.map((img, i) => (
                  <button key={i} onClick={e => { e.stopPropagation(); setEbImgIdx(i) }} className={`w-12 h-9 rounded-lg overflow-hidden border-2 transition-all ${i === ebImgIdx ? 'border-white' : 'border-white/20 opacity-50 hover:opacity-80'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>,
          document.body
        )
      })()}
    </motion.div>
  )
}

export default Income
