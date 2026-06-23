'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER'

interface AuthGuardProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
}

export default function AuthGuard({ allowedRoles, children }: AuthGuardProps) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    let active = true

    api.get<{ role: UserRole }>('/api/auth/session')
      .then(({ data }) => {
        if (!active) return
        if (!allowedRoles.includes(data.role)) {
          router.replace('/unauthorized')
          return
        }
        setAuthorized(true)
      })
      .catch(() => {
        if (active) router.replace('/login')
      })

    return () => {
      active = false
    }
  }, [allowedRoles, router])

  return authorized ? <>{children}</> : null
}
