import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import { api } from '../api/client.ts'
import type { usePeriod } from '../hooks/usePeriod.ts'

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })

interface Props { periodState: ReturnType<typeof usePeriod> }

export default function Budget({ periodState }: Props) {
  const { periodId, selectedPeriod } = periodState
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [addingCategoryId, setAddingCategoryId] = useState<number | ''>('')
  const [addAmount, setAddAmount] = useState('')
  const qc = useQueryClient()

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets', periodId],
    queryFn: () => api.budgets.list(periodId!),
    enabled: periodId != null,
  })

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: api.categories.list })
  const { data: summary } = useQuery({
    queryKey: ['summary', periodId],
    queryFn: () => api.summary.get(periodId!),
    enabled: periodId != null,
  })

  const existingCategoryIds = new Set(budgets.map((b) => b.category_id))
  const unbudgetedCategories = categories.filter((c) => !existingCategoryIds.has(c.id))

  const updateBudget = useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number }) => api.budgets.update(id, amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets', periodId] })
      qc.invalidateQueries({ queryKey: ['summary', periodId] })
      setEditingId(null)
    },
  })

  const createBudget = useMutation({
    mutationFn: (data: { period_id: number; category_id: number; amount: number }) =>
      api.budgets.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets', periodId] })
      qc.invalidateQueries({ queryKey: ['summary', periodId] })
      setAddingCategoryId('')
      setAddAmount('')
    },
  })

  const deleteBudget = useMutation({
    mutationFn: api.budgets.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets', periodId] })
      qc.invalidateQueries({ queryKey: ['summary', periodId] })
    },
  })

  const summaryMap = new Map(summary?.categories.map((c) => [c.category_id, c]) ?? [])
  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)

  if (!selectedPeriod) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Budget — {selectedPeriod.name}</h2>
        <div className="text-right">
          <p className="text-xs text-gray-400">Total budgeted</p>
          <p className="text-xl font-bold text-gray-800">{fmt.format(totalBudget)}</p>
        </div>
      </div>

      {unbudgetedCategories.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Add category budget</label>
            <select
              value={addingCategoryId}
              onChange={(e) => setAddingCategoryId(e.target.value ? parseInt(e.target.value) : '')}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Select category to add"
            >
              <option value="">Select category...</option>
              {unbudgetedCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Amount (MXN)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              placeholder="0.00"
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Budget amount"
            />
          </div>
          <button
            onClick={() => {
              if (addingCategoryId && addAmount && periodId) {
                createBudget.mutate({ period_id: periodId, category_id: Number(addingCategoryId), amount: parseFloat(addAmount) })
              }
            }}
            disabled={!addingCategoryId || !addAmount || createBudget.isPending}
            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {createBudget.isPending ? 'Adding...' : 'Add'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="text-gray-400 text-center py-12">Loading...</div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No budgets for this period yet.</p>
            <p className="text-sm mt-1">Add a category budget above.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                {['Category', 'Budget', 'Paid', 'Pending', 'Available', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {budgets.map((b) => {
                const s = summaryMap.get(b.category_id)
                const cat = categories.find((c) => c.id === b.category_id)
                const isOver = s && s.available < 0
                return (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {cat && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />}
                        <span className="font-medium text-gray-800">{cat?.name ?? `Category ${b.category_id}`}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {editingId === b.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-24 border border-gray-200 rounded px-2 py-0.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                            min="0.01"
                            autoFocus
                            aria-label={`Edit budget for ${cat?.name}`}
                          />
                          <button
                            onClick={() => updateBudget.mutate({ id: b.id, amount: parseFloat(editAmount) })}
                            disabled={!editAmount || parseFloat(editAmount) <= 0 || updateBudget.isPending}
                            className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-medium disabled:opacity-50 hover:bg-blue-700"
                          >
                            OK
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:text-gray-600 px-1">✕</button>
                        </div>
                      ) : (
                        <span className="font-semibold text-gray-800">{fmt.format(b.amount)}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-red-600 font-medium">{s ? fmt.format(s.paid) : '—'}</td>
                    <td className="px-5 py-3 text-amber-600">{s ? fmt.format(s.pending) : '—'}</td>
                    <td className={`px-5 py-3 font-semibold ${isOver ? 'text-red-600' : 'text-green-600'}`}>
                      {s ? fmt.format(s.available) : fmt.format(b.amount)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setEditingId(b.id); setEditAmount(String(b.amount)) }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          aria-label={`Edit ${cat?.name} budget`}
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          onClick={() => confirm(`Remove budget for "${cat?.name}"?`) && deleteBudget.mutate(b.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          aria-label={`Delete ${cat?.name} budget`}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
