import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, CheckCircle, Gift, Percent } from 'lucide-react'
import { getLoyaltySettings, saveLoyaltySettings } from '../../../api/settingsService'

const inputCls = 'w-full px-3 py-2 bg-bg-secondary border border-border rounded-xl focus:outline-none focus:border-accent-red text-sm font-semibold'
const fmt = (n) => Math.round(Number(n) || 0).toLocaleString('uz-UZ')

const TierEditor = ({ tiers, onChange, t, som }) => (
  <div className="space-y-2">
    {tiers.map((tier, i) => (
      <div key={i} className="grid grid-cols-[1fr_90px_36px] gap-2 items-end">
        <div>
          {i === 0 && <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-1 block">{t('loy_tier_from', { som })}</label>}
          <input type="number" min="0" value={tier.minAmount}
            onChange={e => onChange(tiers.map((x, j) => j === i ? { ...x, minAmount: e.target.value } : x))} className={inputCls} />
        </div>
        <div>
          {i === 0 && <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-1 block">%</label>}
          <input type="number" min="0" max="100" step="0.5" value={tier.percent}
            onChange={e => onChange(tiers.map((x, j) => j === i ? { ...x, percent: e.target.value } : x))} className={inputCls} />
        </div>
        <button type="button" onClick={() => onChange(tiers.filter((_, j) => j !== i))}
          className="h-[38px] flex items-center justify-center text-text-muted hover:text-accent-red"><Trash2 size={16} /></button>
      </div>
    ))}
    <button type="button" onClick={() => onChange([...tiers, { minAmount: '', percent: '' }])}
      className="px-3 py-2 border border-dashed border-border rounded-xl text-xs font-bold text-text-muted hover:text-text-primary flex items-center gap-1.5">
      <Plus size={14} /> {t('loy_add_tier')}
    </button>
  </div>
)

const LoyaltyProgramCard = ({ canEdit }) => {
  const { t } = useTranslation()
  const som = t('unit_som')
  const [cfg, setCfg] = useState(null)
  const [err, setErr] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { getLoyaltySettings().then(setCfg).catch(e => setErr(e?.response?.data?.error || e.message)) }, [])
  if (!cfg) return err ? <p className="text-sm text-accent-red">{err}</p> : null
  const set = (patch) => { setCfg({ ...cfg, ...patch }); setSaved(false) }

  const save = async () => {
    setErr(''); setSaving(true)
    try { setCfg(await saveLoyaltySettings(cfg)); setSaved(true); setTimeout(() => setSaved(false), 2500) }
    catch (e) { setErr(e?.response?.data?.error || e.message) } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-syne font-bold text-text-primary">{t('loy_title')}</h3>
        <p className="text-sm text-text-secondary">{t('loy_subtitle')}</p>
      </div>

      <fieldset disabled={!canEdit} className="space-y-6">
        {/* Jamg'arma chegirma */}
        <div className="bg-bg-secondary border border-border rounded-2xl p-5 space-y-4">
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span className="flex items-center gap-2 font-bold text-text-primary"><Percent size={16} className="text-accent-green" />{t('loy_discount_title')}</span>
            <input type="checkbox" checked={cfg.discountEnabled} onChange={e => set({ discountEnabled: e.target.checked })} />
          </label>
          <p className="text-xs text-text-muted">{t('loy_discount_hint')}</p>
          {cfg.discountEnabled && <TierEditor tiers={cfg.discountTiers} onChange={v => set({ discountTiers: v })} t={t} som={som} />}
        </div>

        {/* Keshbek */}
        <div className="bg-bg-secondary border border-border rounded-2xl p-5 space-y-4">
          <span className="flex items-center gap-2 font-bold text-text-primary"><Gift size={16} className="text-accent-blue" />{t('loy_cashback_title')}</span>
          <div className="grid grid-cols-3 gap-2">
            {[['off', t('loy_cb_off')], ['fixed', t('loy_cb_fixed')], ['tiered', t('loy_cb_tiered')]].map(([v, l]) => (
              <button type="button" key={v} onClick={() => set({ cashbackMode: v })}
                className={`py-2 rounded-xl border text-xs font-bold ${cfg.cashbackMode === v ? 'bg-accent-blue text-white border-accent-blue' : 'bg-bg-tertiary border-border text-text-secondary'}`}>{l}</button>
            ))}
          </div>
          {cfg.cashbackMode === 'fixed' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('loy_cb_fixed_percent')}</label>
              <input type="number" min="0" max="100" step="0.5" value={cfg.cashbackFixedPercent} onChange={e => set({ cashbackFixedPercent: e.target.value })} className={inputCls} />
            </div>
          )}
          {cfg.cashbackMode === 'tiered' && (
            <>
              <p className="text-xs text-text-muted">{t('loy_cb_tiered_hint')}</p>
              <TierEditor tiers={cfg.cashbackTiers} onChange={v => set({ cashbackTiers: v })} t={t} som={som} />
            </>
          )}
          {cfg.cashbackMode !== 'off' && (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('loy_cb_min_sale', { som })}</label>
                <input type="number" min="0" value={cfg.cashbackMinSale} onChange={e => set({ cashbackMinSale: e.target.value })} className={inputCls} />
              </div>
              <p className="text-xs text-text-muted bg-bg-tertiary rounded-xl px-3 py-2">{t('loy_cb_rules')}</p>
            </>
          )}
        </div>
      </fieldset>

      {cfg.discountEnabled && cfg.discountTiers.length > 0 && (
        <p className="text-xs text-text-secondary">
          {t('loy_summary')}: {[...cfg.discountTiers].sort((a, b) => a.minAmount - b.minAmount).map(x => `${fmt(x.minAmount)} ${som}+ → ${x.percent}%`).join(' · ')}
        </p>
      )}
      {err && <p className="text-sm text-accent-red">{err}</p>}
      {canEdit && (
        <button onClick={save} disabled={saving}
          className="px-6 py-3 bg-accent-red text-white rounded-xl font-bold disabled:opacity-50 flex items-center gap-2">
          {saved ? <><CheckCircle size={16} /> {t('loy_saved')}</> : t('loy_save')}
        </button>
      )}
    </div>
  )
}

export default LoyaltyProgramCard
