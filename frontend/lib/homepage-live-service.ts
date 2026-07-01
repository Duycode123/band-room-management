import { bookingRooms } from '@/components/booking/booking-data'

export type AvailabilityTone = 'success' | 'warning' | 'muted'

export type AvailabilityStatus = {
  status: 'OPEN' | 'LOW_AVAILABILITY' | 'FULLY_BOOKED' | 'CLOSING_SOON' | 'CLOSED'
  label: string
  count: number
  tone: AvailabilityTone
}

export type RecentActivity = {
  id: string
  customerName: string
  roomName: string
  action: 'BOOKED' | 'PAID' | 'CHECKED_IN' | 'CANCELLED'
  createdAt: string
}

export type NextAvailableSlot = {
  roomId: string
  roomName: string
  date: string
  startTime: string
  endTime: string
  duration: number
  pricePerHour: number
}

type HomepageRoom = {
  id: string
  name: string
  isActive: boolean
}

type HomepageBooking = {
  id: string
  roomId: string
  date: string
  startTime: string
  endTime: string
  status: 'PENDING' | 'CONFIRMED' | 'PAID' | 'CANCELLED'
}

type StudioBusinessHours = {
  openTime: string
  closeTime: string
}

const businessHours: StudioBusinessHours = {
  openTime: '09:00',
  closeTime: '23:00',
}

const activeBookingStatuses = new Set<HomepageBooking['status']>(['PENDING', 'CONFIRMED', 'PAID'])
const publicActivityActions = new Set<RecentActivity['action']>(['BOOKED', 'PAID', 'CHECKED_IN'])

function waitForMockApi(delay = 260) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, delay))
}

function getTodayKey(now = new Date()) {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getTomorrowKey(now = new Date()) {
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return getTodayKey(tomorrow)
}

function timeToMinutes(value: string) {
  const [hourValue, minuteValue] = value.split(':').map(Number)
  const hour = Number.isFinite(hourValue) ? hourValue : 0
  const minute = Number.isFinite(minuteValue) ? minuteValue : 0

  return hour * 60 + minute
}

function getMinutesNow(now = new Date()) {
  return now.getHours() * 60 + now.getMinutes()
}

function buildRooms(): HomepageRoom[] {
  return bookingRooms.map((room) => ({
    id: room.id,
    name: room.name,
    isActive: true,
  }))
}

function buildMockBookings(now = new Date()): HomepageBooking[] {
  const today = getTodayKey(now)

  return [
    {
      id: 'booking-live-01',
      roomId: 'studio-a',
      date: today,
      startTime: '10:00',
      endTime: '12:00',
      status: 'CONFIRMED',
    },
    {
      id: 'booking-live-02',
      roomId: 'the-vault',
      date: today,
      startTime: '15:00',
      endTime: '17:00',
      status: 'PAID',
    },
    {
      id: 'booking-live-03',
      roomId: 'practice-pod-c',
      date: today,
      startTime: '13:00',
      endTime: '14:00',
      status: 'CANCELLED',
    },
  ]
}

function buildMockActivities(now = new Date()): RecentActivity[] {
  return [
    {
      id: 'activity-01',
      customerName: 'Minh Anh',
      roomName: 'Studio A',
      action: 'BOOKED',
      createdAt: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
    },
    {
      id: 'activity-02',
      customerName: 'The Waves',
      roomName: 'The Vault',
      action: 'PAID',
      createdAt: new Date(now.getTime() - 11 * 60 * 1000).toISOString(),
    },
    {
      id: 'activity-03',
      customerName: '',
      roomName: 'Pod C',
      action: 'BOOKED',
      createdAt: new Date(now.getTime() - 18 * 60 * 1000).toISOString(),
    },
    {
      id: 'activity-04',
      customerName: 'Lan Chi',
      roomName: 'Studio A',
      action: 'CANCELLED',
      createdAt: new Date(now.getTime() - 22 * 60 * 1000).toISOString(),
    },
  ]
}

export function isStudioOpenNow(openTime: string, closeTime: string, now = new Date()) {
  const currentMinutes = getMinutesNow(now)
  return currentMinutes >= timeToMinutes(openTime) && currentMinutes < timeToMinutes(closeTime)
}

export function getMinutesUntilClose(closeTime: string, now = new Date()) {
  return Math.max(0, timeToMinutes(closeTime) - getMinutesNow(now))
}

export function getAvailableRoomsToday(rooms: HomepageRoom[], bookings: HomepageBooking[], date: string) {
  const activeBookings = bookings.filter((booking) => booking.date === date && activeBookingStatuses.has(booking.status))

  return rooms.filter((room) => {
    if (!room.isActive) return false

    const roomBookings = activeBookings.filter((booking) => booking.roomId === room.id)
    return roomBookings.length < 4
  })
}

export function getHomepageAvailabilityStatus(
  rooms: HomepageRoom[],
  bookings: HomepageBooking[],
  date: string,
  hours: StudioBusinessHours,
  now = new Date(),
): AvailabilityStatus {
  const availableRooms = getAvailableRoomsToday(rooms, bookings, date)
  const availableCount = availableRooms.length
  const minutesUntilClose = getMinutesUntilClose(hours.closeTime, now)

  if (!isStudioOpenNow(hours.openTime, hours.closeTime, now)) {
    return {
      status: 'CLOSED',
      label: `Đã đóng cửa · Mở lại lúc ${hours.openTime} ngày mai`,
      count: availableCount,
      tone: 'muted',
    }
  }

  if (minutesUntilClose <= 60) {
    return {
      status: 'CLOSING_SOON',
      label: `Sắp đóng cửa · Còn ${minutesUntilClose} phút nhận lịch hôm nay`,
      count: availableCount,
      tone: 'warning',
    }
  }

  if (availableCount === 0) {
    return {
      status: 'FULLY_BOOKED',
      label: 'Đang mở · Hôm nay đã kín lịch',
      count: 0,
      tone: 'warning',
    }
  }

  if (availableCount <= 2) {
    return {
      status: 'LOW_AVAILABILITY',
      label: `Đang mở · Chỉ còn ${availableCount} phòng trống hôm nay`,
      count: availableCount,
      tone: 'warning',
    }
  }

  return {
    status: 'OPEN',
    label: `Đang mở · ${availableCount} phòng còn trống hôm nay`,
    count: availableCount,
    tone: 'success',
  }
}

export function maskCustomerName(customerName: string) {
  const normalizedName = customerName.trim()

  if (!normalizedName) return 'Một khách hàng'
  if (normalizedName.toLowerCase().startsWith('the ')) return normalizedName

  const parts = normalizedName.split(/\s+/)
  if (parts.length === 1) return parts[0]

  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`
}

export function formatRelativeTime(createdAt: string, now = new Date()) {
  const createdDate = new Date(createdAt)
  const diffInMinutes = Math.max(0, Math.round((now.getTime() - createdDate.getTime()) / 60000))

  if (diffInMinutes < 1) return 'vừa xong'
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`

  const diffInHours = Math.round(diffInMinutes / 60)
  return `${diffInHours} giờ trước`
}

export function getActivityActionLabel(action: RecentActivity['action']) {
  if (action === 'PAID') return 'đã thanh toán'
  if (action === 'CHECKED_IN') return 'đã check-in'
  return 'đã đặt'
}

export function getRecentActivities(activities: RecentActivity[]) {
  return activities
    .filter((activity) => publicActivityActions.has(activity.action))
    .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
    .slice(0, 3)
}

export function formatSlotDateLabel(date: string, now = new Date()) {
  if (date === getTodayKey(now)) return 'Hôm nay'
  if (date === getTomorrowKey(now)) return 'Ngày mai'

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(`${date}T00:00:00`))
}

export function getFallbackAvailabilityStatus() {
  const now = new Date()
  return getHomepageAvailabilityStatus(buildRooms(), buildMockBookings(now), getTodayKey(now), businessHours, now)
}

export function getFallbackRecentActivities() {
  return getRecentActivities(buildMockActivities())
}

export function getFallbackNextAvailableSlot(): NextAvailableSlot | null {
  const now = new Date()
  const date = isStudioOpenNow(businessHours.openTime, businessHours.closeTime, now) ? getTodayKey(now) : getTomorrowKey(now)
  const room = bookingRooms[0]

  if (!room) return null

  return {
    roomId: room.id,
    roomName: room.name,
    date,
    startTime: '19:00',
    endTime: '22:00',
    duration: 3,
    pricePerHour: room.pricePerHour,
  }
}

export async function fetchTodayAvailability(): Promise<AvailabilityStatus> {
  // Replace this mock with fetch('/api/rooms/availability/today') when the backend endpoint is ready.
  await waitForMockApi()

  const now = new Date()
  return getHomepageAvailabilityStatus(buildRooms(), buildMockBookings(now), getTodayKey(now), businessHours, now)
}

export async function fetchRecentActivities(): Promise<RecentActivity[]> {
  // Replace this mock with fetch('/api/bookings/recent-activities') when the backend endpoint is ready.
  await waitForMockApi(220)

  return getRecentActivities(buildMockActivities())
}

export async function fetchNextAvailableSlot(): Promise<NextAvailableSlot | null> {
  // Replace this mock with fetch('/api/rooms/next-available-slot') when the backend endpoint is ready.
  await waitForMockApi(240)

  return getFallbackNextAvailableSlot()
}
