import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

// Ichma-ich modallar: har ochilgan modal stekka qo'shiladi; telefon "orqaga" tugmasi va Esc faqat eng yuqoridagisini yopadi.
const stack = []
let seq = 0
let ignorePops = 0
if (typeof window !== 'undefined') {
  // Yopilayotgan (chiqish animatsiyasidagi) oyna hisobga olinmaydi
  const top = () => [...stack].reverse().find(e => !e.closing)
  window.addEventListener('popstate', () => {
    if (ignorePops > 0) { ignorePops--; return }
    top()?.onPop()
  })
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') top()?.close()
  })
}

const SIZES = { sm: 'sm:max-w-md', md: 'sm:max-w-2xl', lg: 'sm:max-w-5xl', xl: 'sm:max-w-[min(96vw,1840px)]' }
// xl — bo'lim oynasi: telefonda to'liq ekran, kompyuterda deyarli to'liq balandlik
const HEIGHTS = { xl: 'h-[100dvh] sm:h-[92vh] rounded-none sm:rounded-3xl' }

const Sheet = ({ onClose, title, subtitle, icon: Icon, actions, size, footer, bodyClass, zIndex, children }) => {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  // Ichma-ich oynalar: har yangisi oldingisidan yuqorida (birinchi chizishdayoq)
  const [z] = useState(() => zIndex ?? 200 + stack.length * 10)
  const entryRef = useRef(null)
  const requestClose = () => { if (entryRef.current) entryRef.current.closing = true; onClose?.() }
  useEffect(() => {
    const entry = { id: ++seq, popped: false, closing: false }
    entry.onPop = () => { entry.popped = true; entry.closing = true; onCloseRef.current?.() }
    entry.close = () => { entry.closing = true; onCloseRef.current?.() }
    entryRef.current = entry
    stack.push(entry)
    window.history.pushState({ ...(window.history.state || {}), modal: entry.id }, '')
    return () => {
      const i = stack.indexOf(entry)
      if (i >= 0) stack.splice(i, 1)
      if (!entry.popped && window.history.state?.modal === entry.id) { ignorePops++; window.history.back() }
    }
  }, [])

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center sm:p-4" style={{ zIndex: z }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={requestClose} />
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ duration: 0.18 }}
        className={`relative w-full ${SIZES[size] || SIZES.md} ${HEIGHTS[size] || 'max-h-[94dvh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl'} bg-bg-primary border border-border shadow-2xl flex flex-col overflow-hidden`}>
        {(title || actions) && (
          <div className="flex items-start gap-3 px-4 sm:px-6 py-4 border-b border-border bg-bg-secondary">
            {Icon && <div className="w-10 h-10 rounded-xl bg-accent-red/10 text-accent-red flex items-center justify-center shrink-0"><Icon size={20} /></div>}
            <div className="flex-1 min-w-0">
              {title && <h3 className="font-syne font-bold text-lg text-text-primary leading-tight [overflow-wrap:anywhere]">{title}</h3>}
              {subtitle && <div className="text-sm text-text-secondary mt-0.5">{subtitle}</div>}
            </div>
            {actions && <div className="flex items-center gap-1 shrink-0">{actions}</div>}
            <button onClick={requestClose} className="w-10 h-10 -mr-1 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-tertiary shrink-0">
              <X size={22} />
            </button>
          </div>
        )}
        <div className={`flex-1 overflow-y-auto no-scrollbar ${bodyClass ?? 'p-4 sm:p-6'}`}>{children}</div>
        {footer && <div className="px-4 sm:px-6 py-3 border-t border-border bg-bg-secondary safe-bottom">{footer}</div>}
      </motion.div>
    </div>
  )
}

// <Modal open onClose title subtitle icon actions size="sm|md|lg|xl" footer>...</Modal>
const Modal = ({ open, ...props }) => createPortal(
  <AnimatePresence>{open && <Sheet {...props} />}</AnimatePresence>,
  document.body,
)

export default Modal
