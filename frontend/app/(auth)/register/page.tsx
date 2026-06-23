'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import AuthBanner from '@/components/auth/AuthBanner'
import AuthTabs from '@/components/auth/AuthTabs'
import {
  AuthError,
  AuthField,
  AuthFormPanel,
  AuthMobileBrand,
  AuthShell,
  AuthSubmitButton,
} from '@/components/auth/AuthField'

const REGISTER_BULLETS = [
  { title: 'Đặt phòng nhanh', desc: 'Hoàn tất đặt lịch chỉ trong vài bước đơn giản.' },
  { title: 'Quản lý lịch tập', desc: 'Theo dõi và chỉnh sửa lịch đặt mọi lúc mọi nơi.' },
  { title: 'Hỗ trợ 24/7', desc: 'Đội ngũ vận hành sẵn sàng khi bạn cần.' },
]

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
    <AuthShell>
      <AuthBanner
        description="Tạo tài khoản để đặt phòng nhanh, theo dõi lịch tập và nhận ưu đãi thành viên."
        bullets={REGISTER_BULLETS}
      />

      <AuthFormPanel>
        <AuthMobileBrand />
        <AuthTabs active="register" />

        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold tracking-tight text-on-surface">Tạo tài khoản</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Điền thông tin để bắt đầu sử dụng dịch vụ.</p>
        </div>

        {error && <AuthError message={error} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthField
            label="Họ và tên"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Nguyễn Văn A"
            icon="user"
          />
          <AuthField
            label="Email hoặc Số điện thoại"
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
            placeholder="Nhập email hoặc số điện thoại"
            icon="user"
          />
          <AuthField
            label="Mật khẩu"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Tối thiểu 6 ký tự"
            icon="lock"
          />

          <AuthSubmitButton disabled={isLoading}>
            {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
          </AuthSubmitButton>
        </form>

        <p className="mt-6 text-center text-xs text-on-surface-variant">
          Đã có tài khoản?{' '}
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="cursor-pointer font-display font-semibold text-brand-orange hover:underline"
          >
            Đăng nhập
          </button>
        </p>
      </AuthFormPanel>
    </AuthShell>
  )
}
