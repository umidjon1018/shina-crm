import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, Pencil, FileText, PackageOpen, Wallet, Printer, Trash2 } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import DataTable from '../../../components/ui/DataTable'
import PeriodFilter from '../../../components/ui/PeriodFilter'
import { DetailGrid, Segmented } from '../../../components/ui/Kit'
import { toast, errorText } from '../../../components/ui/Toast'
import { useAuthStore } from '../../../store/authStore'
import { useDataStore } from '../../../store/dataStore'
import { useSettingsStore } from '../../../store/settingsStore'
import { presetRange } from '../../../utils/period'
import {
  getWhClients, getWhGroups, getWhDocs, getWhStatement, getWhPayments, getWhClientPrices, setWhClientPrice, getWhProducts,
} from '../../../api/wholesaleService'
import { formatNumber, formatDate, formatDateTime } from '../../../utils/format'
import { KindBadge, PayBadge, Spinner, inputCls, som, sizeOf, methodLabel, printStatement, useWh } from './whHelpers'
import ClientFormModal from './ClientFormModal'

const StatementView = ({ client }) => {
  const { t } = useTranslation()
  const { version } = useDataStore()
  const company = useSettingsStore(s => s.companyName)
  const [preset, setPreset] = useState('all')
  const [range, setRange] = useState(() => presetRange('all'))
  const [st, setSt] = useState(null)
  useEffect(() => { getWhStatement(client.id, range).then(setSt).catch(() => setSt(null)) }, [client.id, range.from, range.to, version])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PeriodFilter size="sm" preset={preset} range={range} presets={['month', 'last_month', 'year']} onChange={(p, r) => { setPreset(p); setRange(r) }} />
        {st && <button onClick={() => printStatement(t, st, company)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-[15px] font-semibold hover:bg-bg-tertiary"><Printer size={17} />{t('wh_print')}</button>}
      </div>
      {!st ? <Spinner /> : (
        <div className="bg-bg-secondary border border-border rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-bg-tertiary">
              <tr className="text-xs font-bold text-text-muted uppercase tracking-wide">
                <th className="px-4 py-3 text-left">{t('wh_col_date')}</th>
                <th className="px-4 py-3 text-left">{t('wh_col_operation')}</th>
                <th className="px-4 py-3 text-right">{t('wh_st_debit')}</th>
                <th className="px-4 py-3 text-right">{t('wh_st_credit')}</th>
                <th className="px-4 py-3 text-right">{t('wh_st_balance')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-[15px]">
              <tr className="bg-bg-tertiary/40"><td className="px-4 py-2.5 font-semibold" colSpan={4}>{t('wh_st_opening')}</td><td className="px-4 py-2.5 text-right font-bold">{formatNumber(st.opening)}</td></tr>
              {st.rows.map((r, i) => (
                <tr key={i}>
                  <td className="px-4 py-2.5 whitespace-nowrap">{formatDate(r.at)}</td>
                  <td className="px-4 py-2.5">{t('wh_st_' + r.type)} <span className="text-text-muted">{r.ref}{r.type === 'payment' && r.note ? ' · ' + methodLabel(t, r.note) : ''}</span></td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">{r.debit ? formatNumber(r.debit) : ''}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap text-accent-green">{r.credit ? formatNumber(r.credit) : ''}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap font-semibold">{formatNumber(r.balance)}</td>
                </tr>
              ))}
              {!st.rows.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-text-muted">{t('wh_empty_period')}</td></tr>}
              <tr className="bg-bg-tertiary/40 font-bold">
                <td className="px-4 py-2.5" colSpan={2}>{t('wh_st_turnover')}</td>
                <td className="px-4 py-2.5 text-right">{formatNumber(st.debit)}</td>
                <td className="px-4 py-2.5 text-right">{formatNumber(st.credit)}</td>
                <td className="px-4 py-2.5 text-right">{formatNumber(st.closing)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <p className="text-sm text-text-muted">{t('wh_st_hint')}</p>
    </div>
  )
}

const PricesView = ({ client, canEdit }) => {
  const { t } = useTranslation()
  const [rows, setRows] = useState(null)
  const [products, setProducts] = useState([])
  const [pid, setPid] = useState('')
  const [price, setPrice] = useState('')
  const load = () => getWhClientPrices(client.id).then(setRows).catch(() => setRows([]))
  useEffect(() => { load(); if (canEdit) getWhProducts({ clientId: client.id }).then(setProducts).catch(() => {}) }, [client.id])

  const save = async (productId, value) => {
    try { await setWhClientPrice(client.id, productId, value); toast(t('wh_price_saved')); setPid(''); setPrice(''); load() }
    catch (e) { toast(errorText(e, t('exp_err_generic')), 'error') }
  }
  const prod = products.find(p => p.id === pid)

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-muted">{t('wh_client_prices_hint')}</p>
      {canEdit && (
        <div className="panel p-3 flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[200px]">
            <select value={pid} onChange={e => { setPid(e.target.value); setPrice('') }} className={inputCls}>
              <option value="">{t('wh_choose_product')}</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} {sizeOf(p.name, p.size)}</option>)}
            </select>
            {prod && <p className="text-xs text-text-muted mt-1">{t('wh_now_price')}: {formatNumber(prod.price)} ({t('wh_src_' + prod.priceSource)})</p>}
          </div>
          <input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder={t('wh_col_price')} className={inputCls + ' w-40'} />
          <button disabled={!pid || price === ''} onClick={() => save(pid, Number(price))} className="px-5 py-2.5 rounded-xl g-brand text-white font-bold disabled:opacity-50">{t('wh_save')}</button>
        </div>
      )}
      {!rows ? <Spinner /> : (
        <DataTable tableId="wh_client_prices" rows={rows} rowKey={r => r.productId} empty={t('wh_no_client_prices')}
          columns={[
            { key: 'name', label: t('wh_col_product'), render: r => <><p className="font-semibold">{r.name}</p><p className="text-sm text-text-muted">{sizeOf(r.name, r.size)}</p></>, sortValue: r => r.name },
            { key: 'wholesalePrice', label: t('wh_col_wh_price'), align: 'right', render: r => (r.wholesalePrice === null ? '—' : formatNumber(r.wholesalePrice)) },
            { key: 'price', label: t('wh_col_client_price'), align: 'right', render: r => <b>{formatNumber(r.price)}</b>, sortValue: r => r.price },
            ...(canEdit ? [{ key: 'del', label: '', align: 'right', render: r => (
              <button onClick={(e) => { e.stopPropagation(); save(r.productId, null) }} title={t('wh_remove')}
                className="w-9 h-9 rounded-lg inline-flex items-center justify-center text-text-muted hover:text-accent-red hover:bg-accent-red/10"><Trash2 size={16} /></button>
            ) }] : []),
          ]} />
      )}
    </div>
  )
}

// Diler profili: ma'lumotlar, hujjatlar, akt sverka, individual narxlar, to'lovlar
const ClientProfileModal = ({ clientId, onClose }) => {
  const { t } = useTranslation()
  const { version } = useDataStore()
  const hasPermission = useAuthStore(s => s.hasPermission)
  const wh = useWh()
  const [client, setClient] = useState(null)
  const [groups, setGroups] = useState([])
  const [tab, setTab] = useState('docs')
  const [docs, setDocs] = useState(null)
  const [pays, setPays] = useState(null)
  const [edit, setEdit] = useState(false)

  const canDebts = hasPermission('wholesale.debts') || hasPermission('wholesale.clients')
  useEffect(() => {
    if (!clientId) return
    getWhClients().then(l => setClient(l.find(c => c.id === clientId) || null)).catch(() => {})
    getWhGroups().then(setGroups).catch(() => {})
    getWhDocs({ clientId }).then(setDocs).catch(() => setDocs([]))
    if (canDebts) getWhPayments(clientId).then(setPays).catch(() => setPays([]))
  }, [clientId, version])
  useEffect(() => { setTab('docs') }, [clientId])

  const group = groups.find(g => g.id === client?.priceGroupId)
  const tabs = useMemo(() => [
    { id: 'docs', label: t('wh_tab_docs'), count: docs?.length },
    canDebts && { id: 'statement', label: t('wh_statement') },
    canDebts && { id: 'payments', label: t('wh_payments'), count: pays?.length },
    { id: 'prices', label: t('wh_client_prices') },
  ].filter(Boolean), [t, docs, pays, canDebts])

  return (
    <Modal open={!!clientId} onClose={onClose} size="xl" icon={Building2} title={client?.name || '...'}
      subtitle={client ? [client.contactPerson, client.phone].filter(Boolean).join(' · ') : ''}
      actions={client && hasPermission('wholesale.clients') && (
        <button onClick={() => setEdit(true)} title={t('wh_edit_client')} className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-tertiary"><Pencil size={19} /></button>
      )}
      bodyClass="p-3 sm:p-6 bg-bg-primary">
      {!client ? <Spinner /> : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {hasPermission('wholesale.docs') && client.isActive && <>
              <button onClick={() => wh.newDoc('sale', client.id)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl g-brand text-white font-bold"><FileText size={18} />{t('wh_new_sale')}</button>
              <button onClick={() => wh.newDoc('consignment', client.id)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border font-bold text-text-primary hover:bg-bg-tertiary"><PackageOpen size={18} />{t('wh_new_consignment')}</button>
            </>}
            {hasPermission('wholesale.debts') && client.debt > 0 && (
              <button onClick={() => wh.pay(client.id)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-green text-white font-bold"><Wallet size={18} />{t('wh_accept_payment')}</button>
            )}
          </div>
          <DetailGrid cols={3} items={[
            { label: t('wh_col_debt'), value: <span className={client.debt > 0 ? 'text-accent-red' : 'text-accent-green'}>{som(t, client.debt)}</span> },
            { label: t('wh_col_consigned'), value: client.consignedQty ? `${t('wh_qty_n', { n: client.consignedQty })} · ${som(t, client.consignedValue)}` : '—' },
            { label: t('wh_f_group'), value: group ? `${group.name} (−${group.discountPercent}%)` : t('wh_no_group') },
            { label: t('wh_f_limit'), value: client.creditLimit > 0 ? som(t, client.creditLimit) : t('wh_no_limit') },
            { label: t('wh_f_days'), value: client.paymentDays > 0 ? t('wh_days_n', { n: client.paymentDays }) : '—' },
            { label: t('wh_f_inn'), value: client.inn || '—' },
            client.address && { label: t('wh_f_address'), value: client.address },
            client.notes && { label: t('wh_f_notes'), value: client.notes },
            !client.isActive && { label: t('wh_f_active'), value: <span className="text-accent-red">{t('wh_inactive')}</span> },
          ]} />
          <Segmented value={tab} onChange={setTab} options={tabs} />
          {tab === 'docs' && (!docs ? <Spinner /> : (
            <DataTable tableId="wh_client_docs" rows={docs} onRowClick={r => wh.openDoc(r.id)} empty={t('wh_no_docs')}
              columns={[
                { key: 'no', label: t('wh_col_no'), render: r => <span className="flex flex-wrap items-center gap-2 font-semibold">{r.no} <KindBadge kind={r.kind} t={t} /></span>, sortValue: r => Number(r.id) },
                { key: 'date', label: t('wh_col_date'), render: r => formatDateTime(r.createdAt), sortValue: r => r.createdAt },
                { key: 'qty', label: t('wh_col_qty'), align: 'right', render: r => r.kind === 'consignment' ? `${r.consignedLeft} / ${r.qty}` : r.qty },
                { key: 'total', label: t('wh_total'), align: 'right', render: r => formatNumber(r.total), sortValue: r => r.total },
                { key: 'balance', label: t('wh_col_balance'), align: 'right', render: r => (r.balance === undefined ? '' : formatNumber(r.balance)), sortValue: r => r.balance || 0 },
                { key: 'status', label: t('wh_col_status'), render: r => <PayBadge status={r.payStatus} t={t} /> },
                { key: 'due', label: t('wh_due_date'), optional: true, render: r => (r.dueDate ? formatDate(r.dueDate) : '—') },
              ]} />
          ))}
          {tab === 'statement' && <StatementView client={client} />}
          {tab === 'payments' && (!pays ? <Spinner /> : (
            <DataTable tableId="wh_client_pays" rows={pays} empty={t('wh_no_payments')}
              columns={[
                { key: 'date', label: t('wh_col_date'), render: r => formatDateTime(r.createdAt), sortValue: r => r.createdAt },
                { key: 'amount', label: t('wh_f_amount'), align: 'right', render: r => <b className="text-accent-green">{formatNumber(r.amount)}</b>, sortValue: r => r.amount },
                { key: 'method', label: t('wh_col_method'), render: r => methodLabel(t, r.method) },
                { key: 'doc', label: t('wh_col_doc'), render: r => (r.docId ? <button onClick={() => wh.openDoc(r.docId)} className="text-accent-blue hover:underline">{r.docNo}</button> : '—') },
                { key: 'by', label: t('wh_col_author'), optional: true, render: r => r.createdByName || '—' },
                { key: 'note', label: t('wh_f_notes'), optional: true, render: r => r.note || '—' },
              ]} />
          ))}
          {tab === 'prices' && <PricesView client={client} canEdit={hasPermission('wholesale.prices')} />}
        </div>
      )}
      <ClientFormModal open={edit} client={client} onClose={() => setEdit(false)} onSaved={() => setEdit(false)} />
    </Modal>
  )
}

export default ClientProfileModal
