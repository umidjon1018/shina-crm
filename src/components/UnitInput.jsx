import { useState } from 'react'

const PRESET_UNITS = ['dona', 'metr', 'litr', 'kg', 'gramm', 'juft', 'ta']

const xBtn = (onClick) => (
  <button
    type="button"
    onClick={onClick}
    title="Tozalash"
    className="px-2.5 rounded-xl bg-bg-tertiary border border-border text-text-muted hover:text-accent-red hover:border-accent-red transition-all text-sm leading-none flex-shrink-0 self-stretch flex items-center"
  >✕</button>
)

// className — wrapper div ga qo'yiladi (flex-1, w-28, va h.k.)
const UnitInput = ({ value, onChange, className = '' }) => {
  const [custom, setCustom] = useState(!PRESET_UNITS.includes(value) && !!value)

  const inputCls = 'flex-1 min-w-0 px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-colors'
  const selectCls = 'flex-1 min-w-0 px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-colors'

  if (custom) {
    return (
      <div className={`flex gap-1 items-stretch ${className}`}>
        <input
          type="text"
          value={PRESET_UNITS.includes(value) ? '' : value}
          onChange={e => onChange(e.target.value)}
          placeholder="birlik yozing..."
          autoFocus
          className={inputCls}
        />
        {xBtn(() => { setCustom(false); onChange('') })}
      </div>
    )
  }

  return (
    <div className={`flex gap-1 items-stretch ${className}`}>
      <select
        value={value}
        onChange={e => {
          if (e.target.value === '__other__') { setCustom(true); onChange('') }
          else onChange(e.target.value)
        }}
        className={selectCls}
      >
        <option value="" disabled>— tanlang —</option>
        {PRESET_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
        <option disabled value="">──────</option>
        <option value="__other__">Boshqa...</option>
      </select>
      {value && xBtn(() => onChange(''))}
    </div>
  )
}

export default UnitInput
