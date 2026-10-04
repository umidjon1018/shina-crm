import { useState } from 'react'
import { AlertCircle, CheckCircle2, Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const inputCls = 'w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-red'
export const Label = ({ children }) => <label className="text-text-secondary text-xs font-semibold mb-1.5 block">{children}</label>
export const Card = ({ title, icon: Icon, children, right }) => (
  <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-5 space-y-4">
    {title && (
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-syne font-bold text-text-primary flex items-center gap-2">{Icon && <Icon size={17} className="text-accent-red" />}{title}</h3>
        {right}
      </div>
    )}
    {children}
  </div>
)
export const Spinner = () => <div className="p-10 flex justify-center"><div className="w-7 h-7 border-2 border-accent-red border-t-transparent rounded-full animate-spin" /></div>
export const Msg = ({ msg }) => msg ? (
  <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${msg.err ? 'text-red-500 bg-red-500/10' : 'text-accent-green bg-accent-green/10'}`}>
    {msg.err ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />} {msg.text}
  </div>
) : null
export const Toggle = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-3 cursor-pointer select-none">
    <button type="button" onClick={() => onChange(!checked)} className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-accent-green' : 'bg-bg-tertiary border border-border'}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
    <span className="text-sm text-text-primary">{label}</span>
  </label>
)
export const CopyField = ({ value }) => {
  const { t } = useTranslation()
  const [ok, setOk] = useState(false)
  return (
    <div className="flex gap-2">
      <input readOnly value={value} className={inputCls + ' font-mono text-xs'} onFocus={e => e.target.select()} />
      <button type="button" onClick={() => navigator.clipboard?.writeText(value).then(() => { setOk(true); setTimeout(() => setOk(false), 1500) }).catch(() => {})}
        className="shrink-0 px-3 rounded-xl border border-border text-text-secondary hover:text-text-primary text-xs font-semibold flex items-center gap-1.5">
        <Copy size={13} /> {ok ? t('mkt_copied') : t('int_copy')}
      </button>
    </div>
  )
}
export const errText = (e, t) => e?.response?.data?.error || t('exp_err_generic')

export default Card
