'use client'

import { useEffect, useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import CustomerModuleCard from '@/components/customer/CustomerModuleCard'
import CustomerShell from '@/components/customer/CustomerShell'
import {
  IconBooking,
  IconCalendar,
  IconGift,
  IconMusic,
  IconSparkle,
} from '@/components/customer/CustomerIcons'
import { useHomepageLiveData } from '@/hooks/useHomepageLiveData'
import { fetchRooms } from '@/lib/booking/bookingApi'
import { getCustomerBookings } from '@/lib/customer-booking-service'

export default function CustomerDashboardPage() {
  const { availabilityStatus } = useHomepageLiveData()
  const [roomCount, setRoomCount] = useState<number | null>(null)
  const [bookingCount, setBookingCount] = useState<number | null>(null)

  useEffect(() => {
    let active = true

    void Promise.all([
      fetchRooms().catch(() => []),
      getCustomerBookings().catch(() => []),
    ]).then(([rooms, bookings]) => {
      if (!active) return

      setRoomCount(rooms.length)
      setBookingCount(bookings.length)
    })

    return () => {
      active = false
    }
  }, [])

  return (
    <AuthGuard allowedRoles={['CUSTOMER']}>
      <CustomerShell>
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-orange via-[#FF8C3A] to-[#FFB07A] p-8 text-white shadow-[var(--shadow-elevated)] sm:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.35) 0%, transparent 45%), radial-gradient(circle at 10% 90%, rgba(4,42,22,0.25) 0%, transparent 50%)',
              }}
            />
            <div
              aria-hidden
              className="absolute -right-6 -top-6 h-40 w-40 rounded-full bg-white/15 blur-2xl"
            />

            <div className="relative flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-lg">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                  <IconSparkle className="h-3.5 w-3.5" />
                  Welcome back BandSpace
                </div>
                <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  San sang cho buoi tap hom nay?
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-white/90 sm:text-base">
                  Dashboard nay dang doc phong va lich dat tu backend, khong con hardcode thong ke tong quan nua.
                </p>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/15 px-5 py-4 backdrop-blur-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                  <IconMusic className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-display text-2xl font-bold">
                    {availabilityStatus.count > 0 ? availabilityStatus.count : roomCount ?? '...'}
                  </p>
                  <p className="text-xs text-white/80">phong trong hien tai</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-outline-variant bg-white p-5 shadow-[var(--shadow-card)]">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Tong booking</p>
              <p className="mt-2 font-display text-3xl font-bold text-on-surface">{bookingCount ?? '...'}</p>
              <p className="mt-2 text-sm text-on-surface-variant">Lay tu `/api/bookings/my/history`.</p>
            </div>
            <div className="rounded-2xl border border-outline-variant bg-white p-5 shadow-[var(--shadow-card)]">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Tong phong</p>
              <p className="mt-2 font-display text-3xl font-bold text-on-surface">{roomCount ?? '...'}</p>
              <p className="mt-2 text-sm text-on-surface-variant">Lay tu `/api/rooms`.</p>
            </div>
          </section>

          <section className="mt-10">
            <div className="mb-5">
              <h2 className="font-display text-xl font-bold text-on-surface">Bat dau nhanh</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Chon tinh nang ban can, cac card ben duoi deu dan sang flow backend that.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <CustomerModuleCard
                href="/customer/booking"
                label="Dat phong"
                title="Chon phong & lich"
                description="Xem lich trong real-time, chon nhieu gio lien tiep va xac nhan dat phong ngay."
                icon={<IconBooking className="h-6 w-6" />}
                accent="orange"
                badge="Live"
                featured
              />
              <CustomerModuleCard
                href="/customer/bookings"
                label="Lich cua toi"
                title="Don da dat"
                description="Theo doi lich tap, lich su booking, review va trang thai thanh toan tu backend."
                icon={<IconCalendar className="h-6 w-6" />}
                accent="green"
              />
              <CustomerModuleCard
                href="/customer/report-issue"
                label="Ho tro"
                title="Bao cao su co"
                description="Gui van de va booking reference len backend de doi ngu xu ly."
                icon={<IconGift className="h-6 w-6" />}
                accent="amber"
              />
              <div className="relative overflow-hidden rounded-2xl border border-outline-variant bg-gradient-to-br from-secondary via-brand-greenDark to-brand-greenLight p-6 text-white shadow-[var(--shadow-card)]">
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-brand-orange/20 blur-2xl" />
                <p className="relative font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-orange">
                  Trang thai live
                </p>
                <p className="relative mt-2 font-display text-lg font-bold">
                  {availabilityStatus.label}
                </p>
                <p className="relative mt-2 text-sm text-inverse-on-surface/80">
                  Badge nay dang dong bo voi du lieu homepage live thay vi mot con so hardcode.
                </p>
              </div>
            </div>
          </section>
        </div>
      </CustomerShell>
    </AuthGuard>
  )
}
