import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import Sidebar from './components/Sidebar.tsx'
import Dashboard from './pages/Dashboard.tsx'
import Transactions from './pages/Transactions.tsx'
import Budget from './pages/Budget.tsx'
import Settings from './pages/Settings.tsx'
import Login from './pages/Login.tsx'
import { usePeriod } from './hooks/usePeriod.ts'
import { AuthProvider, useAuth } from './hooks/useAuth.tsx'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

function AppShell() {
  const { isAuthenticated } = useAuth()
  const periodState = usePeriod()
  const [menuOpen, setMenuOpen] = useState(false)

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <Sidebar
        periodState={periodState}
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0">
          <button
            onClick={() => setMenuOpen(true)}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="font-bold text-gray-800 text-base">Finance Tracker</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Routes>
            <Route path="/" element={<Dashboard periodState={periodState} />} />
            <Route path="/transactions" element={<Transactions periodState={periodState} />} />
            <Route path="/budget" element={<Budget periodState={periodState} />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}
