import axios from 'axios'
import { cacheKey, putCached, getCached } from '../utils/httpCache'
import i18n from '../i18n'
import { getFreshToken, refreshSession, clearSession, getRefresh } from './session'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

const api = axios.create({
  baseURL: BASE_URL,
})

// Har so'rovga token qo'shish
api.interceptors.request.use(async (config) => {
  // Auth yo'llari (login, refresh) — tokenni oldindan yangilamaymiz
  const isAuthFlow = /\/api\/auth\/(login|refresh|logout|verify-face|session|attempts)/.test(config.url || '')
  const token = isAuthFlow ? localStorage.getItem('shina_token') : await getFreshToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Server xato matnlarini shu tilda qaytaradi
  config.headers['x-lang'] = i18n.language === 'ru' ? 'ru' : 'uz'
  return config
})

const clearAuthAndRedirect = () => {
  clearSession()
  // authStore persist state ni ham tozalash — /login → /dashboard infinite loop oldini olish
  try {
    const stored = JSON.parse(localStorage.getItem('shina-auth-storage') || '{}')
    if (stored?.state) {
      stored.state.isAuthenticated = false
      stored.state.user = null
      stored.state.token = null
      localStorage.setItem('shina-auth-storage', JSON.stringify(stored))
    }
  } catch {}
  window.location.href = '/login'
}

// Offlayn ko'rish: GET javoblari saqlanadi (auth dan tashqari)
const cacheable = (config) =>
  (config?.method || 'get').toLowerCase() === 'get' && (config.url || '').startsWith('/api/') && !config.url.startsWith('/api/auth')

api.interceptors.response.use(
  (response) => {
    if (cacheable(response.config)) putCached(cacheKey(response.config), response.data)
    return response
  },
  async (error) => {
    // Tarmoq xatosi (server javob bermadi) — oxirgi saqlangan ma'lumot qaytariladi
    if (!error.response && cacheable(error.config)) {
      const hit = await getCached(cacheKey(error.config))
      if (hit) return { data: hit.data, status: 200, statusText: 'OK (offline cache)', headers: { 'x-offline-cache': String(hit.at) }, config: error.config }
    }
    if (error.response?.status === 401) {
      const url = error.config?.url || ''
      const isLoginRequest = url.includes('/api/auth/login') || url.includes('/api/auth/refresh')
      // Access token muddati tugagan — jimgina yangilab, so'rov bir marta qayta yuboriladi
      if (!isLoginRequest && !error.config._retried && (error.response.data?.code === 'TOKEN_EXPIRED' || getRefresh())) {
        try {
          if (await refreshSession()) {
            error.config._retried = true
            return api(error.config)
          }
        } catch {
          // tarmoq xatosi — pastda oddiy xato sifatida qaytadi
          return Promise.reject(error)
        }
      }
      if (!isLoginRequest && window.location.pathname !== '/login') {
        clearAuthAndRedirect()
      }
    }
    if (error.response?.status === 403 && ['DEVICE_NOT_APPROVED', 'FACE_REQUIRED'].includes(error.response?.data?.code)) {
      clearAuthAndRedirect()
    }
    // axios ning inglizcha matnlari ("Network Error", "Request failed with status code 500") o'rniga
    if (!error.response) {
      error.message = i18n.t('err_network')
    } else if (!error.response.data?.error) {
      error.message = i18n.t('err_server')
    }
    return Promise.reject(error)
  }
)

export default api
