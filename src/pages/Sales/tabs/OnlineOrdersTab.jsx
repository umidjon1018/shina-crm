import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Send, Camera, PhoneCall, Phone, Clock, ShoppingCart, X, Loader2, TimerReset, Store } from 'lucide-react'
import api from '../../../api/client'
import { getProducts } from '../../../api/productService'
import { getItems } from '../../../api/itemService'
import { Segmented } from '../../../components/ui/Kit'
import { formatDateTime } from '../../../utils/format'

const SRC = {
  telegram: { icon: Send, cls: 'bg-accent-blue/15 text-accent-blue' },
  instagram: { icon: Camera, cls: 'bg-accent-pink/15 text-accent-pink' },
  phone: { icon: PhoneCall, cls: 'bg-accent-green/15 text-accent-green' },
}
const STATUS_CLS = {
  active: 'bg-accent-orange/15 text-accent-orange', completed: 'bg-accent-green/15 text-accent-green',
  expired: 'bg-bg-tertiary text-text-muted', cancelled: 'bg-accent-red/10 text-accent-red',
}
const fmt = (n) => Math.round(n || 0).toLocaleString('uz-UZ')
const leftLabel = (iso, t) => {
  const ms = new Date(iso) - Date.now()
  if (ms <= 0) return t('sl_resv_expired')
  const h = Math.floor(ms / 3600000)
  return h >= 24 ? t('sl_resv_left_days', { n: Math.floor(h / 24) }) : t('sl_resv_left_hours', { n: Math.max(1, h) })
}

// Oddiy mijozlarning botlar orqali qilgan bronlari: Telegram bot buyurtmalari, Instagram boti, telefon AI
const OnlineOrdersTab = ({ ctx }) => {
  const { t } = useTranslation()
  const { selectedShopId, addToCart, setActiveTab } = ctx
  const [status, setStatus] = useState('active')
  const [source, setSource] = useState('all')
  const [list, setList] = useState(null)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setList(null)
    api.get('/api/reservations/online', { params: { status, ...(source !== 'all' ? { source } : {}), ...(selectedShopId && selectedShopId !== 'all' ? { shop_id: selectedShopId } : {}) } })
      .then(r => setList(r.data)).catch(() => setList([]))
  }, [status, source, selectedShopId])
  useEffect(() => { load() }, [load])

  const act = async (g, kind) => {
    if (kind === 'cancel' && !window.confirm(t('onl_cancel_confirm', { name: g.customerName || g.customerPhone || '' }))) return
    setBusy(g.key + kind); setError('')
    try {
      await api.post(`/api/reservations/online/${kind}`, { ids: g.activeIds, orderId: g.orderId, hours: 24 })
      load()
    } catch (e) { setError(e?.response?.data?.error || t('sl_edit_err_save')) }
    finally { setBusy(null) }
  }
  // Bron qilingan aynan o'sha birliklar savatga qo'shiladi
  const sell = async (g) => {
    setBusy(g.key + 'sell'); setError('')
    try {
      const products = await getProducts()
      let added = 0
      for (const it of g.items) {
        const items = await getItems({ productId: it.productId })
        const item = items.find(i => String(i.id) === String(it.itemId))
        const product = products.find(p => String(p.id) === String(it.productId))
        if (!item || !product || item.status !== 'in_stock') continue
        addToCart({ item, product: { ...product, purchasePrice: item.purchasePrice ?? product.purchasePrice } })
        added++
      }
      if (!added) { setError(t('sl_resv_err_unavailable')); return }
      setActiveTab('new_sale')
    } catch { setError(t('sl_resv_err_unavailable')) }
    finally { setBusy(null) }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented value={status} onChange={setStatus} options={[{ id: 'active', label: t('onl_active') }, { id: 'all', label: t('onl_all') }]} />
        <Segmented value={source} onChange={setSource} options={[
          { id: 'all', label: t('onl_src_all') }, { id: 'telegram', label: 'Telegram', icon: Send },
          { id: 'instagram', label: 'Instagram', icon: Camera }, { id: 'phone', label: t('onl_src_phone'), icon: PhoneCall },
        ]} />
      </div>
      <p className="text-xs text-text-muted">{t('onl_hint')}</p>
      {error && <p className="text-xs text-accent-red font-semibold">{error}</p>}
      {!list ? (
        <div className="py-12 flex justify-center text-text-muted"><Loader2 size={22} className="animate-spin" /></div>
      ) : !list.length ? (
        <div className="py-12 text-center text-text-muted text-sm">{t('onl_empty')}</div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {list.map(g => {
            const S = SRC[g.source] || SRC.telegram
            const Icon = S.icon
            return (
              <div key={g.key} className="bg-bg-tertiary border border-border rounded-2xl p-4 flex flex-col gap-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${S.cls}`}><Icon size={11} /> {t('onl_src_' + g.source)}{g.orderId ? ` #${g.orderId}` : ''}</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_CLS[g.status]}`}>{t('onl_st_' + g.status)}</span>
                  {g.status === 'active' && g.until && <span className="inline-flex items-center gap-1 text-[11px] text-accent-orange"><Clock size={11} /> {leftLabel(g.until, t)}</span>}
                  <span className="ml-auto text-[11px] text-text-muted">{formatDateTime(g.createdAt)}</span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-text-primary">{g.customerName || '—'}</span>
                  {g.customerPhone && <a href={`tel:${g.customerPhone}`} className="ml-2 inline-flex items-center gap-1 text-accent-blue text-xs"><Phone size={11} />{g.customerPhone}</a>}
                </div>
                <div className="space-y-1">
                  {g.lines.map(l => (
                    <div key={l.productId} className="text-xs">
                      <div className="flex justify-between gap-2">
                        <span className="text-text-primary [overflow-wrap:anywhere]">{l.name} × {l.qty}</span>
                        <span className="text-text-secondary whitespace-nowrap">{fmt(l.qty * l.price)}</span>
                      </div>
                      {(l.barcodes.length > 0 || l.shops.length > 0) && (
                        <p className="text-[10px] text-text-muted font-mono">{l.barcodes.join(', ')}{l.shops.length ? <span className="font-sans"> · <Store size={9} className="inline" /> {l.shops.join(', ')}</span> : null}</p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-border pt-2">
                  <span>{t('onl_total')}</span><span>{fmt(g.total)} so'm</span>
                </div>
                {g.status === 'active' && g.activeIds.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <button onClick={() => sell(g)} disabled={!!busy}
                      className="flex items-center justify-center gap-1 py-2.5 rounded-xl bg-accent-green/15 text-accent-green text-xs font-bold disabled:opacity-50">
                      {busy === g.key + 'sell' ? <Loader2 size={13} className="animate-spin" /> : <ShoppingCart size={13} />} {t('onl_sell')}
                    </button>
                    <button onClick={() => act(g, 'extend')} disabled={!!busy}
                      className="flex items-center justify-center gap-1 py-2.5 rounded-xl bg-accent-blue/10 text-accent-blue text-xs font-bold disabled:opacity-50">
                      {busy === g.key + 'extend' ? <Loader2 size={13} className="animate-spin" /> : <TimerReset size={13} />} +24 {t('onl_hours')}
                    </button>
                    <button onClick={() => act(g, 'cancel')} disabled={!!busy}
                      className="flex items-center justify-center gap-1 py-2.5 rounded-xl bg-accent-red/10 text-accent-red text-xs font-bold disabled:opacity-50">
                      <X size={13} /> {t('onl_cancel')}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default OnlineOrdersTab
