'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import { StaffPageShell, Toast } from './StaffShared'
import { useAuth } from '@/contexts/AuthContext'
import {
  changeCustomerPassword,
  fetchCurrentUser,
  updateCustomerProfile,
  type CustomerProfile,
} from '@/lib/customer-profile-service'
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
  { id: 'PROFILE', label: 'Ho so' },
  { id: 'NOTIFICATIONS', label: 'Thong bao' },
  { id: 'SECURITY', label: 'Bao mat' },
  { id: 'APPEARANCE', label: 'Giao dien' },
]

const defaultProfile: StaffProfile = {
  fullName: 'Chua cap nhat',
  email: 'Chua cap nhat',
  phone: 'Chua cap nhat',
  role: 'STAFF',
  branchName: 'BandHub Studio - Ha Dong',
}

export default function StaffSettingsPage() {
  const router = useRouter()
  const { user, login, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<SettingsTab>('PROFILE')
  const [profile, setProfile] = useState<StaffProfile>(defaultProfile)
  const [profileErrors, setProfileErrors] = useState<Partial<Record<'fullName' | 'email' | 'phone', string>>>({})
  const [notificationSettings, setNotificationSettings] = useState<StaffNotificationSettings>({
    newBooking: true,
    bookingReminder: true,
    shiftReminder: true,
    roomIssue: true,
    equipmentIssue: true,
  })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordErrors, setPasswordErrors] = useState<Partial<Record<keyof typeof passwordForm, string>>>({})
  const [appearance, setAppearance] = useState<AppearanceSettings>({
    density: 'COMFORTABLE',
    viewMode: 'CARD',
    reducedMotion: false,
  })
  const [toast, setToast] = useState<string | null>(null)
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  useEffect(() => {
    if (!user) {
      setProfile(defaultProfile)
      setIsLoadingProfile(false)
      return
    }

    let mounted = true

    const hydrateProfile = (source: Partial<CustomerProfile & typeof user>) => {
      if (!mounted) return

      setProfile({
        fullName: getProfileValue(source.fullName || source.name || getDisplayName(source)),
        email: getProfileValue(source.email),
        phone: getProfileValue(source.phone),
        role: source.role || user.role,
        branchName: defaultProfile.branchName,
        avatarUrl: source.avatarUrl,
      })
    }

    hydrateProfile(user)
    setIsLoadingProfile(true)

    void fetchCurrentUser(user)
      .then((currentUser) => {
        hydrateProfile({ ...user, ...currentUser, role: currentUser.role || user.role })
      })
      .finally(() => {
        if (mounted) {
          setIsLoadingProfile(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [user])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const updateProfileField = <Key extends keyof StaffProfile>(key: Key, value: StaffProfile[Key]) => {
    setProfile((current) => ({ ...current, [key]: value }))
    if (key === 'fullName' || key === 'email' || key === 'phone') {
      setProfileErrors((current) => ({ ...current, [key]: undefined }))
    }
  }

  const saveProfile = async () => {
    const errors: Partial<Record<'fullName' | 'email' | 'phone', string>> = {}
    const normalizedFullName = profile.fullName.trim()
    const normalizedEmail = profile.email.trim()
    const normalizedPhone = profile.phone === 'Chua cap nhat' ? '' : profile.phone.trim()

    if (!normalizedFullName || normalizedFullName === 'Chua cap nhat') {
      errors.fullName = 'Ho ten khong duoc de trong.'
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      errors.email = 'Email chua dung dinh dang.'
    }

    if (normalizedPhone && !/^[0-9]{9,11}$/.test(normalizedPhone)) {
      errors.phone = 'So dien thoai phai co 9-11 chu so.'
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors)
      return
    }

    setIsSavingProfile(true)
    try {
      const updatedProfile = await updateCustomerProfile({
        fullName: normalizedFullName,
        email: normalizedEmail,
        phone: normalizedPhone,
      })

      setProfile((current) => ({
        ...current,
        fullName: updatedProfile.fullName,
        email: updatedProfile.email,
        phone: updatedProfile.phone || 'Chua cap nhat',
        role: updatedProfile.role || current.role,
        avatarUrl: updatedProfile.avatarUrl,
      }))
      setProfileErrors({})

      if (user) {
        login({
          ...user,
          id: updatedProfile.id ? String(updatedProfile.id) : user.id,
          fullName: updatedProfile.fullName,
          name: updatedProfile.fullName,
          email: updatedProfile.email,
          phone: updatedProfile.phone || undefined,
          avatarUrl: updatedProfile.avatarUrl,
        })
      }

      setToast('Da cap nhat ho so tu backend.')
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Khong the cap nhat ho so.')
    } finally {
      setIsSavingProfile(false)
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

  const updatePassword = async () => {
    const errors: Partial<Record<keyof typeof passwordForm, string>> = {}
    if (!passwordForm.currentPassword) errors.currentPassword = 'Vui long nhap mat khau hien tai.'
    if (passwordForm.newPassword.length < 8) errors.newPassword = 'Mat khau moi can toi thieu 8 ky tu.'
    if (passwordForm.confirmPassword !== passwordForm.newPassword) errors.confirmPassword = 'Mat khau xac nhan chua khop.'

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors)
      return
    }

    setIsUpdatingPassword(true)
    try {
      await changeCustomerPassword(passwordForm)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordErrors({})
      setToast('Da cap nhat mat khau tu backend.')
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Khong the cap nhat mat khau.')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const toggleNotification = (key: keyof StaffNotificationSettings) => {
    setNotificationSettings((current) => ({ ...current, [key]: !current[key] }))
    setToast('Da cap nhat tuy chon thong bao local.')
  }

  const updateAppearance = <Key extends keyof AppearanceSettings>(key: Key, value: AppearanceSettings[Key]) => {
    setAppearance((current) => ({ ...current, [key]: value }))
    setToast('Da cap nhat tuy chon giao dien local.')
  }

  return (
    <AuthGuard allowedRoles={['STAFF']}>
      <StaffPageShell>
        <header>
          <p className="font-display text-sm font-bold uppercase tracking-wide text-brand-orange">Khong gian lam viec</p>
          <h1 className="mt-2 font-display text-[32px] font-bold leading-10 text-on-surface">Cai dat</h1>
          <p className="mt-2 max-w-2xl text-base leading-6 text-on-surface-variant">
            Quan ly thong tin tai khoan staff va cac tuy chon lam viec.
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
          <SettingsCard
            title="Ho so nhan vien"
            description="Tab nay da map doc/ghi thuc te voi /api/users/me. Chi nhanh van dang la thong tin hien thi co dinh."
          >
            <div className="flex flex-col gap-5 lg:flex-row">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-primary-container font-display text-3xl font-bold text-on-primary-container">
                {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" /> : getInitials(profile.fullName || profile.email)}
              </div>
              <div className="grid flex-1 gap-4 sm:grid-cols-2">
                <Field label="Ho ten / Ten dang nhap" error={profileErrors.fullName}>
                  <input
                    value={profile.fullName}
                    disabled={isLoadingProfile}
                    onChange={(event) => updateProfileField('fullName', event.target.value)}
                    className="input-field disabled:cursor-wait disabled:opacity-70"
                  />
                </Field>
                <Field label="Email" error={profileErrors.email}>
                  <input
                    value={profile.email}
                    disabled={isLoadingProfile}
                    onChange={(event) => updateProfileField('email', event.target.value)}
                    className="input-field disabled:cursor-wait disabled:opacity-70"
                  />
                </Field>
                <Field label="So dien thoai" error={profileErrors.phone}>
                  <input
                    value={profile.phone}
                    disabled={isLoadingProfile}
                    onChange={(event) => updateProfileField('phone', event.target.value)}
                    className="input-field disabled:cursor-wait disabled:opacity-70"
                  />
                </Field>
                <Field label="Vai tro">
                  <input value={getRoleLabel(profile.role)} disabled className="input-field cursor-not-allowed opacity-75" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Chi nhanh lam viec">
                    <input value={profile.branchName} disabled className="input-field cursor-not-allowed opacity-75" />
                  </Field>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => void saveProfile()}
                disabled={isLoadingProfile || isSavingProfile}
                className="btn-warm disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSavingProfile ? 'Dang luu...' : 'Luu thay doi'}
              </button>
            </div>
          </SettingsCard>
        )}

        {activeTab === 'NOTIFICATIONS' && (
          <SettingsCard
            title="Thong bao"
            description="Tab nay van dang luu local o frontend vi backend chua co endpoint preference rieng cho staff."
          >
            <div className="grid gap-3">
              <SettingsToggle label="Nhan thong bao booking moi" checked={notificationSettings.newBooking} onChange={() => toggleNotification('newBooking')} />
              <SettingsToggle label="Nhac khach sap den" checked={notificationSettings.bookingReminder} onChange={() => toggleNotification('bookingReminder')} />
              <SettingsToggle label="Nhac ca lam" checked={notificationSettings.shiftReminder} onChange={() => toggleNotification('shiftReminder')} />
              <SettingsToggle label="Thong bao su co phong" checked={notificationSettings.roomIssue} onChange={() => toggleNotification('roomIssue')} />
              <SettingsToggle label="Thong bao thiet bi loi" checked={notificationSettings.equipmentIssue} onChange={() => toggleNotification('equipmentIssue')} />
            </div>
          </SettingsCard>
        )}

        {activeTab === 'SECURITY' && (
          <SettingsCard
            title="Bao mat"
            description="Tab nay da map toi /api/users/me/password va se bao loi backend neu mat khau khong hop le."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mat khau hien tai" error={passwordErrors.currentPassword}>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) => {
                    setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
                    setPasswordErrors((current) => ({ ...current, currentPassword: undefined }))
                  }}
                  className="input-field"
                />
              </Field>
              <Field label="Mat khau moi" error={passwordErrors.newPassword}>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) => {
                    setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                    setPasswordErrors((current) => ({ ...current, newPassword: undefined }))
                  }}
                  className="input-field"
                />
              </Field>
              <Field label="Xac nhan mat khau moi" error={passwordErrors.confirmPassword}>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => {
                    setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                    setPasswordErrors((current) => ({ ...current, confirmPassword: undefined }))
                  }}
                  className="input-field"
                />
              </Field>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => void updatePassword()}
                disabled={isUpdatingPassword}
                className="btn-warm disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isUpdatingPassword ? 'Dang cap nhat...' : 'Cap nhat mat khau'}
              </button>
            </div>
          </SettingsCard>
        )}

        {activeTab === 'APPEARANCE' && (
          <SettingsCard
            title="Giao dien"
            description="Tab nay van dang local-only, chua co endpoint backend cho preference workspace."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <OptionGroup
                label="Che do hien thi"
                options={[
                  { value: 'COMFORTABLE', label: 'Thoai mai' },
                  { value: 'COMPACT', label: 'Gon' },
                ]}
                value={appearance.density}
                onChange={(value) => updateAppearance('density', value as AppearanceSettings['density'])}
              />
              <OptionGroup
                label="Uu tien hien thi"
                options={[
                  { value: 'CARD', label: 'Card' },
                  { value: 'TABLE', label: 'Bang' },
                ]}
                value={appearance.viewMode}
                onChange={(value) => updateAppearance('viewMode', value as AppearanceSettings['viewMode'])}
              />
              <div className="lg:col-span-2">
                <SettingsToggle label="Giam hieu ung chuyen dong" checked={appearance.reducedMotion} onChange={() => updateAppearance('reducedMotion', !appearance.reducedMotion)} />
              </div>
            </div>
          </SettingsCard>
        )}

        <SettingsCard title="Phien dang nhap" description="Dang xuat khoi tai khoan nhan vien tren thiet bi nay.">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-base font-bold text-on-surface">{getDisplayName(user)}</p>
              <p className="mt-1 text-sm text-on-surface-variant">{user?.email || 'Chua cap nhat'}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsLogoutConfirmOpen(true)}
              className="inline-flex min-h-11 items-center justify-center rounded-[14px] border border-error-container bg-error-container px-5 font-display text-sm font-bold text-on-error-container transition hover:border-error hover:bg-[#FFE1E1]"
            >
              Dang xuat
            </button>
          </div>
        </SettingsCard>

        {toast && <Toast message={toast} />}
        {isLogoutConfirmOpen && (
          <ConfirmDialog
            title="Dang xuat tai khoan?"
            description="Ban se can dang nhap lai de tiep tuc su dung trang nhan vien."
            confirmLabel={isLoggingOut ? 'Dang dang xuat...' : 'Dang xuat'}
            onCancel={() => setIsLogoutConfirmOpen(false)}
            onConfirm={handleLogout}
            disabled={isLoggingOut}
          />
        )}
      </StaffPageShell>
    </AuthGuard>
  )
}

function SettingsCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-outline-variant bg-white p-5 shadow-[var(--band-shadow-card)] sm:p-6">
      <h2 className="font-display text-2xl font-bold text-on-surface">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-on-surface-variant">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
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
            Huy
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
