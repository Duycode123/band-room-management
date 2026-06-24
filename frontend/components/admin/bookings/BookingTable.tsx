import { formatAdminPrice, formatBookingTimeRange } from '@/lib/admin/adminBookingApi'
import type { AdminBooking } from '@/lib/admin/types'
import { BookingStatusBadge, PaymentStatusBadge } from './BookingBadges'

type BookingTableProps = {
  bookings: AdminBooking[]
  isLoading: boolean
  selectedId: number | null
  onSelect: (booking: AdminBooking) => void
}

export default function BookingTable({ bookings, isLoading, selectedId, onSelect }: BookingTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-surface-container" />
          ))}
        </div>
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-outline-variant bg-white px-6 py-12 text-center shadow-[var(--shadow-card)]">
        <p className="font-display text-sm font-medium text-on-surface">Không tìm thấy đơn đặt phòng</p>
        <p className="mt-1 text-xs text-on-surface-variant">Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low">
              {['Mã đơn', 'Khách hàng', 'Phòng', 'Thời gian', 'Booking', 'Thanh toán', 'Tổng tiền'].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => {
              const active = selectedId === booking.bookingId
              return (
                <tr
                  key={booking.bookingId}
                  onClick={() => onSelect(booking)}
                  className={[
                    'cursor-pointer border-b border-outline-variant/60 transition-colors last:border-0',
                    active ? 'bg-primary-container/25' : 'hover:bg-surface-container-low',
                  ].join(' ')}
                >
                  <td className="px-4 py-3 font-display text-xs font-semibold text-brand-orange">
                    {booking.bookingCode}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-on-surface">{booking.customerName}</p>
                    <p className="text-xs text-on-surface-variant">{booking.customerPhone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-on-surface">{booking.roomName}</p>
                    <p className="text-xs text-on-surface-variant">{booking.roomType}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-on-surface-variant">
                    {formatBookingTimeRange(booking.startTime, booking.endTime)}
                    <span className="mt-0.5 block text-on-surface">{booking.durationHours} giờ</span>
                  </td>
                  <td className="px-4 py-3">
                    <BookingStatusBadge status={booking.bookingStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <PaymentStatusBadge status={booking.paymentStatus} />
                  </td>
                  <td className="px-4 py-3 font-display text-sm font-semibold text-on-surface">
                    {formatAdminPrice(booking.totalPrice)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
