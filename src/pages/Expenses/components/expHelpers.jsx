import React from 'react'
import { ChevronLeft, ChevronRight, Building2, Zap, Users, Truck, Wrench, Megaphone, MoreHorizontal, Sparkles, Monitor } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18n from '../../../i18n'

// ─── ICON MAP ────────────────────────────────────────────
const ICON_MAP = {
  Building2, Zap, Users, Truck, Wrench, Megaphone, MoreHorizontal,
  Sparkles, Monitor
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
const getCatLabel = (cat, t) => t('exp_cat_' + cat.key, cat.label)
const PAGE_SIZE = 15

const monthLabel = (m, t) => {
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
const MonthFilterBar = ({ months, filterMonth, setFilterMonth, resetPage }) => {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-text-secondary text-sm">{t('exp_month_label')}</span>
      {months.map(m => (
        <button key={m} onClick={() => { setFilterMonth(m); resetPage() }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
            ${filterMonth === m ? 'bg-accent-red text-white' : 'bg-bg-secondary border border-border text-text-secondary hover:border-accent-red/50'}`}>
          {monthLabel(m, t)}
        </button>
      ))}
      <button onClick={() => { setFilterMonth(''); resetPage() }}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
          ${!filterMonth ? 'bg-accent-red text-white' : 'bg-bg-secondary border border-border text-text-secondary hover:border-accent-red/50'}`}>
        {t('filter_all')}
      </button>
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


export { ICON_MAP, fmtUZS, fmtNum, fmtDate, today, CURRENT_MONTH, sortedCategories, isPrivileged, getCatLabel, PAGE_SIZE, monthLabel, StatCard, MonthFilterBar, Pagination }
