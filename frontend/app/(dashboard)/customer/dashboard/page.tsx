'use client'

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

export default function CustomerDashboardPage() {
  return (
    <AuthGuard allowedRoles={['CUSTOMER']}>
      <CustomerShell>
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
          {/* Hero */}
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
                  Chào mừng trở lại BandSpace
                </div>
                <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Sẵn sàng cho buổi tập hôm nay?
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-white/90 sm:text-base">
                  Đặt phòng tập trong vài bước — chọn studio, ngày và khung giờ trống theo thời gian thực.
                </p>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/15 px-5 py-4 backdrop-blur-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                  <IconMusic className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-display text-2xl font-bold">4</p>
                  <p className="text-xs text-white/80">studio khả dụng</p>
                </div>
              </div>
            </div>
          </section>

          {/* Quick access */}
          <section className="mt-10">
            <div className="mb-5">
              <h2 className="font-display text-xl font-bold text-on-surface">Bắt đầu nhanh</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Chọn tính năng bạn cần — đặt phòng chỉ mất vài phút.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <CustomerModuleCard
                href="/customer/booking"
                label="Đặt phòng"
                title="Chọn phòng & lịch"
                description="Xem lịch trống real-time, chọn nhiều giờ liên tiếp và xác nhận đặt phòng ngay."
                icon={<IconBooking className="h-6 w-6" />}
                accent="orange"
                badge="Phổ biến"
                featured
              />
              <CustomerModuleCard
                label="Lịch của tôi"
                title="Đơn đã đặt"
                description="Theo dõi lịch tập, lịch sử booking và trạng thái thanh toán."
                icon={<IconCalendar className="h-6 w-6" />}
                accent="green"
                disabled
              />
              <CustomerModuleCard
                label="Ưu đãi"
                title="Thành viên & khuyến mãi"
                description="Nhận ưu đãi giờ tập, gói tháng và quà tặng dành riêng cho thành viên."
                icon={<IconGift className="h-6 w-6" />}
                accent="amber"
                disabled
              />
              <div className="relative overflow-hidden rounded-2xl border border-outline-variant bg-gradient-to-br from-secondary via-brand-greenDark to-brand-greenLight p-6 text-white shadow-[var(--shadow-card)]">
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-brand-orange/20 blur-2xl" />
                <p className="relative font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-orange">
                  Mẹo đặt phòng
                </p>
                <p className="relative mt-2 font-display text-lg font-bold">
                  Chọn giờ liên tiếp để được giá tốt hơn
                </p>
                <p className="relative mt-2 text-sm text-inverse-on-surface/80">
                  Click từng khung giờ trống — hệ thống tự gộp thành một buổi tập liền mạch.
                </p>
              </div>
            </div>
          </section>
        </div>
      </CustomerShell>
    </AuthGuard>
  )
}
