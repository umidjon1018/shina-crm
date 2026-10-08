import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus, Pencil, Trash2, Check, X, Percent } from 'lucide-react'
import DataTable from '../../../components/ui/DataTable'
import { toast, errorText } from '../../../components/ui/Toast'
import { useAuthStore } from '../../../store/authStore'
import { useShopStore } from '../../../store/shopStore'
import { getWhGroups, saveWhGroup, deleteWhGroup, getWhProducts, setWhProductPrice } from '../../../api/wholesaleService'
import { formatNumber } from '../../../utils/format'
import { Spinner, inputCls, sizeOf } from '../components/whHelpers'

// Ulgurji narxni jadvalda tahrirlash: Enter yoki maydondan chiqqanda saqlanadi
const PriceCell = ({ product, canEdit, onSaved }) => {
  const { t } = useTranslation()
  const [v, setV] = useState(product.wholesalePrice ?? '')
  useEffect(() => { setV(product.wholesalePrice ?? '') }, [product.wholesalePrice])
  if (!canEdit) return product.wholesalePrice === null ? '—' : <b>{formatNumber(product.wholesalePrice)}</b>
  const commit = async () => {
    const next = v === '' ? null : Number(v)
    if (next === product.wholesalePrice) return
    try { await setWhProductPrice(product.id, next); toast(t('wh_price_saved')); onSaved(product.id, next) }
    catch (e) { toast(errorText(e, t('exp_err_generic')), 'error'); setV(product.wholesalePrice ?? '') }
  }
  return (
    <input type="number" min="0" value={v} placeholder="—" onClick={e => e.stopPropagation()}
      onChange={e => setV(e.target.value)} onBlur={commit} onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
      className="w-32 text-right bg-bg-tertiary border border-border rounded-lg px-2.5 py-1.5 text-[15px] font-semibold text-text-primary focus:outline-none focus:border-accent-red" />
  )
}

const GroupsPanel = ({ canEdit }) => {
  const { t } = useTranslation()
  const [groups, setGroups] = useState([])
  const [edit, setEdit] = useState(null)
  const load = () => getWhGroups().then(setGroups).catch(() => {})
  useEffect(() => { load() }, [])
  const save = async () => {
    try { await saveWhGroup({ ...edit, discountPercent: Number(edit.discountPercent) || 0 }); setEdit(null); load() }
    catch (e) { toast(errorText(e, t('exp_err_generic')), 'error') }
  }
  const remove = async (g) => {
    if (!window.confirm(t('wh_group_delete_confirm', { name: g.name }))) return
    try { await deleteWhGroup(g.id); load() } catch (e) { toast(errorText(e, t('exp_err_generic')), 'error') }
  }

  return (
    <div className="panel p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-text-primary">{t('wh_groups')}</h3>
          <p className="text-sm text-text-muted">{t('wh_groups_hint')}</p>
        </div>
        {canEdit && !edit && (
          <button onClick={() => setEdit({ name: '', discountPercent: '' })} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border font-semibold hover:bg-bg-tertiary"><Plus size={17} />{t('wh_add_group')}</button>
        )}
      </div>
      {edit && (
        <div className="flex flex-wrap items-center gap-2">
          <input value={edit.name} onChange={e => setEdit(s => ({ ...s, name: e.target.value }))} placeholder={t('wh_group_name_ph')} className={inputCls + ' flex-1 min-w-[180px]'} autoFocus />
          <div className="relative w-32">
            <input type="number" min="0" max="100" value={edit.discountPercent} onChange={e => setEdit(s => ({ ...s, discountPercent: e.target.value }))} placeholder="0" className={inputCls + ' pr-9'} />
            <Percent size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
          </div>
          <button onClick={save} className="w-11 h-11 rounded-xl g-brand text-white flex items-center justify-center"><Check size={19} /></button>
          <button onClick={() => setEdit(null)} className="w-11 h-11 rounded-xl border border-border flex items-center justify-center hover:bg-bg-tertiary"><X size={19} /></button>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {groups.map(g => (
          <span key={g.id} className="inline-flex items-center gap-2 pl-3.5 pr-1.5 py-1.5 rounded-xl bg-bg-tertiary text-[15px]">
            <b className="text-text-primary">{g.name}</b><span className="text-accent-green font-semibold">−{g.discountPercent}%</span>
            {canEdit && <>
              <button onClick={() => setEdit(g)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-secondary"><Pencil size={15} /></button>
              <button onClick={() => remove(g)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-accent-red hover:bg-accent-red/10"><Trash2 size={15} /></button>
            </>}
          </span>
        ))}
        {!groups.length && !edit && <p className="text-sm text-text-muted">{t('wh_no_groups')}</p>}
      </div>
    </div>
  )
}

// Ulgurji narxlar: standart ulgurji narx (tovarga), narx guruhlari (chegirma %), mijozga individual narx — mijoz profilida
const PricesTab = () => {
  const { t } = useTranslation()
  const hasPermission = useAuthStore(s => s.hasPermission)
  const whShops = useShopStore(s => s.shops).filter(s => s.kind === 'wholesale' && s.isActive)
  const canEdit = hasPermission('wholesale.prices')
  const [shopId, setShopId] = useState('all')
  const [products, setProducts] = useState(null)
  const [q, setQ] = useState('')
  const [onlyStock, setOnlyStock] = useState(true)

  useEffect(() => { getWhProducts({ shopId }).then(setProducts).catch(() => setProducts([])) }, [shopId])

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return (products || []).filter(p => (!onlyStock || p.stock > 0) && (!s || `${p.name} ${p.size}`.toLowerCase().includes(s)))
  }, [products, q, onlyStock])
  const onSaved = (id, price) => setProducts(ps => ps.map(p => (p.id === id ? { ...p, wholesalePrice: price } : p)))
  const hasCost = products?.some(p => p.avgCost !== undefined)
  const margin = (p) => (p.wholesalePrice && p.avgCost ? Math.round(((p.wholesalePrice - p.avgCost) / p.wholesalePrice) * 100) : null)

  return (
    <div className="space-y-4">
      <GroupsPanel canEdit={canEdit} />
      <p className="text-sm text-text-muted">{t('wh_prices_hint')}</p>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('wh_search_product')} className={inputCls + ' pl-10'} />
        </div>
        <select value={shopId} onChange={e => setShopId(e.target.value)} className={inputCls + ' w-auto'}>
          <option value="all">{t('wh_all_shops')}</option>
          {whShops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-[15px] text-text-secondary px-1">
          <input type="checkbox" checked={onlyStock} onChange={e => setOnlyStock(e.target.checked)} className="w-5 h-5 accent-[#E63946]" />{t('wh_only_stock')}
        </label>
      </div>
      {!products ? <Spinner /> : (
        <DataTable tableId="wh_prices" rows={rows} empty={t('wh_nothing_found')} resetKey={q + onlyStock + shopId} pageSize={30}
          columns={[
            { key: 'name', label: t('wh_col_product'), sortValue: r => r.name, render: r => <><p className="font-semibold">{r.name}</p><p className="text-sm text-text-muted">{sizeOf(r.name, r.size)}</p></> },
            { key: 'stock', label: t('wh_col_stock'), align: 'right', sortValue: r => r.stock, render: r => r.stock },
            ...(hasCost ? [{ key: 'cost', label: t('wh_col_cost'), align: 'right', optional: true, sortValue: r => r.avgCost || 0, render: r => (r.avgCost ? formatNumber(r.avgCost) : '—') }] : []),
            { key: 'retail', label: t('wh_col_retail'), align: 'right', sortValue: r => r.cashPrice, render: r => formatNumber(r.cashPrice) },
            { key: 'wh', label: t('wh_col_wh_price'), align: 'right', sortValue: r => r.wholesalePrice || 0, render: r => <PriceCell product={r} canEdit={canEdit} onSaved={onSaved} /> },
            ...(hasCost ? [{ key: 'margin', label: t('wh_col_margin'), align: 'right', optional: true, sortValue: r => margin(r) ?? -999,
              render: r => { const m = margin(r); return m === null ? '—' : <span className={m < 0 ? 'text-accent-red font-semibold' : 'text-accent-green font-semibold'}>{m}%</span> } }] : []),
          ]} />
      )}
    </div>
  )
}

export default PricesTab
