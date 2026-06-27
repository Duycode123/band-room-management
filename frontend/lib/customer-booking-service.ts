import {
  clearReviewDraft,
  getBookingReviewByBookingId,
  loadReviewDraft,
  saveReviewDraft,
  submitReview,
  type BookingReview,
  type ReviewDraft,
  type SubmitBookingReviewPayload,
} from '@/lib/review-service'

export type CustomerBookingStatus = 'PENDING_PAYMENT' | 'PAID' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'

export type { BookingReview, ReviewDraft, SubmitBookingReviewPayload }

export type BookingHistoryItem = {
  bookingId: string
  roomId: string
  roomName: string
  date: string
  startTime: string
  endTime: string
  totalAmount: number
  status: CustomerBookingStatus
  paymentMethod?: string
  addons?: string[]
  note?: string
  review?: BookingReview
}

const mockBookings: BookingHistoryItem[] = [
  {
    bookingId: 'BR-2026-0821',
    roomId: 'studio-a',
    roomName: 'Studio A - Phong Do',
    date: '28/06/2026',
    startTime: '19:00',
    endTime: '22:00',
    totalAmount: 1050000,
    status: 'PAID',
    paymentMethod: 'Chuyen khoan ngan hang',
    addons: ['Guitar dien Fender', 'Micro Shure SM58'],
    note: 'Can setup vocal truoc 15 phut.',
  },
  {
    bookingId: 'BR-2026-0831',
    roomId: 'the-vault',
    roomName: 'The Vault - Thu am',
    date: '20/06/2026',
    startTime: '14:00',
    endTime: '16:00',
    totalAmount: 1000000,
    status: 'COMPLETED',
    paymentMethod: 'Vi dien tu',
    addons: ['Ky thuat vien thu am'],
    note: 'Thu vocal demo.',
    review: {
      id: 'review-booking-0831',
      bookingId: 'BR-2026-0831',
      roomId: 'the-vault',
      customerName: 'Minh Anh',
      rating: 5,
      title: 'Phong sach, am thanh tot',
      content: 'Phong sach, thiet bi tot, am thanh on dinh, phu hop thu vocal demo.',
      tags: ['Phòng sạch', 'Thiết bị ổn', 'Âm thanh rõ'],
      images: [],
      createdAt: '2026-06-26T15:30:00',
    },
  },
  {
    bookingId: 'BR-2026-0840',
    roomId: 'studio-b',
    roomName: 'Studio B - Band Rehearsal',
    date: '30/06/2026',
    startTime: '18:00',
    endTime: '20:00',
    totalAmount: 720000,
    status: 'CONFIRMED',
    paymentMethod: 'Thanh toan tai quay',
    addons: [],
  },
  {
    bookingId: 'BR-2026-0802',
    roomId: 'practice-pod-a',
    roomName: 'Practice Pod A',
    date: '12/06/2026',
    startTime: '09:00',
    endTime: '10:00',
    totalAmount: 180000,
    status: 'CANCELLED',
    addons: [],
    note: 'Khach da huy lich.',
  },
]

function waitForMockApi(delay = 220) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, delay))
}

function getBookingTimestamp(booking: Pick<BookingHistoryItem, 'date' | 'startTime'>) {
  const [day, month, year] = booking.date.split('/').map(Number)
  const [hour = 0, minute = 0] = booking.startTime.split(':').map(Number)
  const timestamp = new Date(year, month - 1, day, hour, minute).getTime()

  return Number.isFinite(timestamp) ? timestamp : 0
}

function sortBookingsByTime(bookings: BookingHistoryItem[]) {
  return [...bookings].sort((firstBooking, secondBooking) => {
    return getBookingTimestamp(secondBooking) - getBookingTimestamp(firstBooking)
  })
}

function mergeReviews(bookings: BookingHistoryItem[]) {
  return bookings.map((booking) => ({
    ...booking,
    review: getBookingReviewByBookingId(booking.bookingId) ?? booking.review,
  }))
}

export function canReviewBooking(booking: Pick<BookingHistoryItem, 'status'>) {
  return booking.status === 'COMPLETED' || booking.status === 'PAID'
}

export function formatBookingStatus(status: CustomerBookingStatus) {
  const labels: Record<CustomerBookingStatus, string> = {
    PENDING_PAYMENT: 'Cho thanh toan',
    PAID: 'Da thanh toan',
    CONFIRMED: 'Da xac nhan',
    COMPLETED: 'Hoan tat',
    CANCELLED: 'Da huy',
  }

  return labels[status]
}

export async function getCustomerBookings(): Promise<BookingHistoryItem[]> {
  await waitForMockApi()
  return sortBookingsByTime(mergeReviews(mockBookings))
}

export async function getBookingDetail(bookingId: string): Promise<BookingHistoryItem | null> {
  await waitForMockApi(120)
  return mergeReviews(mockBookings).find((booking) => booking.bookingId === bookingId) ?? null
}

export async function submitBookingReview(payload: SubmitBookingReviewPayload): Promise<BookingReview> {
  const existingReview =
    getBookingReviewByBookingId(payload.bookingId) ??
    mockBookings.find((booking) => booking.bookingId === payload.bookingId)?.review

  if (existingReview) {
    return existingReview
  }

  return submitReview(payload)
}

export { clearReviewDraft, loadReviewDraft, saveReviewDraft }
