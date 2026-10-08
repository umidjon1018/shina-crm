import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'

const DiscountRequestModal = ({ discount, requiredRole, cartItems, cartTotal, onSend, onClose }) => {
  const { t } = useTranslation()
  const som = i18n.t('unit_som')

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[360] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-bg-secondary border border-border rounded-3xl p-4 sm:p-6 w-full max-w-sm space-y-3 sm:space-y-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-syne font-extrabold text-text-primary">{t('sl_dreq_title')}</h3>
            <p className="text-xs text-text-muted mt-0.5">
              {requiredRole === 'admin' ? t('sl_dreq_subtitle_admin') : t('sl_dreq_subtitle_manager')}
            </p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={18} /></button>
        </div>

        <div className="bg-bg-tertiary rounded-2xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">{t('sl_dreq_requested')}</span>
            <span className="font-bold text-accent-red">{discount}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">{t('sl_dreq_cart_total')}</span>
            <span className="font-bold text-text-primary">{Math.round(cartTotal).toLocaleString('uz-UZ')} {som}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">{t('sl_dreq_after_discount')}</span>
            <span className="font-bold text-accent-green">{Math.round(cartTotal * (1 - discount / 100)).toLocaleString('uz-UZ')} {som}</span>
          </div>
          <div className="pt-2 border-t border-border text-xs text-text-muted">
            {t('sl_dreq_cart_items', { n: cartItems.length })} {cartItems.map(c => c.product?.name || '—').join(', ')}
          </div>
        </div>

        <p className="text-xs text-text-secondary text-center">
          {requiredRole === 'admin' ? t('sl_dreq_waiting_msg_admin') : t('sl_dreq_waiting_msg_manager')}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={onClose} className="py-3 rounded-xl border border-border text-sm font-bold text-text-secondary hover:text-text-primary transition-colors">
            {t('sl_dreq_cancel')}
          </button>
          <button onClick={onSend} className="py-3 rounded-xl bg-accent-red text-white text-sm font-bold hover:opacity-90 transition-opacity">
            {t('sl_dreq_send')}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default DiscountRequestModal
