import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { getCategoryColor } from '../../../utils/categoryColors'

const formatPrice = (price, som) => Math.round(price).toLocaleString('uz-UZ') + ' ' + som

const HistoryTab = ({ ctx }) => {
  const { t } = useTranslation()
  const som = t('unit_som')
  const {
    historyMonthFilter, setHistoryMonthFilter, historyMonthOptions, formatMonthValue,
    filteredSalesForHistory, sortedSalesForHistory, historyPage, setHistoryPage,
    historySortField, historySortOrder, handleHistorySort,
    exchangePairColors, barcodeSelectClass, getItemBarcode,
    productCategories, sources, usedSalesList,
  } = ctx

  return (
    <motion.div
      key="history"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-4"
    >
      {/* Yangi sotuvlar tarixi */}
      <div className="bg-bg-secondary border border-border rounded-3xl p-6 shadow-sm overflow-hidden">
        <h3 className="font-syne font-bold text-text-primary text-lg mb-4 text-white">{t('sl_hist_title')}</h3>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary font-bold">{t('sl_hist_month_filter')}</span>
            <select value={historyMonthFilter} onChange={(e) => { setHistoryMonthFilter(e.target.value); setHistoryPage(1) }}
              className="bg-bg-tertiary border border-border text-text-primary px-3 py-1.5 rounded-xl text-xs font-bold focus:outline-none focus:border-accent-red cursor-pointer">
              {historyMonthOptions.map(opt => <option key={opt} value={opt}>{formatMonthValue(opt)}</option>)}
            </select>
          </div>
          <div className="text-xs text-text-muted">{t('sl_hist_total', { n: filteredSalesForHistory.length })}</div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs min-w-[1200px]" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '130px' }} /><col style={{ width: '140px' }} /><col style={{ width: '130px' }} />
              <col style={{ width: '85px' }} /><col style={{ width: '100px' }} /><col style={{ width: '75px' }} />
              <col style={{ width: '110px' }} /><col style={{ width: '45px' }} /><col style={{ width: '120px' }} />
              <col style={{ width: '105px' }} /><col style={{ width: '65px' }} /><col style={{ width: '110px' }} />
            </colgroup>
            <thead className="bg-bg-tertiary text-text-muted">
              <tr>
                {[
                  { key: 'soldAt', label: t('col_date') },
                  { key: 'itemsNames', label: t('col_product_name') },
                  { key: 'barcode', label: t('sl_hist_th_barcode') },
                  { key: 'category', label: t('col_category') },
                  { key: 'customerName', label: t('col_customer') },
                  { key: 'soldByName', label: t('col_employee') },
                  { key: 'source', label: t('col_source') },
                  { key: 'qty', label: t('sl_hist_th_qty') },
                  { key: 'discount', label: t('col_discount') },
                  { key: 'total', label: t('sl_hist_th_total') },
                  { key: 'paymentTypeLabel', label: t('sl_hist_th_payment') },
                  { key: 'statusLabel', label: t('sl_hist_th_status'), right: true },
                ].map(col => (
                  <th key={col.key} className={`px-4 py-3 font-bold uppercase cursor-pointer hover:text-text-primary select-none transition-colors ${col.right ? 'text-right' : ''}`}
                    onClick={() => handleHistorySort(col.key)}>
                    <div className={`flex items-center gap-1 ${col.right ? 'justify-end' : ''}`}>
                      {col.label} {historySortField === col.key && (historySortOrder === 'asc' ? '▲' : '▼')}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {sortedSalesForHistory.slice((historyPage - 1) * 15, historyPage * 15).map(s => {
                const firstItem = s.items?.[0]
                const catId = firstItem?.productCategory
                const catLabel = (() => { const _c = productCategories.find(c => c.id === catId); return _c ? t('cat_' + _c.id, { defaultValue: _c.label }) : (catId || '—') })()
                const pairBg = exchangePairColors[s.id]
                return (
                  <tr key={s.id} className="hover:bg-bg-tertiary/20 transition-colors" style={pairBg ? { backgroundColor: pairBg } : {}}>
                    <td className="px-4 py-3.5 whitespace-nowrap text-text-secondary">{new Date(s.soldAt).toLocaleString('uz-UZ')}</td>
                    <td className="px-4 py-3.5 truncate font-bold text-text-primary">
                      {(() => {
                        const items = s.items || []
                        const visible = items.slice(0, 2)
                        const hidden = items.slice(2)
                        return (
                          <div className="flex flex-col gap-0.5">
                            {visible.map((item, i) => <span key={i} className="text-xs truncate block">{item.name || 'Tovar'}</span>)}
                            {hidden.length > 0 && (
                              <details className="cursor-pointer select-none">
                                <summary className="text-[10px] text-accent-blue font-bold list-none">+{hidden.length} ta</summary>
                                {hidden.map((item, i) => <span key={i} className="text-[10px] block truncate text-text-secondary font-normal">{item.name || 'Tovar'}</span>)}
                              </details>
                            )}
                            {items.length === 0 && <span>—</span>}
                          </div>
                        )
                      })()}
                    </td>
                    {(() => {
                      const barcodes = s.items?.map(it => { const b = it.barcode || getItemBarcode(it.itemId); return (b && b !== '—') ? b : null }).filter(Boolean) || []
                      const visible = barcodes.slice(0, 2)
                      const hidden = barcodes.slice(2)
                      return (
                        <td className={`px-4 py-3.5 font-mono text-text-muted truncate ${barcodeSelectClass}`}>
                          <div className="flex flex-col gap-0.5">
                            {visible.map((b, i) => <span key={i} className="text-[10px] truncate">{b}</span>)}
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
                      if (s.isBundle) {
                        return <td className="px-4 py-3.5 truncate"><span className="font-semibold text-sm text-accent-blue">Komplekt</span></td>
                      }
                      const catObj = productCategories.find(c => c.id === catId)
                      const catColor = getCategoryColor(catObj?.id, productCategories)
                      return <td className="px-4 py-3.5 truncate"><span className={`font-semibold text-sm ${catColor.text}`}>{catLabel}</span></td>
                    })()}
                    <td className="px-4 py-3.5 truncate">
                      <span className={`font-medium ${s.customerName ? 'text-text-primary' : 'text-text-muted italic'}`}>{s.customerName || "Noma'lum"}</span>
                      {s.originalCustomerName && <div className="text-[9px] text-text-muted line-through">{s.originalCustomerName}</div>}
                    </td>
                    <td className="px-4 py-3.5 text-text-secondary truncate">
                      {(s.status === 'cancelled' || s._isExchange) && s.cancelledBy && String(s.cancelledBy) !== String(s.soldBy) ? (
                        <div className="flex flex-col gap-0.5 leading-tight">
                          <span className="truncate">{s.soldByName || '—'}</span>
                          <span className="text-[10px] text-accent-red font-semibold truncate">↩ {s.cancelledByName}</span>
                        </div>
                      ) : (s.soldByName || '—')}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-bg-tertiary text-text-primary text-[10px] whitespace-nowrap">
                        {t('source_' + s.source, { defaultValue: sources.find(src => src.id === s.source)?.label || s.source })}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-text-secondary">{s.items?.reduce((sum, it) => sum + (it.qty || 1), 0) || 0}</td>
                    <td className="px-4 py-3.5 text-text-secondary whitespace-nowrap">
                      {s.discount > 0
                        ? <span className="text-accent-orange font-semibold whitespace-nowrap">
                            -{s.discount}% ({formatPrice(Math.round((s.subtotal || s.total) * s.discount / 100), som)})
                            {s.bundleDiscountAmount > 0 && <span className="block text-[9px] text-accent-green">+Komplekt -{formatPrice(s.bundleDiscountAmount, som)}</span>}
                          </span>
                        : s.bundleDiscountAmount > 0
                          ? <span className="text-accent-green font-semibold whitespace-nowrap">Komplekt -{formatPrice(s.bundleDiscountAmount, som)}</span>
                          : <span className="text-text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-text-primary font-bold">{formatPrice(s.total, som)}</td>
                    <td className="px-4 py-3.5 text-text-secondary">
                      {s.paymentType === 'cash' ? t('pay_cash') : s.paymentType === 'card' ? t('pay_card') : s.paymentType === 'installment' ? t('pay_installment') : t('sl_hist_pay_bank')}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {(() => {
                        let cls, label
                        if (s.status === 'completed' && !s._isExchange) { cls = 'bg-accent-green/10 text-accent-green'; label = t('col_done') }
                        else if (s.status === 'completed' && s._isExchange) { cls = 'bg-accent-blue/10 text-accent-blue'; label = t('col_done') }
                        else if (s.status === 'pending' || s.status === 'active') { cls = 'bg-accent-orange/10 text-accent-orange'; label = t('pay_installment') }
                        else { cls = 'bg-accent-red/10 text-accent-red'; label = t('sl_hist_status_cancelled') }
                        return <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${cls}`}>{s.statusLabel || label}</span>
                      })()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredSalesForHistory.length > 15 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <p className="text-xs text-text-muted">{Math.min(historyPage * 15, filteredSalesForHistory.length)} / {filteredSalesForHistory.length} ta</p>
            <div className="flex gap-2">
              <button disabled={historyPage === 1} onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-bg-tertiary border border-border rounded-lg text-xs font-bold text-text-primary disabled:opacity-40">{t('sl_prev')}</button>
              <button disabled={historyPage >= Math.ceil(filteredSalesForHistory.length / 15)} onClick={() => setHistoryPage(p => p + 1)}
                className="px-3 py-1.5 bg-bg-tertiary border border-border rounded-lg text-xs font-bold text-text-primary disabled:opacity-40">{t('sl_next')}</button>
            </div>
          </div>
        )}
      </div>

      {/* B/U sotuvlar tarixi */}
      <div className="bg-bg-secondary border border-border rounded-3xl p-6 shadow-sm overflow-hidden">
        <h3 className="font-syne font-bold text-text-primary text-lg mb-4 text-white">{t('sl_hist_bu_title')}</h3>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-border/50">
          <div className="text-xs text-text-muted">{t('sl_hist_bu_total', { n: usedSalesList.length })}</div>
        </div>
        {usedSalesList.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-6">{t('sl_hist_bu_not_found')}</p>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs min-w-[1100px]" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '130px' }} /><col style={{ width: '150px' }} /><col style={{ width: '100px' }} />
                <col style={{ width: '130px' }} /><col style={{ width: '100px' }} /><col style={{ width: '130px' }} />
                <col style={{ width: '70px' }} /><col style={{ width: '90px' }} /><col style={{ width: '110px' }} />
                <col style={{ width: '90px' }} />
              </colgroup>
              <thead className="bg-bg-tertiary text-text-muted">
                <tr>
                  {[t('col_date'), t('col_product_name'), t('col_category'), t('col_customer'), t('col_employee'), t('col_source'), t('sl_hist_th_qty'), t('col_discount'), t('sl_hist_th_total'), t('sl_hist_th_payment')].map((label, i) => (
                    <th key={i} className="px-4 py-3 font-bold uppercase">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {usedSalesList.map(s => (
                  <tr key={s.id} className="hover:bg-bg-tertiary/20 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap text-text-secondary">{new Date(s.soldAt).toLocaleString('uz-UZ')}</td>
                    <td className="px-4 py-3.5 truncate font-bold text-text-primary">{s.items?.map(i => i.name || 'Tovar').join(', ') || '—'}</td>
                    <td className="px-4 py-3.5 truncate">{(() => { const cat = s.items?.[0]; if (!cat?.category) return '—'; const catColor = getCategoryColor(cat.category, productCategories); return <span className={`font-semibold text-sm ${catColor.text}`}>{t('cat_' + cat.category, { defaultValue: cat.categoryLabel || cat.category })}</span> })()}</td>
                    <td className="px-4 py-3.5 truncate"><span className={`font-medium ${s.customerName ? 'text-text-primary' : 'text-text-muted italic'}`}>{s.customerName || "Noma'lum"}</span></td>
                    <td className="px-4 py-3.5 text-text-secondary truncate">{s.soldByName || '—'}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-bg-tertiary text-text-primary text-[10px]">
                        {s.source ? t('source_' + s.source, { defaultValue: sources.find(src => src.id === s.source)?.label || s.source }) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-text-secondary">{s.items?.reduce((sum, it) => sum + (it.qty || 1), 0) || 0}</td>
                    <td className="px-4 py-3.5 text-text-secondary whitespace-nowrap">
                      {s.discount > 0 ? <span className="text-accent-orange font-semibold">-{s.discount}%</span> : <span className="text-text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-text-primary font-bold">{formatPrice(s.total, som)}</td>
                    <td className="px-4 py-3.5 text-text-secondary">
                      {s.paymentType === 'cash' ? t('pay_cash') : s.paymentType === 'card' ? t('pay_card') : s.paymentType === 'installment' ? t('pay_installment') : t('sl_hist_pay_bank')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default HistoryTab
