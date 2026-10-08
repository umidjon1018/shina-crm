import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { PackageOpen } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import DateMaskInput from '../../../components/DateMaskInput'
import { toast, errorText } from '../../../components/ui/Toast'
import { useShopStore } from '../../../store/shopStore'
import { useDataStore } from '../../../store/dataStore'
import { useSettingsStore } from '../../../store/settingsStore'
import { getProdProducts, receiveMaterial } from '../../../api/productionService'
import { getSuppliers } from '../../../api/incomeService'
import { formatNumber } from '../../../utils/format'
import { inputCls, labelCls } from './prHelpers'

const n = (v) => Number(v) || 0

// Xomashyo kirimi (miqdor bo'yicha): partiya Kirimda ham ko'rinadi — yetkazib beruvchi qarzi va to'lovlari o'sha yerda
const ReceiveModal = ({ open, productId, shopId: presetShop, onClose }) => {
  const { t } = useTranslation()
  const { bump } = useDataStore()
  const usdRate = useSettingsStore(s => s.usdRate)
  const shops = useShopStore(s => s.shops).filter(s => s.isActive)
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [f, setF] = useState({})
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!open) return
    setErr('')
    const prodShop = shops.find(s => s.kind === 'production')
    setF({ productId: productId || '', shopId: presetShop && presetShop !== 'all' ? presetShop : (prodShop?.id || ''), qty: '', price: '', supplierId: '',
      paid: '', dueDate: '', expiresAt: '', lotNo: '', notes: '' })
    getProdProducts().then(l => setProducts(l.filter(p => p.stockMode === 'bulk'))).catch(() => setProducts([]))
    getSuppliers().then(setSuppliers).catch(() => setSuppliers([]))
  }, [open])

  const set = (k) => (e) => setF(s => ({ ...s, [k]: e.target.value }))
  const prod = products.find(p => p.id === f.productId)
  const total = n(f.qty) * n(f.price)

  const submit = async () => {
    setErr('')
    if (!f.productId) return setErr(t('pr_err_product'))
    if (!f.shopId) return setErr(t('pr_err_shop'))
    if (!(n(f.qty) > 0)) return setErr(t('pr_err_qty'))
    if (!(n(f.price) > 0)) return setErr(t('pr_err_price'))
    setSaving(true)
    try {
      const res = await receiveMaterial({
        product_id: f.productId, shop_id: f.shopId, qty: n(f.qty), unit_price: n(f.price), supplier_id: f.supplierId || undefined,
        paid_amount: n(f.paid), due_date: f.dueDate || undefined, expires_at: f.expiresAt || undefined, lot_no: f.lotNo || undefined,
        notes: f.notes || undefined, usd_rate: usdRate || undefined,
      })
      toast(t('pr_received', { no: res.batchNumber }))
      bump()
      onClose()
    } catch (e) { setErr(errorText(e, t('exp_err_generic'))) } finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} size="md" icon={PackageOpen} title={t('pr_receive')} subtitle={t('pr_receive_sub')}
      footer={
        <div className="space-y-2">
          {err && <div className="text-sm text-accent-red bg-accent-red/10 px-3 py-2.5 rounded-xl">{err}</div>}
          <div className="flex items-center gap-3">
            <div className="flex-1"><p className="text-sm text-text-muted">{t('pr_total')}</p><p className="text-lg font-bold">{formatNumber(total)} {t('unit_som')}</p></div>
            <button onClick={submit} disabled={saving} className="px-6 py-3 rounded-xl g-brand text-white font-bold disabled:opacity-50">{saving ? '...' : t('pr_save')}</button>
          </div>
        </div>
      }>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className={labelCls}>{t('pr_f_material')} *</label>
          <select value={f.productId || ''} onChange={set('productId')} className={inputCls}>
            <option value="">{t('pr_choose')}</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
          </select>
          {!products.length && <p className="text-xs text-text-muted mt-1">{t('pr_no_materials_hint')}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>{t('pr_f_shop')} *</label>
          <select value={f.shopId || ''} onChange={set('shopId')} className={inputCls}>
            <option value="">{t('pr_choose')}</option>
            {shops.map(s => <option key={s.id} value={s.id}>{s.name}{s.kind !== 'retail' ? ` · ${t('shop_kind_' + s.kind)}` : ''}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>{t('pr_f_qty')}{prod ? ` (${prod.unit})` : ''} *</label>
          <input type="number" min="0" step="any" value={f.qty || ''} onChange={set('qty')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t('pr_f_price')}{prod ? ` / ${prod.unit}` : ''} *</label>
          <input type="number" min="0" step="any" value={f.price || ''} onChange={set('price')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t('pr_f_supplier')}</label>
          <select value={f.supplierId || ''} onChange={set('supplierId')} className={inputCls}>
            <option value="">{t('pr_no_supplier')}</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>{t('pr_f_paid')}</label>
          <div className="flex gap-2">
            <input type="number" min="0" value={f.paid || ''} onChange={set('paid')} placeholder="0" className={inputCls} />
            <button type="button" onClick={() => setF(s => ({ ...s, paid: String(Math.round(total)) }))} disabled={!total}
              className="px-3 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-bg-tertiary whitespace-nowrap disabled:opacity-40">{t('pr_paid_all')}</button>
          </div>
        </div>
        <div>
          <label className={labelCls}>{t('pr_f_due')}</label>
          <DateMaskInput value={f.dueDate} onChange={set('dueDate')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t('pr_f_expires')}</label>
          <DateMaskInput value={f.expiresAt} onChange={set('expiresAt')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t('pr_f_lot')}</label>
          <input value={f.lotNo || ''} onChange={set('lotNo')} placeholder={t('pr_f_lot_ph')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t('pr_f_notes')}</label>
          <input value={f.notes || ''} onChange={set('notes')} className={inputCls} />
        </div>
        <p className="sm:col-span-2 text-xs text-text-muted">{t('pr_receive_hint')}</p>
      </div>
    </Modal>
  )
}

export default ReceiveModal
