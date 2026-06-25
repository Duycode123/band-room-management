export type SlotStatus = 'available' | 'booked' | 'past' | 'selected'

export type PracticeRoom = {
  id: number
  name: string
  typeName: string
  capacity?: number | null
  pricePerHour: number
  equipment: string[]
  status: string
  description?: string | null
  isVip?: boolean
}

export type TimeSlot = {
  id: string
  dateKey: string
  start: string
  end: string
  label: string
  status: SlotStatus
}

export type BookingDraft = {
  roomId: number
  roomName: string
  date: string
  slotIds: string[]
  start: string
  end: string
  hours: number
  pricePerHour: number
}
