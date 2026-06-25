'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import BandRoomHeader from '@/components/layout/BandRoomHeader'
import { useAuth } from '@/contexts/AuthContext'
import {
  changeCustomerPassword,
  fetchCurrentUser,
  getInitials,
  updateCustomerProfile,
  type ChangeCustomerPasswordPayload,
  type CustomerProfile,
  type UpdateCustomerProfilePayload,
} from '@/lib/customer-profile-service'

type Message = {
  type: 'success' | 'error'
  text: string
}

const emptyPasswordForm: ChangeCustomerPasswordPayload = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

export default function CustomerProfileClient() {
  const router = useRouter()
  const { user, login, logout, isLoading } = useAuth()
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [profileForm, setProfileForm] = useState<UpdateCustomerProfilePayload>({
    fullName: '',
    email: '',
    phone: '',
  })
  const [passwordForm, setPasswordForm] = useState<ChangeCustomerPasswordPayload>(emptyPasswordForm)
  const [profileMessage, setProfileMessage] = useState<Message | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<Message | null>(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadProfile = async () => {
      try {
        const currentProfile = await fetchCurrentUser(user)
        if (!mounted) return

        setProfile(currentProfile)
        setProfileForm({
          fullName: currentProfile.fullName,
          email: currentProfile.email,
          phone: currentProfile.phone,
        })
      } catch {
        if (!mounted) return
        setProfileMessage({ type: 'error', text: 'Không thể tải thông tin hồ sơ. Vui lòng thử lại.' })
      }
    }

    if (!isLoading) {
      void loadProfile()
    }

    return () => {
      mounted = false
    }
  }, [isLoading, user])

  const avatarInitial = getInitials(profileForm.fullName || profile?.fullName, profileForm.email || profile?.email)

  const validateProfile = () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!profileForm.fullName.trim()) {
      return 'Họ tên không được để trống.'
    }

    if (!emailPattern.test(profileForm.email.trim())) {
      return 'Email chưa đúng định dạng.'
    }

    if (profileForm.phone.trim() && profileForm.phone.trim().length < 8) {
      return 'Số điện thoại cần có ít nhất 8 ký tự.'
    }

    return null
  }

  const validatePassword = () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      return 'Vui lòng nhập đầy đủ các trường mật khẩu.'
    }

    if (passwordForm.newPassword.length < 8) {
      return 'Mật khẩu mới cần tối thiểu 8 ký tự.'
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return 'Mật khẩu mới và xác nhận mật khẩu không trùng nhau.'
    }

    return null
  }

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationError = validateProfile()

    if (validationError) {
      setProfileMessage({ type: 'error', text: validationError })
      return
    }

    setIsSavingProfile(true)
    setProfileMessage(null)

    try {
      const updatedProfile = await updateCustomerProfile({
        fullName: profileForm.fullName.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
      })

      setProfile(updatedProfile)
      login({
        ...(user ?? { role: 'CUSTOMER' as const }),
        fullName: updatedProfile.fullName,
        name: updatedProfile.fullName,
        email: updatedProfile.email,
      })
      setProfileMessage({ type: 'success', text: 'Cập nhật thông tin thành công.' })
    } catch {
      setProfileMessage({ type: 'error', text: 'Không thể cập nhật thông tin. Vui lòng thử lại.' })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationError = validatePassword()

    if (validationError) {
      setPasswordMessage({ type: 'error', text: validationError })
      return
    }

    setIsChangingPassword(true)
    setPasswordMessage(null)

    try {
      await changeCustomerPassword(passwordForm)
      setPasswordForm(emptyPasswordForm)
      setPasswordMessage({ type: 'success', text: 'Cập nhật mật khẩu thành công.' })
    } catch {
      setPasswordMessage({ type: 'error', text: 'Không thể cập nhật mật khẩu. Vui lòng thử lại.' })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    try {
      await logout()
      router.replace('/')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F2EC] text-[#1A1C1E]">
      <BandRoomHeader />

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-[28px] border border-[#E8E4DC] bg-white p-6 shadow-[0_4px_24px_rgba(26,28,30,0.06)] md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FF7518] font-display text-3xl font-bold text-white">
                {avatarInitial}
              </span>
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-3xl font-bold tracking-tight">
                    {profileForm.fullName || 'Khách hàng'}
                  </h1>
                  <span className="rounded-full bg-[#FFE8D6] px-3 py-1 font-display text-xs font-bold uppercase tracking-wide text-[#6B3200]">
                    Khách hàng
                  </span>
                </div>
                <p className="text-[#5C5348]">{profileForm.email || 'Chưa cập nhật email'}</p>
                <p className="mt-2 max-w-2xl text-sm text-[#5C5348]">
                  Quản lý thông tin tài khoản và bảo mật của bạn.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          <form
            onSubmit={handleSaveProfile}
            className="rounded-[24px] border border-[#E8E4DC] bg-white p-6 shadow-[0_4px_24px_rgba(26,28,30,0.06)]"
          >
            <div className="mb-5">
              <h2 className="font-display text-xl font-bold">Thông tin cá nhân</h2>
              <p className="mt-1 text-sm text-[#5C5348]">Cập nhật thông tin liên hệ dùng cho đặt phòng.</p>
            </div>

            <div className="grid gap-4">
              <FormField label="Họ tên">
                <input
                  value={profileForm.fullName}
                  onChange={(event) => setProfileForm((form) => ({ ...form, fullName: event.target.value }))}
                  className="h-12 w-full rounded-2xl border border-[#C9C2B6] bg-white px-4 text-sm outline-none transition focus:border-[#FF7518] focus:ring-2 focus:ring-[#FF7518]/20"
                />
              </FormField>

              <FormField label="Email">
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(event) => setProfileForm((form) => ({ ...form, email: event.target.value }))}
                  className="h-12 w-full rounded-2xl border border-[#C9C2B6] bg-white px-4 text-sm outline-none transition focus:border-[#FF7518] focus:ring-2 focus:ring-[#FF7518]/20"
                />
              </FormField>

              <FormField label="Số điện thoại">
                <input
                  value={profileForm.phone}
                  onChange={(event) => setProfileForm((form) => ({ ...form, phone: event.target.value }))}
                  placeholder="Ví dụ: 0901234567"
                  className="h-12 w-full rounded-2xl border border-[#C9C2B6] bg-white px-4 text-sm outline-none transition placeholder:text-[#8A8176] focus:border-[#FF7518] focus:ring-2 focus:ring-[#FF7518]/20"
                />
              </FormField>
            </div>

            {profileMessage && <MessageBox message={profileMessage} />}

            <button
              type="submit"
              disabled={isSavingProfile}
              className="mt-6 h-12 rounded-2xl bg-[#FF7518] px-6 font-display font-semibold text-white transition hover:bg-[#E6640F] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingProfile ? 'Đang lưu' : 'Lưu thay đổi'}
            </button>
          </form>

          <aside className="space-y-6">
            <form
              onSubmit={handleChangePassword}
              className="rounded-[24px] border border-[#E8E4DC] bg-white p-6 shadow-[0_4px_24px_rgba(26,28,30,0.06)]"
            >
              <div className="mb-5">
                <h2 className="font-display text-xl font-bold">Bảo mật tài khoản</h2>
                <p className="mt-1 text-sm text-[#5C5348]">Đổi mật khẩu định kỳ để bảo vệ tài khoản.</p>
              </div>

              <div className="grid gap-4">
                <PasswordField
                  label="Mật khẩu hiện tại"
                  value={passwordForm.currentPassword}
                  onChange={(value) => setPasswordForm((form) => ({ ...form, currentPassword: value }))}
                />
                <PasswordField
                  label="Mật khẩu mới"
                  value={passwordForm.newPassword}
                  onChange={(value) => setPasswordForm((form) => ({ ...form, newPassword: value }))}
                />
                <PasswordField
                  label="Nhập lại mật khẩu mới"
                  value={passwordForm.confirmPassword}
                  onChange={(value) => setPasswordForm((form) => ({ ...form, confirmPassword: value }))}
                />
              </div>

              {passwordMessage && <MessageBox message={passwordMessage} />}

              <button
                type="submit"
                disabled={isChangingPassword}
                className="mt-6 h-12 w-full rounded-2xl bg-[#FF7518] px-6 font-display font-semibold text-white transition hover:bg-[#E6640F] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isChangingPassword ? 'Đang cập nhật' : 'Cập nhật mật khẩu'}
              </button>
            </form>

            <section className="rounded-[24px] border border-[#E8E4DC] bg-white p-6 shadow-[0_4px_24px_rgba(26,28,30,0.06)]">
              <h2 className="font-display text-xl font-bold">Tài khoản</h2>
              <p className="mt-1 text-sm text-[#5C5348]">Đăng xuất khỏi phiên hiện tại và quay về homepage.</p>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="mt-5 h-12 w-full rounded-2xl border border-[#C9C2B6] bg-transparent font-display font-semibold text-[#1A1C1E] transition hover:bg-[#FAF8F4] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoggingOut ? 'Đang đăng xuất' : 'Đăng xuất'}
              </button>
            </section>
          </aside>
        </div>
      </section>
    </main>
  )
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label>
      <span className="mb-1 block font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">
        {label}
      </span>
      {children}
    </label>
  )
}

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <FormField label={label}>
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-[#C9C2B6] bg-white px-4 text-sm outline-none transition focus:border-[#FF7518] focus:ring-2 focus:ring-[#FF7518]/20"
      />
    </FormField>
  )
}

function MessageBox({ message }: { message: Message }) {
  const isSuccess = message.type === 'success'

  return (
    <p
      className={[
        'mt-4 rounded-2xl border px-4 py-3 text-sm',
        isSuccess
          ? 'border-[#0A4D27]/25 bg-[#F1F8F2] text-[#0A4D27]'
          : 'border-[#C62828]/20 bg-[#FFEBEE] text-[#C62828]',
      ].join(' ')}
    >
      {message.text}
    </p>
  )
}
