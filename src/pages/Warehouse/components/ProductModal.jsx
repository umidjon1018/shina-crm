import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight } from 'lucide-react'
import { getCategoryColor } from '../../../utils/categoryColors'
import { getItemStatus } from '../../../utils/itemStatus'
import { Th, Td, Badge, SEASON_COLORS } from '../whHelpers.jsx'

const ProductModal = ({ product, batches, items, userRole, canSeePurchasePrice, productCategories, onClose }) => {
  const { t } = useTranslation()
  const som = t('unit_som')
  const pcs = t('unit_pcs')
  const barcodeSelectClass = userRole === 'admin' ? '' : 'select-none'
  const inStockItems = items.filter(i => i.status === 'in_stock')
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="font-syne font-bold text-text-primary">{product.name}</h3>
            <p className="text-xs text-text-muted">{product.sku}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto no-scrollbar flex-1 p-6 space-y-5">
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
    </div>
  )
}

// ============================
// STOCK TAB
// ============================

export default ProductModal
