import axios from 'axios'
import api from '@/lib/api'
import type { AdminReportData, DailyRevenuePoint, ReportDateRange, TopRoomPoint } from './reportsTypes'

type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

type BackendRevenueUsagePeriod = {
  periodStart: string
  revenue: number | string
  bookingCount: number
}

type BackendRoomUsageSummary = {
  roomId: number
  roomName: string
  revenue: number | string
  bookingCount: number
}

type BackendRevenueUsageReport = {
  totalRevenue: number | string
  totalBookings: number
  periods: BackendRevenueUsagePeriod[]
  rooms: BackendRoomUsageSummary[]
}

type ApiErrorResponse = {
  message?: string
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function toDateKey(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function eachDayInRange(range: ReportDateRange): string[] {
  const start = parseDateKey(range.startDate)
  const end = parseDateKey(range.endDate)
  const days: string[] = []

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return days
  }

  const cursor = new Date(start)
  while (cursor <= end) {
    days.push(toDateKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}

function toDateTimeRange(range: ReportDateRange) {
  const from = `${range.startDate}T00:00:00`
  const endDate = parseDateKey(range.endDate)
  endDate.setDate(endDate.getDate() + 1)
  const to = `${toDateKey(endDate)}T00:00:00`
  return { from, to }
}

function formatDayLabel(dateKey: string) {
  const date = parseDateKey(dateKey)
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

function parseAmount(value: number | string | null | undefined) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || fallback
  }

  return fallback
}

function mapDailyRevenue(range: ReportDateRange, periods: BackendRevenueUsagePeriod[]): DailyRevenuePoint[] {
  const periodMap = new Map<string, { revenue: number; orderCount: number }>()

  periods.forEach((period) => {
    const date = toDateKey(new Date(period.periodStart))
    periodMap.set(date, {
      revenue: parseAmount(period.revenue),
      orderCount: period.bookingCount,
    })
  })

  return eachDayInRange(range).map((date) => {
    const bucket = periodMap.get(date) ?? { revenue: 0, orderCount: 0 }

    return {
      date,
      label: formatDayLabel(date),
      revenue: bucket.revenue,
      orderCount: bucket.orderCount,
    }
  })
}

function mapTopRooms(rooms: BackendRoomUsageSummary[]): TopRoomPoint[] {
  return rooms.slice(0, 8).map((room) => ({
    roomId: room.roomId,
    roomName: room.roomName || 'Chua xac dinh',
    revenue: parseAmount(room.revenue),
    orderCount: room.bookingCount,
  }))
}

export function defaultReportDateRange(): ReportDateRange {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 29)
  return { startDate: toDateKey(start), endDate: toDateKey(end) }
}

export async function fetchAdminReport(range: ReportDateRange): Promise<AdminReportData> {
  try {
    const response = await api.get<ApiResponse<BackendRevenueUsageReport>>(
      '/api/admin/reports/revenue-usage',
      {
        params: {
          ...toDateTimeRange(range),
          bucket: 'DAY',
        },
      },
    )

    const report = response.data.data

    return {
      totalRevenue: parseAmount(report.totalRevenue),
      totalOrders: report.totalBookings,
      dailyRevenue: mapDailyRevenue(range, report.periods),
      topRooms: mapTopRooms(report.rooms),
    }
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Khong the tai bao cao doanh thu.'))
  }
}
