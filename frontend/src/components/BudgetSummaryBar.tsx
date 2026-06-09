const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })

interface Props {
  totalBudget: number
  totalPaid: number
  totalPending: number
  totalNotPaid: number
  totalAvailable: number
}

export default function BudgetSummaryBar({ totalBudget, totalPaid, totalPending, totalNotPaid, totalAvailable }: Props) {
  const paidPct    = totalBudget > 0 ? Math.min((totalPaid / totalBudget) * 100, 100) : 0
  const pendPct    = totalBudget > 0 ? Math.min((totalPending / totalBudget) * 100, 100 - paidPct) : 0
  const notPaidPct = totalBudget > 0 ? Math.min((totalNotPaid / totalBudget) * 100, 100 - paidPct - pendPct) : 0
  const isOver = totalAvailable < 0

  return (
    <div className="bg-slate-900/60 backdrop-blur rounded-2xl border border-slate-800 p-5 sm:p-6 mb-6 shadow-xl shadow-black/20">
      <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-4 sm:gap-8 mb-5">
        <Stat label="Budget"    value={totalBudget}    color="text-slate-100" />
        <Stat label="Paid"      value={totalPaid}      color="text-emerald-400" />
        <Stat label="Pending"   value={totalPending}   color="text-amber-400" />
        <Stat label="Not Paid"  value={totalNotPaid}   color="text-rose-400" />
        <Stat label="Available" value={totalAvailable} color={isOver ? 'text-rose-400' : 'text-sky-400'} />
      </div>

      <div className="h-3 bg-slate-800 rounded-full overflow-hidden flex ring-1 ring-inset ring-white/5">
        <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${paidPct}%` }} />
        <div className="bg-amber-400 h-full transition-all duration-500" style={{ width: `${pendPct}%` }} />
        <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${notPaidPct}%` }} />
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs text-slate-400">
        <Legend color="bg-emerald-500" label="Paid" />
        <Legend color="bg-amber-400" label="Pending" />
        <Legend color="bg-rose-500"   label="Not Paid" />
        <Legend color="bg-slate-700"  label="Available" />
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className={`text-lg sm:text-2xl font-bold tnum ${color}`}>{fmt.format(value)}</p>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
      {label}
    </span>
  )
}
