import { useRef } from 'react'

const PRESET_UNITS = ['dona', 'metr', 'litr', 'kg', 'gramm', 'juft', 'ta']

const UnitInput = ({ value, onChange, className = '' }) => {
  const inputRef = useRef(null)
  const isCustom = value && !PRESET_UNITS.includes(value)

  if (isCustom) {
    return (
      <div className="flex gap-1 items-center">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="birlik"
          autoFocus
          className={className}
        />
        <button
          type="button"
          onClick={() => onChange('dona')}
          title="Ro'yxatga qaytish"
          className="text-text-muted hover:text-text-primary text-lg leading-none px-0.5 flex-shrink-0"
        >‹</button>
      </div>
    )
  }

  return (
    <select
      value={value || 'dona'}
      onChange={e => {
        if (e.target.value === '__other__') onChange('')
        else onChange(e.target.value)
      }}
      className={className}
    >
      {PRESET_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
      <option disabled value="">──────</option>
      <option value="__other__">O'zgacha...</option>
    </select>
  )
}

export default UnitInput
