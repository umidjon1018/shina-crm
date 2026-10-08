import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, PackageOpen, Boxes } from 'lucide-react'
import DataTable from '../../../components/ui/DataTable'
import { HeroStat } from '../../../components/charts/Charts'
import { useAuthStore } from '../../../store/authStore'
import { useDataStore } from '../../../store/dataStore'
import { getMaterials } from '../../../api/productionService'
import { formatNumber, formatDate } from '../../../utils/format'
import { Spinner, inputCls, fmtQty, KindBadge, usePr } from '../components/prHelpers'

// Xomashyo va boshqa miqdor bo'yicha hisoblanadigan tovarlar qoldig'i
const MaterialsTab = ({ shopId }) => {
  const { t } = useTranslation()
  const { version } = useDataStore()
  const hasPermission = useAuthStore(s => s.hasPermission)
  const pr = usePr()
  const [list, setList] = useState(null)
  const [q, setQ] = useState('')
  const [onlyLow, setOnlyLow] = useState(false)

  useEffect(() => { getMaterials(shopId).then(setList).catch(() => setList([])) }, [shopId, version])

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return (list || []).filter(m => (!onlyLow || m.low || m.expired) && (!s || m.name.toLowerCase().includes(s)))
  }, [list, q, onlyLow])
  const hasCost = list?.some(m => m.avgCost !== undefined)
  const value = (list || []).reduce((s, m) => s + (m.value || 0), 0)
  const low = (list || []).filter(m => m.low).length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {hasCost && <HeroStat gradient="cyan" icon={Boxes} label={t('pr_ov_materials')} value={formatNumber(value)} unit={t('unit_som')} sub={t('pr_kinds_n', { n: list.length })} />}
        <HeroStat gradient="orange" icon={Boxes} label={t('pr_low_title')} value={low} sub={t('pr_low_sub')} onClick={() => setOnlyLow(true)} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('pr_search_material')} className={inputCls + ' pl-10'} />
        </div>
        <label className="flex items-center gap-2 text-[15px] text-text-secondary px-1">
          <input type="checkbox" checked={onlyLow} onChange={e => setOnlyLow(e.target.checked)} className="w-5 h-5 accent-[#E63946]" />{t('pr_only_low')}
        </label>
        {hasPermission('production.materials') && (
          <button onClick={() => pr.receive()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl g-brand text-white font-bold"><PackageOpen size={18} />{t('pr_receive')}</button>
        )}
      </div>
      {!list ? <Spinner /> : (
        <DataTable tableId="pr_materials" rows={rows} rowKey={m => m.productId} onRowClick={m => pr.openMaterial(m.productId)} empty={t('pr_no_materials')} resetKey={q + onlyLow}
          columns={[
            { key: 'name', label: t('pr_f_material'), sortValue: m => m.name, render: m => <span className="flex flex-wrap items-center gap-2 font-semibold">{m.name} <KindBadge kind={m.kind} t={t} /></span> },
            { key: 'qty', label: t('pr_col_stock'), align: 'right', sortValue: m => m.qty, render: m => <b className={m.low ? 'text-accent-red' : ''}>{fmtQty(m.qty)} {m.unit}</b> },
            ...(hasCost ? [
              { key: 'avg', label: t('pr_col_avg_cost'), align: 'right', sortValue: m => m.avgCost, render: m => formatNumber(m.avgCost) },
              { key: 'value', label: t('pr_col_value'), align: 'right', sortValue: m => m.value, render: m => formatNumber(m.value) },
            ] : []),
            { key: 'used', label: t('pr_col_used30'), align: 'right', optional: true, sortValue: m => m.used30, render: m => `${fmtQty(m.used30)} ${m.unit}` },
            { key: 'exp', label: t('pr_col_expires'), optional: true, sortValue: m => m.expiresAt || '9', render: m => (m.expiresAt ? <span className={m.expired ? 'text-accent-red font-semibold' : ''}>{formatDate(m.expiresAt)}</span> : '—') },
            { key: 'lots', label: t('pr_col_lots'), align: 'right', optional: true, render: m => m.lots },
          ]} />
      )}
    </div>
  )
}

export default MaterialsTab
