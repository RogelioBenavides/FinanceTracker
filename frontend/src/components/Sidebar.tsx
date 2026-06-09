import { NavLink } from 'react-router-dom'
import { FiGrid, FiCreditCard, FiClipboard, FiSettings, FiLogOut, FiTrendingUp } from 'react-icons/fi'
import type { IconType } from 'react-icons'
import PeriodSelector from './PeriodSelector.tsx'
import { useAuth } from '../hooks/useAuth.tsx'
import type { usePeriod } from '../hooks/usePeriod.ts'

interface Props {
  periodState: ReturnType<typeof usePeriod>
  isOpen: boolean
  onClose: () => void
}

const navLinks: { to: string; label: string; icon: IconType; end: boolean }[] = [
  { to: '/', label: 'Dashboard', icon: FiGrid, end: true },
  { to: '/transactions', label: 'Transactions', icon: FiCreditCard, end: false },
  { to: '/budget', label: 'Budget', icon: FiClipboard, end: false },
  { to: '/settings', label: 'Settings', icon: FiSettings, end: false },
]

export default function Sidebar({ periodState, isOpen, onClose }: Props) {
  const { user, logout } = useAuth()

  return (
    <aside className={[
      'w-64 md:w-60 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 flex flex-col flex-shrink-0',
      'fixed inset-y-0 left-0 z-40 transition-transform duration-200 ease-in-out',
      'md:static md:translate-x-0',
      isOpen ? 'translate-x-0' : '-translate-x-full',
    ].join(' ')}>
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-sky-500 text-slate-950 shadow-lg shadow-emerald-500/20 flex-shrink-0">
            <FiTrendingUp size={18} strokeWidth={2.5} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-slate-100 tracking-tight leading-tight">
              Finance<span className="text-emerald-400">Tracker</span>
            </h1>
            <p className="text-[11px] text-slate-500 leading-tight">Personal budget</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          aria-label="Close menu"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="p-4 border-b border-slate-800/70">
        <PeriodSelector {...periodState} />
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navLinks.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-300'
                  : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-emerald-400 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />
                <Icon size={18} className="flex-shrink-0" aria-hidden="true" />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl">
            {user.picture
              ? <img src={user.picture} alt="" className="w-8 h-8 rounded-full flex-shrink-0 ring-1 ring-slate-700" referrerPolicy="no-referrer" />
              : <span className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 text-slate-950 text-xs font-bold flex items-center justify-center flex-shrink-0">{user.name[0]?.toUpperCase()}</span>
            }
            <span className="text-xs text-slate-300 font-medium truncate flex-1 min-w-0">{user.name}</span>
            <button
              onClick={logout}
              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
              aria-label="Sign out"
              title="Sign out"
            >
              <FiLogOut size={15} />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
