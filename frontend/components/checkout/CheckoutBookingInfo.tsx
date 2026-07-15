import { formatDisplayDate, type CheckoutBooking } from '@/lib/checkout-data'

export default function CheckoutBookingInfo({ booking }: { booking: CheckoutBooking }) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-[#E8E4DC] bg-white shadow-[0_4px_24px_rgba(26,28,30,0.06)]">
      {booking.image && (
        <div className="relative h-44 w-full sm:h-56">
          <img
            src={booking.image}
            alt={booking.roomName}
            className={`h-full w-full object-cover ${booking.imageClassName ?? ''}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="font-display text-xs font-bold uppercase tracking-wider text-white/80">
                {booking.categoryLabel}
              </p>
              <h2 className="font-display text-2xl font-bold text-white">{booking.roomName}</h2>
            </div>
            <span className="rounded-full bg-white/95 px-3 py-1 font-display text-xs font-bold text-[#6B3200]">
              {booking.bookingId}
            </span>
          </div>
        </div>
      )}

      <div className="p-6">
        {!booking.image && (
          <div className="mb-5">
            <p className="font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">
              {booking.categoryLabel}
            </p>
            <h2 className="mt-1 font-display text-xl font-bold">{booking.roomName}</h2>
            <span className="mt-3 inline-flex rounded-full bg-[#FFE8D6] px-3 py-1 font-display text-xs font-bold text-[#6B3200]">
              {booking.bookingId}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Detail icon="calendar" label="Ngày đặt" value={formatDisplayDate(booking.date)} />
          <Detail icon="clock" label="Khung giờ" value={`${booking.startTime} - ${booking.endTime}`} />
          <Detail icon="duration" label="Thời lượng" value={`${booking.duration} giờ`} />
          <Detail icon="location" label="Địa điểm" value={booking.location} />
          <Detail icon="people" label="Sức chứa" value={booking.capacity} />
          <Detail icon="price" label="Đơn giá" value={`${booking.pricePerHour.toLocaleString('vi-VN')}đ/giờ`} />
        </div>

        {booking.equipments.length > 0 && (
          <div className="mt-6">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[#5C5348]">
              Thiết bị có sẵn
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {booking.equipments.map((item) => (
                <span key={item} className="rounded-full bg-[#F0EDE6] px-3 py-1 text-sm text-[#5C5348]">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {booking.note && booking.note !== 'Không có ghi chú' && booking.note !== 'Không có ghi chú thêm.' && (
          <div className="mt-5 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-4">
            <p className="font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">Ghi chú khách hàng</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-[#1A1C1E]">{booking.note}</p>
          </div>
        )}

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#FFE8D6] bg-[#FFF7F0] p-4 text-sm text-[#6B3200]">
          <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          Đơn đặt đang ở trạng thái chờ thanh toán. Phòng chỉ được giữ chỗ sau khi bạn hoàn tất chuyển khoản.
        </div>
      </div>
    </section>
  )
}

const detailIcons: Record<string, string> = {
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  duration: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  location:
    'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
  people:
    'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6-4a3 3 0 11-3-3',
  price:
    'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 10v-1m0 1a2.6 2.6 0 01-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
}

function Detail({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#F0EDE6] bg-[#FAF8F4] px-3.5 py-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FFE8D6] text-[#FF7518]">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d={detailIcons[icon]} />
        </svg>
      </span>
      <div className="min-w-0">
        <p className="font-display text-[11px] font-bold uppercase tracking-wider text-[#5C5348]">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-[#1A1C1E]">{value}</p>
      </div>
    </div>
  )
}
