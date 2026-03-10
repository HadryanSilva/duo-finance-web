import api from './api'
import type {
  TokenResponse, UserInfo,
  CoupleResponse, InviteResponse, JoinCoupleResponse,
  TransactionResponse, CategoryResponse, Page,
  SummaryResponse, ByCategoryResponse, MonthlyComparisonResponse,
  TransactionType
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
  me: () =>
    api.get<UserInfo>('/users/me').then(r => r.data),
  refresh: (refreshToken: string) =>
    api.post<TokenResponse>('/auth/refresh', { refreshToken }).then(r => r.data),
  logout: () =>
    api.post('/auth/logout'),
  register: (firstName: string, lastName: string, email: string, password: string) =>
    api.post<TokenResponse>('/auth/register', { firstName, lastName, email, password }).then(r => r.data),
  login: (email: string, password: string) =>
    api.post<TokenResponse>('/auth/login', { email, password }).then(r => r.data),
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
    api.post<JoinCoupleResponse>(`/couples/join/${token}`).then(r => r.data)
}

// ── Transactions ──────────────────────────────────────────────────────────────

export interface TransactionFilters {
  category?: string
  type?: TransactionType
  userId?: string
  description?: string       // RF27 — busca textual por descrição
  startDate?: string
  endDate?: string
  page?: number
  size?: number
}

export interface CreateTransactionPayload {
  category: string
  amount: number
  description?: string
  date: string
  recurring: boolean
  recurrenceRule?: string
  recurrenceEndDate?: string
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
  delete: (id: string) =>
    api.delete(`/transactions/${id}`)
}

// ── Categories ────────────────────────────────────────────────────────────────

export const categoryService = {
  list: (type?: TransactionType) =>
    api.get<CategoryResponse[]>('/categories', { params: type ? { type } : {} }).then(r => r.data)
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
  exportCsv: (period: ReportPeriod = {}) =>
    api.get<Blob>('/reports/export/csv', { params: period, responseType: 'blob' }).then(r => r.data)
}
