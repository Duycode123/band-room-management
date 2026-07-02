'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import { StaffPageShell, Toast } from './StaffShared'
import { useAuth } from '@/contexts/AuthContext'
import { fetchCurrentUser, type CustomerProfile } from '@/lib/customer-profile-service'
import { clearStaffAuthCaches, getDisplayName, getInitials, getProfileValue, getRoleLabel } from '@/lib/staff-profile'
import { type UserRole } from '@/lib/auth'

type SettingsTab = 'PROFILE' | 'NOTIFICATIONS' | 'SECURITY' | 'APPEARANCE'

type StaffProfile = {
  fullName: string
  email: string
  phone: string
  role: UserRole
  branchName: string
  avatarUrl?: string
}

type StaffNotificationSettings = {
  newBooking: boolean
  bookingReminder: boolean
  shiftReminder: boolean
  roomIssue: boolean
  equipmentIssue: boolean
}

type AppearanceSettings = {
  density: 'COMFORTABLE' | 'COMPACT'
  viewMode: 'CARD' | 'TABLE'
  reducedMotion: boolean
}

const tabs: Array<{ id: SettingsTab; label: string }> = [
  { id: 'PROFILE', label: 'Hồ sơ' },
  { id: 'NOTIFICATIONS', label: 'Thông báo' },
  { id: 'SECURITY', label: 'Bảo mật' },
  { id: 'APPEARANCE', label: 'Giao diện' },
]

export default function StaffSettingsPage() {
  const router = useRouter()
  const { user, login, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<SettingsTab>('PROFILE')
  const [profile, setProfile] = useState<StaffProfile>({
    fullName: 'Chưa cập nhật',
    email: 'Chưa cập nhật',
    phone: 'Chưa cập nhật',
    role: 'STAFF',
    branchName: 'BandHub Studio - Hà Đông',
  })
  const [profileErrors, setProfileErrors] = useState<Partial<Record<keyof StaffProfile, string>>>({})
  const [notificationSettings, setNotificationSettings] = useState<StaffNotificationSettings>({
    newBooking: true,
    bookingReminder: true,
    shiftReminder: true,
    roomIssue: true,
    equipmentIssue: true,
  })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordErrors, setPasswordErrors] = useState<Partial<Record<keyof typeof passwordForm, string>>>({})
  const [appearance, setAppearance] = useState<AppearanceSettings>({ density: 'COMFORTABLE', viewMode: 'CARD', reducedMotion: false })
  const [toast, setToast] = useState<string | null>(null)
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    if (!user) return

    const hydrateProfile = (source: Partial<CustomerProfile & typeof user>) => {
      setProfile({
        fullName: getProfileValue(source.fullName || source.name || getDisplayName(source)),
        email: getProfileValue(source.email),
        phone: getProfileValue(source.phone),
        role: source.role || user.role,
        branchName: 'BandHub Studio - Hà Đông',
        avatarUrl: source.avatarUrl,
      })
    }

    hydrateProfile(user)
    void fetchCurrentUser(user).then((currentUser) => {
      hydrateProfile({ ...user, ...currentUser, role: currentUser.role || user.role })
    })
  }, [user])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const updateProfile = <Key extends keyof StaffProfile>(key: Key, value: StaffProfile[Key]) => {
    setProfile((current) => ({ ...current, [key]: value }))
    setProfileErrors((current) => ({ ...current, [key]: undefined }))
  }

  const saveProfile = () => {
    const errors: Partial<Record<keyof StaffProfile, string>> = {}
    if (!profile.fullName.trim() || profile.fullName === 'Chưa cập nhật') errors.fullName = 'Họ tên không được để trống.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) errors.email = 'Email chưa đúng định dạng.'

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors)
      return
    }

    if (user) {
      login({
        ...user,
        fullName: profile.fullName,
        name: profile.fullName,
        email: profile.email,
        phone: profile.phone === 'Chưa cập nhật' ? undefined : profile.phone,
        avatarUrl: profile.avatarUrl,
      })
    }
    setToast('Đã cập nhật hồ sơ.')
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      clearStaffAuthCaches()
      router.replace('/login')
    } finally {
      setIsLoggingOut(false)
      setIsLogoutConfirmOpen(false)
    }
  }

  const updatePassword = () => {
    const errors: Partial<Record<keyof typeof passwordForm, string>> = {}
    if (!passwordForm.currentPassword) errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.'
    if (passwordForm.newPassword.length < 8) errors.newPassword = 'Mật khẩu mới cần tối thiểu 8 ký tự.'
    if (passwordForm.confirmPassword !== passwordForm.newPassword) errors.confirmPassword = 'Mật khẩu xác nhận chưa khớp.'

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors)
      return
    }

    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setPasswordErrors({})
    setToast('Đã cập nhật mật khẩu demo.')
  }

  const toggleNotification = (key: keyof StaffNotificationSettings) => {
    setNotificationSettings((current) => ({ ...current, [key]: !current[key] }))
    setToast('Đã cập nhật tùy chọn thông báo.')
  }

  const updateAppearance = <Key extends keyof AppearanceSettings>(key: Key, value: AppearanceSettings[Key]) => {
    setAppearance((current) => ({ ...current, [key]: value }))
    setToast('Đã cập nhật tùy chọn giao diện.')
  }

  return (
    <AuthGuard allowedRoles={['STAFF']}>
      <StaffPageShell>
        <header>
          <p className="font-display text-sm font-bold uppercase tracking-wide text-brand-orange">Không gian làm việc</p>
          <h1 className="mt-2 font-display text-[32px] font-bold leading-10 text-on-surface">Cài đặt</h1>
          <p className="mt-2 max-w-2xl text-base leading-6 text-on-surface-variant">
            Quản lý thông tin cá nhân và tùy chọn làm việc.
          </p>
        </header>

        <section className="rounded-3xl border border-outline-variant bg-white p-3 shadow-[var(--band-shadow-card)]">
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'whitespace-nowrap rounded-2xl px-5 py-3 font-display text-sm font-bold transition',
                  activeTab === tab.id ? 'bg-secondary text-on-secondary' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {activeTab === 'PROFILE' && (
          <SettingsCard title="Hồ sơ nhân viên" description="Thông tin này hiển thị trong workspace vận hành.">
            <div className="flex flex-col gap-5 lg:flex-row">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-primary-container font-display text-3xl font-bold text-on-primary-container">
                {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" /> : getInitials(profile.fullName || profile.email)}
              </div>
              <div className="grid flex-1 gap-4 sm:grid-cols-2">
                <Field label="Họ tên / Tên đăng nhập" error={profileErrors.fullName}>
                  <input value={profile.fullName} onChange={(event) => updateProfile('fullName', event.target.value)} className="input-field" />
                </Field>
                <Field label="Email" error={profileErrors.email}>
                  <input value={profile.email} onChange={(event) => updateProfile('email', event.target.value)} className="input-field" />
                </Field>
                <Field label="Số điện thoại">
                  <input value={profile.phone} onChange={(event) => updateProfile('phone', event.target.value)} className="input-field" />
                </Field>
                <Field label="Vai trò">
                  <input value={getRoleLabel(profile.role)} disabled className="input-field cursor-not-allowed opacity-75" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Chi nhánh làm việc">
                    <input value={profile.branchName} onChange={(event) => updateProfile('branchName', event.target.value)} className="input-field" />
                  </Field>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button type="button" onClick={saveProfile} className="btn-warm">Lưu thay đổi</button>
            </div>
          </SettingsCard>
        )}

        {activeTab === 'NOTIFICATIONS' && (
          <SettingsCard title="Thông báo" description="Chọn các cập nhật bạn muốn nhận trong ca làm.">
            <div className="grid gap-3">
              <SettingsToggle label="Nhận thông báo booking mới" checked={notificationSettings.newBooking} onChange={() => toggleNotification('newBooking')} />
              <SettingsToggle label="Nhắc khách sắp đến" checked={notificationSettings.bookingReminder} onChange={() => toggleNotification('bookingReminder')} />
              <SettingsToggle label="Nhắc ca làm" checked={notificationSettings.shiftReminder} onChange={() => toggleNotification('shiftReminder')} />
              <SettingsToggle label="Thông báo sự cố phòng" checked={notificationSettings.roomIssue} onChange={() => toggleNotification('roomIssue')} />
              <SettingsToggle label="Thông báo thiết bị lỗi" checked={notificationSettings.equipmentIssue} onChange={() => toggleNotification('equipmentIssue')} />
            </div>
          </SettingsCard>
        )}

        {activeTab === 'SECURITY' && (
          <SettingsCard title="Bảo mật" description="Đổi mật khẩu demo ở frontend, chưa gọi backend.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mật khẩu hiện tại" error={passwordErrors.currentPassword}>
                <input type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} className="input-field" />
              </Field>
              <Field label="Mật khẩu mới" error={passwordErrors.newPassword}>
                <input type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} className="input-field" />
              </Field>
              <Field label="Xác nhận mật khẩu mới" error={passwordErrors.confirmPassword}>
                <input type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))} className="input-field" />
              </Field>
            </div>
            <div className="mt-6 flex justify-end">
              <button type="button" onClick={updatePassword} className="btn-warm">Cập nhật mật khẩu</button>
            </div>
          </SettingsCard>
        )}

        {activeTab === 'APPEARANCE' && (
          <SettingsCard title="Giao diện" description="Tinh chỉnh cách hiển thị dữ liệu trong workspace staff.">
            <div className="grid gap-4 lg:grid-cols-2">
              <OptionGroup
                label="Chế độ hiển thị"
                options={[
                  { value: 'COMFORTABLE', label: 'Thoải mái' },
                  { value: 'COMPACT', label: 'Gọn' },
                ]}
                value={appearance.density}
                onChange={(value) => updateAppearance('density', value as AppearanceSettings['density'])}
              />
              <OptionGroup
                label="Ưu tiên hiển thị"
                options={[
                  { value: 'CARD', label: 'Card' },
                  { value: 'TABLE', label: 'Bảng' },
                ]}
                value={appearance.viewMode}
                onChange={(value) => updateAppearance('viewMode', value as AppearanceSettings['viewMode'])}
              />
              <div className="lg:col-span-2">
                <SettingsToggle label="Giảm hiệu ứng chuyển động" checked={appearance.reducedMotion} onChange={() => updateAppearance('reducedMotion', !appearance.reducedMotion)} />
              </div>
            </div>
          </SettingsCard>
        )}

        <SettingsCard title="Phiên đăng nhập" description="Đăng xuất khỏi tài khoản nhân viên trên thiết bị này.">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-base font-bold text-on-surface">{getDisplayName(user)}</p>
              <p className="mt-1 text-sm text-on-surface-variant">{user?.email || 'Chưa cập nhật'}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsLogoutConfirmOpen(true)}
              className="inline-flex min-h-11 items-center justify-center rounded-[14px] border border-error-container bg-error-container px-5 font-display text-sm font-bold text-on-error-container transition hover:border-error hover:bg-[#FFE1E1]"
            >
              Đăng xuất
            </button>
          </div>
        </SettingsCard>

        {toast && <Toast message={toast} />}
        {isLogoutConfirmOpen && (
          <ConfirmDialog
            title="Đăng xuất tài khoản?"
            description="Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng trang nhân viên."
            confirmLabel={isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
            onCancel={() => setIsLogoutConfirmOpen(false)}
            onConfirm={handleLogout}
            disabled={isLoggingOut}
          />
        )}
      </StaffPageShell>
    </AuthGuard>
  )
}

function SettingsCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-outline-variant bg-white p-5 shadow-[var(--band-shadow-card)] sm:p-6">
      <h2 className="font-display text-2xl font-bold text-on-surface">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-on-surface-variant">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-display text-sm font-bold text-on-surface">{label}</span>
      <span className="mt-2 block">{children}</span>
      {error && <span className="mt-2 block text-sm font-semibold text-error">{error}</span>}
    </label>
  )
}

function SettingsToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange} className="flex items-center justify-between gap-4 rounded-2xl border border-outline-variant bg-surface-container-low p-4 text-left transition hover:bg-white">
      <span className="font-display text-sm font-bold text-on-surface">{label}</span>
      <span className={['relative h-7 w-12 rounded-full transition', checked ? 'bg-brand-orange' : 'bg-surface-container-high'].join(' ')}>
        <span className={['absolute top-1 h-5 w-5 rounded-full bg-white shadow transition', checked ? 'left-6' : 'left-1'].join(' ')} />
      </span>
    </button>
  )
}

function OptionGroup({ label, options, value, onChange }: { label: string; options: Array<{ value: string; label: string }>; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <p className="font-display text-sm font-bold text-on-surface">{label}</p>
      <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl border border-outline-variant bg-surface-container-low p-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={[
              'rounded-xl px-4 py-3 font-display text-sm font-bold transition',
              value === option.value ? 'bg-secondary text-on-secondary shadow-[var(--band-shadow-card)]' : 'text-on-surface-variant hover:bg-white',
            ].join(' ')}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  disabled,
  onCancel,
  onConfirm,
}: {
  title: string
  description: string
  confirmLabel: string
  disabled?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#042A16]/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-outline-variant bg-white p-6 shadow-[var(--band-shadow-elevated)]">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-error-container text-error">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path d="M12 8v5M12 17h.01M10.2 4.7 2.8 18a2 2 0 0 0 1.8 3h14.8a2 2 0 0 0 1.8-3L13.8 4.7a2 2 0 0 0-3.6 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="mt-5 font-display text-xl font-bold text-on-surface">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">{description}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={disabled} className="btn-secondary disabled:cursor-not-allowed disabled:opacity-70">
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={disabled}
            className="inline-flex min-h-11 items-center justify-center rounded-[14px] bg-error px-5 font-display text-sm font-bold text-white shadow-[var(--band-shadow-card)] transition hover:bg-[#A61F1F] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
