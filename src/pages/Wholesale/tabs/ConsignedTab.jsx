import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PackageOpen, Users } from 'lucide-react'
import DataTable from '../../../components/ui/DataTable'
import { Segmented } from '../../../components/ui/Kit'
import { HeroStat } from '../../../components/charts/Charts'
import { useDataStore } from '../../../store/dataStore'
import { getWhDocs, getWhClients } from '../../../api/wholesaleService'
import { formatNumber, formatDate } from '../../../utils/format'
import { Spinner, useWh } from '../components/whHelpers'

// Dilerlardagi tovar (konsignatsiya): hali sotilmagan yoki qaytmagan qism
const ConsignedTab = () => {
  const { t } = useTranslation()
  const { version } = useDataStore()
  const wh = useWh()
  const [view, setView] = useState('clients')
  const [docs, setDocs] = useState(null)
  const [clients, setClients] = useState(null)

  useEffect(() => {
    getWhDocs({ kind: 'consignment' }).then(setDocs).catch(() => setDocs([]))
    getWhClients().then(setClients).catch(() => setClients([]))
  }, [version])

  const open = useMemo(() => (docs || []).filter(d => d.consignedLeft > 0), [docs])
  const byClient = useMemo(() => (clients || []).filter(c => c.consignedQty > 0), [clients])
  const qty = byClient.reduce((s, c) => s + c.consignedQty, 0)
  const value = byClient.reduce((s, c) => s + c.consignedValue, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <HeroStat gradient="violet" icon={PackageOpen} label={t('wh_ov_consigned')} value={formatNumber(value)} unit={t('unit_som')} sub={t('wh_qty_n', { n: qty })} />
        <HeroStat gradient="cyan" icon={Users} label={t('wh_cons_dealers')} value={byClient.length} sub={t('wh_cons_docs_n', { n: open.length })} />
      </div>
      <p className="text-sm text-text-muted">{t('wh_cons_hint')}</p>
      <Segmented value={view} onChange={setView} options={[
        { id: 'clients', label: t('wh_cons_by_client'), count: byClient.length },
        { id: 'docs', label: t('wh_cons_by_doc'), count: open.length },
      ]} />
      {!docs || !clients ? <Spinner /> : view === 'clients' ? (
        <DataTable tableId="wh_cons_clients" rows={byClient} onRowClick={r => wh.openClient(r.id)} empty={t('wh_cons_none')} initialSort={{ key: 'value', dir: 'desc' }}
          columns={[
            { key: 'name', label: t('wh_f_client'), sortValue: r => r.name, render: r => <span className="font-semibold">{r.name}</span> },
            { key: 'qty', label: t('wh_col_qty'), align: 'right', sortValue: r => r.consignedQty, render: r => r.consignedQty },
            { key: 'value', label: t('wh_col_value'), align: 'right', sortValue: r => r.consignedValue, render: r => <b>{formatNumber(r.consignedValue)}</b> },
            { key: 'debt', label: t('wh_col_debt'), align: 'right', optional: true, render: r => formatNumber(r.debt) },
          ]} />
      ) : (
        <DataTable tableId="wh_cons_docs" rows={open} onRowClick={r => wh.openDoc(r.id)} empty={t('wh_cons_none')}
          columns={[
            { key: 'no', label: t('wh_col_no'), sortValue: r => Number(r.id), render: r => <span className="font-semibold">{r.no}</span> },
            { key: 'date', label: t('wh_col_date'), sortValue: r => r.createdAt, render: r => formatDate(r.createdAt) },
            { key: 'client', label: t('wh_f_client'), sortValue: r => r.clientName, render: r => r.clientName },
            { key: 'left', label: t('wh_cons_left'), align: 'right', sortValue: r => r.consignedLeft, render: r => <b>{r.consignedLeft} / {r.qty}</b> },
            { key: 'total', label: t('wh_total'), align: 'right', optional: true, render: r => formatNumber(r.total) },
            { key: 'shop', label: t('wh_col_shop'), optional: true, render: r => r.shopName || '—' },
          ]} />
      )}
    </div>
  )
}

export default ConsignedTab
