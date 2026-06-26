'use client'

import { useEffect, useState } from 'react'
import {
  CustomerCard,
  CustomerPageHeader,
  CustomerPageShell,
} from '@/components/customer/CustomerPageShell'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/components/booking/booking-data'
import type { AuthUser } from '@/lib/auth'
import {
  canReviewBooking,
  formatBookingStatus,
  getBookingDetail,
  getCustomerBookings,
  submitBookingReview,
  type BookingHistoryItem,
  type BookingReview,
} from '@/lib/customer-booking-service'

const maxCommentLength = 500
const minCommentLength = 10

export default function CustomerBookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<BookingHistoryItem[]>([])
  const [selectedBooking, setSelectedBooking] = useState<BookingHistoryItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    void getCustomerBookings()
      .then((items) => {
        if (mounted) setBookings(items)
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const handleSelectBooking = async (bookingId: string) => {
    const detail = await getBookingDetail(bookingId)
    if (detail) setSelectedBooking(detail)
  }

  const handleReviewSubmitted = (review: BookingReview) => {
    setBookings((currentBookings) =>
      currentBookings.map((booking) =>
        booking.bookingId === review.bookingId
          ? {
              ...booking,
              review,
            }
          : booking,
      ),
    )
    setSelectedBooking((currentBooking) =>
      currentBooking && currentBooking.bookingId === review.bookingId
        ? {
            ...currentBooking,
            review,
          }
        : currentBooking,
    )
  }

  return (
    <CustomerPageShell>
      <CustomerPageHeader
        title="Lịch sử đặt phòng"
        description="Theo dõi lịch đặt, xem chi tiết và gửi đánh giá sau khi hoàn tất buổi sử dụng."
      />

      <CustomerCard>
        {isLoading ? (
          <p className="text-sm text-[#5C5348]">Đang tải lịch sử đặt phòng...</p>
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E8E4DC] bg-[#FAF8F4] p-6 text-sm text-[#5C5348]">
            Bạn chưa có lịch đặt phòng nào.
          </div>
        ) : (
          <div className="grid gap-4">
            {bookings.map((booking) => (
              <button
                key={booking.bookingId}
                type="button"
                onClick={() => void handleSelectBooking(booking.bookingId)}
                className="grid cursor-pointer gap-4 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#FF7518]/45 hover:bg-white hover:shadow-[0_14px_34px_rgba(26,28,30,0.08)] md:grid-cols-[1fr_auto]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-bold text-[#1A1C1E]">{booking.roomName}</h2>
                    <StatusBadge status={booking.status} />
                    {booking.review && (
                      <span className="rounded-full border border-[#FF7518]/25 bg-[#FFE8D6] px-3 py-1 font-display text-xs font-bold text-[#6B3200]">
                        Đã đánh giá
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-[#5C5348]">Mã đặt phòng: {booking.bookingId}</p>
                  <p className="mt-1 text-sm text-[#5C5348]">
                    {booking.date} · {booking.startTime} - {booking.endTime}
                  </p>
                </div>
                <div className="flex items-end justify-between gap-4 md:block md:text-right">
                  <p className="font-display text-xl font-bold text-[#FF7518]">
                    {formatCurrency(booking.totalAmount)}
                  </p>
                  <p className="mt-1 text-xs font-medium text-[#5C5348]">Bấm để xem chi tiết</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </CustomerCard>

      <BookingDetailModal
        booking={selectedBooking}
        reviewerName={getReviewerName(user)}
        onClose={() => setSelectedBooking(null)}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </CustomerPageShell>
  )
}

function BookingDetailModal({
  booking,
  reviewerName,
  onClose,
  onReviewSubmitted,
}: {
  booking: BookingHistoryItem | null
  reviewerName: string
  onClose: () => void
  onReviewSubmitted: (review: BookingReview) => void
}) {
  if (!booking) return null

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-detail-title"
      onClick={onClose}
    >
      <div
        className="max-h-[calc(100vh-48px)] w-full max-w-[820px] overflow-y-auto rounded-[24px] border border-[#E8E4DC] bg-[#F5F2EC] shadow-[0_24px_80px_rgba(26,28,30,0.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E8E4DC] bg-white px-5 py-5 sm:px-6">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.14em] text-[#FF7518]">
              Chi tiết đặt phòng
            </p>
            <h2 id="booking-detail-title" className="mt-2 font-display text-2xl font-bold text-[#1A1C1E]">
              {booking.roomName}
            </h2>
            <p className="mt-1 text-sm text-[#5C5348]">Mã đặt phòng: {booking.bookingId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E8E4DC] bg-white text-xl leading-none text-[#1A1C1E] transition hover:bg-[#FFE8D6]"
            aria-label="Đóng chi tiết đặt phòng"
          >
            X
          </button>
        </div>

        <div className="grid gap-5 p-5 sm:p-6">
          <section className="rounded-2xl border border-[#E8E4DC] bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-lg font-bold text-[#1A1C1E]">Thông tin đặt phòng</h3>
              <StatusBadge status={booking.status} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Detail label="Ngày đặt" value={booking.date} />
              <Detail label="Khung giờ" value={`${booking.startTime} - ${booking.endTime}`} />
              <Detail label="Tổng tiền" value={formatCurrency(booking.totalAmount)} />
              <Detail label="Phương thức thanh toán" value={booking.paymentMethod || 'Chưa cập nhật'} />
              <Detail label="Dịch vụ thuê thêm" value={booking.addons?.length ? booking.addons.join(', ') : 'Không có'} />
              <Detail label="Ghi chú" value={booking.note || 'Không có ghi chú'} />
            </div>
          </section>

          <ReviewSection booking={booking} reviewerName={reviewerName} onReviewSubmitted={onReviewSubmitted} />
        </div>
      </div>
    </div>
  )
}

function ReviewSection({
  booking,
  reviewerName,
  onReviewSubmitted,
}: {
  booking: BookingHistoryItem
  reviewerName: string
  onReviewSubmitted: (review: BookingReview) => void
}) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (booking.review) {
    return <SubmittedReview review={booking.review} reviewerName={reviewerName} />
  }

  if (!canReviewBooking(booking)) {
    return (
      <section className="rounded-2xl border border-[#E8E4DC] bg-white p-5">
        <h3 className="font-display text-lg font-bold text-[#1A1C1E]">Đánh giá phòng</h3>
        <p className="mt-3 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] px-4 py-3 text-sm text-[#5C5348]">
          Bạn có thể đánh giá sau khi hoàn tất buổi đặt phòng.
        </p>
      </section>
    )
  }

  const handleSubmit = async () => {
    const trimmedComment = comment.trim()

    setError('')
    setSuccessMessage('')

    if (rating < 1) {
      setError('Vui lòng chọn số sao đánh giá.')
      return
    }

    if (trimmedComment.length < minCommentLength) {
      setError('Bình luận cần ít nhất 10 ký tự.')
      return
    }

    setIsSubmitting(true)
    try {
      const review = await submitBookingReview({
        bookingId: booking.bookingId,
        roomId: booking.roomId,
        customerName: reviewerName,
        rating,
        comment: trimmedComment,
      })
      onReviewSubmitted(review)
      setSuccessMessage('Cảm ơn bạn đã gửi đánh giá.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="rounded-2xl border border-[#E8E4DC] bg-white p-5">
      <h3 className="font-display text-lg font-bold text-[#1A1C1E]">Đánh giá phòng</h3>
      <div className="mt-4">
        <p className="font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">Số sao</p>
        <div className="mt-2 flex gap-1" onMouseLeave={() => setHoverRating(0)}>
          {Array.from({ length: 5 }, (_, index) => {
            const starValue = index + 1
            const active = starValue <= (hoverRating || rating)

            return (
              <button
                key={starValue}
                type="button"
                onClick={() => {
                  setRating(starValue)
                  setError('')
                }}
                onMouseEnter={() => setHoverRating(starValue)}
                className={['text-3xl transition', active ? 'text-[#FF7518]' : 'text-[#D8D1C7]'].join(' ')}
                aria-label={`${starValue} sao`}
              >
                ★
              </button>
            )
          })}
        </div>
      </div>

      <label className="mt-4 block">
        <span className="font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">Bình luận</span>
        <textarea
          value={comment}
          onChange={(event) => {
            setComment(event.target.value.slice(0, maxCommentLength))
            setError('')
          }}
          rows={4}
          placeholder="Chia sẻ trải nghiệm của bạn về phòng tập, thiết bị và chất lượng hỗ trợ."
          className="mt-2 w-full resize-none rounded-2xl border border-[#C9C2B6] bg-white px-4 py-3 text-sm text-[#1A1C1E] outline-none transition placeholder:text-[#8A8176] focus:border-[#FF7518] focus:ring-2 focus:ring-[#FF7518]/20"
        />
      </label>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-[#5C5348]">{comment.length}/{maxCommentLength}</p>
        {error && <p className="text-right text-xs font-semibold text-[#C62828]">{error}</p>}
        {successMessage && <p className="text-right text-xs font-semibold text-[#0A4D27]">{successMessage}</p>}
      </div>

      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={isSubmitting}
        className="mt-4 h-12 rounded-2xl bg-[#FF7518] px-5 font-display text-sm font-semibold text-white shadow-[0_10px_26px_rgba(255,117,24,0.24)] transition hover:bg-[#E6640F] disabled:cursor-wait disabled:opacity-70"
      >
        {isSubmitting ? 'Đang gửi đánh giá...' : 'Gửi đánh giá'}
      </button>
    </section>
  )
}

function SubmittedReview({ review, reviewerName }: { review: BookingReview; reviewerName: string }) {
  return (
    <section className="rounded-2xl border border-[#E8E4DC] bg-white p-5">
      <h3 className="font-display text-lg font-bold text-[#1A1C1E]">Bạn đã đánh giá phòng này.</h3>
      <p className="mt-2 rounded-2xl border border-[#0A4D27]/20 bg-[#E8F5EC] px-4 py-3 text-sm font-medium text-[#0A4D27]">
        Cảm ơn bạn đã gửi đánh giá.
      </p>
      <div className="mt-4 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-sm font-bold text-[#1A1C1E]">
              {getReviewCustomerName(review, reviewerName)}
            </p>
            <div className="mt-1 flex text-xl text-[#FF7518]" aria-label={`${review.rating} trên 5 sao`}>
              {renderStars(review.rating)}
            </div>
          </div>
          <span className="text-xs font-medium text-[#5C5348]">{formatReviewDate(review.createdAt)}</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-[#5C5348]">{review.comment}</p>
      </div>
    </section>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-6 text-[#1A1C1E]">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: BookingHistoryItem['status'] }) {
  const toneClassName = {
    PENDING_PAYMENT: 'border-[#FF7518]/25 bg-[#FFE8D6] text-[#6B3200]',
    PAID: 'border-[#0A4D27]/20 bg-[#E8F5EC] text-[#0A4D27]',
    CONFIRMED: 'border-[#E8E4DC] bg-white text-[#5C5348]',
    COMPLETED: 'border-[#0A4D27]/20 bg-[#E8F5EC] text-[#0A4D27]',
    CANCELLED: 'border-[#C62828]/20 bg-[#FFEBEE] text-[#C62828]',
  } satisfies Record<BookingHistoryItem['status'], string>

  return (
    <span className={['rounded-full border px-3 py-1 font-display text-xs font-bold', toneClassName[status]].join(' ')}>
      {formatBookingStatus(status)}
    </span>
  )
}

function getReviewerName(user: AuthUser | null | undefined) {
  return user?.fullName?.trim() || user?.name?.trim() || user?.email?.trim() || 'Khách hàng'
}

function getReviewCustomerName(review: BookingReview, reviewerName: string) {
  const storedName = review.customerName?.trim()

  if (storedName && storedName !== 'Khach hang' && storedName !== 'Khách hàng') {
    return storedName
  }

  return reviewerName
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, index) => (
    <span key={index} className={index < rating ? 'text-[#FF7518]' : 'text-[#D8D1C7]'}>
      ★
    </span>
  ))
}

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
