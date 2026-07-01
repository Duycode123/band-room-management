'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import AccountMenu from '@/components/layout/AccountMenu'
import { useAuth } from '@/contexts/AuthContext'

const publicNavItems = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Phòng tập', href: '/rooms' },
  { label: 'Hướng dẫn', href: '/guide' },
  { label: 'Blog', href: '/blog' },
]

type BandRoomHeaderProps = {
  fixed?: boolean
}

export default function BandRoomHeader({ fixed = false }: BandRoomHeaderProps) {
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const wrapperClassName = fixed
    ? 'fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-brand-bgGray/90 backdrop-blur-xl'
    : 'sticky top-0 z-50 border-b border-outline-variant bg-brand-bgGray/95 backdrop-blur-xl'

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname?.startsWith(href))

  return (
    <header className={wrapperClassName}>
      <div className="mx-auto flex max-w-7xl items-center gap-5 px-5 py-4 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="BandHub Studio homepage">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-orange text-white shadow-[0_12px_30px_rgba(255,117,24,0.24)]">
            <LogoIcon />
          </span>
          <span className="font-display text-lg font-bold text-on-surface">BandHub Studio</span>
        </Link>

        <nav className="mx-auto hidden items-center gap-2 md:flex" aria-label="Public navigation">
          {publicNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'rounded-xl px-4 py-2 font-display text-sm font-semibold transition-colors',
                isActive(item.href)
                  ? 'bg-primary-container text-on-primary-container'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
              ].join(' ')}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          {isAuthenticated && user ? (
            <AccountMenu />
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl px-4 py-2 font-display text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-brand-orange px-5 py-2.5 font-display text-sm font-semibold text-white shadow-[0_10px_28px_rgba(255,117,24,0.24)] transition hover:bg-brand-orangeHover active:scale-[0.98]"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="ml-auto rounded-xl border border-outline bg-white/85 px-3 py-2 font-display text-sm font-semibold text-on-surface shadow-[var(--shadow-card)] md:hidden"
          aria-expanded={isOpen}
          aria-controls="public-mobile-menu"
        >
          {isOpen ? 'Đóng' : 'Menu'}
        </button>
      </div>

      {isOpen && (
        <div id="public-mobile-menu" className="border-t border-outline-variant bg-brand-bgGray px-5 pb-5 md:hidden">
          <nav className="grid gap-1 py-3" aria-label="Mobile public navigation">
            {publicNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={[
                  'rounded-xl px-4 py-3 font-display text-sm font-semibold transition-colors',
                  isActive(item.href)
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-on-surface-variant hover:bg-white hover:text-on-surface',
                ].join(' ')}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {isAuthenticated && user ? (
            <div className="mt-3 flex justify-end">
              <AccountMenu align="full" onNavigate={() => setIsOpen(false)} />
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="rounded-xl border border-outline bg-white px-4 py-3 text-center font-display text-sm font-semibold text-on-surface"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                onClick={() => setIsOpen(false)}
                className="rounded-xl bg-brand-orange px-4 py-3 text-center font-display text-sm font-semibold text-white"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}

function LogoIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M9 18V5l10-2v13" />
      <path d="M9 9l10-2" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="16" cy="16" r="3" />
    </svg>
  )
}
