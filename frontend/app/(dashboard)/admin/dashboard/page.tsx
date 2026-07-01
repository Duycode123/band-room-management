'use client'

import { useEffect, useMemo, useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import AdminModuleCard from '@/components/admin/AdminModuleCard'
import AdminShell from '@/components/admin/AdminShell'
import AdminStatCard from '@/components/admin/AdminStatCard'
import {
  IconBookings,
  IconEquipment,
  IconReports,
  IconRooms,
  IconSparkle,
} from '@/components/admin/AdminIcons'
import { fetchRooms } from '@/lib/booking/bookingApi'
import { fetchAdminBookings, formatAdminPrice } from '@/lib/admin/adminBookingApi'
import { fetchAdminEquipment } from '@/lib/admin/equipment/adminEquipmentApi'
import type { AdminBooking } from '@/lib/admin/types'
import type { AdminEquipment } from '@/lib/admin/equipment/types'

const emptyBookingFilters = {
  query: '',
  bookingStatus: 'ALL' as const,
  paymentStatus: 'ALL' as const,
  date: '',
}

export default function AdminDashboardPage() {
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

  const paidRevenue = useMemo(() => {
    return bookings
      .filter((booking) => booking.paymentStatus === 'PAID')
      .reduce((total, booking) => total + booking.totalPrice, 0)
  }, [bookings])

  const activeModules = useMemo(() => {
    let count = 0
    if (bookings.length >= 0) count += 1
    if (equipment.length >= 0) count += 1
    if ((roomCount ?? 0) >= 0) count += 1
    return count
  }, [bookings.length, equipment.length, roomCount])

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <AdminShell>
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-greenDark via-brand-greenDark to-brand-greenLight p-8 text-white shadow-[var(--shadow-elevated)] sm:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 80%, rgba(255,117,24,0.35) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 40%)',
              }}
            />
            <div
              aria-hidden
              className="absolute right-0 top-0 h-full w-1/2 opacity-[0.07]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
                backgroundSize: '12px 12px',
              }}
            />

            <div className="relative flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                  <IconSparkle className="h-3.5 w-3.5 text-brand-orange" />
                  BandSpace Control Center
                </div>
                <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Bang dieu khien quan tri
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-inverse-on-surface/85 sm:text-base">
                  Thong ke ben duoi dang lay truc tiep tu booking, equipment va room APIs cua he thong.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-inverse-on-surface/70">
                    Module
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold">{activeModules}</p>
                  <p className="text-xs text-inverse-on-surface/70">dang dong bo</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-inverse-on-surface/70">
                    He thong
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold text-brand-orange">Live</p>
                  <p className="text-xs text-inverse-on-surface/70">backend data</p>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminStatCard
              label="Don dat phong"
              value={String(bookings.length)}
              hint="Lay tu /api/admin/bookings"
              accent="primary"
              icon={<IconBookings className="h-5 w-5" />}
            />
            <AdminStatCard
              label="Thiet bi"
              value={String(equipment.length)}
              hint="Lay tu /api/admin/equipment"
              accent="secondary"
              icon={<IconEquipment className="h-5 w-5" />}
            />
            <AdminStatCard
              label="Phong tap"
              value={roomCount === null ? '...' : String(roomCount)}
              hint="Lay tu /api/rooms"
              accent="default"
              icon={<IconRooms className="h-5 w-5" />}
            />
            <AdminStatCard
              label="Doanh thu da thu"
              value={formatAdminPrice(paidRevenue)}
              hint="Tong booking co paymentStatus = PAID"
              accent="tertiary"
              icon={<IconReports className="h-5 w-5" />}
            />
          </div>

          <section className="mt-10">
            <div className="mb-5">
              <h2 className="font-display text-xl font-bold text-on-surface">Truy cap nhanh</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Cac module dang bat dau tu datasource that cua he thong.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <AdminModuleCard
                href="/admin/bookings"
                label="Don dat phong"
                title="Quan ly booking"
                description="Theo doi don dat, thanh toan va thong tin khach hang theo du lieu backend hien tai."
                icon={<IconBookings className="h-6 w-6" />}
                accent="orange"
                badge="Live"
              />
              <AdminModuleCard
                href="/admin/equipment"
                label="Thiet bi cho thue"
                title="Quan ly thiet bi"
                description="CRUD thiet bi dang ghi doc truc tiep voi /api/admin/equipment."
                icon={<IconEquipment className="h-6 w-6" />}
                accent="green"
                badge="Live"
              />
              <AdminModuleCard
                label="Phong tap"
                title="Tong quan phong"
                description={`Dang co ${roomCount ?? '...'} phong doc duoc tu backend. Module room management chi tiet se duoc noi sau.`}
                icon={<IconRooms className="h-6 w-6" />}
                accent="amber"
                disabled
              />
              <AdminModuleCard
                label="Bao cao"
                title="Doanh thu & thong ke"
                description={`Tam tinh ${formatAdminPrice(paidRevenue)} doanh thu tu cac booking da thanh toan.`}
                icon={<IconReports className="h-6 w-6" />}
                accent="slate"
                disabled
              />
            </div>
          </section>
        </div>
      </AdminShell>
    </AuthGuard>
  )
}
