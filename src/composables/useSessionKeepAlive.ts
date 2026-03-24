import { onMounted, onUnmounted, ref } from 'vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const BASE = import.meta.env.VITE_API_URL ?? ''

/**
 * Mantém a sessão ativa renovando o access token proativamente.
 *
 * Estratégia:
 *  - Decodifica o JWT para saber quando expira
 *  - Agenda um refresh 2 minutos antes da expiração
 *  - Só renova se o usuário esteve ativo nos últimos 10 minutos
 *  - Em caso de falha no refresh, redireciona para /login com aviso
 */
export function useSessionKeepAlive() {
  const auth   = useAuthStore()
  const router = useRouter()

  let refreshTimer: ReturnType<typeof setTimeout> | null = null
  const lastActivity = ref(Date.now())

  // ── Detecta atividade do usuário ──────────────────────────────────────────

  const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const
  const INACTIVE_THRESHOLD_MS = 10 * 60 * 1000 // 10 minutos sem atividade = não renova

  function onActivity() {
    lastActivity.value = Date.now()
  }

  function isUserActive() {
    return Date.now() - lastActivity.value < INACTIVE_THRESHOLD_MS
  }

  // ── Decodifica JWT (sem verificar assinatura — só lê o payload) ───────────

  function getTokenExpiry(token: string): number | null {
    try {
      const payload = token.split('.')[1]
      if (!payload) return null
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
      return decoded.exp ? decoded.exp * 1000 : null // converte para ms
    } catch {
      return null
    }
  }

  // ── Executa o refresh ─────────────────────────────────────────────────────

  async function doRefresh() {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      redirectToLogin()
      return
    }

    try {
      const { data } = await axios.post(`${BASE}/auth/refresh`, { refreshToken })
      localStorage.setItem('access_token',  data.accessToken)
      localStorage.setItem('refresh_token', data.refreshToken)
      scheduleNextRefresh()
    } catch {
      // Refresh token expirado ou inválido
      redirectToLogin()
    }
  }

  function redirectToLogin() {
    auth.logout()
    router.push({ name: 'login', query: { reason: 'session_expired' } })
  }

  // ── Agenda o próximo refresh ──────────────────────────────────────────────

  function scheduleNextRefresh() {
    if (refreshTimer) clearTimeout(refreshTimer)

    const token = localStorage.getItem('access_token')
    if (!token) return

    const expiry = getTokenExpiry(token)
    if (!expiry) return

    const now           = Date.now()
    const REFRESH_AHEAD = 2 * 60 * 1000  // renova 2 minutos antes de expirar
    const delay         = expiry - now - REFRESH_AHEAD

    if (delay <= 0) {
      // Token já expirado ou prestes a expirar — renova agora se usuário ativo
      if (isUserActive()) doRefresh()
      return
    }

    refreshTimer = setTimeout(() => {
      if (isUserActive()) {
        doRefresh()
      } else {
        // Usuário inativo: agenda verificação daqui 1 minuto
        // Se ficar ativo antes do token expirar, o interceptor reativo cobre
        refreshTimer = setTimeout(() => scheduleNextRefresh(), 60_000)
      }
    }, delay)
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  onMounted(() => {
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, onActivity, { passive: true }))
    scheduleNextRefresh()
  })

  onUnmounted(() => {
    ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, onActivity))
    if (refreshTimer) clearTimeout(refreshTimer)
  })
}
