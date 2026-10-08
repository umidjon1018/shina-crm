import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import DateRangeModal from './DateRangeModal'
import { isRange, parseRange, makeRange, rangeText } from '../../utils/period'

const CUSTOM = '__custom__'

// Oy tanlash ro'yxati + "Oraliq…" (sanalar tanlanib tasdiqlanadi). Qiymat: 'all' | 'YYYY-MM' | 'r:from:to'
// months — oy qiymatlari ('all' bo'lsa ham bo'ladi), monthLabel(m) — ko'rinadigan nomi
const MonthRangeSelect = ({ value, onChange, months = [], monthLabel = (m) => m, allLabel, className = '', includeAll = true }) => {
  const { t } = useTranslation()
  const [picking, setPicking] = useState(false)
  const list = months.filter(m => m && m !== 'all')
  const custom = isRange(value) ? parseRange(value) : null

  return (
    <div className={`relative inline-block ${className}`}>
      <select value={value}
        onChange={e => { if (e.target.value === CUSTOM) setPicking(true); else onChange(e.target.value) }}
        className="appearance-none bg-bg-secondary border border-border rounded-xl pl-3 pr-9 py-2.5 text-[15px] text-text-primary focus:outline-none focus:border-accent-red cursor-pointer max-w-full">
        {includeAll && <option value="all">{allLabel || t('filter_all')}</option>}
        {custom && <option value={value}>{rangeText(custom.from, custom.to)}</option>}
        {list.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
        <option value={CUSTOM}>{t('period_custom')}…</option>
      </select>
      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
      <DateRangeModal open={picking} initial={custom} onClose={() => setPicking(false)}
        onApply={(from, to) => { setPicking(false); onChange(makeRange(from, to)) }} />
    </div>
  )
}

export default MonthRangeSelect
