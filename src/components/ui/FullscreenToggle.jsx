import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Maximize, Minimize } from 'lucide-react'

// To'liq ekran (kiosk) — do'kondagi sensorli monoblokda brauzer paneli va vazifalar paneli yashiriladi
export const FullscreenToggle = () => {
  const { t } = useTranslation()
  const [on, setOn] = useState(!!document.fullscreenElement)
  useEffect(() => {
    const onChange = () => setOn(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])
  if (!document.fullscreenEnabled) return null
  const toggle = () => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
    else document.documentElement.requestFullscreen?.().catch(() => {})
  }
  const Icon = on ? Minimize : Maximize
  return (
    <button type="button" onClick={toggle} title={on ? t('fullscreen_exit') : t('fullscreen_enter')} aria-label={on ? t('fullscreen_exit') : t('fullscreen_enter')}
      className="p-3 rounded-xl bg-bg-tertiary border border-border hover:border-accent-red transition-colors">
      <Icon size={20} className="text-text-secondary" />
    </button>
  )
}
