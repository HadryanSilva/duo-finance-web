<template>
  <div class="p-4 lg:p-8 space-y-6">

    <!-- Header + navegação de mês -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 class="font-display font-semibold text-surface-900 text-lg capitalize">{{ data?.monthLabel }}</h2>
        <p class="text-surface-400 text-sm mt-0.5">Orçamento doméstico</p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <div class="flex items-center gap-1 bg-white border border-surface-200 rounded-xl px-1 py-1">
          <button @click="prevMonth" class="w-7 h-7 rounded-lg flex items-center justify-center text-surface-500 hover:bg-surface-50 transition-colors">
            <i class="pi pi-chevron-left text-xs" />
          </button>
          <span class="text-sm font-medium text-surface-700 px-1 min-w-[90px] text-center capitalize">{{ monthLabel }}</span>
          <button @click="nextMonth" :disabled="isCurrentMonth" class="w-7 h-7 rounded-lg flex items-center justify-center text-surface-500 hover:bg-surface-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <i class="pi pi-chevron-right text-xs" />
          </button>
        </div>
        <button v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value"
          class="px-3 py-2 rounded-xl text-sm font-medium transition-all border"
          :class="activeTab === tab.value ? 'bg-surface-900 text-white border-surface-900' : 'bg-white border-surface-200 text-surface-600 hover:border-surface-300'">
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- ── ABA: VISÃO GERAL ─────────────────────────────────────────────── -->
    <template v-if="activeTab === 'overview'">

      <!-- Limite global -->
      <div class="card">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h3 class="font-display font-semibold text-surface-900">Limite global mensal</h3>
            <p class="text-surface-400 text-xs mt-0.5">Teto total de despesas do casal</p>
          </div>
          <div class="flex items-center gap-2">
            <button v-if="data?.globalLimit" @click="showRemoveGlobal = true" class="text-xs text-surface-400 hover:text-red-500 transition-colors">Remover</button>
            <button @click="openGlobalDialog" class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-surface-900 text-white hover:bg-surface-800 transition-colors">
              <i class="pi pi-pencil text-[10px]" />
              {{ data?.globalLimit ? 'Editar' : 'Definir limite' }}
            </button>
          </div>
        </div>

        <div v-if="loading" class="h-16 bg-surface-50 rounded-xl animate-pulse" />
        <template v-else-if="data">
          <div v-if="data.globalLimit" class="space-y-3">
            <div class="flex items-end justify-between">
              <div>
                <p class="text-2xl font-mono font-semibold" :class="alertColor(data.globalAlert)">{{ formatCurrency(data.totalSpent) }}</p>
                <p class="text-xs text-surface-400 mt-0.5">de {{ formatCurrency(data.globalLimit) }} · {{ data.globalPercentage.toFixed(1) }}% utilizado</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-mono font-medium text-surface-700">{{ formatCurrency(data.totalRemaining) }}</p>
                <p class="text-xs text-surface-400">restante</p>
              </div>
            </div>
            <div class="w-full bg-surface-100 rounded-full h-2.5 overflow-hidden">
              <div class="h-2.5 rounded-full transition-all duration-500" :class="barColor(data.globalAlert)"
                :style="{ width: `${Math.min(data.globalPercentage, 100)}%` }" />
            </div>
          </div>
          <div v-else class="flex items-center gap-3 p-4 rounded-xl bg-surface-50 border border-dashed border-surface-200">
            <i class="pi pi-info-circle text-surface-400" />
            <p class="text-sm text-surface-500">Nenhum limite global definido. As metas individuais por categoria serão usadas como referência.</p>
          </div>
        </template>
      </div>

      <!-- Distribuição -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="font-display font-semibold text-surface-900">Distribuição do orçamento</h3>
            <p class="text-surface-400 text-xs mt-0.5">Distribui o limite global entre as categorias</p>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <button v-for="rule in distributionRules" :key="rule.value"
            @click="applyDistribution(rule.value)"
            :disabled="!data?.globalLimit || distributing"
            class="flex flex-col items-start gap-1 p-3 rounded-xl border border-surface-200 hover:border-surface-400 hover:bg-surface-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-left">
            <span class="text-sm font-medium text-surface-800">{{ rule.label }}</span>
            <span class="text-xs text-surface-400">{{ rule.description }}</span>
          </button>
          <button @click="openCustomDistribute" :disabled="!data?.globalLimit"
            class="flex flex-col items-start gap-1 p-3 rounded-xl border-2 border-dashed border-surface-300 hover:border-surface-900 hover:bg-surface-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-left">
            <span class="text-sm font-semibold text-surface-900 flex items-center gap-1.5">
              <i class="pi pi-sliders-h text-xs" />
              Personalizado
            </span>
            <span class="text-xs text-surface-400">Defina % de cada categoria</span>
          </button>
        </div>
      </div>

      <!-- Por categoria -->
      <div class="card p-0 overflow-hidden">
        <div class="px-4 lg:px-6 py-4 border-b border-surface-50">
          <h3 class="font-display font-semibold text-surface-900">Por categoria</h3>
        </div>
        <div v-if="loading" class="divide-y divide-surface-50">
          <div v-for="i in 4" :key="i" class="flex items-center gap-4 px-4 lg:px-6 py-4">
            <div class="h-3.5 bg-surface-100 rounded animate-pulse w-1/4" />
            <div class="flex-1 h-2 bg-surface-50 rounded-full animate-pulse" />
            <div class="h-3.5 bg-surface-100 rounded animate-pulse w-20" />
          </div>
        </div>
        <div v-else-if="!data?.categories.length" class="py-12 text-center">
          <i class="pi pi-flag text-surface-200 text-3xl mb-2 block" />
          <p class="text-surface-400 text-sm">Nenhuma meta ativa. Use a distribuição personalizada para criar metas.</p>
        </div>
        <div v-else class="divide-y divide-surface-50">
          <div v-for="cat in data!.categories" :key="cat.category" class="px-4 lg:px-6 py-4">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-surface-800">{{ cat.categoryLabel }}</span>
                <span v-if="cat.alertLevel !== 'NONE'" class="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                  :class="cat.alertLevel === 'EXCEEDED' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'">
                  {{ cat.alertLevel === 'EXCEEDED' ? '🚨 Estourado' : '⚠️ Atenção' }}
                </span>
              </div>
              <div class="text-right">
                <span class="text-sm font-mono font-medium" :class="alertColor(cat.alertLevel)">{{ formatCurrency(cat.spent) }}</span>
                <span class="text-xs text-surface-400"> / {{ formatCurrency(cat.budgeted) }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="flex-1 bg-surface-100 rounded-full h-1.5 overflow-hidden">
                <div class="h-1.5 rounded-full transition-all duration-500" :class="barColor(cat.alertLevel)"
                  :style="{ width: `${cat.percentage}%` }" />
              </div>
              <span class="text-xs text-surface-400 shrink-0 w-10 text-right">{{ cat.percentage.toFixed(0) }}%</span>
            </div>
            <p class="text-xs text-surface-400 mt-1">{{ formatCurrency(cat.remaining) }} restante · {{ cat.percentageOfTotal.toFixed(1) }}% do total gasto</p>
          </div>
        </div>
      </div>
    </template>

    <!-- ── ABA: COMPARATIVO ─────────────────────────────────────────────── -->
    <template v-else>
      <div class="card p-0 overflow-hidden">
        <div class="px-4 lg:px-6 py-4 border-b border-surface-50 flex items-center justify-between">
          <h3 class="font-display font-semibold text-surface-900">Orçado vs Realizado</h3>
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
              <th class="text-right px-4 lg:px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wide hidden sm:table-cell">Realizado</th>
              <th class="text-right px-4 lg:px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wide">Aderência</th>
              <th class="text-center px-4 lg:px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-50">
            <tr v-for="m in [...comparison.months].reverse()" :key="`${m.year}-${m.month}`" class="hover:bg-surface-50/60 transition-colors">
              <td class="px-4 lg:px-6 py-3.5 font-medium text-surface-800">{{ m.monthLabel }}</td>
              <td class="px-4 lg:px-6 py-3.5 text-right font-mono text-surface-600 hidden sm:table-cell">{{ formatCurrency(m.totalBudgeted) }}</td>
              <td class="px-4 lg:px-6 py-3.5 text-right font-mono hidden sm:table-cell" :class="m.withinBudget ? 'text-surface-700' : 'text-red-500 font-medium'">{{ formatCurrency(m.totalSpent) }}</td>
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
                <span class="text-xs font-medium px-2 py-0.5 rounded-full" :class="m.withinBudget ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'">
                  {{ m.withinBudget ? '✓ Ok' : '✗ Estourou' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- ── DIALOG: Limite global ─────────────────────────────────────────── -->
    <Dialog v-model:visible="showGlobalDialog" header="Limite global mensal" :modal="true"
      :style="{ width: 'min(420px, 95vw)' }"
      :pt="{ content: { class: 'p-4 lg:p-6' }, header: { class: 'px-4 lg:px-6 pt-4 lg:pt-6 pb-0' } }">
      <div class="space-y-4 pt-4">
        <div>
          <label class="block text-sm font-medium text-surface-700 mb-2">Valor mensal (R$)</label>
          <InputText v-model="globalLimitInput" type="number" class="w-full" placeholder="Ex: 5000.00" />
          <p class="text-xs text-surface-400 mt-1.5">Teto total de despesas do casal por mês.</p>
        </div>
        <div class="flex gap-2 pt-2">
          <Button label="Cancelar" severity="secondary" class="flex-1" @click="showGlobalDialog = false" />
          <Button label="Salvar" class="flex-1" :loading="savingGlobal" :disabled="!globalLimitInput" @click="saveGlobalLimit" />
        </div>
      </div>
    </Dialog>

    <!-- ── DIALOG: Remover limite ────────────────────────────────────────── -->
    <Dialog v-model:visible="showRemoveGlobal" header="Remover limite global" :modal="true"
      :style="{ width: 'min(380px, 95vw)' }"
      :pt="{ content: { class: 'p-4 lg:p-6' }, header: { class: 'px-4 lg:px-6 pt-4 lg:pt-6 pb-0' } }">
      <div class="space-y-4 pt-4">
        <p class="text-sm text-surface-500">O orçamento passará a usar a soma das metas individuais como referência.</p>
        <div class="flex gap-2">
          <Button label="Cancelar" severity="secondary" class="flex-1" @click="showRemoveGlobal = false" />
          <Button label="Remover" severity="danger" class="flex-1" :loading="savingGlobal" @click="removeGlobalLimit" />
        </div>
      </div>
    </Dialog>

    <!-- ── DIALOG: Distribuição customizada ─────────────────────────────── -->
    <Dialog v-model:visible="showCustomDialog" header="Distribuição personalizada" :modal="true"
      :style="{ width: 'min(540px, 95vw)' }"
      :pt="{ content: { class: 'p-4 lg:p-6' }, header: { class: 'px-4 lg:px-6 pt-4 lg:pt-6 pb-0' } }">
      <div class="space-y-4 pt-4" v-if="data?.globalLimit">

        <!-- Totalizador -->
        <div class="flex items-center justify-between p-3 rounded-xl transition-colors"
          :class="isTotal100 ? 'bg-green-50' : totalCustomPct > 100 ? 'bg-red-50' : 'bg-surface-50'">
          <div>
            <p class="text-sm font-medium" :class="isTotal100 ? 'text-green-700' : totalCustomPct > 100 ? 'text-red-600' : 'text-surface-700'">
              Total: {{ totalCustomPct.toFixed(1) }}%
            </p>
            <p class="text-xs text-surface-400 mt-0.5">
              <span v-if="isTotal100">Pronto para aplicar</span>
              <span v-else-if="totalCustomPct > 100">Excedendo em {{ (totalCustomPct - 100).toFixed(1) }}%</span>
              <span v-else>Faltam {{ (100 - totalCustomPct).toFixed(1) }}%</span>
            </p>
          </div>
          <button v-if="!isTotal100 && totalCustomPct < 100 && hasLockedItems"
            @click="distributeRemaining"
            class="text-xs text-surface-600 hover:text-surface-900 underline underline-offset-2 transition-colors">
            Distribuir restante
          </button>
        </div>

        <!-- Busca de categoria -->
        <div class="relative">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm pointer-events-none" />
          <input v-model="categorySearch" type="text" placeholder="Buscar categoria..."
            class="w-full pl-9 pr-3 py-2 text-sm border border-surface-200 rounded-xl bg-white focus:outline-none focus:border-surface-400 transition-colors" />
        </div>

        <!-- Lista de categorias -->
        <div class="space-y-1.5 max-h-80 overflow-y-auto scrollbar-thin pr-1">

          <!-- Categorias com percentual > 0 aparecem primeiro -->
          <template v-for="alloc in filteredAllocations" :key="alloc.category">
            <div class="flex items-center gap-3 p-3 rounded-xl border transition-colors"
              :class="alloc.locked ? 'border-surface-900 bg-surface-50' : 'border-surface-200 hover:border-surface-300'">

              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-surface-800">{{ alloc.label }}</p>
                <p class="text-xs mt-0.5" :class="alloc.percentage > 0 ? 'text-surface-500' : 'text-surface-300'">
                  {{ alloc.percentage > 0 ? formatCurrency((data!.globalLimit! * alloc.percentage) / 100) : 'Sem alocação' }}
                </p>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <input v-model.number="alloc.percentage"
                  type="number" min="0" max="100" step="0.5"
                  class="w-20 text-right text-sm border rounded-lg px-2 py-1.5 focus:outline-none focus:border-surface-400 transition-colors"
                  :class="alloc.locked ? 'border-surface-900 font-medium bg-white' : 'border-surface-200'"
                  @input="alloc.locked = Number(alloc.percentage) > 0" />
                <span class="text-sm text-surface-400 w-4">%</span>
                <button @click="toggleLock(alloc)"
                  class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  :class="alloc.locked ? 'bg-surface-900 text-white' : 'bg-surface-100 text-surface-400 hover:bg-surface-200'">
                  <i :class="alloc.locked ? 'pi pi-lock text-[10px]' : 'pi pi-lock-open text-[10px]'" />
                </button>
              </div>
            </div>
          </template>

          <p v-if="filteredAllocations.length === 0" class="text-sm text-surface-400 text-center py-4">
            Nenhuma categoria encontrada
          </p>
        </div>

        <p class="text-xs text-surface-400">
          Categorias com percentual maior que zero terão suas metas criadas ou atualizadas automaticamente.
        </p>

        <div class="flex gap-2 pt-1">
          <Button label="Cancelar" severity="secondary" class="flex-1" @click="showCustomDialog = false" />
          <Button label="Aplicar" class="flex-1" :loading="distributing" :disabled="!isTotal100" @click="applyCustomDistribution" />
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
import { budgetService, categoryService } from '@/services'
import type { BudgetOverviewResponse, BudgetComparisonResponse, AlertLevel, DistributionRule } from '@/types'

const toast = useToast()

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

// ── Abas ──────────────────────────────────────────────────────────────────────

const activeTab = ref<'overview' | 'comparison'>('overview')
const tabs = [
  { label: 'Visão geral', value: 'overview'   as const },
  { label: 'Comparativo', value: 'comparison' as const }
]

// ── Dados ─────────────────────────────────────────────────────────────────────

const data              = ref<BudgetOverviewResponse | null>(null)
const comparison        = ref<BudgetComparisonResponse | null>(null)
const loading           = ref(false)
const loadingComparison = ref(false)
const comparisonMonths  = ref(6)

async function loadOverview() {
  loading.value = true
  try { data.value = await budgetService.overview(year.value, month.value) }
  finally { loading.value = false }
}

async function loadComparison() {
  loadingComparison.value = true
  try { comparison.value = await budgetService.comparison(comparisonMonths.value) }
  finally { loadingComparison.value = false }
}

onMounted(() => { loadOverview(); loadComparison() })
watch([year, month], loadOverview)
watch(activeTab, (tab) => { if (tab === 'comparison' && !comparison.value) loadComparison() })

// ── Limite global ─────────────────────────────────────────────────────────────

const showGlobalDialog = ref(false)
const showRemoveGlobal = ref(false)
const globalLimitInput = ref('')
const savingGlobal     = ref(false)

function openGlobalDialog() {
  globalLimitInput.value = data.value?.globalLimit?.toString() ?? ''
  showGlobalDialog.value = true
}

async function saveGlobalLimit() {
  if (!globalLimitInput.value) return
  savingGlobal.value = true
  try {
    await budgetService.setGlobalLimit(Number(globalLimitInput.value))
    toast.add({ severity: 'success', summary: 'Limite definido', life: 3000 })
    showGlobalDialog.value = false
    await loadOverview()
  } catch { toast.add({ severity: 'error', summary: 'Erro ao salvar limite', life: 3000 }) }
  finally { savingGlobal.value = false }
}

async function removeGlobalLimit() {
  savingGlobal.value = true
  try {
    await budgetService.removeGlobalLimit()
    toast.add({ severity: 'success', summary: 'Limite removido', life: 3000 })
    showRemoveGlobal.value = false
    await loadOverview()
  } catch { toast.add({ severity: 'error', summary: 'Erro ao remover limite', life: 3000 }) }
  finally { savingGlobal.value = false }
}

// ── Distribuição automática ───────────────────────────────────────────────────

const distributing = ref(false)

const distributionRules = [
  { value: 'RULE_50_30_20'           as DistributionRule, label: '50/30/20',    description: 'Necessidades / Desejos / Poupança' },
  { value: 'PROPORTIONAL_HISTORICAL' as DistributionRule, label: 'Histórico',   description: 'Proporcional aos últimos 3 meses' },
  { value: 'EQUAL'                   as DistributionRule, label: 'Igualitário', description: 'Divide entre todas as categorias' }
]

async function applyDistribution(rule: DistributionRule) {
  distributing.value = true
  try {
    const result = await budgetService.distribute(rule)
    toast.add({ severity: 'success', summary: 'Orçamento distribuído', detail: `${result.allocations.length} categorias atualizadas`, life: 4000 })
    await loadOverview()
  } catch (e: unknown) {
    const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Verifique se há um limite global e metas ativas.'
    toast.add({ severity: 'error', summary: 'Erro ao distribuir', detail, life: 5000 })
  } finally { distributing.value = false }
}

// ── Distribuição customizada ──────────────────────────────────────────────────

interface CustomAlloc { category: string; label: string; percentage: number; locked: boolean }

const showCustomDialog  = ref(false)
const customAllocations = ref<CustomAlloc[]>([])
const categorySearch    = ref('')

const totalCustomPct = computed(() =>
  customAllocations.value.reduce((sum, a) => sum + (Number(a.percentage) || 0), 0)
)
const isTotal100 = computed(() => Math.abs(totalCustomPct.value - 100) < 0.01)
const hasLockedItems = computed(() => customAllocations.value.some(a => a.locked))

const filteredAllocations = computed(() => {
  const q = categorySearch.value.toLowerCase()
  const list = q
    ? customAllocations.value.filter(a => a.label.toLowerCase().includes(q))
    : customAllocations.value
  // Categorias alocadas primeiro, depois as sem alocação
  return [...list].sort((a, b) => {
    if (a.percentage > 0 && b.percentage === 0) return -1
    if (a.percentage === 0 && b.percentage > 0) return 1
    return a.label.localeCompare(b.label)
  })
})

async function openCustomDistribute() {
  if (!data.value?.globalLimit) return

  // Carrega TODAS as categorias de despesa (sistema + customizadas)
  const allCategories = await categoryService.list('EXPENSE')
  const globalLimit   = data.value.globalLimit

  // Mapa das metas já existentes com seus limites atuais
  const existingMap = Object.fromEntries(
    (data.value.categories ?? []).map(c => [c.category, c.budgeted])
  )

  customAllocations.value = allCategories.map(cat => {
    const key        = cat.name ?? cat.id ?? ''
    const budgeted   = existingMap[key as keyof typeof existingMap] ?? 0
    const percentage = globalLimit > 0 && budgeted > 0
      ? Math.round((budgeted / globalLimit) * 1000) / 10
      : 0
    return {
      category:   key,
      label:      cat.label,
      percentage,
      locked:     percentage > 0
    }
  })

  categorySearch.value    = ''
  showCustomDialog.value  = true
}

function toggleLock(alloc: CustomAlloc) {
  alloc.locked = !alloc.locked
}

function distributeRemaining() {
  const unlocked    = customAllocations.value.filter(a => !a.locked)
  if (!unlocked.length) return
  const lockedTotal = customAllocations.value.filter(a => a.locked).reduce((s, a) => s + (Number(a.percentage) || 0), 0)
  const remaining   = Math.max(0, 100 - lockedTotal)
  const perCategory = Math.round((remaining / unlocked.length) * 10) / 10
  unlocked.forEach((a, i) => {
    if (i === unlocked.length - 1) {
      const usedByOthers = perCategory * (unlocked.length - 1)
      a.percentage = Math.round((remaining - usedByOthers) * 10) / 10
    } else {
      a.percentage = perCategory
    }
  })
}

async function applyCustomDistribution() {
  if (!isTotal100.value) return
  distributing.value = true
  try {
    const allocations = customAllocations.value
      .filter(a => Number(a.percentage) > 0)
      .map(a => ({ category: a.category, percentage: Number(a.percentage) }))

    const result = await budgetService.distributeCustom(allocations)
    toast.add({ severity: 'success', summary: 'Orçamento atualizado', detail: `${result.allocations.length} categorias atualizadas`, life: 4000 })
    showCustomDialog.value = false
    await loadOverview()
  } catch (e: unknown) {
    const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Verifique os percentuais informados.'
    toast.add({ severity: 'error', summary: 'Erro ao aplicar', detail, life: 5000 })
  } finally { distributing.value = false }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function alertColor(level: AlertLevel) {
  if (level === 'EXCEEDED') return 'text-red-500'
  if (level === 'WARNING')  return 'text-amber-500'
  return 'text-surface-800'
}
function barColor(level: AlertLevel) {
  if (level === 'EXCEEDED') return 'bg-red-400'
  if (level === 'WARNING')  return 'bg-amber-400'
  return 'bg-green-500'
}
</script>
