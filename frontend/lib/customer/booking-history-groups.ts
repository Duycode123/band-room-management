import type { BookingHistoryItem } from '@/lib/customer-booking-service'

export type BookingHistoryGroupId = 'action' | 'upcoming' | 'past' | 'cancelled'

export type BookingHistoryGroup = {
  id: BookingHistoryGroupId
  title: string
  description: string
  bookings: BookingHistoryItem[]
}

function bookingTimestamp(booking: Pick<BookingHistoryItem, 'date' | 'startTime'>) {
  const [day, month, year] = booking.date.split('/').map(Number)
  const [hour = 0, minute = 0] = booking.startTime.split(':').map(Number)
  const timestamp = new Date(year, month - 1, day, hour, minute).getTime()

  return Number.isFinite(timestamp) ? timestamp : 0
}

/**
 * Splits booking history into ordered, user-oriented sections:
 * 1. action    — awaiting payment, needs attention first
 * 2. upcoming  — paid/checked-in sessions in the future, soonest first
 * 3. past      — finished sessions, most recent first
 * 4. cancelled — most recent first
 */
export function groupBookingHistory(
  bookings: BookingHistoryItem[],
  now = Date.now(),
): BookingHistoryGroup[] {
  const action: BookingHistoryItem[] = []
  const upcoming: BookingHistoryItem[] = []
  const past: BookingHistoryItem[] = []
  const cancelled: BookingHistoryItem[] = []

  for (const booking of bookings) {
    if (booking.status === 'PENDING_PAYMENT') {
      action.push(booking)
    } else if (booking.status === 'CANCELLED') {
      cancelled.push(booking)
    } else if (booking.status !== 'COMPLETED' && bookingTimestamp(booking) >= now) {
      upcoming.push(booking)
    } else {
      past.push(booking)
    }
  }

  const newestFirst = (first: BookingHistoryItem, second: BookingHistoryItem) =>
    bookingTimestamp(second) - bookingTimestamp(first)
  const soonestFirst = (first: BookingHistoryItem, second: BookingHistoryItem) =>
    bookingTimestamp(first) - bookingTimestamp(second)

  action.sort(newestFirst)
  upcoming.sort(soonestFirst)
  past.sort(newestFirst)
  cancelled.sort(newestFirst)

  const groups: BookingHistoryGroup[] = [
    {
      id: 'action',
      title: 'Cần thanh toán',
      description: 'Đơn đang chờ thanh toán — hoàn tất sớm để giữ chỗ.',
      bookings: action,
    },
    {
      id: 'upcoming',
      title: 'Sắp diễn ra',
      description: 'Các buổi đã thanh toán, xếp theo buổi gần nhất.',
      bookings: upcoming,
    },
    {
      id: 'past',
      title: 'Đã qua',
      description: 'Buổi đã hoàn thành — bạn có thể gửi đánh giá.',
      bookings: past,
    },
    {
      id: 'cancelled',
      title: 'Đã hủy',
      description: 'Các đơn đã hủy hoặc hết hạn thanh toán.',
      bookings: cancelled,
    },
  ]

  return groups.filter((group) => group.bookings.length > 0)
}
