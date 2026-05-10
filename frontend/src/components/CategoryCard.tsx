import type { CategorySummary } from '../types/index.ts'

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })

interface Props {
  summary: CategorySummary
}

export default function CategoryCard({ summary }: Props) {
  const { category_name, category_color, budget, paid, pending, not_paid, available } = summary
  const paidPct  = budget > 0 ? Math.min((paid / budget) * 100, 100) : 0
  const pendPct  = budget > 0 ? Math.min((pending / budget) * 100, 100 - paidPct) : 0
  const npPct    = budget > 0 ? Math.min((not_paid / budget) * 100, 100 - paidPct - pendPct) : 0
  const isOver   = available < 0
  const borderColor = isOver ? 'border-red-200' : 'border-gray-200'

  return (
    <div className={`bg-white rounded-xl border ${borderColor} p-4 flex flex-col gap-3`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: category_color }} aria-hidden="true" />
          <span className="text-sm font-semibold text-gray-800 truncate">{category_name}</span>
        </div>
        {isOver && (
          <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium flex-shrink-0">Over</span>
        )}
      </div>

      <div className="space-y-1 text-xs">
        <Row label="Budget"    value={fmt.format(budget)} />
        {paid > 0     && <Row label="Paid"     value={fmt.format(paid)}     valueClass="text-green-600 font-medium" />}
        {pending > 0  && <Row label="Pending"  value={fmt.format(pending)}  valueClass="text-amber-600 font-medium" />}
        {not_paid > 0 && <Row label="Not Paid" value={fmt.format(not_paid)} valueClass="text-red-600 font-medium" />}
        <Row label="Available" value={fmt.format(available)} valueClass={`font-semibold ${isOver ? 'text-red-600' : 'text-gray-500'}`} />
      </div>

      {/* Stacked progress bar: green=paid, orange=pending, red=not_paid */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
        <div className="bg-green-500 h-full transition-all" style={{ width: `${paidPct}%` }} />
        <div className="bg-amber-400 h-full transition-all" style={{ width: `${pendPct}%` }} />
        <div className="bg-red-500  h-full transition-all" style={{ width: `${npPct}%` }} />
      </div>
    </div>
  )
}

function Row({ label, value, valueClass = 'text-gray-500' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between text-gray-500">
      <span>{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  )
}
