'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getCustomerDisplayName, getInitials } from '@/lib/customer-profile-service'

type AccountMenuProps = {
  onNavigate?: () => void
  align?: 'right' | 'full'
}

const disabledItems = [
  { icon: 'LS', label: 'Lịch sử đặt phòng' },
  { icon: 'TG', label: 'Trợ giúp và hỗ trợ' },
  { icon: 'BC', label: 'Báo cáo sự cố' },
  { icon: 'MH', label: 'Màn hình và trợ năng' },
]

export default function AccountMenu({ onNavigate, align = 'right' }: AccountMenuProps) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const userDisplayName = getCustomerDisplayName(user)
  const avatarInitial = getInitials(user?.fullName || user?.name, user?.email)
  const userEmail = user?.email || 'Chưa cập nhật email'

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const handleProfileNavigate = () => {
    setOpen(false)
    onNavigate?.()
  }

  const handleLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    try {
      await logout()
      setOpen(false)
      onNavigate?.()
      router.replace('/')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-[#C9C2B6] bg-white/85 px-3 py-2 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF7518]/30"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF7518] font-display text-sm font-bold text-white">
          {avatarInitial}
        </span>
        <span className="hidden max-w-[160px] truncate font-display text-sm font-semibold text-[#1A1C1E] sm:block">
          {userDisplayName}
        </span>
        <span className="font-display text-xs text-[#5C5348]">v</span>
      </button>

      {open && (
        <div
          role="menu"
          className={[
            'absolute z-[90] mt-3 w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-[24px] border border-[#E8E4DC] bg-white shadow-[0_24px_70px_rgba(26,28,30,0.20)]',
            align === 'full' ? 'right-0' : 'right-0',
          ].join(' ')}
        >
          <div className="bg-[#F5F2EC] p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FF7518] font-display text-xl font-bold text-white">
                {avatarInitial}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-base font-bold text-[#1A1C1E]">{userDisplayName}</p>
                <p className="mt-1 truncate text-sm text-[#5C5348]">{userEmail}</p>
                <span className="mt-2 inline-flex rounded-full bg-[#FFE8D6] px-3 py-1 font-display text-xs font-bold text-[#6B3200]">
                  Khách hàng
                </span>
              </div>
            </div>

            <Link
              href="/customer/profile"
              onClick={handleProfileNavigate}
              className="mt-5 flex h-11 w-full items-center justify-center rounded-2xl bg-[#FF7518] font-display text-sm font-semibold text-white transition hover:bg-[#E6640F] focus:outline-none focus:ring-2 focus:ring-[#FF7518]/30"
              role="menuitem"
            >
              Xem hồ sơ cá nhân
            </Link>
          </div>

          <div className="border-t border-[#E8E4DC] p-2">
            <AccountMenuLink icon="CD" label="Cài đặt tài khoản" href="/customer/profile" onClick={handleProfileNavigate} />
            {disabledItems.map((item) => (
              <button
                key={item.label}
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center justify-between rounded-2xl px-3 py-3 text-left opacity-55"
                role="menuitem"
              >
                <span className="flex items-center gap-3">
                  <MenuIcon>{item.icon}</MenuIcon>
                  <span className="font-display text-sm font-semibold text-[#5C5348]">{item.label}</span>
                </span>
                <span className="text-xs text-[#8A8176]">Sắp có</span>
              </button>
            ))}
          </div>

          <div className="border-t border-[#E8E4DC] p-2">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-[#FFF4F2] focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 disabled:cursor-not-allowed disabled:opacity-60"
              role="menuitem"
            >
              <MenuIcon danger>DX</MenuIcon>
              <span className="font-display text-sm font-semibold text-[#C62828]">
                {isLoggingOut ? 'Đang đăng xuất' : 'Đăng xuất'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function AccountMenuLink({
  icon,
  label,
  href,
  onClick,
}: {
  icon: string
  label: string
  href: string
  onClick: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center justify-between rounded-2xl px-3 py-3 transition hover:bg-[#FAF8F4] focus:outline-none focus:ring-2 focus:ring-[#FF7518]/20"
      role="menuitem"
    >
      <span className="flex items-center gap-3">
        <MenuIcon>{icon}</MenuIcon>
        <span className="font-display text-sm font-semibold text-[#1A1C1E]">{label}</span>
      </span>
      <span className="text-xs text-[#5C5348]">›</span>
    </Link>
  )
}

function MenuIcon({ children, danger = false }: { children: string; danger?: boolean }) {
  return (
    <span
      className={[
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl font-display text-[11px] font-bold',
        danger ? 'bg-[#FFEBEE] text-[#C62828]' : 'bg-[#FFE8D6] text-[#6B3200]',
      ].join(' ')}
    >
      {children}
    </span>
  )
}
