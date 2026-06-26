'use client'

import { useEffect, useState } from 'react'
import {
  CustomerCard,
  CustomerPageHeader,
  CustomerPageShell,
} from '@/components/customer/CustomerPageShell'
import {
  fetchCustomerBookings,
  formatBookingStatus,
  type CustomerBookingSummary,
} from '@/lib/customer-account-service'
import { formatCurrency } from '@/components/booking/booking-data'

export default function CustomerBookingsPage() {
  const [bookings, setBookings] = useState<CustomerBookingSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    void fetchCustomerBookings()
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

  return (
    <CustomerPageShell>
      <CustomerPageHeader
        title="Lịch sử đặt phòng"
        description="Theo dõi các lịch đặt phòng của bạn."
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
              <article
                key={booking.id}
                className="grid gap-4 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-5 md:grid-cols-[1fr_auto]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-bold text-[#1A1C1E]">{booking.roomName}</h2>
                    <span className="rounded-full bg-[#FFE8D6] px-3 py-1 font-display text-xs font-bold text-[#6B3200]">
                      {formatBookingStatus(booking.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#5C5348]">Mã đặt phòng: {booking.code}</p>
                  <p className="mt-1 text-sm text-[#5C5348]">
                    {booking.date} · {booking.timeRange}
                  </p>
                </div>
                <p className="font-display text-xl font-bold text-[#FF7518]">{formatCurrency(booking.total)}</p>
              </article>
            ))}
          </div>
        )}
      </CustomerCard>
    </CustomerPageShell>
  )
}
