import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import { api } from '../api/client.ts'
import type { usePeriod } from '../hooks/usePeriod.ts'

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })

const inputCls = 'text-sm border border-slate-700 rounded-lg px-3 py-1.5 bg-slate-800/60 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20'
const primaryBtn = 'bg-emerald-500 text-slate-950 rounded-lg font-semibold hover:bg-emerald-400 disabled:opacity-50 transition-colors cursor-pointer'
const iconEditCls = 'p-1.5 text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-colors cursor-pointer'
const iconDelCls = 'p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer'

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
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight min-w-0">Budget — {selectedPeriod.name}</h2>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-slate-500">Total budgeted</p>
          <p className="text-xl font-bold text-slate-100 tnum">{fmt.format(totalBudget)}</p>
        </div>
      </div>

      {unbudgetedCategories.length > 0 && (
        <div className="bg-slate-900/60 backdrop-blur rounded-2xl border border-slate-800 p-4 mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Add category budget</label>
            <select
              value={addingCategoryId}
              onChange={(e) => setAddingCategoryId(e.target.value ? parseInt(e.target.value) : '')}
              className={`${inputCls} cursor-pointer`}
              aria-label="Select category to add"
            >
              <option value="">Select category...</option>
              {unbudgetedCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Amount (MXN)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              placeholder="0.00"
              className={`${inputCls} w-32 tnum`}
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
            className={`${primaryBtn} px-4 py-1.5 text-sm`}
          >
            {createBudget.isPending ? 'Adding...' : 'Add'}
          </button>
        </div>
      )}

      <div className="bg-slate-900/60 backdrop-blur rounded-2xl border border-slate-800 overflow-hidden shadow-xl shadow-black/20">
        {isLoading ? (
          <div className="text-slate-500 text-center py-12">Loading...</div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-slate-300">No budgets for this period yet.</p>
            <p className="text-sm mt-1">Add a category budget above.</p>
          </div>
        ) : (
          <>
            {/* Mobile card list */}
            <ul className="sm:hidden divide-y divide-slate-800">
              {budgets.map((b) => {
                const s = summaryMap.get(b.category_id)
                const cat = categories.find((c) => c.id === b.category_id)
                const isOver = s && s.available < 0
                return (
                  <li key={b.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {cat && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-white/10" style={{ backgroundColor: cat.color }} />}
                        <span className="text-sm font-semibold text-slate-100 truncate">{cat?.name ?? `Category ${b.category_id}`}</span>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => { setEditingId(b.id); setEditAmount(String(b.amount)) }} className={iconEditCls} aria-label={`Edit ${cat?.name} budget`}><FiEdit2 size={14} /></button>
                        <button onClick={() => confirm(`Remove budget for "${cat?.name}"?`) && deleteBudget.mutate(b.id)} className={iconDelCls} aria-label={`Delete ${cat?.name} budget`}><FiTrash2 size={14} /></button>
                      </div>
                    </div>
                    {editingId === b.id && (
                      <div className="flex items-center gap-2 mb-2">
                        <input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className={`${inputCls} flex-1 tnum`} min="0.01" autoFocus aria-label={`Edit budget for ${cat?.name}`} />
                        <button onClick={() => updateBudget.mutate({ id: b.id, amount: parseFloat(editAmount) })} disabled={!editAmount || parseFloat(editAmount) <= 0 || updateBudget.isPending} className={`${primaryBtn} text-xs px-3 py-1.5`}>OK</button>
                        <button onClick={() => setEditingId(null)} className="text-xs text-slate-500 hover:text-slate-300 px-1 cursor-pointer">✕</button>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Budget</span>
                        <span className="font-semibold text-slate-200 tnum">{fmt.format(b.amount)}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Available</span>
                        <span className={`font-semibold tnum ${isOver ? 'text-rose-400' : 'text-sky-400'}`}>{s ? fmt.format(s.available) : fmt.format(b.amount)}</span>
                      </div>
                      {s && s.paid > 0 && (
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-500">Paid</span>
                          <span className="text-emerald-400 font-medium tnum">{fmt.format(s.paid)}</span>
                        </div>
                      )}
                      {s && s.pending > 0 && (
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-500">Pending</span>
                          <span className="text-amber-400 tnum">{fmt.format(s.pending)}</span>
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>

            {/* Desktop table */}
            <table className="hidden sm:table w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left">
                  {['Category', 'Budget', 'Paid', 'Pending', 'Available', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {budgets.map((b) => {
                  const s = summaryMap.get(b.category_id)
                  const cat = categories.find((c) => c.id === b.category_id)
                  const isOver = s && s.available < 0
                  return (
                    <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {cat && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-white/10" style={{ backgroundColor: cat.color }} />}
                          <span className="font-medium text-slate-100">{cat?.name ?? `Category ${b.category_id}`}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {editingId === b.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              className={`${inputCls} w-24 text-right tnum`}
                              min="0.01"
                              autoFocus
                              aria-label={`Edit budget for ${cat?.name}`}
                            />
                            <button
                              onClick={() => updateBudget.mutate({ id: b.id, amount: parseFloat(editAmount) })}
                              disabled={!editAmount || parseFloat(editAmount) <= 0 || updateBudget.isPending}
                              className={`${primaryBtn} text-xs px-2 py-1`}
                            >
                              OK
                            </button>
                            <button onClick={() => setEditingId(null)} className="text-xs text-slate-500 hover:text-slate-300 px-1 cursor-pointer">✕</button>
                          </div>
                        ) : (
                          <span className="font-semibold text-slate-100 tnum">{fmt.format(b.amount)}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-emerald-400 font-medium tnum">{s ? fmt.format(s.paid) : '—'}</td>
                      <td className="px-5 py-3 text-amber-400 tnum">{s ? fmt.format(s.pending) : '—'}</td>
                      <td className={`px-5 py-3 font-semibold tnum ${isOver ? 'text-rose-400' : 'text-sky-400'}`}>
                        {s ? fmt.format(s.available) : fmt.format(b.amount)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setEditingId(b.id); setEditAmount(String(b.amount)) }}
                            className={iconEditCls}
                            aria-label={`Edit ${cat?.name} budget`}
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button
                            onClick={() => confirm(`Remove budget for "${cat?.name}"?`) && deleteBudget.mutate(b.id)}
                            className={iconDelCls}
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
          </>
        )}
      </div>
    </div>
  )
}
