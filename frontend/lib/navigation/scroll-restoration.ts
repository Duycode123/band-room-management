const STORAGE_PREFIX = 'bandroom:scroll:'

/** Paths that should restore scroll position when revisited (product-style back navigation). */
const RESTORE_SCROLL_PATHS = new Set(['/rooms', '/customer/bookings', '/customer/support'])

export function saveScrollPosition(pathname: string) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(`${STORAGE_PREFIX}${pathname}`, String(window.scrollY))
}

export function restoreScrollPosition(pathname: string) {
  if (typeof window === 'undefined') return false
  if (!RESTORE_SCROLL_PATHS.has(pathname)) return false

  const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${pathname}`)
  if (!raw) return false

  const top = Number(raw)
  if (!Number.isFinite(top) || top < 0) return false

  window.scrollTo({ top, left: 0, behavior: 'auto' })
  return true
}

export function scrollToTopInstant() {
  if (typeof window === 'undefined') return
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
}
