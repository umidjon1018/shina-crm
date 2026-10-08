import { useState, useEffect } from 'react'
import { Search, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getUdsSettings, saveUdsSettings, findUdsCustomer } from '../../../api/integrationService'
import { Card, Label, Msg, Spinner, errText, inputCls } from './ui'

const MODES = ['off', 'test', 'live']

const UdsTab = () => {
  const { t } = useTranslation()
  const [cfg, setCfg] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [msg, setMsg] = useState(null)
  const [code, setCode] = useState('')
  const [total, setTotal] = useState('')
  const [found, setFound] = useState(null)

  useEffect(() => { getUdsSettings().then(setCfg).catch(e => setMsg({ err: true, text: errText(e, t) })) }, [])

  const save = async () => {
    setMsg(null)
    try { setCfg(await saveUdsSettings({ ...cfg, apiKey: apiKey || undefined })); setApiKey(''); setMsg({ text: t('mkt_set_saved') }) }
    catch (e) { setMsg({ err: true, text: errText(e, t) }) }
  }
  const check = async () => {
    setFound(null)
    try { setFound(await findUdsCustomer(code.trim(), Number(total) || 0)) } catch (e) { setFound({ err: errText(e, t) }) }
  }

  if (!cfg) return msg ? <Msg msg={msg} /> : <Spinner />

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card title={t('int_uds_title')} icon={Star}>
        <p className="text-xs text-text-secondary">{t('int_uds_desc')}</p>
        <div>
          <Label>{t('int_mode')}</Label>
          <div className="grid grid-cols-3 gap-2">
            {MODES.map(m => (
              <button key={m} onClick={() => setCfg({ ...cfg, mode: m })}
                className={`py-2 rounded-xl text-sm font-semibold border ${cfg.mode === m ? 'bg-accent-red text-white border-accent-red' : 'border-border text-text-secondary'}`}>{t('int_mode_' + m)}</button>
            ))}
          </div>
          {cfg.mode === 'test' && <p className="text-[11px] text-text-muted mt-1.5">{t('int_uds_test_hint')}</p>}
        </div>
        <div>
          <Label>Company ID</Label>
          <input value={cfg.companyId} onChange={e => setCfg({ ...cfg, companyId: e.target.value })} className={inputCls} />
        </div>
        <div>
          <Label>API Key</Label>
          <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder={cfg.hasKey ? cfg.keyMask : ''} className={inputCls} autoComplete="new-password" />
          <p className="text-[11px] text-text-muted mt-1">{t('int_uds_key_hint')}</p>
        </div>
        <button onClick={save} className="w-full py-2.5 rounded-xl bg-accent-red text-white font-bold text-sm">{t('save')}</button>
        <Msg msg={msg} />
      </Card>

      <Card title={t('int_uds_check')} icon={Search}>
        <p className="text-xs text-text-secondary">{t('int_uds_check_desc')}</p>
        <div className="grid grid-cols-2 gap-2">
          <input value={code} onChange={e => setCode(e.target.value)} placeholder={t('int_uds_code_ph')} className={inputCls} />
          <input type="number" value={total} onChange={e => setTotal(e.target.value)} placeholder={t('int_uds_total_ph')} className={inputCls} />
        </div>
        <button onClick={check} disabled={!code.trim() || cfg.mode === 'off'} className="w-full py-2.5 rounded-xl border border-border text-sm font-semibold text-text-primary disabled:opacity-40">{t('int_uds_check_btn')}</button>
        {found?.err && <Msg msg={{ err: true, text: found.err }} />}
        {found && !found.err && (
          <div className="rounded-xl bg-purple-500/10 p-3 text-sm space-y-1">
            <p className="font-bold text-purple-500">{found.name || found.code}{found.test ? ` (${t('int_test')})` : ''}</p>
            <p className="text-text-secondary text-xs">{t('int_uds_points', { points: Math.round(found.points).toLocaleString('uz-UZ'), max: Math.round(found.maxPoints).toLocaleString('uz-UZ') })}</p>
          </div>
        )}
        <div className="text-xs text-text-secondary bg-bg-tertiary rounded-xl p-3 space-y-1.5">
          <p>{t('int_uds_how1')}</p>
          <p>{t('int_uds_how2')}</p>
          <p>{t('int_uds_how3')}</p>
        </div>
      </Card>
    </div>
  )
}

export default UdsTab
