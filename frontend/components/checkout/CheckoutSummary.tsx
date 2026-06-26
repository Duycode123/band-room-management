'use client'

import { useState } from 'react'
import {
  calculateCheckoutSummary,
  formatCurrency,
  type CheckoutBooking,
} from '@/lib/checkout-data'
import {
  validateDiscountCode,
  type AppliedDiscount,
} from '@/lib/discount-service'

export default function CheckoutSummary({
  booking,
  appliedDiscount,
  onDiscountChange,
}: {
  booking: CheckoutBooking
  appliedDiscount: AppliedDiscount | null
  onDiscountChange: (discount: AppliedDiscount | null) => void
}) {
  const [discountCode, setDiscountCode] = useState('')
  const [discountError, setDiscountError] = useState('')
  const [discountMessage, setDiscountMessage] = useState('')
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false)
  const summary = calculateCheckoutSummary(booking, appliedDiscount)
  const subtotal = summary.roomPrice + summary.addonsTotal

  const handleApplyDiscount = async () => {
    const code = discountCode.trim()

    setDiscountError('')
    setDiscountMessage('')

    if (!code) {
      setDiscountError('Vui lòng nhập mã giảm giá.')
      return
    }

    setIsApplyingDiscount(true)

    try {
      const result = await validateDiscountCode({
        code,
        bookingId: booking.bookingId,
        roomId: booking.roomId,
        subtotal,
      })

      if (!result.valid || !result.code || result.discountAmount === undefined) {
        setDiscountError(result.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn.')
        onDiscountChange(null)
        return
      }

      onDiscountChange({
        code: result.code,
        discountAmount: result.discountAmount,
      })
      setDiscountCode(result.code)
      setDiscountMessage(result.message)
    } finally {
      setIsApplyingDiscount(false)
    }
  }

  const handleRemoveDiscount = () => {
    onDiscountChange(null)
    setDiscountCode('')
    setDiscountError('')
    setDiscountMessage('')
  }

  return (
    <div className="rounded-2xl bg-[#FAF8F4] p-3.5">
      <div className="space-y-1">
        <PaymentRow label="Tiền phòng" value={formatCurrency(summary.roomPrice)} />
        <PaymentRow label="Dịch vụ thuê thêm" value={formatCurrency(summary.addonsTotal)} />
        {appliedDiscount && (
          <PaymentRow
            label={`Mã giảm giá (${appliedDiscount.code})`}
            value={`-${formatCurrency(appliedDiscount.discountAmount)}`}
            green
          />
        )}
      </div>

      <div className="my-3 h-px bg-[#E8E4DC]" />

      <div>
        <label className="font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]" htmlFor="discount-code">
          Mã giảm giá
        </label>

        {appliedDiscount ? (
          <div className="mt-2 rounded-2xl border border-[#0A4D27]/25 bg-white px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-sm font-bold text-[#1A1C1E]">{appliedDiscount.code}</p>
                <p className="mt-1 text-sm text-[#0A4D27]">
                  Đã giảm {formatCurrency(appliedDiscount.discountAmount)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemoveDiscount}
                className="shrink-0 rounded-xl border border-[#E8E4DC] px-3 py-1.5 font-display text-xs font-bold text-[#5C5348] transition hover:bg-[#FAF8F4] hover:text-[#1A1C1E]"
              >
                Gỡ mã
              </button>
            </div>
            {discountMessage && <p className="mt-2 text-xs font-medium text-[#0A4D27]">{discountMessage}</p>}
          </div>
        ) : (
          <>
            <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                id="discount-code"
                value={discountCode}
                onChange={(event) => {
                  setDiscountCode(event.target.value)
                  setDiscountError('')
                  setDiscountMessage('')
                }}
                placeholder="Nhập mã giảm giá"
                className="h-11 min-w-0 rounded-2xl border border-[#E8E4DC] bg-white px-3 text-sm text-[#1A1C1E] outline-none transition placeholder:text-[#8A8176] focus:border-[#FF7518] focus:ring-2 focus:ring-[#FF7518]/20"
              />
              <button
                type="button"
                onClick={handleApplyDiscount}
                disabled={isApplyingDiscount}
                className="h-11 rounded-2xl bg-[#FF7518] px-4 font-display text-sm font-semibold text-white transition hover:bg-[#E6640F] disabled:cursor-wait disabled:opacity-70"
              >
                {isApplyingDiscount ? 'Đang áp dụng' : 'Áp dụng'}
              </button>
            </div>
            {discountError && <p className="mt-2 text-xs font-medium text-[#C62828]">{discountError}</p>}
          </>
        )}
      </div>

      <div className="mt-4 rounded-2xl bg-white px-3 py-3.5">
        <div className="flex items-end justify-between gap-3">
          <span className="font-display text-sm font-bold">Tổng thanh toán</span>
          <span className="shrink-0 text-nowrap font-display text-2xl font-bold text-[#FF7518]">
            {formatCurrency(summary.total)}
          </span>
        </div>
      </div>
    </div>
  )
}

function PaymentRow({ label, value, green = false }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="min-w-0 text-[#5C5348]">{label}</span>
      <span className={['shrink-0 text-nowrap text-right font-semibold', green ? 'text-[#0A4D27]' : 'text-[#1A1C1E]'].join(' ')}>
        {value}
      </span>
    </div>
  )
}
