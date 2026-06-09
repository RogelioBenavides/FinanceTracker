import type { Period } from '../types/index.ts'

interface Props {
  periods: Period[]
  periodId: number | null
  setPeriodId: (id: number) => void
}

export default function PeriodSelector({ periods, periodId, setPeriodId }: Props) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Period</label>
      {periods.length > 0 ? (
        <select
          value={periodId ?? ''}
          onChange={(e) => setPeriodId(parseInt(e.target.value))}
          className="w-full text-sm border border-slate-700 rounded-lg px-3 py-2 bg-slate-800/60 text-slate-100 cursor-pointer transition-colors hover:border-slate-600 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
          aria-label="Select period"
        >
          {periods.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      ) : (
        <p className="text-xs text-slate-500">No periods — add in Settings</p>
      )}
    </div>
  )
}
