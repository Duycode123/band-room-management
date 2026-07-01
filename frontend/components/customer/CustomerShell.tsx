'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  CustomerBrandMark,
  IconBooking,
  IconCalendar,
  IconChat,
  IconGift,
  IconHome,
  IconLogout,
  type CustomerNavItem,
} from './CustomerIcons'

const NAV_ITEMS: CustomerNavItem[] = [
  { href: '/customer/dashboard', label: 'Trang chu', icon: <IconHome className="h-5 w-5" /> },
  { href: '/customer/booking', label: 'Dat phong', icon: <IconBooking className="h-5 w-5" /> },
  { href: '/customer/chatbot', label: 'Chatbot', icon: <IconChat className="h-5 w-5" /> },
  { href: '#', label: 'Lich cua toi', icon: <IconCalendar className="h-5 w-5" />, disabled: true },
  { href: '#', label: 'Uu dai', icon: <IconGift className="h-5 w-5" />, disabled: true },
]

type CustomerShellProps = {
  children: ReactNode
}

export default function CustomerShell({ children }: CustomerShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-brand-bgGray">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-brand-orange/8 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-secondary-container/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(26,28,30,0.04) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      <div className="relative flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-gradient-to-b from-brand-greenDark via-[#063318] to-brand-greenLight lg:flex">
          <div className="border-b border-white/10 px-5 py-6">
            <CustomerBrandMark />
          </div>

          <nav className="flex-1 space-y-1 px-3 py-5">
            {NAV_ITEMS.map((item) => {
              const active = !item.disabled && pathname === item.href
              const base =
                'flex items-center gap-3 rounded-xl px-3 py-2.5 font-display text-sm font-medium transition-all'

              if (item.disabled) {
                return (
                  <div
                    key={item.label}
                    className={[base, 'cursor-not-allowed text-white/35'].join(' ')}
                    title="Sap ra mat"
                  >
                    <span className="opacity-50">{item.icon}</span>
                    {item.label}
                    <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[9px] uppercase tracking-wider">
                      Soon
                    </span>
                  </div>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    base,
                    active
                      ? 'bg-white/15 text-white shadow-inner shadow-black/10'
                      : 'text-white/75 hover:bg-white/10 hover:text-white',
                  ].join(' ')}
                >
                  <span className={active ? 'text-brand-orange' : ''}>{item.icon}</span>
                  {item.label}
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-orange shadow-[0_0_8px_rgba(255,117,24,0.9)]" />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-white/10 p-4">
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-display text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <IconLogout className="h-5 w-5" />
              Dang xuat
            </button>
          </div>
        </aside>

        <div className="fixed inset-x-0 top-0 z-30 border-b border-outline-variant bg-white/90 backdrop-blur-md lg:hidden">
          <div className="flex items-center gap-2 overflow-x-auto px-4 py-3">
            {NAV_ITEMS.filter((i) => !i.disabled).map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-display text-xs font-medium transition-colors',
                    active ? 'bg-brand-orange text-white' : 'bg-surface-container text-on-surface-variant',
                  ].join(' ')}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>

        <main className="flex-1 pt-14 lg:pt-0">{children}</main>
      </div>
    </div>
  )
}
