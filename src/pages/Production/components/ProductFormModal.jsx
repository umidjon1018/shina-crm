import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { PackagePlus } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import { toast, errorText } from '../../../components/ui/Toast'
import { useDataStore } from '../../../store/dataStore'
import { createProdProduct, updateProdProduct } from '../../../api/productionService'
import { inputCls, labelCls, KINDS, UNITS } from './prHelpers'

const EMPTY = { name: '', kind: 'raw', stockMode: 'bulk', unit: 'kg', shelfLifeDays: '', lowStock: '', cashPrice: '', wholesalePrice: '' }

// Xomashyo / yarim tayyor / tayyor mahsulot: turi, hisob turi (dona yoki miqdor), birligi, yaroqlilik muddati
const ProductFormModal = ({ open, product, defaultKind, onClose, onSaved }) => {
  const { t } = useTranslation()
  const { bump } = useDataStore()
  const [f, setF] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!open) return
    setErr('')
    if (product) {
      setF({ ...EMPTY, name: product.rawName || product.name, kind: product.kind, stockMode: product.stockMode, unit: product.baseUnit || product.unit,
        shelfLifeDays: product.shelfLifeDays ?? '', lowStock: product.lowStock || '' })
    } else {
      const kind = defaultKind || 'raw'
      setF({ ...EMPTY, kind, stockMode: kind === 'finished' ? 'serial' : 'bulk', unit: kind === 'finished' ? 'dona' : 'kg' })
    }
  }, [open])

  const set = (k) => (e) => setF(s => ({ ...s, [k]: e.target.value }))
  const submit = async () => {
    setErr('')
    if (!f.name.trim()) return setErr(t('pr_err_name'))
    setSaving(true)
    try {
      const body = { ...f, shelfLifeDays: f.shelfLifeDays === '' ? null : Number(f.shelfLifeDays), lowStock: Number(f.lowStock) || 0,
        cashPrice: Number(f.cashPrice) || 0, wholesalePrice: Number(f.wholesalePrice) || null }
      const saved = product ? await updateProdProduct(product.id, body) : await createProdProduct(body)
      toast(t('pr_product_saved'))
      bump()
      onSaved?.(saved)
    } catch (e) { setErr(errorText(e, t('exp_err_generic'))) } finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} size="md" icon={PackagePlus} title={product ? t('pr_edit_product') : t('pr_new_product')}
      footer={
        <div className="space-y-2">
          {err && <div className="text-sm text-accent-red bg-accent-red/10 px-3 py-2.5 rounded-xl">{err}</div>}
          <button onClick={submit} disabled={saving} className="w-full py-3 rounded-xl g-brand text-white font-bold disabled:opacity-50">{saving ? '...' : t('pr_save')}</button>
        </div>
      }>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className={labelCls}>{t('pr_f_name')} *</label>
          <input value={f.name} onChange={set('name')} autoFocus placeholder={t('pr_f_name_ph')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t('pr_f_kind')}</label>
          <select value={f.kind} onChange={set('kind')} className={inputCls}>
            {KINDS.map(k => <option key={k} value={k}>{t('pr_kind_' + k)}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>{t('pr_f_mode')}</label>
          <select value={f.stockMode} onChange={set('stockMode')} className={inputCls}>
            <option value="bulk">{t('pr_mode_bulk')}</option>
            <option value="serial">{t('pr_mode_serial')}</option>
          </select>
        </div>
        <p className="sm:col-span-2 text-xs text-text-muted -mt-1">{t('pr_mode_hint')}</p>
        <div>
          <label className={labelCls}>{t('pr_f_unit')}</label>
          <input list="pr-units" value={f.unit} onChange={set('unit')} className={inputCls} />
          <datalist id="pr-units">{UNITS.map(u => <option key={u} value={u} />)}</datalist>
        </div>
        <div>
          <label className={labelCls}>{t('pr_f_shelf')}</label>
          <input type="number" min="0" value={f.shelfLifeDays} onChange={set('shelfLifeDays')} placeholder={t('pr_f_shelf_ph')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t('pr_f_low')}</label>
          <input type="number" min="0" value={f.lowStock} onChange={set('lowStock')} placeholder="0" className={inputCls} />
        </div>
        {!product && f.kind === 'finished' && <>
          <div>
            <label className={labelCls}>{t('pr_f_retail')}</label>
            <input type="number" min="0" value={f.cashPrice} onChange={set('cashPrice')} placeholder="0" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t('pr_f_wholesale')}</label>
            <input type="number" min="0" value={f.wholesalePrice} onChange={set('wholesalePrice')} placeholder="0" className={inputCls} />
          </div>
        </>}
      </div>
    </Modal>
  )
}

export default ProductFormModal
