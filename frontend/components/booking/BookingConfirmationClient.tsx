'use client'

import axios from 'axios'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import BandRoomHeader from '@/components/layout/BandRoomHeader'
import { useAuth } from '@/contexts/AuthContext'
import {
  DEFAULT_BOOKING_DATE,
  DEFAULT_START_TIME,
  EMPTY_NOTE_TEXT,
  bookingRooms,
  calculateEndTime,
  detectRoomCategory,
  findBookingRoom,
  formatCurrency,
  formatDisplayDate,
  getAddOnsTotal,
  getRoomSubtotal,
  getSelectedAddOns,
  normalizeDuration,
  parseAddonIds,
  getBookingRoomOrFallback,
  paymentMethods,
  type BookingRoom,
  type PaymentMethod,
  type PaymentMethodId,
} from '@/components/booking/booking-data'
import { resolveBookingRoom } from '@/lib/booking-room-service'
import { validateDiscountCode, type AppliedDiscount } from '@/lib/discount-service'
import {
  CHECKOUT_PATH,
  pendingBookingToSearchParams,
  savePendingBooking,
  type PendingBooking,
} from '@/lib/pending-booking'
import { createBooking, mapPaymentMethodToBackend } from '@/lib/booking/bookingApi'

export default function BookingConfirmationClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const roomId = searchParams.get('roomId')
  const staticRoom = useMemo(() => findBookingRoom(roomId), [roomId])
  const fallbackRoom = staticRoom ?? bookingRooms[0]
  const [room, setRoom] = useState(fallbackRoom)
  const [roomMissing, setRoomMissing] = useState(Boolean(roomId && !staticRoom))
  const [isResolvingRoom, setIsResolvingRoom] = useState(Boolean(roomId && !staticRoom))
  const fallbackRoom = getBookingRoomOrFallback(roomId)
  const apiRoom = getApiBookingRoom(searchParams)
  const displayRoom = apiRoom ?? fallbackRoom
  const isApiRoom = apiRoom !== null
  const roomMissing = !isApiRoom && Boolean(roomId && !findBookingRoom(roomId))
  const selectionHref = isApiRoom ? '/customer/booking' : '/#rooms'
  const date = searchParams.get('date') || DEFAULT_BOOKING_DATE
  const startTime = searchParams.get('startTime') || DEFAULT_START_TIME
  const duration = normalizeDuration(searchParams.get('duration'))
  const endTime = searchParams.get('endTime') || calculateEndTime(startTime, duration)
  const roomSubtotal = displayRoom.pricePerHour * duration
  const note = searchParams.get('note')?.trim() || EMPTY_NOTE_TEXT
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('bank_transfer')
  const [confirmError, setConfirmError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const activePaymentMethod = paymentMethods.find((method) => method.id === paymentMethod) ?? paymentMethods[0]

  useEffect(() => {
    let mounted = true

    setRoom(fallbackRoom)
    setRoomMissing(Boolean(roomId && !staticRoom))
    setIsResolvingRoom(Boolean(roomId && !staticRoom))

    async function loadRoom() {
      const resolvedRoom = await resolveBookingRoom(roomId)
      if (!mounted) return

      setRoom(resolvedRoom ?? fallbackRoom)
      setRoomMissing(Boolean(roomId && !resolvedRoom))
      setIsResolvingRoom(false)
    }

    void loadRoom()

    return () => {
      mounted = false
    }
  }, [fallbackRoom, roomId, staticRoom])

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
        bookingId: room.code,
        roomId: room.id,
        subtotal,
      })

      if (!result.valid || !result.code || result.discountAmount === undefined) {
        setAppliedDiscount(null)
        setDiscountError(result.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn.')
        return
      }

      setAppliedDiscount({
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
    setAppliedDiscount(null)
    setDiscountCode('')
    setDiscountError('')
    setDiscountMessage('')
  }

  const handleConfirm = () => {
    if (isAuthLoading) {
      setConfirmError('Hệ thống đang kiểm tra phiên đăng nhập. Vui lòng thử lại sau vài giây.')
      return
    }

    if (isResolvingRoom) {
      setConfirmError('Đang tải thông tin phòng. Vui lòng thử lại sau vài giây.')
      return
    }

  const handleConfirm = async () => {
    if (!roomId || roomMissing) {
      setConfirmError('Vui long quay lai buoc chon phong va chon mot phong hop le.')
      return
    }

    if (!date || !startTime || !duration || !paymentMethod) {
      setConfirmError('Vui long kiem tra ngay dat, gio bat dau, thoi luong va phuong thuc thanh toan.')
      return
    }

    setConfirmError('')
    setIsSubmitting(true)

    try {
      const booking = await createBooking({
        roomId: displayRoom.id,
        date,
        startTime,
        endTime,
        paymentMethod: mapPaymentMethodToBackend(paymentMethod),
        note: note === EMPTY_NOTE_TEXT ? '' : note,
      })

      const params = new URLSearchParams({
        bookingId: booking.bookingCode || String(booking.bookingId),
        backendBookingId: String(booking.bookingId),
        roomId: displayRoom.id,
        method: paymentMethod,
      })

      router.push(`/customer/checkout?${params.toString()}`)
    } catch (error) {
      setConfirmError(getBookingErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F2EC] text-[#1A1C1E]">
      <BandRoomHeader />

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2 font-display text-sm text-[#5C5348]">
              <Link href="/" className="hover:text-[#1A1C1E]">
                Trang chu
              </Link>
              <span>/</span>
              <Link href={selectionHref} className="hover:text-[#1A1C1E]">
                Phong tap
              </Link>
              <span>/</span>
              <span className="text-[#1A1C1E]">Xac nhan dat phong</span>
            </div>

            <h1 className="font-display text-4xl font-bold tracking-tight">Xac nhan dat phong</h1>
            <p className="mt-2 text-[#5C5348]">
              Buoc nay se tao booking that tren backend truoc khi chuyen sang checkout.
            </p>
          </div>

          <span className="w-fit rounded-full bg-[#0A4D27] px-4 py-2 font-display text-sm font-semibold text-white">
            San sang xac nhan
          </span>
        </div>

        {roomMissing && !isResolvingRoom && (
          <div className="mb-6 rounded-2xl border border-[#FF7518]/30 bg-[#FFE8D6] px-4 py-3 text-sm font-medium text-[#6B3200]">
            Khong tim thay phong da chon. He thong dang hien thi phong mac dinh de ban kiem tra.
          </div>
        )}

        {isApiRoom && (
          <div className="mb-6 rounded-2xl border border-[#0A4D27]/20 bg-[#E8F5EC] px-4 py-3 text-sm font-medium text-[#0A4D27]">
            Flow nay da bo add-on va discount mock. Xac nhan xong se tao booking backend va mo checkout tu booking vua tao.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <section className="rounded-[24px] border border-[#E8E4DC] bg-white p-6 shadow-[0_4px_24px_rgba(26,28,30,0.06)]">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold">Thong tin dat phong</h2>
              {displayRoom.badge && (
                <span className="rounded-full bg-[#FFE8D6] px-3 py-1 font-display text-xs font-bold uppercase tracking-wide text-[#6B3200]">
                  {displayRoom.badge}
                </span>
              )}
            </div>

            {displayRoom.image ? (
              <Image
                src={displayRoom.image}
                alt={displayRoom.name}
                width={900}
                height={420}
                className={`h-[260px] w-full rounded-2xl object-cover ${displayRoom.imageClassName}`}
                priority
              />
            ) : (
              <div className="flex h-[260px] w-full items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top,#FFE8D6,transparent_55%),linear-gradient(135deg,#F5F2EC,#E8E4DC)] px-6 text-center">
                <div>
                  <p className="font-display text-2xl font-bold text-[#6B3200]">{displayRoom.name}</p>
                  <p className="mt-2 text-sm text-[#5C5348]">Backend chua cung cap anh phong.</p>
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <h3 className="font-display text-2xl font-bold">{displayRoom.name}</h3>
              {typeof displayRoom.rating === 'number' && (
                <span className="font-display font-semibold text-[#B45309]">★ {displayRoom.rating.toFixed(1)}</span>
              )}
            </div>

            <p className="mt-1 text-[#5C5348]">{displayRoom.type}</p>

            <div className="mt-6 grid gap-4 border-b border-[#E8E4DC] pb-6 sm:grid-cols-2">
              <Detail label="Ngay dat" value={formatDisplayDate(date)} />
              <Detail label="Khung gio" value={`${startTime} - ${endTime}`} />
              <Detail label="Thoi luong" value={`${duration} gio`} />
              <Detail label="So nguoi" value={displayRoom.capacity} />
              <Detail label="Dia diem" value={displayRoom.location} />
            </div>

            <InfoSection title="Thiet bi hien thi" items={displayRoom.includedEquipments} />

            <div className="mt-6 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-4 text-sm text-[#5C5348]">
              Add-on va discount khong con duoc tinh o buoc nay vi backend chua co contract tuong ung.
            </div>

            <div className="mt-6">
              <h3 className="font-display text-lg font-bold">Ghi chu khach hang</h3>
              <div className="mt-3 whitespace-pre-wrap rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-4 text-[#5C5348]">
                {note}
              </div>
            </div>
          </section>

          <aside className="h-fit rounded-[24px] border border-[#E8E4DC] bg-white p-6 shadow-[0_4px_24px_rgba(26,28,30,0.06)] lg:sticky lg:top-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">
                  Tom tat thanh toan
                </p>
                <p className="mt-1 font-display font-semibold">Booking se duoc tao sau khi xac nhan</p>
              </div>
              <span className="rounded-full bg-[#FFE8D6] px-3 py-1 font-display text-xs font-bold text-[#6B3200]">
                Cho thanh toan
              </span>
            </div>

            <PaymentRow label="Gia phong" value={`${formatCurrency(displayRoom.pricePerHour)} / gio`} />
            <PaymentRow label="Thoi luong" value={`${duration} gio`} />

            <div className="my-4 h-px bg-[#E8E4DC]" />

            <PaymentRow label="Tien phong" value={formatCurrency(roomSubtotal)} />
            <PaymentRow label="Dich vu thue them" value="Khong ap dung" />

            <div className="my-5 rounded-2xl bg-[#FAF8F4] p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="font-display text-lg font-bold">Tong thanh toan</span>
                <span className="font-display text-3xl font-bold text-[#FF7518]">{formatCurrency(roomSubtotal)}</span>
              </div>
            </div>

            <h3 className="font-display text-lg font-bold">Phuong thuc thanh toan</h3>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
              {paymentMethods.map((method) => (
                <PaymentMethodOption
                  key={method.id}
                  method={method}
                  active={paymentMethod === method.id}
                  onSelect={() => {
                    setPaymentMethod(method.id)
                    setConfirmError('')
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

            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={isSubmitting}
              className="mt-6 h-12 w-full rounded-2xl bg-[#FF7518] font-display font-semibold text-white transition hover:bg-[#E6640F] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Dang xu ly...' : 'Xac nhan dat phong'}
            </button>

            <Link
              href={selectionHref}
              className="mt-3 flex h-12 w-full items-center justify-center rounded-2xl border border-[#C9C2B6] bg-transparent font-display font-semibold text-[#1A1C1E] transition hover:bg-[#FAF8F4]"
            >
              Quay lai chon phong
            </Link>
          </aside>
        </div>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="rounded-[24px] border border-[#E8E4DC] bg-white p-6 shadow-[0_4px_24px_rgba(26,28,30,0.06)]">
            <h3 className="font-display text-lg font-bold">Quy trinh sau khi dat phong</h3>
            <div className="mt-6 grid gap-5 md:grid-cols-4">
              {processSteps.map((step, index) => (
                <ProcessStep key={step[0]} step={step} index={index} />
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-[#E8E4DC] bg-white p-6 shadow-[0_4px_24px_rgba(26,28,30,0.06)]">
            <h3 className="font-display text-lg font-bold">Chinh sach dat phong</h3>
            <ul className="mt-4 space-y-3 text-sm text-[#5C5348]">
              <li>Co the huy truoc 2 gio.</li>
              <li>Den muon qua 15 phut can lien he nhan vien.</li>
              <li>Thiet bi hu hong phat sinh se duoc xu ly theo quy dinh.</li>
              <li>Vui long giu ma dat phong de check-in.</li>
            </ul>
          </div>
        </section>
      </section>
    </main>
  )
}

const processSteps = [
  ['Kiem tra thong tin', 'He thong kiem tra thong tin dat phong'],
  ['Tao booking', 'Backend tao booking that va tra ve ma dat phong'],
  ['Thanh toan', 'Checkout doc lai booking vua tao va tao phien thanh toan'],
  ['Nhan phong & check-in', 'Den dung gio va check-in bang ma dat phong'],
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

function PaymentRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-[#5C5348]">{label}</span>
      <span className="font-semibold text-[#1A1C1E]">{value}</span>
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
      <div className="mt-5 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-4 text-sm text-[#5C5348]">
        Backend se tao phien thanh toan online va chuyen ban sang trang ket qua giao dich.
      </div>
    )
  }

  return (
    <div className="mt-5 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-4 text-sm text-[#5C5348]">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFE8D6] font-display text-lg font-bold text-[#FF7518]">
        {method.id === 'e_wallet' ? 'Vi' : '₫'}
      </div>
      <p>{method.description}</p>
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

function getBookingErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || 'Khong the tao booking. Vui long thu lai.'
  }

  return error instanceof Error ? error.message : 'Khong the tao booking. Vui long thu lai.'
}

function formatCapacityLabel(value: string | null, fallback: string) {
  if (!value) return fallback

  const normalized = value.trim()
  if (!normalized) return fallback
  if (/\D/.test(normalized)) return normalized

  return `Toi da ${normalized} nguoi`
}

function getApiBookingRoom(searchParams: { get(name: string): string | null }): BookingRoom | null {
  const source = searchParams.get('source')

  if (source !== 'dashboard-booking' && source !== 'api-booking') {
    return null
  }

  const roomId = searchParams.get('roomId')
  const roomName = searchParams.get('roomName')?.trim()

  if (!roomId || !roomName) {
    return null
  }

  const roomType = searchParams.get('roomType')?.trim() || 'Practice Room'
  const roomHighlights = parseCsvParam(searchParams.get('roomHighlights'))
  const rawPrice = Number(searchParams.get('pricePerHour'))
  const pricePerHour = Number.isFinite(rawPrice) && rawPrice > 0 ? rawPrice : 0
  const roomImage = searchParams.get('roomImage')?.trim()
  const safeImage = roomImage?.startsWith('/') ? roomImage : undefined
  const category = detectRoomCategory(roomType)

  return {
    id: roomId,
    code: `PENDING-${roomId}`,
    name: roomName,
    category,
    categoryLabel: roomType,
    type: roomType,
    roomTierId: undefined,
    roomTierName: roomType,
    roomTierDescription: undefined,
    badge: undefined,
    rating: undefined,
    reviews: undefined,
    capacity: formatCapacityLabel(searchParams.get('roomCapacity'), 'Chua ro suc chua'),
    location: searchParams.get('roomLocation')?.trim() || 'Band Room Studio',
    image: safeImage,
    imageClassName: 'object-center',
    pricePerHour,
    equipments: roomHighlights,
    includedEquipments: roomHighlights.length > 0 ? roomHighlights : [roomType],
    addons: [],
    description: searchParams.get('roomDescription')?.trim() || undefined,
    isAvailable: false,
    availabilityKnown: false,
    nextAvailableTime: undefined,
    note: undefined,
  }
}

function parseCsvParam(value: string | null) {
  if (!value) return []

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeDuration(value: string | null) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}
