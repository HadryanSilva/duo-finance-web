<template>
  <div class="min-h-screen bg-surface-50 flex">

    <!-- Lado esquerdo — decorativo -->
    <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-surface-900">
      <div class="absolute inset-0 opacity-[0.04]"
           style="background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px); background-size: 48px 48px;" />
      <div class="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary-500/10 blur-3xl" />
      <div class="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-primary-400/8 blur-3xl" />

      <div class="relative z-10 flex flex-col justify-between p-14 w-full">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center">
            <i class="pi pi-heart text-white text-sm" />
          </div>
          <span class="font-display text-white text-xl font-semibold tracking-tight">DuoFinance</span>
        </div>

        <div>
          <p class="text-surface-400 text-sm font-medium uppercase tracking-widest mb-6">Finanças a dois</p>
          <h1 class="font-display text-white text-5xl font-bold leading-tight mb-6">
            Controle financeiro<br />
            <span class="text-primary-400">feito para casal.</span>
          </h1>
          <p class="text-surface-400 text-lg leading-relaxed max-w-sm">
            Centralize receitas, despesas e relatórios em um espaço compartilhado com seu parceiro.
          </p>
        </div>

        <div class="flex gap-8">
          <div>
            <p class="font-display text-white text-3xl font-bold">100%</p>
            <p class="text-surface-500 text-sm mt-1">Privado</p>
          </div>
          <div>
            <p class="font-display text-white text-3xl font-bold">2</p>
            <p class="text-surface-500 text-sm mt-1">Parceiros</p>
          </div>
          <div>
            <p class="font-display text-white text-3xl font-bold">∞</p>
            <p class="text-surface-500 text-sm mt-1">Lançamentos</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Lado direito — formulário -->
    <div class="flex-1 flex items-center justify-center p-8">
      <div class="w-full max-w-sm">

        <!-- Logo mobile -->
        <div class="flex items-center gap-3 mb-10 lg:hidden">
          <div class="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center">
            <i class="pi pi-heart text-white text-sm" />
          </div>
          <span class="font-display text-surface-900 text-xl font-semibold">DuoFinance</span>
        </div>

        <!-- Título -->
        <div class="mb-8">
          <h2 class="font-display text-3xl font-bold text-surface-900 mb-2">
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

          <div>
            <label class="block text-sm font-medium text-surface-700 mb-1.5">Senha</label>
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

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 rounded-xl bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 active:scale-[0.99] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <i v-if="loading" class="pi pi-spin pi-spinner" />
            <span>{{ mode === 'register' ? 'Criar conta' : 'Entrar' }}</span>
          </button>
        </form>

        <!-- Divisor -->
        <div class="flex items-center gap-3 my-5">
          <div class="flex-1 h-px bg-surface-200" />
          <span class="text-surface-400 text-xs">ou</span>
          <div class="flex-1 h-px bg-surface-200" />
        </div>

        <!-- Botão Google -->
        <button
          @click="loginWithGoogle"
          :disabled="loading"
          class="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl border border-surface-200 bg-white text-surface-800 font-medium text-sm hover:bg-surface-50 hover:border-surface-300 active:scale-[0.99] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          style="box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.08)"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
          </svg>
          Continuar com Google
        </button>

        <p class="text-center text-surface-400 text-xs mt-8 leading-relaxed">
          Ao entrar, você concorda com nossos<br />
          <a href="#" class="text-surface-600 hover:text-surface-900 underline underline-offset-2">Termos de uso</a>
          e
          <a href="#" class="text-surface-600 hover:text-surface-900 underline underline-offset-2">Política de privacidade</a>.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authService } from '@/services'

const router = useRouter()
const route  = useRoute()
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

function switchMode(m: Mode) {
  mode.value  = m
  error.value = ''
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
      // Trata mensagens de erro do backend
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
  window.location.href = '/oauth2/authorization/google'
}
</script>
