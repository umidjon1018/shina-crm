import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, AlertCircle, X, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getProducts } from '../../api/productService'
import { getItems } from '../../api/itemService'
import { checkReservation } from '../../api/reservationService'
import { useShopStore } from '../../store/shopStore'
import { useDataStore } from '../../store/dataStore'
import { useSettingsStore } from '../../store/settingsStore'
import i18n from '../../i18n'

const formatPrice = (price) => Math.round(price).toLocaleString('uz-UZ') + ' ' + i18n.t('unit_som')

const ProductSearch = ({ onAdd, cartItems, user, addNotification, notificationSettings, allowSold = false, salesItems }) => {
  const { t } = useTranslation()
  const { selectedShopId } = useShopStore()
  const { version } = useDataStore()
  const { productAttributeDefs } = useSettingsStore()
  const [MOCK_PRODUCTS, setMockProducts] = useState([])
  const [MOCK_ITEMS, setMockItems] = useState([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [warning, setWarning] = useState(null)
  const [attrFilters, setAttrFilters] = useState({}) // { defId: value }

  const activeAttrFilters = Object.entries(attrFilters).filter(([, v]) => v && v !== 'all')

  const itemMatchesAttrs = (item) => {
    if (activeAttrFilters.length === 0) return true
    const attrs = item.attributes || {}
    return activeAttrFilters.every(([defId, val]) => attrs[defId] === val)
  }

  useEffect(() => {
    const params = selectedShopId && selectedShopId !== 'all' ? { shopId: selectedShopId } : {}
    Promise.all([getProducts(), getItems(params)]).then(([prods, items]) => {
      setMockProducts(prods)
      setMockItems(items)
    })
  }, [version, selectedShopId])

  const shopBatchIds = useMemo(() => {
    return new Set(MOCK_ITEMS.map(i => i.batchId))
  }, [MOCK_ITEMS])

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const q = query.toLowerCase()
    const found = MOCK_PRODUCTS.filter(p => {
      const stock = MOCK_ITEMS.filter(i =>
        i.productId === p.id && i.status === (allowSold ? 'sold' : 'in_stock') && i.barcode !== null && itemMatchesAttrs(i)
      ).length
      return stock > 0 && (
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.size?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.categoryLabel?.toLowerCase().includes(q)
      )
    })

    if (salesItems && salesItems.length > 0) {
      const fromSales = salesItems.filter(it =>
        it.name?.toLowerCase().includes(q) ||
        it.barcode?.toLowerCase().includes(q)
      )
      const extraProducts = fromSales
        .map(it => MOCK_PRODUCTS.find(p => p.id === it.productId))
        .filter(Boolean)
        .filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)
      extraProducts.forEach(p => {
        if (!found.some(f => f.id === p.id)) found.push(p)
      })
    }

    setResults(found)
  }, [query, allowSold, salesItems, MOCK_PRODUCTS, MOCK_ITEMS, attrFilters])

  const handleAdd = async (product) => {
    setWarning(null)

    const allItems = MOCK_ITEMS.filter(i => i.productId === product.id)
    const withBarcode = allItems.filter(i => i.barcode !== null)
    const available = withBarcode.filter(i => i.status === (allowSold ? 'sold' : 'in_stock') && itemMatchesAttrs(i))

    if (allItems.length > 0 && withBarcode.length === 0) {
      setWarning({ type: 'no_barcode', message: t('sl_ps_msg_no_barcode', { name: product.name }) })
      return
    }
    if (available.length === 0) {
      setWarning({ type: 'sold_out', message: allowSold ? t('sl_ps_msg_not_sold', { name: product.name }) : t('sl_ps_msg_sold_out', { name: product.name }) })
      return
    }

    const item = allowSold ? available[0] : available.find(i => !(cartItems || []).some(c => c.item.id === i.id))
    if (!item) {
      setWarning({ type: 'in_cart', message: t('sl_ps_msg_in_cart') })
      return
    }

    // Bron tekshiruv
    if (!allowSold) {
      const resCheck = await checkReservation(item.id)
      if (resCheck.reserved) {
        const rv = resCheck.reservation
        const until = new Date(rv.reserved_until).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
        setWarning({ type: 'reserved', message: `Bu tovar ${rv.customer_name || 'mijoz'} tomonidan soat ${until} gacha bron qilingan` })
        return
      }
    }

    if (!allowSold && item.barcodeStatus === 'active') {
      if (notificationSettings?.BARCODE_NOT_PRINTED !== false) {
        addNotification && addNotification({
          type: 'BARCODE_NOT_PRINTED',
          severity: 'warning',
          title: `${user?.fullName || user?.name || user?.username || 'Xodim'} tomonidan: Barkod chop etilmagan`,
          message: `"${product.name}" (${item.barcode}) barkodi chop etilmagan holda sotuvga qo'shildi`,
          titleKey: 'notif_title_barcode_not_printed',
          messageKey: 'notif_msg_barcode_not_printed',
          messageParams: { name: product.name, barcode: item.barcode },
          productId: product.id,
          productName: product.name,
          barcode: item.barcode,
          itemId: item.id,
          sellerId: user?.id,
          sellerName: user?.fullName || user?.name || user?.username,
        })
      }
      onAdd({ item, product, warning: 'not_printed' })
    } else {
      onAdd({ item, product, warning: null })
    }

    setQuery('')
    setResults([])
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setWarning(null) }}
          placeholder={allowSold ? t('sl_ps_placeholder_sold') : t('sl_ps_placeholder_stock')}
          className="w-full pl-10 pr-4 py-3 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
        />
      </div>

      {/* Xususiyat filtrlari — qidiruv boshlanganda ko'rinadi (natija bo'lmasa ham) */}
      {query.length >= 2 && (productAttributeDefs || []).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(productAttributeDefs || []).map(def => (
            <div key={def.id} className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted px-1">{def.label}</span>
              <select
                value={attrFilters[def.id] || 'all'}
                onChange={e => setAttrFilters(prev => ({ ...prev, [def.id]: e.target.value }))}
                className="px-2 py-1.5 bg-bg-tertiary border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent-blue"
              >
                <option value="all">Barchasi</option>
                {def.values.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {warning && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex items-start gap-3 p-3 rounded-xl border text-sm ${
              warning.type === 'no_barcode'
                ? 'bg-accent-orange/10 border-accent-orange/30 text-accent-orange'
                : 'bg-accent-red/10 border-accent-red/30 text-accent-red'
            }`}
          >
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-xs">
                {warning.type === 'no_barcode' ? t('sl_ps_warn_no_barcode') :
                 warning.type === 'sold_out' ? (allowSold ? t('sl_ps_warn_not_sold') : t('sl_ps_warn_sold_out')) : t('sl_ps_warn_in_cart')}
              </p>
              <p className="text-xs mt-0.5 opacity-80">{warning.message}</p>
            </div>
            <button onClick={() => setWarning(null)} className="opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-bg-secondary border border-border rounded-2xl overflow-hidden max-h-64 overflow-y-auto no-scrollbar"
          >
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-tertiary sticky top-0 text-text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">{t('col_product')}</th>
                  <th className="px-4 py-2 font-medium text-right">{t('sl_ps_th_price')}</th>
                  <th className="px-4 py-2 font-medium text-right">{allowSold ? t('sold') : t('sl_ps_th_stock')}</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {results.map(p => {
                  const available = MOCK_ITEMS.filter(i =>
                    i.productId === p.id && i.status === (allowSold ? 'sold' : 'in_stock') && i.barcode !== null && itemMatchesAttrs(i)
                  )
                  const inCartCount = allowSold ? 0 : (cartItems || []).filter(c => c.item.productId === p.id).length
                  const canAdd = allowSold ? available.length > 0 : available.length > inCartCount
                  const hasActive = !allowSold && available.some(i => i.barcodeStatus === 'active')

                  return (
                    <tr key={p.id} className="hover:bg-bg-tertiary/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-text-primary">{p.name}</p>
                        <p className="text-xs text-text-muted">{t('cat_' + p.category, { defaultValue: p.categoryLabel })} · {p.size}</p>
                        {hasActive && canAdd && (
                          <span className="text-[10px] text-accent-orange font-medium">{t('sl_ps_badge_no_barcode')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-text-primary whitespace-nowrap">
                        {formatPrice(p.cashPrice)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                          available.length === 0 ? 'bg-accent-red/10 text-accent-red' :
                          !allowSold && available.length <= (p.lowStockThreshold || 3) ? 'bg-accent-orange/10 text-accent-orange' :
                          'bg-accent-green/10 text-accent-green'
                        }`}>
                          {allowSold ? available.length : available.length - inCartCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleAdd(p)}
                          disabled={!canAdd}
                          className={`p-1.5 rounded-lg transition-opacity ${
                            canAdd
                              ? 'bg-accent-blue text-white hover:opacity-90'
                              : 'bg-bg-tertiary text-text-muted cursor-not-allowed opacity-40'
                          }`}
                        >
                          <Plus size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ProductSearch

