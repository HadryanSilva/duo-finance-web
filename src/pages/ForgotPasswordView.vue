<template>
  <div class="min-h-screen bg-gradient-to-br from-surface-50 to-surface-100 flex items-center justify-center p-4">
    <div class="w-full max-w-sm">

      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-surface-900 mb-4">
          <i class="pi pi-heart-fill text-white text-2xl" />
        </div>
        <h1 class="font-display text-2xl font-bold text-surface-900">DuoFinance</h1>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-surface-100 p-8">

        <!-- Sucesso -->
        <template v-if="sent">
          <div class="text-center">
            <div class="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <i class="pi pi-envelope text-green-600 text-2xl" />
            </div>
            <h2 class="font-display text-xl font-bold text-surface-900 mb-2">Verifique seu e-mail</h2>
            <p class="text-sm text-surface-500 mb-6">
              Se o endereço <span class="font-medium text-surface-700">{{ email }}</span>
              estiver cadastrado, você receberá um link para redefinir sua senha em breve.
            </p>
            <p class="text-xs text-surface-400 mb-6">O link expira em 1 hora.</p>
            <router-link
              to="/login"
              class="text-sm font-medium text-surface-700 hover:text-surface-900 transition-colors"
            >
              ← Voltar para o login
            </router-link>
          </div>
        </template>

        <!-- Formulário -->
        <template v-else>
          <div class="mb-6">
            <h2 class="font-display text-xl font-bold text-surface-900 mb-1">Esqueceu a senha?</h2>
            <p class="text-sm text-surface-500">Informe seu e-mail e enviaremos um link de redefinição.</p>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-surface-700 mb-1.5">E-mail</label>
              <input
                v-model="email"
                type="email"
                placeholder="joao@email.com"
                :disabled="loading"
                @keydown.enter="submit"
                class="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-white text-surface-900 text-sm placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all disabled:opacity-50"
              />
            </div>

            <button
              @click="submit"
              :disabled="loading || !email.trim()"
              class="w-full py-2.5 rounded-xl bg-surface-900 text-white text-sm font-medium transition-all hover:bg-surface-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <i v-if="loading" class="pi pi-spin pi-spinner text-sm" />
              {{ loading ? 'Enviando...' : 'Enviar link' }}
            </button>
          </div>

          <div class="mt-6 text-center">
            <router-link
              to="/login"
              class="text-sm text-surface-500 hover:text-surface-700 transition-colors"
            >
              ← Voltar para o login
            </router-link>
          </div>
        </template>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { authService } from '@/services'

const email   = ref('')
const loading = ref(false)
const sent    = ref(false)

async function submit() {
  if (!email.value.trim() || loading.value) return
  loading.value = true
  try {
    await authService.forgotPassword(email.value.trim())
  } finally {
    // Sempre mostra a tela de sucesso — não vaza se o e-mail existe ou não
    loading.value = false
    sent.value    = true
  }
}
</script>
