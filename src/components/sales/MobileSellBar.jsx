import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'

const formatPrice = (price, som) => Math.round(price).toLocaleString('uz-UZ') + ' ' + som

// Telefonda pastda doim JAMI va SOTISH. Asosiy sotish tugmasi (targetRef) ekranda ko'rinsa yashiriladi.
const MobileSellBar = ({ targetRef, count, payLabel, total, onSell, disabled, submitting, label, resetKey }) => {
  const { t } = useTranslation()
  const [targetVisible, setTargetVisible] = useState(false)

  useEffect(() => {
    const el = targetRef.current
    if (!el) return
    const scroller = el.closest('.overflow-y-auto') || window
    const check = () => {
      const r = el.getBoundingClientRect()
      setTargetVisible(r.top < window.innerHeight - 40 && r.bottom > 0)
    }
    check()
    scroller.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => { scroller.removeEventListener('scroll', check); window.removeEventListener('resize', check) }
  }, [targetRef, resetKey])

  if (!count || targetVisible) return null
  return (
    <div className="lg:hidden sticky bottom-0 z-30 -mx-4 px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] bg-bg-primary/95 backdrop-blur border-t border-border">
      <div className="flex items-center gap-3">
        <button onClick={() => targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="flex-1 min-w-0 text-left">
          <p className="text-[10px] text-text-muted font-bold uppercase truncate">{count} {t('sl_mob_items')} · {payLabel}</p>
          <p className="font-syne font-extrabold text-accent-green text-[15px] leading-tight whitespace-nowrap">{formatPrice(total, t('unit_som'))}</p>
        </button>
        <button onClick={onSell} disabled={disabled}
          className="px-4 py-3.5 bg-accent-green text-white font-syne font-extrabold text-sm rounded-2xl disabled:opacity-40 flex items-center gap-1 shrink-0">
          {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>{label} <ArrowRight size={16} /></>}
        </button>
      </div>
    </div>
  )
}

export default MobileSellBar
