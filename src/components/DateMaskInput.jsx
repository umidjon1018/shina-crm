import { useState, useEffect } from 'react'

const isoToDisplay = (iso) => {
  if (!iso) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-')
    return `${d}.${m}.${y}`
  }
  const dt = new Date(iso)
  if (!isNaN(dt.getTime())) {
    return `${String(dt.getUTCDate()).padStart(2,'0')}.${String(dt.getUTCMonth()+1).padStart(2,'0')}.${dt.getUTCFullYear()}`
  }
  return ''
}

// Faqat raqamlardan displey formatlash — trailing dot YO'Q
const rawToDisplay = (raw) => {
  // raw = faqat raqamlar, max 8 ta
  let d = raw.slice(0, 2)
  if (raw.length >= 3) d += '.' + raw.slice(2, 4)
  if (raw.length >= 5) d += '.' + raw.slice(4, 8)
  return d
}

const DateMaskInput = ({ value, onChange, placeholder = 'kk.oo.yyyy', className, id, autoFocus }) => {
  const [display, setDisplay] = useState(isoToDisplay(value || ''))

  useEffect(() => {
    setDisplay(isoToDisplay(value || ''))
  }, [value])

  const handleChange = (e) => {
    const newVal = e.target.value
    const newRaw = newVal.replace(/\D/g, '').slice(0, 8)
    const oldRaw = display.replace(/\D/g, '')

    let raw = newRaw

    // Backspace nuqtani o'chirsa — oldidagi raqamni ham olib tashla
    if (newVal.length < display.length && newRaw.length === oldRaw.length) {
      raw = newRaw.slice(0, -1)
    }

    const disp = rawToDisplay(raw)
    setDisplay(disp)

    const d = raw.slice(0, 2), m = raw.slice(2, 4), y = raw.slice(4, 8)
    const iso = raw.length === 8 ? `${y}-${m}-${d}` : ''
    onChange({ target: { value: iso } })
  }

  return (
    <input
      type="text"
      id={id}
      value={display}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      autoFocus={autoFocus}
    />
  )
}

export default DateMaskInput
