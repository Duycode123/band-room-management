'use client'

import AuthGuard from '@/components/AuthGuard'
import AdminModuleCard from '@/components/admin/AdminModuleCard'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminShell from '@/components/admin/AdminShell'
import AdminReportsOverview from '@/components/admin/reports/AdminReportsOverview'
import {
  IconBookings,
  IconEquipment,
  IconReports,
  IconRooms,
  IconSparkle,
} from '@/components/admin/AdminIcons'

export default function AdminDashboardPage() {
  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <AdminShell>
        <AdminPageHeader
          eyebrow="Kinh doanh"
          title="Bang dieu khien admin"
          description="Tong hop doanh thu, xu huong dat phong va hieu suat phong theo thoi gian thuc."
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
                  Dashboard danh gia hieu qua kinh doanh
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-inverse-on-surface/85 sm:text-base">
                  Theo doi ngay gio cao diem, phong duoc yeu thich va dong tien trong 30 ngay gan nhat ngay tai mot man hinh.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-inverse-on-surface/70">
                    Khung mac dinh
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold">30 ngay</p>
                  <p className="text-xs text-inverse-on-surface/70">co the loc lai ngay lap tuc</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-inverse-on-surface/70">
                    Admin route
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold text-brand-orange">Protected</p>
                  <p className="text-xs text-inverse-on-surface/70">chi role ADMIN duoc xem</p>
                </div>
              </div>
            </div>
          </section>

          <AdminReportsOverview />

          <section>
            <div className="mb-5">
              <h2 className="font-display text-xl font-bold text-on-surface">Truy cap nhanh</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Di den cac man hinh van hanh lien quan de hanh dong tren du lieu vua phan tich.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <AdminModuleCard
                href="/admin/bookings"
                label="Don dat phong"
                title="Quan ly booking"
                description="Theo doi don dat, thanh toan va xu ly ngay cac booking can can thiep sau khi xem bao cao."
                icon={<IconBookings className="h-6 w-6" />}
                accent="orange"
                badge="Live"
              />
              <AdminModuleCard
                href="/admin/equipment"
                label="Thiet bi cho thue"
                title="Quan ly thiet bi"
                description="Kiem tra tai san cho tung phong de doi chieu ROI voi muc do su dung phong tap."
                icon={<IconEquipment className="h-6 w-6" />}
                accent="green"
                badge="Live"
              />
              <AdminModuleCard
                href="/admin/rooms"
                label="Phong tap"
                title="Quan ly phong tap"
                description="Tinh chinh gia, hang phong va trang thai van hanh khi nhan ra phong hot hoac phong it duoc dat."
                icon={<IconRooms className="h-6 w-6" />}
                accent="amber"
                badge="Active"
              />
              <AdminModuleCard
                href="/admin/reports"
                label="Bao cao"
                title="Che do phan tich tap trung"
                description="Mo man hinh bao cao rieng khi ban muon tap trung vao bo loc thoi gian va bieu do."
                icon={<IconReports className="h-6 w-6" />}
                accent="slate"
                badge="New"
              />
            </div>
          </section>
        </div>
      </AdminShell>
    </AuthGuard>
  )
}
