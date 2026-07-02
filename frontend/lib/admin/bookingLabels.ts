import type { BookingStatus, PaymentStatus } from './types'

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'Cho thanh toan',
  PAID: 'Da thanh toan',
  CHECKED_IN: 'Dang su dung',
  COMPLETED: 'Hoan tat',
  CANCELLED: 'Da huy',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PAID: 'Da thanh toan',
  UNPAID: 'Chua thanh toan',
  PENDING: 'Dang cho',
}

export const BOOKING_STATUS_OPTIONS: BookingStatus[] = [
  'PENDING_PAYMENT',
  'PAID',
  'CHECKED_IN',
  'COMPLETED',
  'CANCELLED',
]

export const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = ['PAID', 'UNPAID', 'PENDING']
