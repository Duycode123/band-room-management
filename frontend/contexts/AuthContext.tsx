'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getSessionRole, logoutSession, type UserRole } from '@/lib/auth'

interface AuthUser {
  role: UserRole
}

interface AuthContextType {
  user: AuthUser | null
  login: (role: UserRole) => void
  logout: () => Promise<void>
  isAuthenticated: boolean
  isLoading: boolean
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    setIsLoading(true)
    try {
      const role = await getSessionRole()
      setUser({ role })
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  const login = (role: UserRole) => {
    setUser({ role })
    setIsLoading(false)
  }

  const logout = async () => {
    try {
      await logoutSession()
    } finally {
      setUser(null)
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
