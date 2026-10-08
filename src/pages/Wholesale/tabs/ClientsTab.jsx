import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, UserPlus } from 'lucide-react'
import DataTable from '../../../components/ui/DataTable'
import { Badge } from '../../../components/ui/Kit'
import { useAuthStore } from '../../../store/authStore'
import { useDataStore } from '../../../store/dataStore'
import { getWhClients, getWhGroups } from '../../../api/wholesaleService'
import { formatNumber, formatDate } from '../../../utils/format'
import { Spinner, inputCls, useWh } from '../components/whHelpers'
import ClientFormModal from '../components/ClientFormModal'

// Ulgurji mijozlar (dilerlar)
const ClientsTab = () => {
  const { t } = useTranslation()
  const { version } = useDataStore()
  const hasPermission = useAuthStore(s => s.hasPermission)
  const wh = useWh()
  const [clients, setClients] = useState(null)
  const [groups, setGroups] = useState([])
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    getWhClients().then(setClients).catch(() => setClients([]))
    getWhGroups().then(setGroups).catch(() => {})
  }, [version])

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return (clients || []).filter(c => !s || `${c.name} ${c.contactPerson} ${c.phone} ${c.inn}`.toLowerCase().includes(s))
  }, [clients, q])
  const groupName = (id) => groups.find(g => g.id === id)?.name || '—'

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('wh_search_clients')} className={inputCls + ' pl-10'} />
        </div>
        {hasPermission('wholesale.clients') && (
          <button onClick={() => setAdding(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl g-brand text-white font-bold"><UserPlus size={18} />{t('wh_new_client')}</button>
        )}
      </div>
      {!clients ? <Spinner /> : (
        <DataTable tableId="wh_clients" rows={rows} onRowClick={r => wh.openClient(r.id)} empty={t('wh_no_clients')} resetKey={q}
          rowClass={r => (r.isActive ? '' : 'opacity-60')}
          mobileCard={r => (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-text-primary truncate">{r.name}</p>
                <p className="text-sm text-text-muted truncate">{r.phone || r.contactPerson || '—'}</p>
              </div>
              <span className={`font-bold whitespace-nowrap ${r.debt > 0 ? 'text-accent-red' : 'text-text-muted'}`}>{formatNumber(r.debt)}</span>
            </div>
          )}
          columns={[
            { key: 'name', label: t('wh_f_name'), sortValue: r => r.name, render: r => (
              <div><p className="font-semibold flex items-center gap-2">{r.name}{!r.isActive && <Badge>{t('wh_inactive')}</Badge>}</p>
                {r.contactPerson && <p className="text-sm text-text-muted">{r.contactPerson}</p>}</div>
            ) },
            { key: 'phone', label: t('wh_f_phone'), render: r => r.phone || '—' },
            { key: 'group', label: t('wh_f_group'), optional: true, render: r => groupName(r.priceGroupId) },
            { key: 'debt', label: t('wh_col_debt'), align: 'right', sortValue: r => r.debt, render: r => <b className={r.debt > 0 ? 'text-accent-red' : 'text-text-muted'}>{formatNumber(r.debt)}</b> },
            { key: 'cons', label: t('wh_col_consigned'), align: 'right', sortValue: r => r.consignedValue, render: r => (r.consignedQty ? `${r.consignedQty} · ${formatNumber(r.consignedValue)}` : '—') },
            { key: 'limit', label: t('wh_f_limit'), align: 'right', optional: true, render: r => (r.creditLimit ? formatNumber(r.creditLimit) : '—') },
            { key: 'days', label: t('wh_f_days'), align: 'right', optional: true, render: r => r.paymentDays || '—' },
            { key: 'inn', label: t('wh_f_inn'), optional: true, render: r => r.inn || '—' },
            { key: 'last', label: t('wh_col_last_doc'), optional: true, sortValue: r => r.lastDocAt || '', render: r => (r.lastDocAt ? formatDate(r.lastDocAt) : '—') },
          ]} />
      )}
      <ClientFormModal open={adding} onClose={() => setAdding(false)} onSaved={(c) => { setAdding(false); wh.openClient(c.id) }} />
    </div>
  )
}

export default ClientsTab
