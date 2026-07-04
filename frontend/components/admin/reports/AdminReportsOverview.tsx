'use client'

import { useCallback, useEffect, useState } from 'react'
import AdminStatCard from '@/components/admin/AdminStatCard'
import { IconBookings, IconReports, IconRooms } from '@/components/admin/AdminIcons'
import { formatAdminPrice } from '@/lib/admin/adminBookingApi'
import { defaultReportDateRange, fetchAdminReport } from '@/lib/admin/adminReportsApi'
import type { AdminReportData, ReportDateRange } from '@/lib/admin/reportsTypes'
import ReportsChartPanel from './ReportsChartPanel'
import ReportsDateRangePicker from './ReportsDateRangePicker'
import RevenueLineChart from './RevenueLineChart'
import TopRoomsBarChart from './TopRoomsBarChart'

type AdminReportsOverviewProps = {
  className?: string
}

export default function AdminReportsOverview({ className }: AdminReportsOverviewProps) {
  const [dateRange, setDateRange] = useState<ReportDateRange>(defaultReportDateRange)
  const [report, setReport] = useState<AdminReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadReport = useCallback(async () => {
    if (!dateRange.startDate || !dateRange.endDate || dateRange.startDate > dateRange.endDate) {
      setReport(null)
      setErrorMessage('Khoang thoi gian khong hop le.')
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
      setErrorMessage(error instanceof Error ? error.message : 'Khong the tai bao cao.')
    } finally {
      setIsLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadReport(), 200)
    return () => window.clearTimeout(timer)
  }, [loadReport])

  const hasOrders = (report?.totalOrders ?? 0) > 0
  const hasRevenue = (report?.totalRevenue ?? 0) > 0
  const topRoom = report?.topRooms[0] ?? null

  return (
    <div className={['space-y-6', className].filter(Boolean).join(' ')}>
      {errorMessage && (
        <div className="rounded-xl border border-error/30 bg-error-container/30 px-4 py-3 text-sm text-error">
          {errorMessage}
        </div>
      )}

      <ReportsDateRangePicker value={dateRange} onChange={setDateRange} disabled={isLoading} />

      <div className="grid gap-4 xl:grid-cols-3">
        <AdminStatCard
          label="Tong doanh thu"
          value={isLoading ? '...' : formatAdminPrice(report?.totalRevenue ?? 0)}
          hint="Chi tinh cac don da thanh toan thanh cong trong ky"
          accent="primary"
          icon={<IconReports className="h-5 w-5" />}
        />
        <AdminStatCard
          label="Tong don dat"
          value={isLoading ? '...' : report?.totalOrders ?? 0}
          hint="Khong tinh don chua thanh toan hoac da huy"
          accent="secondary"
          icon={<IconBookings className="h-5 w-5" />}
        />
        <AdminStatCard
          label="Phong dan dau"
          value={isLoading ? '...' : topRoom?.roomName ?? '-'}
          hint={
            isLoading
              ? 'Dang tong hop'
              : topRoom
                ? `${topRoom.orderCount} luot dat thanh cong`
                : 'Chua co phong noi bat trong ky'
          }
          accent="tertiary"
          icon={<IconRooms className="h-5 w-5" />}
        />
      </div>

      <ReportsChartPanel
        title="Doanh thu theo ngay"
        description="Di chuot vao tung diem de xem doanh thu va so don cua ngay do."
        isLoading={isLoading}
        isEmpty={!isLoading && !hasRevenue}
        emptyTitle="Chua co doanh thu trong ky"
        emptyDescription="Chua ghi nhan don thanh toan thanh cong trong khoang thoi gian nay."
      >
        {report && <RevenueLineChart data={report.dailyRevenue} />}
      </ReportsChartPanel>

      <ReportsChartPanel
        title="Tan suat su dung phong"
        description="Top phong duoc dat nhieu nhat trong khoang thoi gian da chon."
        isLoading={isLoading}
        isEmpty={!isLoading && report?.topRooms.length === 0}
        emptyTitle="Chua co du lieu phong"
        emptyDescription="Chua co luot dat thanh cong nao de xep hang phong trong ky nay."
      >
        {report && report.topRooms.length > 0 && <TopRoomsBarChart data={report.topRooms} />}
      </ReportsChartPanel>

      {!isLoading && !errorMessage && !hasOrders && (
        <div className="rounded-xl border border-outline-variant bg-surface-container-low/60 px-4 py-3 text-sm text-on-surface-variant">
          Khong co don dat phong nao trong khoang thoi gian da chon.
        </div>
      )}
    </div>
  )
}
