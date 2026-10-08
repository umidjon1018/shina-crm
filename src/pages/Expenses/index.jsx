import { motion } from 'framer-motion'
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
import FinanceOverview     from './components/FinanceOverview'
import SectionHub          from '../../components/ui/SectionHub'
import { PageHeader }      from '../../components/ui/Kit'

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

  const RENDER = {
    shop: <ShopExpensesTab currentUser={user} />,
    income: <IncomesTab currentUser={user} />,
    cashflow: <CashflowTab />,
    pnl: <PnlTab />,
    supplier: <SupplierPaymentsTab />,
    capital: <CapitalTabWithHeader />,
    categories: <CategoriesTab />,
  }

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

  const SECTIONS = TABS.map((tab, i) => ({
    id: tab.id, label: tab.label, icon: tab.icon, desc: t('fin_desc_' + tab.id),
    tone: ['orange', 'green', 'cyan', 'violet', 'blue', 'pink', 'red'][i % 7],
    render: () => RENDER[tab.id],
  }))

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-5">
      <PageHeader title={t('fin_page_title')} subtitle={t('exp_page_subtitle')} />
      <FinanceOverview />
      <SectionHub title={t('fin_sections')} sections={SECTIONS} />
    </motion.div>
  )
}

export default Expenses
