import {
  calculateCheckoutSummary,
  formatCurrency,
  type CheckoutBooking,
} from '@/lib/checkout-data'

export default function CheckoutSummary({ booking }: { booking: CheckoutBooking }) {
  const summary = calculateCheckoutSummary(booking)

  return (
    <div className="rounded-2xl bg-[#FAF8F4] p-4">
      <PaymentRow label="Giá phòng" value={`${formatCurrency(booking.pricePerHour)} / giờ`} />
      <PaymentRow label="Thời lượng" value={`${booking.duration} giờ`} />

      <div className="my-4 h-px bg-[#E8E4DC]" />

      <PaymentRow label="Tiền phòng" value={formatCurrency(summary.roomPrice)} />
      <PaymentRow label="Dịch vụ thuê thêm" value={formatCurrency(summary.addonsTotal)} />
      <PaymentRow label="Ưu đãi thành viên" value={`-${formatCurrency(summary.discount)}`} green />
      <PaymentRow label="Phí xử lý" value={formatCurrency(summary.serviceFee)} />

      <div className="mt-5 rounded-2xl bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          <span className="font-display text-lg font-bold">Tổng thanh toán</span>
          <span className="font-display text-3xl font-bold text-[#FF7518]">{formatCurrency(summary.total)}</span>
        </div>
      </div>
    </div>
  )
}

function PaymentRow({ label, value, green = false }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-[#5C5348]">{label}</span>
      <span className={['text-right font-semibold', green ? 'text-[#0A4D27]' : 'text-[#1A1C1E]'].join(' ')}>
        {value}
      </span>
    </div>
  )
}
