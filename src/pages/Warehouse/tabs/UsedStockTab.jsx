import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowDownToLine, BarChart2, CheckCircle, Package, Search } from 'lucide-react'
import { getCategoryColor } from '../../../utils/categoryColors'
import { Badge, StatCard, Th, Td, CATEGORIES, USED_STOCK_STATUS_CONFIG } from '../whHelpers.jsx'

const UsedStockTab = ({ usedStock, usedSales = [], productCategories }) => {
  const MOCK_USED_SALES = usedSales
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = usedStock.filter(u => {
    const q = search.toLowerCase()
    const nameMatch = u.name?.toLowerCase().includes(q)
    const catMatch = category === 'all' || u.category === category
    let statusMatch
    if (statusFilter === 'all') {
      statusMatch = true
    } else if (statusFilter === 'scrapped') {
      // Utilizatsiya: scrap qilingan YOKI "Utilizatsiya" mijoziga sotilgan
      const soldSale = (u.status === 'sold' && u.soldSaleId) ? usedSales.find(s => s.id === u.soldSaleId) : null
      statusMatch = u.status === 'scrapped' || soldSale?.customerName === 'Utilizatsiya'
    } else {
      statusMatch = u.status === statusFilter
    }
    return nameMatch && catMatch && statusMatch
  })

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => new Date(b.acquiredAt || 0) - new Date(a.acquiredAt || 0))
  }, [filtered])

  const grouped = useMemo(() => {
    const map = new Map()
    sorted.forEach(u => {
      // replacedItemBarcode mavjud bo'lsa — alohida qator (har bir item o'z barkodi bilan)
      const key = [u.acquiredSaleId, u.name, u.category, u.acquiredPrice, u.status, u.replacedItemBarcode || '', u.soldSaleId || ''].join('|')
      if (!map.has(key)) {
        const soldSale = u.status === 'sold' ? MOCK_USED_SALES.find(s => s.id === u.soldSaleId) : null
        const buyerName = soldSale?.customerName || '—'
        const soldByName = soldSale?.soldByName || '—'
        map.set(key, { ...u, qty: 1, totalSellPrice: u.sellPrice || 0, buyerName, soldByName })
      } else {
        const g = map.get(key)
        g.qty += 1
        g.totalSellPrice += (u.sellPrice || 0)
      }
    })
    return [...map.values()]
  }, [sorted])

  const inStockItems = usedStock.filter(u => u.status === 'in_stock')
  const soldItems = usedStock.filter(u => u.status === 'sold')
  const stockValue = inStockItems.reduce((sum, u) => sum + (u.acquiredPrice || 0), 0)
  const soldValue = soldItems.reduce((sum, u) => sum + (u.sellPrice || 0), 0)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('wh_bu_in_stock')} value={inStockItems.length} icon={Package} cls="bg-accent-blue/10 text-accent-blue" />
        <StatCard label={t('wh_bu_sold')} value={soldItems.length} icon={CheckCircle} cls="bg-accent-green/10 text-accent-green" />
        <StatCard label={t('wh_bu_value')} value={stockValue.toLocaleString('uz') + ' ' + t('dash_so_m')} icon={BarChart2} cls="bg-accent-orange/10 text-accent-orange" />
        <StatCard label={t('wh_bu_sale_total')} value={soldValue.toLocaleString('uz') + ' ' + t('dash_so_m')} icon={ArrowDownToLine} cls="bg-accent-red/10 text-accent-red" />
      </div>

      {/* Filters */}
      <div className="bg-bg-secondary border border-border rounded-2xl p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('wh_bu_not_found')} className="w-full pl-9 pr-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue transition-colors" />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)} className="px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue">
          {CATEGORIES.map(c => <option key={c} value={c}>{t('cat_' + c)}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue">
          <option value="all">{t('wh_all_status')}</option>
          <option value="in_stock">{t('col_in_stock')}</option>
          <option value="sold">{t('sold')}</option>
          <option value="scrapped">{t('wh_bu_scrapped')}</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-hidden">
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
                <Th nowrap>{t('wh_bu_seller')}</Th>
                <Th nowrap right>{t('wh_bu_sold_price')}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {grouped.length === 0 ? (
                <tr><td colSpan={14} className="text-center py-12 text-text-muted">{t('wh_bu_not_found')}</td></tr>
              ) : grouped.map(u => {
                const catColor = getCategoryColor(u.category, productCategories)
                const catObj = productCategories?.find(c => c.id === u.category)
                const catLabel = catObj ? t('cat_' + catObj.id, { defaultValue: catObj.label }) : (u.categoryLabel || '—')
                const statusCfg = USED_STOCK_STATUS_CONFIG[u.status] || USED_STOCK_STATUS_CONFIG.in_stock
                return (
                  <tr key={u.id} className="hover:bg-bg-tertiary/50 transition-colors">
                    <td className="px-2 py-3.5 whitespace-nowrap text-sm text-text-muted">
                      {u.acquiredAt ? (
                        <>
                          <div>{new Date(u.acquiredAt).toLocaleDateString('uz-UZ')}</div>
                          <div className="text-[10px] text-text-muted/60">{new Date(u.acquiredAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</div>
                        </>
                      ) : '—'}
                    </td>
                    <Td nowrap><span className="font-medium text-text-primary">{u.name}</span></Td>
                    <Td nowrap><span className={`font-semibold text-sm ${catColor.text}`}>{catLabel}</span></Td>
                    <td className="px-2 py-3.5 whitespace-nowrap text-sm text-text-muted">
                      <div>{u.replacedProductName || '—'}</div>
                      {u.replacedItemBarcode && (
                        <div className="text-[10px] font-mono text-text-muted/70 mt-0.5">{u.replacedItemBarcode}</div>
                      )}
                    </td>
                    <Td nowrap muted>{u.customerName || '—'}</Td>
                    <td className="px-2 py-3.5 text-right whitespace-nowrap">
                      <span className="font-medium text-text-primary text-sm">{u.qty}</span>
                    </td>
                    <td className="px-2 py-3.5 text-right whitespace-nowrap">
                      <span className="font-medium text-text-primary text-sm">{(u.acquiredPrice || 0).toLocaleString('uz')}</span>
                      <span className="text-text-muted text-xs ml-1">{t('dash_so_m')}</span>
                    </td>
                    <td className="px-2 py-3.5 text-right whitespace-nowrap">
                      <span className="font-medium text-text-primary text-sm">{((u.acquiredPrice || 0) * u.qty).toLocaleString('uz')}</span>
                      <span className="text-text-muted text-xs ml-1">{t('dash_so_m')}</span>
                    </td>
                    <Td nowrap muted>{u.employeeName || '—'}</Td>
                    <td className="px-2 py-3.5 whitespace-nowrap">
                      <Badge cls={statusCfg.cls}>{t(statusCfg.key)}</Badge>
                    </td>
                    <td className="px-2 py-3.5 whitespace-nowrap text-sm text-text-muted">
                      {u.soldAt ? (
                        <>
                          <div>{new Date(u.soldAt).toLocaleDateString('uz-UZ')}</div>
                          <div className="text-[10px] text-text-muted/60">{new Date(u.soldAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</div>
                        </>
                      ) : '—'}
                    </td>
                    <Td nowrap muted>{u.buyerName}</Td>
                    <Td nowrap muted>{u.soldByName}</Td>
                    <td className="px-2 py-3.5 text-right whitespace-nowrap">
                      {u.totalSellPrice
                        ? <><span className="font-medium text-text-primary text-sm">{u.totalSellPrice.toLocaleString('uz')}</span><span className="text-text-muted text-xs ml-1">{t('dash_so_m')}</span></>
                        : <span className="text-text-muted text-xs">—</span>}
                    </td>
                  </tr>
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
