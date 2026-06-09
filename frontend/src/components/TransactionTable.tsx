import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import { api } from '../api/client.ts'
import type { Card, Transaction } from '../types/index.ts'
import TransactionForm from './TransactionForm.tsx'

export function StatusBadge({ status }: { status: Transaction['status'] }) {
  const map = {
    paid:     'bg-emerald-500/15 text-emerald-400 ring-emerald-500/20',
    pending:  'bg-amber-500/15 text-amber-400 ring-amber-500/20',
    not_paid: 'bg-rose-500/15 text-rose-400 ring-rose-500/20',
  }
  const label = { paid: 'Paid', pending: 'Pending', not_paid: 'Not Paid' }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${map[status]}`}>
      {label[status]}
    </span>
  )
}

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MXN' })
const fmtDate = (iso: string) => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}` }

const selectCls = 'text-xs border border-slate-700 rounded-md px-2 py-1 bg-slate-800 text-slate-200 cursor-pointer focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20'
const applyBtnCls = 'text-xs px-2.5 py-1 rounded-md font-medium bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer'
const iconEditCls = 'p-1.5 text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-colors cursor-pointer'
const iconDelCls = 'p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer'

interface Props {
  transactions: Transaction[]
  periodId: number
  cards: Card[]
}

export default function TransactionTable({ transactions, periodId, cards }: Props) {
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkCard, setBulkCard] = useState('')
  const qc = useQueryClient()

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['transactions', periodId] })
    qc.invalidateQueries({ queryKey: ['summary', periodId] })
  }

  const del = useMutation({
    mutationFn: api.transactions.delete,
    onSuccess: invalidate,
  })

  const bulk = useMutation({
    mutationFn: api.transactions.bulkUpdate,
    onSuccess: () => {
      invalidate()
      setSelected(new Set())
      setBulkStatus('')
      setBulkCard('')
    },
  })

  const allSelected = transactions.length > 0 && selected.size === transactions.length
  const someSelected = selected.size > 0 && !allSelected

  const toggleAll = () => {
    setSelected(allSelected || someSelected ? new Set() : new Set(transactions.map((tx) => tx.id)))
  }

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const applyBulkStatus = () => {
    if (!bulkStatus) return
    bulk.mutate({ transaction_ids: [...selected], status: bulkStatus })
  }

  const applyBulkCard = () => {
    if (!bulkCard) return
    bulk.mutate({ transaction_ids: [...selected], set_card: true, card_id: bulkCard === 'null' ? null : parseInt(bulkCard) })
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-14 text-slate-500">
        <p className="text-base text-slate-300">No transactions yet</p>
        <p className="text-sm mt-1">Add your first one with the button above</p>
      </div>
    )
  }

  return (
    <>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 bg-sky-500/10 border border-sky-500/30 rounded-xl px-4 py-2.5 text-sm">
          <span className="font-semibold text-sky-300">{selected.size} selected</span>
          <span className="text-sky-500/40 hidden sm:inline select-none">|</span>
          <div className="flex items-center gap-1.5">
            <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className={selectCls} aria-label="Bulk status">
              <option value="">Set status…</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="not_paid">Not Paid</option>
            </select>
            <button onClick={applyBulkStatus} disabled={!bulkStatus || bulk.isPending} className={applyBtnCls}>
              Apply
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <select value={bulkCard} onChange={(e) => setBulkCard(e.target.value)} className={selectCls} aria-label="Bulk card">
              <option value="">Set card…</option>
              <option value="null">No card</option>
              {cards.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </select>
            <button onClick={applyBulkCard} disabled={!bulkCard || bulk.isPending} className={applyBtnCls}>
              Apply
            </button>
          </div>
          <button
            onClick={() => { setSelected(new Set()); setBulkStatus(''); setBulkCard('') }}
            className="ml-auto text-xs text-sky-400/70 hover:text-sky-300 font-medium cursor-pointer"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Mobile card list */}
      <ul className="sm:hidden divide-y divide-slate-800 -mx-5">
        {transactions.map((tx) => (
          <li key={tx.id} className={`px-5 py-3 transition-colors ${selected.has(tx.id) ? 'bg-sky-500/10' : ''}`}>
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                checked={selected.has(tx.id)}
                onChange={() => toggleOne(tx.id)}
                className="mt-1 h-4 w-4 shrink-0 accent-emerald-500 cursor-pointer"
                aria-label={`Select ${tx.description}`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-sm font-semibold text-slate-100 flex-1 min-w-0 truncate">{tx.description}</span>
                  <span className="text-sm font-semibold text-slate-100 flex-shrink-0 tnum">{fmt.format(tx.total_amount)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0 flex-1">
                    <span className="flex-shrink-0 tnum">{fmtDate(tx.date)}</span>
                    <span>·</span>
                    <span className="truncate">
                      {tx.items.length === 1 ? tx.items[0].category_name ?? '—' : `${tx.items.length} categories`}
                    </span>
                    {tx.card_name && (
                      <><span>·</span><span className="truncate">{tx.card_name}</span></>
                    )}
                  </div>
                  <StatusBadge status={tx.status} />
                </div>
                <div className="flex justify-end gap-1 mt-2">
                  <button onClick={() => setEditing(tx)} className={iconEditCls} aria-label={`Edit ${tx.description}`}>
                    <FiEdit2 size={14} />
                  </button>
                  <button onClick={() => confirm(`Delete "${tx.description}"?`) && del.mutate(tx.id)} className={iconDelCls} aria-label={`Delete ${tx.description}`}>
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto -mx-5">
        <table className="w-full text-sm min-w-[680px]">
          <thead>
            <tr className="border-b border-slate-800 text-left">
              <th className="pb-3 pl-5 pr-2 w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected }}
                  onChange={toggleAll}
                  className="h-4 w-4 accent-emerald-500 cursor-pointer"
                  aria-label="Select all transactions"
                />
              </th>
              {['Date', 'Description', 'Category', 'Card', 'Amount', 'Status', ''].map((h) => (
                <th key={h} className="pb-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className={`transition-colors ${selected.has(tx.id) ? 'bg-sky-500/10' : 'hover:bg-slate-800/40'}`}
              >
                <td className="py-3 pl-5 pr-2">
                  <input
                    type="checkbox"
                    checked={selected.has(tx.id)}
                    onChange={() => toggleOne(tx.id)}
                    className="h-4 w-4 accent-emerald-500 cursor-pointer"
                    aria-label={`Select ${tx.description}`}
                  />
                </td>
                <td className="py-3 px-5 text-slate-400 whitespace-nowrap tnum">{fmtDate(tx.date)}</td>
                <td className="py-3 px-5 text-slate-100 font-medium max-w-[200px] truncate">{tx.description}</td>
                <td className="py-3 px-5 text-slate-400 text-xs">
                  {tx.items.length === 1
                    ? tx.items[0].category_name ?? '—'
                    : <span className="inline-flex items-center gap-1">
                        <span className="bg-sky-500/15 text-sky-400 px-1.5 py-0.5 rounded font-medium">Split</span>
                        <span className="text-slate-500">{tx.items.length} categories</span>
                      </span>
                  }
                </td>
                <td className="py-3 px-5 text-slate-500 text-xs">{tx.card_name ?? '—'}</td>
                <td className="py-3 px-5 font-semibold text-slate-100 whitespace-nowrap tnum">{fmt.format(tx.total_amount)}</td>
                <td className="py-3 px-5">
                  <StatusBadge status={tx.status} />
                </td>
                <td className="py-3 px-5">
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(tx)} className={iconEditCls} aria-label={`Edit ${tx.description}`}>
                      <FiEdit2 size={14} />
                    </button>
                    <button onClick={() => confirm(`Delete "${tx.description}"?`) && del.mutate(tx.id)} className={iconDelCls} aria-label={`Delete ${tx.description}`}>
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
