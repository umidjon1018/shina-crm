import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  BarChart3, TrendingUp, Package, Users, Wallet, Download,
  ChevronDown, ArrowUpRight, ArrowDownRight, ShoppingCart,
  DollarSign, AlertTriangle, Award, Truck, Clock, Target,
  CreditCard, RefreshCw, Activity, Eye,
  UserCheck, UserX, Repeat, Star, MapPin, CircleX, Recycle
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { useAuthStore } from '../../store/authStore'
import { useSettingsStore } from '../../store/settingsStore'
import { getCategoryColor, CATEGORY_COLOR_PALETTE } from '../../utils/categoryColors'
import * as XLSX from 'xlsx'
import { getReturns } from '../../api/returnService'
import { getSaleProfit, getUsedSaleProfit } from '../../utils/profitHelpers'
import { getUsedSales, getUsedStock } from '../../api/usedService'
import { getSales } from '../../api/salesService'
import { getCustomers } from '../../api/customerService'
import { getProducts } from '../../api/productService'
import { getItems } from '../../api/itemService'
import { getIncomeBatches, getSuppliers } from '../../api/incomeService'
import { getExpenses } from '../../api/expenseService'
import { getCapital } from '../../api/capitalService'
import { useShopStore } from '../../store/shopStore'
import {
  InstagramDM, Modal, Pagination, ModalTable, MonthlyDynamicsChart,
  C, SOURCE_LABELS, CANCEL_REASONS, getCancelReasonLabel,
  fmtUZS, fmtUSD, fmtNum, TODAY, fmtSoldAt, fmtItems,
  exportCSV, exportXLSX, exportPDF
} from './components/shared'
import SalesTab from './tabs/SalesTab'
import StockTab from './tabs/StockTab'
import ProfitTab from './tabs/ProfitTab'
import CustomersTab from './tabs/CustomersTab'
import EmployeesTab from './tabs/EmployeesTab'
import FinanceTab from './tabs/FinanceTab'
import UsedTab from './tabs/UsedTab'

export const Reports = () => {
  const { t, i18n } = useTranslation()
  const som = t('unit_som')
  const pcs = t('unit_pcs')

  const getSourceLabel = (key) => {
    const map = { instagram: 'Instagram', telegram: 'Telegram', repeat: t('rep_src_repeat'), walk_in: t('rep_src_walk_in'), referral: t('rep_src_referral') }
    return map[key] || key || '—'
  }

  const getCategoryLabel = (item) => {
    if (i18n.language === 'ru') {
      const ruMap = { tire: 'Шина', wheel: 'Диск', accessory: 'Аксессуар' }
      return ruMap[item?.category] || item?.categoryLabel || '—'
    }
    return item?.categoryLabel || '—'
  }

  const getExpNote = (e) => {
    if (!e) return '—'
    if (i18n.language === 'ru') return e.noteRu || e.note || e.categoryLabel || '—'
    return e.note || e.categoryLabel || '—'
  }

  const getCancelLabel = (reason) => {
    const r = reason || ''
    if (r === 'qaytarish' || r === 'bekor' || r === 'refund' || r === 'cancel') return t('rep_cancel_refund')
    if (r === 'almashtirish' || r === 'exchange') return t('rep_almashtirilgan')
    const map = { narx_mos_emas: t('sl_cancel_r_price'), tovar_yoq: t('rep_cancel_tovar_yoq'), mijoz_fikr_ozgartirdi: t('rep_cancel_mijoz'), boshqa: t('rep_cancel_boshqa') }
    return map[r] || r || '—'
  }

  // Oy nomini t() orqali olish: '2026-03' → 'Mart 2026'
  const getMonthLabel = (m) => {
    if (!m) return '—'
    const [y, mo] = m.split('-')
    return `${t('rep_month_' + parseInt(mo))} ${y}`
  }

  const { user } = useAuthStore()
  const isPrivileged = user?.role === 'admin' || user?.role === 'manager'
  const {
    employees: storeEmployees,
    employeeTargets: storeEmployeeTargets,
    monthlyTargets: storeMonthlyTargets,
    usdRate: storeUsdRate,
    installmentOrganizations: storeInstallmentOrgs,
    productCategories: storeProductCategories,
    loyaltyVisitsRequired: storeLoyaltyVisitsRequired,
    silverVisits: storeSilverVisits,
    loyaltyMinAmount: storeLoyaltyMinAmount,
    companyName: storeCompanyName,
  } = useSettingsStore()

  const { selectedShopId } = useShopStore()

  const [_allSales, setAllSales] = useState([])
  const [MOCK_CUSTOMERS, setCustomers] = useState([])
  const [MOCK_PRODUCTS, setProducts] = useState([])
  const [MOCK_ITEMS, setItems] = useState([])
  const [_allBatches, setAllBatches] = useState([])
  const [_allExpenses, setAllExpenses] = useState([])
  const [MOCK_CAPITAL, setCapital] = useState([])
  const [MOCK_SUPPLIERS, setSuppliers] = useState([])
  const [MOCK_USED_SALES, setUsedSales] = useState([])
  const [MOCK_USED_STOCK, setUsedStock] = useState([])
  const [MOCK_RETURNS, setReturns] = useState([])

  useEffect(() => {
    Promise.all([
      getSales(),
      getCustomers(),
      getProducts(),
      getItems(),
      getIncomeBatches(),
      getExpenses(),
      getCapital(),
      getSuppliers(),
      getUsedSales(),
      getUsedStock(),
      getReturns(),
    ]).then(([sales, customers, products, items, batches, expenses, capital, suppliers, usedSales, usedStock, returns]) => {
      setAllSales(sales)
      setCustomers(customers)
      setProducts(products)
      setItems(items)
      setAllBatches(batches)
      setAllExpenses(expenses)
      setCapital(capital)
      setSuppliers(suppliers)
      setUsedSales(usedSales)
      setUsedStock(usedStock)
      setReturns(returns)
    }).catch(() => {})
  }, [])

  const MOCK_SALES = useMemo(() => selectedShopId === 'all' ? _allSales : _allSales.filter(s => s.shopId === selectedShopId), [_allSales, selectedShopId])
  const MOCK_EXPENSES = useMemo(() => selectedShopId === 'all' ? _allExpenses : _allExpenses.filter(e => e.shopId === selectedShopId), [_allExpenses, selectedShopId])
  const MOCK_INCOME_BATCHES = useMemo(() => selectedShopId === 'all' ? _allBatches : _allBatches.filter(b => b.shopId === selectedShopId), [_allBatches, selectedShopId])
  const MOCK_BATCHES = MOCK_INCOME_BATCHES

  // Bir joyda aniqlangan konstantalar — barcha joylarda shu ishlatiladi
  const USD_RATE         = storeUsdRate              || 12700
  const GOLD_THRESHOLD   = storeLoyaltyVisitsRequired || 10
  const SILVER_THRESHOLD = storeSilverVisits || 5

  const getCatLabel = (catId) => {
    if (!catId || catId === '—') return '—'
    const i18nKey = { tire: 'cat_tire', wheel: 'cat_wheel', accessory: 'cat_accessory' }[catId]
    if (i18nKey) return t(i18nKey)
    return storeProductCategories?.find(c => c.id === catId)?.label || catId
  }

  const getCatLabelPlural = (catId) => {
    if (!catId || catId === '—') return '—'
    const i18nKey = { tire: 'cat_tire_pl', wheel: 'cat_wheel_pl', accessory: 'cat_accessory_pl' }[catId]
    if (i18nKey) return t(i18nKey)
    return storeProductCategories?.find(c => c.id === catId)?.label || catId
  }

  // Management Kategoriyalar bilan bir xil rang
  // tire(0)→ko'k, wheel(1)→sariq, accessory(2)→oq (purple token yo'q)
  const STABLE_HEX = { 0: '#3B82F6', 1: '#F59E0B', 2: '#E2E8F0' }

  const getCatColor = (catId) => getCategoryColor(catId, storeProductCategories)

  const getCatColorHex = (catId) => {
    if (!storeProductCategories || storeProductCategories.length === 0) {
      return { tire: '#3B82F6', wheel: '#F59E0B', accessory: '#E2E8F0' }[catId] || '#E2E8F0'
    }
    const idx = storeProductCategories.findIndex(c => c.id === catId)
    if (idx < 0) return '#E2E8F0'
    return STABLE_HEX[idx] ?? (CATEGORY_COLOR_PALETTE[idx % CATEGORY_COLOR_PALETTE.length]?.hex || '#E2E8F0')
  }

  // Badge render — oq rang uchun border style
  const renderCatBadge = (catId) => {
    const hex = getCatColorHex(catId)
    const label = getCatLabel(catId)
    if (!label || label === '—') return <span className="text-text-muted text-xs">—</span>
    const isWhite = hex === '#E2E8F0'
    return isWhite
      ? <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-border text-text-primary bg-bg-tertiary">{label}</span>
      : <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase" style={{ backgroundColor: hex+'22', color: hex }}>{label}</span>
  }

  const [showExportMenu, setShowExportMenu] = React.useState(false)
  const [activeTab, setActiveTab] = useState('sales')
  const [period, setPeriod] = useState('all')
  const [stockCategory, setStockCategory] = useState('all')

  // B/U tovarlar tabi — har bo'lim/modal uchun alohida oy filtri
  const [usedChartMonth, setUsedChartMonth] = useState('all')
  const [usedHistoryMonth, setUsedHistoryMonth] = useState('all')
  const [usedRevenueMonth, setUsedRevenueMonth] = useState('all')
  const [usedProfitMonth, setUsedProfitMonth] = useState('all')
  const [usedAcquiredMonth, setUsedAcquiredMonth] = useState('all')
  const [usedInStockMonth, setUsedInStockMonth] = useState('all')
  const [usedSoldMonth, setUsedSoldMonth] = useState('all')
  const [usedScrappedMonth, setUsedScrappedMonth] = useState('all')
  const [usedMarginMonth, setUsedMarginMonth] = useState('all')
  const [usedInstallmentMonth, setUsedInstallmentMonth] = useState('all')

  const [sortConfig, setSortConfig] = useState({ key: null, dir: 'asc', table: null })

  const [salesTablePage, setSalesTablePage] = React.useState(1)
  const SALES_PAGE_SIZE = 10

  // Modal state'lar — barcha tablar uchun
  const [modal, setModal] = React.useState(null)
  const [showAllCfMonths, setShowAllCfMonths] = React.useState(false)
  const [slowRotIdx,    setSlowRotIdx]    = React.useState(-1)
  const [staleIdx,      setStaleIdx]      = React.useState(-1)
  const [notSoldDays,   setNotSoldDays]   = React.useState(60)
  const [msd, setMsd] = React.useState('desc') // modal month sort dir: 'desc'=Z-A, 'asc'=A-Z
  const sortMonths = arr => msd === 'desc'
    ? [...arr].sort((a,b) => (b.month||'').localeCompare(a.month||''))
    : [...arr].sort((a,b) => (a.month||'').localeCompare(b.month||''))
  const MonthSortBtn = () => (
    <button onClick={() => setMsd(d => d==='desc'?'asc':'desc')}
      className="text-xs px-2 py-0.5 rounded border border-border text-text-muted hover:text-text-primary hover:border-accent-blue/50 transition-colors select-none">
      {msd==='desc'?'Z→A':'A→Z'}
    </button>
  )
  // Ishlatish: setModal('salesTotal') | setModal(null)
  // Tekshirish: modal === 'salesTotal'

  // Modal ichki filtrlar
  const [modalFilter, setModalFilter] = React.useState('all')
  const [varMonthFilter, setVarMonthFilter] = React.useState('all')
  const [selectedCustomer, setSelectedCustomer] = React.useState(null)
  const [customersPage, setCustomersPage]       = React.useState(1)
  const CUSTOMERS_PAGE_SIZE = 10
  const [cstmSearch, setCstmSearch] = React.useState('')
  const [selectedEmployee, setSelectedEmployee] = React.useState(null)
  const [empChartMetric, setEmpChartMetric]     = React.useState('total') // 'total' | 'count' | 'profit'
  const [hourTab, setHourTab]                   = React.useState('daily')
  const [expandedMonth, setExpandedMonth]        = React.useState(null)
  const [seasonYear, setSeasonYear]             = React.useState('2026')
  // Modal o'zgarsa filterni reset qilish uchun:
  const openModal = (name) => { setModal(name); setModalFilter(period); setVarMonthFilter(period); setCstmSearch(''); setHourTab('daily'); setExpandedMonth(null) }
  const closeModal = () => setModal(null)

  const toggleSort = (table, key) => {
    setSortConfig(prev =>
      prev.table === table && prev.key === key
        ? { table, key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { table, key, dir: 'asc' }
    )
  }

  const sortedData = (data, table) => {
    if (sortConfig.table !== table || !sortConfig.key) return data
    return [...data].sort((a, b) => {
      const av = a[sortConfig.key] ?? ''
      const bv = b[sortConfig.key] ?? ''
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sortConfig.dir === 'asc' ? cmp : -cmp
    })
  }

  const SortIcon = ({ table, col }) => {
    const active = sortConfig.table === table && sortConfig.key === col
    return (
      <span className="ml-1 inline-flex flex-col leading-none" style={{ fontSize: 8, color: active ? 'var(--accent-red)' : 'var(--text-muted)' }}>
        <span style={{ opacity: active && sortConfig.dir === 'asc' ? 1 : 0.4 }}>▲</span>
        <span style={{ opacity: active && sortConfig.dir === 'desc' ? 1 : 0.4 }}>▼</span>
      </span>
    )
  }


  const periodOptions = (() => {
    const months = new Set()
    const currentMonth = new Date().toISOString().slice(0, 7)
    months.add(currentMonth)

    MOCK_SALES.forEach(s => { if (s.soldAt) months.add(s.soldAt.slice(0,7)) })
    MOCK_EXPENSES.forEach(e => { if (e.date) months.add(e.date.slice(0,7)) })
    MOCK_USED_SALES.forEach(s => { if (s.soldAt) months.add(s.soldAt.slice(0,7)) })
    MOCK_USED_STOCK.forEach(u => {
      if (u.acquiredAt) months.add(u.acquiredAt.slice(0,7))
      if (u.scrapAt) months.add(u.scrapAt.slice(0,7))
    })
    const sorted = Array.from(months).sort().reverse()
    return [
      { value: 'all', label: t('filter_all') },
      ...sorted.map(m => ({ value: m, label: getMonthLabel(m) }))
    ]
  })()

  const filterByPeriod = useCallback((arr, dateField) => {
    if (period === 'all') return arr
    return arr.filter(item => item[dateField] && item[dateField].startsWith(period))
  }, [period])

  React.useEffect(() => {
    setSalesTablePage(1)
  }, [period])

  // --- TAB 1: SALES ---
  const salesData = useMemo(() => {
    const filtered = filterByPeriod(MOCK_SALES, 'soldAt')
    const completed = filtered.filter(s => s.status !== 'cancelled')
    const cancelled = filtered.filter(s => s.status === 'cancelled')
    const totalSales = completed.reduce((s, x) => s + x.total, 0)
    const totalProfit = completed.reduce((s, x) => s + getSaleProfit(x) - (x.paymentType === 'installment' ? (x.installmentCommissionAmount ?? 0) : 0), 0)
    const avgCheck = totalSales / (completed.length || 1)
    const salesCount = completed.length
    const cancelledCount  = cancelled.filter(s => s.cancelReason !== 'exchange' && s.cancelReason !== 'almashtirish').length
    const exchangedCount  = cancelled.filter(s => s.cancelReason === 'exchange' || s.cancelReason === 'almashtirish').length

    const installmentTotal = completed.filter(s => s.paymentType === 'installment').reduce((s, x) => s + (x.installmentDebt ?? Math.max(0, x.total - (x.installmentPaidAmount || 0))), 0)

    const curMonth = period === 'all' ? (new Date().toISOString().slice(0,7)) : period
    const targetMonthSales = MOCK_SALES.filter(s => s.status !== 'cancelled' && s.soldAt && s.soldAt.startsWith(curMonth)).reduce((sum, x) => sum + x.total, 0)
    const prevMonth = (() => {
      if (!curMonth) return null
      const [y, m] = curMonth.split('-').map(Number)
      const pm = m === 1 ? 12 : m - 1
      const py = m === 1 ? y - 1 : y
      return `${py}-${String(pm).padStart(2, '0')}`
    })()
    const prevCompleted = prevMonth ? MOCK_SALES.filter(s => s.soldAt && s.soldAt.startsWith(prevMonth) && s.status !== 'cancelled') : []
    const prevTotal = prevCompleted.reduce((s, x) => s + x.total, 0)
    const prevCount = prevCompleted.length
    const growthPct = prevTotal > 0 ? Math.round(((targetMonthSales - prevTotal) / prevTotal) * 100) : null
    const countGrowth = prevCount > 0 ? Math.round(((salesCount - prevCount) / prevCount) * 100) : null

    const MONTHLY_TARGETS_LIVE = (storeMonthlyTargets && Object.keys(storeMonthlyTargets).length > 0)
      ? storeMonthlyTargets
      : { '2026-03': 12000000, '2026-04': 14000000, '2026-05': 16000000, '2026-06': 18000000 }
    const monthExpenses = MOCK_EXPENSES.filter(e => e.date && e.date.startsWith(curMonth)).reduce((sum, e) => sum + (e.amountUZS || 0), 0)
    const target = MONTHLY_TARGETS_LIVE[curMonth] || monthExpenses || 0
    const targetPct = target > 0 ? Math.min(100, Math.round((targetMonthSales / target) * 100)) : 0

    const dailyMap = {}
    completed.forEach(s => {
      if (!s.soldAt) return
      const date = s.soldAt.slice(0, 10)
      dailyMap[date] = (dailyMap[date] || 0) + s.total
    })
    const chartDaily = Object.entries(dailyMap)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const curMonthSalesForTypes = MOCK_SALES.filter(s => s.status !== 'cancelled' && s.soldAt && s.soldAt.startsWith(curMonth))
    const typeMap = {}
    curMonthSalesForTypes.forEach(s => { typeMap[s.paymentType] = (typeMap[s.paymentType] || 0) + 1 })
    const payTypeLabels = { cash: t('pay_cash'), card: t('pay_card'), installment: t('pay_installment'), transfer: t('rep_pay_bank') }
    const chartTypes = Object.entries(typeMap).map(([typeKey, value]) => ({
      name: payTypeLabels[typeKey] || typeKey, value, typeKey
    }))

    const productMap = {}
    completed.forEach(s => {
      s.items.forEach(item => {
        let key = ''
        let qty = 1
        if (typeof item === 'object' && item !== null) {
          key = item.name || ''
          qty = item.qty || 1
        } else if (typeof item === 'string') {
          key = item.split(' x')[0]
          qty = parseInt(item.split(' x')[1] || '1')
        }
        productMap[key] = (productMap[key] || 0) + qty
      })
    })
    const topProducts = Object.entries(productMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const sourceMap = {}
    completed.forEach(s => {
      const src = s.source || 'walk_in'
      if (!sourceMap[src]) sourceMap[src] = { count: 0, revenue: 0 }
      sourceMap[src].count++
      sourceMap[src].revenue += s.total
    })
    const chartSources = Object.entries(sourceMap).map(([key, v]) => ({
      name: getSourceLabel(key), count: v.count, revenue: v.revenue,
    }))

    const newCount      = completed.filter(s => s.isNewCustomer).length
    const returnCount   = completed.filter(s => !s.isNewCustomer).length
    const newRevenue    = completed.filter(s => s.isNewCustomer).reduce((s,x) => s+x.total, 0)
    const returnRevenue = completed.filter(s => !s.isNewCustomer).reduce((s,x) => s+x.total, 0)

    const today = new Date().toISOString().slice(0, 10)
    const todaySales = MOCK_SALES.filter(s => s.status !== 'cancelled' && s.soldAt && s.soldAt.startsWith(today))
    const hourMap = {}
    todaySales.forEach(s => {
      const h = new Date(s.soldAt).getHours()
      const slot =
        h < 9  ? '07-09' :
        h < 11 ? '09-11' :
        h < 13 ? '11-13' :
        h < 15 ? '13-15' :
        h < 17 ? '15-17' :
        h < 19 ? '17-19' :
        h < 21 ? '19-21' : '21-22'
      hourMap[slot] = (hourMap[slot] || 0) + 1
    })
    const chartHours = ['07-09','09-11','11-13','13-15','15-17','17-19','19-21','21-22']
      .map(slot => ({ slot, count: hourMap[slot] || 0 }))

    const cancelMap = {}
    cancelled.forEach(s => {
      const key = (s.cancelReason === 'almashtirish' || s.cancelReason === 'exchange') ? 'almashtirish'
        : s.cancelReason && CANCEL_REASONS[s.cancelReason] ? s.cancelReason
        : 'qaytarish'
      cancelMap[key] = (cancelMap[key] || 0) + 1
    })
    const chartCancelReasons = Object.entries(cancelMap).map(([key, count]) => ({
      name: getCancelLabel(key), count, key
    }))

    // Kategoriya bo'yicha sotuv taqsimoti
    const itemCatMap = {}
    MOCK_PRODUCTS.forEach(p => {
      const shortName = p.name.split(' ')[0].toLowerCase()
      itemCatMap[shortName] = p.category
    })
    const catCount = {}
    ;(storeProductCategories || [{ id: 'tire' }, { id: 'wheel' }, { id: 'accessory' }])
      .forEach(c => { catCount[c.id] = 0 })
    completed.forEach(s => {
      s.items.forEach(item => {
        let nameStr = ''
        let qty = 1
        if (typeof item === 'object' && item !== null) {
          nameStr = item.name || ''
          qty = item.qty || 1
        } else if (typeof item === 'string') {
          nameStr = item
          qty = parseInt(item.split(' x')[1] || '1')
        }
        const firstName = nameStr.split(' ')[0].toLowerCase()
        const cat = itemCatMap[firstName] || (storeProductCategories?.[0]?.id || 'tire')
        catCount[cat] = (catCount[cat] || 0) + qty
      })
    })
    const totalCatCount = Object.values(catCount).reduce((s, x) => s + x, 0) || 1
    const chartCategories = (storeProductCategories || [
      { id: 'tire' }, { id: 'wheel' }, { id: 'accessory' }
    ]).map((cat, i) => ({
      label: getCatLabelPlural(cat.id),
      count: catCount[cat.id] || 0,
      pct: Math.round((catCount[cat.id] || 0) / totalCatCount * 100),
      color: CATEGORY_COLOR_PALETTE[i % CATEGORY_COLOR_PALETTE.length]?.hex || C.orange,
    }))

    return {
      filtered, completed, cancelled, totalSales, totalProfit, avgCheck, salesCount, cancelledCount, exchangedCount,
      installmentTotal, growthPct, countGrowth, target, targetPct, chartDaily, chartTypes, topProducts, curMonth,
      chartSources, newCount, returnCount, newRevenue, returnRevenue, chartHours, chartCancelReasons, chartCategories,
      targetMonthSales
    }
  }, [period, filterByPeriod, storeProductCategories, t, selectedShopId, MOCK_SALES, MOCK_RETURNS, MOCK_PRODUCTS])

  // --- B/U TOVARLAR (used items) — global davr filtridan mustaqil, har bo'lim o'z filtriga ega ---
  const usedData = useMemo(() => {
    const allUsedSales = filterByPeriod(MOCK_USED_SALES, 'soldAt')
    const completedUsed = allUsedSales.filter(s => s.status !== 'cancelled')

    const totalRevenue = completedUsed.reduce((s, x) => s + (x.total || 0), 0)
    const totalProfit = completedUsed.reduce((s, x) => {
      const commission = x.paymentType === 'installment' ? (x.installmentCommissionAmount ?? 0) : 0
      return s + getUsedSaleProfit(x) - commission
    }, 0)
    const salesCount = completedUsed.length

    const acquiredStock = filterByPeriod(MOCK_USED_STOCK, 'acquiredAt')
    const acquiredCount = acquiredStock.length
    const acquiredValue = acquiredStock.reduce((s, x) => s + (x.acquiredPrice || 0), 0)

    const allInStock = MOCK_USED_STOCK.filter(u => u.status === 'in_stock')
    const inStockCount = allInStock.length
    const inStockValue = allInStock.reduce((s, x) => s + (x.acquiredPrice || 0), 0)

    const scrapSaleIds = new Set(MOCK_USED_SALES.filter(s => s.customerName === 'Utilizatsiya' && s.status !== 'cancelled').map(s => s.id))
    const soldStockAll = MOCK_USED_STOCK.filter(u => u.status === 'sold')
    const scrappedViaSale = soldStockAll.filter(u => scrapSaleIds.has(u.soldSaleId))
    const allSold = filterByPeriod(soldStockAll.filter(u => !scrapSaleIds.has(u.soldSaleId)), 'soldAt')
    const soldCount = allSold.length
    const allScrappedRaw = [...MOCK_USED_STOCK.filter(u => u.status === 'scrapped'), ...scrappedViaSale]
    const allScrapped = period === 'all' ? allScrappedRaw : allScrappedRaw.filter(x => (x.scrapAt || x.soldAt)?.startsWith(period))
    const scrappedCount = allScrapped.length
    const scrappedValue = allScrapped.reduce((s, x) => s + (x.acquiredPrice || 0), 0)

    const instSales = completedUsed.filter(s => s.paymentType === 'installment')
    const instDebt  = instSales.reduce((s, x) => s + (x.installmentDebt || 0), 0)
    const instCount = instSales.length

    return {
      allUsedSales, completedUsed, totalRevenue, totalProfit, salesCount,
      acquiredStock, acquiredCount, acquiredValue, inStockCount, inStockValue, allInStock, soldCount, allSold,
      scrappedCount, scrappedValue, allScrapped,
      instSales, instDebt, instCount,
    }
  }, [period, filterByPeriod, MOCK_USED_SALES, MOCK_USED_STOCK])

  const filterUsedByMonth = (arr, dateField, month) => {
    if (month === 'all') return arr
    return arr.filter(item => item[dateField] && item[dateField].startsWith(month))
  }

  const usedChartCategories = (() => {
    const filtered = filterUsedByMonth(usedData.completedUsed, 'soldAt', usedChartMonth)
    const catMap = {}
    filtered.forEach(s => {
      s.items?.forEach(it => {
        const cat = it.category || 'tire'
        if (!catMap[cat]) catMap[cat] = { count: 0, revenue: 0, profit: 0 }
        catMap[cat].count += it.qty || 1
        catMap[cat].revenue += it.salePrice || 0
        catMap[cat].profit += (it.salePrice || 0) - (it.acquiredPrice || 0)
      })
    })
    return Object.entries(catMap).map(([id, v]) => ({
      label: getCatLabelPlural(id), ...v
    }))
  })()

  const usedHistorySales = filterUsedByMonth(usedData.allUsedSales, 'soldAt', usedHistoryMonth)

  // --- TAB 2: STOCK ---
  const stockStats = useMemo(() => {
    // Shop-aware batch va item filtrlash
    const shopBatches = selectedShopId === 'all' ? MOCK_BATCHES : MOCK_BATCHES.filter(b => b.shopId === selectedShopId)
    const shopBatchIds = new Set(shopBatches.map(b => b.id))
    const shopItems = selectedShopId === 'all' ? MOCK_ITEMS : MOCK_ITEMS.filter(i => shopBatchIds.has(i.batchId))

    // Oxirgi 30 kun sotuv tezligini real sotuv tarixidan hisoblash
    const thirtyDaysAgo = new Date(TODAY)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10)

    // productId → oxirgi 30 kunda sotilgan dona soni
    const soldLast30 = {}
    MOCK_SALES.filter(s => s.status !== 'cancelled' && s.soldAt && s.soldAt.slice(0,10) >= thirtyDaysAgoStr)
      .forEach(s => {
        (s.items || []).forEach(it => {
          const pid = it.productId
          if (pid) soldLast30[pid] = (soldLast30[pid] || 0) + (it.qty || 1)
        })
      })

    // MOCK_PRODUCTS + shopItems dan real qoldiq hisoblash (faqat shu shop produktlari)
    const stockList = MOCK_PRODUCTS.filter(p => shopBatches.some(b => b.productId === p.id)).map(p => {
      const inStock = shopItems.filter(i => i.productId === p.id && i.status === 'in_stock').length

      // Kirim narxi: MOCK_INCOME_BATCHES dan yoki shopBatches dan
      const batch = shopBatches.filter(b => b.productId === p.id).slice(-1)[0]
      const ib = MOCK_INCOME_BATCHES.find(ib => ib.batchId === batch?.id)
      const purchasePrice = ib?.purchasePriceUSD && ib?.entryUsdRate
        ? Math.round(ib.purchasePriceUSD * ib.entryUsdRate)
        : (batch?.purchasePrice || p.purchasePrice || 0)

      // Oxirgi sotilgan
      const soldItems = shopItems.filter(i => i.productId === p.id && i.status === 'sold' && i.soldAt)
      const lastSoldAt = soldItems.length > 0
        ? soldItems.sort((a,b) => new Date(b.soldAt) - new Date(a.soldAt))[0].soldAt?.slice(0,10)
        : p.lastSoldAt || null

      // Oxirgi kirim sanasi
      const lastBatch = shopBatches.filter(b => b.productId === p.id)
        .sort((a,b) => new Date(b.receivedAt) - new Date(a.receivedAt))[0]
      const lastReceivedAt = lastBatch?.receivedAt?.slice(0,10) || null

      // Kunlik sotuv tezligi — oxirgi 30 kun real sotuvdan
      const dailySalesRate = Math.round((soldLast30[p.id] || 0) / 30 * 100) / 100

      return {
        productId: p.id,
        productName: p.name,
        category: p.category,
        inStock,
        purchasePrice,
        cashPrice: p.cashPrice,
        lowStockThreshold: p.lowStockThreshold || 3,
        lastReceivedAt,
        dailySalesRate,
        lastSoldAt,
      }
    })

    const totalItems      = stockList.reduce((s, x) => s + x.inStock, 0)
    const frozenCapital   = stockList.reduce((s, x) => s + x.inStock * x.purchasePrice, 0)
    const potentialRevenue = stockList.reduce((s, x) => s + x.inStock * x.cashPrice, 0)
    const lowStockCount   = stockList.filter(x => x.inStock <= x.lowStockThreshold && x.inStock > 0).length
    const outOfStockCount = stockList.filter(x => x.inStock === 0).length
    const potentialProfit = potentialRevenue - frozenCapital

    const withDaysLeft = stockList.map(x => {
      const catSetting = storeProductCategories?.find(c => c.id === x.category)
      const stdDays    = catSetting?.turnoverDays || (x.category === 'tire' ? 45 : x.category === 'wheel' ? 60 : 30)
      const daysLeft = x.dailySalesRate > 0 ? Math.round(x.inStock / x.dailySalesRate) : null
      const turnoverStatus = x.inStock === 0 ? 'out'
        : daysLeft === null ? 'unknown'
        : daysLeft > stdDays * 1.5 ? 'slow'
        : daysLeft > stdDays ? 'normal'
        : 'fast'

      const daysSinceLastSold = x.lastSoldAt
        ? Math.round((new Date(TODAY) - new Date(x.lastSoldAt)) / 86400000)
        : null

      return {
        ...x,
        daysLeft,
        stdDays,
        turnoverStatus,
        daysSinceLastSold,
        margin: x.cashPrice > 0 ? Math.round(((x.cashPrice - x.purchasePrice) / x.cashPrice) * 100) : 0,
      }
    }).sort((a, b) => a.inStock - b.inStock)

    const staleItems    = withDaysLeft.filter(x => x.inStock > 0 && x.turnoverStatus === 'slow')
    const staleCount    = staleItems.length
    const notSoldItems  = withDaysLeft.filter(x => x.inStock > 0 && (x.daysSinceLastSold === null || x.daysSinceLastSold > notSoldDays))
    const notSoldCount  = notSoldItems.length

    // Kategoriya bo'yicha kapital
    const catCapital = {}
    stockList.forEach(x => {
      catCapital[x.category] = (catCapital[x.category] || 0) + x.inStock * x.purchasePrice
    })
    const chartCapitalByCategory = [
      { name: getCatLabelPlural('tire'),      value: catCapital['tire']      || 0 },
      { name: getCatLabelPlural('wheel'),     value: catCapital['wheel']     || 0 },
      { name: getCatLabelPlural('accessory'), value: catCapital['accessory'] || 0 },
    ]

    // Oylik kapital harakati (MOCK_INCOME_BATCHES dan)
    const _capMonthsSet = new Set()
    _capMonthsSet.add(new Date().toISOString().slice(0, 7))
    MOCK_INCOME_BATCHES.forEach(b => { if (b.receivedAt) _capMonthsSet.add(b.receivedAt.slice(0, 7)) })
    MOCK_SALES.forEach(s => { if (s.soldAt) _capMonthsSet.add(s.soldAt.slice(0, 7)) })
    const _capMNamesArr = t('exp_month_names', { returnObjects: true })
    const MONTHS_LIST = Array.from(_capMonthsSet).sort().reverse()
    const monthlyCapitalByCategory = MONTHS_LIST.map(m => {
      const catMap = {}
      MOCK_PRODUCTS.forEach(p => { catMap[p.id] = p.category })
      const [_y, _mo] = m.split('-')
      const tire = MOCK_INCOME_BATCHES
        .filter(b => b.receivedAt?.startsWith(m) && catMap[b.productId] === 'tire')
        .reduce((s, b) => s + (b.totalUZS_atEntry || 0), 0)
      const wheel = MOCK_INCOME_BATCHES
        .filter(b => b.receivedAt?.startsWith(m) && catMap[b.productId] === 'wheel')
        .reduce((s, b) => s + (b.totalUZS_atEntry || 0), 0)
      const accessory = MOCK_INCOME_BATCHES
        .filter(b => b.receivedAt?.startsWith(m) && catMap[b.productId] === 'accessory')
        .reduce((s, b) => s + (b.totalUZS_atEntry || 0), 0)
      return { month: m, name: `${_capMNamesArr[parseInt(_mo) - 1] || _mo} ${_y}`, tire, wheel, accessory }
    })

    // Aylanma standartlari
    const turnoverStandards = [
      { category: 'tire',      label: getCatLabelPlural('tire'),      stdDays: storeProductCategories?.find(c=>c.id==='tire')?.turnoverDays      || 45 },
      { category: 'wheel',     label: getCatLabelPlural('wheel'),     stdDays: storeProductCategories?.find(c=>c.id==='wheel')?.turnoverDays     || 60 },
      { category: 'accessory', label: getCatLabelPlural('accessory'), stdDays: storeProductCategories?.find(c=>c.id==='accessory')?.turnoverDays || 30 },
    ].map(s => {
      const items = withDaysLeft.filter(x => x.category === s.category && x.inStock > 0 && x.daysLeft !== null)
      const avgDays = items.length > 0
        ? Math.round(items.reduce((sum, x) => sum + x.daysLeft, 0) / items.length)
        : null
      const status = avgDays === null ? 'unknown'
        : avgDays <= s.stdDays ? 'good'
        : avgDays <= s.stdDays * 1.5 ? 'warning'
        : 'slow'
      return { ...s, avgDays, status }
    })

    const outOfStockItems = withDaysLeft.filter(x => x.inStock === 0)
    const lowStockItems   = withDaysLeft.filter(x => x.inStock > 0 && x.inStock <= x.lowStockThreshold)

    const frozenByProduct = [...withDaysLeft]
      .filter(x => x.inStock > 0)
      .sort((a, b) => (b.inStock * b.purchasePrice) - (a.inStock * a.purchasePrice))

    // Ombor qoldig'i jadvali — MOCK_SALES dan oxirgi sotuv
    const stockWithSales = withDaysLeft.map(x => {
      const productSales = MOCK_SALES.filter(s => s.status !== 'cancelled' && s.items?.some(i => i.productId === x.productId))
      const totalSold = MOCK_ITEMS.filter(i => i.productId === x.productId && i.status === 'sold').length
      const lastSale = productSales.sort((a,b) => new Date(b.soldAt) - new Date(a.soldAt))[0]
      return { ...x, totalSold, lastSaleDate: lastSale?.soldAt?.slice(0,10) || null }
    })

    return {
      totalItems, frozenCapital, potentialRevenue, potentialProfit,
      lowStockCount, outOfStockCount, withDaysLeft, staleCount, staleItems, notSoldCount, notSoldItems,
      chartCapitalByCategory, monthlyCapitalByCategory, turnoverStandards,
      outOfStockItems, lowStockItems, frozenByProduct, stockWithSales,
    }
  }, [storeProductCategories, notSoldDays, selectedShopId, MOCK_SALES, MOCK_ITEMS, MOCK_PRODUCTS, MOCK_INCOME_BATCHES])

  const filteredStock = stockCategory === 'all'
    ? stockStats.withDaysLeft
    : stockStats.withDaysLeft.filter(x => x.category === stockCategory)

  // --- TAB 3: PROFIT ---
  const profitStats = useMemo(() => {
    const filteredSales    = filterByPeriod(MOCK_SALES, 'soldAt').filter(s => s.status !== 'cancelled' && !s._isExchange)
    const filteredExpenses = filterByPeriod(MOCK_EXPENSES, 'date')
    const totalSalesAmt    = filteredSales.reduce((s, x) => s + x.total, 0)
    const totalProfit      = filteredSales.reduce((s, x) => s + getSaleProfit(x) - (x.paymentType === 'installment' ? (x.installmentCommissionAmount ?? 0) : 0), 0)
    const totalExpenses    = filteredExpenses.reduce((s, x) => s + x.amountUZS, 0)
    const netProfit        = totalProfit - totalExpenses
    const profitMargin     = totalSalesAmt > 0 ? Math.round((totalProfit / totalSalesAmt) * 100) : 0
    const breakEven        = totalExpenses

    // expenseType orqali doimiy/o'zgaruvchan
    const fixedExpenses = filteredExpenses.filter(e => e.expenseType === 'fixed').reduce((s,x) => s+x.amountUZS, 0)
    const varExpenses   = filteredExpenses.filter(e => e.expenseType === 'variable').reduce((s,x) => s+x.amountUZS, 0)

    const _monthsSet = new Set()
    const _currentMonth = new Date().toISOString().slice(0, 7)
    _monthsSet.add(_currentMonth)
    MOCK_SALES.forEach(s => { if (s.soldAt) _monthsSet.add(s.soldAt.slice(0, 7)) })
    MOCK_EXPENSES.forEach(e => { if (e.date) _monthsSet.add(e.date.slice(0, 7)) })
    const MONTHS_ASC  = Array.from(_monthsSet).sort()
    const MONTHS      = [...MONTHS_ASC].reverse()
    const MONTHS_CHART = MONTHS_ASC
    const monthNames  = {}
    MONTHS_ASC.forEach(m => { monthNames[m] = getMonthLabel(m) })

    const MONTHLY_TARGETS_LIVE = (storeMonthlyTargets && Object.keys(storeMonthlyTargets).length > 0)
      ? storeMonthlyTargets
      : { '2026-03': 12000000, '2026-04': 14000000, '2026-05': 16000000, '2026-06': 18000000 }

    const monthlyChart = MONTHS_CHART.map((m, i) => {
      const prevIdx = MONTHS_ASC.indexOf(m) - 1
      const prev    = prevIdx >= 0 ? MONTHS_ASC[prevIdx] : null
      const mSales  = MOCK_SALES.filter(s => s.soldAt && s.soldAt.startsWith(m) && s.status !== 'cancelled')
      const mExp    = MOCK_EXPENSES.filter(e => e.date && e.date.startsWith(m))
      const sotuv   = mSales.reduce((s,x) => s+x.total, 0)
      const foyda   = mSales.reduce((s,x) => s+getSaleProfit(x)-(x.paymentType==='installment'?(x.installmentCommissionAmount??0):0), 0)
      const xarajat = mExp.reduce((s,x) => s+x.amountUZS, 0)
      const sof     = foyda - xarajat
      const target  = MONTHLY_TARGETS_LIVE[m] || 0

      const prevSales = prev ? MOCK_SALES.filter(s => s.soldAt && s.soldAt.startsWith(prev) && s.status !== 'cancelled') : []
      const prevExp   = prev ? MOCK_EXPENSES.filter(e => e.date && e.date.startsWith(prev)) : []
      const prevSotuv   = prevSales.reduce((s,x) => s+x.total, 0)
      const prevFoyda   = prevSales.reduce((s,x) => s+getSaleProfit(x)-(x.paymentType==='installment'?(x.installmentCommissionAmount??0):0), 0)
      const prevXarajat = prevExp.reduce((s,x) => s+x.amountUZS, 0)
      const prevSof     = prevFoyda - prevXarajat

      return {
        name: monthNames[m], month: m, sotuv, foyda, xarajat, sof, maqsad: target,
        growthSotuv:   prevSotuv   > 0 ? Math.round(((sotuv   - prevSotuv)   / prevSotuv)   * 100) : null,
        growthFoyda:   prevFoyda   > 0 ? Math.round(((foyda   - prevFoyda)   / prevFoyda)   * 100) : null,
        growthXarajat: prevXarajat > 0 ? Math.round(((xarajat - prevXarajat) / prevXarajat) * 100) : null,
        growthSof:     prevSof !== 0   ? Math.round(((sof     - prevSof)     / Math.abs(prevSof)) * 100) : null,
      }
    })

    const expMap = {}
    filteredExpenses.forEach(e => {
      const label = i18n.language === 'ru'
        ? (e.noteRu || e.note || e.categoryLabel || 'Прочее')
        : (e.note || e.categoryLabel || 'Boshqa')
      expMap[label] = (expMap[label] || 0) + e.amountUZS
    })
    const expChart = Object.entries(expMap).map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value)

    const expByMonth = MONTHS_CHART.map((m, i) => {
      const prevIdx    = MONTHS_ASC.indexOf(m) - 1
      const prev       = prevIdx >= 0 ? MONTHS_ASC[prevIdx] : null
      const doimiy    = MOCK_EXPENSES.filter(e => e.date && e.date.startsWith(m) && e.expenseType === 'fixed').reduce((s,x) => s+x.amountUZS, 0)
      const ozgar     = MOCK_EXPENSES.filter(e => e.date && e.date.startsWith(m) && e.expenseType === 'variable').reduce((s,x) => s+x.amountUZS, 0)
      const prevDoimiy = prev ? MOCK_EXPENSES.filter(e => e.date && e.date.startsWith(prev) && e.expenseType === 'fixed').reduce((s,x) => s+x.amountUZS, 0) : 0
      const prevOzgar  = prev ? MOCK_EXPENSES.filter(e => e.date && e.date.startsWith(prev) && e.expenseType === 'variable').reduce((s,x) => s+x.amountUZS, 0) : 0
      return {
        name: monthNames[m], month: m, doimiy, ozgaruvchan: ozgar,
        growthDoimiy: prevDoimiy > 0 ? Math.round(((doimiy - prevDoimiy) / prevDoimiy) * 100) : null,
        growthOzgar:  prevOzgar  > 0 ? Math.round(((ozgar  - prevOzgar)  / prevOzgar)  * 100) : null,
      }
    })

    const dailyBreakdown = (() => {
      const map = {}
      MOCK_SALES.filter(s => s.status !== 'cancelled').forEach(s => {
        if (!s.soldAt) return
        const d = s.soldAt.slice(0,10)
        if (!map[d]) map[d] = { date: d, revenue: 0, profit: 0, usedProfit: 0, expenses: 0 }
        map[d].revenue += s.total
        map[d].profit  += getSaleProfit(s) - (s.paymentType === 'installment' ? (s.installmentCommissionAmount ?? 0) : 0)
      })
      MOCK_USED_SALES.filter(s => s.status !== 'cancelled').forEach(s => {
        if (!s.soldAt) return
        const d = s.soldAt.slice(0,10)
        if (!map[d]) map[d] = { date: d, revenue: 0, profit: 0, usedProfit: 0, expenses: 0 }
        const commission = s.paymentType === 'installment' ? (s.installmentCommissionAmount ?? 0) : 0
        map[d].revenue    += s.total || 0
        map[d].usedProfit += getUsedSaleProfit(s) - commission
      })
      MOCK_EXPENSES.forEach(e => {
        if (!map[e.date]) map[e.date] = { date: e.date, revenue: 0, profit: 0, usedProfit: 0, expenses: 0 }
        map[e.date].expenses += e.amountUZS
      })
      return Object.values(map)
        .map(d => ({ ...d, net: d.profit + d.usedProfit - d.expenses }))
        .sort((a,b) => a.date.localeCompare(b.date))
    })()

    // Xarajat jami (3 manba: MOCK_EXPENSES + MOCK_INCOME_BATCHES to'lovlari + MOCK_CAPITAL qaytarish)
    const combinedExpenses = [
      ...MOCK_EXPENSES.map(e => ({
        id: e.id, date: e.date, name: e.note || e.categoryLabel || 'Xarajat',
        type: 'Operatsion xarajat', amount: e.amountUZS, currency: 'UZS'
      })),
      ...MOCK_INCOME_BATCHES.filter(x => x.paidUSD > 0).map(x => ({
        id: x.id, date: x.receivedAt?.slice(0,10) || x.dueDate || TODAY,
        name: x.productName,
        type: 'Tovar xaridi', amount: Math.round(x.paidUSD * USD_RATE), currency: 'UZS'
      })),
      ...MOCK_CAPITAL.filter(c => c.type === 'return').map(c => ({
        id: c.id, date: c.date, name: c.source || 'Kapital',
        type: 'Kapital qaytarish', amount: c.amountUZS, currency: 'UZS'
      })),
    ].sort((a,b) => a.date.localeCompare(b.date))

    // Tovar xaridlari oylik
    const inventoryByMonth = {}
    MOCK_INCOME_BATCHES.filter(x => x.paidUSD > 0).forEach(x => {
      const m = (x.receivedAt || x.dueDate || TODAY).slice(0,7)
      if (!inventoryByMonth[m]) inventoryByMonth[m] = { total: 0, items: [] }
      inventoryByMonth[m].total += Math.round(x.paidUSD * USD_RATE)
      inventoryByMonth[m].items.push({ name: x.productName, paidUSD: x.paidUSD, paidUZS: Math.round(x.paidUSD * USD_RATE), date: x.receivedAt?.slice(0,10) || TODAY, usdRate: x.entryUsdRate || USD_RATE })
    })
    const inventoryTotal = Object.values(inventoryByMonth).reduce((s,m) => s+m.total, 0)

    // Kapital qaytarish oylik
    const capitalReturnByMonth = {}
    MOCK_CAPITAL.filter(c => c.type === 'return').forEach(cap => {
      const m = cap.date?.slice(0,7) || TODAY.slice(0,7)
      if (!capitalReturnByMonth[m]) capitalReturnByMonth[m] = { total: 0, items: [] }
      capitalReturnByMonth[m].total += cap.amountUZS
      capitalReturnByMonth[m].items.push({ name: cap.source || 'Kapital', amount: cap.amountUZS, date: cap.date })
    })
    const capitalReturnTotal = Object.values(capitalReturnByMonth).reduce((s,m) => s+m.total, 0)

    return {
      filteredSales, totalSalesAmt, totalProfit, totalExpenses, netProfit,
      profitMargin, breakEven, fixedExpenses, varExpenses,
      monthlyChart, expChart, expByMonth, dailyBreakdown, combinedExpenses,
      inventoryByMonth, inventoryTotal, capitalReturnByMonth, capitalReturnTotal,
    }
  }, [period, filterByPeriod, storeMonthlyTargets, storeUsdRate, i18n.language, selectedShopId, MOCK_SALES, MOCK_PRODUCTS, MOCK_INCOME_BATCHES, MOCK_EXPENSES, MOCK_CAPITAL, MOCK_USED_SALES])

  // --- TAB 4: CUSTOMERS ---
  const customerStats = useMemo(() => {
    const completed   = filterByPeriod(MOCK_SALES, 'soldAt').filter(s => s.status !== 'cancelled')
    const newCount    = completed.filter(s => s.isNewCustomer).length
    const returnCount = completed.filter(s => !s.isNewCustomer).length
    const retentionRate = (newCount + returnCount) > 0
      ? Math.round((returnCount / (newCount + returnCount)) * 100) : 0

    const shopCustomers = MOCK_CUSTOMERS
    const ltvList = shopCustomers.map(c => {
      // firstVisit: c.firstVisit → birinchi sotuv sanasi (yangi + B/U) → bugun
      const _custSalesAll = [
        ...MOCK_SALES.filter(s => s.customerId === c.id && s.status !== 'cancelled'),
        ...MOCK_USED_SALES.filter(s => s.customerId === c.id && s.status !== 'cancelled'),
      ].sort((a,b) => a.soldAt.localeCompare(b.soldAt))
      const firstVisit = c.firstVisit
        || (_custSalesAll[0]?.soldAt?.slice(0, 10))
        || TODAY
      const lastVisit = (_custSalesAll[_custSalesAll.length - 1]?.soldAt?.slice(0, 10))
        || c.lastVisit
        || TODAY
      const minAmt2 = storeLoyaltyMinAmount || 100000
      // Customers.jsx bilan bir xil: yangi + B/U sotuvlardan qualified sotuvlar soni
      const qualifiedVisits = _custSalesAll.filter(s => s.total >= minAmt2).length
      // totalVisits = yangi + B/U sotuvlar soni (cancelled emas).
      // MOCK_CUSTOMERS.visits massivi sotuvlar bilan mos kelmaydi,
      // shuning uchun yagona manba sifatida sotuvlar ishlatiladi.
      const totalVisits = _custSalesAll.length
      const computedLevel = qualifiedVisits >= GOLD_THRESHOLD ? 'gold'
        : qualifiedVisits >= SILVER_THRESHOLD ? 'silver'
        : 'bronze'
      // Yangi + B/U sotuvlardan haqiqiy sotuv summasi
      const customerSales = _custSalesAll
      const totalSpent = customerSales.reduce((s,x) => s+x.total, 0)
      // Minimal 30 kun ishlatiladi (yangi mijoz uchun LTV ni oshirib ko'rsatmaslik uchun)
      const days       = Math.max(30, Math.round((new Date(TODAY) - new Date(firstVisit)) / 86400000))
      const avgMonthly = Math.round(totalSpent / (days / 30))
      const cancelledSales = [
        ...MOCK_SALES.filter(s => s.customerId === c.id && s.status === 'cancelled'),
        ...MOCK_USED_SALES.filter(s => s.customerId === c.id && s.status === 'cancelled'),
      ]
      const discountSales  = customerSales.filter(s => s.discount > 0)
      const avgCheck = customerSales.length > 0
        ? Math.round(totalSpent / customerSales.length) : 0

      // Tashriflar oraliq — MOCK_SALES dagi soldAt sanalaridan hisoblash
      const visitDates = customerSales.map(s => s.soldAt.slice(0, 10)).sort()
      let avgInterval = null
      if (visitDates.length >= 2) {
        const intervals = []
        for (let i = 1; i < visitDates.length; i++) {
          intervals.push(Math.round((new Date(visitDates[i]) - new Date(visitDates[i-1])) / 86400000))
        }
        avgInterval = Math.round(intervals.reduce((s,x) => s+x, 0) / intervals.length)
      }

      const nextLevel = computedLevel === 'bronze' ? { level:'silver', need: Math.max(0, SILVER_THRESHOLD - qualifiedVisits) }
        : computedLevel === 'silver' ? { level:'gold', need: Math.max(0, GOLD_THRESHOLD - qualifiedVisits) }
        : null

      const daysSinceLastVisit = Math.round((new Date(TODAY) - new Date(lastVisit)) / 86400000)
      const churnRisk = daysSinceLastVisit > 180 ? 'high'
        : daysSinceLastVisit > 90  ? 'medium'
        : daysSinceLastVisit > 60  ? 'low'
        : 'none'

      const birthMonth = c.birthDate ? parseInt(c.birthDate.split('-')[1]) : null
      const todayMonth = parseInt(TODAY.split('-')[1])
      const isBirthdayMonth = birthMonth === todayMonth

      // loyaltyGrantedAt: Silver/Gold ga o'tgan sana — N-chi qualified sotuv sanasi
      const threshold = computedLevel === 'gold' ? GOLD_THRESHOLD : computedLevel === 'silver' ? SILVER_THRESHOLD : null
      const sortedQualified = [..._custSalesAll]
        .filter(s => s.total >= minAmt2)
        .sort((a, b) => a.soldAt.localeCompare(b.soldAt))
      const loyaltyGrantedAt = threshold && sortedQualified[threshold - 1]
        ? sortedQualified[threshold - 1].soldAt?.slice(0, 10)
        : null
      const loyaltyReason = "Tashrif soni to'ldi"

      return {
        ...c, totalVisits, totalSpent, avgMonthly, ltv12m: avgMonthly * 12,
        firstVisit, lastVisit,
        customerSales, cancelledSales, discountSales,
        avgCheck, avgInterval, nextLevel,
        daysSinceLastVisit, churnRisk, isBirthdayMonth,
        qualifiedVisits, loyaltyLevel: computedLevel,
        loyaltyGrantedAt, loyaltyReason,
      }
    }).sort((a,b) => b.totalSpent - a.totalSpent)

    // loyaltyLevel — ltvList bilan bir xil: MOCK_SALES + MOCK_USED_SALES dan (s.total >= loyaltyMinAmount)
    const loyaltyStatsRaw = { bronze: 0, silver: 0, gold: 0 }
    const minAmt = storeLoyaltyMinAmount || 100000
    shopCustomers.forEach(cust => {
      const qualified = [
        ...MOCK_SALES.filter(s => s.customerId === cust.id && s.status !== 'cancelled' && s.total >= minAmt),
        ...MOCK_USED_SALES.filter(s => s.customerId === cust.id && s.status !== 'cancelled' && s.total >= minAmt),
      ].length
      if (qualified >= GOLD_THRESHOLD) loyaltyStatsRaw.gold++
      else if (qualified >= SILVER_THRESHOLD) loyaltyStatsRaw.silver++
      else loyaltyStatsRaw.bronze++
    })
    const loyaltyStats = loyaltyStatsRaw

    const sourceMap = {}
    completed.forEach(s => {
      const src = s.source || 'walk_in'
      if (!sourceMap[src]) sourceMap[src] = { count: 0, revenue: 0, customers: new Set() }
      sourceMap[src].count++
      sourceMap[src].revenue += s.total
      if (s.customerId) sourceMap[src].customers.add(s.customerId)
    })
    const chartSources = Object.entries(sourceMap)
      .map(([key, v]) => ({
        key, name: getSourceLabel(key),
        count: v.count, revenue: v.revenue,
        uniqueCustomers: v.customers.size,
        avgCheck: v.count > 0 ? Math.round(v.revenue / v.count) : 0,
      }))
      .sort((a,b) => b.count - a.count)

    const avgLTV = ltvList.length > 0
      ? Math.round(ltvList.reduce((s,c) => s+c.ltv12m, 0) / ltvList.length) : 0

    const churnRiskList = ltvList.filter(c => c.churnRisk !== 'none')
      .sort((a,b) => b.daysSinceLastVisit - a.daysSinceLastVisit)

    const birthdayList = ltvList.filter(c => c.isBirthdayMonth)

    const _retMonthsSet = new Set()
    _retMonthsSet.add(new Date().toISOString().slice(0, 7))
    MOCK_SALES.forEach(s => { if (s.soldAt) _retMonthsSet.add(s.soldAt.slice(0, 7)) })
    const MONTHS = Array.from(_retMonthsSet).sort().reverse()
    const monthNames = {}
    MONTHS.forEach(m => { monthNames[m] = getMonthLabel(m) })
    const monthlyRetention = MONTHS.map((m, i) => {
      const sales = MOCK_SALES.filter(s => s.status !== 'cancelled' && s.soldAt && s.soldAt.startsWith(m))
      const newC  = sales.filter(s => s.isNewCustomer).length
      const retC  = sales.filter(s => !s.isNewCustomer).length
      const total = newC + retC || 1
      return {
        name: monthNames[m], month: m,
        newCount: newC, returnCount: retC,
        retentionRate: Math.round(retC / total * 100),
      }
    })

    return {
      newCount, returnCount, retentionRate,
      ltvList, loyaltyStats, chartSources, avgLTV,
      totalCustomers: shopCustomers.length,
      churnRiskList, birthdayList, monthlyRetention,
    }
  }, [period, filterByPeriod, storeLoyaltyVisitsRequired, storeSilverVisits, storeLoyaltyMinAmount, selectedShopId, MOCK_SALES, MOCK_CUSTOMERS, MOCK_USED_SALES])

  // --- TAB 5: EMPLOYEES ---
  // Oylik sotuv dinamikasi hisoblash (universal)
  const getMonthsList = () => {
    const months = new Set()
    const currentMonth = new Date().toISOString().slice(0, 7)
    months.add(currentMonth)
    MOCK_SALES.forEach(s => { if (s.soldAt) months.add(s.soldAt.slice(0,7)) })
    MOCK_EXPENSES.forEach(e => { if (e.date) months.add(e.date.slice(0,7)) })
    return Array.from(months).sort().reverse()
  }
  const MONTHS = getMonthsList()

  const getMonthNameUz = (m) => getMonthLabel(m)

  const MONTHS_ASC_LOCAL = [...MONTHS].reverse()
  const getMonthlySalesChart = () => [...MONTHS].reverse().map((m, i) => {
    const prevIdx = MONTHS_ASC_LOCAL.indexOf(m) - 1
    const prev    = prevIdx >= 0 ? MONTHS_ASC_LOCAL[prevIdx] : null
    const cur  = MOCK_SALES.filter(s => s.soldAt && s.soldAt.startsWith(m) && s.status !== 'cancelled')
    const prv  = prev ? MOCK_SALES.filter(s => s.soldAt && s.soldAt.startsWith(prev) && s.status !== 'cancelled') : []
    const total   = cur.reduce((s, x) => s + x.total, 0)
    const profit  = cur.reduce((s, x) => s + getSaleProfit(x) - (x.paymentType === 'installment' ? (x.installmentCommissionAmount ?? 0) : 0), 0)
    const count   = cur.length
    const prevTotal  = prv.reduce((s, x) => s + x.total, 0)
    const prevProfit = prv.reduce((s, x) => s + getSaleProfit(x) - (x.paymentType === 'installment' ? (x.installmentCommissionAmount ?? 0) : 0), 0)
    const prevCount  = prv.length
    const MONTHLY_TARGETS_LIVE = (storeMonthlyTargets && Object.keys(storeMonthlyTargets).length > 0)
      ? storeMonthlyTargets
      : { '2026-03': 12000000, '2026-04': 14000000, '2026-05': 16000000, '2026-06': 18000000 }
    const monthExpenses = MOCK_EXPENSES.filter(e => e.date && e.date.startsWith(m)).reduce((sum, e) => sum + (e.amountUZS || 0), 0)
    const target  = MONTHLY_TARGETS_LIVE[m] || monthExpenses || 0
    const targetPct = target > 0 ? Math.round((total / target) * 100) : null
    const installmentTotal = cur.filter(s => s.paymentType === 'installment').reduce((s, x) => s + x.installmentDebt, 0)
    return {
      name: getMonthNameUz(m), month: m,
      total, profit, count, target, targetPct,
      installmentTotal,
      growthTotal:  prevTotal  > 0 ? Math.round(((total  - prevTotal)  / prevTotal)  * 100) : null,
      growthProfit: prevProfit > 0 ? Math.round(((profit - prevProfit) / prevProfit) * 100) : null,
      growthCount:  prevCount  > 0 ? Math.round(((count  - prevCount)  / prevCount)  * 100) : null,
    }
  })

  const employeeStats = useMemo(() => {
    const salesNames = [...new Set(MOCK_SALES.map(s => s.soldByName?.trim().toLowerCase()).filter(Boolean))]
    // storeEmployees + savdolarda bor lekin ro'yxatda yo'q nomlarni virtual xodim sifatida qo'sh
    const storeEmpNames = new Set((storeEmployees || []).map(e => e.name?.trim().toLowerCase()).filter(Boolean))
    const extraSellers = salesNames
      .filter(n => !storeEmpNames.has(n))
      .map((n, i) => ({
        id: `seller_${n}`,
        name: MOCK_SALES.find(s => s.soldByName?.trim().toLowerCase() === n)?.soldByName || n,
        role: 'seller', phone: '', hiredAt: '', salary: 0, isActive: true, _virtual: true,
      }))
    const baseList = [...(storeEmployees || []), ...extraSellers]
    const EMPLOYEES_DATA = selectedShopId === 'all'
      ? baseList
      : baseList.filter(e => e.name && salesNames.includes(e.name.trim().toLowerCase()))
    const EMPLOYEE_TARGETS = (storeEmployeeTargets && Object.keys(storeEmployeeTargets).length > 0)
      ? storeEmployeeTargets
      : { 1:{'2026-03':5000000,'2026-04':6000000,'2026-05':7000000}, 2:{'2026-03':4000000,'2026-04':5000000,'2026-05':6000000}, 3:{'2026-03':3000000,'2026-04':3500000,'2026-05':4000000} }

    if (!EMPLOYEES_DATA || !Array.isArray(EMPLOYEES_DATA) || EMPLOYEES_DATA.length === 0) {
      return { empStats:[], activeCount:0, topSeller:null, monthlyActivity:[], cancelByEmp:[], totalCancelled:0 }
    }

    const completed  = filterByPeriod(MOCK_SALES, 'soldAt').filter(s => s.status !== 'cancelled')
    const cancelled  = filterByPeriod(MOCK_SALES, 'soldAt').filter(s => s.status === 'cancelled')
    const allSales   = filterByPeriod(MOCK_SALES, 'soldAt')

    const _empMonthsSet = new Set()
    _empMonthsSet.add(new Date().toISOString().slice(0, 7))
    MOCK_SALES.forEach(s => { if (s.soldAt) _empMonthsSet.add(s.soldAt.slice(0, 7)) })
    const MONTHS = Array.from(_empMonthsSet).sort().reverse()
    const EMP_MONTHS_ASC_BASE = Array.from(_empMonthsSet).sort()
    const monthNames = {}
    MONTHS.forEach(m => { monthNames[m] = getMonthLabel(m) })

    const shopReturns = selectedShopId === 'all' ? MOCK_RETURNS : MOCK_RETURNS.filter(r => r.shopId === selectedShopId)

    // Har xodim uchun statistika
    // soldByName bo'yicha moslashtirish (users.id vs employees.id to'qnashuvini oldini olish)
    const matchSale = (s, emp) =>
      s.soldByName && emp.name
        ? s.soldByName.trim().toLowerCase() === emp.name.trim().toLowerCase()
        : String(s.soldBy) === String(emp.id)
    const matchReturn = (r, emp) =>
      r.processedByName && emp.name
        ? r.processedByName.trim().toLowerCase() === emp.name.trim().toLowerCase()
        : String(r.processedBy) === String(emp.id)

    const empStats = EMPLOYEES_DATA.map(emp => {
      const empCompleted = completed.filter(s => matchSale(s, emp))
      const empCancelled = cancelled.filter(s => matchSale(s, emp))
      // MOCK_RETURNS ham qo'shamiz - qaytarish va almashtirish
      const empReturns = shopReturns.filter(r => matchReturn(r, emp))
      const empAll       = allSales.filter(s => matchSale(s, emp))

      const totalSales   = empCompleted.reduce((s,x) => s+x.total, 0)
      const totalProfit  = empCompleted.reduce((s,x) => s+getSaleProfit(x), 0)
      const salesCount   = empCompleted.length
      const isExchange   = s => s.cancelReason === 'almashtirish' || s.cancelReason === 'exchange' || s._isExchange
      const cancelCount  = empCancelled.filter(s => !isExchange(s)).length
      const cancelPct    = empAll.length > 0 ? Math.round(cancelCount / empAll.length * 100) : 0
      const avgCheck     = salesCount > 0 ? Math.round(totalSales/salesCount) : 0
      const newCustomers = empCompleted.filter(s => s.isNewCustomer).length
      const discountSales = empCompleted.filter(s => s.discount > 0)
      const avgDiscount  = discountSales.length > 0
        ? Math.round(discountSales.reduce((s,x) => s+x.discount,0)/discountSales.length) : 0
      const maxDiscount  = discountSales.length > 0 ? Math.max(...discountSales.map(s=>s.discount)) : 0
      const lostRevenue  = empCompleted.reduce((s,x) => s+(x.subtotal-x.total), 0)

      // Oxirgi sotuv sanasi
      const lastSale = empCompleted.length > 0
        ? empCompleted.filter(s=>s.soldAt).sort((a,b) => b.soldAt.localeCompare(a.soldAt))[0]?.soldAt?.slice(0,10) || null
        : null

      // Oylik statistika
      const EMP_MONTHS_ASC = EMP_MONTHS_ASC_BASE
      const monthly = MONTHS.map((m, i) => {
        const prevIdx   = EMP_MONTHS_ASC.indexOf(m) - 1
        const prev      = prevIdx >= 0 ? EMP_MONTHS_ASC[prevIdx] : null
        const mSales    = MOCK_SALES.filter(s => matchSale(s, emp) && s.status!=='cancelled' && s.soldAt && s.soldAt.startsWith(m))
        const mTotal    = mSales.reduce((s,x) => s+x.total, 0)
        const mProfit   = mSales.reduce((s,x) => s+getSaleProfit(x), 0)
        const mCount    = mSales.length
        const mTarget   = EMPLOYEE_TARGETS[emp.id]?.[m] || 0
        const mTargetPct = mTarget > 0 ? Math.round(mTotal/mTarget*100) : null
        const prevSales = prev
          ? MOCK_SALES.filter(s => matchSale(s, emp) && s.status!=='cancelled' && s.soldAt && s.soldAt.startsWith(prev))
          : []
        const prevTotal = prevSales.reduce((s,x)=>s+x.total,0)
        return {
          name: monthNames[m], month: m,
          total: mTotal, profit: mProfit, count: mCount,
          target: mTarget, targetPct: mTargetPct,
          growth: prevTotal > 0 ? Math.round(((mTotal-prevTotal)/prevTotal)*100) : null,
        }
      })

      // Soat tahlili
      const hourMap = {}
      empCompleted.forEach(s => {
        const h = new Date(s.soldAt).getHours()
        const slot = h < 9 ? '07-09' : h < 11 ? '09-11' : h < 13 ? '11-13'
          : h < 15 ? '13-15' : h < 17 ? '15-17' : h < 19 ? '17-19' : h < 21 ? '19-21' : '21-22'
        hourMap[slot] = (hourMap[slot]||0) + 1
      })

      // KPI hisoblash
      const curMonth = new Date().toISOString().slice(0, 7)
      const curTarget = EMPLOYEE_TARGETS[emp.id]?.[curMonth] || 0
      const curSales  = MOCK_SALES.filter(s => matchSale(s, emp) && s.status!=='cancelled' && s.soldAt && s.soldAt.startsWith(curMonth))
      const curTotal  = curSales.reduce((s,x)=>s+x.total,0)
      const targetScore   = curTarget > 0 ? Math.round((curTotal/curTarget)*60) : 0
      const cancelPenalty = Math.min(30, cancelPct * 3)
      const newCustBonus  = Math.min(10, newCustomers * 2)
      const kpi = Math.max(0, Math.min(100, targetScore - cancelPenalty + newCustBonus))

      // Maqsad foizi (joriy oy)
      const targetPct = curTarget > 0 ? Math.round((curTotal/curTarget)*100) : null

      return {
        ...emp, totalSales, totalProfit, salesCount, cancelCount,
        cancelPct, avgCheck, newCustomers, discountSales,
        avgDiscount, maxDiscount, lostRevenue, lastSale,
        monthly, hourMap, kpi, targetPct,
        isActive: empCompleted.length > 0,
      }
    }).sort((a,b) => b.totalSales - a.totalSales)

    const activeCount = empStats.filter(e => e.salesCount > 0).length
    const topSeller   = empStats[0] || null

    // Oylik faollik tarixi
    const monthlyActivity = [...MONTHS].reverse().map(m => {
      const activeEmps = EMPLOYEES_DATA.filter(emp =>
        MOCK_SALES.some(s => matchSale(s, emp) && s.status!=='cancelled' && s.soldAt && s.soldAt.startsWith(m))
      )
      return { name: monthNames[m], month: m, count: activeEmps.length, emps: activeEmps.map(e=>e.name) }
    })

    // Jami bekor qilingan — xodim bo'yicha
    const periodReturns = filterByPeriod(shopReturns, 'returnedAt')
    // Ikki marta hisoblashni oldini olish: cancelled MOCK_SALES ni MOCK_RETURNS da ham bor bo'lsa, faqat birini sanar
    const cancelledSaleIds = new Set(cancelled.map(s => s.id))
    const cancelByEmp = EMPLOYEES_DATA.map(emp => {
      const empCancelled = [
        ...cancelled.filter(s => matchSale(s, emp)),
        ...periodReturns
          .filter(r => matchReturn(r, emp) && !cancelledSaleIds.has(r.originalSaleId))
          .map(r => {
            // Eski tovar summasi — moliyaviy "yo'qotilgan" summa
            const oldItemsTotal = (r.returnedItems || []).reduce((s, i) => s + (i.salePrice || 0) * (i.qty || 1), 0)
            return {
              id: r.id, soldBy: r.processedBy, soldByName: r.processedByName,
              cancelReason: r.type === 'refund' ? 'qaytarish' : 'almashtirish',
              status: 'cancelled', subtotal: oldItemsTotal,
              total: oldItemsTotal, soldAt: r.returnedAt,
              customerName: r.customerName,
              items: r.returnedItems?.map(i => ({ name: i.name })) || [],
              cancelledBy: r.processedBy,
              cancelledByName: r.processedByName,
            }
          })
      ]
      const reasons = {}
      empCancelled.forEach(s => {
        const r = s.cancelReason || 'unknown'
        reasons[r] = (reasons[r]||0) + 1
      })
      return {
        ...emp,
        cancelCount: empCancelled.length,
        lostRevenue: empCancelled.filter(x => x.cancelReason !== 'almashtirish' && x.cancelReason !== 'exchange' && !x._isExchange).reduce((s,x) => s+(x.subtotal||x.total||0), 0),
        topReason: Object.entries(reasons).sort((a,b)=>b[1]-a[1])[0]?.[0] || null,
        details: empCancelled,
      }
    }).filter(e => e.cancelCount > 0).sort((a,b) => b.cancelCount - a.cancelCount)

    return {
      empStats, activeCount, topSeller,
      monthlyActivity, cancelByEmp,
      totalCancelled: cancelByEmp.reduce((s, e) => s + e.cancelCount, 0),
    }
  }, [period, filterByPeriod, selectedShopId, MOCK_SALES, MOCK_RETURNS])

  // --- TAB 6: FINANCE ---
  const financeStats = useMemo(() => {
    const _finSet = new Set()
    _finSet.add(new Date().toISOString().slice(0, 7))
    MOCK_SALES.forEach(s => { if (s.soldAt) _finSet.add(s.soldAt.slice(0, 7)) })
    MOCK_EXPENSES.forEach(e => { if (e.date) _finSet.add(e.date.slice(0, 7)) })
    MOCK_CAPITAL.forEach(c => { if (c.date) _finSet.add(c.date.slice(0, 7)) })
    const MONTHS       = Array.from(_finSet).sort().reverse()
    const MONTHS_CHART = [...MONTHS].reverse()
    const monthNames = {}
    MONTHS.forEach(m => { monthNames[m] = getMonthLabel(m) })

    const filteredCap = filterByPeriod(MOCK_CAPITAL, 'date')
    const totalInjected = filteredCap.filter(c => c.type === 'inject').reduce((s,x) => s+x.amountUZS, 0)
    const totalReturned = filteredCap.filter(c => c.type === 'return').reduce((s,x) => s+x.amountUZS, 0)
    const netCapital    = totalInjected - totalReturned
    const returnPct     = totalInjected > 0 ? Math.round((totalReturned/totalInjected)*100) : 0

    // Yetkazib beruvchi qarzi — MOCK_INCOME_BATCHES dan, MOCK_SUPPLIERS bilan join
    const debtBatches   = MOCK_INCOME_BATCHES.filter(x => (x.debtUSD || 0) > 0 && x.paymentStatus !== 'paid')
    const totalDebtUSD  = debtBatches.reduce((s,x) => s+(x.debtUSD||0), 0)
    const debtItems     = debtBatches.map(x => {
      const sup = MOCK_SUPPLIERS.find(s => s.id === x.supplierId) || {}
      return {
        ...x,
        supplierPhone:   sup.phone   || x.supplierPhone   || '—',
        supplierAddress: sup.address || '—',
        supplierInn:     sup.inn     || '—',
        resolvedAt: x.paymentStatus === 'paid' ? (x.payments?.slice(-1)[0]?.date || null) : null,
      }
    })
    const overdueDebts  = debtItems.filter(x => x.dueDate && x.dueDate < TODAY)
    const urgentDebts   = debtItems.filter(x => {
      if (!x.dueDate) return false
      const diff = Math.round((new Date(x.dueDate) - new Date(TODAY)) / 86400000)
      return diff >= 0 && diff <= 10
    })

    const getDaysOverdue = (dueDate) => Math.round((new Date(TODAY) - new Date(dueDate)) / 86400000)
    const getDaysUntil   = (dueDate) => Math.round((new Date(dueDate) - new Date(TODAY)) / 86400000)

    // Muddatli to'lovlar — MOCK_SALES dan
    // Sales.jsx bilan bir xil: tashkilot bo'yicha umumiy to'lovni eng eski sotuvdan yopadi
    const allInstSales = MOCK_SALES.filter(s => s.paymentType === 'installment' && s.status !== 'cancelled')
    const instOrgs = (storeInstallmentOrgs && storeInstallmentOrgs.length > 0)
      ? storeInstallmentOrgs
      : [{ id: 'uzum_nasiya', name: 'Uzum Nasiya' }, { id: 'oddiy_nasiya', name: 'Oddiy Nasiya' }]

    const instStatusMap = {}
    allInstSales.forEach(s => {
      const paid = s.installmentPaidAmount ?? 0
      const debt = s.installmentDebt ?? Math.max(0, s.total - paid)
      const status = debt <= 0 ? 'paid' : (paid > 0 ? 'partial' : 'pending')
      instStatusMap[s.id] = { status, paidAmount: paid, debtAmount: debt }
    })

    const installmentSales = allInstSales.map(s => ({
      ...s,
      installmentDebt:        instStatusMap[s.id]?.debtAmount       ?? (s.installmentDebt || 0),
      installmentPaidAmount:  instStatusMap[s.id]?.paidAmount        ?? (s.installmentPaidAmount || 0),
      _instStatus:            instStatusMap[s.id]?.status             ?? 'pending',
    }))
    const installmentReceivable = installmentSales.reduce((s,x) => s+x.installmentDebt, 0)

    // Kassa balansi: haqiqiy naqd pul harakati (tanlangan davr)
    const periodSales    = filterByPeriod(MOCK_SALES.filter(s => s.status !== 'cancelled'), 'soldAt')
    const periodExp      = filterByPeriod(MOCK_EXPENSES, 'date')
    const periodInvPay   = MOCK_INCOME_BATCHES.flatMap(b => (b.payments || []))
                             .filter(p => filterByPeriod([{ date: p.date }], 'date').length > 0)
                             .reduce((s,p) => s + (p.amountUZS || 0), 0)
    const periodJalb     = filterByPeriod(MOCK_CAPITAL.filter(c => c.type === 'inject'), 'date')
                             .reduce((s,c) => s + c.amountUZS, 0)
    const periodCapRet   = filterByPeriod(MOCK_CAPITAL.filter(c => c.type === 'return'), 'date')
                             .reduce((s,c) => s + c.amountUZS, 0)
    const allSalesRevenue = periodSales.reduce((s,x) => s+x.total, 0)
    const allExpenses     = periodExp.reduce((s,x) => s+x.amountUZS, 0)
    // Faqat tanlangan davr sotuvlaridagi to'lanmagan nasiya qoldig'i
    const periodInstDebt  = periodSales
      .filter(s => s.paymentType === 'installment')
      .reduce((s,x) => s + (x.installmentDebt || 0), 0)
    // Naqd qo'lda: sotuv + jalb − qaytarish − xarajat − supplier to'lov − nasiya qoldig'i
    const cashBalance     = allSalesRevenue + periodJalb - periodCapRet - allExpenses - periodInvPay - periodInstDebt

    // Keyingi oy uchun doimiy xarajatlar (expenseType === 'fixed')
    const lastMonth = MONTHS.find(m => MOCK_EXPENSES.some(e => e.date && e.date.startsWith(m) && e.expenseType === 'fixed')) || MONTHS[0]
    const fixedNextMonth = MOCK_EXPENSES
      .filter(e => e.date && e.date.startsWith(lastMonth) && e.expenseType === 'fixed')
      .reduce((s,x) => s+x.amountUZS, 0)

    // Kapital harakati running total
    const sortedCap = [...MOCK_CAPITAL].sort((a,b) => a.date.localeCompare(b.date))
    let runningTotal = 0
    const capitalWithRunning = sortedCap.map(c => {
      runningTotal += c.type === 'inject' ? c.amountUZS : -c.amountUZS
      return { ...c, runningTotal }
    })

    // Oylik kapital dinamika
    const monthlyCapital = MONTHS_CHART.map(m => {
      const mCap     = MOCK_CAPITAL.filter(c => c.date && c.date.startsWith(m))
      const inject   = mCap.filter(c => c.type==='inject').reduce((s,x)=>s+x.amountUZS,0)
      const returned = mCap.filter(c => c.type==='return').reduce((s,x)=>s+x.amountUZS,0)
      return { name: monthNames[m], month: m, inject, returned, net: inject-returned }
    })

    // Oylik kassa oqimi — operatsion + moliyaviy qatlamlar
    const monthlyCashFlow = MONTHS_CHART.map((m, mi) => {
      const prev = mi > 0 ? MONTHS_CHART[mi - 1] : null

      const mSales = MOCK_SALES.filter(s => s.status !== 'cancelled' && s.soldAt && s.soldAt.startsWith(m))
      const revenue = mSales.reduce((s,x) => s + x.total, 0)
      // Sotuv marjasi: sotuv − tannarx − nasiya komissiyasi (Excel bilan mos)
      const margin  = mSales.reduce((s,x) => s + getSaleProfit(x) - (x.installmentCommissionAmount || 0), 0)

      // Yangi tovar qiymati (Qarz): shu oyda kelgan partiyalar jami UZS qiymati
      const qarz = MOCK_INCOME_BATCHES
        .filter(b => b.receivedAt && b.receivedAt.startsWith(m))
        .reduce((s,b) => s + (b.totalUZS_atEntry || 0), 0)

      // Yetkazib beruvchiga to'langan (Tan narx): shu oyda amalga oshirilgan to'lovlar
      const invPayment = MOCK_INCOME_BATCHES
        .flatMap(b => (b.payments || []))
        .filter(p => p.date && p.date.startsWith(m))
        .reduce((s,p) => s + (p.amountUZS || 0), 0)

      const shopExp   = MOCK_EXPENSES.filter(e => e.date && e.date.startsWith(m)).reduce((s,x) => s + x.amountUZS, 0)
      const jalb      = MOCK_CAPITAL.filter(c => c.type === 'inject' && c.date && c.date.startsWith(m)).reduce((s,c) => s + c.amountUZS, 0)
      const capReturn = MOCK_CAPITAL.filter(c => c.type === 'return' && c.date && c.date.startsWith(m)).reduce((s,c) => s + c.amountUZS, 0)

      // Operatsion: sotuv foydasi − supplier to'lov − do'kon xarajatlari
      const operatsion = margin - invPayment - shopExp
      const moliyaviy  = jalb - capReturn
      const net        = operatsion + moliyaviy

      const calcNet = (mo) => {
        const ms = MOCK_SALES.filter(s=>s.status!=='cancelled'&&s.soldAt&&s.soldAt.startsWith(mo))
        const mg = ms.reduce((s,x)=>s+getSaleProfit(x)-(x.installmentCommissionAmount||0),0)
        const ip = MOCK_INCOME_BATCHES.flatMap(b=>(b.payments||[])).filter(p=>p.date&&p.date.startsWith(mo)).reduce((s,p)=>s+(p.amountUZS||0),0)
        const e  = MOCK_EXPENSES.filter(x=>x.date&&x.date.startsWith(mo)).reduce((s,x)=>s+x.amountUZS,0)
        const j  = MOCK_CAPITAL.filter(c=>c.type==='inject'&&c.date&&c.date.startsWith(mo)).reduce((s,c)=>s+c.amountUZS,0)
        const cr = MOCK_CAPITAL.filter(c=>c.type==='return'&&c.date&&c.date.startsWith(mo)).reduce((s,c)=>s+c.amountUZS,0)
        return (mg - ip - e) + (j - cr)
      }
      const prevNet = prev ? calcNet(prev) : null

      // Jami chiqim (grafik uchun): supplier to'lov + do'kon xarajatlari
      const chiqim = -(invPayment + shopExp)

      return {
        name: monthNames[m], month: m,
        revenue, margin, qarz, invPayment, shopExp, jalb, capReturn,
        operatsion, moliyaviy, net, chiqim, prevNet,
        growth: prevNet !== null && prevNet !== 0 ? Math.round(((net - prevNet) / Math.abs(prevNet)) * 100) : null
      }
    })

    // Kumulativ yig'ma balans (har oy oldingi oylarni ham o'z ichiga oladi)
    let running = 0
    monthlyCashFlow.forEach(m => { running += m.net; m.cumNet = running })

    // Jami kumulyativ
    const cfAcc = monthlyCashFlow.reduce((acc, m) => ({
      revenue:    acc.revenue    + m.revenue,
      margin:     acc.margin     + m.margin,
      qarz:       acc.qarz       + m.qarz,
      invPayment: acc.invPayment + m.invPayment,
      shopExp:    acc.shopExp    + m.shopExp,
      jalb:       acc.jalb       + m.jalb,
      capReturn:  acc.capReturn  + m.capReturn,
      operatsion: acc.operatsion + m.operatsion,
      moliyaviy:  acc.moliyaviy  + m.moliyaviy,
      net:        acc.net        + m.net,
    }), { revenue:0, margin:0, qarz:0, invPayment:0, shopExp:0, jalb:0, capReturn:0, operatsion:0, moliyaviy:0, net:0 })

    // Real balans = operatsion + moliyaviy
    // Operatsion = sotuv marjasi + to'lovlar − yangi qarz − xarajat
    // Manfiy operatsion → do'kon investor puli hisobiga ishlayapti
    const cfTotal = {
      ...cfAcc,
      realBalance: cfAcc.net,
    }

    // ROI — vaqt og'irlikli kapital + sof foyda
    const roiToday = new Date()

    // Sof foyda: sotuv foydasi (COGS allaqachon ayirilgan) − do'kon xarajatlari
    // Yetkazuvchi to'lovlari ayirilmaydi — getSaleProfit() da COGS sifatida hisobga olingan
    const totalSalesProfit      = MOCK_SALES.filter(s => s.status !== 'cancelled').reduce((s, x) => s + getSaleProfit(x) - (x.installmentCommissionAmount || 0), 0)
    const totalShopExpenses     = MOCK_EXPENSES.reduce((s, e) => s + (e.amountUZS || 0), 0)
    const totalSupplierPayments = MOCK_INCOME_BATCHES.reduce((s, b) => s + (b.payments || []).reduce((ps, p) => ps + (p.amountUZS || 0), 0), 0)
    const netProfit = totalSalesProfit - totalShopExpenses

    // Vaqt og'irlikli kapital: har bir harakatni biznes boshidan bugungi kungacha necha kun ishlagan
    const allCapitalMoves = MOCK_CAPITAL.filter(c => c.date)
    const earliestDate = allCapitalMoves.length > 0
      ? new Date(allCapitalMoves.reduce((min, c) => c.date < min ? c.date : min, allCapitalMoves[0].date))
      : roiToday
    const totalPeriodDays = Math.max(1, Math.round((roiToday - earliestDate) / 86400000))

    const weightedCapital = allCapitalMoves.reduce((sum, c) => {
      const moveDate = new Date(c.date)
      const daysActive = Math.max(0, Math.round((roiToday - moveDate) / 86400000))
      const weight = daysActive / totalPeriodDays
      return c.type === 'inject' ? sum + c.amountUZS * weight : sum - c.amountUZS * weight
    }, 0)

    const roi = weightedCapital > 0 ? Math.round((netProfit / weightedCapital) * 100) : null

    // Modal uchun tafsilotlar
    const roiDetails = { totalSalesProfit, totalShopExpenses, totalSupplierPayments, netProfit, weightedCapital, totalPeriodDays }

    const monthlyInjected = MONTHS_CHART.map(m => {
      const mCap = MOCK_CAPITAL.filter(c => c.date && c.date.startsWith(m) && c.type==='inject')
      return { name: monthNames[m], month: m, value: mCap.reduce((s,x)=>s+x.amountUZS,0) }
    })
    const monthlyReturned = MONTHS_CHART.map(m => {
      const mCap = MOCK_CAPITAL.filter(c => c.date && c.date.startsWith(m) && c.type==='return')
      return { name: monthNames[m], month: m, value: mCap.reduce((s,x)=>s+x.amountUZS,0) }
    })

    // Eng so'nggi to'lov sanasini sana bo'yicha sortlab olish
    const getLastPaymentDate = (payments) => {
      if (!payments || payments.length === 0) return null
      return [...payments].sort((a, b) => (a.date || '').localeCompare(b.date || '')).slice(-1)[0]?.date || null
    }

    // Alert tarixi — MOCK_INCOME_BATCHES dan
    const alertHistory = MOCK_INCOME_BATCHES.filter(x => x.paymentStatus !== 'paid' || x.dueDate).map(x => ({
      ...x,
      status: x.paymentStatus === 'paid' ? 'resolved'
        : (x.dueDate && x.dueDate < TODAY) ? 'overdue' : 'pending',
      daysOverdue: x.dueDate && x.dueDate < TODAY && x.paymentStatus !== 'paid' ? getDaysOverdue(x.dueDate) : null,
      daysUntil: x.dueDate && x.dueDate >= TODAY ? getDaysUntil(x.dueDate) : null,
      resolvedAt: x.paymentStatus === 'paid' ? getLastPaymentDate(x.payments) : null,
      alertTriggeredAt: x.dueDate && x.dueDate < TODAY ? x.dueDate : null,
    }))

    // Nasiya tashkilotlari — storeInstallmentOrgs + MOCK_SALES
    const installmentOrgs = (storeInstallmentOrgs && storeInstallmentOrgs.length > 0)
      ? storeInstallmentOrgs
      : [
          { id: 'uzum_nasiya',  name: 'Uzum Nasiya',  commissionPercent: 0,  isActive: true },
          { id: 'oddiy_nasiya', name: 'Oddiy Nasiya',  commissionPercent: 3,  isActive: true },
        ]

    const allInstallmentSales = MOCK_SALES.filter(s => s.paymentType === 'installment' && s.status !== 'cancelled')
    const orgStats = installmentOrgs.map(org => {
      const orgSales = allInstallmentSales.filter(s =>
        s.installmentOrgId === org.id || (!s.installmentOrgId && org.id === 'oddiy_nasiya')
      )
      const totalAmount     = orgSales.reduce((s, x) => s + x.total, 0)
      const totalPaid       = orgSales.reduce((s, x) => s + (x.installmentPaidAmount || 0), 0)
      const totalDebt       = orgSales.reduce((s, x) => s + (x.installmentDebt || 0), 0)
      const totalCommission = orgSales.reduce((s, x) => s + (x.installmentCommissionAmount ?? Math.round(x.total * (org.commissionPercent / 100))), 0)
      const paidPct         = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0
      return { ...org, salesCount: orgSales.length, totalAmount, totalPaid, totalDebt, totalCommission, paidPct }
    })

    const totalInstallmentCommission = orgStats.reduce((s, x) => s + x.totalCommission, 0)

    // Yetkazib beruvchilar qarzi jadvali
    const supplierDebts = MOCK_INCOME_BATCHES.filter(x => (x.debtUSD||0) > 0 && x.paymentStatus !== 'paid')
      .map(x => ({
        id: x.id, productName: x.productName, supplierName: x.supplierName,
        debtUSD: x.debtUSD, dueDate: x.dueDate,
        debtUZS: Math.round((x.debtUSD||0) * USD_RATE),
        isOverdue: x.dueDate && x.dueDate < TODAY,
        daysOverdue: x.dueDate && x.dueDate < TODAY ? getDaysOverdue(x.dueDate) : null,
      }))
      .sort((a,b) => (a.dueDate||'').localeCompare(b.dueDate||''))

    // Kirim qarzlar jadvali (USD) — paymentStatus to'g'ri hisoblash
    const incomeBatchDebts = MOCK_INCOME_BATCHES.map(x => {
      const computedStatus = (x.debtUSD||0) <= 0 ? 'paid'
        : (x.paidUSD||0) > 0 ? 'partial'
        : 'unpaid'
      return {
        id: x.id, productName: x.productName, supplierName: x.supplierName,
        quantity: x.quantity, totalUSD: x.totalUSD, paidUSD: x.paidUSD||0, debtUSD: x.debtUSD||0,
        paymentStatus: computedStatus, dueDate: x.dueDate,
        entryUsdRate: x.entryUsdRate, totalUZS_atEntry: x.totalUZS_atEntry,
      }
    })

    return {
      totalInjected, totalReturned, netCapital, returnPct,
      totalDebtUSD, debtItems, overdueDebts, urgentDebts,
      installmentSales, installmentReceivable,
      cashBalance, fixedNextMonth,
      capitalWithRunning, monthlyCapital, monthlyCashFlow,
      roi, roiDetails, monthlyInjected, monthlyReturned,
      getDaysOverdue, getDaysUntil, alertHistory,
      orgStats, totalInstallmentCommission,
      supplierDebts, incomeBatchDebts, cfTotal,
    }
  }, [period, filterByPeriod, storeInstallmentOrgs, storeUsdRate, selectedShopId, MOCK_SALES, MOCK_INCOME_BATCHES, MOCK_EXPENSES, MOCK_CAPITAL, MOCK_SUPPLIERS])

  const getExportData = (format) => {
    setShowExportMenu(false)
    const periodLabel = period === 'all' ? 'Barchasi' : period
    const date = new Date().toISOString().slice(0, 10)

    if (activeTab === 'sales') {
      const rows = salesData.completed.map(s => ({
        'Sana': s.soldAt?.slice(0,10) || '',
        'Mijoz': s.customerName || '',
        'Tovar': fmtItems(s.items),
        'Jami (UZS)': s.total,
        "To'lov turi": { cash: 'Naqd', card: 'Karta', installment: 'Muddatli' }[s.paymentType] || s.paymentType,
        'Foyda (UZS)': s.profit,
        'Chegirma %': s.discount || 0,
        'Sotuvchi': s.soldByName || '',
        'Manba': getSourceLabel(s.source),
      }))
      const fname = `${storeCompanyName}_Sotuv_${periodLabel}_${date}`
      if (format === 'csv') exportCSV(fname, rows)
      else if (format === 'xlsx') exportXLSX(fname, [{ name: 'Sotuvlar', rows }])
      else exportPDF(fname, `Sotuv hisoboti — ${periodLabel}`,
        ['Sana','Mijoz','Tovar','Jami (UZS)',"To'lov turi",'Foyda (UZS)','Chegirma %','Sotuvchi'],
        rows.map(r => [r['Sana'],r['Mijoz'],r['Tovar'],r['Jami (UZS)'],r["To'lov turi"],r['Foyda (UZS)'],r['Chegirma %'],r['Sotuvchi']])
      )
    }

    else if (activeTab === 'stock') {
      const rows = stockStats.withDaysLeft.map(p => ({
        'Tovar': p.productName,
        'Kategoriya': p.category,
        'Qoldiq (dona)': p.inStock,
        'Kirim narxi (UZS)': p.purchasePrice,
        'Sotuv narxi (UZS)': p.cashPrice,
        'Marja %': p.margin,
        'Taxminiy kunlar': p.daysLeft ?? '—',
        'Holat': { out: 'Tugagan', slow: 'Sekin', normal: 'Normal', fast: 'Tez' }[p.turnoverStatus] || '',
        'Oxirgi sotuv': p.lastSoldAt || '—',
      }))
      const fname = `${storeCompanyName}_Qoldiq_${date}`
      if (format === 'csv') exportCSV(fname, rows)
      else if (format === 'xlsx') exportXLSX(fname, [{ name: 'Qoldiq', rows }])
      else exportPDF(fname, 'Ombor qoldig\'i hisoboti',
        ['Tovar','Kategoriya','Qoldiq','Kirim narxi','Sotuv narxi','Marja %','Kun','Holat'],
        rows.map(r => [r['Tovar'],r['Kategoriya'],r['Qoldiq (dona)'],r['Kirim narxi (UZS)'],r['Sotuv narxi (UZS)'],r['Marja %']+'%',r['Taxminiy kunlar'],r['Holat']])
      )
    }

    else if (activeTab === 'profit') {
      const rows = profitStats.monthlyChart.map(m => ({
        'Oy': m.name,
        'Sotuv (UZS)': m.sotuv,
        'Yalpi foyda (UZS)': m.foyda,
        'Xarajat (UZS)': m.xarajat,
        'Sof foyda (UZS)': m.sof,
        'Maqsad (UZS)': m.maqsad || 0,
      }))
      const fname = `${storeCompanyName}_Foyda_${periodLabel}_${date}`
      if (format === 'csv') exportCSV(fname, rows)
      else if (format === 'xlsx') exportXLSX(fname, [
        { name: 'Oylik', rows },
        { name: 'Xarajatlar', rows: profitStats.expChart.map(e => ({ 'Kategoriya': e.name, 'Summa (UZS)': e.value })) }
      ])
      else exportPDF(fname, `Foyda hisoboti — ${periodLabel}`,
        ['Oy','Sotuv','Yalpi foyda','Xarajat','Sof foyda','Maqsad'],
        rows.map(r => [r['Oy'],r['Sotuv (UZS)'],r['Yalpi foyda (UZS)'],r['Xarajat (UZS)'],r['Sof foyda (UZS)'],r['Maqsad (UZS)']])
      )
    }

    else if (activeTab === 'customers') {
      const rows = customerStats.ltvList.map(c => ({
        'Mijoz': c.name,
        'Telefon': c.phone || '',
        'Tashriflar': c.totalVisits,
        'Jami sarf (UZS)': c.totalSpent,
        "O'rtacha chek (UZS)": c.avgCheck,
        'Daraja': c.loyaltyLevel,
        'Oxirgi tashrif': c.lastVisit,
        'Xavf': { none: 'Faol', low: 'Past', medium: "O'rta", high: 'Yuqori' }[c.churnRisk] || '',
      }))
      const fname = `${storeCompanyName}_Mijozlar_${date}`
      if (format === 'csv') exportCSV(fname, rows)
      else if (format === 'xlsx') exportXLSX(fname, [{ name: 'Mijozlar', rows }])
      else exportPDF(fname, 'Mijozlar hisoboti',
        ['Mijoz','Telefon','Tashriflar','Jami sarf','Daraja','Oxirgi tashrif','Xavf'],
        rows.map(r => [r['Mijoz'],r['Telefon'],r['Tashriflar'],r['Jami sarf (UZS)'],r['Daraja'],r['Oxirgi tashrif'],r['Xavf']])
      )
    }

    else if (activeTab === 'employees') {
      const rows = employeeStats.empStats.map(e => ({
        'Xodim': e.name,
        'Lavozim': { admin:'Boshqaruvchi', manager:'Boshqaruvchi', seller:'Sotuvchi', employee:'Sotuvchi', storekeeper:'Omborchi', technician:'Texnik' }[e.role] || e.role,
        'Sotuvlar soni': e.salesCount,
        'Jami sotuv (UZS)': e.totalSales,
        'Jami foyda (UZS)': e.totalProfit,
        "O'rtacha chek (UZS)": e.avgCheck,
        'Yangi mijozlar': e.newCustomers,
        'Bekor %': e.cancelPct,
        'KPI': e.kpi,
        'Maosh (UZS)': e.salary || 0,
      }))
      const fname = `${storeCompanyName}_Xodimlar_${date}`
      if (format === 'csv') exportCSV(fname, rows)
      else if (format === 'xlsx') exportXLSX(fname, [{ name: 'Xodimlar', rows }])
      else exportPDF(fname, 'Xodimlar hisoboti',
        ['Xodim','Lavozim','Sotuvlar','Jami sotuv','Foyda','Avg chek','Yangi mijoz','Bekor %','KPI'],
        rows.map(r => [r['Xodim'],r['Lavozim'],r['Sotuvlar soni'],r['Jami sotuv (UZS)'],r['Jami foyda (UZS)'],r["O'rtacha chek (UZS)"],r['Yangi mijozlar'],r['Bekor %']+'%',r['KPI']])
      )
    }

    else if (activeTab === 'finance') {
      const rows = financeStats.monthlyCashFlow.map(m => ({
        'Oy': m.name,
        'Daromad (UZS)': m.revenue,
        'Xarajat (UZS)': m.expense,
        'Sof (UZS)': m.net,
      }))
      const fname = `${storeCompanyName}_Moliya_${date}`
      if (format === 'csv') exportCSV(fname, rows)
      else if (format === 'xlsx') exportXLSX(fname, [
        { name: 'Cash Flow', rows },
        { name: 'Kapital', rows: financeStats.capitalWithRunning.map(c => ({
          'Sana': c.date, 'Tur': c.type === 'inject' ? 'Jalb' : 'Qaytarish',
          'Summa (UZS)': c.amountUZS, 'Jami kapital': c.runningTotal,
        }))},
      ])
      else exportPDF(fname, 'Moliya hisoboti',
        ['Oy','Daromad (UZS)','Xarajat (UZS)','Sof (UZS)'],
        rows.map(r => [r['Oy'],r['Daromad (UZS)'],r['Xarajat (UZS)'],r['Sof (UZS)']])
      )
    }
  }

  const tabs = [
    { id: 'sales',     label: t('rep_tab_sales'),     icon: ShoppingCart },
    { id: 'stock',     label: t('rep_tab_stock'),     icon: Package },
    { id: 'customers', label: t('rep_tab_customers'), icon: UserCheck },
    { id: 'employees', label: t('rep_tab_employees'), icon: Users },
    { id: 'finance',   label: t('rep_tab_finance'),   icon: Wallet },
    { id: 'used',      label: t('rep_tab_used'),      icon: Recycle },
    { id: 'profit',    label: t('rep_tab_profit'),    icon: TrendingUp },
  ]

  const StatCard = ({ icon: Icon, label, value, sub, color = "bg-accent-red/10 text-accent-red", trend }) => (
    <div className="h-full bg-bg-secondary border border-border rounded-2xl p-5 relative overflow-hidden group hover:border-accent-red/50 transition-colors">
      <div className={`absolute top-4 right-4 w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
        <Icon size={20} />
      </div>
      <p className="text-text-secondary text-sm font-medium mb-1">{label}</p>
      <h3 className="text-2xl font-syne font-bold text-text-primary mb-1">{value}</h3>
      <div className="flex items-center gap-1.5">
        {trend !== null && trend !== undefined && (
          <span className={`flex items-center text-xs font-bold ${trend > 0 ? 'text-accent-green' : 'text-accent-red'}`}>
            {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </span>
        )}
        <p className="text-text-muted text-xs">{sub}</p>
      </div>
    </div>
  )

  const SectionTitle = ({ title, desc }) => (
    <div className="mb-4">
      <h4 className="text-lg font-syne font-bold text-text-primary">{title}</h4>
      {desc && <p className="text-text-secondary text-sm">{desc}</p>}
    </div>
  )

  const MonthFilterSelect = ({ value, onChange }) => (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none bg-bg-tertiary border border-border rounded-xl pl-3 pr-8 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-red cursor-pointer"
      >
        {periodOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
    </div>
  )



  const LockedTab = () => (
    <div className="bg-bg-secondary border border-border rounded-[2rem] p-12 flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-accent-red/10 flex items-center justify-center text-accent-red mb-2">
        <AlertTriangle size={32} />
      </div>
      <h3 className="text-xl font-syne font-bold text-text-primary">{t('rep_no_access')}</h3>
      <p className="text-text-secondary max-w-sm">{t('rep_locked_desc')}</p>
    </div>
  )


  const ctx = {
    // state values
    period, modal, openModal, closeModal,
    salesData, stockStats, profitStats, customerStats, employeeStats, financeStats, usedData,
    isPrivileged,
    // inner components
    StatCard, SectionTitle, MonthFilterSelect, LockedTab, SortIcon, MonthSortBtn,
    // helpers
    filterByPeriod, filterUsedByMonth, sortedData, toggleSort, sortConfig,
    getSourceLabel, getCategoryLabel, getCancelLabel, getCatLabel, getCatLabelPlural,
    getCatColor, getCatColorHex, renderCatBadge, getExpNote, getMonthLabel,
    // state setters
    setSelectedCustomer, selectedCustomer, customersPage, setCustomersPage, CUSTOMERS_PAGE_SIZE,
    cstmSearch, setCstmSearch, selectedEmployee, setSelectedEmployee,
    empChartMetric, setEmpChartMetric, hourTab, setHourTab,
    expandedMonth, setExpandedMonth, seasonYear, setSeasonYear,
    modalFilter, setModalFilter, varMonthFilter, setVarMonthFilter,
    slowRotIdx, setSlowRotIdx, staleIdx, setStaleIdx, notSoldDays, setNotSoldDays,
    msd, sortMonths,
    showAllCfMonths, setShowAllCfMonths,
    salesTablePage, setSalesTablePage, SALES_PAGE_SIZE,
    stockCategory, setStockCategory,
    periodOptions,
    usedChartMonth, setUsedChartMonth,
    usedHistoryMonth, setUsedHistoryMonth, usedHistorySales,
    usedRevenueMonth, setUsedRevenueMonth,
    usedProfitMonth, setUsedProfitMonth,
    usedAcquiredMonth, setUsedAcquiredMonth,
    usedInStockMonth, setUsedInStockMonth,
    usedSoldMonth, setUsedSoldMonth,
    usedScrappedMonth, setUsedScrappedMonth,
    usedMarginMonth, setUsedMarginMonth,
    usedInstallmentMonth, setUsedInstallmentMonth,
    usedChartCategories,
    getMonthlySalesChart,
    USD_RATE,
    GOLD_THRESHOLD, SILVER_THRESHOLD,
    storeInstallmentOrgs, storeMonthlyTargets, storeEmployeeTargets,
    storeCompanyName, storeProductCategories,
    MOCK_SALES, MOCK_PRODUCTS, MOCK_CUSTOMERS, MOCK_ITEMS,
    MOCK_INCOME_BATCHES, MOCK_BATCHES, MOCK_EXPENSES, MOCK_CAPITAL, MOCK_SUPPLIERS,
    MOCK_USED_SALES, MOCK_USED_STOCK, MOCK_RETURNS,
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-syne font-extrabold tracking-tight text-text-primary">{t('reports')}</h1>
          <p className="text-text-secondary">{t('rep_subtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              disabled={activeTab === 'stock'}
              className="appearance-none bg-bg-secondary border border-border rounded-xl pl-4 pr-10 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-red disabled:opacity-50 transition-all cursor-pointer"
            >
              {periodOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(v => !v)}
              className="flex items-center gap-2 px-4 py-2.5 bg-bg-secondary border border-border rounded-xl text-sm font-bold text-text-primary hover:bg-bg-tertiary transition-all"
            >
              <Download size={16} /> Export <ChevronDown size={14} />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 bg-bg-secondary border border-border rounded-xl shadow-2xl z-50 overflow-hidden min-w-[140px]">
                {[
                  { fmt: 'csv',  label: 'CSV (.csv)' },
                  { fmt: 'xlsx', label: 'Excel (.xlsx)' },
                  { fmt: 'pdf',  label: 'PDF (.pdf)' },
                ].map(({ fmt, label }) => (
                  <button
                    key={fmt}
                    onClick={() => getExportData(fmt)}
                    className="w-full px-4 py-2.5 text-left text-sm text-text-primary hover:bg-bg-tertiary transition-colors flex items-center gap-2"
                  >
                    <Download size={14} className="text-text-muted" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto no-scrollbar scroll-smooth">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold whitespace-nowrap transition-all relative ${
              activeTab === tab.id ? 'text-accent-red' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="activeReportTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-red" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'sales' && <SalesTab ctx={ctx} />}
        {activeTab === 'stock' && <StockTab ctx={ctx} />}
        {activeTab === 'profit' && <ProfitTab ctx={ctx} />}
        {activeTab === 'customers' && <CustomersTab ctx={ctx} />}
        {activeTab === 'employees' && <EmployeesTab ctx={ctx} />}
        {activeTab === 'finance' && <FinanceTab ctx={ctx} />}
        {activeTab === 'used' && <UsedTab ctx={ctx} />}
      </div>

    </motion.div>
  )
}

export default Reports
