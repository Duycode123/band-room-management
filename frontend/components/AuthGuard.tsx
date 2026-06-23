'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER'

interface AuthGuardProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
}

export default function AuthGuard({ allowedRoles, children }: AuthGuardProps) {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      router.replace('/login')
      return
    }
    if (!allowedRoles.includes(user.role)) {
      router.replace('/unauthorized')
    }
  }, [user, allowedRoles, router])

  return authorized ? <>{children}</> : null
}
