import { motion } from 'framer-motion'
import { X, Search, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import BarcodeScanner from '../../../components/sales/BarcodeScanner'
import SaleItemSearch from '../../../components/sales/SaleItemSearch'
import ProductSearch from '../../../components/sales/ProductSearch'

const formatPrice = (price, som) => Math.round(price).toLocaleString('uz-UZ') + ' ' + som

const ReturnsTab = ({ ctx }) => {
  const { t } = useTranslation()
  const som = t('unit_som')
  const {
    user, addNotification, notificationSettings,
    handleLeftItemFound, handleSelectSaleItem,
    salesList, selectedShopId, allCustomers,
    customerSearch, setCustomerSearch, filteredCustomers,
    returnCustomer, setReturnCustomer,
    returnSale, setReturnSale,
    returnItems, setReturnItems,
    setExchangeItems,
    returnLinkCust, setReturnLinkCust,
    returnLinkConfirm, setReturnLinkConfirm,
    returnQtyMap, setReturnQtyMap,
    returnMode, setReturnMode,
    returnReason, setReturnReason,
    returnPaymentMethod, setReturnPaymentMethod,
    exchangeItems, barcodeSelectClass, getItemBarcode,
    handleRightScanOrSearch, handleReturnSubmit,
    fetchData, bump, addCustomer, sources,
  } = ctx

  return (
    <motion.div
      key="returns"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex flex-col lg:flex-row gap-6"
    >
      {/* CHAP USTUN */}
      <div className="flex flex-col gap-6 lg:w-[50%] bg-bg-primary border border-border rounded-3xl p-6 shadow-sm">
        <h3 className="font-syne font-bold text-text-primary text-base border-b border-border/50 pb-2">{t('sl_ret_left_title')}</h3>

        <div className="space-y-4">
          <div className="space-y-4 bg-bg-secondary p-4 border border-border rounded-2xl">
            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('sl_ret_barcode_label')}</label>
              <BarcodeScanner allowSold={true} onScan={handleLeftItemFound} user={user} addNotification={addNotification} notificationSettings={notificationSettings} />
            </div>
            <div className="pt-4 border-t border-border/40">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('sl_ret_search_label')}</label>
              <SaleItemSearch
                salesList={selectedShopId === 'all' ? salesList : salesList.filter(s => s.shopId === selectedShopId)}
                onSelectSaleItem={handleSelectSaleItem}
                allCustomers={allCustomers}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('sl_ret_customer_label')}</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder={t('sl_ret_customer_ph')}
                className="w-full pl-9 pr-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-accent-blue"
              />
            </div>
            {customerSearch && filteredCustomers.length > 0 && (
              <div className="bg-bg-tertiary border border-border rounded-xl max-h-32 overflow-y-auto no-scrollbar mt-1">
                {filteredCustomers.map(c => (
                  <button key={c.id}
                    onClick={() => { setReturnCustomer(c); setReturnSale(null); setReturnItems([]); setCustomerSearch('') }}
                    className="w-full text-left px-4 py-2 text-xs text-text-primary hover:bg-border transition-colors flex justify-between">
                    <span>{c.name}</span><span className="text-text-muted">{c.phone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {returnCustomer && !returnSale && (
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted block">{t('sl_ret_purchases_label')}</label>
              <div className="max-h-48 overflow-y-auto border border-border rounded-2xl divide-y divide-border bg-bg-tertiary">
                {salesList.filter(s => s.customerId === returnCustomer.id && s.status !== 'cancelled').map(sale => {
                  const isInstallment = sale.paymentType === 'installment'
                  return (
                    <button key={sale.id}
                      onClick={() => { setReturnSale(sale); setReturnItems([]); setReturnPaymentMethod(sale.paymentType === 'installment' ? 'cash' : sale.paymentType) }}
                      className={`w-full text-left px-4 py-3 transition-colors flex justify-between items-center text-xs ${isInstallment ? 'opacity-60 cursor-default bg-accent-red/5' : 'hover:bg-border'}`}>
                      <div>
                        <p className="font-bold text-text-primary">{new Date(sale.soldAt).toLocaleDateString('uz-UZ')}</p>
                        <p className="text-text-muted mt-0.5">{sale.items.map(i => i.name).join(', ')}</p>
                        {isInstallment && <p className="text-[10px] text-accent-red font-bold mt-0.5">{t('sl_ret_installment_badge')}</p>}
                      </div>
                      <span className="font-bold text-accent-green">{formatPrice(sale.total, som)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {returnSale && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-bg-secondary border border-border rounded-2xl p-4 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-text-muted uppercase font-bold">{t('sl_ret_selected_sale')}</p>
                  <p className="text-sm font-bold text-text-primary font-mono">{returnSale.id}</p>
                </div>
                <button onClick={() => { setReturnCustomer(null); setReturnSale(null); setReturnItems([]); setExchangeItems([]) }}
                  className="text-text-muted hover:text-accent-red"><X size={16} /></button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-text-muted">{t('sl_ret_sale_date')}</span><p className="font-medium text-text-primary">{new Date(returnSale.soldAt).toLocaleString('uz-UZ')}</p></div>
                <div><span className="text-text-muted">{t('sl_ret_sale_payment')}</span>
                  <p className="font-medium uppercase text-text-primary">
                    {returnSale.paymentType === 'cash' ? t('pay_cash') : returnSale.paymentType === 'card' ? t('pay_card') : returnSale.paymentType === 'installment' ? t('sl_tab_installment') : t('sl_ret_pay_bank')}
                  </p>
                </div>
                <div><span className="text-text-muted">{t('sl_ret_sale_total')}</span><p className="font-medium text-accent-green">{formatPrice(returnSale.total, som)}</p></div>
                <div><span className="text-text-muted">{t('sl_ret_sale_discount')}</span>
                  <p className="font-medium text-accent-red">
                    {(() => {
                      if (returnSale.discount > 0) {
                        const amt = Math.round((returnSale.subtotal || returnSale.total) * returnSale.discount / 100)
                        return <>{returnSale.discount}%<span className="text-xs ml-1 text-text-muted font-normal">(-{formatPrice(amt, som)})</span></>
                      }
                      const existing = Number(returnSale.bundleDiscountAmount) || 0
                      if (existing > 0 || returnSale.isBundle) {
                        return <>{returnSale.bundleDiscountPercent > 0 ? `${returnSale.bundleDiscountPercent}%` : 'Komplekt'}<span className="text-xs ml-1 text-text-muted font-normal">(-{formatPrice(existing, som)})</span></>
                      }
                      // Auto-detect bundle from localStorage
                      try {
                        const ab = JSON.parse(localStorage.getItem('shina_crm_bundles') || '[]').filter(b => b.isActive)
                        const saleNames = new Set((returnSale.items || []).map(it => (it.productName || it.name || '').trim()).filter(Boolean))
                        const matched = ab.find(b => b.products?.length > 0 && b.products.every(bp => {
                          const it = (returnSale.items || []).find(i => String(i.productId) === String(bp.productId))
                          const n = it ? (it.productName || it.name || '').trim() : null
                          return n ? saleNames.has(n) : false
                        }))
                        if (matched?.discount > 0) {
                          const tot = (returnSale.items || []).reduce((a, i) => a + (i.price || 0), 0)
                          const amt = Math.round(tot * matched.discount / (100 - matched.discount))
                          return <>{matched.discount}% Komplekt<span className="text-xs ml-1 text-text-muted font-normal">(-{formatPrice(amt, som)})</span></>
                        }
                      } catch {}
                      return <>0%</>
                    })()}
                  </p>
                </div>
                <div><span className="text-text-muted">{t('sl_ret_sale_customer')}</span><p className="font-medium text-text-primary">{returnSale.customerName || "Noma'lum"}</p></div>
                <div><span className="text-text-muted">{t('sl_ret_sale_employee')}</span><p className="font-medium text-text-primary">{returnSale.soldByName || '—'}</p></div>
              </div>

              {!returnSale.customerId && (
                <div className="bg-accent-orange/5 border border-accent-orange/20 rounded-xl p-3 space-y-3">
                  <p className="text-[10px] text-accent-orange font-bold flex items-center gap-1.5"><AlertCircle size={11} /> {t('sl_ret_no_customer_warn')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={returnLinkCust.name} onChange={e => setReturnLinkCust(p => ({ ...p, name: e.target.value }))}
                      placeholder={t('sl_ret_name_ph')} className="px-3 py-2 bg-bg-tertiary border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-accent-orange" />
                    <input value={returnLinkCust.phone} onChange={e => setReturnLinkCust(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+998 __ ___ __ __" className="px-3 py-2 bg-bg-tertiary border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-accent-orange" />
                  </div>
                  {returnLinkConfirm && (
                    <div className="p-3 bg-accent-orange/10 border border-accent-orange/40 rounded-xl space-y-2">
                      <p className="text-xs font-bold text-accent-orange">
                        {returnLinkConfirm.length === 1 ? t('sl_ret_found_single') : t('sl_ret_found_multi', { n: returnLinkConfirm.length })}
                      </p>
                      <div className="space-y-1 max-h-36 overflow-y-auto">
                        {returnLinkConfirm.map(c => (
                          <button key={c.id} onClick={async () => {
                            setReturnLinkConfirm(null)
                            const sale = salesList.find(s => s.id === returnSale.id)
                            if (sale) { sale.originalCustomerName = sale.customerName; sale.customerId = c.id; sale.customerName = c.name }
                            setReturnSale(prev => ({ ...prev, customerId: c.id, customerName: c.name, originalCustomerName: prev.customerName || "Noma'lum" }))
                            setReturnLinkCust({ name: '', phone: '+998' })
                            fetchData(); bump()
                          }} className="w-full text-left px-3 py-2 bg-bg-secondary border border-border rounded-lg text-xs text-text-primary hover:border-accent-orange hover:bg-accent-orange/5 transition-colors">
                            <span className="font-semibold">{c.name}</span>
                            <span className="text-text-muted ml-2">{c.phone || 'tel yo\'q'}</span>
                            {c.loyaltyLevel && <span className="ml-2 text-accent-orange">★ {c.loyaltyLevel}</span>}
                          </button>
                        ))}
                      </div>
                      <button onClick={async () => {
                        setReturnLinkConfirm(null)
                        const name = returnLinkCust.name.trim(); const phone = returnLinkCust.phone.trim()
                        const res = await addCustomer({ name, phone: phone || '+998' })
                        if (!res.success) return
                        const customer = res.customer
                        const sale = salesList.find(s => s.id === returnSale.id)
                        if (sale) { sale.originalCustomerName = sale.customerName; sale.customerId = customer.id; sale.customerName = customer.name }
                        setReturnSale(prev => ({ ...prev, customerId: customer.id, customerName: customer.name, originalCustomerName: prev.customerName || "Noma'lum" }))
                        setReturnLinkCust({ name: '', phone: '+998' })
                        fetchData(); bump()
                      }} className="w-full py-1.5 bg-bg-tertiary border border-accent-orange/40 text-accent-orange rounded-lg text-xs font-bold hover:bg-accent-orange/10 transition-colors">
                        {t('sl_ret_save_new')}
                      </button>
                    </div>
                  )}
                  {!returnLinkConfirm && returnLinkCust.name.trim().length >= 2 && (
                    <button onClick={async () => {
                      const name = returnLinkCust.name.trim(); const phone = returnLinkCust.phone.trim()
                      if (phone) {
                        const byPhone = allCustomers.find(c => c.phone === phone)
                        if (byPhone) {
                          const sale = salesList.find(s => s.id === returnSale.id)
                          if (sale) { sale.originalCustomerName = sale.customerName; sale.customerId = byPhone.id; sale.customerName = byPhone.name }
                          setReturnSale(prev => ({ ...prev, customerId: byPhone.id, customerName: byPhone.name, originalCustomerName: prev.customerName || "Noma'lum" }))
                          setReturnLinkCust({ name: '', phone: '+998' })
                          fetchData(); bump(); return
                        }
                      }
                      const byName = allCustomers.filter(c => c.name.toLowerCase() === name.toLowerCase())
                      if (byName.length > 0) { setReturnLinkConfirm(byName); return }
                      const res = await addCustomer({ name, phone: phone || '+998' })
                      if (!res.success) return
                      const customer = res.customer
                      const sale = salesList.find(s => s.id === returnSale.id)
                      if (sale) { sale.originalCustomerName = sale.customerName; sale.customerId = customer.id; sale.customerName = customer.name }
                      setReturnSale(prev => ({ ...prev, customerId: customer.id, customerName: customer.name, originalCustomerName: prev.customerName || "Noma'lum" }))
                      setReturnLinkCust({ name: '', phone: '+998' })
                      fetchData(); bump()
                    }} className="w-full py-2 bg-accent-orange text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity">
                      {t('save')}
                    </button>
                  )}
                </div>
              )}

              {returnSale.paymentType === 'installment' ? (
                <div className="p-3.5 bg-accent-red/10 border border-accent-red/30 rounded-xl text-accent-red flex items-start gap-2 animate-pulse">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div className="text-xs font-bold leading-normal">{t('sl_ret_installment_block')}</div>
                </div>
              ) : (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted block">
                    {t('sl_ret_items_label', { n: returnSale.items?.length || 0, total: formatPrice(returnSale.total, som) })}
                  </span>
                  {returnSale.items.map((it, idx) => {
                    const isChecked = returnItems.some(item => item.barcode === it.barcode)
                    const qty = returnQtyMap[it.barcode] || 1
                    return (
                      <div key={idx} className={`flex items-center justify-between gap-3 bg-bg-tertiary px-3 py-2 rounded-xl border ${isChecked ? 'border-accent-red' : 'border-border'} text-xs text-text-primary transition-all`}>
                        <label className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0">
                          <input type="checkbox" checked={isChecked} onChange={(e) => {
                            if (e.target.checked) setReturnItems(prev => [...prev, it])
                            else setReturnItems(prev => prev.filter(item => item.barcode !== it.barcode))
                          }} className="accent-accent-red" />
                          <div className="min-w-0">
                            <p className="font-bold truncate">{it.name || 'Tovar'}</p>
                            <p className={`text-[10px] text-text-muted font-mono ${barcodeSelectClass}`}>{it.barcode || getItemBarcode(it.itemId) || '—'} · {it.qty || 1} ta</p>
                          </div>
                        </label>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button type="button" onClick={() => { if (qty > 1) setReturnQtyMap(prev => ({ ...prev, [it.barcode]: qty - 1 })) }}
                            className="w-6 h-6 rounded-lg bg-bg-secondary hover:bg-border text-text-primary flex items-center justify-center font-bold transition-colors">-</button>
                          <input type="number" min={1} max={it.qty || 1} value={qty}
                            onChange={(e) => { let val = parseInt(e.target.value) || 1; if (val < 1) val = 1; if (val > (it.qty || 1)) val = it.qty || 1; setReturnQtyMap(prev => ({ ...prev, [it.barcode]: val })) }}
                            className="w-10 text-center py-0.5 bg-bg-secondary border border-border rounded-lg text-xs font-bold text-text-primary focus:outline-none focus:border-accent-red" />
                          <button type="button" onClick={() => { if (qty < (it.qty || 1)) setReturnQtyMap(prev => ({ ...prev, [it.barcode]: qty + 1 })) }}
                            className="w-6 h-6 rounded-lg bg-bg-secondary hover:bg-border text-text-primary flex items-center justify-center font-bold transition-colors">+</button>
                        </div>
                        <span className="font-bold whitespace-nowrap pl-2">{formatPrice(it.salePrice * qty, som)}</span>
                      </div>
                    )
                  })}
                  <div className="bg-bg-tertiary p-3 rounded-xl border border-border mt-3 text-right">
                    <span className="text-[10px] text-text-muted uppercase font-bold block mb-1">{t('sl_ret_refund_total_label')}</span>
                    <span className="text-base font-syne font-extrabold text-accent-red">
                      {formatPrice(Math.round(returnItems.reduce((sum, item) => sum + (item.salePrice || 0) * (returnQtyMap[item.barcode] || 1), 0) * (1 - (returnSale.discount || 0) / 100)), som)}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* O'NG USTUN */}
      <div className="flex flex-col gap-6 lg:w-[50%] bg-bg-primary border border-border rounded-3xl p-6 shadow-sm justify-between">
        <div>
          <h3 className="font-syne font-bold text-text-primary text-base border-b border-border/50 pb-2 mb-4">{t('sl_ret_right_title')}</h3>

          <div className="grid grid-cols-2 gap-2 mb-6">
            {['refund', 'exchange'].map(mode => (
              <button key={mode} disabled={returnSale?.paymentType === 'installment'} onClick={() => setReturnMode(mode)}
                className={`py-3 rounded-2xl border text-xs font-bold transition-all ${returnMode === mode ? 'bg-accent-red text-white border-accent-red shadow-glow-red' : 'bg-bg-tertiary border-border text-text-secondary hover:text-text-primary'} disabled:opacity-40 disabled:cursor-not-allowed`}>
                {mode === 'refund' ? t('sl_ret_refund_btn') : t('col_exchange')}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted block mb-2">
              {returnMode === 'refund' ? t('sl_ret_refund_reason') : t('sl_ret_exchange_reason')} <span className="text-text-muted font-normal">{t('sl_ret_reason_optional')}</span>
            </label>
            <textarea value={returnReason} onChange={e => setReturnReason(e.target.value)} placeholder={t('sl_ret_reason_ph')} rows={2}
              className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-red resize-none" />
          </div>

          {returnMode === 'refund' && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-text-muted uppercase font-bold block mb-2">{t('sl_ret_refund_method')}</span>
                <div className="grid grid-cols-3 gap-2">
                  {['cash', 'card', 'transfer'].map(method => {
                    const isActive = returnSale && returnSale.paymentType === method
                    return (
                      <button key={method} disabled={!isActive} onClick={() => setReturnPaymentMethod(method)}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${returnPaymentMethod === method ? 'bg-accent-red text-white border-accent-red shadow-glow-red' : 'bg-bg-tertiary border-border text-text-muted opacity-40 cursor-not-allowed'}`}>
                        {method === 'cash' ? t('pay_cash') : method === 'card' ? t('pay_card') : t('sl_ret_pay_bank')}
                      </button>
                    )
                  })}
                </div>
                <p className="text-[10px] text-text-muted mt-1.5">{t('sl_ret_refund_only_original')}</p>
              </div>
              <div className="bg-bg-tertiary p-5 rounded-2xl border border-border text-center">
                <p className="text-xs text-text-secondary font-bold">{t('sl_ret_refund_total')}</p>
                <h3 className="text-3xl font-syne font-extrabold text-accent-red mt-2">
                  {formatPrice(returnSale ? Math.round(returnItems.reduce((sum, item) => sum + (item.salePrice || 0) * (returnQtyMap[item.barcode] || 1), 0) * (1 - (returnSale.discount || 0) / 100)) : 0, som)}
                </h3>
              </div>
            </div>
          )}

          {returnMode === 'exchange' && (
            <div className="space-y-4">
              <div className="space-y-4 bg-bg-secondary p-4 border border-border rounded-2xl">
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('sl_ret_exchange_barcode_label')}</label>
                  <BarcodeScanner allowSold={false} onScan={handleRightScanOrSearch} user={user} addNotification={addNotification} notificationSettings={notificationSettings} />
                </div>
                <div className="pt-4 border-t border-border/40">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-2 block">{t('sl_ret_exchange_search_label')}</label>
                  <ProductSearch allowSold={false} onAdd={handleRightScanOrSearch} cartItems={exchangeItems.map(e => ({ item: e.item, product: e.product }))} user={user} addNotification={addNotification} notificationSettings={notificationSettings} />
                </div>
              </div>

              {exchangeItems.length > 0 && (
                <div className="space-y-2">
                  {exchangeItems.map((e, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-bg-secondary border border-border rounded-xl p-3 flex items-center gap-3 text-xs">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-text-primary truncate">{e.product.name}</p>
                        <p className={`text-[10px] text-text-muted font-mono ${barcodeSelectClass}`}>{e.item?.barcode || '—'}</p>
                        <p className="text-[10px] text-text-muted">{t('cat_' + e.product.category, { defaultValue: e.product.categoryLabel })} · {e.product.size}</p>
                        {e.item?.barcodeStatus === 'active' && (
                          <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-accent-orange/10 text-accent-orange rounded text-[9px] font-bold">{t('sl_ret_badge_no_barcode')}</span>
                        )}
                      </div>
                      <p className="font-bold text-text-primary whitespace-nowrap">{formatPrice(e.product.cashPrice, som)}</p>
                      <button type="button" onClick={() => setExchangeItems(prev => prev.filter((_, j) => j !== i))} className="text-accent-red text-[10px] font-bold hover:underline">✕</button>
                    </motion.div>
                  ))}
                </div>
              )}

              {returnSale && returnItems.length > 0 && (
                <div className="bg-bg-tertiary p-5 rounded-2xl border border-border text-center space-y-2">
                  {(() => {
                    const refundVal = Math.round(returnItems.reduce((sum, item) => sum + (item.salePrice || 0) * (returnQtyMap[item.barcode] || 1), 0) * (1 - (returnSale.discount || 0) / 100))
                    const exchangeVal = exchangeItems.reduce((sum, e) => sum + e.product.cashPrice, 0)
                    const diff = exchangeVal - refundVal
                    return (
                      <>
                        <p className="text-xs text-text-secondary font-bold">{t('sl_ret_diff_title')}</p>
                        {diff < 0 ? (
                          <>
                            <h3 className="text-3xl font-syne font-extrabold text-accent-green">{t('sl_ret_give_back', { amount: formatPrice(Math.abs(diff), som) })}</h3>
                            <div className="pt-3">
                              <span className="text-[10px] text-text-muted uppercase font-bold block mb-1">{t('sl_ret_pay_type')}</span>
                              <div className="flex gap-2 justify-center">
                                {['cash', 'card', 'transfer'].map(pm => {
                                  const isAllowed = returnSale?.paymentType === pm
                                  return (
                                    <button key={pm} disabled={!isAllowed} onClick={() => isAllowed && setReturnPaymentMethod(pm)}
                                      className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${returnPaymentMethod === pm && isAllowed ? 'bg-accent-green text-white border-accent-green' : isAllowed ? 'bg-bg-secondary text-text-secondary border-border hover:border-text-primary' : 'bg-bg-tertiary text-text-muted border-border opacity-30 cursor-not-allowed'}`}>
                                      {pm === 'cash' ? t('pay_cash') : pm === 'card' ? t('pay_card') : t('sl_ret_pay_bank')}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          </>
                        ) : diff > 0 ? (
                          <>
                            <h3 className="text-3xl font-syne font-extrabold text-accent-red">{t('sl_ret_take_more', { amount: formatPrice(diff, som) })}</h3>
                            <div className="pt-3">
                              <span className="text-[10px] text-text-muted uppercase font-bold block mb-1">{t('sl_ret_pay_type')}</span>
                              <div className="flex gap-2 justify-center">
                                {['cash', 'card', 'transfer'].map(pm => (
                                  <button key={pm} onClick={() => setReturnPaymentMethod(pm)}
                                    className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${returnPaymentMethod === pm ? 'bg-accent-red text-white border-accent-red shadow-glow-red' : 'bg-bg-secondary text-text-secondary border-border hover:border-text-primary'}`}>
                                    {pm === 'cash' ? t('pay_cash') : pm === 'card' ? t('pay_card') : t('sl_ret_pay_bank')}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          <h3 className="text-2xl font-syne font-extrabold text-text-primary">{t('sl_ret_equal')}</h3>
                        )}
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        {returnSale?.paymentType === 'installment' && (
          <div className="flex items-start gap-2 p-3.5 bg-accent-red/10 border border-accent-red/30 rounded-xl text-accent-red text-xs font-bold mt-4">
            <AlertCircle size={15} className="shrink-0 mt-0.5" /><span>{t('sl_ret_installment_warn')}</span>
          </div>
        )}
        <button onClick={handleReturnSubmit}
          disabled={!returnSale || returnSale.paymentType === 'installment' || returnItems.length === 0 || (returnMode === 'exchange' && exchangeItems.length === 0)}
          className="w-full mt-3 py-4 bg-accent-red text-white font-syne font-extrabold text-sm rounded-xl disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider shadow-glow-red hover:opacity-90 transition-opacity">
          {returnMode === 'refund' ? t('sl_ret_confirm_refund') : t('sl_ret_confirm_exchange')}
        </button>
      </div>
    </motion.div>
  )
}

export default ReturnsTab
