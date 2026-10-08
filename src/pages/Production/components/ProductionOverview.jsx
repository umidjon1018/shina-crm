import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Factory, Boxes, ClipboardList, AlarmClock, Coins, Zap } from 'lucide-react'
import { useDataStore } from '../../../store/dataStore'
import { useLangStore } from '../../../store/langStore'
import { getProdSummary } from '../../../api/productionService'
import { HeroStat, MiniStat, ChartCard, GradientBars, shortNum } from '../../../components/charts/Charts'
import { formatNumber, formatPrice, monthShort } from '../../../utils/format'
import { qtyUnit } from './prHelpers'

// Ishlab chiqarish: davr bo'yicha hajm va tannarx, xomashyo zaxirasi, ochiq buyurtmalar, muddati yaqin mahsulot
const ProductionOverview = ({ range, shopId, onOpen }) => {
  const { t } = useTranslation()
  const { version } = useDataStore()
  const lang = useLangStore(s => s.lang)
  const [s, setS] = useState(null)

  useEffect(() => { getProdSummary({ ...range, shopId }).then(setS).catch(() => setS(null)) }, [range.from, range.to, shopId, version])

  const hasCost = s?.producedValue !== undefined
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const m = s?.months.find(x => x.month === key)
    return { label: monthShort(d.getMonth(), lang), value: hasCost ? (m?.total || 0) : (m?.orders || 0) }
  })

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <HeroStat gradient="violet" icon={Factory} label={t('pr_ov_produced')}
          value={hasCost ? shortNum(s.producedValue) : formatNumber(s?.doneOrders || 0)} unit={hasCost ? t('unit_som') : t('pr_orders_unit')}
          sub={t('pr_ov_produced_sub', { n: s?.doneOrders || 0, d: formatNumber(s?.defectQty || 0) })} onClick={() => onOpen?.('report')} />
        <HeroStat gradient="cyan" icon={Boxes} label={t('pr_ov_materials')}
          value={hasCost ? shortNum(s.materialsValue) : formatNumber(s?.materialItems || 0)} unit={hasCost ? t('unit_som') : t('pr_kinds_unit')}
          sub={t('pr_ov_materials_sub', { n: s?.materialItems || 0, low: s?.lowMaterials || 0 })} onClick={() => onOpen?.('materials')} />
        <div className="grid grid-cols-1 gap-3">
          <MiniStat icon={ClipboardList} tone="blue" label={t('pr_ov_open')} value={`${s?.planned || 0} · ${s?.inProgress || 0}`} />
          <MiniStat icon={AlarmClock} tone="orange" label={t('pr_ov_expiring')} value={formatNumber(s?.expiringSoon || 0)} onClick={() => onOpen?.('report')} />
        </div>
        <div className="grid grid-cols-1 gap-3">
          {hasCost && <MiniStat icon={Coins} tone="green" label={t('pr_col_material_cost')} value={formatNumber(s.materialCost)} />}
          {hasCost && <MiniStat icon={Zap} tone="pink" label={t('pr_extra_costs')} value={formatNumber(s.extraCost)} />}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">
        <ChartCard title={hasCost ? t('pr_ov_months_value') : t('pr_ov_months_orders')} className="lg:col-span-3">
          <GradientBars height={230} data={months} valueFormatter={hasCost ? formatPrice : formatNumber} name={hasCost ? t('unit_som') : t('pr_orders_unit')} />
        </ChartCard>
        <ChartCard title={t('pr_ov_top')} className="lg:col-span-2">
          <div className="divide-y divide-border">
            {(s?.top || []).map(p => (
              <div key={p.productId} className="flex items-center justify-between gap-3 py-3">
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold text-text-primary truncate">{p.name}</span>
                  {p.unitCost !== undefined && <span className="block text-sm text-text-muted">{formatNumber(p.unitCost)} / {p.unit}</span>}
                </span>
                <span className="text-[15px] font-bold whitespace-nowrap">{qtyUnit(p.qty, p.unit)}</span>
              </div>
            ))}
            {!s?.top?.length && <p className="text-[15px] text-text-muted text-center py-12">{t('pr_no_production')}</p>}
          </div>
        </ChartCard>
      </div>
    </div>
  )
}

export default ProductionOverview
