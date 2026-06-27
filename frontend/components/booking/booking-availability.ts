import { getSlotEndTime, timeToMinutes } from '@/components/booking/booking-time-utils'

export type ExistingBooking = {
  id: string
  roomId: string
  date: string
  startTime: string
  endTime: string
  status: 'PENDING' | 'CONFIRMED' | 'PAID' | 'CANCELLED'
}

const blockingStatuses = new Set<ExistingBooking['status']>(['PENDING', 'CONFIRMED', 'PAID'])

const mockExistingBookings: ExistingBooking[] = [
  {
    id: 'BK001',
    roomId: 'studio-a',
    date: '2026-06-28',
    startTime: '13:00',
    endTime: '15:00',
    status: 'CONFIRMED',
  },
  {
    id: 'BK002',
    roomId: 'studio-a',
    date: '2026-06-28',
    startTime: '18:00',
    endTime: '20:00',
    status: 'PAID',
  },
  {
    id: 'BK003',
    roomId: 'studio-a',
    date: '2026-06-28',
    startTime: '21:00',
    endTime: '22:00',
    status: 'CANCELLED',
  },
  {
    id: 'BK004',
    roomId: 'practice-pod-a',
    date: '2026-06-28',
    startTime: '09:00',
    endTime: '11:00',
    status: 'PENDING',
  },
  {
    id: 'BK005',
    roomId: 'practice-pod-b',
    date: '2026-06-29',
    startTime: '14:00',
    endTime: '17:00',
    status: 'CONFIRMED',
  },
  {
    id: 'BK006',
    roomId: 'the-vault',
    date: '2026-06-30',
    startTime: '10:00',
    endTime: '13:00',
    status: 'PAID',
  },
]

export async function getRoomAvailability(roomId: string, date: string): Promise<ExistingBooking[]> {
  await delay(300 + Math.round(Math.random() * 300))

  return mockExistingBookings.filter((booking) => booking.roomId === roomId && booking.date === date)
}

export function isBlockingBooking(booking: ExistingBooking) {
  return blockingStatuses.has(booking.status)
}

export function isSlotBooked(slotStart: string, bookings: ExistingBooking[]) {
  const slotEnd = getSlotEndTime(slotStart)
  const slotStartMinutes = timeToMinutes(slotStart)
  const slotEndMinutes = timeToMinutes(slotEnd)

  return bookings.some((booking) => {
    if (!isBlockingBooking(booking)) return false

    const bookingStart = timeToMinutes(booking.startTime)
    const bookingEnd = timeToMinutes(booking.endTime)
    return slotStartMinutes < bookingEnd && slotEndMinutes > bookingStart
  })
}

function delay(ms: number) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms))
}
