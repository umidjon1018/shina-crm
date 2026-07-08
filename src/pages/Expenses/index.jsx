import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Package, Landmark, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { isPrivileged } from './components/expHelpers'
import ShopExpensesTab     from './tabs/ShopExpensesTab'
import SupplierPaymentsTab from './tabs/SupplierPaymentsTab'
import CapitalTabWithHeader from './tabs/CapitalTab'

const Expenses = () => {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('shop')

  // Ruxsat tekshiruvi
  if (!isPrivileged(user?.role)) {
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

  const TABS = [
    { id: 'shop',     label: t('exp_tab_shop'), icon: Wallet },
    { id: 'supplier', label: t('exp_tab_supplier'), icon: Package },
    { id: 'capital',  label: t('exp_tab_capital'), icon: Landmark },
  ]

  // Header da qaysi tugma ko'rsatilsin
  const showAddExpense = activeTab === 'shop'
  const showAddCapital = activeTab === 'capital'

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-syne font-extrabold tracking-tight text-text-primary">{t('expenses')}</h1>
          <p className="text-text-secondary text-sm mt-0.5">{t('exp_page_subtitle')}</p>
        </div>
        {/* Tugmalar tab ga qarab ko'rsatiladi, lekin state tab ichida bo'lgani uchun
            bu tugmalar dekorativ — asl funksiya tab ichida. Shuning uchun bu yerda
            faqat ko'rinish uchun disabled holda qoldiramiz, tab ichida real tugmalar bor */}
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 bg-bg-secondary border border-border rounded-2xl p-1">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-1 justify-center
                ${activeTab === tab.id ? 'bg-accent-red text-white shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'}`}>
              <Icon size={15} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
          {activeTab === 'shop' && (
            <div>
              {/* Tab ichida header: qo'shish tugmasi */}
              <ShopExpensesTab currentUser={user} />
            </div>
          )}
          {activeTab === 'supplier' && <SupplierPaymentsTab />}
          {activeTab === 'capital' && (
            <div>
              <CapitalTabWithHeader />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}



export default Expenses
