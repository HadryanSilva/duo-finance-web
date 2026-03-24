import api, { authApi } from './api'
import type {
  TokenResponse, UserInfo,
  CoupleResponse, InviteResponse, JoinCoupleResponse,
  TransactionResponse, CategoryResponse, CustomCategoryResponse, Page,
  SummaryResponse, ByCategoryResponse, MonthlyComparisonResponse,
  BalanceHistoryResponse, PartnerComparisonResponse,
  TransactionType, GoalResponse, GoalProgressResponse, RecurringScope,
  BudgetOverviewResponse, BudgetComparisonResponse, BudgetAllocationResponse,
  TransactionCategory, NotificationListResponse, NotificationSettingsResponse
} from '@/types'

import type {

} from '@/types'

// ── User ──────────────────────────────────────────────────────────────────────

export const userService = {
  updateProfile: (firstName: string, lastName: string) =>
    api.patch<UserInfo>('/users/me', { firstName, lastName }).then(r => r.data),
  uploadAvatar: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<{ avatarUrl: string }>('/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data)
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authService = {
  me: () => api.get<UserInfo>('/users/me').then(r => r.data),
  refresh: (refreshToken: string) =>
    authApi.post<TokenResponse>('/refresh', { refreshToken }).then(r => r.data),
  logout: () => authApi.post('/logout'),
  register: (firstName: string, lastName: string, email: string, password: string) =>
    api.post<TokenResponse>('/auth/register', { firstName, lastName, email, password }).then(r => r.data),
  login: (email: string, password: string) =>
    api.post<TokenResponse>('/auth/login', { email, password }).then(r => r.data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
}

// ── Couple ────────────────────────────────────────────────────────────────────

export const coupleService = {
  create: (name: string) =>
    api.post<CoupleResponse>('/couples', { name }).then(r => r.data),
  findMine: () =>
    api.get<CoupleResponse>('/couples/me').then(r => r.data),
  update: (name: string) =>
    api.put<CoupleResponse>('/couples/me', { name }).then(r => r.data),
  invite: (partnerEmail: string) =>
    api.post<InviteResponse>('/couples/invite', { partnerEmail }).then(r => r.data),
  join: (token: string) =>
    api.post<JoinCoupleResponse>(`/couples/join/${token}`).then(r => r.data),
  removeMember: (userId: string) =>
    api.delete(`/couples/members/${userId}`),
}

// ── Transactions ──────────────────────────────────────────────────────────────

export interface TransactionFilters {
  category?: string
  customCategoryId?: string
  type?: TransactionType
  userId?: string
  description?: string
  startDate?: string
  endDate?: string
  page?: number
  size?: number
  sort?: string
}

export interface CreateTransactionPayload {
  category?: string             // null se customCategoryId preenchido
  customCategoryId?: string     // null se category preenchido
  amount: number
  description?: string
  date: string
  recurring: boolean
  recurrenceRule?: string
  recurrenceEndDate?: string
}

export interface UpdateRecurringPayload {
  category?: TransactionCategory
  customCategoryId?: string
  amount: number
  description?: string
  date: string
  scope: RecurringScope
}

export interface DeleteRecurringPayload {
  scope: RecurringScope
}

export const transactionService = {
  list: (filters: TransactionFilters = {}) =>
    api.get<Page<TransactionResponse>>('/transactions', { params: filters }).then(r => r.data),
  findById: (id: string) =>
    api.get<TransactionResponse>(`/transactions/${id}`).then(r => r.data),
  create: (payload: CreateTransactionPayload) =>
    api.post<TransactionResponse>('/transactions', payload).then(r => r.data),
  update: (id: string, payload: Partial<CreateTransactionPayload>) =>
    api.put<TransactionResponse>(`/transactions/${id}`, payload).then(r => r.data),
  updateRecurring: (id: string, payload: UpdateRecurringPayload) =>
    api.patch<TransactionResponse>(`/transactions/${id}/recurring`, payload).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/transactions/${id}`),
  deleteRecurring: (id: string, payload: DeleteRecurringPayload) =>
    api.delete(`/transactions/${id}/recurring`, { data: payload }),
}

// ── Categories (unificado: sistema + customizadas) ────────────────────────────

export const categoryService = {
  list: (type?: TransactionType, includeCustom = true) =>
    api.get<CategoryResponse[]>('/categories', {
      params: { ...(type ? { type } : {}), includeCustom }
    }).then(r => r.data)
}

// ── Custom Categories — RF30/RF31 ─────────────────────────────────────────────

export interface CreateCustomCategoryPayload {
  name: string
  type: TransactionType
  icon?: string
}

export interface UpdateCustomCategoryPayload {
  name: string
  icon?: string
}

export const customCategoryService = {
  listAll: () =>
    api.get<CustomCategoryResponse[]>('/custom-categories').then(r => r.data),
  listActive: () =>
    api.get<CustomCategoryResponse[]>('/custom-categories/active').then(r => r.data),
  create: (payload: CreateCustomCategoryPayload) =>
    api.post<CustomCategoryResponse>('/custom-categories', payload).then(r => r.data),
  update: (id: string, payload: UpdateCustomCategoryPayload) =>
    api.put<CustomCategoryResponse>(`/custom-categories/${id}`, payload).then(r => r.data),
  toggle: (id: string) =>
    api.patch<CustomCategoryResponse>(`/custom-categories/${id}/toggle`).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/custom-categories/${id}`),
}

// ── Reports ───────────────────────────────────────────────────────────────────

export interface ReportPeriod {
  startDate?: string
  endDate?: string
}

export const reportService = {
  summary: (period: ReportPeriod = {}) =>
    api.get<SummaryResponse>('/reports/summary', { params: period }).then(r => r.data),
  byCategory: (period: ReportPeriod = {}, type: TransactionType = 'EXPENSE') =>
    api.get<ByCategoryResponse>('/reports/by-category', { params: { ...period, type } }).then(r => r.data),
  monthlyComparison: () =>
    api.get<MonthlyComparisonResponse>('/reports/monthly-comparison').then(r => r.data),
  balanceHistory: () =>
    api.get<BalanceHistoryResponse>('/reports/balance-history').then(r => r.data),
  exportCsv: (period: ReportPeriod = {}) =>
    api.get<Blob>('/reports/export/csv', { params: period, responseType: 'blob' }).then(r => r.data),
  partnerComparison: (period: ReportPeriod = {}) =>
    api.get<PartnerComparisonResponse>('/reports/partner-comparison', { params: period }).then(r => r.data),
}

// ── Goals ─────────────────────────────────────────────────────────────────────

export interface CreateGoalPayload {
  category: string
  monthlyLimit: number
}

export interface UpdateGoalPayload {
  monthlyLimit: number
}

export const goalService = {
  list: () => api.get<GoalResponse[]>('/goals').then(r => r.data ?? []),
  create: (payload: CreateGoalPayload) =>
    api.post<GoalResponse>('/goals', payload).then(r => r.data),
  update: (id: string, payload: UpdateGoalPayload) =>
    api.put<GoalResponse>(`/goals/${id}`, payload).then(r => r.data),
  toggle: (id: string) =>
    api.patch<GoalResponse>(`/goals/${id}/toggle`).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/goals/${id}`),
  progress: () =>
    api.get<GoalProgressResponse[]>('/goals/progress').then(r => r.data ?? []),
}

export interface CategoryAllocationPayload {
  category: TransactionCategory
  percentage: number
}

export const budgetService = {
  /** Visão consolidada do orçamento do mês */
  overview: (year?: number, month?: number) =>
    api.get<BudgetOverviewResponse>('/budget/overview', {
      params: { ...(year ? { year } : {}), ...(month ? { month } : {}) }
    }).then(r => r.data),

  /** Lista alocações atuais com valores calculados */
  listAllocations: () =>
    api.get<BudgetAllocationResponse[]>('/budget/allocations').then(r => r.data),

  /** Define ou atualiza a renda mensal do casal */
  setIncome: (monthlyIncome: number) =>
    api.put('/budget/income', { monthlyIncome }),

  /** Remove a renda mensal */
  removeIncome: () =>
    api.delete('/budget/income'),

  /** Salva alocações do orçamento (cria ou atualiza por categoria) */
  saveBudget: (allocations: CategoryAllocationPayload[]) =>
    api.put<BudgetAllocationResponse[]>('/budget', { allocations }).then(r => r.data),

  /** Remove uma categoria do orçamento */
  deleteCategory: (category: TransactionCategory) =>
    api.delete(`/budget/category/${category}`),

  /** Limpa todo o orçamento */
  clearAll: () =>
    api.delete('/budget'),

  /** Comparação orçado vs realizado por N meses */
  comparison: (months = 6) =>
    api.get<BudgetComparisonResponse>('/budget/comparison', { params: { months } }).then(r => r.data),
}

export const notificationService = {
  list: () =>
    api.get<NotificationListResponse>('/notifications').then(r => r.data),

  markAsRead: (id: string) =>
    api.patch(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.patch('/notifications/read-all'),

  getSettings: () =>
    api.get<NotificationSettingsResponse>('/notifications/settings').then(r => r.data),

  toggleSettings: () =>
    api.patch<NotificationSettingsResponse>('/notifications/settings/toggle').then(r => r.data),
}
