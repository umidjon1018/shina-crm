import { useState } from 'react'
import DateMaskInput from '../../../components/DateMaskInput'
import { MessageSquare, Gift, Filter, CheckCircle, ShoppingCart, Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAgentActivityStore } from '../../../store/agentActivityStore'
import { useDataStore } from '../../../store/dataStore'
import { useShopStore } from '../../../store/shopStore'
import Modal from '../components/Modal'

const MOCK_CONVERSATIONS = [
  { id: 'conv1', clientId: 'C001', lastMsg: 'Salom, 205/55 R16 qishki bor? Gentraga mosmi?', time: '10:32', unread: 2, bookingDone: false },
  { id: 'conv2', clientId: 'C002', lastMsg: 'Tucson uchun disk olmoqchi edim, narxi qancha?', time: 'Kecha', unread: 0, bookingDone: false },
  { id: 'conv3', clientId: 'C003', lastMsg: 'Rahmat, tez olib ketaman!', time: 'Dushanba', unread: 0, bookingDone: false },
  { id: 'conv4', clientId: 'C004', lastMsg: 'Bu oy aksiya bormi?', time: '09:15', unread: 1, bookingDone: false },
]

const SEGMENT_LABEL_KEYS = { loyal: 'seg_loyal', vip: 'seg_vip', regular: 'seg_regular', new: 'seg_new' }
const SEGMENT_COLORS = { loyal: 'text-[#22c55e] bg-[#22c55e]/10', vip: 'text-amber-400 bg-amber-400/10', regular: 'text-[#3b82f6] bg-[#3b82f6]/10', new: 'text-text-muted bg-bg-secondary' }

const getClientSegment = (c) => {
  if (c.segment) return c.segment
  const lv = c.loyaltyLevel
  if (lv === 'gold') return 'vip'
  if (lv === 'silver') return 'loyal'
  if (lv === 'bronze') return 'regular'
  return 'new'
}
const getClientPurchaseCount = (c) => c.purchaseCount ?? c.visits?.length ?? 0
const getClientLastPurchase = (c) => c.lastPurchase ?? c.lastVisit ?? '\u2014'

function getDaysUntilBirthday(birthDate) {
  if (!birthDate) return 999
  const today = new Date()
  const b = new Date(birthDate)
  const next = new Date(today.getFullYear(), b.getMonth(), b.getDate())
  if (next <= today) next.setFullYear(today.getFullYear() + 1)
  return Math.ceil((next - today) / 86400000)
}

function CustomerTab({ aiData = {} }) {
  const { t } = useTranslation()
  const { addActivity } = useAgentActivityStore()
  const { version } = useDataStore()
  const { selectedShopId } = useShopStore()
  const { customers: MOCK_CUSTOMERS = [], products: MOCK_PRODUCTS = [] } = aiData
  const shopCustomers = selectedShopId === 'all' ? MOCK_CUSTOMERS : MOCK_CUSTOMERS.filter(c => !c.shopId || c.shopId === selectedShopId)
  const [selectedConv, setSelectedConv] = useState(MOCK_CONVERSATIONS[0].id)
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS)
  const [bookingModal, setBookingModal] = useState(false)
  const [bookingData, setBookingData] = useState({ product: 'p2', qty: 2, date: '' })
  const [greetingSent, setGreetingSent] = useState({})
  const [promoSent, setPromoSent] = useState({})
  const activeConv = conversations.find(c => c.id === selectedConv)
  const activeClient = shopCustomers.find(c => c.id === activeConv?.clientId)

  const birthdaySoon = shopCustomers.filter(c => getDaysUntilBirthday(c.birthDate) <= 7)
  const promoSegment = shopCustomers.filter(c => { const s = getClientSegment(c); return s === 'loyal' || s === 'vip' })

  const handleBooking = () => {
    const prod = MOCK_PRODUCTS.find(p => p.id === bookingData.product)
    addActivity({
      agentId: 'customer',
      type: 'BOOKING',
      message: t('ai_act_booking', {
        name: activeClient?.name,
        qty: bookingData.qty,
        product: prod?.name || t('ai_product_fallback'),
        date: bookingData.date || t('ai_not_set'),
      }),
      relatedAgentId: 'inventory',
      relatedEntity: { type: 'product', id: bookingData.product },
    })
    setConversations(prev => prev.map(c =>
      c.id === selectedConv ? { ...c, bookingDone: true, lastMsg: t('ai_booking_done') } : c
    ))
    setBookingModal(false)
  }

  const sendGreeting = (clientId) => {
    setGreetingSent(prev => ({ ...prev, [clientId]: true }))
    addActivity({ agentId: 'customer', type: 'NOTE', message: t('ai_act_greeting', { name: shopCustomers.find(c => c.id === clientId)?.name }) })
  }

  const sendPromo = (clientId) => {
    setPromoSent(prev => ({ ...prev, [clientId]: true }))
    addActivity({ agentId: 'customer', type: 'NOTE', message: t('ai_act_promo', { name: shopCustomers.find(c => c.id === clientId)?.name }) })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <MessageSquare size={15} className="text-[#3b82f6]" /> {t('ai_conversations')}
        </h3>
        <div className="flex gap-4 h-80 border border-border rounded-xl overflow-hidden">
          <div className="w-52 flex-shrink-0 border-r border-border overflow-y-auto">
            {conversations.map(conv => {
              const client = shopCustomers.find(c => c.id === conv.clientId)
              return (
                <button key={conv.id} onClick={() => setSelectedConv(conv.id)}
                  className={`w-full text-left px-3 py-3 border-b border-border/50 hover:bg-bg-secondary transition-colors ${selectedConv === conv.id ? 'bg-bg-secondary' : ''}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-text-primary truncate">{client?.name}</p>
                    {conv.unread > 0 && <span className="w-4 h-4 rounded-full bg-[#3b82f6] text-white text-[9px] flex items-center justify-center flex-shrink-0">{conv.unread}</span>}
                  </div>
                  <p className="text-xs text-text-muted truncate mt-0.5">{conv.lastMsg}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">{conv.time}</p>
                </button>
              )
            })}
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeClient && (
              <>
                <div className="px-4 py-3 border-b border-border bg-bg-secondary flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{activeClient.name}</p>
                    <p className="text-xs text-text-muted">{activeClient.carModel} · {activeClient.phone}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${SEGMENT_COLORS[getClientSegment(activeClient)]}`}>
                    {t(SEGMENT_LABEL_KEYS[getClientSegment(activeClient)])}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="flex justify-start">
                    <div className="max-w-[75%] px-3 py-2 rounded-xl bg-bg-secondary text-xs text-text-primary">{activeConv.lastMsg}</div>
                  </div>
                  {activeConv.bookingDone && (
                    <div className="flex justify-end">
                      <div className="max-w-[75%] px-3 py-2 rounded-xl bg-[#3b82f6]/20 text-xs text-text-primary">{t('ai_booking_done')}</div>
                    </div>
                  )}
                </div>
                <div className="px-4 py-2.5 border-t border-border bg-bg-secondary">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-text-muted">{t('ai_purchases_prefix')} {getClientPurchaseCount(activeClient)} {t('unit_pcs')} · {t('ai_last_purchase_prefix')} {getClientLastPurchase(activeClient)}</p>
                    {!activeConv.bookingDone && (
                      <button onClick={() => setBookingModal(true)} className="text-xs px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors flex items-center gap-1">
                        <ShoppingCart size={11} /> {t('ai_book_demo')}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {birthdaySoon.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Gift size={15} className="text-[#f97316]" /> {t('ai_birthday_soon')}
          </h3>
          <div className="space-y-2">
            {birthdaySoon.map(client => (
              <div key={client.id} className="flex items-center justify-between p-3 rounded-xl border border-[#f97316]/30 bg-[#f97316]/5">
                <div>
                  <p className="text-sm font-medium text-text-primary">{client.name}</p>
                  <p className="text-xs text-text-muted">{t('ai_days_until_birthday', { days: getDaysUntilBirthday(client.birthDate) })} · {client.carModel}</p>
                </div>
                {greetingSent[client.id]
                  ? <span className="text-xs text-[#22c55e] flex items-center gap-1"><CheckCircle size={12} /> {t('ai_sent')}</span>
                  : <button onClick={() => sendGreeting(client.id)} className="text-xs px-3 py-1.5 rounded-lg bg-[#f97316]/20 text-[#f97316] hover:bg-[#f97316]/30 transition-colors">{t('ai_greeting_send')}</button>
                }
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Filter size={15} className="text-[#3b82f6]" /> {t('ai_segmentation_full')}
        </h3>
        <div className="space-y-2">
          {promoSegment.map(client => (
            <div key={client.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-bg-secondary">
              <div>
                <p className="text-sm font-medium text-text-primary">{client.name}</p>
                <p className="text-xs text-text-muted">{client.carModel} · {t('ai_purchases_count', { count: getClientPurchaseCount(client) })}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${SEGMENT_COLORS[getClientSegment(client)]}`}>
                  {t(SEGMENT_LABEL_KEYS[getClientSegment(client)])}
                </span>
                {promoSent[client.id]
                  ? <span className="text-xs text-[#22c55e] flex items-center gap-1"><CheckCircle size={12} /> {t('ai_sent')}</span>
                  : <button onClick={() => sendPromo(client.id)} className="text-xs px-2 py-1 rounded-lg bg-bg-primary border border-border hover:bg-bg-secondary text-text-muted transition-colors">{t('ai_promo_send')}</button>
                }
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-xl border border-[#3b82f6]/30 bg-[#3b82f6]/5">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3">
          <Bell size={15} className="text-[#3b82f6]" /> {t('ai_seasonal_dm')}
        </h3>
        <p className="text-xs text-text-muted mb-3">{t('ai_seasonal_dm_desc')}</p>
        <div className="space-y-2 mb-3">
          {shopCustomers.map(client => (
            <div key={client.id} className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-bg-secondary">
              <div>
                <p className="text-xs font-medium text-text-primary">{client.name}</p>
                <p className="text-xs text-text-muted">{client.carModel}</p>
              </div>
              {promoSent[client.id]
                ? <span className="text-xs text-[#22c55e] flex items-center gap-1"><CheckCircle size={11} /> {t('ai_sent')}</span>
                : <button onClick={() => sendPromo(client.id)} className="text-xs px-2.5 py-1 rounded-lg bg-[#3b82f6]/10 text-[#3b82f6] hover:bg-[#3b82f6]/20 transition-colors">{t('ai_dm_send')}</button>
              }
            </div>
          ))}
        </div>
      </div>

      <Modal open={bookingModal} onClose={() => setBookingModal(false)} title={t('ai_booking_modal_title')}>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-text-muted block mb-1">{t('col_customer')}</label>
            <p className="text-sm font-medium text-text-primary">{activeClient?.name}</p>
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">{t('ai_booking_product')}</label>
            <select value={bookingData.product} onChange={e => setBookingData(p => ({ ...p, product: e.target.value }))}
              className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none">
              {MOCK_PRODUCTS.filter(p => p.isActive).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">{t('ai_booking_qty')}</label>
            <input type="number" min={1} max={10} value={bookingData.qty}
              onChange={e => setBookingData(p => ({ ...p, qty: +e.target.value }))}
              className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none" />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">{t('ai_booking_deadline')}</label>
            <DateMaskInput value={bookingData.date} onChange={e => setBookingData(p => ({ ...p, date: e.target.value }))}
              className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none" />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setBookingModal(false)} className="flex-1 py-2 rounded-xl border border-border text-sm text-text-muted hover:bg-bg-secondary transition-colors">{t('ai_cancel_btn')}</button>
            <button onClick={handleBooking} className="flex-1 py-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 text-sm hover:bg-purple-500/30 transition-colors">{t('confirm')}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default CustomerTab
