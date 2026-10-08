import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ShoppingCart, TrendingUp, Store, Recycle, Boxes } from 'lucide-react'
import { useShopStore } from '../../../store/shopStore'
import { useDataStore } from '../../../store/dataStore'
import { useLangStore } from '../../../store/langStore'
import { getChannelsReport } from '../../../api/reportService'
import PeriodFilter from '../../../components/ui/PeriodFilter'
import { presetRange } from '../../../utils/period'
import { HeroStat, MiniStat, ChartCard, TrendArea, DonutChart, PALETTE, shortNum } from '../../../components/charts/Charts'
import { formatNumber, formatPrice, monthShort } from '../../../utils/format'

const CHANNELS = [
  { id: 'retail', icon: Store, tone: 'cyan', color: PALETTE[0] },
  { id: 'used', icon: Recycle, tone: 'violet', color: PALETTE[1] },
  { id: 'wholesale', icon: Boxes, tone: 'orange', color: PALETTE[4] },
]

// Hisobotlar umumiy ko'rinishi: savdo kanallari (chakana, B/U, ulgurji) — serverda yagona formula bilan hisoblanadi
const ReportsOverview = () => {
  const { t } = useTranslation()
  const { selectedShopId } = useShopStore()
  const { version } = useDataStore()
  const lang = useLangStore(s => s.lang)
  const [preset, setPreset] = useState('month')
  const [range, setRange] = useState(() => presetRange('month'))
  const [d, setD] = useState(null)

  useEffect(() => {
    getChannelsReport({ ...range, shop_id: selectedShopId }).then(setD).catch(() => setD(null))
  }, [range.from, range.to, selectedShopId, version])

  const tot = d?.totals || {}
  const sum = (k) => CHANNELS.reduce((a, c) => a + (tot[c.id]?.[k] || 0), 0)
  const revenue = sum('revenue'), count = sum('count')
  const profit = d?.showProfit ? sum('profit') : null
  const label = (date) => (d?.granularity === 'month'
    ? `${monthShort(Number(date.slice(5, 7)) - 1, lang)} ${date.slice(2, 4)}`
    : `${date.slice(8, 10)}.${date.slice(5, 7)}`)
  const series = (d?.series || []).map(x => ({ ...x, label: label(x.date) }))
  const active = CHANNELS.filter(c => (tot[c.id]?.revenue || 0) !== 0)

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg sm:text-xl font-bold text-text-primary">{t('rpt_ch_title')}</h2>
        <PeriodFilter preset={preset} range={range} onChange={(p, r) => { setPreset(p); setRange(r) }} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <HeroStat gradient="violet" icon={ShoppingCart} label={t('rpt_ch_revenue')} value={shortNum(revenue)} unit={t('unit_som')}
          sub={t('rpt_ch_count', { n: formatNumber(count) })} />
        {profit !== null
          ? <HeroStat gradient="green" icon={TrendingUp} label={t('rpt_ch_profit')} value={shortNum(profit)} unit={t('unit_som')}
              sub={`${t('rpt_ch_margin')}: ${revenue ? Math.round((profit / revenue) * 100) : 0}%`} />
          : <div className="hidden xl:block" />}
        <div className="grid grid-cols-1 gap-3 sm:col-span-2 xl:col-span-2 xl:grid-cols-1">
          {CHANNELS.map(c => (
            <MiniStat key={c.id} icon={c.icon} tone={c.tone} label={t('rpt_ch_' + c.id)}
              value={`${formatNumber(tot[c.id]?.revenue || 0)}${d?.showProfit ? ` · ${t('rpt_ch_profit_short')} ${shortNum(tot[c.id]?.profit || 0)}` : ''}`} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">
        <ChartCard title={t('rpt_ch_dynamics')} className="lg:col-span-3">
          {series.length
            ? <TrendArea data={series} height={250} valueFormatter={formatPrice}
                series={(active.length ? active : CHANNELS.slice(0, 1)).map(c => ({ key: c.id, label: t('rpt_ch_' + c.id), color: c.color }))} />
            : <p className="text-[15px] text-text-muted text-center py-16">{t('rpt_ch_empty')}</p>}
        </ChartCard>
        <ChartCard title={t('rpt_ch_share')} className="lg:col-span-2">
          {revenue
            ? <DonutChart height={210} valueFormatter={formatPrice} centerLabel={t('rpt_ch_total')} centerValue={shortNum(revenue)}
                data={active.map(c => ({ name: t('rpt_ch_' + c.id), value: tot[c.id].revenue, color: c.color }))} />
            : <p className="text-[15px] text-text-muted text-center py-16">{t('rpt_ch_empty')}</p>}
        </ChartCard>
      </div>
    </div>
  )
}

export default ReportsOverview
