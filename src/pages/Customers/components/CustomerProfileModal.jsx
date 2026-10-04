import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { AlertCircle, ArrowDownToLine, ArrowUpFromLine, Calendar, Check, CheckCircle, CreditCard, DollarSign, History, Info, Link2, Package, Pencil, Phone, Recycle, Star, Trash2, TrendingUp, User, Users, X } from 'lucide-react'
import { useSettingsStore } from '../../../store/settingsStore'
import { Heart, MessageSquare, Wallet, Mail, MapPin, Tag, Clock } from 'lucide-react'
import { PreferencesTab, NotesTab, BalanceTab, DebtPayPanel } from './ProfileExtraTabs'
import CustomerTelegramTab from './CustomerTelegramTab'
import { useAuthStore } from '../../../store/authStore'
const CustomerProfileModal = ({ ctx }) => {
  const { t } = useTranslation()
  const canSms = useAuthStore(s => s.hasPermission)('customers')
  const {
    customers, setCustomers, loading,
    search, setSearch,
    customersPage, setCustomersPage, CUSTOMERS_PER_PAGE,
    showAddModal, setShowAddModal,
    selectedCustomer, setSelectedCustomer,
    modalTab, setModalTab,
    editCustomer, setEditCustomer,
    editForm, setEditForm,
    deleteTarget, setDeleteTarget,
    mergeModal, setMergeModal,
    showOverdueModal, setShowOverdueModal,
    newCust, setNewCust,
    shopPickCallback, setShopPickCallback,
    activeFilter, setActiveFilter,
    custSort, setCustSort,
    mergeSource, setMergeSource,
    usdRate, som, user, bump,
    computeLoyaltyLevel,
    handleAddCustomer, handleEditSave, handleEditOpen,
    handleDeleteConfirm, doMerge, handleManualMergeClick,
    handleInstPaymentSubmit,
    instPaymentSaleId, setInstPaymentSaleId,
    instPaymentAmount, setInstPaymentAmount,
    instPaymentSuccess,
    selectedShopId,
    stats, filtered,
    LOYALTY_CONFIG, formatPrice,
    loyaltyMinAmount, loyaltyVisitsRequired, loyaltyDiscountPercent, silverVisits,
    CustSortIcon, allSales, MOCK_USED_SALES, MOCK_USED_STOCK,
    products, getLastVisit, reloadCustomerData,
  } = ctx
  const MOCK_SALES = allSales || []
  const barcodeSelectClass = user?.role === 'admin' ? '' : 'select-none'

  const getCustomerSales = (customer) =>
    MOCK_SALES.filter(s => s.customerId === customer.id && s.status !== 'cancelled')
  const getAllCustomerSales = (customer) =>
    MOCK_SALES.filter(s => s.customerId === customer.id)
  const getCustomerUsedSales = (customer) =>
    (MOCK_USED_SALES || []).filter(s => s.customerId === customer.id && s.status !== 'cancelled')
  const getCustomerAllSales = (customer) => [
    ...getCustomerSales(customer),
    ...getCustomerUsedSales(customer),
  ]
  const getTotalVisits = (customer) => getCustomerAllSales(customer).length
  const getTotalItems = (customer) =>
    getCustomerAllSales(customer).reduce((sum, s) => sum + (s.items?.length || 0), 0)
  const getTotalSpent = (customer) =>
    getCustomerAllSales(customer).reduce((sum, s) => sum + (s.total || 0), 0)
  const getUsedItemsCount = (customer) =>
    getCustomerUsedSales(customer).reduce((sum, s) => sum + (s.items?.length || 0), 0)
  const getCustomerUsedStock = (customer) =>
    (MOCK_USED_STOCK || []).filter(u => u.customerId === customer.id)
  const getCustomerDebt = (customer) => MOCK_SALES
    .filter(s => s.customerId === customer.id && s.paymentType === 'installment' && s.status !== 'cancelled')
    .reduce((sum, s) => sum + Math.max(0, s.installmentDebt ?? s.total ?? 0), 0)
  const daysAgo = (d) => d ? Math.floor((Date.now() - new Date(d)) / 86400000) : null

  return (
    <>

      {/* CUSTOMER PROFILE MODAL */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCustomer(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="relative w-full max-w-4xl bg-bg-primary border border-border rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Profile Header */}
              <div className="p-8 pb-4 flex items-start justify-between bg-bg-secondary">
                <div className="flex items-center gap-6">
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center font-extrabold text-3xl ${computeLoyaltyLevel(selectedCustomer).color}`}>
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-3xl font-syne font-extrabold text-text-primary">{selectedCustomer.name}</h2>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm text-text-secondary flex items-center gap-1.5"><Phone size={14} /> {selectedCustomer.phone}</span>
                      {selectedCustomer.phone2 && (
                        <span className="text-sm text-text-muted flex items-center gap-1.5"><Phone size={12} /> {selectedCustomer.phone2} <span className="text-[10px] bg-bg-tertiary px-1.5 py-0.5 rounded">2</span></span>
                      )}
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-tight ${computeLoyaltyLevel(selectedCustomer).color}`}>
                        {computeLoyaltyLevel(selectedCustomer).isTop && <Star size={10} className="inline mr-1" />}
                        {computeLoyaltyLevel(selectedCustomer).label}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="p-3 text-text-muted hover:text-accent-red hover:bg-accent-red/10 rounded-2xl transition-all">
                  <X size={24} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border bg-bg-secondary px-4 sm:px-8 overflow-x-auto no-scrollbar">
                {[
                  { id: 'general', label: t('cust_tab_general'), icon: Users },
                  { id: 'history', label: t('cust_tab_history'), icon: History },
                  { id: 'installments', label: t('cust_tab_installments'), icon: Calendar },
                  { id: 'used', label: t('cust_tab_used'), icon: Recycle },
                  { id: 'preferences', label: t('cust_tab_preferences'), icon: Heart },
                  { id: 'notes', label: t('cust_tab_notes'), icon: MessageSquare },
                  { id: 'balance', label: t('cust_tab_balance'), icon: Wallet },
                  ...(canSms ? [{ id: 'telegram', label: 'Telegram', icon: MessageSquare }] : []),
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setModalTab(t.id)}
                    className={`flex items-center gap-2 px-4 sm:px-6 py-4 text-sm font-bold whitespace-nowrap transition-all relative ${
                      modalTab === t.id ? 'text-accent-red' : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <t.icon size={16} />
                    {t.label}
                    {modalTab === t.id && (
                      <span className="absolute bottom-0 left-0 right-0 h-1 bg-accent-red rounded-t-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="p-8 overflow-y-auto no-scrollbar flex-1 bg-bg-primary" style={{ minHeight: '320px' }}>
                {modalTab === 'general' && (
                  <div className="space-y-8">
                    {computeLoyaltyLevel(selectedCustomer).isTop && (
                      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 flex items-center gap-4 text-yellow-700">
                        <div className="w-10 h-10 bg-yellow-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-yellow-500/20">
                          <Star size={20} fill="currentColor" />
                        </div>
                        <div>
                          <p className="font-syne font-extrabold text-lg">{t('cust_vip')}</p>
                          <p className="text-xs">{t('cust_vip_desc', { percent: computeLoyaltyLevel(selectedCustomer).percent })}</p>
                        </div>
                      </motion.div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: t('cust_stat_visits'), value: getTotalVisits(selectedCustomer), icon: Calendar },
                        { label: t('cust_stat_loyalty'), value: computeLoyaltyLevel(selectedCustomer).percent ? `${computeLoyaltyLevel(selectedCustomer).percent}%` : '—', icon: Star, color: 'text-accent-green' },
                        { label: t('cust_stat_items'), value: getTotalItems(selectedCustomer), icon: Package },
                        { label: t('cust_stat_spent'), value: formatPrice(getTotalSpent(selectedCustomer)), icon: DollarSign },
                      ].map((s, i) => (
                        <div key={i} className="bg-bg-secondary border border-border rounded-2xl p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{s.label}</span>
                            <s.icon size={14} className={s.color || "text-text-muted"} />
                          </div>
                          <p className={`text-lg font-syne font-extrabold ${s.color || "text-text-primary"}`}>{s.value}</p>
                        </div>
                      ))}
                    </div>

                    {(() => {
                      const all = getCustomerAllSales(selectedCustomer)
                      const spent = getTotalSpent(selectedCustomer)
                      const avg = all.length ? Math.round(spent / all.length) : 0
                      const debt = getCustomerDebt(selectedCustomer)
                      const bal = selectedCustomer.balance || 0
                      const last = getLastVisit(selectedCustomer)
                      const lastDays = daysAgo(last)
                      const firstSale = all.reduce((m, s) => (!m || s.soldAt < m) ? s.soldAt : m, '')
                      const regDate = selectedCustomer.createdAt || firstSale
                      return (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          {[
                            { label: t('cust_stat_avg_check'), value: formatPrice(avg), icon: TrendingUp },
                            { label: t('cust_balance'), value: formatPrice(bal), icon: Wallet, color: bal > 0 ? 'text-accent-green' : bal < 0 ? 'text-accent-red' : null, tab: 'balance' },
                            { label: t('col_debt'), value: formatPrice(debt), icon: CreditCard, color: debt > 0 ? 'text-accent-red' : null, tab: 'installments' },
                            { label: t('cust_registered'), value: regDate ? new Date(regDate).toLocaleDateString('uz-UZ') : '—', icon: User },
                            { label: t('cust_last_visit'), value: last ? new Date(last).toLocaleDateString('uz-UZ') : '—', sub: lastDays === null ? null : lastDays <= 0 ? t('cust_today') : t('cust_days_ago', { n: lastDays }), icon: Clock },
                          ].map((s, i) => (
                            <div key={i} onClick={s.tab ? () => setModalTab(s.tab) : undefined}
                              className={`bg-bg-secondary border border-border rounded-2xl p-4 space-y-2 ${s.tab ? 'cursor-pointer hover:border-text-muted' : ''}`}>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{s.label}</span>
                                <s.icon size={14} className={s.color || 'text-text-muted'} />
                              </div>
                              <p className={`text-lg font-syne font-extrabold ${s.color || 'text-text-primary'}`}>{s.value}</p>
                              {s.sub && <p className="text-[10px] text-text-muted -mt-1">{s.sub}</p>}
                            </div>
                          ))}
                        </div>
                      )
                    })()}

                    {(selectedCustomer.group || selectedCustomer.tags?.length > 0 || selectedCustomer.gender || selectedCustomer.address || selectedCustomer.email) && (
                      <div className="flex flex-wrap gap-2">
                        {selectedCustomer.group && (
                          <span className="flex items-center gap-1.5 text-sm bg-accent-orange/10 text-accent-orange rounded-xl px-3 py-2 font-bold"><Users size={14} />{selectedCustomer.group}</span>
                        )}
                        {(selectedCustomer.tags || []).map(tg => (
                          <span key={tg} className="flex items-center gap-1 text-sm bg-accent-blue/10 text-accent-blue rounded-xl px-3 py-2 font-bold"><Tag size={13} />{tg}</span>
                        ))}
                        {selectedCustomer.gender && (
                          <span className="flex items-center gap-1.5 text-sm text-text-secondary bg-bg-secondary border border-border rounded-xl px-3 py-2 font-bold"><User size={14} className="text-text-muted" />{selectedCustomer.gender === 'female' ? t('cust_gender_female') : t('cust_gender_male')}</span>
                        )}
                        {selectedCustomer.address && (
                          <span className="flex items-center gap-1.5 text-sm text-text-secondary bg-bg-secondary border border-border rounded-xl px-3 py-2 font-bold"><MapPin size={14} className="text-text-muted" />{selectedCustomer.address}</span>
                        )}
                        {selectedCustomer.email && (
                          <span className="flex items-center gap-1.5 text-sm text-text-secondary bg-bg-secondary border border-border rounded-xl px-3 py-2 font-bold"><Mail size={14} className="text-text-muted" />{selectedCustomer.email}</span>
                        )}
                      </div>
                    )}

                    {(selectedCustomer.birthDate || selectedCustomer.instagram || selectedCustomer.carModel) && (
                      <div className="flex flex-wrap gap-4">
                        {selectedCustomer.birthDate && (
                          <div className="flex items-center gap-2 text-sm text-text-secondary bg-bg-secondary border border-border rounded-xl px-4 py-2.5">
                            <Calendar size={14} className="text-text-muted shrink-0" />
                            <span className="font-bold">{new Date(selectedCustomer.birthDate).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                          </div>
                        )}
                        {selectedCustomer.instagram && (
                          <div className="flex items-center gap-2 text-sm text-text-secondary bg-bg-secondary border border-border rounded-xl px-4 py-2.5">
                            <Link2 size={14} className="text-text-muted shrink-0" />
                            <span className="font-bold">@{selectedCustomer.instagram.replace(/^@/, '')}</span>
                          </div>
                        )}
                        {selectedCustomer.carModel && (
                          <div className="flex items-center gap-2 text-sm text-text-secondary bg-bg-secondary border border-border rounded-xl px-4 py-2.5">
                            <Package size={14} className="text-text-muted shrink-0" />
                            <span className="font-bold">{selectedCustomer.carModel}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-syne font-extrabold text-lg flex items-center gap-2">
                          <TrendingUp size={20} className="text-accent-blue" />
                          {t('cust_loyalty_title')}
                        </h4>
                      </div>
                      {(() => {
                        const lv = computeLoyaltyLevel(selectedCustomer)
                        if (!lv.enabled) return <p className="text-xs text-text-muted">{t('cust_tier_off')}</p>
                        const target = lv.next ? lv.next.minAmount : lv.spent
                        return (
                          <>
                            <div className="relative h-4 bg-bg-secondary border border-border rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${lv.next ? Math.min(100, (lv.spent / target) * 100) : 100}%` }}
                                className={`absolute top-0 left-0 h-full ${lv.isTop ? 'bg-yellow-500' : 'bg-accent-blue'}`}
                              />
                            </div>
                            <div className="flex justify-between gap-2 text-[10px] font-extrabold tracking-widest text-text-muted">
                              <span>{formatPrice(lv.spent)}{lv.next ? ` / ${formatPrice(lv.next.minAmount)}` : ''}</span>
                              {lv.next
                                ? <span>{t('cust_tier_left', { amount: formatPrice(lv.next.minAmount - lv.spent), n: lv.next.percent })}</span>
                                : <span className="text-accent-green">{t('cust_loyalty_max')}</span>}
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                )}

                {modalTab === 'history' && (() => {
                  const customerSales = getAllCustomerSales(selectedCustomer)
                    .slice()
                    .sort((a, b) => new Date(b.soldAt) - new Date(a.soldAt))

                  if (customerSales.length === 0) return (
                    <div className="py-12 text-center bg-bg-secondary border border-border rounded-2xl border-dashed">
                      <History size={32} className="mx-auto text-text-muted mb-3 opacity-20" />
                      <p className="text-text-muted">{t('cust_history_empty')}</p>
                    </div>
                  )

                  const paymentLabel = (type) => {
                    if (type === 'cash') return t('pay_cash')
                    if (type === 'card') return t('pay_card')
                    if (type === 'installment') return t('pay_installment')
                    if (type === 'bank_transfer') return t('pay_transfer')
                    return type || '—'
                  }

                  return (
                    <div className="space-y-4">
                      {customerSales.map((sale) => {
                        const isCancelled = sale.status === 'cancelled'
                        const saleDate = new Date(sale.soldAt).toLocaleDateString('uz-UZ', {
                          year: 'numeric', month: '2-digit', day: '2-digit'
                        })
                        return (
                          <div key={sale.id} className={`border rounded-2xl overflow-hidden transition-all ${
                            isCancelled ? 'border-accent-red/20 bg-accent-red/5' : 'border-border bg-bg-secondary/30'
                          }`}>
                            <div className="p-4 bg-bg-secondary border-b border-border space-y-3">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-xs font-mono text-text-muted">[{sale.id}]</span>
                                <span className={`text-sm font-bold text-text-primary`}>{saleDate}</span>
                                {sale.soldByName && (
                                  <span className="flex items-center gap-1 text-xs text-text-muted">
                                    <User size={12} /> {sale.soldByName}
                                  </span>
                                )}
                                <span className={`ml-auto text-sm font-bold text-text-primary`}>
                                  {formatPrice(sale.total)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {isCancelled && (
                                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-accent-red/10 text-accent-red flex items-center gap-1">
                                    <X size={10} /> {t('cust_cancelled')}
                                  </span>
                                )}
                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-bg-tertiary text-text-muted">
                                  {paymentLabel(sale.paymentType)}
                                </span>
                                {sale.discount > 0 && (
                                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-accent-orange/10 text-accent-orange">
                                    {t('cust_discount', { n: sale.discount })}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="p-4">
                              <div className="space-y-2">
                                {(sale.items || []).map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-border/50 last:border-0">
                                    <div className="flex items-center gap-3">
                                      <span className={`text-[10px] font-mono text-text-muted ${barcodeSelectClass}`}>{item.barcode}</span>
                                      <span className={`font-medium text-text-primary`}>{item.name}</span>
                                    </div>
                                    <span className={`font-bold text-text-primary`}>{formatPrice(item.salePrice)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}

                {modalTab === 'installments' && (() => {
                  const today = new Date()
                  const instSales = MOCK_SALES.filter(s =>
                    s.customerId === selectedCustomer.id &&
                    s.paymentType === 'installment' &&
                    s.status !== 'cancelled'
                  ).sort((a, b) => new Date(b.soldAt) - new Date(a.soldAt))
                  return (
                    <div className="space-y-4">
                      <DebtPayPanel customer={selectedCustomer} totalDebt={getCustomerDebt(selectedCustomer)} selectedShopId={selectedShopId} onPaid={reloadCustomerData} />
                      {instPaymentSuccess && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 px-4 py-3 bg-accent-green/10 border border-accent-green/30 rounded-xl text-accent-green text-xs font-bold"
                        >
                          <CheckCircle size={14} /> {t('cust_inst_success')}
                        </motion.div>
                      )}
                      {instSales.length > 0 ? instSales.map((sale) => {
                        const debt = sale.installmentDebt ?? sale.total
                        const paid = sale.installmentPaidAmount || 0
                        const total = sale.total
                        const progress = Math.min(100, total > 0 ? (paid / total) * 100 : 0)
                        const isFullyPaid = debt <= 0
                        const isDue = !isFullyPaid && sale.installmentDueDate && new Date(sale.installmentDueDate) < today
                        const isOpen = instPaymentSaleId === sale.id
                        return (
                          <div key={sale.id} className={`bg-bg-secondary border rounded-2xl p-5 space-y-4 transition-all ${
                            isFullyPaid ? 'border-accent-green/30' : isDue ? 'border-accent-red shadow-glow-red/5' : 'border-border'
                          }`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-text-primary">{sale.items?.map(i => i.name).join(', ') || '—'}</h4>
                                  <span className="text-[10px] text-text-muted">{sale.installmentOrgName || '—'}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                  <span className="text-xs text-text-muted">{new Date(sale.soldAt).toLocaleDateString('uz-UZ')}</span>
                                  {sale.installmentDueDate && !isFullyPaid && (
                                    <span className="text-xs flex items-center gap-1">
                                      <Calendar size={11} className="text-text-muted" />
                                      <span className="text-text-muted">{t('cust_inst_deadline')}:</span>
                                      <span className={`font-bold ${isDue ? 'text-accent-red' : 'text-text-primary'}`}>{sale.installmentDueDate}</span>
                                    </span>
                                  )}
                                  {sale.installmentTermMonths && (
                                    <span className="text-[10px] bg-bg-tertiary px-2 py-0.5 rounded text-text-muted">{sale.installmentTermMonths} oy</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 ${
                                  isFullyPaid ? 'bg-accent-green/10 text-accent-green' :
                                  isDue ? 'bg-accent-red/10 text-accent-red animate-pulse' :
                                  paid > 0 ? 'bg-accent-orange/10 text-accent-orange' :
                                  'bg-bg-tertiary text-text-muted'
                                }`}>
                                  {isFullyPaid ? <Check size={10} /> : isDue ? <AlertCircle size={10} /> : null}
                                  {isFullyPaid ? t('cust_inst_paid') : isDue ? t('cust_inst_overdue') : paid > 0 ? t('inc_filter_partial') : t('cust_inst_pending')}
                                </span>
                                {!isFullyPaid && (
                                  <button
                                    onClick={() => { setInstPaymentSaleId(isOpen ? null : sale.id); setInstPaymentAmount('') }}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 ${
                                      isOpen ? 'bg-bg-tertiary text-text-muted' : 'bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20'
                                    }`}
                                  >
                                    <DollarSign size={11} /> {t('cust_inst_pay_btn')}
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-xs font-bold">
                                <span className="text-text-primary">{t('cust_inst_paid_info', { paid: formatPrice(paid) })}</span>
                                <span className="text-text-muted">{t('col_debt')}: <span className={debt > 0 ? 'text-accent-red' : 'text-accent-green'}>{formatPrice(debt)}</span></span>
                              </div>
                              <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress}%` }}
                                  className={`h-full ${isFullyPaid ? 'bg-accent-green' : isDue ? 'bg-accent-red' : 'bg-accent-blue'}`}
                                />
                              </div>
                              <div className="flex justify-between text-[10px] font-extrabold tracking-widest text-text-muted uppercase">
                                <span>{t('cust_inst_paid_pct', { pct: progress.toFixed(0) })}</span>
                                <span>{t('cust_inst_total_label')}: {formatPrice(total)}</span>
                              </div>
                            </div>
                            {isOpen && (
                              <motion.form
                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                onSubmit={handleInstPaymentSubmit}
                                className="flex gap-2 pt-2 border-t border-border"
                              >
                                <input
                                  autoFocus
                                  type="number"
                                  value={instPaymentAmount}
                                  onChange={e => setInstPaymentAmount(e.target.value)}
                                  placeholder={`Maks: ${formatPrice(debt)}`}
                                  className="flex-1 px-3 py-2 bg-bg-primary border border-border rounded-xl text-xs text-text-primary outline-none focus:border-accent-blue"
                                />
                                <button type="submit" className="px-4 py-2 bg-accent-blue text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all">
                                  {t('cust_inst_accept')}
                                </button>
                                <button type="button" onClick={() => setInstPaymentSaleId(null)} className="px-3 py-2 bg-bg-tertiary border border-border rounded-xl text-xs text-text-muted hover:text-text-primary transition-all">
                                  {t('cancel')}
                                </button>
                              </motion.form>
                            )}
                            {sale.installmentPayments?.length > 0 && (
                              <div className="pt-3 border-t border-border/40">
                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2">{t('cust_inst_history')}</p>
                                <table className="w-full text-[11px]">
                                  <thead>
                                    <tr className="text-text-muted">
                                      <th className="text-left pb-1 font-bold">{t('col_amount')}</th>
                                      <th className="text-left pb-1 font-bold">{t('col_date')}</th>
                                      <th className="text-left pb-1 font-bold">{t('col_time')}</th>
                                      <th className="text-left pb-1 font-bold">{t('col_employee')}</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/30">
                                    {sale.installmentPayments.map((p, i) => {
                                      const d = new Date(p.date)
                                      return (
                                        <tr key={i}>
                                          <td className="py-1 font-bold text-accent-green">{formatPrice(p.amount)}</td>
                                          <td className="py-1 text-text-secondary">{d.toLocaleDateString('uz-UZ')}</td>
                                          <td className="py-1 text-text-muted">{d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</td>
                                          <td className="py-1 text-text-secondary">{p.employeeName}</td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )
                      }) : (
                        <div className="py-12 text-center bg-bg-secondary border border-border rounded-2xl border-dashed">
                          <CreditCard size={32} className="mx-auto text-text-muted mb-3 opacity-20" />
                          <p className="text-text-muted">{t('cust_inst_empty')}</p>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {modalTab === 'preferences' && (
                  <PreferencesTab sales={getCustomerAllSales(selectedCustomer)} products={products} />
                )}
                {modalTab === 'notes' && <NotesTab customer={selectedCustomer} user={user} />}
                {modalTab === 'telegram' && <CustomerTelegramTab customer={selectedCustomer} />}
                {modalTab === 'balance' && (
                  <BalanceTab customer={selectedCustomer} user={user} selectedShopId={selectedShopId} onChanged={reloadCustomerData} />
                )}

                {modalTab === 'used' && (() => {
                  const acquiredItems = getCustomerUsedStock(selectedCustomer)
                    .slice()
                    .sort((a, b) => new Date(b.acquiredAt || 0) - new Date(a.acquiredAt || 0))

                  const acquiredGroups = (() => {
                    const map = new Map()
                    acquiredItems.forEach(u => {
                      const key = [u.acquiredSaleId, u.name, u.category, u.acquiredPrice, u.status].join('|')
                      if (!map.has(key)) {
                        map.set(key, { ...u, qty: 1, totalAcquiredPrice: u.acquiredPrice || 0 })
                      } else {
                        const g = map.get(key)
                        g.qty += 1
                        g.totalAcquiredPrice += (u.acquiredPrice || 0)
                      }
                    })
                    return [...map.values()]
                  })()

                  const allUsedSales = MOCK_USED_SALES.filter(s => s.customerId === selectedCustomer.id)
                    .slice()
                    .sort((a, b) => new Date(b.soldAt) - new Date(a.soldAt))

                  const usedStatusCfg = {
                    in_stock: { label: t('col_in_stock'), cls: 'bg-accent-blue/10 text-accent-blue' },
                    sold: { label: t('sold'), cls: 'bg-accent-green/10 text-accent-green' },
                    scrapped: { label: t('cust_used_status_scrapped'), cls: 'bg-bg-tertiary text-text-muted' },
                  }

                  const paymentLabel = (type) => {
                    if (type === 'cash') return t('pay_cash')
                    if (type === 'card') return t('pay_card')
                    if (type === 'installment') return t('pay_installment')
                    if (type === 'bank_transfer') return t('pay_transfer')
                    return type || '—'
                  }

                  return (
                    <div className="space-y-8">
                      {/* Bizdan tovar olgan (trade-in) */}
                      <div className="space-y-4">
                        <h4 className="font-syne font-extrabold text-lg flex items-center gap-2">
                          <ArrowDownToLine size={20} className="text-accent-orange" />
                          {t('cust_used_sold_title')}
                        </h4>
                        {acquiredGroups.length === 0 ? (
                          <div className="py-12 text-center bg-bg-secondary border border-border rounded-2xl border-dashed">
                            <Recycle size={32} className="mx-auto text-text-muted mb-3 opacity-20" />
                            <p className="text-text-muted">{t('cust_used_empty_sold')}</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {acquiredGroups.map(g => {
                              const statusCfg = usedStatusCfg[g.status] || usedStatusCfg.in_stock
                              return (
                                <div key={g.key ?? g.id} className="flex items-center justify-between gap-3 bg-bg-secondary border border-border rounded-2xl px-4 py-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-text-primary truncate">{g.name} {g.qty > 1 && <span className="text-text-muted font-normal">x{g.qty}</span>}</p>
                                    <p className="text-[11px] text-text-muted">
                                      {g.acquiredAt ? new Date(g.acquiredAt).toLocaleDateString('uz-UZ') : '—'}
                                      {g.replacedProductName && <> • {t('cust_used_replaced')}: {g.replacedProductName}</>}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    <div className="text-right">
                                      <p className="text-sm font-bold text-text-primary">{formatPrice(g.totalAcquiredPrice)}</p>
                                      {g.qty > 1 && <p className="text-[10px] text-text-muted">{formatPrice(g.acquiredPrice)} {t('cust_used_per_pcs')}</p>}
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase ${statusCfg.cls}`}>{statusCfg.label}</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      {/* Bizdan B/U xarid qilgan */}
                      <div className="space-y-4">
                        <h4 className="font-syne font-extrabold text-lg flex items-center gap-2">
                          <ArrowUpFromLine size={20} className="text-accent-blue" />
                          {t('cust_used_bought_title')}
                        </h4>
                        {allUsedSales.length === 0 ? (
                          <div className="py-12 text-center bg-bg-secondary border border-border rounded-2xl border-dashed">
                            <Recycle size={32} className="mx-auto text-text-muted mb-3 opacity-20" />
                            <p className="text-text-muted">{t('cust_used_empty_bought')}</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {allUsedSales.map(sale => {
                              const isCancelled = sale.status === 'cancelled'
                              const saleDate = new Date(sale.soldAt).toLocaleDateString('uz-UZ', {
                                year: 'numeric', month: '2-digit', day: '2-digit'
                              })
                              return (
                                <div key={sale.id} className={`border rounded-2xl overflow-hidden transition-all ${
                                  isCancelled ? 'border-accent-red/20 bg-accent-red/5' : 'border-border bg-bg-secondary/30'
                                }`}>
                                  <div className="p-4 bg-bg-secondary border-b border-border space-y-3">
                                    <div className="flex items-center gap-3 flex-wrap">
                                      <span className="text-xs font-mono text-text-muted">[{sale.id}]</span>
                                      <span className={`text-sm font-bold text-text-primary`}>{saleDate}</span>
                                      <span className={`ml-auto text-sm font-bold text-text-primary`}>
                                        {formatPrice(sale.total)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {isCancelled && (
                                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-accent-red/10 text-accent-red flex items-center gap-1">
                                          <X size={10} /> {t('cust_cancelled')}
                                        </span>
                                      )}
                                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-bg-tertiary text-text-muted">
                                        {paymentLabel(sale.paymentType)}
                                      </span>
                                      {sale.discount > 0 && (
                                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-accent-orange/10 text-accent-orange">
                                          {t('cust_discount', { n: sale.discount })}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="p-4">
                                    <div className="space-y-2">
                                      {(sale.items || []).map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-border/50 last:border-0">
                                          <span className={`font-medium text-text-primary`}>{item.name}</span>
                                          <span className={`font-bold text-text-primary`}>{formatPrice(item.salePrice)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </>
  )
}

export default CustomerProfileModal
