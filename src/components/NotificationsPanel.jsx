import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Check, CheckCheck, Trash2, AlertTriangle, ShieldAlert, Info, Percent, User } from 'lucide-react'
import { useNotificationStore } from '../store/notificationStore'
import { useAuthStore } from '../store/authStore'
import { formatDateTime, formatNumber } from '../utils/format'

const SEVERITY = {
  warning: { icon: AlertTriangle, cls: 'bg-accent-orange/10 text-accent-orange' },
  error: { icon: ShieldAlert, cls: 'bg-accent-red/10 text-accent-red' },
  info: { icon: Info, cls: 'bg-accent-blue/10 text-accent-blue' },
}

// Chegirma so'rovi kartasi: boshqaruvchi/admin tasdiqlaydi, sotuvchi o'z so'rovi holatini ko'radi
const DiscountRequest = ({ n, canResolve, onResolve, t }) => {
  const pending = n.status === 'pending'
  const blockedForRole = n.requiredRole === 'admin' && !canResolve.admin
  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${pending ? 'border-accent-orange/40 bg-accent-orange/5' : 'border-border bg-bg-secondary'}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-orange/10 text-accent-orange flex items-center justify-center shrink-0"><Percent size={18} /></div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-text-primary">{t('notif_dreq_title', { discount: n.requestedDiscount })}</p>
          <p className="text-sm text-text-secondary flex items-center gap-1"><User size={13} /> {n.sellerName || '—'}</p>
          <p className="text-xs text-text-muted mt-0.5">{formatDateTime(n.createdAt)}</p>
        </div>
        {!pending && (
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${n.status === 'approved' ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>
            {t(n.status === 'approved' ? 'notif_dreq_approved' : 'notif_dreq_rejected')}
          </span>
        )}
      </div>
      {n.cartSummary && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-bg-tertiary rounded-xl px-3 py-2">
            <p className="text-xs text-text-muted">{t('mgmt_total_amount')}</p>
            <p className="font-bold text-text-primary">{formatNumber(n.cartSummary.subtotal)}</p>
          </div>
          <div className="bg-bg-tertiary rounded-xl px-3 py-2">
            <p className="text-xs text-text-muted">{t('mgmt_after_discount')}</p>
            <p className="font-bold text-accent-green">{formatNumber(n.cartSummary.afterDiscount)}</p>
          </div>
          {n.cartSummary.items?.length > 0 && (
            <p className="col-span-2 text-xs text-text-secondary">{n.cartSummary.items.map(i => `${i.name} (${i.qty})`).join(', ')}</p>
          )}
        </div>
      )}
      {pending && canResolve.any && (blockedForRole
        ? <p className="text-xs text-accent-orange font-semibold">{t('notif_dreq_admin_only')}</p>
        : (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onResolve(n, 'rejected')} className="py-2.5 rounded-xl border border-border text-sm font-bold text-text-secondary hover:text-accent-red hover:border-accent-red/40">
              {t('mgmt_reject')}
            </button>
            <button onClick={() => onResolve(n, 'approved')} className="py-2.5 rounded-xl bg-accent-green text-white text-sm font-bold hover:opacity-90 flex items-center justify-center gap-1.5">
              <Check size={16} /> {t('mgmt_approve')}
            </button>
          </div>
        ))}
      {pending && !canResolve.any && <p className="text-xs text-text-muted">{t('notif_dreq_waiting')}</p>}
    </div>
  )
}

// Yuqori paneldagi qo'ng'iroqcha + o'ng tomondan chiqadigan ro'yxat (avval Boshqaruv → Ogohlantirishlar edi)
const NotificationsPanel = ({ className = '' }) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const { notifications, markRead, markAllRead, removeNotification, updateNotification } = useNotificationStore()
  const { user, hasPermission } = useAuthStore()
  const canResolve = { any: user?.role === 'admin' || hasPermission('notifications'), admin: user?.role === 'admin' }
  const unread = notifications.filter(n => !n.isRead).length
  const requests = notifications.filter(n => n.type === 'DISCOUNT_REQUEST')
  const pendingReq = requests.filter(n => n.status === 'pending')
  const others = notifications.filter(n => n.type !== 'DISCOUNT_REQUEST')

  // Telefon "orqaga" tugmasi panelni yopadi
  useEffect(() => {
    if (!open) return
    window.history.pushState({ ...(window.history.state || {}), notif: true }, '')
    const onPop = () => setOpen(false)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [open])
  const close = () => { if (window.history.state?.notif) window.history.back(); else setOpen(false) }

  return (
    <>
      <button onClick={() => setOpen(true)} className={`relative p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-tertiary ${className}`} title={t('notif_panel_title')}>
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-red text-white text-[11px] font-bold flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[300]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={close} />
            <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.2 }}
              className="absolute right-0 top-0 bottom-0 w-full sm:w-[420px] bg-bg-primary border-l border-border flex flex-col safe-header">
              <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
                <Bell size={20} className="text-accent-red" />
                <h2 className="font-syne font-bold text-lg text-text-primary flex-1">{t('notif_panel_title')}</h2>
                {unread > 0 && (
                  <button onClick={markAllRead} className="p-2 rounded-xl text-text-secondary hover:bg-bg-tertiary" title={t('mgmt_mark_all_read')}><CheckCheck size={18} /></button>
                )}
                <button onClick={close} className="p-2 rounded-xl text-text-secondary hover:bg-bg-tertiary"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                {pendingReq.length > 0 && <p className="text-sm font-bold text-accent-orange">{t('notif_pending_requests', { n: pendingReq.length })}</p>}
                {[...pendingReq, ...requests.filter(n => n.status !== 'pending').slice(0, 5)].map(n => (
                  <DiscountRequest key={n.id} n={n} canResolve={canResolve} t={t}
                    onResolve={(x, status) => updateNotification(x.id, { status, isRead: true })} />
                ))}
                {others.length > 0 && requests.length > 0 && <div className="border-t border-border my-2" />}
                {others.map(n => {
                  const sev = SEVERITY[n.severity] || SEVERITY.info
                  const Icon = sev.icon
                  return (
                    <div key={n.id} onClick={() => !n.isRead && markRead(n.id)}
                      className={`flex items-start gap-3 rounded-2xl border p-3 cursor-pointer ${n.isRead ? 'border-border opacity-70' : 'border-accent-red/30 bg-bg-secondary'}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${sev.cls}`}><Icon size={17} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text-primary">{n.titleKey ? t(n.titleKey, n.titleParams) : n.title}</p>
                        <p className="text-sm text-text-secondary">{n.messageKey ? t(n.messageKey, n.messageParams) : n.message}</p>
                        <p className="text-xs text-text-muted mt-1">{formatDateTime(n.createdAt)}{n.sellerName ? ` · ${n.sellerName}` : ''}</p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); removeNotification(n.id) }} className="p-1.5 rounded-lg text-text-muted hover:text-accent-red hover:bg-accent-red/10"><Trash2 size={15} /></button>
                    </div>
                  )
                })}
                {notifications.length === 0 && (
                  <div className="text-center py-16 text-text-muted">
                    <Bell size={40} className="mx-auto mb-3 opacity-30" />
                    <p>{t('mgmt_no_notifications')}</p>
                  </div>
                )}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

export default NotificationsPanel
