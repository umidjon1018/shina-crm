import { useState, useEffect } from 'react'
import { MessageCircle, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getAiAgents, updateAiAgent } from '../../../api/aiAgentsService'
import { AssistantCard, AnalystCard, ScheduleCard } from '../components/AiAnalysisAgents'
import CustomerBotCard from '../components/CustomerBotCard'

// 3 ta AI: AI yordamchi + Kundalik tahlilchi (tahlil) va Mijozlar boti (Instagram/Telegram'da mijozlarga javob).
// Har birining asosiy qoidalari kodda; bu yerda egasining ko'rsatmalari, bilimlar bazasi, model va kanallar
export default function AiAgentsTab() {
  const { t } = useTranslation()
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    getAiAgents()
      .then(a => setAgents(a))
      .catch(e => setError(e?.response?.data?.error || e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (id, payload) => {
    setSaveError(null)
    try {
      const updated = await updateAiAgent(id, payload)
      setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a))
    } catch (e) {
      setSaveError(e?.response?.data?.error || e.message || t('aiadm_save_error'))
      throw e
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="p-4 sm:p-6 text-center">
      <p className="text-sm text-accent-red mb-1">{t('aiadm_load_error')}</p>
      <p className="text-xs text-text-muted">{error}</p>
    </div>
  )

  const assistant = agents.find(a => a.kind === 'assistant')
  const analyst = agents.find(a => a.kind === 'analyst')
  const customerBot = agents.find(a => a.kind === 'customer_bot')

  return (
    <div className="space-y-5 max-w-3xl">
      {saveError && (
        <div className="p-3 bg-accent-red/10 border border-accent-red/30 rounded-xl text-sm text-accent-red">{saveError}</div>
      )}

      <div className="space-y-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-accent-blue" />
            <h2 className="text-sm font-semibold text-text-primary">{t('aiadm_group_analysis')}</h2>
          </div>
          <p className="text-xs text-text-muted mt-1">{t('aiadm_group_analysis_hint')}</p>
        </div>
        <ScheduleCard />
        {assistant && <AssistantCard key={assistant.id} agent={assistant} onSave={handleSave} />}
        {analyst && <AnalystCard key={analyst.id} agent={analyst} onSave={handleSave} />}
      </div>

      {customerBot && (
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <MessageCircle size={16} className="text-pink-400" />
              <h2 className="text-sm font-semibold text-text-primary">{t('aiadm_group_bots')}</h2>
            </div>
            <p className="text-xs text-text-muted mt-1">{t('aiadm_group_bots_hint')}</p>
          </div>
          <CustomerBotCard key={customerBot.id} agent={customerBot} onSave={handleSave} />
        </div>
      )}
    </div>
  )
}
