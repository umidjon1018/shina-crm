import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getCategoryColor } from '../../../utils/categoryColors'
import { useSettingsStore } from '../../../store/settingsStore'

const formatPrice = (price, som) => Math.round(price).toLocaleString('uz-UZ') + ' ' + som

const ProfitTab = ({ ctx }) => {
  const { t } = useTranslation()
  const som = t('unit_som')
  const { productImages } = useSettingsStore()
  const [peekProduct, setPeekProduct] = useState(null)
  const {
    filteredProfitItems, sortedProfitItems,
    profitMonthFilter, setProfitMonthFilter, profitMonthOptions, formatMonthValue,
    profitTypeFilter, setProfitTypeFilter,
    profitSearch, setProfitSearch,
    profitPage, setProfitPage,
    profitSortField, profitSortOrder, handleProfitSort,
    productCategories, barcodeSelectClass, getInstallmentStatusMap,
  } = ctx

  const activeItems = filteredProfitItems.filter(item => !item.isCancelled)
  const totalProfit = activeItems.reduce((sum, item) => sum + item.profit, 0)
  const totalSales = activeItems.reduce((sum, item) => sum + item.totalSale, 0)
  const totalItemsSold = activeItems.reduce((sum, item) => sum + item.qty, 0)

  return (
    <motion.div
      key="profit"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 border border-accent-green/20 rounded-3xl flex flex-col justify-between shadow-sm bg-bg-secondary bg-accent-green/5 text-accent-green">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{t('sl_profit_total')}</span>
          <h2 className="text-2xl font-syne font-extrabold mt-3">{formatPrice(totalProfit, som)}</h2>
        </div>
        <div className="p-6 border border-accent-blue/20 rounded-3xl flex flex-col justify-between shadow-sm bg-bg-secondary bg-accent-blue/5 text-accent-blue">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{t('sl_profit_sales')}</span>
          <h2 className="text-2xl font-syne font-extrabold mt-3">{formatPrice(totalSales, som)}</h2>
        </div>
        <div className="p-6 border border-accent-orange/20 rounded-3xl flex flex-col justify-between shadow-sm bg-bg-secondary bg-accent-orange/5 text-accent-orange">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{t('sl_profit_items_sold')}</span>
          <h2 className="text-2xl font-syne font-extrabold mt-3">{t('sl_inst_org_count', { n: totalItemsSold })}</h2>
        </div>
      </div>

      {/* Table */}
      <div className="bg-bg-secondary border border-border rounded-3xl p-6 shadow-sm overflow-hidden animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h3 className="font-syne font-bold text-text-primary text-base">{t('sl_profit_table_title')}</h3>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-bg-tertiary border border-border rounded-xl p-1">
              {[['all', 'Barchasi'], ['new', 'Yangi'], ['used', 'Eski']].map(([val, label]) => (
                <button key={val} onClick={() => { setProfitTypeFilter(val); setProfitPage(1) }}
                  className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${profitTypeFilter === val ? 'bg-accent-red text-white' : 'text-text-muted hover:text-text-primary'}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted font-bold whitespace-nowrap">Oy:</span>
              <select value={profitMonthFilter} onChange={e => { setProfitMonthFilter(e.target.value); setProfitPage(1) }}
                className="bg-bg-tertiary text-text-primary text-xs font-bold border border-border rounded-xl px-3 py-2 outline-none focus:border-accent-blue">
                <option value="all">{t('filter_all')}</option>
                {profitMonthOptions.filter(m => m !== 'all').map(m => <option key={m} value={m}>{formatMonthValue(m)}</option>)}
              </select>
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input type="text" value={profitSearch} onChange={e => { setProfitSearch(e.target.value); setProfitPage(1) }}
                placeholder={t('sl_profit_search_ph')}
                className="pl-8 pr-3 py-1.5 bg-bg-tertiary border border-border text-text-primary rounded-xl text-xs font-medium focus:outline-none focus:border-accent-blue w-52" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs min-w-[1380px]" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '120px' }} /><col style={{ width: '150px' }} /><col style={{ width: '140px' }} />
              <col style={{ width: '80px' }} /><col style={{ width: '110px' }} /><col style={{ width: '90px' }} />
              <col style={{ width: '105px' }} /><col style={{ width: '110px' }} /><col style={{ width: '50px' }} />
              <col style={{ width: '80px' }} /><col style={{ width: '75px' }} /><col style={{ width: '100px' }} />
              <col style={{ width: '60px' }} /><col style={{ width: '110px' }} />
            </colgroup>
            <thead className="bg-bg-tertiary text-text-primary">
              <tr>
                {[
                  ['soldAt', t('col_date')], ['name', t('col_product_name')], ['barcode', t('sl_profit_th_barcode')],
                  ['categoryLabel', t('sl_profit_th_category')], ['customerName', t('col_customer')], ['soldByName', t('col_employee')],
                  ['purchaseTotal', t('sl_profit_th_purchase')], ['saleTotal', t('sl_profit_th_sale')],
                  ['qty', t('sl_profit_th_qty'), 'center'], ['paymentType', t('sl_profit_th_payment')],
                  ['status', t('sl_profit_th_status')], ['commission', t('sl_profit_th_commission')],
                  ['margin', t('sl_profit_th_margin')],
                ].map(([key, label, align]) => (
                  <th key={key} onClick={() => handleProfitSort(key)}
                    className={`px-3 py-2.5 font-bold uppercase cursor-pointer hover:bg-bg-secondary select-none transition-colors ${align === 'center' ? 'text-center' : ''}`}>
                    <div className={`flex items-center gap-1 ${align === 'center' ? 'justify-center' : ''}`}>
                      {label} {profitSortField === key && (profitSortOrder === 'asc' ? '▲' : '▼')}
                    </div>
                  </th>
                ))}
                <th onClick={() => handleProfitSort('profit')}
                  className="px-3 py-2.5 font-bold uppercase cursor-pointer hover:bg-bg-secondary select-none text-right transition-colors">
                  <div className="flex items-center justify-end gap-1">
                    {t('sl_profit_th_profit')} {profitSortField === 'profit' && (profitSortOrder === 'asc' ? '▲' : '▼')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {sortedProfitItems.slice((profitPage - 1) * 20, profitPage * 20).map(item => (
                <tr key={item.id} className={`transition-colors text-text-primary ${item.isCancelled ? 'bg-accent-red/5 text-text-muted' : 'hover:bg-bg-tertiary/20'}`}>
                  <td className="px-3 py-3 whitespace-nowrap text-text-secondary">{new Date(item.soldAt).toLocaleString('uz-UZ')}</td>
                  <td className="px-3 py-3 truncate font-bold text-text-primary">
                    {(() => {
                      const subItems = item.items || []
                      const visible = subItems.slice(0, 2); const hidden = subItems.slice(2)
                      return (
                        <div className="flex flex-col gap-0.5">
                          {visible.map((si, i) => {
                            const hasImg = si.productId && productImages[String(si.productId)]?.length
                            return (
                              <span key={i} className={`text-xs truncate block ${hasImg ? 'cursor-pointer hover:text-accent-blue transition-colors' : ''}`}
                                onClick={() => hasImg && setPeekProduct({ id: si.productId, name: si.name })}
                              >{si.name || 'Tovar'}</span>
                            )
                          })}
                          {hidden.length > 0 && (
                            <details className="cursor-pointer select-none">
                              <summary className="text-[10px] text-accent-blue font-bold list-none">+{hidden.length} ta</summary>
                              {hidden.map((si, i) => {
                                const hasImg = si.productId && productImages[String(si.productId)]?.length
                                return (
                                  <span key={i} className={`text-[10px] block truncate text-text-secondary font-normal ${hasImg ? 'cursor-pointer hover:text-accent-blue transition-colors' : ''}`}
                                    onClick={() => hasImg && setPeekProduct({ id: si.productId, name: si.name })}
                                  >{si.name || 'Tovar'}</span>
                                )
                              })}
                            </details>
                          )}
                          {subItems.length === 0 && <span>—</span>}
                        </div>
                      )
                    })()}
                  </td>
                  {item.isUsedSale ? (
                    <td className={`px-3 py-3 ${barcodeSelectClass}`}>
                      <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-accent-orange/10 text-accent-orange whitespace-nowrap">{t('sl_profit_used_badge')}</span>
                    </td>
                  ) : (() => {
                    const barcodes = (item.barcodes && item.barcodes.length > 0) ? item.barcodes : (item.barcode && item.barcode !== '—' ? [item.barcode] : [])
                    const visible = barcodes.slice(0, 2); const hidden = barcodes.slice(2)
                    return (
                      <td className={`px-3 py-3 font-mono text-text-muted ${barcodeSelectClass}`}>
                        <div className="flex flex-col gap-0.5">
                          {visible.map((b, i) => <span key={i} className="text-[10px] truncate block">{b}</span>)}
                          {hidden.length > 0 && (
                            <details className="cursor-pointer select-none">
                              <summary className="text-[10px] text-accent-blue font-bold list-none">+{hidden.length} ta</summary>
                              {hidden.map((b, i) => <span key={i} className="text-[10px] block truncate">{b}</span>)}
                            </details>
                          )}
                          {barcodes.length === 0 && <span>—</span>}
                        </div>
                      </td>
                    )
                  })()}
                  {(() => {
                    const catObj = productCategories.find(c => c.label === item.categoryLabel || c.id === item.categoryId)
                    const catLabel = catObj ? t('cat_' + catObj.id, { defaultValue: catObj.label }) : (item.categoryLabel || '—')
                    const catColor = getCategoryColor(catObj?.id, productCategories)
                    return <td className="px-3 py-3 truncate"><span className={`font-semibold text-sm ${catColor.text}`}>{catLabel}</span></td>
                  })()}
                  <td className="px-3 py-3 text-text-secondary truncate">{item.customerName}</td>
                  <td className="px-3 py-3 text-text-secondary truncate">{item.soldByName}</td>
                  <td className="px-3 py-3 text-text-secondary whitespace-nowrap">{formatPrice(item.purchaseTotal ?? 0, som)}</td>
                  <td className="px-3 py-3 text-text-secondary whitespace-nowrap">{formatPrice(item.saleTotal ?? item.totalSale ?? 0, som)}</td>
                  <td className="px-3 py-3 text-center text-text-secondary">{t('sl_inst_org_count', { n: item.qty })}</td>
                  <td className="px-3 py-3 text-text-secondary">
                    <div className="flex flex-col gap-0.5">
                      <span>{item.paymentType === 'cash' ? t('pay_cash') : item.paymentType === 'card' ? t('pay_card') : item.paymentType === 'installment' ? t('pay_installment') : item.paymentType}</span>
                      {item.paymentType === 'card' && item.cardType && (
                        <span className="text-[10px] text-text-muted font-bold uppercase">{item.cardType}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {item.isCancelled ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-accent-red/10 text-accent-red">Bekor</span>
                    ) : item.paymentType === 'installment' ? (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${getInstallmentStatusMap[item.saleId]?.status === 'paid' ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-orange/10 text-accent-orange'}`}>
                        {getInstallmentStatusMap[item.saleId]?.status === 'paid' ? t('col_done') : t('sl_profit_status_pending')}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-accent-green/10 text-accent-green">{t('col_done')}</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-text-muted whitespace-nowrap">{item.commission > 0 ? formatPrice(item.commission, som) : '—'}</td>
                  <td className="px-3 py-3">
                    <span className={`text-xs font-extrabold ${item.margin >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>{item.margin}%</span>
                  </td>
                  <td className="px-3 py-3 font-bold text-right whitespace-nowrap">
                    <span className={item.profit >= 0 ? 'text-accent-green' : 'text-accent-red'}>{formatPrice(item.profit, som)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedProfitItems.length > 20 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <p className="text-xs text-text-muted">
              {Math.min(profitPage * 20, sortedProfitItems.length)} / {sortedProfitItems.length} ta
            </p>
            <div className="flex gap-2">
              <button disabled={profitPage === 1} onClick={() => setProfitPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-bg-tertiary border border-border rounded-lg text-xs font-bold text-text-primary disabled:opacity-40">{t('sl_prev')}</button>
              <button disabled={profitPage >= Math.ceil(sortedProfitItems.length / 20)} onClick={() => setProfitPage(p => p + 1)}
                className="px-3 py-1.5 bg-bg-tertiary border border-border rounded-lg text-xs font-bold text-text-primary disabled:opacity-40">{t('sl_next')}</button>
            </div>
          </div>
        )}
      </div>

      {peekProduct && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4" onClick={() => setPeekProduct(null)}>
          <div className="bg-bg-secondary border border-border rounded-2xl p-5 w-72 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-text-primary text-sm truncate pr-2">{peekProduct.name}</p>
              <button onClick={() => setPeekProduct(null)} className="p-1 text-text-muted hover:text-text-primary flex-shrink-0"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(productImages[String(peekProduct.id)] || []).map((img, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden border border-border">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default ProfitTab
