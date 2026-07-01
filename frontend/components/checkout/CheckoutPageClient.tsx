'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import CheckoutBookingInfo from '@/components/checkout/CheckoutBookingInfo'
import CheckoutPaymentMethods from '@/components/checkout/CheckoutPaymentMethods'
import CheckoutSummary from '@/components/checkout/CheckoutSummary'
import BandRoomHeader from '@/components/layout/BandRoomHeader'
import {
  calculateCheckoutSummary,
  getCheckoutBookingFromParams,
  type CheckoutBooking,
} from '@/lib/checkout-data'
import { createPaymentSession, type PaymentMethod } from '@/lib/payment-service'

export default function CheckoutPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const confirmationHref = `/customer/booking/confirmation?${searchParams.toString()}`
  const initialPaymentMethod = getInitialPaymentMethod(searchParams.get('method'))
  const [booking, setBooking] = useState<CheckoutBooking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initialPaymentMethod)
  const [isPaying, setIsPaying] = useState(false)
  const [paymentError, setPaymentError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadBooking() {
      setIsLoading(true)
      setError('')

      try {
        const loadedBooking = await getCheckoutBookingFromParams(new URLSearchParams(searchParams.toString()))
        if (!mounted) return

        if (!searchParams.get('bookingId')) {
          setError('Thieu ma dat phong. Vui long quay lai buoc xac nhan.')
          setBooking(null)
          return
        }

        if (!loadedBooking) {
          setError('Khong tim thay thong tin checkout tu backend.')
          setBooking(null)
          return
        }

        setBooking(loadedBooking)
      } catch {
        if (mounted) {
          setError('Khong the tai thong tin thanh toan. Vui long thu lai.')
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

  const summary = useMemo(
    () => (booking ? calculateCheckoutSummary(booking, null) : null),
    [booking],
  )

  const handlePay = async () => {
    if (!booking || !summary) {
      setPaymentError('Khong tim thay thong tin dat phong de thanh toan.')
      return
    }

    if (!booking.backendBookingId) {
      setPaymentError('Checkout nay chua gan voi booking backend hop le.')
      return
    }

    setIsPaying(true)
    setPaymentError('')

    try {
      const session = await createPaymentSession({
        bookingId: booking.backendBookingId,
        method: paymentMethod,
      })

      router.push(session.paymentUrl)
    } catch (paymentSessionError) {
      setPaymentError(
        paymentSessionError instanceof Error
          ? paymentSessionError.message
          : 'Khong the tao giao dich. Vui long thu lai.',
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
              <Link href="/" className="hover:text-[#1A1C1E]">Trang chu</Link>
              <span>/</span>
              <Link href={confirmationHref} className="hover:text-[#1A1C1E]">Xac nhan dat phong</Link>
              <span>/</span>
              <span className="text-[#1A1C1E]">Thanh toan</span>
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight">Thanh toan dat phong</h1>
            <p className="mt-2 text-[#5C5348]">
              Checkout dang doc lai thong tin booking tu backend truoc khi tao phien thanh toan.
            </p>
          </div>
          <span className="w-fit rounded-full bg-[#FFE8D6] px-4 py-2 font-display text-sm font-bold text-[#6B3200]">
            Buoc thanh toan
          </span>
        </div>

        {isLoading && (
          <div className="rounded-[24px] border border-[#E8E4DC] bg-white p-6 shadow-[0_4px_24px_rgba(26,28,30,0.06)]">
            <p className="font-display text-lg font-semibold">Dang tai thong tin thanh toan...</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-[24px] border border-[#C62828]/20 bg-white p-6 shadow-[0_4px_24px_rgba(26,28,30,0.06)]">
            <h2 className="font-display text-xl font-bold text-[#C62828]">Khong the mo checkout</h2>
            <p className="mt-2 text-[#5C5348]">{error}</p>
            <Link
              href="/customer/booking"
              className="mt-5 inline-flex h-12 items-center justify-center rounded-2xl bg-[#FF7518] px-6 font-display font-semibold text-white transition hover:bg-[#E6640F]"
            >
              Quay lai chon phong
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
                  <p className="mb-1 text-xs font-semibold text-[#5C5348]">Ma: {booking.bookingId}</p>
                  <p className="font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">Tom tat thanh toan</p>
                  <h2 className="mt-1 font-display text-xl font-bold">Thanh toan</h2>
                </div>
                <span className="rounded-full bg-[#E8F5EC] px-3 py-1 font-display text-xs font-bold text-[#0A4D27]">
                  Dong bo backend
                </span>
              </div>

              <CheckoutSummary
                booking={booking}
                appliedDiscount={null}
              />

              <div className="mt-4 grid gap-2 text-xs leading-5 text-[#5C5348]">
                <p className="rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] px-3 py-2.5">
                  Add-on va discount khong con duoc tinh local trong checkout nay.
                </p>
                <p className="rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] px-3 py-2.5">
                  Tong tien dang lay theo booking backend.
                </p>
              </div>

              <div className="mt-5">
                <CheckoutPaymentMethods
                  bookingId={booking.bookingId}
                  method={paymentMethod}
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
                {isPaying ? 'Dang tao giao dich...' : 'Thanh toan ngay'}
              </button>
            </aside>
          </div>
        )}
      </section>
    </main>
  )
}

function getInitialPaymentMethod(value: string | null): PaymentMethod {
  if (value === 'bank_transfer' || value === 'e_wallet' || value === 'cash') {
    return value
  }

  return 'bank_transfer'
}
