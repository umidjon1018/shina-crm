import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Package, AlertTriangle, XCircle, CheckCircle, BarChart2, Eye, ChevronRight, ChevronDown, Tag } from 'lucide-react'
import { getCategoryColor } from '../../../utils/categoryColors'
import { useAuthStore } from '../../../store/authStore'
import { useSettingsStore } from '../../../store/settingsStore'
import { Badge, StatCard, Th, Td, SortIcon, CATEGORIES, SEASONS, SEASON_COLORS, stockStatus, STATUS_CONFIG, isPrivileged } from '../whHelpers.jsx'
import ProductModal from '../components/ProductModal'
import { updateItemAttributes } from '../../../api/itemService'

const StockTab = ({ products, batches, items, userRole, productCategories }) => {
  const { t } = useTranslation()
  const som = t('unit_som')
  const pcs = t('unit_pcs')
  const { hasPermission } = useAuthStore()
  const { productAttributeDefs } = useSettingsStore()
  const [search, setSearch] = useState('')
  const [expandedProducts, setExpandedProducts] = useState(new Set())
  const [pendingAttrs, setPendingAttrs] = useState({})     // { itemId: { defId: value|'__none__' } }
  const [localItemAttrs, setLocalItemAttrs] = useState({}) // { itemId: attributes } — saved locally
  const [savingItemId, setSavingItemId] = useState(null)
  const [attrDismissed, setAttrDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('attr_warn_dismissed') || '{}') } catch { return {} }
  })

  const toggleExpand = (productId) => {
    setExpandedProducts(prev => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }
  const [category, setCategory] = useState('all')
  const [season, setSeason] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [attrFilters, setAttrFilters] = useState({}) // { defId: selectedValue | 'all' }
  const [selectedProduct, setSelectedProduct] = useState(null)

  const setAttrFilter = (defId, value) => {
    setAttrFilters(prev => {
      if (value === 'all') { const next = { ...prev }; delete next[defId]; return next }
      return { ...prev, [defId]: value }
    })
  }

  const [sortField, setSortField] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  // Shop-aware helpers — batches prop already filtered by shopId from parent
  const shopBatchIds = useMemo(() => new Set(batches.map(b => b.id)), [batches])
  // Only products that have at least 1 batch in this shop
  const shopProducts = useMemo(() => products.filter(p => batches.some(b => b.productId === p.id)), [products, batches])

  const TWENTY_FOUR_H = 24 * 60 * 60 * 1000

  const dismissAttrWarning = (productId) => {
    const pid = String(productId)
    const updated = { ...attrDismissed, [pid]: Date.now() }
    setAttrDismissed(updated)
    localStorage.setItem('attr_warn_dismissed', JSON.stringify(updated))
  }

  // Item attrs: localItemAttrs overrides prop data (after local save)
  const getItemAttrs = (item) => localItemAttrs[item?.id] ?? item?.attributes ?? {}

  // Barcha in-stock itemlar barcha def kalitlariga ega (value yoki null) — to'liq hal qilingan
  const productFullyResolved = (productId) => {
    if (!productAttributeDefs?.length) return true
    const inStock = items.filter(i => i.productId === productId && i.status === 'in_stock' && shopBatchIds.has(i.batchId))
    if (!inStock.length) return true
    return inStock.every(i => productAttributeDefs.every(def => def.id in getItemAttrs(i)))
  }

  const productNeedsAttrs = (productId) => {
    if (!productAttributeDefs?.length) return false
    const inStock = items.filter(i => i.productId === productId && i.status === 'in_stock' && shopBatchIds.has(i.batchId))
    if (!inStock.length) return false

    // To'liq hal qilingan — sariq butunlay yo'q
    if (productFullyResolved(productId)) return false

    // Hech biri belgilanmagan — har doim sariq
    const anyResolved = inStock.some(i => Object.keys(getItemAttrs(i)).length > 0)
    if (!anyResolved) return true

    // Qisman belgilangan — dismiss vaqtini tekshir
    const dismissedAt = attrDismissed[String(productId)]
    if (!dismissedAt) return true // hech qachon dismiss qilinmagan
    return Date.now() - dismissedAt >= TWENTY_FOUR_H // 24 soat o'tgan bo'lsa qaytsin
  }

  const handleSaveAttrs = async (item) => {
    const itemId = item.id
    const pending = pendingAttrs[itemId]
    if (!pending || Object.keys(pending).length === 0) return
    setSavingItemId(itemId)
    try {
      const existingAttrs = getItemAttrs(item)
      const newAttrs = { ...existingAttrs }
      for (const [defId, val] of Object.entries(pending)) {
        if (val === '') continue
        newAttrs[defId] = val === '__none__' ? null : val
      }
      await updateItemAttributes(itemId, newAttrs)
      setLocalItemAttrs(prev => ({ ...prev, [itemId]: newAttrs }))
      setPendingAttrs(prev => { const n = { ...prev }; delete n[itemId]; return n })
      // Dismiss: agar to'liq hal qilinmagan bo'lsa, 24s ogohlantirish boshlanadi
      dismissAttrWarning(item.productId)
    } catch (e) {
      console.error(e)
    } finally {
      setSavingItemId(null)
    }
  }
  const shopItemCount = (productId, status) =>
    items.filter(i => i.productId === productId && i.status === status && shopBatchIds.has(i.batchId)).length
  const shopStock = (productId) => shopItemCount(productId, 'in_stock')
  const shopStockStatus = (p) => {
    const stock = shopStock(p.id)
    if (stock === 0) return 'empty'
    if (stock <= (p.lowStockThreshold || 3)) return 'low'
    return 'ok'
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const activeAttrFilters = Object.entries(attrFilters)

  const filtered = shopProducts.filter(p => {
    const q = search.toLowerCase()
    if (!(p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q))) return false
    if (category !== 'all' && p.category !== category) return false
    if (season !== 'all' && p.season !== season) return false
    if (statusFilter !== 'all' && shopStockStatus(p) !== statusFilter) return false
    // Xususiyat filtrlari: shu product ning ombordagi itemlarida mos qiymat bormi?
    if (activeAttrFilters.length > 0) {
      const productItems = items.filter(i => i.productId === p.id && i.status === 'in_stock' && shopBatchIds.has(i.batchId))
      for (const [defId, val] of activeAttrFilters) {
        if (val === '__unset__') {
          const hasUnset = productItems.some(i => { const a = getItemAttrs(i); return !(defId in a) || a[defId] === null })
          if (!hasUnset) return false
        } else {
          const hasMatch = productItems.some(i => getItemAttrs(i)?.[defId] === val)
          if (!hasMatch) return false
        }
      }
    }
    return true
  })

  const sorted = useMemo(() => {
    if (!sortField) return filtered
    return [...filtered].sort((a, b) => {
      const av = (a[sortField] ?? '').toString().toLowerCase()
      const bv = (b[sortField] ?? '').toString().toLowerCase()
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }, [filtered, sortField, sortDir])

  const canSeePurchasePrice = hasPermission('warehouse.stock.income_price')
  // Ombor qiymati: kirim narxi × qoldiq (sotuv narxi belgilanmagan bo'lishi mumkin)
  const totalValue = batches.reduce((s, b) => {
    const uzs = (b.purchasePriceUSD || 0) * (b.entryUsdRate || 0) * (b.quantityRemaining || 0)
    return s + uzs
  }, 0)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('wh_stat_total')} value={shopProducts.length} icon={Package} cls="bg-accent-blue/10 text-accent-blue" />
        <StatCard label={t('wh_stat_low')} value={shopProducts.filter(p => shopStockStatus(p) === 'low').length} icon={AlertTriangle} cls="bg-accent-orange/10 text-accent-orange" />
        <StatCard label={t('stock_empty')} value={shopProducts.filter(p => shopStockStatus(p) === 'empty').length} icon={XCircle} cls="bg-accent-red/10 text-accent-red" />
        <StatCard label={t('wh_stat_value')} value={totalValue.toLocaleString('uz') + ' ' + t('dash_so_m')} icon={BarChart2} cls="bg-accent-green/10 text-accent-green" />
      </div>

      {/* Filters */}
      <div className="bg-bg-secondary border border-border rounded-2xl p-4 flex flex-wrap gap-4 items-end">
        {/* Qidiruv */}
        <div className="flex flex-col gap-1 flex-1 min-w-48">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">{t('wh_search_ph') || 'Tovar izlash'}</span>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('wh_search_ph')} className="w-full pl-9 pr-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue transition-colors" />
          </div>
        </div>
        {/* Tovar turi */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">{t('col_category')}</span>
          <select value={category} onChange={e => setCategory(e.target.value)} className="px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue">
            {CATEGORIES.map(c => <option key={c} value={c}>{t('cat_' + c)}</option>)}
          </select>
        </div>
        {/* Mavsum */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">{t('wh_th_season')}</span>
          <select value={season} onChange={e => setSeason(e.target.value)} className="px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue">
            {SEASONS.map(s => <option key={s} value={s}>{t('season_' + s)}</option>)}
          </select>
        </div>
        {/* Holat */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">{t('col_status')}</span>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue">
            <option value="all">{t('wh_all_status')}</option>
            <option value="ok">{t('stock_ok')}</option>
            <option value="low">{t('stock_low')}</option>
            <option value="empty">{t('stock_empty')}</option>
          </select>
        </div>
        {/* Xususiyat filtrlari — dinamik */}
        {(productAttributeDefs || []).map(def => (
          <div key={def.id} className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">{def.label}</span>
            <select
              value={attrFilters[def.id] || 'all'}
              onChange={e => setAttrFilter(def.id, e.target.value)}
              className="px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue"
            >
              <option value="all">Barchasi</option>
              {def.values.map(v => <option key={v} value={v}>{v}</option>)}
              <option value="__unset__">Xususiyatsiz</option>
            </select>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-tertiary">
                <Th sortable onClick={() => handleSort('name')}>
                  <span className="inline-flex items-center gap-1">
                    {t('col_product')} <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
                  </span>
                </Th>
                <Th sortable onClick={() => handleSort('category')}>
                  <span className="inline-flex items-center gap-1">
                    {t('col_category')} <SortIcon field="category" sortField={sortField} sortDir={sortDir} />
                  </span>
                </Th>
                <Th sortable onClick={() => handleSort('season')}>
                  <span className="inline-flex items-center gap-1">
                    {t('wh_th_season')} <SortIcon field="season" sortField={sortField} sortDir={sortDir} />
                  </span>
                </Th>
                <Th sortable onClick={() => handleSort('country')}>
                  <span className="inline-flex items-center gap-1">
                    {t('col_country')} <SortIcon field="country" sortField={sortField} sortDir={sortDir} />
                  </span>
                </Th>
                <Th right>{t('wh_th_in_qty')}</Th>
                <Th right>{t('wh_th_remaining')}</Th>
                <Th right>{t('sold')}</Th>
                <Th sortable right onClick={() => handleSort('cashPrice')}>
                  <span className="inline-flex items-center gap-1">
                    {t('wh_th_cash_price')} <SortIcon field="cashPrice" sortField={sortField} sortDir={sortDir} />
                  </span>
                </Th>
                {canSeePurchasePrice && <Th right>{t('wh_th_purchase_price')}</Th>}
                <Th>{t('wh_th_last_sale')}</Th>
                <Th>{t('col_status')}</Th>
                <Th>{t('wh_th_detail')}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.length === 0 ? (
                <tr><td colSpan={canSeePurchasePrice ? 12 : 11} className="text-center py-12 text-text-muted">{t('wh_no_product')}</td></tr>
              ) : sorted.map(p => {
                const status = shopStockStatus(p)
                const { key: statusKey, icon: StatusIcon, cls } = STATUS_CONFIG[status]
                const label = t(statusKey)
                const productBatches = batches.filter(b => b.productId === p.id)
                // Omborda bor itemlar orqali eng baland kirim narxini topish
                const inStockBatchIds = [...new Set(
                  items.filter(i => i.productId === p.id && i.status === 'in_stock' && i.batchId && shopBatchIds.has(i.batchId))
                    .map(i => i.batchId)
                )]
                const maxPurchasePrice = inStockBatchIds.reduce((max, batchId) => {
                  const b = productBatches.find(b => b.id === batchId)
                  if (b?.purchasePriceUSD && b?.entryUsdRate) {
                    const priceUZS = b.purchasePriceUSD * b.entryUsdRate
                    return priceUZS > max ? priceUZS : max
                  }
                  return (b?.purchasePrice || 0) > max ? (b?.purchasePrice || 0) : max
                }, 0)
                const lastBatch = productBatches[productBatches.length - 1]
                const needsAttrs = productNeedsAttrs(p.id)
                return (
                  <React.Fragment key={p.id}>
                  <tr
                    className={`transition-colors cursor-pointer ${needsAttrs ? 'bg-amber-400/20 hover:bg-amber-400/30' : 'hover:bg-bg-tertiary/50'}`}
                    onClick={() => toggleExpand(p.id)}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-text-muted flex-shrink-0">
                          {expandedProducts.has(p.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </span>
                        {needsAttrs && <span title="Xususiyat belgilanmagan" className="text-amber-500 flex-shrink-0"><AlertTriangle size={13} /></span>}
                        <p className="font-medium text-text-primary text-sm">{p.name}</p>
                      </div>
                    </td>
                    {(() => {
                      const catColor = getCategoryColor(p.category, productCategories)
                      const catObj = productCategories?.find(c => c.id === p.category)
                      const catLabel = catObj ? t('cat_' + catObj.id, { defaultValue: catObj.label }) : (p.categoryLabel || '—')
                      return <Td><span className={`font-semibold text-sm ${catColor.text}`}>{catLabel}</span></Td>
                    })()}
                    <Td><Badge cls={SEASON_COLORS[p.season] || 'text-text-muted bg-bg-tertiary'}>{t('season_' + p.season) || '—'}</Badge></Td>
                    <Td muted>{t('country_' + p.country, { defaultValue: p.country })}</Td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-text-secondary">{batches.filter(b => b.productId === p.id).reduce((sum, b) => sum + (b.quantityIn || 0), 0)}</span>
                      <span className="text-text-muted text-xs ml-1">{pcs}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-bold text-text-primary">{shopStock(p.id)}</span>
                      <span className="text-text-muted text-xs ml-1">{pcs}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-text-secondary">{shopItemCount(p.id, 'sold')}</span>
                      <span className="text-text-muted text-xs ml-1">{pcs}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-medium text-text-primary text-sm">{p.cashPrice.toLocaleString('uz')}</span>
                      <span className="text-text-muted text-xs ml-1">{som}</span>
                    </td>
                    {canSeePurchasePrice && (
                      <td className="px-4 py-3.5 text-right">
                        {maxPurchasePrice > 0
                          ? <><span className="font-medium text-accent-orange text-sm">{maxPurchasePrice.toLocaleString('uz')}</span><span className="text-text-muted text-xs ml-1">{som}</span></>
                          : <span className="text-text-muted text-xs">—</span>}
                      </td>
                    )}
                    <td className="px-4 py-3.5">
                      {(() => {
                        const soldSales = items.filter(i => i.productId === p.id && i.soldAt && shopBatchIds.has(i.batchId))
                        if (soldSales.length === 0) return <span className="text-text-muted text-xs">—</span>
                        const lastSoldAt = new Date(Math.max(...soldSales.map(i => new Date(i.soldAt).getTime())))
                        const diffMs = Date.now() - lastSoldAt.getTime()
                        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
                        let label, cls
                        if (diffDays === 0) { label = t('wh_today'); cls = 'text-accent-green' }
                        else if (diffDays === 1) { label = t('wh_yesterday'); cls = 'text-accent-green' }
                        else if (diffDays < 7) { label = t('wh_days_ago', { n: diffDays }); cls = 'text-accent-green' }
                        else if (diffDays < 30) { label = t('wh_weeks_ago', { n: Math.floor(diffDays / 7) }); cls = 'text-accent-orange' }
                        else if (diffDays < 365) { label = t('wh_months_ago', { n: Math.floor(diffDays / 30) }); cls = 'text-accent-red' }
                        else { label = t('wh_years_ago', { n: Math.floor(diffDays / 365) }); cls = 'text-accent-red' }
                        return <span className={`text-xs font-medium ${cls}`}>{label}</span>
                      })()}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge cls={cls}><StatusIcon size={12} />{label}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedProduct(p) }}
                        className="p-2 rounded-lg hover:bg-bg-tertiary text-text-muted hover:text-accent-blue transition-colors"
                        title={t('wh_th_detail')}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>

                  {expandedProducts.has(p.id) && (() => {
                    const inStockItems = items.filter(i =>
                      i.productId === p.id && i.status === 'in_stock' && shopBatchIds.has(i.batchId)
                    )
                    const colCount = canSeePurchasePrice ? 12 : 11
                    const hasDefs = productAttributeDefs?.length > 0
                    return (
                      <tr>
                        <td colSpan={colCount} className={`px-0 py-0 border-b border-border ${needsAttrs ? 'bg-amber-400/10' : 'bg-bg-tertiary/30'}`}>
                          <div className="px-8 py-3">
                            {inStockItems.length === 0 ? (
                              <p className="text-xs text-text-muted py-2">Omborda birlik yo'q</p>
                            ) : (
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-border/50">
                                    <th className="text-left py-2 pr-6 text-text-muted font-bold uppercase tracking-wider">Barkod</th>
                                    <th className="text-left py-2 pr-6 text-text-muted font-bold uppercase tracking-wider">Partiya</th>
                                    {(productAttributeDefs || []).map(def => (
                                      <th key={def.id} className="text-left py-2 pr-4 text-text-muted font-bold uppercase tracking-wider">
                                        {def.label}
                                      </th>
                                    ))}
                                    <th className="text-left py-2 text-text-muted font-bold uppercase tracking-wider">Holat</th>
                                    {hasDefs && <th className="py-2 w-20"></th>}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                  {inStockItems.map(item => {
                                    const batch = batches.find(b => b.id === item.batchId)
                                    const itemId = item.id
                                    const attrs = getItemAttrs(item)
                                    const hasPending = pendingAttrs[itemId] &&
                                      Object.values(pendingAttrs[itemId]).some(v => v !== '')
                                    const barcodeStatusCls = {
                                      active: 'bg-accent-green/10 text-accent-green',
                                      printed: 'bg-accent-blue/10 text-accent-blue',
                                      downloaded: 'bg-accent-blue/10 text-accent-blue',
                                    }[item.barcodeStatus] || 'bg-bg-tertiary text-text-muted'
                                    const barcodeStatusLabel = { active: 'Faol', printed: 'Chop', downloaded: 'Yuklangan' }[item.barcodeStatus] || 'Tayinlanmagan'
                                    const itemUnset = productAttributeDefs?.length > 0 &&
                                      productAttributeDefs.some(def => !(def.id in attrs))
                                    return (
                                      <tr key={item.id} className={itemUnset ? 'bg-amber-400/15 hover:bg-amber-400/25' : 'hover:bg-bg-tertiary/20'}>
                                        <td className="py-2 pr-6">
                                          {item.barcode
                                            ? <span className="font-mono font-medium text-text-primary">{item.barcode}</span>
                                            : <span className="text-text-muted italic">— barkod yo'q —</span>}
                                        </td>
                                        <td className="py-2 pr-6 text-text-secondary">
                                          {batch?.batchNumber || '—'}
                                        </td>
                                        {(productAttributeDefs || []).map(def => {
                                          const isKeySet = def.id in attrs
                                          const val = attrs[def.id]
                                          const hasPendingDef = pendingAttrs[itemId] && def.id in pendingAttrs[itemId]
                                          if (isKeySet && !hasPendingDef) {
                                            return (
                                              <td key={def.id} className="py-2 pr-4">
                                                {val
                                                  ? <span className="px-2 py-0.5 bg-accent-blue/10 text-accent-blue rounded-md font-medium">{val}</span>
                                                  : <span className="text-text-muted">—</span>}
                                              </td>
                                            )
                                          }
                                          const selectVal = hasPendingDef ? (pendingAttrs[itemId][def.id] ?? '__none__') : ''
                                          return (
                                            <td key={def.id} className="py-2 pr-4">
                                              <select
                                                value={selectVal}
                                                onClick={e => e.stopPropagation()}
                                                onChange={e => setPendingAttrs(prev => ({
                                                  ...prev,
                                                  [itemId]: { ...(prev[itemId] || {}), [def.id]: e.target.value }
                                                }))}
                                                className="text-xs px-2 py-1 bg-bg-tertiary border border-amber-400 rounded-lg text-text-primary focus:outline-none focus:border-accent-blue"
                                              >
                                                <option value="">— tanlang —</option>
                                                {def.values.map(v => <option key={v} value={v}>{v}</option>)}
                                                <option value="__none__">Xususiyatsiz</option>
                                              </select>
                                            </td>
                                          )
                                        })}
                                        <td className="py-2">
                                          <span className={`px-2 py-0.5 rounded-md font-medium ${barcodeStatusCls}`}>
                                            {barcodeStatusLabel}
                                          </span>
                                        </td>
                                        {hasDefs && (
                                          <td className="py-2 pl-2">
                                            {hasPending && (
                                              <button
                                                onClick={e => { e.stopPropagation(); handleSaveAttrs(item) }}
                                                disabled={savingItemId === itemId}
                                                className="px-3 py-1 rounded-lg bg-accent-blue text-white text-xs font-medium hover:bg-accent-blue/80 transition-colors disabled:opacity-50"
                                              >
                                                {savingItemId === itemId ? '...' : 'Saqlash'}
                                              </button>
                                            )}
                                          </td>
                                        )}
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            )}
                            <p className="text-[10px] text-text-muted mt-2">{inStockItems.length} ta birlik • omborda</p>
                          </div>
                        </td>
                      </tr>
                    )
                  })()}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductModal
            product={selectedProduct}
            batches={batches.filter(b => b.productId === selectedProduct.id)}
            items={items.filter(i => i.productId === selectedProduct.id)}
            userRole={userRole}
            canSeePurchasePrice={canSeePurchasePrice}
            productCategories={productCategories}
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================
// USED STOCK (B/U QOLDIQ) TAB
// ============================

export default StockTab
