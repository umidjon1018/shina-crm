import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Package, Landmark, AlertCircle, TrendingUp, ArrowLeftRight, Scale, Tags } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import ShopExpensesTab     from './tabs/ShopExpensesTab'
import IncomesTab          from './tabs/IncomesTab'
import CashflowTab         from './tabs/CashflowTab'
import PnlTab              from './tabs/PnlTab'
import SupplierPaymentsTab from './tabs/SupplierPaymentsTab'
import CapitalTabWithHeader from './tabs/CapitalTab'
import CategoriesTab       from './tabs/CategoriesTab'

const Expenses = () => {
  const { t } = useTranslation()
  const { user, hasPermission } = useAuthStore()

  const TABS = [
    { id: 'shop',       perm: 'expenses.shop',       label: t('exp_tab_shop'),      icon: Wallet },
    { id: 'income',     perm: 'expenses.income',     label: t('fin_tab_income'),    icon: TrendingUp },
    { id: 'cashflow',   perm: 'expenses.cashflow',   label: t('fin_tab_cashflow'),  icon: ArrowLeftRight },
    { id: 'pnl',        perm: 'expenses.pnl',        label: t('fin_tab_pnl'),       icon: Scale },
    { id: 'supplier',   perm: 'expenses.supplier',   label: t('exp_tab_supplier'),  icon: Package },
    { id: 'capital',    perm: 'expenses.capital',    label: t('exp_tab_capital'),   icon: Landmark },
    { id: 'categories', perm: 'expenses.categories', label: t('fin_tab_categories'), icon: Tags },
  ].filter(tab => hasPermission(tab.perm))

  const [picked, setPicked] = useState(TABS[0]?.id)
  const activeTab = TABS.some(tab => tab.id === picked) ? picked : TABS[0]?.id

  if (!TABS.length) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-accent-red/10 flex items-center justify-center">
          <AlertCircle size={28} className="text-accent-red" />
        </div>
        <div className="text-center">
          <h2 className="font-syne font-bold text-xl text-text-primary">{t('exp_no_permission')}</h2>
          <p className="text-text-secondary text-sm mt-1">{t('exp_no_permission_desc')}</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-syne font-extrabold tracking-tight text-text-primary">{t('fin_page_title')}</h1>
          <p className="text-text-secondary text-sm mt-0.5">{t('exp_page_subtitle')}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-bg-secondary border border-border rounded-2xl p-1 overflow-x-auto no-scrollbar">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setPicked(tab.id)} title={tab.label}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-1 justify-center shrink-0 whitespace-nowrap
                ${activeTab === tab.id ? 'bg-accent-red text-white shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'}`}>
              <Icon size={15} />
              <span className={activeTab === tab.id ? 'inline' : 'hidden lg:inline'}>{tab.label}</span>
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
          {activeTab === 'shop' && <ShopExpensesTab currentUser={user} />}
          {activeTab === 'income' && <IncomesTab currentUser={user} />}
          {activeTab === 'cashflow' && <CashflowTab />}
          {activeTab === 'pnl' && <PnlTab />}
          {activeTab === 'supplier' && <SupplierPaymentsTab />}
          {activeTab === 'capital' && <CapitalTabWithHeader />}
          {activeTab === 'categories' && <CategoriesTab />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

export default Expenses
