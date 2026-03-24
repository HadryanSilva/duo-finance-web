import axios, { type AxiosError } from 'axios'

const BASE = import.meta.env.VITE_API_URL ?? ''

const api = axios.create({
  baseURL: `${BASE}/api`,
  headers: { 'Content-Type': 'application/json' }
})

// Instância separada para endpoints fora do prefixo /api (ex: /auth/refresh, /auth/logout)
export const authApi = axios.create({
  baseURL: `${BASE}/auth`,
  headers: { 'Content-Type': 'application/json' }
})

// Injeta token no authApi
authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Request: injeta o access token ───────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response: lida com 401 e tenta refresh ────────────────────────────────────
let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }
    const status = error.response?.status

    // ── 502 / 503 / 504: gateway error — API temporariamente indisponível ────
    // Não tenta refresh nem redireciona — apenas propaga o erro para que
    // o componente exiba uma mensagem adequada ao usuário.
    if (status === 502 || status === 503 || status === 504) {
      return Promise.reject(new Error('Serviço temporariamente indisponível. Tente novamente em instantes.'))
    }

    // ── 401: token expirado — tenta refresh ───────────────────────────────────
    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest!.headers!.Authorization = `Bearer ${token}`
          return api(originalRequest!)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refresh_token')

      if (!refreshToken) {
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(`${BASE}/auth/refresh`, { refreshToken })
        localStorage.setItem('access_token', data.accessToken)
        localStorage.setItem('refresh_token', data.refreshToken)
        processQueue(null, data.accessToken)
        originalRequest!.headers!.Authorization = `Bearer ${data.accessToken}`
        return api(originalRequest!)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
