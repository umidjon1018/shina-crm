import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, BarChart3, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import SectionHub from '../../components/ui/SectionHub'
import { PageHeader } from '../../components/ui/Kit'
import { getAiAgents } from '../../api/aiAgentsService'
import DailyTab from './tabs/DailyTab'
import AssistantTab from './tabs/AssistantTab'
import StatsTab from './tabs/StatsTab'
import InstagramTab from './tabs/InstagramTab'

// Asosiy ko'rinish — Kunlik tahlil; AI yordamchi (chat), Statistika va Instagram — modalda
export const AIAgent = () => {
  const { t } = useTranslation()
  const [igAgent, setIgAgent] = useState(null)

  useEffect(() => {
    getAiAgents()
      .then(list => setIgAgent(list.find(a => a.slug === 'instagram-agent') || null))
      .catch(() => {})
  }, [])

  const SECTIONS = [
    { id: 'assistant', icon: MessageSquare, tone: 'violet', render: () => <AssistantTab /> },
    { id: 'stats', icon: BarChart3, tone: 'cyan', render: () => <StatsTab /> },
    { id: 'instagram', icon: Globe, tone: 'pink', render: () => <InstagramTab agentConfig={igAgent} /> },
  ].map(x => ({ ...x, label: t(`aitab_${x.id}`), desc: t(`aitab_${x.id}_desc`) }))

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-5">
      <PageHeader title={t('ai_agent')} subtitle={t('aitab_daily_desc')} />
      <SectionHub variant="bar" sections={SECTIONS} />
      <DailyTab />
    </motion.div>
  )
}

export default AIAgent
