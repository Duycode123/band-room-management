'use client'

import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import { StaffPageShell, Toast } from './StaffShared'
import { useAuth } from '@/contexts/AuthContext'
import { clearStaffAuthCaches, getDisplayName, getInitials, getProfileValue, getRoleLabel } from '@/lib/staff-profile'
import {
  changePassword,
  getCurrentUser,
  getNotificationSettings,
  loadUiPreferences,
  saveUiPreferences,
  uploadMyAvatar,
  updateMyProfile,
  type StaffProfile,
} from '@/lib/staff-settings-service'

type SettingsTab = 'PROFILE' | 'SECURITY'
type ToastState = { type: 'success' | 'error'; text: string }

const tabs: Array<{ id: SettingsTab; label: string }> = [
  { id: 'PROFILE', label: 'Hồ sơ' },
  { id: 'SECURITY', label: 'Bảo mật' },
]

const emptyProfile: StaffProfile = {
  fullName: '',
  email: '',
  phone: '',
  role: 'STAFF',
}

const emptyPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

export default function StaffSettingsPage() {
  const router = useRouter()
  const { user, login, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<SettingsTab>('PROFILE')
  const [profile, setProfile] = useState<StaffProfile>(emptyProfile)
  const [profileErrors, setProfileErrors] = useState<Partial<Record<keyof StaffProfile, string>>>({})
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm)
  const [passwordErrors, setPasswordErrors] = useState<Partial<Record<keyof typeof passwordForm, string>>>({})
  const [toast, setToast] = useState<ToastState | null>(null)
  const [pageError, setPageError] = useState('')
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const [isProfileSaving, setIsProfileSaving] = useState(false)
  const [isAvatarUploading, setIsAvatarUploading] = useState(false)
  const [isNotificationLoading, setIsNotificationLoading] = useState(true)
  const [savingNotificationKey, setSavingNotificationKey] = useState<keyof StaffNotificationSettings | null>(null)
  const [isPasswordSaving, setIsPasswordSaving] = useState(false)
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const cardPadding = 'p-5 sm:p-6'
  const profileInitials = useMemo(() => getInitials(profile.fullName || profile.email || getDisplayName(user)), [profile.email, profile.fullName, user])

  useEffect(() => {
    if (!user) return

    setIsProfileLoading(true)
    setPageError('')
    void getCurrentUser(user)
      .then((currentUser) => {
        setProfile(currentUser)
        login({
          ...user,
          ...currentUser,
          name: currentUser.fullName,
          role: currentUser.role || user.role,
        })
      })
      .catch((error) => setPageError(error instanceof Error ? error.message : 'Không thể tải hồ sơ nhân viên.'))
      .finally(() => setIsProfileLoading(false))
  }, [user?.id, user?.email])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  const showToast = (type: ToastState['type'], text: string) => {
    setToast({ type, text })
  }

  const updateProfile = <Key extends keyof StaffProfile>(key: Key, value: StaffProfile[Key]) => {
    setProfile((current) => ({ ...current, [key]: value }))
    setProfileErrors((current) => ({ ...current, [key]: undefined }))
  }

  const saveProfile = async () => {
    const errors = validateProfile(profile)
    setProfileErrors(errors)

    if (Object.keys(errors).length > 0) return

    setIsProfileSaving(true)
    try {
      const updatedProfile = await updateMyProfile({
        fullName: profile.fullName.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
      })

      setProfile(updatedProfile)
      if (user) {
        login({
          ...user,
          ...updatedProfile,
          name: updatedProfile.fullName,
          role: updatedProfile.role || user.role,
        })
      }
      showToast('success', 'Đã lưu thay đổi hồ sơ.')
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không thể lưu hồ sơ nhân viên.')
    } finally {
      setIsProfileSaving(false)
    }
  }

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast('error', 'File tải lên phải là ảnh.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Ảnh đại diện không được vượt quá 5MB.')
      return
    }

    setIsAvatarUploading(true)
    try {
      const updatedProfile = await uploadMyAvatar(file, user)
      setProfile(updatedProfile)
      if (user) {
        login({
          ...user,
          ...updatedProfile,
          name: updatedProfile.fullName,
          role: updatedProfile.role || user.role,
        })
      }
      showToast('success', 'Đã cập nhật ảnh đại diện.')
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không thể tải ảnh đại diện lên.')
    } finally {
      setIsAvatarUploading(false)
    }
  }

  const updatePasswordField = (key: keyof typeof passwordForm, value: string) => {
    setPasswordForm((current) => ({ ...current, [key]: value }))
    setPasswordErrors((current) => ({ ...current, [key]: undefined }))
  }

  const updatePassword = async () => {
    const errors = validatePasswordForm(passwordForm)
    setPasswordErrors(errors)

    if (Object.keys(errors).length > 0) return

    setIsPasswordSaving(true)
    try {
      await changePassword(passwordForm)
      setPasswordForm(emptyPasswordForm)
      showToast('success', 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.')
      await logout()
      clearStaffAuthCaches()
      router.replace('/login')
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không thể cập nhật mật khẩu.')
    } finally {
      setIsPasswordSaving(false)
    }
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

  return (
    <AuthGuard allowedRoles={['STAFF']}>
      <StaffPageShell>
        <div className="staff-settings-density-scope contents">
        <header>
          <p className="font-display text-sm font-bold uppercase tracking-wide text-brand-orange">Không gian làm việc</p>
          <h1 className="mt-2 font-display text-[32px] font-bold leading-10 text-on-surface">Cài đặt</h1>
          <p className="mt-2 max-w-2xl text-base leading-6 text-on-surface-variant">
            Quản lý hồ sơ và bảo mật tài khoản nhân viên.
          </p>
        </header>

        {pageError && <MessageBox type="error" message={pageError} />}

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
          <SettingsCard title="Hồ sơ nhân viên" description="Thông tin này lấy từ tài khoản đang đăng nhập và được lưu về hệ thống." paddingClassName={cardPadding}>
            {isProfileLoading ? (
              <LoadingState message="Đang tải hồ sơ..." />
            ) : (
              <>
                <div className="flex flex-col gap-5 lg:flex-row">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-primary-container font-display text-3xl font-bold text-on-primary-container">
                    {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" /> : profileInitials}
                  </div>
                  <div className="lg:max-w-[240px]">
                    <label className="block">
                      <span className="mb-2 block font-display text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                        Avatar
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => void handleAvatarChange(event)}
                        disabled={isAvatarUploading || isProfileSaving}
                        className="block w-full text-xs text-on-surface-variant file:mr-3 file:rounded-2xl file:border-0 file:bg-brand-orange file:px-4 file:py-2.5 file:font-display file:text-sm file:font-bold file:text-white hover:file:bg-brand-orangeHover disabled:cursor-not-allowed disabled:opacity-60"
                      />
                      <span className="mt-2 block text-xs text-on-surface-variant">
                        {isAvatarUploading ? 'Dang tai anh len Cloudinary...' : 'Toi da 5MB. URL avatar se duoc luu vao database.'}
                      </span>
                    </label>
                  </div>
                  <div className="grid flex-1 gap-4 sm:grid-cols-2">
                    <Field label="Tên hiển thị" error={profileErrors.fullName}>
                      <input value={profile.fullName} onChange={(event) => updateProfile('fullName', event.target.value)} className="input-field" disabled={isProfileSaving} />
                    </Field>
                    <Field label="Email" error={profileErrors.email}>
                      <input type="email" value={profile.email} onChange={(event) => updateProfile('email', event.target.value)} className="input-field" disabled={isProfileSaving} />
                    </Field>
                    <Field label="Số điện thoại" error={profileErrors.phone}>
                      <input value={profile.phone} onChange={(event) => updateProfile('phone', event.target.value)} className="input-field" disabled={isProfileSaving} />
                    </Field>
                    <Field label="Vai trò">
                      <input value={getRoleLabel(profile.role)} disabled className="input-field cursor-not-allowed opacity-75" />
                    </Field>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button type="button" onClick={saveProfile} className="btn-warm" disabled={isProfileSaving || isAvatarUploading}>
                    {isProfileSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </>
            )}
          </SettingsCard>
        )}

        {activeTab === 'SECURITY' && (
          <SettingsCard title="Bảo mật" description="Đổi mật khẩu thật cho tài khoản hiện tại. Sau khi đổi thành công bạn sẽ cần đăng nhập lại." paddingClassName={cardPadding}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mật khẩu hiện tại" error={passwordErrors.currentPassword}>
                <input type="password" value={passwordForm.currentPassword} onChange={(event) => updatePasswordField('currentPassword', event.target.value)} className="input-field" disabled={isPasswordSaving} />
              </Field>
              <Field label="Mật khẩu mới" error={passwordErrors.newPassword}>
                <input type="password" value={passwordForm.newPassword} onChange={(event) => updatePasswordField('newPassword', event.target.value)} className="input-field" disabled={isPasswordSaving} />
              </Field>
              <Field label="Xác nhận mật khẩu mới" error={passwordErrors.confirmPassword}>
                <input type="password" value={passwordForm.confirmPassword} onChange={(event) => updatePasswordField('confirmPassword', event.target.value)} className="input-field" disabled={isPasswordSaving} />
              </Field>
            </div>
            <div className="mt-6 flex justify-end">
              <button type="button" onClick={updatePassword} className="btn-warm" disabled={isPasswordSaving}>
                {isPasswordSaving ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </button>
            </div>
          </SettingsCard>
        )}

        <SettingsCard title="Phiên đăng nhập" description="Đăng xuất khỏi tài khoản nhân viên trên thiết bị này." paddingClassName={cardPadding}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-base font-bold text-on-surface">{getDisplayName({ ...user, fullName: profile.fullName || user?.fullName })}</p>
              <p className="mt-1 text-sm text-on-surface-variant">{profile.email || user?.email || 'Chưa cập nhật'}</p>
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

        {toast && <Toast message={toast.text} />}
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
        </div>
      </StaffPageShell>
    </AuthGuard>
  )
}

function validateProfile(profile: StaffProfile) {
  const errors: Partial<Record<keyof StaffProfile, string>> = {}
  if (!profile.fullName.trim()) errors.fullName = 'Vui lòng nhập tên hiển thị.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) errors.email = 'Email chưa đúng định dạng.'
  if (profile.phone.trim() && !/^[0-9]{9,11}$/.test(profile.phone.trim())) errors.phone = 'Số điện thoại phải có 9-11 chữ số.'
  return errors
}

function validatePasswordForm(form: typeof emptyPasswordForm) {
  const errors: Partial<Record<keyof typeof emptyPasswordForm, string>> = {}
  if (!form.currentPassword) errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.'
  if (!form.newPassword) errors.newPassword = 'Vui lòng nhập mật khẩu mới.'
  if (form.newPassword && form.newPassword.length < 8) errors.newPassword = 'Mật khẩu mới cần tối thiểu 8 ký tự.'
  if (!form.confirmPassword) errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới.'
  if (form.confirmPassword && form.confirmPassword !== form.newPassword) errors.confirmPassword = 'Mật khẩu xác nhận chưa khớp.'
  if (form.currentPassword && form.newPassword && form.currentPassword === form.newPassword) errors.newPassword = 'Mật khẩu mới không được giống mật khẩu hiện tại.'
  return errors
}

function SettingsCard({ title, description, children, paddingClassName }: { title: string; description: string; children: React.ReactNode; paddingClassName: string }) {
  return (
    <section className={['rounded-3xl border border-outline-variant bg-white shadow-[var(--band-shadow-card)]', paddingClassName].join(' ')}>
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

function LoadingState({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-5 text-sm font-semibold text-on-surface-variant">{message}</div>
}

function MessageBox({ type, message }: { type: ToastState['type']; message: string }) {
  const isError = type === 'error'
  return (
    <div className={['rounded-2xl border px-4 py-3 text-sm font-semibold', isError ? 'border-error-container bg-error-container text-on-error-container' : 'border-[#CDE9D6] bg-[#E8F5EC] text-secondary'].join(' ')}>
      {message}
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
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#042A16]/50 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-md rounded-3xl border border-outline-variant bg-white p-6 shadow-[var(--band-shadow-elevated)]" onClick={(event) => event.stopPropagation()}>
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
