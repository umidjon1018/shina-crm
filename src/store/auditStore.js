import { create } from 'zustand'
import { sendAudit } from '../api/auditService'

// Muhim amallarni (xodim, qurilma, narx, sotuv bekor/tahrir, sozlamalar) server o'zi yozadi.
// Brauzerdan faqat server bilmaydigan hodisalar yuboriladi — takror yozuv bo'lmasligi uchun.
const CLIENT_KEYS = new Set(['audit_session_login', 'audit_session_logout', 'audit_page_visited'])

export const useAuditStore = create(() => ({
  addLog: ({ actionKey, entity, details }) => {
    if (!CLIENT_KEYS.has(actionKey)) return
    sendAudit({ actionKey, entity, details: typeof details === 'string' ? details : '' }).catch(() => {})
  },
}))

try { localStorage.removeItem('goodtires-audit') } catch { /* eski mahalliy jurnal */ }
