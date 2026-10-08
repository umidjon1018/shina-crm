import { useState } from 'react'
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
  const [picked, setPicked] = useState(() => new URLSearchParams(window.location.search).get('section'))
  const active = sections.some(s => s.id === picked) ? picked : sections[0]?.id

  if (!sections.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-accent-red/10 flex items-center justify-center"><AlertCircle size={28} className="text-accent-red" /></div>
        <h2 className="font-syne font-bold text-xl text-text-primary">{t('exp_no_permission')}</h2>
      </div>
    )
  }

  const choose = (id) => {
    setPicked(id)
    const url = new URL(window.location.href)
    url.searchParams.set('section', id)
    window.history.replaceState(window.history.state, '', url)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-syne font-extrabold tracking-tight text-text-primary">{t('set_page_title')}</h1>
        <p className="text-text-secondary text-sm mt-0.5">{t('set_page_subtitle')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Bo'limlar: kompyuterda chapda ro'yxat, telefonda gorizontal */}
        <nav className="lg:w-56 shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar bg-bg-secondary border border-border rounded-2xl p-1.5">
            {sections.map(s => {
              const Icon = s.icon
              const on = s.id === active
              return (
                <button key={s.id} onClick={() => choose(s.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-all text-left
                    ${on ? 'bg-accent-red text-white shadow-glow-red' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'}`}>
                  <Icon size={17} className="shrink-0" />
                  <span>{t('set_sec_' + s.id)}</span>
                </button>
              )
            })}
          </div>
        </nav>

        <div className="flex-1 min-w-0">
          {active === 'company' && <CompanyTab />}
          {active === 'shops' && <ShopsTab />}
          {active === 'employees' && <EmployeesTab />}
          {active === 'devices' && <DevicesTab />}
          {active === 'sales_rules' && <SalesRules />}
          {active === 'notifications' && <SalesRules notificationsOnly />}
          {active === 'ai' && <div className="space-y-4 sm:space-y-6"><div className="max-w-2xl"><AiKeyCard /></div><AiAgentsTab /></div>}
          {active === 'integrations' && <IntegrationsSection />}
          {active === 'audit' && <AuditTab />}
        </div>
      </div>
    </motion.div>
  )
}

export default Settings
