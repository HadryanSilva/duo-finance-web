import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services'
import type { UserInfo } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserInfo | null>(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const hasCouple = computed(() => !!user.value?.coupleId)
  const fullName = computed(() =>
    user.value ? `${user.value.firstName} ${user.value.lastName}` : ''
  )

  // Chamado após callback OAuth2 — salva tokens e carrega o usuário
  async function handleCallback(accessToken: string, refreshToken: string) {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    await fetchMe()
  }

  async function fetchMe() {
    loading.value = true
    try {
      user.value = await authService.me()
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await authService.logout()
    } catch {
      // ignora — faz logout local de qualquer forma
    } finally {
      user.value = null
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  }

  // Tenta restaurar sessão a partir do token salvo
  async function restoreSession(): Promise<boolean> {
    const token = localStorage.getItem('access_token')
    if (!token) return false
    try {
      await fetchMe()
      return true
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      return false
    }
  }

  // Usado após login/registro local — salva tokens sem precisar de outro request
  function setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
  }

  function setUser(u: UserInfo) {
    user.value = u
  }

  return { user, loading, isAuthenticated, hasCouple, fullName, handleCallback, fetchMe, logout, restoreSession, setTokens, setUser }
})
