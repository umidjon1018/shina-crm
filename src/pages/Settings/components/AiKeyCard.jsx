import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyRound, Eye, EyeOff } from 'lucide-react'
import { getAiSettings, saveAiSettings } from '../../../api/settingsService'
import { toast, errorText } from '../../../components/ui/Toast'

// AI kaliti serverda saqlanadi (barcha qurilmalar va kundalik tahlil uchun bitta), ekranga faqat oxirgi 4 belgisi chiqadi
const AiKeyCard = () => {
  const { t } = useTranslation()
  const [status, setStatus] = useState(null)
  const [value, setValue] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  useEffect(() => { getAiSettings().then(setStatus).catch(() => {}) }, [])
  const save = async (apiKey) => {
    setSaving(true)
    try { setStatus(await saveAiSettings(apiKey)); setValue(''); toast(t('mkt_set_saved')) }
    catch (e) { toast(errorText(e), 'error') }
    finally { setSaving(false) }
  }
  return (
    <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-accent-blue/10 text-accent-blue rounded-xl flex items-center justify-center"><KeyRound size={20}/></div>
        <div>
          <h3 className="font-syne font-bold text-text-primary text-base">{t('adm_set_ai_title')}</h3>
          <p className="text-xs text-text-muted">{t('adm_ai_key_server_note')}</p>
        </div>
      </div>
      {status && (
        <p className={`text-sm font-semibold ${status.hasKey ? 'text-accent-green' : 'text-accent-red'}`}>
          {status.hasKey ? t(status.source === 'env' ? 'adm_ai_key_env' : 'adm_ai_key_set', { hint: status.hint }) : t('adm_ai_key_none')}
        </p>
      )}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <input type={show ? 'text' : 'password'} value={value} onChange={e => setValue(e.target.value)}
            placeholder={t('adm_set_ai_key_placeholder')}
            className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 pr-10 text-text-primary focus:outline-none focus:border-accent-red text-sm font-mono" />
          <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
            {show ? <EyeOff size={16}/> : <Eye size={16}/>}
          </button>
        </div>
        <button disabled={saving || !value.trim()} onClick={() => save(value.trim())}
          className="px-4 py-2.5 rounded-xl font-bold text-sm bg-accent-red text-white hover:opacity-90 shadow-glow-red disabled:opacity-50">
          {t('save')}
        </button>
      </div>
      {status?.source === 'settings' && (
        <button disabled={saving} onClick={() => save('')} className="text-xs font-semibold text-text-muted hover:text-accent-red">
          {t('adm_ai_key_remove')}
        </button>
      )}
    </div>
  )
}


export default AiKeyCard
