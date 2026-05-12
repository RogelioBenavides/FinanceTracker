import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client.ts'
import BudgetSummaryBar from '../components/BudgetSummaryBar.tsx'
import CategoryCard from '../components/CategoryCard.tsx'
import TransactionForm from '../components/TransactionForm.tsx'
import type { usePeriod } from '../hooks/usePeriod.ts'

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MXN' })

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
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <p className="text-xl font-medium">No periods yet</p>
        <p className="text-sm mt-2">Create one from the sidebar to get started</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{selectedPeriod.name}</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {selectedPeriod.start_date} — {selectedPeriod.end_date}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
        >
          + Add Transaction
        </button>
      </div>

      {isLoading ? (
        <div className="text-gray-400 text-center py-16">Loading...</div>
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
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 mb-8">
              <p>No budgets set for this period.</p>
              <p className="text-sm mt-1">Go to Budget to set category budgets.</p>
            </div>
          )}
        </>
      ) : null}

      {recentTx.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-700 text-sm mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {recentTx.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${tx.status === 'paid' ? 'bg-green-500' : tx.status === 'pending' ? 'bg-amber-400' : 'bg-red-500'}`} />
                  <span className="text-gray-800 font-medium truncate">{tx.description}</span>
                  <span className="text-gray-400 text-xs flex-shrink-0">
                    {tx.items.length === 1 ? tx.items[0].category_name : `${tx.items.length} categories`}
                  </span>
                </div>
                <span className="font-semibold text-gray-800 ml-3 flex-shrink-0">{fmt.format(tx.total_amount)}</span>
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
