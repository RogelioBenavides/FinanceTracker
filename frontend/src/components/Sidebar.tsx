import { NavLink } from 'react-router-dom'
import PeriodSelector from './PeriodSelector.tsx'
import { useAuth } from '../hooks/useAuth.tsx'
import type { usePeriod } from '../hooks/usePeriod.ts'

interface Props {
  periodState: ReturnType<typeof usePeriod>
  isOpen: boolean
  onClose: () => void
}

const navLinks = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/transactions', label: 'Transactions', icon: '💳', end: false },
  { to: '/budget', label: 'Budget', icon: '📋', end: false },
  { to: '/settings', label: 'Settings', icon: '⚙️', end: false },
]

export default function Sidebar({ periodState, isOpen, onClose }: Props) {
  const { user, logout } = useAuth()

  return (
    <aside className={[
      'w-64 md:w-56 bg-white border-r border-gray-200 flex flex-col flex-shrink-0',
      'fixed inset-y-0 left-0 z-40 transition-transform duration-200 ease-in-out',
      'md:static md:translate-x-0',
      isOpen ? 'translate-x-0' : '-translate-x-full',
    ].join(' ')}>
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Finance Tracker</h1>
          <p className="text-xs text-gray-400 mt-0.5">Personal budget</p>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
          aria-label="Close menu"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
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
            onClick={onClose}
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

      {user && (
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5 px-2 py-2">
            {user.picture
              ? <img src={user.picture} alt="" className="w-7 h-7 rounded-full flex-shrink-0" referrerPolicy="no-referrer" />
              : <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{user.name[0]?.toUpperCase()}</span>
            }
            <span className="text-xs text-gray-600 font-medium truncate flex-1 min-w-0">{user.name}</span>
            <button
              onClick={logout}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
              aria-label="Sign out"
              title="Sign out"
            >
              ↪
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
