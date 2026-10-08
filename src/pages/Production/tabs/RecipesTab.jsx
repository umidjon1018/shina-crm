import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Copy, Trash2, Factory, Search } from 'lucide-react'
import DataTable from '../../../components/ui/DataTable'
import { Badge } from '../../../components/ui/Kit'
import { toast, errorText } from '../../../components/ui/Toast'
import { useAuthStore } from '../../../store/authStore'
import { useDataStore } from '../../../store/dataStore'
import { getRecipes, deleteRecipe } from '../../../api/productionService'
import { formatNumber } from '../../../utils/format'
import { Spinner, inputCls, fmtQty, usePr } from '../components/prHelpers'
import RecipeFormModal from '../components/RecipeFormModal'

// Retseptlar: mahsulot birligi uchun xomashyo me'yori, chiqit, xarajatlar, taxminiy tannarx
const RecipesTab = () => {
  const { t } = useTranslation()
  const { version, bump } = useDataStore()
  const hasPermission = useAuthStore(s => s.hasPermission)
  const pr = usePr()
  const [list, setList] = useState(null)
  const [edit, setEdit] = useState(null)
  const [q, setQ] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => { getRecipes().then(setList).catch(() => setList([])) }, [version])

  const canEdit = hasPermission('production.recipes')
  const canOrder = hasPermission('production.orders')
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return (list || []).filter(r => (showArchived || r.isActive) && (!s || `${r.productName} ${r.name}`.toLowerCase().includes(s)))
  }, [list, q, showArchived])
  const hasCost = list?.some(r => r.estUnitCost !== undefined)

  const remove = async (r) => {
    if (!window.confirm(t('pr_recipe_delete_confirm', { name: r.productName }))) return
    try { const res = await deleteRecipe(r.id); toast(res.archived ? t('pr_recipe_archived') : t('pr_recipe_deleted')); bump() }
    catch (e) { toast(errorText(e, t('exp_err_generic')), 'error') }
  }
  const iconBtn = 'w-9 h-9 rounded-lg inline-flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-tertiary'

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-muted">{t('pr_recipes_hint')}</p>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('pr_search_recipe')} className={inputCls + ' pl-10'} />
        </div>
        <label className="flex items-center gap-2 text-[15px] text-text-secondary px-1">
          <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} className="w-5 h-5 accent-[#E63946]" />{t('pr_show_archived')}
        </label>
        {canEdit && <button onClick={() => setEdit({})} className="flex items-center gap-2 px-4 py-2.5 rounded-xl g-brand text-white font-bold"><Plus size={18} />{t('pr_new_recipe')}</button>}
      </div>
      {!list ? <Spinner /> : (
        <DataTable tableId="pr_recipes" rows={rows} onRowClick={canEdit ? r => setEdit({ recipe: r }) : undefined} empty={t('pr_no_recipes')} resetKey={q + showArchived}
          rowClass={r => (r.isActive ? '' : 'opacity-60')}
          columns={[
            { key: 'product', label: t('pr_col_product'), sortValue: r => r.productName, render: r => (
              <div><p className="font-semibold flex items-center gap-2">{r.productName}{!r.isActive && <Badge>{t('pr_archived')}</Badge>}</p>
                <p className="text-sm text-text-muted">{r.name || t('pr_recipe')} · v{r.version} · {t('pr_per_output', { qty: fmtQty(r.outputQty), unit: r.productUnit })}</p></div>
            ) },
            { key: 'items', label: t('pr_materials'), render: r => <span className="text-sm text-text-secondary">{r.items.map(i => `${i.name} ${fmtQty(i.qty)} ${i.unit}`).join(', ')}</span> },
            { key: 'waste', label: t('pr_f_waste'), align: 'right', optional: true, render: r => (r.wastePercent ? `${r.wastePercent}%` : '—') },
            ...(hasCost ? [{ key: 'cost', label: t('pr_est_unit_cost'), align: 'right', sortValue: r => r.estUnitCost, render: r => <b className="whitespace-nowrap">{formatNumber(r.estUnitCost)}</b> }] : []),
            { key: 'act', label: '', align: 'right', render: r => (
              <span className="inline-flex items-center gap-1" onClick={e => e.stopPropagation()}>
                {canOrder && r.isActive && <button title={t('pr_new_order')} onClick={() => pr.newOrder(r.id)} className={iconBtn}><Factory size={17} /></button>}
                {canEdit && <button title={t('pr_recipe_copy')} onClick={() => setEdit({ recipe: r, copy: true })} className={iconBtn}><Copy size={16} /></button>}
                {canEdit && r.isActive && <button title={t('pr_remove')} onClick={() => remove(r)} className={iconBtn + ' hover:!text-accent-red'}><Trash2 size={16} /></button>}
              </span>
            ) },
          ]} />
      )}
      <RecipeFormModal open={!!edit} recipe={edit?.recipe} copy={edit?.copy} onClose={() => setEdit(null)} onSaved={() => setEdit(null)} />
    </div>
  )
}

export default RecipesTab
