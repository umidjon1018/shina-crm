import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, ArrowDownToLine, BarChart2, CheckCircle, ChevronDown, ChevronRight, Package, Search } from 'lucide-react'
import { getCategoryColor } from '../../../utils/categoryColors'
import { useSettingsStore } from '../../../store/settingsStore'
import { Badge, StatCard, Th, Td, CATEGORIES, USED_STOCK_STATUS_CONFIG } from '../whHelpers.jsx'
import { updateUsedStockAttributes } from '../../../api/usedService'

const UsedStockTab = ({ usedStock, usedSales = [], productCategories }) => {
  const { t } = useTranslation()
  const { productAttributeDefs } = useSettingsStore()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [attrFilters, setAttrFilters] = useState({})
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [pendingAttrs, setPendingAttrs] = useState({})
  const [localItemAttrs, setLocalItemAttrs] = useState({})
  const [savingItemId, setSavingItemId] = useState(null)

  const hasDefs = (productAttributeDefs || []).length > 0

  const setAttrFilter = (defId, value) => {
    setAttrFilters(prev => {
      if (value === 'all') { const next = { ...prev }; delete next[defId]; return next }
      return { ...prev, [defId]: value }
    })
  }

  const getItemAttrs = (item) => localItemAttrs[item?.id] ?? item?.attributes ?? {}

  const activeAttrFilters = Object.entries(attrFilters)

  const filtered = usedStock.filter(u => {
    const q = search.toLowerCase()
    if (!u.name?.toLowerCase().includes(q)) return false
    if (category !== 'all' && u.category !== category) return false
    if (statusFilter === 'scrapped') {
      const soldSale = (u.status === 'sold' && u.soldSaleId) ? usedSales.find(s => s.id === u.soldSaleId) : null
      if (!(u.status === 'scrapped' || soldSale?.customerName === 'Utilizatsiya')) return false
    } else if (statusFilter !== 'all' && u.status !== statusFilter) {
      return false
    }
    if (activeAttrFilters.length > 0) {
      const a = getItemAttrs(u)
      for (const [defId, val] of activeAttrFilters) {
        if (val === '__unset__') { if (defId in a && a[defId] !== null) return false }
        else { if (a[defId] !== val) return false }
      }
    }
    return true
  })

  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => new Date(b.acquiredAt || 0) - new Date(a.acquiredAt || 0))
  , [filtered])

  // Gruppalashtirish — xususiyatsiz key (attributes alohida expanded da ko'rinadi)
  const grouped = useMemo(() => {
    const map = new Map()
    sorted.forEach(u => {
      const key = [u.acquiredSaleId, u.name, u.category, u.acquiredPrice, u.status, u.replacedItemBarcode || '', u.soldSaleId || ''].join('|')
      if (!map.has(key)) {
        const soldSale = u.status === 'sold' ? usedSales.find(s => s.id === u.soldSaleId) : null
        map.set(key, {
          ...u,
          _key: key,
          qty: 1,
          totalSellPrice: u.sellPrice || 0,
          buyerName: soldSale?.customerName || '—',
          soldByName: soldSale?.soldByName || '—',
          _items: [u],
        })
      } else {
        const g = map.get(key)
        g.qty += 1
        g.totalSellPrice += (u.sellPrice || 0)
        g._items.push(u)
      }
    })
    return [...map.values()]
  }, [sorted, usedSales])

  const toggleExpand = (key) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
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
      await updateUsedStockAttributes(itemId, newAttrs)
      setLocalItemAttrs(prev => ({ ...prev, [itemId]: newAttrs }))
      setPendingAttrs(prev => { const n = { ...prev }; delete n[itemId]; return n })
    } catch (e) {
      console.error(e)
    } finally {
      setSavingItemId(null)
    }
  }

  const groupNeedsAttrs = (group) => {
    if (!hasDefs) return false
    return group._items.some(item => {
      if (item.status !== 'in_stock') return false
      const a = getItemAttrs(item)
      return productAttributeDefs.some(def => !(def.id in a))
    })
  }

  const inStockItems = usedStock.filter(u => u.status === 'in_stock')
  const soldItems = usedStock.filter(u => u.status === 'sold')
  const stockValue = inStockItems.reduce((sum, u) => sum + (u.acquiredPrice || 0), 0)
  const soldValue = soldItems.reduce((sum, u) => sum + (u.sellPrice || 0), 0)

  const colCount = 13

  return (
    <div className="space-y-3 sm:space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('wh_bu_in_stock')} value={inStockItems.length} icon={Package} cls="bg-accent-blue/10 text-accent-blue" />
        <StatCard label={t('wh_bu_sold')} value={soldItems.length} icon={CheckCircle} cls="bg-accent-green/10 text-accent-green" />
        <StatCard label={t('wh_bu_value')} value={stockValue.toLocaleString('uz') + ' ' + t('dash_so_m')} icon={BarChart2} cls="bg-accent-orange/10 text-accent-orange" />
        <StatCard label={t('wh_bu_sale_total')} value={soldValue.toLocaleString('uz') + ' ' + t('dash_so_m')} icon={ArrowDownToLine} cls="bg-accent-red/10 text-accent-red" />
      </div>

      {/* Filters */}
      <div className="bg-bg-secondary border border-border rounded-2xl p-4 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1 flex-1 min-w-48">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">Qidiruv</span>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('wh_bu_not_found')} className="w-full pl-9 pr-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue transition-colors" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">{t('col_category')}</span>
          <select value={category} onChange={e => setCategory(e.target.value)} className="px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue">
            {CATEGORIES.map(c => <option key={c} value={c}>{t('cat_' + c)}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">{t('col_status')}</span>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue">
            <option value="all">{t('wh_all_status')}</option>
            <option value="in_stock">{t('col_in_stock')}</option>
            <option value="sold">{t('sold')}</option>
            <option value="scrapped">{t('wh_bu_scrapped')}</option>
          </select>
        </div>
        {(productAttributeDefs || []).map(def => (
          <div key={def.id} className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">{def.label}</span>
            <select value={attrFilters[def.id] || 'all'} onChange={e => setAttrFilter(def.id, e.target.value)} className="px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue">
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
                <Th nowrap>{t('wh_bc_income_date')}</Th>
                <Th nowrap>{t('col_product')}</Th>
                <Th nowrap>{t('col_category')}</Th>
                <Th nowrap>{t('wh_bu_replaced')}</Th>
                <Th nowrap>{t('customers')}</Th>
                <Th nowrap right>{t('wh_th_in_qty')}</Th>
                <Th nowrap right>{t('wh_bu_unit_price')}</Th>
                <Th nowrap right>{t('wh_bu_total_price')}</Th>
                <Th nowrap>{t('wh_bu_seller')}</Th>
                <Th nowrap>{t('col_status')}</Th>
                <Th nowrap>{t('col_sold_date')}</Th>
                <Th nowrap>{t('wh_bu_buyer')}</Th>
                <Th nowrap right>{t('wh_bu_sold_price')}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {grouped.length === 0 ? (
                <tr><td colSpan={colCount} className="text-center py-12 text-text-muted">{t('wh_bu_not_found')}</td></tr>
              ) : grouped.map(u => {
                const catColor = getCategoryColor(u.category, productCategories)
                const catObj = productCategories?.find(c => c.id === u.category)
                const catLabel = catObj ? t('cat_' + catObj.id, { defaultValue: catObj.label }) : (u.categoryLabel || '—')
                const statusCfg = USED_STOCK_STATUS_CONFIG[u.status] || USED_STOCK_STATUS_CONFIG.in_stock
                const needsAttrs = groupNeedsAttrs(u)
                const isExpanded = expandedRows.has(u._key)
                return (
                  <>
                  <tr
                    key={u._key}
                    onClick={() => hasDefs && toggleExpand(u._key)}
                    className={`transition-colors ${hasDefs ? 'cursor-pointer' : ''} ${needsAttrs ? 'bg-amber-400/10 hover:bg-amber-400/20' : 'hover:bg-bg-tertiary/50'}`}
                  >
                    <td className="px-2 py-2.5 sm:py-3.5 whitespace-nowrap text-sm text-text-muted">
                      {u.acquiredAt ? (
                        <>
                          <div>{new Date(u.acquiredAt).toLocaleDateString('uz-UZ')}</div>
                          <div className="text-[10px] text-text-muted/60">{new Date(u.acquiredAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</div>
                        </>
                      ) : '—'}
                    </td>
                    <td className="px-2 py-2.5 sm:py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {hasDefs && <span className="text-text-muted flex-shrink-0">{isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</span>}
                        {needsAttrs && <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />}
                        <span className="font-medium text-text-primary text-sm">{u.name}</span>
                      </div>
                    </td>
                    <Td nowrap><span className={`font-semibold text-sm ${catColor.text}`}>{catLabel}</span></Td>
                    <td className="px-2 py-2.5 sm:py-3.5 whitespace-nowrap text-sm text-text-muted">
                      <div>{u.replacedProductName || '—'}</div>
                      {u.replacedItemBarcode && <div className="text-[10px] font-mono text-text-muted/70 mt-0.5">{u.replacedItemBarcode}</div>}
                    </td>
                    <Td nowrap muted>{u.customerName || '—'}</Td>
                    <td className="px-2 py-2.5 sm:py-3.5 text-right whitespace-nowrap">
                      <span className="font-medium text-text-primary text-sm">{u.qty}</span>
                    </td>
                    <td className="px-2 py-2.5 sm:py-3.5 text-right whitespace-nowrap">
                      <span className="font-medium text-text-primary text-sm">{(u.acquiredPrice || 0).toLocaleString('uz')}</span>
                      <span className="text-text-muted text-xs ml-1">{t('dash_so_m')}</span>
                    </td>
                    <td className="px-2 py-2.5 sm:py-3.5 text-right whitespace-nowrap">
                      <span className="font-medium text-text-primary text-sm">{((u.acquiredPrice || 0) * u.qty).toLocaleString('uz')}</span>
                      <span className="text-text-muted text-xs ml-1">{t('dash_so_m')}</span>
                    </td>
                    <Td nowrap muted>{u.employeeName || '—'}</Td>
                    <td className="px-2 py-2.5 sm:py-3.5 whitespace-nowrap">
                      <Badge cls={statusCfg.cls}>{t(statusCfg.key)}</Badge>
                    </td>
                    <td className="px-2 py-2.5 sm:py-3.5 whitespace-nowrap text-sm text-text-muted">
                      {u.soldAt ? (
                        <>
                          <div>{new Date(u.soldAt).toLocaleDateString('uz-UZ')}</div>
                          <div className="text-[10px] text-text-muted/60">{new Date(u.soldAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</div>
                        </>
                      ) : '—'}
                    </td>
                    <Td nowrap muted>{u.buyerName}</Td>
                    <td className="px-2 py-2.5 sm:py-3.5 text-right whitespace-nowrap">
                      {u.totalSellPrice
                        ? <><span className="font-medium text-text-primary text-sm">{u.totalSellPrice.toLocaleString('uz')}</span><span className="text-text-muted text-xs ml-1">{t('dash_so_m')}</span></>
                        : <span className="text-text-muted text-xs">—</span>}
                    </td>
                  </tr>

                  {/* Expanded: xususiyatlar */}
                  {hasDefs && isExpanded && (
                    <tr key={u._key + '_exp'}>
                      <td colSpan={colCount} className={`px-0 py-0 border-b border-border ${needsAttrs ? 'bg-amber-400/10' : 'bg-bg-tertiary/30'}`}>
                        <div className="px-5 sm:px-8 py-3">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-border/50">
                                <th className="text-left py-2 pr-6 text-text-muted font-bold uppercase tracking-wider">ID</th>
                                {productAttributeDefs.map(def => (
                                  <th key={def.id} className="text-left py-2 pr-4 text-text-muted font-bold uppercase tracking-wider">{def.label}</th>
                                ))}
                                <th className="py-2 w-20"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                              {u._items.map(item => {
                                const attrs = getItemAttrs(item)
                                const hasPending = pendingAttrs[item.id] && Object.values(pendingAttrs[item.id]).some(v => v !== '')
                                const itemUnset = item.status === 'in_stock' && productAttributeDefs.some(def => !(def.id in attrs))
                                return (
                                  <tr key={item.id} className={itemUnset ? 'bg-amber-400/15 hover:bg-amber-400/25' : 'hover:bg-bg-tertiary/20'}>
                                    <td className="py-2 pr-6 text-text-muted font-mono">{item.id}</td>
                                    {productAttributeDefs.map(def => {
                                      const isKeySet = def.id in attrs
                                      const val = attrs[def.id]
                                      const hasPendingDef = pendingAttrs[item.id] && def.id in pendingAttrs[item.id]
                                      if (isKeySet && !hasPendingDef) {
                                        return (
                                          <td key={def.id} className="py-2 pr-4">
                                            {val
                                              ? <span className="px-2 py-0.5 bg-accent-blue/10 text-accent-blue rounded-md font-medium">{val}</span>
                                              : <span className="text-text-muted">—</span>}
                                          </td>
                                        )
                                      }
                                      const selectVal = hasPendingDef ? (pendingAttrs[item.id][def.id] ?? '__none__') : ''
                                      return (
                                        <td key={def.id} className="py-2 pr-4">
                                          <select
                                            value={selectVal}
                                            onClick={e => e.stopPropagation()}
                                            onChange={e => setPendingAttrs(prev => ({
                                              ...prev,
                                              [item.id]: { ...(prev[item.id] || {}), [def.id]: e.target.value }
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
                                    <td className="py-2 pl-2">
                                      {hasPending && (
                                        <button
                                          onClick={e => { e.stopPropagation(); handleSaveAttrs(item) }}
                                          disabled={savingItemId === item.id}
                                          className="px-3 py-1 rounded-lg bg-accent-blue text-white text-xs font-medium hover:bg-accent-blue/80 transition-colors disabled:opacity-50"
                                        >
                                          {savingItemId === item.id ? '...' : 'Saqlash'}
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                          <p className="text-[10px] text-text-muted mt-2">{u._items.length} ta birlik</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ============================
// INCOME TAB
// ============================

export default UsedStockTab
