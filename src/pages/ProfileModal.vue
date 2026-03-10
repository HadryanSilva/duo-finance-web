<template>
  <Dialog
    v-model:visible="visible"
    header="Editar perfil"
    :modal="true"
    :style="{ width: 'min(440px, 95vw)' }"
    :pt="{ content: { class: 'p-5' }, header: { class: 'px-5 pt-5 pb-0' } }"
    @hide="onHide"
  >
    <div class="space-y-5">

      <!-- Avatar -->
      <div class="flex flex-col items-center gap-3">
        <div class="relative group">
          <!-- Foto atual ou inicial -->
          <div class="w-20 h-20 rounded-full overflow-hidden bg-surface-100 border-2 border-surface-200">
            <img
              v-if="previewUrl || currentAvatarUrl"
              :src="previewUrl || currentAvatarUrl!"
              alt="Avatar"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <span class="text-surface-500 text-2xl font-semibold">{{ initials }}</span>
            </div>
          </div>

          <!-- Overlay de upload -->
          <label
            class="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            :class="{ 'cursor-not-allowed': saving }"
          >
            <i class="pi pi-camera text-white text-lg" />
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              :disabled="saving"
              @change="onFileSelected"
            />
          </label>
        </div>

        <p class="text-xs text-surface-400">JPEG, PNG ou WEBP · máx. 5 MB</p>

        <!-- Erro de avatar -->
        <p v-if="avatarError" class="text-xs text-red-500 text-center">{{ avatarError }}</p>
      </div>

      <!-- Nome -->
      <div class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-surface-600">Nome</label>
          <InputText
            v-model="form.firstName"
            placeholder="Nome"
            :invalid="!!errors.firstName"
            class="w-full"
            size="small"
          />
          <p v-if="errors.firstName" class="text-xs text-red-500">{{ errors.firstName }}</p>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-surface-600">Sobrenome</label>
          <InputText
            v-model="form.lastName"
            placeholder="Sobrenome"
            :invalid="!!errors.lastName"
            class="w-full"
            size="small"
          />
          <p v-if="errors.lastName" class="text-xs text-red-500">{{ errors.lastName }}</p>
        </div>
      </div>

      <!-- Email (read-only) -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-medium text-surface-600">
          E-mail
          <span class="ml-1.5 text-surface-400 font-normal">(não editável)</span>
        </label>
        <InputText
          :model-value="auth.user?.email"
          disabled
          class="w-full bg-surface-50"
          size="small"
        />
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="flex justify-end gap-2 px-5 pb-5">
        <Button
          label="Cancelar"
          severity="secondary"
          text
          @click="visible = false"
          :disabled="saving"
        />
        <Button
          label="Salvar"
          :loading="saving"
          @click="save"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Dialog    from 'primevue/dialog'
import Button    from 'primevue/button'
import InputText from 'primevue/inputtext'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import { userService } from '@/services'

// ── Props / emits ─────────────────────────────────────────────────────────────

const props  = defineProps<{ modelValue: boolean }>()
const emit   = defineEmits<{ 'update:modelValue': [boolean] }>()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

// ── Store / toast ─────────────────────────────────────────────────────────────

const auth  = useAuthStore()
const toast = useToast()

// ── Form state ────────────────────────────────────────────────────────────────

const form = ref({ firstName: '', lastName: '' })
const errors = ref({ firstName: '', lastName: '' })
const saving = ref(false)

const currentAvatarUrl = computed(() => auth.user?.avatarUrl ?? null)
const initials = computed(() => {
  const f = auth.user?.firstName?.[0] ?? ''
  const l = auth.user?.lastName?.[0] ?? ''
  return (f + l).toUpperCase()
})

// Sincroniza o form quando o modal abre
watch(visible, (open) => {
  if (open) {
    form.value = {
      firstName: auth.user?.firstName ?? '',
      lastName:  auth.user?.lastName  ?? ''
    }
    errors.value  = { firstName: '', lastName: '' }
    previewUrl.value  = null
    pendingFile.value = null
    avatarError.value = ''
  }
})

// ── Validação ─────────────────────────────────────────────────────────────────

function validate(): boolean {
  errors.value = { firstName: '', lastName: '' }
  let ok = true

  if (!form.value.firstName.trim()) {
    errors.value.firstName = 'Nome é obrigatório'
    ok = false
  }
  if (!form.value.lastName.trim()) {
    errors.value.lastName = 'Sobrenome é obrigatório'
    ok = false
  }
  return ok
}

// ── Salvar (nome + avatar pendente juntos) ────────────────────────────────────

async function save() {
  if (!validate()) return
  saving.value = true
  avatarError.value = ''

  try {
    // Se há uma foto nova selecionada, faz upload primeiro
    if (pendingFile.value) {
      try {
        const { avatarUrl } = await userService.uploadAvatar(pendingFile.value)
        auth.setUser({ ...auth.user!, avatarUrl })
      } catch (e: any) {
        avatarError.value = e?.response?.data?.message ?? 'Falha no upload da foto.'
        saving.value = false
        return   // interrompe — não salva o nome se o avatar falhou
      } finally {
        pendingFile.value = null
        if (fileInput.value) fileInput.value.value = ''
      }
    }

    // Salva nome
    const updated = await userService.updateProfile(
      form.value.firstName.trim(),
      form.value.lastName.trim()
    )
    auth.setUser(updated)
    toast.add({ severity: 'success', summary: 'Perfil atualizado', life: 3000 })
    visible.value = false

  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: e?.response?.data?.message ?? 'Não foi possível salvar.',
      life: 4000
    })
  } finally {
    saving.value = false
  }
}

function onHide() {
  previewUrl.value  = null
  pendingFile.value = null
  avatarError.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

// ── Upload de avatar ──────────────────────────────────────────────────────────

const fileInput   = ref<HTMLInputElement | null>(null)
const previewUrl  = ref<string | null>(null)
const pendingFile = ref<File | null>(null)   // arquivo aguardando confirmação
const avatarError = ref('')

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file  = input.files?.[0]
  if (!file) return

  // Validação client-side
  if (!file.type.startsWith('image/')) {
    avatarError.value = 'Apenas imagens são permitidas.'
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    avatarError.value = 'A imagem deve ter no máximo 5 MB.'
    return
  }

  // Apenas preview local — nenhum upload ainda
  avatarError.value = ''
  pendingFile.value = file
  previewUrl.value  = URL.createObjectURL(file)
}
</script>
