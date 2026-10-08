import { useTranslation } from 'react-i18next'
import { Briefcase } from 'lucide-react'
import { useSettingsStore } from '../../../store/settingsStore'

const PRESETS = {
  tires: { used: true, tireFields: true },
  other: { used: false, tireFields: false },
}

const Switch = ({ checked, onChange }) => (
  <button type="button" onClick={() => onChange(!checked)}
    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-accent-green' : 'bg-bg-tertiary border border-border'}`}>
    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
  </button>
)

// Biznes profili: modullarni yoqish/o'chirish (o'chirilgan bo'limlar hamma xodimdan yashiriladi, ma'lumot saqlanadi)
const BusinessProfileCard = () => {
  const { t } = useTranslation()
  const modules = useSettingsStore(s => s.modules) || {}
  const setModules = useSettingsStore(s => s.setModules)
  const on = (k) => modules[k] !== false
  const active = Object.entries(PRESETS).find(([, v]) => Object.entries(v).every(([k, x]) => on(k) === x))?.[0]

  return (
    <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-accent-red/10 text-accent-red rounded-xl flex items-center justify-center"><Briefcase size={20} /></div>
        <div>
          <h3 className="font-syne font-bold text-text-primary text-base">{t('bp_title')}</h3>
          <p className="text-xs text-text-muted">{t('bp_desc')}</p>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-text-secondary mb-2">{t('bp_presets')}</p>
        <div className="flex flex-wrap gap-2">
          {Object.keys(PRESETS).map(id => (
            <button key={id} onClick={() => setModules(PRESETS[id])}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${active === id ? 'bg-accent-red text-white border-accent-red' : 'border-border text-text-secondary hover:bg-bg-tertiary'}`}>
              {t('bp_preset_' + id)}
            </button>
          ))}
        </div>
      </div>
      <div className="divide-y divide-border">
        {[['used', 'bp_used', 'bp_used_hint'], ['tireFields', 'bp_tire', 'bp_tire_hint']].map(([k, label, hint]) => (
          <div key={k} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-text-primary">{t(label)}</p>
              <p className="text-xs text-text-muted">{t(hint)}</p>
            </div>
            <Switch checked={on(k)} onChange={(v) => setModules({ [k]: v })} />
          </div>
        ))}
      </div>
      <p className="text-xs text-text-muted">{t('bp_auto_hint')}</p>
    </div>
  )
}

export default BusinessProfileCard
