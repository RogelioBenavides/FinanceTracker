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
  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

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

  const query = search.trim().toLowerCase()
  const visibleTxs = txs.filter((tx) => {
    if (query &&
      !tx.description.toLowerCase().includes(query) &&
      !(tx.card_name?.toLowerCase().includes(query) ?? false) &&
      !tx.items.some((i) => i.category_name?.toLowerCase().includes(query))
    ) return false
    if (dateRange.from && tx.date < dateRange.from) return false
    if (dateRange.to && tx.date > dateRange.to) return false
    return true
  })

  const hasFilters = filters.category_id || filters.card_id || filters.status || query || dateRange.from || dateRange.to
  const total = visibleTxs.reduce((sum, tx) => sum + tx.total_amount, 0)

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
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions"
            className="text-sm border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 bg-slate-800/60 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 w-48"
            aria-label="Search transactions"
          />
        </div>

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

        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={dateRange.from}
            max={dateRange.to || undefined}
            onChange={(e) => setDateRange((r) => ({ ...r, from: e.target.value }))}
            className="text-sm border border-slate-700 rounded-lg px-2.5 py-1.5 bg-slate-800/60 text-slate-200 cursor-pointer focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 [color-scheme:dark]"
            aria-label="From date"
          />
          <span className="text-slate-500 text-sm select-none">–</span>
          <input
            type="date"
            value={dateRange.to}
            min={dateRange.from || undefined}
            onChange={(e) => setDateRange((r) => ({ ...r, to: e.target.value }))}
            className="text-sm border border-slate-700 rounded-lg px-2.5 py-1.5 bg-slate-800/60 text-slate-200 cursor-pointer focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 [color-scheme:dark]"
            aria-label="To date"
          />
        </div>

        {hasFilters ? (
          <button
            onClick={() => { setFilters({ category_id: 0, card_id: 0, status: '' }); setSearch(''); setDateRange({ from: '', to: '' }) }}
            className="text-sm text-slate-400 hover:text-slate-200 font-medium cursor-pointer"
          >
            Clear filters
          </button>
        ) : null}

        <div className="ml-auto flex items-center gap-3 text-sm tnum">
          <span className="text-slate-500">
            {visibleTxs.length} {visibleTxs.length === 1 ? 'transaction' : 'transactions'}
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
          <TransactionTable transactions={visibleTxs} periodId={periodId!} cards={cards} />
        )}
      </div>

      {showForm && periodId && (
        <TransactionForm periodId={periodId} onClose={() => setShowForm(false)} />
      )}
    </div>
  )
}
