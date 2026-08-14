import { useState } from 'react'

const PRESET_UNITS = ['dona', 'metr', 'litr', 'kg', 'gramm', 'juft', 'ta']

const UnitInput = ({ value, onChange, className = '' }) => {
  const [custom, setCustom] = useState(!PRESET_UNITS.includes(value) && !!value)

  if (custom) {
    return (
      <div className="flex gap-1 items-center">
        <input
          type="text"
          value={PRESET_UNITS.includes(value) ? '' : value}
          onChange={e => onChange(e.target.value)}
          placeholder="birlik yozing..."
          autoFocus
          className={className}
        />
        <button
          type="button"
          onClick={() => { setCustom(false); onChange('') }}
          title="Ro'yxatga qaytish"
          className="text-text-muted hover:text-text-primary text-lg leading-none px-0.5 flex-shrink-0"
        >‹</button>
      </div>
    )
  }

  return (
    <select
      value={value}
      onChange={e => {
        if (e.target.value === '__other__') {
          setCustom(true)
          onChange('')
        } else {
          onChange(e.target.value)
        }
      }}
      className={className}
    >
      <option value="" disabled>— tanlang —</option>
      {PRESET_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
      <option disabled value="">──────</option>
      <option value="__other__">Boshqa...</option>
    </select>
  )
}

export default UnitInput
