import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Delete } from 'lucide-react'
import Modal from './Modal'

// Sensorli ekran (planshet, kassadagi sensorli monitor) uchun raqam klaviaturasi.
// Barmoq bilan input[type=number] bosilganda chiqadi; telefonda (<640px) odatiy klaviatura qoladi.
// Qiymat inputga React hodisalari orqali yoziladi (onChange ham, onBlur ham ishlaydi).
const setNativeValue = (el, v) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
  setter.call(el, v)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

const labelOf = (el) => {
  if (el.getAttribute('aria-label')) return el.getAttribute('aria-label')
  if (el.id) { const l = document.querySelector(`label[for="${el.id}"]`); if (l) return l.textContent.trim() }
  const wrap = el.closest('label')
  if (wrap) return wrap.textContent.trim()
  return el.placeholder || ''
}

const fmt = (s) => {
  if (!s) return '0'
  const [i, d] = s.split('.')
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (d !== undefined ? '.' + d : '')
}

const Key = ({ children, onClick }) => (
  <button type="button" onClick={onClick}
    className="h-16 rounded-2xl text-2xl font-bold bg-bg-secondary border border-border text-text-primary active:scale-95 active:bg-bg-tertiary transition-transform">
    {children}
  </button>
)

const NumpadHost = () => {
  const { t } = useTranslation()
  const [target, setTarget] = useState(null)
  const [val, setVal] = useState('')
  const fresh = useRef(true)

  useEffect(() => {
    const onDown = (e) => {
      if (e.pointerType !== 'touch' || window.innerWidth < 640) return
      const el = e.target
      if (!(el instanceof HTMLInputElement) || el.type !== 'number' || el.disabled || el.readOnly || el.dataset.noNumpad !== undefined) return
      e.preventDefault()
      fresh.current = true
      setVal(el.value || '')
      setTarget(el)
    }
    document.addEventListener('pointerdown', onDown, true)
    return () => document.removeEventListener('pointerdown', onDown, true)
  }, [])

  if (!target) return null
  const decimal = target.step === 'any' || (target.step || '').includes('.')

  const press = (k) => {
    setVal(v => {
      const base = fresh.current ? '' : v
      fresh.current = false
      if (k === '.') return base.includes('.') ? base : (base || '0') + '.'
      const next = (base === '0' ? '' : base) + k
      return next.length > 15 ? base : next
    })
  }
  const back = () => { fresh.current = false; setVal(v => v.slice(0, -1)) }
  const close = () => setTarget(null)
  const done = () => {
    const el = target
    setTarget(null)
    const prevMode = el.getAttribute('inputmode')
    el.setAttribute('inputmode', 'none')
    setNativeValue(el, val)
    // onBlur bilan ishlaydigan maydonlar ham yangi qiymatni olsin
    el.focus({ preventScroll: true })
    el.blur()
    if (prevMode === null) el.removeAttribute('inputmode'); else el.setAttribute('inputmode', prevMode)
  }

  return (
    <Modal open onClose={close} size="sm" zIndex={1500} title={labelOf(target) || t('numpad_title')}>
      <div className="space-y-3">
        <div className="panel px-4 py-4 text-right text-4xl font-bold text-text-primary tabular-nums [overflow-wrap:anywhere]">{fmt(val)}</div>
        <div className="grid grid-cols-3 gap-2.5">
          {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map(k => <Key key={k} onClick={() => press(k)}>{k}</Key>)}
          <Key onClick={() => press(decimal ? '.' : '000')}>{decimal ? '.' : '000'}</Key>
          <Key onClick={() => press('0')}>0</Key>
          <Key onClick={back}><Delete size={26} className="mx-auto" /></Key>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <button type="button" onClick={() => { fresh.current = false; setVal('') }}
            className="h-14 rounded-2xl text-lg font-bold border border-border text-text-secondary active:scale-95">{t('numpad_clear')}</button>
          <button type="button" onClick={done}
            className="h-14 rounded-2xl text-lg font-bold g-brand text-white shadow-md active:scale-95">{t('numpad_ok')}</button>
        </div>
      </div>
    </Modal>
  )
}

export default NumpadHost
