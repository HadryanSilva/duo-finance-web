<template>
  <div class="min-h-screen bg-surface-50 flex items-center justify-center p-4">
    <div class="card w-full max-w-sm text-center py-10">

      <!-- Sucesso -->
      <template v-if="joinSuccess">
        <div class="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <i class="pi pi-check text-green-600 text-xl" />
        </div>
        <h2 class="font-display text-xl font-bold text-surface-900 mb-2">Conta vinculada!</h2>
        <p class="text-surface-500 text-sm">Redirecionando para o painel...</p>
      </template>

      <!-- Erro -->
      <template v-else-if="joinError">
        <div class="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <i class="pi pi-times text-red-500 text-xl" />
        </div>
        <h2 class="font-display text-xl font-bold text-surface-900 mb-2">Convite inválido</h2>
        <p class="text-surface-500 text-sm mb-6">{{ joinError }}</p>
        <Button label="Ir para o início" size="small" @click="router.push('/')" />
      </template>

      <!-- Aguardando login -->
      <template v-else-if="waitingForLogin">
        <div class="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
          <i class="pi pi-heart text-primary-500 text-xl" />
        </div>
        <h2 class="font-display text-xl font-bold text-surface-900 mb-2">Convite recebido!</h2>
        <p class="text-surface-500 text-sm mb-6">
          Faça login ou crie uma conta para aceitar o convite e começar a gerenciar as finanças juntos.
        </p>
        <Button
          label="Fazer login"
          icon="pi pi-sign-in"
          class="w-full"
          @click="goToLogin"
        />
      </template>

      <!-- Processando -->
      <template v-else>
        <div class="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
          <i class="pi pi-spin pi-spinner text-primary-500 text-xl" />
        </div>
        <h2 class="font-display text-xl font-bold text-surface-900 mb-2">Aceitando convite...</h2>
        <p class="text-surface-500 text-sm">Vinculando sua conta ao casal.</p>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCoupleStore } from '@/stores/couple'
import Button from 'primevue/button'

const route       = useRoute()
const router      = useRouter()
const authStore   = useAuthStore()
const coupleStore = useCoupleStore()

const token          = route.params.token as string
const joinSuccess    = ref(false)
const joinError      = ref<string | null>(null)
const waitingForLogin = ref(false)

function goToLogin() {
  // Salva a URL do convite para redirecionar de volta após o login
  router.push({ name: 'login', query: { redirect: route.fullPath } })
}

async function acceptInvite() {
  try {
    await coupleStore.join(token)
    await authStore.fetchMe()
    joinSuccess.value = true
    setTimeout(() => router.push('/dashboard'), 2000)
  } catch (e) {
    joinError.value = e instanceof Error ? e.message : 'Erro ao aceitar convite. O link pode ter expirado.'
  }
}

onMounted(async () => {
  if (!token) {
    joinError.value = 'Link de convite inválido.'
    return
  }

  if (!authStore.isAuthenticated) {
    // Não está logado — mostra tela com botão de login em vez de spinner infinito
    waitingForLogin.value = true
    return
  }

  if (authStore.hasCouple) {
    joinError.value = 'Você já pertence a uma conta de casal.'
    return
  }

  await acceptInvite()
})
</script>
