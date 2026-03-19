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

// ── Custom Categories ─────────────────────────────────────────────────────────

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

export type DistributionRule = 'RULE_50_30_20' | 'PROPORTIONAL_HISTORICAL' | 'EQUAL'

export interface CategoryBudgetItem {
  category: TransactionCategory
  categoryLabel: string
  budgeted: number
  spent: number
  remaining: number
  percentage: number
  percentageOfTotal: number
  alertLevel: AlertLevel
}

export interface BudgetOverviewResponse {
  year: number
  month: number
  monthLabel: string
  globalLimit: number | null
  totalBudgeted: number
  totalSpent: number
  totalRemaining: number
  globalPercentage: number
  globalAlert: AlertLevel
  categories: CategoryBudgetItem[]
}

export interface MonthComparison {
  year: number
  month: number
  monthLabel: string
  totalBudgeted: number
  totalSpent: number
  balance: number
  adherencePercentage: number
  withinBudget: boolean
}

export interface BudgetComparisonResponse {
  months: MonthComparison[]
}

export interface CategoryAllocation {
  category: TransactionCategory
  categoryLabel: string
  allocated: number
  percentage: number
}

export interface DistributeResponse {
  rule: DistributionRule
  globalLimit: number
  allocations: CategoryAllocation[]
}

export interface CustomDistributeResponse {
  globalLimit: number
  allocations: CategoryAllocation[]
}
