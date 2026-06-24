'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminDashboardPage() {
  const router = useRouter()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <main className="min-h-screen bg-brand-bgGray p-6 sm:p-8">
        <section className="mx-auto max-w-5xl rounded-xl border border-outline-variant bg-white p-8 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-brand-orange">
                Admin
              </p>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-on-surface">
                Bảng điều khiển quản trị
              </h1>
              <p className="mt-2 text-sm text-on-surface-variant">
                Quản lý tài khoản, phòng tập, đơn đặt phòng, doanh thu và toàn bộ hệ thống.
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
              href="/admin/bookings"
              className="group rounded-xl border border-outline-variant p-5 transition-all hover:border-brand-orange/40 hover:shadow-[var(--shadow-elevated)]"
            >
              <p className="text-sm text-on-surface-variant">Đơn đặt phòng</p>
              <strong className="mt-2 block font-display text-xl text-on-surface group-hover:text-brand-orange">
                Quản lý booking
              </strong>
              <p className="mt-2 text-xs text-on-surface-variant">Danh sách, chi tiết, cập nhật trạng thái</p>
            </Link>
            <div className="rounded-xl border border-outline-variant p-5 opacity-60">
              <p className="text-sm text-on-surface-variant">Phòng tập</p>
              <strong className="mt-2 block font-display text-xl text-on-surface">Thêm / sửa / xóa</strong>
            </div>
            <div className="rounded-xl border border-outline-variant p-5 opacity-60">
              <p className="text-sm text-on-surface-variant">Báo cáo</p>
              <strong className="mt-2 block font-display text-xl text-on-surface">Doanh thu</strong>
            </div>
          </div>
        </section>
      </main>
    </AuthGuard>
  )
}
