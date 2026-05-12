import type { User, Category, Card, Period, Budget, Transaction, PeriodSummary } from '../types/index.ts'

const BASE = '/api'
const TOKEN_KEY = 'ft_token'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY)
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string> ?? {}) },
  })

  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('ft_user')
    window.location.href = '/login'
    return undefined as T
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? res.statusText)
  }
  if (res.status === 204) return undefined as T
  const data = await res.json()
  return parseDecimals(data) as T
}

function parseDecimals(v: unknown): unknown {
  if (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v)) return parseFloat(v)
  if (Array.isArray(v)) return v.map(parseDecimals)
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.entries(v).map(([k, val]) => [k, parseDecimals(val)]))
  }
  return v
}

export const api = {
  auth: {
    google: (token: string) =>
      request<{ access_token: string; user: User }>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ token }),
      }),
    me: () => request<User>('/auth/me'),
  },
  categories: {
    list: () => request<Category[]>('/categories/'),
    create: (data: { name: string; color?: string; default_budget?: number }) =>
      request<Category>('/categories/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { name?: string; color?: string; default_budget?: number }) =>
      request<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
  },
  cards: {
    list: () => request<Card[]>('/cards/'),
    create: (data: { name: string; card_type: 'debit' | 'credit' }) =>
      request<Card>('/cards/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { name?: string; card_type?: 'debit' | 'credit' }) =>
      request<Card>(`/cards/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<void>(`/cards/${id}`, { method: 'DELETE' }),
  },
  periods: {
    list: () => request<Period[]>('/periods/'),
    create: (data: { name: string; start_date: string; end_date: string }) =>
      request<Period>('/periods/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<{ name: string; start_date: string; end_date: string }>) =>
      request<Period>(`/periods/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<void>(`/periods/${id}`, { method: 'DELETE' }),
  },
  budgets: {
    list: (periodId: number) => request<Budget[]>(`/budgets/?period_id=${periodId}`),
    create: (data: { period_id: number; category_id: number; amount: number }) =>
      request<Budget>('/budgets/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, amount: number) =>
      request<Budget>(`/budgets/${id}`, { method: 'PUT', body: JSON.stringify({ amount }) }),
    delete: (id: number) => request<void>(`/budgets/${id}`, { method: 'DELETE' }),
  },
  transactions: {
    list: (periodId: number, filters?: { category_id?: number; card_id?: number; status?: string }) => {
      const params = new URLSearchParams({ period_id: String(periodId) })
      if (filters?.category_id) params.set('category_id', String(filters.category_id))
      if (filters?.card_id) params.set('card_id', String(filters.card_id))
      if (filters?.status) params.set('status', filters.status)
      return request<Transaction[]>(`/transactions/?${params}`)
    },
    create: (data: {
      period_id: number; card_id: number | null; date: string
      description: string; status: string
      items: { category_id: number; amount: number }[]
    }) => request<Transaction>('/transactions/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: {
      card_id?: number | null; date?: string; description?: string; status?: string
      items?: { category_id: number; amount: number }[]
    }) => request<Transaction>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<void>(`/transactions/${id}`, { method: 'DELETE' }),
  },
  summary: {
    get: (periodId: number) => request<PeriodSummary>(`/summary/${periodId}`),
  },
}
