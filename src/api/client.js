import axios from 'axios'
import { cacheKey, putCached, getCached } from '../utils/httpCache'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

const api = axios.create({
  baseURL: BASE_URL,
})

// Har so'rovga token qo'shish
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('shina_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const clearAuthAndRedirect = () => {
  localStorage.removeItem('shina_token')
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
      const isLoginRequest = error.config?.url?.includes('/api/auth/login')
      if (!isLoginRequest && window.location.pathname !== '/login') {
        clearAuthAndRedirect()
      }
    }
    if (error.response?.status === 403 && error.response?.data?.code === 'DEVICE_NOT_APPROVED') {
      clearAuthAndRedirect()
    }
    return Promise.reject(error)
  }
)

export default api
