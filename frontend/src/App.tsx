import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar.tsx'
import Dashboard from './pages/Dashboard.tsx'
import Transactions from './pages/Transactions.tsx'
import Budget from './pages/Budget.tsx'
import Settings from './pages/Settings.tsx'
import { usePeriod } from './hooks/usePeriod.ts'

export default function App() {
  const periodState = usePeriod()

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar periodState={periodState} />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard periodState={periodState} />} />
            <Route path="/transactions" element={<Transactions periodState={periodState} />} />
            <Route path="/budget" element={<Budget periodState={periodState} />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
