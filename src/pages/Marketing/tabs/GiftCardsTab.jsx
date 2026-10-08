import React, { useState, useEffect, useMemo } from 'react'
import TableView from '../../../components/ui/TableView'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Ban, CreditCard, Gift, History, Layers, Plus, Search, Wallet, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import DateMaskInput from '../../../components/DateMaskInput'
import { useShopStore } from '../../../store/shopStore'
import { ShopPickerModal } from '../../../components/ShopPickerModal'
import GiftCardSellModal from '../../../components/marketing/GiftCardSellModal'
import { getGiftCards, getGiftCardTx, createGiftCards, cancelGiftCard } from '../../../api/marketingService'
import { StatCard, PaymentMethodPicker, pmLabel, Pagination, PAGE_SIZE } from '../../Expenses/components/expHelpers'
import { fmtMoney, fmtD, fmtDT } from '../components/mkHelpers'
import { useDataStore } from '../../../store/dataStore'
import { StackGuard } from '../../../components/ui/Modal'

const inputCls = 'w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-red'
const STATUS = {
  inactive: 'bg-gray-500/10 text-gray-500',
  active: 'bg-accent-green/10 text-accent-green',
  used: 'bg-accent-blue/10 text-accent-blue',
  expired: 'bg-accent-orange/10 text-accent-orange',
  cancelled: 'bg-accent-red/10 text-accent-red',
}

const Modal = ({ title, onClose, children, footer }) => (
  <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4">
    <StackGuard onClose={onClose} />
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
      className="relative bg-bg-secondary border border-border rounded-2xl w-full max-w-md shadow-2xl z-10 max-h-[92vh] overflow-y-auto">
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border sticky top-0 bg-bg-secondary z-10">
        <h3 className="font-syne font-bold text-lg text-text-primary">{title}</h3>
        <button onClick={onClose} className="p-1.5 hover:bg-bg-tertiary rounded-lg"><X size={18} className="text-text-secondary" /></button>
      </div>
      <div className="p-4 sm:p-5 space-y-4">{children}</div>
      {footer && <div className="flex gap-3 p-4 sm:p-5 border-t border-border sticky bottom-0 bg-bg-secondary">{footer}</div>}
    </motion.div>
  </div>
)

const GiftCardsTab = () => {
  const { t } = useTranslation()
  const { selectedShopId } = useShopStore()
  const { bump } = useDataStore()
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sell, setSell] = useState(null) // { shopId, code }
  const [pickShop, setPickShop] = useState(null)
  const [batch, setBatch] = useState(null)
  const [created, setCreated] = useState(null)
  const [txCard, setTxCard] = useState(null)
  const [tx, setTx] = useState([])
  const [cancelCard, setCancelCard] = useState(null)
  const [cancelRefund, setCancelRefund] = useState(true)
  const [cancelMethod, setCancelMethod] = useState('cash')
  const [error, setError] = useState('')

  const load = () => getGiftCards().then(setCards).catch(() => {}).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openSell = (code = '') => {
    if (selectedShopId !== 'all') setSell({ shopId: selectedShopId, code })
    else setPickShop({ code })
  }

  const stats = useMemo(() => ({
    active: cards.filter(c => c.status === 'active').length,
    liability: cards.filter(c => c.status === 'active').reduce((s, c) => s + c.balance, 0),
    sold: cards.filter(c => c.soldAt).reduce((s, c) => s + (c.price ?? c.nominal), 0),
    redeemed: cards.filter(c => c.soldAt && c.status !== 'cancelled').reduce((s, c) => s + Math.max(0, c.nominal - c.balance), 0),
    unsold: cards.filter(c => c.status === 'inactive').length,
  }), [cards])

  const filtered = useMemo(() => cards
    .filter(c => status === 'all' || c.status === status)
    .filter(c => !search.trim() || `${c.code} ${c.customerName}`.toLowerCase().includes(search.toLowerCase())), [cards, status, search])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const submitBatch = async () => {
    setError('')
    try {
      const r = await createGiftCards({ nominal: Number(batch.nominal), count: Number(batch.count), prefix: batch.prefix, expires_at: batch.expires || null })
      setCreated(r); setBatch(null); load(); bump()
    } catch (e) { setError(e?.response?.data?.error || t('exp_err_generic')) }
  }
  const openTx = async (c) => { setTxCard(c); setTx(await getGiftCardTx(c.id).catch(() => [])) }
  const submitCancel = async () => {
    setError('')
    try {
      await cancelGiftCard(cancelCard.id, { refund: cancelRefund, payment_method: cancelMethod })
      setCancelCard(null); load(); bump()
    } catch (e) { setError(e?.response?.data?.error || t('exp_err_generic')) }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Gift} label={t('mkt_gc_stat_active')} value={stats.active} sub={t('mkt_gc_stat_unsold', { n: stats.unsold })} color="bg-accent-green/10 text-accent-green" />
        <StatCard icon={Wallet} label={t('mkt_gc_stat_liability')} value={fmtMoney(stats.liability)} sub={t('mkt_gc_stat_liability_sub')} color="bg-accent-orange/10 text-accent-orange" />
        <StatCard icon={CreditCard} label={t('mkt_gc_stat_sold')} value={fmtMoney(stats.sold)} color="bg-blue-500/10 text-blue-500" />
        <StatCard icon={Layers} label={t('mkt_gc_stat_redeemed')} value={fmtMoney(stats.redeemed)} color="bg-purple-500/10 text-purple-500" />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => openSell()} className="flex items-center gap-2 px-4 py-2.5 bg-accent-red text-white rounded-xl font-semibold text-sm shrink-0">
          <Plus size={16} /> {t('mkt_gc_sell_title')}
        </button>
        <button onClick={() => setBatch({ nominal: 200000, count: 10, prefix: '', expires: '' })} className="flex items-center gap-2 px-4 py-2.5 border border-border bg-bg-secondary text-text-secondary rounded-xl font-semibold text-sm shrink-0">
          <Layers size={15} /> {t('mkt_gc_batch')}
        </button>
        <div className="relative flex-1 min-w-[160px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder={t('mkt_gc_search')}
            className="w-full bg-bg-secondary border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-red" />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary">
          {['all', 'inactive', 'active', 'used', 'expired', 'cancelled'].map(s => <option key={s} value={s}>{t('mkt_gc_st_' + s)}</option>)}
        </select>
      </div>

      <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
        {loading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-accent-red border-t-transparent rounded-full animate-spin" /></div> : (
          <TableView id="mkt_giftcards" optional={[t('mkt_gc_nominal'), t('mkt_gc_sold_at')]}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs">
                  <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('mkt_gc_code')}</th>
                  <th className="text-right px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('mkt_gc_nominal')}</th>
                  <th className="text-right px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('mkt_gc_balance')}</th>
                  <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('col_status')}</th>
                  <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('mkt_gc_customer')}</th>
                  <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('mkt_gc_sold_at')}</th>
                  <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('mkt_expires')}</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3" />
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && <tr><td colSpan={8} className="px-3 sm:px-4 py-10 text-center text-text-muted">{t('mkt_gc_empty')}</td></tr>}
                {paginated.map(c => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-bg-tertiary/40">
                    <td className="px-3 sm:px-4 py-2.5 font-mono font-bold text-text-primary whitespace-nowrap">{c.code}</td>
                    <td className="px-3 sm:px-4 py-2.5 text-right whitespace-nowrap text-text-primary">{fmtMoney(c.nominal)}</td>
                    <td className="px-3 sm:px-4 py-2.5 text-right whitespace-nowrap font-semibold text-accent-green">{fmtMoney(c.balance)}</td>
                    <td className="px-3 sm:px-4 py-2.5"><span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${STATUS[c.status]}`}>{t('mkt_gc_st_' + c.status)}</span></td>
                    <td className="px-3 sm:px-4 py-2.5 text-text-secondary text-xs">{c.customerName || '—'}</td>
                    <td className="px-3 sm:px-4 py-2.5 text-text-secondary text-xs whitespace-nowrap">{c.soldAt ? `${fmtD(c.soldAt)} · ${pmLabel(c.paymentMethod, t)}` : '—'}</td>
                    <td className="px-3 sm:px-4 py-2.5 text-text-secondary text-xs whitespace-nowrap">{c.expiresAt ? fmtD(c.expiresAt) : '∞'}</td>
                    <td className="px-3 sm:px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        {c.status === 'inactive' && (
                          <button onClick={() => openSell(c.code)} className="px-2 py-1 rounded-lg text-[11px] font-bold bg-accent-red/10 text-accent-red">{t('mkt_gc_sell_btn')}</button>
                        )}
                        <button onClick={() => openTx(c)} className="p-1.5 rounded-lg text-text-secondary hover:bg-bg-tertiary"><History size={14} /></button>
                        {c.status !== 'cancelled' && c.status !== 'used' && (
                          <button onClick={() => { setCancelCard(c); setCancelRefund(c.status !== 'inactive'); setError('') }} className="p-1.5 rounded-lg text-text-secondary hover:text-accent-red"><Ban size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </TableView>
        )}
        <Pagination page={page} totalPages={totalPages} total={filtered.length} setPage={setPage} />
      </div>

      <AnimatePresence>
        {pickShop && (
          <ShopPickerModal onConfirm={(id) => { const code = pickShop.code; setPickShop(null); setSell({ shopId: id, code }) }} onCancel={() => setPickShop(null)} />
        )}
        {sell && <GiftCardSellModal shopId={sell.shopId} presetCode={sell.code} onClose={() => setSell(null)} onSold={() => { load(); bump() }} />}
        {batch && (
          <Modal title={t('mkt_gc_batch')} onClose={() => setBatch(null)} footer={<>
            <button onClick={() => setBatch(null)} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary text-sm">{t('cancel')}</button>
            <button onClick={submitBatch} className="flex-1 py-2.5 rounded-xl bg-accent-red text-white text-sm font-semibold">{t('add')}</button>
          </>}>
            <p className="text-xs text-text-muted">{t('mkt_gc_batch_hint')}</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-text-secondary text-xs font-semibold mb-1.5 block">{t('mkt_gc_nominal')}</label>
                <input type="number" value={batch.nominal} onChange={e => setBatch(b => ({ ...b, nominal: e.target.value }))} className={inputCls} /></div>
              <div><label className="text-text-secondary text-xs font-semibold mb-1.5 block">{t('mkt_voucher_count')}</label>
                <input type="number" min="1" max="500" value={batch.count} onChange={e => setBatch(b => ({ ...b, count: e.target.value }))} className={inputCls} /></div>
              <div><label className="text-text-secondary text-xs font-semibold mb-1.5 block">{t('mkt_prefix')}</label>
                <input value={batch.prefix} onChange={e => setBatch(b => ({ ...b, prefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) }))} placeholder="GC" className={inputCls} /></div>
              <div><label className="text-text-secondary text-xs font-semibold mb-1.5 block">{t('mkt_expires')}</label>
                <DateMaskInput value={batch.expires} onChange={e => setBatch(b => ({ ...b, expires: e.target.value }))} className={inputCls} /></div>
            </div>
            {error && <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 px-3 py-2 rounded-lg"><AlertCircle size={15} /> {error}</div>}
          </Modal>
        )}
        {created && (
          <Modal title={t('mkt_gc_batch_created', { n: created.length })} onClose={() => setCreated(null)} footer={<>
            <button onClick={() => navigator.clipboard?.writeText(created.map(c => c.code).join('\n')).catch(() => {})} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary text-sm">{t('mkt_copy_codes')}</button>
            <button onClick={() => setCreated(null)} className="flex-1 py-2.5 rounded-xl bg-accent-red text-white text-sm font-semibold">{t('mkt_done')}</button>
          </>}>
            <div className="flex flex-wrap gap-1.5">
              {created.map(c => <span key={c.id} className="px-2 py-1 rounded-md bg-bg-tertiary font-mono text-xs text-text-primary">{c.code}</span>)}
            </div>
          </Modal>
        )}
        {txCard && (
          <Modal title={`${txCard.code}`} onClose={() => setTxCard(null)}>
            <div className="space-y-2">
              {tx.length === 0 && <p className="text-sm text-text-muted">{t('mkt_gc_no_tx')}</p>}
              {tx.map(x => (
                <div key={x.id} className="flex items-center justify-between gap-2 text-sm bg-bg-tertiary rounded-xl px-3 py-2">
                  <div>
                    <p className="text-text-primary font-semibold">{t('mkt_gc_tx_' + x.type)}{x.sale_id ? ` · #${x.sale_id}` : ''}</p>
                    <p className="text-[11px] text-text-muted">{fmtDT(x.created_at)} · {x.created_by_name || '—'}{x.payment_method ? ` · ${pmLabel(x.payment_method, t)}` : ''}</p>
                  </div>
                  <span className={`font-bold whitespace-nowrap ${x.amount >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>{x.amount >= 0 ? '+' : ''}{fmtMoney(x.amount)}</span>
                </div>
              ))}
            </div>
          </Modal>
        )}
        {cancelCard && (
          <Modal title={t('mkt_gc_cancel_title', { code: cancelCard.code })} onClose={() => setCancelCard(null)} footer={<>
            <button onClick={() => setCancelCard(null)} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary text-sm">{t('cancel')}</button>
            <button onClick={submitCancel} className="flex-1 py-2.5 rounded-xl bg-accent-red text-white text-sm font-semibold">{t('mkt_gc_cancel_btn')}</button>
          </>}>
            {cancelCard.status !== 'inactive' && cancelCard.balance > 0 ? (
              <>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={cancelRefund} onChange={e => setCancelRefund(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#E63946]" />
                  <span className="text-sm text-text-primary">{t('mkt_gc_cancel_refund', { amount: fmtMoney(cancelCard.balance) })}</span>
                </label>
                {cancelRefund && <PaymentMethodPicker value={cancelMethod} onChange={setCancelMethod} />}
              </>
            ) : <p className="text-sm text-text-secondary">{t('mkt_gc_cancel_plain')}</p>}
            {error && <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 px-3 py-2 rounded-lg"><AlertCircle size={15} /> {error}</div>}
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GiftCardsTab
