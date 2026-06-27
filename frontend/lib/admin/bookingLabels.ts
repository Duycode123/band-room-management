import type { BookingStatus, PaymentStatus } from './types'

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  CHO_THANH_TOAN: 'Chờ thanh toán',
  DA_THANH_TOAN: 'Đã thanh toán',
  DA_CHECKIN: 'Đang sử dụng',
  HOAN_TAT: 'Hoàn tất',
  DA_HUY: 'Đã hủy',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PAID: 'Đã thanh toán',
  UNPAID: 'Chưa thanh toán',
  PENDING: 'Đang chờ',
}

export const BOOKING_STATUS_OPTIONS: BookingStatus[] = [
  'CHO_THANH_TOAN',
  'DA_THANH_TOAN',
  'DA_CHECKIN',
  'HOAN_TAT',
  'DA_HUY',
]

export const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = ['PAID', 'UNPAID', 'PENDING']
