'use client'

import Link from 'next/link'
import AccountMenu from '@/components/layout/AccountMenu'
import { useAuth } from '@/contexts/AuthContext'

const navItems = [
  { label: 'Phòng tập', href: '/rooms' },
  { label: 'Về chúng tôi', href: '/#about' },
]

export default function BandRoomHeader() {
  const { user, isAuthenticated } = useAuth()

  return (
    <header className="border-b border-[#E8E4DC] bg-[#F5F2EC]/95">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF7518] font-display text-xl font-bold text-white">
            ♪
          </span>
          <span className="font-display text-xl font-bold tracking-wide text-[#1A1C1E]">Band Room</span>
        </Link>

        <nav className="hidden items-center gap-12 font-display text-sm font-medium text-[#5C5348] md:flex">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="transition hover:text-[#1A1C1E]">
              {item.label}
            </Link>
          ))}
        </nav>

        {isAuthenticated && user ? (
          <AccountMenu />
        ) : (
          <Link
            href="/login"
            className="rounded-2xl bg-[#FF7518] px-5 py-3 font-display text-sm font-semibold text-white transition hover:bg-[#E6640F] active:scale-[0.98]"
          >
            Đăng nhập
          </Link>
        )}
      </div>
    </header>
  )
}
