import { useTranslation } from 'react-i18next'
import AiChat from '../components/AiChat'

const GROUPS = {
  sales: ['aisec_q_sales_1', 'aisec_q_sales_2', 'aisec_q_sales_3'],
  inventory: ['aisec_q_inventory_1', 'aisec_q_inventory_2', 'aisec_q_inventory_3'],
  customers: ['aisec_q_customers_1', 'aisec_q_customers_2', 'aisec_q_customers_3'],
  marketing: ['aisec_q_marketing_1', 'aisec_q_marketing_2', 'aisec_q_marketing_3'],
  staff: ['aisec_q_staff_1', 'aisec_q_staff_2', 'aisec_q_staff_3'],
}

// AI yordamchi: bitta katta chat, tayyor savollar bo'limlar bo'yicha guruhlangan
export default function AssistantTab() {
  const { t } = useTranslation()
  const suggestions = Object.entries(GROUPS).map(([s, keys]) => ({ group: t(`aisec_head_${s}`), items: keys.map(k => t(k)) }))
  return (
    <div className="space-y-2">
      <p className="text-xs text-text-muted">{t('aisec_assistant_hint')}</p>
      <AiChat agentId="ai-assistant" chatKey="ai-assistant" colorClass="accent-blue" placeholder={t('aisec_ask_ph')}
        suggestions={suggestions} heightClass="h-[calc(100dvh-15rem)] min-h-[28rem]" />
    </div>
  )
}
