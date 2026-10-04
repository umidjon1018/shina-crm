import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Check, ChevronDown, ChevronUp, Clock, DollarSign, Plus, TrendingUp, Wallet, X } from 'lucide-react'
import { formatPrice, formatUSD, statusConfig, getDueDays, calcRateDiff, calcPaymentRateDiff } from '../components/incHelpers'

const DebtsTab = ({ ctx }) => {
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
    usdRate, productCategories, bump,
    paged1, totalPages1, paged2, totalPages2,
    getSupplierName,
  } = ctx

  return (
    <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {shopBatches.filter(b => b.debtUSD > 0).map(batch => {
              const dueDays = getDueDays(batch.dueDate)
              const progress = (batch.paidUSD / batch.totalUSD) * 100
              const isUrgent = dueDays !== null && dueDays <= 3

              return (
                <motion.div
                  key={batch.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`bg-bg-secondary border-2 rounded-[2rem] p-4 sm:p-6 space-y-4 sm:space-y-6 transition-all ${isUrgent ? 'border-accent-red shadow-glow-red/5' : 'border-border'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">{batch.productName}</h3>
                      <p className="text-xs text-text-muted">{getSupplierName(batch.supplierId)}</p>
                    </div>
                    <div className={`p-2 rounded-xl ${isUrgent ? 'bg-accent-red/10 text-accent-red' : 'bg-bg-tertiary text-text-muted'}`}>
                      <Clock size={18} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">{t('inc_debt_total_received')}:</span>
                      <span className="text-text-primary font-bold">{formatUSD(batch.totalUSD)} ({formatPrice(batch.totalUZS_atEntry)} {som})</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">{t('inc_debt_paid')}:</span>
                      <span className="text-accent-green font-bold">{formatUSD(batch.paidUSD)}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-text-muted">{t('inc_debt_progress')}</span>
                        <span className="text-text-primary font-bold">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className={`h-full rounded-full ${progress > 50 ? 'bg-accent-green' : 'bg-accent-blue'}`}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('inc_debt_remaining')}</p>
                        <p className="text-2xl font-syne font-extrabold text-accent-red">{formatUSD(batch.debtUSD)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('inc_debt_due_date')}</p>
                        <p className={`text-sm font-bold ${isUrgent ? 'text-accent-red' : 'text-text-primary'}`}>
                          {batch.dueDate ? new Date(batch.dueDate).toLocaleDateString('uz-UZ') : '—'}
                        </p>
                        {dueDays !== null && (
                          <p className={`text-[10px] font-bold ${isUrgent ? 'text-accent-red' : 'text-text-muted'}`}>
                            {dueDays <= 0 ? t('inc_debt_overdue') : t('inc_debt_days_left', { n: dueDays })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowPaymentModal(batch)}
                    className="w-full py-3 bg-bg-tertiary border border-border rounded-xl text-text-primary font-bold hover:bg-border transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> {t('inc_add_payment')}
                  </button>
                </motion.div>
              )
            })}
          </div>

    </>
  )
}

export default DebtsTab
