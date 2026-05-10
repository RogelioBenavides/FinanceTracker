import { useState, type ReactNode } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import { api } from '../api/client.ts'
import type { Category, Card, Period } from '../types/index.ts'

function toIso(d: Date | null) { return d ? d.toISOString().slice(0, 10) : '' }
function parseDate(iso: string) { return iso ? new Date(iso + 'T00:00:00') : null }

export default function Settings() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
      <PeriodsSection />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoriesSection />
        <CardsSection />
      </div>
    </div>
  )
}

const mxn = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })

// ─── Periods ──────────────────────────────────────────────────────────────────

function PeriodsSection() {
  const qc = useQueryClient()
  const { data: periods = [] } = useQuery({ queryKey: ['periods'], queryFn: api.periods.list })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newStart, setNewStart] = useState<Date | null>(null)
  const [newEnd, setNewEnd] = useState<Date | null>(null)

  const create = useMutation({
    mutationFn: () => api.periods.create({ name: newName.trim(), start_date: toIso(newStart), end_date: toIso(newEnd) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['periods'] }); setShowNew(false); setNewName(''); setNewStart(null); setNewEnd(null) },
  })
  const del = useMutation({
    mutationFn: api.periods.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['periods'] }),
  })

  const canCreate = newName.trim() && newStart && newEnd

  return (
    <Section title="Periods" description="Manage your budget periods">
      <div className="divide-y divide-gray-100 mb-3">
        {periods.map((p) => (
          editingId === p.id
            ? <PeriodEditRow key={p.id} period={p} onDone={() => setEditingId(null)} />
            : (
              <div key={p.id} className="flex items-center gap-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.start_date} — {p.end_date}</p>
                </div>
                <button onClick={() => setEditingId(p.id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" aria-label={`Edit ${p.name}`}><FiEdit2 size={14} /></button>
                <button onClick={() => confirm(`Delete "${p.name}"? All its transactions and budgets will also be deleted.`) && del.mutate(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" aria-label={`Delete ${p.name}`}><FiTrash2 size={14} /></button>
              </div>
            )
        ))}
        {periods.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">No periods yet</p>}
      </div>

      {!showNew ? (
        <button onClick={() => setShowNew(true)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ New period</button>
      ) : (
        <div className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50">
          <p className="text-xs font-semibold text-gray-600">New period</p>
          <input
            placeholder="Name (e.g. April-May)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="grid grid-cols-2 gap-2">
            <DatePicker selected={newStart} onChange={(d: Date | null) => { setNewStart(d); if (newEnd && d && d > newEnd) setNewEnd(null) }}
              placeholderText="Start date" dateFormat="yyyy-MM-dd"
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              wrapperClassName="w-full" />
            <DatePicker selected={newEnd} onChange={(d: Date | null) => setNewEnd(d)}
              minDate={newStart ?? undefined} placeholderText="End date" dateFormat="yyyy-MM-dd"
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              wrapperClassName="w-full" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => create.mutate()} disabled={!canCreate || create.isPending}
              className="flex-1 bg-blue-600 text-white rounded-lg py-1.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {create.isPending ? 'Creating...' : 'Create'}
            </button>
            <button onClick={() => { setShowNew(false); setNewName(''); setNewStart(null); setNewEnd(null) }}
              className="flex-1 border border-gray-200 rounded-lg py-1.5 text-sm text-gray-600 hover:bg-white transition-colors">
              Cancel
            </button>
          </div>
          {create.isError && <p className="text-xs text-red-600">{create.error?.message}</p>}
        </div>
      )}
    </Section>
  )
}

function PeriodEditRow({ period, onDone }: { period: Period; onDone: () => void }) {
  const qc = useQueryClient()
  const [name, setName] = useState(period.name)
  const [start, setStart] = useState<Date | null>(parseDate(period.start_date))
  const [end, setEnd] = useState<Date | null>(parseDate(period.end_date))

  const update = useMutation({
    mutationFn: () => api.periods.update(period.id, { name: name.trim(), start_date: toIso(start), end_date: toIso(end) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['periods'] }); onDone() },
  })

  return (
    <div className="py-2.5 space-y-2">
      <input value={name} onChange={(e) => setName(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <div className="grid grid-cols-2 gap-2">
        <DatePicker selected={start} onChange={(d: Date | null) => { setStart(d); if (end && d && d > end) setEnd(null) }}
          placeholderText="Start date" dateFormat="yyyy-MM-dd"
          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          wrapperClassName="w-full" />
        <DatePicker selected={end} onChange={(d: Date | null) => setEnd(d)}
          minDate={start ?? undefined} placeholderText="End date" dateFormat="yyyy-MM-dd"
          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          wrapperClassName="w-full" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => update.mutate()} disabled={!name.trim() || !start || !end || update.isPending}
          className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
          {update.isPending ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onDone} className="text-xs text-gray-400 hover:text-gray-600 px-2">Cancel</button>
      </div>
    </div>
  )
}

function CategoriesSection() {
  const [editingId, setEditingId] = useState<number | null>(null)
  const qc = useQueryClient()
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: api.categories.list })

  const { register, handleSubmit, reset } = useForm<{ name: string; color: string; default_budget: number }>({
    defaultValues: { name: '', color: '#6366f1', default_budget: 0 },
  })

  const create = useMutation({
    mutationFn: (d: { name: string; color: string; default_budget: number }) => api.categories.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); reset() },
  })

  const del = useMutation({
    mutationFn: api.categories.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })

  return (
    <Section
      title="Categories"
      description="Manage spending categories. Default budget is applied automatically when you create a new period."
    >
      <form onSubmit={handleSubmit((d) => create.mutate({ ...d, default_budget: Number(d.default_budget) }))} className="flex flex-wrap gap-2 mb-4 items-end">
        <div className="flex-1 min-w-32">
          <p className="text-xs text-gray-400 mb-1">Name</p>
          <input
            {...register('name', { required: true })}
            placeholder="Category name"
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="New category name"
          />
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Default budget</p>
          <input
            {...register('default_budget')}
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            className="w-28 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Default budget"
          />
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Color</p>
          <input {...register('color')} type="color" className="h-9 w-12 rounded-lg border border-gray-200 cursor-pointer p-0.5" aria-label="Category color" />
        </div>
        <button
          type="submit"
          disabled={create.isPending}
          className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors h-9"
        >
          {create.isPending ? '...' : 'Add'}
        </button>
      </form>

      <div className="divide-y divide-gray-100">
        {categories.map((cat) => (
          <CategoryRow
            key={cat.id}
            category={cat}
            isEditing={editingId === cat.id}
            onEdit={() => setEditingId(cat.id)}
            onDone={() => setEditingId(null)}
            onDelete={() => confirm(`Delete "${cat.name}"?`) && del.mutate(cat.id)}
          />
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-gray-400 py-4 text-center">No categories yet</p>
        )}
      </div>
    </Section>
  )
}

function CategoryRow({ category, isEditing, onEdit, onDone, onDelete }: {
  category: Category
  isEditing: boolean
  onEdit: () => void
  onDone: () => void
  onDelete: () => void
}) {
  const qc = useQueryClient()
  const { register, handleSubmit } = useForm({
    defaultValues: { name: category.name, color: category.color, default_budget: category.default_budget },
  })

  const update = useMutation({
    mutationFn: (d: { name: string; color: string; default_budget: number }) =>
      api.categories.update(category.id, { ...d, default_budget: Number(d.default_budget) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); onDone() },
  })

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit((d) => update.mutate(d))} className="flex flex-wrap gap-2 py-2.5 items-center">
        <input
          {...register('name', { required: true })}
          className="flex-1 min-w-24 border border-gray-200 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Edit category name"
        />
        <input
          {...register('default_budget')}
          type="number"
          min="0"
          step="0.01"
          className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Default budget"
          placeholder="Default budget"
        />
        <input type="color" {...register('color')} className="h-8 w-10 rounded border border-gray-200 cursor-pointer p-0.5" aria-label="Edit color" />
        <button type="submit" disabled={update.isPending} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">Save</button>
        <button type="button" onClick={onDone} className="text-xs text-gray-400 hover:text-gray-600 px-1">Cancel</button>
      </form>
    )
  }

  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
      <span className="flex-1 text-sm text-gray-800 font-medium">{category.name}</span>
      {category.default_budget > 0 && (
        <span className="text-xs text-gray-400">{mxn.format(category.default_budget)}/period</span>
      )}
      <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" aria-label={`Edit ${category.name}`}><FiEdit2 size={14} /></button>
      <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" aria-label={`Delete ${category.name}`}><FiTrash2 size={14} /></button>
    </div>
  )
}

function CardsSection() {
  const qc = useQueryClient()
  const { data: cards = [] } = useQuery({ queryKey: ['cards'], queryFn: api.cards.list })
  const [editingId, setEditingId] = useState<number | null>(null)

  const { register, handleSubmit, reset } = useForm<{ name: string; card_type: 'debit' | 'credit' }>({
    defaultValues: { name: '', card_type: 'credit' },
  })

  const create = useMutation({
    mutationFn: (d: { name: string; card_type: 'debit' | 'credit' }) => api.cards.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cards'] }); reset() },
  })

  const del = useMutation({
    mutationFn: api.cards.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cards'] }),
  })

  return (
    <Section title="Payment Cards" description="Manage your payment methods">
      <form onSubmit={handleSubmit((d) => create.mutate(d))} className="flex flex-wrap gap-2 mb-4">
        <input
          {...register('name', { required: true })}
          placeholder="Card name (e.g. Nu, Invex)"
          className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="New card name"
        />
        <select
          {...register('card_type')}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Card type"
        >
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
        </select>
        <button
          type="submit"
          disabled={create.isPending}
          className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {create.isPending ? '...' : 'Add'}
        </button>
      </form>

      <div className="divide-y divide-gray-100">
        {cards.map((card) => (
          <CardRow
            key={card.id}
            card={card}
            isEditing={editingId === card.id}
            onEdit={() => setEditingId(card.id)}
            onDone={() => setEditingId(null)}
            onDelete={() => confirm(`Delete card "${card.name}"?`) && del.mutate(card.id)}
          />
        ))}
        {cards.length === 0 && (
          <p className="text-sm text-gray-400 py-4 text-center">No payment cards yet</p>
        )}
      </div>
    </Section>
  )
}

const cardTypeIcon = { debit: '🏦', credit: '💳' }
const cardTypeLabel = { debit: 'Debit', credit: 'Credit' }

function CardRow({ card, isEditing, onEdit, onDone, onDelete }: {
  card: Card; isEditing: boolean; onEdit: () => void; onDone: () => void; onDelete: () => void
}) {
  const qc = useQueryClient()
  const { register, handleSubmit } = useForm({
    defaultValues: { name: card.name, card_type: card.card_type },
  })

  const update = useMutation({
    mutationFn: (d: { name: string; card_type: 'debit' | 'credit' }) => api.cards.update(card.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cards'] }); onDone() },
  })

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit((d) => update.mutate(d))} className="flex gap-2 py-2.5 items-center flex-wrap">
        <input
          {...register('name', { required: true })}
          className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Edit card name"
        />
        <select
          {...register('card_type')}
          className="border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Edit card type"
        >
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
        </select>
        <button type="submit" disabled={update.isPending} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">Save</button>
        <button type="button" onClick={onDone} className="text-xs text-gray-400 hover:text-gray-600 px-1">Cancel</button>
      </form>
    )
  }

  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="text-sm" aria-hidden="true">{cardTypeIcon[card.card_type]}</span>
      <span className="flex-1 text-sm text-gray-800 font-medium">{card.name}</span>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${card.card_type === 'debit' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
        {cardTypeLabel[card.card_type]}
      </span>
      <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" aria-label={`Edit ${card.name}`}><FiEdit2 size={14} /></button>
      <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" aria-label={`Delete ${card.name}`}><FiTrash2 size={14} /></button>
    </div>
  )
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-bold text-gray-800 text-base">{title}</h3>
      <p className="text-xs text-gray-400 mb-4 mt-0.5">{description}</p>
      {children}
    </div>
  )
}
