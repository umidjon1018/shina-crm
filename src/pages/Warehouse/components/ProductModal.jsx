import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { getCategoryColor } from '../../../utils/categoryColors'
import { getItemStatus } from '../../../utils/itemStatus'
import { Th, Td, Badge, SEASON_COLORS } from '../whHelpers.jsx'
import { useSettingsStore } from '../../../store/settingsStore'

const ProductModal = ({ product, batches, items, userRole, canSeePurchasePrice, productCategories, onClose }) => {
  const { t } = useTranslation()
  const som = t('unit_som')
  const pcs = t('unit_pcs')
  const barcodeSelectClass = userRole === 'admin' ? '' : 'select-none'
  const inStockItems = items.filter(i => i.status === 'in_stock')
  const { productImages } = useSettingsStore()
  const images = productImages[String(product.id)] || []
  const [mainIdx, setMainIdx] = useState(0)
  const [fsOpen, setFsOpen] = useState(false)
  const shopStock = (productId) => items.filter(i => i.productId === productId && i.status === 'in_stock').length
  const shopItemCount = (productId, status) => items.filter(i => i.productId === productId && i.status === status).length
  const getProductUnit = (productId) =>
    items.find(i => i.productId === productId && i.status === 'in_stock')?.unit
    || items.find(i => i.productId === productId)?.unit
    || 'dona'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-bg-secondary border border-border rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
          <div>
            <h3 className="font-syne font-bold text-text-primary">{product.name}</h3>
            <p className="text-xs text-text-muted">{product.sku}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto no-scrollbar flex-1 p-4 sm:p-6 space-y-3 sm:space-y-5">
          {/* Rasm galereya */}
          {images.length > 0 && (
            <div className="space-y-2">
              {/* Asosiy katta rasm */}
              <div
                className="relative w-full rounded-2xl overflow-hidden bg-bg-tertiary cursor-pointer group"
                style={{ aspectRatio: '16/7' }}
                onClick={() => setFsOpen(true)}
              >
                <img src={images[mainIdx]} alt="" className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold bg-black/50 px-3 py-1 rounded-full">
                    Kattalashtirish
                  </span>
                </div>
                {images.length > 1 && (
                  <>
                    <button
                      onClick={e => { e.stopPropagation(); setMainIdx(i => (i - 1 + images.length) % images.length) }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setMainIdx(i => (i + 1) % images.length) }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <div className="absolute bottom-2 right-3 text-[10px] bg-black/50 text-white px-2 py-0.5 rounded-full font-bold">
                      {mainIdx + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>
              {/* Thumbnail strip */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setMainIdx(i)}
                      className={`w-14 h-10 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${i === mainIdx ? 'border-accent-red' : 'border-border opacity-60 hover:opacity-90'}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Info */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              (() => {
                const catObj = productCategories?.find(c => c.id === product.category)
                return { label: t('col_category'), value: catObj ? t('cat_' + catObj.id, { defaultValue: catObj.label }) : (product.categoryLabel || '—') }
              })(),
              { label: t('wh_modal_brand'), value: product.brand },
              { label: t('col_country'), value: t('country_' + product.country, { defaultValue: product.country }) },
              { label: t('wh_modal_size'), value: product.size },
              { label: t('wh_th_season'), value: t('season_' + product.season) || product.seasonLabel || '—' },
              { label: t('wh_modal_attribute'), value: product.attribute || '—' },
              { label: t('wh_modal_car_type'), value: product.carCategory || '—' },
              { label: t('wh_modal_remaining'), value: shopStock(product.id) + ' ' + getProductUnit(product.id) },
              { label: t('sold'), value: shopItemCount(product.id, 'sold') + ' ' + getProductUnit(product.id) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-bg-tertiary rounded-xl px-3 py-2.5">
                <p className="text-xs text-text-muted mb-0.5">{label}</p>
                <p className="text-sm font-medium text-text-primary">{value}</p>
              </div>
            ))}
          </div>

          {/* Sotuv narxlari — hamma ko'radi */}
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">{t('wh_modal_prices')}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-bg-tertiary rounded-xl px-3 py-2.5">
                <p className="text-xs text-text-muted mb-1">{t('wh_modal_cash_price')}</p>
                <p className="text-sm font-bold text-text-primary">{product.cashPrice.toLocaleString('uz')} {t('dash_so_m')}</p>
              </div>
              <div className="bg-bg-tertiary rounded-xl px-3 py-2.5">
                <p className="text-xs text-text-muted mb-1">{t('wh_modal_installment')}</p>
                <p className="text-sm font-bold text-text-primary">{product.installmentBasePrice.toLocaleString('uz')} {t('dash_so_m')}</p>
              </div>
              <div className="bg-bg-tertiary rounded-xl px-3 py-2.5 col-span-2">
                <p className="text-xs text-text-muted mb-1">{t('wh_modal_months')}</p>
                <div className="flex gap-2 flex-wrap mt-1">
                  {(product.installmentMonths || []).map(m => (
                    <span key={m} className="bg-accent-blue/10 text-accent-blue text-xs font-bold px-2 py-0.5 rounded-full">
                      {m} oy
                    </span>
                  ))}
                  {(!product.installmentMonths || product.installmentMonths.length === 0) && (
                    <span className="text-xs text-text-muted">—</span>
                  )}
                </div>
              </div>
            </div>
            {canSeePurchasePrice && (
              <p className="text-xs text-text-muted mt-2 italic">{t('wh_modal_price_hint')}</p>
            )}
          </div>

          {/* Partiyalar — faqat admin/manager */}
          {canSeePurchasePrice && batches.length > 0 && (
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">{t('wh_modal_batches_title')}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <Th>{t('wh_modal_batch')}</Th>
                      <Th>{t('wh_modal_income_date')}</Th>
                      {canSeePurchasePrice && <Th right>{t('wh_th_purchase_price')}</Th>}
                      <Th right>{t('wh_th_in_qty')}</Th>
                      <Th right>{t('sold')}</Th>
                      <Th right>{t('wh_th_remaining')}</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {batches.map(b => {
                      const priceUZS = b.purchasePriceUSD && b.entryUsdRate
                        ? b.purchasePriceUSD * b.entryUsdRate
                        : b.purchasePrice
                      const batchItems = items.filter(i => i.batchId === b.id)
                      const realRemaining = batchItems.filter(i => i.status === 'in_stock').length
                      const realSold = batchItems.filter(i => i.status === 'sold').length
                      return (
                        <tr key={b.id} className="hover:bg-bg-tertiary/50">
                          <Td muted>{b.batchNumber}</Td>
                          <Td muted>{new Date(b.receivedAt).toLocaleDateString('uz-UZ')}</Td>
                          {canSeePurchasePrice && <Td right>{priceUZS ? priceUZS.toLocaleString('uz') + ' ' + t('dash_so_m') : '—'}</Td>}
                          <Td right>{b.quantityIn}</Td>
                          <Td right><span className="text-accent-red font-bold">{realSold}</span></Td>
                          <Td right><span className="text-accent-green font-bold">{realRemaining}</span></Td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Individual itemlar */}
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
              {t('wh_modal_items_title', { count: inStockItems.length })}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <Th>{t('wh_modal_barcode')}</Th>
                    <Th>{t('col_status')}</Th>
                    <Th>{t('wh_modal_bc_status')}</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {inStockItems.map(item => (
                    <tr key={item.id} className="hover:bg-bg-tertiary/50">
                      <Td>
                        {item.barcode
                          ? <span className={`font-mono text-xs text-text-primary ${barcodeSelectClass}`}>{item.barcode}</span>
                          : <span className="text-text-muted italic text-xs">{t('wh_modal_no_barcode')}</span>}
                      </Td>
                      <Td><Badge cls="text-accent-green bg-accent-green/10">{t('col_in_stock')}</Badge></Td>
                      <Td>
                        {item.barcodeStatus
                          ? (() => { const { label, cls } = getItemStatus(item, t); return <Badge cls={cls}>{label}</Badge> })()
                          : <Badge cls="text-text-muted bg-bg-tertiary">{t('wh_modal_bc_not_created')}</Badge>}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>

      {fsOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center" onClick={() => setFsOpen(false)}>
          <button onClick={() => setFsOpen(false)} className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"><X size={20} /></button>
          {images.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); setMainIdx(i => (i - 1 + images.length) % images.length) }} className="absolute left-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"><ChevronLeft size={22} /></button>
              <button onClick={e => { e.stopPropagation(); setMainIdx(i => (i + 1) % images.length) }} className="absolute right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"><ChevronRight size={22} /></button>
            </>
          )}
          <div className="bg-[#f4f4f5] rounded-2xl p-3 shadow-2xl" onClick={e => e.stopPropagation()}>
            <img src={images[mainIdx]} alt="" className="max-w-[85vw] max-h-[82vh] object-contain block rounded-xl" />
          </div>
          {images.length > 1 && (
            <div className="absolute bottom-5 flex gap-1.5">
              {images.map((img, i) => (
                <button key={i} onClick={e => { e.stopPropagation(); setMainIdx(i) }} className={`w-12 h-9 rounded-lg overflow-hidden border-2 transition-all ${i === mainIdx ? 'border-white' : 'border-white/20 opacity-50 hover:opacity-80'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}

// ============================
// STOCK TAB
// ============================

export default ProductModal
