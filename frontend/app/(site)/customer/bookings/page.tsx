'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CustomerCard,
  CustomerPageHeader,
  CustomerPageShell,
} from '@/components/customer/CustomerPageShell'
import BookingDetailModal, { getReviewerName } from '@/components/customer/BookingDetailModal'
import BookingHistoryCard from '@/components/customer/BookingHistoryCard'
import BookingHistoryEmpty from '@/components/customer/BookingHistoryEmpty'
import BookingHistoryFilters from '@/components/customer/BookingHistoryFilters'
import BookingHistorySkeleton from '@/components/customer/BookingHistorySkeleton'
import BookingHistoryStats from '@/components/customer/BookingHistoryStats'
import { useAuth } from '@/contexts/AuthContext'
import {
  defaultBookingHistoryFilters,
  filterBookingHistory,
  type BookingHistoryFilterState,
} from '@/lib/customer/booking-history-filters'
import {
  groupBookingHistory,
  type BookingHistoryGroupId,
} from '@/lib/customer/booking-history-groups'
import {
  getBookingDetail,
  getCustomerBookings,
  type BookingHistoryItem,
  type BookingReview,
} from '@/lib/customer-booking-service'

const GROUP_TABS: Array<{ id: 'ALL' | BookingHistoryGroupId; label: string }> = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'action', label: 'Cần thanh toán' },
  { id: 'upcoming', label: 'Sắp diễn ra' },
  { id: 'past', label: 'Đã qua' },
  { id: 'cancelled', label: 'Đã hủy' },
]

export default function CustomerBookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<BookingHistoryItem[]>([])
  const [filters, setFilters] = useState<BookingHistoryFilterState>(defaultBookingHistoryFilters)
  const [selectedBooking, setSelectedBooking] = useState<BookingHistoryItem | null>(null)
  const [activeGroup, setActiveGroup] = useState<'ALL' | BookingHistoryGroupId>('ALL')
  const [isLoading, setIsLoading] = useState(true)

  const filteredBookings = useMemo(() => filterBookingHistory(bookings, filters), [bookings, filters])
  const bookingGroups = useMemo(() => groupBookingHistory(filteredBookings), [filteredBookings])
  const visibleGroups = useMemo(
    () => (activeGroup === 'ALL' ? bookingGroups : bookingGroups.filter((group) => group.id === activeGroup)),
    [bookingGroups, activeGroup],
  )

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

  const handleSelectBooking = async (bookingId: string, backendBookingId?: number) => {
    const detail = await getBookingDetail(bookingId, backendBookingId)
    if (detail) setSelectedBooking(detail)
  }

  const handleReviewSubmitted = (review: BookingReview) => {
    setBookings((currentBookings) =>
      currentBookings.map((booking) =>
        booking.bookingId === review.bookingId ? { ...booking, review } : booking,
      ),
    )
    setSelectedBooking((currentBooking) =>
      currentBooking && currentBooking.bookingId === review.bookingId
        ? { ...currentBooking, review }
        : currentBooking,
    )
  }

  return (
    <CustomerPageShell>
      <CustomerPageHeader
        eyebrow="Tài khoản"
        title="Lịch sử đặt phòng"
        description="Theo dõi lịch đặt, xem chi tiết và gửi đánh giá sau khi hoàn tất buổi sử dụng."
      />

      {!isLoading && bookings.length > 0 && (
        <div className="mb-6">
          <BookingHistoryStats bookings={bookings} />
        </div>
      )}

      <CustomerCard className="!p-0">
        <div className="border-b border-outline-variant/80 px-5 py-5 sm:px-7 sm:py-6">
          <h2 className="font-display text-xl font-bold text-on-surface">Danh sách đặt phòng</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Chọn một đơn để xem chi tiết, thanh toán hoặc đánh giá.
          </p>
        </div>

        <div className="space-y-5 px-5 pt-5 sm:space-y-6 sm:px-7 sm:pt-6">
          {!isLoading && bookings.length > 0 && (
            <BookingHistoryFilters
              value={filters}
              onChange={setFilters}
              totalCount={bookings.length}
              filteredCount={filteredBookings.length}
              disabled={isLoading}
            />
          )}

          {!isLoading && bookings.length > 0 && (
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Nhóm đơn đặt phòng">
              {GROUP_TABS.map((tab) => {
                const count =
                  tab.id === 'ALL'
                    ? filteredBookings.length
                    : bookingGroups.find((group) => group.id === tab.id)?.bookings.length ?? 0
                const isActive = activeGroup === tab.id

                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveGroup(tab.id)}
                    className={[
                      'rounded-full border px-4 py-2 font-display text-xs font-semibold transition-all',
                      isActive
                        ? 'border-brand-orange bg-brand-orange text-white shadow-[var(--shadow-card)]'
                        : 'border-outline-variant bg-white text-on-surface-variant hover:border-brand-orange/40 hover:text-brand-orange',
                    ].join(' ')}
                  >
                    {tab.label}
                    <span
                      className={[
                        'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                        isActive ? 'bg-white/20 text-white' : 'bg-surface-container text-on-surface-variant',
                      ].join(' ')}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          <div className="panel-scroll max-h-[min(640px,calc(100dvh-19rem))] min-h-[260px] overflow-y-auto rounded-2xl border border-outline-variant/70 bg-surface-container-low/40 p-3 sm:p-4">
            {isLoading ? (
              <BookingHistorySkeleton />
            ) : bookings.length === 0 ? (
              <BookingHistoryEmpty variant="no-bookings" />
            ) : visibleGroups.length === 0 ? (
              <BookingHistoryEmpty
                variant="no-results"
                onClearFilters={() => {
                  setFilters(defaultBookingHistoryFilters)
                  setActiveGroup('ALL')
                }}
              />
            ) : (
              <div className="space-y-6">
                {visibleGroups.map((group) => (
                  <section key={group.id}>
                    <div className="mb-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 px-1">
                      <h3
                        className={[
                          'font-display text-sm font-bold uppercase tracking-wider',
                          group.id === 'action' ? 'text-brand-orange' : 'text-on-surface',
                        ].join(' ')}
                      >
                        {group.title}
                        <span className="ml-2 rounded-full bg-surface-container px-2 py-0.5 font-display text-[11px] font-bold text-on-surface-variant">
                          {group.bookings.length}
                        </span>
                      </h3>
                      <p className="text-xs text-on-surface-variant">{group.description}</p>
                    </div>
                    <div className="grid gap-4">
                      {group.bookings.map((booking) => (
                        <BookingHistoryCard
                          key={booking.bookingId}
                          booking={booking}
                          onSelect={() => void handleSelectBooking(booking.bookingId, booking.backendBookingId)}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="h-5 sm:h-6" aria-hidden />
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
