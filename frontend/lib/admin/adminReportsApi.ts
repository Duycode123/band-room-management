import type { AdminBooking, BookingStatus } from './types'
import { fetchAdminBookings } from './adminBookingApi'
import type { AdminReportData, DailyRevenuePoint, ReportDateRange, TopRoomPoint } from './reportsTypes'

const REVENUE_STATUSES: BookingStatus[] = ['PAID', 'CHECKED_IN', 'COMPLETED']

function parseDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function toDateKey(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatDayLabel(dateKey: string) {
  const date = parseDateKey(dateKey)
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

function eachDayInRange(range: ReportDateRange): string[] {
  const start = parseDateKey(range.startDate)
  const end = parseDateKey(range.endDate)
  const days: string[] = []

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return days
  }

  const cursor = new Date(start)
  while (cursor <= end) {
    days.push(toDateKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}

function bookingDateKey(booking: AdminBooking) {
  return toDateKey(new Date(booking.startTime))
}

function isInRange(dateKey: string, range: ReportDateRange) {
  return dateKey >= range.startDate && dateKey <= range.endDate
}

export function buildReportFromBookings(
  bookings: AdminBooking[],
  range: ReportDateRange,
): AdminReportData {
  const inRange = bookings.filter((booking) => isInRange(bookingDateKey(booking), range))
  const countable = inRange.filter((booking) => booking.bookingStatus !== 'CANCELLED')
  const revenueBookings = countable.filter((booking) => REVENUE_STATUSES.includes(booking.bookingStatus))

  const dailyMap = new Map<string, { revenue: number; orderCount: number }>()
  for (const day of eachDayInRange(range)) {
    dailyMap.set(day, { revenue: 0, orderCount: 0 })
  }

  for (const booking of countable) {
    const key = bookingDateKey(booking)
    const bucket = dailyMap.get(key)
    if (!bucket) continue
    bucket.orderCount += 1
    if (REVENUE_STATUSES.includes(booking.bookingStatus)) {
      bucket.revenue += booking.totalPrice
    }
  }

  const dailyRevenue: DailyRevenuePoint[] = eachDayInRange(range).map((date) => {
    const bucket = dailyMap.get(date) ?? { revenue: 0, orderCount: 0 }
    return {
      date,
      label: formatDayLabel(date),
      revenue: bucket.revenue,
      orderCount: bucket.orderCount,
    }
  })

  const roomMap = new Map<string, TopRoomPoint>()
  for (const booking of revenueBookings) {
    const key = booking.roomName || `room-${booking.roomId}`
    const current = roomMap.get(key) ?? {
      roomId: booking.roomId,
      roomName: booking.roomName || 'Chưa xác định',
      revenue: 0,
      orderCount: 0,
    }
    current.revenue += booking.totalPrice
    current.orderCount += 1
    roomMap.set(key, current)
  }

  const topRooms = [...roomMap.values()]
    .sort((a, b) => b.revenue - a.revenue || b.orderCount - a.orderCount)
    .slice(0, 8)

  return {
    totalRevenue: revenueBookings.reduce((sum, booking) => sum + booking.totalPrice, 0),
    totalOrders: countable.length,
    dailyRevenue,
    topRooms,
  }
}

export function defaultReportDateRange(): ReportDateRange {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 29)
  return { startDate: toDateKey(start), endDate: toDateKey(end) }
}

export async function fetchAdminReport(range: ReportDateRange): Promise<AdminReportData> {
  const bookings = await fetchAdminBookings({
    query: '',
    bookingStatus: 'ALL',
    paymentStatus: 'ALL',
    date: '',
  })

  return buildReportFromBookings(bookings, range)
}
