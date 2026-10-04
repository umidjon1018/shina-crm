import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Bot, CreditCard, Globe, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import ApiTab from './tabs/ApiTab'
import BotTab from './tabs/BotTab'
import UdsTab from './tabs/UdsTab'
import PaymentsTab from './tabs/PaymentsTab'

const Integrations = () => {
  const { t } = useTranslation()
  const { hasPermission } = useAuthStore()

  const TABS = [
    { id: 'api', perm: 'integrations.api', icon: Globe },
    { id: 'bot', perm: 'integrations.bot', icon: Bot },
    { id: 'uds', perm: 'integrations.uds', icon: Star },
    { id: 'payments', perm: 'integrations.payments', icon: CreditCard },
  ].filter(tab => hasPermission(tab.perm))

  const [picked, setPicked] = useState(() => new URLSearchParams(window.location.search).get('tab') || TABS[0]?.id)
  const activeTab = TABS.some(tab => tab.id === picked) ? picked : TABS[0]?.id

  if (!TABS.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-accent-red/10 flex items-center justify-center"><AlertCircle size={28} className="text-accent-red" /></div>
        <h2 className="font-syne font-bold text-xl text-text-primary">{t('exp_no_permission')}</h2>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-syne font-extrabold tracking-tight text-text-primary">{t('int_page_title')}</h1>
        <p className="text-text-secondary text-sm mt-0.5">{t('int_page_subtitle')}</p>
      </div>

      <div className="flex items-center gap-1 bg-bg-secondary border border-border rounded-2xl p-1 overflow-x-auto no-scrollbar">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setPicked(tab.id)} title={t('int_tab_' + tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-1 justify-center shrink-0 whitespace-nowrap
                ${activeTab === tab.id ? 'bg-accent-red text-white shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'}`}>
              <Icon size={15} />
              <span className={activeTab === tab.id ? 'inline' : 'hidden sm:inline'}>{t('int_tab_' + tab.id)}</span>
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
          {activeTab === 'api' && <ApiTab />}
          {activeTab === 'bot' && <BotTab />}
          {activeTab === 'uds' && <UdsTab />}
          {activeTab === 'payments' && <PaymentsTab />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

export default Integrations
