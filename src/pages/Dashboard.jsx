import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Wallet, TrendingUp, Receipt, ShoppingBag, UserPlus, RotateCcw, AlertTriangle, ArrowRight, Boxes, CreditCard, Truck } from 'lucide-react'
import { useShopStore } from '../store/shopStore'
import { useDataStore } from '../store/dataStore'
import { getDashboardReport } from '../api/reportService'
import { presetRange } from './Expenses/components/PeriodPicker'
import { PageHeader, Segmented } from '../components/ui/Kit'
import { HeroStat, MiniStat, ChartCard, TrendArea, DonutChart, GradientBars, Legend, PALETTE, shortNum } from '../components/charts/Charts'
import { formatPrice, formatNumber, formatUSD } from '../utils/format'

const PRESETS = ['today', 'week', 'month', 'last_month']
const WD = { uz: ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'], ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] }
const trend = (cur, prev) => (prev ? Math.round(((cur - prev) / Math.abs(prev)) * 100) : null)

// Bosh sahifa: asosiy ko'rsatkichlar va diagrammalar (hammasi serverda hisoblanadi — /api/reports/dashboard)
export const Dashboard = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { selectedShopId } = useShopStore()
  const { version } = useDataStore()
  const [preset, setPreset] = useState('month')
  const [d, setD] = useState(null)

  useEffect(() => {
    getDashboardReport({ ...presetRange(preset), shop_id: selectedShopId }).then(setD).catch(() => setD(null))
  }, [preset, selectedShopId, version])

  const c = d?.current, p = d?.previous
  const hasProfit = c && c.profit !== undefined
  const lang = i18n.language === 'ru' ? 'ru' : 'uz'
  const payLabel = (k) => ({ cash: t('pay_cash'), card: t('pay_card'), installment: t('pay_installment'), transfer: t('sl_ns_pay_transfer') }[k] || k)
  const daily = (d?.daily || []).map(x => ({ ...x, label: `${x.date.slice(8, 10)}.${x.date.slice(5, 7)}` }))

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-5">
      <PageHeader title={t('dashboard')} subtitle={t('dash_vs_prev')}
        actions={<Segmented value={preset} onChange={setPreset} options={PRESETS.map(k => ({ id: k, label: t('fin_period_' + k) }))} />} />

      {!c ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">{[0, 1, 2, 3].map(i => <div key={i} className="h-36 panel animate-pulse" />)}</div>
      ) : (<>
        {/* Asosiy ko'rsatkichlar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <HeroStat gradient="violet" icon={Wallet} label={t('dash_k_revenue')} value={shortNum(c.revenue)} unit={t('unit_som')}
            trend={trend(c.revenue, p.revenue)} sub={formatNumber(c.revenue)} />
          {hasProfit
            ? <HeroStat gradient="cyan" icon={TrendingUp} label={t('dash_k_profit')} value={shortNum(c.profit)} unit={t('unit_som')}
                trend={trend(c.profit, p.profit)} sub={formatNumber(c.profit)} />
            : <HeroStat gradient="cyan" icon={Receipt} label={t('dash_k_checks')} value={c.salesCount} trend={trend(c.salesCount, p.salesCount)} />}
          <div className="grid grid-cols-1 gap-3">
            <MiniStat icon={Receipt} tone="pink" label={t('dash_k_checks')} value={c.salesCount} delta={trend(c.salesCount, p.salesCount)} />
            <MiniStat icon={ShoppingBag} tone="cyan" label={t('dash_k_avg')} value={formatNumber(c.avgCheck)} delta={trend(c.avgCheck, p.avgCheck)} />
          </div>
          <div className="grid grid-cols-1 gap-3">
            <MiniStat icon={UserPlus} tone="green" label={t('dash_k_new_customers')} value={c.newCustomers} delta={trend(c.newCustomers, p.newCustomers)} />
            <MiniStat icon={RotateCcw} tone="orange" label={t('dash_k_returns')} value={formatNumber(c.returnsAmount)} />
          </div>
        </div>

        {/* Dinamika + to'lov turlari */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4">
          <ChartCard className="xl:col-span-2" title={t('dash_chart_period')}
            right={<Legend items={[{ label: t('dash_k_revenue'), color: PALETTE[0] }, ...(hasProfit ? [{ label: t('dash_k_profit'), color: PALETTE[1], dashed: true }] : [])]} />}>
            <TrendArea data={daily} height={270} valueFormatter={formatPrice}
              series={[{ key: 'revenue', label: t('dash_k_revenue'), color: PALETTE[0] }, ...(hasProfit ? [{ key: 'profit', label: t('dash_k_profit'), color: PALETTE[1], dashed: true }] : [])]} />
          </ChartCard>
          <ChartCard title={t('dash_payments')}>
            <DonutChart height={190} valueFormatter={formatPrice} centerLabel={t('dash_k_checks')} centerValue={c.salesCount}
              data={(d.payments || []).map(x => ({ name: payLabel(x.type), value: x.amount }))} />
          </ChartCard>
        </div>

        {/* Kategoriyalar, hafta kunlari, top tovarlar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          <ChartCard title={t('dash_categories')}>
            <DonutChart height={190} valueFormatter={formatPrice} centerLabel={t('dash_k_items')} centerValue={c.itemsSold}
              data={(d.categories || []).map(x => ({ name: x.name, value: x.revenue }))} />
          </ChartCard>
          <ChartCard title={t('dash_weekdays')} subtitle={t('dash_weekdays_sub')}>
            <GradientBars height={220} name={t('dash_k_checks')} valueFormatter={formatNumber}
              data={(d.weekday || []).map((x, i) => ({ label: WD[lang][i], value: x.count }))} />
          </ChartCard>
          <ChartCard title={t('dash_top_products')} className="lg:col-span-2 xl:col-span-1">
            <div className="space-y-3">
              {(d.topProducts || []).map((x, i) => {
                const max = d.topProducts[0]?.revenue || 1
                return (
                  <div key={x.id} className="min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[15px] font-semibold text-text-primary truncate">{i + 1}. {x.name}</p>
                      <p className="text-sm font-bold text-text-primary whitespace-nowrap">{shortNum(x.revenue)}</p>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-bg-tertiary overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.max(4, (x.revenue / max) * 100)}%`, background: `linear-gradient(90deg, ${PALETTE[0]}, ${PALETTE[1]})` }} />
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">{x.qty} {t('unit_pcs')}</p>
                  </div>
                )
              })}
              {!d.topProducts?.length && <p className="text-sm text-text-muted py-6 text-center">—</p>}
            </div>
          </ChartCard>
        </div>

        {/* Oxirgi sotuvlar, kam qolganlar, qarzlar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          <ChartCard title={t('dash_recent_sales')}
            right={<button onClick={() => navigate('/sales?section=history')} className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary">{t('filter_all')} <ArrowRight size={15} /></button>}>
            <div className="divide-y divide-border">
              {(d.recent || []).map(r => (
                <div key={r.id} className="flex items-center gap-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-text-primary truncate">{r.customer || t('dash_walk_in')}</p>
                    <p className="text-sm text-text-muted">{r.at?.slice(8, 10)}.{r.at?.slice(5, 7)} {r.at?.slice(11, 16)} · {payLabel(r.type)}</p>
                  </div>
                  {r.status === 'cancelled'
                    ? <span className="text-sm font-bold text-accent-red">{t('sl_hist_status_cancelled')}</span>
                    : <span className="text-[15px] font-bold text-accent-green whitespace-nowrap">{formatNumber(r.amount)}</span>}
                </div>
              ))}
              {!d.recent?.length && <p className="text-sm text-text-muted py-6 text-center">—</p>}
            </div>
          </ChartCard>
          <ChartCard title={t('dash_low_stock')}
            right={<button onClick={() => navigate('/warehouse')} className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary">{t('dash_to_warehouse')} <ArrowRight size={15} /></button>}>
            <div className="divide-y divide-border">
              {(d.lowStock || []).map(x => (
                <div key={x.id} className="flex items-center gap-3 py-2.5">
                  <AlertTriangle size={18} className="text-accent-orange shrink-0" />
                  <p className="flex-1 text-[15px] text-text-primary truncate">{x.name}</p>
                  <span className={`text-[15px] font-bold whitespace-nowrap ${x.qty === 0 ? 'text-accent-red' : 'text-accent-orange'}`}>{x.qty} / {x.threshold}</span>
                </div>
              ))}
              {!d.lowStock?.length && <p className="text-sm text-text-muted py-6 text-center">{t('dash_all_ok')}</p>}
            </div>
          </ChartCard>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 lg:col-span-2 xl:col-span-1">
            <MiniStat icon={CreditCard} tone="pink" label={t('dash_installment_debt')} value={formatNumber(d.installmentDebt)} onClick={() => navigate('/sales?section=installment')} />
            {d.supplierDebtUSD !== undefined && <MiniStat icon={Truck} tone="orange" label={t('dash_debt_suppliers')} value={formatUSD(d.supplierDebtUSD)} onClick={() => navigate('/income')} />}
            <MiniStat icon={Boxes} tone="violet" label={t('dash_stock_now')} value={`${formatNumber(d.stock?.qty)} ${t('unit_pcs')}`} onClick={() => navigate('/warehouse')} />
            <MiniStat icon={Wallet} tone="blue" label={t('dash_stock_value')} value={shortNum(d.stock?.retail)} />
          </div>
        </div>
      </>)}
    </motion.div>
  )
}

export default Dashboard
