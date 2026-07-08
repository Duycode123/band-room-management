'use client'

import AuthGuard from '@/components/AuthGuard'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminShell from '@/components/admin/AdminShell'
import AdminReportsOverview from '@/components/admin/reports/AdminReportsOverview'

export default function AdminReportsPage() {
  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <AdminShell>
        <AdminPageHeader
          eyebrow="Phân tích"
          title="Báo cáo doanh thu và sử dụng phòng"
          description="Theo dõi doanh thu, số đơn và tần suất sử dụng phòng theo khoảng thời gian bạn chọn."
          breadcrumbs={[
            { label: 'Tổng quan', href: '/admin/dashboard' },
            { label: 'Báo cáo' },
          ]}
        />

        <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
          <AdminReportsOverview />
        </div>
      </AdminShell>
    </AuthGuard>
  )
}
