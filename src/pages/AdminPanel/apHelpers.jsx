import { motion } from 'framer-motion'
import { Users, Monitor, ClipboardList, Store, Settings, Bot } from 'lucide-react'

const MONTHS_UZ = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr']
const MONTHS_RU = ['Января','Февраля','Марта','Апреля','Мая','Июня','Июля','Августа','Сентября','Октября','Ноября','Декабря']
const parseAnyDate = (d) => {
  if (!d) return null
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(String(d))) {
    const [dd, mm, yyyy] = String(d).split('.')
    const dt = new Date(`${yyyy}-${mm}-${dd}`)
    return isNaN(dt.getTime()) ? null : dt
  }
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? null : dt
}
const formatDateWithMonths = (d, months) => {
  if (!d) return '—'
  const dt = parseAnyDate(d)
  if (!dt) return '—'
  return `${dt.getUTCDate()} ${months[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`
}
const formatDateTimeWithMonths = (d, months) => {
  if (!d) return '—'
  const dt = parseAnyDate(d)
  if (!dt) return '—'
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}, ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`
}

const ROLE_LABELS_KEYS = { admin: 'adm_role_admin', manager: 'adm_role_manager', seller: 'adm_role_seller', storekeeper: 'adm_role_storekeeper', technician: 'adm_role_technician' }
const ALL_PERMISSION_KEYS = [
  { key: 'warehouse', labelKey: 'adm_perm_warehouse' }, { key: 'sales', labelKey: 'adm_perm_sales' },
  { key: 'income', labelKey: 'adm_perm_income' }, { key: 'expenses', labelKey: 'adm_perm_expenses' },
  { key: 'reports', labelKey: 'adm_perm_reports' }, { key: 'ai_agent', labelKey: 'adm_perm_ai_agent' },
]
const ROLE_PERMISSIONS = {
  admin: ['all'], manager: ['warehouse','sales','income','expenses','reports','ai_agent'],
  seller: ['warehouse','sales','income','ai_agent'], storekeeper: ['warehouse','income'], technician: ['warehouse','sales'],
}
const TABS = [
  { id: 'employees', labelKey: 'adm_tab_employees', icon: Users },
  { id: 'devices',   labelKey: 'adm_tab_devices',   icon: Monitor },
  { id: 'audit',     labelKey: 'adm_tab_audit',      icon: ClipboardList },
  { id: 'shops',     labelKey: 'mgmt_tab_shops',     icon: Store },
  { id: 'ai_agents', labelKey: 'adm_tab_ai_agents',  icon: Bot },
  { id: 'settings',  labelKey: 'adm_tab_settings',   icon: Settings },
]
const PAGE_SIZE = 15

// ─── Small helpers ───────────────────────────────────────────────────────────
const Badge = ({ color, children }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${color}`}>{children}</span>
)
const ModalWrap = ({ onClose, children, maxW = 'max-w-md' }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
      className={`relative bg-bg-secondary border border-border rounded-2xl w-full ${maxW} shadow-2xl z-10 max-h-[90vh] flex flex-col`}
    >
      {children}
    </motion.div>
  </div>
)

export { MONTHS_UZ, MONTHS_RU, formatDateWithMonths, formatDateTimeWithMonths, ROLE_LABELS_KEYS, ALL_PERMISSION_KEYS, ROLE_PERMISSIONS, TABS, PAGE_SIZE, Badge, ModalWrap }
