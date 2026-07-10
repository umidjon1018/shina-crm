import { motion, AnimatePresence } from 'framer-motion'
import DateMaskInput from '../../components/DateMaskInput'
import {
  Trash2, RotateCcw, History, ShoppingBag, Calendar,
  TrendingUp, XCircle, X, Recycle
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import { ShopPickerModal } from '../../components/ShopPickerModal'
import ShopRequiredGuard from '../../components/ShopRequiredGuard'
import SuccessModal from '../../components/sales/SuccessModal'
import DiscountRequestModal from '../../components/sales/DiscountRequestModal'
import NewSaleTab from './tabs/NewSaleTab'
import UsedSaleTab from './tabs/UsedSaleTab'
import HistoryTab from './tabs/HistoryTab'
import ReturnsTab from './tabs/ReturnsTab'
import ReturnsHistoryTab from './tabs/ReturnsHistoryTab'
import InstallmentTab from './tabs/InstallmentTab'
import ProfitTab from './tabs/ProfitTab'
import { useSalesState } from './useSalesState'

const formatPrice = (price) => Math.round(price).toLocaleString('uz-UZ') + ' ' + i18n.t('unit_som')

const Sales = () => {
  const { t } = useTranslation()
  const state = useSalesState()
  const {
    user, bump, addCustomer,
    shopPickCallback, setShopPickCallback,
    activeTab, setActiveTab,
    cartItems, clearCart,
    selectedCustomer, setSelectedCustomer,
    customerSearch, setCustomerSearch,
    filteredCustomers, showNewCustomerModal, setShowNewCustomerModal,
    buShowNewCustomerModal, setBuShowNewCustomerModal,
    newCustomer, setNewCustomer, setAllCustomers,
    setBuSelectedCustomer,
    successSale, setSuccessSale,
    pinModal, setPinModal, handleSendDiscountRequest,
    cancelModal, setCancelModal, cancelReason, setCancelReason,
    refundType, setRefundType, executeCancelSale,
    handleCancelSale, alertModal, setAlertModal,
    addNotification, notificationSettings, sources, productCategories,
    barcodeSelectClass, getItemBarcode, formatMonthValue,
    salesList, allCustomers, selectedShopId,
    fetchData,
    addToCart, removeFromCart, updateSalePrice,
    loyaltyMinAmount, loyaltyVisitsRequired, loyaltyDiscountPercent,
    loyaltyDiscountApplied, setLoyaltyDiscountApplied, customerHasLoyalty,
    discountPercent, maxDiscount, effectiveDiscount, discountAmount,
    handleDiscountChange, pendingDiscountReqId, setPendingDiscountReqId,
    discountSmallMax, updateNotification,
    paymentType, setPaymentType, installmentOrgId, setInstallmentOrgId,
    installmentTermMonths, setInstallmentTermMonths, installmentOrganizations,
    contractNumber, setContractNumber, source, setSource,
    tradeInItems, addTradeInRow, updateTradeInRow, removeTradeInRow, tradeInTotal,
    subtotal, total, priceWarnings, setPriceWarnings, isSubmitting,
    handleSubmitSale, addNextItemOfProduct, updateGroupSalePrice,
    buScrapMode, setBuScrapMode, buScrapSelected, setBuScrapSelected,
    buScrapCategory, setBuScrapCategory, buScrapCategories, buScrapGroups,
    buAddScrapToCart, buSelectedCustomer,
    buCustomerSearch, setBuCustomerSearch, buFilteredCustomers,
    buSearch, setBuSearch,
    buAvailableGroups, buGroupQty, setBuGroupQty, buAddToCart,
    buCart, setBuCart, buCartGroups, buRemoveGroupFromCart,
    buSetGroupTotalPrice, buSuccessSale, setBuSuccessSale,
    buDiscountPercent, setBuDiscountPercent, buPaymentType, setBuPaymentType,
    buInstallmentOrgId, setBuInstallmentOrgId,
    buInstallmentTermMonths, setBuInstallmentTermMonths,
    buContractNumber, setBuContractNumber, buSource, setBuSource,
    buSubtotal, buDiscountAmount, buTotal, buIsSubmitting, buHandleSubmitSale,
    historyMonthFilter, setHistoryMonthFilter, historyMonthOptions,
    filteredSalesForHistory, sortedSalesForHistory,
    historyPage, setHistoryPage,
    historySortField, historySortOrder, handleHistorySort,
    exchangePairColors, usedSalesList,
    handleLeftItemFound, handleSelectSaleItem,
    returnCustomer, setReturnCustomer, returnSale, setReturnSale,
    returnItems, setReturnItems, exchangeItems, setExchangeItems,
    returnLinkCust, setReturnLinkCust, returnLinkConfirm, setReturnLinkConfirm,
    returnQtyMap, setReturnQtyMap, returnMode, setReturnMode,
    returnReason, setReturnReason, returnPaymentMethod, setReturnPaymentMethod,
    handleRightScanOrSearch, handleReturnSubmit,
    returnsMonthFilter, setReturnsMonthFilter, returnsHistoryMonthFilter, setReturnsHistoryMonthFilter,
    returnsMonthOptions, returnsMonthOptions2,
    filteredCancelledReturns, sortedReturnsHistory,
    returnsHistoryPage, setReturnsHistoryPage,
    installmentMonthFilter, setInstallmentMonthFilter, installmentMonthOptions,
    installmentSearch, setInstallmentSearch, installmentTypeFilter, setInstallmentTypeFilter,
    filteredInstallmentSales, sortedInstallmentSales,
    installmentSalesPage, setInstallmentSalesPage,
    installmentSortField, installmentSortOrder, handleInstallmentSort,
    getInstallmentStatusMap, thisMonth,
    detailedOrg, setDetailedOrg, orgMonthFilter, setOrgMonthFilter,
    payoutAmount, setPayoutAmount, selectedPayoutSaleId, setSelectedPayoutSaleId,
    payoutSuccess, handleOrgPayoutSubmit,
    customerPayModal, setCustomerPayModal,
    customerPaySaleId, setCustomerPaySaleId,
    customerPayAmount, setCustomerPayAmount,
    customerPaySuccess, handleCustomerPaySubmit,
    filteredProfitItems, sortedProfitItems,
    profitMonthFilter, setProfitMonthFilter, profitMonthOptions,
    profitTypeFilter, setProfitTypeFilter,
    profitSearch, setProfitSearch, profitPage, setProfitPage,
    profitSortField, profitSortOrder, handleProfitSort,
  } = state

  return (
    <div className="min-h-[calc(100vh-120px)] space-y-6">
      {shopPickCallback && (
        <ShopPickerModal
          onConfirm={(shopId) => { const cb = shopPickCallback; setShopPickCallback(null); cb(shopId) }}
          onCancel={() => setShopPickCallback(null)}
        />
      )}
      {/* Header Navigation Tab Buttons */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-1.5 p-1.5 bg-bg-secondary border border-border rounded-2xl overflow-x-auto no-scrollbar max-w-full">
          {[
            { id: 'new_sale', label: t('sl_tab_new_sale'), icon: ShoppingBag },
            { id: 'used_sale', label: t('sl_tab_used_sale'), icon: Recycle },
            { id: 'returns', label: t('sl_tab_returns'), icon: RotateCcw },
            { id: 'history', label: t('sl_tab_history'), icon: History },
            { id: 'returns_history', label: t('sl_tab_returns_history'), icon: XCircle },
            { id: 'installment', label: t('sl_tab_installment'), icon: Calendar },
            { id: 'profit', label: t('sl_tab_profit'), icon: TrendingUp },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-accent-red text-white shadow-glow-red'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
          {cartItems.length > 0 && activeTab === 'new_sale' && (
            <button
              onClick={clearCart}
              className="px-3 py-2.5 text-xs font-bold text-text-muted hover:text-accent-red transition-colors flex items-center gap-1 shrink-0"
            >
              <Trash2 size={14} /> {t('sl_clear_cart')} ({cartItems.length})
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
      {(() => {
        const ctx = {
          // shared
          user, addNotification, notificationSettings, sources, productCategories,
          barcodeSelectClass, getItemBarcode, formatMonthValue,
          salesList, allCustomers, selectedShopId,
          fetchData, bump, addCustomer,
          // new_sale
          addToCart, cartItems, clearCart, removeFromCart, updateSalePrice,
          selectedCustomer, setSelectedCustomer, customerSearch, setCustomerSearch,
          filteredCustomers, setShowNewCustomerModal,
          loyaltyMinAmount, loyaltyVisitsRequired, loyaltyDiscountPercent,
          loyaltyDiscountApplied, setLoyaltyDiscountApplied, customerHasLoyalty,
          discountPercent, maxDiscount, effectiveDiscount, discountAmount,
          handleDiscountChange, pendingDiscountReqId, setPendingDiscountReqId,
          discountSmallMax, updateNotification,
          paymentType, setPaymentType, installmentOrgId, setInstallmentOrgId,
          installmentTermMonths, setInstallmentTermMonths, installmentOrganizations,
          contractNumber, setContractNumber, source, setSource,
          tradeInItems, addTradeInRow, updateTradeInRow, removeTradeInRow, tradeInTotal,
          subtotal, total, priceWarnings, setPriceWarnings,
          handleSubmitSale, isSubmitting, addNextItemOfProduct, updateGroupSalePrice,
          // used_sale
          buScrapMode, setBuScrapMode, buScrapSelected, setBuScrapSelected,
          buScrapCategory, setBuScrapCategory, buScrapCategories, buScrapGroups,
          buAddScrapToCart, buSelectedCustomer, setBuSelectedCustomer,
          buCustomerSearch, setBuCustomerSearch, buFilteredCustomers,
          setBuShowNewCustomerModal, buSearch, setBuSearch,
          buAvailableGroups, buGroupQty, setBuGroupQty, buAddToCart,
          buCart, setBuCart, buCartGroups, buRemoveGroupFromCart,
          buSetGroupTotalPrice, buSuccessSale, setBuSuccessSale,
          buDiscountPercent, setBuDiscountPercent, buPaymentType, setBuPaymentType,
          buInstallmentOrgId, setBuInstallmentOrgId,
          buInstallmentTermMonths, setBuInstallmentTermMonths,
          buContractNumber, setBuContractNumber, buSource, setBuSource,
          buSubtotal, buDiscountAmount, buTotal, buIsSubmitting, buHandleSubmitSale,
          // history
          historyMonthFilter, setHistoryMonthFilter, historyMonthOptions,
          filteredSalesForHistory, sortedSalesForHistory,
          historyPage, setHistoryPage,
          historySortField, historySortOrder, handleHistorySort,
          exchangePairColors, usedSalesList,
          // returns
          handleLeftItemFound, handleSelectSaleItem,
          returnCustomer, setReturnCustomer, returnSale, setReturnSale,
          returnItems, setReturnItems, exchangeItems, setExchangeItems,
          returnLinkCust, setReturnLinkCust, returnLinkConfirm, setReturnLinkConfirm,
          returnQtyMap, setReturnQtyMap, returnMode, setReturnMode,
          returnReason, setReturnReason, returnPaymentMethod, setReturnPaymentMethod,
          handleRightScanOrSearch, handleReturnSubmit,
          // returns_history
          returnsHistoryMonthFilter, setReturnsHistoryMonthFilter, returnsMonthOptions2,
          filteredCancelledReturns, sortedReturnsHistory,
          returnsHistoryPage, setReturnsHistoryPage,
          returnsMonthFilter, setReturnsMonthFilter, returnsMonthOptions,
          // installment
          installmentMonthFilter, setInstallmentMonthFilter, installmentMonthOptions,
          installmentSearch, setInstallmentSearch, installmentTypeFilter, setInstallmentTypeFilter,
          filteredInstallmentSales, sortedInstallmentSales,
          installmentSalesPage, setInstallmentSalesPage,
          installmentSortField, installmentSortOrder, handleInstallmentSort,
          getInstallmentStatusMap, thisMonth,
          detailedOrg, setDetailedOrg, orgMonthFilter, setOrgMonthFilter,
          payoutAmount, setPayoutAmount, selectedPayoutSaleId, setSelectedPayoutSaleId,
          payoutSuccess, handleOrgPayoutSubmit,
          customerPayModal, setCustomerPayModal,
          customerPaySaleId, setCustomerPaySaleId,
          customerPayAmount, setCustomerPayAmount,
          customerPaySuccess, handleCustomerPaySubmit,
          // profit
          filteredProfitItems, sortedProfitItems,
          profitMonthFilter, setProfitMonthFilter, profitMonthOptions,
          profitTypeFilter, setProfitTypeFilter,
          profitSearch, setProfitSearch, profitPage, setProfitPage,
          profitSortField, profitSortOrder, handleProfitSort,
        }
        return (
          <>
            {activeTab === 'new_sale' && <ShopRequiredGuard><NewSaleTab ctx={ctx} /></ShopRequiredGuard>}
            {activeTab === 'used_sale' && <ShopRequiredGuard><UsedSaleTab ctx={ctx} /></ShopRequiredGuard>}
            {activeTab === 'history' && <HistoryTab ctx={ctx} />}
            {activeTab === 'returns' && <ShopRequiredGuard><ReturnsTab ctx={ctx} /></ShopRequiredGuard>}
            {activeTab === 'returns_history' && <ReturnsHistoryTab ctx={ctx} />}
            {activeTab === 'installment' && <InstallmentTab ctx={ctx} />}
            {activeTab === 'profit' && <ProfitTab ctx={ctx} />}
          </>
        )
      })()}
      </AnimatePresence>

      {/* NEW CUSTOMER MODAL */}
      <AnimatePresence>
        {showNewCustomerModal && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowNewCustomerModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={e => e.stopPropagation()}
              className="bg-bg-secondary border border-border rounded-3xl p-6 w-full max-w-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-syne font-extrabold text-text-primary">{t('cust_new')}</h3>
                <button onClick={() => setShowNewCustomerModal(false)} className="text-text-muted hover:text-text-primary"><X size={20} /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('sl_cust_name_label')}</label>
                  <input
                    autoFocus
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    placeholder={t('sl_new_customer_name_ph')}
                    className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('sl_cust_phone_label')}</label>
                  <input
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    placeholder="+998XXXXXXXXX"
                    className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('sl_cust_birth_label')}</label>
                  <DateMaskInput
                    value={newCustomer.birthDate}
                    onChange={(e) => setNewCustomer({ ...newCustomer, birthDate: e.target.value })}
                    className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('sl_cust_instagram_label')}</label>
                  <input
                    value={newCustomer.instagram}
                    onChange={(e) => setNewCustomer({ ...newCustomer, instagram: e.target.value })}
                    placeholder="@username"
                    className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('cust_field_car')}</label>
                  <input
                    value={newCustomer.carModel}
                    onChange={(e) => setNewCustomer({ ...newCustomer, carModel: e.target.value })}
                    placeholder={t('cust_field_car_ph')}
                    className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>
              </div>
              <button
                onClick={async () => {
                  if (!newCustomer.name || !newCustomer.phone) return
                  const result = await addCustomer({
                    name: newCustomer.name,
                    phone: newCustomer.phone,
                    birthDate: newCustomer.birthDate || null,
                    instagram: newCustomer.instagram || null,
                    carModel: newCustomer.carModel || null,
                  })
                  if (result.success) {
                    setAllCustomers(prev => [...prev, result.customer])
                    setSelectedCustomer(result.customer)
                    setShowNewCustomerModal(false)
                    setNewCustomer({ name: '', phone: '+998', birthDate: '', instagram: '', carModel: '' })
                  }
                }}
                disabled={!newCustomer.name || !newCustomer.phone}
                className="w-full py-3 bg-accent-blue text-white rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {t('sl_cust_add_btn')}
              </button>
            </motion.div>
          </div>
        )}

        {buShowNewCustomerModal && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setBuShowNewCustomerModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={e => e.stopPropagation()}
              className="bg-bg-secondary border border-border rounded-3xl p-6 w-full max-w-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-syne font-extrabold text-text-primary">{t('cust_new')}</h3>
                <button onClick={() => setBuShowNewCustomerModal(false)} className="text-text-muted hover:text-text-primary"><X size={20} /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('sl_cust_name_label')}</label>
                  <input
                    autoFocus
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    placeholder={t('sl_new_customer_name_ph')}
                    className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('sl_cust_phone_label')}</label>
                  <input
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    placeholder="+998XXXXXXXXX"
                    className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('sl_cust_birth_label')}</label>
                  <DateMaskInput
                    value={newCustomer.birthDate}
                    onChange={(e) => setNewCustomer({ ...newCustomer, birthDate: e.target.value })}
                    className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('sl_cust_instagram_label')}</label>
                  <input
                    value={newCustomer.instagram}
                    onChange={(e) => setNewCustomer({ ...newCustomer, instagram: e.target.value })}
                    placeholder="@username"
                    className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('cust_field_car')}</label>
                  <input
                    value={newCustomer.carModel}
                    onChange={(e) => setNewCustomer({ ...newCustomer, carModel: e.target.value })}
                    placeholder={t('cust_field_car_ph')}
                    className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                  />
                </div>
              </div>
              <button
                onClick={async () => {
                  if (!newCustomer.name || !newCustomer.phone) return
                  const result = await addCustomer({
                    name: newCustomer.name,
                    phone: newCustomer.phone,
                    birthDate: newCustomer.birthDate || null,
                    instagram: newCustomer.instagram || null,
                    carModel: newCustomer.carModel || null,
                  })
                  if (result.success) {
                    setAllCustomers(prev => [...prev, result.customer])
                    setBuSelectedCustomer(result.customer)
                    setBuSource('walk_in')
                    setBuShowNewCustomerModal(false)
                    setNewCustomer({ name: '', phone: '+998', birthDate: '', instagram: '', carModel: '' })
                  }
                }}
                disabled={!newCustomer.name || !newCustomer.phone}
                className="w-full py-3 bg-accent-blue text-white rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {t('sl_cust_add_btn')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUCCESS MODAL */}
      <AnimatePresence>
        {successSale && (
          <SuccessModal
            sale={successSale}
            onClose={() => setSuccessSale(null)}
            onCancel={handleCancelSale}
          />
        )}
      </AnimatePresence>

      {/* DISCOUNT REQUEST MODAL */}
      <AnimatePresence>
        {pinModal && (
          <DiscountRequestModal
            discount={pinModal.discount}
            requiredRole={pinModal.requiredRole}
            cartItems={cartItems}
            cartTotal={cartItems.reduce((s, c) => s + (c.product?.cashPrice || 0) * (c.quantity || 1), 0)}
            onSend={handleSendDiscountRequest}
            onClose={() => setPinModal(null)}
          />
        )}
      </AnimatePresence>

      {/* CANCEL SALE MODAL */}
      <AnimatePresence>
        {cancelModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-secondary border border-border rounded-3xl p-6 w-full max-w-sm space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-syne font-extrabold text-text-primary">{t('sl_cancel_title')}</h3>
                <button onClick={() => setCancelModal(null)} className="text-text-muted hover:text-text-primary">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted block">{t('sl_cancel_reason_label')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'narx_mos_emas', label: t('sl_cancel_r_price') },
                      { id: 'tovar_yoq', label: t('sl_cancel_r_nostock') },
                      { id: 'mijoz_fikr_ozgartirdi', label: t('sl_cancel_r_changed') },
                      { id: 'boshqa', label: t('sl_cancel_r_other') },
                    ].map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setCancelReason(r.id)}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-center leading-tight h-12 flex items-center justify-center ${
                          cancelReason === r.id
                            ? 'bg-accent-red text-white border-accent-red shadow-glow-red'
                            : 'bg-bg-tertiary border-border text-text-secondary hover:border-text-primary'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted block">{t('sl_cancel_refund_label')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'money', label: t('sl_cancel_refund_money') },
                      { id: 'exchange', label: t('col_exchange') },
                    ].map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRefundType(r.id)}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-center h-12 flex items-center justify-center ${
                          refundType === r.id
                            ? 'bg-accent-red text-white border-accent-red shadow-glow-red'
                            : 'bg-bg-tertiary border-border text-text-secondary hover:border-text-primary'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModal(null)}
                  className="py-3 bg-bg-tertiary border border-border rounded-xl text-text-primary font-medium hover:bg-border transition-colors text-sm"
                >
                  {t('sl_cancel_btn_cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sale = cancelModal.sale
                    const saleTime = new Date(sale.soldAt).getTime()
                    const now = Date.now()
                    const fiveMin = 5 * 60 * 1000

                    if (now - saleTime <= fiveMin) {
                      executeCancelSale(sale, cancelReason, refundType)
                    } else {
                      setPinModal({
                        requiredRole: 'manager',
                        title: 'Sotuvni bekor qilish',
                        onApprove: () => executeCancelSale(sale, cancelReason, refundType)
                      })
                    }
                  }}
                  className="py-3 bg-accent-red text-white rounded-xl font-bold hover:opacity-90 transition-opacity text-sm shadow-glow-red"
                >
                  {t('confirm')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ALERT MODAL */}
      <AnimatePresence>
        {alertModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-bg-secondary border border-border p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl"
            >
              <h3 className="font-syne font-bold text-text-primary text-base">{alertModal.title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{alertModal.message}</p>
              <div className="flex justify-end">
                <button 
                  onClick={() => setAlertModal(null)} 
                  className="px-5 py-2 bg-accent-blue text-white rounded-xl text-xs font-bold font-syne hover:opacity-90 transition-opacity"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Sales
