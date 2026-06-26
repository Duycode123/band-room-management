'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import BandRoomHeader from '@/components/layout/BandRoomHeader'
import {
  DEFAULT_BOOKING_DATE,
  DEFAULT_START_TIME,
  EMPTY_NOTE_TEXT,
  MEMBER_DISCOUNT,
  calculateEndTime,
  findBookingRoom,
  formatCurrency,
  formatDisplayDate,
  getAddOnsTotal,
  getBookingRoomOrFallback,
  getBookingTotal,
  getRoomSubtotal,
  getSelectedAddOns,
  normalizeDuration,
  parseAddonIds,
  paymentMethods,
  type BookingAddOn,
  type PaymentMethod,
  type PaymentMethodId,
} from '@/components/booking/booking-data'

export default function BookingConfirmationClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roomId = searchParams.get('roomId')
  const room = getBookingRoomOrFallback(roomId)
  const roomMissing = Boolean(roomId && !findBookingRoom(roomId))
  const date = searchParams.get('date') || DEFAULT_BOOKING_DATE
  const startTime = searchParams.get('startTime') || DEFAULT_START_TIME
  const duration = normalizeDuration(searchParams.get('duration'))
  const endTime = searchParams.get('endTime') || calculateEndTime(startTime, duration)
  const selectedAddonIds = useMemo(() => parseAddonIds(searchParams.get('addons')), [searchParams])
  const selectedAddOns = useMemo(() => getSelectedAddOns(selectedAddonIds), [selectedAddonIds])
  const addOnsTotal = useMemo(() => getAddOnsTotal(selectedAddOns), [selectedAddOns])
  const roomSubtotal = getRoomSubtotal(room, duration)
  const total = getBookingTotal(room, duration, addOnsTotal)
  const note = searchParams.get('note')?.trim() || EMPTY_NOTE_TEXT
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('bank_transfer')
  const [confirmError, setConfirmError] = useState('')
  const [bookingConfirmed, setBookingConfirmed] = useState(false)
  const activePaymentMethod = paymentMethods.find((method) => method.id === paymentMethod) ?? paymentMethods[0]

  const handleConfirm = () => {
    if (!roomId || roomMissing) {
      setConfirmError('Vui lòng quay lại homepage và chọn một phòng hợp lệ.')
      setBookingConfirmed(false)
      return
    }

    if (!date || !startTime || !duration || !paymentMethod) {
      setConfirmError('Vui lòng kiểm tra ngày đặt, giờ bắt đầu, thời lượng và phương thức thanh toán.')
      setBookingConfirmed(false)
      return
    }

    setConfirmError('')
    setBookingConfirmed(false)

    const params = new URLSearchParams({
      bookingId: room.code,
      roomId: room.id,
      date,
      startTime,
      endTime,
      duration: String(duration),
      addons: selectedAddonIds.join(','),
      note: note === EMPTY_NOTE_TEXT ? '' : note,
      method: paymentMethod,
    })

    router.push(`/customer/checkout?${params.toString()}`)
  }

  return (
    <main className="min-h-screen bg-[#F5F2EC] text-[#1A1C1E]">
      <BandRoomHeader />

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2 font-display text-sm text-[#5C5348]">
              <Link href="/" className="hover:text-[#1A1C1E]">
                Trang chủ
              </Link>
              <span>/</span>
              <Link href="/#rooms" className="hover:text-[#1A1C1E]">
                Phòng tập
              </Link>
              <span>/</span>
              <span className="text-[#1A1C1E]">Xác nhận đặt phòng</span>
            </div>

            <h1 className="font-display text-4xl font-bold tracking-tight">Xác nhận đặt phòng</h1>
            <p className="mt-2 text-[#5C5348]">
              Vui lòng kiểm tra lại thông tin trước khi hoàn tất đặt phòng.
            </p>
          </div>

          <span className="w-fit rounded-full bg-[#0A4D27] px-4 py-2 font-display text-sm font-semibold text-white">
            Sẵn sàng xác nhận
          </span>
        </div>

        {roomMissing && (
          <div className="mb-6 rounded-2xl border border-[#FF7518]/30 bg-[#FFE8D6] px-4 py-3 text-sm font-medium text-[#6B3200]">
            Không tìm thấy phòng đã chọn. Hệ thống đang hiển thị phòng đầu tiên để bạn tiếp tục kiểm tra.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <section className="rounded-[24px] border border-[#E8E4DC] bg-white p-6 shadow-[0_4px_24px_rgba(26,28,30,0.06)]">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold">Thông tin đặt phòng</h2>
              <span className="rounded-full bg-[#FFE8D6] px-3 py-1 font-display text-xs font-bold uppercase tracking-wide text-[#6B3200]">
                {room.badge}
              </span>
            </div>

            <Image
              src={room.image}
              alt={room.name}
              width={900}
              height={420}
              className={`h-[260px] w-full rounded-2xl object-cover ${room.imageClassName}`}
              priority
            />

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <h3 className="font-display text-2xl font-bold">{room.name}</h3>
              <span className="font-display font-semibold text-[#B45309]">★ {room.rating}</span>
            </div>

            <p className="mt-1 text-[#5C5348]">{room.type}</p>

            <div className="mt-6 grid gap-4 border-b border-[#E8E4DC] pb-6 sm:grid-cols-2">
              <Detail label="Ngày đặt" value={formatDisplayDate(date)} />
              <Detail label="Khung giờ" value={`${startTime} - ${endTime}`} />
              <Detail label="Thời lượng" value={`${duration} giờ`} />
              <Detail label="Số người" value={room.capacity} />
              <Detail label="Địa điểm" value={room.location} />
            </div>

            <InfoSection title="Thiết bị có sẵn" items={room.includedEquipments} />
            <SelectedAddOnsSection addOns={selectedAddOns} />

            <div className="mt-6">
              <h3 className="font-display text-lg font-bold">Ghi chú khách hàng</h3>
              <div className="mt-3 whitespace-pre-wrap rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-4 text-[#5C5348]">
                {note}
              </div>
            </div>
          </section>

          <aside className="h-fit rounded-[24px] border border-[#E8E4DC] bg-white p-6 shadow-[0_4px_24px_rgba(26,28,30,0.06)] lg:sticky lg:top-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">
                  Tóm tắt thanh toán
                </p>
                <p className="mt-1 font-display font-semibold">Mã đặt phòng: {room.code}</p>
              </div>
              <span className="rounded-full bg-[#FFE8D6] px-3 py-1 font-display text-xs font-bold text-[#6B3200]">
                Chờ thanh toán
              </span>
            </div>

            <PaymentRow label="Giá phòng" value={`${formatCurrency(room.pricePerHour)} / giờ`} />
            <PaymentRow label="Thời lượng" value={`${duration} giờ`} />

            <div className="my-4 h-px bg-[#E8E4DC]" />

            <PaymentRow label="Tiền phòng" value={formatCurrency(roomSubtotal)} />
            <PaymentRow label="Dịch vụ thuê thêm" value={formatCurrency(addOnsTotal)} />
            <PaymentRow label="Ưu đãi thành viên" value={`-${formatCurrency(MEMBER_DISCOUNT)}`} green />

            <div className="my-5 rounded-2xl bg-[#FAF8F4] p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="font-display text-lg font-bold">Tổng thanh toán</span>
                <span className="font-display text-3xl font-bold text-[#FF7518]">{formatCurrency(total)}</span>
              </div>
            </div>

            <h3 className="font-display text-lg font-bold">Phương thức thanh toán</h3>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
              {paymentMethods.map((method) => (
                <PaymentMethodOption
                  key={method.id}
                  method={method}
                  active={paymentMethod === method.id}
                  onSelect={() => {
                    setPaymentMethod(method.id)
                    setConfirmError('')
                    setBookingConfirmed(false)
                  }}
                />
              ))}
            </div>

            <PaymentInstruction method={activePaymentMethod} />

            {confirmError && (
              <p className="mt-4 rounded-2xl border border-[#C62828]/20 bg-[#FFEBEE] px-4 py-3 text-sm text-[#C62828]">
                {confirmError}
              </p>
            )}

            {bookingConfirmed && (
              <div className="mt-4 rounded-2xl border border-[#0A4D27]/25 bg-[#F1F8F2] px-4 py-3 text-sm text-[#0A4D27]">
                <p className="font-display font-bold">Đặt phòng thành công</p>
                <p className="mt-1">Mã đặt phòng: {room.code}</p>
                <p className="mt-1">Phương thức thanh toán: {activePaymentMethod.label}</p>
                <p className="mt-1">Vui lòng giữ mã đặt phòng để check-in.</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              className="mt-6 h-12 w-full rounded-2xl bg-[#FF7518] font-display font-semibold text-white transition hover:bg-[#E6640F] active:scale-[0.98]"
            >
              Xác nhận đặt phòng
            </button>

            <Link
              href="/#rooms"
              className="mt-3 flex h-12 w-full items-center justify-center rounded-2xl border border-[#C9C2B6] bg-transparent font-display font-semibold text-[#1A1C1E] transition hover:bg-[#FAF8F4]"
            >
              Quay lại chọn phòng
            </Link>
          </aside>
        </div>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="rounded-[24px] border border-[#E8E4DC] bg-white p-6 shadow-[0_4px_24px_rgba(26,28,30,0.06)]">
            <h3 className="font-display text-lg font-bold">Quy trình sau khi đặt phòng</h3>
            <div className="mt-6 grid gap-5 md:grid-cols-4">
              {processSteps.map((step, index) => (
                <ProcessStep key={step[0]} step={step} index={index} />
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-[#E8E4DC] bg-white p-6 shadow-[0_4px_24px_rgba(26,28,30,0.06)]">
            <h3 className="font-display text-lg font-bold">Chính sách đặt phòng</h3>
            <ul className="mt-4 space-y-3 text-sm text-[#5C5348]">
              <li>Có thể hủy trước 2 giờ</li>
              <li>Đến muộn quá 15 phút cần liên hệ nhân viên</li>
              <li>Thiết bị hư hỏng phát sinh sẽ được xử lý theo quy định</li>
              <li>Vui lòng giữ mã đặt phòng để check-in</li>
            </ul>
          </div>
        </section>
      </section>
    </main>
  )
}

const processSteps = [
  ['Kiểm tra thông tin', 'Hệ thống kiểm tra thông tin đặt phòng'],
  ['Xác nhận đặt phòng', 'Bạn sẽ nhận mã đặt phòng qua email/SMS'],
  ['Thanh toán', 'Hoàn tất thanh toán theo phương thức đã chọn'],
  ['Nhận phòng & check-in', 'Đến đúng giờ và check-in bằng mã đặt phòng'],
] as const

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  )
}

function InfoSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-6">
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full bg-[#F0EDE6] px-3 py-1 text-sm text-[#5C5348]">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function SelectedAddOnsSection({ addOns }: { addOns: BookingAddOn[] }) {
  return (
    <div className="mt-6">
      <h3 className="font-display text-lg font-bold">Dịch vụ thuê thêm</h3>
      {addOns.length > 0 ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {addOns.map((addon) => (
            <div
              key={addon.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] px-3 py-2 text-sm"
            >
              <span className="font-medium text-[#5C5348]">{addon.name}</span>
              <span className="font-display font-semibold text-[#1A1C1E]">{formatCurrency(addon.price)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-4 text-sm text-[#5C5348]">
          Chưa chọn dịch vụ thuê thêm.
        </div>
      )}
    </div>
  )
}

function PaymentRow({ label, value, green = false }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-[#5C5348]">{label}</span>
      <span className={['font-semibold', green ? 'text-[#0A4D27]' : 'text-[#1A1C1E]'].join(' ')}>
        {value}
      </span>
    </div>
  )
}

function PaymentMethodOption({
  method,
  active,
  onSelect,
}: {
  method: PaymentMethod
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'min-h-16 rounded-2xl px-3 text-left font-display text-xs font-semibold transition',
        active
          ? 'border border-[#FF7518] bg-[#FFE8D6] text-[#6B3200]'
          : 'border border-[#E8E4DC] bg-white text-[#5C5348] hover:bg-[#FAF8F4]',
      ].join(' ')}
      aria-pressed={active}
    >
      <span className="flex items-center justify-between gap-2">
        <span>{method.label}</span>
        {active && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF7518] text-xs text-white">✓</span>}
      </span>
    </button>
  )
}

function PaymentInstruction({ method }: { method: PaymentMethod }) {
  if (method.id === 'bank_transfer') {
    return (
      <div className="mt-5 text-center">
        <p className="mb-2 text-sm font-semibold text-[#5C5348]">Quét mã để thanh toán</p>
        <QrPattern />
      </div>
    )
  }

  return (
    <div className="mt-5 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-4 text-sm text-[#5C5348]">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFE8D6] font-display text-lg font-bold text-[#FF7518]">
        {method.id === 'e_wallet' ? 'Ví' : '₫'}
      </div>
      <p>{method.description}</p>
    </div>
  )
}

function QrPattern() {
  const filledBlocks = new Set([0, 1, 2, 4, 5, 7, 9, 10, 13, 15, 17, 18, 20, 21, 22, 24])

  return (
    <div className="mx-auto grid h-28 w-28 grid-cols-5 gap-1 rounded-2xl border border-dashed border-[#FF7518] bg-[#FAF8F4] p-3">
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

function ProcessStep({ step, index }: { step: readonly [string, string]; index: number }) {
  return (
    <div>
      <div
        className={[
          'mb-3 flex h-9 w-9 items-center justify-center rounded-full font-display text-sm font-bold text-white',
          index === 1 ? 'bg-[#FF7518]' : 'bg-[#042A16]',
        ].join(' ')}
      >
        {index + 1}
      </div>
      <p className="font-display font-semibold">{step[0]}</p>
      <p className="mt-1 text-sm text-[#5C5348]">{step[1]}</p>
    </div>
  )
}
