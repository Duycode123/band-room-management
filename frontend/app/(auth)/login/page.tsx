'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER'

const dashboardByRole: Record<UserRole, string> = {
  ADMIN: '/admin/dashboard',
  STAFF: '/staff/dashboard',
  CUSTOMER: '/customer/dashboard',
}

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await api.post('/api/auth/login', formData)
      if (response.status === 200 && response.data) {
        const { role } = response.data as {
          role: UserRole
        }
        alert('Đăng nhập thành công!')
        router.push(dashboardByRole[role] || '/')
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr.response?.data?.message || 'Đăng nhập thất bại, vui lòng kiểm tra lại tài khoản.')
    }
  }

  return (
    <div className="flex min-h-screen bg-brand-bgGray font-sans antialiased">
      {/* Left banner */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-brand-greenDark to-brand-greenLight text-white flex-col justify-between p-16 relative overflow-hidden">
        <div className="flex items-center space-x-3 z-10">
          <div className="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 10l12-3M9 14c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm12-4c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide">BandHub Studio</h1>
            <p className="text-xs text-emerald-400/70 tracking-wider uppercase">Workspace Management</p>
          </div>
        </div>

        <div className="max-w-xl my-auto z-10 space-y-6">
          <h2 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
            Đặt phòng tập <span className="text-brand-orange">đẳng cấp</span>, trải nghiệm âm nhạc tối ưu.
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Hơn 6 phòng tập chuyên nghiệp, đầy đủ trang thiết bị nhạc cụ hiện đại cùng hệ thống cách âm tiêu chuẩn quốc tế.
          </p>
          <div className="space-y-3 pt-2 text-sm text-gray-200">
            {['Đặt phòng nhanh chóng trong vòng 30 giây', 'Hệ thống ưu đãi và mã giảm giá thành viên hàng tuần', 'Đội ngũ kỹ thuật viên hỗ trợ vận hành liên tục 24/7'].map((text) => (
              <div key={text} className="flex items-center space-x-3">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-400/50 z-10 tracking-wide">© 2026 BandHub Studio. All rights reserved.</div>
      </div>

      {/* Right form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[440px] bg-white rounded-2xl border border-gray-100 p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
            <button type="button" className="w-1/2 py-2 text-xs font-semibold text-gray-800 bg-white shadow-sm rounded-lg">
              Đăng nhập
            </button>
            <button type="button" onClick={() => router.push('/register')} className="w-1/2 py-2 text-xs font-semibold text-gray-500 rounded-lg hover:text-gray-700 transition-colors cursor-pointer">
              Đăng ký
            </button>
          </div>

          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Chào mừng trở lại</h3>
            <p className="text-xs text-gray-400 mt-1">Đăng nhập để tiếp tục đặt phòng tập của bạn.</p>
          </div>

          {error && <div className="mb-4 text-xs text-red-500 bg-red-50/50 p-3 rounded-xl border border-red-100">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="name@company.com" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required placeholder="Nhập mật khẩu của bạn" className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-colors" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer">
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 select-none text-xs">
              <div className="flex items-center">
                <input id="remember_me" name="remember_me" type="checkbox" className="h-4 w-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange accent-brand-orange cursor-pointer" />
                <label htmlFor="remember_me" className="ml-2 font-medium text-gray-600 cursor-pointer">Ghi nhớ đăng nhập</label>
              </div>
              <button type="button" onClick={() => router.push('/forgot-password')} className="font-medium text-brand-orange hover:underline focus:outline-none cursor-pointer">
                Quên mật khẩu?
              </button>
            </div>

            <button type="submit" className="w-full bg-brand-orange hover:bg-brand-orangeHover text-white font-medium py-3 rounded-xl shadow-sm flex items-center justify-center transition-all mt-6 cursor-pointer active:scale-[0.98]">
              <span className="text-sm">Đăng nhập</span>
            </button>
          </form>

          <div className="relative my-6 text-center">
            <hr className="border-gray-100" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-[11px] text-gray-400 uppercase tracking-wider">Hoặc tiếp tục với</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="flex items-center justify-center space-x-2 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-xs font-semibold text-gray-600 cursor-pointer">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Google</span>
            </button>
            <button type="button" className="flex items-center justify-center space-x-2 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-xs font-semibold text-gray-600 cursor-pointer">
              <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Facebook</span>
            </button>
          </div>

          <div className="text-center mt-6 text-xs text-gray-500">
            Chưa có tài khoản?{' '}
            <button type="button" onClick={() => router.push('/register')} className="text-brand-orange font-semibold hover:underline cursor-pointer">
              Đăng ký ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
