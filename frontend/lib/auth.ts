import api from '@/lib/api'

export const logoutSession = async () => {
  try {
    await api.post('/api/auth/logout')
  } catch {
    // The UI still returns to login if the API is temporarily unavailable.
  }
}
