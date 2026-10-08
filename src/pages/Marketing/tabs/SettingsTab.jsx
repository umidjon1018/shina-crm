import React, { useState, useEffect } from 'react'
import { AlertCircle, Bot, Cake, CheckCircle2, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { getTgSettings, saveTgSettings } from '../../../api/marketingService'
import { useAuthStore } from '../../../store/authStore'
import { getPromotions } from '../../../api/promotionService'
import StaffStatsBlock from '../components/StaffStatsBlock'

const inputCls = 'w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-red'
const Label = ({ children }) => <label className="text-text-secondary text-xs font-semibold mb-1.5 block">{children}</label>

const SettingsTab = () => {
  const { t } = useTranslation()
  const [cfg, setCfg] = useState(null)
  const [promos, setPromos] = useState([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const navigate = useNavigate()
  const isAdmin = useAuthStore(st => st.user?.role === 'admin')

  useEffect(() => {
    getTgSettings().then(setCfg).catch(e => setMsg({ err: true, text: e?.response?.data?.error || t('exp_err_generic') }))
    getPromotions().then(list => setPromos(list.filter(p => p.requiresCode))).catch(() => {})
  }, [])

  if (!cfg) return msg ? <div className="text-sm text-accent-red">{msg.text}</div> : <div className="p-10 flex justify-center"><div className="w-7 h-7 border-2 border-accent-red border-t-transparent rounded-full animate-spin" /></div>

  const setB = (k, v) => setCfg(c => ({ ...c, birthday: { ...c.birthday, [k]: v } }))

  const save = async () => {
    setSaving(true); setMsg(null)
    try {
      const r = await saveTgSettings(cfg)
      setCfg(c => ({ ...c, ...r }))
      setMsg({ text: t('mkt_set_saved') })
    } catch (e) { setMsg({ err: true, text: e?.response?.data?.error || t('exp_err_generic') }) }
    finally { setSaving(false) }
  }
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
      {/* Bot ulanishi endi Sozlamalar → Integratsiyalarda */}
      <div className="xl:col-span-2 flex items-center gap-3 flex-wrap panel px-4 py-3">
        <Bot size={20} className="text-accent-blue shrink-0" />
        <span className="flex-1 text-[15px] text-text-primary">
          {cfg.webhookUrl && cfg.mode !== 'off' ? t('mkt_tg_set_status_on', { bot: cfg.botUsername }) : t('mkt_tg_set_status_off')}
          <span className="block text-sm text-text-muted">{t('mkt_set_tg_moved')}</span>
        </span>
        {isAdmin && (
          <button onClick={() => navigate('/settings?section=integrations&sub=bot')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:text-text-primary">
            {t('int_tab_bot')} <ArrowRight size={15} />
          </button>
        )}
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

      <div className="xl:col-span-2"><StaffStatsBlock /></div>

      <div className="xl:col-span-2 flex items-center gap-3">
        <button onClick={save} disabled={saving} className="px-4 sm:px-6 py-2.5 rounded-xl bg-accent-red text-white font-semibold text-sm disabled:opacity-50">
          {saving ? t('exp_form_saving') : t('save')}
        </button>
        {msg && <span className={`flex items-center gap-1.5 text-sm ${msg.err ? 'text-accent-red' : 'text-accent-green'}`}>{msg.err ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />} {msg.text}</span>}
      </div>
    </div>
  )
}

export default SettingsTab
