import type { ReactNode } from 'react'

type IconProps = { className?: string }

export function IconHome({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  )
}

export function IconBooking({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </svg>
  )
}

export function IconCalendar({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
    </svg>
  )
}

export function IconGift({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3" y="8" width="18" height="13" rx="1" />
      <path d="M12 8v13M3 12h18M7.5 8C6 8 5 6.8 5 5.5S6 3 7.5 3 10 4.2 10 5.5 9 8 7.5 8zm9 0c-1.5 0-2.5-1.2-2.5-2.5S15 3 16.5 3 19 4.2 19 5.5 17 8 16.5 8z" />
    </svg>
  )
}

export function IconChat({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.6 8.6 0 0 1-7.7 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.4A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5z" />
      <path d="M8.5 10.5h8M8.5 14h5" />
    </svg>
  )
}

export function IconLogout({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}

export function IconMusic({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  )
}

export function IconChevronRight({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

export function IconSparkle({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.4 4.2L18 8l-4.6 1.8L12 14l-1.4-4.2L6 8l4.6-1.8L12 2zm7 9 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3zm-14 2 1 2.5 2.5 1-2.5 1-1 2.5-1-2.5L2.5 16.5 5 15.5l1-2.5z" />
    </svg>
  )
}

export function CustomerBrandMark({ className }: { className?: string }) {
  return (
    <div className={['flex items-center gap-2.5', className].filter(Boolean).join(' ')}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-orange shadow-lg shadow-brand-orange/35">
        <IconMusic className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="font-display text-sm font-bold leading-tight text-white">BandSpace</p>
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/70">Khach hang</p>
      </div>
    </div>
  )
}

export type CustomerNavItem = {
  href: string
  label: string
  icon: ReactNode
  disabled?: boolean
}
