'use client'

import { useCallback, useEffect, useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminShell from '@/components/admin/AdminShell'
import AdminStatCard from '@/components/admin/AdminStatCard'
import { IconBookings, IconReports } from '@/components/admin/AdminIcons'
import ReportsChartPanel from '@/components/admin/reports/ReportsChartPanel'
import ReportsDateRangePicker from '@/components/admin/reports/ReportsDateRangePicker'
import RevenueLineChart from '@/components/admin/reports/RevenueLineChart'
import TopRoomsBarChart from '@/components/admin/reports/TopRoomsBarChart'
import { formatAdminPrice } from '@/lib/admin/adminBookingApi'
import { defaultReportDateRange, fetchAdminReport } from '@/lib/admin/adminReportsApi'
import type { AdminReportData, ReportDateRange } from '@/lib/admin/reportsTypes'

export default function AdminReportsPage() {
  const [dateRange, setDateRange] = useState<ReportDateRange>(defaultReportDateRange)
  const [report, setReport] = useState<AdminReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadReport = useCallback(async () => {
    if (!dateRange.startDate || !dateRange.endDate || dateRange.startDate > dateRange.endDate) {
      setReport(null)
      setErrorMessage('Khoảng thời gian không hợp lệ.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      const data = await fetchAdminReport(dateRange)
      setReport(data)
      setErrorMessage('')
    } catch (error) {
      setReport(null)
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải báo cáo.')
    } finally {
      setIsLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    const timer = setTimeout(() => void loadReport(), 200)
    return () => clearTimeout(timer)
  }, [loadReport])

  const hasOrders = (report?.totalOrders ?? 0) > 0
  const hasRevenue = (report?.totalRevenue ?? 0) > 0

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <AdminShell>
        <AdminPageHeader
          eyebrow="Phân tích"
          title="Báo cáo doanh thu"
          description="Theo dõi doanh thu, số đơn và hiệu suất từng phòng theo khoảng thời gian bạn chọn."
          breadcrumbs={[
            { label: 'Tổng quan', href: '/admin/dashboard' },
            { label: 'Báo cáo' },
          ]}
        />

        <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
          {errorMessage && (
            <div className="rounded-xl border border-error/30 bg-error-container/30 px-4 py-3 text-sm text-error">
              {errorMessage}
            </div>
          )}

          <ReportsDateRangePicker value={dateRange} onChange={setDateRange} disabled={isLoading} />

          <div className="grid gap-4 sm:grid-cols-2">
            <AdminStatCard
              label="Tổng doanh thu"
              value={isLoading ? '…' : formatAdminPrice(report?.totalRevenue ?? 0)}
              hint="Đơn đã thanh toán trong kỳ"
              accent="primary"
              icon={<IconReports className="h-5 w-5" />}
            />
            <AdminStatCard
              label="Tổng đơn"
              value={isLoading ? '…' : (report?.totalOrders ?? 0)}
              hint="Không tính đơn đã hủy"
              accent="secondary"
              icon={<IconBookings className="h-5 w-5" />}
            />
          </div>

          <ReportsChartPanel
            title="Doanh thu theo ngày"
            description="Di chuột lên điểm trên biểu đồ để xem chi tiết từng ngày."
            isLoading={isLoading}
            isEmpty={!isLoading && !hasRevenue}
            emptyTitle="Chưa có doanh thu trong kỳ"
            emptyDescription="Chưa ghi nhận đơn đã thanh toán trong khoảng thời gian này."
          >
            {report && <RevenueLineChart data={report.dailyRevenue} />}
          </ReportsChartPanel>

          <ReportsChartPanel
            title="Top phòng theo doanh thu"
            description="Xếp hạng phòng có doanh thu cao nhất trong kỳ đã chọn."
            isLoading={isLoading}
            isEmpty={!isLoading && report?.topRooms.length === 0}
            emptyTitle="Chưa có dữ liệu phòng"
            emptyDescription="Chưa có phòng nào phát sinh doanh thu trong khoảng thời gian này."
          >
            {report && report.topRooms.length > 0 && <TopRoomsBarChart data={report.topRooms} />}
          </ReportsChartPanel>

          {!isLoading && !errorMessage && !hasOrders && (
            <div className="rounded-xl border border-outline-variant bg-surface-container-low/60 px-4 py-3 text-sm text-on-surface-variant">
              Không có đơn đặt phòng nào trong khoảng thời gian đã chọn.
            </div>
          )}
        </div>
      </AdminShell>
    </AuthGuard>
  )
}
