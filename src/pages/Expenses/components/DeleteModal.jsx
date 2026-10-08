import React from 'react'
import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { StackGuard } from '../../../components/ui/Modal'

// ─── DELETE CONFIRM MODAL ─────────────────────────────────
const DeleteModal = ({ title, desc, onClose, onConfirm }) => {
  const { t } = useTranslation()
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <StackGuard onClose={onClose} />
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-bg-secondary border border-border rounded-2xl w-full max-w-sm shadow-2xl z-10 p-4 sm:p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-accent-red/10 flex items-center justify-center">
            <Trash2 size={24} className="text-accent-red" />
          </div>
          <div>
            <h3 className="font-syne font-bold text-lg text-text-primary">{t('exp_delete_confirm')}</h3>
            <p className="text-text-secondary text-sm mt-1">{title}</p>
            {desc && <p className="text-text-secondary text-xs mt-0.5">{desc}</p>}
          </div>
          <div className="flex gap-3 w-full">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary hover:bg-bg-tertiary transition-colors text-sm font-medium">{t('cancel')}</button>
            <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-accent-red text-white font-semibold text-sm hover:opacity-90 transition-opacity">{t('delete')}</button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// TAB 1 — DO'KON XARAJATLARI
// ═══════════════════════════════════════════════════════════

export default DeleteModal
