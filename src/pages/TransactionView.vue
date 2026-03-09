<template>
  <div class="p-8 space-y-6">

    <!-- Toolbar -->
    <div class="flex items-center gap-3 flex-wrap">

      <!-- Busca / filtro de tipo -->
      <div class="flex items-center gap-2 flex-1">
        <button
          v-for="opt in typeFilter"
          :key="opt.value"
          @click="filters.type = filters.type === opt.value ? undefined : opt.value"
          class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 border"
          :class="filters.type === opt.value
            ? opt.activeClass
            : 'bg-white border-surface-200 text-surface-600 hover:border-surface-300'"
        >
          {{ opt.label }}
        </button>
      </div>

      <!-- Mês -->
      <select
        v-model="selectedMonth"
        class="text-sm border border-surface-200 rounded-xl px-3 py-2 bg-white text-surface-700 focus:outline-none focus:border-surface-400"
      >
        <option v-for="m in monthOptions" :key="m.value" :value="m.value">{{ m.label }}</option>
      </select>

      <!-- Nova transação -->
      <Button
        label="Nova transação"
        icon="pi pi-plus"
        @click="openCreate"
      />
    </div>

    <!-- Table -->
    <div class="card p-0 overflow-hidden">

      <!-- Skeleton -->
      <template v-if="loading">
        <div class="divide-y divide-surface-50">
          <div v-for="i in 8" :key="i" class="flex items-center gap-4 px-6 py-4">
            <div class="w-9 h-9 rounded-xl bg-surface-100 animate-pulse shrink-0" />
            <div class="flex-1 space-y-2">
              <div class="h-3.5 bg-surface-100 rounded animate-pulse w-1/3" />
              <div class="h-3 bg-surface-50 rounded animate-pulse w-1/5" />
            </div>
            <div class="h-4 bg-surface-100 rounded animate-pulse w-20" />
          </div>
        </div>
      </template>

      <!-- Vazio -->
      <div v-else-if="page.content.length === 0" class="py-20 text-center">
        <i class="pi pi-inbox text-surface-200 text-4xl mb-3 block" />
        <p class="text-surface-400">Nenhuma transação encontrada.</p>
      </div>

      <!-- Linhas -->
      <ul v-else class="divide-y divide-surface-50">
        <li
          v-for="tx in page.content"
          :key="tx.id"
          class="flex items-center gap-4 px-6 py-4 hover:bg-surface-50/60 transition-colors group"
        >
          <!-- Ícone -->
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            :class="tx.type === 'INCOME' ? 'bg-green-50' : 'bg-red-50'"
          >
            <i :class="[categoryIcon(tx.category), 'text-sm', tx.type === 'INCOME' ? 'text-green-600' : 'text-red-400']" />
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-surface-800 truncate">
              {{ tx.description || tx.categoryLabel }}
            </p>
            <p class="text-xs text-surface-400 mt-0.5">
              {{ formatDate(tx.date) }}
              <span class="mx-1">·</span>
              {{ tx.categoryLabel }}
              <span class="mx-1">·</span>
              {{ tx.createdBy.firstName }}
              <span v-if="tx.recurring" class="ml-1.5 text-surface-400">
                <i class="pi pi-sync text-xs" />
              </span>
            </p>
          </div>

          <!-- Valor -->
          <span
            class="font-mono text-sm font-medium shrink-0"
            :class="tx.type === 'INCOME' ? 'text-green-600' : 'text-red-500'"
          >
            {{ tx.type === 'INCOME' ? '+' : '−' }} {{ formatCurrency(tx.amount) }}
          </span>

          <!-- Ações (aparecem no hover) -->
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              @click="openEdit(tx)"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors"
            >
              <i class="pi pi-pencil text-xs" />
            </button>
            <button
              @click="confirmDelete(tx)"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <i class="pi pi-trash text-xs" />
            </button>
          </div>
        </li>
      </ul>

      <!-- Paginação -->
      <div
        v-if="page.totalPages > 1"
        class="flex items-center justify-between px-6 py-4 border-t border-surface-100"
      >
        <p class="text-xs text-surface-400">
          {{ page.totalElements }} transações · página {{ page.number + 1 }} de {{ page.totalPages }}
        </p>
        <div class="flex items-center gap-1">
          <button
            @click="goPage(page.number - 1)"
            :disabled="page.first"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-surface-500 hover:bg-surface-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <i class="pi pi-chevron-left text-xs" />
          </button>
          <button
            @click="goPage(page.number + 1)"
            :disabled="page.last"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-surface-500 hover:bg-surface-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <i class="pi pi-chevron-right text-xs" />
          </button>
        </div>
      </div>
    </div>

    <!-- Dialog: criar / editar transação -->
    <Dialog
      v-model:visible="showDialog"
      :header="editingTx ? 'Editar transação' : 'Nova transação'"
      :modal="true"
      :style="{ width: '480px' }"
      :pt="{ content: { class: 'p-6' }, header: { class: 'px-6 pt-6 pb-0' } }"
    >
      <TransactionForm
        :transaction="editingTx ?? undefined"
        :categories="categories"
        @submit="handleSubmit"
        @cancel="showDialog = false"
        :loading="submitting"
      />
    </Dialog>

    <!-- Confirm delete -->
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { transactionService, categoryService } from '@/services'
import type { TransactionResponse, CategoryResponse, TransactionType, TransactionCategory, Page } from '@/types'
import TransactionForm from './TransactionForm.vue'

const confirm = useConfirm()
const toast   = useToast()

// ── Filtros ───────────────────────────────────────────────────────────────────

const typeFilter = [
  { label: 'Todas',    value: undefined,   activeClass: 'bg-surface-900 text-white border-surface-900' },
  { label: 'Receitas', value: 'INCOME' as TransactionType,  activeClass: 'bg-green-600 text-white border-green-600' },
  { label: 'Despesas', value: 'EXPENSE' as TransactionType, activeClass: 'bg-red-500 text-white border-red-500' }
]

const today = new Date()
const selectedMonth = ref(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`)

const monthOptions = computed(() => {
  const opts = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    opts.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) })
  }
  return opts
})

const filters = reactive<{ type?: TransactionType }>({ type: undefined })

const dateRange = computed(() => {
  const [year = 0, month = 1] = selectedMonth.value.split('-').map(Number)
  const start = new Date(year, month - 1, 1)
  const end   = new Date(year, month, 0)
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate:   end.toISOString().slice(0, 10)
  }
})

// ── Dados ─────────────────────────────────────────────────────────────────────

const emptyPage: Page<TransactionResponse> = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 15, first: true, last: true }
const page       = ref<Page<TransactionResponse>>(emptyPage)
const categories = ref<CategoryResponse[]>([])
const loading    = ref(false)
const currentPage = ref(0)

async function loadTransactions() {
  loading.value = true
  try {
    page.value = await transactionService.list({
      ...dateRange.value,
      type: filters.type,
      page: currentPage.value,
      size: 15
    })
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  categories.value = await categoryService.list()
}

function goPage(n: number) {
  currentPage.value = n
}

onMounted(() => { loadTransactions(); loadCategories() })
watch([selectedMonth, filters, currentPage], loadTransactions)

// ── CRUD ──────────────────────────────────────────────────────────────────────

const showDialog = ref(false)
const editingTx  = ref<TransactionResponse | null>(null)
const submitting = ref(false)

function openCreate() { editingTx.value = null; showDialog.value = true }
function openEdit(tx: TransactionResponse) { editingTx.value = tx; showDialog.value = true }

async function handleSubmit(payload: any) {
  submitting.value = true
  try {
    if (editingTx.value) {
      await transactionService.update(editingTx.value.id, payload)
      toast.add({ severity: 'success', summary: 'Atualizado', detail: 'Transação atualizada.', life: 3000 })
    } else {
      await transactionService.create(payload)
      toast.add({ severity: 'success', summary: 'Criado', detail: 'Transação adicionada.', life: 3000 })
    }
    showDialog.value = false
    await loadTransactions()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Erro', detail: e?.response?.data?.detail ?? 'Tente novamente.', life: 4000 })
  } finally {
    submitting.value = false
  }
}

function confirmDelete(tx: TransactionResponse) {
  confirm.require({
    message: `Remover "${tx.description || tx.categoryLabel}"?`,
    header: 'Confirmar exclusão',
    icon: 'pi pi-trash',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Remover',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await transactionService.delete(tx.id)
      toast.add({ severity: 'success', summary: 'Removido', detail: 'Transação removida.', life: 3000 })
      await loadTransactions()
    }
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const categoryIconMap: Partial<Record<TransactionCategory, string>> = {
  FOOD: 'pi pi-shopping-bag',   HOUSING: 'pi pi-home',
  TRANSPORT: 'pi pi-car',       HEALTH: 'pi pi-heart',
  EDUCATION: 'pi pi-book',      LEISURE: 'pi pi-star',
  CLOTHING: 'pi pi-tag',        PETS: 'pi pi-heart-fill',
  SUBSCRIPTIONS: 'pi pi-sync',  OTHER_EXPENSE: 'pi pi-minus-circle',
  SALARY: 'pi pi-briefcase',    FREELANCE: 'pi pi-code',
  INVESTMENTS: 'pi pi-chart-bar', RENTAL: 'pi pi-building',
  GIFT: 'pi pi-gift',           OTHER_INCOME: 'pi pi-plus-circle'
}
function categoryIcon(cat: TransactionCategory) {
  return categoryIconMap[cat] ?? 'pi pi-circle'
}
</script>