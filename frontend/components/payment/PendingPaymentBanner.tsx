'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/checkout-data'
import {
  getPendingPaymentExpiryMs,
  readPendingPayment,
  type PendingPaymentEntry,
} from '@/lib/pending-payment-session'

export default function PendingPaymentBanner() {
  const pathname = usePathname()
  const [entry, setEntry] = useState<PendingPaymentEntry | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const refresh = () => setEntry(readPendingPayment())

    refresh()
    const intervalId = window.setInterval(() => {
      refresh()
      setNow(Date.now())
    }, 1000)
    window.addEventListener('storage', refresh)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('storage', refresh)
    }
  }, [pathname])

  // Already on the checkout screen: the QR itself is visible there.
  if (!entry || pathname?.startsWith('/customer/checkout')) {
    return null
  }

  const secondsLeft = Math.max(0, Math.ceil((getPendingPaymentExpiryMs(entry) - now) / 1000))
  if (secondsLeft <= 0) {
    return null
  }

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 sm:left-auto sm:right-6 sm:w-full sm:max-w-sm">
      <div className="rounded-2xl border-2 border-[#FF7518]/50 bg-white p-4 shadow-[0_12px_32px_rgba(26,28,30,0.18)]">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFE8D6] text-[#FF7518]">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-[#1A1C1E]">
              Bạn có giao dịch đang chờ thanh toán
            </p>
            <p className="mt-0.5 text-xs leading-5 text-[#5C5348]">
              {entry.roomName ? `${entry.roomName} — ` : ''}
              {formatCurrency(entry.session.amount)} · Mã hết hạn sau{' '}
              <span className="font-bold text-[#FF7518]">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </span>
            </p>
          </div>
        </div>

        <Link
          href={entry.checkoutUrl}
          className="mt-3 flex h-10 w-full items-center justify-center rounded-xl bg-[#FF7518] font-display text-sm font-semibold text-white transition hover:bg-[#E6640F] active:scale-[0.98]"
        >
          Tiếp tục thanh toán QR
        </Link>
      </div>
    </div>
  )
}
