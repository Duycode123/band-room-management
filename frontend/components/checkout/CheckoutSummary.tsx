'use client'

import { calculateCheckoutSummary, formatCurrency, type CheckoutBooking } from '@/lib/checkout-data'
import type { AppliedDiscount } from '@/lib/discount-service'

export default function CheckoutSummary({
  booking,
  appliedDiscount,
}: {
  booking: CheckoutBooking
  appliedDiscount: AppliedDiscount | null
}) {
  const summary = calculateCheckoutSummary(booking, appliedDiscount)

  return (
    <div className="rounded-2xl bg-[#FAF8F4] p-3">
      <div className="space-y-0.5">
        <PaymentRow label="Tiền phòng" value={formatCurrency(summary.roomPrice)} />
        {summary.addonsTotal > 0 && (
          <PaymentRow label="Thiết bị thêm" value={formatCurrency(summary.addonsTotal)} />
        )}
        {appliedDiscount && (
          <>
            <PaymentRow label="Tạm tính" value={formatCurrency(summary.subtotal)} />
            <PaymentRow
              label={`Mã giảm giá (${appliedDiscount.code})`}
              value={`-${formatCurrency(appliedDiscount.discountAmount)}`}
              green
            />
          </>
        )}
      </div>

      <div className="my-2 h-px bg-[#E8E4DC]" />

      <div className="flex items-end justify-between gap-3 px-1">
        <span className="font-display text-sm font-bold">Tổng thanh toán</span>
        <span className="shrink-0 text-nowrap font-display text-xl font-bold text-[#FF7518]">
          {formatCurrency(summary.total)}
        </span>
      </div>
    </div>
  )
}

function PaymentRow({ label, value, green = false }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 text-sm">
      <span className="min-w-0 text-[#5C5348]">{label}</span>
      <span
        className={['shrink-0 text-nowrap text-right font-semibold', green ? 'text-[#0A4D27]' : 'text-[#1A1C1E]'].join(
          ' ',
        )}
      >
        {value}
      </span>
    </div>
  )
}
