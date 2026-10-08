import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, HandCoins, PackageOpen, Users, Coins } from 'lucide-react'
import { useDataStore } from '../../../store/dataStore'
import { useLangStore } from '../../../store/langStore'
import { getWhSummary } from '../../../api/wholesaleService'
import { HeroStat, MiniStat, ChartCard, GradientBars, shortNum } from '../../../components/charts/Charts'
import { formatNumber, formatPrice, monthShort } from '../../../utils/format'
import { useWh } from './whHelpers'

// Ulgurji savdo: davr bo'yicha sotuv, dilerlar qarzi, dilerlardagi tovar, oxirgi 6 oy
const WholesaleOverview = ({ range, shopId, onOpen }) => {
  const { t } = useTranslation()
  const { version } = useDataStore()
  const lang = useLangStore(s => s.lang)
  const wh = useWh()
  const [s, setS] = useState(null)

  useEffect(() => { getWhSummary({ ...range, shopId }).then(setS).catch(() => setS(null)) }, [range.from, range.to, shopId, version])

  // Oxirgi 6 oy (bo'sh oylar ham ko'rinsin)
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { label: monthShort(d.getMonth(), lang), value: s?.months.find(m => m.month === key)?.total || 0 }
  })

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <HeroStat gradient="violet" icon={TrendingUp} label={t('wh_ov_sales')} value={shortNum(s?.revenue || 0)} unit={t('unit_som')}
          sub={t('wh_ov_sales_sub', { docs: s?.docs || 0, qty: s?.qty || 0 })} />
        <HeroStat gradient="orange" icon={HandCoins} label={t('wh_ov_debt')} value={shortNum(s?.debt || 0)} unit={t('unit_som')}
          sub={`${t('wh_ov_overdue')}: ${formatNumber(s?.overdue || 0)}`} onClick={() => onOpen?.('debts')} />
        <div className="grid grid-cols-1 gap-3">
          <MiniStat icon={PackageOpen} tone="violet" label={t('wh_ov_consigned')} value={`${s?.consignedQty || 0} · ${shortNum(s?.consignedValue || 0)}`} onClick={() => onOpen?.('consigned')} />
          <MiniStat icon={Users} tone="cyan" label={t('wh_ov_debtors')} value={formatNumber(s?.debtors || 0)} onClick={() => onOpen?.('clients')} />
        </div>
        <div className="grid grid-cols-1 gap-3">
          {s?.profit !== undefined && <MiniStat icon={Coins} tone="green" label={t('wh_ov_profit')} value={formatNumber(s.profit)} />}
          <MiniStat icon={TrendingUp} tone="pink" label={t('wh_ov_avg_doc')} value={formatNumber(s?.docs ? s.revenue / s.docs : 0)} />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">
        <ChartCard title={t('wh_ov_months')} className="lg:col-span-3">
          <GradientBars height={230} data={months} valueFormatter={formatPrice} name={t('unit_som')} />
        </ChartCard>
        <ChartCard title={t('wh_ov_top_debtors')} className="lg:col-span-2">
          <div className="divide-y divide-border">
            {(s?.topDebtors || []).map(d => (
              <button key={d.id} onClick={() => wh.openClient(d.id)} className="w-full flex items-center justify-between gap-3 py-3 text-left hover:opacity-80">
                <span className="text-[15px] font-semibold text-text-primary truncate">{d.name}</span>
                <span className="text-[15px] font-bold text-accent-red whitespace-nowrap">{formatNumber(d.debt)}</span>
              </button>
            ))}
            {!s?.topDebtors?.length && <p className="text-[15px] text-text-muted text-center py-12">{t('wh_no_debts')}</p>}
          </div>
        </ChartCard>
      </div>
    </div>
  )
}

export default WholesaleOverview
