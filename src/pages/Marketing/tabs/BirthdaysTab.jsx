import React, { useState, useEffect } from 'react'
import { Cake, CheckCircle2, Send, Settings2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getBirthdays, greetBirthday, getTgSettings } from '../../../api/marketingService'
import { fmtD, fmtDT } from '../components/mkHelpers'

const BirthdaysTab = ({ goSettings }) => {
  const { t } = useTranslation()
  const [days, setDays] = useState(7)
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [cfg, setCfg] = useState(null)
  const [busy, setBusy] = useState(null)
  const [msg, setMsg] = useState('')

  const load = () => { setLoading(true); getBirthdays(days).then(setList).catch(() => setList([])).finally(() => setLoading(false)) }
  useEffect(load, [days])
  useEffect(() => { getTgSettings().then(setCfg).catch(() => {}) }, [])

  const greet = async (c) => {
    setBusy(c.id); setMsg('')
    try { await greetBirthday(c.id); setMsg(t('mkt_bd_sent', { name: c.name })); load() }
    catch (e) { setMsg(e?.response?.data?.error || t('exp_err_generic')) }
    finally { setBusy(null) }
  }

  return (
    <div className="space-y-4">
      <div className="bg-bg-secondary border border-border rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center"><Cake size={20} /></div>
          <div>
            <p className="font-bold text-text-primary text-sm">{t('mkt_bd_auto')}</p>
            <p className="text-xs text-text-muted">
              {cfg?.birthday?.enabled
                ? t('mkt_bd_auto_on', { hour: String(cfg.birthday.hour).padStart(2, '0') })
                : t('mkt_bd_auto_off')}
            </p>
          </div>
        </div>
        {goSettings && (
          <button onClick={goSettings} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-semibold text-text-secondary hover:text-text-primary">
            <Settings2 size={14} /> {t('mkt_bd_configure')}
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {[0, 7, 30].map(d => (
          <button key={d} onClick={() => setDays(d)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${days === d ? 'bg-accent-red text-white' : 'bg-bg-secondary border border-border text-text-secondary'}`}>
            {t('mkt_bd_range_' + d)}
          </button>
        ))}
      </div>
      {msg && <div className="text-sm bg-accent-blue/10 text-accent-blue px-4 py-2.5 rounded-xl">{msg}</div>}

      <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden divide-y divide-border/50">
        {loading ? <div className="p-10 flex justify-center"><div className="w-7 h-7 border-2 border-accent-red border-t-transparent rounded-full animate-spin" /></div>
          : list.length === 0 ? <p className="p-10 text-center text-text-muted text-sm">{t('mkt_bd_empty')}</p>
          : list.map(c => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3">
              <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 ${c.inDays === 0 ? 'bg-pink-500 text-white' : 'bg-bg-tertiary text-text-secondary'}`}>
                <span className="text-sm font-extrabold leading-none">{c.birthDate.slice(8, 10)}</span>
                <span className="text-[9px] leading-none mt-0.5">{t('exp_month_names', { returnObjects: true })[Number(c.birthDate.slice(5, 7)) - 1]?.slice(0, 3)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-primary text-sm truncate">{c.name}</p>
                <p className="text-xs text-text-muted">{c.phone || '—'} · {fmtD(c.birthDate)} · {c.inDays === 0 ? t('mkt_bd_today') : t('mkt_bd_in_days', { n: c.inDays })}
                  {' · '}<span className={c.linked ? 'text-accent-blue' : ''}>{c.linked ? t('mkt_bd_linked') : t('mkt_bd_not_linked')}</span>
                </p>
              </div>
              {c.greetedAt ? (
                <span className="flex items-center gap-1 text-xs text-accent-green font-semibold" title={fmtDT(c.greetedAt)}><CheckCircle2 size={14} /> {t('mkt_bd_greeted')}</span>
              ) : (
                <button onClick={() => greet(c)} disabled={busy === c.id || (cfg?.mode === 'live' && !c.linked)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/10 text-pink-500 text-xs font-bold disabled:opacity-40">
                  <Send size={12} /> {busy === c.id ? '...' : t('mkt_bd_greet')}
                </button>
              )}
            </div>
          ))}
      </div>
    </div>
  )
}

export default BirthdaysTab
