import {
  getHomepageSummary,
  type HomepageSummary,
  type NextAvailableSlot,
  type RecentActivity,
} from '@/lib/public/homepage-api'

export type { HomepageSummary, NextAvailableSlot, RecentActivity }

export type AvailabilityTone = 'success' | 'warning' | 'muted'

export type AvailabilityStatus = {
  status: 'OPEN' | 'LOW_AVAILABILITY' | 'FULLY_BOOKED' | 'CLOSED'
  label: string
  count: number
  tone: AvailabilityTone
}

export async function fetchHomepageSummary() {
  return getHomepageSummary()
}

export function getAvailabilityStatus(summary: HomepageSummary): AvailabilityStatus {
  const availableCount = summary.availableRoomsToday

  if (!summary.studioOpen) {
    return {
      status: 'CLOSED',
      label: 'Đã đóng · Xem lịch trống ngày mai',
      count: availableCount,
      tone: 'muted',
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

export function getInitialAvailabilityStatus(): AvailabilityStatus {
  return {
    status: 'CLOSED',
    label: '',
    count: 0,
    tone: 'muted',
  }
}

export function formatRelativeTime(createdAt: string, now = new Date()) {
  const createdDate = new Date(createdAt)

  if (Number.isNaN(createdDate.getTime())) {
    return 'gần đây'
  }

  const diffInMinutes = Math.max(0, Math.round((now.getTime() - createdDate.getTime()) / 60000))

  if (diffInMinutes < 1) return 'vừa xong'
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`

  const diffInHours = Math.round(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} giờ trước`

  const diffInDays = Math.round(diffInHours / 24)
  return `${diffInDays} ngày trước`
}

export function getActivityActionLabel(action: RecentActivity['action']) {
  if (action === 'PAID') return 'đã thanh toán'
  if (action === 'CANCELLED') return 'đã hủy lịch'
  return 'đã đặt'
}

export function formatSlotDateLabel(date: string, now = new Date()) {
  const today = getDateKey(now)
  const tomorrowDate = new Date(now)
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrow = getDateKey(tomorrowDate)

  if (date === today) return 'Hôm nay'
  if (date === tomorrow) return 'Ngày mai'

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(`${date}T00:00:00`))
}

function getDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
