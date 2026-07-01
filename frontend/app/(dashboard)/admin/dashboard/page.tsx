'use client'

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

export default function AdminDashboardPage() {
  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <AdminShell>
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          {/* Hero */}
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
                  Quản lý phòng tập, đơn đặt chỗ, thiết bị cho thuê và theo dõi vận hành — tất cả
                  trong một nơi.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-inverse-on-surface/70">
                    Module
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold">2</p>
                  <p className="text-xs text-inverse-on-surface/70">đang hoạt động</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-inverse-on-surface/70">
                    Hệ thống
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold text-brand-orange">Live</p>
                  <p className="text-xs text-inverse-on-surface/70">demo FE</p>
                </div>
              </div>
            </div>
          </section>

          {/* Quick stats */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminStatCard
              label="Đơn đặt phòng"
              value="—"
              hint="Xem danh sách booking"
              accent="primary"
              icon={<IconBookings className="h-5 w-5" />}
            />
            <AdminStatCard
              label="Thiết bị"
              value="8"
              hint="Nhạc cụ & gear cho thuê"
              accent="secondary"
              icon={<IconEquipment className="h-5 w-5" />}
            />
            <AdminStatCard
              label="Phòng tập"
              value="—"
              hint="Sắp ra mắt"
              accent="default"
              icon={<IconRooms className="h-5 w-5" />}
            />
            <AdminStatCard
              label="Doanh thu"
              value="—"
              hint="Báo cáo sắp ra mắt"
              accent="tertiary"
              icon={<IconReports className="h-5 w-5" />}
            />
          </div>

          {/* Modules */}
          <section className="mt-10">
            <div className="mb-5">
              <h2 className="font-display text-xl font-bold text-on-surface">Truy cập nhanh</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Chọn module để bắt đầu quản lý hệ thống BandSpace.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <AdminModuleCard
                href="/admin/bookings"
                label="Đơn đặt phòng"
                title="Quản lý booking"
                description="Theo dõi đơn đặt, trạng thái thanh toán, check-in và thông tin khách hàng theo thời gian thực."
                icon={<IconBookings className="h-6 w-6" />}
                accent="orange"
                badge="Active"
              />
              <AdminModuleCard
                href="/admin/equipment"
                label="Thiết bị cho thuê"
                title="Quản lý thiết bị"
                description="Kiểm soát nhạc cụ, số lượng khả dụng, giá thuê và trạng thái bảo trì — đồng bộ với đặt phòng."
                icon={<IconEquipment className="h-6 w-6" />}
                accent="green"
                badge="New"
              />
              <AdminModuleCard
                label="Phòng tập"
                title="Quản lý phòng"
                description="Thêm, chỉnh sửa và cấu hình phòng tập, loại phòng và giá theo giờ."
                icon={<IconRooms className="h-6 w-6" />}
                accent="amber"
                disabled
              />
              <AdminModuleCard
                href="/admin/reports"
                label="Báo cáo"
                title="Doanh thu & thống kê"
                description="Phân tích doanh thu, số đơn theo ngày và top phòng hiệu quả nhất."
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
