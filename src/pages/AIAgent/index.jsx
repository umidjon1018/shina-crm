import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, TrendingUp, Package, Megaphone, Users, UserCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TAB_COLORS, TAB_AGENT_KEYS, TAB_DESC_KEYS } from './aiHelpers'
import { getSales } from '../../api/salesService'
import { getCustomers } from '../../api/customerService'
import { getProducts } from '../../api/productService'
import { getItems } from '../../api/itemService'
import { getIncomeBatches } from '../../api/incomeService'
import OverviewTab from './tabs/OverviewTab'
import SalesTab from './tabs/SalesTab'
import InventoryTab from './tabs/InventoryTab'
import MarketingTab from './tabs/MarketingTab'
import CustomerTab from './tabs/CustomerTab'
import StaffTab from './tabs/StaffTab'

export const AIAgent = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('overview')

  const [aiData, setAiData] = useState({ sales: [], customers: [], products: [], items: [], batches: [] })
  useEffect(() => {
    Promise.all([getSales(), getCustomers(), getProducts(), getItems(), getIncomeBatches()])
      .then(([sales, customers, products, items, batches]) => {
        setAiData({ sales, customers, products, items, batches })
      }).catch((err) => console.error('[AIAgent] data load xatosi:', err))
  }, [])

  const TABS = [
    { id: 'overview',  label: t('ai_tab_overview'), Icon: Activity,   color: TAB_COLORS.overview },
    { id: 'sales',     label: t('ai_tab_sales'),    Icon: TrendingUp, color: TAB_COLORS.sales },
    { id: 'inventory', label: t('warehouse'),        Icon: Package,    color: TAB_COLORS.inventory },
    { id: 'marketing', label: t('ai_tab_marketing'),Icon: Megaphone,  color: TAB_COLORS.marketing },
    { id: 'customer',  label: t('ai_tab_customer'), Icon: Users,      color: TAB_COLORS.customer },
    { id: 'staff',     label: t('ai_tab_staff'),    Icon: UserCheck,  color: TAB_COLORS.staff },
  ]

  const tab = TABS.find(tb => tb.id === activeTab)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col"
    >
      <div className="flex items-center gap-1 px-4 py-3 border-b border-border flex-shrink-0 overflow-x-auto">
        {TABS.map(({ id, label, Icon, color }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${
              activeTab === id
                ? `${color.bg} ${color.text} ${color.border} border`
                : 'text-text-muted hover:text-text-primary hover:bg-bg-secondary'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className={`px-6 py-3 border-b border-border flex-shrink-0 ${tab.color.bg}`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${tab.color.bg} border ${tab.color.border} flex items-center justify-center`}>
            <tab.Icon size={15} className={tab.color.text} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{t(TAB_AGENT_KEYS[activeTab])}</p>
            <p className="text-xs text-text-muted">{t(TAB_DESC_KEYS[activeTab])}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'overview'  && <OverviewTab onTabChange={setActiveTab} aiData={aiData} />}
            {activeTab === 'sales'     && <SalesTab aiData={aiData} />}
            {activeTab === 'inventory' && <InventoryTab aiData={aiData} />}
            {activeTab === 'marketing' && <MarketingTab aiData={aiData} />}
            {activeTab === 'customer'  && <CustomerTab aiData={aiData} />}
            {activeTab === 'staff'     && <StaffTab aiData={aiData} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default AIAgent
