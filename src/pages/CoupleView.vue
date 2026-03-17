<template>
  <div class="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">

    <!-- Fluxo de aceitar convite via link -->
    <template v-if="joinToken">
      <div class="card text-center py-10">
        <template v-if="joinSuccess">
          <div class="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <i class="pi pi-check text-green-600 text-xl" />
          </div>
          <h2 class="font-display text-xl font-bold text-surface-900 mb-2">Conta vinculada!</h2>
          <p class="text-surface-500 text-sm">Redirecionando para o painel...</p>
        </template>
        <template v-else-if="joinError">
          <div class="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <i class="pi pi-times text-red-500 text-xl" />
          </div>
          <h2 class="font-display text-xl font-bold text-surface-900 mb-2">Convite inválido</h2>
          <p class="text-surface-500 text-sm mb-6">{{ joinError }}</p>
          <Button label="Voltar ao início" size="small" @click="router.push('/couple')" />
        </template>
        <template v-else>
          <div class="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <i class="pi pi-spin pi-spinner text-primary-500 text-xl" />
          </div>
          <h2 class="font-display text-xl font-bold text-surface-900 mb-2">Aceitando convite...</h2>
          <p class="text-surface-500 text-sm">Vinculando sua conta ao casal.</p>
        </template>
      </div>
    </template>

    <!-- Sem casal: criar conta -->
    <template v-else-if="!coupleStore.couple">
      <div class="text-center py-8">
        <div class="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-5">
          <i class="pi pi-users text-surface-400 text-2xl" />
        </div>
        <h2 class="font-display text-2xl font-bold text-surface-900 mb-2">Crie sua conta de casal</h2>
        <p class="text-surface-500 text-sm max-w-sm mx-auto">
          Dê um nome para a conta compartilhada. Depois convide seu parceiro para se juntar.
        </p>
      </div>

      <div class="card">
        <label class="block text-sm font-medium text-surface-700 mb-2">Nome da conta</label>
        <InputText v-model="newCoupleName" placeholder="Ex: Pedro & Ana" class="w-full" @keydown.enter="createCouple" />
        <p class="text-xs text-surface-400 mt-2">Pode ser alterado depois.</p>
        <Button label="Criar conta" icon="pi pi-plus" class="mt-4 w-full" :loading="coupleStore.loading" :disabled="!newCoupleName.trim()" @click="createCouple" />
      </div>
    </template>

    <!-- Com casal -->
    <template v-else>

      <!-- Info da conta -->
      <div class="card">
        <div class="flex items-start justify-between mb-5">
          <div>
            <p class="text-xs text-surface-400 uppercase tracking-wider font-medium mb-1">Conta do casal</p>
            <h2 class="font-display text-2xl font-bold text-surface-900">{{ coupleStore.couple.name }}</h2>
          </div>
          <button @click="startEdit()" class="w-9 h-9 rounded-xl flex items-center justify-center text-surface-400 hover:bg-surface-50 hover:text-surface-700 transition-colors">
            <i class="pi pi-pencil text-sm" />
          </button>
        </div>

        <!-- Editar nome inline -->
        <div v-if="editingName" class="flex gap-2 mb-5">
          <InputText v-model="editName" class="flex-1" @keydown.enter="saveName" @keydown.escape="editingName = false" />
          <Button icon="pi pi-check" @click="saveName" :loading="savingName" />
          <Button icon="pi pi-times" severity="secondary" @click="editingName = false" />
        </div>

        <!-- Membros -->
        <div class="space-y-3">
          <div v-for="member in coupleStore.couple.members" :key="member.id" class="flex items-center gap-3 p-3 rounded-xl bg-surface-50">
            <img v-if="member.avatarUrl" :src="member.avatarUrl" :alt="member.firstName" class="w-10 h-10 rounded-full object-cover" />
            <div v-else class="w-10 h-10 rounded-full bg-surface-200 flex items-center justify-center">
              <span class="font-medium text-surface-600">{{ member.firstName[0] }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-surface-800">{{ member.firstName }} {{ member.lastName }}</p>
              <p class="text-xs text-surface-400 truncate">{{ member.email }}</p>
            </div>
            <span v-if="member.id === authStore.user?.id" class="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full shrink-0">
              Você
            </span>
          </div>

          <!-- Slot para parceiro pendente -->
          <div v-if="coupleStore.couple.waitingForPartner" class="flex items-center gap-3 p-3 rounded-xl border border-dashed border-surface-200">
            <div class="w-10 h-10 rounded-full border-2 border-dashed border-surface-300 flex items-center justify-center">
              <i class="pi pi-question text-surface-300 text-sm" />
            </div>
            <div>
              <p class="text-sm font-medium text-surface-500">Aguardando parceiro</p>
              <p class="text-xs text-surface-400">Convite enviado — pendente de aceite</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Convidar parceiro -->
      <div v-if="coupleStore.couple.waitingForPartner || coupleStore.couple.members.length < 2" class="card">
        <h3 class="font-display font-semibold text-surface-900 mb-1">Convidar parceiro</h3>
        <p class="text-sm text-surface-400 mb-4">Enviaremos um e-mail com link de acesso. O convite expira em 72 horas.</p>
        <div class="flex gap-2">
          <InputText v-model="inviteEmail" placeholder="email@exemplo.com" class="flex-1" type="email" @keydown.enter="sendInvite" />
          <Button label="Enviar" icon="pi pi-send" :loading="sendingInvite" :disabled="!inviteEmail.trim()" @click="sendInvite" />
        </div>
        <div v-if="inviteSent" class="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3">
          <i class="pi pi-check-circle" />
          Convite enviado para <strong>{{ inviteEmail }}</strong>
        </div>
      </div>

      <!-- RF34: Desvincular parceiro — só aparece com 2 membros -->
      <div v-if="partner" class="card border border-red-100">
        <h3 class="font-display font-semibold text-surface-900 mb-1">Desvincular parceiro</h3>
        <p class="text-sm text-surface-400 mb-4">
          Remove o acesso de <strong class="text-surface-700">{{ partner.firstName }} {{ partner.lastName }}</strong> a esta conta.
          Os lançamentos existentes não serão apagados.
        </p>

        <!-- Confirmação em dois passos -->
        <template v-if="!confirmingRemove">
          <Button
            label="Desvincular parceiro"
            icon="pi pi-user-minus"
            severity="danger"
            outlined
            size="small"
            @click="confirmingRemove = true"
          />
        </template>
        <template v-else>
          <div class="bg-red-50 rounded-xl p-4 space-y-3">
            <p class="text-sm text-red-700 font-medium">
              Tem certeza? Esta ação não pode ser desfeita.
            </p>
            <p class="text-xs text-red-600">
              {{ partner.firstName }} perderá o acesso imediatamente e precisará de um novo convite para voltar.
            </p>
            <div class="flex items-center gap-2">
              <Button
                :label="`Sim, desvincular ${partner.firstName}`"
                icon="pi pi-trash"
                severity="danger"
                size="small"
                :loading="removingPartner"
                @click="removePartner"
              />
              <Button
                label="Cancelar"
                severity="secondary"
                size="small"
                @click="confirmingRemove = false"
              />
            </div>
          </div>
        </template>
      </div>

    </template>

    <!-- Toast de erro global -->
    <div v-if="coupleStore.error" class="fixed bottom-6 right-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2 shadow-lg z-50">
      <i class="pi pi-exclamation-circle" />
      {{ coupleStore.error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { useCoupleStore } from '@/stores/couple'
import { useAuthStore } from '@/stores/auth'
import { useRoute, useRouter } from 'vue-router'
import { coupleService } from '@/services'
import { useToast } from 'primevue/usetoast'

const coupleStore = useCoupleStore()
const authStore   = useAuthStore()
const route       = useRoute()
const router      = useRouter()
const toast       = useToast()

// ── Fluxo de aceitar convite ──────────────────────────────────────────────────

const joinToken   = computed(() => route.params.token as string | undefined)
const joinLoading = ref(false)
const joinError   = ref<string | null>(null)
const joinSuccess = ref(false)

// ── Criar casal ───────────────────────────────────────────────────────────────

const newCoupleName = ref('')

async function createCouple() {
  if (!newCoupleName.value.trim()) return
  await coupleStore.createCouple(newCoupleName.value.trim())
  authStore.fetchMe()
}

// ── Editar nome ───────────────────────────────────────────────────────────────

const editingName = ref(false)
const editName    = ref('')
const savingName  = ref(false)

function startEdit() {
  editName.value    = coupleStore.couple?.name ?? ''
  editingName.value = true
}

async function saveName() {
  if (!editName.value.trim()) return
  savingName.value = true
  try {
    await coupleService.update(editName.value.trim())
    await coupleStore.fetchCouple()
    editingName.value = false
  } finally {
    savingName.value = false
  }
}

// ── Convidar parceiro ─────────────────────────────────────────────────────────

const inviteEmail   = ref('')
const sendingInvite = ref(false)
const inviteSent    = ref(false)

async function sendInvite() {
  if (!inviteEmail.value.trim()) return
  sendingInvite.value = true
  inviteSent.value    = false
  try {
    await coupleStore.invite(inviteEmail.value.trim())
    inviteSent.value = true
    await coupleStore.fetchCouple()
  } finally {
    sendingInvite.value = false
  }
}

// ── RF34: Desvincular parceiro ────────────────────────────────────────────────

// Parceiro = o membro que NÃO é o usuário logado
const partner = computed(() =>
  coupleStore.couple?.members.find(m => m.id !== authStore.user?.id) ?? null
)

const confirmingRemove = ref(false)
const removingPartner  = ref(false)

async function removePartner() {
  if (!partner.value) return
  removingPartner.value = true
  try {
    await coupleService.removeMember(partner.value.id)
    toast.add({ severity: 'success', summary: 'Parceiro desvinculado', detail: `${partner.value.firstName} foi removido da conta.`, life: 4000 })
    confirmingRemove.value = false
    // Atualiza o casal — agora volta a ter 1 membro
    await coupleStore.fetchCouple()
  } catch (e: unknown) {
    const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Erro ao desvincular. Tente novamente.'
    toast.add({ severity: 'error', summary: 'Erro', detail, life: 4000 })
  } finally {
    removingPartner.value = false
  }
}

// ── Aceitar convite ───────────────────────────────────────────────────────────

async function acceptInvite() {
  if (!joinToken.value) return
  joinLoading.value = true
  joinError.value   = null
  try {
    await coupleStore.join(joinToken.value)
    await authStore.fetchMe()
    joinSuccess.value = true
    setTimeout(() => router.push('/dashboard'), 2000)
  } catch (e) {
    joinError.value = e instanceof Error ? e.message : 'Erro ao aceitar convite'
  } finally {
    joinLoading.value = false
  }
}

onMounted(async () => {
  if (joinToken.value) {
    if (authStore.isAuthenticated) await acceptInvite()
    return
  }
  if (authStore.hasCouple && !coupleStore.couple) {
    await coupleStore.fetchCouple()
  }
})
</script>
