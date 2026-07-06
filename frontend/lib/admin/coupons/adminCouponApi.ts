import axios from 'axios'
import api from '@/lib/api'
import type {
  AdminCoupon,
  CouponDiscountType,
  CouponFilters,
  CouponFormData,
  CouponFormErrors,
  CouponLifecycle,
} from './types'

type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

type ApiErrorResponse = {
  message?: string
  data?: unknown
}

type BackendCoupon = {
  id: number
  code: string
  type: CouponDiscountType
  value: number | string
  minOrderValue: number | string | null
  expiresAt: string | null
}

type CouponPayload = {
  code: string
  type: CouponDiscountType
  value: number
  minOrderValue: number | null
  expiresAt: string | null
}

export const COUPON_TYPE_LABELS: Record<CouponDiscountType, string> = {
  PERCENTAGE: 'Phan tram',
  FIXED_AMOUNT: 'So tien co dinh',
}

export const COUPON_LIFECYCLE_LABELS: Record<CouponLifecycle, string> = {
  ACTIVE: 'Dang hieu luc',
  EXPIRED: 'Da het han',
  NO_EXPIRY: 'Khong het han',
}

export const EMPTY_COUPON_FORM: CouponFormData = {
  code: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  minOrderValue: '',
  expiresAt: '',
}

function parseAmount(value: number | string | null | undefined) {
  const normalized = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(normalized) ? Number(normalized) : 0
}

function localDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function getCouponLifecycle(expiresAt: string | null, now: Date = new Date()): CouponLifecycle {
  if (!expiresAt) {
    return 'NO_EXPIRY'
  }

  return expiresAt < localDateKey(now) ? 'EXPIRED' : 'ACTIVE'
}

function normalizeText(value?: string | null) {
  return value?.trim() || ''
}

function firstValidationMessage(data: unknown) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return null
  }

  const firstValue = Object.values(data)[0]
  return typeof firstValue === 'string' ? firstValue : null
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return (
      firstValidationMessage(error.response?.data?.data) ||
      error.response?.data?.message ||
      fallback
    )
  }

  return fallback
}

function mapBackendCoupon(item: BackendCoupon): AdminCoupon {
  return {
    couponId: item.id,
    code: normalizeText(item.code),
    discountType: item.type,
    discountValue: parseAmount(item.value),
    minOrderValue: item.minOrderValue === null ? null : parseAmount(item.minOrderValue),
    expiresAt: item.expiresAt || null,
    lifecycle: getCouponLifecycle(item.expiresAt || null),
  }
}

function toBackendPayload(data: CouponFormData): CouponPayload {
  const minOrderValue = data.minOrderValue.trim()
  const expiresAt = data.expiresAt.trim()

  return {
    code: data.code.trim().toUpperCase(),
    type: data.discountType,
    value: Number(data.discountValue),
    minOrderValue: minOrderValue ? Number(minOrderValue) : null,
    expiresAt: expiresAt || null,
  }
}

function compareNumber(first: number | null, second: number | null) {
  return (first ?? -1) - (second ?? -1)
}

function applyClientFilters(items: AdminCoupon[], filters: CouponFilters) {
  const query = filters.query.trim().toLowerCase()

  return items
    .filter((item) => {
      if (query && !item.code.toLowerCase().includes(query) && !String(item.couponId).includes(query)) {
        return false
      }

      if (filters.discountType !== 'ALL' && item.discountType !== filters.discountType) {
        return false
      }

      if (filters.lifecycle !== 'ALL' && item.lifecycle !== filters.lifecycle) {
        return false
      }

      return true
    })
    .sort((firstItem, secondItem) => {
      let compareValue = 0

      if (filters.sortBy === 'value') {
        compareValue = firstItem.discountValue - secondItem.discountValue
      } else if (filters.sortBy === 'minOrderValue') {
        compareValue = compareNumber(firstItem.minOrderValue, secondItem.minOrderValue)
      } else if (filters.sortBy === 'expiresAt') {
        compareValue = (firstItem.expiresAt ?? '9999-12-31').localeCompare(secondItem.expiresAt ?? '9999-12-31')
      } else {
        compareValue = firstItem.code.localeCompare(secondItem.code, 'vi')
      }

      if (compareValue !== 0) {
        return filters.sortOrder === 'asc' ? compareValue : -compareValue
      }

      const tieBreaker = firstItem.couponId - secondItem.couponId
      return filters.sortOrder === 'asc' ? tieBreaker : -tieBreaker
    })
}

export function validateCouponForm(data: CouponFormData): CouponFormErrors {
  const errors: CouponFormErrors = {}
  const code = data.code.trim()
  const discountValue = Number(data.discountValue)
  const minOrderValue = data.minOrderValue.trim() ? Number(data.minOrderValue) : null

  if (!code) {
    errors.code = 'Vui long nhap ma coupon.'
  } else if (code.length > 50) {
    errors.code = 'Ma coupon toi da 50 ky tu.'
  }

  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    errors.discountValue = 'Gia tri coupon phai lon hon 0.'
  } else if (data.discountType === 'PERCENTAGE' && discountValue > 100) {
    errors.discountValue = 'Coupon phan tram khong duoc lon hon 100.'
  }

  if (minOrderValue !== null && (!Number.isFinite(minOrderValue) || minOrderValue < 0)) {
    errors.minOrderValue = 'Gia tri don toi thieu khong duoc am.'
  }

  return errors
}

export async function fetchAdminCoupons(filters: CouponFilters): Promise<AdminCoupon[]> {
  try {
    const response = await api.get<ApiResponse<BackendCoupon[]>>('/api/admin/coupons')
    return applyClientFilters((response.data.data ?? []).map(mapBackendCoupon), filters)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Khong the tai danh sach coupon.'))
  }
}

export async function createAdminCoupon(data: CouponFormData): Promise<AdminCoupon> {
  const errors = validateCouponForm(data)
  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors)[0] || 'Du lieu coupon khong hop le.')
  }

  try {
    const response = await api.post<ApiResponse<BackendCoupon>>('/api/admin/coupons', toBackendPayload(data))
    return mapBackendCoupon(response.data.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Khong the tao coupon.'))
  }
}

export async function updateAdminCoupon(
  id: number,
  data: CouponFormData,
): Promise<AdminCoupon | null> {
  const errors = validateCouponForm(data)
  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors)[0] || 'Du lieu coupon khong hop le.')
  }

  try {
    const response = await api.put<ApiResponse<BackendCoupon>>(`/api/admin/coupons/${id}`, toBackendPayload(data))
    return mapBackendCoupon(response.data.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Khong the cap nhat coupon.'))
  }
}

export async function deleteAdminCoupon(id: number): Promise<void> {
  try {
    await api.delete(`/api/admin/coupons/${id}`)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Khong the xoa coupon.'))
  }
}

export function toCouponFormData(coupon: AdminCoupon): CouponFormData {
  return {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: String(coupon.discountValue),
    minOrderValue: coupon.minOrderValue === null ? '' : String(coupon.minOrderValue),
    expiresAt: coupon.expiresAt ?? '',
  }
}

export function formatCouponMoney(amount: number | null) {
  if (amount === null) {
    return 'Khong yeu cau'
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCouponValue(coupon: Pick<AdminCoupon, 'discountType' | 'discountValue'>) {
  if (coupon.discountType === 'PERCENTAGE') {
    return `${coupon.discountValue}%`
  }

  return formatCouponMoney(coupon.discountValue)
}

export function formatCouponDate(value: string | null) {
  if (!value) {
    return 'Khong het han'
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}
