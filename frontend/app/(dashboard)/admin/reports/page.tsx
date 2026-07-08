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
          eyebrow="Phan tich"
          title="Bao cao doanh thu va su dung phong"
          description="Theo doi doanh thu, so don va tan suat su dung phong theo khoang thoi gian ban chon."
          breadcrumbs={[
            { label: 'Tong quan', href: '/admin/dashboard' },
            { label: 'Bao cao' },
          ]}
        />

        <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
          <AdminReportsOverview />
        </div>
      </AdminShell>
    </AuthGuard>
  )
}
