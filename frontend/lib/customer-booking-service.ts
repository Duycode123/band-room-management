export type CustomerBookingStatus = 'PENDING_PAYMENT' | 'PAID' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'

export type BookingReview = {
  id: string
  bookingId: string
  roomId: string
  customerName?: string
  rating: number
  comment: string
  createdAt: string
}

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

export type SubmitBookingReviewPayload = {
  bookingId: string
  roomId: string
  customerName?: string
  rating: number
  comment: string
}

const BOOKING_REVIEWS_KEY = 'bandroom_booking_reviews'
export const ROOM_REVIEWS_KEY = 'bandroom_room_reviews'

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
      comment: 'Phong sach, thiet bi tot, am thanh on dinh.',
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

function readStoredReviews() {
  if (typeof window === 'undefined') return []

  try {
    return JSON.parse(window.localStorage.getItem(BOOKING_REVIEWS_KEY) || '[]') as BookingReview[]
  } catch {
    return []
  }
}

function writeStoredReviews(reviews: BookingReview[]) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(BOOKING_REVIEWS_KEY, JSON.stringify(reviews))
}

function writeRoomReview(review: BookingReview) {
  if (typeof window === 'undefined') return

  try {
    const current = JSON.parse(window.localStorage.getItem(ROOM_REVIEWS_KEY) || '[]') as Array<
      BookingReview & { customerName?: string }
    >
    const next = [
      ...current.filter((item) => item.bookingId !== review.bookingId),
      {
        ...review,
        customerName: review.customerName || 'Khách hàng',
      },
    ]

    window.localStorage.setItem(ROOM_REVIEWS_KEY, JSON.stringify(next))
  } catch {
    window.localStorage.setItem(
      ROOM_REVIEWS_KEY,
      JSON.stringify([
        {
          ...review,
          customerName: review.customerName || 'Khách hàng',
        },
      ]),
    )
  }
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
  const storedReviews = readStoredReviews()

  return bookings.map((booking) => ({
    ...booking,
    review: storedReviews.find((review) => review.bookingId === booking.bookingId) ?? booking.review,
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
  await waitForMockApi()

  const currentReviews = readStoredReviews()
  const existingReview =
    currentReviews.find((review) => review.bookingId === payload.bookingId) ??
    mockBookings.find((booking) => booking.bookingId === payload.bookingId)?.review

  if (existingReview) {
    return existingReview
  }

  const review: BookingReview = {
    id: `review-${payload.bookingId}-${Date.now()}`,
    bookingId: payload.bookingId,
    roomId: payload.roomId,
    customerName: payload.customerName?.trim() || 'Khách hàng',
    rating: payload.rating,
    comment: payload.comment.trim(),
    createdAt: new Date().toISOString(),
  }

  writeStoredReviews([...currentReviews, review])
  writeRoomReview(review)

  return review
}
