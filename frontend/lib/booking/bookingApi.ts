import { PRACTICE_ROOMS } from './mockData'
import type { PracticeRoom, SlotStatus, TimeSlot } from './types'

const BOOKINGS_KEY = 'bandhub_local_bookings'
const OPEN_HOUR = 8
const CLOSE_HOUR = 24

function hashCode(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

function parseSlotStart(date: string, start: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = start.split(':').map(Number)
  return new Date(year, month - 1, day, hour, minute, 0, 0)
}

type StoredBooking = {
  roomId: string
  date: string
  slotIds: string[]
}

function readLocalBookings(): StoredBooking[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]') as Array<
      StoredBooking & { slotId?: string }
    >
    return raw.map((b) => ({
      roomId: b.roomId,
      date: b.date,
      slotIds: b.slotIds ?? (b.slotId ? [b.slotId] : []),
    }))
  } catch {
    return []
  }
}

function writeLocalBooking(entry: StoredBooking) {
  const current = readLocalBookings()
  current.push(entry)
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(current))
}

function buildHourSlots(date: string): Omit<TimeSlot, 'status'>[] {
  const slots: Omit<TimeSlot, 'status'>[] = []
  for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
    const start = `${pad(hour)}:00`
    const end = `${pad(hour + 1)}:00`
    slots.push({
      id: `${date}-${start}`,
      start,
      end,
      label: `${start} – ${end}`,
    })
  }
  return slots
}

function resolveSlotStatus(
  roomId: string,
  date: string,
  slot: Omit<TimeSlot, 'status'>,
  now: Date,
): SlotStatus {
  const slotStart = parseSlotStart(date, slot.start)
  if (slotStart.getTime() <= now.getTime()) return 'past'

  const localBooked = readLocalBookings().some(
    (b) => b.roomId === roomId && b.date === date && b.slotIds.includes(slot.id),
  )
  if (localBooked) return 'booked'

  // Mô phỏng người khác đặt — thay đổi theo phút (real-time feel)
  const epochMinute = Math.floor(now.getTime() / 60_000)
  const seed = hashCode(`${roomId}-${date}-${slot.id}-${epochMinute}`)
  if (seed % 6 === 0) return 'booked'

  return 'available'
}

export async function fetchRooms(): Promise<PracticeRoom[]> {
  await delay(200)
  return PRACTICE_ROOMS
}

export async function fetchAvailableSlots(roomId: string, date: string): Promise<TimeSlot[]> {
  await delay(300)
  const now = new Date()
  const baseSlots = buildHourSlots(date)

  return baseSlots.map((slot) => ({
    ...slot,
    status: resolveSlotStatus(roomId, date, slot, now),
  }))
}

export async function createBooking(draft: {
  roomId: string
  date: string
  slotIds: string[]
}): Promise<{ success: boolean; message: string }> {
  await delay(400)

  if (draft.slotIds.length === 0) {
    return { success: false, message: 'Vui lòng chọn ít nhất một khung giờ.' }
  }

  const slots = await fetchAvailableSlots(draft.roomId, draft.date)
  const unavailable = draft.slotIds.filter((id) => {
    const slot = slots.find((s) => s.id === id)
    return !slot || slot.status !== 'available'
  })

  if (unavailable.length > 0) {
    return {
      success: false,
      message: 'Một hoặc nhiều khung giờ vừa được đặt. Vui lòng chọn lại.',
    }
  }

  writeLocalBooking({
    roomId: draft.roomId,
    date: draft.date,
    slotIds: draft.slotIds,
  })

  const hours = draft.slotIds.length
  return {
    success: true,
    message: hours > 1 ? `Đặt phòng thành công (${hours} giờ)!` : 'Đặt phòng thành công!',
  }
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
