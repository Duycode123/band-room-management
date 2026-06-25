import axios from 'axios'
import api from '@/lib/api'
import type { PracticeRoom, SlotStatus, TimeSlot } from './types'

const OPEN_HOUR = 8
const CLOSE_HOUR = 22

type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

type BackendRoomResponse = {
  id: number
  roomName: string
  roomType: {
    id: number
    typeName: string
    description?: string | null
    pricePerHour: number | string
    capacity?: number | null
  }
  floor?: number | null
  maxPeople?: number | null
  status: string
  description?: string | null
  imageUrl?: string | null
  equipment?: string[]
}

type BackendAvailableSlot = {
  startTime: string
  endTime: string
}

type BackendAvailabilityResponse = {
  roomId: number
  roomName: string
  from: string
  to: string
  operational: boolean
  availableSlots: BackendAvailableSlot[]
}

type BackendBookingResponse = {
  bookingId: number
  bookingCode: string
}

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

function parseLocalDateTime(value: string): Date {
  const [datePart, timePart = '00:00:00'] = value.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute, second] = timePart.split(':').map(Number)
  return new Date(year, month - 1, day, hour, minute, second || 0, 0)
}

function parseSlotTime(dateKey: string, time: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  return new Date(year, month - 1, day, hour, minute, 0, 0)
}

function buildHourSlots(dateKey: string): Omit<TimeSlot, 'status'>[] {
  const slots: Omit<TimeSlot, 'status'>[] = []

  for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
    const start = `${pad(hour)}:00`
    const end = `${pad(hour + 1)}:00`

    slots.push({
      id: `${dateKey}-${start}`,
      dateKey,
      start,
      end,
      label: `${start} - ${end}`,
    })
  }

  return slots
}

function resolveSlotStatus(
  slot: Omit<TimeSlot, 'status'>,
  now: Date,
  operational: boolean,
  availableWindows: Array<{ start: Date; end: Date }>,
): SlotStatus {
  const slotStart = parseSlotTime(slot.dateKey, slot.start)
  const slotEnd = parseSlotTime(slot.dateKey, slot.end)

  if (slotStart.getTime() <= now.getTime()) return 'past'
  if (!operational) return 'booked'

  const isAvailable = availableWindows.some(
    (window) => slotStart.getTime() >= window.start.getTime() && slotEnd.getTime() <= window.end.getTime(),
  )

  return isAvailable ? 'available' : 'booked'
}

export async function fetchRooms(): Promise<PracticeRoom[]> {
  const response = await api.get<ApiResponse<BackendRoomResponse[]>>('/api/rooms')

  return response.data.data.map((room) => ({
    id: room.id,
    name: room.roomName,
    typeName: room.roomType.typeName,
    capacity: room.maxPeople ?? room.roomType.capacity ?? null,
    pricePerHour: Number(room.roomType.pricePerHour),
    equipment: room.equipment ?? [],
    status: room.status,
    description: room.description ?? room.roomType.description ?? null,
    isVip: room.roomType.typeName.toLowerCase().includes('vip'),
  }))
}

export async function fetchAvailableSlots(roomId: number, dateKey: string): Promise<TimeSlot[]> {
  const from = `${dateKey}T${pad(OPEN_HOUR)}:00:00`
  const to = `${dateKey}T${pad(CLOSE_HOUR)}:00:00`
  const response = await api.get<ApiResponse<BackendAvailabilityResponse>>(
    `/api/rooms/${roomId}/available-slots`,
    {
      params: { from, to },
    },
  )

  const availability = response.data.data
  const now = new Date()
  const availableWindows = availability.availableSlots.map((slot) => ({
    start: parseLocalDateTime(slot.startTime),
    end: parseLocalDateTime(slot.endTime),
  }))

  return buildHourSlots(dateKey).map((slot) => ({
    ...slot,
    status: resolveSlotStatus(slot, now, availability.operational, availableWindows),
  }))
}

export async function createBooking(draft: {
  roomId: number
  selectedSlots: TimeSlot[]
  note?: string
}): Promise<{ success: boolean; message: string; bookingId?: number; bookingCode?: string }> {
  if (draft.selectedSlots.length === 0) {
    return { success: false, message: 'Vui long chon it nhat mot khung gio.' }
  }

  const selectedSlots = [...draft.selectedSlots].sort((a, b) => a.start.localeCompare(b.start))
  const firstSlot = selectedSlots[0]
  const lastSlot = selectedSlots[selectedSlots.length - 1]

  try {
    const response = await api.post<ApiResponse<BackendBookingResponse>>('/api/bookings', {
      roomId: draft.roomId,
      startTime: `${firstSlot.dateKey}T${firstSlot.start}:00`,
      endTime: `${lastSlot.dateKey}T${lastSlot.end}:00`,
      paymentMethod: 'ONLINE',
      note: draft.note?.trim() || null,
    })

    return {
      success: true,
      message: response.data.message,
      bookingId: response.data.data.bookingId,
      bookingCode: response.data.data.bookingCode,
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message
      if (typeof message === 'string' && message.length > 0) {
        return { success: false, message }
      }
    }

    return {
      success: false,
      message: 'Khong the tao booking luc nay. Thu lai sau.',
    }
  }
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}
