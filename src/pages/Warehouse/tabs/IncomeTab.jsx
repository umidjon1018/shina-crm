import { useState, useEffect, useMemo } from 'react'
import DateMaskInput from '../../../components/DateMaskInput'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ArrowDownToLine, CheckCircle, Lock, Plus, Search, X, XCircle } from 'lucide-react'
import { getSuppliers, addBatch as apiAddBatch } from '../../../api/incomeService'
import { createProduct } from '../../../api/productService'
import { getCategoryColor } from '../../../utils/categoryColors'
import { useShopStore } from '../../../store/shopStore'
import { ShopPickerModal } from '../../../components/ShopPickerModal'
import ShopRequiredGuard from '../../../components/ShopRequiredGuard'
import { useAuthStore } from '../../../store/authStore'
import { useSettingsStore } from '../../../store/settingsStore'
import { Badge, Th, Td, isPrivileged } from '../whHelpers.jsx'
import UnitInput from '../../../components/UnitInput'

const IncomeTab = ({ products, batches, userRole, onSuccess, productCategories, selectedShopId, shopBatchIds }) => {
  const { t } = useTranslation()
  const { user, hasPermission } = useAuthStore()
  const { usdRate, productAttributeDefs } = useSettingsStore()
  const canFinance = hasPermission('warehouse.income.financial')
  const [shopPickCallback, setShopPickCallback] = useState(null)
  const requireShop = (cb) => {
    if (selectedShopId !== 'all') { cb(selectedShopId) }
    else { setShopPickCallback(() => cb) }
  }

  const [selectedProduct, setSelectedProduct] = useState(null)
  const [search, setSearch] = useState('')
  const [isNewProduct, setIsNewProduct] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [suppliers, setSuppliers] = useState([])
  const UNIT_OPTIONS = ['dona', 'metr', 'litr', 'kg', 'gramm', 'juft', 'ta']

  const [form, setForm] = useState({
    newProductName: '',
    quantity: '',
    unit: '',
    notes: '',
    attributes: {},
    // Moliyaviy (faqat admin/manager)
    supplierId: '',
    purchasePriceUSD: '',
    entryUsdRate: '',
    paymentStatus: 'credit',
    paidUSD: '',
    dueDate: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (canFinance) {
      getSuppliers().then(data => setSuppliers(data.filter(s => s.isActive))).catch(() => {})
    }
  }, [canFinance])

  // USD kurs default qiymat
  useEffect(() => {
    if (canFinance && usdRate) {
      setForm(f => ({ ...f, entryUsdRate: String(usdRate) }))
    }
  }, [canFinance, usdRate])

  const shopProducts = products
  const filtered = shopProducts.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase())
  )

  const resetForm = () => {
    setForm({
      newProductName: '', quantity: '', unit: '', notes: '', attributes: {},
      supplierId: '', purchasePriceUSD: '', entryUsdRate: String(usdRate || ''),
      paymentStatus: 'credit', paidUSD: '', dueDate: '',
    })
    setSelectedProduct(null)
    setSearch('')
    setIsNewProduct(false)
    setNewCategory('')
    setError('')
  }

  const handleSubmit = async () => {
    if (!isNewProduct && !selectedProduct) { setError(t('wh_in_err_select')); return }
    if (isNewProduct && !form.newProductName.trim()) { setError(t('wh_in_err_name')); return }
    if (!form.quantity || +form.quantity <= 0) { setError(t('wh_in_err_qty')); return }
    if (!form.unit?.trim()) { setError("O'lchov birligi majburiy"); return }
    if (canFinance) {
      if (!form.purchasePriceUSD || +form.purchasePriceUSD <= 0) { setError(t('wh_in_err_price')); return }
      if (!form.entryUsdRate || +form.entryUsdRate <= 0) { setError(t('wh_in_err_rate')); return }
    }
    setError('')
    requireShop(async (shopId) => {
    setLoading(true)
    try {
      const qty = +form.quantity
      let productId = selectedProduct?.id || null

      if (isNewProduct) {
        const created = await createProduct({
          name: form.newProductName.trim(),
          category: newCategory || '',
          cashPrice: 0, minSalePrice: 0,
        })
        productId = created.id
      }

      const supplier = canFinance ? suppliers.find(s => s.id === form.supplierId) : null
      const ppu = canFinance && form.purchasePriceUSD ? +form.purchasePriceUSD : 0
      const rate = canFinance && form.entryUsdRate ? +form.entryUsdRate : 0
      const paidUSD = canFinance && form.paidUSD ? +form.paidUSD : 0

      await apiAddBatch({
        productId,
        newProductName: isNewProduct ? form.newProductName.trim() : null,
        purchasePrice: ppu * rate,
        quantityIn: qty,
        quantityRemaining: qty,
        quantitySold: 0,
        supplierId: canFinance ? form.supplierId || null : null,
        supplierName: supplier ? supplier.name : null,
        shopId,
        notes: form.notes || null,
        receivedAt: new Date().toISOString(),
        receivedBy: user?.id,
        // Moliyaviy maydonlar (admin/manager uchun)
        purchasePriceUSD: ppu || null,
        entryUsdRate: rate || null,
        paymentStatus: canFinance ? form.paymentStatus : 'credit',
        paidUSD: canFinance ? paidUSD : 0,
        dueDate: canFinance ? (form.dueDate || null) : null,
        attributes: form.attributes || {},
        unit: form.unit || 'dona',
      })

      setSuccess(true)
      resetForm()
      setTimeout(() => { setSuccess(false); onSuccess() }, 1500)
    } catch (e) { console.error('addBatch error:', e?.response?.data || e?.message || e); setError(e?.response?.data?.error || e?.message || t('exp_err_generic')) }
    finally { setLoading(false) }
    }) // requireShop end
  }

  // Jami hisob (faqat admin/manager)
  const totalUSD = canFinance && form.purchasePriceUSD && form.quantity
    ? (+form.purchasePriceUSD * +form.quantity).toFixed(2)
    : null
  const totalUZS = totalUSD && form.entryUsdRate
    ? Math.round(+totalUSD * +form.entryUsdRate).toLocaleString('uz-UZ')
    : null

  const PAYMENT_STATUS_OPTS = [
    { value: 'credit',  label: t('wh_in_credit') },
    { value: 'partial', label: t('wh_in_partial') },
    { value: 'paid',    label: t('wh_in_paid') },
  ]

  return (
    <ShopRequiredGuard>
    <div className="grid lg:grid-cols-2 gap-6">
      {shopPickCallback && (
        <ShopPickerModal
          onConfirm={(shopId) => { const cb = shopPickCallback; setShopPickCallback(null); cb(shopId) }}
          onCancel={() => setShopPickCallback(null)}
        />
      )}
      {/* CHAP PANEL — Tovar tanlash */}
      <div className="bg-bg-secondary border border-border rounded-2xl p-5 flex flex-col gap-4 min-h-[420px]">
        <div className="flex items-center justify-between">
          <h3 className="font-syne font-bold text-text-primary">{t('wh_in_select')}</h3>
          {!isNewProduct ? (
            <button
              onClick={() => { setIsNewProduct(true); setSelectedProduct(null); setError('') }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-accent-red text-white hover:opacity-90 transition-opacity"
            >
              <Plus size={14} /> {t('col_new_product')}
            </button>
          ) : (
            <button
              onClick={() => { setIsNewProduct(false); setSelectedProduct(null); setError(''); setNewCategory('') }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-bg-tertiary border border-border text-text-secondary hover:text-accent-red hover:border-accent-red transition-all"
            >
              <X size={14} /> {t('cancel')}
            </button>
          )}
        </div>

        {!isNewProduct && (
          <>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('wh_in_search_ph')}
                className="w-full pl-9 pr-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue transition-colors"
              />
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 min-h-0" style={{ maxHeight: 'calc(100% - 80px)' }}>
              {filtered.map(p => {
                const catObj = productCategories?.find(c => c.id === p.category)
                const catColor = getCategoryColor(p.category, productCategories)
                const stock = p.totalStock || 0
                const pUnit = batches.find(b => b.productId === p.id)?.unit || 'dona'
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                      selectedProduct?.id === p.id
                        ? 'border-accent-red bg-accent-red/5'
                        : 'border-border hover:border-accent-blue hover:bg-bg-tertiary'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-text-primary text-sm leading-tight">{p.name}</p>
                      <span className={`text-xs font-bold flex-shrink-0 px-2 py-0.5 rounded-lg ${
                        stock === 0 ? 'bg-accent-red/10 text-accent-red' :
                        stock <= (p.lowStockThreshold || 3) ? 'bg-accent-orange/10 text-accent-orange' :
                        'bg-accent-green/10 text-accent-green'
                      }`}>
                        {stock} {pUnit}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {catObj && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${catColor.bg} ${catColor.text}`}>
                          {t('cat_' + catObj.id, { defaultValue: catObj.label })}
                        </span>
                      )}
                      {p.size && <span className="text-[10px] text-text-muted">{p.size}</span>}
                      {p.season && p.season !== 'NA' && (
                        <span className="text-[10px] text-text-muted">{t('season_' + p.season) || p.season}</span>
                      )}
                    </div>
                  </button>
                )
              })}
              {filtered.length === 0 && (
                <p className="text-center text-xs text-text-muted py-8">{t('wh_in_not_found')}</p>
              )}
            </div>
          </>
        )}

        {isNewProduct && (
          <div className="px-4 py-3 bg-accent-blue/5 border border-accent-blue/20 rounded-xl">
            <p className="text-xs text-accent-blue font-medium">{t('wh_in_new_info')}</p>
          </div>
        )}
      </div>

      {/* ONG PANEL — Kirim ma'lumotlari */}
      <div className="bg-bg-secondary border border-border rounded-2xl p-5 space-y-4 min-h-[420px] overflow-y-auto no-scrollbar">
        <h3 className="font-syne font-bold text-text-primary">{t('wh_in_details')}</h3>

        {/* Sana */}
        <div className="px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl flex items-center justify-between">
          <span className="text-xs text-text-muted">{t('wh_in_date')}</span>
          <span className="text-sm font-medium text-text-primary">{new Date().toLocaleString('uz-UZ')}</span>
        </div>

        {/* Tanlangan tovar */}
        {selectedProduct && !isNewProduct && (
          <div className="px-4 py-3 bg-accent-blue/5 border border-accent-blue/20 rounded-xl flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary text-sm">{selectedProduct.name}</p>
              <p className="text-xs text-text-muted">
                {(() => { const c = productCategories?.find(c => c.id === selectedProduct.category); return c ? t('cat_' + c.id, { defaultValue: c.label }) : '—' })()}
                {selectedProduct.size ? ` · ${selectedProduct.size}` : ''}
              </p>
            </div>
            <button onClick={() => { setSelectedProduct(null); setError('') }} className="p-1.5 text-text-muted hover:text-accent-red rounded-lg transition-colors">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Yangi tovar: nom + kategoriya */}
        {isNewProduct && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">{t('col_product_name')}</label>
              <input
                value={form.newProductName}
                onChange={e => setForm(f => ({ ...f, newProductName: e.target.value }))}
                placeholder={t('wh_in_name_ph')}
                className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 block">{t('col_category')}</label>
              <div className="flex flex-wrap gap-2">
                {(productCategories || []).filter(c => c.isActive).map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setNewCategory(newCategory === cat.id ? '' : cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      newCategory === cat.id
                        ? 'bg-accent-blue text-white border-accent-blue'
                        : 'bg-bg-tertiary border-border text-text-secondary hover:border-accent-blue hover:text-text-primary'
                    }`}
                  >
                    {t('cat_' + cat.id, { defaultValue: cat.label })}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Miqdor + Birlik */}
        <div>
          <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">{t('wh_in_qty')} <span className="text-accent-red">*</span></label>
          <div className="flex gap-2">
            <input
              type="number" min="1"
              value={form.quantity}
              onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
              placeholder="0"
              className="w-28 px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue transition-colors"
            />
            <UnitInput
              value={form.unit}
              onChange={v => setForm(f => ({ ...f, unit: v }))}
              className="flex-1"
            />
          </div>
        </div>

        {/* ─── MOLIYAVIY MAYDONLAR (faqat admin/manager) ─── */}
        {canFinance ? (
          <div className="space-y-3 pt-1 border-t border-border">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider pt-1">{t('wh_in_finance')}</p>

            {/* Yetkazib beruvchi */}
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">{t('col_supplier')}</label>
              <select
                value={form.supplierId}
                onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}
                className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
              >
                <option value="">{t('inc_link_select_ph')}</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Narx USD + Kurs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">{t('wh_in_price_usd')}</label>
                <input
                  type="number" min="0" step="0.01"
                  value={form.purchasePriceUSD}
                  onChange={e => setForm(f => ({ ...f, purchasePriceUSD: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">{t('wh_in_usd_rate')}</label>
                <input
                  type="number" min="0"
                  value={form.entryUsdRate}
                  onChange={e => setForm(f => ({ ...f, entryUsdRate: e.target.value }))}
                  placeholder="12700"
                  className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue transition-colors"
                />
              </div>
            </div>

            {/* Jami hisob */}
            {totalUSD && (
              <div className="px-4 py-2.5 bg-accent-green/5 border border-accent-green/20 rounded-xl flex items-center justify-between">
                <span className="text-xs text-text-muted">{t('wh_in_total')}</span>
                <div className="text-right">
                  <p className="text-sm font-bold text-accent-green">${totalUSD}</p>
                  {totalUZS && <p className="text-xs text-text-muted">{totalUZS} {t('dash_so_m')}</p>}
                </div>
              </div>
            )}

            {/* To'lov holati */}
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">{t('wh_in_pay_status')}</label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_STATUS_OPTS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setForm(f => ({ ...f, paymentStatus: opt.value }))}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      form.paymentStatus === opt.value
                        ? 'bg-accent-blue text-white border-accent-blue'
                        : 'bg-bg-tertiary border-border text-text-secondary hover:border-accent-blue'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dastlabki to'lov (partial yoki paid uchun) */}
            {(form.paymentStatus === 'partial' || form.paymentStatus === 'paid') && (
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
                  {form.paymentStatus === 'paid' ? t('wh_in_paid_usd') : t('wh_in_initial')}
                </label>
                <input
                  type="number" min="0" step="0.01"
                  value={form.paidUSD}
                  onChange={e => setForm(f => ({ ...f, paidUSD: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue transition-colors"
                />
              </div>
            )}

            {/* Muddat (nasiya yoki qisman uchun) */}
            {(form.paymentStatus === 'credit' || form.paymentStatus === 'partial') && (
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">{t('wh_in_due')}</label>
                <DateMaskInput
                  value={form.dueDate}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 py-3 bg-bg-tertiary border border-border rounded-xl flex items-center gap-2">
            <Lock size={14} className="text-text-muted flex-shrink-0" />
            <span className="text-xs text-text-muted">{t('wh_in_locked')}</span>
          </div>
        )}

        {/* Izoh */}
        <div>
          <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">{t('wh_in_notes')}</label>
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder={t('wh_in_notes_ph')}
            rows={2}
            className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue transition-colors resize-none"
          />
        </div>

        {/* Xususiyatlar — faqat aniqlangan bo'lsa */}
        {(productAttributeDefs || []).length > 0 && (
          <div className="pt-1 border-t border-border space-y-3">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider pt-1">Xususiyatlar</p>
            {(productAttributeDefs || []).map(def => {
              const checked = def.id in form.attributes
              return (
                <div key={def.id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={`wh-attr-${def.id}`}
                    checked={checked}
                    onChange={e => {
                      if (e.target.checked) {
                        setForm(f => ({ ...f, attributes: { ...f.attributes, [def.id]: def.values[0] || '' } }))
                      } else {
                        setForm(f => {
                          const a = { ...f.attributes }
                          delete a[def.id]
                          return { ...f, attributes: a }
                        })
                      }
                    }}
                    className="w-4 h-4 accent-accent-red cursor-pointer flex-shrink-0"
                  />
                  <label htmlFor={`wh-attr-${def.id}`} className="text-sm text-text-secondary font-medium cursor-pointer min-w-[70px]">
                    {def.label}
                  </label>
                  {checked && (
                    <select
                      value={form.attributes[def.id] || ''}
                      onChange={e => setForm(f => ({ ...f, attributes: { ...f.attributes, [def.id]: e.target.value } }))}
                      className="flex-1 px-3 py-1.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
                    >
                      {def.values.length === 0 && <option value="">— Qiymat yo'q —</option>}
                      {def.values.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {error && <p className="text-accent-red text-sm flex items-center gap-2"><XCircle size={14} /> {error}</p>}
        {success && <p className="text-accent-green text-sm flex items-center gap-2"><CheckCircle size={14} /> {t('wh_in_saved')}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || (!selectedProduct && !isNewProduct)}
          className="w-full py-3 rounded-xl bg-accent-red text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {loading
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <><ArrowDownToLine size={16} /> {t('wh_in_save')}</>}
        </button>
      </div>
    </div>
    </ShopRequiredGuard>
  )
}

// ============================
// BARCODE TAB
// ============================

export default IncomeTab
