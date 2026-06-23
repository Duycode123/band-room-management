import { PRACTICE_ROOMS } from './mockData'
import type { PracticeRoom, SlotStatus, TimeSlot } from './types'

const BOOKINGS_KEY = 'bandhub_local_bookings'
const OPEN_HOUR = 8
const CLOSE_HOUR = 22

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

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseSlotStart(date: string, start: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = start.split(':').map(Number)
  return new Date(year, month - 1, day, hour, minute, 0, 0)
}

type StoredBooking = {
  roomId: string
  date: string
  slotId: string
}

function readLocalBookings(): StoredBooking[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]') as StoredBooking[]
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
    (b) => b.roomId === roomId && b.date === date && b.slotId === slot.id,
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
  slotId: string
}): Promise<{ success: boolean; message: string }> {
  await delay(400)

  const slots = await fetchAvailableSlots(draft.roomId, draft.date)
  const slot = slots.find((s) => s.id === draft.slotId)
  if (!slot || slot.status !== 'available') {
    return { success: false, message: 'Khung giờ này vừa được đặt. Vui lòng chọn slot khác.' }
  }

  writeLocalBooking(draft)
  return { success: true, message: 'Đặt phòng thành công!' }
}

export function getDateOptions(days = 14): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < days; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const value = toDateKey(d)
    const label = d.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    })
    options.push({ value, label: i === 0 ? `Hôm nay (${label})` : label })
  }
  return options
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
