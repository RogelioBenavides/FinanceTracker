import type { Period } from '../types/index.ts'

interface Props {
  periods: Period[]
  periodId: number | null
  setPeriodId: (id: number) => void
}

export default function PeriodSelector({ periods, periodId, setPeriodId }: Props) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Period</label>
      {periods.length > 0 ? (
        <select
          value={periodId ?? ''}
          onChange={(e) => setPeriodId(parseInt(e.target.value))}
          className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Select period"
        >
          {periods.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      ) : (
        <p className="text-xs text-gray-400">No periods — add in Settings</p>
      )}
    </div>
  )
}
