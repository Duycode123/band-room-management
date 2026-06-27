'use client'

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
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
  clearReviewDraft,
  formatBookingStatus,
  getBookingDetail,
  getCustomerBookings,
  loadReviewDraft,
  saveReviewDraft,
  submitBookingReview,
  type BookingHistoryItem,
  type BookingReview,
} from '@/lib/customer-booking-service'
import type { ReviewImage } from '@/lib/review-service'

const minTitleLength = 5
const maxTitleLength = 80
const minContentLength = 20
const maxContentLength = 700
const maxReviewImages = 3
const maxReviewImageSize = 3 * 1024 * 1024
const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp']

const reviewTagOptions = [
  'Phòng sạch',
  'Cách âm tốt',
  'Thiết bị ổn',
  'Âm thanh rõ',
  'Nhân viên hỗ trợ tốt',
  'Giá hợp lý',
  'Dễ đặt lịch',
  'Phù hợp tập band',
]

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
        className="max-h-[calc(100vh-48px)] w-full max-w-[900px] overflow-y-auto rounded-[24px] border border-[#E8E4DC] bg-[#F5F2EC] shadow-[0_24px_80px_rgba(26,28,30,0.28)]"
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [images, setImages] = useState<ReviewImage[]>([])
  const [imageError, setImageError] = useState('')
  const [restoreMessage, setRestoreMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [draftReady, setDraftReady] = useState(false)

  useEffect(() => {
    if (booking.review) return

    const draft = loadReviewDraft(booking.bookingId)

    if (draft) {
      setRating(draft.rating)
      setTitle(draft.title.slice(0, maxTitleLength))
      setContent(draft.content.slice(0, maxContentLength))
      setSelectedTags(draft.selectedTags.filter((tag) => reviewTagOptions.includes(tag)))
      setImages(draft.images.slice(0, maxReviewImages))
      setRestoreMessage('Bản nháp đánh giá đã được khôi phục.')
    } else {
      setRating(0)
      setTitle('')
      setContent('')
      setSelectedTags([])
      setImages([])
      setRestoreMessage('')
    }

    setDraftReady(true)
  }, [booking.bookingId, booking.review])

  const validation = useMemo(() => {
    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()

    return {
      rating: rating < 1 ? 'Vui lòng chọn số sao đánh giá.' : '',
      title: trimmedTitle.length < minTitleLength ? 'Tiêu đề cần ít nhất 5 ký tự.' : '',
      content: trimmedContent.length < minContentLength ? 'Nội dung đánh giá cần ít nhất 20 ký tự.' : '',
    }
  }, [content, rating, title])

  const isFormValid =
    !validation.rating &&
    !validation.title &&
    !validation.content &&
    content.length <= maxContentLength &&
    !imageError

  useEffect(() => {
    if (!draftReady || booking.review) return

    const timeout = window.setTimeout(() => {
      const hasDraftContent =
        rating > 0 || title.trim().length > 0 || content.trim().length > 0 || selectedTags.length > 0 || images.length > 0

      if (!hasDraftContent) {
        clearReviewDraft(booking.bookingId)
        return
      }

      saveReviewDraft(booking.bookingId, {
        rating,
        title,
        content,
        selectedTags,
        images,
      })
    }, 500)

    return () => window.clearTimeout(timeout)
  }, [booking.bookingId, booking.review, content, draftReady, images, rating, selectedTags, title])

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

  const toggleTag = (tag: string) => {
    setSelectedTags((currentTags) =>
      currentTags.includes(tag) ? currentTags.filter((item) => item !== tag) : [...currentTags, tag],
    )
  }

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    setImageError('')

    if (files.length === 0) return

    const availableSlots = maxReviewImages - images.length
    const nextFiles = files.slice(0, availableSlots)

    if (files.length > availableSlots) {
      setImageError('Chỉ được upload tối đa 3 ảnh.')
    }

    nextFiles.forEach((file) => {
      if (!acceptedImageTypes.includes(file.type)) {
        setImageError('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.')
        return
      }

      if (file.size > maxReviewImageSize) {
        setImageError('Ảnh không được vượt quá 3MB.')
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result !== 'string') return
        const previewUrl = reader.result

        setImages((currentImages) => [
          ...currentImages,
          {
            id: `review-image-${Date.now()}-${file.name}`,
            name: file.name,
            previewUrl,
          },
        ].slice(0, maxReviewImages))
      }
      reader.readAsDataURL(file)
    })
  }

  const handleStarKeyDown = (event: KeyboardEvent<HTMLButtonElement>, starValue: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setRating(starValue)
    }
  }

  const handleSubmit = async () => {
    if (!isFormValid) return

    setIsSubmitting(true)
    setSuccessMessage('')

    try {
      const review = await submitBookingReview({
        bookingId: booking.bookingId,
        roomId: booking.roomId,
        customerName: reviewerName,
        rating,
        title,
        content,
        tags: selectedTags,
        images,
      })
      clearReviewDraft(booking.bookingId)
      onReviewSubmitted(review)
      setSuccessMessage('Cảm ơn bạn đã gửi đánh giá.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="rounded-2xl border border-[#E8E4DC] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold text-[#1A1C1E]">Đánh giá phòng</h3>
          <p className="mt-1 text-sm text-[#5C5348]">Chia sẻ trải nghiệm để những khách hàng sau chọn phòng tốt hơn.</p>
        </div>
        <span className="rounded-full bg-[#FFE8D6] px-3 py-1 font-display text-xs font-bold text-[#6B3200]">
          Backend-ready
        </span>
      </div>

      {restoreMessage && (
        <p className="mt-4 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] px-4 py-3 text-sm text-[#5C5348]">
          {restoreMessage}
        </p>
      )}

      <div className="mt-5">
        <p className="font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">Số sao</p>
        <div className="mt-2 flex gap-1" onMouseLeave={() => setHoverRating(0)}>
          {Array.from({ length: 5 }, (_, index) => {
            const starValue = index + 1
            const active = starValue <= (hoverRating || rating)

            return (
              <button
                key={starValue}
                type="button"
                onClick={() => setRating(starValue)}
                onKeyDown={(event) => handleStarKeyDown(event, starValue)}
                onMouseEnter={() => setHoverRating(starValue)}
                className={['text-3xl transition', active ? 'text-[#FF7518]' : 'text-[#D8D1C7]'].join(' ')}
                aria-label={`${starValue} sao`}
                aria-pressed={rating === starValue}
              >
                ★
              </button>
            )
          })}
        </div>
        {validation.rating && <FieldError message={validation.rating} />}
      </div>

      <FormTextInput
        label="Tiêu đề đánh giá"
        value={title}
        maxLength={maxTitleLength}
        placeholder="Ví dụ: Phòng sạch, âm thanh tốt"
        error={validation.title}
        onChange={(value) => setTitle(value.slice(0, maxTitleLength))}
      />

      <label className="mt-4 block">
        <span className="font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">Nội dung đánh giá</span>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value.slice(0, maxContentLength))}
          rows={5}
          placeholder="Chia sẻ trải nghiệm của bạn về phòng tập, thiết bị, âm thanh và nhân viên hỗ trợ."
          className="mt-2 w-full resize-none rounded-2xl border border-[#C9C2B6] bg-white px-4 py-3 text-sm text-[#1A1C1E] outline-none transition placeholder:text-[#8A8176] focus:border-[#FF7518] focus:ring-2 focus:ring-[#FF7518]/20"
        />
      </label>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-[#5C5348]">{content.length}/{maxContentLength}</p>
        {validation.content && <FieldError message={validation.content} />}
      </div>

      <div className="mt-5">
        <p className="font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">Điểm nổi bật</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {reviewTagOptions.map((tag) => {
            const selected = selectedTags.includes(tag)

            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={[
                  'rounded-full border px-3 py-2 font-display text-xs font-bold transition',
                  selected
                    ? 'border-[#FF7518] bg-[#FFE8D6] text-[#6B3200]'
                    : 'border-[#E8E4DC] bg-white text-[#5C5348] hover:border-[#FF7518] hover:bg-[#FFF8F2]',
                ].join(' ')}
                aria-pressed={selected}
              >
                {tag}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">Ảnh trải nghiệm</p>
            <p className="mt-1 text-xs text-[#5C5348]">Tối đa 3 ảnh JPG, PNG hoặc WEBP. Mỗi ảnh tối đa 3MB.</p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= maxReviewImages}
            className="h-10 rounded-2xl border border-[#C9C2B6] bg-white px-4 font-display text-xs font-bold text-[#1A1C1E] transition hover:border-[#FF7518] hover:bg-[#FFF8F2] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Thêm ảnh
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleImageChange}
            className="hidden"
          />
        </div>
        {imageError && <FieldError message={imageError} />}
        {images.length > 0 && (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {images.map((image) => (
              <div key={image.id} className="overflow-hidden rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4]">
                <img src={image.previewUrl} alt={image.name} className="h-28 w-full object-cover" />
                <div className="flex items-center justify-between gap-2 p-2">
                  <span className="min-w-0 truncate text-xs text-[#5C5348]">{image.name}</span>
                  <button
                    type="button"
                    onClick={() => setImages((currentImages) => currentImages.filter((item) => item.id !== image.id))}
                    className="shrink-0 rounded-lg px-2 py-1 font-display text-xs font-bold text-[#C62828] hover:bg-[#FFEBEE]"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {successMessage && <p className="mt-4 text-sm font-semibold text-[#0A4D27]">{successMessage}</p>}

      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={!isFormValid || isSubmitting}
        className="mt-5 h-12 rounded-2xl bg-[#FF7518] px-5 font-display text-sm font-semibold text-white shadow-[0_10px_26px_rgba(255,117,24,0.24)] transition hover:bg-[#E6640F] disabled:cursor-not-allowed disabled:opacity-60"
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
      <ReviewCard review={review} reviewerName={reviewerName} />
    </section>
  )
}

function ReviewCard({ review, reviewerName }: { review: BookingReview; reviewerName: string }) {
  return (
    <article className="mt-4 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-sm font-bold text-[#1A1C1E]">{getReviewCustomerName(review, reviewerName)}</p>
          <div className="mt-1 flex text-xl text-[#FF7518]" aria-label={`${review.rating} trên 5 sao`}>
            {renderStars(review.rating)}
          </div>
        </div>
        <span className="text-xs font-medium text-[#5C5348]">{formatReviewDate(review.createdAt)}</span>
      </div>
      <h4 className="mt-3 font-display text-base font-bold text-[#1A1C1E]">{review.title}</h4>
      <p className="mt-2 text-sm leading-6 text-[#5C5348]">{review.content}</p>
      {review.tags && review.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {review.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-[#FF7518]/25 bg-[#FFE8D6] px-3 py-1 text-xs font-semibold text-[#6B3200]">
              {tag}
            </span>
          ))}
        </div>
      )}
      {review.images && review.images.length > 0 && (
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {review.images.map((image) => (
            <img key={image.id} src={image.previewUrl} alt={image.name} className="h-24 w-full rounded-2xl object-cover" />
          ))}
        </div>
      )}
    </article>
  )
}

function FormTextInput({
  label,
  value,
  maxLength,
  placeholder,
  error,
  onChange,
}: {
  label: string
  value: string
  maxLength: number
  placeholder: string
  error: string
  onChange: (value: string) => void
}) {
  return (
    <label className="mt-4 block">
      <span className="font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">{label}</span>
      <input
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 h-12 w-full rounded-2xl border border-[#C9C2B6] bg-white px-4 text-sm text-[#1A1C1E] outline-none transition placeholder:text-[#8A8176] focus:border-[#FF7518] focus:ring-2 focus:ring-[#FF7518]/20"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-xs text-[#5C5348]">{value.length}/{maxLength}</span>
        {error && <FieldError message={error} />}
      </div>
    </label>
  )
}

function FieldError({ message }: { message: string }) {
  return <p className="text-xs font-semibold text-[#C62828]">{message}</p>
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
