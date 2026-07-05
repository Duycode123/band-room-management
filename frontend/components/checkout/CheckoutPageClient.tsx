'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import CheckoutBookingInfo from '@/components/checkout/CheckoutBookingInfo'
import CheckoutCouponInput from '@/components/checkout/CheckoutCouponInput'
import CheckoutPaymentMethods from '@/components/checkout/CheckoutPaymentMethods'
import CheckoutSummary from '@/components/checkout/CheckoutSummary'
import BandRoomHeader from '@/components/layout/BandRoomHeader'
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
  type PaymentMethod,
  type PaymentOption,
} from '@/lib/payment-service'

const DEPOSIT_AMOUNT = 50000

export default function CheckoutPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const confirmationHref = `/rooms/confirmation?${searchParams.toString()}`
  const [booking, setBooking] = useState<CheckoutBooking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(getInitialPaymentMethod(searchParams.get('method')))
  const [paymentOption, setPaymentOption] = useState<PaymentOption>(getInitialPaymentOption(searchParams.get('paymentOption')))
  const [isPaying, setIsPaying] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null)
  const [missingCheckoutReturnHref, setMissingCheckoutReturnHref] = useState('/')

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

        setPaymentOption(getInitialPaymentOption(checkoutParams.get('paymentOption')))
        setPaymentMethod(getInitialPaymentMethod(checkoutParams.get('method')))
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
    if (paymentOption === 'deposit' && paymentMethod !== 'bank_transfer') {
      setPaymentMethod('bank_transfer')
      return
    }

    if (paymentOption === 'full' && paymentMethod !== 'cash') {
      setPaymentMethod('cash')
    }
  }, [paymentMethod, paymentOption])

  const summary = useMemo(
    () => (booking ? calculateCheckoutSummary(booking, appliedDiscount) : null),
    [appliedDiscount, booking],
  )
  const amountToPayNow = useMemo(() => {
    if (!summary) return 0
    return paymentOption === 'deposit' ? Math.min(DEPOSIT_AMOUNT, summary.total) : summary.total
  }, [paymentOption, summary])

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

    setIsPaying(true)
    setPaymentError('')

    try {
      const session = await createPaymentSession({
        bookingId: booking.backendBookingId,
        method: paymentMethod,
        paymentOption,
      })

      if (session.status === 'success') {
        clearPendingBooking()
      }

      router.push(session.paymentUrl)
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
      <BandRoomHeader />

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
              Hệ thống đang đọc lại booking từ backend trước khi tạo phiên thanh toán SePay.
            </p>
          </div>
          <span className="w-fit rounded-full bg-[#FFE8D6] px-4 py-2 font-display text-sm font-bold text-[#6B3200]">
            Bước thanh toán
          </span>
        </div>

        {isLoading && (
          <div className="rounded-[24px] border border-[#E8E4DC] bg-white p-6 shadow-[0_4px_24px_rgba(26,28,30,0.06)]">
            <p className="font-display text-lg font-semibold">Đang tải thông tin thanh toán...</p>
          </div>
        )}

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

            <aside className="w-full max-w-md rounded-[24px] border border-[#E8E4DC] bg-white p-4 shadow-[0_4px_18px_rgba(26,28,30,0.06)] sm:p-5 lg:sticky lg:top-24 lg:col-span-1 lg:max-h-[calc(100vh-7rem)] lg:justify-self-end lg:overflow-y-auto">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="mb-1 text-xs font-semibold text-[#5C5348]">Mã: {booking.bookingId}</p>
                  <p className="font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">
                    Tóm tắt thanh toán
                  </p>
                  <h2 className="mt-1 font-display text-xl font-bold">Thanh toán</h2>
                </div>
                <span className="rounded-full bg-[#E8F5EC] px-3 py-1 font-display text-xs font-bold text-[#0A4D27]">
                  Đã tạo booking
                </span>
              </div>

              <CheckoutSummary booking={booking} appliedDiscount={appliedDiscount} />

              <div className="mt-4">
                <CheckoutCouponInput
                  bookingId={booking.bookingId}
                  subtotal={summary.subtotal}
                  appliedDiscount={appliedDiscount}
                  onApplied={handleApplyCoupon}
                  onRemoved={handleRemoveCoupon}
                  disabled={isPaying}
                />
              </div>

              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-3">
                  <p className="font-display text-sm font-bold text-[#1A1C1E]">Lựa chọn thanh toán</p>
                  <div className="mt-3 grid gap-2">
                    <PaymentOptionButton
                      active={paymentOption === 'deposit'}
                      title="Đặt cọc 50.000 VND"
                      description="Thanh toán online qua portal riêng của SePay."
                      onClick={() => {
                        setPaymentOption('deposit')
                        setPaymentError('')
                      }}
                    />
                    <PaymentOptionButton
                      active={paymentOption === 'full'}
                      title="Thanh toán toàn bộ"
                      description="Tạm thời đi theo hướng thanh toán tại quầy."
                      onClick={() => {
                        setPaymentOption('full')
                        setPaymentError('')
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-[#5C5348]">Cần thanh toán lúc này</span>
                    <span className="font-display text-xl font-bold text-[#FF7518]">
                      {formatCurrency(amountToPayNow)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#5C5348]">
                    Sau khi hoàn tất ở portal SePay, webhook sẽ cập nhật trạng thái booking trong hệ thống.
                  </p>
                </div>
              </div>

              <div className="mt-5">
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
                <p className="mt-4 rounded-2xl border border-[#C62828]/20 bg-[#FFEBEE] px-4 py-3 text-sm text-[#C62828]">
                  {paymentError}
                </p>
              )}

              <button
                type="button"
                onClick={handlePay}
                disabled={isPaying}
                className="mt-5 h-12 w-full rounded-2xl bg-[#FF7518] font-display font-semibold text-white shadow-[0_8px_18px_rgba(255,117,24,0.22)] transition hover:bg-[#E6640F] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPaying
                  ? 'Đang tạo giao dịch...'
                  : paymentOption === 'deposit'
                    ? `Sang portal SePay ${formatCurrency(amountToPayNow)}`
                    : 'Xác nhận thanh toán toàn bộ'}
              </button>
            </aside>
          </div>
        )}
      </section>
    </main>
  )
}

function PaymentOptionButton({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-2xl border px-3 py-3 text-left transition',
        active
          ? 'border-[#FF7518] bg-[#FFE8D6] text-[#6B3200]'
          : 'border-[#E8E4DC] bg-white text-[#5C5348] hover:bg-[#FAF8F4]',
      ].join(' ')}
    >
      <p className="font-display text-sm font-bold">{title}</p>
      <p className="mt-1 text-xs leading-5">{description}</p>
    </button>
  )
}

function getInitialPaymentMethod(value: string | null): PaymentMethod {
  if (value === 'bank_transfer' || value === 'e_wallet' || value === 'cash') {
    return value
  }

  return 'bank_transfer'
}

function getInitialPaymentOption(value: string | null): PaymentOption {
  return value === 'full' ? 'full' : 'deposit'
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
