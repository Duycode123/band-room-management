'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { logoutSession, restoreSession, type AuthUser } from '@/lib/auth'
import { clearStoredCustomerProfile } from '@/lib/customer-profile-service'

interface AuthContextType {
  user: AuthUser | null
  login: (user: AuthUser) => void
  logout: (redirectTo?: string) => Promise<void>
  isAuthenticated: boolean
  isLoading: boolean
  isLoggingOut: boolean
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

function clearClientUserCaches() {
  if (typeof window === 'undefined') return

  const keys = ['user', 'currentUser', 'profile', 'avatarUrl', 'accessToken', 'refreshToken']
  keys.forEach((key) => window.localStorage.removeItem(key))
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const refreshSession = useCallback(async () => {
    setIsLoading(true)
    try {
      const sessionUser = await restoreSession()
      setUser(sessionUser)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  const login = (sessionUser: AuthUser) => {
    setUser(sessionUser)
    setIsLoading(false)
    setIsLoggingOut(false)
  }

  const logout = async (redirectTo?: string) => {
    setIsLoggingOut(true)
    try {
      await logoutSession()
    } finally {
      clearStoredCustomerProfile()
      clearClientUserCaches()
      setUser(null)
      setIsLoading(false)

      if (redirectTo && typeof window !== 'undefined') {
        window.location.assign(redirectTo)
        return
      }

      window.setTimeout(() => setIsLoggingOut(false), 500)
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user, isLoading, isLoggingOut, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
