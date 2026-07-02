'use client'

import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import BandRoomHeader from '@/components/layout/BandRoomHeader'
import { useAuth } from '@/contexts/AuthContext'
import {
  fetchCurrentUser,
  getCustomerDisplayName,
  getInitials,
  updateCustomerProfile,
  type CustomerProfile,
  type UpdateCustomerProfilePayload,
} from '@/lib/customer-profile-service'
import type { UserRole } from '@/lib/auth'

type Message = {
  type: 'success' | 'error'
  text: string
}

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Admin',
  STAFF: 'Nhan vien',
  CUSTOMER: 'Khach hang',
}

export default function CustomerProfileClient() {
  const { user, login, isLoading } = useAuth()
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [profileForm, setProfileForm] = useState<UpdateCustomerProfilePayload>({
    fullName: '',
    email: '',
    phone: '',
  })
  const [avatarPreview, setAvatarPreview] = useState<string | null | undefined>()
  const [profileMessage, setProfileMessage] = useState<Message | null>(null)
  const [isFetchingProfile, setIsFetchingProfile] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadProfile = async () => {
      setProfile(null)
      setProfileForm({
        fullName: '',
        email: '',
        phone: '',
      })
      setAvatarPreview(undefined)
      setIsFetchingProfile(true)
      try {
        const currentProfile = await fetchCurrentUser(user)
        if (!mounted) return

        setProfile(currentProfile)
        setProfileForm({
          fullName: currentProfile.fullName,
          email: currentProfile.email,
          phone: currentProfile.phone,
        })
        setAvatarPreview(currentProfile.avatarUrl ?? null)
      } catch {
        if (!mounted) return
        setProfileMessage({ type: 'error', text: 'Khong the tai thong tin ho so. Vui long thu lai.' })
      } finally {
        if (mounted) {
          setIsFetchingProfile(false)
        }
      }
    }

    if (!isLoading) {
      void loadProfile()
    }

    return () => {
      mounted = false
    }
  }, [isLoading, user])

  const displayName = getCustomerDisplayName({
    ...(profile ?? { role: 'CUSTOMER' as const }),
    fullName: profileForm.fullName || profile?.fullName || '',
    email: profileForm.email || profile?.email || '',
  })
  const displayEmail = profileForm.email || profile?.email || ''
  const avatarInitial = getInitials(displayName, displayEmail)
  const avatarUrl = avatarPreview !== undefined ? avatarPreview || undefined : profile?.avatarUrl
  const role = profile?.role || user?.role || 'CUSTOMER'

  const validateProfile = () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phonePattern = /^[0-9]{9,11}$/

    if (!profileForm.fullName.trim()) {
      return 'Ho ten khong duoc de trong.'
    }

    if (!emailPattern.test(profileForm.email.trim())) {
      return 'Email chua dung dinh dang.'
    }

    if (profileForm.phone.trim() && !phonePattern.test(profileForm.phone.trim())) {
      return 'So dien thoai phai co 9-11 chu so.'
    }

    return null
  }

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      setProfileMessage({ type: 'error', text: 'Ảnh đại diện chỉ hỗ trợ JPG, PNG hoặc WebP.' })
      event.target.value = ''
      return
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setProfileMessage({ type: 'error', text: 'Ảnh đại diện tối đa 2MB.' })
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarPreview(reader.result)
      }
    }
    reader.readAsDataURL(file)
    setProfileMessage(null)
  }

  const handleRemoveAvatar = () => {
    setAvatarPreview((currentPreview) => {
      if (currentPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(currentPreview)
      }
      return null
    })
    if (avatarInputRef.current) {
      avatarInputRef.current.value = ''
    }
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
      setProfileForm({
        fullName: updatedProfile.fullName,
        email: updatedProfile.email,
        phone: updatedProfile.phone,
      })
      login({
        ...(user ?? { role: 'CUSTOMER' as const }),
        id: updatedProfile.id ? String(updatedProfile.id) : user?.id,
        fullName: updatedProfile.fullName,
        name: updatedProfile.fullName,
        email: updatedProfile.email,
        phone: updatedProfile.phone,
        avatarUrl: updatedProfile.avatarUrl,
      })
      setProfileMessage({ type: 'success', text: 'Cap nhat thong tin thanh cong.' })
    } catch (error) {
      setProfileMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Khong the cap nhat thong tin. Vui long thu lai.',
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F2EC] text-[#1A1C1E]">
      <BandRoomHeader />

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-[28px] border border-[#E8E4DC] bg-white p-6 shadow-[0_4px_24px_rgba(26,28,30,0.06)] md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="shrink-0">
                <AvatarPreview avatarUrl={avatarUrl} initial={avatarInitial} size="large" />
              </div>
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-3xl font-bold tracking-tight">
                    {isFetchingProfile ? 'Dang tai ho so' : displayName}
                  </h1>
                  <span className="rounded-full bg-[#FFE8D6] px-3 py-1 font-display text-xs font-bold uppercase tracking-wide text-[#6B3200]">
                    {roleLabels[role]}
                  </span>
                </div>
                <p className="text-[#5C5348]">{isFetchingProfile ? 'Dang dong bo thong tin tai khoan...' : displayEmail}</p>
                <p className="mt-2 max-w-2xl text-sm text-[#5C5348]">
                  Ho so nay dang doc va ghi truc tiep vao backend. Avatar hien chi o che do xem neu backend cung cap.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <form
            onSubmit={handleSaveProfile}
            className="rounded-[24px] border border-[#E8E4DC] bg-white p-6 shadow-[0_4px_24px_rgba(26,28,30,0.06)] md:p-8"
          >
            <div className="mb-6">
              <h2 className="font-display text-xl font-bold">Thong tin ca nhan</h2>
              <p className="mt-1 text-sm text-[#5C5348]">
                Cap nhat thong tin lien he dung cho dat phong.
              </p>
            </div>

            <div className="grid gap-4">
              <FormField label="Ho ten">
                <input
                  value={profileForm.fullName}
                  disabled={isFetchingProfile}
                  onChange={(event) => setProfileForm((form) => ({ ...form, fullName: event.target.value }))}
                  className="h-12 w-full rounded-2xl border border-[#C9C2B6] bg-white px-4 text-sm outline-none transition focus:border-[#FF7518] focus:ring-2 focus:ring-[#FF7518]/20 disabled:cursor-wait disabled:bg-[#FAF8F4]"
                />
              </FormField>

              <FormField label="Email">
                <input
                  type="email"
                  value={profileForm.email}
                  disabled={isFetchingProfile}
                  onChange={(event) => setProfileForm((form) => ({ ...form, email: event.target.value }))}
                  className="h-12 w-full rounded-2xl border border-[#C9C2B6] bg-white px-4 text-sm outline-none transition focus:border-[#FF7518] focus:ring-2 focus:ring-[#FF7518]/20 disabled:cursor-wait disabled:bg-[#FAF8F4]"
                />
              </FormField>

              <FormField label="So dien thoai">
                <input
                  value={profileForm.phone}
                  disabled={isFetchingProfile}
                  onChange={(event) => setProfileForm((form) => ({ ...form, phone: event.target.value }))}
                  placeholder="Vi du: 0901234567"
                  className="h-12 w-full rounded-2xl border border-[#C9C2B6] bg-white px-4 text-sm outline-none transition placeholder:text-[#8A8176] focus:border-[#FF7518] focus:ring-2 focus:ring-[#FF7518]/20 disabled:cursor-wait disabled:bg-[#FAF8F4]"
                />
              </FormField>
            </div>

            {profileMessage && <MessageBox message={profileMessage} />}

            <button
              type="submit"
              disabled={isSavingProfile || isFetchingProfile}
              className="mt-6 h-12 rounded-2xl bg-[#FF7518] px-6 font-display font-semibold text-white transition hover:bg-[#E6640F] focus:outline-none focus:ring-2 focus:ring-[#FF7518]/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingProfile ? 'Dang luu' : 'Luu thay doi'}
            </button>
          </form>

          <aside className="rounded-[24px] border border-[#E8E4DC] bg-white p-6 shadow-[0_4px_24px_rgba(26,28,30,0.06)]">
            <div className="mb-5 flex items-center gap-3">
              <AvatarPreview avatarUrl={avatarUrl} initial={avatarInitial} size="small" />
              <div className="min-w-0">
                <h2 className="font-display text-lg font-bold">Ho so dat phong</h2>
                <p className="truncate text-sm text-[#5C5348]">{displayEmail || 'Email se hien thi sau khi dong bo.'}</p>
              </div>
            </div>
            <p className="text-sm leading-6 text-[#5C5348]">
              Thong tin nay duoc dung de xac nhan lich dat phong va lien he khi can.
            </p>
            <div className="mt-5 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-4 text-sm text-[#5C5348]">
              Avatar upload da duoc loai khoi flow cap nhat vi backend hien chua co field luu truong nay.
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

function AvatarPreview({
  avatarUrl,
  initial,
  size,
}: {
  avatarUrl?: string
  initial: string
  size: 'large' | 'small'
}) {
  const classes =
    size === 'large'
      ? 'h-24 w-24 text-4xl'
      : 'h-14 w-14 text-xl'

  return (
    <span
      className={[
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FF7518] font-display font-bold text-white',
        classes,
      ].join(' ')}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="Anh dai dien" className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </span>
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
