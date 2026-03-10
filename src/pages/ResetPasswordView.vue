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

        <!-- Token ausente na URL -->
        <template v-if="!token">
          <div class="text-center">
            <i class="pi pi-exclamation-triangle text-amber-500 text-3xl mb-3 block" />
            <h2 class="font-display text-lg font-bold text-surface-900 mb-2">Link inválido</h2>
            <p class="text-sm text-surface-500 mb-6">Este link de redefinição é inválido ou está incompleto.</p>
            <router-link to="/forgot-password" class="text-sm font-medium text-surface-700 hover:text-surface-900">
              Solicitar novo link
            </router-link>
          </div>
        </template>

        <!-- Sucesso -->
        <template v-else-if="done">
          <div class="text-center">
            <div class="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <i class="pi pi-check text-green-600 text-2xl" />
            </div>
            <h2 class="font-display text-xl font-bold text-surface-900 mb-2">Senha redefinida!</h2>
            <p class="text-sm text-surface-500 mb-6">Sua nova senha foi salva. Faça login para continuar.</p>
            <router-link
              to="/login"
              class="inline-block px-5 py-2.5 rounded-xl bg-surface-900 text-white text-sm font-medium hover:bg-surface-800 transition-colors"
            >
              Ir para o login
            </router-link>
          </div>
        </template>

        <!-- Formulário -->
        <template v-else>
          <div class="mb-6">
            <h2 class="font-display text-xl font-bold text-surface-900 mb-1">Nova senha</h2>
            <p class="text-sm text-surface-500">Escolha uma senha com pelo menos 8 caracteres.</p>
          </div>

          <!-- Erro -->
          <div v-if="error" class="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2">
            <i class="pi pi-exclamation-circle text-red-500 text-sm mt-0.5 shrink-0" />
            <p class="text-red-700 text-sm">{{ error }}</p>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-surface-700 mb-1.5">Nova senha</label>
              <div class="relative">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Mínimo 8 caracteres"
                  :disabled="loading"
                  class="w-full px-4 py-2.5 pr-10 rounded-xl border border-surface-200 bg-white text-surface-900 text-sm placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
                >
                  <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" class="text-sm" />
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-surface-700 mb-1.5">Confirmar senha</label>
              <input
                v-model="confirm"
                type="password"
                placeholder="Repita a nova senha"
                :disabled="loading"
                @keydown.enter="submit"
                class="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-white text-surface-900 text-sm placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all disabled:opacity-50"
              />
            </div>

            <button
              @click="submit"
              :disabled="loading || !canSubmit"
              class="w-full py-2.5 rounded-xl bg-surface-900 text-white text-sm font-medium transition-all hover:bg-surface-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <i v-if="loading" class="pi pi-spin pi-spinner text-sm" />
              {{ loading ? 'Salvando...' : 'Salvar nova senha' }}
            </button>
          </div>
        </template>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { authService } from '@/services'

const route = useRoute()
const token = computed(() => route.query.token as string | undefined)

const password     = ref('')
const confirm      = ref('')
const showPassword = ref(false)
const loading      = ref(false)
const done         = ref(false)
const error        = ref<string | null>(null)

const canSubmit = computed(() =>
  password.value.length >= 8 && password.value === confirm.value
)

async function submit() {
  if (!canSubmit.value || loading.value || !token.value) return

  error.value   = null
  loading.value = true

  try {
    await authService.resetPassword(token.value, password.value)
    done.value = true
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    error.value = err?.response?.data?.detail ?? 'Link inválido ou expirado. Solicite um novo.'
  } finally {
    loading.value = false
  }
}
</script>
