import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  getNotifications, createNotification, resolveNotification,
  markNotificationsRead, dismissNotifications,
} from '../api/notificationService'
import { toast, errorText } from '../components/ui/Toast'

// Bildirishnomalar ikki xil:
// — SERVER (SHARED_TYPES): chegirma so'rovi va nazorat ogohlantirishlari — boshqaruvchi/admin hamma qurilmada ko'radi,
//   real vaqtda keladi (SSE 'notification' / 'notification_updated').
// — MAHALLIY: faqat shu qurilmaga tegishli (oflayn sotuv rad etildi, qurilma tasdiqlandi, haftalik hisobot xabari).
export const SHARED_TYPES = new Set([
  'DISCOUNT_REQUEST', 'BARCODE_NOT_PRINTED', 'BARCODE_REPRINTED', 'BARCODE_SOLD_RESCAN',
  'SALE_NO_CUSTOMER', 'OUT_OF_STOCK', 'REPRINT_ALLOWED',
])

// Server qatori → UI shakli (eski maydon nomlari saqlanadi: cartSummary, requestedDiscount, sellerName...)
const fromServer = (n) => ({
  ...(n.data || {}),
  id: 'n' + n.id,
  serverId: n.id,
  server: true,
  type: n.type,
  severity: n.severity,
  title: n.title,
  message: n.message,
  titleKey: n.titleKey,
  titleParams: n.titleParams || undefined,
  messageKey: n.messageKey,
  messageParams: n.messageParams || undefined,
  status: n.status,
  resolvedByName: n.resolvedByName,
  usedAt: n.usedAt,
  createdAt: n.createdAt,
  createdById: n.createdById,
  createdByType: n.createdByType,
  isRead: n.isRead,
})

// UI'dan kelgan obyekt → server so'rovi (asosiy maydonlardan tashqari hammasi data ga)
const toServer = (n) => {
  const { type, severity, title, message, titleKey, titleParams, messageKey, messageParams, shopId, status, isRead, id, ...data } = n
  return { type, severity, title, message, titleKey, titleParams, messageKey, messageParams, shopId, data }
}

const sortByDate = (list) => [...list].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))

export const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],

      // Serverdagilar + shu qurilmaning mahalliy bildirishnomalari
      load: async () => {
        try {
          const list = (await getNotifications()).map(fromServer)
          // Eski versiyada mahalliy saqlangan umumiy turlar tashlanadi — ular endi serverdan keladi
          set(s => ({ notifications: sortByDate([...list, ...s.notifications.filter(n => !n.server && !SHARED_TYPES.has(n.type))]) }))
        } catch { /* oflayn — mavjudlari qoladi */ }
      },

      // Real vaqt hodisasi: yangi yoki o'zgargan server bildirishnomasi
      upsertFromServer: (row) => {
        const n = fromServer(row)
        set(s => {
          const exists = s.notifications.some(x => x.id === n.id)
          return {
            notifications: exists
              ? s.notifications.map(x => x.id === n.id ? { ...x, ...n, isRead: x.isRead || n.isRead } : x)
              : sortByDate([n, ...s.notifications]),
          }
        })
        return n
      },

      addNotification: (notification) => {
        const n = {
          id: `N-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          ...notification,
          createdAt: new Date().toISOString(),
          isRead: false,
        }
        if (SHARED_TYPES.has(n.type)) {
          // Serverga yoziladi; ro'yxatga server javobi (yoki SSE) orqali tushadi
          createNotification(toServer(n)).then(row => row && get().upsertFromServer(row)).catch(() => {})
          return n
        }
        set(state => ({ notifications: [n, ...state.notifications] }))
        return n
      },

      // Chegirma so'rovi: server javobini qaytaradi (sotuvchi uning holatini kuzatadi)
      sendDiscountRequest: async (notification) => {
        const row = await createNotification(toServer({ ...notification, type: 'DISCOUNT_REQUEST' }))
        return get().upsertFromServer(row)
      },

      markRead: (id) => {
        const n = get().notifications.find(x => x.id === id)
        set(state => ({ notifications: state.notifications.map(x => x.id === id ? { ...x, isRead: true } : x) }))
        if (n?.server) markNotificationsRead({ ids: [n.serverId] }).catch(() => {})
      },

      markAllRead: () => {
        set(state => ({ notifications: state.notifications.map(n => ({ ...n, isRead: true })) }))
        markNotificationsRead({ all: true }).catch(() => {})
      },

      removeNotification: (id) => {
        const n = get().notifications.find(x => x.id === id)
        set(state => ({ notifications: state.notifications.filter(x => x.id !== id) }))
        if (n?.server) dismissNotifications({ ids: [n.serverId] }).catch(() => {})
      },

      removeAllNotifications: () => {
        set({ notifications: [] })
        dismissNotifications({ all: true }).catch(() => {})
      },

      // Chegirma so'rovini tasdiqlash/rad etish — serverda; boshqa o'zgarishlar faqat mahalliy
      updateNotification: (id, data) => {
        const n = get().notifications.find(x => x.id === id)
        if (n?.server && n.type === 'DISCOUNT_REQUEST' && (data.status === 'approved' || data.status === 'rejected')) {
          resolveNotification(n.serverId, data.status)
            .then(row => get().upsertFromServer({ ...row, isRead: true }))
            .catch(e => { toast(errorText(e), 'error'); get().load() })
          set(state => ({ notifications: state.notifications.map(x => x.id === id ? { ...x, isRead: true } : x) }))
          return
        }
        set(state => ({
          notifications: state.notifications.map(x => x.id === id ? { ...x, ...data } : x)
        }))
      },

      getUnreadCount: () => {
        return get().notifications.filter(n => !n.isRead).length
      },

      // Sotuvchi uchun manfiy yozuvlar
      getSellerViolations: (userId) => {
        return get().notifications.filter(n =>
          n.sellerId === userId &&
          [
            'BARCODE_NOT_PRINTED',
            'BARCODE_REPRINTED',
            'BARCODE_SOLD_RESCAN',
            'DEVICE_LOGIN_ATTEMPT',
            'REPRINT_ALLOWED',
            'DEVICE_APPROVED',
          ].includes(n.type)
        )
      },
    }),
    {
      name: 'goodtires-notifications',
      // Server bildirishnomalari har ochilishda serverdan olinadi — localStorage'da faqat mahalliylari
      partialize: (s) => ({ notifications: s.notifications.filter(n => !n.server) }),
    }
  )
)
