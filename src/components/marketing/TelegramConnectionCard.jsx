import { useState, useEffect } from 'react'
import { AlertCircle, Bot, CheckCircle2, ExternalLink, Link2, Send, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getTgSettings, saveTgSettings, setupTgWebhook, testTgMessage } from '../../api/marketingService'

const inputCls = 'w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-red'
const Label = ({ children }) => <label className="text-text-secondary text-xs font-semibold mb-1.5 block">{children}</label>
const API_BASE = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/+$/, '')

// Telegram bot ulanishi (rejim, token, webhook, sinov) — Sozlamalar → Integratsiyalar → Telegram bot
const TelegramConnectionCard = () => {
  const { t } = useTranslation()
  const [cfg, setCfg] = useState(null)
  const [token, setToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [linking, setLinking] = useState(false)
  const [msg, setMsg] = useState(null)
  const [testChat, setTestChat] = useState('')
  const [testMsg, setTestMsg] = useState(null)

  useEffect(() => {
    getTgSettings().then(setCfg).catch(e => setMsg({ err: true, text: e?.response?.data?.error || t('exp_err_generic') }))
  }, [])

  if (!cfg) return msg ? <div className="text-sm text-accent-red">{msg.text}</div> : <div className="p-10 flex justify-center"><div className="w-7 h-7 border-2 border-accent-red border-t-transparent rounded-full animate-spin" /></div>

  const set = (k, v) => setCfg(c => ({ ...c, [k]: v }))
  const save = async () => {
    setSaving(true); setMsg(null)
    try {
      const r = await saveTgSettings({ ...cfg, botToken: token || undefined })
      setCfg(c => ({ ...c, ...r })); setToken('')
      setMsg({ text: t('mkt_set_saved') })
    } catch (e) { setMsg({ err: true, text: e?.response?.data?.error || t('exp_err_generic') }) }
    finally { setSaving(false) }
  }
  const connect = async () => {
    setLinking(true); setMsg(null)
    try {
      if (token) { await saveTgSettings({ ...cfg, botToken: token }); setToken('') }
      const r = await setupTgWebhook(API_BASE)
      setCfg(c => ({ ...c, ...r }))
      setMsg({ text: t('mkt_tg_set_connected', { bot: r.botUsername }) })
    } catch (e) { setMsg({ err: true, text: e?.response?.data?.error || t('exp_err_generic') }) }
    finally { setLinking(false) }
  }
  const doTest = async () => {
    setTestMsg(null)
    try {
      const r = await testTgMessage({ chat_id: testChat, text: t('mkt_tg_set_test_text') })
      setTestMsg({ text: r.status === 'test' ? t('mkt_tg_set_test_logged') : t('mkt_tg_set_test_sent') })
    } catch (e) { setTestMsg({ err: true, text: e?.response?.data?.error || t('exp_err_generic') }) }
  }

  return (
    <div className="bg-bg-secondary border border-border rounded-2xl p-4 space-y-4">
      <h3 className="font-syne font-bold text-text-primary flex items-center gap-2"><Bot size={17} className="text-accent-blue" /> {t('mkt_tg_set_title')}</h3>
      <div>
        <Label>{t('mkt_tg_set_mode')}</Label>
        <div className="grid grid-cols-3 gap-1.5">
          {['off', 'test', 'live'].map(p => (
            <button key={p} type="button" onClick={() => set('mode', p)}
              className={`px-2 py-2 rounded-xl border text-xs font-semibold ${cfg.mode === p ? 'border-accent-red bg-accent-red/10 text-accent-red' : 'border-border bg-bg-tertiary text-text-secondary'}`}>
              {t('mkt_tg_mode_' + p)}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-text-muted mt-1.5">{t('mkt_tg_mode_hint_' + cfg.mode)}</p>
      </div>
      <div>
        <Label>{t('mkt_tg_set_token')}</Label>
        <input type="password" value={token} onChange={e => setToken(e.target.value)} autoComplete="new-password"
          placeholder={cfg.hasToken ? '••••••••••' : '123456789:AA...'} className={inputCls} />
        <p className="text-[11px] text-text-muted mt-1">{t('mkt_tg_set_token_hint')}</p>
      </div>
      <div className="rounded-xl bg-bg-tertiary p-3 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-sm text-text-primary flex items-center gap-1.5">
            {cfg.webhookUrl ? <CheckCircle2 size={15} className="text-accent-green" /> : <AlertCircle size={15} className="text-accent-orange" />}
            {cfg.webhookUrl ? t('mkt_tg_set_status_on', { bot: cfg.botUsername }) : t('mkt_tg_set_status_off')}
          </span>
          <button onClick={connect} disabled={linking || (!cfg.hasToken && !token)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-blue text-white text-xs font-bold disabled:opacity-40">
            <Link2 size={13} /> {linking ? '...' : t('mkt_tg_set_connect')}
          </button>
        </div>
        {cfg.botUsername && (
          <a href={`https://t.me/${cfg.botUsername}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-accent-blue font-semibold">
            t.me/{cfg.botUsername} <ExternalLink size={11} />
          </a>
        )}
        <p className="text-[11px] text-text-muted">{t('mkt_tg_set_connect_hint')}</p>
        <p className="text-[11px] text-text-secondary">{t('mkt_tg_linked_total', { n: cfg.linkedCustomers || 0 })}</p>
      </div>
      <div>
        <Label>{t('mkt_tg_set_welcome')}</Label>
        <textarea rows={3} value={cfg.welcomeText} onChange={e => set('welcomeText', e.target.value)} placeholder={t('mkt_tg_set_welcome_ph')} className={inputCls + ' resize-none'} />
      </div>
      <div>
        <Label>{t('mkt_tg_set_order_hours')}</Label>
        <input type="number" min="1" max="72" value={cfg.orderHours ?? 24} onChange={e => set('orderHours', e.target.value)} className={inputCls + ' max-w-[140px]'} />
        <p className="text-[11px] text-text-muted mt-1">{t('mkt_tg_set_order_hours_hint')}</p>
      </div>
      <div className="border-t border-border pt-4 space-y-2">
        <Label>{t('mkt_tg_set_faq')}</Label>
        <p className="text-[11px] text-text-muted">{t('mkt_tg_set_faq_hint')}</p>
        {(cfg.faq || []).map((f, i) => (
          <div key={i} className="border border-border rounded-xl p-2.5 space-y-1.5">
            <div className="flex gap-2">
              <input value={f.q} maxLength={80} onChange={e => set('faq', cfg.faq.map((x, j) => j === i ? { ...x, q: e.target.value } : x))} placeholder={t('mkt_tg_set_faq_q')} className={inputCls} />
              <button type="button" onClick={() => set('faq', cfg.faq.filter((_, j) => j !== i))} className="p-2 rounded-lg text-text-muted hover:text-accent-red shrink-0"><Trash2 size={15} /></button>
            </div>
            <textarea rows={3} value={f.a} maxLength={2000} onChange={e => set('faq', cfg.faq.map((x, j) => j === i ? { ...x, a: e.target.value } : x))} placeholder={t('mkt_tg_set_faq_a')} className={inputCls + ' resize-y'} />
          </div>
        ))}
        {(cfg.faq || []).length < 20 && (
          <button type="button" onClick={() => set('faq', [...(cfg.faq || []), { q: '', a: '' }])} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-semibold text-text-secondary"><Plus size={13} /> {t('mkt_tg_set_faq_add')}</button>
        )}
      </div>
      <div className="border-t border-border pt-4 space-y-2">
        <Label>{t('mkt_tg_set_test')}</Label>
        <div className="flex gap-2">
          <input value={testChat} onChange={e => setTestChat(e.target.value)} placeholder="Chat ID" className={inputCls} />
          <button onClick={doTest} className="px-3 py-2 rounded-xl border border-border text-xs font-semibold text-text-secondary shrink-0 flex items-center gap-1.5"><Send size={13} /> {t('mkt_set_test_btn')}</button>
        </div>
        <p className="text-[11px] text-text-muted">{t('mkt_tg_set_test_hint')}</p>
        {testMsg && <p className={`text-xs ${testMsg.err ? 'text-accent-red' : 'text-accent-green'}`}>{testMsg.text}</p>}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={save} disabled={saving} className="px-4 sm:px-6 py-2.5 rounded-xl bg-accent-red text-white font-semibold text-sm disabled:opacity-50">
          {saving ? t('exp_form_saving') : t('save')}
        </button>
        {msg && <span className={`flex items-center gap-1.5 text-sm ${msg.err ? 'text-accent-red' : 'text-accent-green'}`}>{msg.err ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />} {msg.text}</span>}
      </div>
    </div>
  )
}

export default TelegramConnectionCard
