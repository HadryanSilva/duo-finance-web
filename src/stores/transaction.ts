import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import type { AxiosError } from 'axios'

function apiMessage(e: unknown, fallback: string): string {
  return (e as AxiosError<{ detail?: string }>)?.response?.data?.detail ?? fallback
}
import { transactionService, categoryService } from '@/services'
import type {
  TransactionResponse,
  CategoryResponse,
  Page
} from '@/types'
import type { CreateTransactionPayload, TransactionFilters } from '@/services'

const emptyPage: Page<TransactionResponse> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: 15,
  first: true,
  last: true
}

export const useTransactionStore = defineStore('transaction', () => {
  // ── State ──────────────────────────────────────────────────────────────────

  const page       = ref<Page<TransactionResponse>>({ ...emptyPage })
  const categories = ref<CategoryResponse[]>([])
  const loading    = ref(false)
  const submitting = ref(false)
  const error      = ref<string | null>(null)

  const filters = reactive<TransactionFilters>({
    type:      undefined,
    startDate: undefined,
    endDate:   undefined,
    page:      0,
    size:      15
  })

  // ── Actions ────────────────────────────────────────────────────────────────

  async function fetchTransactions(overrides: TransactionFilters = {}) {
    loading.value = true
    error.value   = null
    try {
      page.value = await transactionService.list({ ...filters, ...overrides })
    } catch (e: unknown) {
      error.value = apiMessage(e, 'Erro ao carregar transações')
    } finally {
      loading.value = false
    }
  }

  async function fetchCategories() {
    if (categories.value.length > 0) return  // cache simples — categorias são estáticas
    try {
      categories.value = await categoryService.list()
    } catch {
      // silencioso — não bloqueia o fluxo
    }
  }

  async function create(payload: CreateTransactionPayload): Promise<TransactionResponse> {
    submitting.value = true
    error.value      = null
    try {
      const created = await transactionService.create(payload)
      // Recarrega a página atual para refletir o novo item
      await fetchTransactions()
      return created
    } catch (e: unknown) {
      error.value = apiMessage(e, 'Erro ao criar transação')
      throw e
    } finally {
      submitting.value = false
    }
  }

  async function update(id: string, payload: Partial<CreateTransactionPayload>): Promise<TransactionResponse> {
    submitting.value = true
    error.value      = null
    try {
      const updated = await transactionService.update(id, payload)
      // Atualiza o item na lista local sem precisar recarregar tudo
      const idx = page.value.content.findIndex(t => t.id === id)
      if (idx !== -1) page.value.content[idx] = updated
      return updated
    } catch (e: unknown) {
      error.value = apiMessage(e, 'Erro ao atualizar transação')
      throw e
    } finally {
      submitting.value = false
    }
  }

  async function remove(id: string): Promise<void> {
    submitting.value = true
    error.value      = null
    try {
      await transactionService.delete(id)
      // Remove da lista local imediatamente (optimistic)
      page.value.content      = page.value.content.filter(t => t.id !== id)
      const newTotal          = Math.max(0, page.value.totalElements - 1)
      page.value.totalElements = newTotal
      page.value.totalPages   = Math.max(1, Math.ceil(newTotal / page.value.size))
      page.value.last         = (page.value.number + 1) >= page.value.totalPages
    } catch (e: unknown) {
      error.value = apiMessage(e, 'Erro ao remover transação')
      throw e
    } finally {
      submitting.value = false
    }
  }

  function setFilter<K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) {
    filters[key] = value
    filters.page = 0  // volta para a primeira página ao filtrar
  }

  function setPage(n: number) {
    filters.page = n
  }

  function setDateRange(startDate: string, endDate: string) {
    filters.startDate = startDate
    filters.endDate   = endDate
    filters.page      = 0
  }

  function clearFilters() {
    filters.type      = undefined
    filters.startDate = undefined
    filters.endDate   = undefined
    filters.page      = 0
  }

  return {
    page, categories, loading, submitting, error, filters,
    fetchTransactions, fetchCategories,
    create, update, remove,
    setFilter, setPage, setDateRange, clearFilters
  }
})
