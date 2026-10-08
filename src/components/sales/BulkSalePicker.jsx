import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Scale, Search, ShoppingCart } from 'lucide-react'
import Modal from '../ui/Modal'

const fmtQty = (q) => String(Math.round((Number(q) || 0) * 1000) / 1000).replace('.', ',')
const money = (v, som) => Math.round(Number(v) || 0).toLocaleString('uz-UZ') + ' ' + som

// Miqdor va narx kiritish (yangi qator yoki savatdagini tahrirlash)
export const BulkLineForm = ({ item, line, canBelowMin, onSave, onClose }) => {
  const { t } = useTranslation()
  const som = t('unit_som')
  const [qty, setQty] = useState(line ? String(line.qty) : '')
  const [price, setPrice] = useState(String(line ? line.unitPrice : item.cashPrice || ''))
  const q = Number(String(qty).replace(',', '.')) || 0
  const p = Math.round(Number(price) || 0)
  const err = !(q > 0) ? null
    : q > item.qty + 0.0005 ? t('bulk_err_stock', { qty: fmtQty(item.qty), unit: item.unit })
    : !(p > 0) ? t('bulk_err_price')
    : (!canBelowMin && item.minSalePrice > 0 && p < item.minSalePrice) ? t('bulk_err_min', { min: money(item.minSalePrice, som), unit: item.unit })
    : null
  const save = () => {
    if (!(q > 0) || err) return
    onSave({ productId: item.productId, name: item.name, unit: item.unit, qty: Math.round(q * 1000) / 1000, unitPrice: p,
      available: item.qty, minSalePrice: item.minSalePrice, installmentBasePrice: item.installmentBasePrice })
  }
  return (
    <Modal open onClose={onClose} size="sm" icon={Scale} title={item.name}
      subtitle={t('bulk_available', { qty: fmtQty(item.qty), unit: item.unit })}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">{t('bulk_qty', { unit: item.unit })}</span>
            <input type="number" inputMode="decimal" step="0.001" min="0" autoFocus aria-label={t('bulk_qty', { unit: item.unit })}
              value={qty} onChange={e => setQty(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()}
              className="mt-1 w-full bg-bg-tertiary border border-border rounded-xl px-3 py-3 text-lg font-bold text-text-primary focus:outline-none focus:border-accent-red" />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">{t('bulk_unit_price', { unit: item.unit })}</span>
            <input type="number" inputMode="numeric" min="0" aria-label={t('bulk_unit_price', { unit: item.unit })}
              value={price} onChange={e => setPrice(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()}
              className="mt-1 w-full bg-bg-tertiary border border-border rounded-xl px-3 py-3 text-lg font-bold text-text-primary focus:outline-none focus:border-accent-red" />
          </label>
        </div>
        {item.minSalePrice > 0 && <p className="text-xs text-text-muted">{t('bulk_min_hint', { min: money(item.minSalePrice, som), unit: item.unit })}</p>}
        <div className="flex items-center justify-between rounded-2xl bg-bg-tertiary px-4 py-3">
          <span className="text-sm text-text-secondary">{q > 0 ? `${fmtQty(q)} ${item.unit} × ${money(p, som)}` : t('bulk_enter_qty')}</span>
          <span className="text-lg font-bold text-text-primary">{money(q * p, som)}</span>
        </div>
        {err && <p className="text-sm text-accent-red">{err}</p>}
        <button type="button" onClick={save} disabled={!(q > 0) || !!err}
          className="w-full h-12 rounded-2xl bg-accent-red text-white font-bold flex items-center justify-center gap-2 disabled:opacity-40">
          <ShoppingCart size={18} /> {line ? t('bulk_update') : t('bulk_add')}
        </button>
      </div>
    </Modal>
  )
}

// Kassada miqdorli (kg, litr, metr) tovar tanlash
const BulkSalePicker = ({ stock, bulkLines, onSave, canBelowMin }) => {
  const { t } = useTranslation()
  const som = t('unit_som')
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [pick, setPick] = useState(null)
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? stock.filter(x => x.name.toLowerCase().includes(s)) : stock
  }, [stock, q])
  if (!stock.length) return null
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="w-full h-12 rounded-2xl border border-dashed border-accent-blue/50 text-accent-blue font-semibold flex items-center justify-center gap-2 hover:bg-accent-blue/5">
        <Scale size={18} /> {t('bulk_open_btn', { n: stock.length })}
      </button>
      {open && !pick && (
        <Modal open onClose={() => setOpen(false)} size="md" icon={Scale} title={t('bulk_title')} subtitle={t('bulk_subtitle')}>
          <div className="space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('bulk_search')}
                className="w-full bg-bg-tertiary border border-border rounded-xl pl-9 pr-3 py-3 text-[15px] text-text-primary focus:outline-none focus:border-accent-red" />
            </div>
            <div className="divide-y divide-border/60 max-h-[55vh] overflow-y-auto">
              {list.map(x => {
                const inCart = bulkLines.find(l => l.productId === x.productId)
                return (
                  <button key={x.productId} type="button" onClick={() => setPick(x)}
                    className="w-full text-left py-3 px-1 flex items-center justify-between gap-3 hover:bg-bg-tertiary/50 rounded-lg">
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold text-text-primary truncate">{x.name}</span>
                      <span className="block text-sm text-text-muted">{t('bulk_available', { qty: fmtQty(x.qty), unit: x.unit })}{inCart ? ` · ${t('bulk_in_cart', { qty: fmtQty(inCart.qty), unit: x.unit })}` : ''}</span>
                    </span>
                    <span className="text-[15px] font-bold text-text-primary whitespace-nowrap">{money(x.cashPrice, som)} / {x.unit}</span>
                  </button>
                )
              })}
              {list.length === 0 && <p className="py-8 text-center text-text-muted text-sm">{t('bulk_none')}</p>}
            </div>
          </div>
        </Modal>
      )}
      {pick && (
        <BulkLineForm item={pick} line={bulkLines.find(l => l.productId === pick.productId)} canBelowMin={canBelowMin}
          onClose={() => setPick(null)}
          onSave={(line) => { onSave(line); setPick(null); setOpen(false); setQ('') }} />
      )}
    </>
  )
}

export default BulkSalePicker
