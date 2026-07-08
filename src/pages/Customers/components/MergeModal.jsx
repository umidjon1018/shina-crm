import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { AlertCircle, Calendar, Check, GitMerge, Link2, Phone, User, X } from 'lucide-react'

const MergeModal = ({ ctx }) => {
  const { t } = useTranslation()
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
    handleAddCustomer, handleEditSave, handleEditOpen,
    handleDeleteConfirm, doMerge, doSeparate, handleManualMergeClick,
    handleInstPaymentSubmit,
    selectedShopId,
    stats, filtered,
    LOYALTY_CONFIG, formatPrice,
    loyaltyMinAmount, loyaltyVisitsRequired, loyaltyDiscountPercent, silverVisits,
    CustSortIcon, allSales,
  } = ctx
  const MOCK_SALES = allSales || []
  return (
    <>

      {/* Qo'lda birlashtirish uchun banner */}
      {mergeSource && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 bg-accent-blue text-white rounded-2xl shadow-xl text-sm font-bold">
          <GitMerge size={16} />
          <span>"{mergeSource.name}" tanlandi — boshqa mijozning <GitMerge size={12} className="inline" /> tugmasini bosing</span>
          <button onClick={() => setMergeSource(null)} className="ml-2 opacity-70 hover:opacity-100"><X size={16} /></button>
        </div>
      )}

      {/* MERGE MODAL */}
      <AnimatePresence>
        {mergeModal && (() => {
          const { keep, remove, pendingForm, diffName, step, addMode } = mergeModal
          const isReal = (p) => p && p !== '+998' && p.length > 6
          // addMode: keep null, yangi mijoz hali yaratilmagan
          const keepPhone = pendingForm?.phone || keep?.phone || ''
          const keepOldPhone = keep?.phone || ''
          const removePhone = remove.phone || ''
          const keepSalesCount = keep ? MOCK_SALES.filter(s => s.customerId === keep.id).length : 0
          const removeSalesCount = MOCK_SALES.filter(s => s.customerId === remove.id).length

          const onMergeClick = () => {
            if (addMode) {
              // addMode: birlashtirish = mavjud mijozni yangi ma'lumot bilan yangilash
              doMerge({ phone: isReal(keepPhone) ? keepPhone : removePhone })
              return
            }
            if (pendingForm) {
              if (isReal(keepOldPhone) && keepOldPhone !== keepPhone) {
                setMergeModal({ ...mergeModal, step: 'phone' }); return
              }
            } else {
              if (isReal(keep.phone) && isReal(remove.phone) && keep.phone !== remove.phone) {
                setMergeModal({ ...mergeModal, step: 'phone' }); return
              }
            }
            // Keep has no real phone → use remove's phone
            const finalPhone = isReal(keepPhone) ? keepPhone : (isReal(removePhone) ? removePhone : keepPhone)
            doMerge({ phone: finalPhone })
          }

          return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setMergeModal(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="relative w-full max-w-lg bg-bg-primary border border-border rounded-3xl p-7 shadow-2xl space-y-5"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-accent-blue/10 rounded-xl flex items-center justify-center">
                      <GitMerge size={18} className="text-accent-blue" />
                    </div>
                    <h3 className="text-lg font-syne font-extrabold text-text-primary">Mijozlarni birlashtirish</h3>
                  </div>
                  <button onClick={() => setMergeModal(null)} className="p-2 text-text-muted hover:text-accent-red hover:bg-accent-red/10 rounded-xl transition-all">
                    <X size={20} />
                  </button>
                </div>

                {/* ── STEP: main ── */}
                {step === 'main' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 bg-bg-secondary border border-accent-blue/40 rounded-2xl space-y-1">
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-accent-blue">
                          {addMode ? "Yangi (qo'shilmoqchi)" : 'Asosiy (qoladi)'}
                        </p>
                        <p className="font-bold text-text-primary text-sm">{addMode ? pendingForm.name : keep?.name}</p>
                        <p className="text-xs text-text-muted">{isReal(keepPhone) ? keepPhone : 'raqamsiz'}</p>
                        <p className="text-xs text-text-muted">{addMode ? 'Yangi mijoz' : `${keepSalesCount} ta xarid`}</p>
                      </div>
                      <div className="p-3.5 bg-bg-secondary border border-border rounded-2xl space-y-1">
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-text-muted">
                          {addMode ? 'Tizimda mavjud' : 'Birlashtiriladigan'}
                        </p>
                        <p className="font-bold text-text-primary text-sm">{remove.name}</p>
                        <p className="text-xs text-text-muted">{isReal(removePhone) ? removePhone : 'raqamsiz'}</p>
                        <p className="text-xs text-text-muted">{removeSalesCount} ta xarid</p>
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary">
                      {addMode
                        ? `Bu telefon raqam "${remove.name}" da mavjud. Ular bir xil odam bo'lishi mumkin.`
                        : diffName
                        ? `"${remove.name}" da shu raqam mavjud. Bu oila azosi yoki yangi egalik bo'lishi mumkin.`
                        : pendingForm
                        ? "Bir xil raqam — bir xil odam bo'lishi mumkin. Birlashtirish barcha xaridlarni asosiy mijozga o'tkazadi."
                        : "Bu ikki mijozni birlashtirmoqchimisiz? Barcha xaridlar asosiy (chap) mijozga o'tkaziladi."}
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setMergeModal(null)}
                        className="flex-1 py-2.5 bg-bg-secondary border border-border rounded-xl font-bold text-text-primary hover:bg-bg-tertiary transition-all text-sm">
                        Bekor
                      </button>
                      {(diffName || addMode) && (
                        <button onClick={() => setMergeModal({ ...mergeModal, step: 'separate_phone' })}
                          className="flex-1 py-2.5 bg-bg-secondary border border-accent-orange/50 text-accent-orange rounded-xl font-bold hover:bg-accent-orange/10 transition-all text-sm">
                          Alohida saqlash
                        </button>
                      )}
                      <button onClick={onMergeClick}
                        className="flex-1 py-2.5 bg-accent-blue text-white rounded-xl font-bold hover:opacity-90 transition-all text-sm">
                        {addMode ? "Mavjudga bog'lash" : 'Birlashtirish'}
                      </button>
                    </div>
                  </>
                )}

                {/* ── STEP: phone ── */}
                {step === 'phone' && (
                  <>
                    <div className="p-4 bg-bg-secondary border border-border rounded-2xl space-y-2">
                      {pendingForm ? (
                        <>
                          <p className="text-sm font-bold text-text-primary">Eski raqam saqlansinmi?</p>
                          <p className="text-xs text-text-muted">Yangi raqam: <span className="font-bold text-text-primary">{keepPhone}</span></p>
                          <p className="text-xs text-text-muted">Eski raqam: <span className="font-bold text-text-primary">{keepOldPhone}</span></p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-bold text-text-primary">Ikkala telefon raqam ham saqlansinmi?</p>
                          <p className="text-xs text-text-muted">{keep.name}: <span className="font-bold text-text-primary">{keep.phone}</span></p>
                          <p className="text-xs text-text-muted">{remove.name}: <span className="font-bold text-text-primary">{remove.phone}</span></p>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => pendingForm
                          ? doMerge({ phone: keepPhone, phone2: keepOldPhone })
                          : doMerge({ phone: keep.phone, phone2: remove.phone })}
                        className="flex-1 py-2.5 bg-accent-blue text-white rounded-xl font-bold hover:opacity-90 text-sm">
                        Ha, ikkisi ham
                      </button>
                      <button onClick={() => pendingForm
                          ? doMerge({ phone: keepPhone })
                          : setMergeModal({ ...mergeModal, step: 'phone_pick' })}
                        className="flex-1 py-2.5 bg-bg-secondary border border-border rounded-xl font-bold text-text-primary hover:bg-bg-tertiary text-sm">
                        {pendingForm ? "Yo'q, yangi raqam" : "Yo'q, birini tanlash"}
                      </button>
                    </div>
                  </>
                )}

                {/* ── STEP: phone_pick ── */}
                {step === 'phone_pick' && (
                  <>
                    <p className="text-sm font-bold text-text-primary">Qaysi raqam qolsin?</p>
                    <div className="space-y-2">
                      <button onClick={() => doMerge({ phone: keep.phone })}
                        className="w-full p-3.5 bg-bg-secondary border border-border rounded-xl text-left hover:border-accent-blue hover:bg-accent-blue/5 transition-colors">
                        <p className="text-[10px] text-text-muted uppercase tracking-widest">{keep.name}</p>
                        <p className="font-bold text-text-primary">{keep.phone}</p>
                      </button>
                      <button onClick={() => doMerge({ phone: remove.phone })}
                        className="w-full p-3.5 bg-bg-secondary border border-border rounded-xl text-left hover:border-accent-blue hover:bg-accent-blue/5 transition-colors">
                        <p className="text-[10px] text-text-muted uppercase tracking-widest">{remove.name}</p>
                        <p className="font-bold text-text-primary">{remove.phone}</p>
                      </button>
                      <button onClick={() => doMerge({ phone: remove.phone })}
                        className="w-full py-2.5 bg-bg-tertiary border border-border text-text-muted rounded-xl text-sm font-bold hover:opacity-80 transition-all">
                        Oxirgi kiritilgan raqam qolsin ({remove.phone})
                      </button>
                    </div>
                  </>
                )}

                {/* ── STEP: separate_phone ── */}
                {step === 'separate_phone' && (
                  <>
                    <p className="text-sm font-bold text-text-primary">Alohida saqlash — raqam nima bo'lsin?</p>
                    <div className="p-3.5 bg-bg-secondary border border-border rounded-2xl space-y-1">
                      <p className="text-xs text-text-muted">Eski mijoz: <span className="font-bold text-text-primary">{remove.name}</span></p>
                      <p className="text-xs text-text-muted">Raqam: <span className="font-bold text-text-primary">{remove.phone}</span></p>
                    </div>
                    <p className="text-xs text-text-secondary">
                      Agar bu raqam oila azosi bo'lsa — qoldiring (ikkisida ham bir xil raqam bo'ladi).
                      Agar raqam faqat yangi mijozga tegishli bo'lsa — eski mijozdan o'chiring.
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => doSeparate(false)}
                        className="flex-1 py-2.5 bg-bg-secondary border border-border rounded-xl font-bold text-text-primary hover:bg-bg-tertiary text-sm">
                        Qoldirish (ikkisida ham)
                      </button>
                      <button onClick={() => doSeparate(true)}
                        className="flex-1 py-2.5 bg-accent-orange text-white rounded-xl font-bold hover:opacity-90 text-sm">
                        O'chirish (eski mijozdan)
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          )
        })()}
      </AnimatePresence>

      {/* OVERDUE MODAL */}
      <AnimatePresence>
        {showOverdueModal && (() => {
          const today = new Date()
          const overdueSales = MOCK_SALES.filter(s =>
            s.paymentType === 'installment' &&
            s.status !== 'cancelled' &&
            (s.installmentDebt ?? s.total) > 0 &&
            s.installmentDueDate && new Date(s.installmentDueDate) < today
          ).sort((a, b) => new Date(a.installmentDueDate) - new Date(b.installmentDueDate))

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowOverdueModal(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="relative w-full max-w-2xl bg-bg-primary border border-border rounded-3xl shadow-2xl overflow-hidden"
                style={{ maxHeight: '80vh' }}
              >
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent-red/10 rounded-xl flex items-center justify-center">
                      <AlertCircle size={20} className="text-accent-red" />
                    </div>
                    <div>
                      <h3 className="text-lg font-syne font-extrabold text-text-primary">Kechikkan to'lovlar</h3>
                      <p className="text-xs text-text-muted">{overdueSales.length} ta tovar muddati o'tgan</p>
                    </div>
                  </div>
                  <button onClick={() => setShowOverdueModal(false)} className="p-2 text-text-muted hover:text-accent-red hover:bg-accent-red/10 rounded-xl transition-all">
                    <X size={20} />
                  </button>
                </div>

                <div className="overflow-y-auto p-6 space-y-3" style={{ maxHeight: 'calc(80vh - 80px)' }}>
                  {overdueSales.length === 0 ? (
                    <div className="py-12 text-center text-text-muted">Kechikkan to'lovlar mavjud emas</div>
                  ) : overdueSales.map(sale => {
                    const debt = sale.installmentDebt ?? sale.total
                    const daysLate = Math.floor((today - new Date(sale.installmentDueDate)) / (1000 * 60 * 60 * 24))
                    const customer = customers.find(c => c.id === sale.customerId)
                    return (
                      <div key={sale.id} className="bg-bg-secondary border border-accent-red/20 rounded-2xl p-4 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-text-primary">{sale.items?.map(i => i.name).join(', ') || '—'}</p>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              <span className="text-xs text-text-secondary">{customer?.name || sale.customerName}</span>
                              <span className="text-xs text-text-muted">{customer?.phone || ''}</span>
                              <span className="text-xs text-text-muted">{sale.installmentOrgName || '—'}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-extrabold text-accent-red">{formatPrice(debt)}</p>
                            <p className="text-[10px] text-accent-red/70 font-bold">{daysLate} kun kechikdi</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-text-muted flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar size={10} /> Muddat: <span className="text-accent-red font-bold">{sale.installmentDueDate}</span>
                          </span>
                          {sale.installmentTermMonths && (
                            <span className="bg-bg-tertiary px-2 py-0.5 rounded">{sale.installmentTermMonths} oy</span>
                          )}
                          <button
                            onClick={() => { setShowOverdueModal(false); setSelectedCustomer(customer); setModalTab('installments') }}
                            className="ml-auto text-accent-blue font-bold hover:underline"
                          >
                            Mijoz profiliga o'tish →
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            </div>
          )
        })()}
      </AnimatePresence>

    </>
  )
}

export default MergeModal
