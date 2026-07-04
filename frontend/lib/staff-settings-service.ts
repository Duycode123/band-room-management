import axios from 'axios'
import api from '@/lib/api'
import { logoutSession, normalizeAuthUser, type AuthUser, type UserRole } from '@/lib/auth'

export type StaffProfile = {
  id?: string | number
  fullName: string
  email: string
  phone: string
  avatarUrl?: string
  role: UserRole
}

export type UpdateStaffProfilePayload = {
  fullName: string
  email: string
  phone: string
}

export type ChangeStaffPasswordPayload = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

type ApiErrorResponse = {
  message?: string
  data?: unknown
}

function containsRawServerError(message: string) {
  const normalizedMessage = message.toLowerCase()
  return [
    'preparedstatementcallback',
    'sqlexception',
    'sql state',
    'insert into',
    'on conflict',
    'current transaction is aborted',
    'commands ignored until end of transaction block',
    'org.springframework',
  ].some((pattern) => normalizedMessage.includes(pattern))
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const message = error.response?.data?.message
    if (!message || containsRawServerError(message)) return fallback
    return message
  }

  return fallback
}

function normalizeProfile(data: Partial<StaffProfile & AuthUser>, fallback?: AuthUser | null): StaffProfile {
  const normalizedUser = normalizeAuthUser(data, fallback)
  const email = data.email || fallback?.email || ''
  const displayName = data.fullName || data.name || fallback?.fullName || fallback?.name || (email.includes('@') ? email.split('@')[0] : email)

  return {
    id: data.id || fallback?.id,
    fullName: displayName || 'Nhân viên',
    email,
    phone: data.phone || fallback?.phone || '',
    avatarUrl: data.avatarUrl || fallback?.avatarUrl,
    role: normalizedUser.role,
  }
}

export async function getCurrentUser(fallback?: AuthUser | null) {
  try {
    const response = await api.get<Partial<StaffProfile & AuthUser>>('/api/users/me')
    return normalizeProfile(response.data, fallback)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể tải hồ sơ nhân viên. Vui lòng thử lại.'))
  }
}

export async function updateMyProfile(payload: UpdateStaffProfilePayload) {
  try {
    const response = await api.patch<Partial<StaffProfile & AuthUser>>('/api/users/me', payload)
    return normalizeProfile(response.data, {
      role: 'STAFF',
      fullName: payload.fullName,
      name: payload.fullName,
      email: payload.email,
      phone: payload.phone,
    })
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể lưu hồ sơ nhân viên. Vui lòng thử lại.'))
  }
}

export async function uploadMyAvatar(file: File, fallback?: AuthUser | null) {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post<Partial<StaffProfile & AuthUser>>('/api/users/me/avatar', formData)
    return normalizeProfile(response.data, fallback)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Khong the tai anh dai dien len. Vui long thu lai.'))
  }
}

export async function getNotificationSettings() {
  try {
    const response = await api.get<StaffNotificationSettings>('/api/users/me/notification-settings')
    return { ...defaultNotificationSettings, ...response.data }
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể tải tùy chọn thông báo. Vui lòng thử lại.'))
  }
}

export async function updateNotificationSettings(settings: StaffNotificationSettings) {
  try {
    const response = await api.put<StaffNotificationSettings>('/api/users/me/notification-settings', settings)
    return { ...defaultNotificationSettings, ...response.data }
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể lưu cài đặt. Vui lòng thử lại.'))
  }
}

export async function changePassword(payload: ChangeStaffPasswordPayload) {
  try {
    await api.put('/api/users/me/password', payload)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể cập nhật mật khẩu. Vui lòng thử lại.'))
  }
}

export async function logout() {
  await logoutSession()
}
