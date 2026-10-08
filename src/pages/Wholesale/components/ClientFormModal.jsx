import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { UserPlus } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import { toast, errorText } from '../../../components/ui/Toast'
import { useDataStore } from '../../../store/dataStore'
import { getWhGroups, createWhClient, updateWhClient } from '../../../api/wholesaleService'
import { inputCls, labelCls } from './whHelpers'

const EMPTY = { name: '', contactPerson: '', phone: '', inn: '', address: '', priceGroupId: '', creditLimit: '', paymentDays: '', notes: '', isActive: true }

const ClientFormModal = ({ open, client, onClose, onSaved }) => {
  const { t } = useTranslation()
  const { bump } = useDataStore()
  const [f, setF] = useState(EMPTY)
  const [groups, setGroups] = useState([])
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!open) return
    setErr('')
    setF(client ? { ...EMPTY, ...client, priceGroupId: client.priceGroupId || '', creditLimit: client.creditLimit || '', paymentDays: client.paymentDays || '' } : EMPTY)
    getWhGroups().then(setGroups).catch(() => setGroups([]))
  }, [open])

  const set = (k) => (e) => setF(s => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const submit = async () => {
    setErr('')
    if (!f.name.trim()) return setErr(t('wh_err_name'))
    setSaving(true)
    try {
      const body = { ...f, priceGroupId: f.priceGroupId || null, creditLimit: Number(f.creditLimit) || 0, paymentDays: Number(f.paymentDays) || 0 }
      const saved = client ? await updateWhClient(client.id, body) : await createWhClient(body)
      toast(t('wh_client_saved'))
      bump()
      onSaved?.(saved)
    } catch (e) { setErr(errorText(e, t('exp_err_generic'))) } finally { setSaving(false) }
  }

  const field = (k, label, props = {}) => (
    <div className={props.wide ? 'sm:col-span-2' : ''}>
      <label className={labelCls}>{label}</label>
      <input value={f[k] ?? ''} onChange={set(k)} className={inputCls} {...props.input} />
      {props.hint && <p className="text-xs text-text-muted mt-1">{props.hint}</p>}
    </div>
  )

  return (
    <Modal open={open} onClose={onClose} size="md" icon={UserPlus} title={client ? t('wh_edit_client') : t('wh_new_client')}
      footer={
        <div className="space-y-2">
          {err && <div className="text-sm text-accent-red bg-accent-red/10 px-3 py-2.5 rounded-xl">{err}</div>}
          <button onClick={submit} disabled={saving} className="w-full py-3 rounded-xl g-brand text-white font-bold disabled:opacity-50">{saving ? '...' : t('wh_save')}</button>
        </div>
      }>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {field('name', t('wh_f_name') + ' *', { wide: true, input: { autoFocus: true, placeholder: t('wh_f_name_ph') } })}
        {field('contactPerson', t('wh_f_contact'))}
        {field('phone', t('wh_f_phone'), { input: { placeholder: '+998' } })}
        {field('inn', t('wh_f_inn'))}
        {field('address', t('wh_f_address'))}
        <div className="sm:col-span-2">
          <label className={labelCls}>{t('wh_f_group')}</label>
          <select value={f.priceGroupId} onChange={set('priceGroupId')} className={inputCls}>
            <option value="">{t('wh_no_group')}</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name} (−{g.discountPercent}%)</option>)}
          </select>
          <p className="text-xs text-text-muted mt-1">{t('wh_group_hint')}</p>
        </div>
        {field('creditLimit', t('wh_f_limit'), { input: { type: 'number', min: 0, placeholder: '0' }, hint: t('wh_limit_hint') })}
        {field('paymentDays', t('wh_f_days'), { input: { type: 'number', min: 0, placeholder: '0' }, hint: t('wh_days_hint') })}
        <div className="sm:col-span-2">
          <label className={labelCls}>{t('wh_f_notes')}</label>
          <textarea rows={2} value={f.notes} onChange={set('notes')} className={inputCls + ' resize-none'} />
        </div>
        {client && (
          <label className="sm:col-span-2 flex items-center gap-2.5 text-[15px] text-text-primary">
            <input type="checkbox" checked={f.isActive} onChange={set('isActive')} className="w-5 h-5 accent-[#E63946]" />{t('wh_f_active')}
          </label>
        )}
      </div>
    </Modal>
  )
}

export default ClientFormModal
