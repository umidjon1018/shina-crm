import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Truck, Plus, Edit3, Trash2, X, Check, ExternalLink, DollarSign, Package, AlertCircle } from 'lucide-react'
import { formatPrice, formatUSD, statusConfig, getDueDays } from '../components/incHelpers'

const SuppliersTab = ({ ctx }) => {
  const { t } = useTranslation()
  const {
    user, isPrivileged, som,
    batches, setBatches, suppliers, setSuppliers, loading, selectedShopId,
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
    onDeleteSupplier,
    paged1, totalPages1, paged2, totalPages2,
  } = ctx

  return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-syne font-extrabold text-text-primary">{t('inc_suppliers_title')}</h2>
              <button
                onClick={() => { setEditingSupplier(null); setShowSupplierModal(true); }}
                className="flex items-center gap-2 px-6 py-3 bg-accent-blue text-white rounded-2xl font-syne font-bold shadow-glow-blue hover:opacity-90 transition-all"
              >
                <Plus size={18} /> {t('inc_add_supplier')}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(selectedShopId === 'all' ? suppliers : suppliers.filter(s => shopBatches.some(b => b.supplierId === s.id))).map(s => {
                const supplierBatches = shopBatches.filter(b => b.supplierId === s.id)
                const supplierDebts = supplierBatches.reduce((sum, b) => sum + (b.debtUSD || 0), 0)
                const contractActivatedAt = s.contractActivatedAt || null
                const contractUsed = supplierBatches.reduce((sum, b) =>
                  sum + (b.payments || [])
                    .filter(p => !contractActivatedAt || new Date(p.date) >= new Date(contractActivatedAt))
                    .reduce((ps, p) => ps + p.amountUZS, 0), 0)
                const contractRemaining = (() => {
                  if (s.contractStatus === 'pending_completion') {
                    // Eski qoldiq + yangi shartnoma
                    return (s.pendingRemaining || 0) + (s.newContractAmount || 0) - contractUsed
                  }
                  return (s.contractAmount || 0) - contractUsed
                })()
                const contractWarning = contractRemaining < 5000000

                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-bg-secondary border border-border rounded-[2.5rem] p-6 space-y-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent-blue/10 text-accent-blue rounded-2xl flex items-center justify-center font-extrabold text-xl">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-text-primary">{s.name}</h3>
                          <p className="text-xs text-text-muted">{s.contractNumber}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.isActive ? 'bg-accent-green/10 text-accent-green' : 'bg-text-muted/10 text-text-muted'}`}>
                        {s.isActive ? t('inc_supplier_active') : t('inc_supplier_inactive')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('col_phone')}</p>
                        <p className="text-text-primary font-medium">{s.phone}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('inc_supplier_inn')}</p>
                        <p className="text-text-primary font-medium">{s.inn}</p>
                      </div>
                      {s.contactPerson && (
                        <div className="col-span-2 space-y-1">
                          <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('sup_contact_person')}</p>
                          <p className="text-text-primary font-medium">{s.contactPerson}</p>
                        </div>
                      )}
                      <div className="col-span-2 space-y-1">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('col_address')}</p>
                        <p className="text-text-primary font-medium">{s.address}</p>
                      </div>
                    </div>

                    <div className="bg-bg-tertiary rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('inc_stat_debt')}</p>
                          <p className={`text-xl font-syne font-extrabold ${supplierDebts > 0 ? 'text-accent-red' : 'text-text-primary'}`}>
                            {formatUSD(supplierDebts)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('inc_supplier_contract_remaining')}</p>
                          <p className={`text-xl font-syne font-extrabold ${contractWarning ? 'text-accent-red animate-pulse' : 'text-accent-green'}`}>
                            {formatPrice(contractRemaining)} {som}
                          </p>
                        </div>
                      </div>
                      {contractWarning && (
                        <div className="bg-accent-red/10 border border-accent-red/30 rounded-xl px-3 py-2 text-xs text-accent-red font-bold">
                          {t('inc_supplier_contract_warning')}
                        </div>
                      )}
                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-text-muted">
                          <span>{t('inc_supplier_used')}: {formatPrice(contractUsed)} {som}</span>
                          <span>{t('inc_supplier_total')}: {formatPrice(s.contractAmount)} {som}</span>
                        </div>
                        <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${contractWarning ? 'bg-accent-red' : 'bg-accent-green'}`}
                            style={{ width: `${Math.min(100, (contractUsed / (s.contractAmount || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setShowSupplierDetail(s)}
                          className="text-xs text-accent-blue hover:underline font-bold"
                        >
                          {t('inc_supplier_detail')}
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditingSupplier(s); setShowSupplierModal(true) }}
                            className="p-2 text-text-muted hover:text-accent-blue transition-colors"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => onDeleteSupplier(s)}
                            className="p-2 text-text-muted hover:text-accent-red transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

  )
}

export default SuppliersTab
