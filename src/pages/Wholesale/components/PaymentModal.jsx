import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Wallet } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import { toast, errorText } from '../../../components/ui/Toast'
import { useDataStore } from '../../../store/dataStore'
import { getWhClients, createWhPayment } from '../../../api/wholesaleService'
import { formatNumber } from '../../../utils/format'
import { inputCls, labelCls, MethodPicker, som } from './whHelpers'

// Diler to'lovi: hujjatga biriktirilsa avval o'sha hujjat yopiladi, qolgani eng eski qarzdan
const PaymentModal = ({ open, clientId: presetClient, docId, amount: presetAmount, onClose }) => {
  const { t } = useTranslation()
  const { bump } = useDataStore()
  const [clients, setClients] = useState([])
  const [clientId, setClientId] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!open) return
    setClientId(presetClient || ''); setMethod('cash'); setNote(''); setErr('')
    setAmount(presetAmount ? String(Math.round(presetAmount)) : '')
    getWhClients().then(setClients).catch(() => setClients([]))
  }, [open])

  const client = clients.find(c => c.id === clientId)
  useEffect(() => {
    if (open && client && !presetAmount && !amount && client.debt > 0) setAmount(String(Math.round(client.debt)))
  }, [client?.id])

  const submit = async () => {
    setErr('')
    if (!clientId) return setErr(t('wh_err_client'))
    if (!(Number(amount) > 0)) return setErr(t('wh_err_amount'))
    setSaving(true)
    try {
      await createWhPayment({ client_id: clientId, amount: Number(amount), method, doc_id: docId || undefined, note: note || undefined })
      toast(t('wh_payment_saved'))
      bump()
      onClose()
    } catch (e) { setErr(errorText(e, t('exp_err_generic'))) } finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} size="sm" icon={Wallet} title={t('wh_accept_payment')}
      footer={
        <div className="space-y-2">
          {err && <div className="text-sm text-accent-red bg-accent-red/10 px-3 py-2.5 rounded-xl">{err}</div>}
          <button onClick={submit} disabled={saving} className="w-full py-3 rounded-xl g-brand text-white font-bold disabled:opacity-50">{saving ? '...' : t('wh_confirm')}</button>
        </div>
      }>
      <div className="space-y-4">
        <div>
          <label className={labelCls}>{t('wh_f_client')}</label>
          <select value={clientId} onChange={e => { setClientId(e.target.value); setAmount('') }} disabled={!!presetClient} className={inputCls}>
            <option value="">{t('wh_choose')}</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.debt > 0 ? ` · ${formatNumber(c.debt)}` : ''}</option>)}
          </select>
          {client && <p className="text-sm text-text-muted mt-1.5">{t('wh_col_debt')}: <b className={client.debt > 0 ? 'text-accent-red' : 'text-text-primary'}>{som(t, client.debt)}</b></p>}
        </div>
        <div>
          <label className={labelCls}>{t('wh_f_amount')}</label>
          <input type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} className={inputCls + ' text-lg font-bold'} />
        </div>
        <MethodPicker value={method} onChange={setMethod} t={t} />
        <div>
          <label className={labelCls}>{t('wh_f_notes')}</label>
          <input value={note} onChange={e => setNote(e.target.value)} className={inputCls} />
        </div>
      </div>
    </Modal>
  )
}

export default PaymentModal
