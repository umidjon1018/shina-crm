import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, X, Send, Loader2 } from 'lucide-react'
import { Segmented, Badge } from '../../../components/ui/Kit'
import { useAuthStore } from '../../../store/authStore'
import { useDataStore } from '../../../store/dataStore'
import { useShopStore } from '../../../store/shopStore'
import { getWhOrders, confirmWhOrder, rejectWhOrder } from '../../../api/wholesaleService'
import { formatNumber, formatDateTime } from '../../../utils/format'
import { Spinner, inputCls, useWh } from '../components/whHelpers'

const STATUS_COLOR = {
  pending: 'bg-accent-orange/15 text-accent-orange', confirming: 'bg-accent-orange/15 text-accent-orange',
  confirmed: 'bg-accent-green/15 text-accent-green', rejected: 'bg-accent-red/15 text-accent-red',
}

// Diler Telegram botda bergan buyurtma — boshqaruvchi/admin tasdiqlaydi (sotuv hujjati) yoki rad etadi
const OrderCard = ({ o, shops, onDone }) => {
  const { t } = useTranslation()
  const wh = useWh()
  const canDocs = useAuthStore(s => s.hasPermission('wholesale.docs'))
  const [shopId, setShopId] = useState(shops.find(s => s.kind === 'wholesale')?.id || shops[0]?.id || '')
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null) // { text, code }
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')

  const confirm = async (force = false) => {
    setBusy('confirm'); setError(null)
    try {
      const r = await confirmWhOrder(o.id, { shop_id: shopId, force })
      onDone()
      wh.openDoc(r.docId)
    } catch (err) {
      setError({ text: err?.response?.data?.error || t('wh_order_error'), code: err?.response?.data?.code })
    } finally { setBusy(null) }
  }
  const reject = async () => {
    setBusy('reject'); setError(null)
    try { await rejectWhOrder(o.id, { reason }); setRejecting(false); onDone() }
    catch (err) { setError({ text: err?.response?.data?.error || t('wh_order_error') }) }
    finally { setBusy(null) }
  }
  const pending = o.status === 'pending' || o.status === 'confirming'

  return (
    <div className="panel p-4 sm:p-5 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-bold text-text-primary">#{o.id} · <button className="hover:underline" onClick={() => wh.openClient(o.clientId)}>{o.clientName}</button></p>
          <p className="text-xs text-text-muted">{formatDateTime(o.createdAt)}{o.clientPhone ? ` · ${o.clientPhone}` : ''} · Telegram</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge color={STATUS_COLOR[o.status]}>{t('wh_order_' + (o.status === 'confirming' ? 'pending' : o.status))}</Badge>
          {o.docNo && <button onClick={() => wh.openDoc(o.docId)} className="text-xs font-bold text-accent-blue hover:underline">{o.docNo}</button>}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            {o.lines.map((l, i) => (
              <tr key={i} className="border-t border-border first:border-0">
                <td className="py-1.5 pr-2 text-text-primary">{l.name}</td>
                <td className="py-1.5 px-2 text-right whitespace-nowrap">{formatNumber(l.qty)} × {formatNumber(l.price)}</td>
                <td className="py-1.5 pl-2 text-right font-semibold whitespace-nowrap">{formatNumber(l.qty * l.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-text-muted">
          {o.clientDebt !== undefined && <>{t('wh_order_debt')}: <b className="text-text-primary">{formatNumber(o.clientDebt)}</b>{o.creditLimit > 0 ? ` / ${formatNumber(o.creditLimit)}` : ''}</>}
        </span>
        <span className="font-bold text-text-primary">{t('wh_total')}: {formatNumber(o.total)} {t('unit_som')}</span>
      </div>
      {o.status === 'rejected' && o.rejectReason && <p className="text-sm text-accent-red">{o.rejectReason}</p>}
      {o.decidedByName && !pending && <p className="text-xs text-text-muted">{o.decidedByName} · {formatDateTime(o.decidedAt)}</p>}

      {pending && canDocs && (
        <div className="space-y-2 pt-1">
          {rejecting ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <input className={inputCls} placeholder={t('wh_order_reject_reason')} value={reason} onChange={e => setReason(e.target.value)} maxLength={300} />
              <div className="flex gap-2">
                <button disabled={!!busy} onClick={reject} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent-red text-white font-bold disabled:opacity-50 whitespace-nowrap">
                  {busy === 'reject' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} {t('wh_order_reject')}
                </button>
                <button onClick={() => setRejecting(false)} className="px-4 py-2.5 rounded-xl panel font-bold">{t('cancel')}</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <select className={`${inputCls} sm:max-w-xs`} value={shopId} onChange={e => setShopId(e.target.value)}>
                {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="flex gap-2">
                <button disabled={!!busy || !shopId} onClick={() => confirm(false)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl g-brand text-white font-bold disabled:opacity-50 whitespace-nowrap">
                  {busy === 'confirm' ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} {t('wh_order_confirm')}
                </button>
                <button disabled={!!busy} onClick={() => setRejecting(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl panel font-bold text-accent-red whitespace-nowrap"><X size={16} /> {t('wh_order_reject')}</button>
              </div>
            </div>
          )}
          {error && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-accent-red">
              <span>{error.text}</span>
              {error.code === 'CREDIT_LIMIT' && (
                <button disabled={!!busy} onClick={() => confirm(true)} className="px-3 py-1 rounded-lg border border-accent-red text-xs font-bold">{t('wh_order_force')}</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const OrdersTab = () => {
  const { t } = useTranslation()
  const { version, bump } = useDataStore()
  const { shops } = useShopStore()
  const [status, setStatus] = useState('pending')
  const [orders, setOrders] = useState(null)
  const active = shops.filter(s => s.isActive)

  useEffect(() => {
    getWhOrders(status === 'all' ? null : status).then(setOrders).catch(() => setOrders([]))
  }, [version, status])

  return (
    <div className="space-y-3">
      <Segmented value={status} onChange={(v) => { setOrders(null); setStatus(v) }} options={[
        { id: 'pending', label: t('wh_order_pending') },
        { id: 'confirmed', label: t('wh_order_confirmed') },
        { id: 'rejected', label: t('wh_order_rejected') },
        { id: 'all', label: t('wh_order_all') },
      ]} />
      <p className="text-sm text-text-muted">{t('wh_orders_hint')}</p>
      {!orders ? <Spinner /> : !orders.length
        ? <p className="text-sm text-text-muted py-6 text-center">{t('wh_orders_empty')}</p>
        : orders.map(o => <OrderCard key={o.id} o={o} shops={active} onDone={bump} />)}
    </div>
  )
}

export default OrdersTab
