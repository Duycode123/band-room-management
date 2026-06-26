'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import { useAuth } from '@/contexts/AuthContext'

export default function CustomerDashboardPage() {
  const router = useRouter()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.replace('/')
  }

  return (
    <AuthGuard allowedRoles={['CUSTOMER']}>
      <main className="min-h-screen bg-brand-bgGray p-6 sm:p-8">
        <section className="mx-auto max-w-5xl rounded-xl border border-outline-variant bg-white p-8 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-brand-orange">
                Khách hàng
              </p>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-on-surface">
                Trang đặt phòng của bạn
              </h1>
              <p className="mt-2 text-sm text-on-surface-variant">
                Đặt phòng tập, xem lịch đã đặt và theo dõi ưu đãi thành viên.
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-inverse-surface px-4 py-2 font-display text-sm font-medium text-inverse-on-surface"
            >
              Đăng xuất
            </button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Link
              href="/customer/booking"
              className="group rounded-xl border border-outline-variant p-5 transition-all hover:border-brand-orange/40 hover:shadow-[var(--shadow-elevated)]"
            >
              <p className="text-sm text-on-surface-variant">Đặt phòng</p>
              <strong className="mt-2 block font-display text-xl text-on-surface group-hover:text-brand-orange">
                Chọn phòng & lịch
              </strong>
              <p className="mt-2 text-xs text-on-surface-variant">Xem lịch trống real-time</p>
            </Link>
            <div className="rounded-xl border border-outline-variant p-5 opacity-60">
              <p className="text-sm text-on-surface-variant">Lịch của tôi</p>
              <strong className="mt-2 block font-display text-xl text-on-surface">Sắp ra mắt</strong>
            </div>
            <div className="rounded-xl border border-outline-variant p-5 opacity-60">
              <p className="text-sm text-on-surface-variant">Ưu đãi</p>
              <strong className="mt-2 block font-display text-xl text-on-surface">Sắp ra mắt</strong>
            </div>
          </div>
        </section>
      </main>
    </AuthGuard>
  )
}
