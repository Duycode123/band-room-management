import { getPaymentMethodLabel, paymentMethodOptions } from '@/lib/checkout-data'
import type { PaymentMethod } from '@/lib/payment-service'

export default function CheckoutPaymentMethods({
  bookingId,
  method,
  onChange,
}: {
  bookingId: string
  method: PaymentMethod
  onChange: (method: PaymentMethod) => void
}) {
  return (
    <div>
      <h3 className="font-display text-lg font-bold">Phương thức thanh toán</h3>
      <div className="mt-3 grid gap-2">
        {paymentMethodOptions.map((option) => {
          const active = method === option.id

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              aria-pressed={active}
              className={[
                'rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-[#FF7518]/30',
                active
                  ? 'border-[#FF7518] bg-[#FFE8D6] text-[#6B3200]'
                  : 'border-[#E8E4DC] bg-white text-[#5C5348] hover:bg-[#FAF8F4]',
              ].join(' ')}
            >
              <span className="flex items-start justify-between gap-3">
                <span>
                  <span className="block font-display text-sm font-bold">{option.label}</span>
                  <span className="mt-1 block text-xs leading-5">{option.description}</span>
                </span>
                {active && (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FF7518] text-xs font-bold text-white">
                    ✓
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      <PaymentMethodInstruction bookingId={bookingId} method={method} />
    </div>
  )
}

function PaymentMethodInstruction({ bookingId, method }: { bookingId: string; method: PaymentMethod }) {
  if (method === 'bank_transfer') {
    return (
      <div className="mt-5 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-4">
        <div className="grid gap-4 sm:grid-cols-[128px_1fr]">
          <div>
            <p className="mb-2 text-center text-sm font-semibold text-[#5C5348]">Quét mã để thanh toán</p>
            <QrPattern />
          </div>
          <div className="space-y-3 text-sm">
            <InstructionRow label="Ngân hàng" value="Band Room Bank" />
            <InstructionRow label="Chủ tài khoản" value="BAND ROOM STUDIO" />
            <InstructionRow label="Nội dung chuyển khoản" value={bookingId} />
            <p className="rounded-2xl bg-white px-4 py-3 text-[#5C5348]">
              Vui lòng chuyển đúng nội dung để hệ thống xác nhận nhanh hơn.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (method === 'e_wallet') {
    return (
      <div className="mt-5 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-4 text-sm text-[#5C5348]">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFE8D6] font-display text-sm font-bold text-[#FF7518]">
          Ví
        </div>
        Bạn sẽ được chuyển đến ví điện tử sau khi bấm Thanh toán ngay.
      </div>
    )
  }

  return (
    <div className="mt-5 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-4 text-sm text-[#5C5348]">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFE8D6] font-display text-sm font-bold text-[#FF7518]">
        ₫
      </div>
      <p>Bạn có thể thanh toán tại quầy khi đến nhận phòng.</p>
      <p className="mt-2 font-medium">
        Lịch đặt sẽ được giữ trong 30 phút. Vui lòng đến đúng giờ để hoàn tất thanh toán.
      </p>
      <p className="sr-only">Phương thức đang chọn: {getPaymentMethodLabel(method)}</p>
    </div>
  )
}

function InstructionRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">{label}</p>
      <p className="mt-1 font-semibold text-[#1A1C1E]">{value}</p>
    </div>
  )
}

function QrPattern() {
  const filledBlocks = new Set([0, 1, 2, 4, 5, 7, 9, 10, 13, 15, 17, 18, 20, 21, 22, 24])

  return (
    <div className="mx-auto grid h-28 w-28 grid-cols-5 gap-1 rounded-2xl border border-dashed border-[#FF7518] bg-white p-3">
      {Array.from({ length: 25 }).map((_, index) => (
        <span
          key={index}
          className={filledBlocks.has(index) ? 'rounded-sm bg-[#042A16]' : 'rounded-sm bg-[#E8E4DC]'}
        />
      ))}
      <span className="sr-only">QR CODE</span>
    </div>
  )
}
