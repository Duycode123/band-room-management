import axios from 'axios'
import api from '@/lib/api'
import type { AdminBooking, BookingFilters, BookingStatus, PaymentStatus } from './types'

type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

type BackendPaymentMethod = 'CASH' | 'ONLINE'

type BackendBooking = {
  bookingId: number
  bookingCode?: string | null
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  roomId?: number | null
  roomName?: string | null
  typeName?: string | null
  startTime: string
  endTime: string
  totalHours?: number | string | null
  totalAmount?: number | string | null
  status: BookingStatus
  paymentMethod?: BackendPaymentMethod | null
  note?: string | null
  equipmentNotes?: string | null
}

type ApiErrorResponse = {
  message?: string
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || fallback
  }

  return fallback
}

function normalizeText(value?: string | null) {
  return value?.trim() || ''
}

function toDateKey(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const pad = (value: number) => value.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseNumeric(value?: number | string | null) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

function calculateDurationHours(startTime: string, endTime: string) {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const durationMs = end.getTime() - start.getTime()

  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    return 0
  }

  return durationMs / (1000 * 60 * 60)
}

function derivePaymentStatus(status: BookingStatus): PaymentStatus {
  switch (status) {
    case 'PAID':
    case 'CHECKED_IN':
    case 'COMPLETED':
      return 'PAID'
    case 'PENDING_PAYMENT':
      return 'PENDING'
    case 'CANCELLED':
    default:
      return 'UNPAID'
  }
}

function mapPaymentMethod(paymentMethod?: BackendPaymentMethod | null) {
  if (paymentMethod === 'ONLINE') {
    return 'Thanh toan online'
  }

  if (paymentMethod === 'CASH') {
    return 'Thanh toan tien mat'
  }

  return undefined
}

function mapEquipmentNotes(equipmentNotes?: string | null) {
  return normalizeText(equipmentNotes)
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function mapBackendBooking(booking: BackendBooking): AdminBooking {
  const totalHours = parseNumeric(booking.totalHours)
  const durationHours = totalHours > 0 ? totalHours : calculateDurationHours(booking.startTime, booking.endTime)

  return {
    bookingId: booking.bookingId,
    bookingCode: normalizeText(booking.bookingCode) || `BR${booking.bookingId}`,
    customerName: normalizeText(booking.customerName) || 'Khach hang',
    customerEmail: normalizeText(booking.customerEmail),
    customerPhone: normalizeText(booking.customerPhone),
    roomId: booking.roomId ?? 0,
    roomName: normalizeText(booking.roomName) || 'Chua xac dinh',
    roomType: normalizeText(booking.typeName) || 'Chua xac dinh',
    startTime: booking.startTime,
    endTime: booking.endTime,
    durationHours,
    equipment: mapEquipmentNotes(booking.equipmentNotes),
    totalPrice: parseNumeric(booking.totalAmount),
    paymentStatus: derivePaymentStatus(booking.status),
    bookingStatus: booking.status,
    note: normalizeText(booking.note) || undefined,
    paymentMethod: mapPaymentMethod(booking.paymentMethod),
  }
}

function applyClientFilters(bookings: AdminBooking[], filters: BookingFilters) {
  const normalizedQuery = filters.query.trim().toLowerCase()

  return bookings
    .filter((booking) => {
      if (normalizedQuery) {
        const matchesQuery =
          booking.bookingCode.toLowerCase().includes(normalizedQuery) ||
          booking.customerName.toLowerCase().includes(normalizedQuery) ||
          booking.customerPhone.toLowerCase().includes(normalizedQuery)

        if (!matchesQuery) {
          return false
        }
      }

      if (filters.paymentStatus !== 'ALL' && booking.paymentStatus !== filters.paymentStatus) {
        return false
      }

      if (filters.date && toDateKey(booking.startTime) !== filters.date) {
        return false
      }

      return true
    })
    .sort((firstBooking, secondBooking) => {
      return new Date(secondBooking.startTime).getTime() - new Date(firstBooking.startTime).getTime()
    })
}

export function formatAdminPrice(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

export function formatBookingDateTime(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatBookingTimeRange(start: string, end: string) {
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

  const date = new Date(start).toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  })

  return `${date} · ${formatTime(start)} - ${formatTime(end)}`
}

export async function fetchAdminBookings(filters: BookingFilters): Promise<AdminBooking[]> {
  try {
    const response = await api.get<ApiResponse<BackendBooking[]>>('/api/admin/bookings', {
      params: {
        status: filters.bookingStatus !== 'ALL' ? filters.bookingStatus : undefined,
      },
    })

    return applyClientFilters(response.data.data.map(mapBackendBooking), filters)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Khong the tai danh sach booking.'))
  }
}

export async function updateAdminBookingStatus(
  bookingId: number,
  status: BookingStatus,
): Promise<AdminBooking | null> {
  try {
    const response = await api.patch<ApiResponse<BackendBooking>>(
      `/api/admin/bookings/${bookingId}/status`,
      null,
      { params: { status } },
    )

    return mapBackendBooking(response.data.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Khong the cap nhat trang thai booking.'))
  }
}

export async function cancelAdminBooking(
  bookingId: number,
  reason?: string,
): Promise<AdminBooking | null> {
  try {
    const response = await api.put<ApiResponse<BackendBooking>>(
      `/api/admin/bookings/${bookingId}/cancel`,
      reason?.trim() ? { reason: reason.trim() } : {},
    )

    return mapBackendBooking(response.data.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Khong the huy booking.'))
  }
}

export async function getAdminBookingById(bookingId: number): Promise<AdminBooking | null> {
  try {
    const response = await api.get<ApiResponse<BackendBooking>>(`/api/admin/bookings/${bookingId}`)
    return mapBackendBooking(response.data.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Khong the tai chi tiet booking.'))
  }
}
