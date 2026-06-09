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

  return (
    <div className={`group bg-slate-900/60 rounded-2xl border p-4 flex flex-col gap-3 transition-colors hover:bg-slate-900/90 ${isOver ? 'border-rose-500/40' : 'border-slate-800 hover:border-slate-700'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white/10" style={{ backgroundColor: category_color }} aria-hidden="true" />
          <span className="text-sm font-semibold text-slate-100 truncate">{category_name}</span>
        </div>
        {isOver && (
          <span className="text-[11px] bg-rose-500/15 text-rose-400 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">Over</span>
        )}
      </div>

      <div className="space-y-1 text-xs">
        <Row label="Budget"    value={fmt.format(budget)} valueClass="text-slate-300 font-medium" />
        {paid > 0     && <Row label="Paid"     value={fmt.format(paid)}     valueClass="text-emerald-400 font-medium" />}
        {pending > 0  && <Row label="Pending"  value={fmt.format(pending)}  valueClass="text-amber-400 font-medium" />}
        {not_paid > 0 && <Row label="Not Paid" value={fmt.format(not_paid)} valueClass="text-rose-400 font-medium" />}
        <Row label="Available" value={fmt.format(available)} valueClass={`font-semibold ${isOver ? 'text-rose-400' : 'text-sky-400'}`} />
      </div>

      {/* Stacked progress bar: emerald=paid, amber=pending, rose=not_paid */}
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
        <div className="bg-emerald-500 h-full transition-all" style={{ width: `${paidPct}%` }} />
        <div className="bg-amber-400 h-full transition-all" style={{ width: `${pendPct}%` }} />
        <div className="bg-rose-500  h-full transition-all" style={{ width: `${npPct}%` }} />
      </div>
    </div>
  )
}

function Row({ label, value, valueClass = 'text-slate-400' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between text-slate-500">
      <span>{label}</span>
      <span className={`tnum ${valueClass}`}>{value}</span>
    </div>
  )
}
