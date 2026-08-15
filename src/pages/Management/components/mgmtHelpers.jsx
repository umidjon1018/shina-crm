import React from 'react'
import { Bell, Package, User, Percent, Tag, Settings, AlertTriangle, ShieldAlert, Info, ShoppingBag } from 'lucide-react'

const isPrivileged = (role) => role === 'admin' || role === 'manager'
const formatPrice   = (n) => n?.toLocaleString('uz-UZ') + ' so\'m'
const MONTHS_UZ = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr']
const MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const formatDateWithMonths = (d, months) => {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '—'
  return `${dt.getUTCDate()} ${months[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`
}

const SortIcon = ({ field, sortField, sortDir }) => {
  if (sortField !== field) return <span className="text-text-muted ml-1 text-[10px] inline-block flex-shrink-0">⇅</span>
  return <span className="text-accent-blue ml-1 text-[10px] inline-block flex-shrink-0">{sortDir === 'asc' ? '▲' : '▼'}</span>
}

// ============================
// TABS
// ============================
const TABS = [
  { id: 'notifications', labelKey: 'mgmt_tab_notifications', icon: Bell },
  { id: 'products',      labelKey: 'mgmt_tab_products',      icon: Package },
  { id: 'employees',     labelKey: 'mgmt_tab_employees',     icon: User },
  { id: 'discounts',     labelKey: 'mgmt_tab_discounts',     icon: Percent },
  { id: 'promotions',    labelKey: 'mgmt_tab_promotions',    icon: Tag },
  { id: 'bundles',       labelKey: 'mgmt_tab_bundles',       icon: ShoppingBag },
  { id: 'settings',      labelKey: 'mgmt_tab_settings',      icon: Settings },
]

// ============================
// NOTIFICATION SEVERITY
// ============================
const severityConfig = {
  warning: { color: 'accent-orange', label: 'Ogohlantirish', icon: AlertTriangle },
  error:   { color: 'accent-red',    label: 'Xatolik',       icon: ShieldAlert },
  info:    { color: 'accent-blue',   label: 'Axborot',       icon: Info },
}

const typeLabel = {
  BARCODE_NOT_PRINTED:  'Barkod chop etilmagan holda sotildi',
  BARCODE_REPRINTED:    'Barkod qayta chop etildi',
  BARCODE_SOLD_RESCAN:  'Sotilgan tovar barkodi kiritildi',
}

const VIOLATION_LABELS = {
  BARCODE_NOT_PRINTED:   'Barkod chop etilmagan holda sotildi',
  BARCODE_REPRINTED:     'Barkod qayta chop etildi',
  BARCODE_REDOWNLOADED:  'Barkod qayta yuklab olindi',
  BARCODE_SOLD_RESCAN:   'Sotilgan tovar barkodi kiritildi',
  SALE_NO_CUSTOMER:      "Mijoz ma'lumotisiz sotuv/bekor",
  DEVICE_LOGIN_ATTEMPT:  'Boshqa qurilmadan kirish urinishi',
  REPRINT_ALLOWED:       'Barkod qayta chop/yuklash ruxsati berildi',
  DEVICE_APPROVED:       'Boshqa qurilmadan kirgan xodim tasdiqlandi',
}

const VIOLATION_FILTER_KEYS = {
  BARCODE_NOT_PRINTED:  'mgmt_vf_barcode_not_printed',
  BARCODE_REPRINTED:    'mgmt_vf_barcode_reprinted',
  BARCODE_REDOWNLOADED: 'mgmt_vf_barcode_redownloaded',
  BARCODE_SOLD_RESCAN:  'mgmt_vf_barcode_sold_rescan',
  SALE_NO_CUSTOMER:     'mgmt_vf_sale_no_customer',
  DEVICE_LOGIN_ATTEMPT: 'mgmt_vf_device_login_attempt',
  REPRINT_ALLOWED:      'mgmt_vf_reprint_allowed',
  DEVICE_APPROVED:      'mgmt_vf_device_approved',
}

const ROLE_LABELS = {
  admin:       'Admin',
  manager:     'Boshqaruvchi',
  seller:      'Sotuvchi',
  storekeeper: 'Omborchi',
  technician:  'Texnik xodim',
}
const getRoleLabels = (customRoles) => ({
  ...ROLE_LABELS,
  ...Object.fromEntries((customRoles || []).map(r => [r.id, r.label])),
})

const rolePriority = {
  admin: 4, manager: 3, seller: 2, storekeeper: 2, technician: 2
}
const getRolePriority = (role) => rolePriority[role] ?? 2

const canManageEmployee = (currentUser, targetEmployee) => {
  if (currentUser?.role === 'admin') return true
  if (currentUser?.role === 'manager') {
    if (targetEmployee.createdBy === 'admin' || targetEmployee.lastEditedBy === 'admin') return false
    return (rolePriority[targetEmployee.role] || 0) < (rolePriority['manager'])
  }
  return false
}


export { isPrivileged, formatPrice, MONTHS_UZ, MONTHS_RU, formatDateWithMonths,
  SortIcon, TABS, severityConfig, typeLabel, VIOLATION_LABELS, VIOLATION_FILTER_KEYS,
  ROLE_LABELS, getRoleLabels, rolePriority, getRolePriority, canManageEmployee }
