import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { AlertCircle, Factory, PackageOpen, Boxes, BookOpen, Package, BarChart3 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useShopStore } from '../../store/shopStore'
import SectionHub from '../../components/ui/SectionHub'
import PeriodFilter from '../../components/ui/PeriodFilter'
import { PageHeader } from '../../components/ui/Kit'
import { presetRange } from '../../utils/period'
import { PrContext } from './components/prHelpers'
import ProductionOverview from './components/ProductionOverview'
import OrderFormModal from './components/OrderFormModal'
import OrderDetailModal from './components/OrderDetailModal'
import ReceiveModal from './components/ReceiveModal'
import MaterialModal from './components/MaterialModal'
import OrdersTab from './tabs/OrdersTab'
import MaterialsTab from './tabs/MaterialsTab'
import RecipesTab from './tabs/RecipesTab'
import ProductsTab from './tabs/ProductsTab'
import ReportTab from './tabs/ReportTab'

// Ishlab chiqarish: xomashyo → retsept → buyurtma → tayyor mahsulot (tannarx bilan)
const Production = () => {
  const { t } = useTranslation()
  const { hasPermission } = useAuthStore()
  const { shops, selectedShopId } = useShopStore()
  const [preset, setPreset] = useState('month')
  const [range, setRange] = useState(() => presetRange('month'))
  const [section, setSection] = useState(() => new URLSearchParams(window.location.search).get('section'))
  const [orderForm, setOrderForm] = useState(null)
  const [orderId, setOrderId] = useState(null)
  const [receive, setReceive] = useState(null)
  const [material, setMaterial] = useState(null)

  // Sidebar'da sex tanlangan bo'lsa — shu sex, aks holda hammasi
  const shopId = shops.some(s => s.id === selectedShopId && s.kind === 'production') ? selectedShopId : 'all'
  const hasSex = shops.some(s => s.kind === 'production' && s.isActive)

  const ctx = useMemo(() => ({
    // Har ochilishda qayta yaratiladi — boshqa oyna ustida ochilsa ham eng yuqorida turadi
    openOrder: (id) => setOrderId({ id, n: Date.now() }),
    openMaterial: (id) => setMaterial({ id, n: Date.now() }),
    newOrder: (recipeId) => setOrderForm({ recipeId: recipeId || null }),
    receive: (productId) => setReceive({ productId: productId || null }),
  }), [])

  const SECTIONS = [
    { id: 'materials', icon: Boxes, tone: 'cyan', render: () => <MaterialsTab shopId={shopId} /> },
    { id: 'recipes', icon: BookOpen, tone: 'violet', render: () => <RecipesTab /> },
    { id: 'products', icon: Package, tone: 'green', render: () => <ProductsTab /> },
    { id: 'report', icon: BarChart3, tone: 'orange', render: () => <ReportTab shopId={shopId} /> },
  ].map(s => ({ ...s, label: t('pr_sec_' + s.id) }))

  if (!hasPermission('production')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-accent-red/10 flex items-center justify-center"><AlertCircle size={28} className="text-accent-red" /></div>
        <h2 className="font-syne font-bold text-xl text-text-primary">{t('exp_no_permission')}</h2>
      </div>
    )
  }

  return (
    <PrContext.Provider value={ctx}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-5">
        <PageHeader title={t('pr_page_title')} subtitle={t('pr_page_subtitle')}
          actions={<>
            {hasPermission('production.orders') && <button onClick={() => ctx.newOrder()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl g-brand text-white font-bold shadow-md"><Factory size={18} />{t('pr_new_order')}</button>}
            {hasPermission('production.materials') && <button onClick={() => ctx.receive()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl panel font-bold text-text-primary hover:border-border-bright"><PackageOpen size={18} />{t('pr_receive')}</button>}
          </>} />

        {!hasSex && (
          <div className="panel p-4 flex items-start gap-3 border-accent-orange/40">
            <Factory size={22} className="text-accent-orange shrink-0 mt-0.5" />
            <div>
              <p className="text-[15px] font-semibold text-text-primary">{t('pr_no_sex')}</p>
              <p className="text-sm text-text-muted">{t('pr_no_sex_hint')}</p>
            </div>
          </div>
        )}

        <SectionHub variant="bar" sections={SECTIONS} openId={section} onOpenChange={setSection} />
        <div className="flex justify-end">
          <PeriodFilter preset={preset} range={range} onChange={(p, r) => { setPreset(p); setRange(r) }} />
        </div>
        <ProductionOverview range={range} shopId={shopId} onOpen={setSection} />
        <div className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-text-primary">{t('pr_orders_title')}</h2>
          <OrdersTab range={range} shopId={shopId} />
        </div>
      </motion.div>

      <OrderFormModal open={!!orderForm} recipeId={orderForm?.recipeId} onClose={() => setOrderForm(null)}
        onSaved={(res) => { setOrderForm(null); ctx.openOrder(res.id) }} />
      <ReceiveModal open={!!receive} productId={receive?.productId} shopId={shopId} onClose={() => setReceive(null)} />
      {material && <MaterialModal key={material.n} productId={material.id} shopId={shopId} onClose={() => setMaterial(null)} />}
      {orderId && <OrderDetailModal key={orderId.n} orderId={orderId.id} onClose={() => setOrderId(null)} />}
    </PrContext.Provider>
  )
}

export default Production
