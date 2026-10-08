import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, X } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import { toast, errorText } from '../../../components/ui/Toast'
import { useDataStore } from '../../../store/dataStore'
import { getProdProducts, getMaterials, saveRecipe } from '../../../api/productionService'
import { formatNumber } from '../../../utils/format'
import { inputCls, labelCls, CostsEditor, fmtQty } from './prHelpers'

const n = (v) => Number(v) || 0

// Retsept: mahsulotning chiqish birligi uchun xomashyolar, chiqit foizi va qo'shimcha xarajatlar (birlik uchun)
const RecipeFormModal = ({ open, recipe, copy, productId, onClose, onSaved }) => {
  const { t } = useTranslation()
  const { bump } = useDataStore()
  const [products, setProducts] = useState([])
  const [costMap, setCostMap] = useState({})
  const [f, setF] = useState(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!open) return
    setErr('')
    getProdProducts().then(setProducts).catch(() => setProducts([]))
    getMaterials().then(list => setCostMap(Object.fromEntries(list.map(m => [m.productId, m.avgCost])))).catch(() => {})
    const r = recipe
    setF(r ? {
      id: copy ? null : r.id, productId: r.productId, name: copy ? `${r.name || ''}`.trim() : r.name, outputQty: r.outputQty, wastePercent: r.wastePercent || '',
      notes: r.notes, isActive: copy ? true : r.isActive, items: r.items.map(i => ({ productId: i.productId, qty: i.qty })),
      costs: (r.costs || []).map(c => ({ name: c.name, amount: c.amount })),
    } : { id: null, productId: productId || '', name: '', outputQty: 1, wastePercent: '', notes: '', isActive: true, items: [{ productId: '', qty: '' }], costs: [] })
  }, [open])

  const outputs = products.filter(p => p.kind === 'finished' || p.kind === 'semi')
  const materials = products.filter(p => p.stockMode === 'bulk')
  const prodOf = (id) => products.find(p => p.id === id)
  const out = prodOf(f?.productId)

  const est = useMemo(() => {
    if (!f) return null
    const mat = f.items.reduce((s, i) => s + n(i.qty) * n(costMap[i.productId]), 0) * (1 + n(f.wastePercent) / 100)
    const perUnit = mat / (n(f.outputQty) || 1)
    const extra = f.costs.reduce((s, c) => s + n(c.amount), 0)
    return { perUnit, extra, total: perUnit + extra, known: f.items.every(i => !i.productId || costMap[i.productId] !== undefined) }
  }, [f, costMap])

  if (!f) return null
  const setItem = (idx, k, v) => setF(s => ({ ...s, items: s.items.map((it, j) => (j === idx ? { ...it, [k]: v } : it)) }))

  const submit = async () => {
    setErr('')
    if (!f.productId) return setErr(t('pr_err_product'))
    const items = f.items.filter(i => i.productId && n(i.qty) > 0)
    if (!items.length) return setErr(t('pr_err_items'))
    setSaving(true)
    try {
      const saved = await saveRecipe({ ...f, items, outputQty: n(f.outputQty) || 1, wastePercent: n(f.wastePercent),
        costs: f.costs.filter(c => c.name && n(c.amount) > 0).map(c => ({ name: c.name, amount: n(c.amount) })) })
      toast(t('pr_recipe_saved'))
      bump()
      onSaved?.(saved)
    } catch (e) { setErr(errorText(e, t('exp_err_generic'))) } finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} size="lg" icon={BookOpen} title={f.id ? t('pr_edit_recipe') : t('pr_new_recipe')}
      subtitle={f.id && recipe ? `v${recipe.version}` : copy ? t('pr_recipe_copy_hint') : ''}
      footer={
        <div className="space-y-2">
          {err && <div className="text-sm text-accent-red bg-accent-red/10 px-3 py-2.5 rounded-xl">{err}</div>}
          <div className="flex items-center gap-3">
            {est && (
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-muted">{t('pr_est_unit_cost')}{out ? ` (1 ${out.unit})` : ''}</p>
                <p className="text-lg font-bold">{formatNumber(est.total)} {t('unit_som')}{!est.known && <span className="text-xs text-text-muted font-normal"> · {t('pr_est_partial')}</span>}</p>
              </div>
            )}
            <button onClick={submit} disabled={saving} className="px-6 py-3 rounded-xl g-brand text-white font-bold disabled:opacity-50">{saving ? '...' : t('pr_save')}</button>
          </div>
        </div>
      }>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className={labelCls}>{t('pr_f_output')} *</label>
            <select value={f.productId} onChange={e => setF(s => ({ ...s, productId: e.target.value }))} className={inputCls}>
              <option value="">{t('pr_choose')}</option>
              {outputs.map(p => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
            </select>
            {!outputs.length && <p className="text-xs text-text-muted mt-1">{t('pr_no_outputs')}</p>}
          </div>
          <div>
            <label className={labelCls}>{t('pr_f_recipe_name')}</label>
            <input value={f.name || ''} onChange={e => setF(s => ({ ...s, name: e.target.value }))} placeholder={t('pr_f_recipe_name_ph')} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t('pr_f_output_qty')}{out ? ` (${out.unit})` : ''}</label>
            <input type="number" min="0" step="any" value={f.outputQty} onChange={e => setF(s => ({ ...s, outputQty: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t('pr_f_waste')}</label>
            <input type="number" min="0" max="100" step="any" value={f.wastePercent} onChange={e => setF(s => ({ ...s, wastePercent: e.target.value }))} placeholder="0" className={inputCls} />
          </div>
          {f.id && (
            <label className="flex items-center gap-2.5 text-[15px] text-text-primary pt-7">
              <input type="checkbox" checked={f.isActive} onChange={e => setF(s => ({ ...s, isActive: e.target.checked }))} className="w-5 h-5 accent-[#E63946]" />{t('pr_f_active')}
            </label>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-bold uppercase tracking-wider text-text-muted">{t('pr_materials')}</h4>
          <p className="text-sm text-text-muted">{t('pr_items_hint', { qty: fmtQty(f.outputQty || 1), unit: out?.unit || '' })}</p>
          {f.items.map((it, idx) => {
            const m = prodOf(it.productId)
            return (
              <div key={idx} className="flex flex-wrap items-center gap-2">
                <select value={it.productId} onChange={e => setItem(idx, 'productId', e.target.value)} className={inputCls + ' flex-1 min-w-[200px]'}>
                  <option value="">{t('pr_choose_material')}</option>
                  {materials.filter(p => p.id !== f.productId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <div className="relative w-36">
                  <input type="number" min="0" step="any" value={it.qty} onChange={e => setItem(idx, 'qty', e.target.value)} placeholder="0" className={inputCls + ' pr-12 text-right'} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">{m?.unit || ''}</span>
                </div>
                <span className="w-28 text-right text-sm text-text-muted">{costMap[it.productId] !== undefined ? formatNumber(n(it.qty) * n(costMap[it.productId])) : ''}</span>
                <button type="button" onClick={() => setF(s => ({ ...s, items: s.items.filter((_, j) => j !== idx) }))}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-accent-red hover:bg-accent-red/10"><X size={17} /></button>
              </div>
            )
          })}
          <button type="button" onClick={() => setF(s => ({ ...s, items: [...s.items, { productId: '', qty: '' }] }))}
            className="px-3 py-2 rounded-xl border border-dashed border-border text-sm font-semibold text-text-secondary hover:bg-bg-tertiary">+ {t('pr_add_material')}</button>
          {!materials.length && <p className="text-xs text-text-muted">{t('pr_no_materials_hint')}</p>}
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-bold uppercase tracking-wider text-text-muted">{t('pr_extra_costs')}</h4>
          <CostsEditor value={f.costs} onChange={(costs) => setF(s => ({ ...s, costs }))} t={t} hint={t('pr_costs_unit_hint', { unit: out?.unit || '' })} />
        </div>
        <div>
          <label className={labelCls}>{t('pr_f_notes')}</label>
          <textarea rows={2} value={f.notes || ''} onChange={e => setF(s => ({ ...s, notes: e.target.value }))} className={inputCls + ' resize-none'} />
        </div>
      </div>
    </Modal>
  )
}

export default RecipeFormModal
