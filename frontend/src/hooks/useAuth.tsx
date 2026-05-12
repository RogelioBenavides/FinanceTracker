import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '../types/index.ts'

const TOKEN_KEY = 'ft_token'
const USER_KEY = 'ft_user'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    const stored = localStorage.getItem(USER_KEY)
    if (token && stored) {
      try { setUser(JSON.parse(stored)) } catch { /* ignore */ }
    }
    setReady(true)
  }, [])

  const login = (token: string, u: User) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    setUser(u)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  if (!ready) return null

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
