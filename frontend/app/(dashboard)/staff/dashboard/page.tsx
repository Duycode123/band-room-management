import StaffSchedulePage from '@/components/staff/StaffSchedulePage'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import { useAuth } from '@/contexts/AuthContext'
import { fetchRooms } from '@/lib/booking/bookingApi'
import { fetchAdminBookings } from '@/lib/admin/adminBookingApi'
import { fetchAdminEquipment } from '@/lib/admin/equipment/adminEquipmentApi'
import type { AdminBooking } from '@/lib/admin/types'
import type { AdminEquipment } from '@/lib/admin/equipment/types'

const emptyBookingFilters = {
  query: '',
  bookingStatus: 'ALL' as const,
  paymentStatus: 'ALL' as const,
  date: '',
}

export default function StaffDashboardPage() {
  const router = useRouter()
  const { logout } = useAuth()
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [equipment, setEquipment] = useState<AdminEquipment[]>([])
  const [roomCount, setRoomCount] = useState<number | null>(null)

  useEffect(() => {
    let active = true

    void Promise.all([
      fetchAdminBookings(emptyBookingFilters).catch(() => []),
      fetchAdminEquipment({
        query: '',
        equipmentType: 'ALL',
        status: 'ALL',
        sortBy: 'room',
        sortOrder: 'asc',
      }).catch(() => []),
      fetchRooms().catch(() => []),
    ]).then(([nextBookings, nextEquipment, rooms]) => {
      if (!active) return

      setBookings(nextBookings)
      setEquipment(nextEquipment)
      setRoomCount(rooms.length)
    })

    return () => {
      active = false
    }
  }, [])

  const pendingBookings = useMemo(() => {
    return bookings.filter((booking) => booking.bookingStatus === 'PENDING_PAYMENT').length
  }, [bookings])

  const maintenanceEquipment = useMemo(() => {
    return equipment.filter((item) => item.status === 'MAINTENANCE' || item.status === 'BROKEN').length
  }, [equipment])

  const handleLogout = async () => {
    await logout()
    router.replace('/')
  }

  return (
    <AuthGuard allowedRoles={['STAFF']}>
      <main className="min-h-screen bg-slate-50 p-8">
        <section className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Nhan vien</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">Trang lam viec nhan vien</h1>
              <p className="mt-2 text-slate-500">
                Dashboard nay dang doc booking, equipment va room data that thay vi cac o trang thai tinh.
              </p>
            </div>
            <button onClick={handleLogout} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Dang xuat
            </button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-100 p-5">
              <p className="text-sm text-slate-500">Lich cho xu ly</p>
              <strong className="mt-2 block text-2xl text-slate-900">{pendingBookings}</strong>
              <p className="mt-2 text-sm text-slate-500">Booking dang o trang thai cho thanh toan.</p>
            </div>
            <div className="rounded-xl border border-slate-100 p-5">
              <p className="text-sm text-slate-500">Tinh trang phong</p>
              <strong className="mt-2 block text-2xl text-slate-900">{roomCount ?? '...'}</strong>
              <p className="mt-2 text-sm text-slate-500">Tong phong backend hien tra ve cho nhan vien.</p>
            </div>
            <div className="rounded-xl border border-slate-100 p-5">
              <p className="text-sm text-slate-500">Can kiem tra thiet bi</p>
              <strong className="mt-2 block text-2xl text-slate-900">{maintenanceEquipment}</strong>
              <p className="mt-2 text-sm text-slate-500">So thiet bi dang bao tri hoac hu hong.</p>
            </div>
          </div>
        </section>
      </main>
    </AuthGuard>
  )
}
