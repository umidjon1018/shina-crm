import { productTitle } from '../../../utils/format'
import React, { useState, useMemo } from 'react'
import { Check, Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// Aksiya qaysi tovarlarga: hammasi / tovarlar / kategoriyalar / brendlar
const TargetPicker = ({ type, ids, onChange, products, categories, allowAll = true }) => {
  const { t, i18n } = useTranslation()
  const [q, setQ] = useState('')
  const brands = useMemo(() =>
    [...new Set(products.map(p => (p.brand || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [products])

  const options = useMemo(() => {
    if (type === 'product') {
      const qq = q.trim().toLowerCase()
      return products
        .filter(p => !qq || `${p.brand || ''} ${p.name} ${p.size || ''}`.toLowerCase().includes(qq))
        .slice(0, 80)
        .map(p => ({ id: String(p.id), label: productTitle(p.brand, p.name), sub: p.cashPrice ? Math.round(p.cashPrice).toLocaleString('uz-UZ') : '' }))
    }
    if (type === 'category') return categories.map(c => ({ id: String(c.id), label: i18n.language === 'ru' ? (c.labelRu || c.label) : c.label }))
    if (type === 'brand') return brands.map(b => ({ id: b, label: b }))
    return []
  }, [type, products, categories, brands, q, i18n.language])

  const labelOf = (id) => {
    if (type === 'product') { const p = products.find(x => String(x.id) === String(id)); return p ? productTitle(p.brand, p.name) : id }
    if (type === 'category') { const c = categories.find(x => String(x.id) === String(id)); return c ? c.label : id }
    return id
  }
  const toggle = (id) => onChange(type, ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id])
  const TYPES = [...(allowAll ? ['all'] : []), 'product', 'category', 'brand']

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-1.5">
        {TYPES.map(tp => (
          <button key={tp} type="button" onClick={() => onChange(tp, [])}
            className={`px-2 py-2 rounded-xl border text-xs font-semibold transition-all ${type === tp ? 'border-accent-red bg-accent-red/10 text-accent-red' : 'border-border bg-bg-tertiary text-text-secondary hover:border-accent-red/50'}`}>
            {t('mkt_target_' + tp)}
          </button>
        ))}
      </div>
      {type && type !== 'all' && (
        <>
          {ids.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {ids.map(id => (
                <span key={id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-accent-red/10 text-accent-red text-xs font-semibold max-w-full">
                  <span className="truncate">{labelOf(id)}</span>
                  <button type="button" onClick={() => toggle(id)}><X size={12} /></button>
                </span>
              ))}
            </div>
          )}
          {type === 'product' && (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('mkt_target_search')}
                className="w-full pl-9 pr-3 py-2 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-red" />
            </div>
          )}
          <div className="max-h-44 overflow-y-auto rounded-xl border border-border divide-y divide-border/50">
            {options.length === 0 && <p className="px-3 py-3 text-xs text-text-muted">{t('mkt_target_empty')}</p>}
            {options.map(o => {
              const on = ids.includes(o.id)
              return (
                <button key={o.id} type="button" onClick={() => toggle(o.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${on ? 'bg-accent-red/5' : 'hover:bg-bg-tertiary'}`}>
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${on ? 'bg-accent-red border-accent-red text-white' : 'border-border'}`}>
                    {on && <Check size={11} />}
                  </span>
                  <span className="flex-1 min-w-0 truncate text-text-primary">{o.label}</span>
                  {o.sub && <span className="text-text-muted shrink-0">{o.sub}</span>}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default TargetPicker
