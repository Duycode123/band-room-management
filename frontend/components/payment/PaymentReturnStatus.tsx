'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  formatCurrency,
  getPaymentMethodLabel,
  getReturnStatusContent,
  normalizePaymentStatus,
} from '@/lib/checkout-data'
import { clearPendingBooking } from '@/lib/pending-booking'

export default function PaymentReturnStatus() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('bookingId')
  const status = normalizePaymentStatus(searchParams.get('status'))
  const method = searchParams.get('method')
  const amount = Number(searchParams.get('amount') || 0)
  const content = getReturnStatusContent(searchParams.get('status'))
  const retryHref = bookingId ? `/checkout?bookingId=${encodeURIComponent(bookingId)}` : '/#rooms'
  const primaryHref = content.primaryLabel === 'Thử lại thanh toán' ? retryHref : content.primaryHref
  const missingBooking = !bookingId

  useEffect(() => {
    if (status === 'success') {
      clearPendingBooking()
    }
  }, [status])

  return (
    <main className="min-h-screen bg-[#F5F2EC] px-6 py-10 text-[#1A1C1E]">
      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-[720px] items-center">
        <div className="w-full rounded-[24px] border border-[#E8E4DC] bg-white p-6 text-center shadow-[0_12px_48px_rgba(26,28,30,0.12)] md:p-8">
          <div className={['mx-auto flex h-20 w-20 items-center justify-center rounded-full font-display text-4xl font-bold', getToneClasses(content.tone)].join(' ')}>
            {content.icon}
          </div>

          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">
            {missingBooking ? 'Khong tim thay ma dat phong' : content.title}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[#5C5348]">
            {missingBooking ? 'Vui long kiem tra lai duong dan thanh toan hoac quay ve trang chu.' : content.message}
          </p>

          {error && (
            <p className="mt-4 rounded-2xl border border-[#C62828]/20 bg-[#FFEBEE] px-4 py-3 text-sm text-[#C62828]">
              {error}
            </p>
          )}

          <div className="mt-6 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-4 text-left">
            <TransactionRow label="Ma dat phong" value={bookingId || 'Chua co'} />
            <TransactionRow label="Trang thai" value={status === 'unknown' ? 'Khong xac dinh' : content.title} />
            <TransactionRow label="So tien" value={amount > 0 ? formatCurrency(amount) : 'Chua xac dinh'} />
            <TransactionRow label="Phuong thuc" value={getPaymentMethodLabel(method)} />
            {paymentId && <TransactionRow label="Ma giao dich" value={paymentId} />}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {!missingBooking && (
              <Link
                href={primaryHref}
                className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-[#FF7518] font-display font-semibold text-white transition hover:bg-[#E6640F]"
              >
                {content.primaryLabel}
              </Link>
            )}
            <Link
              href="/"
              className="flex h-12 flex-1 items-center justify-center rounded-2xl border border-[#C9C2B6] bg-white font-display font-semibold text-[#1A1C1E] transition hover:bg-[#FAF8F4]"
            >
              Quay ve trang chu
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

function TransactionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#E8E4DC] py-3 last:border-b-0">
      <span className="text-sm text-[#5C5348]">{label}</span>
      <span className="text-right font-display text-sm font-bold text-[#1A1C1E]">{value}</span>
    </div>
  )
}

function getToneClasses(tone: string) {
  if (tone === 'success') return 'bg-[#E8F5EC] text-[#0A4D27]'
  if (tone === 'failed') return 'bg-[#FFEBEE] text-[#C62828]'
  if (tone === 'pending') return 'bg-[#FEF3C7] text-[#B45309]'
  if (tone === 'cancelled') return 'bg-[#FFE8D6] text-[#6B3200]'

  return 'bg-[#F0EDE6] text-[#5C5348]'
}
