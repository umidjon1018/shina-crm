import PeriodFilter from '../../../components/ui/PeriodFilter'

// presetRange/ymd — umumiy utils/period da (eski importlar ishlashi uchun qayta eksport)
export { presetRange, ymd } from '../../../utils/period'
import { ymd } from '../../../utils/period'

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

// Tayyor davrlar + Barchasi + Oraliq (tasdiqlanadi) — umumiy PeriodFilter
const PeriodPicker = ({ preset, range, onChange, presets = PRESETS }) => (
  <PeriodFilter preset={preset} range={range} onChange={onChange} presets={presets} size="sm" />
)

export default PeriodPicker
