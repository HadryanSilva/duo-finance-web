<template>
  <div class="min-h-screen bg-surface-50 flex items-center justify-center">
    <div class="text-center">
      <div class="w-14 h-14 rounded-2xl bg-primary-500 flex items-center justify-center mx-auto mb-6">
        <i class="pi pi-heart text-white text-xl" />
      </div>

      <template v-if="!error">
        <div class="flex items-center justify-center gap-2 mb-3">
          <i class="pi pi-spin pi-spinner text-surface-400" />
          <span class="text-surface-600 font-medium">Autenticando...</span>
        </div>
        <p class="text-surface-400 text-sm">Você será redirecionado em instantes.</p>
      </template>

      <template v-else>
        <h2 class="font-display text-xl font-bold text-surface-900 mb-2">Algo deu errado</h2>
        <p class="text-surface-500 text-sm mb-6">{{ error }}</p>
        <button
          @click="$router.push('/login')"
          class="px-6 py-2.5 rounded-xl bg-surface-900 text-white text-sm font-medium hover:bg-surface-800 transition-colors"
        >
          Voltar ao login
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const error = ref<string | null>(null)

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  const accessToken  = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  // O Spring preserva o redirect via state do OAuth2 — o frontend salva no sessionStorage antes de iniciar o fluxo
  const redirect = sessionStorage.getItem('oauth2_redirect')

  if (!accessToken || !refreshToken) {
    error.value = 'Tokens não encontrados na URL. Tente fazer login novamente.'
    return
  }

  window.history.replaceState({}, document.title, window.location.pathname)
  sessionStorage.removeItem('oauth2_redirect')

  try {
    await auth.handleCallback(accessToken, refreshToken)

    if (redirect) {
      await router.push(redirect)
    } else if (auth.hasCouple) {
      router.push('/dashboard')
    } else {
      router.push('/couple')
    }
  } catch {
    error.value = 'Não foi possível carregar seus dados. Tente novamente.'
  }
})
</script>
