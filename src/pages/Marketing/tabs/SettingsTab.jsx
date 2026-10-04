import React, { useState, useEffect } from 'react'
import { AlertCircle, Cake, CheckCircle2, MessageSquare, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getSmsSettings, saveSmsSettings, testSms } from '../../../api/marketingService'
import { getPromotions } from '../../../api/promotionService'

const inputCls = 'w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-red'
const Label = ({ children }) => <label className="text-text-secondary text-xs font-semibold mb-1.5 block">{children}</label>

const SettingsTab = () => {
  const { t } = useTranslation()
  const [cfg, setCfg] = useState(null)
  const [password, setPassword] = useState('')
  const [promos, setPromos] = useState([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [testPhone, setTestPhone] = useState('')
  const [testMsg, setTestMsg] = useState(null)

  useEffect(() => {
    getSmsSettings().then(setCfg).catch(e => setMsg({ err: true, text: e?.response?.data?.error || t('exp_err_generic') }))
    getPromotions().then(list => setPromos(list.filter(p => p.requiresCode))).catch(() => {})
  }, [])

  if (!cfg) return msg ? <div className="text-sm text-accent-red">{msg.text}</div> : <div className="p-10 flex justify-center"><div className="w-7 h-7 border-2 border-accent-red border-t-transparent rounded-full animate-spin" /></div>

  const set = (k, v) => setCfg(c => ({ ...c, [k]: v }))
  const setB = (k, v) => setCfg(c => ({ ...c, birthday: { ...c.birthday, [k]: v } }))

  const save = async () => {
    setSaving(true); setMsg(null)
    try {
      const r = await saveSmsSettings({ ...cfg, password: password || undefined })
      setCfg(r); setPassword('')
      setMsg({ text: t('mkt_set_saved') })
    } catch (e) { setMsg({ err: true, text: e?.response?.data?.error || t('exp_err_generic') }) }
    finally { setSaving(false) }
  }
  const doTest = async () => {
    setTestMsg(null)
    try { const r = await testSms({ phone: testPhone, text: t('mkt_set_test_text') }); setTestMsg({ text: r.status === 'test' ? t('mkt_set_test_logged') : t('mkt_set_test_sent') }) }
    catch (e) { setTestMsg({ err: true, text: e?.response?.data?.error || t('exp_err_generic') }) }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
      <div className="bg-bg-secondary border border-border rounded-2xl p-4 space-y-4">
        <h3 className="font-syne font-bold text-text-primary flex items-center gap-2"><MessageSquare size={17} className="text-accent-red" /> {t('mkt_set_sms')}</h3>
        <div>
          <Label>{t('mkt_set_provider')}</Label>
          <div className="grid grid-cols-3 gap-1.5">
            {['off', 'test', 'eskiz'].map(p => (
              <button key={p} type="button" onClick={() => set('provider', p)}
                className={`px-2 py-2 rounded-xl border text-xs font-semibold ${cfg.provider === p ? 'border-accent-red bg-accent-red/10 text-accent-red' : 'border-border bg-bg-tertiary text-text-secondary'}`}>
                {t('mkt_set_prov_' + p)}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-text-muted mt-1.5">{t('mkt_set_prov_hint_' + cfg.provider)}</p>
        </div>
        {cfg.provider === 'eskiz' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label>{t('mkt_set_email')}</Label><input value={cfg.email} onChange={e => set('email', e.target.value)} autoComplete="off" className={inputCls} /></div>
            <div><Label>{t('mkt_set_password')}</Label><input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" placeholder={cfg.hasPassword ? '••••••••' : ''} className={inputCls} /></div>
            <div><Label>{t('mkt_set_from')}</Label><input value={cfg.from} onChange={e => set('from', e.target.value)} className={inputCls} /></div>
          </div>
        )}
        <div className="border-t border-border pt-4 space-y-2">
          <Label>{t('mkt_set_test')}</Label>
          <div className="flex gap-2">
            <input value={testPhone} onChange={e => setTestPhone(e.target.value)} placeholder="+998 90 123 45 67" className={inputCls} />
            <button onClick={doTest} className="px-3 py-2 rounded-xl border border-border text-xs font-semibold text-text-secondary shrink-0 flex items-center gap-1.5"><Send size={13} /> {t('mkt_set_test_btn')}</button>
          </div>
          <p className="text-[11px] text-text-muted">{t('mkt_set_test_hint')}</p>
          {testMsg && <p className={`text-xs ${testMsg.err ? 'text-accent-red' : 'text-accent-green'}`}>{testMsg.text}</p>}
        </div>
      </div>

      <div className="bg-bg-secondary border border-border rounded-2xl p-4 space-y-4">
        <h3 className="font-syne font-bold text-text-primary flex items-center gap-2"><Cake size={17} className="text-pink-500" /> {t('mkt_set_birthday')}</h3>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={cfg.birthday.enabled} onChange={e => setB('enabled', e.target.checked)} className="w-4 h-4 accent-[#E63946]" />
          <span className="text-sm text-text-primary">{t('mkt_set_bd_enabled')}</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{t('mkt_set_bd_hour')}</Label>
            <select value={cfg.birthday.hour} onChange={e => setB('hour', Number(e.target.value))} className={inputCls}>
              {Array.from({ length: 17 }, (_, i) => i + 6).map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
            </select>
          </div>
          <div>
            <Label>{t('mkt_set_bd_promo')}</Label>
            <select value={cfg.birthday.promotionId || ''} onChange={e => setB('promotionId', e.target.value || null)} className={inputCls}>
              <option value="">{t('mkt_set_bd_no_promo')}</option>
              {promos.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <Label>{t('mkt_set_bd_text')}</Label>
          <textarea rows={4} value={cfg.birthday.text} onChange={e => setB('text', e.target.value)} className={inputCls + ' resize-none'} />
          <p className="text-[11px] text-text-muted mt-1">{t('mkt_set_bd_vars')}</p>
        </div>
      </div>

      <div className="xl:col-span-2 flex items-center gap-3">
        <button onClick={save} disabled={saving} className="px-6 py-2.5 rounded-xl bg-accent-red text-white font-semibold text-sm disabled:opacity-50">
          {saving ? t('exp_form_saving') : t('save')}
        </button>
        {msg && <span className={`flex items-center gap-1.5 text-sm ${msg.err ? 'text-accent-red' : 'text-accent-green'}`}>{msg.err ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />} {msg.text}</span>}
      </div>
    </div>
  )
}

export default SettingsTab
