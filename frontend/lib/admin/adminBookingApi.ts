import { MOCK_ADMIN_BOOKINGS } from './mockBookings'
import type { AdminBooking, BookingFilters, BookingStatus } from './types'

let bookingsStore = [...MOCK_ADMIN_BOOKINGS]

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function toDateKey(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
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
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  const date = new Date(start).toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  })
  return `${date} · ${fmt(start)} – ${fmt(end)}`
}

export async function fetchAdminBookings(filters: BookingFilters): Promise<AdminBooking[]> {
  await delay(250)

  const query = filters.query.trim().toLowerCase()

  return bookingsStore
    .filter((b) => {
      if (query) {
        const match =
          b.bookingCode.toLowerCase().includes(query) ||
          b.customerName.toLowerCase().includes(query) ||
          b.customerPhone.includes(query)
        if (!match) return false
      }
      if (filters.bookingStatus !== 'ALL' && b.bookingStatus !== filters.bookingStatus) return false
      if (filters.paymentStatus !== 'ALL' && b.paymentStatus !== filters.paymentStatus) return false
      if (filters.date && toDateKey(b.startTime) !== filters.date) return false
      return true
    })
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
}

export async function updateAdminBookingStatus(
  bookingId: number,
  status: BookingStatus,
): Promise<AdminBooking | null> {
  await delay(300)
  const index = bookingsStore.findIndex((b) => b.bookingId === bookingId)
  if (index === -1) return null
  bookingsStore[index] = { ...bookingsStore[index], bookingStatus: status }
  return bookingsStore[index]
}

export async function getAdminBookingById(bookingId: number): Promise<AdminBooking | null> {
  await delay(150)
  return bookingsStore.find((b) => b.bookingId === bookingId) ?? null
}
