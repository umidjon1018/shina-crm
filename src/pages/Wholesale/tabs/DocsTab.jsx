import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import DataTable from '../../../components/ui/DataTable'
import { Segmented } from '../../../components/ui/Kit'
import { useDataStore } from '../../../store/dataStore'
import { getWhDocs } from '../../../api/wholesaleService'
import { formatNumber, formatDate, formatDateTime } from '../../../utils/format'
import { KindBadge, PayBadge, Spinner, inputCls, useWh } from '../components/whHelpers'

const GROUPS = { all: null, sale: ['sale', 'cons_sale'], consignment: ['consignment'], return: ['return', 'cons_return'] }

// Ulgurji hujjatlar ro'yxati (sahifaning asosiy ko'rinishi)
const DocsTab = ({ range, shopId }) => {
  const { t } = useTranslation()
  const { version } = useDataStore()
  const wh = useWh()
  const [docs, setDocs] = useState(null)
  const [group, setGroup] = useState('all')
  const [q, setQ] = useState('')

  useEffect(() => { getWhDocs({ ...range, shopId }).then(setDocs).catch(() => setDocs([])) }, [range.from, range.to, shopId, version])

  const rows = useMemo(() => {
    const kinds = GROUPS[group]
    const s = q.trim().toLowerCase()
    return (docs || []).filter(d => (!kinds || kinds.includes(d.kind)) && (!s || `${d.no} ${d.clientName}`.toLowerCase().includes(s)))
  }, [docs, group, q])
  const count = (g) => (docs || []).filter(d => !GROUPS[g] || GROUPS[g].includes(d.kind)).length

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented value={group} onChange={setGroup}
          options={Object.keys(GROUPS).map(g => ({ id: g, label: t('wh_grp_' + g), count: docs ? count(g) : undefined }))} />
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('wh_search_docs')} className={inputCls + ' pl-10'} />
        </div>
      </div>
      {!docs ? <Spinner /> : (
        <DataTable tableId="wh_docs" rows={rows} onRowClick={r => wh.openDoc(r.id)} empty={t('wh_no_docs')} resetKey={group + q}
          mobileCard={r => (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-bold text-text-primary">{r.no} <KindBadge kind={r.kind} t={t} /></span>
                <span className="font-bold whitespace-nowrap">{formatNumber(r.total)}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm text-text-muted">
                <span className="truncate">{r.clientName} · {formatDate(r.createdAt)}</span>
                <PayBadge status={r.payStatus} t={t} />
              </div>
            </div>
          )}
          columns={[
            { key: 'no', label: t('wh_col_no'), render: r => <span className="flex flex-wrap items-center gap-2 font-semibold whitespace-nowrap">{r.no} <KindBadge kind={r.kind} t={t} /></span>, sortValue: r => Number(r.id) },
            { key: 'date', label: t('wh_col_date'), render: r => <span className="whitespace-nowrap">{formatDateTime(r.createdAt)}</span>, sortValue: r => r.createdAt },
            { key: 'client', label: t('wh_f_client'), render: r => r.clientName, sortValue: r => r.clientName },
            { key: 'shop', label: t('wh_col_shop'), optional: true, render: r => r.shopName || '—' },
            { key: 'qty', label: t('wh_col_qty'), align: 'right', render: r => (r.kind === 'consignment' ? `${r.consignedLeft} / ${r.qty}` : r.qty), sortValue: r => r.qty },
            { key: 'total', label: t('wh_total'), align: 'right', render: r => <b className="whitespace-nowrap">{formatNumber(r.total)}</b>, sortValue: r => r.total },
            { key: 'paid', label: t('wh_col_paid'), align: 'right', optional: true, render: r => (r.paid === undefined ? '' : formatNumber(r.paid)) },
            { key: 'balance', label: t('wh_col_balance'), align: 'right', render: r => (r.balance === undefined ? '' : <span className={r.balance > 0 ? 'text-accent-red font-semibold' : ''}>{formatNumber(r.balance)}</span>), sortValue: r => r.balance || 0 },
            { key: 'status', label: t('wh_col_status'), render: r => <PayBadge status={r.payStatus} t={t} /> },
            { key: 'due', label: t('wh_due_date'), optional: true, render: r => (r.dueDate ? formatDate(r.dueDate) : '—'), sortValue: r => r.dueDate || '' },
            { key: 'profit', label: t('wh_col_profit'), align: 'right', optional: true, render: r => (r.costTotal === undefined || !['sale', 'cons_sale'].includes(r.kind) ? '' : formatNumber(r.total - r.costTotal)) },
            { key: 'by', label: t('wh_col_author'), optional: true, render: r => r.createdByName || '—' },
          ]} />
      )}
    </div>
  )
}

export default DocsTab
