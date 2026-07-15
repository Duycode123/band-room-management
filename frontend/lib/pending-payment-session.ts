import type { CreatePaymentSessionResponse } from '@/lib/payment-service'

const STORAGE_KEY = 'bandroom-pending-payment'

/** Fallback lifetime when the backend didn't return expiresAt. */
const DEFAULT_LIFETIME_MS = 10 * 60 * 1000

export type PendingPaymentEntry = {
  bookingId: string
  roomName?: string
  /** Checkout URL (pathname + query) to return to the QR screen. */
  checkoutUrl: string
  session: CreatePaymentSessionResponse
  storedAt: number
}

// Backend serializes LocalDateTime in UTC without a timezone suffix
// (e.g. "2026-07-13T06:57:00"), which JS would parse as local time.
export function parseBackendUtcDate(value: string) {
  const hasTimezone = /(Z|[+-]\d{2}:?\d{2})$/.test(value)
  return new Date(hasTimezone ? value : `${value}Z`)
}

export function getPendingPaymentExpiryMs(entry: PendingPaymentEntry): number {
  if (entry.session.expiresAt) {
    const expiry = parseBackendUtcDate(entry.session.expiresAt).getTime()
    if (!Number.isNaN(expiry)) {
      return expiry
    }
  }

  return entry.storedAt + DEFAULT_LIFETIME_MS
}

export function storePendingPayment(entry: Omit<PendingPaymentEntry, 'storedAt'>) {
  if (typeof window === 'undefined') return

  try {
    const payload: PendingPaymentEntry = { ...entry, storedAt: Date.now() }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // storage full/blocked: the reminder simply won't survive navigation
  }
}

export function readPendingPayment(): PendingPaymentEntry | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const entry = JSON.parse(raw) as PendingPaymentEntry
    if (!entry?.bookingId || !entry.checkoutUrl || entry.session?.status !== 'pending') {
      clearPendingPayment()
      return null
    }

    if (Date.now() >= getPendingPaymentExpiryMs(entry)) {
      clearPendingPayment()
      return null
    }

    return entry
  } catch {
    return null
  }
}

export function clearPendingPayment() {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
