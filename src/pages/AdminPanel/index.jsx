import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { TABS } from './apHelpers.jsx'
import EmployeesTab from './tabs/EmployeesTab'
import DevicesTab from './tabs/DevicesTab'
import AuditTab from './tabs/AuditTab'
import SettingsTab from './tabs/SettingsTab'
import ShopsTab from './tabs/ShopsTab'
import AiAgentsTab from './tabs/AiAgentsTab'

export const AdminPanel = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('employees')

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-syne font-extrabold tracking-tight text-text-primary">{t('adm_title')}</h1>
        <p className="text-text-muted text-sm mt-1">{t('adm_subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex sm:flex-wrap gap-2 overflow-x-auto no-scrollbar max-w-full">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} title={t(tab.labelKey)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 ${isActive ? 'bg-accent-red text-white shadow-glow-red' : 'bg-bg-secondary border border-border text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'}`}>
              <Icon size={16}/> <span className={isActive ? '' : 'hidden sm:inline'}>{t(tab.labelKey)}</span>
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          {activeTab === 'employees'  && <EmployeesTab />}
          {activeTab === 'devices'    && <DevicesTab />}
          {activeTab === 'audit'      && <AuditTab />}
          {activeTab === 'shops'      && <ShopsTab />}
          {activeTab === 'ai_agents'  && <AiAgentsTab />}
          {activeTab === 'settings'   && <SettingsTab />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

export default AdminPanel
