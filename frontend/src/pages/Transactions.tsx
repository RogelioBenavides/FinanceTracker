import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client.ts'
import TransactionTable from '../components/TransactionTable.tsx'
import TransactionForm from '../components/TransactionForm.tsx'
import type { usePeriod } from '../hooks/usePeriod.ts'

interface Props { periodState: ReturnType<typeof usePeriod> }

const fmtTotal = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MXN' })

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
  const total = txs.reduce((sum, tx) => sum + tx.total_amount, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Transactions</h2>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New
        </button>
      </div>

      <div className="bg-slate-900/60 backdrop-blur rounded-2xl border border-slate-800 p-4 mb-4 flex flex-wrap items-center gap-3">
        <select
          value={filters.category_id}
          onChange={(e) => setFilters((f) => ({ ...f, category_id: parseInt(e.target.value) }))}
          className="text-sm border border-slate-700 rounded-lg px-3 py-1.5 bg-slate-800/60 text-slate-200 cursor-pointer focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
          aria-label="Filter by category"
        >
          <option value={0}>All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select
          value={filters.card_id}
          onChange={(e) => setFilters((f) => ({ ...f, card_id: parseInt(e.target.value) }))}
          className="text-sm border border-slate-700 rounded-lg px-3 py-1.5 bg-slate-800/60 text-slate-200 cursor-pointer focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
          aria-label="Filter by card"
        >
          <option value={0}>All cards</option>
          {cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          className="text-sm border border-slate-700 rounded-lg px-3 py-1.5 bg-slate-800/60 text-slate-200 cursor-pointer focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
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
            className="text-sm text-slate-400 hover:text-slate-200 font-medium cursor-pointer"
          >
            Clear filters
          </button>
        ) : null}

        <div className="ml-auto flex items-center gap-3 text-sm tnum">
          <span className="text-slate-500">
            {txs.length} {txs.length === 1 ? 'transaction' : 'transactions'}
          </span>
          <span className="text-slate-600 select-none">·</span>
          <span className="text-slate-400">
            Total <span className="font-semibold text-slate-100">{fmtTotal.format(total)}</span>
          </span>
        </div>
      </div>

      <div className="bg-slate-900/60 backdrop-blur rounded-2xl border border-slate-800 p-5 shadow-xl shadow-black/20">
        {isLoading ? (
          <div className="text-slate-500 text-center py-10">Loading...</div>
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
