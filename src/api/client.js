import axios from 'axios'

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
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
