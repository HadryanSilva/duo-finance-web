<template>
  <div class="p-4 lg:p-8 space-y-6">

    <!-- Cards de resumo do período -->
    <div v-if="loading" class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div v-for="i in 4" :key="i" class="card p-4 space-y-2">
        <div class="h-3 bg-surface-100 rounded animate-pulse w-2/3" />
        <div class="h-6 bg-surface-100 rounded animate-pulse w-full" />
      </div>
    </div>

    <div v-else-if="data" class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="card p-4">
        <p class="text-xs text-surface-400 mb-1">Receitas no período</p>
        <p class="text-lg font-mono font-semibold text-green-600">{{ formatCurrency(data.totalIncomeInPeriod) }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-surface-400 mb-1">Despesas no período</p>
        <p class="text-lg font-mono font-semibold text-red-500">{{ formatCurrency(data.totalExpenseInPeriod) }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-surface-400 mb-1">Melhor mês</p>
        <p class="text-lg font-mono font-semibold" :class="data.bestMonthBalance >= 0 ? 'text-green-600' : 'text-red-500'">
          {{ formatCurrency(data.bestMonthBalance) }}
        </p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-surface-400 mb-1">Pior mês</p>
        <p class="text-lg font-mono font-semibold" :class="data.worstMonthBalance >= 0 ? 'text-green-600' : 'text-red-500'">
          {{ formatCurrency(data.worstMonthBalance) }}
        </p>
      </div>
    </div>

    <!-- Gráfico de linha — saldo mês a mês -->
    <div class="card">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="font-display font-semibold text-surface-900">Histórico de saldo</h3>
          <p class="text-surface-400 text-xs mt-0.5">Saldo líquido mês a mês nos últimos 12 meses</p>
        </div>
        <div class="flex items-center gap-3 text-xs text-surface-500">
          <span class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-primary-500 inline-block" />
            Saldo
          </span>
        </div>
      </div>

      <div class="relative h-56 lg:h-64 w-full">
        <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
          <i class="pi pi-spin pi-spinner text-surface-300 text-2xl" />
        </div>
        <Line v-else-if="lineChartData" :data="lineChartData" :options="lineOptions" />
      </div>
    </div>

    <!-- Gráfico de barras empilhadas — receitas vs despesas -->
    <div class="card">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="font-display font-semibold text-surface-900">Receitas vs Despesas</h3>
          <p class="text-surface-400 text-xs mt-0.5">Comparativo mês a mês</p>
        </div>
        <div class="flex items-center gap-3 text-xs text-surface-500">
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Receitas</span>
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />Despesas</span>
        </div>
      </div>

      <div class="relative h-56 lg:h-64 w-full">
        <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
          <i class="pi pi-spin pi-spinner text-surface-300 text-2xl" />
        </div>
        <Bar v-else-if="barChartData" :data="barChartData" :options="barOptions" />
      </div>
    </div>

    <!-- Tabela mensal -->
    <div class="card p-0 overflow-hidden">
      <div class="px-4 lg:px-6 py-4 border-b border-surface-50">
        <h3 class="font-display font-semibold text-surface-900">Detalhamento mensal</h3>
      </div>

      <div v-if="loading" class="divide-y divide-surface-50">
        <div v-for="i in 6" :key="i" class="flex items-center gap-4 px-4 lg:px-6 py-3.5">
          <div class="h-3.5 bg-surface-100 rounded animate-pulse w-16" />
          <div class="flex-1 h-3 bg-surface-50 rounded animate-pulse" />
          <div class="h-3.5 bg-surface-100 rounded animate-pulse w-24" />
        </div>
      </div>

      <table v-else-if="data" class="w-full text-sm">
        <thead>
          <tr class="border-b border-surface-100">
            <th class="text-left px-4 lg:px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wide">Mês</th>
            <th class="text-right px-4 lg:px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wide hidden sm:table-cell">Receitas</th>
            <th class="text-right px-4 lg:px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wide hidden sm:table-cell">Despesas</th>
            <th class="text-right px-4 lg:px-6 py-3 text-xs font-medium text-surface-400 uppercase tracking-wide">Saldo</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-surface-50">
          <tr
            v-for="month in [...data.months].reverse()"
            :key="`${month.year}-${month.month}`"
            class="hover:bg-surface-50/60 transition-colors"
            :class="{ 'bg-primary-50/30': isCurrentMonth(month) }"
          >
            <td class="px-4 lg:px-6 py-3.5">
              <span class="font-medium text-surface-800 capitalize">{{ month.monthLabel }}</span>
              <span v-if="isCurrentMonth(month)" class="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-primary-100 text-primary-600">atual</span>
            </td>
            <td class="px-4 lg:px-6 py-3.5 text-right font-mono text-green-600 hidden sm:table-cell">
              {{ formatCurrency(month.totalIncome) }}
            </td>
            <td class="px-4 lg:px-6 py-3.5 text-right font-mono text-red-500 hidden sm:table-cell">
              {{ formatCurrency(month.totalExpense) }}
            </td>
            <td class="px-4 lg:px-6 py-3.5 text-right font-mono font-semibold" :class="month.balance >= 0 ? 'text-green-600' : 'text-red-500'">
              {{ month.balance >= 0 ? '+' : '' }}{{ formatCurrency(month.balance) }}
            </td>
          </tr>
        </tbody>
        <tfoot class="border-t-2 border-surface-200 bg-surface-50/50">
          <tr>
            <td class="px-4 lg:px-6 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wide">Total 12 meses</td>
            <td class="px-4 lg:px-6 py-3.5 text-right font-mono font-semibold text-green-600 hidden sm:table-cell">
              {{ formatCurrency(data.totalIncomeInPeriod) }}
            </td>
            <td class="px-4 lg:px-6 py-3.5 text-right font-mono font-semibold text-red-500 hidden sm:table-cell">
              {{ formatCurrency(data.totalExpenseInPeriod) }}
            </td>
            <td class="px-4 lg:px-6 py-3.5 text-right font-mono font-semibold text-lg" :class="data.netBalanceInPeriod >= 0 ? 'text-green-600' : 'text-red-500'">
              {{ data.netBalanceInPeriod >= 0 ? '+' : '' }}{{ formatCurrency(data.netBalanceInPeriod) }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Line, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Tooltip, Legend, Filler
} from 'chart.js'
import { reportService } from '@/services'
import type { BalanceHistoryResponse, MonthSummary } from '@/types'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler)

// ── Data ──────────────────────────────────────────────────────────────────────

const data    = ref<BalanceHistoryResponse | null>(null)
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    data.value = await reportService.balanceHistory()
  } finally {
    loading.value = false
  }
})

// ── Charts ────────────────────────────────────────────────────────────────────

const lineChartData = computed(() => {
  if (!data.value) return null
  const months = data.value.months
  return {
    labels: months.map(m => m.monthLabel),
    datasets: [{
      label: 'Saldo',
      data: months.map(m => m.balance),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.08)',
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: months.map(m => m.balance >= 0 ? '#6366f1' : '#ef4444'),
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      fill: true,
      tension: 0.35
    }]
  }
})

const barChartData = computed(() => {
  if (!data.value) return null
  const months = data.value.months
  return {
    labels: months.map(m => m.monthLabel),
    datasets: [
      { label: 'Receitas', data: months.map(m => m.totalIncome), backgroundColor: '#22c55e', borderRadius: 4, borderSkipped: false },
      { label: 'Despesas', data: months.map(m => m.totalExpense), backgroundColor: '#fca5a5', borderRadius: 4, borderSkipped: false }
    ]
  }
})

const commonScales = {
  x: {
    grid: { display: false },
    border: { display: false },
    ticks: { color: '#a8a49c', font: { size: 11 } }
  },
  y: {
    grid: { color: '#f1f0ee' },
    border: { display: false },
    ticks: {
      color: '#a8a49c',
      font: { size: 11 },
      callback: (v: string | number) => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0 })
    }
  }
}

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: { raw: unknown }) => {
          const v = Number(ctx.raw)
          return ` Saldo: ${v >= 0 ? '+' : ''}${v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
        }
      }
    }
  },
  scales: {
    ...commonScales,
    y: {
      ...commonScales.y,
      // Linha de zero em destaque
      grid: {
        color: (ctx: { tick: { value: number } }) => ctx.tick.value === 0 ? '#94a3b8' : '#f1f0ee',
        lineWidth: (ctx: { tick: { value: number } }) => ctx.tick.value === 0 ? 1.5 : 1
      }
    }
  }
}

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { mode: 'index' as const } },
  scales: commonScales
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function isCurrentMonth(month: MonthSummary): boolean {
  const now = new Date()
  return month.year === now.getFullYear() && month.month === (now.getMonth() + 1)
}
</script>
