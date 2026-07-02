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
  content: string
}

export type SubmitBookingReviewPayload = {
  bookingId: string
  backendBookingId?: number
  roomId: string
  customerName?: string
  rating: number
  content: string
}

const DRAFT_KEY_PREFIX = 'bandroom_review_draft_'

function getDraftKey(bookingId: string) {
  return `${DRAFT_KEY_PREFIX}${bookingId}`
}

export function getAverageReviewRating(reviews: Pick<BookingReview, 'rating'>[]) {
  if (reviews.length === 0) return 0

  return reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
}

export function getRoomReviewsByRoomId(roomId: string, reviews: BookingReview[] = []) {
  return reviews
    .filter((review) => review.roomId === roomId)
    .sort((firstReview, secondReview) => Date.parse(secondReview.createdAt) - Date.parse(firstReview.createdAt))
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
      content: draft.content || '',
    }
  } catch {
    return null
  }
}

export function clearReviewDraft(bookingId: string) {
  if (typeof window === 'undefined') return

  window.localStorage.removeItem(getDraftKey(bookingId))
}
