import React from 'react'
import { useTranslation } from 'react-i18next'
import DateMaskInput from '../../../components/DateMaskInput'

const pad = (n) => String(n).padStart(2, '0')
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const presetRange = (id) => {
  const now = new Date()
  const y = now.getFullYear(), m = now.getMonth()
  switch (id) {
    case 'today': return { from: ymd(now), to: ymd(now) }
    case 'week': {
      const d = new Date(now); d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
      return { from: ymd(d), to: ymd(now) }
    }
    case 'last_month': return { from: ymd(new Date(y, m - 1, 1)), to: ymd(new Date(y, m, 0)) }
    case 'quarter': return { from: ymd(new Date(y, Math.floor(m / 3) * 3, 1)), to: ymd(now) }
    case 'year': return { from: `${y}-01-01`, to: ymd(now) }
    case 'month':
    default: return { from: ymd(new Date(y, m, 1)), to: ymd(now) }
  }
}

// Shu uzunlikdagi oldingi davr (taqqoslash uchun)
const isMonthEnd = (d) => d.getDate() === new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()

export const previousRange = ({ from, to }) => {
  const f = new Date(from + 'T00:00:00'), tt = new Date(to + 'T00:00:00')
  // Oy boshidan boshlangan davr (oy/chorak/yil) — xuddi shuncha oy oldingi bir xil oraliq
  if (f.getDate() === 1) {
    const span = (tt.getFullYear() - f.getFullYear()) * 12 + (tt.getMonth() - f.getMonth()) + 1
    // Yil boshidan — o'tgan yilning shu oralig'i; chorak boshidan — o'tgan chorak
    const months = f.getMonth() === 0 && span > 3 ? 12 : f.getMonth() % 3 === 0 && span > 1 && span <= 3 ? 3 : span
    const pf = new Date(f.getFullYear(), f.getMonth() - months, 1)
    const lastDay = new Date(tt.getFullYear(), tt.getMonth() - months + 1, 0).getDate()
    const pt = new Date(tt.getFullYear(), tt.getMonth() - months, isMonthEnd(tt) ? lastDay : Math.min(tt.getDate(), lastDay))
    return { from: ymd(pf), to: ymd(pt) }
  }
  const days = Math.round((tt - f) / 86400000) + 1
  const pt = new Date(f); pt.setDate(pt.getDate() - 1)
  const pf = new Date(pt); pf.setDate(pf.getDate() - days + 1)
  return { from: ymd(pf), to: ymd(pt) }
}

const PRESETS = ['today', 'week', 'month', 'last_month', 'quarter', 'year']

const PeriodPicker = ({ preset, range, onChange, presets = PRESETS }) => {
  const { t } = useTranslation()
  const inputCls = 'w-32 bg-bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-red'
  return (
    <div className="flex items-center gap-2 flex-wrap min-w-0 max-w-full">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full min-w-0">
        {presets.map(p => (
          <button key={p} onClick={() => onChange(p, presetRange(p))}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
              ${preset === p ? 'bg-accent-red text-white' : 'bg-bg-secondary border border-border text-text-secondary hover:border-accent-red/50'}`}>
            {t('fin_period_' + p)}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <DateMaskInput value={range.from} onChange={e => e.target.value && onChange('custom', { ...range, from: e.target.value })} className={inputCls} />
        <span className="text-text-muted">—</span>
        <DateMaskInput value={range.to} onChange={e => e.target.value && onChange('custom', { ...range, to: e.target.value })} className={inputCls} />
      </div>
    </div>
  )
}

export default PeriodPicker
