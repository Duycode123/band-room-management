'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminShell from '@/components/admin/AdminShell'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminToast from '@/components/admin/AdminToast'
import { IconBookings, IconPlus } from '@/components/admin/AdminIcons'
import AdminStaffCreateModal from '@/components/admin/staff/AdminStaffCreateModal'
import AdminStaffDetailPanel from '@/components/admin/staff/AdminStaffDetailPanel'
import AdminStaffFiltersBar from '@/components/admin/staff/AdminStaffFiltersBar'
import AdminStaffTable from '@/components/admin/staff/AdminStaffTable'
import {
  createStaffAccount,
  disableStaffAccount,
  getStaffAccountDetail,
  listStaffAccounts,
  type StaffAccountFilters,
  type StaffAccountFormData,
  type StaffAccountResponse,
} from '@/lib/admin/staff/adminStaffApi'

const DEFAULT_FILTERS: StaffAccountFilters = {
  query: '',
  status: 'ALL',
  verification: 'ALL',
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function filterStaff(staff: StaffAccountResponse[], filters: StaffAccountFilters) {
  const query = normalize(filters.query)

  return staff.filter((item) => {
    const matchQuery =
      !query ||
      normalize(item.fullName).includes(query) ||
      normalize(item.email).includes(query) ||
      normalize(item.phone || '').includes(query) ||
      String(item.staffId).includes(query) ||
      String(item.accountId).includes(query)

    const matchStatus =
      filters.status === 'ALL' ||
      (filters.status === 'ACTIVE' && item.enabled) ||
      (filters.status === 'DISABLED' && !item.enabled)

    const matchVerification =
      filters.verification === 'ALL' ||
      (filters.verification === 'VERIFIED' && item.emailVerified) ||
      (filters.verification === 'UNVERIFIED' && !item.emailVerified)

    return matchQuery && matchStatus && matchVerification
  })
}

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffAccountResponse[]>([])
  const [filters, setFilters] = useState<StaffAccountFilters>(DEFAULT_FILTERS)
  const [selected, setSelected] = useState<StaffAccountResponse | null>(null)
  const [disableTarget, setDisableTarget] = useState<StaffAccountResponse | null>(null)
  const [createStaffOpen, setCreateStaffOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const loadStaff = useCallback(async () => {
    setIsLoading(true)

    try {
      const data = await listStaffAccounts()
      setStaff(data)
      setSelected((current) => {
        if (!current) return null
        return data.find((item) => item.staffId === current.staffId) ?? null
      })
      setErrorMessage('')
    } catch (error) {
      setStaff([])
      setSelected(null)
      setErrorMessage(error instanceof Error ? error.message : 'Khong the tai danh sach staff.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStaff()
  }, [loadStaff])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  const visibleStaff = useMemo(() => filterStaff(staff, filters), [staff, filters])

  const stats = useMemo(
    () => ({
      total: staff.length,
      active: staff.filter((item) => item.enabled).length,
      disabled: staff.filter((item) => !item.enabled).length,
      verified: staff.filter((item) => item.emailVerified).length,
    }),
    [staff],
  )

  const handleSelect = async (item: StaffAccountResponse) => {
    setSelected(item)

    try {
      const detail = await getStaffAccountDetail(item.staffId)
      setSelected(detail)
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Khong the tai thong tin staff.')
    }
  }

  const handleCreateStaff = async (data: StaffAccountFormData) => {
    const createdStaff = await createStaffAccount(data)
    setToast(`Created staff ST-${createdStaff.staffId} (${createdStaff.email}).`)
    await loadStaff()
    setSelected(createdStaff)
    return createdStaff
  }

  const handleDisableStaff = async (item: StaffAccountResponse) => {
    const updated = await disableStaffAccount(item.staffId)
    setToast(`Disabled staff ST-${updated.staffId} (${updated.email}).`)
    setStaff((current) => current.map((staffItem) => (staffItem.staffId === updated.staffId ? updated : staffItem)))
    setSelected((current) => (current?.staffId === updated.staffId ? updated : current))
    setDisableTarget(null)
  }

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <AdminShell>
        <AdminPageHeader
          eyebrow="Staff management"
          title="Manage staff accounts"
          description="Create staff logins, review linked profiles, and disable accounts for staff who have left while preserving operational history."
          breadcrumbs={[
            { label: 'Tong quan', href: '/admin/dashboard' },
            { label: 'Staff' },
          ]}
          actions={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void loadStaff()}
                className="rounded-xl border border-outline-variant bg-white px-4 py-2.5 font-display text-sm font-medium text-on-surface shadow-sm transition hover:border-brand-orange/40 hover:text-brand-orange"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={() => setCreateStaffOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-orange px-5 py-2.5 font-display text-sm font-bold text-white shadow-lg shadow-brand-orange/25 transition hover:bg-brand-orangeHover active:scale-[0.98]"
              >
                <IconPlus className="h-4 w-4" />
                Create staff
              </button>
            </div>
          }
        />

        <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
          <AdminToast message={toast} onDismiss={() => setToast('')} />

          {errorMessage && (
            <div className="rounded-xl border border-error/30 bg-error-container/30 px-4 py-3 text-sm text-error">
              {errorMessage}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminStatCard label="Total staff" value={stats.total} icon={<IconBookings className="h-5 w-5" />} />
            <AdminStatCard label="Active" value={stats.active} accent="secondary" icon={<span>OK</span>} />
            <AdminStatCard label="Disabled" value={stats.disabled} accent="tertiary" icon={<span>!</span>} />
            <AdminStatCard label="Email verified" value={stats.verified} accent="primary" icon={<span>@</span>} />
          </div>

          <AdminStaffFiltersBar filters={filters} resultCount={visibleStaff.length} onChange={setFilters} />

          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-on-surface">Staff directory</h2>
                <p className="text-xs text-on-surface-variant">
                  The backend supports list, detail, create, and disable. Edit and re-enable remain future scope.
                </p>
              </div>
              <p className="text-xs text-on-surface-variant">Select Detail to inspect profile and login state</p>
            </div>

            <AdminStaffTable
              staff={visibleStaff}
              isLoading={isLoading}
              selectedId={selected?.staffId ?? null}
              onSelect={(item) => void handleSelect(item)}
              onDisable={setDisableTarget}
            />
          </section>
        </div>

        <AdminStaffDetailPanel
          staff={selected}
          onClose={() => setSelected(null)}
          onDisable={handleDisableStaff}
        />

        <AdminStaffCreateModal
          open={createStaffOpen}
          onClose={() => setCreateStaffOpen(false)}
          onSubmit={handleCreateStaff}
        />

        {disableTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/50 p-4 backdrop-blur-sm">
            <section className="w-full max-w-md rounded-2xl border border-outline-variant bg-white p-5 shadow-[var(--shadow-elevated)]">
              <p className="font-display text-lg font-bold text-on-surface">Disable staff account?</p>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                {disableTarget.fullName} will no longer be able to sign in. Their staff profile and history will stay
                traceable.
              </p>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setDisableTarget(null)}
                  className="flex-1 rounded-xl border border-outline py-2.5 font-display text-sm font-medium text-on-surface-variant hover:bg-surface-container-low"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleDisableStaff(disableTarget)}
                  className="flex-1 rounded-xl bg-error py-2.5 font-display text-sm font-medium text-white hover:bg-error/90"
                >
                  Disable
                </button>
              </div>
            </section>
          </div>
        )}
      </AdminShell>
    </AuthGuard>
  )
}
