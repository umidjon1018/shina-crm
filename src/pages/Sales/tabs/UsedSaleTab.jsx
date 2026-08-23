import { motion } from 'framer-motion'
import { ArrowRight, Banknote, Calendar, CheckCircle, CreditCard, Plus, Recycle, Search, ShoppingCart, Trash2, UserPlus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const formatPrice = (price, som) => Math.round(price).toLocaleString('uz-UZ') + ' ' + som

const UsedSaleTab = ({ ctx }) => {
  const { t } = useTranslation()
  const som = t('unit_som')
  const {
    buScrapMode, setBuScrapMode, buScrapSelected, setBuScrapSelected,
    buScrapCategory, setBuScrapCategory, buScrapCategories, buScrapGroups,
    buAddScrapToCart, buSelectedCustomer, setBuSelectedCustomer,
    buCustomerSearch, setBuCustomerSearch, buFilteredCustomers,
    setBuShowNewCustomerModal, buSearch, setBuSearch, buAttrFilters, setBuAttrFilters,
    productAttributeDefs,
    buAvailableGroups, buGroupQty, setBuGroupQty, buAddToCart,
    buCart, setBuCart, buCartGroups, buRemoveGroupFromCart,
    buSetGroupTotalPrice, buSuccessSale, setBuSuccessSale,
    buDiscountPercent, setBuDiscountPercent, maxDiscount,
    buPaymentType, setBuPaymentType, buCardType, setBuCardType,
    buInstallmentOrgId, setBuInstallmentOrgId,
    buInstallmentTermMonths, setBuInstallmentTermMonths, installmentOrganizations,
    buContractNumber, setBuContractNumber, buSource, setBuSource, sources,
    buSubtotal, buDiscountAmount, buTotal, buIsSubmitting, buHandleSubmitSale,
  } = ctx

  return (
    <motion.div
      key="used_sale"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex flex-col lg:flex-row gap-6"
    >
      {/* LEFT PANEL */}
      <div className="flex flex-col gap-6 lg:w-[45%]">
        <div className="bg-bg-primary border border-border rounded-3xl p-6 space-y-6 shadow-sm">
          {buScrapMode ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-text-primary font-syne font-bold flex items-center gap-2">
                  <Trash2 className="text-accent-red" size={20} /> {t('sl_us_scrap_title')}
                </h4>
                <button onClick={() => { setBuScrapMode(false); setBuScrapSelected([]); setBuScrapCategory('all'); if (buSelectedCustomer?.id === 'scrap') setBuSelectedCustomer(null) }}
                  className="text-xs text-text-muted hover:text-accent-red transition-colors">{t('sl_us_scrap_cancel')}</button>
              </div>
              {buScrapCategories.length > 0 && (
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <button onClick={() => setBuScrapCategory('all')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${buScrapCategory === 'all' ? 'bg-accent-red text-white' : 'bg-bg-tertiary text-text-muted hover:text-text-primary'}`}>
                    {t('filter_all')}
                  </button>
                  {buScrapCategories.map(cat => (
                    <button key={cat.id} onClick={() => setBuScrapCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${buScrapCategory === cat.id ? 'bg-accent-red text-white' : 'bg-bg-tertiary text-text-muted hover:text-text-primary'}`}>
                      {t('cat_' + cat.id, { defaultValue: cat.label })}
                    </button>
                  ))}
                </div>
              )}
              {buScrapGroups.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-6">{t('sl_us_scrap_not_found')}</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
                  {buScrapGroups.map(g => (
                    <label key={g.key} className="w-full flex items-center gap-3 bg-bg-tertiary border border-border rounded-2xl px-4 py-3 cursor-pointer">
                      <input type="checkbox" checked={buScrapSelected.includes(g.key)}
                        onChange={() => setBuScrapSelected(prev => prev.includes(g.key) ? prev.filter(k => k !== g.key) : [...prev, g.key])}
                        className="w-4 h-4 accent-accent-red flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-text-primary truncate">{g.name}</p>
                        <p className="text-[10px] text-text-muted">{t('cat_' + g.category, { defaultValue: g.categoryLabel || g.category })} • {g.items.length} {t('unit_pcs')} • {t('sl_us_acquired')}{formatPrice(g.acquiredPrice, som)}/{t('unit_pcs')} ({t('sl_us_total_short')}{formatPrice(g.acquiredPrice * g.items.length, som)})</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              <button onClick={buAddScrapToCart} disabled={buScrapSelected.length === 0}
                className="w-full mt-4 py-2.5 bg-accent-red text-white rounded-xl text-xs font-bold disabled:opacity-40 transition-opacity">
                {t('sl_us_scrap_btn', { n: buScrapSelected.length })}
              </button>
            </div>
          ) : (
            <div>
              <h4 className="text-text-primary font-syne font-bold mb-4 flex items-center gap-2">
                <Recycle className="text-accent-red" size={20} /> {t('sl_us_select_title')}
              </h4>
              <div className="relative mb-3">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input value={buSearch} onChange={(e) => setBuSearch(e.target.value)} placeholder={t('sl_us_search_ph')}
                  className="w-full pl-9 pr-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-accent-blue" />
              </div>
              {(productAttributeDefs || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {(productAttributeDefs || []).map(def => (
                    <div key={def.id} className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted px-1">{def.label}</span>
                      <select
                        value={buAttrFilters[def.id] || 'all'}
                        onChange={e => setBuAttrFilters(prev => ({ ...prev, [def.id]: e.target.value }))}
                        className="px-2 py-1.5 bg-bg-tertiary border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent-blue"
                      >
                        <option value="all">Barchasi</option>
                        {def.values.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              )}
              {buAvailableGroups.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-6">{t('sl_us_not_found')}</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
                  {buAvailableGroups.map(g => (
                    <div key={g.key} className="w-full flex items-center justify-between gap-3 bg-bg-tertiary border border-border rounded-2xl px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-text-primary truncate">{g.name}</p>
                        <p className="text-[10px] text-text-muted">{t('cat_' + g.category, { defaultValue: g.categoryLabel || g.category })} • {t('sl_us_acquired')}{formatPrice(g.acquiredPrice, som)} • {t('sl_us_available')}{g.items.length}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input type="number" min={1} max={g.items.length} value={buGroupQty[g.key] ?? 1}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setBuGroupQty(prev => ({ ...prev, [g.key]: e.target.value }))}
                          className="w-14 text-xs font-bold px-2 py-1.5 rounded-lg border bg-bg-secondary border-border text-text-primary text-center focus:outline-none" />
                        <button onClick={() => buAddToCart(g, buGroupQty[g.key] ?? 1)}
                          className="p-2 bg-accent-blue/10 text-accent-blue rounded-lg hover:bg-accent-blue/20 transition-all">
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {buCart.length > 0 && (
          <div className="bg-bg-primary border border-border rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-text-primary font-syne font-bold flex items-center gap-2">
                <ShoppingCart size={18} className="text-accent-red" />
                {t('sl_us_cart_title', { n: buCart.length })}
              </h4>
              <button onClick={() => setBuCart([])} className="text-text-muted hover:text-accent-red transition-colors"><Trash2 size={16} /></button>
            </div>
            <div className="space-y-3 max-h-72 overflow-y-auto no-scrollbar">
              {buCartGroups.map(g => {
                const groupTotal = g.items.reduce((acc, c) => acc + (Number(c.sellPrice) || 0), 0)
                return (
                  <motion.div key={g.key} layout className="flex items-center gap-3 bg-bg-secondary border border-border rounded-2xl px-4 py-3">
                    <div className="w-10 h-10 bg-bg-tertiary rounded-xl flex items-center justify-center text-accent-red shrink-0 font-bold text-xs">{g.items.length}x</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate">{g.name}</p>
                      <p className="text-[10px] text-text-muted">{t('sl_us_acquired_total')}{formatPrice(g.items.reduce((s, x) => s + (x.acquiredPrice || 0), 0), som)}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <input type="number" value={groupTotal} onFocus={(e) => e.target.select()}
                          onChange={(e) => buSetGroupTotalPrice(g.key, e.target.value)}
                          className="w-28 text-xs font-bold px-2 py-1 rounded-lg border bg-bg-tertiary border-border text-accent-red focus:outline-none" />
                        <span className="text-[10px] text-text-muted">{t('sl_us_som_total')}</span>
                      </div>
                    </div>
                    <button onClick={() => buRemoveGroupFromCart(g.key)} className="p-1.5 text-text-muted hover:text-accent-red transition-all flex-shrink-0"><X size={16} /></button>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="flex flex-col lg:w-[55%] bg-bg-secondary border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="flex-1 p-6 space-y-6 overflow-y-auto no-scrollbar">
          {buSuccessSale && (
            <div className="flex items-center justify-between gap-2 p-3 bg-accent-green/10 border border-accent-green/30 rounded-xl">
              <div className="flex items-center gap-2 text-accent-green text-xs font-bold">
                <CheckCircle size={16} /> {t('sl_us_success')}
              </div>
              <button onClick={() => setBuSuccessSale(null)} className="text-text-muted hover:text-accent-red"><X size={14} /></button>
            </div>
          )}

          {/* Customer */}
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-3 block">{t('col_customer')}</label>
            {buSelectedCustomer ? (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-bg-tertiary border border-border rounded-2xl overflow-hidden p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-accent-blue/15 text-accent-blue rounded-xl flex items-center justify-center font-extrabold text-base flex-shrink-0">
                    {buSelectedCustomer.id === 'scrap' ? '♻' : buSelectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-primary">{buSelectedCustomer.id === 'scrap' ? t('wh_bu_scrapped') : buSelectedCustomer.name}</p>
                    <p className="text-xs text-text-muted">{buSelectedCustomer.phone}</p>
                  </div>
                </div>
                <button onClick={() => { setBuSelectedCustomer(null); setBuSource('walk_in') }} className="text-text-muted hover:text-accent-red transition-colors p-1"><X size={18} /></button>
              </motion.div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input value={buCustomerSearch} onChange={(e) => setBuCustomerSearch(e.target.value)} placeholder={t('sl_ns_search_customer')}
                    className="w-full pl-9 pr-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-accent-blue" />
                </div>
                {buCustomerSearch && buFilteredCustomers.length > 0 && (
                  <div className="bg-bg-tertiary border border-border rounded-xl max-h-32 overflow-y-auto no-scrollbar">
                    {buFilteredCustomers.map(c => (
                      <button key={c.id} onClick={() => { setBuSelectedCustomer(c); setBuCustomerSearch(''); setBuSource('repeat') }}
                        className="w-full text-left px-4 py-2 text-xs text-text-primary hover:bg-border transition-colors flex justify-between">
                        <span>{c.name}</span><span className="text-text-muted">{c.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => setBuShowNewCustomerModal(true)}
                  className="w-full py-2.5 border border-dashed border-border rounded-xl text-xs text-text-muted hover:text-accent-blue hover:border-accent-blue transition-all flex items-center justify-center gap-2">
                  <UserPlus size={14} /> {t('sl_ns_add_customer')}
                </button>
                <button onClick={() => { setBuScrapMode(true); setBuSelectedCustomer({ id: 'scrap', name: 'Utilizatsiya', phone: '' }) }}
                  className="w-full py-2.5 border border-dashed border-border rounded-xl text-xs text-text-muted hover:text-accent-red hover:border-accent-red transition-all flex items-center justify-center gap-2">
                  <Trash2 size={14} /> {t('sl_us_scrap_btn2')}
                </button>
              </div>
            )}
          </div>

          {/* Discount */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">{t('col_discount')}</label>
              <span className="text-xs font-bold text-accent-red">{buDiscountPercent}%</span>
            </div>
            <input type="range" min="0" max={maxDiscount} value={buDiscountPercent}
              onChange={(e) => setBuDiscountPercent(Number(e.target.value))}
              className="w-full h-1.5 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent-red" />
          </div>

          {/* Payment */}
          <div className="space-y-3">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted block">{t('sl_ns_payment_label')}</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'cash', icon: Banknote, label: t('pay_cash') },
                { id: 'card', icon: CreditCard, label: t('pay_card') },
                { id: 'installment', icon: Calendar, label: t('pay_installment') },
                { id: 'transfer', icon: ArrowRight, label: t('sl_ns_pay_transfer') },
              ].map(pm => (
                <button key={pm.id} onClick={() => { setBuPaymentType(pm.id); setBuCardType(null); if (pm.id !== 'installment') setBuInstallmentOrgId('') }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all text-left ${buPaymentType === pm.id ? 'bg-accent-red text-white border-accent-red shadow-glow-red' : 'bg-bg-tertiary border-border text-text-secondary hover:border-text-primary'}`}>
                  <pm.icon size={18} className="flex-shrink-0" /><span className="text-xs font-bold">{pm.label}</span>
                </button>
              ))}
            </div>
            {buPaymentType === 'card' && (
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'uzcard', label: 'UzCard' },
                  { id: 'humo', label: 'Humo' },
                  { id: 'visa', label: 'Visa' },
                  { id: 'mastercard', label: 'Mastercard' },
                ].map(ct => (
                  <button key={ct.id} type="button" onClick={() => setBuCardType(buCardType === ct.id ? null : ct.id)}
                    className={`px-3 py-2 rounded-xl border text-[11px] font-bold transition-all ${buCardType === ct.id ? 'bg-accent-red text-white border-accent-red' : 'bg-bg-tertiary border-border text-text-secondary hover:border-text-primary'}`}>
                    {ct.label}
                  </button>
                ))}
              </div>
            )}
            {buPaymentType === 'transfer' && (
              <div className="bg-bg-tertiary border border-border rounded-2xl p-4 space-y-3">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted block">{t('inc_contract_number')}</label>
                <input value={buContractNumber} onChange={(e) => setBuContractNumber(e.target.value)} placeholder={t('sl_contract_ph')}
                  className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-xl text-xs text-text-primary focus:outline-none" />
              </div>
            )}
            {buPaymentType === 'installment' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="bg-bg-tertiary border border-border rounded-2xl p-4 space-y-4 overflow-hidden">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted block">{t('sl_ns_org_label')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {installmentOrganizations.filter(o => o.isActive !== false).map(o => (
                      <button key={o.id} type="button" onClick={() => setBuInstallmentOrgId(o.id)}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-center leading-tight ${buInstallmentOrgId === o.id ? 'bg-accent-blue text-white border-accent-blue shadow-glow-blue' : 'bg-bg-secondary border-border text-text-secondary hover:border-text-primary'}`}>
                        {o.name}
                      </button>
                    ))}
                  </div>
                </div>
                {buInstallmentOrgId && (() => {
                  const selOrg = installmentOrganizations.find(o => o.id === buInstallmentOrgId)
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
                          <button key={opt.value} type="button" onClick={() => setBuInstallmentTermMonths(opt.value)}
                            className={`py-1.5 rounded-lg text-xs font-bold transition-all ${buInstallmentTermMonths === opt.value ? 'bg-accent-blue text-white' : 'bg-bg-secondary text-text-secondary border border-border'}`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </motion.div>
            )}
          </div>

          {/* Source */}
          <div className={`space-y-3 ${buScrapMode ? 'opacity-40 pointer-events-none' : ''}`}>
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted block">{t('sl_ns_source_label')}</label>
            <div className="grid grid-cols-3 gap-2">
              {sources.filter(s => s.isActive !== false).map(s => (
                <button key={s.id} type="button" disabled={buScrapMode} onClick={() => setBuSource(s.id)}
                  className={`px-3 py-2 rounded-xl border transition-all text-center text-xs font-bold ${buSource === s.id ? 'bg-accent-red text-white border-accent-red' : 'bg-bg-tertiary border-border text-text-secondary hover:border-text-primary'}`}>
                  {t('source_' + s.id, { defaultValue: s.label })}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Total & Checkout */}
        <div className="p-6 bg-bg-tertiary border-t border-border space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">{t('sl_ns_subtotal')}</span>
              <span className="text-text-primary font-medium">{formatPrice(buSubtotal, som)}</span>
            </div>
            {buDiscountPercent > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-accent-red">{t('sl_ns_discount_row', { n: buDiscountPercent })}</span>
                <span className="text-accent-red font-medium">-{formatPrice(buDiscountAmount, som)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-border/50">
              <span className="text-base font-syne font-extrabold text-text-primary">{t('sl_ns_total_label')}</span>
              <span className="text-base font-syne font-extrabold text-accent-green">{formatPrice(buTotal, som)}</span>
            </div>
          </div>
          <button onClick={buHandleSubmitSale}
            disabled={buIsSubmitting || buCart.length === 0 || (buPaymentType === 'installment' && !buInstallmentOrgId)}
            className="w-full py-4 bg-accent-green text-white font-syne font-extrabold text-base rounded-2xl hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm">
            {buIsSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>{t('sl_us_sell_btn')} <ArrowRight size={18} /></>}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default UsedSaleTab
