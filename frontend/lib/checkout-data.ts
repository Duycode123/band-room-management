import {
  detectRoomCategory,
  formatCurrency,
  formatDisplayDate,
} from '@/components/booking/booking-data'
import { fetchRooms } from '@/lib/booking/bookingApi'
import type { AppliedDiscount } from '@/lib/discount-service'
import { getBookingDetail } from '@/lib/customer-booking-service'
import type { PaymentMethod, PaymentStatus } from '@/lib/payment-service'

export type CheckoutBooking = {
  bookingId: string
  backendBookingId?: number
  roomId: string
  roomName: string
  categoryLabel: string
  image?: string
  imageClassName?: string
  date: string
  startTime: string
  endTime: string
  duration: number
  capacity: string
  location: string
  pricePerHour: number
  equipments: string[]
  addons: {
    id: string
    name: string
    price: number
  }[]
  discount: number
  serviceFee: number
  note?: string
  status?: string
}

export type CheckoutSummary = {
  roomPrice: number
  addonsTotal: number
  serviceFee: number
  discount: number
  subtotal: number
  total: number
}

export const paymentMethodOptions: Array<{
  id: PaymentMethod
  label: string
  description: string
}> = [
  {
    id: 'bank_transfer',
    label: 'Chuyen khoan ngan hang',
    description: 'Backend tao phien thanh toan va chuyen ban sang trang ket qua giao dich.',
  },
  {
    id: 'e_wallet',
    label: 'Vi dien tu',
    description: 'Backend luu giao dich online va dong bo trang thai thanh toan.',
  },
  {
    id: 'cash',
    label: 'Thanh toan tai quay',
    description: 'Booking duoc giu o trang thai cho thanh toan tai studio.',
  },
]

export function calculateCheckoutSummary(booking: CheckoutBooking, appliedDiscount?: AppliedDiscount | null): CheckoutSummary {
  const roomPrice = booking.pricePerHour * booking.duration
  const addonsTotal = booking.addons.reduce((total, addon) => total + addon.price, 0)
  const subtotal = roomPrice + addonsTotal
  const discount = Math.min(appliedDiscount?.discountAmount ?? 0, subtotal)
  const total = Math.max(0, subtotal - discount)

  return {
    roomPrice,
    addonsTotal,
    serviceFee: booking.serviceFee,
    discount,
    subtotal,
    total,
  }
}

export { formatCurrency, formatDisplayDate }

export function getPaymentMethodLabel(method?: string | null) {
  return paymentMethodOptions.find((option) => option.id === method)?.label
    ?? (method === 'online' ? 'Thanh toan online' : 'Chua xac dinh')
}

export function getReturnStatusContent(status?: string | null) {
  const normalizedStatus = normalizePaymentStatus(status)

  const content = {
    success: {
      tone: 'success',
      icon: 'OK',
      title: 'Thanh toan thanh cong',
      message: 'Booking cua ban da duoc cap nhat thanh toan tren backend.',
      primaryLabel: 'Xem lich dat phong',
      primaryHref: '/customer/bookings',
    },
    failed: {
      tone: 'failed',
      icon: '!',
      title: 'Thanh toan that bai',
      message: 'Giao dich chua hoan tat. Vui long thu lai hoac chon cach thanh toan khac.',
      primaryLabel: 'Thu lai thanh toan',
      primaryHref: '/customer/checkout',
    },
    pending: {
      tone: 'pending',
      icon: '...',
      title: 'Dang cho thanh toan',
      message: 'Backend da luu phien thanh toan va dang cho xac nhan hoan tat.',
      primaryLabel: 'Xem lich dat phong',
      primaryHref: '/customer/bookings',
    },
    cancelled: {
      tone: 'cancelled',
      icon: 'X',
      title: 'Thanh toan da bi huy',
      message: 'Phien thanh toan da bi huy. Ban co the mo lai checkout bat cu luc nao.',
      primaryLabel: 'Thu lai thanh toan',
      primaryHref: '/customer/checkout',
    },
    unknown: {
      tone: 'unknown',
      icon: '?',
      title: 'Khong xac dinh duoc trang thai thanh toan',
      message: 'Vui long kiem tra lai giao dich hoac lien he ho tro.',
      primaryLabel: 'Quay ve trang chu',
      primaryHref: '/',
    },
  } as const

  return content[normalizedStatus]
}

export function normalizePaymentStatus(status?: string | null): PaymentStatus | 'unknown' {
  if (status === 'success' || status === 'failed' || status === 'pending' || status === 'cancelled') {
    return status
  }

  return 'unknown'
}

export async function getCheckoutBookingFromParams(searchParams: URLSearchParams): Promise<CheckoutBooking | null> {
  const bookingId = searchParams.get('bookingId')
  if (!bookingId) return null

  const rawBackendBookingId = Number(searchParams.get('backendBookingId'))
  const backendBookingId = Number.isFinite(rawBackendBookingId) && rawBackendBookingId > 0 ? rawBackendBookingId : undefined
  const booking = await getBookingDetail(bookingId, backendBookingId)

  if (!booking) {
    return null
  }

  const rooms = await fetchRooms().catch(() => [])
  const room = rooms.find((item) => item.id === booking.roomId)
  const categoryLabel = room?.roomTypeName?.trim() || inferCategoryLabel(searchParams.get('roomType'))
  const image = room?.imageUrl?.trim()?.startsWith('/') ? room.imageUrl.trim() : undefined
  const pricePerHour = room?.pricePerHour ?? inferPricePerHour(searchParams.get('pricePerHour'), booking.totalAmount)
  const capacity = room ? `Toi da ${room.capacity} nguoi` : 'Chua ro suc chua'
  const location = room?.location || searchParams.get('roomLocation')?.trim() || 'Band Room Studio'
  const equipments = room?.equipment?.length ? room.equipment : inferEquipments(searchParams.get('equipments'), categoryLabel)

  return {
    bookingId: booking.bookingId,
    backendBookingId: booking.backendBookingId,
    roomId: booking.roomId,
    roomName: booking.roomName,
    categoryLabel,
    image,
    imageClassName: 'object-center',
    date: normalizeDateLabel(booking.startDateTime, booking.date),
    startTime: booking.startTime,
    endTime: booking.endTime,
    duration: calculateDurationHours(booking.startDateTime, booking.endDateTime, booking.startTime, booking.endTime),
    capacity,
    location,
    pricePerHour,
    equipments,
    addons: [],
    discount: 0,
    serviceFee: 0,
    note: booking.note,
    status: booking.status,
  }
}

function inferCategoryLabel(roomType?: string | null) {
  if (roomType?.trim()) return roomType.trim()
  const category = detectRoomCategory(roomType)
  return category === 'recording'
    ? 'Recording Room'
    : category === 'premium'
      ? 'Premium Room'
      : category === 'band'
        ? 'Band Rehearsal Room'
        : 'Practice Room'
}

function inferEquipments(equipments?: string | null, fallback?: string) {
  const items = (equipments || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return items.length > 0 ? items : [fallback || 'Practice Room']
}

function inferPricePerHour(rawPricePerHour: string | null, totalAmount: number) {
  const parsed = Number(rawPricePerHour)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : totalAmount
}

function normalizeDateLabel(rawDateTime: string | undefined, fallbackDateLabel: string) {
  if (!rawDateTime) return fallbackDateLabel

  const date = new Date(rawDateTime)
  if (Number.isNaN(date.getTime())) return fallbackDateLabel

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function calculateDurationHours(
  rawStartDateTime?: string,
  rawEndDateTime?: string,
  startTime?: string,
  endTime?: string,
) {
  if (rawStartDateTime && rawEndDateTime) {
    const start = new Date(rawStartDateTime).getTime()
    const end = new Date(rawEndDateTime).getTime()

    if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
      return Math.max(1, Math.round((end - start) / (1000 * 60 * 60)))
    }
  }

  if (!startTime || !endTime) return 1

  const [startHour = 0, startMinute = 0] = startTime.split(':').map(Number)
  const [endHour = 0, endMinute = 0] = endTime.split(':').map(Number)
  const duration = (endHour * 60 + endMinute - (startHour * 60 + startMinute)) / 60

  return duration > 0 ? duration : 1
}
