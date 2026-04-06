<template>
  <Dialog
    v-model:visible="visible"
    header="Importar extrato bancário"
    :modal="true"
    :style="{ width: 'min(540px, 95vw)' }"
    :pt="{ content: { class: 'p-4 lg:p-6' }, header: { class: 'px-4 lg:px-6 pt-4 lg:pt-6 pb-0' } }"
    @hide="reset"
  >
    <!-- Estado: aguardando arquivo -->
    <div v-if="!result" class="space-y-4 pt-2">
      <p class="text-sm text-surface-500">
        Faça o upload do extrato exportado pelo seu banco.
        As transações serão importadas automaticamente e duplicatas serão ignoradas.
      </p>

      <!-- Formatos suportados -->
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-xs text-surface-400">Formatos aceitos:</span>
        <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-surface-100 text-surface-600">.ofx</span>
        <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-surface-100 text-surface-600">.xlsx</span>
      </div>

      <!-- Dropzone -->
      <div
        class="border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors"
        :class="dragOver
          ? 'border-primary-400 bg-primary-50'
          : 'border-surface-200 hover:border-surface-400 hover:bg-surface-50'"
        @dragover.prevent="dragOver = true"
        @dragleave.prevent="dragOver = false"
        @drop.prevent="onDrop"
        @click="fileInput?.click()"
      >
        <div class="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center">
          <i class="pi pi-file-import text-xl text-surface-400" />
        </div>

        <div class="text-center">
          <p v-if="!selectedFile" class="text-sm font-medium text-surface-700">
            Arraste o arquivo aqui ou <span class="text-primary-600 underline">clique para selecionar</span>
          </p>
          <p v-else class="text-sm font-medium text-surface-700">
            <i class="pi pi-check-circle text-green-500 mr-1.5" />{{ selectedFile.name }}
          </p>
          <p class="text-xs text-surface-400 mt-1">Arquivos .ofx ou .xlsx · Máximo 10 MB</p>
        </div>
      </div>

      <input ref="fileInput" type="file" accept=".ofx,.xlsx" class="hidden" @change="onFileChange" />

      <!-- Erro -->
      <p v-if="errorMsg" class="text-sm text-red-500 flex items-center gap-1.5">
        <i class="pi pi-exclamation-circle" />{{ errorMsg }}
      </p>

      <!-- Ações -->
      <div class="flex gap-2 pt-2">
        <Button label="Cancelar" severity="secondary" class="flex-1" @click="visible = false" :disabled="importing" />
        <Button
          label="Importar"
          icon="pi pi-upload"
          class="flex-1"
          :loading="importing"
          :disabled="!selectedFile"
          @click="doImport"
        />
      </div>
    </div>

    <!-- Estado: resultado -->
    <div v-else class="space-y-4 pt-2">

      <!-- Resumo de contagens -->
      <div class="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-3">
        <div class="flex items-center gap-2">
          <i class="pi pi-check-circle text-green-600 text-lg" />
          <span class="font-semibold text-green-800">Importação concluída!</span>
        </div>
        <div class="grid grid-cols-3 gap-3 pt-1">
          <div class="text-center">
            <p class="text-2xl font-bold text-surface-800">{{ result.totalFound }}</p>
            <p class="text-xs text-surface-500 mt-0.5">Encontradas</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-green-600">{{ result.totalImported }}</p>
            <p class="text-xs text-surface-500 mt-0.5">Importadas</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-surface-400">{{ result.totalSkipped }}</p>
            <p class="text-xs text-surface-500 mt-0.5">Duplicatas</p>
          </div>
        </div>
      </div>

      <!-- Prováveis duplicatas -->
      <div v-if="result.suspectedDuplicates.length > 0" class="space-y-3">
        <div class="flex items-center gap-2">
          <i class="pi pi-exclamation-triangle text-amber-500" />
          <span class="text-sm font-semibold text-surface-800">
            {{ result.suspectedDuplicates.length }} provável{{ result.suspectedDuplicates.length > 1 ? 'is duplicata' : ' duplicata' }} detectada{{ result.suspectedDuplicates.length > 1 ? 's' : '' }}
          </span>
        </div>

        <p class="text-xs text-surface-500">
          As transações abaixo foram importadas, mas já existe um lançamento com mesmo valor, data e tipo.
          Verifique se são registros distintos ou se o lançamento foi cadastrado manualmente.
        </p>

        <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
          <div
            v-for="(dup, i) in result.suspectedDuplicates"
            :key="i"
            class="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2"
          >
            <!-- Cabeçalho: data + valor -->
            <div class="flex items-center justify-between">
              <span class="text-xs text-surface-500">{{ formatDate(dup.date) }}</span>
              <span
                class="text-sm font-mono font-semibold"
                :class="dup.type === 'INCOME' ? 'text-green-600' : 'text-red-500'"
              >
                {{ dup.type === 'INCOME' ? '+' : '−' }} {{ formatCurrency(dup.amount) }}
              </span>
            </div>

            <!-- Comparação lado a lado -->
            <div class="grid grid-cols-2 gap-2">
              <div class="bg-white rounded-lg p-2 border border-amber-100">
                <p class="text-[10px] font-semibold text-amber-600 uppercase tracking-wide mb-1">Importada</p>
                <p class="text-xs text-surface-700 break-words leading-relaxed">
                  {{ dup.importedDescription || '—' }}
                </p>
              </div>
              <div class="bg-white rounded-lg p-2 border border-surface-200">
                <p class="text-[10px] font-semibold text-surface-400 uppercase tracking-wide mb-1">Existente</p>
                <p class="text-xs text-surface-700 break-words leading-relaxed">
                  {{ dup.existingDescription || '—' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p v-else class="text-sm text-surface-500">
        As transações importadas já aparecem na lista de lançamentos.
      </p>

      <Button label="Fechar" class="w-full" @click="visible = false" />
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import { importService } from '@/services/index'
import type { ImportResult } from '@/types/index'

const ACCEPTED_EXTENSIONS = ['.ofx', '.xlsx']
const MAX_SIZE_BYTES = 10 * 1024 * 1024

const props = defineProps<{ modelValue: boolean }>()
const emit  = defineEmits<{
  'update:modelValue': [boolean]
  imported: []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const toast        = useToast()
const fileInput    = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const importing    = ref(false)
const dragOver     = ref(false)
const errorMsg     = ref('')
const result       = ref<ImportResult | null>(null)

function onFileChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) setFile(f)
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) setFile(f)
}

function setFile(f: File) {
  errorMsg.value = ''
  const ext = '.' + f.name.split('.').pop()?.toLowerCase()
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    errorMsg.value = `Formato não suportado. Envie um arquivo ${ACCEPTED_EXTENSIONS.join(' ou ')}.`
    return
  }
  if (f.size > MAX_SIZE_BYTES) {
    errorMsg.value = 'O arquivo não pode ultrapassar 10 MB.'
    return
  }
  selectedFile.value = f
}

async function doImport() {
  if (!selectedFile.value) return
  importing.value = true
  errorMsg.value  = ''
  try {
    result.value = await importService.importStatement(selectedFile.value)
    emit('imported')
  } catch (e: unknown) {
    const detail = (e as { response?: { data?: { detail?: string } } })
      ?.response?.data?.detail ?? 'Erro ao importar. Verifique o arquivo e tente novamente.'
    errorMsg.value = detail
    toast.add({ severity: 'error', summary: 'Erro na importação', detail, life: 5000 })
  } finally {
    importing.value = false
  }
}

function reset() {
  selectedFile.value = null
  importing.value    = false
  dragOver.value     = false
  errorMsg.value     = ''
  result.value       = null
  if (fileInput.value) fileInput.value.value = ''
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}
</script>
