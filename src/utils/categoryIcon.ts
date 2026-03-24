import type { TransactionCategory } from '@/types'

export const categoryIconMap: Partial<Record<TransactionCategory, string>> = {
  // ── Despesas ────────────────────────────────────────────────────────────────
  FOOD:          'pi pi-shopping-bag',
  HOUSING:       'pi pi-home',
  TRANSPORT:     'pi pi-car',
  HEALTH:        'pi pi-heart',
  EDUCATION:     'pi pi-book',
  LEISURE:       'pi pi-star',
  CLOTHING:      'pi pi-tag',
  PETS:          'pi pi-heart-fill',
  SUBSCRIPTIONS: 'pi pi-sync',
  SERVICES:      'pi pi-wrench',
  SUPERMARKET:   'pi pi-shopping-cart',
  OTHER_EXPENSE: 'pi pi-minus-circle',
  // ── Receitas ────────────────────────────────────────────────────────────────
  SALARY:        'pi pi-briefcase',
  FREELANCE:     'pi pi-code',
  INVESTMENTS:   'pi pi-chart-bar',
  RENTAL:        'pi pi-building',
  GIFT:          'pi pi-gift',
  OTHER_INCOME:  'pi pi-plus-circle',
}

export function categoryIcon(cat: TransactionCategory | null): string {
  return (cat && categoryIconMap[cat]) ?? 'pi pi-circle'
}
