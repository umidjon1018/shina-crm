import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

const TABS = ['stock', 'products', 'used_stock', 'income', 'barcode', 'stocktake', 'writeoff']

const USED_STOCK_STATUS_CONFIG = {
  in_stock: { key: 'col_in_stock',   cls: 'text-accent-green bg-accent-green/10' },
  sold:     { key: 'sold',           cls: 'text-accent-blue bg-accent-blue/10' },
  scrapped: { key: 'wh_bu_scrapped', cls: 'text-accent-red bg-accent-red/10' },
}
const CATEGORIES = ['all', 'tire', 'wheel', 'accessory']
const SEASONS = ['all', 'SUMMER', 'WINTER', 'ALL_SEASON', 'NA']

const SEASON_COLORS = {
  SUMMER: 'text-accent-orange bg-accent-orange/10',
  WINTER: 'text-accent-blue bg-accent-blue/10',
  ALL_SEASON: 'text-accent-green bg-accent-green/10',
  NA: 'text-text-muted bg-bg-tertiary',
}
const stockStatus = (p) => {
  const stock = p.totalStock ?? 0
  if (stock === 0) return 'empty'
  if (stock <= (p.lowStockThreshold || 3)) return 'low'
  return 'ok'
}
const STATUS_CONFIG = {
  ok:    { key: 'stock_ok',    icon: CheckCircle,   cls: 'text-accent-green bg-accent-green/10' },
  low:   { key: 'stock_low',   icon: AlertTriangle,  cls: 'text-accent-orange bg-accent-orange/10' },
  empty: { key: 'stock_empty', icon: XCircle,        cls: 'text-accent-red bg-accent-red/10' },
}
const isPrivileged = (role) => role === 'admin' || role === 'manager'

// ============================
// UI HELPERS
// ============================
const TabBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0 ${active ? 'bg-accent-red text-white shadow-glow-red' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'}`}>
    {children}
  </button>
)
const Badge = ({ cls, children }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${cls}`}>{children}</span>
)
const StatCard = ({ label, value, icon: Icon, cls }) => (
  <div className="bg-bg-secondary border border-border rounded-2xl p-3 sm:p-5 flex items-center gap-2.5 sm:gap-4 min-w-0">
    <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${cls}`}><Icon size={18} /></div>
    <div className="min-w-0">
      <p className="text-base sm:text-xl font-syne font-bold text-text-primary leading-tight [overflow-wrap:anywhere]">{value}</p>
      <p className="text-xs sm:text-sm text-text-secondary">{label}</p>
    </div>
  </div>
)
const Th = ({ children, right, onClick, sortable, nowrap }) => (
  <th
    className={`${nowrap ? 'px-2 py-2 sm:py-3 whitespace-nowrap' : 'px-3 sm:px-4 py-2 sm:py-3'} text-xs font-bold text-text-muted uppercase tracking-wider ${right ? 'text-right' : 'text-left'} ${sortable ? 'cursor-pointer hover:text-text-primary select-none whitespace-nowrap' : ''}`}
    onClick={onClick}
  >
    {children}
  </th>
)

const SortIcon = ({ field, sortField, sortDir }) => {
  if (sortField !== field) return <span className="text-text-muted ml-1 text-[10px] inline-block flex-shrink-0">⇅</span>
  return <span className="text-accent-blue ml-1 text-[10px] inline-block flex-shrink-0">{sortDir === 'asc' ? '▲' : '▼'}</span>
}
const Td = ({ children, right, muted, nowrap }) => (
  <td className={`${nowrap ? 'px-2' : 'px-3 sm:px-4'} py-2.5 sm:py-3.5 text-sm ${nowrap ? 'whitespace-nowrap' : ''} ${right ? 'text-right' : ''} ${muted ? 'text-text-muted' : 'text-text-primary'}`}>{children}</td>
)

export { TABS, USED_STOCK_STATUS_CONFIG, CATEGORIES, SEASONS, SEASON_COLORS, stockStatus, STATUS_CONFIG, isPrivileged, TabBtn, Badge, StatCard, Th, SortIcon, Td }
