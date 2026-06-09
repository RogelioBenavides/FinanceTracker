import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client.ts'
import BudgetSummaryBar from '../components/BudgetSummaryBar.tsx'
import CategoryCard from '../components/CategoryCard.tsx'
import TransactionForm from '../components/TransactionForm.tsx'
import type { usePeriod } from '../hooks/usePeriod.ts'

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MXN' })
const fmtDate = (iso: string) => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}` }

interface Props { periodState: ReturnType<typeof usePeriod> }

export default function Dashboard({ periodState }: Props) {
  const { periodId, selectedPeriod } = periodState
  const [showForm, setShowForm] = useState(false)

  const { data: summary, isLoading } = useQuery({
    queryKey: ['summary', periodId],
    queryFn: () => api.summary.get(periodId!),
    enabled: periodId != null,
  })

  const { data: recentTx = [] } = useQuery({
    queryKey: ['transactions', periodId],
    queryFn: () => api.transactions.list(periodId!),
    enabled: periodId != null,
    select: (rows) => rows.slice(0, 10),
  })

  if (!selectedPeriod) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <p className="text-xl font-medium text-slate-300">No periods yet</p>
        <p className="text-sm mt-2">Create one from the sidebar to get started</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">{selectedPeriod.name}</h2>
          <p className="text-sm text-slate-500 mt-0.5 tnum">
            {fmtDate(selectedPeriod.start_date)} — {fmtDate(selectedPeriod.end_date)}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Transaction
        </button>
      </div>

      {isLoading ? (
        <div className="text-slate-500 text-center py-16">Loading...</div>
      ) : summary ? (
        <>
          <BudgetSummaryBar
            totalBudget={summary.total_budget}
            totalPaid={summary.total_paid}
            totalPending={summary.total_pending}
            totalNotPaid={summary.total_not_paid}
            totalAvailable={summary.total_available}
          />

          {summary.categories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {summary.categories.map((cat) => (
                <CategoryCard key={cat.category_id} summary={cat} />
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-8 text-center text-slate-500 mb-8">
              <p className="text-slate-300">No budgets set for this period.</p>
              <p className="text-sm mt-1">Go to Budget to set category budgets.</p>
            </div>
          )}
        </>
      ) : null}

      {recentTx.length > 0 && (
        <div className="bg-slate-900/60 backdrop-blur rounded-2xl border border-slate-800 p-5 shadow-xl shadow-black/20">
          <h3 className="font-semibold text-slate-300 text-sm mb-4">Recent Transactions</h3>
          <div className="divide-y divide-slate-800/70">
            {recentTx.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between text-sm py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${tx.status === 'paid' ? 'bg-emerald-400' : tx.status === 'pending' ? 'bg-amber-400' : 'bg-rose-500'}`} />
                  <span className="text-slate-200 font-medium truncate">{tx.description}</span>
                  <span className="text-slate-500 text-xs flex-shrink-0">
                    {tx.items.length === 1 ? tx.items[0].category_name : `${tx.items.length} categories`}
                  </span>
                </div>
                <span className="font-semibold text-slate-100 ml-3 flex-shrink-0 tnum">{fmt.format(tx.total_amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && periodId && (
        <TransactionForm periodId={periodId} onClose={() => setShowForm(false)} />
      )}
    </div>
  )
}
