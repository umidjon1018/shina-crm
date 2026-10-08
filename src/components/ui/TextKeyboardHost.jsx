import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Delete, ArrowBigUp, CornerDownLeft, X, GripHorizontal, Globe } from 'lucide-react'

// Sensorli monoblok uchun suzuvchi harfli klaviatura: matn maydoni barmoq bilan bosilganda chiqadi
// (sonli maydonlarda — NumpadHost). Tepa paneldan uzoq bosib turib, ekranning istalgan joyiga sudraladi.
// Windows ekran klaviaturasi chiqmasligi uchun maydonga vaqtincha inputmode="none" qo'yiladi.

const TEXT_TYPES = ['text', 'search', 'tel', 'email', 'url', 'password', '']
const LAYOUTS = {
  lat: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', "'"],
    ['{shift}', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '{back}'],
    ['{sym}', '{lang}', '{space}', '-', '{enter}'],
  ],
  cyr: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ъ'],
    ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
    ['{shift}', 'я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю', 'ё', '{back}'],
    ['{sym}', '{lang}', 'ў', 'қ', '{space}', 'ғ', 'ҳ', '{enter}'],
  ],
  sym: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['-', '/', ':', ';', '(', ')', '"', '@', '#', '%'],
    ['+', '=', '*', '&', '_', '!', '?', '$', "'", ','],
    ['.', '№', '<', '>', '[', ']', '{', '}', '\\', '{back}'],
    ['{abc}', '{space}', '{enter}'],
  ],
}
const WIDE = { '{space}': 5, '{shift}': 1.5, '{back}': 1.5, '{enter}': 1.8, '{sym}': 1.4, '{lang}': 1.4, '{abc}': 1.6 }
const POS_KEY = 'shina_osk_pos'
const LANG_KEY = 'shina_osk_lang'

const isTextField = (el) => {
  if (!el || el.disabled || el.readOnly || el.dataset?.noOsk !== undefined) return false
  if (el instanceof HTMLTextAreaElement) return true
  return el instanceof HTMLInputElement && TEXT_TYPES.includes((el.getAttribute('type') || '').toLowerCase())
}
const setNativeValue = (el, v) => {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v)
}
const fireInput = (el) => el.dispatchEvent(new Event('input', { bubbles: true }))
const readJSON = (k) => { try { return JSON.parse(localStorage.getItem(k)) } catch { return null } }
const save = (k, v) => { try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)) } catch { /* xotira yo'q */ } }
const savedLang = () => { try { return localStorage.getItem(LANG_KEY) } catch { return null } }

// Kursor turgan joyga matn yozish / o'chirish (React boshqaradigan maydonlarda ham onChange ishlaydi)
const insertText = (el, text) => {
  const max = el.maxLength > 0 ? el.maxLength : Infinity
  let s, e
  try { s = el.selectionStart; e = el.selectionEnd } catch { s = null }
  if (s == null) {
    if (el.value.length + text.length > max) return
    setNativeValue(el, el.value + text)
  } else {
    if (el.value.length - (e - s) + text.length > max) return
    el.setRangeText(text, s, e, 'end')
  }
  fireInput(el)
}
const backspace = (el) => {
  let s, e
  try { s = el.selectionStart; e = el.selectionEnd } catch { s = null }
  if (s == null) { setNativeValue(el, el.value.slice(0, -1)); return fireInput(el) }
  if (s !== e) el.setRangeText('', s, e, 'end')
  else if (s > 0) el.setRangeText('', s - 1, s, 'end')
  else return
  fireInput(el)
}

const TextKeyboardHost = () => {
  const { t, i18n } = useTranslation()
  const [target, setTarget] = useState(null)
  const textLayout = () => savedLang() || (i18n.language === 'ru' ? 'cyr' : 'lat')
  const [layout, setLayout] = useState(textLayout)
  const [shift, setShift] = useState(0) // 0 — kichik, 1 — bitta katta harf, 2 — doim katta
  const [pos, setPos] = useState(() => readJSON(POS_KEY))
  const [drag, setDrag] = useState('') // '' | 'arming' | 'on'
  const boxRef = useRef(null)
  const targetRef = useRef(null)
  const prevMode = useRef(new WeakMap())
  const lastShift = useRef(0)
  const repeat = useRef(null)
  const press = useRef(null)
  const live = useRef(null) // sudrash paytidagi joriy joy (oxirgi holat render kutmasdan saqlanadi)
  const dragRef = useRef('')
  targetRef.current = target

  const release = (el) => {
    if (!el || !prevMode.current.has(el)) return
    const m = prevMode.current.get(el)
    prevMode.current.delete(el)
    if (m === null) el.removeAttribute('inputmode'); else el.setAttribute('inputmode', m)
  }
  const close = useCallback((blur) => {
    const el = targetRef.current
    setTarget(null)
    setShift(0)
    if (el && blur) el.blur()
    release(el)
  }, [])

  // Matn maydoni barmoq bilan bosilganda — klaviatura shu maydonga bog'lanadi
  useEffect(() => {
    const onDown = (e) => {
      if (e.pointerType !== 'touch' || window.innerWidth < 640) return
      const el = e.target
      // Sonli maydon — raqam klaviaturasi ochiladi, harfli yopiladi
      if (el instanceof HTMLInputElement && el.type === 'number') { if (targetRef.current) close(false); return }
      if (!isTextField(el)) return
      if (!prevMode.current.has(el)) prevMode.current.set(el, el.getAttribute('inputmode'))
      el.setAttribute('inputmode', 'none')
      const prev = targetRef.current
      if (prev && prev !== el) release(prev)
      const im = (prevMode.current.get(el) || '').toLowerCase()
      setLayout(['numeric', 'decimal', 'tel'].includes(im) || el.type === 'tel' ? 'sym' : textLayout())
      setTarget(el)
    }
    // Fokus matn bo'lmagan joyga o'tsa yoki maydon yo'qolsa — yopiladi
    const onFocusOut = (e) => {
      if (e.target !== targetRef.current) return
      setTimeout(() => {
        const el = targetRef.current
        if (!el) return
        const a = document.activeElement
        if (!el.isConnected || (a !== el && !isTextField(a))) close(false)
      }, 0)
    }
    document.addEventListener('pointerdown', onDown, true)
    document.addEventListener('focusout', onFocusOut, true)
    return () => { document.removeEventListener('pointerdown', onDown, true); document.removeEventListener('focusout', onFocusOut, true) }
  }, [close])

  // Joylashuv: saqlangan joy (ekran ichida), aks holda pastda o'rtada; maydonni to'sib qo'ysa — maydondan pastga/tepaga
  const [box, setBox] = useState(null)
  useEffect(() => {
    if (!target || !boxRef.current) return
    const w = boxRef.current.offsetWidth, h = boxRef.current.offsetHeight
    const W = window.innerWidth, H = window.innerHeight
    const clamp = (p) => ({ x: Math.min(Math.max(4, p.x), W - w - 4), y: Math.min(Math.max(4, p.y), H - h - 4) })
    let p = clamp(pos || { x: (W - w) / 2, y: H - h - 12 })
    const r = target.getBoundingClientRect()
    const overlaps = !(p.y > r.bottom || p.y + h < r.top || p.x > r.right || p.x + w < r.left)
    if (overlaps) p = clamp({ x: p.x, y: r.bottom + h + 12 <= H ? r.bottom + 8 : r.top - h - 8 })
    setBox(p)
  }, [target])

  const commitPos = (p) => { setPos(p); save(POS_KEY, p) }

  // Sudrash: tepa paneldan 350 ms bosib turilgach yoqiladi
  const onHeadDown = (e) => {
    e.preventDefault()
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* sun'iy hodisa */ }
    live.current = null
    press.current = { x0: e.clientX, y0: e.clientY, bx: box?.x || 0, by: box?.y || 0, timer: setTimeout(() => { dragRef.current = 'on'; setDrag('on') }, 350) }
    dragRef.current = 'arming'
    setDrag('arming')
  }
  const onHeadMove = (e) => {
    const p = press.current
    if (!p) return
    const dx = e.clientX - p.x0, dy = e.clientY - p.y0
    if (dragRef.current === 'arming' && Math.hypot(dx, dy) > 10) { clearTimeout(p.timer); press.current = null; dragRef.current = ''; setDrag(''); return }
    if (dragRef.current === 'on' && boxRef.current) {
      const w = boxRef.current.offsetWidth, h = boxRef.current.offsetHeight
      live.current = { x: Math.min(Math.max(4, p.bx + dx), window.innerWidth - w - 4), y: Math.min(Math.max(4, p.by + dy), window.innerHeight - h - 4) }
      setBox(live.current)
    }
  }
  const onHeadUp = () => {
    const p = press.current
    if (p) clearTimeout(p.timer)
    press.current = null
    if (dragRef.current === 'on' && live.current) commitPos(live.current)
    dragRef.current = ''
    setDrag('')
  }

  if (!target) return null

  const el = target
  const upper = shift > 0
  const type = (ch) => {
    insertText(el, upper ? ch.toUpperCase() : ch)
    if (shift === 1) setShift(0)
  }
  const stopRepeat = () => { clearTimeout(repeat.current?.t); clearInterval(repeat.current?.i); repeat.current = null }
  const onKey = (k) => {
    if (k === '{back}') {
      backspace(el)
      stopRepeat()
      repeat.current = { t: setTimeout(() => { repeat.current.i = setInterval(() => backspace(el), 60) }, 450) }
      return
    }
    if (k === '{space}') return type(' ')
    if (k === '{shift}') {
      const now = Date.now()
      setShift(s => (s === 0 ? (now - lastShift.current < 400 ? 2 : 1) : (s === 1 && now - lastShift.current < 400 ? 2 : 0)))
      lastShift.current = now
      return
    }
    if (k === '{lang}') { const next = layout === 'lat' ? 'cyr' : 'lat'; setLayout(next); save(LANG_KEY, next); return }
    if (k === '{sym}') return setLayout('sym')
    if (k === '{abc}') return setLayout(textLayout())
    if (k === '{enter}') {
      if (el instanceof HTMLTextAreaElement) return insertText(el, '\n')
      const ev = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true })
      const ok = el.dispatchEvent(ev)
      el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }))
      if (ok && el.form && typeof el.form.requestSubmit === 'function') el.form.requestSubmit()
      return
    }
    type(k)
  }
  const label = (k) => {
    if (k === '{back}') return <Delete size={20} className="mx-auto" />
    if (k === '{shift}') return <ArrowBigUp size={20} className={`mx-auto ${shift ? 'fill-current' : ''}`} />
    if (k === '{enter}') return <CornerDownLeft size={20} className="mx-auto" />
    if (k === '{space}') return layout === 'cyr' ? 'пробел' : 'probel'
    if (k === '{lang}') return <span className="inline-flex items-center gap-1"><Globe size={15} />{layout === 'cyr' ? 'ЛАТ' : 'КИР'}</span>
    if (k === '{sym}') return '?123'
    if (k === '{abc}') return textLayout() === 'cyr' ? 'АБВ' : 'ABC'
    return upper ? k.toUpperCase() : k
  }
  const special = (k) => k.startsWith('{')

  return createPortal(
    <div ref={boxRef} role="dialog" aria-label={t('osk_title')}
      onPointerDown={e => e.preventDefault()} onMouseDown={e => e.preventDefault()}
      style={{ left: box?.x ?? -9999, top: box?.y ?? -9999, width: 'min(600px, 96vw)', touchAction: 'none' }}
      className={`fixed z-[1600] select-none rounded-2xl border bg-bg-secondary/95 backdrop-blur shadow-2xl transition-shadow ${drag === 'on' ? 'border-accent-red shadow-[0_20px_60px_rgba(0,0,0,0.45)]' : 'border-border'}`}>
      <div onPointerDown={onHeadDown} onPointerMove={onHeadMove} onPointerUp={onHeadUp} onPointerCancel={onHeadUp}
        className={`tap-free flex items-center justify-between gap-2 px-3 h-9 rounded-t-2xl border-b border-border/60 cursor-grab ${drag ? 'bg-accent-red/10' : 'bg-bg-tertiary/60'}`}>
        <span className={`flex items-center gap-2 text-xs font-semibold ${drag === 'on' ? 'text-accent-red' : 'text-text-muted'}`}>
          <GripHorizontal size={16} />{drag === 'on' ? t('osk_moving') : t('osk_drag_hint')}
        </span>
        <button type="button" onPointerDown={e => { e.stopPropagation(); e.preventDefault(); close(true) }} aria-label={t('osk_close')}
          className="tap-free w-8 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-accent-red"><X size={17} /></button>
      </div>
      <div className="p-1.5 space-y-1.5">
        {LAYOUTS[layout].map((row, i) => (
          <div key={i} className="flex gap-1.5">
            {row.map(k => (
              <button key={k} type="button" tabIndex={-1}
                onPointerDown={e => { e.preventDefault(); onKey(k) }} onPointerUp={stopRepeat} onPointerLeave={stopRepeat} onPointerCancel={stopRepeat}
                style={{ flex: WIDE[k] || 1 }}
                className={`tap-free h-10 min-w-0 rounded-lg text-[15px] font-semibold active:scale-95 active:bg-accent-red/20 transition-transform ${special(k)
                  ? (k === '{enter}' ? 'g-brand text-white' : (k === '{shift}' && shift) ? 'bg-accent-red/15 text-accent-red border border-accent-red/40' : 'bg-bg-tertiary text-text-secondary border border-border')
                  : 'bg-bg-primary text-text-primary border border-border'}`}>
                {label(k)}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>,
    document.body,
  )
}

export default TextKeyboardHost
