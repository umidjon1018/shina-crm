import { useState } from 'react'
import { useAuthStore } from '../../../store/authStore'
import { motion } from 'framer-motion'
import Modal from '../../../components/ui/Modal'
import MonthRangeSelect from '../../../components/ui/MonthRangeSelect'
import { matchPeriod, isRange, parseRange, rangeText } from '../../../utils/period'
import DataTable from '../../../components/ui/DataTable'
import { Segmented, Badge, DetailGrid } from '../../../components/ui/Kit'
import { formatNumber, formatDateTime } from '../../../utils/format'
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

  const [openSale, setOpenSale] = useState(null)
  const money = (v) => `${formatNumber(Math.round(v || 0))} ${som}`
  const orgOf = (s) => installmentOrganizations.find(o => o.id === s.installmentOrgId)
  const commPct = (s) => s.installmentCommissionPercent ?? orgOf(s)?.commissionPercent ?? 0
  const commAmt = (s) => s.installmentCommissionAmount ?? Math.round(s.total * (commPct(s) / 100))
  const info = (s) => getInstallmentStatusMap[s.id] || { status: 'pending', debtAmount: s.total, paidAmount: 0 }
  const statusBadge = (s) => {
    const st = info(s)
    return <Badge color={st.status === 'paid' ? 'bg-accent-green/10 text-accent-green' : st.paidAmount > 0 ? 'bg-accent-orange/10 text-accent-orange' : 'bg-accent-red/10 text-accent-red'}>{s.installmentStatus}</Badge>
  }
  const barcodesOf = (s) => s.items?.map(it => { const b = it.barcode || getItemBarcode(it.itemId); return (b && b !== '—') ? b : null }).filter(Boolean) || []
  const openPay = (s) => { setCustomerPayModal({ customerId: s.customerId, customerName: s.customerName }); setCustomerPaySaleId(null); setCustomerPayAmount('') }
  const payButton = (s) => info(s).status !== 'paid' && (
    <button onClick={(e) => { e.stopPropagation(); openPay(s) }}
      className="px-3 py-1.5 bg-accent-green/10 text-accent-green border border-accent-green/30 rounded-xl text-sm font-bold hover:bg-accent-green/20 transition-colors whitespace-nowrap">
      {t('sl_inst_pay_btn')}
    </button>
  )
  const orgStats = installmentOrganizations.map(org => {
    const orgSales = filteredInstallmentSales.filter(s => s.paymentType === 'installment' && s.status !== 'cancelled' && (s.installmentOrgId === org.id || (!s.installmentOrgId && org.id === 'oddiy_nasiya')))
    const getComm = (s) => s.installmentCommissionAmount ?? Math.round(s.total * ((installmentOrganizations.find(o => o.id === s.installmentOrgId)?.commissionPercent ?? org.commissionPercent) / 100))
    return {
      org, count: orgSales.length, monthCount: orgSales.filter(s => s.soldAt?.startsWith(thisMonth)).length,
      paid: orgSales.reduce((sum, s) => sum + (s.installmentPaidAmount || 0), 0),
      comm: orgSales.reduce((sum, s) => sum + getComm(s), 0),
      debt: orgSales.reduce((sum, s) => sum + (getInstallmentStatusMap[s.id]?.debtAmount ?? s.total), 0),
    }
  })

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-5">
      {/* Nasiya tashkilotlari — kartochkalar, bosilsa batafsil */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {orgStats.map(o => (
          <button key={o.org.id} onClick={() => { setDetailedOrg(o.org); setOrgMonthFilter('all') }}
            className="panel p-4 text-left hover:border-border-bright transition-colors active:scale-[0.99]">
            <div className="flex items-center justify-between gap-2">
              <p className="text-base font-bold text-text-primary truncate">{o.org.name}</p>
              {canOrgComm && <Badge>{o.org.commissionPercent}%</Badge>}
            </div>
            <p className="mt-2 text-2xl font-bold text-accent-red">{money(o.debt)}</p>
            <p className="text-sm text-text-muted">{t('sl_inst_org_th_debt')}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <span className="text-text-secondary">{t('sl_inst_org_th_total_paid')}: <b className="text-accent-green">{money(o.paid)}</b></span>
              <span className="text-text-secondary text-right">{t('sl_inst_org_count', { n: o.count })} · {t('sl_inst_org_th_month_sales')}: {o.monthCount}</span>
              {canOrgComm && <span className="text-text-muted col-span-2">{t('sl_inst_org_th_total_comm')}: {money(o.comm)}</span>}
            </div>
          </button>
        ))}
      </div>

      {/* Filtrlar */}
      <div className="flex flex-wrap items-center gap-2">
        <Segmented value={installmentTypeFilter} onChange={(v) => { setInstallmentTypeFilter(v); setInstallmentSalesPage(1) }}
          options={[{ id: 'all', label: t('filter_all') }, { id: 'new', label: t('sl_profit_type_new') }, { id: 'used', label: t('sl_profit_used_badge') }]} />
        <MonthRangeSelect value={installmentMonthFilter} onChange={(v) => { setInstallmentMonthFilter(v); setInstallmentSalesPage(1) }}
          months={installmentMonthOptions} monthLabel={formatMonthValue} />
        <div className="relative flex-1 min-w-[200px]">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input type="text" value={installmentSearch} onChange={e => { setInstallmentSearch(e.target.value); setInstallmentSalesPage(1) }}
            placeholder={t('sl_inst_search_ph')}
            className="w-full pl-10 pr-3 py-2.5 bg-bg-secondary border border-border text-text-primary rounded-xl text-[15px] focus:outline-none focus:border-accent-red" />
        </div>
      </div>

      <DataTable rows={sortedInstallmentSales} rowKey={s => (s.isUsedSale ? 'u' : 'n') + s.id} onRowClick={setOpenSale}
        initialSort={{ key: 'date', dir: 'desc' }} resetKey={`${installmentSearch}|${installmentMonthFilter}|${installmentTypeFilter}`}
        empty={t('sl_profit_empty')}
        columns={[
          { key: 'date', label: t('col_sold_date'), sortValue: s => s.soldAt || '', render: s => <span className="whitespace-nowrap text-text-secondary">{formatDateTime(s.soldAt)}</span> },
          { key: 'customer', label: t('col_customer'), sortValue: s => s.customerName || '', render: s => (
            <div className="min-w-0">
              <p className="font-semibold text-text-primary truncate">{s.customerName}</p>
              <p className="text-sm text-text-muted truncate max-w-[260px]">{s.itemsNames}</p>
            </div>
          ) },
          { key: 'total', label: t('col_total_sum'), align: 'right', sortValue: s => s.total, render: s => (
            <div className="whitespace-nowrap">
              <p className="font-bold text-text-primary">{money(s.total)}</p>
              <p className="text-sm text-accent-blue">{s.installmentOrgName}</p>
            </div>
          ) },
          { key: 'status', label: t('col_status'), sortValue: s => info(s).debtAmount, render: s => (
            <div className="space-y-0.5">{statusBadge(s)}{info(s).status !== 'paid' && <p className="text-sm text-accent-red whitespace-nowrap">{money(info(s).debtAmount)}</p>}</div>
          ) },
          { key: 'term', label: t('sl_inst_th_term'), optional: true, sortValue: s => s.installmentTermMonths || 0, render: s => s.installmentTermMonths ? t('sl_inst_term_months', { n: s.installmentTermMonths }) : '—' },
          { key: 'paid', label: t('sl_inst_org_th_total_paid'), optional: true, align: 'right', sortValue: s => info(s).paidAmount, render: s => <span className="text-accent-green whitespace-nowrap">{money(info(s).paidAmount)}</span> },
          { key: 'seller', label: t('col_employee'), optional: true, sortValue: s => s.soldByName || '', render: s => s.soldByName || '—' },
          { key: 'qty', label: t('sl_inst_th_qty'), optional: true, align: 'center', sortValue: s => s.qty || 0, render: s => s.qty },
          ...(canPercent ? [{ key: 'comm', label: t('sl_inst_th_commission'), optional: true, align: 'right', sortValue: s => commAmt(s), render: s => <span className="whitespace-nowrap">{money(commAmt(s))}</span> }] : []),
          { key: 'pay', label: '', sortable: false, align: 'right', render: payButton },
        ]} tableId="installments" />

      {/* Bitta nasiya sotuv — barcha ustunlar */}
      <Modal open={!!openSale} onClose={() => setOpenSale(null)} size="lg" icon={Calendar}
        title={openSale?.customerName} subtitle={openSale && formatDateTime(openSale.soldAt)}
        footer={openSale && info(openSale).status !== 'paid' && (
          <button onClick={() => { const s = openSale; setOpenSale(null); openPay(s) }} className="w-full py-3 rounded-xl g-green text-white font-bold">{t('sl_inst_pay_btn')}</button>
        )}>
        {openSale && (
          <div className="space-y-4">
            <DetailGrid cols={3} items={[
              { label: t('col_status'), value: statusBadge(openSale) },
              { label: t('col_total_sum'), value: <b>{money(openSale.total)}</b> },
              { label: t('sl_inst_org_th_debt'), value: <span className="text-accent-red font-bold">{money(info(openSale).debtAmount)}</span> },
              { label: t('sl_inst_org_th_total_paid'), value: <span className="text-accent-green">{money(info(openSale).paidAmount)}</span> },
              { label: t('sl_inst_th_org'), value: openSale.installmentOrgName || '—' },
              { label: t('sl_inst_th_term'), value: openSale.installmentTermMonths ? t('sl_inst_term_months', { n: openSale.installmentTermMonths }) : '—' },
              { label: t('col_employee'), value: openSale.soldByName || '—' },
              { label: t('col_category'), value: openSale.category ? t('cat_' + openSale.category, { defaultValue: openSale.category }) : '—' },
              { label: t('sl_inst_th_qty'), value: openSale.qty },
              ...(canPercent ? [{ label: t('sl_inst_th_percent'), value: `${commPct(openSale)}%` }, { label: t('sl_inst_th_commission'), value: money(commAmt(openSale)) }] : []),
            ]} />
            <div className="panel px-4 py-3">
              <p className="text-[15px] font-semibold text-text-primary">{openSale.itemsNames}</p>
              <p className="text-sm text-text-muted font-mono mt-1">{openSale.isUsedSale ? t('sl_inst_used_badge') : (barcodesOf(openSale).join(', ') || '—')}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Batafsil modal */}
      {detailedOrg && (() => {
        const orgSales = filteredInstallmentSales.filter(s => s.paymentType === 'installment' && s.status !== 'cancelled' && (s.installmentOrgId === detailedOrg.id || (!s.installmentOrgId && detailedOrg.id === 'oddiy_nasiya')))
        const filteredSales = orgSales.filter(s => matchPeriod(s.soldAt, orgMonthFilter))

        const totalSalesAmount = orgSales.reduce((sum, s) => sum + s.total, 0)
        const totalSalesPaid = orgSales.reduce((sum, s) => sum + (getInstallmentStatusMap[s.id]?.paidAmount ?? 0), 0)
        const totalSalesDebt = orgSales.reduce((sum, s) => sum + (getInstallmentStatusMap[s.id]?.debtAmount ?? s.total), 0)
        const totalSalesCommission = orgSales.reduce((sum, s) => sum + (s.total * (detailedOrg.commissionPercent || 0) / 100), 0)

        const monthSales = orgSales.filter(s => matchPeriod(s.soldAt, orgMonthFilter === 'all' ? thisMonth : orgMonthFilter))
        const monthSalesAmount = monthSales.reduce((sum, s) => sum + s.total, 0)
        const monthSalesPaid = monthSales.reduce((sum, s) => sum + (getInstallmentStatusMap[s.id]?.paidAmount ?? 0), 0)
        const monthSalesDebt = monthSales.reduce((sum, s) => sum + (getInstallmentStatusMap[s.id]?.debtAmount ?? s.total), 0)
        const monthSalesCommission = monthSales.reduce((sum, s) => sum + (s.total * (detailedOrg.commissionPercent || 0) / 100), 0)

        const paidPercent = totalSalesAmount > 0 ? Math.round((totalSalesPaid / totalSalesAmount) * 100) : 0
        const monthPaidPercent = monthSalesAmount > 0 ? Math.round((monthSalesPaid / monthSalesAmount) * 100) : 0

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[340] flex items-center justify-center p-4" onClick={() => setDetailedOrg(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}
              className="bg-bg-secondary border border-border rounded-3xl p-4 sm:p-6 w-full max-w-4xl max-h-[85vh] overflow-y-auto no-scrollbar space-y-4 sm:space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="text-lg font-syne font-extrabold text-text-primary">{t('sl_inst_modal_title', { name: detailedOrg.name })}</h3>
                <button onClick={() => setDetailedOrg(null)} className="text-text-muted hover:text-text-primary"><X size={20} /></button>
              </div>

              <div className="bg-bg-tertiary p-4 border border-border rounded-2xl space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted block">{t('sl_inst_modal_month_filter')}</label>
                <MonthRangeSelect value={orgMonthFilter} onChange={setOrgMonthFilter} className="w-full"
                  months={Array.from(new Set(orgSales.map(s => s.soldAt?.substring(0, 7)).filter(Boolean)))} monthLabel={formatMonthValue} />
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
                    {orgMonthFilter === 'all' ? t('sl_inst_modal_month_header_current', { month: formatMonthValue(thisMonth) }) : t('sl_inst_modal_month_header_selected', { month: isRange(orgMonthFilter) ? rangeText(parseRange(orgMonthFilter).from, parseRange(orgMonthFilter).to) : formatMonthValue(orgMonthFilter) })}
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
                          <th key={i} className="px-3 sm:px-4 py-2 font-bold uppercase">{l}</th>
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
                              <td className="px-3 sm:px-4 py-2.5 font-bold text-text-primary">{s.items?.map(i => i.name).join(', ') || '—'}</td>
                              <td className="px-3 sm:px-4 py-2.5 text-text-secondary">{s.customerName}</td>
                              <td className="px-3 sm:px-4 py-2.5 text-text-muted">{new Date(s.soldAt).toLocaleDateString('uz-UZ')}</td>
                              <td className="px-3 sm:px-4 py-2.5 text-text-primary font-bold">{formatPrice(s.total, som)}</td>
                              <td className="px-3 sm:px-4 py-2.5 text-text-secondary">{s.installmentTermMonths ? t('sl_inst_term_months', { n: s.installmentTermMonths }) : '—'}</td>
                              <td className="px-3 sm:px-4 py-2.5 text-text-secondary">{s.items?.reduce((sum, it) => sum + (it.qty || 1), 0) || 0} ta</td>
                              <td className="px-3 sm:px-4 py-2.5">
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[350] flex items-center justify-center p-4"
            onClick={() => { setCustomerPayModal(null); setCustomerPaySaleId(null); setCustomerPayAmount('') }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}
              className="bg-bg-secondary border border-border rounded-3xl p-4 sm:p-6 w-full max-w-xl max-h-[80vh] overflow-y-auto no-scrollbar space-y-4 shadow-2xl">
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
