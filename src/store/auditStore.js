import { create } from 'zustand'
import { sendAudit } from '../api/auditService'

// Barcha amallarni (kirish/chiqish, sotuv, kirim, xarajat, xodim, sozlamalar…) server o'zi yozadi.
// Brauzerdan hech narsa yuborilmaydi; sahifa ochilishlari jurnalga kirmaydi.
const CLIENT_KEYS = new Set()

export const useAuditStore = create(() => ({
  addLog: ({ actionKey, entity, details }) => {
    if (!CLIENT_KEYS.has(actionKey)) return
    sendAudit({ actionKey, entity, details: typeof details === 'string' ? details : '' }).catch(() => {})
  },
}))

try { localStorage.removeItem('goodtires-audit') } catch { /* eski mahalliy jurnal */ }
