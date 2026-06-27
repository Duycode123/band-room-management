import {
  formatDisplayDate,
  type CheckoutBooking,
} from '@/lib/checkout-data'

export default function CheckoutBookingInfo({ booking }: { booking: CheckoutBooking }) {
  return (
    <section className="rounded-[24px] border border-[#E8E4DC] bg-white p-6 shadow-[0_4px_24px_rgba(26,28,30,0.06)]">
      <div className="mb-5">
        <p className="font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">Booking đã xác nhận</p>
        <h2 className="mt-1 font-display text-xl font-bold">{booking.roomName}</h2>
        <span className="mt-3 inline-flex rounded-full bg-[#FFE8D6] px-3 py-1 font-display text-xs font-bold text-[#6B3200]">
          {booking.bookingId}
        </span>
      </div>

      <div className="grid gap-4">
        <Detail label="Ngày đặt" value={formatDisplayDate(booking.date)} />
        <Detail label="Khung giờ" value={`${booking.startTime} - ${booking.endTime}`} />
        <Detail label="Thời lượng" value={`${booking.duration} giờ`} />
        <Detail label="Địa điểm" value={booking.location} />
      </div>

      <div className="mt-6 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-4 text-sm text-[#5C5348]">
        Mã đặt phòng sẽ được gửi sau khi thanh toán thành công.
      </div>
    </section>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  )
}
