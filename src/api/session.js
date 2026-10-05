// Sessiya tokenlari: access (15 daqiqa) + refresh (7 kun, har yangilashda almashadi).
// Yangilash bir vaqtda faqat bitta bo'ladi (bir nechta so'rov birdan 401 olsa ham).
const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')
const ACCESS_KEY = 'shina_token'
const REFRESH_KEY = 'shina_refresh'

export const getToken = () => localStorage.getItem(ACCESS_KEY)
export const getRefresh = () => localStorage.getItem(REFRESH_KEY)

export const setSession = ({ token, refreshToken }) => {
  if (token) localStorage.setItem(ACCESS_KEY, token)
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
}
export const clearSession = () => {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export const tokenPayload = (t = getToken()) => {
  try {
    const b = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(decodeURIComponent(escape(atob(b + '==='.slice((b.length + 3) % 4)))))
  } catch {
    return null
  }
}

let inflight = null
// true — yangi token olindi; false — sessiya tugagan (qayta kirish kerak)
export const refreshSession = () => {
  if (inflight) return inflight
  inflight = (async () => {
    const refreshToken = getRefresh()
    const p = tokenPayload()
    // Eski 7 kunlik token (turi yo'q) — refresh yo'q bo'lsa bir marta yangi sessiyaga o'tkaziladi
    const legacy = !refreshToken && p && !p.typ ? getToken() : null
    if (!refreshToken && !legacy) return false
    try {
      const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(legacy ? { Authorization: `Bearer ${legacy}` } : {}) },
        body: JSON.stringify(refreshToken ? { refreshToken } : {}),
      })
      if (res.status === 401) return false
      if (!res.ok) throw new Error('refresh ' + res.status)
      setSession(await res.json())
      return true
    } catch (e) {
      // Tarmoq xatosi — sessiya tugagan deb hisoblanmaydi (offlayn ishlash)
      throw e
    }
  })().finally(() => { inflight = null })
  return inflight
}

// fetch bilan ishlaydigan joylar uchun: muddati 60 soniyadan kam qolgan bo'lsa oldindan yangilanadi
export const getFreshToken = async () => {
  const p = tokenPayload()
  const soon = p?.typ === 'access' && p.exp && p.exp * 1000 - Date.now() < 60000
  const legacy = p && !p.typ && !getRefresh()
  if ((soon || legacy) && navigator.onLine !== false) {
    try { await refreshSession() } catch {}
  }
  return getToken()
}

// Chiqishda refresh token serverda bekor qilinadi (javob kutilmaydi)
export const revokeSessionOnServer = () => {
  const refreshToken = getRefresh()
  if (!refreshToken) return
  fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }), keepalive: true,
  }).catch(() => {})
}
