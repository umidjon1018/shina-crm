import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Layers, PackageOpen, ClipboardCheck } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import DataTable from '../../../components/ui/DataTable'
import { Segmented, DetailGrid } from '../../../components/ui/Kit'
import { toast, errorText } from '../../../components/ui/Toast'
import { useAuthStore } from '../../../store/authStore'
import { useDataStore } from '../../../store/dataStore'
import { useShopStore } from '../../../store/shopStore'
import { getMaterials, getMaterialDetail, adjustMaterial } from '../../../api/productionService'
import { formatNumber, formatDate, formatDateTime } from '../../../utils/format'
import { Spinner, inputCls, labelCls, fmtQty, qtyUnit, KindBadge, usePr } from './prHelpers'

// Inventarizatsiya: haqiqiy qoldiq kiritiladi, farq kamomad yoki ortiqcha sifatida yoziladi
const AdjustModal = ({ material, shopId, onClose }) => {
  const { t } = useTranslation()
  const { bump } = useDataStore()
  const shops = useShopStore(s => s.shops).filter(s => s.isActive)
  const [shop, setShop] = useState(shopId && shopId !== 'all' ? shopId : (shops.find(s => s.kind === 'production')?.id || ''))
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const submit = async () => {
    setErr('')
    if (!shop) return setErr(t('pr_err_shop'))
    if (qty === '' || Number(qty) < 0) return setErr(t('pr_err_qty'))
    setSaving(true)
    try {
      const r = await adjustMaterial({ product_id: material.productId, shop_id: shop, qty: Number(qty), note })
      toast(r.delta === 0 ? t('pr_adjust_same') : t('pr_adjusted', { d: (r.delta > 0 ? '+' : '') + fmtQty(r.delta), unit: material.unit }))
      bump()
      onClose()
    } catch (e) { setErr(errorText(e, t('exp_err_generic'))) } finally { setSaving(false) }
  }
  return (
    <Modal open onClose={onClose} size="sm" icon={ClipboardCheck} title={t('pr_adjust')} subtitle={material.name}
      footer={
        <div className="space-y-2">
          {err && <div className="text-sm text-accent-red bg-accent-red/10 px-3 py-2.5 rounded-xl">{err}</div>}
          <button onClick={submit} disabled={saving} className="w-full py-3 rounded-xl g-brand text-white font-bold disabled:opacity-50">{saving ? '...' : t('pr_save')}</button>
        </div>
      }>
      <div className="space-y-3">
        <div>
          <label className={labelCls}>{t('pr_f_shop')}</label>
          <select value={shop} onChange={e => setShop(e.target.value)} className={inputCls}>
            <option value="">{t('pr_choose')}</option>
            {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>{t('pr_actual_qty')} ({material.unit})</label>
          <input type="number" min="0" step="any" value={qty} onChange={e => setQty(e.target.value)} autoFocus className={inputCls + ' text-lg font-bold'} />
          <p className="text-xs text-text-muted mt-1">{t('pr_adjust_hint')}</p>
        </div>
        <div>
          <label className={labelCls}>{t('pr_f_notes')}</label>
          <input value={note} onChange={e => setNote(e.target.value)} className={inputCls} />
        </div>
      </div>
    </Modal>
  )
}

// Xomashyo: qoldiq, lotlar (kirim/ishlab chiqarish partiyalari), harakatlar tarixi
const MaterialModal = ({ productId, shopId, onClose }) => {
  const { t } = useTranslation()
  const { version } = useDataStore()
  const hasPermission = useAuthStore(s => s.hasPermission)
  const pr = usePr()
  const [material, setMaterial] = useState(null)
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('lots')
  const [adjust, setAdjust] = useState(false)

  useEffect(() => {
    getMaterials(shopId).then(l => setMaterial(l.find(m => m.productId === productId) || null)).catch(() => {})
    getMaterialDetail(productId, shopId).then(setData).catch(() => setData({ lots: [], moves: [] }))
  }, [productId, shopId, version])

  if (!material) return null
  const canEdit = hasPermission('production.materials')
  const hasCost = material.avgCost !== undefined
  const lots = (data?.lots || []).filter(l => tab === 'all_lots' || l.qtyLeft > 0)

  return (
    <Modal open onClose={onClose} size="lg" icon={Layers} title={material.name}
      subtitle={<span className="flex items-center gap-2"><KindBadge kind={material.kind} t={t} /> {qtyUnit(material.qty, material.unit)}</span>}
      footer={canEdit && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => pr.receive(material.productId)} className="flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 rounded-xl g-brand text-white font-bold"><PackageOpen size={18} />{t('pr_receive')}</button>
          <button onClick={() => setAdjust(true)} className="flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 rounded-xl border border-border font-bold text-text-primary hover:bg-bg-tertiary"><ClipboardCheck size={18} />{t('pr_adjust')}</button>
        </div>
      )}>
      <div className="space-y-4">
        <DetailGrid cols={3} items={[
          { label: t('pr_col_stock'), value: qtyUnit(material.qty, material.unit), className: material.low ? 'text-accent-red' : '' },
          hasCost && { label: t('pr_col_avg_cost'), value: `${formatNumber(material.avgCost)} / ${material.unit}` },
          hasCost && { label: t('pr_col_value'), value: `${formatNumber(material.value)} ${t('unit_som')}` },
          { label: t('pr_col_used30'), value: qtyUnit(material.used30, material.unit) },
          material.lowStock > 0 && { label: t('pr_f_low'), value: qtyUnit(material.lowStock, material.unit) },
          material.expiresAt && { label: t('pr_col_expires'), value: formatDate(material.expiresAt), className: material.expired ? 'text-accent-red' : '' },
        ]} />
        <Segmented value={tab} onChange={setTab} options={[
          { id: 'lots', label: t('pr_lots_active') }, { id: 'all_lots', label: t('pr_lots_all') }, { id: 'moves', label: t('pr_moves') },
        ]} />
        {!data ? <Spinner /> : tab === 'moves' ? (
          <DataTable tableId="pr_moves" rows={data.moves} empty={t('pr_no_moves')}
            columns={[
              { key: 'date', label: t('pr_col_date'), sortValue: r => r.createdAt, render: r => <span className="whitespace-nowrap">{formatDateTime(r.createdAt)}</span> },
              { key: 'kind', label: t('pr_col_operation'), render: r => <span>{t('pr_move_' + r.kind)}{r.refNo ? <button onClick={() => pr.openOrder(r.refId)} className="ml-1.5 text-accent-blue hover:underline">{r.refNo}</button> : ''}</span> },
              { key: 'qty', label: t('pr_col_qty'), align: 'right', sortValue: r => r.qty, render: r => <b className={r.qty < 0 ? 'text-accent-red' : 'text-accent-green'}>{r.qty > 0 ? '+' : ''}{fmtQty(r.qty)}</b> },
              ...(hasCost ? [{ key: 'cost', label: t('pr_col_unit_cost'), align: 'right', optional: true, render: r => formatNumber(r.unitCost) }] : []),
              { key: 'shop', label: t('pr_f_shop'), optional: true, render: r => r.shopName || '—' },
              { key: 'note', label: t('pr_f_notes'), optional: true, render: r => r.note || '—' },
              { key: 'by', label: t('pr_col_author'), optional: true, render: r => r.createdByName || '—' },
            ]} />
        ) : (
          <DataTable tableId="pr_lots" rows={lots} empty={t('pr_no_lots')}
            columns={[
              { key: 'lot', label: t('pr_col_lot'), render: r => <><p className="font-semibold">{r.lotNo || '—'}</p><p className="text-sm text-text-muted">{t('pr_src_' + r.source)}{r.supplierName ? ' · ' + r.supplierName : ''}</p></> },
              { key: 'date', label: t('pr_col_date'), sortValue: r => r.createdAt, render: r => formatDate(r.createdAt) },
              { key: 'left', label: t('pr_col_left'), align: 'right', sortValue: r => r.qtyLeft, render: r => <b>{fmtQty(r.qtyLeft)}</b> },
              { key: 'in', label: t('pr_col_in'), align: 'right', optional: true, render: r => fmtQty(r.qtyIn) },
              ...(hasCost ? [{ key: 'cost', label: t('pr_col_unit_cost'), align: 'right', render: r => formatNumber(r.unitCost) }] : []),
              { key: 'exp', label: t('pr_col_expires'), sortValue: r => r.expiresAt || '9', render: r => (r.expiresAt ? formatDate(r.expiresAt) : '—') },
              { key: 'shop', label: t('pr_f_shop'), optional: true, render: r => r.shopName || '—' },
            ]} />
        )}
      </div>
      {adjust && <AdjustModal material={material} shopId={shopId} onClose={() => setAdjust(false)} />}
    </Modal>
  )
}

export default MaterialModal
