import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search } from 'lucide-react'
import DataTable from '../../../components/ui/DataTable'
import { Segmented } from '../../../components/ui/Kit'
import { useAuthStore } from '../../../store/authStore'
import { useDataStore } from '../../../store/dataStore'
import { getProdProducts } from '../../../api/productionService'
import { Spinner, inputCls, fmtQty, KindBadge } from '../components/prHelpers'
import ProductFormModal from '../components/ProductFormModal'

const FILTERS = ['production', 'raw', 'semi', 'finished', 'goods']

// Mahsulotlar: xomashyo, yarim tayyor, tayyor mahsulot — turi va hisob turi (dona yoki miqdor)
const ProductsTab = () => {
  const { t } = useTranslation()
  const { version } = useDataStore()
  const hasPermission = useAuthStore(s => s.hasPermission)
  const [list, setList] = useState(null)
  const [filter, setFilter] = useState('production')
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState(null)

  useEffect(() => { getProdProducts().then(setList).catch(() => setList([])) }, [version])

  const match = (p, f) => (f === 'production' ? p.kind !== 'goods' : p.kind === f)
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return (list || []).filter(p => match(p, filter) && (!s || p.name.toLowerCase().includes(s)))
  }, [list, filter, q])
  const canEdit = hasPermission('production.recipes')

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-muted">{t('pr_products_hint')}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Segmented value={filter} onChange={setFilter} options={FILTERS.map(f => ({ id: f, label: t(f === 'production' ? 'pr_kind_all' : 'pr_kind_' + f), count: list ? list.filter(p => match(p, f)).length : undefined }))} />
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('pr_search_product')} className={inputCls + ' pl-10'} />
        </div>
        {canEdit && <button onClick={() => setEdit({ kind: filter === 'production' || filter === 'goods' ? 'raw' : filter })} className="flex items-center gap-2 px-4 py-2.5 rounded-xl g-brand text-white font-bold"><Plus size={18} />{t('pr_new_product')}</button>}
      </div>
      {!list ? <Spinner /> : (
        <DataTable tableId="pr_products" rows={rows} onRowClick={canEdit ? p => setEdit({ product: p }) : undefined} empty={t('pr_no_products')} resetKey={filter + q}
          columns={[
            { key: 'name', label: t('pr_f_name'), sortValue: p => p.name, render: p => <span className="font-semibold">{p.name}</span> },
            { key: 'kind', label: t('pr_f_kind'), render: p => <KindBadge kind={p.kind} t={t} /> },
            { key: 'mode', label: t('pr_f_mode'), render: p => t(p.stockMode === 'bulk' ? 'pr_mode_bulk_short' : 'pr_mode_serial_short') },
            { key: 'stock', label: t('pr_col_stock'), align: 'right', sortValue: p => p.stock, render: p => <b>{fmtQty(p.stock)} {p.unit}</b> },
            { key: 'shelf', label: t('pr_f_shelf'), align: 'right', optional: true, render: p => (p.shelfLifeDays ? t('pr_days_n', { n: p.shelfLifeDays }) : '—') },
            { key: 'low', label: t('pr_f_low'), align: 'right', optional: true, render: p => (p.lowStock ? fmtQty(p.lowStock) : '—') },
            { key: 'recipes', label: t('pr_col_recipes'), align: 'right', optional: true, render: p => p.recipes || '—' },
          ]} />
      )}
      <ProductFormModal open={!!edit} product={edit?.product} defaultKind={edit?.kind} onClose={() => setEdit(null)} onSaved={() => setEdit(null)} />
    </div>
  )
}

export default ProductsTab
