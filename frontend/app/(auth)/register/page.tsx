'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({ fullName: '', identifier: '', password: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const identifier = formData.identifier.trim()
    const isEmail = identifier.includes('@')

    if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      setError('Email không hợp lệ.')
      setIsLoading(false)
      return
    }
    if (!isEmail && !/^(0|\+84)[0-9]{9}$/.test(identifier)) {
      setError('Số điện thoại không hợp lệ.')
      setIsLoading(false)
      return
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
        {
          fullName: formData.fullName.trim(),
          email: isEmail ? identifier.toLowerCase() : '',
          phone: isEmail ? '' : identifier,
          password: formData.password,
        },
      )
      if (response.status === 200 || response.status === 201) {
        alert('Đăng ký thành công!')
        router.push('/login')
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-brand-bgGray font-sans antialiased">
      {/* Left banner */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-brand-greenDark to-brand-greenLight text-white flex-col justify-between p-16">
        <div className="flex items-center space-x-3">
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

        <div className="max-w-xl my-auto space-y-6">
          <h2 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
            Đặt phòng tập <span className="text-brand-orange">đẳng cấp</span>, trải nghiệm âm nhạc tối ưu.
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Tạo tài khoản để đặt phòng nhanh, theo dõi lịch tập và nhận ưu đãi thành viên.
          </p>
          <div className="space-y-3 pt-2 text-sm text-gray-200">
            {['Đặt phòng nhanh trong vòng 30 giây', 'Quản lý lịch đặt và thông tin tài khoản dễ dàng', 'Nhận hỗ trợ từ đội ngũ vận hành 24/7'].map((text) => (
              <div key={text} className="flex items-center space-x-3">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-400/50 tracking-wide">© 2026 BandHub Studio. All rights reserved.</div>
      </div>

      {/* Right form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[440px] bg-white rounded-2xl border border-gray-100 p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
            <button type="button" onClick={() => router.push('/login')} className="w-1/2 py-2 text-xs font-semibold text-gray-500 rounded-lg hover:text-gray-700 transition-colors cursor-pointer">
              Đăng nhập
            </button>
            <button type="button" className="w-1/2 py-2 text-xs font-semibold text-gray-800 bg-white shadow-sm rounded-lg">
              Đăng ký
            </button>
          </div>

          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Tạo tài khoản</h3>
            <p className="text-xs text-gray-400 mt-1">Điền thông tin để bắt đầu sử dụng dịch vụ.</p>
          </div>

          {error && <div className="mb-4 text-xs text-red-500 bg-red-50/50 p-3 rounded-xl border border-red-100">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput label="Họ và tên" name="fullName" type="text" value={formData.fullName} onChange={handleChange} placeholder="Nguyễn Văn A" icon="user" />
            <FormInput label="Email hoặc Số điện thoại" name="identifier" type="text" value={formData.identifier} onChange={handleChange} placeholder="Nhập email hoặc số điện thoại" icon="user" />
            <FormInput label="Mật khẩu" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Tối thiểu 6 ký tự" icon="lock" />

            <button type="submit" disabled={isLoading} className="w-full bg-brand-orange hover:bg-brand-orangeHover disabled:bg-gray-300 text-white font-medium py-3 rounded-xl shadow-sm flex items-center justify-center transition-all mt-6 cursor-pointer active:scale-[0.98]">
              <span className="text-sm">{isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}</span>
            </button>
          </form>

          <div className="text-center mt-6 text-xs text-gray-500">
            Đã có tài khoản?{' '}
            <button type="button" onClick={() => router.push('/login')} className="text-brand-orange font-semibold hover:underline cursor-pointer">
              Đăng nhập
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

type FormInputProps = {
  label: string
  name: string
  type: string
  value: string
  placeholder: string
  icon: 'user' | 'lock'
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function FormInput({ label, name, type, value, placeholder, icon, onChange }: FormInputProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
          <InputIcon icon={icon} />
        </div>
        <input type={type} name={name} value={value} onChange={onChange} required placeholder={placeholder} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-colors" />
      </div>
    </div>
  )
}

function InputIcon({ icon }: { icon: FormInputProps['icon'] }) {
  const paths = {
    user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    lock: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  }
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[icon]} />
    </svg>
  )
}
