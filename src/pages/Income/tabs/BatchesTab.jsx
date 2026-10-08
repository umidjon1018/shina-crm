import React, { useState, useRef, useCallback } from 'react'
import TableView from '../../../components/ui/TableView'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Truck, Edit3, Search, Plus, DollarSign, Clock, ChevronDown, ChevronUp, Check, X, Trash2, ExternalLink, Filter, Info, CheckCircle, Wallet, BarChart3, TrendingUp, AlertCircle, Users, FileSpreadsheet } from 'lucide-react'
import { togglePromoPassToCustomer } from '../../../api/incomeService'
import { getCategoryColor } from '../../../utils/categoryColors'
import { formatPrice, formatUSD, statusConfig, getDueDays, calcRateDiff, calcPaymentRateDiff } from '../components/incHelpers'
import IncomeImportModal from '../../../components/IncomeImportModal'
import ProductImageViewer from '../../../components/ProductImageViewer'

const BatchesTab = ({ ctx }) => {
  const { t } = useTranslation()
  const {
    user, isPrivileged, som,
    batches, setBatches, suppliers, setSuppliers, loading,
    activeTab, setActiveTab,
    shopBatches, filteredBatches,
    showSupplierModal, setShowSupplierModal,
    editingSupplier, setEditingSupplier,
    showPaymentModal, setShowPaymentModal,
    expandedBatch, setExpandedBatch,
    showLinkModal, setShowLinkModal,
    filterSupplier, setFilterSupplier,
    filterStatus, setFilterStatus,
    searchQuery, setSearchQuery,
    showNewBatchModal, setShowNewBatchModal,
    newBatchForm, setNewBatchForm,
    editingBatch, setEditingBatch,
    editingPayment, setEditingPayment,
    showSupplierDetail, setShowSupplierDetail,
    contractDialog, setContractDialog,
    currentPage, setCurrentPage, ITEMS_PER_PAGE,
    search1, setSearch1, filter1Supplier, setFilter1Supplier,
    filter1Status, setFilter1Status, page1, setPage1,
    search2, setSearch2, filter2Supplier, setFilter2Supplier,
    filter2Status, setFilter2Status, page2, setPage2,
    PAGE_SIZE, deletePaymentConfirm, setDeletePaymentConfirm,
    usdRate, productCategories, bump, selectedShopId,
    paged1, totalPages1, total1, paged2, totalPages2, total2,
    getSupplierName,
    inventoryCheck, allMatch,
    MOCK_PRODUCTS,
  } = ctx

  const [showImport, setShowImport] = useState(false)

  // ---- Ustun kengligi drag-resize ----
  const useColResize = (initial) => {
    const [widths, setWidths] = useState(initial)
    const drag = useRef(null)
    const startResize = useCallback((idx) => (e) => {
      e.preventDefault()
      drag.current = { idx, startX: e.clientX, snap: [...widths] }
      const onMove = (e) => {
        if (!drag.current) return
        const { idx, startX, snap } = drag.current
        const delta = e.clientX - startX
        const minW = 60
        const cur = Math.max(minW, snap[idx] + delta)
        const nxt = Math.max(minW, snap[idx + 1] - delta)
        if (cur >= minW && nxt >= minW) {
          setWidths(prev => { const w = [...prev]; w[idx] = cur; w[idx + 1] = nxt; return w })
        }
      }
      const onUp = () => { drag.current = null; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    }, [widths])
    return { widths, startResize }
  }

  const t1 = useColResize([110, 200, 110, 150, 80, 140, 130, 160, 130, 80])
  const t2 = useColResize([200, 110, 150, 150, 160, 140, 140, 130, 130, 100])

  return (
    <>
          <div className="space-y-10">

            {/* ===== JADVAL 1: KIRIMLAR ===== */}
            <div className="space-y-4">
              {/* Sarlavha + Yangi kirim tugmasi */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-syne font-extrabold text-text-primary">{t('inc_table1_title')}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowImport(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-accent-green/10 text-accent-green border border-accent-green/30 rounded-xl text-sm font-bold hover:bg-accent-green/20 transition-colors"
                  >
                    <FileSpreadsheet size={16} /> Excel import
                  </button>
                  <button
                    onClick={() => { setNewBatchForm(f => ({ ...f, unit: '' })); setShowNewBatchModal(true) }}
                    className="flex items-center gap-2 px-4 py-2 bg-accent-blue text-white rounded-xl text-sm font-bold hover:opacity-90"
                  >
                    <Plus size={16} /> {t('inc_new_batch_btn')}
                  </button>
                </div>
              </div>

              {/* Filter 1 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-bg-secondary p-4 border border-border rounded-2xl">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder={t('col_product') + '...'}
                    value={search1}
                    onChange={e => { setSearch1(e.target.value) }}
                    className="w-full bg-bg-tertiary border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <select value={filter1Supplier} onChange={e => setFilter1Supplier(e.target.value)}
                  className="bg-bg-tertiary border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent-blue">
                  <option value="all">{t('inc_all_suppliers')}</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select value={filter1Status} onChange={e => setFilter1Status(e.target.value)}
                  className="bg-bg-tertiary border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent-blue">
                  <option value="all">{t('inc_all_statuses')}</option>
                  <option value="paid">{t('inc_filter_paid')}</option>
                  <option value="partial">{t('inc_filter_partial')}</option>
                  <option value="credit">{t('inc_filter_credit')}</option>
                  <option value="unpaid">{t('inc_filter_unpaid')}</option>
                </select>
              </div>

              {/* Jadval 1 */}
              <div className="bg-bg-secondary border border-border rounded-[2rem] overflow-hidden">
                <TableView id="inc_batches" optional={[t('col_category'), t('inc_th_unit_price'), t('inc_th_entry_rate')]}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                      {t1.widths.map((w, i) => <col key={i} style={{ width: w + 'px' }} />)}
                    </colgroup>
                    <thead className="bg-bg-tertiary text-xs font-extrabold uppercase tracking-widest text-text-muted border-b border-border">
                      <tr>
                        {[t('col_date'), t('col_product'), t('col_category'), t('col_supplier'), t('inc_th_qty'), t('inc_th_unit_price'), t('inc_th_entry_rate'), t('inc_th_total'), t('col_status'), t('inc_th_actions')].map((label, i) => (
                          <th key={i} className="px-3 sm:px-4 py-2.5 sm:py-4 relative select-none" style={{ overflow: 'hidden' }}>
                            <span className={i === 9 ? 'float-right' : ''}>{label}</span>
                            {i < 9 && (
                              <span
                                onMouseDown={t1.startResize(i)}
                                className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-accent-blue/40 transition-colors"
                              />
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {paged1.map(batch => {
                        const status = statusConfig[batch.paymentStatus]
                        return (
                          <tr key={batch.id} className={`hover:bg-bg-tertiary/50 transition-colors ${batch.hasMissingPrice ? 'border-l-4 border-accent-red' : batch.isFromWarehouse && !batch.purchasePriceUSD ? 'border-l-2 border-accent-blue' : ''}`}>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-4">
                              <p className="text-sm text-text-secondary">
                                {new Date(batch.receivedAt).toLocaleDateString('uz-UZ')}
                              </p>
                              {batch.isFromWarehouse && (
                                <span className="text-[10px] bg-accent-blue/10 text-accent-blue px-2 py-0.5 rounded-full font-bold">
                                  {t('inc_warehouse_badge')}
                                </span>
                              )}
                            </td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-4">
                              <div className="flex items-center gap-2">
                                <ProductImageViewer productId={batch.productId} size="sm" />
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-text-primary truncate">{batch.productName}</p>
                                  {!batch.purchasePriceUSD && (
                                    <span className="text-[10px] bg-accent-orange/10 text-accent-orange px-2 py-0.5 rounded-full font-bold">
                                      ⚠️ {t('inc_no_price')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-4">
                              {(() => {
                                const catId = batch.productCategory
                                const catColor = getCategoryColor(catId, productCategories)
                                const catObj = productCategories?.find(c => c.id === catId)
                                const catLabel = catObj ? t('cat_' + catObj.id, { defaultValue: catObj.label }) : (catId || '—')
                                return <span className={`font-semibold text-sm ${catColor.text}`}>{catLabel}</span>
                              })()}
                            </td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-4">
                              {batch.supplierId ? (
                                <span className="text-sm text-text-secondary">{getSupplierName(batch.supplierId)}</span>
                              ) : (
                                <button
                                  onClick={() => setShowLinkModal(batch)}
                                  className="text-xs text-accent-blue border border-accent-blue/30 px-2 py-1 rounded-lg hover:bg-accent-blue/10"
                                >
                                  {t('inc_link_supplier_btn')}
                                </button>
                              )}
                            </td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-4 font-bold text-sm text-text-primary">{batch.quantity} {batch.unit || 'dona'}</td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-4">
                              <p className="text-sm font-bold text-text-primary">${batch.purchasePriceUSD}</p>
                              <p className="text-xs text-text-muted">
                                {formatPrice(batch.purchasePriceUSD * batch.entryUsdRate)} {t('unit_som')}
                              </p>
                            </td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-4">
                              <p className="text-sm font-bold text-text-primary">{formatPrice(batch.entryUsdRate)}</p>
                              <p className="text-xs text-text-muted">{t('unit_som')} / $1</p>
                            </td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-4">
                              <p className="text-sm font-bold text-text-primary">{formatUSD(batch.totalUSD)}</p>
                              <p className="text-xs text-text-muted">{formatPrice(batch.totalUZS_atEntry)} {som}</p>
                            </td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${status.bg} ${status.color}`}>
                                {t(status.key)}
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 py-2.5 sm:py-4 text-right">
                              <button
                                onClick={() => setEditingBatch(batch)}
                                className="p-2 text-text-muted hover:text-accent-orange rounded-xl transition-colors"
                                title={t('edit')}
                              >
                                <Edit3 size={18} />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                      {paged1.length === 0 && (
                        <tr>
                          <td colSpan="10" className="px-4 sm:px-6 py-12 text-center text-text-muted text-sm">
                            {t('inc_no_batches')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                </TableView>
              </div>

              {/* Pagination 1 — yo'riqnomadagi universal format */}
              {totalPages1 > 1 && (
                <div className="flex items-center justify-between px-2 py-3">
                  <p className="text-xs text-text-muted">
                    {Math.min(page1 * PAGE_SIZE, total1)} / {total1} ta &nbsp; {Array.from({ length: totalPages1 }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages1 || Math.abs(p - page1) <= 1)
                      .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...'); acc.push(p); return acc }, [])
                      .map((p, idx) => p === '...'
                        ? <span key={'d' + idx} className="px-1 text-text-muted text-sm">...</span>
                        : <button key={p} onClick={() => setPage1(p)} className={`w-7 h-7 rounded-lg text-sm font-bold transition-colors mx-0.5 ${page1 === p ? 'bg-accent-red text-white' : 'bg-bg-tertiary border border-border text-text-primary hover:bg-border'}`}>{p}</button>
                      )}
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setPage1(p => Math.max(1, p - 1))} disabled={page1 === 1}
                      className="px-3 py-1.5 rounded-xl bg-bg-tertiary border border-border text-sm font-bold disabled:opacity-40 hover:bg-border transition-colors">
                      {t('inc_prev_page')}
                    </button>
                    <button onClick={() => setPage1(p => Math.min(totalPages1, p + 1))} disabled={page1 === totalPages1}
                      className="px-3 py-1.5 rounded-xl bg-bg-tertiary border border-border text-sm font-bold disabled:opacity-40 hover:bg-border transition-colors">
                      {t('inc_next_page')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ===== JADVAL 2: MOLIYAVIY HOLAT ===== */}
            <div className="space-y-4">
              <h2 className="text-lg font-syne font-extrabold text-text-primary">{t('inc_table2_title')}</h2>

              {/* Filter 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-bg-secondary p-4 border border-border rounded-2xl">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder={t('col_product') + '...'}
                    value={search2}
                    onChange={e => { setSearch2(e.target.value) }}
                    className="w-full bg-bg-tertiary border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <select value={filter2Supplier} onChange={e => setFilter2Supplier(e.target.value)}
                  className="bg-bg-tertiary border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent-blue">
                  <option value="all">{t('inc_all_suppliers')}</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select value={filter2Status} onChange={e => setFilter2Status(e.target.value)}
                  className="bg-bg-tertiary border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent-blue">
                  <option value="all">{t('inc_all_statuses')}</option>
                  <option value="paid">{t('inc_filter_paid')}</option>
                  <option value="partial">{t('inc_filter_partial')}</option>
                  <option value="credit">{t('inc_filter_credit')}</option>
                  <option value="unpaid">{t('inc_filter_unpaid')}</option>
                </select>
              </div>

              {/* Jadval 2 */}
              <div className="bg-bg-secondary border border-border rounded-[2rem] overflow-hidden">
                <TableView id="inc_batches_pay" optional={[t('col_category'), t('col_uzs'), t('inc_pay_col_rate_diff')]}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                      {t2.widths.map((w, i) => <col key={i} style={{ width: w + 'px' }} />)}
                    </colgroup>
                    <thead className="bg-bg-tertiary text-xs font-extrabold uppercase tracking-widest text-text-muted border-b border-border">
                      <tr>
                        {[t('col_product'), t('col_category'), t('col_supplier'), t('inc_supp_detail_th_paid_usd'), t('col_uzs'), t('inc_pay_col_rate_diff'), t('col_debt_usd'), t('col_status'), t('inc_debt_due'), t('inc_th_actions')].map((label, i) => (
                          <th key={i} className="px-3 sm:px-4 py-2.5 sm:py-4 relative select-none" style={{ overflow: 'hidden' }}>
                            <span className={i === 9 ? 'float-right' : ''}>{label}</span>
                            {i < 9 && (
                              <span
                                onMouseDown={t2.startResize(i)}
                                className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-accent-blue/40 transition-colors"
                              />
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {paged2.map(batch => {
                        const isExpanded = expandedBatch === batch.id
                        const dueDays = getDueDays(batch.dueDate)
                        const diff = calcRateDiff(batch)
                        const paidUZS = batch.payments?.reduce((s, p) => s + p.amountUZS, 0) || 0
                        const avgRate = batch.paidUSD > 0 ? Math.round(paidUZS / batch.paidUSD) : 0

                        return (
                          <React.Fragment key={batch.id}>
                            <tr className={`hover:bg-bg-tertiary/50 transition-colors ${isExpanded ? 'bg-bg-tertiary/30' : ''}`}>
                              <td className="px-3 sm:px-4 py-2.5 sm:py-4">
                                <div className="flex items-center gap-2">
                                  <ProductImageViewer productId={batch.productId} size="sm" />
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-text-primary truncate">{batch.productName}</p>
                                    <p className="text-xs text-text-muted">{new Date(batch.receivedAt).toLocaleDateString('uz-UZ')}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 sm:px-4 py-2.5 sm:py-4">
                                {(() => {
                                  const product = MOCK_PRODUCTS.find(p => p.id === batch.productId)
                                  const catColor = getCategoryColor(product?.category, productCategories)
                                  const catObj = productCategories?.find(c => c.id === product?.category)
                                  const catLabel = catObj ? t('cat_' + catObj.id, { defaultValue: catObj.label }) : (product?.categoryLabel || '—')
                                  return <span className={`font-semibold text-sm ${catColor.text}`}>{catLabel}</span>
                                })()}
                              </td>
                              <td className="px-3 sm:px-4 py-2.5 sm:py-4">
                                {batch.supplierId ? (
                                  <span className="text-sm text-text-secondary">{getSupplierName(batch.supplierId)}</span>
                                ) : (
                                  <span className="text-xs text-text-muted">—</span>
                                )}
                              </td>
                              <td className="px-3 sm:px-4 py-2.5 sm:py-4">
                                {batch.paidUSD > 0 ? (
                                  <>
                                    <p className="text-sm font-bold text-accent-green">{formatUSD(batch.paidUSD)}</p>
                                    <p className="text-xs text-text-muted">{t('inc_avg_rate')}: {formatPrice(avgRate)}</p>
                                  </>
                                ) : (
                                  <span className="text-xs text-text-muted">—</span>
                                )}
                              </td>
                              <td className="px-3 sm:px-4 py-2.5 sm:py-4">
                                {paidUZS > 0 ? (
                                  <p className="text-sm text-text-primary">{formatPrice(paidUZS)} {som}</p>
                                ) : (
                                  <span className="text-xs text-text-muted">—</span>
                                )}
                              </td>
                              <td className="px-3 sm:px-4 py-2.5 sm:py-4">
                                {diff !== null ? (
                                  <span className={`text-sm font-bold ${diff < 0 ? 'text-accent-red' : 'text-accent-green'}`}>
                                    {diff > 0 ? '+' : ''}{formatPrice(diff)} {som} {diff < 0 ? '📉' : '📈'}
                                  </span>
                                ) : <span className="text-text-muted text-xs">—</span>}
                              </td>
                              <td className="px-3 sm:px-4 py-2.5 sm:py-4">
                                {batch.debtUSD > 0 ? (
                                  <p className="text-sm font-bold text-accent-red">{formatUSD(batch.debtUSD)}</p>
                                ) : (
                                  <span className="text-xs text-text-muted">—</span>
                                )}
                              </td>
                              <td className="px-3 sm:px-4 py-2.5 sm:py-4">
                                {(() => {
                                  const s = statusConfig[batch.paymentStatus] || statusConfig.unpaid
                                  return <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${s.bg} ${s.color}`}>{t(s.key)}</span>
                                })()}
                              </td>
                              <td className="px-3 sm:px-4 py-2.5 sm:py-4">
                                {batch.debtUSD > 0 && dueDays !== null ? (
                                  <p className={`text-xs font-bold ${dueDays <= 0 ? 'text-accent-red animate-pulse' : dueDays <= 3 ? 'text-accent-orange' : 'text-text-muted'}`}>
                                    {dueDays <= 0 ? t('inc_overdue') : t('inc_days_left', { n: dueDays })}
                                  </p>
                                ) : (
                                  <span className="text-xs text-text-muted">—</span>
                                )}
                              </td>
                              <td className="px-3 sm:px-4 py-2.5 sm:py-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => setShowPaymentModal(batch)}
                                    className="p-2 text-accent-blue hover:bg-accent-blue/10 rounded-xl transition-colors"
                                    title={t('inc_add_payment')}
                                  >
                                    <Wallet size={16} />
                                  </button>
                                  <button
                                    onClick={() => setExpandedBatch(isExpanded ? null : batch.id)}
                                    className="p-2 text-text-muted hover:bg-bg-tertiary rounded-xl transition-colors"
                                  >
                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-bg-tertiary/10">
                                <td colSpan="10" className="px-4 sm:px-6 py-4 sm:py-6">
                                  {/* To'lovlar tarixi — hozirgi koddan aynan ko'chir, o'zgartirma */}
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-xs font-extrabold uppercase tracking-widest text-text-muted">{t('inc_payment_history')}</h4>
                                      {batch.promoDiscount && (
                                        <div className="bg-accent-orange/10 border border-accent-orange/30 rounded-xl px-4 py-3 space-y-2">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm">🎁</span>
                                            <span className="text-sm font-bold text-accent-orange">{t('inc_promo_label')}: {batch.promoDiscount}%</span>
                                          </div>
                                          {batch.promoNote && <p className="text-xs text-text-secondary">{batch.promoNote}</p>}
                                          <p className="text-xs text-text-muted">
                                            {t('inc_promo_note')}
                                            {batch.totalUSD && ` ${t('inc_promo_savings')}: $${(batch.totalUSD * batch.promoDiscount / 100).toFixed(0)}`}
                                            {batch.totalUZS_atEntry && ` (${formatPrice(batch.totalUZS_atEntry * batch.promoDiscount / 100)} ${t('unit_som')})`}
                                          </p>
                                          {/* Mijozlarga uzatish toggle */}
                                          <div className="flex items-center justify-between pt-1 border-t border-accent-orange/20">
                                            <div className="flex items-center gap-1.5">
                                              <Users size={12} className="text-text-muted" />
                                              <span className="text-xs text-text-secondary">Mijozlarga ham qo'llash</span>
                                            </div>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                const newVal = !batch.promoPassToCustomer
                                                setBatches(prev => prev.map(b =>
                                                  b.id === batch.id
                                                    ? { ...b, promoPassToCustomer: newVal }
                                                    : b
                                                ))
                                                togglePromoPassToCustomer(batch.id).catch(err => {
                                                  console.error('promo-pass toggle error:', err?.response?.data || err?.message)
                                                })
                                              }}
                                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                                                batch.promoPassToCustomer ? 'bg-accent-green' : 'bg-bg-tertiary border border-border'
                                              }`}
                                            >
                                              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                                batch.promoPassToCustomer ? 'translate-x-4' : 'translate-x-0.5'
                                              }`} />
                                            </button>
                                          </div>
                                          {batch.promoPassToCustomer && (
                                            <p className="text-[10px] text-accent-green font-medium">✓ Aksiyalar tabida ko'rinmoqda</p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    {batch.payments?.length > 0 ? (
                                      <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
                                        <table className="w-full text-left text-xs">
                                          <thead className="bg-bg-tertiary text-text-muted">
                                            <tr>
                                              <th className="px-3 sm:px-4 py-2 sm:py-3">{t('col_date')}</th>
                                              <th className="px-3 sm:px-4 py-2 sm:py-3">{t('inc_pay_col_usd')}</th>
                                              <th className="px-3 sm:px-4 py-2 sm:py-3">{t('col_rate')}</th>
                                              <th className="px-3 sm:px-4 py-2 sm:py-3">{t('col_uzs')}</th>
                                              <th className="px-3 sm:px-4 py-2 sm:py-3">{t('inc_pay_method')}</th>
                                              <th className="px-3 sm:px-4 py-2 sm:py-3">{t('col_note')}</th>
                                              <th className="px-3 sm:px-4 py-2 sm:py-3">{t('inc_pay_col_rate_diff')}</th>
                                              <th className="px-3 sm:px-4 py-2 sm:py-3 text-right">{t('inc_th_actions')}</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-border/50">
                                            {batch.payments.map(p => (
                                              <tr key={p.id}>
                                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-secondary">{p.date}</td>
                                                <td className="px-3 sm:px-4 py-2 sm:py-3 font-bold text-text-primary">{formatUSD(p.amountUSD)}</td>
                                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted">{formatPrice(p.usdRate)}</td>
                                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-primary">{formatPrice(p.amountUZS)} {t('unit_som')}</td>
                                                <td className="px-3 sm:px-4 py-2 sm:py-3">
                                                  <span className="bg-bg-tertiary px-2 py-1 rounded uppercase text-[10px]">
                                                    {p.type === 'cash_uzs' ? t('inc_pay_cash_uzs') : p.type === 'cash_usd' ? t('inc_pay_cash_usd') : t('inc_pay_bank')}
                                                  </span>
                                                </td>
                                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted italic">{p.note || '—'}</td>
                                                <td className="px-3 sm:px-4 py-2 sm:py-3">
                                                  {(() => {
                                                    const d = calcPaymentRateDiff(p, batch.entryUsdRate)
                                                    return (
                                                      <span className={`text-xs font-bold ${d > 0 ? 'text-accent-green' : d < 0 ? 'text-accent-red' : 'text-text-muted'}`}>
                                                        {d === 0 ? '—' : (d > 0 ? '+' : '') + formatPrice(d) + ' ' + t('unit_som') + ' ' + (d > 0 ? '📈' : '📉')}
                                                      </span>
                                                    )
                                                  })()}
                                                </td>
                                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-right">
                                                  <div className="flex items-center justify-end gap-1">
                                                    <button
                                                      onClick={() => setEditingPayment({ batchId: batch.id, payment: { ...p } })}
                                                      className="p-1.5 text-text-muted hover:text-accent-blue rounded-lg transition-colors"
                                                    >
                                                      <Edit3 size={14} />
                                                    </button>
                                                    {deletePaymentConfirm && deletePaymentConfirm.batchId === batch.id && deletePaymentConfirm.paymentId === p.id ? (
                                                      <div className="inline-flex items-center gap-1 bg-bg-tertiary border border-border rounded-lg p-0.5">
                                                        <button
                                                          onClick={() => {
                                                            setBatches(prev => prev.map(b => {
                                                              if (b.id !== batch.id) return b
                                                              const newPayments = b.payments.filter(pay => pay.id !== p.id)
                                                              const newPaidUSD = newPayments.reduce((s, pay) => s + pay.amountUSD, 0)
                                                              const newDebtUSD = Math.max(0, b.totalUSD - newPaidUSD)
                                                              const newStatus = newDebtUSD === 0 ? 'paid' : newPaidUSD > 0 ? 'partial' : 'unpaid'
                                                              return { ...b, payments: newPayments, paidUSD: newPaidUSD, debtUSD: newDebtUSD, paymentStatus: newStatus }
                                                            }))
                                                            setDeletePaymentConfirm(null)
                                                          }}
                                                          className="p-1 text-accent-green hover:bg-accent-green/10 rounded"
                                                          title={t('confirm')}
                                                        >
                                                          <Check size={14} />
                                                        </button>
                                                        <button
                                                          onClick={() => setDeletePaymentConfirm(null)}
                                                          className="p-1 text-accent-red hover:bg-accent-red/10 rounded"
                                                          title="Bekor qilish"
                                                        >
                                                          <X size={14} />
                                                        </button>
                                                      </div>
                                                    ) : (
                                                      <button
                                                        onClick={() => setDeletePaymentConfirm({ batchId: batch.id, paymentId: p.id })}
                                                        className="p-1.5 text-text-muted hover:text-accent-red rounded-lg transition-colors"
                                                        title="O'chirish"
                                                      >
                                                        <Trash2 size={14} />
                                                      </button>
                                                    )}
                                                  </div>
                                                </td>
                                              </tr>
                                            ))}
                                            <tr className="bg-bg-tertiary/30 font-bold">
                                              <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted">{t('inc_pay_total')}:</td>
                                              <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-primary">{formatUSD(batch.paidUSD)}</td>
                                              <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted">{formatPrice(avgRate)} ({t('avg_short')})</td>
                                              <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-primary">{formatPrice(paidUZS)} {som}</td>
                                              <td colSpan="2"></td>
                                              <td className="px-3 sm:px-4 py-2 sm:py-3">
                                                {(() => {
                                                  const totalDiff = batch.payments.reduce((sum, p) => sum + calcPaymentRateDiff(p, batch.entryUsdRate), 0)
                                                  return (
                                                    <span className={`text-xs font-bold ${totalDiff > 0 ? 'text-accent-green' : totalDiff < 0 ? 'text-accent-red' : 'text-text-muted'}`}>
                                                      {totalDiff > 0 ? '+' : ''}{formatPrice(totalDiff)} {som}
                                                    </span>
                                                  )
                                                })()}
                                              </td>
                                              <td></td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </div>
                                    ) : (
                                      <div className="bg-bg-tertiary/20 border border-dashed border-border rounded-2xl py-5 sm:py-8 text-center">
                                        <p className="text-sm text-text-muted italic">Hozircha to'lovlar mavjud emas</p>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        )
                      })}
                      {paged2.length === 0 && (
                        <tr>
                          <td colSpan="10" className="px-4 sm:px-6 py-12 text-center text-text-muted text-sm">
                            Ma'lumot topilmadi
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                </TableView>
              </div>

              {/* Pagination 2 */}
              {totalPages2 > 1 && (
                <div className="flex items-center justify-between px-2 py-3">
                  <p className="text-xs text-text-muted">
                    {Math.min(page2 * PAGE_SIZE, total2)} / {total2} ta &nbsp; {Array.from({ length: totalPages2 }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages2 || Math.abs(p - page2) <= 1)
                      .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...'); acc.push(p); return acc }, [])
                      .map((p, idx) => p === '...'
                        ? <span key={'d' + idx} className="px-1 text-text-muted text-sm">...</span>
                        : <button key={p} onClick={() => setPage2(p)} className={`w-7 h-7 rounded-lg text-sm font-bold transition-colors mx-0.5 ${page2 === p ? 'bg-accent-red text-white' : 'bg-bg-tertiary border border-border text-text-primary hover:bg-border'}`}>{p}</button>
                      )}
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setPage2(p => Math.max(1, p - 1))} disabled={page2 === 1}
                      className="px-3 py-1.5 rounded-xl bg-bg-tertiary border border-border text-sm font-bold disabled:opacity-40 hover:bg-border transition-colors">
                      ← {t('inc_prev_page')}
                    </button>
                    <button onClick={() => setPage2(p => Math.min(totalPages2, p + 1))} disabled={page2 === totalPages2}
                      className="px-3 py-1.5 rounded-xl bg-bg-tertiary border border-border text-sm font-bold disabled:opacity-40 hover:bg-border transition-colors">
                      {t('inc_next_page')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* INVENTORY MATCHING WIDGET */}
            <div className={`border rounded-[2rem] p-4 sm:p-6 mt-4 sm:mt-6 ${allMatch ? 'border-accent-green/30 bg-accent-green/5' : 'border-accent-red/30 bg-accent-red/5'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${allMatch ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-red/20 text-accent-red'}`}>
                    {allMatch ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                  </div>
                  <div>
                    <h3 className={`font-syne font-extrabold ${allMatch ? 'text-accent-green' : 'text-accent-red'}`}>
                      {allMatch ? t('inc_inv_match') : t('inc_inv_mismatch')}
                    </h3>
                    <p className="text-xs text-text-secondary">
                      {t('inc_inv_formula')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {inventoryCheck.map(c => (
                  <div key={c.product.id} className={`px-4 py-3 rounded-2xl border ${c.isMatch ? 'border-border bg-bg-secondary' : 'border-accent-red bg-accent-red/10'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-text-primary">{c.product.brand} {c.product.name}</span>
                      {c.isMatch
                        ? <span className="text-accent-green text-xs font-bold">{t('inc_inv_ok')}</span>
                        : <span className="text-accent-red text-xs font-bold">{t('inc_inv_diff')}</span>
                      }
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-bg-tertiary rounded-xl py-1.5">
                        <p className="text-xs font-bold text-text-primary">{c.totalIn}</p>
                        <p className="text-[10px] text-text-muted">{t('inc_inv_in')}</p>
                      </div>
                      <div className="bg-bg-tertiary rounded-xl py-1.5">
                        <p className="text-xs font-bold text-accent-orange">{c.sold}</p>
                        <p className="text-[10px] text-text-muted">{t('sold')}</p>
                      </div>
                      <div className="bg-bg-tertiary rounded-xl py-1.5">
                        <p className="text-xs font-bold text-accent-blue">{c.inStock}</p>
                        <p className="text-[10px] text-text-muted">{t('col_in_stock')}</p>
                      </div>
                    </div>
                    {!c.isMatch && (
                      <p className="text-xs text-accent-red mt-2 text-center font-medium">
                        {c.totalIn} ≠ {c.sold} + {c.inStock} ({Math.abs(c.totalIn - c.sold - c.inStock)})
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

      {showImport && (
        <IncomeImportModal
          onClose={() => setShowImport(false)}
          onSuccess={() => { bump(); setShowImport(false) }}
          suppliers={suppliers}
          shopId={selectedShopId !== 'all' ? selectedShopId : null}
          usdRate={usdRate}
          productCategories={productCategories}
        />
      )}
    </>
  )
}

export default BatchesTab
