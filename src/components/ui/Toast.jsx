import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, AlertCircle, X } from 'lucide-react'

// Global qisqa xabar: toast('Saqlandi') yoki toast(xato, 'error') — istalgan joydan
export const toast = (text, type = 'success') => {
  if (!text) return
  window.dispatchEvent(new CustomEvent('shina:toast', { detail: { text: String(text), type } }))
}

// Server xatosini o'qiladigan matnga aylantiradi
export const errorText = (e, fallback = '') => e?.response?.data?.error || e?.message || fallback

export const Toaster = () => {
  const [items, setItems] = useState([])
  useEffect(() => {
    const onToast = (e) => {
      const id = Date.now() + Math.random()
      setItems(list => [...list.slice(-2), { id, ...e.detail }])
      setTimeout(() => setItems(list => list.filter(x => x.id !== id)), e.detail.type === 'error' ? 5000 : 2500)
    }
    window.addEventListener('shina:toast', onToast)
    return () => window.removeEventListener('shina:toast', onToast)
  }, [])
  return (
    <div className="fixed z-[1000] left-1/2 -translate-x-1/2 flex flex-col gap-2 w-[min(92vw,420px)] pointer-events-none"
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
      <AnimatePresence>
        {items.map(x => (
          <motion.div key={x.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            className={`pointer-events-auto flex items-start gap-2 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-medium ${
              x.type === 'error' ? 'bg-bg-secondary border-accent-red/40 text-accent-red' : 'bg-bg-secondary border-accent-green/40 text-text-primary'}`}>
            {x.type === 'error' ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle size={18} className="shrink-0 mt-0.5 text-accent-green" />}
            <span className="flex-1">{x.text}</span>
            <button onClick={() => setItems(list => list.filter(y => y.id !== x.id))} className="text-text-muted"><X size={16} /></button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default Toaster
