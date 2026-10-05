import { create } from 'zustand'
import { clearHttpCache } from '../utils/httpCache'
import { persist } from 'zustand/middleware'
import api from '../api/client'
import { useSettingsStore } from './settingsStore'
import { useShopStore } from './shopStore'
import { useNotificationStore } from './notificationStore'
import { setSession, clearSession, revokeSessionOnServer } from '../api/session'
import { useAuditStore } from './auditStore'

const SESSION_ACTION_KEYS = {
  'Tizimga kirdi (online)': 'audit_session_login',
  'Tizimdan chiqdi (offline)': 'audit_session_logout',
}
const logSession = (user, action) => {
  useAuditStore.getState().addLog({
    userId: user?.id,
    userName: user?.fullName || user?.name || user?.username,
    action,
    actionKey: SESSION_ACTION_KEYS[action],
    entity: 'session',
    details: user?.username,
  })
}

// Rol bo'yicha ruxsatlar
const rolePermissions = {
  admin:       ['all'],
  manager:     ['warehouse', 'sales', 'income', 'expenses', 'reports', 'ai_agent'],
  seller:      ['warehouse', 'sales', 'income', 'ai_agent'],
  storekeeper: ['warehouse', 'income'],
  technician:  ['warehouse', 'sales'],
}

const getOrCreateDeviceId = () => {
  let id = localStorage.getItem('shina_device_id')
  if (!id) {
    id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9)
    localStorage.setItem('shina_device_id', id)
  }
  return id
}

// { deviceId, userId } formatida saqlash
const getTrustedDevices = () => {
  try {
    const raw = JSON.parse(localStorage.getItem('shina_trusted_devices') || '[]')
    // Eski format (string array) bilan moslik
    return raw.map(d => typeof d === 'string' ? { deviceId: d, userId: null } : d)
  } catch { return [] }
}

const isTrustedDevice = (deviceId) => getTrustedDevices().some(d => d.deviceId === deviceId)

const saveTrustedDevice = (deviceId, userId = null) => {
  const devices = getTrustedDevices()
  if (!devices.some(d => d.deviceId === deviceId)) {
    devices.push({ deviceId, userId })
    localStorage.setItem('shina_trusted_devices', JSON.stringify(devices))
  }
}

const removeUserTrustedDevices = (userId, keepDeviceId) => {
  const devices = getTrustedDevices()
  const filtered = devices.filter(d => d.userId !== userId || d.deviceId === keepDeviceId)
  localStorage.setItem('shina_trusted_devices', JSON.stringify(filtered))
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      deviceStatus: 'idle', // idle | pending | approved | rejected
      deviceId: getOrCreateDeviceId(),

      // Step 1: check credentials, return whether selfie needed
      checkCredentials: async (credentials) => {
        try {
          const deviceId = getOrCreateDeviceId()
          // flow 2: server faqat vaqtinchalik token beradi, to'liq sessiya yuz tasdiqlangandan keyin
          const res = await api.post('/api/auth/login', { ...credentials, deviceId, flow: 2 })
          const { token, user: backendUser } = res.data
          const user = {
            ...backendUser,
            fullName: backendUser.full_name,
            allowMultiDevice: backendUser.allow_multi_device || false,
            // Xodimga Management da alohida ruxsat berilgan bo'lsa — o'sha ishlatiladi,
            // aks holda rol bo'yicha standart ruxsatlar
            permissions: (Array.isArray(backendUser.permissions) && backendUser.permissions.length > 0)
              ? backendUser.permissions
              : (rolePermissions[backendUser.role] || ['sales']),
            access: backendUser.access || null,
          }
          const restrictedRoles = ['seller', 'storekeeper', 'technician']
          if (restrictedRoles.includes(user.role) && user.shop_id) {
            useShopStore.getState().setSelectedShop(user.shop_id)
          }
          clearSession()
          localStorage.setItem('shina_token', token)
          set({ user, token })
          return { success: true }
        } catch (err) {
          const msg = err.response?.data?.error
          return { success: false, message: msg || "Server bilan bog'lanishda xatolik" }
        }
      },

      // Step 2: submit selfie + device info
      submitSelfie: async (selfieBase64, descriptor) => {
        const { deviceId, user } = get()
        let data
        try {
          const res = await api.post('/api/auth/verify-face', {
            descriptor: descriptor ? Array.from(descriptor) : null,
            selfie: selfieBase64,
          })
          data = res.data
        } catch (err) {
          return { status: 'error', message: err.response?.data?.error || err.message }
        }
        if (data.status === 'face_mismatch') return { status: 'face_mismatch' }
        if (data.status === 'approved') {
          setSession(data)
          saveTrustedDevice(deviceId, user?.id)
          set({ token: data.token, isAuthenticated: true, deviceStatus: 'approved' })
          logSession(user, 'Tizimga kirdi (online)')
          return { status: 'approved' }
        }

        // Yangi qurilma: yuz mos bo'lsa ham admin/manager tasdiqlashi kerak
        set({ deviceStatus: 'pending' })
        const notifSettings = useSettingsStore.getState().notificationSettings
        if (notifSettings?.DEVICE_LOGIN_ATTEMPT !== false) {
          useNotificationStore.getState().addNotification({
            type: 'DEVICE_LOGIN_ATTEMPT',
            severity: 'warning',
            title: 'Boshqa qurilmadan kirish urinishi',
            message: `"${user?.fullName || user?.username}" yangi qurilmadan tizimga kirmoqchi (${deviceId})`,
            titleKey: 'notif_title_device_login',
            messageKey: 'notif_msg_device_login',
            messageParams: { name: user?.fullName || user?.username, deviceId },
            deviceId,
            userId: user?.id,
            username: user?.username,
          })
        }
        return { status: 'pending' }
      },


      // 5 marta FaceID muvaffaqiyatsiz — vizual tasdiqlash so'rovi
      submitFaceReview: async (selfieBase64) => {
        const { deviceId, user } = get()
        try {
          await api.post('/api/auth/attempts', {
            deviceId,
            selfie: selfieBase64,
            faceMatch: null,
            descriptor: null,
            reviewRequest: true,
          })
        } catch {}
        set({ deviceStatus: 'pending' })
        const notifSettings = useSettingsStore.getState().notificationSettings
        if (notifSettings?.DEVICE_LOGIN_ATTEMPT !== false) {
          useNotificationStore.getState().addNotification({
            type: 'DEVICE_LOGIN_ATTEMPT',
            severity: 'warning',
            title: 'Yuz tasdiqlash so\'rovi',
            message: `"${user?.fullName || user?.username}" yuzini FaceID taniy olmadi — vizual tasdiqlash so'raldi`,
            titleKey: 'notif_title_device_login',
            messageKey: 'notif_msg_device_login',
            messageParams: { name: user?.fullName || user?.username, deviceId },
            deviceId,
            userId: user?.id,
            username: user?.username,
          })
        }
        return { status: 'pending' }
      },

      // Admin approves device
      approveDevice: async (deviceId) => {
        let attempt = null
        try {
          const res = await api.get('/api/auth/attempts')
          attempt = res.data.find(a => a.device_id === deviceId)
          await api.patch(`/api/auth/attempts/${deviceId}/approve`)
        } catch {}

        const targetRole = attempt?.role
        const targetUserId = attempt?.user_id
        // Admin emas bo'lsa — eski ishonchli qurilmalarni local dan o'chirish
        if (targetRole !== 'admin' && targetUserId) {
          removeUserTrustedDevices(targetUserId, deviceId)
        }

        saveTrustedDevice(deviceId, targetUserId)
        const { deviceId: currentDeviceId, user: currentUser } = get()
        if (deviceId === currentDeviceId) {
          set({ isAuthenticated: true, deviceStatus: 'approved' })
          logSession(currentUser, 'Tizimga kirdi (online)')
        }

        const notifSettings = useSettingsStore.getState().notificationSettings
        if (notifSettings?.DEVICE_APPROVED !== false) {
          useNotificationStore.getState().addNotification({
            type: 'DEVICE_APPROVED',
            severity: 'info',
            title: 'Qurilma tasdiqlandi',
            message: `"${attempt?.full_name || attempt?.username || 'Xodim'}" qurilmasi tasdiqlandi va kirish ruxsati berildi`,
            titleKey: 'notif_title_device_approved',
            messageKey: 'notif_msg_device_approved',
            messageParams: { name: attempt?.full_name || attempt?.username || 'Xodim' },
            deviceId,
          })
        }
      },

      // Admin/manager revokes an approved device (e.g. lost phone)
      revokeDevice: async (deviceId) => {
        try {
          await api.patch(`/api/auth/attempts/${deviceId}/revoke`)
        } catch {}
      },

      // Admin rejects device
      rejectDevice: async (deviceId) => {
        const { deviceId: currentDeviceId } = get()
        if (deviceId === currentDeviceId) {
          clearSession()
          set({ deviceStatus: 'rejected', user: null, token: null })
        }
        try {
          await api.patch(`/api/auth/attempts/${deviceId}/reject`)
        } catch {}
      },

      // Pending ekranida turgan foydalanuvchi uchun — qurilma tasdiqlanganini tekshiradi
      checkApprovalStatus: async () => {
        const { deviceId, deviceStatus, user } = get()
        if (deviceStatus !== 'pending') return
        try {
          // Har qanday xodim o'z qurilmasi holatini ko'ra oladi
          const res = await api.get(`/api/auth/attempts/my-status?deviceId=${deviceId}`)
          const { status } = res.data
          if (status === 'approved') {
            // Vaqtinchalik token to'liq sessiyaga almashtiriladi (server tasdiq shu login davomida bo'lganini tekshiradi)
            const ses = await api.post('/api/auth/session')
            setSession(ses.data)
            set({ token: ses.data.token })
            saveTrustedDevice(deviceId, user?.id)
            set({ isAuthenticated: true, deviceStatus: 'approved' })
            logSession(user, 'Tizimga kirdi (online)')
          } else if (status === 'rejected') {
            clearSession()
            set({ deviceStatus: 'rejected', user: null, token: null })
          }
        } catch {}
      },

      // Admin o'z profilini yangilaydi — users jadvalini backend orqali
      updateAdminProfile: async ({ full_name, username, password }) => {
        const { user } = get()
        if (!user) return { success: false, message: "Ruxsat yo'q" }
        try {
          const res = await api.put('/api/auth/me', {
            full_name: full_name || undefined,
            username: username || undefined,
            password: password || undefined,
          })
          set({ user: { ...user, username: res.data.username, fullName: res.data.full_name } })
          return { success: true }
        } catch (err) {
          const msg = err.response?.data?.error
          return { success: false, message: msg || "O'zgartirishda xatolik" }
        }
      },

      verifyPassword: async (password) => {
        try {
          const { data } = await api.post('/api/auth/verify-password', { password })
          return data.valid === true
        } catch {
          return false
        }
      },

      // Xodim o'z login/parolini o'zgartiradi — backend orqali
      updateProfile: async ({ username, password }) => {
        const { user } = get()
        if (!user) return { success: false, message: "Ruxsat yo'q" }
        try {
          const endpoint = user.role === 'admin' ? '/api/auth/me' : `/api/employees/${user.id}`
          const body = user.role === 'admin'
            ? { username, password: password || undefined, full_name: user.fullName }
            : { name: user.fullName || user.username, username, password: password || undefined, role: user.role }
          await api.put(endpoint, body)
          set({ user: { ...user, username } })
          return { success: true }
        } catch (err) {
          const msg = err.response?.data?.error
          return { success: false, message: msg || "O'zgartirishda xatolik" }
        }
      },

      logout: () => {
        const { user, isAuthenticated } = get()
        if (isAuthenticated) logSession(user, 'Tizimdan chiqdi (offline)')
        revokeSessionOnServer()
        clearSession()
        clearHttpCache()
        set({ user: null, token: null, isAuthenticated: false, deviceStatus: 'idle' })
      },

      hasPermission: (permission) => {
        const { user } = get()
        if (!user) return false
        if (user.permissions.includes('all')) return true
        const settings = useSettingsStore.getState()
        // Xodimga individual ruxsat berilgan bo'lsa — lavozim o'rniga shu ishlatiladi
        const own = user.access && Array.isArray(user.access.checked) ? user.access : null
        const denied = own ? (own.denied || []) : (settings.roleDeniedNodes?.[user.role] || [])
        if (denied.includes(permission)) return false
        const tree = own ? own.checked : (settings.roleAccessTrees?.[user.role] || [])
        const parts = permission.split('.')
        for (let i = parts.length; i > 0; i--) {
          if (tree.includes(parts.slice(0, i).join('.'))) return true
        }
        // Bo'limning faqat ayrim tablari belgilangan bo'lsa ham bo'limning o'ziga kirish bor
        return tree.some(id => id.startsWith(permission + '.'))
      },
    }),
    {
      name: 'shina-auth-storage',
    }
  )
)
