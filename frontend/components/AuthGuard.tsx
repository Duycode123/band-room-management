'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER'

interface AuthGuardProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
}

export default function AuthGuard({ allowedRoles, children }: AuthGuardProps) {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const role = localStorage.getItem('role') as UserRole | null

    if (!token) {
      router.replace('/login')
      return
    }

    if (role && !allowedRoles.includes(role)) {
      router.replace('/unauthorized')
    }
  }, [allowedRoles, router])

  return <>{children}</>
}
