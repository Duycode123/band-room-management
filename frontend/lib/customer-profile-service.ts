import type { AuthUser } from '@/lib/auth'

export type CustomerProfile = {
  fullName: string
  email: string
  phone: string
  role: 'CUSTOMER'
}

export type UpdateCustomerProfilePayload = {
  fullName: string
  email: string
  phone: string
}

export type ChangeCustomerPasswordPayload = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

function waitForMockApi(delay = 260) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, delay))
}

export function getInitials(name?: string, email?: string) {
  const source = name?.trim() || email?.trim() || 'K'
  return source.charAt(0).toUpperCase()
}

export function getCustomerDisplayName(user?: AuthUser | null) {
  return user?.fullName || user?.name || user?.email || 'Khách hàng'
}

export async function fetchCurrentUser(user?: AuthUser | null): Promise<CustomerProfile> {
  // Replace this mock with GET /api/users/me when the backend endpoint is ready.
  await waitForMockApi()

  return {
    fullName: user?.fullName || user?.name || 'Khách hàng',
    email: user?.email || '',
    phone: '',
    role: 'CUSTOMER',
  }
}

export async function updateCustomerProfile(payload: UpdateCustomerProfilePayload): Promise<CustomerProfile> {
  // Replace this mock with PATCH /api/users/me when the backend endpoint is ready.
  await waitForMockApi()

  return {
    ...payload,
    role: 'CUSTOMER',
  }
}

export async function changeCustomerPassword(_payload: ChangeCustomerPasswordPayload): Promise<void> {
  // Replace this mock with POST /api/users/me/change-password when the backend endpoint is ready.
  await waitForMockApi()
}
