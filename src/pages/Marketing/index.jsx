import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Award, Cake, Gift, Send, Settings2, Tag, Ticket } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import PromotionsTab from './tabs/PromotionsTab'
import CodesTab from './tabs/CodesTab'
import GiftCardsTab from './tabs/GiftCardsTab'
import MessagesTab from './tabs/MessagesTab'
import BirthdaysTab from './tabs/BirthdaysTab'
import SettingsTab from './tabs/SettingsTab'
import LoyaltyProgramCard from './components/LoyaltyProgramCard'
import MarketingOverview from './components/MarketingOverview'
import SectionHub from '../../components/ui/SectionHub'
import { PageHeader } from '../../components/ui/Kit'

const Marketing = () => {
  const { t } = useTranslation()
  const { hasPermission } = useAuthStore()

  const TABS = [
    { id: 'promotions', perm: 'marketing.promotions', icon: Tag },
    { id: 'codes', perm: 'marketing.codes', icon: Ticket },
    { id: 'gift_cards', perm: 'marketing.gift_cards', icon: Gift },
    { id: 'messages', perm: 'marketing.messages', icon: Send },
    { id: 'birthdays', perm: 'marketing.birthdays', icon: Cake },
    { id: 'loyalty', perm: 'marketing.loyalty', icon: Award },
    { id: 'settings', perm: 'marketing.settings', icon: Settings2 },
  ].filter(tab => hasPermission(tab.perm))

  const MAIN = TABS.some(tab => tab.id === 'promotions') ? 'promotions' : null
  const [section, setSection] = useState(() => {
    const q = new URLSearchParams(window.location.search)
    const id = q.get('section') || q.get('tab')
    return id && id !== MAIN && TABS.some(tab => tab.id === id) ? id : null
  })
  const goSettings = TABS.some(tab => tab.id === 'settings') ? () => setSection('settings') : null
  const RENDER = {
    promotions: <PromotionsTab />,
    codes: <CodesTab />,
    gift_cards: <GiftCardsTab />,
    messages: <MessagesTab goSettings={goSettings} />,
    birthdays: <BirthdaysTab goSettings={goSettings} />,
    loyalty: <div className="max-w-2xl"><LoyaltyProgramCard canEdit={hasPermission('marketing.loyalty')} /></div>,
    settings: <SettingsTab />,
  }

  if (!TABS.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-accent-red/10 flex items-center justify-center"><AlertCircle size={28} className="text-accent-red" /></div>
        <h2 className="font-syne font-bold text-xl text-text-primary">{t('exp_no_permission')}</h2>
      </div>
    )
  }

  const SECTIONS = TABS.filter(tab => tab.id !== MAIN).map((tab, i) => ({
    id: tab.id, label: t('mkt_tab_' + tab.id), icon: tab.icon,
    tone: ['cyan', 'pink', 'blue', 'orange', 'green', 'violet'][i % 6],
    render: () => RENDER[tab.id],
  }))

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-5">
      <PageHeader title={t('mkt_page_title')} subtitle={t('mkt_page_subtitle')} />
      <MarketingOverview onOpen={(id) => TABS.some(x => x.id === id) && setSection(id)} />
      {SECTIONS.length > 0 && <SectionHub variant={MAIN ? 'bar' : 'tiles'} sections={SECTIONS} openId={section} onOpenChange={setSection} />}
      {MAIN && RENDER[MAIN]}
    </motion.div>
  )
}

export default Marketing
