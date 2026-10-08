import { useState } from 'react'
import { AlertTriangle, AlertCircle, Info, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'

const num = (v) => Math.round(Number(v) || 0).toLocaleString('uz-UZ')

// Bazadan aniqlangan muammolar (AI'siz, SQL qoidalar) kartalari
const SEVERITY = {
  danger:  { Icon: AlertCircle,   cls: 'border-accent-red/30 bg-accent-red/5',     icon: 'text-accent-red' },
  warning: { Icon: AlertTriangle, cls: 'border-accent-orange/30 bg-accent-orange/5', icon: 'text-accent-orange' },
  success: { Icon: CheckCircle2,  cls: 'border-accent-green/30 bg-accent-green/5', icon: 'text-accent-green' },
  info:    { Icon: Info,          cls: 'border-accent-blue/30 bg-accent-blue/5',   icon: 'text-accent-blue' },
}

const anomalyDesc = (a, t) => {
  const p = a.params || {}
  const som = t('unit_som')
  switch (a.code) {
    case 'sales_drop':
    case 'sales_up': return t(`ais_${a.code}_desc`, { current: `${num(p.current)} ${som}`, avg: `${num(p.avg)} ${som}`, value: Math.abs(a.value) })
    case 'cancel_rate': return t('ais_cancel_rate_desc', { cancelled: p.cancelled, total: p.total, value: a.value })
    case 'overdue_installments': return t('ais_overdue_installments_desc', { value: a.value, amount: `${num(p.amount)} ${som}` })
    case 'supplier_overdue': return t('ais_supplier_overdue_desc', { value: a.value, usd: num(p.usd) })
    case 'below_cost': return t('ais_below_cost_desc', { value: a.value, amount: `${num(p.loss)} ${som}` })
    default: return t(`ais_${a.code}_desc`, { value: a.value })
  }
}

const itemLine = (code, it, t) => {
  const som = t('unit_som')
  switch (code) {
    case 'low_stock': return t('ais_item_low_stock', { stock: it.value, sold: it.extra })
    case 'overdue_installments': return t('ais_item_overdue', { amount: `${num(it.value)} ${som}`, days: it.extra })
    case 'supplier_overdue': return `$${num(it.value)}`
    case 'below_cost': return t('ais_item_below_cost', { amount: `${num(it.value)} ${som}`, seller: it.extra })
    case 'slow_moving': return t('ais_item_slow', { qty: it.value, days: it.extra })
    case 'birthdays': return it.value === 0 ? t('ais_item_bd_today') : t('ais_item_bd_days', { days: it.value })
    default: return String(it.value ?? '')
  }
}

export const AnomalyCard = ({ a, t }) => {
  const [open, setOpen] = useState(false)
  const s = SEVERITY[a.severity] || SEVERITY.info
  const hasItems = a.items?.length > 0
  return (
    <div className={`border rounded-xl p-3 ${s.cls}`}>
      <button type="button" onClick={() => hasItems && setOpen(o => !o)} className={`w-full flex items-start gap-2.5 text-left ${hasItems ? 'cursor-pointer' : 'cursor-default'}`}>
        <s.Icon size={16} className={`${s.icon} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary">{t(`ais_${a.code}_title`)}</p>
          <p className="text-xs text-text-secondary mt-0.5">{anomalyDesc(a, t)}</p>
        </div>
        {hasItems && (open ? <ChevronUp size={14} className="text-text-muted mt-0.5" /> : <ChevronDown size={14} className="text-text-muted mt-0.5" />)}
      </button>
      {open && hasItems && (
        <div className="mt-2 pl-6 space-y-1">
          {a.items.map((it, i) => (
            <div key={i} className="flex items-center justify-between gap-3 text-xs">
              <span className="text-text-primary truncate">{it.name}</span>
              <span className="text-text-muted flex-shrink-0">{itemLine(a.code, it, t)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

