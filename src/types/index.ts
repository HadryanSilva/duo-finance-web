// ── Auth ──────────────────────────────────────────────────────────────────────

export interface UserInfo {
  id: string
  firstName: string
  lastName: string
  email: string
  avatarUrl: string | null
  coupleId: string | null
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  user: UserInfo
}

// ── Couple ────────────────────────────────────────────────────────────────────

export interface PartnerResponse {
  id: string
  firstName: string
  lastName: string
  email: string
  avatarUrl: string | null
}

export interface CoupleResponse {
  id: string
  name: string
  members: PartnerResponse[]
  waitingForPartner: boolean
  createdAt: string
}

export interface InviteResponse {
  message: string
  partnerEmail: string
  expiresAt: string
}

export interface JoinCoupleResponse {
  message: string
  couple: CoupleResponse
}

// ── Transactions ──────────────────────────────────────────────────────────────

export type TransactionType = 'INCOME' | 'EXPENSE'

export type RecurrenceRule = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export type RecurringScope = 'SINGLE' | 'THIS_AND_FUTURE' | 'ALL'

export type TransactionCategory =
  | 'FOOD' | 'HOUSING' | 'TRANSPORT' | 'HEALTH' | 'EDUCATION'
  | 'LEISURE' | 'CLOTHING' | 'PETS' | 'SUBSCRIPTIONS' | 'SERVICES' | 'SUPERMARKET'
  | 'OTHER_EXPENSE'
  | 'SALARY' | 'FREELANCE' | 'INVESTMENTS' | 'RENTAL' | 'GIFT' | 'OTHER_INCOME'

export interface AuthorResponse {
  id: string
  firstName: string
  lastName: string
  avatarUrl: string | null
}

export interface TransactionResponse {
  id: string
  category: TransactionCategory
  categoryLabel: string
  type: TransactionType
  amount: number
  description: string | null
  date: string
  recurring: boolean
  recurrenceRule: RecurrenceRule | null
  recurrenceEndDate: string | null
  parentTransactionId: string | null
  createdBy: AuthorResponse
  createdAt: string
}

export interface CategoryResponse {
  name: TransactionCategory
  label: string
  type: TransactionType
}

// ── Paginação ─────────────────────────────────────────────────────────────────
//
// Com @EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO) o Spring
// serializa Page com metadados aninhados em um objeto "page":
//
// {
//   "content": [...],
//   "page": {
//     "size": 15,
//     "totalElements": 42,
//     "totalPages": 3,
//     "number": 0
//   }
// }

export interface PageMetadata {
  size: number
  totalElements: number
  totalPages: number
  number: number
}

export interface Page<T> {
  content: T[]
  page: PageMetadata
}

// ── Reports ───────────────────────────────────────────────────────────────────

export interface SummaryResponse {
  startDate: string
  endDate: string
  totalIncome: number
  totalExpense: number
  balance: number
  transactionCount: number
}

export interface CategoryBreakdown {
  category: TransactionCategory
  categoryLabel: string
  amount: number
  percentage: number
}

export interface ByCategoryResponse {
  startDate: string
  endDate: string
  type: TransactionType
  total: number
  categories: CategoryBreakdown[]
}

export interface MonthSummary {
  year: number
  month: number
  monthLabel: string
  totalIncome: number
  totalExpense: number
  balance: number
}

export interface MonthlyComparisonResponse {
  months: MonthSummary[]
}

// ── Goals — RF35/RF36/RF37 ────────────────────────────────────────────────────

export type AlertLevel = 'NONE' | 'WARNING' | 'EXCEEDED'

export interface GoalResponse {
  id: string
  category: TransactionCategory
  categoryLabel: string
  monthlyLimit: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface GoalProgressResponse {
  id: string
  category: TransactionCategory
  categoryLabel: string
  monthlyLimit: number
  spent: number
  remaining: number
  percentage: number
  alertLevel: AlertLevel
  active: boolean
}
