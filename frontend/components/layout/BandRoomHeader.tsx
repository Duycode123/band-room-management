'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import AccountMenu from '@/components/layout/AccountMenu'
import { useAuth } from '@/contexts/AuthContext'
import { publicNavItems, scrollToPageTop, shouldScrollToTop } from '@/lib/site-nav'

type BandRoomHeaderProps = {
  variant?: 'page' | 'hero'
}

function MusicLogo({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M9 18V5l10-2v13" />
      <path d="M9 9l10-2" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="16" cy="16" r="3" />
    </svg>
  )
}

export default function BandRoomHeader({ variant = 'page' }: BandRoomHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const isHero = variant === 'hero'

  const handleBookClick = () => {
    setMenuOpen(false)

    if (isAuthLoading) return
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (user?.role === 'CUSTOMER') {
      router.push('/customer/booking')
      return
    }

    if (pathname === '/') {
      router.push('/rooms')
      return
    }

    router.push('/rooms')
  }

  const headerClass = isHero
    ? 'fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-secondary/80 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl'
    : 'fixed inset-x-0 top-0 z-50 border-b border-[#E8E4DC] bg-[#F5F2EC]/95 shadow-[0_4px_24px_rgba(26,28,30,0.06)] backdrop-blur-md'

  const logoBoxClass = isHero
    ? 'flex h-10 w-10 items-center justify-center rounded-xl bg-brand-orange text-white shadow-[0_8px_24px_rgba(255,117,24,0.45)]'
    : 'flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF7518] text-white shadow-[0_8px_20px_rgba(255,117,24,0.28)]'

  const brandTextClass = isHero
    ? 'font-display text-lg font-bold text-white'
    : 'font-display text-xl font-bold tracking-wide text-[#1A1C1E]'

  const navLinkClass = isHero
    ? 'rounded-lg px-4 py-2 font-display text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white'
    : 'font-display text-sm font-medium text-[#5C5348] transition hover:text-[#1A1C1E]'

  const navItemsForPage =
    pathname === '/'
      ? publicNavItems.map((item) => (item.href.startsWith('/#') ? { ...item, href: item.href.slice(1) } : item))
      : publicNavItems

  const handleLogoClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    setMenuOpen(false)

    if (pathname !== '/') return

    event.preventDefault()
    window.history.replaceState(window.history.state, '', '/')
    scrollToPageTop()
  }

  const handleNavLinkClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setMenuOpen(false)

    if (!shouldScrollToTop(pathname, href)) return

    event.preventDefault()
    scrollToPageTop()
  }

  return (
    <>
      <header className={headerClass}>
      <div
        className={[
          'mx-auto flex max-w-7xl items-center gap-4 px-5 py-4 sm:px-8',
          isHero ? '' : 'h-20 justify-between',
        ].join(' ')}
      >
        <Link
          href="/"
          onClick={handleLogoClick}
          className="flex shrink-0 items-center gap-3"
          aria-label="Band Room homepage"
        >
          <span className={logoBoxClass}>
            {isHero ? <MusicLogo /> : <span className="font-display text-xl font-bold">♪</span>}
          </span>
          <span className={brandTextClass}>Band Room</span>
        </Link>

        <nav
          className={[
            'hidden items-center md:flex',
            isHero ? 'mx-auto gap-6' : 'gap-8 lg:gap-10',
          ].join(' ')}
        >
          {navItemsForPage.map((item) => {
            const isActive =
              (item.href === '/customer/support' && pathname === '/customer/support') ||
              (item.href === '/rooms' && pathname === '/rooms')

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={(event) => handleNavLinkClick(event, item.href)}
                className={[
                  navLinkClass,
                  !isHero && isActive ? 'font-semibold text-[#FF7518]' : '',
                  isHero && isActive ? 'text-brand-orange' : '',
                ].join(' ')}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated && user ? (
            <AccountMenu />
          ) : (
            <>
              <Link
                href="/login"
                className={
                  isHero
                    ? 'px-4 py-2 font-display text-sm font-semibold text-white/80 transition-colors hover:text-white'
                    : 'rounded-2xl px-2 py-2 font-display text-sm font-semibold text-[#5C5348] transition hover:text-[#1A1C1E]'
                }
              >
                Đăng nhập
              </Link>
              <button
                type="button"
                onClick={handleBookClick}
                disabled={isAuthLoading}
                className={
                  isHero
                    ? 'rounded-lg bg-brand-orange px-5 py-2.5 font-display text-sm font-semibold text-white shadow-[0_10px_28px_rgba(255,117,24,0.28)] transition-all hover:bg-brand-orangeHover active:scale-[0.98] disabled:cursor-wait disabled:opacity-70'
                    : 'rounded-2xl bg-[#FF7518] px-5 py-3 font-display text-sm font-semibold text-white transition hover:bg-[#E6640F] active:scale-[0.98] disabled:cursor-wait disabled:opacity-70'
                }
              >
                Đặt phòng
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className={[
            'ml-auto rounded-lg border px-3 py-2 font-display text-sm font-semibold md:hidden',
            isHero
              ? 'border-white/20 bg-white/10 text-white backdrop-blur-sm'
              : 'border-outline bg-white/70 text-on-surface',
          ].join(' ')}
          aria-expanded={menuOpen}
          aria-controls="bandroom-mobile-menu"
        >
          {menuOpen ? 'Đóng' : 'Menu'}
        </button>
      </div>

      {menuOpen && (
        <div
          id="bandroom-mobile-menu"
          className={[
            'border-t px-5 pb-5 md:hidden',
            isHero ? 'border-white/10 bg-secondary/95 backdrop-blur-xl' : 'border-[#E8E4DC] bg-[#F5F2EC]',
          ].join(' ')}
        >
          <nav className="grid py-2">
            {navItemsForPage.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={(event) => {
                  setMenuOpen(false)
                  handleNavLinkClick(event, item.href)
                }}
                className={[
                  'border-b py-3 font-display text-sm font-semibold',
                  isHero
                    ? 'border-white/10 text-white/85'
                    : 'border-[#E8E4DC] text-[#5C5348]',
                ].join(' ')}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {isAuthenticated && user ? (
            <div className="mt-4 flex justify-end">
              <AccountMenu align="full" onNavigate={() => setMenuOpen(false)} />
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg border bg-white px-4 py-3 text-center font-display text-sm font-semibold text-on-surface"
              >
                Đăng nhập
              </Link>
              <button
                type="button"
                onClick={handleBookClick}
                disabled={isAuthLoading}
                className="rounded-lg bg-brand-orange px-4 py-3 font-display text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70"
              >
                Đặt phòng
              </button>
            </div>
          )}
        </div>
      )}
      </header>
      {!isHero && <div className="h-20 shrink-0" aria-hidden />}
    </>
  )
}
