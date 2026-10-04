import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Trash2, X } from 'lucide-react'

const DeleteModal = ({ ctx }) => {
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
    handleDeleteConfirm, doMerge, handleManualMergeClick,
    handleInstPaymentSubmit,
    selectedShopId,
    stats, filtered,
    LOYALTY_CONFIG, formatPrice,
    loyaltyMinAmount, loyaltyVisitsRequired, loyaltyDiscountPercent, silverVisits,
    CustSortIcon,
  } = ctx
  return (
    <>

      {/* DELETE CONFIRM MODAL */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteTarget(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-bg-primary border border-border rounded-3xl p-5 sm:p-8 shadow-2xl text-center"
            >
              <div className="w-14 h-14 bg-accent-red/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Trash2 size={28} className="text-accent-red" />
              </div>
              <h3 className="text-xl font-syne font-extrabold text-text-primary mb-2">Mijozni o'chirish</h3>
              <p className="text-sm text-text-secondary mb-4 sm:mb-6">
                <span className="font-bold text-text-primary">{deleteTarget.name}</span> mijozi o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-3 bg-bg-secondary border border-border rounded-2xl font-bold text-text-primary hover:bg-bg-tertiary transition-all"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-3 bg-accent-red text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-glow-red"
                >
                  O'chirish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </>
  )
}

export default DeleteModal
