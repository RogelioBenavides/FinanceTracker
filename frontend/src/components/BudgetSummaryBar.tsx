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

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <div className="flex flex-wrap gap-6 mb-4">
        <Stat label="Budget"    value={totalBudget}    color="text-gray-800" />
        <Stat label="Paid"      value={totalPaid}      color="text-green-600" />
        <Stat label="Pending"   value={totalPending}   color="text-amber-600" />
        <Stat label="Not Paid"  value={totalNotPaid}   color="text-red-600" />
        <Stat label="Available" value={totalAvailable} color="text-gray-500" />
      </div>

      <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
        <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${paidPct}%` }} />
        <div className="bg-amber-400 h-full transition-all duration-500" style={{ width: `${pendPct}%` }} />
        <div className="bg-red-500   h-full transition-all duration-500" style={{ width: `${notPaidPct}%` }} />
      </div>

      <div className="flex gap-4 mt-2 text-xs text-gray-500">
        <Legend color="bg-green-500" label="Paid" />
        <Legend color="bg-amber-400" label="Pending" />
        <Legend color="bg-red-500"   label="Not Paid" />
        <Legend color="bg-gray-200"  label="Available" />
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{fmt.format(value)}</p>
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
