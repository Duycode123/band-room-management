import type { BookingStatus, PaymentStatus } from '@/lib/admin/types'
import { BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/admin/bookingLabels'

const bookingStyles: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'bg-tertiary-container text-on-tertiary-container',
  PAID: 'bg-primary-container text-on-primary-container',
  CHECKED_IN: 'bg-secondary-container/30 text-secondary',
  COMPLETED: 'bg-secondary-container text-on-secondary-container',
  CANCELLED: 'bg-error-container text-on-error-container',
}

const paymentStyles: Record<PaymentStatus, string> = {
  PAID: 'bg-secondary-container text-on-secondary-container',
  UNPAID: 'bg-error-container text-on-error-container',
  PENDING: 'bg-tertiary-container text-on-tertiary-container',
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={[
        'inline-flex rounded-full px-2.5 py-0.5 font-display text-[10px] font-semibold uppercase tracking-wide',
        bookingStyles[status],
      ].join(' ')}
    >
      {BOOKING_STATUS_LABELS[status]}
    </span>
  )
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={[
        'inline-flex rounded-full px-2.5 py-0.5 font-display text-[10px] font-semibold uppercase tracking-wide',
        paymentStyles[status],
      ].join(' ')}
    >
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  )
}
