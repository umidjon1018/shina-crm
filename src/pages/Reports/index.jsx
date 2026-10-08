import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { TrendingUp, Package, Users, Wallet, ShoppingCart, Truck, UserCheck, Recycle, Boxes, ArrowLeftRight, Store, PieChart as PieIcon } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import ReportsOverview from './components/ReportsOverview'
import TelegramStatsButton from './components/TelegramStatsButton'
import ProductsReportTab from './tabs/ProductsReportTab'
import MovementTab from './tabs/MovementTab'
import SupplyTab from './tabs/SupplyTab'
import ShopsReportTab from './tabs/ShopsReportTab'
import SegmentsTab from './tabs/SegmentsTab'
import SalesOverview from './overview/SalesOverview'
import StockOverview from './overview/StockOverview'
import UsedOverview from './overview/UsedOverview'
import CustomersOverview from './overview/CustomersOverview'
import StaffOverview from './overview/StaffOverview'
import ProfitOverview from './overview/ProfitOverview'
import FinanceOverview from './overview/FinanceOverview'
import SectionHub from '../../components/ui/SectionHub'
import { PageHeader } from '../../components/ui/Kit'

// Hisobotlar: har bo'lim server hisoblaydigan alohida hisobot (oyna ichida), tepada savdo kanallari
const VIEW = {
  sales: SalesOverview, products: ProductsReportTab, profit: ProfitOverview, stock: StockOverview, movement: MovementTab,
  supply: SupplyTab, used: UsedOverview, customers: CustomersOverview, segments: SegmentsTab, employees: StaffOverview,
  shops: ShopsReportTab, finance: FinanceOverview,
}
const GROUP = { sales: 'sales', products: 'sales', profit: 'sales', stock: 'stock', movement: 'stock', supply: 'stock', used: 'stock',
  customers: 'customers', segments: 'customers', employees: 'team', shops: 'team', finance: 'team' }
const TONE = { sales: 'cyan', products: 'violet', profit: 'green', stock: 'blue', movement: 'orange', supply: 'pink', used: 'green',
  customers: 'pink', segments: 'violet', employees: 'cyan', shops: 'blue', finance: 'orange' }

const Reports = () => {
  const { t } = useTranslation()
  const { hasPermission } = useAuthStore()
  const [section, setSection] = useState(() => new URLSearchParams(window.location.search).get('section'))

  const tabs = [
    { id: 'sales',     label: t('rep_tab_sales'),     icon: ShoppingCart,   perm: 'reports.sales' },
    { id: 'products',  label: t('rpt_tab_products'),  icon: Boxes,          perm: 'reports.products' },
    { id: 'profit',    label: t('rep_tab_profit'),    icon: TrendingUp,     perm: 'reports.profit' },
    { id: 'stock',     label: t('rep_tab_stock'),     icon: Package,        perm: 'reports.stock' },
    { id: 'movement',  label: t('rpt_tab_movement'),  icon: ArrowLeftRight, perm: 'reports.movement' },
    { id: 'supply',    label: t('rpt_tab_supply'),    icon: Truck,          perm: 'reports.supply' },
    { id: 'used',      label: t('rep_tab_used'),      icon: Recycle,        perm: 'reports.used' },
    { id: 'customers', label: t('rep_tab_customers'), icon: UserCheck,      perm: 'reports.customers' },
    { id: 'segments',  label: t('rpt_tab_segments'),  icon: PieIcon,        perm: 'reports.customers' },
    { id: 'employees', label: t('rep_tab_employees'), icon: Users,          perm: 'reports.employees' },
    { id: 'shops',     label: t('rpt_tab_shops'),     icon: Store,          perm: 'reports.shops' },
    { id: 'finance',   label: t('rep_tab_finance'),   icon: Wallet,         perm: 'reports.finance' },
  ].filter(tab => hasPermission(tab.perm))

  const SECTIONS = tabs.map(tab => {
    const View = VIEW[tab.id]
    return {
      id: tab.id, label: tab.label, icon: tab.icon, tone: TONE[tab.id], desc: t('rep_desc_' + tab.id),
      group: t('rep_group_' + GROUP[tab.id]),
      render: () => <View />,
    }
  })

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-5">
      <PageHeader title={t('reports')} subtitle={t('rep_subtitle')} actions={<TelegramStatsButton />} />
      <SectionHub sections={SECTIONS} openId={section} onOpenChange={setSection} />
      <ReportsOverview />
    </motion.div>
  )
}

export default Reports
