import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, MessageSquare, BarChart3, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TAB_COLORS } from './aiHelpers'
import { getAiAgents } from '../../api/aiAgentsService'
import DailyTab from './tabs/DailyTab'
import AssistantTab from './tabs/AssistantTab'
import StatsTab from './tabs/StatsTab'
import InstagramTab from './tabs/InstagramTab'

// Tablar vazifa bo'yicha: Kunlik tahlil (kundalik tahlilchi), AI yordamchi (chat), Statistika (SQL), Instagram
const TABS = [
  { id: 'daily',     Icon: Sparkles },
  { id: 'assistant', Icon: MessageSquare },
  { id: 'stats',     Icon: BarChart3 },
  { id: 'instagram', Icon: Globe },
]

export const AIAgent = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('daily')
  const [igAgent, setIgAgent] = useState(null)

  useEffect(() => {
    getAiAgents()
      .then(list => setIgAgent(list.find(a => a.slug === 'instagram-agent') || null))
      .catch(() => {})
  }, [])

  const tab = TABS.find(x => x.id === activeTab)
  const color = TAB_COLORS[activeTab]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col"
    >
      <div className="flex items-center gap-1 px-4 py-3 border-b border-border flex-shrink-0 overflow-x-auto no-scrollbar">
        {TABS.map(({ id, Icon }) => {
          const c = TAB_COLORS[id]
          const label = t(`aitab_${id}`)
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              title={label}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${
                activeTab === id
                  ? `${c.bg} ${c.text} ${c.border} border`
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-secondary'
              }`}
            >
              <Icon size={14} />
              <span className={activeTab === id ? '' : 'hidden sm:inline'}>{label}</span>
            </button>
          )
        })}
      </div>

      <div className={`px-4 sm:px-6 py-3 border-b border-border flex-shrink-0 ${color.bg}`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${color.bg} border ${color.border} flex items-center justify-center`}>
            <tab.Icon size={15} className={color.text} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{t(`aitab_${activeTab}`)}</p>
            <p className="text-xs text-text-muted">{t(`aitab_${activeTab}_desc`)}</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'daily' && <DailyTab />}
            {activeTab === 'assistant' && <AssistantTab />}
            {activeTab === 'stats' && <StatsTab />}
            {activeTab === 'instagram' && <InstagramTab agentConfig={igAgent} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default AIAgent
