import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Gift, Package, Plus, Receipt, Repeat, Tag, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import DateMaskInput from '../../../components/DateMaskInput'
import { useShopStore } from '../../../store/shopStore'
import { createPromotion, updatePromotion } from '../../../api/promotionService'
import TargetPicker from './TargetPicker'
import { promoSummary } from './mkHelpers'

const KINDS = [
  { id: 'discount', icon: Tag },
  { id: 'gift', icon: Gift },
  { id: 'carousel', icon: Repeat },
  { id: 'receipt', icon: Receipt },
  { id: 'bundle', icon: Package },
]
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0]

const inputCls = 'w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-red'
const Label = ({ children }) => <label className="text-text-secondary text-xs font-semibold mb-1.5 block">{children}</label>

// Komplekt tarkibi: tovar + soni (masalan, 4 ta shina + 4 ta disk)
const BundleItemsEditor = ({ items, products, onChange, t }) => {
  const [q, setQ] = useState('')
  const name = (id) => { const p = products.find(x => String(x.id) === String(id)); return p ? [p.brand, p.name].filter(Boolean).join(' ') : id }
  const found = q.trim().length < 2 ? [] : products
    .filter(p => p.isActive !== false && !items.some(i => String(i.productId) === String(p.id)))
    .filter(p => [p.name, p.brand, p.size].filter(Boolean).join(' ').toLowerCase().includes(q.trim().toLowerCase()))
    .slice(0, 8)
  return (
    <div>
      <Label>{t('mkt_bundle_items')}</Label>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={it.productId} className="flex items-center gap-2 bg-bg-tertiary border border-border rounded-xl px-3 py-2">
            <span className="flex-1 text-sm text-text-primary min-w-0 truncate">{name(it.productId)}</span>
            <input type="number" min="1" value={it.qty}
              onChange={e => onChange(items.map((x, j) => j === i ? { ...x, qty: Math.max(1, Number(e.target.value) || 1) } : x))}
              className="w-16 bg-bg-secondary border border-border rounded-lg px-2 py-1 text-sm text-center text-text-primary" />
            <span className="text-xs text-text-muted">{t('unit_pcs')}</span>
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="p-1.5 text-text-muted hover:text-accent-red"><Trash2 size={14} /></button>
          </div>
        ))}
        <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('mkt_bundle_search_ph')} className={inputCls} />
        {found.length > 0 && (
          <div className="border border-border rounded-xl overflow-hidden">
            {found.map(p => (
              <button key={p.id} type="button" onClick={() => { onChange([...items, { productId: String(p.id), qty: 1 }]); setQ('') }}
                className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-tertiary border-b border-border/50 last:border-0">
                {[p.brand, p.name].filter(Boolean).join(' ')} {p.size && <span className="text-text-muted text-xs">· {p.size}</span>}
              </button>
            ))}
          </div>
        )}
        <p className="text-xs text-text-muted">{t('mkt_bundle_hint')}</p>
      </div>
    </div>
  )
}

const PromoFormModal = ({ initial, onClose, onSaved, products, categories, customerGroups }) => {
  const { t } = useTranslation()
  const { shops } = useShopStore()
  const isEdit = !!initial?.id
  const [f, setF] = useState(() => JSON.parse(JSON.stringify(initial)))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setF(x => ({ ...x, [k]: v }))
  const setC = (k, v) => setF(x => ({ ...x, conditions: { ...x.conditions, [k]: v } }))

  const submit = async () => {
    setError('')
    if (!f.name.trim()) return setError(t('mkt_err_name'))
    setSaving(true)
    try {
      const saved = isEdit ? await updatePromotion(f.id, f) : await createPromotion(f)
      onSaved(saved)
      onClose()
    } catch (e) {
      setError(e?.response?.data?.error || t('exp_err_generic'))
    } finally {
      setSaving(false)
    }
  }

  const numInput = (k, props = {}) => (
    <input type="number" min="0" value={f[k] ?? ''} onChange={e => set(k, e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} {...props} />
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-bg-secondary border border-border rounded-2xl w-full max-w-2xl shadow-2xl z-10 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border sticky top-0 bg-bg-secondary z-10">
          <h3 className="font-syne font-bold text-lg text-text-primary">{isEdit ? t('mkt_promo_edit') : t('mkt_promo_new')}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-bg-tertiary rounded-lg"><X size={18} className="text-text-secondary" /></button>
        </div>

        <div className="p-4 sm:p-5 space-y-3 sm:space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>{t('mkt_promo_name')}</Label>
              <input value={f.name} onChange={e => set('name', e.target.value)} placeholder={t('mkt_promo_name_ph')} className={inputCls} autoFocus />
            </div>
            <div>
              <Label>{t('mkt_promo_desc')}</Label>
              <input value={f.description || ''} onChange={e => set('description', e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <Label>{t('mkt_promo_kind')}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {KINDS.map(k => {
                const Icon = k.icon
                return (
                  <button key={k.id} type="button" onClick={() => set('kind', k.id)}
                    className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${f.kind === k.id ? 'border-accent-red bg-accent-red/10' : 'border-border bg-bg-tertiary hover:border-accent-red/50'}`}>
                    <Icon size={16} className={f.kind === k.id ? 'text-accent-red' : 'text-text-secondary'} />
                    <span className="text-xs font-bold text-text-primary">{t('mkt_kind_' + k.id)}</span>
                    <span className="text-[10px] text-text-muted leading-tight">{t('mkt_kind_' + k.id + '_desc')}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {f.kind === 'bundle' && (
            <BundleItemsEditor items={f.bundleItems || []} products={products} onChange={(v) => set('bundleItems', v)} t={t} />
          )}

          {f.kind === 'bundle' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Label>{t('mkt_discount_type')}</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['percent', 'amount', 'fixed_price'].map(dt => (
                    <button key={dt} type="button" onClick={() => set('discountType', dt)}
                      className={`px-2 py-2 rounded-xl border text-xs font-semibold ${f.discountType === dt ? 'border-accent-red bg-accent-red/10 text-accent-red' : 'border-border bg-bg-tertiary text-text-secondary'}`}>
                      {t(dt === 'fixed_price' ? 'mkt_bundle_dt_price' : 'mkt_dt_' + dt)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>{f.discountType === 'percent' ? t('mkt_value_percent') : f.discountType === 'fixed_price' ? t('mkt_bundle_value_price') : t('mkt_value_amount')}</Label>
                {numInput('discountValue', { max: f.discountType === 'percent' ? 100 : undefined })}
              </div>
            </div>
          )}

          {f.kind !== 'receipt' && f.kind !== 'bundle' && (
            <div>
              <Label>{f.kind === 'gift' ? t('mkt_gift_buy_target') : t('mkt_promo_target')}</Label>
              <TargetPicker type={f.targetType} ids={f.targetIds} products={products} categories={categories}
                onChange={(type, ids) => setF(x => ({ ...x, targetType: type, targetIds: ids }))} />
            </div>
          )}

          {(f.kind === 'discount' || f.kind === 'receipt') && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Label>{t('mkt_discount_type')}</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(f.kind === 'receipt' ? ['percent', 'amount'] : ['percent', 'amount', 'fixed_price']).map(dt => (
                    <button key={dt} type="button" onClick={() => set('discountType', dt)}
                      className={`px-2 py-2 rounded-xl border text-xs font-semibold ${f.discountType === dt ? 'border-accent-red bg-accent-red/10 text-accent-red' : 'border-border bg-bg-tertiary text-text-secondary'}`}>
                      {t('mkt_dt_' + dt)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>{f.discountType === 'percent' ? t('mkt_value_percent') : f.discountType === 'fixed_price' ? t('mkt_value_price') : t('mkt_value_amount')}</Label>
                {numInput('discountValue', { max: f.discountType === 'percent' ? 100 : undefined })}
              </div>
              {f.kind === 'discount' && (
                <div>
                  <Label>{t('mkt_min_qty')}</Label>
                  {numInput('minQty', { min: 1 })}
                </div>
              )}
              {f.kind === 'receipt' && (
                <div>
                  <Label>{t('mkt_min_total')}</Label>
                  {numInput('minTotal')}
                </div>
              )}
            </div>
          )}

          {f.kind === 'gift' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div><Label>{t('mkt_buy_qty')}</Label>{numInput('buyQty', { min: 1 })}</div>
                <div><Label>{t('mkt_get_qty')}</Label>{numInput('getQty', { min: 1 })}</div>
                <div><Label>{t('mkt_get_discount')}</Label>{numInput('getDiscount', { max: 100 })}</div>
              </div>
              <div>
                <Label>{t('mkt_gift_target')}</Label>
                <div className="flex gap-1.5 mb-2">
                  <button type="button" onClick={() => setF(x => ({ ...x, giftTargetType: null, giftTargetIds: [] }))}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold ${!f.giftTargetType ? 'border-accent-red bg-accent-red/10 text-accent-red' : 'border-border bg-bg-tertiary text-text-secondary'}`}>
                    {t('mkt_gift_same')}
                  </button>
                  <button type="button" onClick={() => setF(x => ({ ...x, giftTargetType: x.giftTargetType || 'product', giftTargetIds: [] }))}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold ${f.giftTargetType ? 'border-accent-red bg-accent-red/10 text-accent-red' : 'border-border bg-bg-tertiary text-text-secondary'}`}>
                    {t('mkt_gift_other')}
                  </button>
                </div>
                {f.giftTargetType && (
                  <TargetPicker type={f.giftTargetType} ids={f.giftTargetIds} products={products} categories={categories} allowAll={false}
                    onChange={(type, ids) => setF(x => ({ ...x, giftTargetType: type, giftTargetIds: ids }))} />
                )}
              </div>
            </div>
          )}

          {f.kind === 'carousel' && (
            <div>
              <Label>{t('mkt_tiers')}</Label>
              <div className="space-y-2">
                {f.tiers.map((tr, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="number" min="1" value={tr.qty} onChange={e => set('tiers', f.tiers.map((x, j) => j === i ? { ...x, qty: Number(e.target.value) } : x))} className={inputCls + ' w-24'} />
                    <span className="text-xs text-text-muted whitespace-nowrap">{t('mkt_tier_qty')}</span>
                    <input type="number" min="0" max="100" value={tr.percent} onChange={e => set('tiers', f.tiers.map((x, j) => j === i ? { ...x, percent: Number(e.target.value) } : x))} className={inputCls + ' w-24'} />
                    <span className="text-xs text-text-muted">%</span>
                    <button type="button" onClick={() => set('tiers', f.tiers.filter((_, j) => j !== i))} className="p-2 text-text-muted hover:text-accent-red"><Trash2 size={14} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => set('tiers', [...f.tiers, { qty: (f.tiers[f.tiers.length - 1]?.qty || 0) + 1, percent: 0 }])}
                  className="flex items-center gap-1.5 text-xs font-semibold text-accent-red"><Plus size={13} /> {t('mkt_tier_add')}</button>
              </div>
            </div>
          )}

          {/* Shartlar */}
          <div className="rounded-2xl border border-border p-4 space-y-4">
            <p className="text-sm font-bold text-text-primary">{t('mkt_conditions')}</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t('mkt_start')}</Label><DateMaskInput value={f.startDate || ''} onChange={e => set('startDate', e.target.value)} className={inputCls} /></div>
              <div><Label>{t('mkt_end')}</Label><DateMaskInput value={f.endDate || ''} onChange={e => set('endDate', e.target.value)} className={inputCls} /></div>
            </div>
            <div>
              <Label>{t('mkt_weekdays')}</Label>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map(d => {
                  const on = f.conditions.weekdays.includes(d)
                  return (
                    <button key={d} type="button" onClick={() => setC('weekdays', on ? f.conditions.weekdays.filter(x => x !== d) : [...f.conditions.weekdays, d])}
                      className={`w-11 py-1.5 rounded-lg border text-xs font-semibold ${on ? 'border-accent-red bg-accent-red/10 text-accent-red' : 'border-border bg-bg-tertiary text-text-secondary'}`}>
                      {t('mkt_wd_' + d)}
                    </button>
                  )
                })}
              </div>
              <p className="text-[10px] text-text-muted mt-1">{t('mkt_weekdays_hint')}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t('mkt_time_from')}</Label><input type="time" value={f.conditions.timeFrom} onChange={e => setC('timeFrom', e.target.value)} className={inputCls} /></div>
              <div><Label>{t('mkt_time_to')}</Label><input type="time" value={f.conditions.timeTo} onChange={e => setC('timeTo', e.target.value)} className={inputCls} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>{t('mkt_customer_cond')}</Label>
                <select value={f.conditions.customer} onChange={e => setC('customer', e.target.value)} className={inputCls}>
                  {['any', 'registered', 'new', 'birthday', 'group'].map(c => <option key={c} value={c}>{t('mkt_cust_' + c)}</option>)}
                </select>
              </div>
              {f.conditions.customer === 'birthday' && (
                <div><Label>{t('mkt_birthday_days')}</Label>
                  <input type="number" min="0" max="30" value={f.conditions.birthdayDays} onChange={e => setC('birthdayDays', Number(e.target.value))} className={inputCls} />
                </div>
              )}
              {f.conditions.customer === 'group' && (
                <div>
                  <Label>{t('mkt_groups')}</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {customerGroups.length === 0 && <span className="text-xs text-text-muted">{t('mkt_no_groups')}</span>}
                    {customerGroups.map(g => {
                      const on = f.conditions.groups.includes(g)
                      return (
                        <button key={g} type="button" onClick={() => setC('groups', on ? f.conditions.groups.filter(x => x !== g) : [...f.conditions.groups, g])}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${on ? 'border-accent-red bg-accent-red/10 text-accent-red' : 'border-border bg-bg-tertiary text-text-secondary'}`}>{g}</button>
                      )
                    })}
                  </div>
                </div>
              )}
              <div>
                <Label>{t('mkt_shop')}</Label>
                <select value={f.shopId || 'all'} onChange={e => set('shopId', e.target.value)} className={inputCls}>
                  <option value="all">{t('mkt_all_shops')}</option>
                  {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              {[
                ['excludeInstallment', t('mkt_exclude_installment'), true],
                ['stackable', t('mkt_stackable'), false],
                ['requiresCode', t('mkt_requires_code'), false],
              ].map(([k, label, isCond]) => (
                <label key={k} className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 w-4 h-4 accent-[#E63946]"
                    checked={isCond ? !!f.conditions[k] : !!f[k]}
                    onChange={e => isCond ? setC(k, e.target.checked) : set(k, e.target.checked)} />
                  <span className="text-xs text-text-primary">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-accent-blue/5 border border-accent-blue/20 px-4 py-3 text-xs text-text-primary">
            <span className="font-bold text-accent-blue">{t('mkt_summary')}: </span>{promoSummary(f, t, products, categories)}
          </div>

          {error && <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 px-3 py-2 rounded-lg"><AlertCircle size={15} /> {error}</div>}
        </div>

        <div className="flex gap-3 p-4 sm:p-5 border-t border-border sticky bottom-0 bg-bg-secondary">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary hover:bg-bg-tertiary text-sm font-medium">{t('cancel')}</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-accent-red text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50">
            {saving ? t('exp_form_saving') : t('save')}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default PromoFormModal
