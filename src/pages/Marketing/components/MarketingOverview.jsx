import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Tag, TrendingUp, Percent, Cake, Gift } from 'lucide-react'
import { useAuthStore } from '../../../store/authStore'
import { useDataStore } from '../../../store/dataStore'
import { getPromotions, getPromotionStats } from '../../../api/promotionService'
import { getBirthdays, getGiftCards } from '../../../api/marketingService'
import { HeroStat, MiniStat, ChartCard, GradientBars, shortNum } from '../../../components/charts/Charts'
import { formatNumber, formatPrice } from '../../../utils/format'

const today = () => new Date().toISOString().slice(0, 10)
const isRunning = (p) => p.isActive && (!p.startDate || p.startDate <= today()) && (!p.endDate || p.endDate >= today())

// Marketing sahifasining yuqori qismi: aksiyalar natijasi, tug'ilgan kunlar, sertifikatlar
const MarketingOverview = ({ onOpen }) => {
  const { t } = useTranslation()
  const hasPermission = useAuthStore(s => s.hasPermission)
  const { version } = useDataStore()
  const canPromo = hasPermission('marketing.promotions')
  const canBirth = hasPermission('marketing.birthdays')
  const canGift = hasPermission('marketing.gift_cards')
  const [promos, setPromos] = useState([])
  const [stats, setStats] = useState([])
  const [birthdays, setBirthdays] = useState(null)
  const [cards, setCards] = useState(null)

  useEffect(() => {
    if (canPromo) Promise.all([getPromotions(), getPromotionStats()]).then(([p, s]) => { setPromos(p); setStats(s) }).catch(() => {})
    if (canBirth) getBirthdays(7).then(setBirthdays).catch(() => {})
    if (canGift) getGiftCards().then(setCards).catch(() => {})
  }, [version, canPromo, canBirth, canGift])

  if (!canPromo) return null

  const running = promos.filter(isRunning).length
  const totals = stats.reduce((a, s) => ({ sales: a.sales + s.sales, discount: a.discount + s.discount, revenue: a.revenue + s.revenue }), { sales: 0, discount: 0, revenue: 0 })
  const names = Object.fromEntries(promos.map(p => [String(p.id), p.name]))
  const top = [...stats].sort((a, b) => b.revenue - a.revenue).slice(0, 6)
    .map(s => ({ label: names[s.promoId] || `#${s.promoId}`, value: Math.round(s.revenue) }))
  const liability = (cards || []).filter(c => c.status === 'active').reduce((s, c) => s + (c.balance || 0), 0)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
      <HeroStat gradient="violet" icon={Tag} label={t('mkt_ov_running')} value={running} sub={`${t('mkt_ov_total_promos')}: ${promos.length}`} />
      <HeroStat gradient="cyan" icon={TrendingUp} label={t('mkt_ov_promo_revenue')} value={shortNum(totals.revenue)} unit={t('unit_som')}
        sub={`${totals.sales} ${t('mkt_ov_checks')}`} />
      <div className="grid grid-cols-1 gap-3">
        <MiniStat icon={Percent} tone="orange" label={t('mkt_ov_discount_given')} value={formatNumber(Math.round(totals.discount))} />
        {canBirth
          ? <MiniStat icon={Cake} tone="pink" label={t('mkt_ov_birthdays_7')} value={birthdays ? birthdays.length : '…'} onClick={() => onOpen?.('birthdays')} />
          : canGift && <MiniStat icon={Gift} tone="green" label={t('mkt_ov_gift_balance')} value={formatNumber(liability)} onClick={() => onOpen?.('gift_cards')} />}
      </div>
      <ChartCard title={t('mkt_ov_top_promos')}>
        {top.length
          ? <GradientBars height={170} horizontal valueFormatter={formatPrice} name={t('mkt_ov_promo_revenue')} data={top} />
          : <p className="text-[15px] text-text-muted text-center py-12">{t('mkt_ov_no_sales')}</p>}
      </ChartCard>
    </div>
  )
}

export default MarketingOverview
