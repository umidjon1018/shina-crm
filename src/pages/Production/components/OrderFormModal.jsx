import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Factory, AlertTriangle } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import DateMaskInput from '../../../components/DateMaskInput'
import { toast, errorText } from '../../../components/ui/Toast'
import { useShopStore } from '../../../store/shopStore'
import { useDataStore } from '../../../store/dataStore'
import { getRecipes, getMaterials, createProdOrder } from '../../../api/productionService'
import { formatNumber } from '../../../utils/format'
import { inputCls, labelCls, fmtQty } from './prHelpers'

const n = (v) => Number(v) || 0

// Yangi ishlab chiqarish buyurtmasi: retsept, sex (xomashyo shu yerdan yechiladi), mahsulot qayerga kirishi, reja miqdori
const OrderFormModal = ({ open, recipeId, onClose, onSaved }) => {
  const { t } = useTranslation()
  const { bump } = useDataStore()
  const shops = useShopStore(s => s.shops).filter(s => s.isActive)
  const sexes = shops.filter(s => s.kind === 'production')
  const [recipes, setRecipes] = useState([])
  const [stock, setStock] = useState({})
  const [f, setF] = useState({})
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!open) return
    setErr('')
    const sex = sexes[0]?.id || ''
    setF({ recipeId: recipeId || '', shopId: sex, outputShopId: sex, qty: '', date: '', notes: '' })
    getRecipes().then(l => setRecipes(l.filter(r => r.isActive))).catch(() => setRecipes([]))
  }, [open])

  useEffect(() => {
    if (!open || !f.shopId) { setStock({}); return }
    getMaterials(f.shopId).then(l => setStock(Object.fromEntries(l.map(m => [m.productId, m.qty])))).catch(() => setStock({}))
  }, [open, f.shopId])

  const set = (k) => (e) => setF(s => ({ ...s, [k]: e.target.value }))
  const recipe = recipes.find(r => r.id === f.recipeId)
  const k = recipe ? n(f.qty) / (recipe.outputQty || 1) * (1 + recipe.wastePercent / 100) : 0
  const need = recipe ? recipe.items.map(i => ({ ...i, need: i.qty * k, have: n(stock[i.productId]) })) : []
  const short = need.some(x => x.need > x.have + 0.0005)

  const submit = async () => {
    setErr('')
    if (!f.recipeId) return setErr(t('pr_err_recipe'))
    if (!f.shopId) return setErr(t('pr_err_sex'))
    if (!(n(f.qty) > 0)) return setErr(t('pr_err_qty'))
    setSaving(true)
    try {
      const res = await createProdOrder({ recipe_id: f.recipeId, shop_id: f.shopId, output_shop_id: f.outputShopId || f.shopId,
        planned_qty: n(f.qty), planned_date: f.date || undefined, notes: f.notes || undefined })
      toast(t('pr_order_saved', { no: res.no }))
      bump()
      onSaved?.(res)
    } catch (e) { setErr(errorText(e, t('exp_err_generic'))) } finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} size="lg" icon={Factory} title={t('pr_new_order')} subtitle={t('pr_new_order_sub')}
      footer={
        <div className="space-y-2">
          {err && <div className="text-sm text-accent-red bg-accent-red/10 px-3 py-2.5 rounded-xl">{err}</div>}
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              {recipe?.estUnitCost !== undefined && n(f.qty) > 0 && <>
                <p className="text-sm text-text-muted">{t('pr_est_total')}</p>
                <p className="text-lg font-bold">{formatNumber(recipe.estUnitCost * n(f.qty))} {t('unit_som')}</p>
              </>}
            </div>
            <button onClick={submit} disabled={saving} className="px-6 py-3 rounded-xl g-brand text-white font-bold disabled:opacity-50">{saving ? '...' : t('pr_save')}</button>
          </div>
        </div>
      }>
      {!sexes.length ? (
        <div className="text-center py-10 space-y-2">
          <Factory size={36} className="mx-auto text-text-muted" />
          <p className="text-[15px] font-semibold text-text-primary">{t('pr_no_sex')}</p>
          <p className="text-sm text-text-muted">{t('pr_no_sex_hint')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>{t('pr_f_recipe')} *</label>
            <select value={f.recipeId || ''} onChange={set('recipeId')} className={inputCls}>
              <option value="">{t('pr_choose')}</option>
              {recipes.map(r => <option key={r.id} value={r.id}>{r.productName}{r.name ? ` — ${r.name}` : ''} · v{r.version}</option>)}
            </select>
            {!recipes.length && <p className="text-xs text-text-muted mt-1">{t('pr_no_recipes_hint')}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t('pr_f_sex')} *</label>
              <select value={f.shopId || ''} onChange={e => setF(s => ({ ...s, shopId: e.target.value, outputShopId: s.outputShopId === s.shopId ? e.target.value : s.outputShopId }))} className={inputCls}>
                {sexes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('pr_f_output_shop')}</label>
              <select value={f.outputShopId || ''} onChange={set('outputShopId')} className={inputCls}>
                {shops.map(s => <option key={s.id} value={s.id}>{s.name}{s.kind !== 'retail' ? ` · ${t('shop_kind_' + s.kind)}` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('pr_f_planned')}{recipe ? ` (${recipe.productUnit})` : ''} *</label>
              <input type="number" min="0" step={recipe?.productMode === 'serial' ? 1 : 'any'} value={f.qty || ''} onChange={set('qty')} className={inputCls + ' text-lg font-bold'} />
            </div>
            <div>
              <label className={labelCls}>{t('pr_f_date')}</label>
              <DateMaskInput value={f.date} onChange={set('date')} className={inputCls} />
            </div>
          </div>

          {recipe && n(f.qty) > 0 && (
            <div className="bg-bg-secondary border border-border rounded-2xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-bg-tertiary">
                  <tr className="text-xs font-bold text-text-muted uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">{t('pr_f_material')}</th>
                    <th className="px-4 py-3 text-right">{t('pr_col_need')}</th>
                    <th className="px-4 py-3 text-right">{t('pr_col_have')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-[15px]">
                  {need.map(x => (
                    <tr key={x.productId}>
                      <td className="px-4 py-2.5">{x.name}</td>
                      <td className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">{fmtQty(x.need)} {x.unit}</td>
                      <td className={`px-4 py-2.5 text-right whitespace-nowrap ${x.need > x.have + 0.0005 ? 'text-accent-red font-bold' : 'text-text-secondary'}`}>{fmtQty(x.have)} {x.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recipe.wastePercent > 0 && <p className="px-4 py-2 text-xs text-text-muted border-t border-border">{t('pr_waste_included', { p: recipe.wastePercent })}</p>}
            </div>
          )}
          {short && <p className="flex items-center gap-2 text-sm text-accent-orange"><AlertTriangle size={16} />{t('pr_short_warn')}</p>}
          <div>
            <label className={labelCls}>{t('pr_f_notes')}</label>
            <textarea rows={2} value={f.notes || ''} onChange={set('notes')} className={inputCls + ' resize-none'} />
          </div>
        </div>
      )}
    </Modal>
  )
}

export default OrderFormModal
