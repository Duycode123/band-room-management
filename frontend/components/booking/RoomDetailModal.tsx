'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import HomepageModalShell, { ModalCloseButton } from '@/components/booking/HomepageModalShell'
import {
  formatCurrency,
  formatRelativeTime,
  maskCustomerName,
  type BookingRoom,
} from '@/components/booking/booking-data'
import { fetchPublicReviewsByRoomId } from '@/lib/public-room-review-service'
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

const roomPolicies = [
  'Có thể hủy trước 2 giờ',
  'Đến đúng giờ để giữ lịch',
  'Có thể thuê thêm thiết bị khi đặt phòng',
]

function getAvailabilityLabel(room: BookingRoom) {
  if (!room.availabilityKnown) return 'Xem lịch trống theo thời gian thực'
  if (!room.isAvailable) return 'Kín lịch hôm nay'
  if (room.nextAvailableTime) return `Trống từ ${room.nextAvailableTime}`

  return 'Còn trống hôm nay'
}

function getAvailabilityDescription(room: BookingRoom) {
  if (!room.availabilityKnown) {
    return 'Backend chưa trả về trạng thái phòng theo thời gian thực. Bạn vẫn có thể mở lịch để kiểm tra khung giờ trống.'
  }

  if (room.isAvailable) {
    return 'Dữ liệu lịch trống đang được đồng bộ trực tiếp từ backend cho ngày hôm nay.'
  }

  return 'Backend đang cho biết phòng đã kín lịch trong hôm nay. Bạn có thể chọn ngày khác để kiểm tra lại.'
}

function getAvatarInitial(customerName?: string) {
  return customerName?.trim().charAt(0).toUpperCase() || 'K'
}

function renderRatingStars(rating: number) {
  const filledStars = Math.max(0, Math.min(5, Math.round(rating)))

  return Array.from({ length: 5 }, (_, index) => (
    <span key={index} className={index < filledStars ? 'text-[#FF7518]' : 'text-[#D8D1C7]'}>
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
                <span
                  key={tag}
                  className="rounded-full border border-[#FF7518]/25 bg-[#FFE8D6] px-2.5 py-1 text-[11px] font-semibold text-[#6B3200]"
                >
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
  const [backendReviews, setBackendReviews] = useState<BookingReview[]>([])
  const [isLoadingReviews, setIsLoadingReviews] = useState(false)

  useEffect(() => {
    if (!open || !room) return

    let active = true
    setIsLoadingReviews(true)

    void fetchPublicReviewsByRoomId(room.id)
      .then((reviews) => {
        if (!active) return

        setBackendReviews(reviews)
      })
      .catch(() => {
        if (!active) return

        setBackendReviews([])
      })
      .finally(() => {
        if (!active) return

        setIsLoadingReviews(false)
      })

    return () => {
      active = false
    }
  }, [open, room])

  if (!open || !room) return null

  const availabilityLabel = getAvailabilityLabel(room)
  const reviews = getRoomReviewsByRoomId(room.id, backendReviews)
  const averageRating = getAverageReviewRating(reviews)
  const visibleReviews = reviews.slice(0, 2)
  const displayRating = reviews.length > 0 ? averageRating : room.rating
  const factualDetails = [
    { label: 'Loại phòng', value: room.type },
    { label: 'Vị trí', value: room.location },
    { label: 'Sức chứa', value: room.capacity },
  ]

  return (
    <HomepageModalShell
      open={open}
      onClose={onClose}
      labelledBy="room-detail-title"
      closeLabel="Đóng chi tiết phòng"
      maxWidthClassName="max-w-[1040px]"
      bodyClassName="bg-[#F5F2EC] p-0"
    >
        <div className="relative aspect-[16/9] min-h-[220px] overflow-hidden rounded-t-[24px] bg-[#042A16] sm:aspect-[21/9]">
          {room.image ? (
            <Image
              src={room.image}
              alt={room.name}
              fill
              sizes="(min-width: 768px) 880px, 100vw"
              className={`object-cover ${room.imageClassName}`}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,#FFE8D6,transparent_52%),linear-gradient(135deg,#042A16,#0B3E24)] px-6 text-center">
              <div>
                <p className="font-display text-2xl font-bold text-white">{room.name}</p>
                <p className="mt-3 text-sm text-white/72">Backend chưa cung cấp ảnh cho phòng này.</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(4,42,22,0.86),rgba(4,42,22,0.2)_55%,rgba(4,42,22,0.1))]" />
          <ModalCloseButton
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full border-white/20 bg-white/95 text-[#1A1C1E] shadow-[0_12px_30px_rgba(0,0,0,0.18)] hover:bg-[#FFE8D6]"
            label="Đóng chi tiết phòng"
          />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#FFE8D6] px-3 py-1 font-display text-xs font-bold uppercase text-[#042A16]">
                {room.categoryLabel}
              </span>
              {room.badge && (
                <span className="rounded-full bg-[#FF7518] px-3 py-1 font-display text-xs font-bold uppercase text-white">
                  {room.badge}
                </span>
              )}
            </div>
            <h2 id="room-detail-title" className="font-display text-3xl font-bold text-white sm:text-4xl">
              {room.name}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/72">
              {room.description || 'Backend chưa cung cấp mô tả chi tiết cho phòng này.'}
            </p>
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1fr_300px]">
          <div className="space-y-5">
            <section className="rounded-xl border border-[#E8E4DC] bg-white p-5 shadow-[0_12px_34px_rgba(26,28,30,0.06)]">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="font-display text-xs font-bold uppercase text-[#5C5348]">Rating</p>
                  <p className="mt-1 font-display text-xl font-bold text-[#1A1C1E]">
                    {typeof displayRating === 'number' ? `${displayRating.toFixed(1)}/5` : 'Chưa có'}
                  </p>
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
              <h3 className="font-display text-lg font-bold text-[#1A1C1E]">Thông tin phòng</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {factualDetails.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-4">
                    <p className="font-display text-xs font-bold uppercase text-[#5C5348]">{item.label}</p>
                    <p className="mt-2 text-sm font-medium leading-6 text-[#1A1C1E]">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-[#E8E4DC] bg-white p-5 shadow-[0_12px_34px_rgba(26,28,30,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1A1C1E]">Đánh giá từ khách hàng</h3>
                  <p className="mt-1 text-sm text-[#5C5348]">
                    {isLoadingReviews
                      ? 'Đang tải đánh giá từ backend'
                      : reviews.length > 0
                        ? `${reviews.length} đánh giá gần nhất`
                        : 'Chưa có đánh giá'}
                  </p>
                </div>
                {reviews.length > 0 && (
                  <div className="shrink-0 text-right">
                    <p className="font-display text-xl font-bold text-[#FF7518]">{averageRating.toFixed(1)}/5</p>
                    <div className="mt-1 flex justify-end text-xs" aria-label={`${averageRating.toFixed(1)} trên 5 sao`}>
                      {renderRatingStars(averageRating)}
                    </div>
                  </div>
                )}
              </div>

              {isLoadingReviews ? (
                <div className="mt-4 rounded-2xl border border-dashed border-[#E8E4DC] bg-[#FAF8F4] p-4 text-sm leading-6 text-[#5C5348]">
                  Đang đồng bộ đánh giá công khai từ backend...
                </div>
              ) : reviews.length > 0 ? (
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
              <p className="mt-2 text-sm leading-6 text-[#5C5348]">{getAvailabilityDescription(room)}</p>
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
    </HomepageModalShell>
  )
}
