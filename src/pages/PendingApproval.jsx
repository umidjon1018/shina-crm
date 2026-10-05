import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Clock, Shield, LogOut } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useRealtime } from '../hooks/useRealtime'

export default function PendingApproval() {
  const { t } = useTranslation()
  const { logout, checkApprovalStatus } = useAuthStore()

  // Admin tasdiqlasa/rad etsa — server darhol xabar beradi; so'rov (polling) faqat zaxira sifatida
  useRealtime({ device_status: () => checkApprovalStatus() })
  useEffect(() => {
    let timer
    const poll = async () => {
      await checkApprovalStatus()
      timer = setTimeout(poll, 15000)
    }
    timer = setTimeout(poll, 3000)
    return () => clearTimeout(timer)
  }, [checkApprovalStatus])

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-bg-secondary border border-border rounded-2xl p-5 sm:p-8 flex flex-col items-center gap-3 sm:gap-6 text-center"
      >
        {/* Icon */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-bg-tertiary border-2 border-accent-orange flex items-center justify-center">
            <Shield size={36} className="text-accent-orange" />
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-bg-secondary border-2 border-accent-orange flex items-center justify-center"
          >
            <Clock size={14} className="text-accent-orange" />
          </motion.div>
        </div>

        {/* Text */}
        <div>
          <h2 className="text-text-primary font-syne font-bold text-2xl mb-2">
            {t('pending_title')}
          </h2>
          <p className="text-accent-orange font-dm font-medium mb-3">
            {t('pending_subtitle')}
          </p>
          <p className="text-text-secondary text-sm leading-relaxed">
            {t('pending_info')}
          </p>
        </div>

        {/* Animated dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }}
              className="w-2 h-2 rounded-full bg-accent-orange"
            />
          ))}
        </div>

        {/* Info box */}
        <div className="w-full bg-bg-tertiary border border-border rounded-xl p-4 text-left">
          <p className="text-text-muted text-xs leading-relaxed">
            {t('pending_detail')}
          </p>
        </div>

        {/* Logout button */}
        <button
          onClick={logout}
          className="flex items-center gap-2 text-text-muted hover:text-accent-red transition-colors text-sm font-dm"
        >
          <LogOut size={16} />
          {t('pending_logout')}
        </button>
      </motion.div>
    </div>
  )
}
