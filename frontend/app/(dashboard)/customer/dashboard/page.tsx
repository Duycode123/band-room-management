'use client'

import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'

export default function CustomerDashboardPage() {
  const router = useRouter()

  const logout = () => {
    localStorage.clear()
    router.push('/login')
  }

  return (
    <AuthGuard allowedRoles={['CUSTOMER']}>
      <main className="min-h-screen bg-slate-50 p-8">
        <section className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-orange-500">Khách hàng</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">Trang đặt phòng của bạn</h1>
              <p className="mt-2 text-slate-500">Đặt phòng tập, xem lịch đã đặt và theo dõi ưu đãi thành viên.</p>
            </div>
            <button onClick={logout} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Đăng xuất
            </button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-100 p-5">
              <p className="text-sm text-slate-500">Đặt phòng</p>
              <strong className="mt-2 block text-2xl text-slate-900">Chọn phòng</strong>
            </div>
            <div className="rounded-xl border border-slate-100 p-5">
              <p className="text-sm text-slate-500">Lịch của tôi</p>
              <strong className="mt-2 block text-2xl text-slate-900">Theo dõi</strong>
            </div>
            <div className="rounded-xl border border-slate-100 p-5">
              <p className="text-sm text-slate-500">Ưu đãi</p>
              <strong className="mt-2 block text-2xl text-slate-900">Mã giảm giá</strong>
            </div>
          </div>
        </section>
      </main>
    </AuthGuard>
  )
}
