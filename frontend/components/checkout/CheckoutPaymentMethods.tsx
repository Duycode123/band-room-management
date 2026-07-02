import { getPaymentMethodLabel, paymentMethodOptions } from '@/lib/checkout-data'
import type { PaymentMethod, PaymentOption } from '@/lib/payment-service'

export default function CheckoutPaymentMethods({
  bookingId,
  method,
  paymentOption,
  onChange,
}: {
  bookingId: string
  method: PaymentMethod
  paymentOption: PaymentOption
  onChange: (method: PaymentMethod) => void
}) {
  const visibleOptions =
    paymentOption === 'deposit'
      ? paymentMethodOptions.filter((option) => option.id !== 'cash')
      : paymentMethodOptions.filter((option) => option.id === 'cash')

  return (
    <div>
      <h3 className="font-display text-base font-bold">Phương thức thanh toán</h3>
      <div className="mt-2 grid gap-2">
        {visibleOptions.map((option) => {
          const active = method === option.id

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              aria-pressed={active}
              className={[
                'rounded-2xl border px-3 py-2.5 text-left transition focus:outline-none focus:ring-2 focus:ring-[#FF7518]/30',
                active
                  ? 'border-[#FF7518] bg-[#FFE8D6] text-[#6B3200]'
                  : 'border-[#E8E4DC] bg-white text-[#5C5348] hover:bg-[#FAF8F4]',
              ].join(' ')}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block font-display text-sm font-bold">{option.label}</span>
                  <span className="mt-1 block text-xs leading-5">{option.description}</span>
                </span>
                {active && (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FF7518] text-xs font-bold text-white">
                    OK
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      <PaymentMethodInstruction bookingId={bookingId} method={method} paymentOption={paymentOption} />
    </div>
  )
}

function PaymentMethodInstruction({
  bookingId,
  method,
  paymentOption,
}: {
  bookingId: string
  method: PaymentMethod
  paymentOption: PaymentOption
}) {
  if (paymentOption === 'deposit') {
    return (
      <div className="mt-4 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-3 text-sm text-[#5C5348]">
        <p className="font-display font-semibold text-[#1A1C1E]">Đặt cọc 50.000 VND chỉ hỗ trợ online</p>
        <p className="mt-2">
          SePay sẽ được tích hợp sau. Tạm thời hệ thống chỉ mô phỏng thanh toán thành công ngay khi bạn bấm nút.
        </p>
        <p className="mt-2 text-xs">Mã đối soát tạm thời: {bookingId}</p>
        <p className="sr-only">Phương thức đang chọn: {getPaymentMethodLabel(method)}</p>
      </div>
    )
  }

  return (
    <div className="mt-4 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-3 text-sm text-[#5C5348]">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFE8D6] font-display text-sm font-bold text-[#FF7518]">
        VND
      </div>
      <p>Thanh toán toàn bộ hiện tạm đi theo hướng thanh toán tại quầy.</p>
      <p className="mt-2 font-medium">Booking trên hệ thống vẫn giữ trạng thái chờ thanh toán cho tới khi flow SePay được nối đầy đủ.</p>
      <p className="sr-only">Phương thức đang chọn: {getPaymentMethodLabel(method)}</p>
    </div>
  )
}
