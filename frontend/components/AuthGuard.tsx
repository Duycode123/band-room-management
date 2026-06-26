'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER'

interface AuthGuardProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
}

export default function AuthGuard({ allowedRoles, children }: AuthGuardProps) {
  const router = useRouter()
  const { user, isLoading, isLoggingOut } = useAuth()

  useEffect(() => {
    if (isLoading || isLoggingOut) return

    if (!user) {
      router.replace('/login')
      return
    }
    if (!allowedRoles.includes(user.role)) {
      router.replace('/unauthorized')
    }
  }, [user, allowedRoles, isLoading, isLoggingOut, router])

  if (isLoading || isLoggingOut || !user) return null

  const authorized = allowedRoles.includes(user.role)
  return authorized ? <>{children}</> : null
}
