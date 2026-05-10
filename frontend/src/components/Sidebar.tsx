import { NavLink } from 'react-router-dom'
import PeriodSelector from './PeriodSelector.tsx'
import type { usePeriod } from '../hooks/usePeriod.ts'

interface Props {
  periodState: ReturnType<typeof usePeriod>
}

const navLinks = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/transactions', label: 'Transactions', icon: '💳', end: false },
  { to: '/budget', label: 'Budget', icon: '📋', end: false },
  { to: '/settings', label: 'Settings', icon: '⚙️', end: false },
]

export default function Sidebar({ periodState }: Props) {
  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-800">Finance Tracker</h1>
        <p className="text-xs text-gray-400 mt-0.5">Personal budget</p>
      </div>

      <div className="p-4 border-b border-gray-100">
        <PeriodSelector {...periodState} />
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navLinks.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <span aria-hidden="true">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
