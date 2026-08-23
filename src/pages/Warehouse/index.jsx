import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useNotificationStore } from '../../store/notificationStore'
import { useDataStore } from '../../store/dataStore'
import { useShopStore } from '../../store/shopStore'
import { getUsedStock, getUsedSales } from '../../api/usedService'
import { getIncomeBatches } from '../../api/incomeService'
import { getProducts } from '../../api/productService'
import { getItems } from '../../api/itemService'
import { TABS, TabBtn } from './whHelpers.jsx'
import StockTab from './tabs/StockTab'
import UsedStockTab from './tabs/UsedStockTab'
import IncomeTab from './tabs/IncomeTab'
import BarcodeTab from './tabs/BarcodeTab'
import StocktakeTab from './tabs/StocktakeTab'

const Warehouse = () => {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { productCategories, downloadEnabled, notificationSettings } = useSettingsStore()
  const { addNotification } = useNotificationStore()
  const { version, bump } = useDataStore()
  const { selectedShopId } = useShopStore()
  const [activeTab, setActiveTab] = useState('stock')
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

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-syne font-extrabold tracking-tight text-text-primary">{t('warehouse')}</h1>
        <p className="text-text-secondary text-sm">{t('wh_subtitle')}</p>
      </div>

      <div className="flex gap-2 bg-bg-secondary border border-border rounded-2xl p-1.5 w-fit">
        {TABS.map(tab => (
          <TabBtn key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>
            {t('wh_tab_' + tab)}
          </TabBtn>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent-red border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'stock' && <StockTab products={products} batches={shopBatches} items={items} userRole={user?.role} productCategories={productCategories} />}
            {activeTab === 'used_stock' && <UsedStockTab usedStock={selectedShopId === 'all' ? usedStock : usedStock.filter(u => !u.shopId || u.shopId === selectedShopId)} usedSales={usedSales} productCategories={productCategories} />}
            {activeTab === 'income' && <IncomeTab products={shopProductsList} batches={shopBatches} userRole={user?.role} onSuccess={() => { refreshData(); bump() }} productCategories={productCategories} selectedShopId={selectedShopId} shopBatchIds={shopBatchIds} />}
            {activeTab === 'barcode' && <BarcodeTab products={shopProductsList} batches={shopBatches} items={shopItems} userRole={user?.role} userId={user?.id} userName={user?.name} downloadEnabled={downloadEnabled} notificationSettings={notificationSettings} addNotification={addNotification} onRefresh={handleBarcodeRefresh} />}
            {activeTab === 'stocktake' && <StocktakeTab />}
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  )
}

export default Warehouse
