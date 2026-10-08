import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Building, Store, Users, Monitor, SlidersHorizontal, Bell, Bot, Plug, ClipboardList, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import CompanyTab from './tabs/CompanyTab'
import ShopsTab from './tabs/ShopsTab'
import EmployeesTab from './tabs/EmployeesTab'
import DevicesTab from './tabs/DevicesTab'
import AuditTab from './tabs/AuditTab'
import AiAgentsTab from './tabs/AiAgentsTab'
import AiKeyCard from './components/AiKeyCard'
import SalesRulesSection from './sales/SalesRulesSection'
import SalesRulesModals from './sales/SalesRulesModals'
import DiscountLevels from './sales/DiscountLevels'
import useSalesRulesCtx from './sales/useSalesRulesCtx'
import IntegrationsSection from './integrations/IntegrationsSection'
import SectionHub from '../../components/ui/SectionHub'
import { PageHeader } from '../../components/ui/Kit'

// Yagona Sozlamalar (avval: Boshqaruv + Admin Panel + Integratsiyalar).
// admin: true — faqat admin (rol ruxsati bilan berilmaydi); perm — rol ruxsati daraxtidagi tugun.
export const SETTINGS_SECTIONS = [
  { id: 'company', icon: Building, admin: true },
  { id: 'shops', icon: Store, admin: true },
  { id: 'employees', icon: Users, perm: 'settings.employees' },
  { id: 'devices', icon: Monitor, perm: 'settings.devices' },
  { id: 'sales_rules', icon: SlidersHorizontal, perm: 'settings.sales_rules' },
  { id: 'notifications', icon: Bell, perm: 'settings.notifications' },
  { id: 'ai', icon: Bot, admin: true },
  { id: 'integrations', icon: Plug, admin: true },
  { id: 'audit', icon: ClipboardList, admin: true },
]

export const visibleSettingsSections = (user, hasPermission) =>
  SETTINGS_SECTIONS.filter(s => (user?.role === 'admin') || (!s.admin && hasPermission(s.perm)))

const SalesRules = ({ notificationsOnly = false }) => {
  const ctx = useSalesRulesCtx({ withSales: !notificationsOnly })
  return (
    <div className="space-y-4 sm:space-y-6">
      {!notificationsOnly && <div className="max-w-2xl"><DiscountLevels ctx={ctx} /></div>}
      <SalesRulesSection ctx={ctx} show={notificationsOnly
        ? { usd: false, targets: false, sources: false, orgs: false }
        : { notifications: false }} />
      <SalesRulesModals ctx={ctx} />
    </div>
  )
}

const Settings = () => {
  const { t } = useTranslation()
  const { user, hasPermission } = useAuthStore()
  const sections = visibleSettingsSections(user, hasPermission)

  if (!sections.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-accent-red/10 flex items-center justify-center"><AlertCircle size={28} className="text-accent-red" /></div>
        <h2 className="font-bold text-xl text-text-primary">{t('exp_no_permission')}</h2>
      </div>
    )
  }

  const RENDER = {
    company: <CompanyTab />,
    shops: <ShopsTab />,
    employees: <EmployeesTab />,
    devices: <DevicesTab />,
    sales_rules: <SalesRules />,
    notifications: <SalesRules notificationsOnly />,
    ai: <div className="space-y-4 sm:space-y-6"><div className="max-w-2xl"><AiKeyCard /></div><AiAgentsTab /></div>,
    integrations: <IntegrationsSection />,
    audit: <AuditTab />,
  }
  const GROUP = { company: 'business', shops: 'business', employees: 'business', devices: 'business', sales_rules: 'sales', notifications: 'sales', ai: 'system', integrations: 'system', audit: 'system' }
  const TONE = { company: 'violet', shops: 'blue', employees: 'cyan', devices: 'pink', sales_rules: 'orange', notifications: 'green', ai: 'violet', integrations: 'cyan', audit: 'red' }
  const SECTIONS = sections.map(sec => ({
    id: sec.id, icon: sec.icon, tone: TONE[sec.id], label: t('set_sec_' + sec.id), desc: t('set_desc_' + sec.id),
    group: t('set_group_' + GROUP[sec.id]), render: () => RENDER[sec.id],
  }))

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-5">
      <PageHeader title={t('set_page_title')} subtitle={t('set_page_subtitle')} />
      <SectionHub sections={SECTIONS} />
    </motion.div>
  )
}

export default Settings
