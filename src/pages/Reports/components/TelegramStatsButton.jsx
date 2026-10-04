import React, { useState, useEffect } from 'react'
import { CheckCircle2, Send, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getStaffLink, getStaffMe } from '../../../api/reportService'

// Telegram botda statistikani olish uchun xodimni ulash (bot sozlangan bo'lsa ko'rinadi)
const TelegramStatsButton = () => {
  const { t } = useTranslation()
  const [me, setMe] = useState(null)
  const [open, setOpen] = useState(false)
  const [link, setLink] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { getStaffMe().then(setMe).catch(() => setMe(null)) }, [])
  if (!me?.botReady) return null

  const openPanel = async () => {
    setOpen(true); setError(''); setLink('')
    if (me.linked) return
    try { setLink((await getStaffLink()).link) } catch (e) { setError(e?.response?.data?.error || t('exp_err_generic')) }
  }

  return (
    <div className="relative">
      <button onClick={openPanel}
        className="flex items-center gap-2 px-4 py-2.5 bg-bg-secondary border border-border rounded-xl text-sm font-bold text-text-primary hover:bg-bg-tertiary">
        <Send size={15} className="text-accent-blue" /> {t('rpt_tg_btn')}
        {me.linked && <CheckCircle2 size={14} className="text-accent-green" />}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-bg-secondary border border-border rounded-xl shadow-2xl z-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-bold text-text-primary text-sm">{t('rpt_tg_title')}</p>
            <button onClick={() => setOpen(false)}><X size={15} className="text-text-muted" /></button>
          </div>
          {me.linked ? (
            <p className="text-xs text-text-secondary">{t('rpt_tg_linked')}</p>
          ) : (
            <>
              <p className="text-xs text-text-secondary">{t('rpt_tg_link_hint')}</p>
              {link && (
                <a href={link} target="_blank" rel="noreferrer"
                  className="block text-center py-2.5 rounded-xl bg-accent-blue text-white text-sm font-bold">{t('rpt_tg_open_bot')}</a>
              )}
              {error && <p className="text-xs text-accent-red">{error}</p>}
            </>
          )}
          <p className="text-[11px] text-text-muted">{t('rpt_tg_commands')}</p>
        </div>
      )}
    </div>
  )
}

export default TelegramStatsButton
