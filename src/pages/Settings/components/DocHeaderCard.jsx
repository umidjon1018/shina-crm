import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, CheckCircle } from 'lucide-react'
import { getBusinessSettings, saveBusinessSettings } from '../../../api/settingsService'

const inputCls = 'w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-red'
const FIELDS = [
  { key: 'phones', ph: '+998 97 372 88 88, +998 90 123 45 67' },
  { key: 'address', ph: "Toshkent sh., Gvardeyskiy ko'chasi 12" },
  { key: 'inn', ph: '123456789' },
  { key: 'bank', ph: 'H/r 2020 8000 ... · MFO 00XXX · Bank nomi' },
  { key: 'footer', ph: 'Xaridingiz uchun rahmat!' },
]

// Hujjat rekvizitlari: dilerga yuboriladigan chek va akt sverka PDF sarlavhasi/pastki qismi
const DocHeaderCard = () => {
  const { t } = useTranslation()
  const [f, setF] = useState(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { getBusinessSettings().then(b => setF({ phones: '', address: '', inn: '', bank: '', footer: '', ...(b.docHeader || {}) })).catch(() => setF({})) }, [])
  if (!f) return null
  const save = async () => {
    setError('')
    try {
      await saveBusinessSettings({ docHeader: Object.fromEntries(FIELDS.map(x => [x.key, String(f[x.key] || '').trim().slice(0, 300)])) })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch (e) { setError(e?.response?.data?.error || t('exp_err_generic')) }
  }
  return (
    <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-accent-red/10 text-accent-red rounded-xl flex items-center justify-center"><FileText size={20} /></div>
        <div>
          <h3 className="font-syne font-bold text-text-primary text-base">{t('doch_title')}</h3>
          <p className="text-xs text-text-muted">{t('doch_desc')}</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {FIELDS.map(x => (
          <label key={x.key} className={x.key === 'bank' || x.key === 'footer' ? 'sm:col-span-2' : ''}>
            <span className="text-xs font-semibold text-text-secondary mb-1.5 block">{t('doch_' + x.key)}</span>
            <input value={f[x.key] || ''} maxLength={300} placeholder={x.ph} onChange={e => setF(s => ({ ...s, [x.key]: e.target.value }))} className={inputCls} />
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={save} className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1 ${saved ? 'bg-accent-green text-white' : 'bg-accent-red text-white hover:opacity-90'}`}>
          {saved ? <CheckCircle size={16} /> : t('save')}
        </button>
        {error && <span className="text-sm text-accent-red">{error}</span>}
      </div>
    </div>
  )
}

export default DocHeaderCard
