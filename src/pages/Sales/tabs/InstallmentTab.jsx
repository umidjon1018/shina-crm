import { useAuthStore } from '../../../store/authStore'
import { motion } from 'framer-motion'
import { Calendar, TrendingUp, Search, X, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getCategoryColor } from '../../../utils/categoryColors'

const formatPrice = (price, som) => Math.round(price).toLocaleString('uz-UZ') + ' ' + som

const InstallmentTab = ({ ctx }) => {
  const { t } = useTranslation()
  const som = t('unit_som')
  const hasPermission = useAuthStore(st => st.hasPermission)
  const canPercent = hasPermission('sales.installment.percent_columns')
  const canOrgComm = hasPermission('sales.installment.org_commission')
  const {
    installmentMonthFilter, setInstallmentMonthFilter, installmentMonthOptions, formatMonthValue,
    installmentSearch, setInstallmentSearch, installmentTypeFilter, setInstallmentTypeFilter,
    filteredInstallmentSales, sortedInstallmentSales,
    installmentSalesPage, setInstallmentSalesPage,
    installmentSortField, installmentSortOrder, handleInstallmentSort,
    getInstallmentStatusMap, barcodeSelectClass, getItemBarcode,
    productCategories, installmentOrganizations, salesList, usedSalesList, thisMonth,
    detailedOrg, setDetailedOrg, orgMonthFilter, setOrgMonthFilter,
    payoutAmount, setPayoutAmount, selectedPayoutSaleId, setSelectedPayoutSaleId,
    payoutSuccess, handleOrgPayoutSubmit,
    customerPayModal, setCustomerPayModal,
    customerPaySaleId, setCustomerPaySaleId,
    customerPayAmount, setCustomerPayAmount,
    customerPaySuccess, handleCustomerPaySubmit,
  } = ctx

  return (
    <motion.div
      key="installment"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      {/* A) Muddatli sotuvlar jadvali */}
      <div className="bg-bg-secondary border border-border rounded-3xl p-6 shadow-sm overflow-hidden">
        <h3 className="font-syne font-bold text-text-primary text-base mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-accent-red" /> {t('sl_inst_list_title')}
        </h3>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-border/50">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary font-bold">{t('exp_month_label')}</span>
              <select value={installmentMonthFilter} onChange={(e) => { setInstallmentMonthFilter(e.target.value); setInstallmentSalesPage(1) }}
                className="bg-bg-tertiary border border-border text-text-primary px-3 py-1.5 rounded-xl text-xs font-bold focus:outline-none focus:border-accent-red cursor-pointer">
                {installmentMonthOptions.map(opt => <option key={opt} value={opt}>{formatMonthValue(opt)}</option>)}
              </select>
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input type="text" value={installmentSearch} onChange={e => { setInstallmentSearch(e.target.value); setInstallmentSalesPage(1) }}
                placeholder={t('sl_inst_search_ph')}
                className="pl-8 pr-3 py-1.5 bg-bg-tertiary border border-border text-text-primary rounded-xl text-xs font-medium focus:outline-none focus:border-accent-red w-52" />
            </div>
            <div className="flex items-center gap-1 bg-bg-tertiary border border-border rounded-xl p-1">
              {[['all', 'Barchasi'], ['new', 'Yangi'], ['used', 'Eski']].map(([val, label]) => (
                <button key={val} onClick={() => { setInstallmentTypeFilter(val); setInstallmentSalesPage(1) }}
                  className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${installmentTypeFilter === val ? 'bg-accent-red text-white' : 'text-text-muted hover:text-text-primary'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="text-xs text-text-muted">{t('sl_inst_total', { n: filteredInstallmentSales.length })}</div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs min-w-[1270px]" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '130px' }} /><col style={{ width: '160px' }} /><col style={{ width: '150px' }} />
              <col style={{ width: '85px' }} /><col style={{ width: '100px' }} /><col style={{ width: '110px' }} />
              <col style={{ width: '45px' }} /><col style={{ width: '105px' }} /><col style={{ width: '95px' }} />
              <col style={{ width: '65px' }} /><col style={{ width: '85px' }} /><col style={{ width: '45px' }} />
              <col style={{ width: '95px' }} /><col style={{ width: '90px' }} />
            </colgroup>
            <thead className="bg-bg-tertiary text-text-muted">
              <tr>
                {[
                  ['soldAt', t('col_sold_date')], ['itemsNames', t('col_product_name')], ['barcode', t('sl_inst_th_barcode')],
                  ['category', t('col_category')], ['soldByName', t('col_employee')], ['customerName', t('col_customer')],
                  ['qty', t('sl_inst_th_qty')], ['total', t('col_total_sum')], ['installmentOrgName', t('sl_inst_th_org')],
                  ['installmentTermMonths', t('sl_inst_th_term')], ['installmentStatus', t('col_status')],
                  ...(canPercent ? [['installmentCommissionPercent', t('sl_inst_th_percent')], ['installmentCommissionAmount', t('sl_inst_th_commission')]] : []),
                ].map(([key, label]) => (
                  <th key={key} onClick={() => handleInstallmentSort(key)}
                    className="px-4 py-3 font-bold uppercase cursor-pointer hover:text-text-primary select-none transition-colors">
                    <div className="flex items-center gap-1">{label} {installmentSortField === key && (installmentSortOrder === 'asc' ? '▲' : '▼')}</div>
                  </th>
                ))}
                <th className="px-4 py-3 font-bold uppercase text-center">{t('sl_inst_th_payment')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {sortedInstallmentSales.slice((installmentSalesPage - 1) * 20, installmentSalesPage * 20).map(s => {
                const statusInfo = getInstallmentStatusMap[s.id] || { status: 'pending', debtAmount: s.total, paidAmount: 0 }
                const isFullyPaid = statusInfo.status === 'paid'
                const paid = statusInfo.paidAmount
                return (
                  <tr key={s.id} className="hover:bg-bg-tertiary/20 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap text-text-secondary">{new Date(s.soldAt).toLocaleString('uz-UZ')}</td>
                    <td className="px-4 py-3.5 truncate font-bold text-text-primary" title={s.itemsNames}>{s.itemsNames}</td>
                    {s.isUsedSale ? (
                      <td className={`px-4 py-3.5 truncate ${barcodeSelectClass}`}>
                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-accent-orange/10 text-accent-orange whitespace-nowrap">{t('sl_inst_used_badge')}</span>
                      </td>
                    ) : (() => {
                      const barcodes = s.items?.map(it => { const b = it.barcode || getItemBarcode(it.itemId); return (b && b !== '—') ? b : null }).filter(Boolean) || []
                      const visible = barcodes.slice(0, 2); const hidden = barcodes.slice(2)
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
                      const catLabel = s.category ? t('cat_' + s.category, { defaultValue: s.category }) : '—'
                      const catObj = productCategories.find(c => c.label === catLabel || c.id === catLabel)
                      const catColor = getCategoryColor(catObj?.id, productCategories)
                      return <td className="px-4 py-3.5 truncate"><span className={`font-semibold text-sm ${catColor.text}`}>{catLabel}</span></td>
                    })()}
                    <td className="px-4 py-3.5 text-text-secondary truncate">{s.soldByName || '—'}</td>
                    <td className="px-4 py-3.5 text-text-primary font-medium truncate">{s.customerName}</td>
                    <td className="px-4 py-3.5 text-text-secondary">{s.qty}</td>
                    <td className="px-4 py-3.5 text-text-primary font-bold">{formatPrice(s.total, som)}</td>
                    <td className="px-4 py-3.5 text-accent-blue font-bold truncate">{s.installmentOrgName}</td>
                    <td className="px-4 py-3.5 text-text-secondary">{s.installmentTermMonths ? t('sl_inst_term_months', { n: s.installmentTermMonths }) : '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${isFullyPaid ? 'bg-accent-green/10 text-accent-green' : paid > 0 ? 'bg-accent-orange/10 text-accent-orange' : 'bg-accent-red/10 text-accent-red'}`}>
                        {s.installmentStatus}
                      </span>
                    </td>
                    {canPercent && <td className="px-4 py-3.5 text-text-secondary">{s.installmentCommissionPercent ?? installmentOrganizations.find(o => o.id === s.installmentOrgId)?.commissionPercent ?? 0}%</td>}
                    {canPercent && <td className={`px-4 py-3.5 text-text-muted font-mono ${barcodeSelectClass}`}>{formatPrice(s.installmentCommissionAmount ?? Math.round(s.total * ((installmentOrganizations.find(o => o.id === s.installmentOrgId)?.commissionPercent ?? 0) / 100)), som)}</td>}
                    <td className="px-4 py-3.5 text-center">
                      {!isFullyPaid ? (
                        <button onClick={() => { setCustomerPayModal({ customerId: s.customerId, customerName: s.customerName }); setCustomerPaySaleId(null); setCustomerPayAmount('') }}
                          className="px-2.5 py-1 bg-accent-green/10 text-accent-green border border-accent-green/30 rounded-lg text-[10px] font-bold hover:bg-accent-green/20 transition-colors">
                          {t('sl_inst_pay_btn')}
                        </button>
                      ) : <span className="text-text-muted text-[10px]">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {sortedInstallmentSales.length > 20 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <p className="text-xs text-text-muted">{Math.min(installmentSalesPage * 20, sortedInstallmentSales.length)} / {sortedInstallmentSales.length} ta</p>
            <div className="flex gap-2">
              <button disabled={installmentSalesPage === 1} onClick={() => setInstallmentSalesPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-bg-tertiary border border-border rounded-lg text-xs font-bold text-text-primary disabled:opacity-40">{t('sl_prev')}</button>
              <button disabled={installmentSalesPage >= Math.ceil(sortedInstallmentSales.length / 20)} onClick={() => setInstallmentSalesPage(p => p + 1)}
                className="px-3 py-1.5 bg-bg-tertiary border border-border rounded-lg text-xs font-bold text-text-primary disabled:opacity-40">{t('sl_next')}</button>
            </div>
          </div>
        )}
      </div>

      {/* B) Nasiya tashkilotlari */}
      <div className="bg-bg-secondary border border-border rounded-3xl p-6 shadow-sm overflow-hidden animate-fade-in">
        <h3 className="font-syne font-bold text-text-primary text-base mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-accent-green" /> {t('sl_inst_orgs_title')}
        </h3>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs min-w-[900px]">
            <thead className="bg-bg-tertiary text-text-muted">
              <tr>
                {[t('sl_inst_org_th_name'), t('sl_inst_org_th_percent'), t('sl_inst_org_th_total_sales'), t('sl_inst_org_th_month_sales'), t('sl_inst_org_th_total_paid'), t('sl_inst_org_th_month_paid'), t('sl_inst_org_th_total_comm'), t('sl_inst_org_th_month_comm'), t('sl_inst_org_th_debt'), t('sl_inst_org_detail_btn')].map((label, i) => (
                  (canOrgComm || ![1, 6, 7].includes(i)) && <th key={i} className={`px-4 py-3 font-bold uppercase ${[2,3].includes(i) ? 'text-center' : ''}`}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-text-primary">
              {installmentOrganizations.map(org => {
                const orgSales = filteredInstallmentSales.filter(s => s.paymentType === 'installment' && s.status !== 'cancelled' && (s.installmentOrgId === org.id || (!s.installmentOrgId && org.id === 'oddiy_nasiya')))
                const thisMonthSales = orgSales.filter(s => s.soldAt?.startsWith(thisMonth))
                const totalPaid = orgSales.reduce((sum, s) => sum + (s.installmentPaidAmount || 0), 0)
                const thisMonthPaid = thisMonthSales.reduce((sum, s) => sum + (s.installmentPaidAmount || 0), 0)
                const getComm = (s) => s.installmentCommissionAmount ?? Math.round(s.total * ((installmentOrganizations.find(o => o.id === s.installmentOrgId)?.commissionPercent ?? org.commissionPercent) / 100))
                const totalComm = orgSales.reduce((sum, s) => sum + getComm(s), 0)
                const thisMonthComm = thisMonthSales.reduce((sum, s) => sum + getComm(s), 0)
                const totalDebt = orgSales.reduce((sum, s) => sum + (getInstallmentStatusMap[s.id]?.debtAmount ?? s.total), 0)
                return (
                  <tr key={org.id} className="hover:bg-bg-tertiary/20 transition-colors">
                    <td className="px-4 py-3.5 font-bold">{org.name}</td>
                    {canOrgComm && <td className="px-4 py-3.5 text-text-secondary">{org.commissionPercent}%</td>}
                    <td className="px-4 py-3.5 text-center text-text-secondary">{t('sl_inst_org_count', { n: orgSales.length })}</td>
                    <td className="px-4 py-3.5 text-center text-accent-blue">{t('sl_inst_org_count', { n: thisMonthSales.length })}</td>
                    <td className="px-4 py-3.5 text-accent-green">{formatPrice(totalPaid, som)}</td>
                    <td className="px-4 py-3.5 text-text-secondary">{formatPrice(thisMonthPaid, som)}</td>
                    {canOrgComm && <td className="px-4 py-3.5 text-text-muted">{formatPrice(totalComm, som)}</td>}
                    {canOrgComm && <td className="px-4 py-3.5 text-text-muted">{formatPrice(thisMonthComm, som)}</td>}
                    <td className="px-4 py-3.5 font-bold text-accent-red">{formatPrice(totalDebt, som)}</td>
                    <td className="px-4 py-3.5 text-center">
                      <button onClick={() => { setDetailedOrg(org); setOrgMonthFilter('all') }}
                        className="px-3 py-1 bg-accent-blue text-white rounded-lg font-bold text-[10px]">{t('sl_inst_org_detail_btn')}</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batafsil modal */}
      {detailedOrg && (() => {
        const orgSales = filteredInstallmentSales.filter(s => s.paymentType === 'installment' && s.status !== 'cancelled' && (s.installmentOrgId === detailedOrg.id || (!s.installmentOrgId && detailedOrg.id === 'oddiy_nasiya')))
        const filteredSales = orgSales.filter(s => orgMonthFilter === 'all' || s.soldAt?.startsWith(orgMonthFilter))

        const totalSalesAmount = orgSales.reduce((sum, s) => sum + s.total, 0)
        const totalSalesPaid = orgSales.reduce((sum, s) => sum + (getInstallmentStatusMap[s.id]?.paidAmount ?? 0), 0)
        const totalSalesDebt = orgSales.reduce((sum, s) => sum + (getInstallmentStatusMap[s.id]?.debtAmount ?? s.total), 0)
        const totalSalesCommission = orgSales.reduce((sum, s) => sum + (s.total * (detailedOrg.commissionPercent || 0) / 100), 0)

        const targetMonth = orgMonthFilter === 'all' ? thisMonth : orgMonthFilter
        const monthSales = orgSales.filter(s => s.soldAt?.startsWith(targetMonth))
        const monthSalesAmount = monthSales.reduce((sum, s) => sum + s.total, 0)
        const monthSalesPaid = monthSales.reduce((sum, s) => sum + (getInstallmentStatusMap[s.id]?.paidAmount ?? 0), 0)
        const monthSalesDebt = monthSales.reduce((sum, s) => sum + (getInstallmentStatusMap[s.id]?.debtAmount ?? s.total), 0)
        const monthSalesCommission = monthSales.reduce((sum, s) => sum + (s.total * (detailedOrg.commissionPercent || 0) / 100), 0)

        const paidPercent = totalSalesAmount > 0 ? Math.round((totalSalesPaid / totalSalesAmount) * 100) : 0
        const monthPaidPercent = monthSalesAmount > 0 ? Math.round((monthSalesPaid / monthSalesAmount) * 100) : 0

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4" onClick={() => setDetailedOrg(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}
              className="bg-bg-secondary border border-border rounded-3xl p-6 w-full max-w-4xl max-h-[85vh] overflow-y-auto no-scrollbar space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="text-lg font-syne font-extrabold text-text-primary">{t('sl_inst_modal_title', { name: detailedOrg.name })}</h3>
                <button onClick={() => setDetailedOrg(null)} className="text-text-muted hover:text-text-primary"><X size={20} /></button>
              </div>

              <div className="bg-bg-tertiary p-4 border border-border rounded-2xl space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted block">{t('sl_inst_modal_month_filter')}</label>
                <select value={orgMonthFilter} onChange={e => setOrgMonthFilter(e.target.value)}
                  className="w-full bg-bg-secondary text-text-primary text-xs font-bold border border-border rounded-xl px-3 py-2.5 outline-none focus:border-accent-blue">
                  <option value="all">{t('filter_all')}</option>
                  {Array.from(new Set(orgSales.map(s => s.soldAt?.substring(0, 7)))).map(m => (
                    <option key={m} value={m}>{formatMonthValue(m)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">{t('sl_inst_modal_total_header')}</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: t('sl_inst_modal_total_sales'), value: formatPrice(totalSalesAmount, som), color: 'text-text-primary' },
                      { label: t('sl_inst_modal_total_paid'), value: formatPrice(totalSalesPaid, som), color: 'text-accent-green', badge: paidPercent + '%', badgeClass: 'bg-accent-green/10 text-accent-green' },
                      { label: t('sl_inst_modal_total_debt'), value: formatPrice(totalSalesDebt, som), color: 'text-accent-red', badge: (100-paidPercent) + '%', badgeClass: 'bg-accent-red/10 text-accent-red' },
                      { label: t('sl_inst_modal_total_comm'), value: formatPrice(totalSalesCommission, som), color: 'text-text-secondary' },
                    ].map((card, i) => (
                      <div key={i} className="bg-bg-tertiary border border-border/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">{card.label}</span>
                        <div className="flex items-center justify-between mt-1 gap-2">
                          <h3 className={`text-sm md:text-base font-extrabold ${card.color}`}>{card.value}</h3>
                          {card.badge && <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded whitespace-nowrap ${card.badgeClass}`}>{card.badge}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">
                    {orgMonthFilter === 'all' ? t('sl_inst_modal_month_header_current', { month: formatMonthValue(thisMonth) }) : t('sl_inst_modal_month_header_selected', { month: formatMonthValue(orgMonthFilter) })}
                  </span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: t('sl_inst_modal_month_sales'), value: formatPrice(monthSalesAmount, som), color: 'text-text-primary' },
                      { label: t('sl_inst_modal_month_paid'), value: formatPrice(monthSalesPaid, som), color: 'text-accent-green', badge: monthPaidPercent + '%', badgeClass: 'bg-accent-green/10 text-accent-green' },
                      { label: t('sl_inst_modal_month_debt'), value: formatPrice(monthSalesDebt, som), color: 'text-accent-red', badge: (100-monthPaidPercent) + '%', badgeClass: 'bg-accent-red/10 text-accent-red' },
                      { label: t('sl_inst_modal_month_comm'), value: formatPrice(monthSalesCommission, som), color: 'text-text-secondary' },
                    ].map((card, i) => (
                      <div key={i} className="bg-bg-tertiary border border-border/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">{card.label}</span>
                        <div className="flex items-center justify-between mt-1 gap-2">
                          <h3 className={`text-sm md:text-base font-extrabold ${card.color}`}>{card.value}</h3>
                          {card.badge && <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded whitespace-nowrap ${card.badgeClass}`}>{card.badge}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {orgMonthFilter !== 'all' && (() => {
                const monthDebt = filteredSales.reduce((sum, s) => sum + (getInstallmentStatusMap[s.id]?.debtAmount ?? s.total), 0)
                const monthPaid = filteredSales.reduce((sum, s) => sum + (getInstallmentStatusMap[s.id]?.paidAmount ?? 0), 0)
                const diff = monthPaid - monthDebt
                return (
                  <div className={`p-4 rounded-2xl border text-center ${diff >= 0 ? 'bg-accent-green/10 border-accent-green/30' : 'bg-accent-red/10 border-accent-red/30'}`}>
                    <span className="text-[10px] font-bold text-text-muted uppercase block mb-1">{diff >= 0 ? t('sl_inst_modal_overpaid') : t('sl_inst_modal_debt_card')}</span>
                    <h3 className={`text-xl font-syne font-extrabold ${diff >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>{formatPrice(Math.abs(diff), som)}</h3>
                  </div>
                )
              })()}

              <div className="bg-bg-tertiary p-4 border border-accent-blue/30 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="space-y-1 text-center md:text-left">
                  <h4 className="text-xs font-bold text-text-primary">{t('sl_inst_payout_title')}</h4>
                  <p className="text-[10px] text-text-muted">{t('sl_inst_payout_desc')}</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <input type="number" value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)}
                    placeholder={selectedPayoutSaleId ? t('sl_inst_payout_sale_ph') : t('sl_inst_payout_ph')}
                    className="flex-1 md:w-48 px-4 py-2.5 bg-bg-secondary border border-border rounded-xl text-xs text-text-primary outline-none focus:border-accent-blue" />
                  <button onClick={handleOrgPayoutSubmit} className="px-4 py-2.5 bg-accent-blue text-white rounded-xl font-bold text-xs hover:opacity-90">{t('sl_inst_payout_accept')}</button>
                </div>
              </div>

              {payoutSuccess && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-4 py-3 bg-accent-green/10 border border-accent-green/30 rounded-xl text-accent-green text-xs font-bold">
                  <CheckCircle size={14} className="shrink-0" /> {t('sl_inst_payout_success')}
                </motion.div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('sl_inst_sales_list')}</label>
                  {selectedPayoutSaleId && (
                    <span className="text-[10px] text-accent-blue font-bold flex items-center gap-2">
                      {t('sl_inst_selected_sale')}
                      <button onClick={() => setSelectedPayoutSaleId(null)} className="text-text-muted hover:text-accent-red">{t('sl_inst_cancel_selection')}</button>
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto no-scrollbar border border-border rounded-2xl">
                  <table className="w-full text-left text-[11px] bg-bg-secondary">
                    <thead className="bg-bg-tertiary text-text-muted">
                      <tr>
                        <th className="px-3 py-2 w-8"></th>
                        {[t('col_product'), t('col_customer'), t('col_date'), t('sl_inst_modal_th_total'), t('sl_inst_modal_th_term'), t('sl_inst_modal_th_qty'), t('sl_inst_modal_th_debt')].map((l, i) => (
                          <th key={i} className="px-4 py-2 font-bold uppercase">{l}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredInstallmentSales
                        .filter(s => s.paymentType === 'installment' && s.status !== 'cancelled' && (s.installmentOrgId === detailedOrg.id || (!s.installmentOrgId && detailedOrg.id === 'oddiy_nasiya')))
                        .filter(s => orgMonthFilter === 'all' || s.soldAt?.startsWith(orgMonthFilter))
                        .sort((a, b) => new Date(b.soldAt) - new Date(a.soldAt))
                        .map(s => {
                          const si = getInstallmentStatusMap[s.id] || { status: 'pending', debtAmount: s.total, paidAmount: 0 }
                          const isFullyPaid = si.status === 'paid'
                          const isChecked = selectedPayoutSaleId === s.id
                          const statusLabel = isFullyPaid ? t('sl_inst_modal_debt_paid') : si.paidAmount > 0 ? t('inc_filter_partial') : t('sl_inst_status_pending')
                          return (
                            <tr key={s.id} className={`transition-colors ${isChecked ? 'bg-accent-blue/5' : 'hover:bg-bg-tertiary/10'}`}>
                              <td className="px-3 py-2.5 text-center">
                                {!isFullyPaid && <input type="checkbox" checked={isChecked} onChange={() => setSelectedPayoutSaleId(isChecked ? null : s.id)} className="w-3.5 h-3.5 accent-blue-500 cursor-pointer" />}
                              </td>
                              <td className="px-4 py-2.5 font-bold text-text-primary">{s.items?.map(i => i.name).join(', ') || '—'}</td>
                              <td className="px-4 py-2.5 text-text-secondary">{s.customerName}</td>
                              <td className="px-4 py-2.5 text-text-muted">{new Date(s.soldAt).toLocaleDateString('uz-UZ')}</td>
                              <td className="px-4 py-2.5 text-text-primary font-bold">{formatPrice(s.total, som)}</td>
                              <td className="px-4 py-2.5 text-text-secondary">{s.installmentTermMonths ? t('sl_inst_term_months', { n: s.installmentTermMonths }) : '—'}</td>
                              <td className="px-4 py-2.5 text-text-secondary">{s.items?.reduce((sum, it) => sum + (it.qty || 1), 0) || 0} ta</td>
                              <td className="px-4 py-2.5">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${isFullyPaid ? 'bg-accent-green/10 text-accent-green' : si.paidAmount > 0 ? 'bg-accent-orange/10 text-accent-orange' : 'bg-accent-red/10 text-accent-red'}`}>
                                  {statusLabel} {si.debtAmount > 0 && `(${formatPrice(si.debtAmount, som)})`}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>
        )
      })()}

      {/* Mijozdan to'lov modal */}
      {customerPayModal && (() => {
        const custSales = [...salesList, ...(usedSalesList || [])].filter(s => s.paymentType === 'installment' && s.status !== 'cancelled' && s.customerId === customerPayModal.customerId)
        const totalDebt = custSales.reduce((sum, s) => sum + (getInstallmentStatusMap[s.id]?.debtAmount ?? (s.installmentDebt ?? s.total)), 0)
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[130] flex items-center justify-center p-4"
            onClick={() => { setCustomerPayModal(null); setCustomerPaySaleId(null); setCustomerPayAmount('') }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}
              className="bg-bg-secondary border border-border rounded-3xl p-6 w-full max-w-xl max-h-[80vh] overflow-y-auto no-scrollbar space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div>
                  <h3 className="text-base font-syne font-extrabold text-text-primary">{customerPayModal.customerName}</h3>
                  <p className="text-xs text-text-muted mt-0.5">{t('sl_inst_cust_debt')} <span className="font-bold text-accent-red">{formatPrice(totalDebt, som)}</span></p>
                </div>
                <button onClick={() => { setCustomerPayModal(null); setCustomerPaySaleId(null); setCustomerPayAmount('') }} className="text-text-muted hover:text-text-primary"><X size={20} /></button>
              </div>

              <div className="space-y-2">
                {custSales.map(s => {
                  const si = getInstallmentStatusMap[s.id] || { status: 'pending', debtAmount: s.installmentDebt ?? s.total, paidAmount: s.installmentPaidAmount || 0 }
                  const isPaid = si.status === 'paid'
                  const isChecked = customerPaySaleId === s.id
                  return (
                    <div key={s.id} onClick={() => !isPaid && setCustomerPaySaleId(isChecked ? null : s.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-colors ${isChecked ? 'border-accent-blue bg-accent-blue/5' : isPaid ? 'border-border/40 bg-bg-tertiary/30 opacity-60' : 'border-border hover:bg-bg-tertiary/30'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-text-primary truncate">{s.items?.map(i => i.name).join(', ') || '—'}</p>
                          <p className="text-[10px] text-text-muted mt-0.5">{new Date(s.soldAt).toLocaleDateString('uz-UZ')} · {s.installmentTermMonths ? `${s.installmentTermMonths} oy` : '—'} · {s.installmentOrgName || '—'}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-text-primary">{formatPrice(s.total, som)}</p>
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${isPaid ? 'bg-accent-green/10 text-accent-green' : si.paidAmount > 0 ? 'bg-accent-orange/10 text-accent-orange' : 'bg-accent-red/10 text-accent-red'}`}>
                            {isPaid ? t('sl_inst_modal_debt_paid') : t('sl_inst_modal_debt_label', { amount: formatPrice(si.debtAmount, som) })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {totalDebt > 0 && (
                <div className="bg-bg-tertiary border border-accent-blue/30 rounded-2xl p-4 space-y-3">
                  {customerPaySaleId && (
                    <p className="text-[10px] text-accent-blue font-bold">{t('sl_inst_cust_pay_selected')} <button onClick={() => setCustomerPaySaleId(null)} className="underline text-text-muted">{t('sl_inst_cust_cancel')}</button></p>
                  )}
                  <div className="flex gap-2">
                    <input type="number" value={customerPayAmount} onChange={e => setCustomerPayAmount(e.target.value)}
                      placeholder={customerPaySaleId ? t('sl_inst_payout_sale_ph') : t('sl_inst_cust_ph')}
                      className="flex-1 px-3 py-2 bg-bg-secondary border border-border rounded-xl text-xs text-text-primary outline-none focus:border-accent-blue" />
                    <button onClick={handleCustomerPaySubmit} className="px-4 py-2 bg-accent-blue text-white rounded-xl font-bold text-xs hover:opacity-90">{t('sl_inst_cust_accept')}</button>
                  </div>
                  {customerPaySuccess && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-accent-green/10 border border-accent-green/30 rounded-xl text-accent-green text-xs font-bold">
                      <CheckCircle size={13} /> {t('sl_inst_cust_success')}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )
      })()}
    </motion.div>
  )
}

export default InstallmentTab
