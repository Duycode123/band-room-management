'use client'

import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'

export default function AdminDashboardPage() {
  const router = useRouter()

  const logout = () => {
    localStorage.clear()
    router.push('/login')
  }

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <main className="min-h-screen bg-slate-50 p-8">
        <section className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-orange-500">Admin</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">Bảng điều khiển quản trị</h1>
              <p className="mt-2 text-slate-500">Quản lý tài khoản, phòng tập, nhân viên, doanh thu và toàn bộ hệ thống.</p>
            </div>
            <button onClick={logout} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Đăng xuất
            </button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-100 p-5">
              <p className="text-sm text-slate-500">Người dùng</p>
              <strong className="mt-2 block text-2xl text-slate-900">Quản lý role</strong>
            </div>
            <div className="rounded-xl border border-slate-100 p-5">
              <p className="text-sm text-slate-500">Phòng tập</p>
              <strong className="mt-2 block text-2xl text-slate-900">Thêm / sửa / xóa</strong>
            </div>
            <div className="rounded-xl border border-slate-100 p-5">
              <p className="text-sm text-slate-500">Báo cáo</p>
              <strong className="mt-2 block text-2xl text-slate-900">Doanh thu</strong>
            </div>
          </div>
        </section>
      </main>
    </AuthGuard>
  )
}
