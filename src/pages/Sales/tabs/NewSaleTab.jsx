import { useMemo, useRef } from 'react'
import { useSettingsStore } from '../../../store/settingsStore'
import ProductImageViewer from '../../../components/ProductImageViewer'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowRight, Banknote, Barcode, Calendar, CreditCard, Minus, Plus, Search, ShoppingBag, ShoppingCart, Star, Trash2, UserPlus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import BarcodeScanner from '../../../components/sales/BarcodeScanner'
import ProductSearch from '../../../components/sales/ProductSearch'
import MobileSellBar from '../../../components/sales/MobileSellBar'

const formatPrice = (price, som) => Math.round(price).toLocaleString('uz-UZ') + ' ' + som

const NewSaleTab = ({ ctx }) => {
  const { t } = useTranslation()
  const som = t('unit_som')
  const {
    user, addToCart, cartItems, clearCart, removeFromCart, updateSalePrice,
    barcodeSelectClass, addNotification, notificationSettings,
    selectedCustomer, setSelectedCustomer, customerSearch, setCustomerSearch,
    filteredCustomers, setShowNewCustomerModal,
    loyaltyMinAmount, loyaltyVisitsRequired, loyaltyDiscountPercent,
    loyaltyDiscountApplied, setLoyaltyDiscountApplied, customerHasLoyalty,
    discountPercent, maxDiscount, effectiveDiscount, promoDiscount, discountAmount, handleDiscountChange,
    pendingDiscountReqId, setPendingDiscountReqId, discountSmallMax, updateNotification,
    paymentType, setPaymentType, cardType, setCardType, installmentOrgId, setInstallmentOrgId,
    installmentTermMonths, setInstallmentTermMonths, installmentOrganizations,
    contractNumber, setContractNumber,
    source, setSource, sources,
    tradeInItems, addTradeInRow, updateTradeInRow, removeTradeInRow, tradeInTotal,
    productCategories, subtotal, total, priceWarnings, setPriceWarnings,
    handleSubmitSale, isSubmitting,
    salesList, addNextItemOfProduct, updateGroupSalePrice,
    addBundleToCart, removeBundleFromCart,
    loyaltyInfo, loyaltyTierPercent, loyaltyActive, useBalance, setUseBalance, balanceInput, setBalanceInput,
    customerBalance, balanceUsed, payable, cashbackPreview,
  } = ctx

  const sellBtnRef = useRef(null)
  const sellDisabled = isSubmitting || cartItems.length === 0 || (paymentType === 'installment' && !installmentOrgId)
  const payLabel = { cash: t('pay_cash'), card: t('pay_card'), installment: t('pay_installment'), transfer: t('sl_hist_pay_bank') }[paymentType] || paymentType

  // Savatni bundle va oddiy guruhlarga ajratish
  const { bundleGroups, singleGroups } = useMemo(() => {
    const bundleMap = new Map()
    const singleMap = new Map()
    cartItems.forEach(c => {
      if (c.bundleId) {
        if (!bundleMap.has(c.bundleId)) {
          bundleMap.set(c.bundleId, { bundleId: c.bundleId, bundleName: c.bundleName, productGroups: new Map() })
        }
        const bg = bundleMap.get(c.bundleId)
        if (!bg.productGroups.has(c.product.id)) {
          bg.productGroups.set(c.product.id, { product: c.product, items: [] })
        }
        bg.productGroups.get(c.product.id).items.push(c)
      } else {
        if (!singleMap.has(c.product.id)) {
          singleMap.set(c.product.id, { product: c.product, items: [] })
        }
        singleMap.get(c.product.id).items.push(c)
      }
    })
    return {
      bundleGroups: [...bundleMap.values()].map(b => ({ ...b, products: [...b.productGroups.values()] })),
      singleGroups: [...singleMap.values()],
    }
  }, [cartItems])

  const cartGroups = singleGroups // eski nomi bilan ham ishlaydi (pastda ishlatilgan)
  const { productImages } = useSettingsStore()

  // Guruh uchun umumiy narxni hisoblash
  const getGroupPrice = (group) => group.items.reduce((sum, c) =>
    sum + (c.salePrice !== null && c.salePrice !== undefined ? c.salePrice : group.product.cashPrice), 0)

  return (
    <motion.div
      key="new_sale"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex flex-col lg:flex-row gap-3 sm:gap-6"
    >
      {/* LEFT PANEL */}
      <div className="flex flex-col gap-3 sm:gap-6 lg:w-[45%]">
        <div className="bg-bg-primary border border-border rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-sm">
          <div>
            <h4 className="text-text-primary font-syne font-bold mb-2 sm:mb-4 flex items-center gap-2">
              <Barcode className="text-accent-red" size={20} /> {t('sl_ns_barcode_title')}
            </h4>
            <BarcodeScanner onScan={addToCart} user={user} addNotification={addNotification} notificationSettings={notificationSettings} />
          </div>
          <div className="pt-4 sm:pt-6 border-t border-border/50">
            <h4 className="text-text-primary font-syne font-bold mb-2 sm:mb-4 flex items-center gap-2">
              <Search className="text-accent-blue" size={20} /> {t('sl_ns_search_title')}
            </h4>
            <ProductSearch onAdd={addToCart} onBundleAdd={addBundleToCart} cartItems={cartItems} user={user} addNotification={addNotification} notificationSettings={notificationSettings} />
          </div>
        </div>

        {/* SAVAT — bundle + oddiy */}
        {(bundleGroups.length > 0 || cartGroups.length > 0) && (
          <div className="bg-bg-primary border border-border rounded-3xl p-4 sm:p-6 space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-text-primary font-syne font-bold flex items-center gap-2">
                <ShoppingCart size={18} className="text-accent-red" />
                Savat tarkibi ({cartItems.length} ta)
              </h4>
              <button onClick={clearCart} className="text-text-muted hover:text-accent-red transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto no-scrollbar">
              {/* Bundle bloklari */}
              {bundleGroups.map(bundle => (
                <div key={bundle.bundleId} className="border border-accent-red/20 rounded-2xl overflow-hidden bg-accent-red/5">
                  <div className="flex items-center justify-between px-4 py-2 bg-accent-red/10 border-b border-accent-red/20">
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={13} className="text-accent-red" />
                      <span className="text-xs font-bold text-accent-red">{bundle.bundleName}</span>
                      <span className="text-[10px] text-text-muted">({bundle.products.reduce((s, g) => s + g.items.length, 0)} ta tovar)</span>
                    </div>
                    <button onClick={() => removeBundleFromCart(bundle.bundleId)} className="p-1 hover:text-accent-red text-text-muted transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="divide-y divide-border/40">
                    {bundle.products.map(group => {
                      const { product, items } = group
                      const count = items.length
                      const groupPrice = getGroupPrice(group)
                      return (
                        <div key={product.id} className="flex items-center gap-3 px-4 py-2">
                          <div className="w-7 h-7 bg-bg-secondary rounded-lg flex items-center justify-center text-xs font-bold text-text-secondary shrink-0">
                            {count}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-text-primary truncate">{product.name}</p>
                            <div className="flex items-center gap-1.5">
                              <p className="text-[10px] text-accent-red font-bold">{formatPrice(groupPrice, som)}</p>
                              {items.some(c => c.salePrice != null && c.salePrice < c.product.cashPrice) && (
                                <p className="text-[9px] text-text-muted line-through">{formatPrice(product.cashPrice * count, som)}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
              {/* Oddiy itemlar */}
              {cartGroups.map((group) => {
                const { product, items } = group
                const count = items.length
                const hasWarning = items.some(c => c.warning === 'not_printed')
                const installMinPrice = paymentType === 'installment' ? (product.installmentBasePrice || 0) * count : 0
                const groupMinPrice = Math.max((product.minSalePrice ?? 0) * count, installMinPrice)
                const groupPrice = getGroupPrice(group)
                const hasGroupWarning = priceWarnings[`grp_${product.id}`]

                return (
                  <motion.div key={product.id} layout className="flex items-start gap-3 bg-bg-secondary border border-border rounded-2xl px-4 py-3 group">
                    <div className="relative w-10 h-10 shrink-0 mt-0.5">
                      {productImages[String(product.id)]?.[0] ? (
                        <ProductImageViewer productId={product.id} size="md" className="w-10 h-10" />
                      ) : (
                        <div className="w-10 h-10 bg-bg-tertiary rounded-xl flex items-center justify-center text-accent-red font-bold text-sm">
                          {count}
                        </div>
                      )}
                      {productImages[String(product.id)]?.[0] && (
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent-red text-white rounded-full text-[10px] font-bold flex items-center justify-center leading-none">
                          {count}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-text-primary line-clamp-2 [overflow-wrap:anywhere]">{product.name}</p>
                      {hasWarning && (
                        <span className="inline-flex items-center gap-1 text-[9px] bg-accent-orange/10 text-accent-orange px-1.5 py-0.5 rounded-md font-bold mt-0.5">
                          <AlertCircle size={9} /> Barkod chop etilmagan
                        </span>
                      )}
                      {/* Barkodlar: chop qilingan / chop qilinmagan — 2 ustun */}
                      {(() => {
                        const withBarcode = items.filter(c => c.item.barcode)
                        if (!withBarcode.length) return null
                        const printed = withBarcode.filter(c => c.item.barcodeStatus === 'printed' || c.item.barcodeStatus === 'downloaded')
                        const notPrinted = withBarcode.filter(c => c.item.barcodeStatus === 'active')
                        const hasBoth = printed.length > 0 && notPrinted.length > 0
                        if (hasBoth) {
                          return (
                            <div className="mt-1.5 grid grid-cols-2 gap-x-2 text-[9px]">
                              <div>
                                <p className="text-accent-green font-bold text-[8px] uppercase mb-0.5">✓ Chop qilingan</p>
                                {printed.map(c => <p key={c.item.id} className="font-mono text-text-secondary">{c.item.barcode}</p>)}
                              </div>
                              <div>
                                <p className="text-accent-orange font-bold text-[8px] uppercase mb-0.5">✗ Chop qilinmagan</p>
                                {notPrinted.map(c => <p key={c.item.id} className="font-mono text-accent-orange">{c.item.barcode}</p>)}
                              </div>
                            </div>
                          )
                        }
                        return (
                          <div className="mt-1 flex flex-wrap gap-x-2">
                            {withBarcode.map(c => (
                              <p key={c.item.id} className={`text-[9px] font-mono ${notPrinted.includes(c) ? 'text-accent-orange' : 'text-text-secondary'}`}>
                                {c.item.barcode}
                              </p>
                            ))}
                          </div>
                        )
                      })()}
                      <div className="mt-1.5 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <input
                            type="number"
                            key={`${product.id}-${groupPrice}`}
                            defaultValue={groupPrice}
                            onFocus={(e) => e.target.select()}
                            onBlur={(e) => {
                              const val = Number(e.target.value)
                              const min = groupMinPrice
                              if (!val || (min > 0 && val < min)) {
                                e.target.value = groupPrice
                                setPriceWarnings(prev => ({ ...prev, [`grp_${product.id}`]: true }))
                                setTimeout(() => setPriceWarnings(prev => ({ ...prev, [`grp_${product.id}`]: false })), 3000)
                              } else {
                                setPriceWarnings(prev => ({ ...prev, [`grp_${product.id}`]: false }))
                                updateGroupSalePrice(product.id, val)
                              }
                            }}
                            className="w-28 text-xs font-bold px-2 py-1 rounded-lg border bg-bg-tertiary border-border text-accent-red focus:outline-none"
                          />
                          <span className="text-[10px] text-text-secondary">{som}</span>
                          {count > 1 && <span className="text-[9px] text-text-secondary">({count} ta uchun)</span>}
                        </div>
                        {hasGroupWarning && (
                          <p className="text-[9px] text-accent-red font-bold">Minimum narxdan past!</p>
                        )}
                        {groupMinPrice > 0 && (
                          <p className="text-[9px] text-text-secondary">
                            min: {formatPrice(groupMinPrice, som)}
                            {paymentType === 'installment' && installMinPrice > (product.minSalePrice ?? 0) * count && ' (muddatli)'}
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Son kontroli */}
                    <div className="flex items-center gap-1 mt-0.5 shrink-0">
                      <button
                        onClick={() => removeFromCart(items[items.length - 1].item.id)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg bg-bg-tertiary border border-border text-text-muted hover:text-accent-red hover:border-accent-red transition-all"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="text-xs font-bold text-text-primary w-5 text-center">{count}</span>
                      <button
                        onClick={() => addNextItemOfProduct(product)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg bg-bg-tertiary border border-border text-text-muted hover:text-accent-green hover:border-accent-green transition-all"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                    <button onClick={() => items.forEach(c => removeFromCart(c.item.id))} className="p-1.5 text-text-muted hover:text-accent-red transition-all flex-shrink-0 mt-0.5">
                      <X size={16} />
                    </button>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="flex flex-col lg:w-[55%] bg-bg-secondary border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto no-scrollbar">
          {/* Customer */}
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 sm:mb-3 block">{t('col_customer')}</label>
            {selectedCustomer ? (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-bg-tertiary border border-border rounded-2xl overflow-hidden">
                <div className="p-4 flex items-center justify-between bg-bg-secondary border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-accent-blue/15 text-accent-blue rounded-xl flex items-center justify-center font-extrabold text-base flex-shrink-0">
                      {selectedCustomer.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary">{selectedCustomer.name}</p>
                      <p className="text-xs text-text-muted">{selectedCustomer.phone}</p>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedCustomer(null); setSource('walk_in'); setLoyaltyDiscountApplied(false); setPendingDiscountReqId && setPendingDiscountReqId(null) }} className="text-text-muted hover:text-accent-red transition-colors p-1">
                    <X size={18} />
                  </button>
                </div>
                {(() => {
                  const cSales = (salesList || []).filter(s => s.customerId === selectedCustomer.id && s.status !== 'cancelled')
                  const qualifiedCount = cSales.filter(s => s.total >= loyaltyMinAmount).length
                  const totalSpent = cSales.reduce((sum, s) => sum + (s.total || 0), 0)
                  const isGold = qualifiedCount >= loyaltyVisitsRequired
                  return (
                    <div className="grid grid-cols-3 divide-x divide-border">
                      <div className="p-3 text-center"><p className="text-base font-extrabold text-text-primary">{cSales.length}</p><p className="text-[10px] text-text-muted">{t('sl_ns_visits')}</p></div>
                      <div className="p-3 text-center"><p className="text-base font-extrabold text-accent-green">{isGold ? 'GOLD' : `${qualifiedCount}/${loyaltyVisitsRequired}`}</p><p className="text-[10px] text-text-muted">{t('sl_ns_loyalty')}</p></div>
                      <div className="p-3 text-center"><p className="text-base font-extrabold text-text-primary truncate px-1">{(totalSpent / 1000000).toFixed(1)}M</p><p className="text-[10px] text-text-muted">{t('sl_ns_total_stat')}</p></div>
                    </div>
                  )
                })()}
                {loyaltyInfo && (loyaltyInfo.discountPercent > 0 || loyaltyInfo.cashbackPercent > 0 || loyaltyInfo.balance !== 0 || loyaltyInfo.nextDiscount) && (
                  <div className="px-3 py-2 border-t border-border flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                    {loyaltyInfo.discountPercent > 0 && <span className="text-accent-green font-bold">{t('sl_loy_discount', { n: loyaltyInfo.discountPercent })}</span>}
                    {loyaltyInfo.cashbackPercent > 0 && <span className="text-accent-blue font-bold">{t('sl_loy_cashback', { n: loyaltyInfo.cashbackPercent })}</span>}
                    {loyaltyInfo.balance !== 0 && <span className={`font-bold ${loyaltyInfo.balance > 0 ? 'text-accent-orange' : 'text-accent-red'}`}>{t('sl_loy_balance', { n: formatPrice(loyaltyInfo.balance, som) })}</span>}
                    {loyaltyInfo.nextDiscount && <span className="text-text-muted">{t('sl_loy_next', { n: loyaltyInfo.nextDiscount.percent, left: formatPrice(loyaltyInfo.nextDiscount.left, som) })}</span>}
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} placeholder={t('sl_ns_search_customer')}
                      className="w-full pl-9 pr-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-accent-blue" />
                  </div>
                  <button onClick={() => setShowNewCustomerModal(true)} title={t('sl_ns_add_customer')}
                    className="sm:hidden shrink-0 w-10 border border-dashed border-border rounded-xl text-text-muted hover:text-accent-blue hover:border-accent-blue flex items-center justify-center">
                    <UserPlus size={16} />
                  </button>
                </div>
                {customerSearch && filteredCustomers.length > 0 && (
                  <div className="bg-bg-tertiary border border-border rounded-xl max-h-32 overflow-y-auto no-scrollbar">
                    {filteredCustomers.map(c => (
                      <button key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setSource('repeat') }}
                        className="w-full text-left px-4 py-2 text-xs text-text-primary hover:bg-border transition-colors flex justify-between">
                        <span>{c.name}</span><span className="text-text-muted">{c.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => setShowNewCustomerModal(true)}
                  className="hidden sm:flex w-full py-2.5 border border-dashed border-border rounded-xl text-xs text-text-muted hover:text-accent-blue hover:border-accent-blue transition-all items-center justify-center gap-2">
                  <UserPlus size={14} /> {t('sl_ns_add_customer')}
                </button>
              </div>
            )}
          </div>

          {/* Loyalty va chegirma — muddatli to'lovda yashiriladi */}
          {paymentType !== 'installment' && (
            <>
              {customerHasLoyalty && (
                <button onClick={() => { setLoyaltyDiscountApplied(!loyaltyDiscountApplied) }}
                  className={`w-full py-2.5 px-4 rounded-2xl border text-sm font-bold transition-all flex items-center justify-between ${loyaltyDiscountApplied ? 'bg-accent-green/10 border-accent-green text-accent-green' : 'bg-bg-tertiary border-border text-text-secondary hover:border-accent-green hover:text-accent-green'}`}>
                  <span className="flex items-center gap-2"><Star size={14} />{t('sl_ns_loyalty_btn')}</span>
                  <span>{loyaltyTierPercent}%{loyaltyDiscountApplied ? ` ${t('sl_ns_loyalty_active')}` : ` ${t('sl_ns_loyalty_use')}`}</span>
                </button>
              )}

              <div className={loyaltyActive ? 'opacity-40 pointer-events-none' : ''}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('sl_ns_discount_label')}</label>
                  <span className="text-xs font-bold text-accent-red">{discountPercent}%</span>
                </div>
                <input type="range" min="0" max={maxDiscount} value={discountPercent}
                  disabled={loyaltyActive || !!pendingDiscountReqId}
                  onChange={(e) => handleDiscountChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent-red disabled:cursor-not-allowed" />
              </div>

              {pendingDiscountReqId && (
                <div className="flex items-center gap-2 p-3 bg-accent-orange/10 border border-accent-orange/30 rounded-xl">
                  <div className="w-3 h-3 rounded-full border-2 border-accent-orange border-t-transparent animate-spin shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-accent-orange">{t('sl_ns_pending_banner')}</p>
                    <p className="text-[10px] text-text-muted">{t('sl_ns_pending_info')}</p>
                  </div>
                  <button onClick={() => { updateNotification(pendingDiscountReqId, { status: 'rejected' }); setPendingDiscountReqId(null) }}
                    className="text-[10px] text-accent-red font-bold hover:underline shrink-0">{t('sl_ns_pending_cancel')}</button>
                </div>
              )}
            </>
          )}

          {customerBalance > 0 && paymentType !== 'installment' && cartItems.length > 0 && (
            <div className={`rounded-2xl border p-3 space-y-2 ${useBalance ? 'border-accent-orange bg-accent-orange/5' : 'border-border bg-bg-tertiary'}`}>
              <label className="flex items-center justify-between gap-2 cursor-pointer">
                <span className="flex items-center gap-2 text-sm font-bold text-text-primary">
                  <input type="checkbox" checked={useBalance} onChange={e => {
                    setUseBalance(e.target.checked)
                    if (e.target.checked) setBalanceInput(String(Math.min(Math.floor(customerBalance), Math.round(total))))
                  }} />
                  {t('sl_loy_pay_from_balance')}
                </span>
                <span className="text-xs text-accent-orange font-bold">{formatPrice(customerBalance, som)}</span>
              </label>
              {useBalance && (
                <input type="number" min="0" value={balanceInput} onChange={e => setBalanceInput(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-orange" />
              )}
            </div>
          )}

          {/* Payment Methods */}
          <div className="space-y-2 sm:space-y-3">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted block">{t('sl_ns_payment_label')}</label>
            <div className="grid grid-cols-4 sm:grid-cols-2 gap-1.5 sm:gap-2">
              {[
                { id: 'cash', icon: Banknote, label: t('pay_cash') },
                { id: 'card', icon: CreditCard, label: t('pay_card') },
                { id: 'installment', icon: Calendar, label: t('pay_installment') },
                { id: 'transfer', icon: ArrowRight, label: t('sl_ns_pay_transfer') },
              ].map(pm => (
                <button key={pm.id} onClick={() => { setPaymentType(pm.id); if (pm.id !== 'installment') setInstallmentOrgId('') }}
                  className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-3 px-1 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl border transition-all text-center sm:text-left ${paymentType === pm.id ? 'bg-accent-red text-white border-accent-red shadow-glow-red' : 'bg-bg-tertiary border-border text-text-secondary hover:border-text-primary'}`}>
                  <pm.icon size={18} className="flex-shrink-0" /><span className="text-[10px] sm:text-xs font-bold leading-tight">{pm.label}</span>
                </button>
              ))}
            </div>

            {paymentType === 'card' && (
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'uzcard', label: 'UzCard' },
                  { id: 'humo', label: 'Humo' },
                  { id: 'visa', label: 'Visa' },
                  { id: 'mastercard', label: 'Mastercard' },
                ].map(ct => (
                  <button key={ct.id} onClick={() => setCardType(cardType === ct.id ? null : ct.id)}
                    className={`px-3 py-2 rounded-xl border text-[11px] font-bold transition-all ${cardType === ct.id ? 'bg-accent-red text-white border-accent-red' : 'bg-bg-tertiary border-border text-text-secondary hover:border-text-primary'}`}>
                    {ct.label}
                  </button>
                ))}
              </div>
            )}

            {paymentType === 'transfer' && (
              <div className="bg-bg-tertiary border border-border rounded-2xl p-4 space-y-3">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted block">{t('inc_contract_number')}</label>
                <input value={contractNumber} onChange={(e) => setContractNumber(e.target.value)} placeholder={t('sl_contract_ph')}
                  className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-xl text-xs text-text-primary focus:outline-none" />
              </div>
            )}

            {paymentType === 'installment' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="bg-bg-tertiary border border-border rounded-2xl p-4 space-y-4 overflow-hidden">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted block">{t('sl_ns_org_label')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {installmentOrganizations.filter(o => o.isActive !== false).map(o => (
                      <button key={o.id} type="button" onClick={() => setInstallmentOrgId(o.id)}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-center leading-tight ${installmentOrgId === o.id ? 'bg-accent-blue text-white border-accent-blue shadow-glow-blue' : 'bg-bg-secondary border-border text-text-secondary hover:border-text-primary'}`}>
                        {o.name}
                      </button>
                    ))}
                  </div>
                </div>
                {installmentOrgId && (() => {
                  const selOrg = installmentOrganizations.find(o => o.id === installmentOrgId)
                  const maxM = selOrg?.maxTermMonths || 12
                  const termOptions = selOrg?.availableTerms?.length > 0
                    ? selOrg.availableTerms.map(v => ({ value: v, label: v === 0.25 ? '1 Hafta' : v === 0.5 ? '2 Hafta' : `${v} oy` }))
                    : maxM <= 1
                      ? [{ value: 0.25, label: '1 Hafta' }, { value: 0.5, label: '2 Hafta' }, { value: 1, label: '1 oy' }]
                      : [3, 6, 12, 24].filter(m => m <= maxM).map(m => ({ value: m, label: `${m} oy` }))
                  return (
                    <div className="space-y-2 pt-2 border-t border-border/50">
                      <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted block">{t('sl_ns_term_label')}</label>
                      <div className={`grid gap-2 ${termOptions.length <= 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                        {termOptions.map(opt => (
                          <button key={opt.value} type="button" onClick={() => setInstallmentTermMonths(opt.value)}
                            className={`py-1.5 rounded-lg text-xs font-bold transition-all ${installmentTermMonths === opt.value ? 'bg-accent-blue text-white' : 'bg-bg-secondary text-text-secondary border border-border'}`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      {/* Muddatli to'lov: bir xil tovarlar guruhlanib ko'rsatiladi */}
                      <div className="space-y-1.5 pt-2">
                        {cartGroups.map(group => {
                          const base = getGroupPrice(group)
                          const label = group.items.length > 1
                            ? `${group.product.name} (${group.items.length} ta)`
                            : group.product.name
                          return (
                            <div key={group.product.id} className="flex justify-between text-[10px] text-text-secondary">
                              <span className="truncate pr-2">{label}</span>
                              <span className="font-bold whitespace-nowrap">{formatPrice(Math.round(base / installmentTermMonths), som)}/oy</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
              </motion.div>
            )}
          </div>

          {/* Source */}
          <div className="space-y-2 sm:space-y-3">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted block">{t('sl_ns_source_label')}</label>
            <div className="flex sm:grid sm:grid-cols-3 gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
              {sources.filter(s => s.isActive !== false).map(s => (
                <button key={s.id} type="button" onClick={() => setSource(s.id)}
                  className={`shrink-0 whitespace-nowrap sm:whitespace-normal px-3 py-1.5 sm:py-2 rounded-xl border transition-all text-center text-[11px] sm:text-xs font-bold ${source === s.id ? 'bg-accent-red text-white border-accent-red' : 'bg-bg-tertiary border-border text-text-secondary hover:border-text-primary'}`}>
                  {t('source_' + s.id, { defaultValue: s.label })}
                </button>
              ))}
            </div>
          </div>

          {/* Trade-in */}
          <div className="space-y-3 pt-3 sm:pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted block">{t('sl_ns_tradein_label')}</label>
              <button type="button" onClick={addTradeInRow} className="text-[10px] font-bold text-accent-blue hover:underline flex items-center gap-1">
                <Plus size={12} /> {t('sl_ns_tradein_add')}
              </button>
            </div>
            {tradeInItems.map((ti, idx) => (
              <div key={ti.id} className="bg-bg-tertiary border border-border rounded-2xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input value={ti.name} onChange={(e) => updateTradeInRow(idx, { name: e.target.value })} placeholder={t('col_product_name')}
                    className="flex-1 px-3 py-2 bg-bg-secondary border border-border rounded-xl text-xs text-text-primary focus:outline-none" />
                  <button onClick={() => removeTradeInRow(idx)} className="text-text-muted hover:text-accent-red transition-colors p-1"><X size={14} /></button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <select value={ti.category} onChange={(e) => updateTradeInRow(idx, { category: e.target.value })}
                    className="px-2 py-2 bg-bg-secondary border border-border rounded-xl text-xs text-text-primary focus:outline-none">
                    {productCategories.map(c => <option key={c.id} value={c.id}>{t('cat_' + c.id, { defaultValue: c.label })}</option>)}
                  </select>
                  <input type="number" min="1" value={ti.qty} onChange={(e) => updateTradeInRow(idx, { qty: Number(e.target.value) })} placeholder={t('sl_ns_tradein_qty_ph')}
                    className="px-2 py-2 bg-bg-secondary border border-border rounded-xl text-xs text-text-primary focus:outline-none" />
                  <input type="number" min="0" value={ti.price || ''} onFocus={(e) => e.target.select()} onChange={(e) => updateTradeInRow(idx, { price: Number(e.target.value) || 0 })} placeholder={t('col_total_sum')}
                    className="px-2 py-2 bg-bg-secondary border border-border rounded-xl text-xs text-text-primary focus:outline-none" />
                </div>
                {/* O'rniga olingan tovar — guruhlanib ko'rsatiladi */}
                {cartGroups.length > 0 && (
                  <select value={ti.replacedProductId} onChange={(e) => updateTradeInRow(idx, { replacedProductId: e.target.value })}
                    className="w-full px-2 py-2 bg-bg-secondary border border-border rounded-xl text-xs text-text-primary focus:outline-none">
                    <option value="">{t('sl_ns_tradein_replaced_ph')}</option>
                    {cartGroups.map(group => (
                      <option key={group.product.id} value={group.product.id}>
                        {group.product.name}{group.items.length > 1 ? ` (${group.items.length} ta)` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
            {tradeInItems.length > 0 && (
              <div className="flex justify-between text-xs px-1">
                <span className="text-text-muted">{t('sl_ns_tradein_total')}</span>
                <span className="text-accent-orange font-bold">-{formatPrice(tradeInTotal, som)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Total & Checkout */}
        <div className="p-4 sm:p-6 bg-bg-tertiary border-t border-border space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">{t('sl_ns_subtotal')}</span>
              <span className="text-text-primary font-medium">{formatPrice(subtotal, som)}</span>
            </div>
            {promoDiscount > 0 && !loyaltyActive && (
              <div className="flex justify-between text-xs">
                <span className="text-accent-orange font-bold">🏷️ Aksiya -{promoDiscount}%</span>
                <span className="text-accent-orange font-medium">-{formatPrice(subtotal * promoDiscount / 100, som)}</span>
              </div>
            )}
            {effectiveDiscount > 0 && paymentType !== 'installment' && (
              <div className="flex justify-between text-xs">
                <span className="text-accent-red">{loyaltyActive ? t('sl_ns_loyalty_discount_row', { n: effectiveDiscount }) : t('sl_ns_discount_row', { n: effectiveDiscount })}</span>
                <span className="text-accent-red font-medium">-{formatPrice(discountAmount, som)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-border/50">
              <span className="text-base font-syne font-extrabold text-text-primary">{t('sl_ns_total_label')}</span>
              <span className="text-base font-syne font-extrabold text-accent-green">{formatPrice(total, som)}</span>
            </div>
            {balanceUsed > 0 && (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-accent-orange">{t('sl_loy_balance_row')}</span>
                  <span className="text-accent-orange font-medium">-{formatPrice(balanceUsed, som)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-syne font-extrabold text-text-primary">{t('sl_loy_payable')}</span>
                  <span className="text-sm font-syne font-extrabold text-accent-green">{formatPrice(payable, som)}</span>
                </div>
              </>
            )}
            {cashbackPreview > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-accent-blue">{t('sl_loy_cashback_row', { n: loyaltyInfo?.cashbackPercent })}</span>
                <span className="text-accent-blue font-medium">+{formatPrice(cashbackPreview, som)}</span>
              </div>
            )}
            {tradeInTotal > 0 && (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-accent-orange">{t('sl_ns_tradein_row')}</span>
                  <span className="text-accent-orange font-medium">-{formatPrice(tradeInTotal, som)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border/50">
                  <span className="text-sm font-syne font-extrabold text-text-primary">{t('sl_ns_cash_needed')}</span>
                  <span className="text-sm font-syne font-extrabold text-accent-green">{formatPrice(Math.max(0, payable - tradeInTotal), som)}</span>
                </div>
              </>
            )}
          </div>
          <button ref={sellBtnRef} onClick={handleSubmitSale}
            disabled={sellDisabled}
            className="w-full py-3 sm:py-4 bg-accent-green text-white font-syne font-extrabold text-base rounded-2xl hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm">
            {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>{t('sl_ns_sell_btn')} <ArrowRight size={18} /></>}
          </button>
        </div>
      </div>

      <MobileSellBar targetRef={sellBtnRef} count={cartItems.length} payLabel={payLabel} total={payable}
        onSell={handleSubmitSale} disabled={sellDisabled} submitting={isSubmitting} label={t('sl_ns_sell_btn')} resetKey={cartItems.length > 0} />
    </motion.div>
  )
}

export default NewSaleTab
