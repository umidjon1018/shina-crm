import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Package, PackagePlus, Barcode, Recycle, ClipboardCheck, Trash2 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useNotificationStore } from '../../store/notificationStore'
import { useDataStore } from '../../store/dataStore'
import { useShopStore } from '../../store/shopStore'
import { getUsedStock, getUsedSales } from '../../api/usedService'
import { getIncomeBatches } from '../../api/incomeService'
import { getProducts } from '../../api/productService'
import { getItems } from '../../api/itemService'
import { TABS } from './whHelpers.jsx'
import SectionHub from '../../components/ui/SectionHub'
import { PageHeader } from '../../components/ui/Kit'
import StockTab from './tabs/StockTab'
import UsedStockTab from './tabs/UsedStockTab'
import IncomeTab from './tabs/IncomeTab'
import BarcodeTab from './tabs/BarcodeTab'
import StocktakeTab from './tabs/StocktakeTab'
import WriteoffTab from './tabs/WriteoffTab'
import ProductsSection from './products/ProductsSection'

const Warehouse = () => {
  const { t } = useTranslation()
  const { user, hasPermission } = useAuthStore()
  const { productCategories, downloadEnabled, notificationSettings } = useSettingsStore()
  const { addNotification } = useNotificationStore()
  const { version, bump } = useDataStore()
  const { selectedShopId } = useShopStore()
  const WH_TABS = TABS.filter(id => hasPermission('warehouse.' + id))
  const [products, setProducts] = useState([])
  const [batches, setBatches] = useState([])
  const [items, setItems] = useState([])
  const [usedStock, setUsedStock] = useState([])
  const [usedSales, setUsedSales] = useState([])
  const [loading, setLoading] = useState(true)

  const shopBatches = useMemo(() => selectedShopId === 'all' ? batches : batches.filter(b => b.shopId === selectedShopId), [batches, selectedShopId])
  const shopBatchIds = useMemo(() => new Set(shopBatches.map(b => b.id)), [shopBatches])
  const shopItems = useMemo(() => selectedShopId === 'all' ? items : items.filter(i => i.shopId === selectedShopId), [items, selectedShopId])
  const shopProductsList = useMemo(() => selectedShopId === 'all' ? products : products.filter(p => shopBatches.some(b => b.productId === p.id)), [products, shopBatches, selectedShopId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [p, i, u, us] = await Promise.all([getProducts(), getItems(), getUsedStock(), getUsedSales()])
      setProducts(p)
      setItems(i)
      setUsedStock(u)
      setUsedSales(us)
      const b = await getIncomeBatches(selectedShopId)
      setBatches(b)
    } finally { setLoading(false) }
  }

  const refreshData = async () => {
    try {
      const [p, i, u, us] = await Promise.all([getProducts(), getItems(), getUsedStock(), getUsedSales()])
      setProducts(p)
      setItems(i)
      setUsedStock(u)
      setUsedSales(us)
      const b = await getIncomeBatches(selectedShopId)
      setBatches(b)
    } catch {}
  }

  // version o'zgarganda (boshqa sahifadan ma'lumot yangilanganda) qayta yuklash
  useEffect(() => { loadData() }, [version, selectedShopId])

  const handleBarcodeRefresh = () => {
    refreshData()
    bump()
  }

  const firstLoad = loading && products.length === 0
  const SECTIONS = [
    { id: 'products', icon: Package, tone: 'violet', render: () => <ProductsSection products={products} batches={shopBatches} items={items} refresh={refreshData} /> },
    { id: 'income', icon: PackagePlus, tone: 'cyan', render: () => <IncomeTab products={shopProductsList} batches={shopBatches} userRole={user?.role} onSuccess={() => { refreshData(); bump() }} productCategories={productCategories} selectedShopId={selectedShopId} shopBatchIds={shopBatchIds} /> },
    { id: 'barcode', icon: Barcode, tone: 'blue', render: () => <BarcodeTab products={shopProductsList} batches={shopBatches} items={shopItems} userRole={user?.role} userId={user?.id} userName={user?.name} downloadEnabled={downloadEnabled} notificationSettings={notificationSettings} addNotification={addNotification} onRefresh={handleBarcodeRefresh} /> },
    { id: 'used_stock', icon: Recycle, tone: 'green', render: () => <UsedStockTab usedStock={selectedShopId === 'all' ? usedStock : usedStock.filter(u => !u.shopId || u.shopId === selectedShopId)} usedSales={usedSales} productCategories={productCategories} /> },
    { id: 'stocktake', icon: ClipboardCheck, tone: 'orange', render: () => <StocktakeTab /> },
    { id: 'writeoff', icon: Trash2, tone: 'red', render: () => <WriteoffTab products={shopProductsList} items={shopItems} batches={shopBatches} /> },
  ].filter(x => WH_TABS.includes(x.id)).map(x => ({ ...x, label: t('wh_tab_' + x.id) }))
  const hasStock = WH_TABS.includes('stock')

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-5">
      <PageHeader title={t('warehouse')} subtitle={t('wh_subtitle')} />

      {SECTIONS.length > 0 && <SectionHub variant={hasStock ? 'bar' : 'tiles'} sections={SECTIONS} />}

      {firstLoad ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent-red border-t-transparent rounded-full animate-spin" />
        </div>
      ) : hasStock && (
        <StockTab products={products} batches={shopBatches} items={items} userRole={user?.role} productCategories={productCategories} />
      )}
    </motion.div>
  )
}

export default Warehouse
