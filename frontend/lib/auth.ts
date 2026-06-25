import api from '@/lib/api'

export type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER'

export type AuthUser = {
  role: UserRole
  name?: string
  fullName?: string
  email?: string
  avatarUrl?: string
}

export const loginSession = async (email: string, password: string) => {
  const response = await api.post<AuthUser>('/api/auth/login', { email, password })
  return response.data
}

export const getSessionRole = async () => {
  const response = await api.get<AuthUser>('/api/auth/session')
  return response.data
}

export const logoutSession = async () => {
  try {
    await api.post('/api/auth/logout')
  } catch {
    // The UI still clears local auth state and returns to the homepage if the API is temporarily unavailable.
  }
}
