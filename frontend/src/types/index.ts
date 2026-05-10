export interface Category {
  id: number
  name: string
  color: string
  default_budget: number
}

export interface Card {
  id: number
  name: string
  card_type: 'debit' | 'credit'
}

export interface Period {
  id: number
  name: string
  start_date: string
  end_date: string
}

export interface Budget {
  id: number
  period_id: number
  category_id: number
  amount: number
}

export interface TransactionItem {
  id: number
  category_id: number
  category_name: string | null
  amount: number
}

export interface Transaction {
  id: number
  period_id: number
  card_id: number | null
  card_name: string | null
  date: string
  description: string
  total_amount: number
  status: 'paid' | 'pending' | 'not_paid'
  items: TransactionItem[]
}

export interface CategorySummary {
  category_id: number
  category_name: string
  category_color: string
  budget: number
  paid: number
  pending: number
  not_paid: number
  available: number
}

export interface PeriodSummary {
  period_id: number
  period_name: string
  total_budget: number
  total_paid: number
  total_pending: number
  total_not_paid: number
  total_available: number
  categories: CategorySummary[]
}
