import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client.ts'
import TransactionTable from '../components/TransactionTable.tsx'
import TransactionForm from '../components/TransactionForm.tsx'
import type { usePeriod } from '../hooks/usePeriod.ts'

interface Props { periodState: ReturnType<typeof usePeriod> }

export default function Transactions({ periodState }: Props) {
  const { periodId, selectedPeriod } = periodState
  const [showForm, setShowForm] = useState(false)
  const [filters, setFilters] = useState({ category_id: 0, card_id: 0, status: '' })

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: api.categories.list })
  const { data: cards = [] } = useQuery({ queryKey: ['cards'], queryFn: api.cards.list })

  const { data: txs = [], isLoading } = useQuery({
    queryKey: ['transactions', periodId, filters],
    queryFn: () => api.transactions.list(periodId!, {
      ...(filters.category_id ? { category_id: filters.category_id } : {}),
      ...(filters.card_id ? { card_id: filters.card_id } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    }),
    enabled: periodId != null,
  })

  if (!selectedPeriod) return null

  const hasFilters = filters.category_id || filters.card_id || filters.status

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
        >
          + New
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap items-center gap-3">
        <select
          value={filters.category_id}
          onChange={(e) => setFilters((f) => ({ ...f, category_id: parseInt(e.target.value) }))}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Filter by category"
        >
          <option value={0}>All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select
          value={filters.card_id}
          onChange={(e) => setFilters((f) => ({ ...f, card_id: parseInt(e.target.value) }))}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Filter by card"
        >
          <option value={0}>All cards</option>
          {cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="not_paid">Not Paid</option>
        </select>

        {hasFilters ? (
          <button
            onClick={() => setFilters({ category_id: 0, card_id: 0, status: '' })}
            className="text-sm text-gray-400 hover:text-gray-600 font-medium"
          >
            Clear filters
          </button>
        ) : null}

        <span className="ml-auto text-sm text-gray-400">
          {txs.length} {txs.length === 1 ? 'transaction' : 'transactions'}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {isLoading ? (
          <div className="text-gray-400 text-center py-10">Loading...</div>
        ) : (
          <TransactionTable transactions={txs} periodId={periodId!} cards={cards} />
        )}
      </div>

      {showForm && periodId && (
        <TransactionForm periodId={periodId} onClose={() => setShowForm(false)} />
      )}
    </div>
  )
}
