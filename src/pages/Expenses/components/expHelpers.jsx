import React from 'react'
import { ChevronLeft, ChevronRight, Building2, Zap, Users, Truck, Wrench, Megaphone, MoreHorizontal, Sparkles, Monitor, Banknote, CreditCard, Landmark, Home, Fuel, Phone, ShieldCheck, Receipt, Coffee, Package, Briefcase, Gift, Percent, Car } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CalendarRange } from 'lucide-react'
import DateRangeModal from '../../../components/ui/DateRangeModal'
import { isRange, parseRange, makeRange, rangeText } from '../../../utils/period'
import i18n from '../../../i18n'

// ─── ICON MAP ────────────────────────────────────────────
const ICON_MAP = {
  Building2, Zap, Users, Truck, Wrench, Megaphone, MoreHorizontal,
  Sparkles, Monitor, Home, Fuel, Phone, ShieldCheck, Receipt, Coffee, Package, Briefcase, Gift, Percent, Car, Landmark
}

const COLOR_CLS = {
  blue: 'bg-blue-500/10 text-blue-500',
  yellow: 'bg-yellow-500/10 text-yellow-500',
  green: 'bg-green-500/10 text-green-500',
  purple: 'bg-purple-500/10 text-purple-500',
  orange: 'bg-orange-500/10 text-orange-500',
  pink: 'bg-pink-500/10 text-pink-500',
  gray: 'bg-gray-500/10 text-gray-500',
  teal: 'bg-teal-500/10 text-teal-500',
  cyan: 'bg-cyan-500/10 text-cyan-500',
  red: 'bg-red-500/10 text-red-500',
}
const colorCls = (c) => COLOR_CLS[c] || (c && c.includes('/') ? c : COLOR_CLS.gray)

const PAYMENT_METHODS = [
  { id: 'cash', icon: Banknote, labelKey: 'fin_pm_cash' },
  { id: 'card', icon: CreditCard, labelKey: 'fin_pm_card' },
  { id: 'transfer', icon: Landmark, labelKey: 'fin_pm_transfer' },
]
const pmLabel = (m, t) => t(PAYMENT_METHODS.find(x => x.id === m)?.labelKey || 'fin_pm_cash')

const PaymentMethodPicker = ({ value, onChange }) => {
  const { t } = useTranslation()
  return (
    <div className="grid grid-cols-3 gap-2">
      {PAYMENT_METHODS.map(m => {
        const Icon = m.icon
        const active = value === m.id
        return (
          <button key={m.id} type="button" onClick={() => onChange(m.id)}
            className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl border text-xs font-semibold transition-all
              ${active ? 'border-accent-red bg-accent-red/10 text-accent-red' : 'border-border bg-bg-tertiary text-text-secondary hover:border-accent-red/50'}`}>
            <Icon size={14} className="shrink-0" /> <span className="truncate">{t(m.labelKey)}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─── HELPERS ─────────────────────────────────────────────
const fmtUZS = (n) => new Intl.NumberFormat('uz-UZ').format(Math.round(n)) + ' ' + i18n.t('unit_som')
const fmtNum = (n) => new Intl.NumberFormat('uz-UZ').format(n)
const fmtDate = (d) => new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
const today = () => new Date().toISOString().split('T')[0]
const CURRENT_MONTH = new Date().toISOString().slice(0, 7)
const sortedCategories = (cats) => {
  const others = cats.filter(c => c.key === 'other')
  const rest = cats.filter(c => c.key !== 'other')
  return [...rest, ...others]
}
const isPrivileged = (role) => role === 'admin' || role === 'manager'
const DEFAULT_CAT_KEYS = ['rent', 'utilities', 'salary', 'transport', 'repair', 'marketing', 'other', 'service', 'technology']
const getCatLabel = (cat, t) => {
  if (!cat) return '—'
  if (DEFAULT_CAT_KEYS.includes(cat.key) && cat.label === t('exp_cat_' + cat.key, { lng: 'uz' })) return t('exp_cat_' + cat.key)
  return i18n.language === 'ru' ? (cat.labelRu || cat.label) : cat.label
}
const PAGE_SIZE = 15

const monthLabel = (m, t) => {
  if (isRange(m)) { const r = parseRange(m); return rangeText(r.from, r.to) }
  const [y, mo] = m.split('-')
  const names = t('exp_month_names', { returnObjects: true })
  return `${names[parseInt(mo) - 1]} ${y}`
}

// ─── STAT CARD ────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-3 sm:gap-4 min-w-0">
    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={22} />
    </div>
    <div className="min-w-0">
      <p className="text-text-secondary text-sm">{label}</p>
      <p className="text-text-primary font-bold text-lg leading-tight [overflow-wrap:anywhere]">{value}</p>
      {sub && <p className="text-text-secondary text-xs mt-0.5">{sub}</p>}
    </div>
  </div>
)

// ─── MONTH FILTER BAR ─────────────────────────────────────
// Oylar + Barchasi + Oraliq (sanalar tanlanib tasdiqlanadi). filterMonth: '' (barchasi) | 'YYYY-MM' | 'r:from:to'
const MonthFilterBar = ({ months, filterMonth, setFilterMonth, resetPage }) => {
  const { t } = useTranslation()
  const [picking, setPicking] = React.useState(false)
  const btn = (on) => `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5
    ${on ? 'bg-accent-red text-white' : 'bg-bg-secondary border border-border text-text-secondary hover:border-accent-red/50'}`
  const custom = isRange(filterMonth) ? parseRange(filterMonth) : null
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-text-secondary text-sm">{t('exp_month_label')}</span>
      {months.map(m => (
        <button key={m} onClick={() => { setFilterMonth(m); resetPage() }} className={btn(filterMonth === m)}>
          {monthLabel(m, t)}
        </button>
      ))}
      <button onClick={() => { setFilterMonth(''); resetPage() }} className={btn(!filterMonth)}>
        {t('filter_all')}
      </button>
      <button onClick={() => setPicking(true)} className={btn(!!custom)}>
        <CalendarRange size={15} /> {custom ? rangeText(custom.from, custom.to) : t('period_custom')}
      </button>
      <DateRangeModal open={picking} initial={custom} onClose={() => setPicking(false)}
        onApply={(from, to) => { setPicking(false); setFilterMonth(makeRange(from, to)); resetPage() }} />
    </div>
  )
}

// ─── PAGINATION ───────────────────────────────────────────
const Pagination = ({ page, totalPages, total, setPage }) => {
  const { t } = useTranslation()
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <span className="text-text-secondary text-sm">
        {Math.min(page * PAGE_SIZE, total)} / {total} ta
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          className="p-1.5 rounded-lg hover:bg-bg-tertiary disabled:opacity-30 transition-colors">
          <ChevronLeft size={16} className="text-text-primary" />
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let n = i + 1
          if (totalPages > 5) {
            if (page <= 3) n = i + 1
            else if (page >= totalPages - 2) n = totalPages - 4 + i
            else n = page - 2 + i
          }
          return (
            <button key={n} onClick={() => setPage(n)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
                ${page === n ? 'bg-accent-red text-white' : 'text-text-secondary hover:bg-bg-tertiary'}`}>
              {n}
            </button>
          )
        })}
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
          className="p-1.5 rounded-lg hover:bg-bg-tertiary disabled:opacity-30 transition-colors">
          <ChevronRight size={16} className="text-text-primary" />
        </button>
      </div>
    </div>
  )
}


export { ICON_MAP, COLOR_CLS, colorCls, PAYMENT_METHODS, pmLabel, PaymentMethodPicker, fmtUZS, fmtNum, fmtDate, today, CURRENT_MONTH, sortedCategories, isPrivileged, getCatLabel, PAGE_SIZE, monthLabel, StatCard, MonthFilterBar, Pagination }
