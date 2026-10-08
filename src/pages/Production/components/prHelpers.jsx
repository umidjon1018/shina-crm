import { createContext, useContext } from 'react'
import { Badge } from '../../../components/ui/Kit'

export const inputCls = 'w-full bg-bg-tertiary border border-border rounded-xl px-3.5 py-2.5 text-[15px] text-text-primary focus:outline-none focus:border-accent-red'
export const labelCls = 'text-sm text-text-secondary mb-1.5 block'

// Sahifa bo'ylab umumiy amallar: buyurtma/xomashyo oynasi, yangi buyurtma, kirim
export const PrContext = createContext(null)
export const usePr = () => useContext(PrContext)

// Miqdor: 3 xonagacha kasr (2,040.125)
export const fmtQty = (q) => (Number(q) || 0).toLocaleString('uz-UZ', { maximumFractionDigits: 3 })
export const qtyUnit = (q, unit) => `${fmtQty(q)} ${unit || ''}`.trim()

export const KINDS = ['raw', 'semi', 'finished', 'goods']
const KIND_COLOR = {
  raw: 'bg-accent-orange/10 text-accent-orange', semi: 'bg-violet-500/10 text-violet-500',
  finished: 'bg-accent-green/10 text-accent-green', goods: 'bg-bg-tertiary text-text-secondary',
}
export const KindBadge = ({ kind, t }) => <Badge color={KIND_COLOR[kind] || KIND_COLOR.goods}>{t('pr_kind_' + (kind || 'goods'))}</Badge>

const STATUS_COLOR = {
  planned: 'bg-accent-blue/10 text-accent-blue', in_progress: 'bg-accent-orange/10 text-accent-orange',
  done: 'bg-accent-green/10 text-accent-green', cancelled: 'bg-bg-tertiary text-text-muted',
}
export const StatusBadge = ({ status, t }) => <Badge color={STATUS_COLOR[status]}>{t('pr_status_' + status)}</Badge>

export const UNITS = ['kg', 'tonna', 'gramm', 'litr', 'metr', 'dona', 'qop', 'quti']

export const Spinner = () => (
  <div className="py-16 flex justify-center"><div className="w-8 h-8 border-2 border-accent-red border-t-transparent rounded-full animate-spin" /></div>
)

// Xarajatlar ro'yxati (nomi + summa): retseptda birlik uchun, buyurtmada jami
export const CostsEditor = ({ value, onChange, t, hint }) => {
  const set = (i, k, v) => onChange(value.map((c, j) => (j === i ? { ...c, [k]: v } : c)))
  return (
    <div className="space-y-2">
      {value.map((c, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={c.name} onChange={e => set(i, 'name', e.target.value)} placeholder={t('pr_cost_name_ph')} className={inputCls + ' flex-1'} />
          <input type="number" min="0" value={c.amount} onChange={e => set(i, 'amount', e.target.value)} placeholder="0" className={inputCls + ' w-36 text-right'} />
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}
            className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-text-muted hover:text-accent-red hover:bg-accent-red/10">×</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, { name: '', amount: '' }])}
        className="px-3 py-2 rounded-xl border border-dashed border-border text-sm font-semibold text-text-secondary hover:bg-bg-tertiary">+ {t('pr_add_cost')}</button>
      {hint && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  )
}
