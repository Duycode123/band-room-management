export type ReviewImage = {
  id: string
  name: string
  previewUrl: string
}

export type BookingReview = {
  id: string
  bookingId: string
  roomId: string
  customerName?: string
  rating: number
  title: string
  content: string
  tags?: string[]
  images?: ReviewImage[]
  createdAt: string
}

export type ReviewDraft = {
  rating: number
  title: string
  content: string
  selectedTags: string[]
  images: ReviewImage[]
}

export type SubmitBookingReviewPayload = {
  bookingId: string
  roomId: string
  customerName?: string
  rating: number
  title: string
  content: string
  tags?: string[]
  images?: ReviewImage[]
}

type LegacyReview = {
  id?: string
  bookingId?: string
  roomId: string
  customerName?: string
  rating: number
  title?: string
  content?: string
  comment?: string
  tags?: string[]
  images?: ReviewImage[]
  createdAt?: string
}

const BOOKING_REVIEWS_KEY = 'bandroom_booking_reviews'
const ROOM_REVIEWS_KEY = 'bandroom_room_reviews'

function waitForMockApi(delay = 220) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, delay))
}

function getDraftKey(bookingId: string) {
  return `bandroom_review_draft_${bookingId}`
}

function normalizeReview(review: LegacyReview): BookingReview {
  const fallbackContent = review.content?.trim() || review.comment?.trim() || ''

  return {
    id: review.id || `review-${review.bookingId || review.roomId}-${Date.now()}`,
    bookingId: review.bookingId || '',
    roomId: review.roomId,
    customerName: review.customerName,
    rating: review.rating,
    title: review.title?.trim() || fallbackContent.slice(0, 80) || 'Đánh giá phòng',
    content: fallbackContent,
    tags: review.tags ?? [],
    images: review.images ?? [],
    createdAt: review.createdAt || new Date().toISOString(),
  }
}

function readReviews(key: string) {
  if (typeof window === 'undefined') return []

  try {
    return (JSON.parse(window.localStorage.getItem(key) || '[]') as LegacyReview[]).map(normalizeReview)
  } catch {
    return []
  }
}

function writeReviews(key: string, reviews: BookingReview[]) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(key, JSON.stringify(reviews))
}

export function getBookingReviewByBookingId(bookingId: string) {
  return readReviews(BOOKING_REVIEWS_KEY).find((review) => review.bookingId === bookingId) ?? null
}

export function getRoomReviewsByRoomId(roomId: string, baseReviews: LegacyReview[] = []) {
  return [...baseReviews.map(normalizeReview), ...readReviews(ROOM_REVIEWS_KEY)]
    .filter((review) => review.roomId === roomId)
    .sort((firstReview, secondReview) => Date.parse(secondReview.createdAt) - Date.parse(firstReview.createdAt))
}

export function getAverageReviewRating(reviews: Pick<BookingReview, 'rating'>[]) {
  if (reviews.length === 0) return 0

  return reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
}

export async function submitReview(payload: SubmitBookingReviewPayload): Promise<BookingReview> {
  await waitForMockApi()

  const currentBookingReviews = readReviews(BOOKING_REVIEWS_KEY)
  const existingReview = currentBookingReviews.find((review) => review.bookingId === payload.bookingId)

  if (existingReview) {
    return existingReview
  }

  const review: BookingReview = {
    id: `review-${payload.bookingId}-${Date.now()}`,
    bookingId: payload.bookingId,
    roomId: payload.roomId,
    customerName: payload.customerName?.trim() || 'Khách hàng',
    rating: payload.rating,
    title: payload.title.trim(),
    content: payload.content.trim(),
    tags: payload.tags ?? [],
    images: payload.images ?? [],
    createdAt: new Date().toISOString(),
  }

  writeReviews(BOOKING_REVIEWS_KEY, [...currentBookingReviews, review])

  const currentRoomReviews = readReviews(ROOM_REVIEWS_KEY)
  writeReviews(ROOM_REVIEWS_KEY, [
    ...currentRoomReviews.filter((item) => item.bookingId !== review.bookingId),
    review,
  ])

  return review
}

export function saveReviewDraft(bookingId: string, draft: ReviewDraft) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(getDraftKey(bookingId), JSON.stringify(draft))
}

export function loadReviewDraft(bookingId: string): ReviewDraft | null {
  if (typeof window === 'undefined') return null

  try {
    const rawDraft = window.localStorage.getItem(getDraftKey(bookingId))
    if (!rawDraft) return null

    const draft = JSON.parse(rawDraft) as Partial<ReviewDraft>

    return {
      rating: Number.isInteger(draft.rating) ? Number(draft.rating) : 0,
      title: draft.title || '',
      content: draft.content || '',
      selectedTags: Array.isArray(draft.selectedTags) ? draft.selectedTags : [],
      images: Array.isArray(draft.images) ? draft.images : [],
    }
  } catch {
    return null
  }
}

export function clearReviewDraft(bookingId: string) {
  if (typeof window === 'undefined') return

  window.localStorage.removeItem(getDraftKey(bookingId))
}
