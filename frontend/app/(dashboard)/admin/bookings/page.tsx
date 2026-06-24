'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import BookingDetailPanel from '@/components/admin/bookings/BookingDetailPanel'
import BookingFiltersBar from '@/components/admin/bookings/BookingFiltersBar'
import BookingTable from '@/components/admin/bookings/BookingTable'
import { useAuth } from '@/contexts/AuthContext'
import { fetchAdminBookings, updateAdminBookingStatus } from '@/lib/admin/adminBookingApi'
import type { AdminBooking, BookingFilters, BookingStatus } from '@/lib/admin/types'

const DEFAULT_FILTERS: BookingFilters = {
  query: '',
  bookingStatus: 'ALL',
  paymentStatus: 'ALL',
  date: '',
}

export default function AdminBookingsPage() {
  const router = useRouter()
  const { logout } = useAuth()
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

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <main className="min-h-screen bg-brand-bgGray">
        <header className="border-b border-outline-variant bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
            <div>
              <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-brand-orange">
                Quản trị
              </p>
              <h1 className="font-display text-2xl font-bold tracking-tight text-on-surface">
                Quản lý đơn đặt phòng
              </h1>
              <p className="mt-1 text-sm text-on-surface-variant">
                Theo dõi booking, trạng thái thanh toán và thông tin khách hàng.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/dashboard"
                className="rounded-lg border border-outline px-4 py-2 font-display text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-lg bg-inverse-surface px-4 py-2 font-display text-sm font-medium text-inverse-on-surface"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-5 p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Kết quả lọc" value={String(stats.total)} />
            <StatCard label="Đang sử dụng" value={String(stats.active)} accent="secondary" />
            <StatCard label="Chờ thanh toán" value={String(stats.pending)} accent="tertiary" />
          </div>

          <BookingFiltersBar filters={filters} onChange={setFilters} resultCount={bookings.length} />

          <BookingTable
            bookings={bookings}
            isLoading={isLoading}
            selectedId={selected?.bookingId ?? null}
            onSelect={setSelected}
          />

          <p className="text-center text-[11px] text-on-surface-variant">
            * Demo FE — dữ liệu mock, sẽ kết nối API `/api/admin/bookings` khi tích hợp backend.
          </p>
        </div>

        <BookingDetailPanel
          booking={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      </main>
    </AuthGuard>
  )
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: 'secondary' | 'tertiary'
}) {
  const valueClass =
    accent === 'secondary'
      ? 'text-secondary'
      : accent === 'tertiary'
        ? 'text-tertiary'
        : 'text-on-surface'

  return (
    <div className="rounded-xl border border-outline-variant bg-white p-4 shadow-[var(--shadow-card)]">
      <p className="font-display text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
        {label}
      </p>
      <p className={['mt-1 font-display text-2xl font-bold', valueClass].join(' ')}>{value}</p>
    </div>
  )
}
