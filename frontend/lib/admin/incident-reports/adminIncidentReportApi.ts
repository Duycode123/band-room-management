import type {
  IncidentReport,
  IncidentReportFilters,
  IncidentReportStats,
  IncidentReportStatus,
  IncidentRoomOption,
} from './types'

const mockIncidentReports: IncidentReport[] = [
  {
    id: '1',
    reportCode: 'IR-2026-0001',
    customerName: 'Nguyễn Minh Anh',
    customerEmail: 'minhanh@example.com',
    customerPhone: '0901 222 345',
    roomId: 'room-a',
    roomName: 'Studio A',
    bookingId: 'BK-1048',
    title: 'Micro bị rè trong buổi tập',
    description:
      'Micro chính trong phòng Studio A bị rè liên tục khi hát lớn. Nhóm đã thử đổi dây nhưng tình trạng vẫn còn.',
    priority: 'HIGH',
    status: 'NEW',
    submittedAt: '2026-07-07T14:20:00+07:00',
    evidenceImages: ['/images/band-room-hero.png'],
    adminNote: '',
  },
  {
    id: '2',
    reportCode: 'IR-2026-0002',
    customerName: 'Trần Gia Hân',
    customerEmail: 'giahan@example.com',
    customerPhone: '0918 456 778',
    roomId: 'room-b',
    roomName: 'Studio B',
    bookingId: 'BK-1051',
    title: 'Điều hòa làm lạnh yếu',
    description:
      'Phòng hơi nóng sau khoảng 30 phút sử dụng. Khách đã báo nhân viên ca tối nhưng cần kiểm tra lại thiết bị.',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    submittedAt: '2026-07-06T19:05:00+07:00',
    evidenceImages: [],
    adminNote: 'Đã chuyển kỹ thuật kiểm tra điều hòa trong ca sáng.',
  },
  {
    id: '3',
    reportCode: 'IR-2026-0003',
    customerName: 'Lê Quốc Bảo',
    customerEmail: 'quocbao@example.com',
    roomId: 'room-c',
    roomName: 'Live Room',
    bookingId: 'BK-1037',
    title: 'Trống thiếu dùi dự phòng',
    description:
      'Bộ trống trong Live Room chỉ còn một cặp dùi. Khách cần thêm dùi dự phòng vì buổi tập kéo dài.',
    priority: 'LOW',
    status: 'RESOLVED',
    submittedAt: '2026-07-04T10:30:00+07:00',
    evidenceImages: [],
    adminNote: 'Đã bổ sung hai cặp dùi mới và nhắc staff kiểm kê cuối ngày.',
  },
  {
    id: '4',
    reportCode: 'IR-2026-0004',
    customerName: 'Phạm Hoàng Nam',
    customerPhone: '0987 111 222',
    roomId: 'room-a',
    roomName: 'Studio A',
    bookingId: 'BK-1029',
    title: 'Khách đến muộn do check-in chậm',
    description:
      'Khách phản ánh phải chờ xác nhận booking khoảng 12 phút dù đã thanh toán trước. Cần xem lại quy trình tiếp nhận.',
    priority: 'HIGH',
    status: 'CLOSED',
    submittedAt: '2026-07-02T21:15:00+07:00',
    evidenceImages: [],
    adminNote: 'Đã xin lỗi khách và thống nhất quy trình xác nhận nhanh với staff.',
  },
]

const wait = () => new Promise((resolve) => setTimeout(resolve, 250))

export async function fetchAdminIncidentReports(filters: IncidentReportFilters): Promise<IncidentReport[]> {
  await wait()

  const query = normalizeText(filters.query)

  return mockIncidentReports.filter((report) => {
    const matchesQuery =
      !query ||
      normalizeText(
        [
          report.reportCode,
          report.customerName,
          report.customerEmail,
          report.customerPhone,
          report.roomName,
          report.bookingId,
          report.title,
          report.description,
        ]
          .filter(Boolean)
          .join(' '),
      ).includes(query)
    const matchesStatus = filters.status === 'ALL' || report.status === filters.status
    const matchesPriority = filters.priority === 'ALL' || report.priority === filters.priority
    const matchesRoom = filters.roomId === 'ALL' || report.roomId === filters.roomId
    const matchesDate = !filters.submittedDate || report.submittedAt.slice(0, 10) === filters.submittedDate

    return matchesQuery && matchesStatus && matchesPriority && matchesRoom && matchesDate
  })
}

export async function fetchAdminIncidentReportDetail(id: string): Promise<IncidentReport | null> {
  await wait()
  return mockIncidentReports.find((report) => report.id === id) ?? null
}

export async function updateAdminIncidentReportStatus(
  report: IncidentReport,
  status: IncidentReportStatus,
  adminNote: string,
): Promise<IncidentReport> {
  await wait()
  return { ...report, status, adminNote }
}

export function getIncidentReportStats(reports: IncidentReport[]): IncidentReportStats {
  return {
    total: reports.length,
    newCount: reports.filter((report) => report.status === 'NEW').length,
    inProgress: reports.filter((report) => report.status === 'IN_PROGRESS').length,
    resolved: reports.filter((report) => report.status === 'RESOLVED').length,
    highPriority: reports.filter((report) => report.priority === 'HIGH').length,
  }
}

export function getIncidentRoomOptions(reports: IncidentReport[]): IncidentRoomOption[] {
  return Array.from(new Map(reports.map((report) => [report.roomId, report.roomName])).entries()).map(
    ([roomId, roomName]) => ({ roomId, roomName }),
  )
}

export function formatIncidentDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN')
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

