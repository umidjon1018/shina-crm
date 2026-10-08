import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Bot, Star, CreditCard } from 'lucide-react'
import ApiTab from './ApiTab'
import BotTab from './BotTab'
import UdsTab from './UdsTab'
import PaymentsTab from './PaymentsTab'

// Sozlamalar → Integratsiyalar (avval alohida sahifa): internet-do'kon API, Telegram botda qoldiq, UDS, to'lov tizimlari
const SUB = [
  { id: 'api', icon: Globe },
  { id: 'bot', icon: Bot },
  { id: 'uds', icon: Star },
  { id: 'payments', icon: CreditCard },
]

const IntegrationsSection = () => {
  const { t } = useTranslation()
  const [tab, setTab] = useState('api')
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 bg-bg-secondary border border-border rounded-2xl p-1 overflow-x-auto no-scrollbar w-fit max-w-full">
        {SUB.map(s => {
          const Icon = s.icon
          return (
            <button key={s.id} onClick={() => setTab(s.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold shrink-0 whitespace-nowrap transition-all
                ${tab === s.id ? 'bg-accent-red text-white' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'}`}>
              <Icon size={15} /> {t('int_tab_' + s.id)}
            </button>
          )
        })}
      </div>
      {tab === 'api' && <ApiTab />}
      {tab === 'bot' && <BotTab />}
      {tab === 'uds' && <UdsTab />}
      {tab === 'payments' && <PaymentsTab />}
    </div>
  )
}

export default IntegrationsSection
