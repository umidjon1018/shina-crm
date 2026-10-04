import React, { useState, useMemo, useEffect } from 'react'
import DateMaskInput from '../../../components/DateMaskInput'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import CustomerExtraFields from './CustomerExtraFields'
import { Pencil, X, Phone, User, Calendar, Star } from 'lucide-react'
import { useSettingsStore } from '../../../store/settingsStore'
import { useShopStore } from '../../../store/shopStore'
import { ShopPickerModal } from '../../../components/ShopPickerModal'

const EditCustomerModal = ({ ctx }) => {
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
    customerGroups, customerTags,
  } = ctx
  return (
    <>

      {/* EDIT CUSTOMER MODAL */}
      <AnimatePresence>
        {editCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditCustomer(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-bg-primary border border-border rounded-3xl p-8 shadow-2xl max-h-[92vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-syne font-extrabold text-text-primary">{t('cust_edit_title')}</h3>
                <button onClick={() => setEditCustomer(null)} className="p-2 text-text-muted hover:text-accent-red hover:bg-accent-red/10 rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleEditSave} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('cust_field_name')}</label>
                  <input
                    autoFocus required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-accent-orange"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('cust_field_phone_main')}</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                    <input
                      required
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-accent-orange"
                    />
                  </div>
                </div>
                {(editForm.phone2 || editCustomer?.phone2) && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('cust_field_phone2')}</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                      <input
                        value={editForm.phone2 || ''}
                        onChange={(e) => setEditForm({ ...editForm, phone2: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 bg-bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-accent-orange"
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('cust_field_birthday')}</label>
                  <DateMaskInput
                    value={editForm.birthDate}
                    onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                    className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-accent-orange"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">Instagram</label>
                  <input
                    placeholder="@username"
                    value={editForm.instagram}
                    onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                    className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-accent-orange"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('cust_field_car')}</label>
                  <input
                    placeholder={t('cust_field_car_ph')}
                    value={editForm.carModel || ''}
                    onChange={(e) => setEditForm({ ...editForm, carModel: e.target.value })}
                    className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-accent-orange"
                  />
                </div>
                <CustomerExtraFields form={editForm} setForm={setEditForm} groups={customerGroups} allTags={customerTags} />
                <button className="w-full py-4 bg-accent-orange text-white rounded-2xl font-syne font-extrabold text-lg mt-4 hover:opacity-90 transition-all">
                  SAQLASH
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </>
  )
}

export default EditCustomerModal
