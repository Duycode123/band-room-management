'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER'

interface AuthUser {
  accessToken: string
  refreshToken: string
  role: UserRole
}

interface AuthContextType {
  user: AuthUser | null
  login: (data: AuthUser) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')
    const role = localStorage.getItem('role') as UserRole | null

    if (accessToken && refreshToken && role) {
      setUser({ accessToken, refreshToken, role })
    }
  }, [])

  const login = (data: AuthUser) => {
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('role', data.role)
    setUser(data)
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
