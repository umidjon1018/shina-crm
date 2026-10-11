import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Phone, KeyRound, FileText, PhoneCall, PhoneForwarded, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { getVoiceSettings, saveVoiceSettings, newVoiceKey, getVoiceSetup, getVoiceCalls, markVoiceCallHandled } from '../../../api/voiceService'
import { formatDateTime } from '../../../utils/format'
import { Card, Label, Msg, Spinner, Toggle, CopyField, inputCls } from './ui'

const CallRow = ({ c, t, onHandled }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-border rounded-xl p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <PhoneCall size={14} className="text-text-muted" />
        <span className="font-semibold text-text-primary">{c.customerName || c.phone || '—'}</span>
        {c.customerName && c.phone && <span className="text-text-muted text-xs">{c.phone}</span>}
        <span className="text-text-muted text-xs">{formatDateTime(c.startedAt)}{c.durationSec ? ` · ${Math.round(c.durationSec / 60 * 10) / 10} ${t('voice_min')}` : ''}</span>
        {c.reservations > 0 && <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent-green/15 text-accent-green font-bold">{t('voice_reserved', { n: c.reservations })}</span>}
        {c.callbackRequested && !c.handled && <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent-orange/15 text-accent-orange font-bold">{t('voice_callback')}</span>}
        <div className="ml-auto flex items-center gap-2">
          {c.callbackRequested && !c.handled && (
            <button onClick={() => onHandled(c.id)} className="text-xs font-semibold text-accent-green flex items-center gap-1"><CheckCircle2 size={13} /> {t('voice_handled')}</button>
          )}
          {(c.transcript || c.summary) && (
            <button onClick={() => setOpen(o => !o)} className="text-xs text-accent-blue flex items-center gap-1">{open ? <ChevronUp size={13} /> : <ChevronDown size={13} />} {t('voice_details')}</button>
          )}
        </div>
      </div>
      {c.summary && <p className="text-sm text-text-secondary">{c.summary}</p>}
      {c.callbackReason && <p className="text-xs text-accent-orange">{c.callbackReason}</p>}
      {open && (
        <div className="space-y-2">
          {c.recordingUrl && <audio controls preload="none" src={c.recordingUrl} className="w-full" />}
          {c.transcript && <pre className="text-xs text-text-secondary whitespace-pre-wrap bg-bg-tertiary rounded-lg p-2 max-h-72 overflow-y-auto">{c.transcript}</pre>}
        </div>
      )}
    </div>
  )
}

// Sozlamalar → Integratsiyalar → AI telefon operatori
const VoiceTab = () => {
  const { t } = useTranslation()
  const [cfg, setCfg] = useState(null)
  const [setup, setSetup] = useState(null)
  const [calls, setCalls] = useState(null)
  const [key, setKey] = useState('')
  const [msg, setMsg] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    getVoiceSettings().then(setCfg).catch(e => setMsg({ err: true, text: e?.response?.data?.error || t('exp_err_generic') }))
    getVoiceSetup().then(setSetup).catch(() => {})
    getVoiceCalls().then(setCalls).catch(() => setCalls([]))
  }
  useEffect(load, [])

  if (!cfg) return msg ? <Msg msg={msg} /> : <Spinner />
  const set = (k, v) => setCfg(c => ({ ...c, [k]: v }))
  const save = async (patch = {}) => {
    setSaving(true); setMsg(null)
    try {
      const r = await saveVoiceSettings({ ...cfg, ...patch })
      setCfg(r); setMsg({ text: t('mkt_set_saved') })
      getVoiceSetup().then(setSetup).catch(() => {})
    } catch (e) { setMsg({ err: true, text: e?.response?.data?.error || t('exp_err_generic') }) }
    finally { setSaving(false) }
  }
  const genKey = async () => {
    if (cfg.hasKey && !window.confirm(t('voice_key_confirm'))) return
    try { const r = await newVoiceKey(); setKey(r.key); setCfg(c => ({ ...c, hasKey: true, keyPrefix: r.keyPrefix })) }
    catch (e) { setMsg({ err: true, text: e?.response?.data?.error || t('exp_err_generic') }) }
  }
  const handled = async (id) => { await markVoiceCallHandled(id).catch(() => {}); setCalls(cs => cs.map(c => c.id === id ? { ...c, handled: true } : c)) }

  return (
    <div className="space-y-4 max-w-3xl">
      <Card title={t('voice_title')} icon={Phone}>
        <p className="text-sm text-text-muted">{t('voice_intro')}</p>
        <Toggle checked={cfg.enabled} onChange={(v) => save({ enabled: v })} label={t('voice_enabled')} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>{t('voice_reserve_hours')}</Label>
            <input type="number" min="1" max="72" value={cfg.reserveHours} onChange={e => set('reserveHours', e.target.value)} className={inputCls} />
          </div>
          <div>
            <Label>{t('voice_max_units')}</Label>
            <input type="number" min="1" max="50" value={cfg.maxUnitsPerCaller} onChange={e => set('maxUnitsPerCaller', e.target.value)} className={inputCls} />
          </div>
          <div>
            <Label>{t('voice_transfer')}</Label>
            <input value={cfg.transferNumber} onChange={e => set('transferNumber', e.target.value)} placeholder="+998 90 123 45 67" className={inputCls} />
          </div>
          <div>
            <Label>{t('voice_greeting')}</Label>
            <input value={cfg.greeting} onChange={e => set('greeting', e.target.value)} placeholder={t('voice_greeting_ph')} className={inputCls} />
          </div>
        </div>
        <div>
          <Label>{t('voice_rules')}</Label>
          <textarea rows={4} value={cfg.rules} onChange={e => set('rules', e.target.value)} placeholder={t('voice_rules_ph')} className={inputCls + ' resize-y'} />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button disabled={saving} onClick={() => save()} className="px-5 py-2.5 rounded-xl bg-accent-red text-white font-semibold text-sm disabled:opacity-50">{saving ? t('exp_form_saving') : t('save')}</button>
          <Msg msg={msg} />
        </div>
      </Card>

      <Card title={t('voice_key_title')} icon={KeyRound}>
        <p className="text-sm text-text-muted">{t('voice_key_hint')}</p>
        {cfg.hasKey && !key && <p className="text-sm text-text-secondary">{t('voice_key_set', { prefix: cfg.keyPrefix })}</p>}
        {key && (
          <div className="space-y-1">
            <CopyField value={key} />
            <p className="text-xs text-accent-orange">{t('voice_key_once')}</p>
          </div>
        )}
        <button onClick={genKey} className="px-4 py-2 rounded-xl border border-border text-sm font-semibold">{cfg.hasKey ? t('voice_key_new') : t('voice_key_create')}</button>
      </Card>

      {setup && (
        <Card title={t('voice_setup_title')} icon={FileText}>
          <p className="text-sm text-text-muted">{t('voice_setup_hint')}</p>
          <div>
            <Label>{t('voice_prompt')}</Label>
            <textarea readOnly rows={10} value={setup.prompt} className={inputCls + ' font-mono text-xs'} onFocus={e => e.target.select()} />
          </div>
          <div className="space-y-2">
            <Label>{t('voice_tools')} · {setup.auth}</Label>
            {setup.tools.map(tl => (
              <div key={tl.name} className="border border-border rounded-xl p-2.5 space-y-1">
                <p className="text-sm font-semibold text-text-primary">{tl.name} <span className="text-xs text-text-muted font-normal">— {tl.description}</span></p>
                <CopyField value={tl.url} />
                {Object.keys(tl.parameters).length > 0 && (
                  <p className="text-[11px] text-text-muted">{Object.entries(tl.parameters).map(([k, v]) => `${k}: ${v}`).join(' · ')}</p>
                )}
              </div>
            ))}
          </div>
          <div>
            <Label>{t('voice_postcall')}</Label>
            <CopyField value={setup.postCallUrl} />
          </div>
        </Card>
      )}

      <Card title={t('voice_calls_title')} icon={PhoneForwarded}>
        {!calls ? <Spinner /> : !calls.length
          ? <p className="text-sm text-text-muted">{t('voice_calls_empty')}</p>
          : <div className="space-y-2">{calls.map(c => <CallRow key={c.id} c={c} t={t} onHandled={handled} />)}</div>}
      </Card>
    </div>
  )
}

export default VoiceTab
