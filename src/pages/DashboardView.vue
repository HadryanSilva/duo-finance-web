<template>
  <div class="p-4 lg:p-8 space-y-6 lg:space-y-8">

    <!-- Header row: período -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <p class="text-surface-400 text-sm">Período</p>
        <p class="font-display text-surface-900 font-semibold text-lg capitalize">{{ periodLabel }}</p>
      </div>
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1 bg-white border border-surface-200 rounded-xl px-1 py-1">
          <button @click="prevMonth" class="w-7 h-7 rounded-lg flex items-center justify-center text-surface-500 hover:bg-surface-50 transition-colors">
            <i class="pi pi-chevron-left text-xs" />
          </button>
          <span class="text-sm font-medium text-surface-700 px-1 min-w-[90px] text-center capitalize">
            {{ new Date(selectedMonth + '-15').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) }}
          </span>
          <button @click="nextMonth" :disabled="isCurrentMonth" class="w-7 h-7 rounded-lg flex items-center justify-center text-surface-500 hover:bg-surface-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <i class="pi pi-chevron-right text-xs" />
          </button>
        </div>
        <button @click="selectAggregate('3m')" class="px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150" :class="aggregateMode === '3m' ? 'bg-surface-900 text-white' : 'bg-white border border-surface-200 text-surface-600 hover:border-surface-300'">3 meses</button>
        <button @click="selectAggregate('6m')" class="px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150" :class="aggregateMode === '6m' ? 'bg-surface-900 text-white' : 'bg-white border border-surface-200 text-surface-600 hover:border-surface-300'">6 meses</button>
      </div>
    </div>

    <!-- Summary cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
      <SummaryCard label="Receitas" :value="summary?.totalIncome ?? 0" icon="pi-arrow-down-left" color="income" :loading="loadingSummary" />
      <SummaryCard label="Despesas" :value="summary?.totalExpense ?? 0" icon="pi-arrow-up-right" color="expense" :loading="loadingSummary" />
      <SummaryCard label="Saldo" :value="summary?.balance ?? 0" icon="pi-wallet" color="neutral" :loading="loadingSummary" :highlight="true" />
    </div>

    <!-- Metas do mês — RF36/RF37 -->
    <div v-if="goalStore.progress.length > 0" class="card p-0 overflow-hidden">
      <div class="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-surface-50">
        <div>
          <h3 class="font-display font-semibold text-surface-900">Metas do mês</h3>
          <p class="text-surface-400 text-xs mt-0.5">Progresso dos limites definidos</p>
        </div>
        <RouterLink to="/goals" class="text-xs text-surface-500 hover:text-surface-800 transition-colors flex items-center gap-1">
          Gerenciar <i class="pi pi-arrow-right text-[10px]" />
        </RouterLink>
      </div>
      <div class="divide-y divide-surface-50">
        <div v-for="goal in goalStore.progress" :key="goal.id" class="flex items-center gap-3 lg:gap-4 px-4 lg:px-6 py-3">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-surface-100">
            <i :class="[categoryIcon(goal.category), 'text-xs text-surface-600']" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-medium text-surface-700 truncate">{{ goal.categoryLabel }}</span>
              <span class="text-xs font-medium shrink-0 ml-2" :class="goalTextColor(goal.alertLevel)">
                {{ goal.percentage.toFixed(0) }}%
                <span v-if="goal.alertLevel === 'EXCEEDED'">🚨</span>
                <span v-else-if="goal.alertLevel === 'WARNING'">⚠️</span>
              </span>
            </div>
            <div class="w-full bg-surface-100 rounded-full h-1.5 overflow-hidden">
              <div class="h-1.5 rounded-full transition-all duration-500" :class="goalBarColor(goal.alertLevel)" :style="{ width: `${goal.percentage}%` }" />
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
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Receitas</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />Despesas</span>
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
          <button v-if="categoryData && categoryData.categories.length > 4" @click="showAllCategories = !showAllCategories" class="flex items-center gap-1 text-xs text-surface-500 hover:text-surface-800 transition-colors">
            <span>{{ showAllCategories ? 'Top 4' : 'Ver todas' }}</span>
            <i :class="showAllCategories ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" class="text-[10px]" />
          </button>
        </div>
        <div v-if="loadingCategory" class="h-48 lg:h-52 flex items-center justify-center">
          <i class="pi pi-spin pi-spinner text-surface-300 text-2xl" />
        </div>
        <template v-else-if="categoryData && categoryData.categories.length > 0">
          <div class="relative h-32 lg:h-36 w-full mx-auto">
            <Doughnut :data="doughnutChartData!" :options="doughnutOptions" />
          </div>
          <ul class="mt-4 space-y-1.5">
            <li v-for="(cat, i) in visibleCategories" :key="cat.category" class="flex items-center justify-between text-xs">
              <span class="flex items-center gap-2 text-surface-600 min-w-0">
                <span class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: doughnutColors[i % doughnutColors.length] }" />
                <span class="truncate">{{ cat.categoryLabel }}</span>
              </span>
              <span class="flex items-center gap-2 shrink-0 ml-2">
                <span class="text-surface-400">{{ cat.percentage.toFixed(1) }}%</span>
                <span class="font-medium text-surface-800">{{ formatCurrency(cat.amount) }}</span>
              </span>
            </li>
          </ul>
          <button v-if="!showAllCategories && categoryData.categories.length > 4" @click="showAllCategories = true" class="mt-2 w-full text-center text-xs text-surface-400 hover:text-surface-700 transition-colors py-1">
            + {{ categoryData.categories.length - 4 }} categorias
          </button>
        </template>
        <div v-else class="h-48 lg:h-52 flex flex-col items-center justify-center text-center">
          <i class="pi pi-chart-pie text-surface-200 text-3xl mb-2" />
          <p class="text-surface-400 text-xs">Sem despesas no período</p>
        </div>
      </div>
    </div>

    <!-- RF39: Comparativo entre parceiros -->
    <div v-if="coupleStore.couple && !coupleStore.couple.waitingForPartner" class="card p-0 overflow-hidden">
      <div class="px-4 lg:px-6 py-4 border-b border-surface-50">
        <h3 class="font-display font-semibold text-surface-900">Comparativo entre parceiros</h3>
        <p class="text-surface-400 text-xs mt-0.5">Receitas e despesas de cada um no período</p>
      </div>

      <div v-if="loadingPartner" class="p-6 flex items-center justify-center">
        <i class="pi pi-spin pi-spinner text-surface-300 text-2xl" />
      </div>

      <template v-else-if="partnerData">
        <!-- Cards de resumo por parceiro -->
        <div class="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-surface-100">
          <div v-for="partner in [partnerData.partner1, partnerData.partner2]" :key="partner.userId" class="p-4 lg:p-6">

            <!-- Header do parceiro -->
            <div class="flex items-center gap-3 mb-4">
              <img v-if="partner.avatarUrl" :src="partner.avatarUrl" :alt="partner.firstName" class="w-9 h-9 rounded-full object-cover shrink-0" />
              <div v-else class="w-9 h-9 rounded-full bg-surface-200 flex items-center justify-center shrink-0">
                <span class="text-surface-600 text-sm font-medium">{{ partner.firstName[0] }}</span>
              </div>
              <div>
                <p class="text-sm font-medium text-surface-800">{{ partner.firstName }} {{ partner.lastName }}</p>
                <p class="text-xs" :class="partner.balance >= 0 ? 'text-green-600' : 'text-red-500'">
                  Saldo: {{ formatCurrency(partner.balance) }}
                </p>
              </div>
            </div>

            <!-- Métricas -->
            <div class="space-y-2 mb-4">
              <div class="flex items-center justify-between">
                <span class="text-xs text-surface-500 flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  Receitas
                </span>
                <span class="text-sm font-mono font-medium text-green-600">{{ formatCurrency(partner.totalIncome) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-surface-500 flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                  Despesas
                </span>
                <span class="text-sm font-mono font-medium text-red-500">{{ formatCurrency(partner.totalExpense) }}</span>
              </div>
            </div>

            <!-- Top categorias de despesa -->
            <div v-if="partner.topExpenseCategories.length > 0">
              <p class="text-[10px] font-medium text-surface-400 uppercase tracking-wide mb-2">Top despesas</p>
              <ul class="space-y-1.5">
                <li v-for="cat in partner.topExpenseCategories" :key="cat.category" class="flex items-center justify-between">
                  <span class="flex items-center gap-2 text-xs text-surface-600 min-w-0">
                    <i :class="[categoryIcon(cat.category), 'text-[10px] text-surface-400 shrink-0']" />
                    <span class="truncate">{{ cat.categoryLabel }}</span>
                  </span>
                  <span class="text-xs font-mono font-medium text-surface-700 shrink-0 ml-2">
                    {{ formatCurrency(cat.amount) }}
                  </span>
                </li>
              </ul>
            </div>
            <div v-else class="text-center py-4">
              <p class="text-xs text-surface-400">Sem despesas no período</p>
            </div>
          </div>
        </div>

        <!-- Gráfico de barras comparativo -->
        <div v-if="partnerChartData" class="px-4 lg:px-6 pb-4 lg:pb-6 pt-2 border-t border-surface-50">
          <div class="flex items-center gap-4 text-xs text-surface-500 mb-3">
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Receitas</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />Despesas</span>
          </div>
          <div class="relative h-32">
            <Bar :data="partnerChartData" :options="partnerBarOptions" />
          </div>
        </div>
      </template>

      <!-- Aguardando parceiro -->
      <div v-else-if="!loadingPartner" class="py-12 text-center px-6">
        <i class="pi pi-users text-surface-200 text-3xl mb-2 block" />
        <p class="text-surface-400 text-sm">Convide seu parceiro para ver o comparativo.</p>
      </div>
    </div>

    <!-- Últimas transações -->
    <div class="card p-0 overflow-hidden">
      <div class="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-surface-50">
        <h3 class="font-display font-semibold text-surface-900">Últimas transações</h3>
        <RouterLink to="/transactions" class="text-xs text-surface-500 hover:text-surface-800 transition-colors flex items-center gap-1">
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
        <li v-for="tx in recentTransactions" :key="tx.id" class="flex items-center gap-3 lg:gap-4 px-4 lg:px-6 py-3 lg:py-4 hover:bg-surface-50/60 transition-colors">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" :class="tx.type === 'INCOME' ? 'bg-green-50' : 'bg-red-50'">
            <i :class="[categoryIcon(tx.category), 'text-sm', tx.type === 'INCOME' ? 'text-green-600' : 'text-red-400']" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-surface-800 truncate">{{ tx.description || tx.categoryLabel }}</p>
            <p class="text-xs text-surface-400 mt-0.5">{{ formatDate(tx.date) }} · {{ tx.createdBy.firstName }}</p>
          </div>
          <span class="font-mono text-sm font-medium shrink-0" :class="tx.type === 'INCOME' ? 'text-green-600' : 'text-red-500'">
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
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js'
import { reportService, transactionService } from '@/services'
import { useGoalStore } from '@/stores/goal'
import { useCoupleStore } from '@/stores/couple'
import type {
  SummaryResponse, ByCategoryResponse, MonthlyComparisonResponse,
  TransactionResponse, AlertLevel,
  PartnerComparisonResponse
} from '@/types'
import SummaryCard from '../components/SummaryCard.vue'
import { categoryIcon } from '@/utils/categoryIcon'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const goalStore   = useGoalStore()
const coupleStore = useCoupleStore()

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
  return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) }
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

function selectAggregate(mode: '3m' | '6m') { aggregateMode.value = aggregateMode.value === mode ? null : mode }

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
const partnerData         = ref<PartnerComparisonResponse | null>(null)

const loadingSummary      = ref(false)
const loadingCategory     = ref(false)
const loadingMonthly      = ref(false)
const loadingTransactions = ref(false)
const loadingPartner      = ref(false)

async function loadAll() {
  const period = dateRange.value
  showAllCategories.value = false

  loadingSummary.value      = true
  loadingCategory.value     = true
  loadingMonthly.value      = true
  loadingTransactions.value = true

  const promises: Promise<unknown>[] = [
    reportService.summary(period).then(d => summary.value = d).finally(() => loadingSummary.value = false),
    reportService.byCategory(period, 'EXPENSE').then(d => categoryData.value = d).finally(() => loadingCategory.value = false),
    reportService.monthlyComparison().then(d => monthlyData.value = d).finally(() => loadingMonthly.value = false),
    transactionService.list({ ...period, size: 8 }).then(d => recentTransactions.value = d.content ?? []).finally(() => loadingTransactions.value = false),
    goalStore.fetchProgress(),
  ]

  // Só carrega o comparativo se o casal tiver 2 membros
  if (coupleStore.couple && !coupleStore.couple.waitingForPartner) {
    loadingPartner.value = true
    promises.push(
      reportService.partnerComparison(period)
        .then(d => partnerData.value = d)
        .catch(() => partnerData.value = null)
        .finally(() => loadingPartner.value = false)
    )
  }

  await Promise.all(promises)
}

onMounted(async () => {
  if (!coupleStore.couple) await coupleStore.fetchCouple().catch(() => {})
  loadAll()
})
watch([selectedMonth, aggregateMode], loadAll)

// ── Categorias — toggle ───────────────────────────────────────────────────────

const showAllCategories = ref(false)

const visibleCategories = computed(() => {
  const cats = categoryData.value?.categories ?? []
  return showAllCategories.value ? cats : cats.slice(0, 4)
})

// ── Charts ────────────────────────────────────────────────────────────────────

const doughnutColors = ['#1d4ed8','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899','#14b8a6','#a855f7','#84cc16','#64748b']

const monthlyChartData = computed(() => {
  if (!monthlyData.value) return null
  const months = monthlyData.value.months
  return {
    labels: months.map(m => m.monthLabel),
    datasets: [
      { label: 'Receitas', data: months.map(m => m.totalIncome), backgroundColor: '#22c55e', borderRadius: 6, borderSkipped: false },
      { label: 'Despesas', data: months.map(m => m.totalExpense), backgroundColor: '#fca5a5', borderRadius: 6, borderSkipped: false }
    ]
  }
})

const doughnutChartData = computed(() => {
  if (!categoryData.value || categoryData.value.categories.length === 0) return null
  const cats = categoryData.value.categories
  return {
    labels: cats.map(c => c.categoryLabel),
    datasets: [{ data: cats.map(c => c.amount), backgroundColor: cats.map((_, i) => doughnutColors[i % doughnutColors.length]), borderWidth: 0, hoverOffset: 4 }]
  }
})

// Gráfico de barras do comparativo entre parceiros
const partnerChartData = computed(() => {
  if (!partnerData.value) return null
  const { partner1, partner2 } = partnerData.value
  return {
    labels: [partner1.firstName, partner2.firstName],
    datasets: [
      { label: 'Receitas', data: [partner1.totalIncome, partner2.totalIncome], backgroundColor: '#22c55e', borderRadius: 6, borderSkipped: false },
      { label: 'Despesas', data: [partner1.totalExpense, partner2.totalExpense], backgroundColor: '#fca5a5', borderRadius: 6, borderSkipped: false }
    ]
  }
})

const barOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { mode: 'index' as const } },
  scales: {
    x: { grid: { display: false }, border: { display: false }, ticks: { color: '#a8a49c', font: { size: 11 } } },
    y: { grid: { color: '#f1f0ee' }, border: { display: false }, ticks: { color: '#a8a49c', font: { size: 11 }, callback: (v: string | number) => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0 }) } }
  }
}

const partnerBarOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { mode: 'index' as const } },
  datasets: {
    bar: {
      barPercentage: 0.6,      // largura da barra em relação ao espaço do grupo
      categoryPercentage: 0.8  // largura do grupo em relação ao espaço da categoria
    }
  },
  scales: {
    x: { grid: { display: false }, border: { display: false }, ticks: { color: '#a8a49c', font: { size: 11 } } },
    y: { grid: { color: '#f1f0ee' }, border: { display: false }, ticks: { color: '#a8a49c', font: { size: 11 }, callback: (v: string | number) => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0 }) } }
  }
}

const doughnutOptions = {
  responsive: true, maintainAspectRatio: false, cutout: '70%',
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: { raw: unknown; label: string }) => ` ${ctx.label}: R$ ${Number(ctx.raw).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` } } }
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
