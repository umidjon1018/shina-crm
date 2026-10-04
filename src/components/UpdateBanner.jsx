import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'
import { isUpdateReady, applyPwaUpdate } from '../pwa'
import { useCartStore } from '../store/cartStore'

// Yangi versiya tayyor bo'lsa: savat bo'sh va ilova qayta ochilganda o'zi yangilanadi,
// aks holda pastda "Yangilash" tugmasi ko'rinadi. autoApply — login sahifasi (yo'qotiladigan narsa yo'q).
const UpdateBanner = ({ autoApply = false }) => {
  const { t } = useTranslation()
  const [ready, setReady] = useState(isUpdateReady())

  useEffect(() => {
    const onReady = () => setReady(true)
    window.addEventListener('pwa-update-ready', onReady)
    return () => window.removeEventListener('pwa-update-ready', onReady)
  }, [])

  useEffect(() => {
    if (!ready) return
    const cartEmpty = () => !(useCartStore.getState().cartItems || []).length
    if (autoApply && cartEmpty()) { applyPwaUpdate(); return }
    // Telefon ilovaga qaytganda (boshqa ilovadan) — savat bo'sh bo'lsa yangilanadi
    const onVisible = () => { if (document.visibilityState === 'visible' && cartEmpty()) applyPwaUpdate() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [ready, autoApply])

  if (!ready || autoApply) return null
  return (
    <div className="fixed z-[150] left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-bg-secondary border border-accent-blue/40 shadow-xl text-xs"
      style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
      <span className="text-text-primary font-medium">{t('pwa_update_ready')}</span>
      <button onClick={applyPwaUpdate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-blue text-white font-bold">
        <RefreshCw size={12} /> {t('pwa_update_btn')}
      </button>
    </div>
  )
}

export default UpdateBanner
