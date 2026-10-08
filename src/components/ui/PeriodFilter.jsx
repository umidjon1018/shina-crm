import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarRange } from 'lucide-react'
import DateRangeModal from './DateRangeModal'
import { presetRange, rangeText } from '../../utils/period'

const DEFAULT_PRESETS = ['today', 'week', 'month', 'last_month']

// Davr tugmalari: tayyor davrlar + "Barchasi" + "Oraliq" (sanalar tanlanib tasdiqlanadi).
// onChange(preset, { from, to }) — preset: 'today' | 'week' | ... | 'all' | 'custom'
const PeriodFilter = ({ preset, range, onChange, presets = DEFAULT_PRESETS, size = 'md' }) => {
  const { t } = useTranslation()
  const [picking, setPicking] = useState(false)
  const btn = (on) => `flex items-center gap-1.5 ${size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-[15px]'} rounded-xl font-semibold whitespace-nowrap transition-all
    ${on ? 'g-brand text-white shadow-md' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'}`

  return (
    <>
      <div className="inline-flex items-center gap-1 panel !rounded-2xl p-1 max-w-full overflow-x-auto no-scrollbar">
        {presets.map(p => (
          <button key={p} type="button" onClick={() => onChange(p, presetRange(p))} className={btn(preset === p)}>
            {t('fin_period_' + p)}
          </button>
        ))}
        <button type="button" onClick={() => onChange('all', presetRange('all'))} className={btn(preset === 'all')}>
          {t('filter_all')}
        </button>
        <button type="button" onClick={() => setPicking(true)} className={btn(preset === 'custom')} title={t('period_custom_title')}>
          <CalendarRange size={size === 'sm' ? 15 : 17} />
          {preset === 'custom' && range ? rangeText(range.from, range.to) : t('period_custom')}
        </button>
      </div>
      <DateRangeModal open={picking} initial={preset === 'custom' ? range : null} onClose={() => setPicking(false)}
        onApply={(from, to) => { setPicking(false); onChange('custom', { from, to }) }} />
    </>
  )
}

export default PeriodFilter
