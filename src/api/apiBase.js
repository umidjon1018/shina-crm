// API manzili. GoodTires (gt.sicrm.uz) — .env VITE_API_URL (sicrm.uz).
// Boshqa kompaniyalar (<kod>.sicrm.uz) — o'z domenidagi /api: nginx uni shu kompaniyaning backend jarayoniga yo'naltiradi.
const ENV_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')
const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : ''
const tenantHost = /^[a-z0-9][a-z0-9-]{1,29}\.sicrm\.uz$/.test(host) && host !== 'gt.sicrm.uz'

export const API_BASE_URL = tenantHost ? window.location.origin : ENV_BASE
// Tashqi xizmatlarga beriladigan to'liq manzil (webhook, ochiq API)
export const API_PUBLIC_URL = API_BASE_URL || window.location.origin
