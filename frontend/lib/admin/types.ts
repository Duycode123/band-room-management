/** Aligns with backend BookingStatus for future API integration. */
export type BookingStatus =
  | 'CHO_THANH_TOAN'
  | 'DA_THANH_TOAN'
  | 'DA_CHECKIN'
  | 'HOAN_TAT'
  | 'DA_HUY'

export type PaymentStatus = 'PAID' | 'UNPAID' | 'PENDING'

export type AdminBooking = {
  bookingId: number
  bookingCode: string
  customerName: string
  customerEmail: string
  customerPhone: string
  roomId: number
  roomName: string
  roomType: string
  startTime: string
  endTime: string
  durationHours: number
  equipment: string[]
  totalPrice: number
  paymentStatus: PaymentStatus
  bookingStatus: BookingStatus
  note?: string
}

export type BookingFilters = {
  query: string
  bookingStatus: BookingStatus | 'ALL'
  paymentStatus: PaymentStatus | 'ALL'
  date: string
}
