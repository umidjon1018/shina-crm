import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Package, AlertTriangle, XCircle, CheckCircle, BarChart2, Eye } from 'lucide-react'
import { getCategoryColor } from '../../../utils/categoryColors'
import { useAuthStore } from '../../../store/authStore'
import { Badge, StatCard, Th, Td, SortIcon, CATEGORIES, SEASONS, SEASON_COLORS, stockStatus, STATUS_CONFIG, isPrivileged } from '../whHelpers.jsx'
import ProductModal from '../components/ProductModal'

const StockTab = ({ products, batches, items, userRole, productCategories }) => {
  const { t } = useTranslation()
  const som = t('unit_som')
  const pcs = t('unit_pcs')
  const { hasPermission } = useAuthStore()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [season, setSeason] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [colorFilter, setColorFilter] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState(null)

  const [sortField, setSortField] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  // Shop-aware helpers — batches prop already filtered by shopId from parent
  const shopBatchIds = useMemo(() => new Set(batches.map(b => b.id)), [batches])
  // Only products that have at least 1 batch in this shop
  const shopProducts = useMemo(() => products.filter(p => batches.some(b => b.productId === p.id)), [products, batches])
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

  const filtered = shopProducts.filter(p => {
    const q = search.toLowerCase()
    return (
      (p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q)) &&
      (category === 'all' || p.category === category) &&
      (season === 'all' || p.season === season) &&
      (statusFilter === 'all' || shopStockStatus(p) === statusFilter) &&
      (colorFilter === 'all' || p.color === colorFilter)
    )
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
      <div className="bg-bg-secondary border border-border rounded-2xl p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('wh_search_ph')} className="w-full pl-9 pr-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue transition-colors" />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)} className="px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue">
          {CATEGORIES.map(c => <option key={c} value={c}>{t('cat_' + c)}</option>)}
        </select>
        <select value={season} onChange={e => setSeason(e.target.value)} className="px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue">
          {SEASONS.map(s => <option key={s} value={s}>{t('season_' + s)}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue">
          <option value="all">{t('wh_all_status')}</option>
          <option value="ok">{t('stock_ok')}</option>
          <option value="low">{t('stock_low')}</option>
          <option value="empty">{t('stock_empty')}</option>
        </select>
        <select value={colorFilter} onChange={e => setColorFilter(e.target.value)} className="px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue">
          <option value="all">Barcha ranglar</option>
          <option value="Qora">Qora</option>
          <option value="Kumush">Kumush</option>
          <option value="Bronza">Bronza</option>
          <option value="Chrome">Chrome</option>
          <option value="Gunmetal">Gunmetal</option>
          <option value="Kulrang">Kulrang</option>
        </select>
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
                return (
                  <tr key={p.id} className="hover:bg-bg-tertiary/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-text-primary text-sm">{p.name}</p>
                      {(p.color || p.pcd || p.et) && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {p.color && <span className="px-1.5 py-0.5 bg-bg-tertiary text-text-muted text-[10px] rounded font-semibold">{p.color}</span>}
                          {p.pcd && <span className="px-1.5 py-0.5 bg-bg-tertiary text-text-muted text-[10px] rounded font-semibold">{p.pcd}</span>}
                          {p.et && <span className="px-1.5 py-0.5 bg-bg-tertiary text-text-muted text-[10px] rounded font-semibold">{p.et}</span>}
                        </div>
                      )}
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
                        onClick={() => setSelectedProduct(p)}
                        className="p-2 rounded-lg hover:bg-bg-tertiary text-text-muted hover:text-accent-blue transition-colors"
                        title={t('wh_th_detail')}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
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
