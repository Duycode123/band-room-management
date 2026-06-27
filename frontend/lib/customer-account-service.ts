import api from '@/lib/api'

export type CustomerBookingStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'

export type CustomerBookingSummary = {
  id: string
  code: string
  roomName: string
  date: string
  timeRange: string
  total: number
  status: CustomerBookingStatus
}

export type ReportIssuePayload = {
  issueType: string
  bookingCode: string
  description: string
}

const mockBookings: CustomerBookingSummary[] = [
  {
    id: 'booking-1',
    code: 'BR-2026-0821',
    roomName: 'Studio A - Phòng Đỏ',
    date: '28/06/2026',
    timeRange: '19:00 - 22:00',
    total: 1050000,
    status: 'CONFIRMED',
  },
  {
    id: 'booking-2',
    code: 'BR-2026-0831',
    roomName: 'The Vault - Thu âm',
    date: '20/06/2026',
    timeRange: '14:00 - 16:00',
    total: 1000000,
    status: 'COMPLETED',
  },
]

function waitForMockApi(delay = 240) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, delay))
}

export function formatBookingStatus(status: CustomerBookingStatus) {
  const labels: Record<CustomerBookingStatus, string> = {
    PENDING_PAYMENT: 'Chờ thanh toán',
    CONFIRMED: 'Đã xác nhận',
    CANCELLED: 'Đã hủy',
    COMPLETED: 'Hoàn tất',
  }

  return labels[status]
}

export async function fetchCustomerBookings(): Promise<CustomerBookingSummary[]> {
  try {
    const response = await api.get<CustomerBookingSummary[]>('/api/customer/bookings')
    return response.data
  } catch {
    await waitForMockApi()
    return mockBookings
  }
}

export async function submitCustomerIssueReport(payload: ReportIssuePayload): Promise<void> {
  try {
    await api.post('/api/customer/report-issue', payload)
  } catch {
    await waitForMockApi()
  }
}
