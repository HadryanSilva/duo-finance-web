<template>
  <div class="p-4 lg:p-8 space-y-6">

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 class="font-display font-semibold text-surface-900 text-lg">Orçamento doméstico</h2>
        <p class="text-surface-400 text-sm mt-0.5">Distribuição da renda por categoria</p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <!-- Navegação de mês (só na aba overview) -->
        <template v-if="activeTab === 'overview'">
          <div class="flex items-center gap-1 bg-white border border-surface-200 rounded-xl px-1 py-1">
            <button @click="prevMonth" class="w-7 h-7 rounded-lg flex items-center justify-center text-surface-500 hover:bg-surface-50 transition-colors">
              <i class="pi pi-chevron-left text-xs" />
            </button>
            <span class="text-sm font-medium text-surface-700 px-1 min-w-[90px] text-center capitalize">{{ monthLabel }}</span>
            <button @click="nextMonth" :disabled="isCurrentMonth" class="w-7 h-7 rounded-lg flex items-center justify-center text-surface-500 hover:bg-surface-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <i class="pi pi-chevron-right text-xs" />
            </button>
          </div>
        </template>
        <button v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value"
          class="px-3 py-2 rounded-xl text-sm font-medium transition-all border"
          :class="activeTab === tab.value ? 'bg-surface-900 text-white border-surface-900' : 'bg-white border-surface-200 text-surface-600 hover:border-surface-300'">
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- ── ABA: VISÃO GERAL ─────────────────────────────────────────────── -->
    <template v-if="activeTab === 'overview'">

      <!-- Renda + totais -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="card p-4 col-span-2 lg:col-span-1">
          <div class="flex items-center justify-between mb-1">
            <p class="text-xs text-surface-400">Renda mensal</p>
            <button @click="openIncomeDialog" class="text-xs text-surface-400 hover:text-surface-700 transition-colors">
              <i class="pi pi-pencil text-[10px]" />
            </button>
          </div>
          <p v-if="overview?.monthlyIncome" class="text-lg font-mono font-semibold text-surface-900">
            {{ formatCurrency(overview.monthlyIncome) }}
          </p>
          <button v-else @click="openIncomeDialog" class="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
            + Definir renda
          </button>
        </div>

        <div class="card p-4">
          <p class="text-xs text-surface-400 mb-1">Total alocado</p>
          <p class="text-lg font-mono font-semibold text-surface-900">
            {{ overview ? overview.totalAllocatedPct.toFixed(1) + '%' : '—' }}
          </p>
          <p v-if="overview?.monthlyIncome" class="text-xs text-surface-400 mt-0.5">
            {{ formatCurrency(overview.totalAllocated) }}
          </p>
        </div>

        <div class="card p-4">
          <p class="text-xs text-surface-400 mb-1">Gasto no mês</p>
          <p class="text-lg font-mono font-semibold" :class="overview && overview.totalSpent > overview.totalAllocated ? 'text-red-500' : 'text-surface-900'">
            {{ overview ? formatCurrency(overview.totalSpent) : '—' }}
          </p>
        </div>

        <div class="card p-4">
          <p class="text-xs text-surface-400 mb-1">Saldo do orçamento</p>
          <p class="text-lg font-mono font-semibold" :class="overview && overview.totalRemaining < 0 ? 'text-red-500' : 'text-green-600'">
            {{ overview ? formatCurrency(overview.totalRemaining) : '—' }}
          </p>
        </div>
      </div>

      <!-- Categorias -->
      <div class="card p-0 overflow-hidden">
        <div class="px-4 lg:px-6 py-4 border-b border-surface-50 flex items-center justify-between">
          <h3 class="font-display font-semibold text-surface-900">Por categoria</h3>
          <button @click="activeTab = 'edit'" class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-surface-200 text-surface-700 hover:border-surface-400 transition-colors">
            <i class="pi pi-pencil text-[10px]" />
            Editar orçamento
          </button>
        </div>

        <div v-if="loadingOverview" class="divide-y divide-surface-50">
          <div v-for="i in 4" :key="i" class="flex items-center gap-4 px-4 lg:px-6 py-4">
            <div class="h-3.5 bg-surface-100 rounded animate-pulse w-1/4" />
            <div class="flex-1 h-2 bg-surface-50 rounded-full animate-pulse" />
            <div class="h-3.5 bg-surface-100 rounded animate-pulse w-28" />
          </div>
        </div>

        <div v-else-if="!overview?.categories.length" class="py-14 text-center">
          <i class="pi pi-wallet text-surface-200 text-4xl mb-3 block" />
          <p class="text-surface-700 font-medium mb-1">Nenhuma categoria no orçamento</p>
          <p class="text-surface-400 text-sm mb-4">Defina a renda e distribua por categoria para começar.</p>
          <button @click="activeTab = 'edit'" class="px-4 py-2 rounded-xl text-sm font-medium bg-surface-900 text-white hover:bg-surface-800 transition-colors">
            Configurar orçamento
          </button>
        </div>

        <div v-else class="divide-y divide-surface-50">
          <div v-for="cat in overview!.categories" :key="cat.category" class="px-4 lg:px-6 py-4">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-sm font-medium text-surface-800 truncate">{{ cat.categoryLabel }}</span>
                <span class="text-xs text-surface-400 shrink-0">{{ cat.percentage.toFixed(1) }}%</span>
                <span v-if="cat.status !== 'OK'" class="text-[10px] font-medium px-1.5 py-0.5 rounded-md shrink-0"
                  :class="cat.status === 'EXCEEDED' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'">
                  {{ cat.status === 'EXCEEDED' ? '🚨' : '⚠️' }}
                </span>
              </div>
              <div class="text-right shrink-0 ml-3">
                <span class="text-sm font-mono font-medium" :class="statusColor(cat.status)">{{ formatCurrency(cat.spent) }}</span>
                <span class="text-xs text-surface-400"> / {{ formatCurrency(cat.allocated) }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="flex-1 bg-surface-100 rounded-full h-1.5 overflow-hidden">
                <div class="h-1.5 rounded-full transition-all duration-500" :class="statusBar(cat.status)"
                  :style="{ width: `${Math.min(cat.usagePercentage, 100)}%` }" />
              </div>
              <span class="text-xs text-surface-400 shrink-0 w-10 text-right">{{ cat.usagePercentage.toFixed(0) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ── ABA: EDITAR ORÇAMENTO ────────────────────────────────────────── -->
    <template v-else-if="activeTab === 'edit'">
      <div class="card">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="font-display font-semibold text-surface-900">Distribuição por categoria</h3>
            <p class="text-surface-400 text-xs mt-0.5">
              <span v-if="overview?.monthlyIncome">Base: {{ formatCurrency(overview.monthlyIncome) }} / mês</span>
              <button v-else @click="openIncomeDialog" class="text-primary-600 hover:text-primary-700 font-medium transition-colors">Definir renda primeiro</button>
            </p>
          </div>
          <!-- Totalizador -->
          <div class="text-right">
            <p class="text-sm font-semibold" :class="totalEditPct > 100 ? 'text-red-500' : totalEditPct === 100 ? 'text-green-600' : 'text-surface-700'">
              {{ totalEditPct.toFixed(1) }}% alocado
            </p>
            <p class="text-xs text-surface-400">
              {{ totalEditPct > 100 ? `${(totalEditPct - 100).toFixed(1)}% acima` : `${(100 - totalEditPct).toFixed(1)}% livre` }}
            </p>
          </div>
        </div>

        <!-- Barra global de alocação -->
        <div class="w-full bg-surface-100 rounded-full h-2 mb-6 overflow-hidden">
          <div class="h-2 rounded-full transition-all duration-300"
            :class="totalEditPct > 100 ? 'bg-red-400' : totalEditPct > 80 ? 'bg-amber-400' : 'bg-green-500'"
            :style="{ width: `${Math.min(totalEditPct, 100)}%` }" />
        </div>

        <!-- Categorias editáveis -->
        <div class="space-y-2 mb-6">

          <!-- Categorias já no orçamento -->
          <div v-for="item in editItems" :key="item.category"
            class="flex items-center gap-3 p-3 rounded-xl border border-surface-200 hover:border-surface-300 transition-colors">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-surface-800">{{ item.label }}</p>
              <p class="text-xs text-surface-400 mt-0.5">
                {{ overview?.monthlyIncome ? formatCurrency((overview.monthlyIncome * item.percentage) / 100) : '—' }}
              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <input v-model.number="item.percentage" type="number" min="0" max="100" step="0.5"
                class="w-20 text-right text-sm border border-surface-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-surface-400 transition-colors" />
              <span class="text-sm text-surface-400 w-4">%</span>
              <button @click="removeItem(item.category)"
                class="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                <i class="pi pi-times text-xs" />
              </button>
            </div>
          </div>

          <!-- Adicionar categoria -->
          <div v-if="availableToAdd.length" class="relative">
            <select v-model="categoryToAdd" @change="addCategory"
              class="w-full text-sm border border-dashed border-surface-300 rounded-xl px-4 py-3 bg-white text-surface-600 focus:outline-none hover:border-surface-400 transition-colors appearance-none cursor-pointer">
              <option value="">+ Adicionar categoria...</option>
              <option v-for="cat in availableToAdd" :key="cat.name ?? cat.id ?? ''" :value="cat.name ?? cat.id">
                {{ cat.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Ações -->
        <div class="flex gap-2">
          <button v-if="editItems.length" @click="confirmClearAll"
            class="px-3 py-2 rounded-xl text-sm text-surface-400 hover:text-red-500 hover:bg-red-50 transition-colors border border-surface-200">
            Limpar tudo
          </button>
          <div class="flex-1" />
          <Button label="Cancelar" severity="secondary" @click="activeTab = 'overview'" />
          <Button label="Salvar orçamento" :loading="saving" :disabled="totalEditPct > 100 || !editItems.length" @click="saveBudget" />
        </div>
      </div>
    </template>

    <!-- ── ABA: COMPARATIVO ─────────────────────────────────────────────── -->
    <template v-else>
      <div class="card p-0 overflow-hidden">
        <div class="px-4 lg:px-6 py-4 border-b border-surface-50 flex items-center justify-between">
          <div>
            <h3 class="font-display font-semibold text-surface-900">Orçado vs Realizado</h3>
            <p v-if="comparison?.monthlyIncome" class="text-surface-400 text-xs mt-0.5">Base: {{ formatCurrency(comparison.monthlyIncome) }}/mês</p>
          </div>
          <select v-model="comparisonMonths" @change="loadComparison"
            class="text-sm border border-surface-200 rounded-xl px-3 py-1.5 bg-white text-surface-700 focus:outline-none">
            <option :value="3">3 meses</option>
            <option :value="6">6 meses</option>
            <option :value="12">12 meses</option>
          </select>
        </div>

        <div v-if="loadingComparison" class="divide-y divide-surface-50">
          <div v-for="i in 6" :key="i" class="flex items-center gap-4 px-4 lg:px-6 py-3.5">
            <div class="h-3.5 bg-surface-100 rounded animate-pulse w-16" />
            <div class="flex-1 h-3 bg-surface-50 rounded animate-pulse" />
            <div class="h-3.5 bg-surface-100 rounded animate-pulse w-24" />
          </div>
        </div>

        <table v-else-if="comparison" class="w-full text-sm">
          <thead>
            <tr class="border-b border-surface-100">
              <th class="text-left px-4 lg:px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wide">Mês</th>
              <th class="text-right px-4 lg:px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wide hidden sm:table-cell">Orçado</th>
              <th class="text-right px-4 lg:px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wide hidden sm:table-cell">Gasto</th>
              <th class="text-right px-4 lg:px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wide">Aderência</th>
              <th class="text-center px-4 lg:px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-50">
            <tr v-for="m in [...comparison.months].reverse()" :key="`${m.year}-${m.month}`" class="hover:bg-surface-50/60 transition-colors">
              <td class="px-4 lg:px-6 py-3.5 font-medium text-surface-800">{{ m.monthLabel }}</td>
              <td class="px-4 lg:px-6 py-3.5 text-right font-mono text-surface-600 hidden sm:table-cell">{{ formatCurrency(m.totalAllocated) }}</td>
              <td class="px-4 lg:px-6 py-3.5 text-right font-mono hidden sm:table-cell" :class="m.withinBudget ? 'text-surface-700' : 'text-red-500 font-medium'">
                {{ formatCurrency(m.totalSpent) }}
              </td>
              <td class="px-4 lg:px-6 py-3.5 text-right">
                <div class="flex items-center justify-end gap-2">
                  <div class="w-16 bg-surface-100 rounded-full h-1.5 overflow-hidden hidden sm:block">
                    <div class="h-1.5 rounded-full" :class="m.adherencePercentage > 100 ? 'bg-red-400' : m.adherencePercentage > 80 ? 'bg-amber-400' : 'bg-green-500'"
                      :style="{ width: `${Math.min(m.adherencePercentage, 100)}%` }" />
                  </div>
                  <span class="text-xs font-medium text-surface-700">{{ m.adherencePercentage.toFixed(0) }}%</span>
                </div>
              </td>
              <td class="px-4 lg:px-6 py-3.5 text-center">
                <span class="text-xs font-medium px-2 py-0.5 rounded-full"
                  :class="m.withinBudget ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'">
                  {{ m.withinBudget ? '✓ Ok' : '✗ Estourou' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- ── DIALOG: Renda mensal ──────────────────────────────────────────── -->
    <Dialog v-model:visible="showIncomeDialog" header="Renda mensal do casal" :modal="true"
      :style="{ width: 'min(400px, 95vw)' }"
      :pt="{ content: { class: 'p-4 lg:p-6' }, header: { class: 'px-4 lg:px-6 pt-4 lg:pt-6 pb-0' } }">
      <div class="space-y-4 pt-4">
        <div>
          <label class="block text-sm font-medium text-surface-700 mb-2">Renda conjunta mensal (R$)</label>
          <InputText v-model="incomeInput" type="number" class="w-full" placeholder="Ex: 8000.00" autofocus />
          <p class="text-xs text-surface-400 mt-1.5">Soma das rendas do casal. Usada como base (100%) para o orçamento.</p>
        </div>
        <div class="flex gap-2 pt-2">
          <Button label="Cancelar" severity="secondary" class="flex-1" @click="showIncomeDialog = false" />
          <Button label="Salvar" class="flex-1" :loading="savingIncome" :disabled="!incomeInput" @click="saveIncome" />
        </div>
      </div>
    </Dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { budgetService, categoryService } from '@/services'
import type {
  BudgetOverviewResponse, BudgetComparisonResponse,
  CategoryResponse, BudgetStatus, TransactionCategory
} from '@/types'

const toast   = useToast()
const confirm = useConfirm()

// ── Abas ──────────────────────────────────────────────────────────────────────

const activeTab = ref<'overview' | 'edit' | 'comparison'>('overview')
const tabs = [
  { label: 'Visão geral', value: 'overview'    as const },
  { label: 'Editar',      value: 'edit'        as const },
  { label: 'Comparativo', value: 'comparison'  as const }
]

// ── Navegação de mês ──────────────────────────────────────────────────────────

const today = new Date()
const year  = ref(today.getFullYear())
const month = ref(today.getMonth() + 1)

const monthLabel = computed(() =>
  new Date(year.value, month.value - 1, 15)
    .toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
)
const isCurrentMonth = computed(() =>
  year.value === today.getFullYear() && month.value === today.getMonth() + 1
)
function prevMonth() {
  if (month.value === 1) { month.value = 12; year.value-- } else month.value--
}
function nextMonth() {
  if (isCurrentMonth.value) return
  if (month.value === 12) { month.value = 1; year.value++ } else month.value++
}

// ── Dados ─────────────────────────────────────────────────────────────────────

const overview          = ref<BudgetOverviewResponse | null>(null)
const comparison        = ref<BudgetComparisonResponse | null>(null)
const allCategories     = ref<CategoryResponse[]>([])
const loadingOverview   = ref(false)
const loadingComparison = ref(false)
const comparisonMonths  = ref(6)

async function loadOverview() {
  loadingOverview.value = true
  try { overview.value = await budgetService.overview(year.value, month.value) }
  finally { loadingOverview.value = false }
}

async function loadComparison() {
  loadingComparison.value = true
  try { comparison.value = await budgetService.comparison(comparisonMonths.value) }
  finally { loadingComparison.value = false }
}

async function loadCategories() {
  allCategories.value = await categoryService.list('EXPENSE')
}

onMounted(() => { loadOverview(); loadComparison(); loadCategories() })
watch([year, month], loadOverview)
watch(activeTab, (tab) => {
  if (tab === 'comparison' && !comparison.value) loadComparison()
  if (tab === 'edit') initEditItems()
})

// ── Renda mensal ──────────────────────────────────────────────────────────────

const showIncomeDialog = ref(false)
const incomeInput      = ref('')
const savingIncome     = ref(false)

function openIncomeDialog() {
  incomeInput.value    = overview.value?.monthlyIncome?.toString() ?? ''
  showIncomeDialog.value = true
}

async function saveIncome() {
  if (!incomeInput.value) return
  savingIncome.value = true
  try {
    await budgetService.setIncome(Number(incomeInput.value))
    toast.add({ severity: 'success', summary: 'Renda atualizada', life: 3000 })
    showIncomeDialog.value = false
    await loadOverview()
  } catch {
    toast.add({ severity: 'error', summary: 'Erro ao salvar renda', life: 3000 })
  } finally { savingIncome.value = false }
}

// ── Edição de orçamento ───────────────────────────────────────────────────────

interface EditItem { category: string; label: string; percentage: number }

const editItems      = ref<EditItem[]>([])
const categoryToAdd  = ref('')
const saving         = ref(false)

const totalEditPct = computed(() =>
  editItems.value.reduce((s, i) => s + (Number(i.percentage) || 0), 0)
)

// Categorias ainda não no orçamento
const availableToAdd = computed(() =>
  allCategories.value.filter(c => {
    const key = c.name ?? c.id ?? ''
    return !editItems.value.some(i => i.category === key)
  })
)

function initEditItems() {
  editItems.value = (overview.value?.categories ?? []).map(c => ({
    category:   c.category,
    label:      c.categoryLabel,
    percentage: c.percentage
  }))
  categoryToAdd.value = ''
}

function addCategory() {
  if (!categoryToAdd.value) return
  const cat = allCategories.value.find(c => (c.name ?? c.id) === categoryToAdd.value)
  if (!cat) return
  editItems.value.push({ category: categoryToAdd.value, label: cat.label, percentage: 0 })
  categoryToAdd.value = ''
}

function removeItem(category: string) {
  editItems.value = editItems.value.filter(i => i.category !== category)
}

async function saveBudget() {
  if (totalEditPct.value > 100 || !editItems.value.length) return
  saving.value = true
  try {
    const allocations = editItems.value
      .filter(i => Number(i.percentage) > 0)
      .map(i => ({ category: i.category as TransactionCategory, percentage: Number(i.percentage) }))

    await budgetService.saveBudget(allocations)
    toast.add({ severity: 'success', summary: 'Orçamento salvo', detail: `${allocations.length} categorias atualizadas`, life: 3000 })
    activeTab.value = 'overview'
    await loadOverview()
  } catch (e: unknown) {
    const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Verifique os percentuais.'
    toast.add({ severity: 'error', summary: 'Erro ao salvar', detail, life: 5000 })
  } finally { saving.value = false }
}

function confirmClearAll() {
  confirm.require({
    message: 'Remover todas as categorias do orçamento?',
    header: 'Limpar orçamento',
    icon: 'pi pi-trash',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Limpar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await budgetService.clearAll()
      editItems.value = []
      await loadOverview()
      toast.add({ severity: 'success', summary: 'Orçamento limpo', life: 3000 })
    }
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function statusColor(s: BudgetStatus) {
  if (s === 'EXCEEDED') return 'text-red-500'
  if (s === 'WARNING')  return 'text-amber-500'
  return 'text-surface-800'
}
function statusBar(s: BudgetStatus) {
  if (s === 'EXCEEDED') return 'bg-red-400'
  if (s === 'WARNING')  return 'bg-amber-400'
  return 'bg-green-500'
}
</script>
