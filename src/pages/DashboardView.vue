<template>
  <div class="p-4 lg:p-8 space-y-6 lg:space-y-8">

    <!-- Header row: período -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <p class="text-surface-400 text-sm">Período</p>
        <p class="font-display text-surface-900 font-semibold text-lg capitalize">{{ periodLabel }}</p>
      </div>
      <div class="flex items-center gap-2">
        <!-- Navegação por mês -->
        <div class="flex items-center gap-1 bg-white border border-surface-200 rounded-xl px-1 py-1">
          <button
            @click="prevMonth"
            class="w-7 h-7 rounded-lg flex items-center justify-center text-surface-500 hover:bg-surface-50 transition-colors"
          >
            <i class="pi pi-chevron-left text-xs" />
          </button>
          <span class="text-sm font-medium text-surface-700 px-1 min-w-[90px] text-center capitalize">
            {{ new Date(selectedMonth + '-15').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) }}
          </span>
          <button
            @click="nextMonth"
            :disabled="isCurrentMonth"
            class="w-7 h-7 rounded-lg flex items-center justify-center text-surface-500 hover:bg-surface-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <i class="pi pi-chevron-right text-xs" />
          </button>
        </div>

        <!-- Modos agregados -->
        <button
          @click="selectAggregate('3m')"
          class="px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150"
          :class="aggregateMode === '3m' ? 'bg-surface-900 text-white' : 'bg-white border border-surface-200 text-surface-600 hover:border-surface-300'"
        >3 meses</button>
        <button
          @click="selectAggregate('6m')"
          class="px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150"
          :class="aggregateMode === '6m' ? 'bg-surface-900 text-white' : 'bg-white border border-surface-200 text-surface-600 hover:border-surface-300'"
        >6 meses</button>
      </div>
    </div>

    <!-- Summary cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
      <SummaryCard
        label="Receitas"
        :value="summary?.totalIncome ?? 0"
        icon="pi-arrow-down-left"
        color="income"
        :loading="loadingSummary"
      />
      <SummaryCard
        label="Despesas"
        :value="summary?.totalExpense ?? 0"
        icon="pi-arrow-up-right"
        color="expense"
        :loading="loadingSummary"
      />
      <SummaryCard
        label="Saldo"
        :value="summary?.balance ?? 0"
        icon="pi-wallet"
        color="neutral"
        :loading="loadingSummary"
        :highlight="true"
      />
    </div>

    <!-- Metas do mês — RF36/RF37 -->
    <div v-if="goalStore.progress.length > 0" class="card p-0 overflow-hidden">
      <div class="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-surface-50">
        <div>
          <h3 class="font-display font-semibold text-surface-900">Metas do mês</h3>
          <p class="text-surface-400 text-xs mt-0.5">Progresso dos limites definidos</p>
        </div>
        <RouterLink
          to="/goals"
          class="text-xs text-surface-500 hover:text-surface-800 transition-colors flex items-center gap-1"
        >
          Gerenciar <i class="pi pi-arrow-right text-[10px]" />
        </RouterLink>
      </div>

      <div class="divide-y divide-surface-50">
        <div
          v-for="goal in goalStore.progress"
          :key="goal.id"
          class="flex items-center gap-3 lg:gap-4 px-4 lg:px-6 py-3"
        >
          <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-surface-100">
            <i :class="[categoryIcon(goal.category), 'text-xs text-surface-600']" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-medium text-surface-700 truncate">{{ goal.categoryLabel }}</span>
              <span
                class="text-xs font-medium shrink-0 ml-2"
                :class="goalTextColor(goal.alertLevel)"
              >
                {{ goal.percentage.toFixed(0) }}%
                <span v-if="goal.alertLevel === 'EXCEEDED'">🚨</span>
                <span v-else-if="goal.alertLevel === 'WARNING'">⚠️</span>
              </span>
            </div>
            <div class="w-full bg-surface-100 rounded-full h-1.5 overflow-hidden">
              <div
                class="h-1.5 rounded-full transition-all duration-500"
                :class="goalBarColor(goal.alertLevel)"
                :style="{ width: `${goal.percentage}%` }"
              />
            </div>
          </div>
          <div class="text-right shrink-0 hidden sm:block">
            <p class="text-xs font-mono font-medium text-surface-700">{{ formatCurrency(goal.spent) }}</p>
            <p class="text-[10px] text-surface-400">de {{ formatCurrency(goal.monthlyLimit) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts row -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">

      <!-- Comparativo mensal -->
      <div class="lg:col-span-3 card">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="font-display font-semibold text-surface-900">Comparativo mensal</h3>
            <p class="text-surface-400 text-xs mt-0.5">Últimos 6 meses</p>
          </div>
          <div class="flex items-center gap-3 lg:gap-4 text-xs text-surface-500">
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
              Receitas
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
              Despesas
            </span>
          </div>
        </div>

        <div class="relative h-48 lg:h-52 w-full">
          <div v-if="loadingMonthly" class="absolute inset-0 flex items-center justify-center">
            <i class="pi pi-spin pi-spinner text-surface-300 text-2xl" />
          </div>
          <Bar v-else-if="monthlyChartData" :data="monthlyChartData" :options="barOptions" />
        </div>
      </div>

      <!-- Por categoria -->
      <div class="lg:col-span-2 card">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="font-display font-semibold text-surface-900">Por categoria</h3>
            <p class="text-surface-400 text-xs mt-0.5">Despesas do período</p>
          </div>
          <!-- Toggle mostrar todas / top 4 — só aparece se houver mais de 4 -->
          <button
            v-if="categoryData && categoryData.categories.length > 4"
            @click="showAllCategories = !showAllCategories"
            class="flex items-center gap-1 text-xs text-surface-500 hover:text-surface-800 transition-colors"
          >
            <span>{{ showAllCategories ? 'Top 4' : 'Ver todas' }}</span>
            <i :class="showAllCategories ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" class="text-[10px]" />
          </button>
        </div>

        <div v-if="loadingCategory" class="h-48 lg:h-52 flex items-center justify-center">
          <i class="pi pi-spin pi-spinner text-surface-300 text-2xl" />
        </div>

        <template v-else-if="categoryData && categoryData.categories.length > 0">
          <!-- Gráfico doughnut -->
          <div class="relative h-32 lg:h-36 w-full mx-auto">
            <Doughnut :data="doughnutChartData!" :options="doughnutOptions" />
          </div>

          <!-- Legenda com todas ou top 4 -->
          <ul class="mt-4 space-y-1.5">
            <li
              v-for="(cat, i) in visibleCategories"
              :key="cat.category"
              class="flex items-center justify-between text-xs group"
            >
              <span class="flex items-center gap-2 text-surface-600 min-w-0">
                <span
                  class="w-2 h-2 rounded-full shrink-0"
                  :style="{ backgroundColor: doughnutColors[i % doughnutColors.length] }"
                />
                <span class="truncate">{{ cat.categoryLabel }}</span>
              </span>
              <span class="flex items-center gap-2 shrink-0 ml-2">
                <span class="text-surface-400">{{ cat.percentage.toFixed(1) }}%</span>
                <span class="font-medium text-surface-800">{{ formatCurrency(cat.amount) }}</span>
              </span>
            </li>
          </ul>

          <!-- Link "e mais N categorias" quando colapsado -->
          <button
            v-if="!showAllCategories && categoryData.categories.length > 4"
            @click="showAllCategories = true"
            class="mt-2 w-full text-center text-xs text-surface-400 hover:text-surface-700 transition-colors py-1"
          >
            + {{ categoryData.categories.length - 4 }} categorias
          </button>
        </template>

        <div v-else class="h-48 lg:h-52 flex flex-col items-center justify-center text-center">
          <i class="pi pi-chart-pie text-surface-200 text-3xl mb-2" />
          <p class="text-surface-400 text-xs">Sem despesas no período</p>
        </div>
      </div>
    </div>

    <!-- Últimas transações -->
    <div class="card p-0 overflow-hidden">
      <div class="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-surface-50">
        <h3 class="font-display font-semibold text-surface-900">Últimas transações</h3>
        <RouterLink
          to="/transactions"
          class="text-xs text-surface-500 hover:text-surface-800 transition-colors flex items-center gap-1"
        >
          Ver todas <i class="pi pi-arrow-right text-[10px]" />
        </RouterLink>
      </div>

      <div v-if="loadingTransactions" class="divide-y divide-surface-50">
        <div v-for="i in 5" :key="i" class="flex items-center gap-4 px-4 lg:px-6 py-4">
          <div class="w-9 h-9 rounded-xl bg-surface-100 animate-pulse shrink-0" />
          <div class="flex-1 space-y-2">
            <div class="h-3.5 bg-surface-100 rounded animate-pulse w-1/3" />
            <div class="h-3 bg-surface-50 rounded animate-pulse w-1/5" />
          </div>
          <div class="h-4 bg-surface-100 rounded animate-pulse w-20" />
        </div>
      </div>

      <ul v-else-if="recentTransactions.length > 0" class="divide-y divide-surface-50">
        <li
          v-for="tx in recentTransactions"
          :key="tx.id"
          class="flex items-center gap-3 lg:gap-4 px-4 lg:px-6 py-3 lg:py-4 hover:bg-surface-50/60 transition-colors"
        >
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            :class="tx.type === 'INCOME' ? 'bg-green-50' : 'bg-red-50'"
          >
            <i
              :class="[categoryIcon(tx.category), 'text-sm',
                tx.type === 'INCOME' ? 'text-green-600' : 'text-red-400'
              ]"
            />
          </div>

          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-surface-800 truncate">
              {{ tx.description || tx.categoryLabel }}
            </p>
            <p class="text-xs text-surface-400 mt-0.5">
              {{ formatDate(tx.date) }} · {{ tx.createdBy.firstName }}
            </p>
          </div>

          <span
            class="font-mono text-sm font-medium shrink-0"
            :class="tx.type === 'INCOME' ? 'text-green-600' : 'text-red-500'"
          >
            {{ tx.type === 'INCOME' ? '+' : '-' }} {{ formatCurrency(tx.amount) }}
          </span>
        </li>
      </ul>

      <div v-else class="py-16 text-center">
        <i class="pi pi-inbox text-surface-200 text-3xl mb-2 block" />
        <p class="text-surface-400 text-sm">Nenhuma transação no período.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Bar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend
} from 'chart.js'
import { reportService, transactionService } from '@/services'
import { useGoalStore } from '@/stores/goal'
import type { SummaryResponse, ByCategoryResponse, MonthlyComparisonResponse, TransactionResponse, AlertLevel } from '@/types'
import SummaryCard from '../components/SummaryCard.vue'
import { categoryIcon } from '@/utils/categoryIcon'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const goalStore = useGoalStore()

// ── Period ────────────────────────────────────────────────────────────────────

const today         = new Date()
const selectedMonth = ref(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`)
const aggregateMode = ref<'3m' | '6m' | null>(null)

const dateRange = computed(() => {
  if (aggregateMode.value) {
    const d = new Date()
    const end = d.toISOString().slice(0, 10)
    const months = aggregateMode.value === '3m' ? 2 : 5
    d.setMonth(d.getMonth() - months)
    const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
    return { startDate: start, endDate: end }
  }
  const [year = 0, month = 1] = selectedMonth.value.split('-').map(Number)
  const start = new Date(year, month - 1, 1)
  const end   = new Date(year, month, 0)
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate:   end.toISOString().slice(0, 10)
  }
})

const periodLabel = computed(() => {
  if (aggregateMode.value) {
    const { startDate, endDate } = dateRange.value
    const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
    return `${fmt(startDate)} — ${fmt(endDate)}`
  }
  const [year = 0, month = 1] = selectedMonth.value.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
})

function selectAggregate(mode: '3m' | '6m') {
  aggregateMode.value = aggregateMode.value === mode ? null : mode
}

function prevMonth() {
  aggregateMode.value = null
  const [year = 0, month = 1] = selectedMonth.value.split('-').map(Number)
  const d = new Date(year, month - 2, 1)
  selectedMonth.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function nextMonth() {
  aggregateMode.value = null
  const [year = 0, month = 1] = selectedMonth.value.split('-').map(Number)
  const d = new Date(year, month, 1)
  selectedMonth.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const isCurrentMonth = computed(() => {
  const now = new Date()
  const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return selectedMonth.value >= cur
})

// ── Data ──────────────────────────────────────────────────────────────────────

const summary             = ref<SummaryResponse | null>(null)
const categoryData        = ref<ByCategoryResponse | null>(null)
const monthlyData         = ref<MonthlyComparisonResponse | null>(null)
const recentTransactions  = ref<TransactionResponse[]>([])

const loadingSummary      = ref(false)
const loadingCategory     = ref(false)
const loadingMonthly      = ref(false)
const loadingTransactions = ref(false)

async function loadAll() {
  const period = dateRange.value

  loadingSummary.value      = true
  loadingCategory.value     = true
  loadingMonthly.value      = true
  loadingTransactions.value = true

  // Colapsa ao trocar período
  showAllCategories.value = false

  await Promise.all([
    reportService.summary(period)
      .then(d => summary.value = d)
      .finally(() => loadingSummary.value = false),

    reportService.byCategory(period, 'EXPENSE')
      .then(d => categoryData.value = d)
      .finally(() => loadingCategory.value = false),

    reportService.monthlyComparison()
      .then(d => monthlyData.value = d)
      .finally(() => loadingMonthly.value = false),

    transactionService.list({ ...period, size: 8 })
      .then(d => recentTransactions.value = d.content)
      .finally(() => loadingTransactions.value = false),

    goalStore.fetchProgress()
  ])
}

onMounted(loadAll)
watch([selectedMonth, aggregateMode], loadAll)

// ── Categorias — toggle ver todas / top 4 ─────────────────────────────────────

const showAllCategories = ref(false)

const visibleCategories = computed(() => {
  const cats = categoryData.value?.categories ?? []
  return showAllCategories.value ? cats : cats.slice(0, 4)
})

// ── Charts ────────────────────────────────────────────────────────────────────

// Paleta expandida para suportar até 12 categorias de despesa
const doughnutColors = [
  '#1d4ed8', // azul
  '#22c55e', // verde
  '#f59e0b', // âmbar
  '#ef4444', // vermelho
  '#8b5cf6', // violeta
  '#06b6d4', // ciano
  '#f97316', // laranja
  '#ec4899', // rosa
  '#14b8a6', // teal
  '#a855f7', // roxo
  '#84cc16', // lima
  '#64748b', // slate
]

const monthlyChartData = computed(() => {
  if (!monthlyData.value) return null
  const months = monthlyData.value.months
  return {
    labels: months.map(m => m.monthLabel),
    datasets: [
      {
        label: 'Receitas',
        data: months.map(m => m.totalIncome),
        backgroundColor: '#22c55e',
        borderRadius: 6,
        borderSkipped: false
      },
      {
        label: 'Despesas',
        data: months.map(m => m.totalExpense),
        backgroundColor: '#fca5a5',
        borderRadius: 6,
        borderSkipped: false
      }
    ]
  }
})

// O gráfico doughnut sempre mostra todas as categorias — a legenda é que colapsa
const doughnutChartData = computed(() => {
  if (!categoryData.value || categoryData.value.categories.length === 0) return null
  const cats = categoryData.value.categories
  return {
    labels: cats.map(c => c.categoryLabel),
    datasets: [{
      data: cats.map(c => c.amount),
      backgroundColor: cats.map((_, i) => doughnutColors[i % doughnutColors.length]),
      borderWidth: 0,
      hoverOffset: 4
    }]
  }
})

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { mode: 'index' as const } },
  scales: {
    x: { grid: { display: false }, border: { display: false }, ticks: { color: '#a8a49c', font: { size: 11 } } },
    y: { grid: { color: '#f1f0ee' }, border: { display: false }, ticks: { color: '#a8a49c', font: { size: 11 }, callback: (v: string | number) => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0 }) } }
  }
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: { raw: unknown; label: string }) =>
          ` ${ctx.label}: R$ ${Number(ctx.raw).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      }
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function goalBarColor(level: AlertLevel) {
  if (level === 'EXCEEDED') return 'bg-red-500'
  if (level === 'WARNING')  return 'bg-amber-400'
  return 'bg-green-500'
}

function goalTextColor(level: AlertLevel) {
  if (level === 'EXCEEDED') return 'text-red-500'
  if (level === 'WARNING')  return 'text-amber-500'
  return 'text-surface-500'
}
</script>
