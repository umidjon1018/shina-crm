import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { HandCoins, AlertTriangle, Wallet } from 'lucide-react'
import DataTable from '../../../components/ui/DataTable'
import { Segmented } from '../../../components/ui/Kit'
import { HeroStat } from '../../../components/charts/Charts'
import { useAuthStore } from '../../../store/authStore'
import { useDataStore } from '../../../store/dataStore'
import { getWhDocs, getWhPayments, getWhClients } from '../../../api/wholesaleService'
import { formatNumber, formatDate, formatDateTime } from '../../../utils/format'
import { Spinner, methodLabel, useWh } from '../components/whHelpers'

// Dilerlar qarzi (hujjatlar bo'yicha, muddati o'tgani bilan) va to'lovlar tarixi
const DebtsTab = () => {
  const { t } = useTranslation()
  const { version } = useDataStore()
  const hasPermission = useAuthStore(s => s.hasPermission)
  const wh = useWh()
  const [view, setView] = useState('debts')
  const [docs, setDocs] = useState(null)
  const [clients, setClients] = useState([])
  const [pays, setPays] = useState(null)

  useEffect(() => {
    getWhDocs().then(setDocs).catch(() => setDocs([]))
    getWhClients().then(setClients).catch(() => {})
    getWhPayments().then(setPays).catch(() => setPays([]))
  }, [version])

  // Mijoz bo'yicha: jami qarz (mijozlar ro'yxatidan), muddati o'tgan qism va eng yaqin muddat (hujjatlardan)
  const rows = useMemo(() => {
    const by = {}
    ;(docs || []).filter(d => d.balance > 0).forEach(d => {
      const r = by[d.clientId] || (by[d.clientId] = { overdue: 0, nextDue: null, docs: 0 })
      r.docs++
      if (d.payStatus === 'overdue') r.overdue += d.balance
      if (d.dueDate && (!r.nextDue || d.dueDate < r.nextDue)) r.nextDue = d.dueDate
    })
    return clients.filter(c => c.debt > 0.009).map(c => ({ ...c, ...(by[c.id] || { overdue: 0, nextDue: null, docs: 0 }) }))
  }, [docs, clients])
  const total = rows.reduce((s, r) => s + r.debt, 0)
  const overdue = rows.reduce((s, r) => s + r.overdue, 0)
  const canPay = hasPermission('wholesale.debts')

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <HeroStat gradient="orange" icon={HandCoins} label={t('wh_ov_debt')} value={formatNumber(total)} unit={t('unit_som')} sub={t('wh_debtors_n', { n: rows.length })} />
        <HeroStat gradient="pink" icon={AlertTriangle} label={t('wh_ov_overdue')} value={formatNumber(overdue)} unit={t('unit_som')} sub={t('wh_overdue_sub')} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmented value={view} onChange={setView} options={[
          { id: 'debts', label: t('wh_debtors'), count: rows.length },
          { id: 'payments', label: t('wh_payments'), count: pays?.length },
        ]} />
        {canPay && <button onClick={() => wh.pay()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-green text-white font-bold"><Wallet size={18} />{t('wh_accept_payment')}</button>}
      </div>
      {view === 'debts' && (!docs ? <Spinner /> : (
        <DataTable tableId="wh_debts" rows={rows} onRowClick={r => wh.openClient(r.id)} empty={t('wh_no_debts')} initialSort={{ key: 'debt', dir: 'desc' }}
          columns={[
            { key: 'name', label: t('wh_f_client'), sortValue: r => r.name, render: r => <><p className="font-semibold">{r.name}</p><p className="text-sm text-text-muted">{r.phone}</p></> },
            { key: 'debt', label: t('wh_col_debt'), align: 'right', sortValue: r => r.debt, render: r => <b>{formatNumber(r.debt)}</b> },
            { key: 'overdue', label: t('wh_ov_overdue'), align: 'right', sortValue: r => r.overdue, render: r => (r.overdue > 0 ? <b className="text-accent-red">{formatNumber(r.overdue)}</b> : '—') },
            { key: 'next', label: t('wh_next_due'), sortValue: r => r.nextDue || '9', render: r => (r.nextDue ? formatDate(r.nextDue) : '—') },
            { key: 'docs', label: t('wh_col_docs'), align: 'right', optional: true, render: r => r.docs },
            { key: 'limit', label: t('wh_f_limit'), align: 'right', optional: true, render: r => (r.creditLimit ? formatNumber(r.creditLimit) : '—') },
            ...(canPay ? [{ key: 'pay', label: '', align: 'right', render: r => (
              <button onClick={(e) => { e.stopPropagation(); wh.pay(r.id) }} className="px-3 py-1.5 rounded-lg bg-accent-green/10 text-accent-green text-sm font-bold hover:bg-accent-green/20">{t('wh_pay_short')}</button>
            ) }] : []),
          ]} />
      ))}
      {view === 'payments' && (!pays ? <Spinner /> : (
        <DataTable tableId="wh_payments" rows={pays} empty={t('wh_no_payments')}
          columns={[
            { key: 'date', label: t('wh_col_date'), sortValue: r => r.createdAt, render: r => <span className="whitespace-nowrap">{formatDateTime(r.createdAt)}</span> },
            { key: 'client', label: t('wh_f_client'), sortValue: r => r.clientName, render: r => <button onClick={() => wh.openClient(r.clientId)} className="text-left hover:underline">{r.clientName}</button> },
            { key: 'amount', label: t('wh_f_amount'), align: 'right', sortValue: r => r.amount, render: r => <b className="text-accent-green">{formatNumber(r.amount)}</b> },
            { key: 'method', label: t('wh_col_method'), render: r => methodLabel(t, r.method) },
            { key: 'doc', label: t('wh_col_doc'), render: r => (r.docId ? <button onClick={() => wh.openDoc(r.docId)} className="text-accent-blue hover:underline">{r.docNo}</button> : '—') },
            { key: 'by', label: t('wh_col_author'), optional: true, render: r => r.createdByName || '—' },
            { key: 'note', label: t('wh_f_notes'), optional: true, render: r => r.note || '—' },
          ]} />
      ))}
    </div>
  )
}

export default DebtsTab
