import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

const formatPrice = (price, som) => Math.round(price).toLocaleString('uz-UZ') + ' ' + som

const ReturnsHistoryTab = ({ ctx }) => {
  const { t } = useTranslation()
  const som = t('unit_som')
  const {
    returnsHistoryMonthFilter, setReturnsHistoryMonthFilter, returnsMonthOptions2, formatMonthValue,
    filteredCancelledReturns, sortedReturnsHistory,
    returnsHistoryPage, setReturnsHistoryPage,
    barcodeSelectClass,
  } = ctx

  return (
    <motion.div
      key="returns_history"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-4"
    >
      <div className="bg-bg-secondary border border-border rounded-3xl p-6 shadow-sm overflow-hidden">
        <h3 className="font-syne font-bold text-text-primary text-lg mb-4 text-white">{t('sl_rh_title')}</h3>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary font-bold">{t('sl_rh_month_filter')}</span>
            <select value={returnsHistoryMonthFilter} onChange={(e) => { setReturnsHistoryMonthFilter(e.target.value); setReturnsHistoryPage(1) }}
              className="bg-bg-tertiary border border-border text-text-primary px-3 py-1.5 rounded-xl text-xs font-bold focus:outline-none focus:border-accent-red cursor-pointer">
              {(returnsMonthOptions2 || []).map(opt => <option key={opt} value={opt}>{formatMonthValue(opt)}</option>)}
            </select>
          </div>
          <div className="text-xs text-text-muted">{t('sl_rh_total', { n: filteredCancelledReturns.length })}</div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs min-w-[1100px]" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '110px' }} /><col style={{ width: '110px' }} /><col style={{ width: '80px' }} />
              <col style={{ width: '160px' }} /><col style={{ width: '150px' }} /><col style={{ width: '110px' }} />
              <col style={{ width: '110px' }} /><col style={{ width: '110px' }} /><col style={{ width: '90px' }} />
              <col style={{ width: '70px' }} /><col style={{ width: '120px' }} />
            </colgroup>
            <thead className="bg-bg-tertiary text-text-muted">
              <tr>
                <th className="px-3 py-3 font-bold uppercase text-[10px]">{t('sl_rh_th_sale_date')}</th>
                <th className="px-3 py-3 font-bold uppercase text-[10px]">{t('sl_rh_th_cancel_date')}</th>
                <th className="px-3 py-3 font-bold uppercase text-[10px]">{t('sl_rh_th_type')}</th>
                <th className="px-3 py-3 font-bold uppercase text-[10px]">{t('sl_rh_th_returned')}</th>
                <th className="px-3 py-3 font-bold uppercase text-[10px]">{t('col_new_product')}</th>
                <th className="px-3 py-3 font-bold uppercase text-[10px]">{t('col_customer')}</th>
                <th className="px-3 py-3 font-bold uppercase text-[10px]">{t('col_employee')}</th>
                <th className="px-3 py-3 font-bold uppercase text-[10px] text-right">{t('col_amount')}</th>
                <th className="px-3 py-3 font-bold uppercase text-[10px] text-right">{t('sl_rh_th_extra')}</th>
                <th className="px-3 py-3 font-bold uppercase text-[10px]">{t('sl_rh_th_payment')}</th>
                <th className="px-3 py-3 font-bold uppercase text-[10px]">{t('col_reason')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {sortedReturnsHistory.slice((returnsHistoryPage - 1) * 20, returnsHistoryPage * 20).map(r => {
                const retItems = r.returnedItems || []
                const exItems = r.exchangedForItems || (r.exchangedForItem ? [r.exchangedForItem] : [])

                const StackedItems = ({ items, barcodes }) => {
                  if (!items.length) return <span className="text-text-muted">—</span>
                  const visible = items.slice(0, 2)
                  const hidden = items.slice(2)
                  return (
                    <div className="space-y-1">
                      {visible.map((it, i) => (
                        <div key={i}>
                          <div className="text-[11px] font-medium text-text-primary leading-tight truncate" title={it.name}>{it.name}</div>
                          {barcodes?.[i] && <div className={`text-[9px] text-text-muted font-mono truncate ${barcodeSelectClass}`}>{barcodes[i]}</div>}
                        </div>
                      ))}
                      {hidden.length > 0 && (
                        <details className="cursor-pointer">
                          <summary className="text-[9px] text-accent-blue font-bold list-none">+{hidden.length} ta</summary>
                          {hidden.map((it, i) => <div key={i} className="text-[9px] text-text-secondary truncate">{it.name}</div>)}
                        </details>
                      )}
                    </div>
                  )
                }

                return (
                  <tr key={r.id} className="hover:bg-bg-tertiary/20 transition-colors align-top">
                    <td className="px-3 py-3 text-text-secondary whitespace-nowrap">
                      {r.soldAt ? new Date(r.soldAt).toLocaleString('uz-UZ', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—'}
                    </td>
                    <td className="px-3 py-3 text-text-secondary whitespace-nowrap">
                      {r.returnedAt ? new Date(r.returnedAt).toLocaleString('uz-UZ', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—'}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold whitespace-nowrap ${r.type === 'exchange' ? 'bg-accent-blue/10 text-accent-blue' : 'bg-accent-red/10 text-accent-red'}`}>
                        {r.typeLabel || (r.type === 'exchange' ? t('col_exchange') : t('sl_rh_type_cancel'))}
                      </span>
                    </td>
                    <td className="px-3 py-3"><StackedItems items={retItems} barcodes={r.barcodes} /></td>
                    <td className="px-3 py-3">{exItems.length > 0 ? <StackedItems items={exItems} barcodes={r.exBarcodes} /> : <span className="text-text-muted">—</span>}</td>
                    <td className="px-3 py-3 truncate" title={r.customerName}>
                      <span className="font-medium text-text-primary">{r.customerName || '—'}</span>
                      {r.originalCustomerName && <div className="text-[9px] text-text-muted line-through">{r.originalCustomerName}</div>}
                    </td>
                    <td className="px-3 py-3">
                      {r.processedBy && String(r.processedBy) !== String(r.soldBy) ? (
                        <>
                          <div className="text-text-secondary truncate">{r.soldByName || '—'}</div>
                          <div className="text-[9px] text-accent-red font-bold truncate">↩ {r.processedByName}</div>
                        </>
                      ) : (
                        <div className="text-text-secondary truncate">{r.processedByName || r.soldByName || '—'}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-accent-red whitespace-nowrap">{formatPrice(r.displayAmount, som)}</td>
                    <td className="px-3 py-3 text-right text-text-primary whitespace-nowrap">{(r.additionalPayment || 0) > 0 ? formatPrice(r.additionalPayment, som) : '—'}</td>
                    <td className="px-3 py-3 text-text-secondary whitespace-nowrap">{r.payLabel}</td>
                    <td className="px-3 py-3 text-text-muted"><span className="block truncate" title={r.reasonLabel || '—'}>{r.reasonLabel || '—'}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredCancelledReturns.length > 20 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <p className="text-xs text-text-muted">{Math.min(returnsHistoryPage * 20, filteredCancelledReturns.length)} / {filteredCancelledReturns.length} ta</p>
            <div className="flex gap-2">
              <button disabled={returnsHistoryPage === 1} onClick={() => setReturnsHistoryPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-bg-tertiary border border-border rounded-lg text-xs font-bold text-text-primary disabled:opacity-40">{t('sl_prev')}</button>
              <button disabled={returnsHistoryPage >= Math.ceil(filteredCancelledReturns.length / 20)} onClick={() => setReturnsHistoryPage(p => p + 1)}
                className="px-3 py-1.5 bg-bg-tertiary border border-border rounded-lg text-xs font-bold text-text-primary disabled:opacity-40">{t('sl_next')}</button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default ReturnsHistoryTab
