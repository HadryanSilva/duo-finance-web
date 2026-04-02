<template>
  <div class="p-4 lg:p-8 space-y-4 lg:space-y-6">

    <!-- Toolbar -->
    <div class="flex flex-col gap-3">

      <!-- Linha 1: filtros de tipo + botões -->
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-1.5 flex-wrap">
          <button
            v-for="opt in typeFilter"
            :key="String(opt.value)"
            @click="selectType(opt.value)"
            class="px-3 lg:px-4 py-2 rounded-xl text-xs lg:text-sm font-medium transition-all duration-150 border"
            :class="filters.type === opt.value
              ? opt.activeClass
              : 'bg-white border-surface-200 text-surface-600 hover:border-surface-300'"
          >
            {{ opt.label }}
          </button>

          <span v-if="partnerFilter.length" class="w-px h-5 bg-surface-200 mx-1" />

          <button
            v-for="opt in partnerFilter"
            :key="String(opt.value)"
            @click="filters.userId = filters.userId === opt.value ? undefined : opt.value; currentPage = 0"
            class="px-3 lg:px-4 py-2 rounded-xl text-xs lg:text-sm font-medium transition-all duration-150 border flex items-center gap-1.5"
            :class="filters.userId === opt.value
              ? 'bg-surface-900 text-white border-surface-900'
              : 'bg-white border-surface-200 text-surface-600 hover:border-surface-300'"
          >
            <i v-if="opt.value === undefined" class="pi pi-users text-[11px]" />
            <i v-else-if="opt.value === auth.user?.id" class="pi pi-user text-[11px]" />
            <i v-else class="pi pi-heart text-[11px]" />
            {{ opt.label }}
          </button>
        </div>

        <!-- Botões: Importar + Nova -->
        <div class="flex items-center gap-2 shrink-0">
          <Button
            icon="pi pi-upload"
            v-tooltip.bottom="'Importar extrato'"
            severity="secondary"
            size="small"
            @click="showImport = true"
          />
          <Button label="Nova" icon="pi pi-plus" @click="openCreate" size="small" />
        </div>
      </div>

      <!-- Linha 2: busca + categoria + mês -->
      <div class="flex flex-col sm:flex-row gap-2">

        <!-- Campo de busca -->
        <div class="relative flex-1">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm pointer-events-none" />
          <input
            v-model="searchInput"
            type="text"
            placeholder="Buscar por descrição..."
            class="w-full pl-9 pr-8 py-2 text-sm border border-surface-200 rounded-xl bg-white text-surface-700 placeholder-surface-400 focus:outline-none focus:border-surface-400 transition-colors"
          />
          <button
            v-if="searchInput"
            @click="searchInput = ''"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
          >
            <i class="pi pi-times text-[10px]" />
          </button>
        </div>

        <!-- Filtro por categoria -->
        <div class="relative">
          <select
            v-model="filters.category"
            @change="currentPage = 0"
            class="w-full sm:w-auto text-sm border rounded-xl px-3 py-2 bg-white text-surface-700 focus:outline-none focus:border-surface-400 transition-colors appearance-none pr-8"
            :class="filters.category ? 'border-surface-900 text-surface-900 font-medium' : 'border-surface-200'"
          >
            <option :value="undefined">Todas as categorias</option>
            <optgroup v-if="expenseCategories.length" label="Despesas">
              <option v-for="cat in expenseCategories" :key="cat.name ?? cat.label" :value="cat.name">{{ cat.label }}</option>
            </optgroup>
            <optgroup v-if="incomeCategories.length && !filters.type" label="Receitas">
              <option v-for="cat in incomeCategories" :key="cat.name ?? cat.label" :value="cat.name">{{ cat.label }}</option>
            </optgroup>
          </select>
          <i class="pi pi-chevron-down text-[10px] text-surface-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <!-- Seletor de mês -->
        <select
          v-model="selectedMonth"
          class="w-full sm:w-auto text-sm border border-surface-200 rounded-xl px-3 py-2 bg-white text-surface-700 focus:outline-none focus:border-surface-400"
        >
          <option v-for="m in monthOptions" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
      </div>

      <!-- Linha 3: ordenação -->
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-xs text-surface-400 shrink-0">Ordenar por</span>
        <div class="flex items-center gap-1.5 flex-wrap">
          <button
            v-for="opt in sortOptions"
            :key="opt.field"
            @click="selectSort(opt.field)"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border"
            :class="sortField === opt.field
              ? 'bg-surface-900 text-white border-surface-900'
              : 'bg-white border-surface-200 text-surface-600 hover:border-surface-300'"
          >
            {{ opt.label }}
            <i
              v-if="sortField === opt.field"
              :class="sortDir === 'desc' ? 'pi pi-arrow-down' : 'pi pi-arrow-up'"
              class="text-[10px]"
            />
          </button>
        </div>
      </div>

      <!-- Badges filtros ativos -->
      <div v-if="hasActiveFilters" class="flex items-center gap-2 flex-wrap">
        <span class="text-xs text-surface-400">Filtros:</span>

        <button
          v-if="filters.category"
          @click="filters.category = undefined; currentPage = 0"
          class="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-100 text-surface-700 text-xs hover:bg-surface-200 transition-colors"
        >
          <i :class="[categoryIcon(filters.category as TransactionCategory), 'text-[10px]']" />
          {{ categoryLabel(filters.category as TransactionCategory) }}
          <i class="pi pi-times text-[9px] ml-0.5 text-surface-400" />
        </button>

        <button
          @click="clearFilters"
          class="text-xs text-surface-400 hover:text-surface-700 transition-colors underline underline-offset-2"
        >
          Limpar tudo
        </button>
      </div>

      <p v-else-if="debouncedSearch && !loading" class="text-xs text-surface-400">
        <template v-if="page.page.totalElements > 0">
          {{ page.page.totalElements }} resultado{{ page.page.totalElements !== 1 ? 's' : '' }} para
          <span class="font-medium text-surface-700">"{{ debouncedSearch }}"</span>
        </template>
        <template v-else>
          Nenhum resultado para <span class="font-medium text-surface-700">"{{ debouncedSearch }}"</span>
        </template>
      </p>
    </div>

    <!-- Table -->
    <div class="card p-0 overflow-hidden">

      <!-- Skeleton -->
      <template v-if="loading">
        <div class="divide-y divide-surface-50">
          <div v-for="i in 8" :key="i" class="flex items-center gap-4 px-4 lg:px-6 py-4">
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
        <p class="text-surface-400">{{ emptyMessage }}</p>
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="mt-3 text-xs text-surface-500 hover:text-surface-800 underline underline-offset-2 transition-colors"
        >
          Limpar filtros
        </button>
      </div>

      <!-- Linhas -->
      <ul v-else class="divide-y divide-surface-50">
        <li
          v-for="tx in page.content"
          :key="tx.id"
          class="flex items-center gap-3 lg:gap-4 px-4 lg:px-6 py-3 lg:py-4 hover:bg-surface-50/60 transition-colors group"
        >
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            :class="tx.type === 'INCOME' ? 'bg-green-50' : 'bg-red-50'"
          >
            <i :class="[categoryIcon(tx.category), 'text-sm', tx.type === 'INCOME' ? 'text-green-600' : 'text-red-400']" />
          </div>

          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-surface-800 truncate" v-html="highlightMatch(tx.description || tx.categoryLabel)" />
            <div class="flex items-center gap-1.5 mt-0.5">
              <span class="text-xs text-surface-400">{{ formatDate(tx.date) }}</span>
              <span class="text-surface-200 text-xs">·</span>
              <button
                @click="filters.category = tx.category ?? undefined; currentPage = 0"
                class="text-xs text-surface-400 hover:text-surface-700 transition-colors"
                :class="{ 'font-medium text-surface-600': filters.category === tx.category }"
              >{{ tx.categoryLabel }}</button>
              <span class="text-surface-200 text-xs">·</span>
              <span class="flex items-center gap-1">
                <img v-if="tx.createdBy.avatarUrl" :src="tx.createdBy.avatarUrl" :alt="tx.createdBy.firstName" class="w-4 h-4 rounded-full object-cover" />
                <div v-else class="w-4 h-4 rounded-full bg-surface-200 flex items-center justify-center">
                  <span class="text-surface-600 text-[8px] font-medium">{{ tx.createdBy.firstName[0] }}</span>
                </div>
                <span class="text-xs text-surface-400">{{ tx.createdBy.firstName }}</span>
              </span>
              <template v-if="tx.recurring || tx.parentTransactionId">
                <span class="text-surface-200 text-xs">·</span>
                <i v-if="tx.recurring" class="pi pi-sync text-surface-300 text-[10px]" title="Transação recorrente" />
                <i v-else-if="tx.parentTransactionId" class="pi pi-replay text-primary-400 text-[10px]" title="Gerado automaticamente por recorrência" />
              </template>
            </div>
          </div>

          <div class="flex items-center gap-0.5 shrink-0">
            <span
              class="font-mono text-sm font-medium"
              :class="tx.type === 'INCOME' ? 'text-green-600' : 'text-red-500'"
            >
              {{ tx.type === 'INCOME' ? '+' : '−' }} {{ formatCurrency(tx.amount) }}
            </span>

            <div class="hidden lg:flex items-center gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button @click="openEdit(tx)" class="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors">
                <i class="pi pi-pencil text-xs" />
              </button>
              <button @click="handleDelete(tx)" class="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                <i class="pi pi-trash text-xs" />
              </button>
            </div>

            <button class="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-surface-300" @click="openMobileMenu(tx)">
              <i class="pi pi-ellipsis-v text-xs" />
            </button>
          </div>
        </li>
      </ul>

      <!-- Paginação -->
      <div v-if="page.page.totalPages > 1" class="flex items-center justify-between px-4 lg:px-6 py-4 border-t border-surface-100">
        <p class="text-xs text-surface-400">
          {{ page.page.totalElements }} transações · pág. {{ page.page.number + 1 }}/{{ page.page.totalPages }}
        </p>
        <div class="flex items-center gap-1">
          <button
            @click="goPage(page.page.number - 1)"
            :disabled="page.page.number === 0"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-surface-500 hover:bg-surface-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <i class="pi pi-chevron-left text-xs" />
          </button>
          <button
            @click="goPage(page.page.number + 1)"
            :disabled="page.page.number + 1 >= page.page.totalPages"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-surface-500 hover:bg-surface-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <i class="pi pi-chevron-right text-xs" />
          </button>
        </div>
      </div>
    </div>

    <!-- Dialog: importar extrato bancário -->
    <ImportDialog v-model="showImport" @imported="loadTransactions" />

    <!-- Dialog: criar / editar -->
    <Dialog
      v-model:visible="showDialog"
      :header="editingTx ? 'Editar transação' : 'Nova transação'"
      :modal="true"
      :style="{ width: 'min(480px, 95vw)' }"
      :pt="{ content: { class: 'p-4 lg:p-6' }, header: { class: 'px-4 lg:px-6 pt-4 lg:pt-6 pb-0' } }"
    >
      <TransactionForm
        :transaction="editingTx ?? undefined"
        :categories="categories"
        @submit="handleSubmit"
        @cancel="showDialog = false"
        :loading="submitting"
      />
    </Dialog>

    <!-- Dialog: escopo de edição recorrente (RF42) -->
    <Dialog
      v-model:visible="showEditScopeDialog"
      header="Editar transação recorrente"
      :modal="true"
      :style="{ width: 'min(420px, 95vw)' }"
      :pt="{ content: { class: 'p-4 lg:p-6' }, header: { class: 'px-4 lg:px-6 pt-4 lg:pt-6 pb-0' } }"
    >
      <p class="text-sm text-surface-500 mb-4 pt-2">Esta é uma transação recorrente. O que você deseja editar?</p>
      <div class="space-y-2">
        <button @click="confirmEditScope('SINGLE')" class="w-full flex items-start gap-3 px-4 py-3 rounded-xl border border-surface-200 hover:border-surface-400 hover:bg-surface-50 transition-colors text-left">
          <i class="pi pi-calendar text-surface-400 mt-0.5 shrink-0" />
          <div>
            <p class="text-sm font-medium text-surface-800">Só esta ocorrência</p>
            <p class="text-xs text-surface-400 mt-0.5">Apenas este lançamento será alterado</p>
          </div>
        </button>
        <button @click="confirmEditScope('THIS_AND_FUTURE')" class="w-full flex items-start gap-3 px-4 py-3 rounded-xl border border-surface-200 hover:border-surface-400 hover:bg-surface-50 transition-colors text-left">
          <i class="pi pi-calendar-plus text-surface-400 mt-0.5 shrink-0" />
          <div>
            <p class="text-sm font-medium text-surface-800">Esta e as futuras</p>
            <p class="text-xs text-surface-400 mt-0.5">Este e todos os próximos lançamentos serão alterados</p>
          </div>
        </button>
      </div>
    </Dialog>

    <!-- Dialog: escopo de exclusão recorrente (RF43) -->
    <Dialog
      v-model:visible="showDeleteScopeDialog"
      header="Remover transação recorrente"
      :modal="true"
      :style="{ width: 'min(420px, 95vw)' }"
      :pt="{ content: { class: 'p-4 lg:p-6' }, header: { class: 'px-4 lg:px-6 pt-4 lg:pt-6 pb-0' } }"
    >
      <p class="text-sm text-surface-500 mb-4 pt-2">Esta é uma transação recorrente. O que você deseja remover?</p>
      <div class="space-y-2">
        <button @click="confirmDeleteScope('SINGLE')" class="w-full flex items-start gap-3 px-4 py-3 rounded-xl border border-surface-200 hover:border-surface-400 hover:bg-surface-50 transition-colors text-left">
          <i class="pi pi-calendar text-surface-400 mt-0.5 shrink-0" />
          <div>
            <p class="text-sm font-medium text-surface-800">Só esta ocorrência</p>
            <p class="text-xs text-surface-400 mt-0.5">Apenas este lançamento será removido</p>
          </div>
        </button>
        <button @click="confirmDeleteScope('THIS_AND_FUTURE')" class="w-full flex items-start gap-3 px-4 py-3 rounded-xl border border-surface-200 hover:border-surface-400 hover:bg-surface-50 transition-colors text-left">
          <i class="pi pi-calendar-minus text-surface-400 mt-0.5 shrink-0" />
          <div>
            <p class="text-sm font-medium text-surface-800">Esta e as futuras</p>
            <p class="text-xs text-surface-400 mt-0.5">Remove este e todos os próximos lançamentos</p>
          </div>
        </button>
        <button @click="confirmDeleteScope('ALL')" class="w-full flex items-start gap-3 px-4 py-3 rounded-xl border border-red-200 hover:border-red-400 hover:bg-red-50 transition-colors text-left">
          <i class="pi pi-trash text-red-400 mt-0.5 shrink-0" />
          <div>
            <p class="text-sm font-medium text-red-600">Toda a série</p>
            <p class="text-xs text-surface-400 mt-0.5">Remove todos os lançamentos passados e futuros desta recorrência</p>
          </div>
        </button>
      </div>
    </Dialog>

    <!-- Bottom sheet mobile -->
    <Teleport to="body">
      <Transition name="bottom-sheet">
        <div v-if="showMobileMenu" class="fixed inset-0 z-50 lg:hidden">
          <div class="absolute inset-0 bg-black/40" @click="showMobileMenu = false" />
          <div class="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl p-4 space-y-1 sheet-panel">
            <div v-if="mobileMenuTx">
              <div class="w-10 h-1 rounded-full bg-surface-200 mx-auto mb-4" />
              <p class="text-sm font-medium text-surface-700 mb-3 px-1 truncate">
                {{ mobileMenuTx.description || mobileMenuTx.categoryLabel }}
              </p>
              <button @click="openEdit(mobileMenuTx!); showMobileMenu = false" class="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-surface-700 hover:bg-surface-50 transition-colors">
                <i class="pi pi-pencil text-surface-400" /> Editar
              </button>
              <button @click="handleDelete(mobileMenuTx!); showMobileMenu = false" class="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors">
                <i class="pi pi-trash" /> Excluir
              </button>
              <button @click="showMobileMenu = false" class="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-surface-400 hover:bg-surface-50 transition-colors">
                <i class="pi pi-times text-surface-300" /> Cancelar
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'
import { transactionService, categoryService } from '@/services'
import type { UpdateRecurringPayload } from '@/services'
import type { TransactionResponse, CategoryResponse, TransactionType, TransactionCategory, Page, RecurringScope } from '@/types'
import type { CreateTransactionPayload } from '@/services'
import TransactionForm from './TransactionForm.vue'
import ImportDialog from '@/components/ImportDialog.vue'
import { useAuthStore } from '@/stores/auth'
import { useCoupleStore } from '@/stores/couple'
import { categoryIcon } from '@/utils/categoryIcon'

const toast       = useToast()
const auth        = useAuthStore()
const coupleStore = useCoupleStore()

// ── Filtros ───────────────────────────────────────────────────────────────────

const typeFilter = [
  { label: 'Todas',    value: undefined,                    activeClass: 'bg-surface-900 text-white border-surface-900' },
  { label: 'Receitas', value: 'INCOME'  as TransactionType, activeClass: 'bg-green-600 text-white border-green-600' },
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

const filters = reactive<{ type?: TransactionType; userId?: string; category?: TransactionCategory }>({
  type: undefined, userId: undefined, category: undefined
})

function selectType(type: TransactionType | undefined) {
  if (filters.category) {
    const cat = categories.value.find(c => c.name === filters.category)
    if (cat && type && cat.type !== type) filters.category = undefined
  }
  filters.type = filters.type === type ? undefined : type
  currentPage.value = 0
}

const expenseCategories = computed(() =>
  filters.type === 'INCOME' ? [] : categories.value.filter(c => c.type === 'EXPENSE')
)
const incomeCategories = computed(() =>
  filters.type === 'EXPENSE' ? [] : categories.value.filter(c => c.type === 'INCOME')
)

const partnerFilter = computed(() => {
  const members = coupleStore.couple?.members ?? []
  if (members.length < 2) return []
  return [
    { label: 'Todos', value: undefined },
    ...members.map(m => ({ label: m.id === auth.user?.id ? 'Meus' : m.firstName, value: m.id }))
  ]
})

const hasActiveFilters = computed(() => !!filters.category || !!debouncedSearch.value)

function clearFilters() {
  filters.category = undefined
  searchInput.value = ''
  debouncedSearch.value = ''
  currentPage.value = 0
}

// ── Ordenação — RF29 ──────────────────────────────────────────────────────────

type SortField = 'date' | 'amount' | 'category'
type SortDir   = 'asc' | 'desc'

const sortField = ref<SortField>('date')
const sortDir   = ref<SortDir>('desc')

const sortOptions: { field: SortField; label: string }[] = [
  { field: 'date',     label: 'Data'      },
  { field: 'amount',   label: 'Valor'     },
  { field: 'category', label: 'Categoria' }
]

function selectSort(field: SortField) {
  if (sortField.value === field) {
    sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortField.value = field
    sortDir.value   = 'desc'
  }
  currentPage.value = 0
}

const sortParam = computed(() => `${sortField.value},${sortDir.value}`)

// ── Busca ─────────────────────────────────────────────────────────────────────

const searchInput     = ref('')
const debouncedSearch = ref('')
let   searchTimer: ReturnType<typeof setTimeout> | null = null

watch(searchInput, (val) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    debouncedSearch.value = val.trim()
    currentPage.value = 0
  }, 400)
})

const dateRange = computed(() => {
  const [year = 0, month = 1] = selectedMonth.value.split('-').map(Number)
  const start = new Date(year, month - 1, 1)
  const end   = new Date(year, month, 0)
  return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) }
})

const emptyMessage = computed(() => {
  if (filters.category) return `Nenhuma transação em "${categoryLabel(filters.category)}" neste período.`
  if (debouncedSearch.value) return 'Nenhuma transação encontrada para essa busca.'
  return 'Nenhuma transação encontrada.'
})

// ── Dados ─────────────────────────────────────────────────────────────────────

const emptyPage: Page<TransactionResponse> = { content: [], page: { size: 15, totalElements: 0, totalPages: 0, number: 0 } }
const page        = ref<Page<TransactionResponse>>(emptyPage)
const categories  = ref<CategoryResponse[]>([])
const loading     = ref(false)
const currentPage = ref(0)

async function loadTransactions() {
  loading.value = true
  try {
    page.value = await transactionService.list({
      ...dateRange.value,
      type:        filters.type,
      userId:      filters.userId,
      category:    filters.category,
      description: debouncedSearch.value || undefined,
      page:        currentPage.value,
      size:        15,
      sort:        sortParam.value
    })
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  categories.value = await categoryService.list()
}

function goPage(n: number) { currentPage.value = n }

onMounted(async () => {
  if (auth.hasCouple && !coupleStore.couple) await coupleStore.fetchCouple()
  loadTransactions()
  loadCategories()
})
watch([selectedMonth, currentPage, debouncedSearch, sortParam], loadTransactions)
watch(filters, loadTransactions, { deep: true })

// ── Import ────────────────────────────────────────────────────────────────────

const showImport = ref(false)

// ── CRUD ──────────────────────────────────────────────────────────────────────

const showDialog = ref(false)
const editingTx  = ref<TransactionResponse | null>(null)
const submitting = ref(false)

function openCreate() { editingTx.value = null; showDialog.value = true }

function openEdit(tx: TransactionResponse) {
  editingTx.value = tx
  if (tx.recurring || tx.parentTransactionId) {
    scopeTargetTx.value       = tx
    showEditScopeDialog.value = true
  } else {
    showDialog.value = true
  }
}

async function handleSubmit(payload: CreateTransactionPayload) {
  submitting.value = true
  try {
    if (!editingTx.value) {
      await transactionService.create(payload)
      toast.add({ severity: 'success', summary: 'Criado', detail: 'Transação adicionada.', life: 3000 })
      showDialog.value = false
      await loadTransactions()
      return
    }

    if (pendingEditScope.value && pendingEditScope.value !== 'SINGLE') {
      const recurringPayload: UpdateRecurringPayload = {
        category:    payload.category as TransactionCategory,
        amount:      payload.amount,
        description: payload.description,
        date:        payload.date,
        scope:       pendingEditScope.value
      }
      await transactionService.updateRecurring(editingTx.value.id, recurringPayload)
    } else {
      await transactionService.update(editingTx.value.id, payload)
    }

    toast.add({ severity: 'success', summary: 'Atualizado', detail: 'Transação atualizada.', life: 3000 })
    showDialog.value       = false
    pendingEditScope.value = null
    await loadTransactions()
  } catch (e: unknown) {
    const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Tente novamente.'
    toast.add({ severity: 'error', summary: 'Erro', detail, life: 4000 })
  } finally {
    submitting.value = false
  }
}

// ── RF42: escopo de edição ────────────────────────────────────────────────────

const showEditScopeDialog = ref(false)
const scopeTargetTx       = ref<TransactionResponse | null>(null)
const pendingEditScope    = ref<RecurringScope | null>(null)

function confirmEditScope(scope: RecurringScope) {
  showEditScopeDialog.value = false
  pendingEditScope.value    = scope
  showDialog.value          = true
}

// ── RF43: escopo de exclusão ──────────────────────────────────────────────────

const showDeleteScopeDialog = ref(false)
const deleteTargetTx        = ref<TransactionResponse | null>(null)

function handleDelete(tx: TransactionResponse) {
  if (tx.recurring || tx.parentTransactionId) {
    deleteTargetTx.value        = tx
    showDeleteScopeDialog.value = true
  } else {
    executeSimpleDelete(tx)
  }
}

async function confirmDeleteScope(scope: RecurringScope) {
  showDeleteScopeDialog.value = false
  const tx = deleteTargetTx.value
  if (!tx) return

  submitting.value = true
  try {
    await transactionService.deleteRecurring(tx.id, { scope })
    const msg = scope === 'ALL'
      ? 'Toda a série foi removida.'
      : scope === 'THIS_AND_FUTURE'
        ? 'Esta e as próximas ocorrências foram removidas.'
        : 'Transação removida.'
    toast.add({ severity: 'success', summary: 'Removido', detail: msg, life: 3000 })
    await loadTransactions()
  } catch {
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível remover. Tente novamente.', life: 4000 })
  } finally {
    submitting.value = false
    deleteTargetTx.value = null
  }
}

async function executeSimpleDelete(tx: TransactionResponse) {
  submitting.value = true
  try {
    await transactionService.delete(tx.id)
    toast.add({ severity: 'success', summary: 'Removido', detail: 'Transação removida.', life: 3000 })
    await loadTransactions()
  } catch {
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível remover. Tente novamente.', life: 4000 })
  } finally {
    submitting.value = false
  }
}

// ── Mobile menu ───────────────────────────────────────────────────────────────

const showMobileMenu = ref(false)
const mobileMenuTx   = ref<TransactionResponse | null>(null)

function openMobileMenu(tx: TransactionResponse) {
  mobileMenuTx.value   = tx
  showMobileMenu.value = true
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function categoryLabel(cat: TransactionCategory): string {
  return categories.value.find(c => c.name === cat)?.label ?? cat
}

function highlightMatch(text: string): string {
  const term = debouncedSearch.value
  if (!term) return escapeHtml(text)
  const escaped = escapeRegex(term)
  return escapeHtml(text).replace(
    new RegExp(`(${escaped})`, 'gi'),
    '<mark class="bg-amber-100 text-amber-800 rounded px-0.5">$1</mark>'
  )
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
</script>

<style scoped>
.bottom-sheet-enter-active, .bottom-sheet-leave-active { transition: opacity 0.25s ease; }
.bottom-sheet-enter-active .sheet-panel, .bottom-sheet-leave-active .sheet-panel { transition: transform 0.25s ease; }
.bottom-sheet-enter-from, .bottom-sheet-leave-to { opacity: 0; }
.bottom-sheet-enter-from .sheet-panel, .bottom-sheet-leave-to .sheet-panel { transform: translateY(100%); }
.sheet-panel { padding-bottom: max(1rem, env(safe-area-inset-bottom)); }
</style>
