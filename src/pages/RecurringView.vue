<template>
  <div class="p-4 lg:p-8 space-y-4 lg:space-y-6">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="font-display text-surface-900 font-semibold text-lg">Recorrências</h2>
        <p class="text-surface-400 text-sm mt-0.5">Gerencie suas despesas e receitas recorrentes</p>
      </div>
    </div>

    <!-- Filtro de tipo -->
    <div class="flex items-center gap-1.5">
      <button
        v-for="opt in typeOptions"
        :key="String(opt.value)"
        @click="activeType = opt.value"
        class="px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 border"
        :class="activeType === opt.value ? opt.activeClass : 'bg-white border-surface-200 text-surface-600 hover:border-surface-300'"
      >
        {{ opt.label }}
        <span
          v-if="countByType(opt.value) > 0"
          class="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
          :class="activeType === opt.value ? 'bg-white/20 text-white' : 'bg-surface-100 text-surface-500'"
        >{{ countByType(opt.value) }}</span>
      </button>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="card p-4 flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-surface-100 animate-pulse shrink-0" />
        <div class="flex-1 space-y-2">
          <div class="h-3.5 bg-surface-100 rounded animate-pulse w-1/3" />
          <div class="h-3 bg-surface-50 rounded animate-pulse w-1/4" />
        </div>
        <div class="h-4 bg-surface-100 rounded animate-pulse w-20" />
      </div>
    </div>

    <!-- Vazio -->
    <div v-else-if="filteredSeries.length === 0" class="card py-20 text-center">
      <i class="pi pi-sync text-surface-200 text-4xl mb-3 block" />
      <p class="text-surface-700 font-medium mb-1">
        {{ series.length === 0 ? 'Nenhuma recorrência cadastrada' : 'Nenhuma recorrência nesta categoria' }}
      </p>
      <p class="text-surface-400 text-sm mb-5">
        {{ series.length === 0
          ? 'Crie uma transação com recorrência na tela de Transações.'
          : 'Tente selecionar outro filtro.' }}
      </p>
      <RouterLink to="/transactions">
        <Button label="Ir para Transações" icon="pi pi-arrow-right" icon-pos="right" size="small" severity="secondary" />
      </RouterLink>
    </div>

    <!-- Lista de séries -->
    <div v-else class="space-y-3">
      <div
        v-for="s in filteredSeries"
        :key="s.id"
        class="card p-4 lg:p-5 flex items-start gap-4 transition-opacity"
        :class="{ 'opacity-60': isEnded(s) }"
      >
        <!-- Ícone -->
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          :class="s.type === 'INCOME' ? 'bg-green-50' : 'bg-red-50'"
        >
          <i :class="[s.categoryIcon, 'text-sm', s.type === 'INCOME' ? 'text-green-600' : 'text-red-400']" />
        </div>

        <!-- Conteúdo -->
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2 flex-wrap">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-surface-800 truncate">
                {{ s.description || s.categoryLabel }}
              </p>
              <p class="text-xs text-surface-400 mt-0.5">{{ s.categoryLabel }}</p>
            </div>
            <span
              class="font-mono text-base font-semibold shrink-0"
              :class="s.type === 'INCOME' ? 'text-green-600' : 'text-red-500'"
            >
              {{ s.type === 'INCOME' ? '+' : '−' }} {{ formatCurrency(s.amount) }}
            </span>
          </div>

          <!-- Metadados -->
          <div class="flex items-center gap-3 mt-2 flex-wrap">
            <!-- Frequência -->
            <span class="flex items-center gap-1 text-xs text-surface-500">
              <i class="pi pi-sync text-surface-300 text-[10px]" />
              {{ s.recurrenceRuleLabel }}
            </span>

            <!-- Próxima ocorrência -->
            <span v-if="s.nextOccurrence && !isEnded(s)" class="flex items-center gap-1 text-xs text-surface-500">
              <i class="pi pi-calendar text-surface-300 text-[10px]" />
              Próxima: <span class="font-medium text-surface-700">{{ formatDate(s.nextOccurrence) }}</span>
            </span>

            <!-- Encerrada -->
            <span v-if="isEnded(s)" class="flex items-center gap-1 text-xs text-amber-600">
              <i class="pi pi-stop-circle text-[10px]" />
              Encerrada em {{ formatDate(s.recurrenceEndDate!) }}
            </span>

            <!-- Início -->
            <span class="flex items-center gap-1 text-xs text-surface-400">
              <i class="pi pi-calendar-plus text-surface-300 text-[10px]" />
              Desde {{ formatDate(s.startDate) }}
            </span>

            <!-- Ocorrências -->
            <span class="flex items-center gap-1 text-xs text-surface-400">
              <i class="pi pi-list text-surface-300 text-[10px]" />
              {{ s.occurrencesCount }} ocorrência{{ s.occurrencesCount !== 1 ? 's' : '' }}
            </span>

            <!-- Autor -->
            <span class="flex items-center gap-1">
              <img v-if="s.createdBy.avatarUrl" :src="s.createdBy.avatarUrl" :alt="s.createdBy.firstName"
                class="w-4 h-4 rounded-full object-cover" />
              <div v-else class="w-4 h-4 rounded-full bg-surface-200 flex items-center justify-center">
                <span class="text-surface-500 text-[8px] font-semibold">{{ s.createdBy.firstName[0] }}</span>
              </div>
              <span class="text-xs text-surface-400">{{ s.createdBy.firstName }}</span>
            </span>
          </div>
        </div>

        <!-- Ações -->
        <div class="flex items-center gap-1 shrink-0">
          <button
            v-if="!isEnded(s)"
            @click="openEdit(s)"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors"
            title="Editar série"
          >
            <i class="pi pi-pencil text-xs" />
          </button>
          <button
            v-if="!isEnded(s)"
            @click="confirmStop(s)"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            title="Encerrar série"
          >
            <i class="pi pi-stop-circle text-xs" />
          </button>
          <button
            @click="confirmDelete(s)"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            title="Excluir toda a série"
          >
            <i class="pi pi-trash text-xs" />
          </button>
        </div>
      </div>
    </div>

    <!-- Dialog: editar série -->
    <Dialog
      v-model:visible="showEditDialog"
      header="Editar recorrência"
      :modal="true"
      :style="{ width: 'min(480px, 95vw)' }"
      :pt="{ content: { class: 'p-4 lg:p-6' }, header: { class: 'px-4 lg:px-6 pt-4 lg:pt-6 pb-0' } }"
    >
      <TransactionForm
        v-if="editingAsTx"
        :transaction="editingAsTx ?? undefined"
        :categories="categories"
        :loading="submitting"
        @submit="handleEditSubmit"
        @cancel="showEditDialog = false"
      />
    </Dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { transactionService, categoryService } from '@/services'
import type { CreateTransactionPayload, UpdateRecurringPayload } from '@/services'
import type { RecurringSeriesResponse, TransactionType, CategoryResponse, TransactionResponse } from '@/types'
import TransactionForm from './TransactionForm.vue'

const toast   = useToast()
const confirm = useConfirm()

// ── Dados ─────────────────────────────────────────────────────────────────────

const series     = ref<RecurringSeriesResponse[]>([])
const categories = ref<CategoryResponse[]>([])
const loading    = ref(false)
const submitting = ref(false)

const typeOptions = [
  { label: 'Todas',    value: undefined as TransactionType | undefined, activeClass: 'bg-surface-900 text-white border-surface-900' },
  { label: 'Despesas', value: 'EXPENSE' as TransactionType,             activeClass: 'bg-red-500 text-white border-red-500' },
  { label: 'Receitas', value: 'INCOME'  as TransactionType,             activeClass: 'bg-green-600 text-white border-green-600' }
]
const activeType = ref<TransactionType | undefined>(undefined)

const filteredSeries = computed(() =>
  activeType.value ? series.value.filter(s => s.type === activeType.value) : series.value
)

function countByType(type: TransactionType | undefined) {
  return type ? series.value.filter(s => s.type === type).length : series.value.length
}

function parseLocalDate(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function isEnded(s: RecurringSeriesResponse) {
  if (!s.recurrenceEndDate) return false

  const recurrenceEndDate = parseLocalDate(s.recurrenceEndDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return recurrenceEndDate < today
}

async function load() {
  loading.value = true
  try {
    [series.value, categories.value] = await Promise.all([
      transactionService.listRecurring(),
      categoryService.list()
    ])
  } finally {
    loading.value = false
  }
}

onMounted(load)

// ── Editar série ──────────────────────────────────────────────────────────────

const showEditDialog = ref(false)
const editingAsTx    = ref<TransactionResponse | null>(null)
const editingSeries  = ref<RecurringSeriesResponse | null>(null)

function openEdit(s: RecurringSeriesResponse) {
  editingSeries.value = s
  // Adapta RecurringSeriesResponse para o shape que TransactionForm espera
  editingAsTx.value = {
    id:                  s.id,
    category:            s.category,
    categoryLabel:       s.categoryLabel,
    categoryIcon:        s.categoryIcon,
    customCategoryId:    s.customCategoryId,
    type:                s.type,
    amount:              s.amount,
    description:         s.description,
    date:                s.startDate,
    recurring:           true,
    recurrenceRule:      s.recurrenceRule,
    recurrenceEndDate:   s.recurrenceEndDate,
    parentTransactionId: null,
    createdBy:           s.createdBy,
    createdAt:           ''
  } as TransactionResponse
  showEditDialog.value = true
}

type EditRecurringFormPayload = Omit<CreateTransactionPayload, 'category'> & {
  category: UpdateRecurringPayload['category']
}

async function handleEditSubmit(payload: EditRecurringFormPayload) {
  if (!editingSeries.value) return
  submitting.value = true
  try {
    const recurringPayload: UpdateRecurringPayload = {
      category:         payload.category,
      customCategoryId: payload.customCategoryId,
      amount:           payload.amount,
      description:      payload.description,
      date:             payload.date,
      scope:            'THIS_AND_FUTURE'
    }
    await transactionService.updateRecurring(editingSeries.value.id, recurringPayload)
    toast.add({ severity: 'success', summary: 'Recorrência atualizada', life: 3000 })
    showEditDialog.value = false
    await load()
  } catch (e: unknown) {
    const detail = (e as any)?.response?.data?.detail ?? 'Não foi possível atualizar.'
    toast.add({ severity: 'error', summary: 'Erro', detail, life: 4000 })
  } finally {
    submitting.value = false
  }
}

// ── Encerrar série ────────────────────────────────────────────────────────────

function confirmStop(s: RecurringSeriesResponse) {
  confirm.require({
    message:     `Encerrar a recorrência "${s.description || s.categoryLabel}"? Nenhuma nova ocorrência será gerada.`,
    header:      'Encerrar recorrência',
    icon:        'pi pi-stop-circle',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Encerrar',
    accept:      () => stopSeries(s)
  })
}

async function stopSeries(s: RecurringSeriesResponse) {
  submitting.value = true
  try {
    // Usa THIS_AND_FUTURE a partir de amanhã — encerra sem apagar histórico
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const date = tomorrow.toISOString().slice(0, 10)

    const payload: UpdateRecurringPayload = {
      ...(s.customCategoryId
        ? { customCategoryId: s.customCategoryId }
        : { category: s.category ?? undefined }),
      amount:      s.amount,
      description: s.description ?? undefined,
      date,
      scope:       'THIS_AND_FUTURE'
    }
    await transactionService.updateRecurring(s.id, payload)
    toast.add({ severity: 'success', summary: 'Recorrência encerrada', detail: 'Nenhuma nova ocorrência será gerada.', life: 3000 })
    await load()
  } catch (e: unknown) {
    const detail = (e as any)?.response?.data?.detail ?? 'Não foi possível encerrar.'
    toast.add({ severity: 'error', summary: 'Erro', detail, life: 4000 })
  } finally {
    submitting.value = false
  }
}

// ── Excluir série completa ────────────────────────────────────────────────────

function confirmDelete(s: RecurringSeriesResponse) {
  confirm.require({
    message:     `Excluir toda a série "${s.description || s.categoryLabel}" incluindo o histórico? Esta ação não pode ser desfeita.`,
    header:      'Excluir série completa',
    icon:        'pi pi-trash',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Excluir tudo',
    acceptClass: 'p-button-danger',
    accept:      () => deleteSeries(s)
  })
}

async function deleteSeries(s: RecurringSeriesResponse) {
  submitting.value = true
  try {
    await transactionService.deleteRecurring(s.id, { scope: 'ALL' })
    toast.add({ severity: 'success', summary: 'Série excluída', life: 3000 })
    await load()
  } catch (e: unknown) {
    const detail = (e as any)?.response?.data?.detail ?? 'Não foi possível excluir.'
    toast.add({ severity: 'error', summary: 'Erro', detail, life: 4000 })
  } finally {
    submitting.value = false
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}
</script>
