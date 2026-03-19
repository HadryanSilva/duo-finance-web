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
export type RecurrenceRule  = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
export type RecurringScope  = 'SINGLE' | 'THIS_AND_FUTURE' | 'ALL'

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
  category: TransactionCategory | null
  categoryLabel: string
  categoryIcon: string
  customCategoryId: string | null
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
  name: TransactionCategory | null
  id: string | null
  label: string
  type: TransactionType
  icon: string
  custom: boolean
}

export interface CustomCategoryResponse {
  id: string
  name: string
  type: TransactionType
  icon: string
  active: boolean
  createdAt: string
  updatedAt: string
}

// ── Pagination ────────────────────────────────────────────────────────────────

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

export interface BalanceHistoryResponse {
  months: MonthSummary[]
  totalIncomeInPeriod: number
  totalExpenseInPeriod: number
  netBalanceInPeriod: number
  bestMonthBalance: number
  worstMonthBalance: number
}

export interface PartnerSummary {
  userId: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  totalIncome: number
  totalExpense: number
  balance: number
  topExpenseCategories: CategoryBreakdown[]
}

export interface PartnerComparisonResponse {
  startDate: string
  endDate: string
  partner1: PartnerSummary
  partner2: PartnerSummary
}

// ── Goals ─────────────────────────────────────────────────────────────────────

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

// ── Budget ────────────────────────────────────────────────────────────────────

export type BudgetStatus = 'OK' | 'WARNING' | 'EXCEEDED'

export interface CategoryBudgetItem {
  category: TransactionCategory
  categoryLabel: string
  percentage: number       // % da renda alocado
  allocated: number        // valor em R$ = income * percentage / 100
  spent: number            // gasto real no mês
  remaining: number        // allocated - spent
  usagePercentage: number  // spent / allocated * 100
  status: BudgetStatus
}

export interface BudgetOverviewResponse {
  monthlyIncome: number | null
  totalAllocated: number
  totalAllocatedPct: number
  totalSpent: number
  totalRemaining: number
  year: number
  month: number
  monthLabel: string
  categories: CategoryBudgetItem[]
}

export interface BudgetAllocationResponse {
  category: TransactionCategory
  categoryLabel: string
  percentage: number
  allocated: number
}

export interface MonthComparison {
  year: number
  month: number
  monthLabel: string
  totalAllocated: number
  totalSpent: number
  balance: number
  adherencePercentage: number
  withinBudget: boolean
}

export interface BudgetComparisonResponse {
  monthlyIncome: number | null
  months: MonthComparison[]
}

// ── Notifications ─────────────────────────────────────────────────────────────

export type NotificationType =
  | 'GOAL_WARNING'
  | 'GOAL_EXCEEDED'
  | 'BUDGET_EXCEEDED'
  | 'PARTNER_JOINED'

export interface NotificationResponse {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: string
}

export interface NotificationListResponse {
  notifications: NotificationResponse[]
  unreadCount: number
}

export interface NotificationSettingsResponse {
  enabled: boolean
}
