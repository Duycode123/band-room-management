'use client'

import AuthGuard from '@/components/AuthGuard'
import AdminModuleCard from '@/components/admin/AdminModuleCard'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminShell from '@/components/admin/AdminShell'
import {
  IconBookings,
  IconEquipment,
  IconRooms,
  IconSparkle,
} from '@/components/admin/AdminIcons'

export default function AdminDashboardPage() {
  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <AdminShell>
        <AdminPageHeader
          eyebrow="Kinh doanh"
          title="Bảng điều khiển admin"
          description="Truy cập nhanh các màn hình vận hành của BandHub Studio."
        />

        <div className="mx-auto max-w-7xl space-y-8 px-5 py-6 sm:px-8">
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
                  Bảng điều khiển quản trị
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-inverse-on-surface/85 sm:text-base">
                  Quản lý booking, phòng tập, thiết bị và lịch staff từ một nơi.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-inverse-on-surface/70">
                    Vai trò
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold text-brand-orange">ADMIN</p>
                  <p className="text-xs text-inverse-on-surface/70">toàn quyền vận hành</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-inverse-on-surface/70">
                    Admin route
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold">Protected</p>
                  <p className="text-xs text-inverse-on-surface/70">chỉ role ADMIN được xem</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-5">
              <h2 className="font-display text-xl font-bold text-on-surface">Truy cập nhanh</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Đi đến các màn hình vận hành để xử lý công việc hàng ngày.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <AdminModuleCard
                href="/admin/bookings"
                label="Đơn đặt phòng"
                title="Quản lý booking"
                description="Theo dõi đơn đặt, thanh toán và xử lý các booking cần can thiệp."
                icon={<IconBookings className="h-6 w-6" />}
                accent="orange"
                badge="Live"
              />
              <AdminModuleCard
                href="/admin/equipment"
                label="Thiết bị cho thuê"
                title="Quản lý thiết bị"
                description="Kiểm tra tài sản cho từng phòng và trạng thái thiết bị cho thuê."
                icon={<IconEquipment className="h-6 w-6" />}
                accent="green"
                badge="Live"
              />
              <AdminModuleCard
                href="/admin/rooms"
                label="Phòng tập"
                title="Quản lý phòng tập"
                description="Tinh chỉnh giá, hạng phòng và trạng thái vận hành."
                icon={<IconRooms className="h-6 w-6" />}
                accent="amber"
                badge="Active"
              />
            </div>
          </section>
        </div>
      </AdminShell>
    </AuthGuard>
  )
}
