// Service worker: ilova fayllari telefonda saqlanadi — internet yo'q paytda ham ilova ochiladi.
// Yangi versiya tayyor bo'lsa avtomatik qayta yuklanmaydi (sotuv o'rtasida savat yo'qolmasligi uchun):
// 'pwa-update-ready' hodisasi beriladi, UpdateBanner foydalanuvchiga ko'rsatadi yoki xavfsiz paytda qo'llaydi.
import { registerSW } from 'virtual:pwa-register'

let updateReady = false
let applyUpdate = null

export const isUpdateReady = () => updateReady
export const applyPwaUpdate = () => applyUpdate?.(true)

if ('serviceWorker' in navigator) {
  applyUpdate = registerSW({
    onNeedRefresh() {
      updateReady = true
      window.dispatchEvent(new Event('pwa-update-ready'))
    },
    onRegisteredSW(_url, registration) {
      // Ochiq turgan ilovada ham yangi versiya soatiga bir tekshiriladi
      if (registration) setInterval(() => { if (navigator.onLine) registration.update() }, 60 * 60 * 1000)
    },
  })
}
