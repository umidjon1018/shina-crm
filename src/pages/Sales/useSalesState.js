import { matchPeriod } from '../../utils/period'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import { toast, errorText } from '../../components/ui/Toast'
import { useAuthStore } from '../../store/authStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useNotificationStore } from '../../store/notificationStore'
import { useCartStore } from '../../store/cartStore'
import { useDataStore } from '../../store/dataStore'
import { useShopStore } from '../../store/shopStore'
import { useSaleFormStore } from '../../store/saleFormStore'
import { getReturns, addReturn } from '../../api/returnService'
import { getCustomers, addCustomer, getCustomerLoyalty } from '../../api/customerService'
import { findItemByBarcode as findItemByBarcodeAPI, getItems } from '../../api/itemService'
import {
  getUsedStock, getUsedSales, createUsedSale, cancelUsedSale, addUsedStockFromTradeIn
} from '../../api/usedService'
import { getSaleProfit, getUsedSaleProfit } from '../../utils/profitHelpers'
import {
  getSales, createSale as apiCreateSale, cancelSale as apiCancelSale, makeInstallmentPayment, getBulkStock
} from '../../api/salesService'
import { makeUsedInstallmentPayment } from '../../api/usedService'
import { enqueueAction } from '../../utils/offlineQueue'
import { getPromotions } from '../../api/promotionService'
import { resolveCode } from '../../api/marketingService'
import { getUdsStatus, findUdsCustomer, getPaymentProviders } from '../../api/integrationService'
import { evaluatePromotions } from '../../utils/promoEngine'
import { getIncomeBatches } from '../../api/incomeService'
import { getProducts } from '../../api/productService'
import { getReservedItemIds } from '../../api/reservationService'
import { productTitle } from '../../utils/format'
import { getFiscalPublic } from '../../api/fiscalService'

const hasPerm = (role, perm) => {
  const PERMISSIONS = {
    admin:   ['sales.view','sales.create','sales.cancel','sales.discount_small','sales.discount_medium','sales.discount_large','sales.return'],
    manager: ['sales.view','sales.create','sales.cancel','sales.discount_small','sales.discount_medium','sales.return'],
    seller:  ['sales.view','sales.create','sales.cancel','sales.discount_small'],
  }
  return (PERMISSIONS[role] || []).includes(perm)
}

const isPrivileged = (role) => role === 'admin' || role === 'manager'

export const useSalesState = () => {
  const { user } = useAuthStore()
  const barcodeSelectClass = user?.role === 'admin' ? '' : 'select-none'
  const { t } = useTranslation()
  const { addNotification, notifications, updateNotification, sendDiscountRequest } = useNotificationStore()
  const { bump } = useDataStore()

  const getItemBarcode = useCallback(() => '—', [])
  const { sources, productCategories, installmentOrganizations, loyaltyMinAmount, loyaltyVisitsRequired, silverVisits, notificationSettings, discountSmallMax, discountMediumMax, loyaltyDiscountPercent, companyName, productAttributeDefs } = useSettingsStore()
  const { selectedShopId } = useShopStore()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(
    new URLSearchParams(location.search).get('tab') || location.state?.tab || 'new_sale'
  )
  const [shopPickCallback, setShopPickCallback] = useState(null)
  const requireShop = (cb) => {
    if (selectedShopId !== 'all') { cb(selectedShopId) }
    else { setShopPickCallback(() => cb) }
  }

  const thisMonth = new Date().toISOString().substring(0, 7)
  
  // Cart Store (Zustand)
  const { cartItems, addToCart, removeFromCart, clearCart, updateSalePrice, isBundleSale: cartIsBundleSale, setIsBundleSale: setCartIsBundleSale, bulkLines, setBulkLine, removeBulkLine } = useCartStore()

  // Sale Form Store — navigatsiyadan keyin ham saqlanadi (localStorage)
  const {
    selectedCustomer, setSelectedCustomer,
    discountPercent, setDiscountPercent,
    loyaltyDiscountApplied, setLoyaltyDiscountApplied,
    paymentType, setPaymentType,
    cardType, setCardType,
    source, setSource,
    installmentOrgId, setInstallmentOrgId,
    installmentTermMonths, setInstallmentTermMonths,
    contractNumber, setContractNumber,
    tradeInItems, setTradeInItems,
    resetForm,
  } = useSaleFormStore()

  const [allCustomers, setAllCustomers] = useState([])
  const [salesList, setSalesList] = useState([])
  const [returnsList, setReturnsList] = useState([])
  const [loadingSales, setLoadingSales] = useState(false)
  const [loadingReturns, setLoadingReturns] = useState(false)

  // Fetch sales, customers, and returns
  const fetchData = useCallback(() => {
    setLoadingSales(true)
    getSales(selectedShopId).then(res => {
      setSalesList(res)
      setLoadingSales(false)
    })
    getCustomers().then(setAllCustomers)
    setLoadingReturns(true)
    getReturns().then(res => {
      setReturnsList(res)
      setLoadingReturns(false)
    })
  }, [selectedShopId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Miqdorli (kg, litr) tovarlar — tanlangan do'kon qoldig'i
  const { version: dataVersion } = useDataStore()
  const [bulkStock, setBulkStock] = useState([])
  useEffect(() => {
    getBulkStock(selectedShopId).then(setBulkStock).catch(() => setBulkStock([]))
  }, [selectedShopId, dataVersion])

  // Faol aksiyalar
  const [activePromos, setActivePromos] = useState([])
  const [batchPromos, setBatchPromos] = useState([]) // promoPassToCustomer = true bo'lgan batchlar
  useEffect(() => {
    getPromotions().then(list => setActivePromos(list.filter(p => p.isActive))).catch(() => {})
    getIncomeBatches().then(list => {
      setBatchPromos(list.filter(b => b.promoPassToCustomer && b.promoDiscount > 0))
    }).catch(() => {})
  }, [])

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successSale, setSuccessSale] = useState(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '+998', birthDate: '', instagram: '', carModel: '' })
  const [priceWarnings, setPriceWarnings] = useState({})
  
  // Permission & Cancel Modals
  const [pinModal, setPinModal] = useState(null) // { discount, requiredRole }
  const [pendingDiscountReqId, setPendingDiscountReqId] = useState(null) // kutayotgan so'rov ID
  // Boshqaruvchi tasdiqlagan so'rov — sotuv bilan serverga yuboriladi (server chegarani shu bilan o'tkazadi)
  const [approvedDiscountReq, setApprovedDiscountReq] = useState(null)

  // Pending chegirma so'rovini kuzatish — approved yoki rejected bo'lsa react qilish
  useEffect(() => {
    if (!pendingDiscountReqId) return
    const req = notifications.find(n => n.id === pendingDiscountReqId)
    if (!req) return
    if (req.status === 'approved') {
      setDiscountPercent(req.requestedDiscount)
      setApprovedDiscountReq({ id: req.serverId, discount: req.requestedDiscount })
      setPendingDiscountReqId(null)
      toast(i18n.t('sl_dreq_approved', { discount: req.requestedDiscount }))
    } else if (req.status === 'rejected') {
      setDiscountPercent(discountSmallMax || 0)
      setPendingDiscountReqId(null)
      toast(i18n.t('sl_dreq_rejected'), 'error')
    }
  }, [notifications, pendingDiscountReqId, discountSmallMax])
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelReason, setCancelReason] = useState('narx_mos_emas')
  const [refundType, setRefundType] = useState('money')

  const [contractFile, setContractFile] = useState(null)
  const contractFileRef = useRef(null)

  // B/U Sotuv tab states
  const [usedStockList, setUsedStockList] = useState([])
  const [usedSalesList, setUsedSalesList] = useState([])
  const [buCart, setBuCart] = useState([]) // [{ usedStockId, name, category, acquiredPrice, sellPrice }]
  const [buGroupQty, setBuGroupQty] = useState({})
  const [buSearch, setBuSearch] = useState('')
  const [buAttrFilters, setBuAttrFilters] = useState({})
  const [buScrapMode, setBuScrapMode] = useState(false)
  const [buScrapSelected, setBuScrapSelected] = useState([])
  const [buScrapCategory, setBuScrapCategory] = useState('all')
  const [buSelectedCustomer, setBuSelectedCustomer] = useState(null)
  const [buCustomerSearch, setBuCustomerSearch] = useState('')
  const [buShowNewCustomerModal, setBuShowNewCustomerModal] = useState(false)
  const [buDiscountPercent, setBuDiscountPercent] = useState(0)
  const [buPaymentType, setBuPaymentType] = useState('cash')
  const [buCardType, setBuCardType] = useState(null)
  const [buSource, setBuSource] = useState('walk_in')
  const [buInstallmentOrgId, setBuInstallmentOrgId] = useState('')
  const [buInstallmentTermMonths, setBuInstallmentTermMonths] = useState(3)
  const [buContractNumber, setBuContractNumber] = useState('')
  const [buIsSubmitting, setBuIsSubmitting] = useState(false)
  const [buSuccessSale, setBuSuccessSale] = useState(null)

  const getInstallmentStatusMap = useMemo(() => {
    const map = {}
    const _sales = selectedShopId === 'all' ? salesList : salesList.filter(s => s.shopId === selectedShopId)
    _sales.forEach(s => {
      if (s.paymentType === 'installment') {
        const paid = s.installmentPaidAmount ?? 0
        const debt = s.installmentDebt ?? Math.max(0, s.total - paid)
        const status = debt <= 0 ? 'paid' : (paid > 0 ? 'partial' : 'pending')
        map[s.id] = { status, paidAmount: paid, debtAmount: debt }
      }
    })
    usedSalesList.forEach(s => {
      if (s.paymentType === 'installment') {
        const paid = s.installmentPaidAmount ?? 0
        const debt = s.installmentDebt ?? Math.max(0, s.total - paid)
        const status = debt <= 0 ? 'paid' : (paid > 0 ? 'partial' : 'pending')
        map[s.id] = { status, paidAmount: paid, debtAmount: debt }
      }
    })
    return map
  }, [salesList, usedSalesList, selectedShopId])

  const fetchUsedData = useCallback(() => {
    getUsedStock().then(setUsedStockList)
    getUsedSales().then(setUsedSalesList)
  }, [])

  useEffect(() => {
    fetchUsedData()
  }, [fetchUsedData])

  // Returns tab state
  const [returnMode, setReturnMode] = useState('refund') // 'refund' | 'exchange'
  const [returnLinkCust, setReturnLinkCust] = useState({ name: '', phone: '+998' }) // Bekor tabida yangi mijoz
  const [returnLinkConfirm, setReturnLinkConfirm] = useState(null) // { customer } — tasdiq kutish
  const [returnCustomer, setReturnCustomer] = useState(null)
  const [returnSale, setReturnSale] = useState(null)
  const [returnItems, setReturnItems] = useState([])
  const [returnQtyMap, setReturnQtyMap] = useState({})
  const [returnPaymentMethod, setReturnPaymentMethod] = useState('cash')
  const [returnReason, setReturnReason] = useState('')
  const [returnBarcodeQuery, setReturnBarcodeQuery] = useState('')
  const [exchangeBarcode, setExchangeBarcode] = useState('')
  const [exchangeItems, setExchangeItems] = useState([])
  
  // Custom Alert Modal state
  const [alertModal, setAlertModal] = useState(null)

  // Installment tab stats modal state
  const [detailedOrg, setDetailedOrg] = useState(null)
  const [orgMonthFilter, setOrgMonthFilter] = useState('all')
  const [payoutAmount, setPayoutAmount] = useState('')
  const [selectedPayoutSaleId, setSelectedPayoutSaleId] = useState(null)
  const [payoutSuccess, setPayoutSuccess] = useState(false)
  const [installmentSearch, setInstallmentSearch] = useState('')
  const [installmentTypeFilter, setInstallmentTypeFilter] = useState('all')
  const [inlinePaySaleId, setInlinePaySaleId] = useState(null)
  const [inlinePayAmount, setInlinePayAmount] = useState('')
  const [inlinePaySuccess, setInlinePaySuccess] = useState(false)
  const [customerPayModal, setCustomerPayModal] = useState(null) // { customerId, customerName }
  const [customerPayAmount, setCustomerPayAmount] = useState('')
  const [customerPaySaleId, setCustomerPaySaleId] = useState(null)
  const [customerPaySuccess, setCustomerPaySuccess] = useState(false)

  // Paginations page states
  const [historyPage, setHistoryPage] = useState(1)
  const [returnsHistoryPage, setReturnsHistoryPage] = useState(1)
  const [installmentSalesPage, setInstallmentSalesPage] = useState(1)
  const [profitPage, setProfitPage] = useState(1)

  // Filtering & Sorting states
  const [historyMonthFilter, setHistoryMonthFilter] = useState('all')
  const [historySortField, setHistorySortField] = useState('soldAt')
  const [historySortOrder, setHistorySortOrder] = useState('desc')

  const [returnsMonthFilter, setReturnsMonthFilter] = useState('all')
  const [returnsHistoryMonthFilter, setReturnsHistoryMonthFilter] = useState('all')
  const [returnsSortField, setReturnsSortField] = useState('returnedAt')
  const [returnsSortOrder, setReturnsSortOrder] = useState('desc')

  const [profitMonthFilter, setProfitMonthFilter] = useState('all')
  const [profitTypeFilter, setProfitTypeFilter] = useState('all')
  const [profitSearch, setProfitSearch] = useState('')
  const [profitSortField, setProfitSortField] = useState('soldAt')
  const [profitSortOrder, setProfitSortOrder] = useState('desc')

  const [installmentMonthFilter, setInstallmentMonthFilter] = useState('all')
  const [installmentSortField, setInstallmentSortField] = useState('soldAt')
  const [installmentSortOrder, setInstallmentSortOrder] = useState('desc')

  useEffect(() => {
    if (returnSale) {
      const qMap = {}
      returnSale.items?.forEach(it => {
        qMap[it.barcode] = it.qty || 1
      })
      setReturnQtyMap(qMap)
    } else {
      setReturnQtyMap({})
    }
  }, [returnSale])

  const maxDiscount = isPrivileged(user?.role) ? 30 : (discountMediumMax || 15)

  const loyaltyInfoRef = useRef(null)
  // Kassada kiritilgan promokod/vaucher va sovg'a sertifikati
  const [appliedCode, setAppliedCode] = useState(null) // { code, promotionId }
  const [giftCard, setGiftCard] = useState(null) // { code, balance }
  const [codeError, setCodeError] = useState('')
  const [codeChecking, setCodeChecking] = useState(false)
  // UDS va onlayn to'lov (integratsiyalar)
  const [udsEnabled, setUdsEnabled] = useState(false)
  const [fiscalEnabled, setFiscalEnabled] = useState(false)
  const [udsInfo, setUdsInfo] = useState(null) // { code, name, points, maxPoints }
  const [udsPointsInput, setUdsPointsInput] = useState('')
  const [onlineProviders, setOnlineProviders] = useState([])
  const [onlinePayment, setOnlinePayment] = useState(null) // { id, provider }
  useEffect(() => {
    getUdsStatus().then(s => setUdsEnabled(!!s.enabled)).catch(() => {})
    getFiscalPublic().then(s => setFiscalEnabled(!!s.enabled)).catch(() => {})
    getPaymentProviders().then(setOnlineProviders).catch(() => {})
  }, [])

  const applyCode = async (raw) => {
    const code = String(raw || '').trim()
    if (!code) return false
    setCodeChecking(true); setCodeError('')
    // UDS kodi — 6 xonali raqam
    if (udsEnabled && /^\d{6}$/.test(code)) {
      try {
        const u = await findUdsCustomer(code, Math.round(total))
        setUdsInfo(u); setUdsPointsInput('')
        setCodeChecking(false)
        return true
      } catch {}
    }
    try {
      const r = await resolveCode(code, selectedCustomer?.id)
      if (r.type === 'gift_card') setGiftCard({ code: r.code, balance: r.balance })
      else setAppliedCode({ code: r.code, promotionId: String(r.promotionId) })
      return true
    } catch (e) {
      setCodeError(e?.response?.data?.error || "Kod topilmadi")
      return false
    } finally {
      setCodeChecking(false)
    }
  }
  const clearMarketing = () => { setAppliedCode(null); setGiftCard(null); setCodeError(''); setUdsInfo(null); setUdsPointsInput(''); setOnlinePayment(null) }

  // Avtomatik aksiyalar (yetkazib beruvchi chegirmasi mijozga uzatilgan partiyalar ham aksiya sifatida)
  const promoResult = useMemo(() => {
    const batchAsPromos = batchPromos.map(b => ({
      id: `batch_${b.id}`, name: 'Aksiya', kind: 'discount', targetType: 'product', targetIds: [String(b.productId)],
      discountType: 'percent', discountValue: b.promoDiscount, isActive: true, conditions: {}, shopId: 'all', stackable: false,
    }))
    return evaluatePromotions({
      cart: cartItems,
      promos: [...activePromos, ...batchAsPromos],
      ctx: { shopId: selectedShopId, customer: selectedCustomer, paymentType, customerPurchases: loyaltyInfoRef.current?.totalPurchases || 0 },
      codePromos: appliedCode ? { [appliedCode.promotionId]: appliedCode.code } : {},
    })
  }, [activePromos, batchPromos, cartItems, selectedShopId, selectedCustomer, paymentType, appliedCode])
  const promoDiscount = promoResult.totalReduction
  const codeIgnored = !!appliedCode && !promoResult.applied.some(a => a.code === appliedCode.code)

  // Sodiqlik (serverdan): jamg'arma chegirma darajasi, keshbek foizi, balans
  const [loyaltyInfo, setLoyaltyInfo] = useState(null)
  loyaltyInfoRef.current = loyaltyInfo
  const [useBalance, setUseBalance] = useState(false)
  const [balanceInput, setBalanceInput] = useState('')
  useEffect(() => {
    setLoyaltyInfo(null); setUseBalance(false); setBalanceInput('')
    if (!selectedCustomer?.id) return
    let alive = true
    getCustomerLoyalty(selectedCustomer.id).then(info => {
      if (!alive) return
      setLoyaltyInfo(info)
      setLoyaltyDiscountApplied(info.discountPercent > 0)
    }).catch(() => {})
    return () => { alive = false }
  }, [selectedCustomer?.id])

  const loyaltyTierPercent = loyaltyInfo?.discountPercent || 0
  const loyaltyActive = loyaltyDiscountApplied && loyaltyTierPercent > 0 && paymentType !== 'installment'
  // Qo'shilmaydigan aksiya qo'llangan bo'lsa — qo'lda/sodiqlik chegirmasi berilmaydi
  const effectiveDiscount = promoResult.blocksManualDiscount ? 0 : (loyaltyActive ? loyaltyTierPercent : discountPercent)
  const customerHasLoyalty = loyaltyTierPercent > 0

  // Calculations
  const bulkSubtotal = bulkLines.reduce((acc, l) => acc + Math.round(l.qty * l.unitPrice), 0)
  const subtotal = cartItems.reduce((acc, c) => {
    const price = (c.salePrice !== null && c.salePrice !== undefined)
      ? c.salePrice
      : c.product.cashPrice
    return acc + price
  }, 0) + bulkSubtotal

  const afterPromo = subtotal - promoDiscount
  const discountAmount = afterPromo * effectiveDiscount / 100
  const total = afterPromo - discountAmount
  const customerBalance = loyaltyInfo?.balance || 0
  const balanceUsed = (useBalance && paymentType !== 'installment' && customerBalance > 0)
    ? Math.max(0, Math.min(Math.round(Number(balanceInput) || 0), Math.floor(customerBalance), Math.round(total)))
    : 0
  const giftCardUsed = (giftCard && paymentType !== 'installment')
    ? Math.max(0, Math.min(Math.floor(giftCard.balance), Math.round(total) - balanceUsed))
    : 0
  const udsPointsUsed = (udsInfo && paymentType !== 'installment')
    ? Math.max(0, Math.min(Math.round(Number(udsPointsInput) || 0), Math.floor(udsInfo.maxPoints || 0), Math.round(total) - balanceUsed - giftCardUsed))
    : 0
  const payable = Math.max(0, Math.round(total) - balanceUsed - giftCardUsed - udsPointsUsed)
  const cashbackPreview = (paymentType !== 'installment' && (loyaltyInfo?.cashbackPercent || 0) > 0 && payable > 0 && payable >= (loyaltyInfo?.cashbackMinSale || 0))
    ? Math.round(payable * loyaltyInfo.cashbackPercent / 100)
    : 0

  // Savat: bir xil mahsulotning keyingi ombordan itemini qo'shish
  const addNextItemOfProduct = async (product) => {
    try {
      const [items, reserved] = await Promise.all([getItems({ productId: product.id, status: 'in_stock' }), getReservedItemIds()])
      const available = items.filter(i => !cartItems.some(c => c.item.id === i.id) && !reserved.has(String(i.id)))
      if (!available.length) {
        addNotification({
          type: 'OUT_OF_STOCK', severity: 'warning',
          title: "Omborda qolmadi",
          message: `"${product.name}" omborda boshqa dona qolmadi!`
        })
        return
      }
      const nextItem = available[0]
      addToCart({
        item: nextItem,
        product: { ...product, purchasePrice: nextItem.purchasePrice ?? product.purchasePrice },
        warning: nextItem.barcodeStatus === 'active' ? 'not_printed' : null
      })
    } catch {}
  }

  // Savat: guruhdagi barcha itemlar narxini umumiy summadan taqsimlash
  const updateGroupSalePrice = (productId, totalPrice) => {
    const groupItems = cartItems.filter(c => c.product.id === productId)
    const n = groupItems.length
    if (!n) return
    const base = Math.floor(totalPrice / n)
    const extra = totalPrice - base * n
    groupItems.forEach((c, i) => {
      updateSalePrice(c.item.id, base + (i < extra ? 1 : 0))
    })
  }

  const addBundleToCart = useCallback(async (bundle) => {
    const params = selectedShopId && selectedShopId !== 'all' ? { shopId: selectedShopId } : {}
    const [allItems, allProducts] = await Promise.all([getItems(params), getProducts()])
    const currentCartIds = new Set(cartItems.map(c => c.item.id))
    let addedCount = 0

    for (const { productId, qty: quantity } of (bundle.bundleItems || [])) {
      const product = allProducts.find(p => String(p.id) === String(productId))
      if (!product) continue
      // ID bo'yicha topilmasa, bir xil nomli barcha productlar itemlarini ham qo'shish
      const sameNameIds = new Set(
        allProducts.filter(p => p.name === product.name).map(p => String(p.id))
      )
      const available = allItems.filter(i =>
        sameNameIds.has(String(i.productId)) &&
        i.status === 'in_stock' &&
        i.barcode !== null &&
        !currentCartIds.has(i.id)
      ).slice(0, quantity)

      for (const it of available) {
        const itProduct = allProducts.find(p => String(p.id) === String(it.productId)) || product
        const added = addToCart({ item: it, product: itProduct, bundleId: 'p' + bundle.id, bundleName: bundle.name })
        if (added) {
          currentCartIds.add(it.id)
          addedCount++
        }
      }
    }

    if (addedCount === 0) {
      addNotification({
        type: 'OUT_OF_STOCK', severity: 'warning',
        title: 'Tovar yetarli emas',
        message: `"${bundle.name}" komplekti uchun barcoded tovar topilmadi`,
      })
    } else {
      setCartIsBundleSale(true)
    }
  }, [selectedShopId, cartItems, addToCart, addNotification, setCartIsBundleSale])

  const removeBundleFromCart = useCallback((bundleId) => {
    cartItems.filter(c => c.bundleId === bundleId).forEach(c => removeFromCart(c.item.id))
  }, [cartItems, removeFromCart])

  // Eski tovar qabul qilish (trade-in) helpers
  const addTradeInRow = () => {
    setTradeInItems(prev => [...prev, {
      id: Date.now() + Math.random(),
      name: '',
      category: productCategories[0]?.id || 'tire',
      qty: 1,
      price: 0,
      replacedProductId: cartItems[0]?.product.id || '',
    }])
  }
  const updateTradeInRow = (idx, patch) => {
    setTradeInItems(prev => prev.map((ti, i) => i === idx ? { ...ti, ...patch } : ti))
  }
  const removeTradeInRow = (idx) => {
    setTradeInItems(prev => prev.filter((_, i) => i !== idx))
  }
  const tradeInTotal = tradeInItems.reduce((acc, ti) => acc + (Number(ti.price) || 0) * (Number(ti.qty) || 1), 0)

  const handleSubmitSale = async () => {
    if (cartItems.length === 0 && bulkLines.length === 0) return
    if (paymentType === 'installment' && !installmentOrgId) return
    if (tradeInItems.length > 0) {
      const incomplete = tradeInItems.some(ti =>
        !ti.name.trim() ||
        !(Number(ti.qty) > 0) ||
        !(Number(ti.price) > 0) ||
        (cartItems.length > 0 && !ti.replacedProductId)
      )
      if (incomplete) {
        alert("Eski tovar maydonlarini to'liq kiriting (nomi, kategoriya, soni, summasi, o'rniga olingan tovar)")
        return
      }
    }
    // Minimal narx (6-qaror): qo'lda berilgan foizli chegirma narxni minimal narxdan pastga tushirsa — boshqaruvchi tasdig'i
    if (user?.role !== 'admin' && user?.role !== 'manager' && effectiveDiscount > 0 && !loyaltyActive) {
      const approved = approvedDiscountReq && effectiveDiscount <= approvedDiscountReq.discount
      const below = cartItems.some(c => {
        const base = promoResult.lines.get(c.item.id)?.base ?? c.salePrice ?? c.product.cashPrice
        const floor = Math.max(c.product.minSalePrice || 0, paymentType === 'installment' ? (c.product.installmentBasePrice || 0) : 0)
        return floor > 0 && base * (1 - effectiveDiscount / 100) < floor - 1
      })
      if (below && !approved) {
        toast(i18n.t('sl_min_price_need_approval'), 'error')
        setPinModal({ discount: effectiveDiscount, requiredRole: effectiveDiscount > (discountMediumMax || 10) ? 'admin' : 'manager' })
        return
      }
    }
    requireShop(async (shopId) => {
    setIsSubmitting(true)
    const isNewCustomer = !selectedCustomer?.id ||
      (selectedCustomer.visitDates && selectedCustomer.visitDates.length === 0) ||
      (!selectedCustomer.visitDates && (!selectedCustomer.visits || selectedCustomer.visits.length === 0))

    const selectedOrg = installmentOrganizations.find(o => o.id === installmentOrgId)
    const commissionPercent = selectedOrg?.commissionPercent || 0
    const commissionAmount = paymentType === 'installment' ? Math.round(total * (commissionPercent / 100)) : 0

    // Komplekt chegirmasi — aksiya mexanizmidan (narxlar ichida; hisobotlarda ko'rsatish uchun alohida)
    const bundleDiscountAmount = promoResult.applied.filter(a => a.kind === 'bundle').reduce((acc, a) => acc + Math.round(a.amount), 0)

    const salePayload = {
      id: `SALE-${Date.now()}`,
      items: cartItems.map(c => ({
        itemId:    c.item.id,
        barcode:   c.item.barcode,
        productId: c.product.id,
        name:      c.product.name,
        salePrice: promoResult.lines.get(c.item.id)?.price ?? c.salePrice ?? c.product.cashPrice,
        // Aksiyadan oldingi narx (savdolashilgan yoki birinchi aytilgan) — server minimal narxni shu bilan tekshiradi
        basePrice: promoResult.lines.get(c.item.id)?.base ?? c.salePrice ?? c.product.cashPrice,
        cashPrice: c.product.cashPrice,
        purchasePrice: c.product.purchasePrice ?? 0,
        qty: 1,
        bundleId: c.bundleId ?? null,
        bundleName: c.bundleName ?? null,
      })),
      bulkItems: bulkLines.map(l => ({ productId: l.productId, qty: l.qty, price: l.unitPrice })),
      customerId: selectedCustomer?.id || null,
      customerName: selectedCustomer?.name || 'Noma\'lum',
      paymentType: onlinePayment ? 'card' : paymentType,
      installmentMonths: paymentType === 'installment' ? installmentTermMonths : null,
      installmentTermMonths: paymentType === 'installment' ? installmentTermMonths : null,
      installmentOrgId: paymentType === 'installment' ? installmentOrgId : null,
      installmentOrgName: paymentType === 'installment' ? (selectedOrg?.name || '') : '',
      installmentCommissionPercent: paymentType === 'installment' ? commissionPercent : 0,
      installmentCommissionAmount: commissionAmount,
      installmentExpectedPayments: [], // keyinchalik to'ldiriladi
      installmentDebt: paymentType === 'installment' ? total : 0,
      installmentPaidAmount: 0,
      installmentDueDate: (() => {
        if (paymentType !== 'installment') return null
        const d = new Date()
        if (installmentTermMonths < 1) {
          // Kunlik: 0.25 = 7 kun, 0.5 = 15 kun
          d.setDate(d.getDate() + Math.floor(installmentTermMonths * 30))
        } else {
          // Oylik: kalendar bo'yicha setMonth
          d.setMonth(d.getMonth() + Math.round(installmentTermMonths))
        }
        return d.toISOString().split('T')[0]
      })(),
      discount: effectiveDiscount,
      loyaltyDiscountApplied: loyaltyActive,
      discountRequestId: approvedDiscountReq && effectiveDiscount > 0 && effectiveDiscount <= approvedDiscountReq.discount ? approvedDiscountReq.id : null,
      balanceUsed,
      promoCode: appliedCode && !codeIgnored ? appliedCode.code : null,
      promoDetails: promoResult.applied.map(a => ({ promoId: String(a.promoId), name: a.name, kind: a.kind, amount: a.amount, code: a.code })),
      promoDiscountAmount: promoDiscount,
      giftCardCode: giftCardUsed > 0 ? giftCard.code : null,
      udsCode: udsInfo ? udsInfo.code : null,
      udsPoints: udsPointsUsed,
      onlinePaymentId: onlinePayment ? onlinePayment.id : null,
      giftCardUsed,
      bundleDiscountAmount,
      isBundle: cartIsBundleSale || bundleDiscountAmount > 0,
      subtotal,
      total,
      soldAt: new Date().toISOString(),
      shopId,
      soldBy: user?.id,
      soldByName: (user?.fullName || user?.name || user?.username || 'Xodim'),
      contractNumber: paymentType === 'transfer' ? contractNumber : null,
      contractFileName: paymentType === 'transfer' ? contractFile?.name || null : null,
      cardType: onlinePayment ? onlinePayment.provider : (paymentType === 'card' ? cardType : null),
      source: source,
      isNewCustomer: isNewCustomer,
      profit: cartItems.reduce((acc, c) => {
        const salePrice = c.salePrice ?? c.product.cashPrice
        const purchasePrice = c.product.purchasePrice ?? 0
        return acc + (salePrice - purchasePrice)
      }, 0) - (subtotal * discountPercent / 100),
    }

    try {
      const res = await apiCreateSale(salePayload)

      if (res) {
        // Avval UI tozalash — trade-in/visit xatosi UI ni bloklamamasligi uchun
        const capturedTradeIns = [...tradeInItems]
        const capturedCustomer = selectedCustomer
        const capturedCartItems = [...cartItems]
        setSuccessSale(res)
        clearCart()
        resetForm()
        clearMarketing()
        setApprovedDiscountReq(null)
        setContractFile(null)
        fetchData()
        bump()

        // Barkod chop etilmagan holda sotilgan itemlar ogohlantirishi
        if (notificationSettings?.BARCODE_NOT_PRINTED !== false) {
          capturedCartItems.forEach(ci => {
            if (ci.item?.barcodeStatus === 'active') {
              addNotification({
                type: 'BARCODE_NOT_PRINTED',
                severity: 'warning',
                title: `${(user?.fullName || user?.name || user?.username || 'Xodim')} tomonidan: Barkod chop etilmagan`,
                message: `"${productTitle(ci.product?.brand, ci.product?.name)}" (${ci.item.barcode}) barkodi chop etilmagan holda sotuvga qo'shildi`,
                titleKey: 'notif_title_barcode_not_printed',
                messageKey: 'notif_msg_barcode_not_printed',
                messageParams: { name: productTitle(ci.product?.brand, ci.product?.name), barcode: ci.item.barcode },
                productId: ci.product?.id,
                productName: productTitle(ci.product?.brand, ci.product?.name),
                barcode: ci.item.barcode,
                itemId: ci.item.id,
                sellerId: user?.id,
                sellerName: user?.fullName || user?.name || user?.username,
              })
            }
          })
        }

        // Mijoz kiritilmagan sotuv ogohlantirishi
        if (!capturedCustomer?.id && notificationSettings?.SALE_NO_CUSTOMER !== false) {
          addNotification({
            type: 'SALE_NO_CUSTOMER',
            severity: 'warning',
            title: `${(user?.fullName || user?.name || user?.username || 'Xodim')} tomonidan: Mijoz ma'lumotisiz sotuv`,
            message: `${(user?.fullName || user?.name || user?.username || 'Xodim')} tomonidan noma'lum mijozga sotuv amalga oshirildi (${res?.id})`,
            titleKey: 'notif_title_sale_no_customer',
            messageKey: 'notif_msg_sale_no_customer',
            messageParams: { seller: (user?.fullName || user?.name || user?.username || 'Xodim'), id: res?.id },
            sellerId: user?.id,
            sellerName: user?.fullName || user?.name || user?.username,
          })
        }

        // Eski tovar (trade-in) — alohida, xatosi UI ni bloklamas
        const validTradeIns = capturedTradeIns.filter(ti => ti.name.trim() && (Number(ti.qty) || 0) > 0)
        if (validTradeIns.length > 0) {
          Promise.all(validTradeIns.map(ti => {
            const category = productCategories.find(c => c.id === ti.category)
            const replacedCartItems = capturedCartItems.filter(c => c.product.id === ti.replacedProductId)
            const replacedProductName = replacedCartItems[0]?.product.name || null
            const qty = Number(ti.qty) || 1
            const baseCtx = {
              saleId: res?.id,
              replacedProductId: ti.replacedProductId || null,
              replacedProductName,
              customerId: capturedCustomer?.id || null,
              customerName: capturedCustomer?.name || "Noma'lum",
              employeeId: user?.id,
              employeeName: (user?.fullName || user?.name || user?.username || 'Xodim'),
              shopId: selectedShopId,
              acquiredAt: new Date().toISOString(),
            }
            // Agar cart itemlar soni bilan trade-in qty mos bo'lsa — 1-1 barcode mapping
            if (replacedCartItems.length >= qty) {
              return Promise.all(replacedCartItems.slice(0, qty).map(cartItem =>
                addUsedStockFromTradeIn([{
                  name: ti.name.trim(), category: ti.category,
                  categoryLabel: category?.label || '', qty: 1,
                  acquiredPrice: Number(ti.price) || 0,
                }], { ...baseCtx, replacedItemBarcode: cartItem.item.barcode || null })
              ))
            }
            return addUsedStockFromTradeIn([{
              name: ti.name.trim(), category: ti.category,
              categoryLabel: category?.label || '', qty,
              acquiredPrice: Number(ti.price) || 0,
            }], { ...baseCtx, replacedItemBarcode: null })
          })).then(() => { fetchUsedData(); bump() }).catch(() => {})
        }
      }
    } catch (e) {
      if (!e?.response) {
        // Internet yo'q — sotuv navbatga yoziladi, internet qaytganda avtomatik yuboriladi
        if (tradeInItems.some(ti => ti.name?.trim())) {
          setAlertModal({ title: t('sl_off_title'), message: t('sl_off_tradein') })
        } else {
          try {
            await enqueueAction({ type: 'CREATE_SALE', payload: salePayload })
            clearCart()
            resetForm()
            setContractFile(null)
            fetchData()
            bump()
            setAlertModal({ title: t('sl_off_title'), message: t('sl_off_queued', { total: Math.round(total).toLocaleString('uz-UZ') }) })
          } catch {
            setAlertModal({ title: 'Xatolik', message: t('sl_off_queue_err') })
          }
        }
      } else {
        setAlertModal({ title: 'Xatolik', message: e?.response?.data?.error || 'Xatolik yuz berdi' })
      }
    } finally {
      setIsSubmitting(false)
    }
    }) // requireShop end
  }

  const handleDiscountChange = (val) => {
    if (loyaltyDiscountApplied) return
    const v = Number(val)
    const smallMax = discountSmallMax || 5
    const medMax = discountMediumMax || 15

    if (v <= smallMax) {
      setDiscountPercent(v)
      return
    }
    // O'z huquqi bilan bera olsa — to'g'ridan qo'yadi
    if (v <= medMax && hasPerm(user.role, 'sales.discount_medium')) {
      setDiscountPercent(v)
      return
    }
    if (v > medMax && hasPerm(user.role, 'sales.discount_large')) {
      setDiscountPercent(v)
      return
    }
    // Ruxsat kerak — modal ochiladi
    const requiredRole = v > medMax ? 'admin' : 'manager'
    setPinModal({ discount: v, requiredRole })
  }

  const handleSendDiscountRequest = async () => {
    if (!pinModal) return
    const subtotal = cartItems.reduce((s, c) => s + (c.product?.cashPrice || 0) * (c.quantity || 1), 0)
    const seller = user?.fullName || user?.name || user?.username || 'Xodim'
    const { discount, requiredRole } = pinModal
    setPinModal(null)
    try {
      const req = await sendDiscountRequest({
        status: 'pending',
        title: `${discount}% chegirma so'rovi`,
        message: `${seller} ${discount}% chegirma so'radi`,
        titleKey: 'notif_title_discount_request',
        titleParams: { discount },
        messageKey: 'notif_msg_discount_request',
        messageParams: { seller, discount },
        sellerName: seller,
        sellerId: user?.id,
        requestedDiscount: discount,
        itemIds: cartItems.map(c => Number(c.item?.id)).filter(Boolean),
        requiredRole,
        shopId: selectedShopId !== 'all' ? selectedShopId : undefined,
        cartSummary: {
          items: cartItems.map(c => ({ name: c.product?.name, qty: c.quantity || 1, price: c.product?.cashPrice })),
          subtotal,
          afterDiscount: Math.round(subtotal * (1 - discount / 100)),
        },
        severity: requiredRole === 'admin' ? 'error' : 'warning',
      })
      setPendingDiscountReqId(req.id)
      toast(i18n.t('sl_dreq_sent'))
    } catch (e) {
      toast(errorText(e), 'error')
    }
  }

  const handleCancelSale = (sale) => {
    setCancelModal({ sale })
    setCancelReason('narx_mos_emas')
    setRefundType('money')
  }

  const executeCancelSale = async (sale, cancelReason, refundType) => {
    await apiCancelSale(sale.id, cancelReason)

    if (sale.customerId) {
      const customer = allCustomers.find(c => c.id === sale.customerId)
      if (customer && customer.visits) {
        const saleDate = new Date(sale.soldAt)
        const visitIndex = customer.visits.findIndex(v => {
          const [d, m, y] = v.date.split('.')
          const visitDate = new Date(`${y}-${m}-${d}`)
          return Math.abs(visitDate - saleDate) < 24 * 60 * 60 * 1000
        })
        if (visitIndex !== -1) {
          customer.visits.splice(visitIndex, 1)
        }
      }
    }
    
    // Bekor qilishda ham mijoz yo'q bo'lsa ogohlantirish
    if (!sale.customerId && notificationSettings?.SALE_NO_CUSTOMER !== false) {
      addNotification({
        type: 'SALE_NO_CUSTOMER',
        severity: 'warning',
        title: `${(user?.fullName || user?.name || user?.username || 'Xodim')} tomonidan: Mijoz ma'lumotisiz sotuv bekor`,
        message: `${(user?.fullName || user?.name || user?.username || 'Xodim')} tomonidan noma'lum mijoz sotuvini bekor qildi (${sale.id})`,
        titleKey: 'notif_title_sale_no_customer_cancel',
        messageKey: 'notif_msg_sale_no_customer_cancel',
        messageParams: { seller: (user?.fullName || user?.name || user?.username || 'Xodim'), id: sale.id },
        sellerId: user?.id,
        sellerName: user?.fullName || user?.name || user?.username,
      })
    }
    setSuccessSale(null)
    setCancelModal(null)
    fetchData()
    bump()
  }

  // Barcode and Customer lookup inside Returns Tab
  const handleLeftItemFound = ({ item, product }) => {
    if (!item) return
    const sale = salesList.find(s => s.items.some(it => it.barcode === item.barcode) && s.status !== 'cancelled')
    if (!sale) {
      setAlertModal({
        title: "Topilmadi",
        message: "Bu tovar bo'yicha faol sotuv tarixi topilmadi!"
      })
      return
    }
    const customer = allCustomers.find(c => c.id === sale.customerId) || { id: 'Noma\'lum', name: sale.customerName || 'Noma\'lum' }
    setReturnCustomer(customer)
    setReturnSale(sale)
    setReturnPaymentMethod(sale.paymentType === 'installment' ? 'cash' : sale.paymentType)
    
    const saleItemObj = sale.items.find(it => it.barcode === item.barcode)
    if (saleItemObj) {
      setReturnItems(prev => {
        if (prev.some(x => x.barcode === saleItemObj.barcode)) return prev
        return [...prev, saleItemObj]
      })
    }
  }

  const handleSelectSaleItem = (row) => {
    const sale = row.sale
    const customer = allCustomers.find(c => c.id === sale.customerId) || { id: 'Noma\'lum', name: sale.customerName || 'Noma\'lum' }
    setReturnCustomer(customer)
    setReturnSale(sale)
    setReturnPaymentMethod(sale.paymentType === 'installment' ? 'cash' : sale.paymentType)
    
    const saleItemObj = sale.items?.find(it => it.id === row.itemId || it.barcode === row.barcode)
    if (saleItemObj) {
      setReturnItems(prev => {
        if (prev.some(x => x.barcode === saleItemObj.barcode)) return prev
        return [...prev, saleItemObj]
      })
    }
  }

  const handleRightScanOrSearch = ({ item, product }) => {
    if (!item || !product) return
    setExchangeItems(prev => {
      // Har bir item o'z barkodi bilan alohida qator — bir xil barkod ikki marta qo'shilmasin
      if (prev.some(e => e.item.id === item.id)) return prev
      return [...prev, { item, product, qty: 1 }]
    })
  }

  const lookupReturnBarcode = async () => {
    if (!returnBarcodeQuery.trim()) return
    const result = await findItemByBarcodeAPI(returnBarcodeQuery.trim())
    const matchedItem = result?.item
    if (!matchedItem || matchedItem.status !== 'sold') {
      setAlertModal({ title: "Xatolik", message: "Sotilgan tovarlar ichidan bunday barkod topilmadi!" })
      return
    }
    handleLeftItemFound({ item: matchedItem })
    setReturnBarcodeQuery('')
  }

  const lookupExchangeBarcode = async () => {
    if (!exchangeBarcode.trim()) return
    const result = await findItemByBarcodeAPI(exchangeBarcode.trim())
    if (!result || result.item.status !== 'in_stock') {
      setAlertModal({ title: "Xatolik", message: "Omborda mavjud bo'lgan bunday barkod topilmadi!" })
      return
    }
    handleRightScanOrSearch({ item: result.item, product: result.product })
    setExchangeBarcode('')
  }

  const handleReturnSubmit = async () => {
    if (!returnSale || returnItems.length === 0) return
    if (returnSale.paymentType === 'installment') {
      setAlertModal({
        title: "Taqiqlangan",
        message: "Muddatli to'lov bilan sotilgan tovarlar qaytarib olinmaydi!"
      })
      return
    }

    const refundGross = Math.round(returnItems.reduce((sum, item) => sum + (item.salePrice || 0) * (returnQtyMap[item.barcode] || 1), 0) * (1 - (returnSale.discount || 0) / 100))
    // Sotuvning balansdan to'langan ulushi naqd emas, mijoz balansiga qaytadi (backend yozadi)
    const toBalance = returnSale.balanceUsed > 0 && returnSale.total > 0
      ? Math.min(returnSale.balanceUsed, Math.round(returnSale.balanceUsed * refundGross / returnSale.total)) : 0
    const refundVal = refundGross - toBalance
    const exchangeVal = returnMode === 'exchange' && exchangeItems.length > 0
      ? exchangeItems.reduce((sum, e) => sum + e.product.cashPrice, 0)
      : 0
    const diff = exchangeVal - refundVal

    const returnPayload = {
      originalSaleId: returnSale.id,
      customerId: returnCustomer.id || 'Noma\'lum',
      customerName: returnCustomer.name || 'Noma\'lum',
      type: returnMode,
      returnedItems: returnItems.map(it => ({
        productId: it.productId,
        name: it.name || it.productName || 'Tovar',
        barcode: it.barcode,
        salePrice: it.salePrice,
        qty: returnQtyMap[it.barcode] || 1
      })),
      exchangedForItems: returnMode === 'exchange' && exchangeItems.length > 0
        ? exchangeItems.map(e => ({
            productId: e.product.id,
            name: e.product.name,
            barcode: e.item.barcode,
            salePrice: e.product.cashPrice,
            qty: e.qty
          }))
        : [],
      refundAmount: returnMode === 'refund' ? refundVal : (diff < 0 ? Math.abs(diff) : 0),
      additionalPayment: returnMode === 'exchange' && diff > 0 ? diff : 0,
      paymentMethod: returnPaymentMethod,
      soldAt: returnSale.soldAt || null,
      soldBy: returnSale.soldBy || null,
      soldByName: returnSale.soldByName || '',
      processedBy: user.id,
      processedByName: (user?.fullName || user?.name || user?.username || 'Xodim'),
      returnReason: returnReason.trim() || null,
      status: 'completed',
      shopId: returnSale.shopId || selectedShopId || 'shop1'
    }

    try {

      await addReturn(returnPayload)
      setAlertModal({
        title: "Muvaffaqiyatli",
        message: "Qaytarish/Almashtirish muvaffaqiyatli yakunlandi!"
      })
      // Clear returns state
      setReturnCustomer(null)
      setReturnSale(null)
      setReturnItems([])
      setExchangeItems([])
      setReturnReason('')
      fetchData()
      bump()
    } catch (e) {
      setAlertModal({
        title: "Xatolik",
        message: "Amalni bajarishda xatolik yuz berdi!"
      })
    }
  }

  // Installment detailed payout trigger
  const handleOrgPayoutSubmit = async () => {
    const amt = Number(payoutAmount)
    if (!amt || amt <= 0) {
      alert("To'g'ri summa kiriting!")
      return
    }
    const employeeName = user?.fullName || user?.name || user?.username || "Noma'lum"
    const paymentRecord = { amount: 0, date: new Date().toISOString(), employeeName }

    const applyPayment = (sale, paying) => {
      sale.installmentPaidAmount = (sale.installmentPaidAmount || 0) + paying
      sale.installmentDebt = (sale.installmentDebt ?? sale.total) - paying
      if (sale.installmentDebt <= 0) { sale.installmentDebt = 0; sale.status = 'completed' }
      if (!sale.installmentPayments) sale.installmentPayments = []
      sale.installmentPayments.push({ ...paymentRecord, amount: paying, date: new Date().toISOString() })
    }

    const payForSale = (s, amount) => s.isUsedSale
      ? makeUsedInstallmentPayment(s.id, amount)
      : makeInstallmentPayment(s.id, amount)

    const allInstallmentSales = [
      ...salesList,
      ...usedSalesList.map(s => ({ ...s, isUsedSale: true })),
    ]

    if (selectedPayoutSaleId) {
      const sale = allInstallmentSales.find(s => s.id === selectedPayoutSaleId)
      if (sale) {
        const paying = Math.min(amt, sale.installmentDebt ?? sale.total)
        await payForSale(sale, paying)
      }
    } else {
      let remainingPayout = amt
      const orgSales = allInstallmentSales
        .filter(s => s.paymentType === 'installment' && s.status !== 'cancelled' && (s.installmentOrgId === detailedOrg.id || (!s.installmentOrgId && detailedOrg.id === 'oddiy_nasiya')))
        .filter(s => (s.installmentDebt ?? s.total) > 0)
        .sort((a, b) => new Date(a.soldAt) - new Date(b.soldAt))
      for (const s of orgSales) {
        if (remainingPayout <= 0) break
        const paying = Math.min(remainingPayout, s.installmentDebt ?? s.total)
        remainingPayout -= paying
        await payForSale(s, paying)
      }
    }

    setPayoutAmount('')
    setSelectedPayoutSaleId(null)
    setPayoutSuccess(true)
    setTimeout(() => setPayoutSuccess(false), 4000)
    fetchData()
    fetchUsedData()
    bump()
  }

  const handleInlinePaySubmit = async (sale) => {
    const amt = Number(inlinePayAmount)
    if (!amt || amt <= 0) return
    const paying = Math.min(amt, sale.installmentDebt ?? sale.total)
    await makeInstallmentPayment(sale.id, paying)
    setInlinePayAmount('')
    setInlinePaySaleId(null)
    setInlinePaySuccess(sale.id)
    setTimeout(() => setInlinePaySuccess(false), 3000)
    fetchData()
    bump()
  }

  const handleCustomerPaySubmit = async () => {
    const amt = Number(customerPayAmount)
    if (!amt || amt <= 0) return

    const customerSales = salesList
      .filter(s => s.paymentType === 'installment' && s.status !== 'cancelled' && s.customerId === customerPayModal.customerId)
      .filter(s => (s.installmentDebt ?? s.total) > 0)
      .sort((a, b) => new Date(a.soldAt) - new Date(b.soldAt))

    if (customerPaySaleId) {
      const sale = customerSales.find(s => s.id === customerPaySaleId)
      if (sale) await makeInstallmentPayment(sale.id, Math.min(amt, sale.installmentDebt ?? sale.total))
    } else {
      let remaining = amt
      for (const s of customerSales) {
        if (remaining <= 0) break
        const paying = Math.min(remaining, s.installmentDebt ?? s.total)
        remaining -= paying
        await makeInstallmentPayment(s.id, paying)
      }
    }
    setCustomerPayAmount('')
    setCustomerPaySaleId(null)
    setCustomerPaySuccess(true)
    setTimeout(() => setCustomerPaySuccess(false), 3000)
    fetchData()
    bump()
  }

  const shopCustomerIds = useMemo(() => {
    if (selectedShopId === 'all') return null
    const ids = new Set()
    salesList.forEach(s => { if (s.customerId && s.shopId === selectedShopId) ids.add(String(s.customerId)) })
    return ids
  }, [salesList, selectedShopId])
  const shopCustomers = selectedShopId === 'all'
    ? allCustomers
    : allCustomers.filter(c => String(c.shopId) === String(selectedShopId) || (shopCustomerIds && shopCustomerIds.has(String(c.id))))

  const filteredCustomers = shopCustomers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  )

  const buFilteredCustomers = shopCustomers.filter(c =>
    c.name.toLowerCase().includes(buCustomerSearch.toLowerCase()) ||
    c.phone.includes(buCustomerSearch)
  )

  // B/U Sotuv — qoldiqdan qidirish (faqat in_stock), bir xil partiyadagilarni guruhlash
  const activeBuAttrFilters = Object.entries(buAttrFilters).filter(([, v]) => v && v !== 'all')
  const buAvailableGroups = (() => {
    const filteredStock = usedStockList.filter(u => {
      if (u.status !== 'in_stock') return false
      if (buCart.find(c => c.usedStockId === u.id)) return false
      if (buSearch && !u.name.toLowerCase().includes(buSearch.toLowerCase())) return false
      if (activeBuAttrFilters.length > 0) {
        const attrs = u.attributes || {}
        if (!activeBuAttrFilters.every(([defId, val]) => attrs[defId] === val)) return false
      }
      return true
    })
    const map = new Map()
    filteredStock.forEach(u => {
      const key = [u.acquiredSaleId, u.name, u.category, u.acquiredPrice].join('|')
      if (!map.has(key)) {
        map.set(key, { key, name: u.name, category: u.category, categoryLabel: u.categoryLabel, acquiredPrice: u.acquiredPrice, items: [u] })
      } else {
        map.get(key).items.push(u)
      }
    })
    return [...map.values()]
  })()

  // Utilizatsiya rejimi — qoldiqdagi (in_stock) barchasini guruhlab, kategoriya bo'yicha filtrlash
  const buScrapAllGroups = (() => {
    const filteredStock = usedStockList.filter(u =>
      u.status === 'in_stock' &&
      !buCart.find(c => c.usedStockId === u.id)
    )
    const map = new Map()
    filteredStock.forEach(u => {
      const key = [u.acquiredSaleId, u.name, u.category, u.acquiredPrice].join('|')
      if (!map.has(key)) {
        map.set(key, { key, name: u.name, category: u.category, categoryLabel: u.categoryLabel, acquiredPrice: u.acquiredPrice, items: [u] })
      } else {
        map.get(key).items.push(u)
      }
    })
    return [...map.values()]
  })()

  const buScrapCategories = (() => {
    const map = new Map()
    buScrapAllGroups.forEach(g => {
      if (!map.has(g.category)) map.set(g.category, g.categoryLabel || g.category)
    })
    return [...map.entries()].map(([id, label]) => ({ id, label }))
  })()

  const buScrapGroups = buScrapCategory === 'all'
    ? buScrapAllGroups
    : buScrapAllGroups.filter(g => g.category === buScrapCategory)

  const buCartGroupKey = (c) => c.scrapBatchId ? `scrap-${c.scrapBatchId}` : [c.name, c.category, c.acquiredPrice].join('|')

  const buCartGroups = (() => {
    const map = new Map()
    buCart.forEach(c => {
      const key = buCartGroupKey(c)
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: c.scrapBatchId ? "Utilizatsiya to'plami" : c.name,
          category: c.category,
          categoryLabel: c.scrapBatchId ? null : c.categoryLabel,
          acquiredPrice: c.acquiredPrice,
          items: [c],
        })
      } else {
        map.get(key).items.push(c)
      }
    })
    return [...map.values()]
  })()

  const buSubtotal = buCart.reduce((acc, c) => acc + (Number(c.sellPrice) || 0), 0)
  const buDiscountAmount = buSubtotal * buDiscountPercent / 100
  const buTotal = buSubtotal - buDiscountAmount

  const buAddToCart = (group, qty) => {
    const n = Math.min(Math.max(1, Number(qty) || 1), group.items.length)
    const toAdd = group.items.slice(0, n).map(stockItem => ({
      usedStockId: stockItem.id,
      name: stockItem.name,
      category: stockItem.category,
      categoryLabel: stockItem.categoryLabel,
      acquiredPrice: stockItem.acquiredPrice,
      sellPrice: stockItem.acquiredPrice,
    }))
    setBuCart(prev => [...prev, ...toAdd])
    setBuGroupQty(prev => ({ ...prev, [group.key]: 1 }))
  }
  const buRemoveGroupFromCart = (groupKey) => {
    setBuCart(prev => prev.filter(c => buCartGroupKey(c) !== groupKey))
  }
  const buSetGroupTotalPrice = (groupKey, totalValue) => {
    const total = Number(totalValue) || 0
    setBuCart(prev => {
      const n = prev.filter(c => buCartGroupKey(c) === groupKey).length
      if (n === 0) return prev
      const base = Math.floor(total / n)
      const remainder = total - base * n
      let idx = 0
      return prev.map(c => {
        if (buCartGroupKey(c) !== groupKey) return c
        const extra = idx < remainder ? 1 : 0
        idx++
        return { ...c, sellPrice: base + extra }
      })
    })
  }

  const buAddScrapToCart = () => {
    if (buScrapSelected.length === 0) return
    const batchId = Date.now()
    const toAdd = buScrapAllGroups
      .filter(g => buScrapSelected.includes(g.key))
      .flatMap(g => g.items.map(stockItem => ({
        usedStockId: stockItem.id,
        name: stockItem.name,
        category: stockItem.category,
        categoryLabel: stockItem.categoryLabel,
        acquiredPrice: stockItem.acquiredPrice,
        sellPrice: 0,
        scrapBatchId: batchId,
      })))
    setBuCart(prev => [...prev, ...toAdd])
    setBuScrapSelected([])
    setBuScrapMode(false)
  }

  const buHandleSubmitSale = async () => {
    if (buCart.length === 0) return
    if (buPaymentType === 'installment' && !buInstallmentOrgId) return

    requireShop(async (shopId) => {
      setBuIsSubmitting(true)

      const selectedOrg = installmentOrganizations.find(o => o.id === buInstallmentOrgId)
      const commissionPercent = selectedOrg?.commissionPercent || 0
      const commissionAmount = buPaymentType === 'installment' ? Math.round(buTotal * (commissionPercent / 100)) : 0

      // 'scrap' — virtual id, bazaga null sifatida yuboriladi
      const realCustomerId = (buSelectedCustomer?.id && buSelectedCustomer.id !== 'scrap')
        ? buSelectedCustomer.id : null
      const realCustomerName = buSelectedCustomer?.id === 'scrap'
        ? 'Utilizatsiya'
        : (buSelectedCustomer?.name || "Noma'lum")

      const salePayload = {
        items: buCart.map(c => ({
          usedStockId: c.usedStockId,
          name: c.name,
          category: c.category,
          categoryLabel: c.categoryLabel,
          acquiredPrice: c.acquiredPrice,
          salePrice: Number(c.sellPrice) || 0,
          qty: 1,
        })),
        shopId,
        customerId: realCustomerId,
        customerName: realCustomerName,
        paymentType: buPaymentType,
        installmentMonths: buPaymentType === 'installment' ? buInstallmentTermMonths : null,
        installmentTermMonths: buPaymentType === 'installment' ? buInstallmentTermMonths : null,
        installmentOrgId: buPaymentType === 'installment' ? buInstallmentOrgId : null,
        installmentOrgName: buPaymentType === 'installment' ? (selectedOrg?.name || '') : '',
        installmentCommissionPercent: buPaymentType === 'installment' ? commissionPercent : 0,
        installmentCommissionAmount: commissionAmount,
        installmentDebt: buPaymentType === 'installment' ? buTotal : 0,
        installmentPaidAmount: 0,
        installmentDueDate: (() => {
          if (buPaymentType !== 'installment') return null
          const d = new Date()
          if (buInstallmentTermMonths < 1) {
            d.setDate(d.getDate() + Math.floor(buInstallmentTermMonths * 30))
          } else {
            d.setMonth(d.getMonth() + Math.round(buInstallmentTermMonths))
          }
          return d.toISOString().split('T')[0]
        })(),
        discount: buDiscountPercent,
        subtotal: buSubtotal,
        total: buTotal,
        soldBy: user?.id,
        soldByName: (user?.fullName || user?.name || user?.username || 'Xodim'),
        contractNumber: buPaymentType === 'transfer' ? buContractNumber : null,
        source: buSource,
        cardType: buPaymentType === 'card' ? buCardType : null,
      }

      try {
        const res = await createUsedSale(salePayload)
        if (res.success) {
          if (!realCustomerId && notificationSettings?.SALE_NO_CUSTOMER !== false) {
            addNotification({
              type: 'SALE_NO_CUSTOMER',
              severity: 'warning',
              title: `${(user?.fullName || user?.name || user?.username || 'Xodim')} tomonidan: Mijoz ma'lumotisiz sotuv`,
              message: `${(user?.fullName || user?.name || user?.username || 'Xodim')} tomonidan noma'lum mijozga B/U sotuv amalga oshirildi`,
              titleKey: 'notif_title_sale_no_customer',
              messageKey: 'notif_msg_sale_no_customer_bu',
              messageParams: { seller: (user?.fullName || user?.name || user?.username || 'Xodim'), id: res?.sale?.id },
              sellerId: user?.id,
              sellerName: user?.fullName || user?.name || user?.username,
            })
          }
          setBuSuccessSale(res.sale)
          setTimeout(() => setBuSuccessSale(null), 5000)
          setBuCart([])
          setBuSelectedCustomer(null)
          setBuDiscountPercent(0)
          setBuPaymentType('cash')
          setBuInstallmentOrgId('')
          setBuInstallmentTermMonths(3)
          setBuContractNumber('')
          setBuSource('walk_in')
          fetchUsedData()
          bump()
        }
      } catch (e) {
        setAlertModal({ title: 'Xatolik', message: e?.response?.data?.error || 'Xatolik yuz berdi' })
      } finally {
        setBuIsSubmitting(false)
      }
    })
  }

  // Filtered lists for pagination
  // Uzbek months and helper functions for filtering/sorting
  const formatMonthValue = (val) => {
    if (val === 'all') return t('filter_all');
    const [y, m] = val.split('-');
    return `${t('rep_month_' + parseInt(m))} ${y}`;
  };

  const getMonthOptions = (dates) => {
    const months = new Set();
    dates.forEach(d => {
      if (!d) return;
      const date = new Date(d);
      if (isNaN(date.getTime())) return;
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      months.add(`${y}-${m}`);
    });
    return ['all', ...Array.from(months).sort().reverse()];
  };

  const sortData = (data, field, order) => {
    return [...data].sort((a, b) => {
      let valA = a[field];
      let valB = b[field];

      if (field === 'soldAt' || field === 'returnedAt') {
        valA = new Date(valA || 0).getTime();
        valB = new Date(valB || 0).getTime();
      } else if (
        field === 'customerName' ||
        field === 'exchangedForItemName' ||
        field === 'name' ||
        field === 'itemsNames' ||
        field === 'barcode' ||
        field === 'category' ||
        field === 'soldByName' ||
        field === 'installmentOrgName' ||
        field === 'installmentStatus' ||
        field === 'paymentTypeLabel' ||
        field === 'statusLabel' ||
        field === 'paymentMethodLabel' ||
        field === 'source' ||
        field === 'categoryLabel' ||
        field === 'paymentType' ||
        field === 'status' ||
        field === 'type'
      ) {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
      } else if (
        field === 'total' ||
        field === 'refundAmount' ||
        field === 'profit' ||
        field === 'salePrice' ||
        field === 'purchasePrice' ||
        field === 'qty' ||
        field === 'additionalPayment' ||
        field === 'installmentTermMonths' ||
        field === 'installmentCommissionPercent' ||
        field === 'installmentCommissionAmount' ||
        field === 'totalSale'
      ) {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
      }

      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const baseSalesForHistory = selectedShopId === 'all' ? salesList : salesList.filter(s => s.shopId === selectedShopId);

  const historyMonthOptions = getMonthOptions(baseSalesForHistory.map(s => s.soldAt));
  const filteredSalesForHistory = baseSalesForHistory.filter(s => matchPeriod(s.soldAt, historyMonthFilter));

  // 2. Returns History Month and Sorting Calculations
  const shopReturnsList = useMemo(() =>
    selectedShopId === 'all' ? returnsList : returnsList.filter(r => !r.shopId || String(r.shopId) === String(selectedShopId)),
    [returnsList, selectedShopId]
  )

  const enrichedSalesForHistory = useMemo(() => {
    // Aktiv komplektlarni localStorage dan o'qiymiz (sinxron)
    const activeBundles = (() => {
      try { return JSON.parse(localStorage.getItem('shina_crm_bundles') || '[]').filter(b => b.isActive) }
      catch { return [] }
    })()
    // Barcha sotuvlardagi productId → name xaritasini quramiz (duplicate tovarlar uchun)
    const productIdToName = {}
    filteredSalesForHistory.forEach(sale => {
      (sale.items || []).forEach(it => {
        if (it.productId && (it.productName || it.name)) {
          productIdToName[String(it.productId)] = (it.productName || it.name).trim()
        }
      })
    })

    return [...filteredSalesForHistory].map(s => {
      const firstItem = s.items?.[0];
      const catLabel = (() => { const _c = productCategories.find(c => c.id === firstItem?.productCategory); return _c ? t('cat_' + _c.id, { defaultValue: _c.label }) : (firstItem?.productCategory || '—') })();
      const firstBarcode = firstItem?.barcode || '—';
      const itemsNames = s.items?.map(i => i.name || 'Tovar').join(', ') || '—';
      const qty = s.items?.reduce((sum, it) => sum + (it.qty || 1), 0) || 0;

      const bundleItemsDiscount = s.items?.reduce((acc, it) => {
        if (it.bundleId != null && it.salePrice < it.cashPrice) {
          return acc + Math.max(0, Math.round((it.cashPrice - it.salePrice) * (it.qty || 1)))
        }
        return acc
      }, 0) || 0
      const bundleDiscountAmount = s.bundleDiscountAmount || bundleItemsDiscount
      // Sale mahsulotlari nomi (Set)
      const saleNames = new Set((s.items || []).map(it => (it.productName || it.name || '').trim()).filter(Boolean))
      // Biron aktiv bundle ga mos kelishini nom bo'yicha tekshir
      const matchedBundle = activeBundles.find(bundle =>
        bundle.products?.length > 0 &&
        bundle.products.every(bp => {
          const bpName = productIdToName[String(bp.productId)]
          return bpName ? saleNames.has(bpName) : false
        })
      )
      const isBundle = s.isBundle || bundleDiscountAmount > 0 || !!(s.items?.some(it => it.bundleId != null)) || !!matchedBundle
      // Bundle discount summasi: DB dan kelgan yoki bundle foizi bo'yicha hisoblangan
      const saleItemsTotal = (s.items || []).reduce((acc, it) => acc + (it.price || 0), 0)
      const effectiveBundleDiscount = bundleDiscountAmount > 0
        ? bundleDiscountAmount
        : (matchedBundle?.discount > 0
            ? Math.round(saleItemsTotal * matchedBundle.discount / (100 - matchedBundle.discount))
            : 0)

      return {
        ...s,
        itemsNames,
        barcode: firstBarcode,
        category: isBundle ? 'Komplekt' : catLabel,
        isBundle,
        bundleDiscountAmount: effectiveBundleDiscount,
        bundleDiscountPercent: matchedBundle?.discount || 0,
        qty,
        paymentTypeLabel: s.paymentType === 'cash' ? t('pay_cash') : s.paymentType === 'card' ? t('pay_card') : s.paymentType === 'installment' ? t('pay_installment') : t('sl_hist_pay_bank'),
        statusLabel: s.status === 'completed' && s._isExchange ? t('sl_hist_status_exchanged')
          : s.status === 'completed' ? t('col_done')
          : (s.status === 'active' || s.status === 'pending') ? (
              (s.installmentDebt > 0 && s.installmentPaidAmount >= s.installmentDebt)
                ? t('col_done')
                : (s.installmentPaidAmount > 0)
                  ? t('sl_status_partial')
                  : t('sl_status_nasiya')
            )
          : (s.cancelReason === 'exchange' || s.cancelReason === 'almashtirish') ? t('sl_hist_status_exchanged')
          : t('sl_hist_status_cancelled')
      };
    });
  }, [filteredSalesForHistory, productCategories, shopReturnsList]);

  const sortedSalesForHistory = useMemo(() => {
    return sortData(enrichedSalesForHistory, historySortField, historySortOrder);
  }, [enrichedSalesForHistory, historySortField, historySortOrder]);

  const returnsMonthOptions = getMonthOptions(shopReturnsList.map(r => r.returnedAt));
  const filteredReturnsHistory = shopReturnsList.filter(r => matchPeriod(r.returnedAt, returnsMonthFilter));

  // Bekor tarixi: barcha qaytarishlar (refund, exchange, cancel)
  const cancelledReturns = useMemo(() => shopReturnsList, [shopReturnsList])

  const returnsMonthOptions2 = getMonthOptions(cancelledReturns.map(r => r.returnedAt))
  const filteredCancelledReturns = cancelledReturns.filter(r => matchPeriod(r.returnedAt, returnsHistoryMonthFilter))

  const enrichedReturnsHistory = useMemo(() => {
    return filteredCancelledReturns.map(r => {
      const originalSale = salesList.find(s => s.id === r.originalSaleId)
      const qty = r.returnedItems?.reduce((sum, it) => sum + (it.qty || 1), 0) || 0
      const barcodes = r.returnedItems?.map(it => {
        const b = it.barcode || getItemBarcode(it.itemId)
        return (b && b !== '—') ? b : null
      }).filter(Boolean) || []
      const exBarcodes = (r.exchangedForItems || (r.exchangedForItem ? [r.exchangedForItem] : []))
        .map(it => it.barcode).filter(Boolean)
      const payLabel = r.paymentMethod === 'cash' ? t('pay_cash') :
                       r.paymentMethod === 'card' ? t('pay_card') :
                       r.paymentMethod === 'transfer' ? t('sl_hist_pay_bank') : '—'
      const typeLabel = r.type === 'exchange' ? t('col_exchange') : t('sl_rh_type_cancel')
      const REASON_KEY = { narx_mos_emas: 'sl_cancel_r_price', tovar_yoq: 'sl_cancel_r_nostock', mijoz_fikr_ozgartirdi: 'sl_cancel_r_changed', boshqa: 'sl_cancel_r_other' }
      const reasonLabel = r.returnReason ? (REASON_KEY[r.returnReason] ? t(REASON_KEY[r.returnReason]) : r.returnReason) : '—'
      // Qaytarilgan summa: cancel uchun original sotuv jami, refund/exchange uchun refundAmount
      const displayAmount = r.type === 'cancel'
        ? (originalSale?.total || r.returnedItems?.reduce((s, i) => s + (i.salePrice || 0) * (i.qty || 1), 0) || 0)
        : (r.refundAmount || 0)

      return {
        ...r,
        // customerName: originalSale dan olish — u bog'langandan keyin yangilanadi
        customerName: originalSale?.customerName || r.customerName || "Noma'lum",
        originalSaleCardType: originalSale?.cardType || null,
        originalCustomerName: originalSale?.originalCustomerName || r.originalCustomerName || null,
        soldAt: r.soldAt || originalSale?.soldAt || null,
        soldBy: r.soldBy || originalSale?.soldBy || null,
        soldByName: r.soldByName || originalSale?.soldByName || '—',
        qty,
        barcodes,
        exBarcodes,
        payLabel,
        typeLabel,
        reasonLabel,
        displayAmount,
      }
    })
  }, [filteredCancelledReturns, productCategories, salesList]);

  const sortedReturnsHistory = useMemo(() => {
    return sortData(enrichedReturnsHistory, returnsSortField, returnsSortOrder);
  }, [enrichedReturnsHistory, returnsSortField, returnsSortOrder]);

  // Almashtirilgan sotuv juftliklariga rang berish (inline style)
  const exchangePairColors = useMemo(() => {
    const colors = {}
    const palette = [
      'rgba(59,130,246,0.15)', 'rgba(139,92,246,0.15)', 'rgba(20,184,166,0.15)',
      'rgba(249,115,22,0.13)', 'rgba(236,72,153,0.13)', 'rgba(99,102,241,0.15)'
    ]
    let idx = 0
    shopReturnsList.forEach(ret => {
      if (ret.type === 'exchange' && ret.originalSaleId && ret.exchangeSaleId) {
        const color = palette[idx % palette.length]
        colors[ret.originalSaleId] = color
        colors[ret.exchangeSaleId] = color
        idx++
      }
    })
    return colors
  }, [shopReturnsList])

  // 3. Profit Month and Sorting Calculations
  const shopUsedForProfit = selectedShopId === 'all' ? usedSalesList : usedSalesList.filter(s => !s.shopId || String(s.shopId) === String(selectedShopId))
  const profitMonthOptions = getMonthOptions([
    ...baseSalesForHistory.filter(s => s.status !== 'cancelled').map(s => s.soldAt),
    ...shopUsedForProfit.filter(s => s.status !== 'cancelled').map(s => s.soldAt),
  ]);
  
  const profitItems = useMemo(() => {
    const items = [];
    baseSalesForHistory.forEach(s => {
      if (!s.items) return;
      const isCancelled = s.status === 'cancelled'
      const totalProfit = isCancelled ? 0 : getSaleProfit(s);
      const firstItem = s.items[0];
      const categoryId = firstItem?.productCategory;
      const categoryLabel = productCategories.find(c => c.id === categoryId)?.label || categoryId || '—';
      const barcodes = s.items.map(it => it.barcode || getItemBarcode(it.itemId)).filter(b => b && b !== '—');
      const itemsNames = s.items.map(i => i.name || i.productName || 'Tovar').join(', ');
      const totalQty = s.items.reduce((sum, it) => sum + (it.qty || 1), 0);

      // Kirim narxi kiritilmagan tovar — foyda taxmin qilinmaydi, "narx kiritilmagan" deb ko'rsatiladi
      const missingCost = s.items.some(it => !it.purchasePrice)
      const purchaseTotal = s.items.reduce((acc, it) => acc + (it.purchasePrice || 0) * (it.qty || 1), 0);
      const saleTotal = s.total;
      const commission = (!isCancelled && s.paymentType === 'installment') ? (s.installmentCommissionAmount ?? 0) : 0;
      const netProfit = missingCost ? 0 : totalProfit - commission;
      const margin = (!isCancelled && !missingCost && saleTotal > 0) ? Math.round((netProfit / saleTotal) * 100) : 0;

      items.push({
        id: s.id,
        saleId: s.id,
        soldAt: s.soldAt,
        name: itemsNames,
        barcodes,
        barcode: barcodes[0] || '—',
        categoryLabel,
        categoryId,
        customerName: s.customerName || '—',
        soldByName: s.soldByName || '—',
        paymentType: s.paymentType || '—',
        cardType: s.cardType || null,
        qty: totalQty,
        purchaseTotal,
        saleTotal,
        commission,
        profit: netProfit,
        margin,
        missingCost,
        totalSale: s.total,
        status: s.status,
        isCancelled,
        items: s.items,
        isUsedSale: false,
      });
    });

    const filteredUsedSales = selectedShopId === 'all' ? usedSalesList : usedSalesList.filter(s => !s.shopId || String(s.shopId) === String(selectedShopId))
    filteredUsedSales.forEach(s => {
      if (!s.items) return;
      const isCancelled = s.status === 'cancelled'
      const totalProfit = isCancelled ? 0 : getUsedSaleProfit(s);
      const firstItem = s.items[0];
      const categoryLabel = firstItem?.categoryLabel || firstItem?.category || '—';
      const itemsNames = s.items.map(i => i.name || 'Tovar').join(', ');
      const totalQty = s.items.reduce((sum, it) => sum + (it.qty || 1), 0);

      const purchaseTotal = s.items.reduce((acc, it) => acc + (it.acquiredPrice || 0) * (it.qty || 1), 0);
      const saleTotal = s.total;
      const orgCommPct = installmentOrganizations.find(o => o.id === s.installmentOrgId)?.commissionPercent ?? 0
      const commission = (!isCancelled && s.paymentType === 'installment') ? (s.installmentCommissionAmount ?? Math.round(s.total * orgCommPct / 100)) : 0;
      const netProfit = totalProfit - commission;
      const margin = (!isCancelled && saleTotal > 0) ? Math.round((netProfit / saleTotal) * 100) : 0;

      items.push({
        id: s.id,
        saleId: s.id,
        soldAt: s.soldAt,
        name: itemsNames,
        barcodes: [],
        barcode: '—',
        categoryLabel,
        categoryId: firstItem?.category,
        customerName: s.customerName || '—',
        soldByName: s.soldByName || '—',
        paymentType: s.paymentType || '—',
        cardType: s.cardType || null,
        qty: totalQty,
        purchaseTotal,
        saleTotal,
        commission,
        profit: netProfit,
        margin,
        totalSale: s.total,
        status: s.status,
        isCancelled,
        items: s.items,
        isUsedSale: true,
      });
    });
    return items;
  }, [baseSalesForHistory, usedSalesList, selectedShopId, productCategories, installmentOrganizations]);

  const filteredProfitItems = useMemo(() => {
    const q = profitSearch.trim().toLowerCase()
    return profitItems.filter(item => {
      if (!matchPeriod(item.soldAt, profitMonthFilter)) return false;
      if (profitTypeFilter === 'new' && item.isUsedSale) return false;
      if (profitTypeFilter === 'used' && !item.isUsedSale) return false;
      if (!q) return true;
      return (item.name || '').toLowerCase().includes(q) ||
             (item.customerName || '').toLowerCase().includes(q) ||
             (item.soldByName || '').toLowerCase().includes(q)
    });
  }, [profitItems, profitMonthFilter, profitTypeFilter, profitSearch]);

  const sortedProfitItems = useMemo(() => {
    return sortData(filteredProfitItems, profitSortField, profitSortOrder);
  }, [filteredProfitItems, profitSortField, profitSortOrder]);

  // 4. Installment Month and Sorting Calculations
  const shopSalesList = selectedShopId === 'all' ? salesList : salesList.filter(s => s.shopId === selectedShopId)
  const shopUsedSalesList = selectedShopId === 'all' ? usedSalesList : usedSalesList.filter(s => !s.shopId || String(s.shopId) === String(selectedShopId))
  const installmentMonthOptions = getMonthOptions([
    ...shopSalesList.filter(s => s.paymentType === 'installment' && s.status !== 'cancelled').map(s => s.soldAt),
    ...shopUsedSalesList.filter(s => s.paymentType === 'installment' && s.status !== 'cancelled').map(s => s.soldAt),
  ]);

  const filteredInstallmentSales = useMemo(() => {
    const q = installmentSearch.trim().toLowerCase()
    const shopUsed = selectedShopId === 'all' ? usedSalesList : usedSalesList.filter(s => !s.shopId || String(s.shopId) === String(selectedShopId))
    const combined = [
      ...shopSalesList,
      ...shopUsed.map(s => ({ ...s, isUsedSale: true })),
    ]
    return combined
      .filter(s => s.paymentType === 'installment' && s.status !== 'cancelled')
      .filter(s => {
        if (installmentTypeFilter === 'new') return !s.isUsedSale
        if (installmentTypeFilter === 'used') return !!s.isUsedSale
        return true
      })
      .filter(s => matchPeriod(s.soldAt, installmentMonthFilter))
      .filter(s => {
        if (!q) return true
        const name = (s.customerName || '').toLowerCase()
        const items = (s.items?.map(i => i.name).join(' ') || '').toLowerCase()
        const barcodes = (s.items?.map(i => i.barcode).join(' ') || '').toLowerCase()
        return name.includes(q) || items.includes(q) || barcodes.includes(q)
      })
  }, [salesList, usedSalesList, installmentMonthFilter, installmentSearch, installmentTypeFilter, selectedShopId]);

  // Saqlangan komissiya bo'lmasa — sotuvdagi tashkilotning foizi (tashkilot topilmasa 0)
  const orgPercent = (s) => installmentOrganizations.find(o => o.id === s.installmentOrgId)?.commissionPercent ?? 0
  const enrichedInstallmentSales = useMemo(() => {
    return filteredInstallmentSales.map(s => {
      const firstItem = s.items?.[0];
      const catLabel = s.isUsedSale
        ? (firstItem?.category ? t('cat_' + firstItem.category, { defaultValue: firstItem.categoryLabel || firstItem.category }) : '—')
        : (() => { const _c = productCategories.find(c => c.id === firstItem?.productCategory); return _c ? t('cat_' + _c.id, { defaultValue: _c.label }) : (firstItem?.productCategory || '—') })();
      const firstBarcode = firstItem?.barcode || '—';
      const itemsNames = s.items?.map(i => i.name || 'Tovar').join(', ') || '—';
      const qty = s.items?.reduce((sum, it) => sum + (it.qty || 1), 0) || 0;

      const statusInfo = getInstallmentStatusMap[s.id] || { status: 'pending', debtAmount: s.total, paidAmount: 0 };
      const statusLabel = statusInfo.status === 'paid' ? t('sl_inst_status_paid') : statusInfo.status === 'partial' ? t('inc_filter_partial') : t('sl_inst_status_pending');

      return {
        ...s,
        itemsNames,
        barcode: firstBarcode,
        category: catLabel,
        qty,
        installmentOrgName: s.installmentOrgName || 'Oddiy Nasiya',
        installmentStatus: statusLabel,
        installmentCommissionPercent: s.installmentCommissionPercent ?? orgPercent(s),
        installmentCommissionAmount: s.installmentCommissionAmount ?? Math.round(s.total * orgPercent(s) / 100)
      };
    });
  }, [filteredInstallmentSales, getInstallmentStatusMap, productCategories]);

  const sortedInstallmentSales = useMemo(() => {
    return sortData(enrichedInstallmentSales, installmentSortField, installmentSortOrder);
  }, [enrichedInstallmentSales, installmentSortField, installmentSortOrder]);

  const handleHistorySort = (field) => {
    if (historySortField === field) {
      setHistorySortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setHistorySortField(field);
      setHistorySortOrder('desc');
    }
  };

  const handleReturnsSort = (field) => {
    if (returnsSortField === field) {
      setReturnsSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setReturnsSortField(field);
      setReturnsSortOrder('desc');
    }
  };

  const handleProfitSort = (field) => {
    if (profitSortField === field) {
      setProfitSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setProfitSortField(field);
      setProfitSortOrder('desc');
    }
  };

  const handleInstallmentSort = (field) => {
    if (installmentSortField === field) {
      setInstallmentSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setInstallmentSortField(field);
      setInstallmentSortOrder('desc');
    }
  };

  return {
    user, barcodeSelectClass, addNotification, notifications, updateNotification, bump, fetchData,
    getItemBarcode, sources, productCategories, installmentOrganizations,
    loyaltyMinAmount, loyaltyVisitsRequired, notificationSettings,
    discountSmallMax, loyaltyDiscountPercent, companyName,
    selectedShopId, activeTab, setActiveTab, shopPickCallback, setShopPickCallback, requireShop,
    thisMonth,
    cartItems, addToCart, removeFromCart, clearCart, updateSalePrice,
    bulkLines, setBulkLine, removeBulkLine, bulkStock,
    selectedCustomer, setSelectedCustomer, discountPercent, setDiscountPercent,
    loyaltyDiscountApplied, setLoyaltyDiscountApplied,
    paymentType, setPaymentType, cardType, setCardType, source, setSource,
    installmentOrgId, setInstallmentOrgId,
    installmentTermMonths, setInstallmentTermMonths,
    allCustomers, setAllCustomers, salesList, setSalesList,
    returnsList, setReturnsList,
    isSubmitting, setIsSubmitting, successSale, setSuccessSale,
    customerSearch, setCustomerSearch, showNewCustomerModal, setShowNewCustomerModal,
    newCustomer, setNewCustomer, priceWarnings, setPriceWarnings,
    pinModal, setPinModal, pendingDiscountReqId, setPendingDiscountReqId,
    cancelModal, setCancelModal, cancelReason, setCancelReason, refundType, setRefundType,
    contractNumber, setContractNumber, contractFile, setContractFile, contractFileRef,
    tradeInItems, setTradeInItems,
    usedStockList, setUsedStockList,
    usedSalesList: selectedShopId === 'all' ? usedSalesList : usedSalesList.filter(s => !s.shopId || s.shopId === selectedShopId),
    setUsedSalesList,
    buCart, setBuCart, buGroupQty, setBuGroupQty, buSearch, setBuSearch, buAttrFilters, setBuAttrFilters,
    productAttributeDefs,
    buScrapMode, setBuScrapMode, buScrapSelected, setBuScrapSelected,
    buScrapCategory, setBuScrapCategory, buSelectedCustomer, setBuSelectedCustomer,
    buCustomerSearch, setBuCustomerSearch, buShowNewCustomerModal, setBuShowNewCustomerModal,
    buDiscountPercent, setBuDiscountPercent, buPaymentType, setBuPaymentType,
    buCardType, setBuCardType,
    buSource, setBuSource, buInstallmentOrgId, setBuInstallmentOrgId,
    buInstallmentTermMonths, setBuInstallmentTermMonths,
    buContractNumber, setBuContractNumber, buIsSubmitting, setBuIsSubmitting,
    buSuccessSale, setBuSuccessSale,
    getInstallmentStatusMap, fetchUsedData,
    returnMode, setReturnMode, returnLinkCust, setReturnLinkCust,
    returnLinkConfirm, setReturnLinkConfirm,
    returnCustomer, setReturnCustomer, returnSale, setReturnSale,
    returnItems, setReturnItems, returnQtyMap, setReturnQtyMap,
    returnPaymentMethod, setReturnPaymentMethod, returnReason, setReturnReason,
    returnBarcodeQuery, setReturnBarcodeQuery, exchangeBarcode, setExchangeBarcode,
    exchangeItems, setExchangeItems, alertModal, setAlertModal,
    detailedOrg, setDetailedOrg, orgMonthFilter, setOrgMonthFilter,
    payoutAmount, setPayoutAmount, selectedPayoutSaleId, setSelectedPayoutSaleId,
    payoutSuccess, setPayoutSuccess, installmentSearch, setInstallmentSearch, installmentTypeFilter, setInstallmentTypeFilter,
    inlinePaySaleId, setInlinePaySaleId, inlinePayAmount, setInlinePayAmount,
    inlinePaySuccess, setInlinePaySuccess,
    customerPayModal, setCustomerPayModal, customerPayAmount, setCustomerPayAmount,
    customerPaySaleId, setCustomerPaySaleId, customerPaySuccess, setCustomerPaySuccess,
    historyPage, setHistoryPage, returnsHistoryPage, setReturnsHistoryPage,
    installmentSalesPage, setInstallmentSalesPage, profitPage, setProfitPage,
    historyMonthFilter, setHistoryMonthFilter, historySortField, setHistorySortField, historySortOrder, setHistorySortOrder,
    returnsMonthFilter, setReturnsMonthFilter, returnsHistoryMonthFilter, setReturnsHistoryMonthFilter, returnsSortField, setReturnsSortField, returnsSortOrder, setReturnsSortOrder,
    profitMonthFilter, setProfitMonthFilter, profitTypeFilter, setProfitTypeFilter, profitSearch, setProfitSearch, profitSortField, setProfitSortField, profitSortOrder, setProfitSortOrder,
    installmentMonthFilter, setInstallmentMonthFilter, installmentSortField, setInstallmentSortField, installmentSortOrder, setInstallmentSortOrder,
    maxDiscount, effectiveDiscount, promoDiscount, customerHasLoyalty, subtotal, discountAmount, total,
    promoResult, afterPromo, appliedCode, setAppliedCode, giftCard, setGiftCard, giftCardUsed, codeError, setCodeError,
    codeChecking, applyCode, clearMarketing, codeIgnored,
    udsEnabled, fiscalEnabled, udsInfo, setUdsInfo, udsPointsInput, setUdsPointsInput, udsPointsUsed,
    onlineProviders, onlinePayment, setOnlinePayment,
    loyaltyInfo, loyaltyTierPercent, loyaltyActive, useBalance, setUseBalance, balanceInput, setBalanceInput,
    customerBalance, balanceUsed, payable, cashbackPreview,
    addTradeInRow, updateTradeInRow, removeTradeInRow, tradeInTotal,
    addNextItemOfProduct, updateGroupSalePrice,
    addBundleToCart, removeBundleFromCart,
    handleSubmitSale, handleDiscountChange, handleSendDiscountRequest,
    handleCancelSale, executeCancelSale,
    handleLeftItemFound, handleSelectSaleItem, handleRightScanOrSearch,
    lookupReturnBarcode, lookupExchangeBarcode, handleReturnSubmit,
    handleOrgPayoutSubmit, handleInlinePaySubmit, handleCustomerPaySubmit,
    shopCustomers, filteredCustomers, buFilteredCustomers,
    buAvailableGroups, buScrapCategories, buScrapGroups, buCartGroups,
    buSubtotal, buDiscountAmount, buTotal,
    buAddToCart, buRemoveGroupFromCart, buSetGroupTotalPrice, buAddScrapToCart,
    buHandleSubmitSale, buCartGroupKey,
    formatMonthValue, getMonthOptions, sortData,
    historyMonthOptions, filteredSalesForHistory, sortedSalesForHistory,
    shopReturnsList, enrichedSalesForHistory,
    returnsMonthOptions, filteredReturnsHistory, cancelledReturns,
    returnsMonthOptions2, filteredCancelledReturns, enrichedReturnsHistory, sortedReturnsHistory,
    exchangePairColors,
    profitMonthOptions, profitItems, filteredProfitItems, sortedProfitItems,
    shopSalesList, installmentMonthOptions, filteredInstallmentSales,
    enrichedInstallmentSales, sortedInstallmentSales,
    handleHistorySort, handleReturnsSort, handleProfitSort, handleInstallmentSort,
    addCustomer,
  }

}



