import React, { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle2, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getSmsMessages, sendPersonalSms } from '../../../api/marketingService'
import { fmtDT } from '../../Marketing/components/mkHelpers'
import { smsSegments } from '../../Marketing/tabs/SmsTab'

const STATUS_CLS = {
  sent: 'text-accent-green', test: 'text-accent-blue', failed: 'text-accent-red', pending: 'text-text-muted',
}

const CustomerSmsTab = ({ customer }) => {
  const { t } = useTranslation()
  const [list, setList] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState(null)

  const load = () => getSmsMessages({ customer_id: customer.id }).then(setList).catch(() => setList([]))
  useEffect(() => { load() }, [customer.id])

  const send = async () => {
    if (!text.trim()) return
    setSending(true); setMsg(null)
    try {
      const r = await sendPersonalSms({ customer_id: customer.id, text })
      setMsg({ text: r.status === 'test' ? t('mkt_set_test_logged') : t('mkt_cust_sms_sent') })
      setText('')
      load()
    } catch (e) {
      setMsg({ err: true, text: e?.response?.data?.error || t('exp_err_generic') })
    } finally { setSending(false) }
  }

  const info = smsSegments(text)
  return (
    <div className="space-y-4">
      <div className="bg-bg-secondary border border-border rounded-2xl p-4 space-y-2">
        <p className="text-sm font-bold text-text-primary">{t('mkt_cust_sms_title', { phone: customer.phone || '—' })}</p>
        <textarea rows={3} value={text} onChange={e => setText(e.target.value)} placeholder={t('mkt_sms_text_ph')}
          className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-red resize-none" />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-text-muted">{t('mkt_sms_len', { len: info.len, parts: info.parts })}</span>
          <button onClick={send} disabled={sending || !text.trim() || !customer.phone}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-red text-white text-sm font-semibold disabled:opacity-40">
            <Send size={14} /> {sending ? '...' : t('mkt_sms_send_one')}
          </button>
        </div>
        {msg && (
          <p className={`flex items-center gap-1.5 text-xs ${msg.err ? 'text-accent-red' : 'text-accent-green'}`}>
            {msg.err ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />} {msg.text}
          </p>
        )}
      </div>
      <div className="space-y-2">
        {list.length === 0 && <p className="text-sm text-text-muted text-center py-6">{t('mkt_cust_sms_empty')}</p>}
        {list.map(m => (
          <div key={m.id} className="bg-bg-secondary border border-border rounded-xl px-4 py-3">
            <div className="flex items-center justify-between gap-2 text-[11px] mb-1">
              <span className="text-text-muted">{fmtDT(m.created_at)} · {t('mkt_sms_type_' + m.type)} · {m.created_by_name || '—'}</span>
              <span className={`font-bold ${STATUS_CLS[m.status] || ''}`}>{t('mkt_sms_status_' + m.status)}</span>
            </div>
            <p className="text-sm text-text-primary whitespace-pre-wrap">{m.text}</p>
            {m.error && <p className="text-[11px] text-accent-red mt-1">{m.error}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default CustomerSmsTab
