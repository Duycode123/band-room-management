'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  formatCurrency,
  getPaymentMethodLabel,
  getReturnStatusContent,
  normalizePaymentStatus,
} from '@/lib/checkout-data'
import { getPaymentTransactionDetail } from '@/lib/payment-service'

type PaymentTransactionState = {
  bookingCode: string
  method: string
  status: string
  amount: number
}

export default function PaymentReturnStatus() {
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('paymentId')
  const fallbackBookingId = searchParams.get('bookingId')
  const [transaction, setTransaction] = useState<PaymentTransactionState | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(paymentId))
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    if (!paymentId) {
      setIsLoading(false)
      return
    }

    void getPaymentTransactionDetail(paymentId)
      .then((detail) => {
        if (!active) return

        setTransaction({
          bookingCode: detail.bookingCode,
          method: detail.method,
          status: detail.status,
          amount: detail.amount,
        })
        setError('')
      })
      .catch((paymentError) => {
        if (!active) return

        setError(paymentError instanceof Error ? paymentError.message : 'Khong the kiem tra giao dich.')
      })
      .finally(() => {
        if (!active) return

        setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [paymentId])

  const bookingId = transaction?.bookingCode || fallbackBookingId
  const status = normalizePaymentStatus(transaction?.status || searchParams.get('status'))
  const content = getReturnStatusContent(transaction?.status || searchParams.get('status'))
  const method = transaction?.method || searchParams.get('method')
  const amount = transaction?.amount ?? Number(searchParams.get('amount') || 0)
  const retryHref = useMemo(() => {
    const backendBookingId = searchParams.get('backendBookingId')

    if (backendBookingId) {
      return `/customer/checkout?bookingId=${encodeURIComponent(bookingId || '')}&backendBookingId=${encodeURIComponent(backendBookingId)}`
    }

    return bookingId ? `/customer/checkout?bookingId=${encodeURIComponent(bookingId)}` : '/customer/booking'
  }, [bookingId, searchParams])
  const primaryHref = content.primaryLabel === 'Thu lai thanh toan' ? retryHref : content.primaryHref
  const missingBooking = !bookingId

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F5F2EC] px-6 py-10 text-[#1A1C1E]">
        <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-[720px] items-center">
          <div className="w-full rounded-[24px] border border-[#E8E4DC] bg-white p-6 text-center shadow-[0_12px_48px_rgba(26,28,30,0.12)] md:p-8">
            <p className="font-display text-lg font-semibold">Dang kiem tra trang thai thanh toan tu backend...</p>
          </div>
        </section>
      </main>
    )
  }

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
