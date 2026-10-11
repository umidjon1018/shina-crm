import { API_BASE_URL } from '../api/apiBase'
const BASE = API_BASE_URL
const tg = () => window.Telegram?.WebApp

export const initData = () => tg()?.initData || new URLSearchParams(location.hash.slice(1)).get('dev_init') || ''

export const imageUrl = (id) => (id ? `${BASE}/api/product-images/${id}/file` : null)

export const api = async (path, { method = 'GET', body } = {}) => {
  const r = await fetch(`${BASE}/api/tg-shop${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': initData(), 'x-lang': 'uz' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await r.json().catch(() => null)
  if (!r.ok) {
    const e = new Error(data?.error || "Server bilan bog'lanib bo'lmadi")
    e.code = data?.code
    e.status = r.status
    throw e
  }
  return data
}

export const haptic = (kind = 'light') => {
  try { kind === 'success' || kind === 'error' ? tg()?.HapticFeedback?.notificationOccurred(kind) : tg()?.HapticFeedback?.impactOccurred(kind) } catch {}
}

export const fmt = (v) => Math.round(Number(v) || 0).toLocaleString('ru-RU').replace(/[\s,]/g, ' ')
