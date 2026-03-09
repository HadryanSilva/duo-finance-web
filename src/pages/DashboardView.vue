<template>
  <div class="p-8 space-y-8">

    <!-- Header row: período -->
    <div class="flex items-center justify-between">
      <div>
        <p class="text-surface-400 text-sm">Período</p>
        <p class="font-display text-surface-900 font-semibold text-lg">{{ periodLabel }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-for="opt in periodOptions"
          :key="opt.value"
          @click="selectPeriod(opt.value)"
          class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
          :class="activePeriod === opt.value
            ? 'bg-surface-900 text-white'
            : 'bg-white border border-surface-200 text-surface-600 hover:border-surface-300'"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Summary cards -->
    <div class="grid grid-cols-3 gap-4">
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

    <!-- Charts row -->
    <div class="grid grid-cols-5 gap-4">

      <!-- Comparativo mensal (3/5) -->
      <div class="col-span-3 card">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="font-display font-semibold text-surface-900">Comparativo mensal</h3>
            <p class="text-surface-400 text-xs mt-0.5">Últimos 6 meses</p>
          </div>
          <div class="flex items-center gap-4 text-xs text-surface-500">
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

        <div v-if="loadingMonthly" class="h-52 flex items-center justify-center">
          <i class="pi pi-spin pi-spinner text-surface-300 text-2xl" />
        </div>
        <Bar v-else-if="monthlyChartData" :data="monthlyChartData" :options="barOptions" class="h-52" />
      </div>

      <!-- Por categoria (2/5) -->
      <div class="col-span-2 card">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="font-display font-semibold text-surface-900">Por categoria</h3>
            <p class="text-surface-400 text-xs mt-0.5">Despesas do período</p>
          </div>
        </div>

        <div v-if="loadingCategory" class="h-52 flex items-center justify-center">
          <i class="pi pi-spin pi-spinner text-surface-300 text-2xl" />
        </div>

        <template v-else-if="categoryData && categoryData.categories.length > 0">
          <Doughnut :data="doughnutChartData!" :options="doughnutOptions" class="h-32 mx-auto" />
          <!-- Legenda customizada -->
          <ul class="mt-4 space-y-2">
            <li
              v-for="(cat, i) in categoryData.categories.slice(0, 4)"
              :key="cat.category"
              class="flex items-center justify-between text-xs"
            >
              <span class="flex items-center gap-2">
                <span
                  class="w-2 h-2 rounded-full shrink-0"
                  :style="{ background: doughnutColors[i % doughnutColors.length] }"
                />
                <span class="text-surface-600 truncate max-w-[110px]">{{ cat.categoryLabel }}</span>
              </span>
              <span class="font-mono text-surface-800 font-medium">{{ cat.percentage }}%</span>
            </li>
          </ul>
        </template>

        <div v-else class="h-52 flex flex-col items-center justify-center text-center">
          <i class="pi pi-chart-pie text-surface-200 text-3xl mb-2" />
          <p class="text-surface-400 text-sm">Sem despesas no período</p>
        </div>
      </div>
    </div>

    <!-- Últimas transações -->
    <div class="card">
      <div class="flex items-center justify-between mb-5">
        <h3 class="font-display font-semibold text-surface-900">Últimas transações</h3>
        <RouterLink
          to="/transactions"
          class="text-xs text-surface-500 hover:text-surface-900 font-medium flex items-center gap-1 transition-colors"
        >
          Ver todas <i class="pi pi-arrow-right text-xs" />
        </RouterLink>
      </div>

      <div v-if="loadingTransactions" class="space-y-3">
        <div v-for="i in 5" :key="i" class="h-12 bg-surface-50 rounded-xl animate-pulse" />
      </div>

      <div v-else-if="recentTransactions.length === 0" class="py-10 text-center">
        <i class="pi pi-inbox text-surface-200 text-3xl mb-2 block" />
        <p class="text-surface-400 text-sm">Nenhuma transação ainda.</p>
        <RouterLink to="/transactions" class="text-sm text-primary-600 font-medium mt-1 inline-block hover:underline">
          Adicionar primeira transação
        </RouterLink>
      </div>

      <ul v-else class="divide-y divide-surface-50">
        <li
          v-for="tx in recentTransactions"
          :key="tx.id"
          class="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
        >
          <!-- Ícone categoria -->
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
import type { SummaryResponse, ByCategoryResponse, MonthlyComparisonResponse, TransactionResponse, TransactionCategory } from '@/types'
import SummaryCard from './SummaryCard.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

// ── Period ────────────────────────────────────────────────────────────────────

const periodOptions: { label: string; value: 'month' | '3m' | '6m' }[] = [
  { label: 'Este mês', value: 'month' },
  { label: '3 meses',  value: '3m' },
  { label: '6 meses',  value: '6m' }
]

const activePeriod = ref<'month' | '3m' | '6m'>('month')

const dateRange = computed(() => {
  const today = new Date()
  const end = today.toISOString().slice(0, 10)
  let start: string

  if (activePeriod.value === 'month') {
    start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
  } else if (activePeriod.value === '3m') {
    const d = new Date(today)
    d.setMonth(d.getMonth() - 2)
    start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
  } else {
    const d = new Date(today)
    d.setMonth(d.getMonth() - 5)
    start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
  }

  return { startDate: start, endDate: end }
})

const periodLabel = computed(() => {
  const { startDate, endDate } = dateRange.value
  const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
  const start = fmt(startDate)
  const end   = fmt(endDate)
  return start === end ? start : `${start} — ${end}`
})

function selectPeriod(v: 'month' | '3m' | '6m') {
  activePeriod.value = v
}

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

  loadingSummary.value   = true
  loadingCategory.value  = true
  loadingMonthly.value   = true
  loadingTransactions.value = true

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
      .finally(() => loadingTransactions.value = false)
  ])
}

onMounted(loadAll)
watch(activePeriod, loadAll)

// ── Charts ────────────────────────────────────────────────────────────────────

const doughnutColors = ['#1d4ed8', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

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

const doughnutChartData = computed(() => {
  if (!categoryData.value || categoryData.value.categories.length === 0) return null
  const cats = categoryData.value.categories.slice(0, 4)
  return {
    labels: cats.map(c => c.categoryLabel),
    datasets: [{
      data: cats.map(c => c.amount),
      backgroundColor: doughnutColors,
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
    y: { grid: { color: '#f1f0ee' }, border: { display: false }, ticks: { color: '#a8a49c', font: { size: 11 }, callback: (v: any) => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0 }) } }
  }
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => ` R$ ${Number(ctx.raw).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` } } }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
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