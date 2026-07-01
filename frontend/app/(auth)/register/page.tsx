'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
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

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function minBirthDateIso() {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 100)
  return d.toISOString().slice(0, 10)
}

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const maxBirthDate = useMemo(() => todayIsoDate(), [])
  const minBirthDate = useMemo(() => minBirthDateIso(), [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const fullName = formData.fullName.trim()
    const email = formData.email.trim().toLowerCase()
    const phone = formData.phone.trim()
    const dateOfBirth = formData.dateOfBirth
    const password = formData.password

    if (!fullName) {
      setError('Họ tên không được để trống.')
      setIsLoading(false)
      return
    }
    if (!email) {
      setError('Email không được để trống.')
      setIsLoading(false)
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email không hợp lệ.')
      setIsLoading(false)
      return
    }
    if (!phone) {
      setError('Số điện thoại không được để trống.')
      setIsLoading(false)
      return
    }
    if (!/^(0|\+84)[0-9]{9}$/.test(phone)) {
      setError('Số điện thoại không hợp lệ.')
      setIsLoading(false)
      return
    }
    if (!dateOfBirth) {
      setError('Ngày sinh không được để trống.')
      setIsLoading(false)
      return
    }
    if (dateOfBirth > maxBirthDate) {
      setError('Ngày sinh không hợp lệ.')
      setIsLoading(false)
      return
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.')
      setIsLoading(false)
      return
    }

    try {
      const response = await api.post('/api/auth/register', {
        fullName,
        email,
        phone,
        dateOfBirth,
        password,
      })
      if (response.status === 200 || response.status === 201) {
        router.push('/login?registered=1')
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
            label="Nhập email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Nhập email của bạn"
            icon="email"
          />
          <AuthField
            label="Nhập số điện thoại"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Nhập số điện thoại của bạn"
            icon="user"
          />
          <AuthField
            label="Ngày sinh"
            name="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={handleChange}
            placeholder=""
            icon="calendar"
            max={maxBirthDate}
            min={minBirthDate}
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
