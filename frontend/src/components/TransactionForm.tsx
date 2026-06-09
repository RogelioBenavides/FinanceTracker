import { useState, useEffect, type ReactNode } from 'react'
import { useForm, useWatch, Controller } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import DateField, { isoToDate, dateToIso } from './DateField.tsx'
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-slate-900 ring-1 ring-slate-800 rounded-2xl shadow-2xl shadow-black/50 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-slate-100 mb-5">{transaction ? 'Edit Transaction' : 'New Transaction'}</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Date" error={errors.date?.message}>
              <Controller
                control={control}
                name="date"
                rules={{ required: 'Required' }}
                render={({ field }) => (
                  <DateField
                    selected={isoToDate(field.value)}
                    onChange={(d) => field.onChange(dateToIso(d))}
                    onBlur={field.onBlur}
                    placeholderText="Select date"
                    className="field"
                    wrapperClassName="w-full"
                  />
                )}
              />
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
              <label className="text-sm font-medium text-slate-300">Categories</label>
              <button type="button" onClick={addItem} className="text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer">+ Split</button>
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
                      <button type="button" onClick={() => removeItem(idx)} className="flex-shrink-0 text-slate-500 hover:text-rose-400 text-lg leading-none cursor-pointer" aria-label="Remove item">×</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {items.length > 1 && (
              <div className="flex justify-end mt-2 text-sm font-semibold text-slate-200 tnum">
                Total: {fmt.format(total)}
              </div>
            )}
            {itemErrors && <p className="text-xs text-rose-400 mt-1">{itemErrors}</p>}
          </div>

          {error && <p className="text-sm text-rose-400">{error.message}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isPending} className="flex-1 bg-emerald-500 text-slate-950 rounded-xl py-2.5 font-semibold hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400/40">
              {isPending ? 'Saving...' : transaction ? 'Update' : 'Add'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 border border-slate-700 text-slate-300 rounded-xl py-2.5 font-semibold hover:bg-slate-800 transition-colors cursor-pointer">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
    </div>
  )
}
