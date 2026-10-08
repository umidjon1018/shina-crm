import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Scale, Wallet, TrendingDown, TrendingUp, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { useShopStore } from '../../../store/shopStore'
import { useDataStore } from '../../../store/dataStore'
import { useAuthStore } from '../../../store/authStore'
import { getPnl, getCashflow } from '../../../api/financeService'
import { useFinanceCategories } from './useFinanceCategories'
import { getCatLabel } from './expHelpers'
import { presetRange, previousRange } from './PeriodPicker'
import PeriodFilter from '../../../components/ui/PeriodFilter'
import { HeroStat, MiniStat, ChartCard, DonutChart, GradientBars, shortNum } from '../../../components/charts/Charts'
import { formatNumber, formatPrice } from '../../../utils/format'

const trend = (cur, prev) => (prev ? Math.round(((cur - prev) / Math.abs(prev)) * 100) : null)
const sum3 = (o) => (o?.cash || 0) + (o?.card || 0) + (o?.transfer || 0)

// Moliya sahifasining asosiy ko'rinishi: foyda, pul qoldig'i va xarajatlar tarkibi (ruxsatga qarab)
const FinanceOverview = () => {
  const { t } = useTranslation()
  const { selectedShopId } = useShopStore()
  const { version } = useDataStore()
  const hasPermission = useAuthStore(s => s.hasPermission)
  const { categories } = useFinanceCategories()
  const canPnl = hasPermission('expenses.pnl')
  const canCash = hasPermission('expenses.cashflow')
  const [preset, setPreset] = useState('month')
  const [range, setRange] = useState(() => presetRange('month'))
  const [pnl, setPnl] = useState(null)
  const [prev, setPrev] = useState(null)
  const [cash, setCash] = useState(null)

  useEffect(() => {
    if (!canPnl && !canCash) return
    const r = range
    Promise.all([
      canPnl ? getPnl({ ...r, shopId: selectedShopId }) : null,
      canPnl && preset !== 'all' ? getPnl({ ...previousRange(r), shopId: selectedShopId }) : null,
      canCash ? getCashflow({ ...r, shopId: selectedShopId }) : null,
    ]).then(([a, b, c]) => { setPnl(a); setPrev(b); setCash(c) }).catch(() => {})
  }, [range.from, range.to, selectedShopId, version, canPnl, canCash])

  if (!canPnl && !canCash) return null

  const catName = (id) => {
    if (id === '__writeoff') return t('fin_pnl_writeoff')
    const c = categories.find(x => x.id === id)
    return c ? getCatLabel(c, t) : t('fin_pnl_no_category')
  }
  const revenueAll = pnl ? pnl.revenue + pnl.usedRevenue + (pnl.wholesaleRevenue || 0) : 0
  const expensesByCat = Object.values((pnl?.expenses || []).reduce((acc, x) => {
    const name = catName(x.categoryId)
    acc[name] = { name, value: (acc[name]?.value || 0) + x.total }
    return acc
  }, {})).sort((a, b) => b.value - a.value)

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-end">
        <PeriodFilter preset={preset} range={range} onChange={(p, r) => { setPreset(p); setRange(r) }} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {canPnl && (
          <HeroStat gradient="violet" icon={Scale} label={t('fin_pnl_net')} value={shortNum(pnl?.netProfit || 0)} unit={t('unit_som')}
            trend={pnl && prev ? trend(pnl.netProfit, prev.netProfit) : null} sub={`${t('fin_pnl_revenue_total')}: ${formatNumber(revenueAll)}`} />
        )}
        {canCash && (
          <HeroStat gradient="cyan" icon={Wallet} label={t('fin_ov_balance')} value={shortNum(sum3(cash?.closing))} unit={t('unit_som')}
            sub={`${t('pay_cash')} ${shortNum(cash?.closing?.cash || 0)} · ${t('pay_card')} ${shortNum(cash?.closing?.card || 0)}`} />
        )}
        {canPnl && (
          <div className="grid grid-cols-1 gap-3">
            <MiniStat icon={TrendingDown} tone="orange" invert label={t('fin_pnl_opex')} value={formatNumber(pnl?.totalExpenses || 0)}
              delta={pnl && prev ? trend(pnl.totalExpenses, prev.totalExpenses) : null} />
            <MiniStat icon={TrendingUp} tone="green" label={t('fin_pnl_other_income')} value={formatNumber(pnl?.totalOtherIncome || 0)} />
          </div>
        )}
        {canCash && (
          <div className="grid grid-cols-1 gap-3">
            <MiniStat icon={ArrowDownLeft} tone="cyan" label={t('fin_cf_in')} value={formatNumber(sum3(cash?.in))} />
            <MiniStat icon={ArrowUpRight} tone="pink" label={t('fin_cf_out')} value={formatNumber(sum3(cash?.out))} />
          </div>
        )}
      </div>

      {canPnl && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <ChartCard title={t('fin_ov_expense_mix')}>
            {expensesByCat.length
              ? <DonutChart height={200} valueFormatter={formatPrice} centerLabel={t('fin_cf_total')} centerValue={shortNum(pnl?.totalExpenses || 0)} data={expensesByCat} />
              : <p className="text-[15px] text-text-muted text-center py-16">{t('fin_ov_no_expenses')}</p>}
          </ChartCard>
          <ChartCard title={t('fin_ov_profit_mix')}>
            <GradientBars height={230} valueFormatter={formatPrice} name={t('unit_som')}
              data={[
                { label: t('fin_ov_bar_revenue'), value: revenueAll },
                { label: t('fin_ov_bar_cogs'), value: (pnl?.cogs || 0) + (pnl?.usedCogs || 0) + (pnl?.wholesaleCogs || 0) },
                { label: t('fin_ov_bar_expenses'), value: pnl?.totalExpenses || 0 },
                { label: t('fin_ov_bar_net'), value: pnl?.netProfit || 0 },
              ]} />
          </ChartCard>
        </div>
      )}
    </div>
  )
}

export default FinanceOverview
