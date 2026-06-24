import api from '@/lib/api'

export type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER'

type AuthSessionResponse = {
  role: UserRole
}

export const loginSession = async (email: string, password: string) => {
  const response = await api.post<AuthSessionResponse>('/api/auth/login', { email, password })
  return response.data.role
}

export const getSessionRole = async () => {
  const response = await api.get<AuthSessionResponse>('/api/auth/session')
  return response.data.role
}

export const logoutSession = async () => {
  try {
    await api.post('/api/auth/logout')
  } catch {
    // The UI still returns to login if the API is temporarily unavailable.
  }
}
