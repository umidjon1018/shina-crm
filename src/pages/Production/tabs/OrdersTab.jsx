import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import DataTable from '../../../components/ui/DataTable'
import { Segmented } from '../../../components/ui/Kit'
import { useDataStore } from '../../../store/dataStore'
import { getProdOrders } from '../../../api/productionService'
import { formatNumber, formatDate } from '../../../utils/format'
import { StatusBadge, Spinner, inputCls, fmtQty, usePr } from '../components/prHelpers'

const GROUPS = { all: null, open: ['planned', 'in_progress'], done: ['done'], cancelled: ['cancelled'] }
const dateOf = (o) => o.producedAt || o.plannedDate || o.createdAt

// Ishlab chiqarish buyurtmalari (sahifaning asosiy ko'rinishi)
const OrdersTab = ({ range, shopId }) => {
  const { t } = useTranslation()
  const { version } = useDataStore()
  const pr = usePr()
  const [orders, setOrders] = useState(null)
  const [group, setGroup] = useState('all')
  const [q, setQ] = useState('')

  useEffect(() => { getProdOrders({ ...range, shopId }).then(setOrders).catch(() => setOrders([])) }, [range.from, range.to, shopId, version])

  const rows = useMemo(() => {
    const st = GROUPS[group]
    const s = q.trim().toLowerCase()
    return (orders || []).filter(o => (!st || st.includes(o.status)) && (!s || `${o.no} ${o.productName} ${o.lotNo}`.toLowerCase().includes(s)))
  }, [orders, group, q])
  const count = (g) => (orders || []).filter(o => !GROUPS[g] || GROUPS[g].includes(o.status)).length
  const hasCost = orders?.some(o => o.unitCost !== undefined)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented value={group} onChange={setGroup} options={Object.keys(GROUPS).map(g => ({ id: g, label: t('pr_grp_' + g), count: orders ? count(g) : undefined }))} />
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('pr_search_orders')} className={inputCls + ' pl-10'} />
        </div>
      </div>
      {!orders ? <Spinner /> : (
        <DataTable tableId="pr_orders" rows={rows} onRowClick={o => pr.openOrder(o.id)} empty={t('pr_no_orders')} resetKey={group + q}
          mobileCard={o => (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-text-primary">{o.no}</span>
                <StatusBadge status={o.status} t={t} />
              </div>
              <div className="flex items-center justify-between gap-2 text-sm text-text-muted">
                <span className="truncate">{o.productName} · {formatDate(dateOf(o))}</span>
                <span className="font-semibold text-text-primary whitespace-nowrap">{fmtQty(o.status === 'done' ? o.producedQty : o.plannedQty)} {o.unit}</span>
              </div>
            </div>
          )}
          columns={[
            { key: 'no', label: t('pr_col_no'), sortValue: o => Number(o.id), render: o => <span className="font-semibold whitespace-nowrap">{o.no}</span> },
            { key: 'date', label: t('pr_col_date'), sortValue: o => dateOf(o), render: o => formatDate(dateOf(o)) },
            { key: 'product', label: t('pr_col_product'), sortValue: o => o.productName, render: o => o.productName },
            { key: 'qty', label: t('pr_col_qty'), align: 'right', sortValue: o => o.producedQty || o.plannedQty,
              render: o => (o.status === 'done'
                ? <span className="whitespace-nowrap"><b>{fmtQty(o.producedQty)}</b> <span className="text-text-muted">/ {fmtQty(o.plannedQty)} {o.unit}</span></span>
                : <span className="whitespace-nowrap">{fmtQty(o.plannedQty)} {o.unit}</span>) },
            { key: 'status', label: t('pr_col_status'), render: o => <StatusBadge status={o.status} t={t} /> },
            ...(hasCost ? [
              { key: 'unit', label: t('pr_col_unit_cost'), align: 'right', sortValue: o => o.unitCost, render: o => (o.status === 'done' ? formatNumber(o.unitCost) : '—') },
              { key: 'total', label: t('pr_col_total_cost'), align: 'right', optional: true, sortValue: o => o.totalCost, render: o => (o.status === 'done' ? formatNumber(o.totalCost) : '—') },
            ] : []),
            { key: 'defect', label: t('pr_defect_short'), align: 'right', optional: true, render: o => (o.defectQty > 0 ? fmtQty(o.defectQty) : '—') },
            { key: 'sex', label: t('pr_f_sex'), optional: true, render: o => o.shopName || '—' },
            { key: 'lot', label: t('pr_f_lot'), optional: true, render: o => o.lotNo || '—' },
            { key: 'by', label: t('pr_col_author'), optional: true, render: o => o.createdByName || '—' },
          ]} />
      )}
    </div>
  )
}

export default OrdersTab
