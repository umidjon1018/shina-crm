import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, TrendingUp, Package, Megaphone, Users, UserCheck, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TAB_COLORS, TAB_AGENT_KEYS, TAB_DESC_KEYS } from './aiHelpers'
import { getAiAgents } from '../../api/aiAgentsService'
import { getSales } from '../../api/salesService'
import { getCustomers } from '../../api/customerService'
import OverviewTab from './tabs/OverviewTab'
import InstagramTab from './tabs/InstagramTab'
import SectionView from './components/SectionView'
import MarketingRoadmap from './components/MarketingRoadmap'

// Bo'lim tablari: KPI (SQL) + kundalik AI xulosa + AI yordamchi chati
const SECTION_TABS = {
  sales:     { color: 'accent-green',  questions: ['aisec_q_sales_1', 'aisec_q_sales_2', 'aisec_q_sales_3'] },
  inventory: { color: 'accent-red',    questions: ['aisec_q_inventory_1', 'aisec_q_inventory_2', 'aisec_q_inventory_3'] },
  customers: { color: 'accent-blue',   questions: ['aisec_q_customers_1', 'aisec_q_customers_2', 'aisec_q_customers_3'] },
  marketing: { color: 'accent-orange', questions: ['aisec_q_marketing_1', 'aisec_q_marketing_2', 'aisec_q_marketing_3'] },
  staff:     { color: 'accent-purple', questions: ['aisec_q_staff_1', 'aisec_q_staff_2', 'aisec_q_staff_3'] },
}

export const AIAgent = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('overview')
  const [agentConfigs, setAgentConfigs] = useState({})
  // Instagram tabi uchun ma'lumot — faqat shu tab ochilganda yuklanadi
  const [igData, setIgData] = useState(null)

  useEffect(() => {
    getAiAgents()
      .then(list => {
        const map = {}
        list.forEach(a => { map[a.slug] = a })
        setAgentConfigs(map)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (activeTab !== 'instagram' || igData) return
    Promise.all([getSales(), getCustomers()])
      .then(([sales, customers]) => setIgData({ sales, customers }))
      .catch((err) => console.error('[AIAgent] Instagram data xatosi:', err))
  }, [activeTab, igData])

  const TABS = [
    { id: 'overview',  label: t('ai_tab_overview'),  Icon: Activity },
    { id: 'sales',     label: t('aisec_head_sales'),     Icon: TrendingUp },
    { id: 'inventory', label: t('aisec_head_inventory'), Icon: Package },
    { id: 'customers', label: t('aisec_head_customers'), Icon: Users },
    { id: 'marketing', label: t('aisec_head_marketing'), Icon: Megaphone },
    { id: 'staff',     label: t('aisec_head_staff'),     Icon: UserCheck },
    { id: 'instagram', label: t('ai_tab_instagram'), Icon: Globe },
  ].map(x => ({ ...x, color: TAB_COLORS[x.id] }))

  const tab = TABS.find(tb => tb.id === activeTab)
  const sec = SECTION_TABS[activeTab]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col"
    >
      <div className="flex items-center gap-1 px-4 py-3 border-b border-border flex-shrink-0 overflow-x-auto no-scrollbar">
        {TABS.map(({ id, label, Icon, color }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            title={label}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${
              activeTab === id
                ? `${color.bg} ${color.text} ${color.border} border`
                : 'text-text-muted hover:text-text-primary hover:bg-bg-secondary'
            }`}
          >
            <Icon size={14} />
            <span className={activeTab === id ? '' : 'hidden sm:inline'}>{label}</span>
          </button>
        ))}
      </div>

      <div className={`px-4 sm:px-6 py-3 border-b border-border flex-shrink-0 ${tab.color.bg}`}>
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

      <div className="p-4 sm:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'overview' && <OverviewTab onTabChange={setActiveTab} />}
            {sec && (
              <SectionView
                section={activeTab}
                colorClass={sec.color}
                questions={sec.questions.map(k => t(k))}
                extra={activeTab === 'marketing' ? (data) => <MarketingRoadmap recommendations={data.digest?.recommendations || []} /> : null}
              />
            )}
            {activeTab === 'instagram' && (
              <InstagramTab aiData={igData || { sales: [], customers: [] }} agentConfig={agentConfigs['instagram-agent']} customerAgentConfig={agentConfigs['customer-agent']} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default AIAgent
