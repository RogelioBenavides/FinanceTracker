import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import { api } from '../api/client.ts'
import type { Transaction } from '../types/index.ts'
import TransactionForm from './TransactionForm.tsx'

export function StatusBadge({ status }: { status: Transaction['status'] }) {
  const map = {
    paid:     'bg-green-100 text-green-700',
    pending:  'bg-amber-100 text-amber-700',
    not_paid: 'bg-red-100 text-red-700',
  }
  const label = { paid: 'Paid', pending: 'Pending', not_paid: 'Not Paid' }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>
      {label[status]}
    </span>
  )
}

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MXN' })
const fmtDate = (iso: string) => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}` }

interface Props {
  transactions: Transaction[]
  periodId: number
}

export default function TransactionTable({ transactions, periodId }: Props) {
  const [editing, setEditing] = useState<Transaction | null>(null)
  const qc = useQueryClient()

  const del = useMutation({
    mutationFn: api.transactions.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions', periodId] })
      qc.invalidateQueries({ queryKey: ['summary', periodId] })
    },
  })

  if (transactions.length === 0) {
    return (
      <div className="text-center py-14 text-gray-400">
        <p className="text-base">No transactions yet</p>
        <p className="text-sm mt-1">Add your first one with the button above</p>
      </div>
    )
  }

  return (
    <>
      {/* Mobile card list */}
      <ul className="sm:hidden divide-y divide-gray-100 -mx-5">
        {transactions.map((tx) => (
          <li key={tx.id} className="px-5 py-3">
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-800 flex-1 min-w-0 truncate">{tx.description}</span>
              <span className="text-sm font-semibold text-gray-800 flex-shrink-0">{fmt.format(tx.total_amount)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-400 min-w-0 flex-1">
                <span className="flex-shrink-0">{fmtDate(tx.date)}</span>
                <span>·</span>
                <span className="truncate">
                  {tx.items.length === 1
                    ? tx.items[0].category_name ?? '—'
                    : `${tx.items.length} categories`}
                </span>
                {tx.card_name && (
                  <><span>·</span><span className="truncate">{tx.card_name}</span></>
                )}
              </div>
              <StatusBadge status={tx.status} />
            </div>
            <div className="flex justify-end gap-1 mt-2">
              <button onClick={() => setEditing(tx)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" aria-label={`Edit ${tx.description}`}>
                <FiEdit2 size={14} />
              </button>
              <button onClick={() => confirm(`Delete "${tx.description}"?`) && del.mutate(tx.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" aria-label={`Delete ${tx.description}`}>
                <FiTrash2 size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto -mx-5">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              {['Date', 'Description', 'Category', 'Card', 'Amount', 'Status', ''].map((h) => (
                <th key={h} className="pb-3 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-5 text-gray-500 whitespace-nowrap">{fmtDate(tx.date)}</td>
                <td className="py-3 px-5 text-gray-800 font-medium max-w-[200px] truncate">{tx.description}</td>
                <td className="py-3 px-5 text-gray-500 text-xs">
                  {tx.items.length === 1
                    ? tx.items[0].category_name ?? '—'
                    : <span className="inline-flex items-center gap-1">
                        <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">Split</span>
                        <span className="text-gray-400">{tx.items.length} categories</span>
                      </span>
                  }
                </td>
                <td className="py-3 px-5 text-gray-400 text-xs">{tx.card_name ?? '—'}</td>
                <td className="py-3 px-5 font-semibold text-gray-800 whitespace-nowrap">{fmt.format(tx.total_amount)}</td>
                <td className="py-3 px-5">
                  <StatusBadge status={tx.status} />
                </td>
                <td className="py-3 px-5">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(tx)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      aria-label={`Edit ${tx.description}`}
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      onClick={() => confirm(`Delete "${tx.description}"?`) && del.mutate(tx.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      aria-label={`Delete ${tx.description}`}
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <TransactionForm periodId={periodId} transaction={editing} onClose={() => setEditing(null)} />
      )}
    </>
  )
}
