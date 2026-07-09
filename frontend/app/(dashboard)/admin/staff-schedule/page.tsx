'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminShell from '@/components/admin/AdminShell'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminToast from '@/components/admin/AdminToast'
import { IconBookings, IconPlus, IconSearch } from '@/components/admin/AdminIcons'
import AdminStaffCreateModal from '@/components/admin/staff/AdminStaffCreateModal'
import {
  decideAdminShiftRegistration,
  fetchAdminShiftRegistrations,
  type AdminShiftRegistration,
  type AdminShiftRegistrationStatus,
  type ShiftRegistrationFilters,
} from '@/lib/admin/staff-schedule/adminShiftRegistrationApi'
import { createStaffAccount, type StaffAccountFormData } from '@/lib/admin/staff/adminStaffApi'

type CalendarMode = 'week' | 'month'
type DayModalState = { open: false } | { open: true; date: string }

const DEFAULT_RANGE = getNextWeekRange()

const DEFAULT_FILTERS: ShiftRegistrationFilters = {
  status: 'ALL',
  fromDate: DEFAULT_RANGE.fromDate,
  toDate: DEFAULT_RANGE.toDate,
  staffId: '',
  query: '',
}

export default function AdminStaffSchedulePage() {
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('week')
  const [anchorDate, setAnchorDate] = useState(() => parseDate(DEFAULT_RANGE.fromDate))
  const [filters, setFilters] = useState<ShiftRegistrationFilters>(DEFAULT_FILTERS)
  const [registrations, setRegistrations] = useState<AdminShiftRegistration[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [dayModal, setDayModal] = useState<DayModalState>({ open: false })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [createStaffOpen, setCreateStaffOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const visibleRange = useMemo(() => getVisibleRange(anchorDate, calendarMode), [anchorDate, calendarMode])
  const visibleDays = useMemo(() => getVisibleDays(anchorDate, calendarMode), [anchorDate, calendarMode])

  const requestFilters = useMemo<ShiftRegistrationFilters>(
    () => ({
      ...filters,
      status: 'ALL',
      fromDate: visibleRange.fromDate,
      toDate: visibleRange.toDate,
    }),
    [filters, visibleRange.fromDate, visibleRange.toDate],
  )

  const loadRegistrations = useCallback(async () => {
    setIsLoading(true)

    try {
      const data = await fetchAdminShiftRegistrations(requestFilters)
      setRegistrations(data)
      setSelectedIds((current) => {
        const pendingIds = new Set(data.filter((item) => item.status === 'PENDING').map((item) => item.id))
        return new Set([...current].filter((id) => pendingIds.has(id)))
      })
      setErrorMessage('')
    } catch (error) {
      setRegistrations([])
      setSelectedIds(new Set())
      setErrorMessage(error instanceof Error ? error.message : 'Khong the tai danh sach dang ky ca lam.')
    } finally {
      setIsLoading(false)
    }
  }, [requestFilters])

  useEffect(() => {
    const timer = setTimeout(() => void loadRegistrations(), 200)
    return () => clearTimeout(timer)
  }, [loadRegistrations])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  const registrationsByDate = useMemo(() => groupRegistrationsByDate(registrations), [registrations])

  const stats = useMemo(() => {
    return {
      total: registrations.length,
      pending: registrations.filter((item) => item.status === 'PENDING').length,
      approved: registrations.filter((item) => item.status === 'APPROVED').length,
      selected: selectedIds.size,
    }
  }, [registrations, selectedIds])

  const updateFilter = (key: 'query' | 'staffId', value: string) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const handleModeChange = (mode: CalendarMode) => {
    setCalendarMode(mode)
    setSelectedIds(new Set())
    setDayModal({ open: false })
  }

  const handleMovePeriod = (direction: -1 | 1) => {
    setAnchorDate((current) => {
      const nextDate = new Date(current)
      if (calendarMode === 'week') {
        nextDate.setDate(current.getDate() + direction * 7)
      } else {
        nextDate.setMonth(current.getMonth() + direction)
      }
      return nextDate
    })
    setSelectedIds(new Set())
    setDayModal({ open: false })
  }

  const toggleRegistration = (registration: AdminShiftRegistration) => {
    if (registration.status !== 'PENDING') return

    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(registration.id)) {
        next.delete(registration.id)
      } else {
        next.add(registration.id)
      }
      return next
    })
  }

  const handleSaveSchedule = async () => {
    const selectedRegistrations = registrations.filter(
      (registration) => selectedIds.has(registration.id) && registration.status === 'PENDING',
    )

    if (selectedRegistrations.length === 0) {
      setErrorMessage('Vui long chon it nhat mot dang ky ca lam truoc khi save.')
      return
    }

    setIsSaving(true)
    setErrorMessage('')

    try {
      for (const registration of selectedRegistrations) {
        await decideAdminShiftRegistration(registration.id, true)
      }

      setSelectedIds(new Set())
      setToast(`Da save ${selectedRegistrations.length} ca vao lich lam viec cua staff.`)
      await loadRegistrations()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Khong the save lich staff.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateStaff = async (data: StaffAccountFormData) => {
    const createdStaff = await createStaffAccount(data)
    setToast(`Da tao staff #${createdStaff.staffId} - ${createdStaff.email}.`)
    await loadRegistrations()
    return createdStaff
  }

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <AdminShell>
        <AdminPageHeader
          eyebrow="Lich staff"
          title="Xep ca lam theo tuan hoac thang"
          description="Bam vao tung ngay de chon staff da dang ky. Khi save, cac ca duoc chon se thanh lich lam viec chinh thuc va hien ve trang staff."
          breadcrumbs={[
            { label: 'Tong quan', href: '/admin/dashboard' },
            { label: 'Lich staff' },
          ]}
          actions={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCreateStaffOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-orange px-5 py-2.5 font-display text-sm font-bold text-white shadow-lg shadow-brand-orange/25 transition hover:bg-brand-orangeHover"
              >
                <IconPlus className="h-4 w-4" />
                Tao staff
              </button>
              <button
                type="button"
                onClick={() => void loadRegistrations()}
                className="rounded-xl border border-outline-variant bg-white px-4 py-2.5 font-display text-sm font-medium text-on-surface shadow-sm transition hover:border-brand-orange/40 hover:text-brand-orange"
              >
                Lam moi
              </button>
              <button
                type="button"
                onClick={() => void handleSaveSchedule()}
                disabled={selectedIds.size === 0 || isSaving}
                className="rounded-xl bg-brand-orange px-5 py-2.5 font-display text-sm font-bold text-white shadow-lg shadow-brand-orange/25 transition hover:bg-brand-orangeHover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? 'Dang save...' : `Save lich (${selectedIds.size})`}
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
            <AdminStatCard label="Dang ky" value={stats.total} icon={<IconBookings className="h-5 w-5" />} />
            <AdminStatCard label="Cho xep ca" value={stats.pending} accent="tertiary" icon={<span>...</span>} />
            <AdminStatCard label="Da len lich" value={stats.approved} accent="secondary" icon={<span>OK</span>} />
            <AdminStatCard label="Da chon" value={stats.selected} accent="primary" icon={<span>+</span>} />
          </div>

          <ScheduleToolbar
            mode={calendarMode}
            rangeLabel={formatRangeLabel(visibleRange.fromDate, visibleRange.toDate, calendarMode)}
            filters={filters}
            resultCount={registrations.length}
            onModeChange={handleModeChange}
            onMove={handleMovePeriod}
            onToday={() => {
              setAnchorDate(parseDate(DEFAULT_RANGE.fromDate))
              setSelectedIds(new Set())
              setDayModal({ open: false })
            }}
            onFilterChange={updateFilter}
          />

          <ScheduleCalendar
            mode={calendarMode}
            days={visibleDays}
            anchorDate={anchorDate}
            registrationsByDate={registrationsByDate}
            selectedIds={selectedIds}
            isLoading={isLoading}
            onOpenDay={(date) => setDayModal({ open: true, date })}
          />
        </div>

        {dayModal.open && (
          <DayRegistrationModal
            date={dayModal.date}
            registrations={registrationsByDate[dayModal.date] ?? []}
            selectedIds={selectedIds}
            onToggle={toggleRegistration}
            onClose={() => setDayModal({ open: false })}
          />
        )}

        <AdminStaffCreateModal
          open={createStaffOpen}
          onClose={() => setCreateStaffOpen(false)}
          onSubmit={handleCreateStaff}
        />
      </AdminShell>
    </AuthGuard>
  )
}

function ScheduleToolbar({
  mode,
  rangeLabel,
  filters,
  resultCount,
  onModeChange,
  onMove,
  onToday,
  onFilterChange,
}: {
  mode: CalendarMode
  rangeLabel: string
  filters: ShiftRegistrationFilters
  resultCount: number
  onModeChange: (mode: CalendarMode) => void
  onMove: (direction: -1 | 1) => void
  onToday: () => void
  onFilterChange: (key: 'query' | 'staffId', value: string) => void
}) {
  return (
    <section className="rounded-2xl border border-outline-variant bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onMove(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-outline-variant bg-white font-display text-lg font-bold text-on-surface transition hover:border-brand-orange/40 hover:text-brand-orange"
            aria-label="Ky truoc"
          >
            &lt;
          </button>
          <div className="min-w-[240px] rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2 text-center">
            <p className="font-display text-sm font-bold text-on-surface">{rangeLabel}</p>
            <p className="mt-0.5 text-xs text-on-surface-variant">Dang hien thi {resultCount} dang ky</p>
          </div>
          <button
            type="button"
            onClick={() => onMove(1)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-outline-variant bg-white font-display text-lg font-bold text-on-surface transition hover:border-brand-orange/40 hover:text-brand-orange"
            aria-label="Ky sau"
          >
            &gt;
          </button>
          <button
            type="button"
            onClick={onToday}
            className="rounded-xl border border-outline-variant bg-white px-3 py-2 text-sm font-semibold text-on-surface transition hover:border-brand-orange/40 hover:text-brand-orange"
          >
            Tuan toi
          </button>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="inline-flex rounded-xl border border-outline-variant bg-surface-container-low p-1">
            <button
              type="button"
              onClick={() => onModeChange('week')}
              className={
                mode === 'week'
                  ? 'rounded-lg bg-brand-orange px-4 py-2 text-sm font-bold text-white shadow-sm'
                  : 'rounded-lg px-4 py-2 text-sm font-semibold text-on-surface-variant transition hover:text-brand-orange'
              }
            >
              Tuan
            </button>
            <button
              type="button"
              onClick={() => onModeChange('month')}
              className={
                mode === 'month'
                  ? 'rounded-lg bg-brand-orange px-4 py-2 text-sm font-bold text-white shadow-sm'
                  : 'rounded-lg px-4 py-2 text-sm font-semibold text-on-surface-variant transition hover:text-brand-orange'
              }
            >
              Thang
            </button>
          </div>

          <label className="relative block min-w-[240px]">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
            <input
              value={filters.query}
              onChange={(event) => onFilterChange('query', event.target.value)}
              placeholder="Tim ten, email, ma staff"
              className="h-11 w-full rounded-xl border border-outline-variant bg-surface-container-low pl-9 pr-3 text-sm outline-none transition focus:border-brand-orange focus:bg-white"
            />
          </label>

          <input
            value={filters.staffId}
            onChange={(event) => onFilterChange('staffId', event.target.value.replace(/[^\d]/g, ''))}
            placeholder="Staff ID"
            inputMode="numeric"
            className="h-11 rounded-xl border border-outline-variant bg-white px-3 text-sm outline-none transition focus:border-brand-orange"
          />
        </div>
      </div>
    </section>
  )
}

function ScheduleCalendar({
  mode,
  days,
  anchorDate,
  registrationsByDate,
  selectedIds,
  isLoading,
  onOpenDay,
}: {
  mode: CalendarMode
  days: string[]
  anchorDate: Date
  registrationsByDate: Record<string, AdminShiftRegistration[]>
  selectedIds: Set<number>
  isLoading: boolean
  onOpenDay: (date: string) => void
}) {
  if (isLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-7">
        {Array.from({ length: mode === 'week' ? 7 : 35 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-2xl border border-outline-variant bg-white shadow-[var(--shadow-card)]" />
        ))}
      </div>
    )
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-[var(--shadow-card)]">
      <div className="grid grid-cols-7 border-b border-outline-variant bg-surface-container-low text-center text-xs font-bold uppercase text-on-surface-variant">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((label) => (
          <div key={label} className="px-2 py-3">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-7">
        {days.map((date) => (
          <ScheduleDayCell
            key={date}
            date={date}
            dimmed={mode === 'month' && !isSameMonth(parseDate(date), anchorDate)}
            registrations={registrationsByDate[date] ?? []}
            selectedIds={selectedIds}
            onOpen={() => onOpenDay(date)}
          />
        ))}
      </div>
    </section>
  )
}

function ScheduleDayCell({
  date,
  dimmed,
  registrations,
  selectedIds,
  onOpen,
}: {
  date: string
  dimmed: boolean
  registrations: AdminShiftRegistration[]
  selectedIds: Set<number>
  onOpen: () => void
}) {
  const pending = registrations.filter((item) => item.status === 'PENDING').length
  const approved = registrations.filter((item) => item.status === 'APPROVED').length
  const selected = registrations.filter((item) => selectedIds.has(item.id)).length
  const previewItems = registrations.slice(0, 3)

  return (
    <button
      type="button"
      onClick={onOpen}
      className={[
        'min-h-44 border-b border-outline-variant p-3 text-left transition hover:bg-primary-container/20 md:border-r',
        dimmed ? 'bg-surface-container-low/60 text-on-surface-variant' : 'bg-white text-on-surface',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-sm font-bold">{formatDayNumber(date)}</p>
          <p className="mt-0.5 text-xs text-on-surface-variant">{formatWeekday(date)}</p>
        </div>
        {selected > 0 && (
          <span className="rounded-full bg-brand-orange px-2 py-1 text-xs font-bold text-white">{selected} chon</span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-bold">
        <span className="rounded-full bg-[#FEF3C7] px-2 py-1 text-[#92400E]">{pending} cho</span>
        <span className="rounded-full bg-[#E8F5EC] px-2 py-1 text-secondary">{approved} lich</span>
      </div>

      <div className="mt-3 space-y-2">
        {previewItems.length === 0 ? (
          <p className="rounded-xl border border-dashed border-outline-variant px-3 py-4 text-center text-xs text-on-surface-variant">
            Chua co staff dang ky
          </p>
        ) : (
          previewItems.map((registration) => (
            <div key={registration.id} className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2">
              <p className="truncate text-xs font-bold text-on-surface">{registration.staffName}</p>
              <p className="mt-0.5 text-[11px] text-on-surface-variant">
                {registration.startTime} - {registration.endTime}
              </p>
            </div>
          ))
        )}
        {registrations.length > previewItems.length && (
          <p className="text-center text-xs font-semibold text-brand-orange">+{registrations.length - previewItems.length} dang ky</p>
        )}
      </div>
    </button>
  )
}

function DayRegistrationModal({
  date,
  registrations,
  selectedIds,
  onToggle,
  onClose,
}: {
  date: string
  registrations: AdminShiftRegistration[]
  selectedIds: Set<number>
  onToggle: (registration: AdminShiftRegistration) => void
  onClose: () => void
}) {
  const sortedRegistrations = [...registrations].sort(
    (first, second) =>
      first.startTime.localeCompare(second.startTime) ||
      first.staffName.localeCompare(second.staffName, 'vi') ||
      first.id - second.id,
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1C1E]/35 p-4">
      <section className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-[var(--shadow-elevated)]">
        <header className="flex items-start justify-between gap-4 border-b border-outline-variant px-5 py-4">
          <div>
            <h2 className="font-display text-xl font-bold text-on-surface">{formatDate(date)}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Chon staff dang ky ngay nay. Cac ca da len lich duoc giu nguyen.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-outline-variant bg-white px-3 py-2 text-sm font-bold text-on-surface transition hover:border-brand-orange/40 hover:text-brand-orange"
          >
            Dong
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-5">
          {sortedRegistrations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-6 py-12 text-center">
              <p className="font-display text-lg font-bold text-on-surface">Chua co staff dang ky ngay nay</p>
              <p className="mt-2 text-sm text-on-surface-variant">Staff dang ky xong se hien trong danh sach nay.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedRegistrations.map((registration) => {
                const checked = registration.status === 'APPROVED' || selectedIds.has(registration.id)
                const disabled = registration.status !== 'PENDING'

                return (
                  <label
                    key={registration.id}
                    className={[
                      'flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition',
                      checked
                        ? 'border-brand-orange bg-primary-container/25'
                        : 'border-outline-variant bg-white hover:border-brand-orange/30',
                      disabled ? 'cursor-not-allowed opacity-75' : '',
                    ].join(' ')}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => onToggle(registration)}
                      className="mt-1 h-4 w-4 accent-brand-orange"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-display text-base font-bold text-on-surface">{registration.staffName}</p>
                          <p className="mt-0.5 text-xs text-on-surface-variant">
                            #{registration.staffId} · {registration.staffEmail || 'Chua co email'}
                          </p>
                        </div>
                        <RegistrationStatusBadge status={registration.status} />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-on-surface">
                        {registration.startTime} - {registration.endTime}
                      </p>
                      {registration.rejectionReason && (
                        <p className="mt-2 rounded-xl bg-error-container/40 px-3 py-2 text-xs text-error">
                          {registration.rejectionReason}
                        </p>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function RegistrationStatusBadge({ status }: { status: AdminShiftRegistrationStatus }) {
  const meta: Record<AdminShiftRegistrationStatus, { label: string; className: string }> = {
    PENDING: { label: 'Cho xep ca', className: 'bg-[#FEF3C7] text-[#92400E]' },
    APPROVED: { label: 'Da len lich', className: 'bg-[#E8F5EC] text-secondary' },
    REJECTED: { label: 'Da tu choi', className: 'bg-error-container text-error' },
  }

  return (
    <span className={['inline-flex rounded-full px-3 py-1 text-xs font-bold', meta[status].className].join(' ')}>
      {meta[status].label}
    </span>
  )
}

function groupRegistrationsByDate(registrations: AdminShiftRegistration[]) {
  return registrations.reduce<Record<string, AdminShiftRegistration[]>>((acc, registration) => {
    acc[registration.workDate] = [...(acc[registration.workDate] ?? []), registration]
    return acc
  }, {})
}

function getVisibleRange(anchorDate: Date, mode: CalendarMode) {
  if (mode === 'week') {
    const start = startOfWeek(anchorDate)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return { fromDate: toDateKey(start), toDate: toDateKey(end) }
  }

  const monthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1)
  const monthEnd = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0)
  return { fromDate: toDateKey(monthStart), toDate: toDateKey(monthEnd) }
}

function getVisibleDays(anchorDate: Date, mode: CalendarMode) {
  if (mode === 'week') {
    const start = startOfWeek(anchorDate)
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      return toDateKey(date)
    })
  }

  const firstOfMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1)
  const gridStart = startOfWeek(firstOfMonth)
  const lastOfMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0)
  const gridEnd = startOfWeek(lastOfMonth)
  gridEnd.setDate(gridEnd.getDate() + 6)

  const days: string[] = []
  const cursor = new Date(gridStart)
  while (cursor <= gridEnd) {
    days.push(toDateKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

function getNextWeekRange() {
  const today = new Date()
  const monday = startOfWeek(today)
  monday.setDate(monday.getDate() + 7)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  return {
    fromDate: toDateKey(monday),
    toDate: toDateKey(sunday),
  }
}

function startOfWeek(date: Date) {
  const result = new Date(date)
  const day = result.getDay()
  const diff = day === 0 ? -6 : 1 - day
  result.setDate(result.getDate() + diff)
  result.setHours(0, 0, 0, 0)
  return result
}

function isSameMonth(firstDate: Date, secondDate: Date) {
  return firstDate.getFullYear() === secondDate.getFullYear() && firstDate.getMonth() === secondDate.getMonth()
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

function formatRangeLabel(fromDate: string, toDate: string, mode: CalendarMode) {
  if (mode === 'month') {
    return new Intl.DateTimeFormat('vi-VN', {
      month: 'long',
      year: 'numeric',
    }).format(parseDate(fromDate))
  }

  return `${formatShortDate(fromDate)} - ${formatShortDate(toDate)}`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parseDate(value))
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parseDate(value))
}

function formatDayNumber(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  }).format(parseDate(value))
}

function formatWeekday(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
  }).format(parseDate(value))
}
