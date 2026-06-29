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
      <h3 className="font-display text-base font-bold">Phuong thuc thanh toan</h3>
      <div className="mt-2 grid gap-2">
        {paymentMethodOptions.map((option) => {
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
      <div className="mt-4 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-3">
        <div className="grid gap-3">
          <div>
            <p className="mb-2 text-center text-sm font-semibold text-[#5C5348]">Quet ma de thanh toan</p>
            <QrPattern />
          </div>
          <div className="space-y-2 text-sm">
            <InstructionRow label="Ngan hang" value="Band Room Bank" />
            <InstructionRow label="Chu tai khoan" value="BAND ROOM STUDIO" />
            <InstructionRow label="Noi dung chuyen khoan" value={bookingId} />
            <p className="rounded-2xl bg-white px-3 py-2.5 text-[#5C5348]">
              Vui long chuyen dung noi dung de he thong xac nhan nhanh hon.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (method === 'e_wallet') {
    return (
      <div className="mt-4 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-3 text-sm text-[#5C5348]">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFE8D6] font-display text-sm font-bold text-[#FF7518]">
          Vi
        </div>
        Ban se duoc chuyen den vi dien tu sau khi bam Thanh toan ngay.
      </div>
    )
  }

  return (
    <div className="mt-4 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-3 text-sm text-[#5C5348]">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFE8D6] font-display text-sm font-bold text-[#FF7518]">
        VND
      </div>
      <p>Ban co the thanh toan tai quay khi den nhan phong.</p>
      <p className="mt-2 font-medium">
        Lich dat se duoc giu trong 30 phut. Vui long den dung gio de hoan tat thanh toan.
      </p>
      <p className="sr-only">Phuong thuc dang chon: {getPaymentMethodLabel(method)}</p>
    </div>
  )
}

function InstructionRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">{label}</p>
      <p className="mt-1 break-words font-semibold text-[#1A1C1E]">{value}</p>
    </div>
  )
}

function QrPattern() {
  const filledBlocks = new Set([0, 1, 2, 4, 5, 7, 9, 10, 13, 15, 17, 18, 20, 21, 22, 24])

  return (
    <div className="mx-auto grid h-24 w-24 grid-cols-5 gap-1 rounded-2xl border border-dashed border-[#FF7518] bg-white p-2.5">
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
