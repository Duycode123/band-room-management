import axios from 'axios'
import api from '@/lib/api'

type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

type ApiErrorResponse = {
  message?: string
}

export type BackendAttendanceStatus = 'WORKING' | 'DONE' | 'MISSING_CHECKOUT'

export type StaffScheduleShift = {
  shiftId: number
  date: string
  startTime: string
  endTime: string
}

export type StaffShiftBooking = {
  bookingId: number
  roomName: string
  customerName: string
  startTime: string
  endTime: string
  status: string
  equipmentNotes?: string | null
}

export type StaffAttendanceRecord = {
  attendanceId: string
  staffId: number
  shiftId: number
  checkInTime: string
  checkOutTime?: string | null
  workDuration?: number | string | null
  status: BackendAttendanceStatus
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || fallback
  }

  return fallback
}

export async function fetchStaffSchedule(fromDate: string, toDate: string): Promise<StaffScheduleShift[]> {
  try {
    const response = await api.get<ApiResponse<StaffScheduleShift[]>>('/api/staff/schedule/shifts', {
      params: {
        fromDate,
        toDate,
      },
    })

    return response.data.data ?? []
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Khong the tai lich lam viec.'))
  }
}

export async function fetchShiftBookings(shiftId: number): Promise<StaffShiftBooking[]> {
  try {
    const response = await api.get<ApiResponse<StaffShiftBooking[]>>(`/api/staff/schedule/shifts/${shiftId}/bookings`)
    return response.data.data ?? []
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Khong the tai booking trong ca lam.'))
  }
}

export async function fetchCurrentAttendance(): Promise<StaffAttendanceRecord | null> {
  try {
    const response = await api.get<ApiResponse<StaffAttendanceRecord | null>>('/api/staff/attendance/current')
    return response.data.data ?? null
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Khong the tai du lieu cham cong hien tai.'))
  }
}

export async function checkInCurrentShift(): Promise<StaffAttendanceRecord> {
  try {
    const response = await api.post<ApiResponse<StaffAttendanceRecord>>('/api/staff/attendance/check-in')
    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Khong the check-in ca lam.'))
  }
}

export async function checkOutCurrentShift(): Promise<StaffAttendanceRecord> {
  try {
    const response = await api.post<ApiResponse<StaffAttendanceRecord>>('/api/staff/attendance/check-out')
    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Khong the check-out ca lam.'))
  }
}
