import axios from 'axios'

const REFRESH_PATH = '/api/auth/refresh'
const AUTH_PATH_PREFIX = '/api/auth/'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  withCredentials: true,
})

let refreshPromise: Promise<void> | null = null

function isAuthFlowRequest(url?: string) {
  if (!url) return false
  return url.includes(AUTH_PATH_PREFIX) && !url.includes('/session')
}

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = api.post(REFRESH_PATH).then(() => undefined).finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const response = error.response
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined

    if (!response || response.status !== 401 || !originalRequest) {
      return Promise.reject(error)
    }

    if (originalRequest._retry || isAuthFlowRequest(originalRequest.url) || originalRequest.url?.includes(REFRESH_PATH)) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      await refreshSession()
      return api(originalRequest)
    } catch {
      return Promise.reject(error)
    }
  },
)

export default api
