'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminShell from '@/components/admin/AdminShell'
import AdminStatCard from '@/components/admin/AdminStatCard'
import { IconBookings } from '@/components/admin/AdminIcons'
import BookingDetailPanel from '@/components/admin/bookings/BookingDetailPanel'
import BookingFiltersBar from '@/components/admin/bookings/BookingFiltersBar'
import BookingTable from '@/components/admin/bookings/BookingTable'
import { fetchAdminBookings, updateAdminBookingStatus } from '@/lib/admin/adminBookingApi'
import type { AdminBooking, BookingFilters, BookingStatus } from '@/lib/admin/types'

const DEFAULT_FILTERS: BookingFilters = {
  query: '',
  bookingStatus: 'ALL',
  paymentStatus: 'ALL',
  date: '',
}

export default function AdminBookingsPage() {
  const [filters, setFilters] = useState<BookingFilters>(DEFAULT_FILTERS)
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState<AdminBooking | null>(null)

  const loadBookings = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchAdminBookings(filters)
      setBookings(data)
      setSelected((current) => {
        if (!current) return null
        return data.find((b) => b.bookingId === current.bookingId) ?? null
      })
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    const timer = setTimeout(() => void loadBookings(), 200)
    return () => clearTimeout(timer)
  }, [loadBookings])

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      active: bookings.filter((b) => b.bookingStatus === 'DA_CHECKIN').length,
      pending: bookings.filter((b) => b.bookingStatus === 'CHO_THANH_TOAN').length,
    }
  }, [bookings])

  const handleStatusChange = async (bookingId: number, status: BookingStatus) => {
    const updated = await updateAdminBookingStatus(bookingId, status)
    if (!updated) throw new Error('update failed')
    await loadBookings()
    setSelected(updated)
  }

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <AdminShell>
        <AdminPageHeader
          eyebrow="Đơn đặt phòng"
          title="Quản lý booking"
          description="Theo dõi đơn đặt, trạng thái thanh toán và thông tin khách hàng."
          breadcrumbs={[
            { label: 'Tổng quan', href: '/admin/dashboard' },
            { label: 'Booking' },
          ]}
        />

        <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <AdminStatCard
              label="Kết quả lọc"
              value={stats.total}
              icon={<IconBookings className="h-5 w-5" />}
            />
            <AdminStatCard
              label="Đang sử dụng"
              value={stats.active}
              accent="secondary"
              icon={<span className="text-base">◉</span>}
            />
            <AdminStatCard
              label="Chờ thanh toán"
              value={stats.pending}
              accent="tertiary"
              icon={<span className="text-base">⏳</span>}
            />
          </div>

          <BookingFiltersBar filters={filters} onChange={setFilters} resultCount={bookings.length} />

          <BookingTable
            bookings={bookings}
            isLoading={isLoading}
            selectedId={selected?.bookingId ?? null}
            onSelect={setSelected}
          />

          <p className="pb-4 text-center text-[11px] text-on-surface-variant">
            * Demo FE — dữ liệu mock, sẽ kết nối API khi tích hợp backend.
          </p>
        </div>

        <BookingDetailPanel
          booking={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      </AdminShell>
    </AuthGuard>
  )
}
