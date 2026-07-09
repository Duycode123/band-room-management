import {
  formatAdminPrice,
  formatBookingClockRange,
  formatBookingDayHeading,
  getBookingDateKey,
} from '@/lib/admin/adminBookingApi'
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
        <p className="mt-1 text-xs text-on-surface-variant">Thử đổi bộ lọc hoặc bấm Hôm nay / Ngày mai.</p>
      </div>
    )
  }

  const groups = groupBookingsByDate(bookings)

  return (
    <div className="flex max-h-[min(70vh,680px)] flex-col overflow-hidden rounded-xl border border-outline-variant bg-white shadow-[var(--shadow-card)]">
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="min-w-[920px] w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-outline-variant bg-surface-container-low">
              {['Mã đơn', 'Khách hàng', 'Phòng', 'Giờ', 'Booking', 'Thanh toán', 'Tổng tiền'].map((h) => (
                <th
                  key={h}
                  className="bg-surface-container-low px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <DayGroup
                key={group.dateKey}
                group={group}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="shrink-0 border-t border-outline-variant bg-surface-container-low/60 px-4 py-2.5 text-xs text-on-surface-variant">
        {groups.length} ngày · {bookings.length} đơn
      </div>
    </div>
  )
}

function DayGroup({
  group,
  selectedId,
  onSelect,
}: {
  group: BookingDayGroup
  selectedId: number | null
  onSelect: (booking: AdminBooking) => void
}) {
  return (
    <>
      <tr className="border-b border-outline-variant">
        <td colSpan={7} className="sticky top-[41px] z-[5] bg-[#F7F3EC] px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-sm font-bold capitalize text-on-surface">{group.label}</p>
            <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-on-surface-variant shadow-sm">
              {group.items.length} đơn
            </span>
          </div>
        </td>
      </tr>

      {group.items.map((booking) => {
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
            <td className="px-4 py-3">
              <p className="font-display text-sm font-semibold tabular-nums text-on-surface">
                {formatBookingClockRange(booking.startTime, booking.endTime)}
              </p>
              <p className="text-xs text-on-surface-variant">{booking.durationHours} giờ</p>
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
    </>
  )
}

type BookingDayGroup = {
  dateKey: string
  label: string
  items: AdminBooking[]
}

function groupBookingsByDate(bookings: AdminBooking[]): BookingDayGroup[] {
  const map = new Map<string, AdminBooking[]>()

  bookings.forEach((booking) => {
    const key = getBookingDateKey(booking.startTime) || 'unknown'
    const list = map.get(key) ?? []
    list.push(booking)
    map.set(key, list)
  })

  return [...map.entries()].map(([dateKey, items]) => ({
    dateKey,
    label: formatBookingDayHeading(items[0]?.startTime ?? dateKey),
    items,
  }))
}
