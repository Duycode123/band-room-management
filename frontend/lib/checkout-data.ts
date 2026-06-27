import {
  DEFAULT_BOOKING_DATE,
  DEFAULT_DURATION,
  DEFAULT_START_TIME,
  EMPTY_NOTE_TEXT,
  bookingAddOns,
  bookingRooms,
  calculateEndTime,
  findBookingRoom,
  formatCurrency,
  formatDisplayDate,
  getSelectedAddOns,
  normalizeDuration,
  parseAddonIds,
} from '@/components/booking/booking-data'
import type { AppliedDiscount } from '@/lib/discount-service'
import type { PaymentMethod, PaymentStatus } from '@/lib/payment-service'

export type CheckoutBooking = {
  bookingId: string
  roomId: string
  roomName: string
  categoryLabel: string
  image: string
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
    label: 'Chuyển khoản ngân hàng',
    description: 'Quét mã và chuyển khoản theo nội dung đặt phòng.',
  },
  {
    id: 'e_wallet',
    label: 'Ví điện tử',
    description: 'Chuyển đến ví điện tử sau khi bấm thanh toán.',
  },
  {
    id: 'cash',
    label: 'Thanh toán tại quầy',
    description: 'Giữ lịch và hoàn tất thanh toán khi đến nhận phòng.',
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
  return paymentMethodOptions.find((option) => option.id === method)?.label ?? 'Chưa xác định'
}

export function getReturnStatusContent(status?: string | null) {
  const normalizedStatus = normalizePaymentStatus(status)

  const content = {
    success: {
      tone: 'success',
      icon: '✓',
      title: 'Thanh toán thành công',
      message: 'Lịch đặt của bạn đã được xác nhận.',
      primaryLabel: 'Xem lịch đặt phòng',
      primaryHref: '/customer/bookings',
    },
    failed: {
      tone: 'failed',
      icon: '!',
      title: 'Thanh toán thất bại',
      message: 'Giao dịch chưa hoàn tất. Vui lòng thử lại hoặc chọn phương thức khác.',
      primaryLabel: 'Thử lại thanh toán',
      primaryHref: '/customer/checkout',
    },
    pending: {
      tone: 'pending',
      icon: '…',
      title: 'Đang xác minh thanh toán',
      message: 'Giao dịch của bạn đang được xử lý. Chúng tôi sẽ cập nhật trạng thái khi có xác nhận.',
      primaryLabel: 'Xem lịch đặt phòng',
      primaryHref: '/customer/bookings',
    },
    cancelled: {
      tone: 'cancelled',
      icon: '×',
      title: 'Thanh toán đã bị hủy',
      message: 'Bạn đã hủy quá trình thanh toán. Bạn có thể thử lại bất cứ lúc nào.',
      primaryLabel: 'Thử lại thanh toán',
      primaryHref: '/customer/checkout',
    },
    unknown: {
      tone: 'unknown',
      icon: '?',
      title: 'Không xác định được trạng thái thanh toán',
      message: 'Vui lòng kiểm tra lịch đặt phòng hoặc liên hệ hỗ trợ.',
      primaryLabel: 'Quay về trang chủ',
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
  await new Promise((resolve) => globalThis.setTimeout(resolve, 320))

  const bookingId = searchParams.get('bookingId')
  if (!bookingId) return null

  const roomId = searchParams.get('roomId') || bookingRooms.find((room) => room.code === bookingId)?.id || 'studio-a'
  const room = findBookingRoom(roomId) ?? bookingRooms.find((item) => item.code === bookingId)
  if (!room) return null

  const date = searchParams.get('date') || DEFAULT_BOOKING_DATE
  const startTime = searchParams.get('startTime') || DEFAULT_START_TIME
  const duration = normalizeDuration(searchParams.get('duration') || DEFAULT_DURATION)
  const addonIds = parseAddonIds(searchParams.get('addons'))
  const selectedAddOns = addonIds.length > 0 ? getSelectedAddOns(addonIds) : bookingAddOns.slice(0, 2)
  const note = searchParams.get('note')?.trim() || EMPTY_NOTE_TEXT

  return {
    bookingId,
    roomId: room.id,
    roomName: room.name,
    categoryLabel: room.categoryLabel,
    image: room.image,
    imageClassName: room.imageClassName,
    date,
    startTime,
    endTime: calculateEndTime(startTime, duration),
    duration,
    capacity: room.capacity,
    location: room.location,
    pricePerHour: room.pricePerHour,
    equipments: room.includedEquipments,
    addons: selectedAddOns,
    discount: 0,
    serviceFee: 0,
    note,
  }
}
