import { defineStore } from 'pinia'
import { ref } from 'vue'
import { reportService } from '@/services'
import type {
  SummaryResponse,
  ByCategoryResponse,
  MonthlyComparisonResponse,
  TransactionType
} from '@/types'
import type { ReportPeriod } from '@/services'

export const useReportStore = defineStore('report', () => {
  // ── State ──────────────────────────────────────────────────────────────────

  const summary    = ref<SummaryResponse | null>(null)
  const byCategory = ref<ByCategoryResponse | null>(null)
  const monthly    = ref<MonthlyComparisonResponse | null>(null)

  const loadingSummary    = ref(false)
  const loadingByCategory = ref(false)
  const loadingMonthly    = ref(false)
  const exporting         = ref(false)

  const error = ref<string | null>(null)

  // ── Actions ────────────────────────────────────────────────────────────────

  async function fetchSummary(period: ReportPeriod = {}) {
    loadingSummary.value = true
    error.value = null
    try {
      summary.value = await reportService.summary(period)
    } catch (e: any) {
      error.value = e?.response?.data?.detail ?? 'Erro ao carregar resumo'
    } finally {
      loadingSummary.value = false
    }
  }

  async function fetchByCategory(period: ReportPeriod = {}, type: TransactionType = 'EXPENSE') {
    loadingByCategory.value = true
    error.value = null
    try {
      byCategory.value = await reportService.byCategory(period, type)
    } catch (e: any) {
      error.value = e?.response?.data?.detail ?? 'Erro ao carregar categorias'
    } finally {
      loadingByCategory.value = false
    }
  }

  async function fetchMonthly() {
    loadingMonthly.value = true
    error.value = null
    try {
      monthly.value = await reportService.monthlyComparison()
    } catch (e: any) {
      error.value = e?.response?.data?.detail ?? 'Erro ao carregar comparativo mensal'
    } finally {
      loadingMonthly.value = false
    }
  }

  /** Carrega summary + byCategory em paralelo para o dashboard */
  async function fetchDashboard(period: ReportPeriod = {}, categoryType: TransactionType = 'EXPENSE') {
    await Promise.all([
      fetchSummary(period),
      fetchByCategory(period, categoryType),
      fetchMonthly()
    ])
  }

  /** Dispara o download do CSV no browser */
  async function exportCsv(period: ReportPeriod = {}) {
    exporting.value = true
    try {
      const blob = await reportService.exportCsv(period)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      const start = period.startDate ?? 'inicio'
      const end   = period.endDate   ?? 'hoje'
      a.href     = url
      a.download = `duofinance_${start}_${end}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      error.value = e?.response?.data?.detail ?? 'Erro ao exportar CSV'
      throw e
    } finally {
      exporting.value = false
    }
  }

  function clearAll() {
    summary.value    = null
    byCategory.value = null
    monthly.value    = null
    error.value      = null
  }

  return {
    summary, byCategory, monthly,
    loadingSummary, loadingByCategory, loadingMonthly, exporting,
    error,
    fetchSummary, fetchByCategory, fetchMonthly, fetchDashboard, exportCsv,
    clearAll
  }
})