import type { PaymentMethod } from '@/lib/payment-service'

export default function CheckoutPaymentMethods({
  method: _method,
}: {
  bookingId?: string
  method?: PaymentMethod
  paymentOption?: string
  onChange?: (method: PaymentMethod) => void
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-[#FF7518]/40 bg-[#FFF7F0] px-3 py-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFE8D6] text-[#FF7518]">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 4.75h4.5v4.5h-4.5zM15.75 4.75h4.5v4.5h-4.5zM3.75 15.75h4.5v4.5h-4.5zM15.75 13.5h2.25v2.25h-2.25zM18 18h2.25v2.25H18zM13.5 13.5h2.25v2.25H13.5zM13.5 18.75h2.25v1.5H13.5z"
          />
        </svg>
      </span>
      <p className="min-w-0 truncate font-display text-sm font-bold text-[#1A1C1E]">
        Chuyển khoản ngân hàng (VietQR)
      </p>
      <span className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FF7518] text-white">
        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    </div>
  )
}
