import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import DataTable from '../../../components/ui/DataTable'
import PeriodFilter from '../../../components/ui/PeriodFilter'
import { Segmented } from '../../../components/ui/Kit'
import { ChartCard, TrendArea } from '../../../components/charts/Charts'
import { useDataStore } from '../../../store/dataStore'
import { useLangStore } from '../../../store/langStore'
import { getProdReport } from '../../../api/productionService'
import { presetRange } from '../../../utils/period'
import { formatNumber, formatDate, monthShort } from '../../../utils/format'
import { Spinner, fmtQty, usePr } from '../components/prHelpers'

// Hisobot: xomashyo sarfi (reja/fakt), mahsulot bo'yicha hajm va tannarx, tannarx dinamikasi, muddati yaqin mahsulot
const ReportTab = ({ shopId }) => {
  const { t } = useTranslation()
  const { version } = useDataStore()
  const lang = useLangStore(s => s.lang)
  const pr = usePr()
  const [preset, setPreset] = useState('month')
  const [range, setRange] = useState(() => presetRange('month'))
  const [data, setData] = useState(null)
  const [view, setView] = useState('consumption')
  const [dynProduct, setDynProduct] = useState('')

  useEffect(() => { getProdReport({ ...range, shopId }).then(setData).catch(() => setData(null)) }, [range.from, range.to, shopId, version])

  const hasCost = data?.products?.some(p => p.avgCost !== undefined)
  const dynProducts = useMemo(() => [...new Map((data?.dynamics || []).map(d => [d.productId, d.name])).entries()], [data])
  const selected = dynProduct || dynProducts[0]?.[0]
  const dynData = (data?.dynamics || []).filter(d => d.productId === selected)
    .map(d => ({ label: `${monthShort(Number(d.month.slice(5)) - 1, lang)} ${d.month.slice(2, 4)}`, value: d.unitCost }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmented value={view} onChange={setView} options={[
          { id: 'consumption', label: t('pr_rep_consumption') }, { id: 'products', label: t('pr_rep_products') },
          ...(hasCost ? [{ id: 'dynamics', label: t('pr_rep_dynamics') }] : []),
          { id: 'expiring', label: t('pr_rep_expiring'), count: data?.expiring?.length },
        ]} />
        {view !== 'expiring' && view !== 'dynamics' && <PeriodFilter size="sm" preset={preset} range={range} onChange={(p, r) => { setPreset(p); setRange(r) }} />}
      </div>
      {!data ? <Spinner /> : view === 'consumption' ? (
        <>
          <p className="text-sm text-text-muted">{t('pr_rep_consumption_hint')}</p>
          <DataTable tableId="pr_rep_cons" rows={data.consumption} rowKey={r => r.productId} onRowClick={r => pr.openMaterial(r.productId)} empty={t('pr_no_production')}
            columns={[
              { key: 'name', label: t('pr_f_material'), sortValue: r => r.name, render: r => <span className="font-semibold">{r.name}</span> },
              { key: 'plan', label: t('pr_col_plan'), align: 'right', sortValue: r => r.planned, render: r => `${fmtQty(r.planned)} ${r.unit}` },
              { key: 'fact', label: t('pr_col_fact'), align: 'right', sortValue: r => r.actual, render: r => <b>{fmtQty(r.actual)} {r.unit}</b> },
              { key: 'diff', label: t('pr_col_diff'), align: 'right', sortValue: r => r.diffPercent ?? 0,
                render: r => <span className={r.diff > 0.0005 ? 'text-accent-red font-semibold' : r.diff < -0.0005 ? 'text-accent-green font-semibold' : 'text-text-muted'}>
                  {r.diff > 0 ? '+' : ''}{fmtQty(r.diff)}{r.diffPercent !== null ? ` (${r.diffPercent > 0 ? '+' : ''}${r.diffPercent}%)` : ''}</span> },
              ...(hasCost ? [{ key: 'cost', label: t('pr_col_cost'), align: 'right', sortValue: r => r.cost, render: r => formatNumber(r.cost) }] : []),
            ]} />
        </>
      ) : view === 'products' ? (
        <DataTable tableId="pr_rep_products" rows={data.products} rowKey={r => r.productId} empty={t('pr_no_production')}
          columns={[
            { key: 'name', label: t('pr_col_product'), sortValue: r => r.name, render: r => <span className="font-semibold">{r.name}</span> },
            { key: 'orders', label: t('pr_col_orders'), align: 'right', render: r => r.orders },
            { key: 'qty', label: t('pr_f_produced'), align: 'right', sortValue: r => r.qty, render: r => <b>{fmtQty(r.qty)} {r.unit}</b> },
            { key: 'defect', label: t('pr_defect_short'), align: 'right', render: r => (r.defect ? fmtQty(r.defect) : '—') },
            ...(hasCost ? [
              { key: 'avg', label: t('pr_col_avg_unit_cost'), align: 'right', sortValue: r => r.avgCost, render: r => formatNumber(r.avgCost) },
              { key: 'min', label: t('pr_col_min_max'), align: 'right', optional: true, render: r => `${formatNumber(r.minCost)} – ${formatNumber(r.maxCost)}` },
              { key: 'total', label: t('pr_col_total_cost'), align: 'right', sortValue: r => r.total, render: r => formatNumber(r.total) },
            ] : []),
          ]} />
      ) : view === 'dynamics' ? (
        <ChartCard title={t('pr_rep_dynamics')} subtitle={t('pr_rep_dynamics_sub')}
          right={dynProducts.length > 1 && (
            <select value={selected} onChange={e => setDynProduct(e.target.value)} className="bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-[15px] text-text-primary">
              {dynProducts.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          )}>
          {dynData.length
            ? <TrendArea data={dynData} height={260} series={[{ key: 'value', label: t('pr_col_unit_cost'), color: '#A86BFF' }]} />
            : <p className="text-[15px] text-text-muted text-center py-16">{t('pr_no_production')}</p>}
        </ChartCard>
      ) : (
        <>
          <p className="text-sm text-text-muted">{t('pr_rep_expiring_hint')}</p>
          <DataTable tableId="pr_rep_exp" rows={data.expiring} rowKey={r => r.key} empty={t('pr_no_expiring')}
            columns={[
              { key: 'name', label: t('pr_col_product'), sortValue: r => r.name, render: r => <span className="font-semibold">{r.name}</span> },
              { key: 'lot', label: t('pr_col_lot'), render: r => r.lotNo || '—' },
              { key: 'qty', label: t('pr_col_left'), align: 'right', render: r => `${fmtQty(r.qty)} ${r.unit}` },
              { key: 'exp', label: t('pr_col_expires'), sortValue: r => r.expiresAt, render: r => <span className={r.expired ? 'text-accent-red font-bold' : 'text-accent-orange font-semibold'}>{formatDate(r.expiresAt)}{r.expired ? ` · ${t('pr_expired')}` : ''}</span> },
              { key: 'shop', label: t('pr_f_shop'), optional: true, render: r => r.shopName || '—' },
            ]} />
        </>
      )}
    </div>
  )
}

export default ReportTab
