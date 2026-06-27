'use client'

import Image from 'next/image'
import { useEffect } from 'react'
import {
  formatCurrency,
  formatRelativeTime,
  maskCustomerName,
  roomReviews,
  type BookingRoom,
  type RoomCategory,
} from '@/components/booking/booking-data'
import {
  getAverageReviewRating,
  getRoomReviewsByRoomId,
  type BookingReview,
} from '@/lib/review-service'

type RoomDetailModalProps = {
  room: BookingRoom | null
  open: boolean
  onClose: () => void
  onBook: (room: BookingRoom) => void
}

const suitableServicesByCategory: Record<RoomCategory, string[]> = {
  standard: ['Luyện tập cá nhân', 'Warm-up trước show', 'Luyện kỹ thuật'],
  band: ['Tập band', 'Rehearsal setlist', 'Chuẩn bị biểu diễn'],
  recording: ['Thu âm', 'Mixing', 'Podcast', 'Sản xuất nhạc'],
  premium: ['Tập band cao cấp', 'Sản xuất nhạc', 'Live session', 'Private rehearsal'],
}

const roomPolicies = [
  'Có thể hủy trước 2 giờ',
  'Đến đúng giờ để giữ lịch',
  'Có thể thuê thêm thiết bị khi đặt phòng',
]

function getAvailabilityLabel(room: BookingRoom) {
  if (!room.isAvailable) return 'Kín lịch hôm nay'
  if (room.nextAvailableTime) return `Trống từ ${room.nextAvailableTime}`

  return 'Còn trống hôm nay'
}

function getAvatarInitial(customerName?: string) {
  return customerName?.trim().charAt(0).toUpperCase() || 'K'
}

function renderRatingStars(rating: number) {
  return Array.from({ length: 5 }, (_, index) => (
    <span key={index} className={index < rating ? 'text-[#FF7518]' : 'text-[#D8D1C7]'}>
      ★
    </span>
  ))
}

function ReviewItem({ review }: { review: BookingReview }) {
  const customerName = review.customerName || 'Khách hàng'

  return (
    <article className="rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFE8D6] font-display text-sm font-bold text-[#FF7518]">
          {getAvatarInitial(customerName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-display text-sm font-bold text-[#1A1C1E]">{maskCustomerName(customerName)}</p>
            <span className="text-xs font-medium text-[#5C5348]">{formatRelativeTime(review.createdAt)}</span>
          </div>
          <div className="mt-1 flex text-xs" aria-label={`${review.rating} trên 5 sao`}>
            {renderRatingStars(review.rating)}
          </div>
          <h4 className="mt-2 font-display text-sm font-bold text-[#1A1C1E]">{review.title}</h4>
          <p className="mt-1 text-sm leading-6 text-[#5C5348]">{review.content}</p>
          {review.tags && review.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {review.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-[#FF7518]/25 bg-[#FFE8D6] px-2.5 py-1 text-[11px] font-semibold text-[#6B3200]">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {review.images && review.images.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {review.images.map((image) => (
                <img key={image.id} src={image.previewUrl} alt={image.name} className="h-16 w-full rounded-xl object-cover" />
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export default function RoomDetailModal({ room, open, onClose, onBook }: RoomDetailModalProps) {
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  if (!open || !room) return null

  const suitableServices = suitableServicesByCategory[room.category]
  const availabilityLabel = getAvailabilityLabel(room)
  const reviews = getRoomReviewsByRoomId(room.id, roomReviews)
  const averageRating = getAverageReviewRating(reviews)
  const visibleReviews = reviews.slice(0, 2)

  return (
    <div
      className="fixed inset-0 z-[78] flex items-center justify-center bg-black/55 px-4 py-6"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="room-detail-title"
    >
      <div
        className="max-h-[calc(100vh-48px)] w-full max-w-[880px] overflow-y-auto rounded-[24px] border border-[#E8E4DC] bg-[#F5F2EC] shadow-[0_24px_80px_rgba(26,28,30,0.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative aspect-[16/9] min-h-[220px] overflow-hidden rounded-t-[24px] bg-[#042A16] sm:aspect-[21/9]">
          <Image
            src={room.image}
            alt={room.name}
            fill
            sizes="(min-width: 768px) 880px, 100vw"
            className={`object-cover ${room.imageClassName}`}
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(4,42,22,0.86),rgba(4,42,22,0.2)_55%,rgba(4,42,22,0.1))]" />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/95 text-xl leading-none text-[#1A1C1E] shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition hover:bg-[#FFE8D6]"
            aria-label="Đóng chi tiết phòng"
          >
            X
          </button>
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#FFE8D6] px-3 py-1 font-display text-xs font-bold uppercase text-[#042A16]">
                {room.categoryLabel}
              </span>
              <span className="rounded-full bg-[#FF7518] px-3 py-1 font-display text-xs font-bold uppercase text-white">
                {room.badge}
              </span>
            </div>
            <h2 id="room-detail-title" className="font-display text-3xl font-bold text-white sm:text-4xl">
              {room.name}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/72">{room.description}</p>
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1fr_300px]">
          <div className="space-y-5">
            <section className="rounded-xl border border-[#E8E4DC] bg-white p-5 shadow-[0_12px_34px_rgba(26,28,30,0.06)]">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="font-display text-xs font-bold uppercase text-[#5C5348]">Rating</p>
                  <p className="mt-1 font-display text-xl font-bold text-[#1A1C1E]">{room.rating}/5</p>
                </div>
                <div>
                  <p className="font-display text-xs font-bold uppercase text-[#5C5348]">Sức chứa</p>
                  <p className="mt-1 font-display text-xl font-bold text-[#1A1C1E]">{room.capacity}</p>
                </div>
                <div>
                  <p className="font-display text-xs font-bold uppercase text-[#5C5348]">Giá theo giờ</p>
                  <p className="mt-1 font-display text-xl font-bold text-[#FF7518]">
                    {formatCurrency(room.pricePerHour)}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-[#E8E4DC] bg-white p-5 shadow-[0_12px_34px_rgba(26,28,30,0.06)]">
              <h3 className="font-display text-lg font-bold text-[#1A1C1E]">Thiết bị có sẵn</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {room.includedEquipments.map((item) => (
                  <span
                    key={item}
                    className="rounded-lg border border-[#E8E4DC] bg-[#F5F2EC] px-3 py-2 font-display text-xs font-semibold text-[#5C5348]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-[#E8E4DC] bg-white p-5 shadow-[0_12px_34px_rgba(26,28,30,0.06)]">
              <h3 className="font-display text-lg font-bold text-[#1A1C1E]">Dịch vụ phù hợp</h3>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {suitableServices.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm font-medium text-[#5C5348]">
                    <span className="h-2 w-2 rounded-full bg-[#FF7518]" />
                    {item}
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-xl border border-[#E8E4DC] bg-white p-5 shadow-[0_12px_34px_rgba(26,28,30,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1A1C1E]">Đánh giá từ khách hàng</h3>
                  <p className="mt-1 text-sm text-[#5C5348]">
                    {reviews.length > 0 ? `${reviews.length} đánh giá gần nhất` : 'Chưa có đánh giá'}
                  </p>
                </div>
                {reviews.length > 0 && (
                  <div className="shrink-0 text-right">
                    <p className="font-display text-xl font-bold text-[#FF7518]">
                      {averageRating.toFixed(1)}/5
                    </p>
                    <div className="mt-1 flex justify-end text-xs" aria-label={`${averageRating.toFixed(1)} trên 5 sao`}>
                      {renderRatingStars(Math.round(averageRating))}
                    </div>
                  </div>
                )}
              </div>

              {reviews.length > 0 ? (
                <div className="mt-4 grid gap-3">
                  {visibleReviews.map((review) => (
                    <ReviewItem key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-[#E8E4DC] bg-[#FAF8F4] p-4 text-sm leading-6 text-[#5C5348]">
                  Phòng này chưa có đánh giá. Hãy là người đầu tiên trải nghiệm.
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-xl border border-[#E8E4DC] bg-white p-5 shadow-[0_12px_34px_rgba(26,28,30,0.06)]">
              <p className="font-display text-xs font-bold uppercase text-[#FF7518]">Trạng thái hôm nay</p>
              <p className="mt-2 font-display text-2xl font-bold text-[#1A1C1E]">{availabilityLabel}</p>
              <p className="mt-2 text-sm leading-6 text-[#5C5348]">{room.note}</p>
            </section>

            <section className="rounded-xl border border-[#E8E4DC] bg-white p-5 shadow-[0_12px_34px_rgba(26,28,30,0.06)]">
              <h3 className="font-display text-lg font-bold text-[#1A1C1E]">Chính sách</h3>
              <div className="mt-4 space-y-3">
                {roomPolicies.map((policy) => (
                  <div key={policy} className="flex gap-2 text-sm leading-6 text-[#5C5348]">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF7518]" />
                    <span>{policy}</span>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => onBook(room)}
                className="rounded-lg bg-[#FF7518] px-5 py-3.5 font-display text-sm font-bold text-white shadow-[0_14px_34px_rgba(255,117,24,0.28)] transition hover:bg-[#E6640F]"
              >
                Đặt phòng này
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#E8E4DC] bg-white px-5 py-3.5 font-display text-sm font-bold text-[#5C5348] transition hover:bg-[#FFE8D6] hover:text-[#1A1C1E]"
              >
                Đóng
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
