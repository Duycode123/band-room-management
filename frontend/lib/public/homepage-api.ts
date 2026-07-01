import api from '@/lib/api'

export type AvailabilityTone = 'success' | 'warning' | 'muted'

export type HomepageSummary = {
  studioOpen: boolean
  availableRoomsToday: number
  recentActivities: RecentActivity[]
  nextAvailableSlots: NextAvailableSlot[]
}

export type RecentActivity = {
  id: string
  customerDisplayName: string
  action: 'BOOKED' | 'PAID' | 'CANCELLED'
  roomName: string
  createdAt: string
}

export type NextAvailableSlot = {
  roomId: number | string
  roomName: string
  date: string
  startTime: string
  endTime?: string
  pricePerHour: number
}

type ApiResponse<T> = {
  success: boolean
  message?: string
  data: T
}

export async function getHomepageSummary(): Promise<HomepageSummary> {
  const response = await api.get<ApiResponse<HomepageSummary>>('/api/public/homepage/summary')
  return response.data.data
}
