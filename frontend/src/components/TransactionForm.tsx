import { useState, useEffect, type ReactNode } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client.ts'
import type { Transaction } from '../types/index.ts'

interface ItemRow { category_id: number | ''; amount: string }
interface FormValues {
  date: string
  description: string
  card_id: number | ''
  status: 'paid' | 'pending' | 'not_paid'
}

interface Props {
  periodId: number
  transaction?: Transaction
  onClose: () => void
}

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MXN' })

export default function TransactionForm({ periodId, transaction, onClose }: Props) {
  const qc = useQueryClient()
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: api.categories.list })
  const { data: cards = [] } = useQuery({ queryKey: ['cards'], queryFn: api.cards.list })

  const [items, setItems] = useState<ItemRow[]>([{ category_id: '', amount: '' }])
  const [itemErrors, setItemErrors] = useState<string | null>(null)

  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm<FormValues>({
    defaultValues: { date: new Date().toISOString().slice(0, 10), description: '', card_id: '', status: 'not_paid' },
  })

  // Auto-set status to "paid" when a debit card is selected
  const watchedCardId = useWatch({ control, name: 'card_id' })
  useEffect(() => {
    if (!watchedCardId) return
    const card = cards.find((c) => c.id === Number(watchedCardId))
    if (card?.card_type === 'debit') setValue('status', 'paid')
  }, [watchedCardId, cards, setValue])

  useEffect(() => {
    if (transaction) {
      reset({ date: transaction.date, description: transaction.description, card_id: transaction.card_id ?? '', status: transaction.status })
      setItems(transaction.items.map((i) => ({ category_id: i.category_id, amount: String(i.amount) })))
    }
  }, [transaction, reset])

  function addItem() { setItems((prev) => [...prev, { category_id: '', amount: '' }]) }
  function removeItem(idx: number) { setItems((prev) => prev.filter((_, i) => i !== idx)) }
  function updateItem(idx: number, field: keyof ItemRow, value: number | '' | string) {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const total = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)

  const create = useMutation({ mutationFn: (v: FormValues) => api.transactions.create({
    period_id: periodId,
    card_id: v.card_id !== '' ? Number(v.card_id) : null,
    date: v.date, description: v.description, status: v.status,
    items: items.map((i) => ({ category_id: Number(i.category_id), amount: parseFloat(i.amount) })),
  }), onSuccess: invalidate })

  const update = useMutation({ mutationFn: (v: FormValues) => api.transactions.update(transaction!.id, {
    card_id: v.card_id !== '' ? Number(v.card_id) : null,
    date: v.date, description: v.description, status: v.status,
    items: items.map((i) => ({ category_id: Number(i.category_id), amount: parseFloat(i.amount) })),
  }), onSuccess: invalidate })

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['transactions', periodId] })
    qc.invalidateQueries({ queryKey: ['summary', periodId] })
    onClose()
  }

  function onSubmit(v: FormValues) {
    const invalid = items.some((i) => !i.category_id || !i.amount || parseFloat(i.amount) <= 0)
    if (invalid) { setItemErrors('Each item needs a category and amount > 0'); return }
    if (items.length === 0) { setItemErrors('Add at least one item'); return }
    setItemErrors(null)
    transaction ? update.mutate(v) : create.mutate(v)
  }

  const isPending = create.isPending || update.isPending
  const error = create.error ?? update.error

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-800 mb-5">{transaction ? 'Edit Transaction' : 'New Transaction'}</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Date" error={errors.date?.message}>
              <input type="date" {...register('date', { required: 'Required' })} className="field" />
            </Field>
            <Field label="Card (optional)">
              <select {...register('card_id')} className="field" aria-label="Payment card">
                <option value="">No card</option>
                {cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Description" error={errors.description?.message}>
            <input type="text" placeholder="e.g. Supermarket run" {...register('description', { required: 'Required', maxLength: { value: 255, message: 'Max 255 chars' } })} className="field" />
          </Field>

          <Field label="Status">
            <select {...register('status')} className="field" aria-label="Status">
              <option value="not_paid">Not Paid</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </Field>

          {/* Items / split rows */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Categories</label>
              <button type="button" onClick={addItem} className="text-xs text-blue-600 hover:text-blue-800 font-medium">+ Split</button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-2 gap-2 items-center">
                  <select
                    value={item.category_id}
                    onChange={(e) => updateItem(idx, 'category_id', e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="field w-full"
                    aria-label={`Category for item ${idx + 1}`}
                  >
                    <option value="">Select category...</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <div className="flex gap-1 items-center">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={item.amount}
                      onChange={(e) => updateItem(idx, 'amount', e.target.value)}
                      placeholder="0.00"
                      className="field w-full"
                      aria-label={`Amount for item ${idx + 1}`}
                    />
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="flex-shrink-0 text-gray-400 hover:text-red-500 text-lg leading-none" aria-label="Remove item">×</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {items.length > 1 && (
              <div className="flex justify-end mt-2 text-sm font-semibold text-gray-700">
                Total: {fmt.format(total)}
              </div>
            )}
            {itemErrors && <p className="text-xs text-red-600 mt-1">{itemErrors}</p>}
          </div>

          {error && <p className="text-sm text-red-600">{error.message}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isPending} className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {isPending ? 'Saving...' : transaction ? 'Update' : 'Add'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2.5 font-semibold hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
      <style>{`.field { width: 100%; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; outline: none; background: white; } .field:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }`}</style>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
