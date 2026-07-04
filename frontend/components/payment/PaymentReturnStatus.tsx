'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import {
  formatCurrency,
  getPaymentMethodLabel,
  getReturnStatusContent,
  normalizePaymentStatus,
} from '@/lib/checkout-data'
import { clearPendingBooking } from '@/lib/pending-booking'

export default function PaymentReturnStatus() {
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('paymentId')
  const bookingId = searchParams.get('bookingId')
  const backendBookingId = searchParams.get('backendBookingId')
  const status = normalizePaymentStatus(searchParams.get('status'))
  const method = searchParams.get('method')
  const amount = Number(searchParams.get('amount') || 0)
  const paymentOption = searchParams.get('paymentOption')
  const content = getReturnStatusContent(searchParams.get('status'))
  const retryHref = buildRetryHref({
    bookingId,
    backendBookingId,
    method,
    paymentOption,
  })
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
          <div
            className={[
              'mx-auto flex h-20 w-20 items-center justify-center rounded-full font-display text-4xl font-bold',
              getToneClasses(content.tone),
            ].join(' ')}
          >
            {content.icon}
          </div>

          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">
            {missingBooking ? 'Không tìm thấy mã đặt phòng' : content.title}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[#5C5348]">
            {missingBooking
              ? 'Vui lòng kiểm tra lại đường dẫn thanh toán hoặc quay về trang chủ.'
              : content.message}
          </p>

          <div className="mt-6 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-4 text-left">
            <TransactionRow label="Mã đặt phòng" value={bookingId || 'Chưa có'} />
            <TransactionRow
              label="Trạng thái"
              value={status === 'unknown' ? 'Không xác định' : content.title}
            />
            <TransactionRow label="Số tiền" value={amount > 0 ? formatCurrency(amount) : 'Chưa xác định'} />
            <TransactionRow label="Phương thức" value={getPaymentMethodLabel(method)} />
            <TransactionRow
              label="Lựa chọn"
              value={paymentOption === 'full' ? 'Thanh toán toàn bộ' : 'Đặt cọc 50.000 VND'}
            />
            {paymentId && <TransactionRow label="Mã giao dịch" value={paymentId} />}
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
              Quay về trang chủ
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

function buildRetryHref({
  bookingId,
  backendBookingId,
  method,
  paymentOption,
}: {
  bookingId: string | null
  backendBookingId: string | null
  method: string | null
  paymentOption: string | null
}) {
  if (!bookingId) {
    return '/rooms'
  }

  const params = new URLSearchParams({ bookingId })

  if (backendBookingId) {
    params.set('backendBookingId', backendBookingId)
  }

  if (method) {
    params.set('method', method)
  }

  if (paymentOption) {
    params.set('paymentOption', paymentOption)
  }

  return `/customer/checkout?${params.toString()}`
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
