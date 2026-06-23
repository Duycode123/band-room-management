'use client'

import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import { logoutSession } from '@/lib/auth'

export default function StaffDashboardPage() {
  const router = useRouter()

  const logout = async () => {
    await logoutSession()
    router.replace('/login')
  }

  return (
    <AuthGuard allowedRoles={['STAFF']}>
      <main className="min-h-screen bg-slate-50 p-8">
        <section className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Nhân viên</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">Trang làm việc nhân viên</h1>
              <p className="mt-2 text-slate-500">Duyệt lịch đặt, kiểm tra phòng và hỗ trợ khách hàng trong ca trực.</p>
            </div>
            <button onClick={logout} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Đăng xuất
            </button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-100 p-5">
              <p className="text-sm text-slate-500">Lịch chờ duyệt</p>
              <strong className="mt-2 block text-2xl text-slate-900">Xác nhận / hủy</strong>
            </div>
            <div className="rounded-xl border border-slate-100 p-5">
              <p className="text-sm text-slate-500">Tình trạng phòng</p>
              <strong className="mt-2 block text-2xl text-slate-900">Bảo trì</strong>
            </div>
            <div className="rounded-xl border border-slate-100 p-5">
              <p className="text-sm text-slate-500">Khách hàng</p>
              <strong className="mt-2 block text-2xl text-slate-900">Hỗ trợ</strong>
            </div>
          </div>
        </section>
      </main>
    </AuthGuard>
  )
}
