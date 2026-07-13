'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getDisplayName, getInitials, getRoleLabel } from '@/lib/staff-profile'

export function StaffSidebar() {
  const pathname = usePathname()
  const { user, logout, isLoggingOut } = useAuth()
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)
  const displayName = getDisplayName(user)
  const roleLabel = getRoleLabel(user?.role)
  const avatarInitial = getInitials(displayName || user?.email)
  const menuItems = [
    { label: 'Lịch làm việc', href: '/staff/dashboard', icon: <IconCalendar /> },
    { label: 'Phòng & Thiết bị', href: '/staff/rooms', icon: <IconRooms /> },
    { label: 'Booking', href: '/staff/bookings', icon: <IconBookings /> },
    { label: 'Cài đặt', href: '/staff/settings', icon: <IconSettings /> },
  ]

  const handleConfirmLogout = async () => {
    setIsLogoutConfirmOpen(false)
    await logout('/login')
  }

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-white/10 bg-gradient-to-b from-brand-greenDark via-brand-greenDark to-brand-greenLight text-inverse-on-surface lg:flex">
        <div className="shrink-0 border-b border-white/10 px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orange text-white shadow-lg shadow-brand-orange/30">
              <IconLogo />
            </div>
            <div>
              <p className="font-display text-lg font-bold leading-none text-white">BandHub Studio</p>
              <p className="mt-1.5 font-display text-[10px] font-semibold uppercase tracking-[0.25em] text-brand-orange">Staff Panel</p>
            </div>
          </div>
        </div>

        <div className="shrink-0 px-4 pt-5">
          <div className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-primary-container font-display font-bold text-on-primary-container ring-2 ring-brand-orange/40">
                  {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : avatarInitial}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-brand-greenDark bg-[#4ADE80]" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold text-white">{displayName}</p>
                <p className="truncate text-xs text-on-secondary-container">{roleLabel}</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="mt-5 min-h-0 flex-1 space-y-1 overflow-y-auto px-3">
          <p className="px-3 pb-2 font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-inverse-on-surface/40">
            Vận hành
          </p>
          {menuItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.label}
                href={item.href}
                className={[
                  'relative flex h-11 items-center gap-3 rounded-xl px-3 font-display text-sm font-medium transition-all',
                  active
                    ? 'bg-white/15 text-white shadow-inner shadow-black/10 before:absolute before:left-0 before:top-2 before:h-7 before:w-[3px] before:rounded-full before:bg-brand-orange'
                    : 'text-inverse-on-surface/70 hover:bg-white/10 hover:text-white',
                ].join(' ')}
              >
                <span className={['flex h-5 w-5 items-center justify-center', active ? 'text-brand-orange' : ''].join(' ')}>
                  {item.icon}
                </span>
                {item.label}
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-orange shadow-[0_0_8px_rgba(255,117,24,0.8)]" aria-hidden="true" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto shrink-0 border-t border-white/10 bg-brand-greenDark/40 p-4 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setIsLogoutConfirmOpen(true)}
            className="flex h-11 w-full items-center gap-3 rounded-xl px-3 font-display text-sm font-medium text-inverse-on-surface/75 transition-colors hover:bg-white/10 hover:text-white"
          >
            <IconLogout />
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="fixed inset-x-0 top-0 z-30 border-b border-outline-variant bg-white/90 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-2 overflow-x-auto px-4 py-3">
          {menuItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.label}
                href={item.href}
                className={[
                  'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-display text-xs font-medium transition-colors',
                  active ? 'bg-brand-orange text-white' : 'bg-surface-container text-on-surface-variant',
                ].join(' ')}
              >
                <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setIsLogoutConfirmOpen(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-surface-container px-3 py-1.5 font-display text-xs font-medium text-on-surface-variant transition-colors"
          >
            <span className="[&>svg]:h-3.5 [&>svg]:w-3.5"><IconLogout /></span>
            Đăng xuất
          </button>
        </div>
      </div>

      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1A1C1E]/45 p-4" onClick={() => setIsLogoutConfirmOpen(false)}>
          <section className="w-full max-w-md rounded-xl border border-outline-variant bg-white p-6 shadow-[var(--band-shadow-elevated)]" onClick={(event) => event.stopPropagation()}>
            <h2 className="font-display text-xl font-bold text-on-surface">Đăng xuất tài khoản?</h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng trang nhân viên.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setIsLogoutConfirmOpen(false)} className="btn-secondary" disabled={isLoggingOut}>
                Hủy
              </button>
              <button type="button" onClick={handleConfirmLogout} className="btn-warm" disabled={isLoggingOut}>
                {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}

export function StaffPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen overflow-hidden bg-brand-bgGray text-on-surface">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-orange/5 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-secondary-container/20 blur-3xl" />
      </div>
      <div className="relative flex h-screen">
        <StaffSidebar />
        <main className="min-w-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-[72px] sm:px-6 lg:px-8 lg:pt-6">
          <div className="mx-auto max-w-[1480px] space-y-6">{children}</div>
        </main>
      </div>
    </div>
  )
}

export function StatusBadge({ label, className, dotClassName }: { label: string; className: string; dotClassName?: string }) {
  return (
    <span className={['inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-display text-xs font-bold', className].join(' ')}>
      {dotClassName && <span className={['h-1.5 w-1.5 rounded-full', dotClassName].join(' ')} />}
      {label}
    </span>
  )
}

export function StatCard({ label, value, helper, icon, className }: { label: string; value: string | number; helper: string; icon: ReactNode; className: string }) {
  return (
    <article className="group rounded-3xl border border-outline-variant bg-white p-5 shadow-[var(--band-shadow-card)] transition-shadow hover:shadow-[var(--band-shadow-elevated)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">{label}</p>
          <p className="mt-3 font-display text-4xl font-bold leading-none tracking-tight text-on-surface">{value}</p>
        </div>
        <span className={['flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-105', className].join(' ')}>{icon}</span>
      </div>
      <p className="mt-4 text-sm leading-5 text-on-surface-variant">{helper}</p>
    </article>
  )
}

export function EmptyState({ title, description, actionLabel, onAction }: { title: string; description: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-outline bg-white px-5 py-14 text-center shadow-[var(--band-shadow-card)]">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top,#FFE8D6,transparent_70%)] text-brand-orange ring-1 ring-primary-container">
        <IconEmpty />
      </div>
      <h2 className="mt-5 font-display text-xl font-bold tracking-tight text-on-surface">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">{description}</p>
      {actionLabel && onAction && <button type="button" onClick={onAction} className="btn-warm mx-auto mt-6">{actionLabel}</button>}
    </div>
  )
}

export function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-5 left-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-secondary-container bg-secondary px-4 py-3 text-sm font-semibold text-on-secondary shadow-[var(--band-shadow-elevated)]">
      {message}
    </div>
  )
}

export function IconLogo() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M4 9v6M8 5v14M12 3v18M16 6v12M20 10v4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
}

function IconCalendar() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" stroke="currentColor" strokeWidth="1.8" /><path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M7.5 13.5h3M7.5 16.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
}

function IconRooms() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M3.5 20.5v-11L12 4l8.5 5.5v11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M3.5 20.5h17M9.5 20.5v-5.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function IconBookings() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M5 4.5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" /><path d="M8 9h8M8 12.5h8M8 16h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
}

function IconSettings() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /><path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
}

function IconLogout() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M10 6H6.5A2.5 2.5 0 0 0 4 8.5v7A2.5 2.5 0 0 0 6.5 18H10M14 8l4 4-4 4M18 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function IconEmpty() {
  return <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true"><path d="M5 7.5A2.5 2.5 0 0 1 7.5 5h9A2.5 2.5 0 0 1 19 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 16.5v-9Z" stroke="currentColor" strokeWidth="2" /><path d="M9 10h6M9 14h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}
