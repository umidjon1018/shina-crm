import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Notification types:
// --- Oddiy xodimlar uchun ---
// 'BARCODE_NOT_PRINTED'   — barkod chop etilmagan holda sotildi
// 'BARCODE_REPRINTED'     — barkod qayta chop etildi
// 'BARCODE_SOLD_RESCAN'   — sotilgan tovar barkodi kiritildi
// 'DEVICE_LOGIN_ATTEMPT'  — boshqa qurilmadan kirish urinishi
// --- Boshqaruvchi uchun ---
// 'REPRINT_ALLOWED'       — barkod qayta chop ruxsati berildi
// 'DEVICE_APPROVED'       — boshqa qurilmadan kirgan xodim tasdiqlandi

export const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (notification) => {
        const n = {
          id: `N-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
          ...notification,
          createdAt: new Date().toISOString(),
          isRead: false,
        }
        set(state => ({ notifications: [n, ...state.notifications] }))
        return n
      },

      markRead: (id) => {
        set(state => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, isRead: true } : n
          )
        }))
      },

      markAllRead: () => {
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, isRead: true }))
        }))
      },

      removeNotification: (id) => {
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }))
      },

      removeAllNotifications: () => {
        set({ notifications: [] })
      },

      updateNotification: (id, data) => {
        set(state => ({
          notifications: state.notifications.map(n => n.id === id ? { ...n, ...data } : n)
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
    { name: 'goodtires-notifications' }
  )
)
