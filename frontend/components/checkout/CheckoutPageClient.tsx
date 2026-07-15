'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import CheckoutBookingInfo from '@/components/checkout/CheckoutBookingInfo'
import CheckoutCouponInput from '@/components/checkout/CheckoutCouponInput'
import CheckoutPaymentMethods from '@/components/checkout/CheckoutPaymentMethods'
import CheckoutSummary from '@/components/checkout/CheckoutSummary'
import {
  calculateCheckoutSummary,
  formatCurrency,
  getCheckoutBookingFromParams,
  type CheckoutBooking,
} from '@/lib/checkout-data'
import {
  clearCheckoutSession,
  getCheckoutSession,
  saveCheckoutSession,
} from '@/lib/checkout-session'
import type { AppliedDiscount } from '@/lib/discount-service'
import {
  clearPendingBooking,
  getPendingBooking,
  pendingBookingToSearchParams,
  savePendingBooking,
} from '@/lib/pending-booking'
import {
  getQuickBookingRestoreHref,
  readQuickBookingDraft,
} from '@/components/booking/quick-booking-draft'
import {
  createPaymentSession,
  getPaymentTransactionDetail,
  type CreatePaymentSessionResponse,
  type PaymentMethod,
  type PaymentOption,
} from '@/lib/payment-service'
import {
  clearPendingPayment,
  parseBackendUtcDate,
  readPendingPayment,
  storePendingPayment,
} from '@/lib/pending-payment-session'

export default function CheckoutPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const confirmationHref = `/rooms/confirmation?${searchParams.toString()}`
  const [booking, setBooking] = useState<CheckoutBooking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer')
  const paymentOption: PaymentOption = 'full'
  const [isPaying, setIsPaying] = useState(false)
  const [paymentSession, setPaymentSession] = useState<CreatePaymentSessionResponse | null>(null)
  const [isCheckingPayment, setIsCheckingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [now, setNow] = useState(() => Date.now())
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null)
  const [missingCheckoutReturnHref, setMissingCheckoutReturnHref] = useState('/')
  const qrSectionRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (paymentSession?.status === 'pending') {
      qrSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [paymentSession?.paymentId, paymentSession?.status])

  useEffect(() => {
    const draft = readQuickBookingDraft()

    setMissingCheckoutReturnHref(draft ? getQuickBookingRestoreHref(draft.sourceRoute) : '/')
  }, [])

  useEffect(() => {
    let mounted = true

    async function loadBooking() {
      setIsLoading(true)
      setError('')

      try {
        const checkoutParams = new URLSearchParams(searchParams.toString())

        if (!checkoutParams.get('bookingId')) {
          const pendingBooking = getPendingBooking()
          if (pendingBooking) {
            const pendingParams = pendingBookingToSearchParams(pendingBooking)
            pendingParams.forEach((value, key) => {
              checkoutParams.set(key, value)
            })
          }
        }

        const loadedBooking = await getCheckoutBookingFromParams(checkoutParams)
        if (!mounted) return

        if (!checkoutParams.get('bookingId')) {
          setError('Thiếu mã đặt phòng. Vui lòng quay lại bước xác nhận đặt phòng.')
          setBooking(null)
          return
        }

        if (!loadedBooking) {
          setError('Không tìm thấy thông tin checkout từ hệ thống.')
          setBooking(null)
          return
        }

        setBooking(loadedBooking)

        const pendingPayment = readPendingPayment()
        if (pendingPayment?.bookingId === loadedBooking.bookingId) {
          setPaymentSession(pendingPayment.session)
        }

        const savedSession = getCheckoutSession(loadedBooking.bookingId)
        if (savedSession?.appliedCoupon) {
          setAppliedDiscount(savedSession.appliedCoupon)
        } else {
          const discountFromParams = readDiscountFromParams(checkoutParams)
          const pendingBooking = getPendingBooking()
          const discountFromPending =
            pendingBooking?.bookingId === loadedBooking.bookingId &&
            pendingBooking.discountCode &&
            pendingBooking.discountAmount !== undefined
              ? {
                  code: pendingBooking.discountCode,
                  discountAmount: pendingBooking.discountAmount,
                }
              : null

          const restoredDiscount = discountFromParams ?? discountFromPending
          setAppliedDiscount(restoredDiscount)
          if (restoredDiscount) {
            saveCheckoutSession({
              bookingId: loadedBooking.bookingId,
              appliedCoupon: restoredDiscount,
            })
          }
        }

        setPaymentMethod('bank_transfer')
      } catch {
        if (mounted) {
          setError('Không thể tải thông tin thanh toán. Vui lòng thử lại.')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void loadBooking()

    return () => {
      mounted = false
    }
  }, [searchParams])

  useEffect(() => {
    if (paymentMethod !== 'bank_transfer') {
      setPaymentMethod('bank_transfer')
    }
  }, [paymentMethod])

  useEffect(() => {
    if (!paymentSession || paymentSession.status !== 'pending') {
      return
    }

    const activePaymentSession = paymentSession
    let cancelled = false

    async function checkPayment() {
      setIsCheckingPayment(true)
      try {
        const transaction = await getPaymentTransactionDetail(activePaymentSession.paymentId)
        if (cancelled) return

        if (transaction.status === 'success') {
          clearPendingBooking()
          clearCheckoutSession()
          clearPendingPayment()
          const params = new URLSearchParams({
            paymentId: transaction.paymentId,
            bookingId: transaction.bookingCode,
            backendBookingId: String(transaction.bookingId),
            method: transaction.method,
            paymentOption: transaction.paymentOption,
            amount: String(transaction.amount),
            status: 'success',
          })
          router.push(`/payment/return?${params.toString()}`)
          return
        }

        if (transaction.status === 'failed' || transaction.status === 'cancelled') {
          clearPendingPayment()
          setPaymentSession((current) =>
            current?.paymentId === transaction.paymentId
              ? { ...current, status: transaction.status }
              : current,
          )
          setPaymentError(
            transaction.status === 'cancelled'
              ? 'Phiên thanh toán đã hết hạn hoặc đã bị hủy. Vui lòng tạo lại giao dịch.'
              : 'Giao dịch thanh toán thất bại. Vui lòng tạo lại giao dịch.',
          )
        }
      } catch (pollError) {
        if (!cancelled) {
          setPaymentError(
            pollError instanceof Error
              ? pollError.message
              : 'Không thể kiểm tra trạng thái thanh toán. Hệ thống sẽ thử lại sau.',
          )
        }
      } finally {
        if (!cancelled) {
          setIsCheckingPayment(false)
        }
      }
    }

    void checkPayment()
    const intervalId = window.setInterval(() => {
      void checkPayment()
    }, 10000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [paymentSession, router])

  useEffect(() => {
    if (!paymentSession?.expiresAt || paymentSession.status !== 'pending') {
      return
    }

    setNow(Date.now())
    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [paymentSession?.expiresAt, paymentSession?.status])

  const summary = useMemo(
    () => (booking ? calculateCheckoutSummary(booking, appliedDiscount) : null),
    [appliedDiscount, booking],
  )
  const amountToPayNow = useMemo(() => summary?.total ?? 0, [summary])
  const secondsUntilExpiry = useMemo(
    () => getSecondsUntilExpiry(paymentSession?.expiresAt, now),
    [now, paymentSession?.expiresAt],
  )

  const handleApplyCoupon = (discount: AppliedDiscount) => {
    if (!booking) return

    setAppliedDiscount(discount)
    saveCheckoutSession({
      bookingId: booking.bookingId,
      appliedCoupon: discount,
    })

    const pendingBooking = getPendingBooking()
    if (pendingBooking?.bookingId === booking.bookingId) {
      savePendingBooking({
        ...pendingBooking,
        discountCode: discount.code,
        discountAmount: discount.discountAmount,
      })
    }
  }

  const handleRemoveCoupon = () => {
    if (!booking) return

    setAppliedDiscount(null)
    clearCheckoutSession()

    const pendingBooking = getPendingBooking()
    if (pendingBooking?.bookingId === booking.bookingId) {
      savePendingBooking({
        ...pendingBooking,
        discountCode: undefined,
        discountAmount: undefined,
      })
    }
  }

  const handlePay = async () => {
    if (!booking || !summary) {
      setPaymentError('Không tìm thấy thông tin đặt phòng để thanh toán.')
      return
    }

    if (!booking.backendBookingId) {
      setPaymentError('Không tìm thấy mã booking hợp lệ để tạo giao dịch thanh toán.')
      return
    }

    const otherPendingPayment = readPendingPayment()
    if (otherPendingPayment && otherPendingPayment.bookingId !== booking.bookingId) {
      setPaymentError(
        `Bạn đang có giao dịch chờ thanh toán cho đơn ${otherPendingPayment.bookingId}` +
          `${otherPendingPayment.roomName ? ` (${otherPendingPayment.roomName})` : ''}. ` +
          'Vui lòng hoàn tất giao dịch đó trước, hoặc chờ mã QR hết hạn rồi thử lại.',
      )
      return
    }

    setIsPaying(true)
    setPaymentError('')
    setPaymentSession(null)

    try {
      const session = await createPaymentSession({
        bookingId: booking.backendBookingId,
        method: paymentMethod,
        paymentOption,
      })

      if (session.status === 'success') {
        clearPendingBooking()
        clearPendingPayment()
        const params = new URLSearchParams({
          paymentId: session.paymentId,
          bookingId: session.bookingCode,
          backendBookingId: String(session.bookingId),
          method: session.method,
          paymentOption: session.paymentOption,
          amount: String(session.amount),
          status: 'success',
        })
        router.push(`/payment/return?${params.toString()}`)
        return
      }

      storePendingPayment({
        bookingId: booking.bookingId,
        roomName: booking.roomName,
        checkoutUrl: `${window.location.pathname}${window.location.search}`,
        session,
      })
      setPaymentSession(session)
    } catch (paymentSessionError) {
      setPaymentError(
        paymentSessionError instanceof Error
          ? paymentSessionError.message
          : 'Không thể tạo giao dịch. Vui lòng thử lại.',
      )
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F2EC] text-[#1A1C1E]">

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2 font-display text-sm text-[#5C5348]">
              <Link href="/" className="hover:text-[#1A1C1E]">
                Trang chủ
              </Link>
              <span>/</span>
              <Link href={confirmationHref} className="hover:text-[#1A1C1E]">
                Xác nhận đặt phòng
              </Link>
              <span>/</span>
              <span className="text-[#1A1C1E]">Thanh toán</span>
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight">Thanh toán đặt phòng</h1>
            <p className="mt-2 text-[#5C5348]">
              Kiểm tra thông tin, tạo mã QR và chuyển khoản để hoàn tất đặt phòng.
            </p>
          </div>

          <CheckoutSteps />
        </div>

        {isLoading && <CheckoutSkeleton />}

        {!isLoading && error && (
          <div className="rounded-[24px] border border-[#C62828]/20 bg-white p-6 shadow-[0_4px_24px_rgba(26,28,30,0.06)]">
            <h2 className="font-display text-xl font-bold text-[#C62828]">Không thể mở checkout</h2>
            <p className="mt-2 text-[#5C5348]">{error}</p>
            <Link
              href="/rooms"
              className="mt-5 inline-flex h-12 items-center justify-center rounded-2xl bg-[#FF7518] px-6 font-display font-semibold text-white transition hover:bg-[#E6640F]"
            >
              Quay lại chọn phòng
            </Link>
          </div>
        )}

        {!isLoading && booking && summary && (
          <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
            <div className="min-w-0 lg:col-span-2">
              <CheckoutBookingInfo booking={booking} />
            </div>

            <aside
              ref={qrSectionRef}
              className="w-full max-w-md scroll-mt-24 rounded-[24px] border border-[#E8E4DC] bg-white p-4 shadow-[0_4px_18px_rgba(26,28,30,0.06)] sm:p-5 lg:sticky lg:top-24 lg:col-span-1 lg:justify-self-end"
            >
              {paymentSession ? (
                <>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-display text-lg font-bold">Quét QR để thanh toán</h2>
                    <span
                      className={[
                        'shrink-0 rounded-full px-3 py-1 font-display text-xs font-bold',
                        paymentSession.status === 'pending'
                          ? 'bg-[#FFE8D6] text-[#6B3200]'
                          : 'bg-[#FFEBEE] text-[#C62828]',
                      ].join(' ')}
                    >
                      {paymentSession.status === 'pending' ? 'Đang chờ chuyển khoản' : 'Đã hủy / thất bại'}
                    </span>
                  </div>

                  <div className="rounded-2xl border-2 border-[#FF7518]/30 bg-[#FFF7F0] p-4">
                    <div className="overflow-hidden rounded-2xl border border-[#E8E4DC] bg-white p-3">
                      <img
                        src={paymentSession.paymentUrl}
                        alt={`Mã QR thanh toán ${paymentSession.paymentId}`}
                        className="mx-auto aspect-square w-full max-w-[300px] object-contain"
                      />
                    </div>

                    {secondsUntilExpiry !== null && paymentSession.status === 'pending' && (
                      <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2">
                        <svg
                          className="h-4 w-4 text-[#FF7518]"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-display text-sm font-bold text-[#1A1C1E]">
                          {secondsUntilExpiry > 0
                            ? `Mã hết hạn sau ${formatCountdown(secondsUntilExpiry)}`
                            : 'Mã QR đã hết hạn'}
                        </span>
                      </div>
                    )}

                    <div className="mt-3 grid gap-2 text-sm">
                      <PaymentSessionRow label="Nội dung chuyển khoản" value={paymentSession.paymentId} />
                      <PaymentSessionRow label="Số tiền" value={formatCurrency(paymentSession.amount)} />
                      {paymentSession.expiresAt && (
                        <PaymentSessionRow label="Hết hạn lúc" value={formatPaymentDate(paymentSession.expiresAt)} />
                      )}
                    </div>

                    <p className="mt-3 flex items-center gap-2 text-xs leading-5 text-[#5C5348]">
                      {isCheckingPayment && (
                        <span className="inline-block h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-[#FF7518] border-t-transparent" />
                      )}
                      {isCheckingPayment
                        ? 'Đang xác nhận giao dịch...'
                        : 'Quét mã bằng app ngân hàng, giữ nguyên nội dung chuyển khoản. Hệ thống tự kiểm tra mỗi 10 giây và chuyển sang kết quả thanh toán.'}
                    </p>
                  </div>

                  {paymentError && (
                    <p className="mt-4 rounded-2xl border border-[#C62828]/20 bg-[#FFEBEE] px-4 py-3 text-sm text-[#C62828]">
                      {paymentError}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handlePay}
                    disabled={isPaying}
                    className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#E8E4DC] bg-white font-display font-semibold text-[#1A1C1E] transition hover:bg-[#FAF8F4] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPaying && (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#FF7518] border-t-transparent" />
                    )}
                    {isPaying ? 'Đang tạo giao dịch...' : 'Tạo lại mã QR'}
                  </button>

                  <details className="mt-4 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] px-4 py-3">
                    <summary className="cursor-pointer font-display text-sm font-bold text-[#1A1C1E]">
                      Chi tiết thanh toán
                    </summary>
                    <div className="mt-3">
                      <CheckoutSummary booking={booking} appliedDiscount={appliedDiscount} />
                    </div>
                  </details>
                </>
              ) : (
                <>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-display text-lg font-bold">Tóm tắt thanh toán</h2>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5EC] px-3 py-1 font-display text-xs font-bold text-[#0A4D27]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#0A4D27]" />
                      Đã tạo booking
                    </span>
                  </div>

                  <CheckoutSummary booking={booking} appliedDiscount={appliedDiscount} />

                  <div className="mt-3">
                    <CheckoutCouponInput
                      bookingId={booking.bookingId}
                      subtotal={summary.subtotal}
                      appliedDiscount={appliedDiscount}
                      onApplied={handleApplyCoupon}
                      onRemoved={handleRemoveCoupon}
                      disabled={isPaying}
                    />
                  </div>

                  <div className="mt-3">
                    <CheckoutPaymentMethods
                      bookingId={booking.bookingId}
                      method={paymentMethod}
                      paymentOption={paymentOption}
                      onChange={(method) => {
                        setPaymentMethod(method)
                        setPaymentError('')
                      }}
                    />
                  </div>

                  {paymentError && (
                    <p className="mt-3 rounded-2xl border border-[#C62828]/20 bg-[#FFEBEE] px-4 py-3 text-sm text-[#C62828]">
                      {paymentError}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handlePay}
                    disabled={isPaying}
                    className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#FF7518] font-display font-semibold text-white shadow-[0_8px_18px_rgba(255,117,24,0.22)] transition hover:bg-[#E6640F] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPaying && (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    {isPaying ? 'Đang tạo giao dịch...' : `Tạo mã QR • ${formatCurrency(amountToPayNow)}`}
                  </button>
                </>
              )}

              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#5C5348]">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Giao dịch được xác nhận tự động qua SePay
              </p>
            </aside>
          </div>
        )}
      </section>
    </main>
  )
}

function CheckoutSteps() {
  const steps = [
    { label: 'Chọn phòng', done: true },
    { label: 'Xác nhận', done: true },
    { label: 'Thanh toán', done: false },
  ]

  return (
    <div className="flex w-fit items-center gap-2 rounded-full border border-[#E8E4DC] bg-white px-4 py-2.5 shadow-[0_2px_10px_rgba(26,28,30,0.04)]">
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-center gap-2">
          {index > 0 && <span className="h-px w-5 bg-[#E8E4DC]" />}
          <div className="flex items-center gap-1.5">
            <span
              className={[
                'flex h-5 w-5 items-center justify-center rounded-full font-display text-[11px] font-bold',
                step.done ? 'bg-[#E8F5EC] text-[#0A4D27]' : 'bg-[#FF7518] text-white',
              ].join(' ')}
            >
              {step.done ? (
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                index + 1
              )}
            </span>
            <span
              className={[
                'font-display text-xs font-semibold',
                step.done ? 'text-[#5C5348]' : 'text-[#1A1C1E]',
              ].join(' ')}
            >
              {step.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function CheckoutSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
      <div className="min-w-0 lg:col-span-2">
        <div className="animate-pulse overflow-hidden rounded-[24px] border border-[#E8E4DC] bg-white shadow-[0_4px_24px_rgba(26,28,30,0.06)]">
          <div className="h-48 bg-[#F0EDE6]" />
          <div className="space-y-4 p-6">
            <div className="h-5 w-1/3 rounded-full bg-[#F0EDE6]" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-16 rounded-2xl bg-[#FAF8F4]" />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="w-full max-w-md animate-pulse rounded-[24px] border border-[#E8E4DC] bg-white p-5 shadow-[0_4px_18px_rgba(26,28,30,0.06)] lg:justify-self-end">
        <div className="h-5 w-1/2 rounded-full bg-[#F0EDE6]" />
        <div className="mt-4 h-32 rounded-2xl bg-[#FAF8F4]" />
        <div className="mt-4 h-16 rounded-2xl bg-[#FAF8F4]" />
        <div className="mt-4 h-12 rounded-2xl bg-[#F0EDE6]" />
      </div>
    </div>
  )
}

function PaymentSessionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl bg-white px-3 py-2">
      <span className="text-[#5C5348]">{label}</span>
      <span className="text-right font-display font-bold text-[#1A1C1E]">{value}</span>
    </div>
  )
}

function formatPaymentDate(value: string) {
  const date = parseBackendUtcDate(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function getSecondsUntilExpiry(expiresAt: string | null | undefined, now: number) {
  if (!expiresAt) {
    return null
  }

  const expiryTime = parseBackendUtcDate(expiresAt).getTime()
  if (Number.isNaN(expiryTime)) {
    return null
  }

  return Math.max(0, Math.ceil((expiryTime - now) / 1000))
}

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function readDiscountFromParams(searchParams: URLSearchParams): AppliedDiscount | null {
  const code = searchParams.get('discountCode')?.trim().toUpperCase()
  const rawAmount = searchParams.get('discountAmount')
  const discountAmount = rawAmount ? Number(rawAmount) : NaN

  if (!code || !Number.isFinite(discountAmount) || discountAmount <= 0) {
    return null
  }

  return { code, discountAmount }
}
