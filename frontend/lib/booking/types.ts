export type SlotStatus = 'available' | 'booked' | 'past' | 'selected'

export type PracticeRoom = {
  id: string
  name: string
  capacity: number
  pricePerHour: number
  equipment: string[]
  isVip?: boolean
}

export type TimeSlot = {
  id: string
  start: string
  end: string
  label: string
  status: SlotStatus
}

export type BookingDraft = {
  roomId: string
  roomName: string
  date: string
  slotId: string
  start: string
  end: string
  pricePerHour: number
}
