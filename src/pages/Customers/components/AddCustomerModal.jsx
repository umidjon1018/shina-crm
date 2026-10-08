import React, { useState, useMemo, useEffect } from 'react'
import DateMaskInput from '../../../components/DateMaskInput'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { UserPlus, X, Phone, User, Calendar, Star } from 'lucide-react'
import { useSettingsStore } from '../../../store/settingsStore'
import { useShopStore } from '../../../store/shopStore'
import { ShopPickerModal } from '../../../components/ShopPickerModal'
import CustomerExtraFields from './CustomerExtraFields'
import { StackGuard } from '../../../components/ui/Modal'

const AddCustomerModal = ({ ctx }) => {
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
    usdRate, som, user, bump, saving, addError, setAddError,
    handleAddCustomer, handleEditSave, handleEditOpen,
    handleDeleteConfirm, doMerge, handleManualMergeClick,
    handleInstPaymentSubmit,
    selectedShopId,
    stats, filtered,
    LOYALTY_CONFIG, formatPrice,
    loyaltyMinAmount, loyaltyVisitsRequired, loyaltyDiscountPercent, silverVisits,
    CustSortIcon, customerGroups, customerTags,
  } = ctx
  return (
    <>

      {/* ADD CUSTOMER MODAL */}
      {shopPickCallback && (
        <ShopPickerModal
          onConfirm={(shopId) => { const cb = shopPickCallback; setShopPickCallback(null); cb(shopId) }}
          onCancel={() => setShopPickCallback(null)}
        />
      )}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <StackGuard onClose={() => { setShowAddModal(false); setAddError('') }} />
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => { setShowAddModal(false); setAddError('') }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-bg-primary border border-border rounded-3xl p-5 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-2xl font-syne font-extrabold text-text-primary">{t('cust_new')}</h3>
                <button onClick={() => { setShowAddModal(false); setAddError('') }} className="p-2 text-text-muted hover:text-accent-red hover:bg-accent-red/10 rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('cust_field_name')}</label>
                  <input
                    autoFocus
                    required
                    value={newCust.name}
                    onChange={(e) => setNewCust({...newCust, name: e.target.value})}
                    placeholder={t('sl_new_customer_name_ph')}
                    className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-accent-red"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('col_phone')}</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                    <input
                      required
                      value={newCust.phone}
                      onChange={(e) => setNewCust({...newCust, phone: e.target.value})}
                      placeholder="+998"
                      className="w-full pl-11 pr-4 py-3 bg-bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-accent-red"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('cust_field_birthday')}</label>
                  <DateMaskInput
                    value={newCust.birthDate}
                    onChange={(e) => setNewCust({...newCust, birthDate: e.target.value})}
                    className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-accent-red"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">Instagram</label>
                  <input
                    value={newCust.instagram}
                    onChange={(e) => setNewCust({...newCust, instagram: e.target.value})}
                    placeholder="@username"
                    className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-accent-red"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('cust_field_car')}</label>
                  <input
                    value={newCust.carModel}
                    onChange={(e) => setNewCust({...newCust, carModel: e.target.value})}
                    placeholder={t('cust_field_car_ph')}
                    className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-accent-red"
                  />
                </div>
                <CustomerExtraFields form={newCust} setForm={setNewCust} groups={customerGroups} allTags={customerTags} />
                {addError && (
                  <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{addError}</div>
                )}
                <button disabled={saving} className="w-full py-4 bg-accent-red text-white rounded-2xl font-syne font-extrabold text-lg mt-4 shadow-glow-red hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                  {saving ? '...' : 'SAQLASH'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </>
  )
}

export default AddCustomerModal
