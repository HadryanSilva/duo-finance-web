<template>
  <div class="min-h-screen bg-gradient-to-br from-surface-50 to-surface-100 flex items-center justify-center p-4">
    <div class="w-full max-w-sm">

      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-surface-900 mb-4">
          <i class="pi pi-heart-fill text-white text-2xl" />
        </div>
        <h1 class="font-display text-2xl font-bold text-surface-900">DuoFinance</h1>
        <p class="text-surface-500 text-sm mt-1">Finanças a dois, juntos.</p>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-surface-100 p-8">

        <!-- Banner: sessão expirada por inatividade -->
        <div v-if="sessionExpired"
          class="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm mb-6">
          <i class="pi pi-clock text-amber-500 shrink-0" />
          <span>Sua sessão expirou por inatividade. Faça login novamente.</span>
        </div>

        <!-- Cabeçalho -->
        <div class="mb-6">
          <h2 class="font-display text-xl font-bold text-surface-900 mb-1">
            {{ mode === 'register' ? 'Criar conta' : 'Bem-vindo de volta' }}
          </h2>
          <p class="text-surface-500">
            {{ mode === 'register' ? 'Preencha seus dados para começar.' : 'Entre para continuar.' }}
          </p>
        </div>

        <!-- Tabs -->
        <div class="flex bg-surface-100 rounded-xl p-1 mb-6">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            @click="switchMode(tab.value)"
            class="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-150"
            :class="mode === tab.value
              ? 'bg-white text-surface-900 shadow-sm'
              : 'text-surface-500 hover:text-surface-700'"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Erro global -->
        <div v-if="error" class="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2">
          <i class="pi pi-exclamation-circle text-red-500 text-sm mt-0.5 shrink-0" />
          <p class="text-red-700 text-sm">{{ error }}</p>
        </div>

        <!-- Formulário email/senha -->
        <form @submit.prevent="submitLocal" class="space-y-4">

          <!-- Campos exclusivos do cadastro -->
          <template v-if="mode === 'register'">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-surface-700 mb-1.5">Nome</label>
                <input
                  v-model="firstName"
                  type="text"
                  required
                  placeholder="João"
                  class="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-white text-surface-900 text-sm placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-surface-700 mb-1.5">Sobrenome</label>
                <input
                  v-model="lastName"
                  type="text"
                  required
                  placeholder="Silva"
                  class="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-white text-surface-900 text-sm placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                />
              </div>
            </div>
          </template>

          <!-- E-mail -->
          <div>
            <label class="block text-sm font-medium text-surface-700 mb-1.5">E-mail</label>
            <input
              v-model="email"
              type="email"
              required
              placeholder="joao@email.com"
              class="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-white text-surface-900 text-sm placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
            />
          </div>

          <!-- Senha com link "Esqueci minha senha" -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-sm font-medium text-surface-700">Senha</label>
              <RouterLink
                v-if="mode === 'login'"
                to="/forgot-password"
                class="text-xs text-surface-400 hover:text-surface-700 transition-colors"
              >
                Esqueci minha senha
              </RouterLink>
            </div>
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                :minlength="mode === 'register' ? 8 : 1"
                placeholder="••••••••"
                class="w-full px-4 py-2.5 pr-11 rounded-xl border border-surface-200 bg-white text-surface-900 text-sm placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
              >
                <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" class="text-sm" />
              </button>
            </div>
            <p v-if="mode === 'register'" class="text-xs text-surface-400 mt-1.5">Mínimo de 8 caracteres</p>
          </div>

          <!-- Botão de submit -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 rounded-xl bg-surface-900 text-white font-medium text-sm hover:bg-surface-800 active:scale-[0.99] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <i v-if="loading" class="pi pi-spin pi-spinner" />
            <span>{{ mode === 'register' ? 'Criar conta' : 'Entrar' }}</span>
          </button>
        </form>

        <!-- Divisor -->
        <div class="flex items-center gap-3 my-5">
          <div class="flex-1 h-px bg-surface-100" />
          <span class="text-xs text-surface-400">ou</span>
          <div class="flex-1 h-px bg-surface-100" />
        </div>

        <!-- Login com Google -->
        <button
          @click="loginWithGoogle"
          :disabled="loading"
          class="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-surface-200 bg-white text-surface-700 text-sm font-medium hover:bg-surface-50 hover:border-surface-300 active:scale-[0.99] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar com Google
        </button>

        <!-- Rodapé informativo -->
        <p class="text-center text-xs text-surface-400 mt-6">
          Ao continuar, você concorda com nossos
          <span class="text-surface-600">Termos de Uso</span> e
          <span class="text-surface-600">Política de Privacidade</span>.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authService } from '@/services'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()

type Mode = 'login' | 'register'

const tabs = [
  { label: 'Entrar',      value: 'login'    as Mode },
  { label: 'Criar conta', value: 'register' as Mode },
]

const mode         = ref<Mode>('login')
const loading      = ref(false)
const error        = ref('')
const showPassword = ref(false)

const firstName = ref('')
const lastName  = ref('')
const email     = ref('')
const password  = ref('')

// Detecta redirecionamento por sessão expirada
const sessionExpired = computed(() => route.query.reason === 'session_expired')

function switchMode(m: Mode) {
  mode.value     = m
  error.value    = ''
  password.value = ''
}

async function submitLocal() {
  error.value   = ''
  loading.value = true
  try {
    let tokens
    if (mode.value === 'register') {
      tokens = await authService.register(firstName.value, lastName.value, email.value, password.value)
    } else {
      tokens = await authService.login(email.value, password.value)
    }
    authStore.setTokens(tokens.accessToken, tokens.refreshToken)
    authStore.setUser(tokens.user)
    const redirect = route.query.redirect as string | undefined
    await router.push(redirect || '/dashboard')
  } catch (e: unknown) {
    if (e instanceof Error) {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message
      error.value = msg ?? e.message
    } else {
      error.value = 'Erro inesperado. Tente novamente.'
    }
  } finally {
    loading.value = false
  }
}

function loginWithGoogle() {
  loading.value = true
  const redirect = route.query.redirect as string | undefined
  if (redirect) {
    sessionStorage.setItem('oauth2_redirect', redirect)
  } else {
    sessionStorage.removeItem('oauth2_redirect')
  }
  const apiUrl = import.meta.env.VITE_API_URL ?? ''
  window.location.href = apiUrl + '/oauth2/authorization/google'
}
</script>
