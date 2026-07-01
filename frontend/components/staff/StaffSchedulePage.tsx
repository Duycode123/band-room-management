'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { useAuth } from '@/contexts/AuthContext'
import { getDisplayName, getInitials, getRoleLabel } from '@/lib/staff-profile'

type ShiftStatus = 'UPCOMING' | 'ACTIVE' | 'ENDED'

type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'

type StaffShift = {
  id: string
  date: string
  name: string
  startTime: string
  endTime: string
  staffName: string
  roomCount: number
  bookingCount: number
  pendingCount: number
  inUseCount: number
  status: ShiftStatus
}

type BookingInShift = {
  id: string
  shiftId: string
  customerName: string
  roomName: string
  startTime: string
  endTime: string
  guestCount: number
  equipment: string[]
  note?: string
  status: BookingStatus
}

type StatusMeta = {
  label: string
  className: string
}

type BookingFilterStatus = BookingStatus | 'ALL'

type BookingFilters = {
  status: BookingFilterStatus
  hasEquipment: boolean
  hasNote: boolean
}

type ConfirmAction = {
  title: string
  description: string
  confirmLabel: string
  variant?: 'primary' | 'danger'
  onConfirm: () => void
}

const defaultBookingFilters: BookingFilters = {
  status: 'ALL',
  hasEquipment: false,
  hasNote: false,
}

const WEEKDAY_LABELS = ['CN', 'THỨ 2', 'THỨ 3', 'THỨ 4', 'THỨ 5', 'THỨ 6', 'THỨ 7']
const dateFormatter = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' })
const fullDateFormatter = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const shiftStatusMeta: Record<ShiftStatus, StatusMeta> = {
  UPCOMING: {
    label: 'Sắp diễn ra',
    className: 'border-primary-container bg-primary-container text-on-primary-container',
  },
  ACTIVE: {
    label: 'Đang diễn ra',
    className: 'border-secondary-container bg-secondary-container text-on-secondary-container',
  },
  ENDED: {
    label: 'Đã kết thúc',
    className: 'border-outline-variant bg-surface-container-high text-on-surface-variant',
  },
}

const bookingStatusMeta: Record<BookingStatus, StatusMeta & { action?: string; iconClassName: string }> = {
  PENDING: {
    label: 'Chờ xác nhận',
    action: 'Xác nhận',
    className: 'border-primary-container bg-primary-container text-on-primary-container',
    iconClassName: 'bg-primary-container text-brand-orange',
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    action: 'Check-in',
    className: 'border-on-secondary-container/30 bg-on-secondary-container text-[#001A0D]',
    iconClassName: 'bg-on-secondary-container/35 text-secondary-container',
  },
  CHECKED_IN: {
    label: 'Đã check-in',
    action: 'Check-out',
    className: 'border-tertiary-container bg-tertiary-container text-on-tertiary-container',
    iconClassName: 'bg-tertiary-container text-tertiary',
  },
  IN_PROGRESS: {
    label: 'Đang sử dụng',
    action: 'Kết thúc ca',
    className: 'border-secondary-container bg-secondary-container text-on-secondary-container',
    iconClassName: 'bg-secondary-container text-on-secondary-container',
  },
  COMPLETED: {
    label: 'Hoàn tất',
    className: 'border-outline-variant bg-surface-container-high text-on-surface-variant',
    iconClassName: 'bg-surface-container text-on-surface-variant',
  },
  CANCELLED: {
    label: 'Đã hủy',
    className: 'border-outline-variant bg-surface-container-high text-on-surface-variant',
    iconClassName: 'bg-surface-container text-on-surface-variant',
  },
  NO_SHOW: {
    label: 'Không đến',
    className: 'border-error-container bg-error-container text-on-error-container',
    iconClassName: 'bg-error-container text-on-error-container',
  },
}

const bookingStatusOrder: BookingStatus[] = [
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
]

const shiftIconClassName: Record<ShiftStatus, string> = {
  UPCOMING: 'bg-primary-container text-brand-orange',
  ACTIVE: 'bg-secondary-container text-on-secondary-container',
  ENDED: 'bg-surface-container-high text-on-surface-variant',
}

export default function StaffSchedulePage() {
  const [anchorDate, setAnchorDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()))
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [bookings, setBookings] = useState<BookingInShift[]>([])
  const [activeFilters, setActiveFilters] = useState<BookingFilters>(defaultBookingFilters)
  const [draftFilters, setDraftFilters] = useState<BookingFilters>(defaultBookingFilters)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [openBookingMenuId, setOpenBookingMenuId] = useState<string | null>(null)
  const [shiftDetail, setShiftDetail] = useState<StaffShift | null>(null)
  const [bookingDetailId, setBookingDetailId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const weekDays = useMemo(() => getWeekDays(anchorDate), [anchorDate])
  const shifts = useMemo(() => createWeekShifts(weekDays), [weekDays])
  const bookingsByShift = useMemo(() => groupBookingsByShift(bookings), [bookings])
  const selectedDayShifts = shifts.filter((shift) => shift.date === selectedDate)
  const selectedShift = shifts.find((shift) => shift.id === selectedShiftId) ?? selectedDayShifts[0] ?? null
  const selectedBookings = selectedShift ? bookingsByShift[selectedShift.id] ?? [] : []
  const filteredBookings = useMemo(() => filterBookings(selectedBookings, activeFilters), [selectedBookings, activeFilters])
  const bookingDetail = useMemo(
    () => (bookingDetailId ? bookings.find((booking) => booking.id === bookingDetailId) ?? null : null),
    [bookingDetailId, bookings],
  )
  const selectedDayBookingCount = selectedDayShifts.reduce((total, shift) => total + shift.bookingCount, 0)

  useEffect(() => {
    setBookings(createInitialBookings(shifts))
    setActiveFilters(defaultBookingFilters)
    setDraftFilters(defaultBookingFilters)
    setIsFilterOpen(false)
    setOpenBookingMenuId(null)
    setBookingDetailId(null)
    setConfirmAction(null)
  }, [shifts])

  useEffect(() => {
    setIsLoading(true)
    const timer = window.setTimeout(() => setIsLoading(false), 350)
    return () => window.clearTimeout(timer)
  }, [anchorDate, selectedDate])

  useEffect(() => {
    if (selectedShift && selectedShift.id === selectedShiftId) return
    setSelectedShiftId(selectedDayShifts[0]?.id ?? null)
  }, [selectedDayShifts, selectedShift, selectedShiftId])

  useEffect(() => {
    if (!toastMessage) return
    const timer = window.setTimeout(() => setToastMessage(null), 2600)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  const goToToday = () => {
    const today = new Date()
    setAnchorDate(today)
    setSelectedDate(toDateKey(today))
  }

  const moveWeek = (direction: -1 | 1) => {
    const nextAnchor = addDays(anchorDate, direction * 7)
    setAnchorDate(nextAnchor)
    setSelectedDate(toDateKey(startOfWeek(nextAnchor)))
  }

  const updateBookingStatus = (bookingId: string, nextStatus: BookingStatus) => {
    setBookings((prev) =>
      prev.map((booking) => (booking.id === bookingId ? { ...booking, status: nextStatus } : booking)),
    )
  }

  const showToast = (message: string) => {
    setToastMessage(message)
  }

  const applyBookingStatus = (booking: BookingInShift, nextStatus: BookingStatus) => {
    updateBookingStatus(booking.id, nextStatus)
    setOpenBookingMenuId(null)
    showToast(`Đã cập nhật ${booking.id}: ${getBookingStatusMeta(nextStatus).label}`)
  }

  const requestBookingStatusChange = (
    booking: BookingInShift,
    nextStatus: BookingStatus,
    title: string,
    description: string,
    confirmLabel: string,
    variant: 'primary' | 'danger' = 'primary',
  ) => {
    setConfirmAction({
      title,
      description,
      confirmLabel,
      variant,
      onConfirm: () => {
        applyBookingStatus(booking, nextStatus)
        setConfirmAction(null)
      },
    })
  }

  const handlePrimaryBookingAction = (booking: BookingInShift) => {
    const action = getAvailableBookingActions(booking.status)[0]
    if (!action) return

    if (action.requiresConfirm) {
      requestBookingStatusChange(
        booking,
        action.nextStatus,
        action.confirmTitle,
        action.confirmDescription,
        action.label,
        action.variant,
      )
      return
    }

    applyBookingStatus(booking, action.nextStatus)
  }

  const handleCopyBookingCode = async (bookingId: string) => {
    try {
      await navigator.clipboard.writeText(bookingId)
      showToast(`Đã sao chép mã booking ${bookingId}`)
    } catch {
      showToast(`Mã booking: ${bookingId}`)
    } finally {
      setOpenBookingMenuId(null)
    }
  }

  return (
    <AuthGuard allowedRoles={['STAFF']}>
      <div className="min-h-screen bg-brand-bgGray text-on-surface lg:flex">
        <StaffSidebar />

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1480px] space-y-6">
            <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="font-display text-[32px] font-bold leading-10 tracking-[-0.02em] text-on-surface">
                  Lịch làm việc & lịch phòng
                </h1>
                <p className="mt-2 text-base leading-6 text-on-surface-variant">
                  Theo dõi ca làm, lịch phòng và booking trong từng ca.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={goToToday}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-outline bg-white px-4 font-display text-sm font-semibold text-on-surface shadow-[var(--band-shadow-card)] transition hover:bg-surface-container-low"
                >
                  <IconCalendar className="h-4 w-4" />
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => moveWeek(-1)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline bg-white text-on-surface shadow-[var(--band-shadow-card)] transition hover:bg-surface-container-low"
                  aria-label="Tuần trước"
                >
                  <IconChevron direction="left" />
                </button>
                <button
                  type="button"
                  onClick={() => moveWeek(1)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline bg-white text-on-surface shadow-[var(--band-shadow-card)] transition hover:bg-surface-container-low"
                  aria-label="Tuần sau"
                >
                  <IconChevron direction="right" />
                </button>
                <div className="h-10 rounded-lg px-4 py-2 font-display text-sm font-semibold text-on-surface">
                  {formatWeekRange(weekDays)}
                </div>
              </div>
            </header>

            {isLoading ? (
              <ScheduleSkeleton />
            ) : (
              <>
                <WeeklySchedule
                  weekDays={weekDays}
                  shifts={shifts}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />

                <div className="grid gap-5 xl:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)]">
                  <ShiftList
                    shifts={selectedDayShifts}
                    bookingsByShift={bookingsByShift}
                    selectedDate={selectedDate}
                    selectedShiftId={selectedShift?.id ?? null}
                    bookingCount={selectedDayBookingCount}
                    onSelectShift={setSelectedShiftId}
                    onViewShiftDetails={setShiftDetail}
                    onGoToday={goToToday}
                  />
                  <BookingList
                    shift={selectedShift}
                    bookings={filteredBookings}
                    totalBookingCount={selectedBookings.length}
                    filters={activeFilters}
                    draftFilters={draftFilters}
                    isFilterOpen={isFilterOpen}
                    openMenuId={openBookingMenuId}
                    onToggleFilter={() => setIsFilterOpen((open) => !open)}
                    onChangeDraftFilters={setDraftFilters}
                    onApplyFilters={() => {
                      setActiveFilters(draftFilters)
                      setIsFilterOpen(false)
                    }}
                    onResetFilters={() => {
                      setDraftFilters(defaultBookingFilters)
                      setActiveFilters(defaultBookingFilters)
                      setIsFilterOpen(false)
                    }}
                    onToggleMenu={(bookingId) => setOpenBookingMenuId((current) => (current === bookingId ? null : bookingId))}
                    onViewBooking={(booking) => {
                      setBookingDetailId(booking.id)
                      setOpenBookingMenuId(null)
                    }}
                    onCopyBookingCode={handleCopyBookingCode}
                    onPrimaryAction={handlePrimaryBookingAction}
                    onRequestStatusChange={requestBookingStatusChange}
                    onChooseAnotherDay={goToToday}
                  />
                </div>
              </>
            )}
          </div>
        </main>

        {shiftDetail && (
          <ShiftDetailPanel
            shift={shiftDetail}
            bookings={bookingsByShift[shiftDetail.id] ?? []}
            onClose={() => setShiftDetail(null)}
            onFocusBookings={() => {
              setSelectedShiftId(shiftDetail.id)
              setShiftDetail(null)
            }}
          />
        )}
        {bookingDetail && (
          <BookingDetailPanel
            booking={bookingDetail}
            onClose={() => setBookingDetailId(null)}
            onPrimaryAction={handlePrimaryBookingAction}
          />
        )}
        {confirmAction && (
          <ConfirmDialog
            action={confirmAction}
            onCancel={() => setConfirmAction(null)}
          />
        )}
        {toastMessage && <Toast message={toastMessage} />}
      </div>
    </AuthGuard>
  )
}

function StaffSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const displayName = getDisplayName(user)
  const roleLabel = getRoleLabel(user?.role)
  const avatarInitial = getInitials(displayName || user?.email)
  const menuItems = [
    { label: 'Lịch làm việc', href: '/staff/dashboard' },
    { label: 'Phòng & Thiết bị', href: '/staff/rooms' },
    { label: 'Check-in', href: '/staff/check-in' },
    { label: 'Booking', href: '/staff/bookings' },
    { label: 'Khách hàng', href: '/staff/customers' },
    { label: 'Thông báo', href: '/staff/notifications' },
    { label: 'Báo cáo', href: '/staff/reports' },
    { label: 'Cài đặt', href: '/staff/settings' },
  ]

  return (
    <aside className="hidden w-72 shrink-0 border-r border-secondary-container/60 bg-secondary px-4 py-6 text-inverse-on-surface lg:flex lg:flex-col">
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-orange text-white shadow-[0_12px_28px_rgba(255,117,24,0.24)]">
          <IconLogo />
        </div>
        <div>
          <p className="font-display text-lg font-bold leading-none text-inverse-on-surface">BandHub Studio</p>
          <p className="mt-1 font-display text-xs font-bold uppercase tracking-wide text-brand-orange">Staff</p>
        </div>
      </div>

      <div className="mt-8 border-t border-secondary-container/60 pt-6">
        <div className="rounded-xl border border-secondary-container/70 bg-secondary-container/45 px-3 py-3">
          <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-primary-container font-display font-bold text-on-primary-container">
            {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : avatarInitial}
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold text-inverse-on-surface">{displayName}</p>
            <p className="text-xs text-on-secondary-container">{roleLabel}</p>
          </div>
          </div>
        </div>
      </div>

      <nav className="mt-6 space-y-1">
        {menuItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.label}
              href={item.href}
              className={[
                'relative flex h-12 items-center gap-3 rounded-lg px-3 font-display text-sm font-medium transition',
                active
                  ? 'bg-[rgba(255,117,24,0.12)] text-brand-orange before:absolute before:left-0 before:top-2 before:h-8 before:w-[3px] before:rounded-full before:bg-brand-orange'
                  : 'text-inverse-on-surface/75 hover:bg-brand-orange/10 hover:text-inverse-on-surface',
              ].join(' ')}
            >
              <span className="flex h-5 w-5 items-center justify-center">
                <IconMenuDot active={active} />
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto space-y-4">
        <div className="rounded-xl border border-secondary-container/70 bg-secondary-container/45 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-orange text-white">
              <IconLogo />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-inverse-on-surface">BandHub Studio</p>
              <p className="text-xs text-on-secondary-container">123 Âu Cơ, Tân Bình</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-brand-orange/20 bg-brand-orange/10 p-4">
          <p className="font-display text-sm font-bold text-inverse-on-surface">Cần hỗ trợ?</p>
          <p className="mt-1 text-xs text-inverse-on-surface/75">Hotline: 1900 1234</p>
        </div>
      </div>
    </aside>
  )
}

function WeeklySchedule({
  weekDays,
  shifts,
  selectedDate,
  onSelectDate,
}: {
  weekDays: Date[]
  shifts: StaffShift[]
  selectedDate: string
  onSelectDate: (date: string) => void
}) {
  return (
    <section className="overflow-hidden">
      <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin] [scrollbar-color:#C9C2B6_transparent]">
        {weekDays.map((day) => {
          const dayKey = toDateKey(day)
          const dayShifts = shifts.filter((shift) => shift.date === dayKey)
          const bookingCount = dayShifts.reduce((total, shift) => total + shift.bookingCount, 0)
          const selected = selectedDate === dayKey

          return (
            <DayCard
              key={dayKey}
              date={day}
              shifts={dayShifts}
              bookingCount={bookingCount}
              selected={selected}
              onSelect={() => onSelectDate(dayKey)}
            />
          )
        })}
      </div>
    </section>
  )
}

function DayCard({
  date,
  shifts,
  bookingCount,
  selected,
  onSelect,
}: {
  date: Date
  shifts: StaffShift[]
  bookingCount: number
  selected: boolean
  onSelect: () => void
}) {
  const empty = shifts.length === 0

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'min-h-[270px] w-[178px] shrink-0 rounded-xl border p-4 text-left transition',
        selected
          ? 'border-brand-orange bg-gradient-to-br from-white to-primary-container shadow-[var(--band-shadow-card)]'
          : empty
            ? 'border-outline-variant bg-surface-container text-on-surface-variant'
            : 'border-outline-variant bg-white shadow-[var(--band-shadow-card)] hover:border-brand-orange/35 hover:bg-surface-container-low',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={['font-display text-xs font-semibold uppercase tracking-wide', selected ? 'text-brand-orange' : 'text-on-surface-variant'].join(' ')}>
            {WEEKDAY_LABELS[date.getDay()]}
          </p>
          <p className="mt-2 font-display text-2xl font-bold leading-none text-on-surface">{dateFormatter.format(date)}</p>
        </div>
        {selected && <span className="rounded-full bg-brand-orange px-2.5 py-1 font-display text-[10px] font-bold text-white">Đang chọn</span>}
      </div>

      <p className={['mt-3 text-sm font-medium', selected ? 'text-on-primary-container' : 'text-on-surface'].join(' ')}>
        {shifts.length} ca · {bookingCount} booking
      </p>

      <div className="mt-5 space-y-2">
        {shifts.length > 0 ? (
          shifts.slice(0, 3).map((shift) => (
            <div key={shift.id} className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3 shadow-sm hover:bg-surface-container">
              <p className="font-display text-sm font-bold text-on-surface">{shift.name}</p>
              <p className="mt-1 text-xs text-on-surface-variant">
                {shift.startTime} - {shift.endTime}
              </p>
            </div>
          ))
        ) : (
          <div className="flex min-h-[132px] flex-col items-center justify-center rounded-lg border border-dashed border-outline bg-surface-container px-3 text-center">
            <IconCalendar className="h-8 w-8 text-outline" />
            <p className="mt-3 font-display text-sm font-semibold text-on-surface">Không có ca</p>
            <p className="mt-1 text-xs text-on-surface-variant">Chưa được phân công</p>
          </div>
        )}
      </div>
    </button>
  )
}

function ShiftList({
  shifts,
  bookingsByShift,
  selectedDate,
  selectedShiftId,
  bookingCount,
  onSelectShift,
  onViewShiftDetails,
  onGoToday,
}: {
  shifts: StaffShift[]
  bookingsByShift: Record<string, BookingInShift[]>
  selectedDate: string
  selectedShiftId: string | null
  bookingCount: number
  onSelectShift: (shiftId: string) => void
  onViewShiftDetails: (shift: StaffShift) => void
  onGoToday: () => void
}) {
  return (
    <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-[var(--band-shadow-card)]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-on-surface">Ca làm trong ngày</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{formatFullDate(selectedDate)}</p>
        </div>
        <span className="rounded-full border border-outline-variant bg-primary-container px-3 py-1.5 font-display text-xs font-semibold text-on-primary-container">
          {shifts.length} ca · {bookingCount} booking
        </span>
      </div>

      {shifts.length === 0 ? (
        <EmptyState
          title="Không có ca trong ngày"
          description="Bạn chưa được phân công ca nào trong ngày này. Hãy chọn ngày khác để xem lịch."
          actionLabel="Chọn ngày khác"
          onAction={onGoToday}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          {shifts.map((shift) => (
            <ShiftCard
              key={shift.id}
              shift={shift}
              selected={selectedShiftId === shift.id}
              bookings={bookingsByShift[shift.id] ?? []}
              onSelect={() => onSelectShift(shift.id)}
              onViewDetails={() => onViewShiftDetails(shift)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function ShiftCard({
  shift,
  selected,
  bookings,
  onSelect,
  onViewDetails,
}: {
  shift: StaffShift
  selected: boolean
  bookings: BookingInShift[]
  onSelect: () => void
  onViewDetails: () => void
}) {
  const pendingCount = bookings.filter((booking) => booking.status === 'PENDING').length || shift.pendingCount
  const inUseCount = bookings.filter((booking) => booking.status === 'IN_PROGRESS').length || shift.inUseCount

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onSelect()
      }}
      className={[
        'relative cursor-pointer overflow-hidden rounded-xl border bg-white p-5 transition',
        selected
          ? 'border-brand-orange bg-primary-container/25 shadow-[var(--band-shadow-card)]'
          : 'border-outline-variant shadow-[var(--band-shadow-card)] hover:border-brand-orange/35 hover:bg-surface-container-low',
      ].join(' ')}
    >
      {selected && <span className="absolute inset-x-0 top-0 h-1 bg-brand-orange" />}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div className={['flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', shiftIconClassName[shift.status]].join(' ')}>
            <IconShift status={shift.status} />
          </div>
          <div className="min-w-0">
          <h3 className="font-display text-xl font-semibold text-on-surface">{shift.name}</h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              {shift.startTime} - {shift.endTime}
            </p>
          </div>
        </div>
        <StatusBadge meta={getShiftStatusMeta(shift.status)} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <ShiftMetric label="Nhân viên" value={shift.staffName} icon />
        <ShiftMetric label="Phòng" value={shift.roomCount.toString()} />
        <ShiftMetric label="Booking" value={shift.bookingCount.toString()} />
        <ShiftMetric label="Chờ xác nhận" value={pendingCount.toString()} highlight={pendingCount > 0} />
        <ShiftMetric label="Đang sử dụng" value={inUseCount.toString()} highlight={inUseCount > 0} />
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onViewDetails()
          }}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-outline bg-white px-3 font-display text-xs font-semibold text-on-surface transition hover:bg-surface-container-low"
        >
          Xem chi tiết
          <IconChevron direction="right" />
        </button>
      </div>
    </article>
  )
}

function ShiftMetric({ label, value, icon = false, highlight = false }: { label: string; value: string; icon?: boolean; highlight?: boolean }) {
  return (
    <div className="min-w-0 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3">
      <p className="font-display text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">{label}</p>
      <p className={['mt-2 truncate font-display text-sm font-bold', highlight ? 'text-brand-orange' : 'text-on-surface'].join(' ')}>
        {icon && <span className="mr-1 text-brand-orange">♙</span>}
        {value}
      </p>
    </div>
  )
}

function BookingList({
  shift,
  bookings,
  totalBookingCount,
  filters,
  draftFilters,
  isFilterOpen,
  openMenuId,
  onToggleFilter,
  onChangeDraftFilters,
  onApplyFilters,
  onResetFilters,
  onToggleMenu,
  onViewBooking,
  onCopyBookingCode,
  onPrimaryAction,
  onRequestStatusChange,
  onChooseAnotherDay,
}: {
  shift: StaffShift | null
  bookings: BookingInShift[]
  totalBookingCount: number
  filters: BookingFilters
  draftFilters: BookingFilters
  isFilterOpen: boolean
  openMenuId: string | null
  onToggleFilter: () => void
  onChangeDraftFilters: (filters: BookingFilters) => void
  onApplyFilters: () => void
  onResetFilters: () => void
  onToggleMenu: (bookingId: string) => void
  onViewBooking: (booking: BookingInShift) => void
  onCopyBookingCode: (bookingId: string) => void
  onPrimaryAction: (booking: BookingInShift) => void
  onRequestStatusChange: (
    booking: BookingInShift,
    nextStatus: BookingStatus,
    title: string,
    description: string,
    confirmLabel: string,
    variant?: 'primary' | 'danger',
  ) => void
  onChooseAnotherDay: () => void
}) {
  const hasActiveFilters = filters.status !== 'ALL' || filters.hasEquipment || filters.hasNote

  return (
    <section className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-[var(--band-shadow-card)]">
      <div className="flex items-start justify-between gap-3 border-b border-outline-variant px-5 py-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-on-surface">
            Booking trong ca
            {shift && <span className="font-sans text-sm font-medium text-on-surface-variant"> · {shift.name} ({shift.startTime} - {shift.endTime})</span>}
          </h2>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={onToggleFilter}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-outline bg-white px-3 font-display text-sm font-semibold text-on-surface shadow-sm transition hover:bg-surface-container-low"
          >
            <IconFilter className="h-4 w-4" />
            Lọc
            {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-brand-orange" />}
          </button>
          {isFilterOpen && (
            <BookingFilterPopover
              draftFilters={draftFilters}
              onChange={onChangeDraftFilters}
              onApply={onApplyFilters}
              onReset={onResetFilters}
            />
          )}
        </div>
      </div>

      <div className="p-4">
        {!shift ? (
          <EmptyState title="Chưa chọn ca" description="Chọn một ca trong ngày để xem danh sách booking cần xử lý." />
        ) : bookings.length === 0 ? (
          hasActiveFilters && totalBookingCount > 0 ? (
            <EmptyState
              title="Không tìm thấy booking phù hợp"
              description="Thử đổi bộ lọc hoặc chọn ca khác."
              actionLabel="Đặt lại bộ lọc"
              onAction={onResetFilters}
            />
          ) : (
            <EmptyState
              title="Không có booking trong ca này"
              description="Ca làm này hiện chưa có booking nào. Hãy chọn ca khác để tiếp tục theo dõi."
              actionLabel="Chọn ngày khác"
              onAction={onChooseAnotherDay}
            />
          )
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <BookingRow
                key={booking.id}
                booking={booking}
                menuOpen={openMenuId === booking.id}
                onToggleMenu={() => onToggleMenu(booking.id)}
                onView={() => onViewBooking(booking)}
                onCopy={() => onCopyBookingCode(booking.id)}
                onPrimaryAction={() => onPrimaryAction(booking)}
                onMarkNoShow={() =>
                  onRequestStatusChange(
                    booking,
                    'NO_SHOW',
                    'Đánh dấu không đến?',
                    `Booking ${booking.id} sẽ được chuyển sang trạng thái Không đến.`,
                    'Đánh dấu',
                    'danger',
                  )
                }
                onCancelBooking={() =>
                  onRequestStatusChange(
                    booking,
                    'CANCELLED',
                    'Hủy booking này?',
                    `Booking ${booking.id} sẽ bị hủy trong giao diện hiện tại.`,
                    'Hủy booking',
                    'danger',
                  )
                }
              />
            ))}
          </div>
        )}
      </div>

      {shift && bookings.length > 0 && (
        <div className="border-t border-outline-variant bg-surface-container-low px-5 py-3 text-sm text-on-surface-variant">
          Hiển thị {bookings.length} booking{hasActiveFilters ? ` / ${totalBookingCount}` : ''}
        </div>
      )}
    </section>
  )
}

function BookingFilterPopover({
  draftFilters,
  onChange,
  onApply,
  onReset,
}: {
  draftFilters: BookingFilters
  onChange: (filters: BookingFilters) => void
  onApply: () => void
  onReset: () => void
}) {
  const options: Array<{ value: BookingFilterStatus; label: string }> = [
    { value: 'ALL', label: 'Tất cả' },
    ...bookingStatusOrder.map((status) => ({ value: status, label: getBookingStatusMeta(status).label })),
  ]

  return (
    <div className="absolute right-0 top-11 z-30 w-72 rounded-xl border border-outline-variant bg-white p-4 shadow-[var(--band-shadow-elevated)]">
      <p className="font-display text-sm font-bold text-on-surface">Lọc booking</p>
      <div className="mt-3 space-y-2">
        {options.map((option) => (
          <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-on-surface hover:bg-surface-container-low">
            <input
              type="radio"
              name="booking-status-filter"
              checked={draftFilters.status === option.value}
              onChange={() => onChange({ ...draftFilters, status: option.value })}
              className="accent-brand-orange"
            />
            {option.label}
          </label>
        ))}
      </div>

      <div className="mt-3 border-t border-outline-variant pt-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-on-surface hover:bg-surface-container-low">
          <input
            type="checkbox"
            checked={draftFilters.hasEquipment}
            onChange={(event) => onChange({ ...draftFilters, hasEquipment: event.target.checked })}
            className="accent-brand-orange"
          />
          Có thuê thiết bị
        </label>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-on-surface hover:bg-surface-container-low">
          <input
            type="checkbox"
            checked={draftFilters.hasNote}
            onChange={(event) => onChange({ ...draftFilters, hasNote: event.target.checked })}
            className="accent-brand-orange"
          />
          Có ghi chú
        </label>
      </div>

      <div className="mt-4 flex gap-2">
        <button type="button" onClick={onReset} className="h-9 flex-1 rounded-lg border border-outline bg-white font-display text-sm font-semibold text-on-surface hover:bg-surface-container-low">
          Đặt lại
        </button>
        <button type="button" onClick={onApply} className="h-9 flex-1 rounded-lg bg-brand-orange font-display text-sm font-semibold text-white hover:bg-brand-orangeHover">
          Áp dụng
        </button>
      </div>
    </div>
  )
}

function BookingRow({
  booking,
  menuOpen,
  onToggleMenu,
  onView,
  onCopy,
  onPrimaryAction,
  onMarkNoShow,
  onCancelBooking,
}: {
  booking: BookingInShift
  menuOpen: boolean
  onToggleMenu: () => void
  onView: () => void
  onCopy: () => void
  onPrimaryAction: () => void
  onMarkNoShow: () => void
  onCancelBooking: () => void
}) {
  const meta = getBookingStatusMeta(booking.status)
  const primaryAction = getAvailableBookingActions(booking.status)[0]
  const terminal = isTerminalBookingStatus(booking.status)

  return (
    <article className="grid gap-4 rounded-xl border border-outline-variant bg-surface-container-low p-4 shadow-[var(--band-shadow-card)] transition hover:bg-surface-container sm:grid-cols-[64px_minmax(0,1fr)_auto]">
      <div className={['flex h-16 w-16 items-center justify-center rounded-lg', meta.iconClassName].join(' ')}>
        <IconBooking status={booking.status} />
      </div>

      <div className="min-w-0">
        <p className="font-display text-xs font-bold uppercase tracking-wide text-brand-orange">{booking.id}</p>
        <h3 className="mt-1 font-display text-lg font-semibold text-on-surface">{booking.customerName}</h3>
        <p className="mt-1 text-sm text-on-surface-variant">
          {booking.roomName} · {booking.startTime} - {booking.endTime} · {booking.guestCount} người
        </p>

        <div className="mt-2 flex flex-wrap gap-2">
          {booking.equipment.length > 0 ? (
            booking.equipment.map((item) => (
              <span key={item} className="rounded-full border border-outline-variant bg-surface-container px-2.5 py-1 text-xs font-medium text-on-surface-variant">
                {item}
              </span>
            ))
          ) : (
            <span className="rounded-full border border-outline-variant bg-surface-container px-2.5 py-1 text-xs font-medium text-on-surface-variant">Không thuê thiết bị</span>
          )}
        </div>

        {booking.note && <p className="mt-2 rounded-lg border border-outline-variant bg-white px-3 py-2 text-xs text-on-surface-variant">• {booking.note}</p>}
      </div>

      <div className="flex items-start justify-between gap-3 sm:flex-col sm:items-end">
        <div className="flex items-center gap-2">
          <StatusBadge meta={meta} />
          <div className="relative">
            <button
              type="button"
              onClick={onToggleMenu}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline bg-white text-on-surface-variant shadow-sm transition hover:bg-surface-container-low"
              aria-label="Mở menu booking"
            >
              <IconDots />
            </button>
            {menuOpen && (
              <BookingMenu
                terminal={terminal}
                onView={onView}
                onCopy={onCopy}
                onMarkNoShow={onMarkNoShow}
                onCancelBooking={onCancelBooking}
              />
            )}
          </div>
        </div>
        {primaryAction && (
          <button
            type="button"
            onClick={onPrimaryAction}
            className="inline-flex h-10 items-center rounded-lg bg-brand-orange px-4 font-display text-sm font-bold text-white shadow-[0_12px_28px_rgba(255,117,24,0.24)] transition hover:bg-brand-orangeHover active:scale-[0.98]"
          >
            {primaryAction.label}
          </button>
        )}
      </div>
    </article>
  )
}

function BookingMenu({
  terminal,
  onView,
  onCopy,
  onMarkNoShow,
  onCancelBooking,
}: {
  terminal: boolean
  onView: () => void
  onCopy: () => void
  onMarkNoShow: () => void
  onCancelBooking: () => void
}) {
  return (
    <div className="absolute right-0 top-9 z-20 w-52 overflow-hidden rounded-xl border border-outline-variant bg-white py-1 shadow-[var(--band-shadow-elevated)]">
      <MenuButton onClick={onView}>Xem chi tiết</MenuButton>
      <MenuButton onClick={onCopy}>Sao chép mã booking</MenuButton>
      <MenuButton onClick={onMarkNoShow} disabled={terminal}>
        Đánh dấu không đến
      </MenuButton>
      <MenuButton onClick={onCancelBooking} disabled={terminal} danger>
        Hủy booking
      </MenuButton>
    </div>
  )
}

function MenuButton({
  children,
  onClick,
  disabled = false,
  danger = false,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'block w-full px-3 py-2 text-left text-sm transition',
        disabled
          ? 'cursor-not-allowed text-on-surface-variant/40'
          : danger
            ? 'text-on-error-container hover:bg-error-container'
            : 'text-on-surface hover:bg-surface-container-low',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function ShiftDetailPanel({
  shift,
  bookings,
  onClose,
  onFocusBookings,
}: {
  shift: StaffShift
  bookings: BookingInShift[]
  onClose: () => void
  onFocusBookings: () => void
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-inverse-surface/45 backdrop-blur-sm">
      <aside className="h-full w-full max-w-xl overflow-y-auto bg-brand-bgGray p-6 shadow-[var(--band-shadow-elevated)]">
        <PanelHeader title="Chi tiết ca làm" onClose={onClose} />
        <div className="mt-5 rounded-xl border border-outline-variant bg-white p-5 shadow-[var(--band-shadow-card)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-xs font-bold uppercase tracking-wide text-brand-orange">{shift.date}</p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-on-surface">{shift.name}</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                {shift.startTime} - {shift.endTime}
              </p>
            </div>
            <StatusBadge meta={getShiftStatusMeta(shift.status)} />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <DetailMetric label="Nhân viên" value={shift.staffName} />
            <DetailMetric label="Số phòng" value={shift.roomCount.toString()} />
            <DetailMetric label="Tổng booking" value={shift.bookingCount.toString()} />
            <DetailMetric label="Chờ xác nhận" value={shift.pendingCount.toString()} />
            <DetailMetric label="Phòng đang sử dụng" value={shift.inUseCount.toString()} />
            <DetailMetric label="Ghi chú ca" value="Theo dõi phòng trước giờ nhận khách." />
          </div>

          <button
            type="button"
            onClick={onFocusBookings}
            className="mt-5 h-10 rounded-lg bg-brand-orange px-4 font-display text-sm font-bold text-white transition hover:bg-brand-orangeHover"
          >
            Xem booking trong ca
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-outline-variant bg-white p-5 shadow-[var(--band-shadow-card)]">
          <h3 className="font-display text-lg font-semibold text-on-surface">Danh sách booking</h3>
          <div className="mt-3 space-y-2">
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <div key={booking.id} className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-sm font-bold text-brand-orange">{booking.id}</p>
                      <p className="text-sm font-semibold text-on-surface">{booking.customerName}</p>
                      <p className="text-xs text-on-surface-variant">
                        {booking.roomName} · {booking.startTime} - {booking.endTime}
                      </p>
                    </div>
                    <StatusBadge meta={getBookingStatusMeta(booking.status)} />
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-lg bg-surface-container-low px-3 py-4 text-sm text-on-surface-variant">
                Ca này hiện chưa có booking.
              </p>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}

function BookingDetailPanel({
  booking,
  onClose,
  onPrimaryAction,
}: {
  booking: BookingInShift
  onClose: () => void
  onPrimaryAction: (booking: BookingInShift) => void
}) {
  const primaryAction = getAvailableBookingActions(booking.status)[0]

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-inverse-surface/45 backdrop-blur-sm">
      <aside className="h-full w-full max-w-lg overflow-y-auto bg-brand-bgGray p-6 shadow-[var(--band-shadow-elevated)]">
        <PanelHeader title="Chi tiết booking" onClose={onClose} />
        <div className="mt-5 rounded-xl border border-outline-variant bg-white p-5 shadow-[var(--band-shadow-card)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-xs font-bold uppercase tracking-wide text-brand-orange">{booking.id}</p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-on-surface">{booking.customerName}</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                {booking.roomName} · {booking.startTime} - {booking.endTime} · {booking.guestCount} người
              </p>
            </div>
            <StatusBadge meta={getBookingStatusMeta(booking.status)} />
          </div>

          <div className="mt-5 grid gap-3">
            <DetailMetric label="Thiết bị thuê thêm" value={booking.equipment.length ? booking.equipment.join(', ') : 'Không thuê thiết bị'} />
            <DetailMetric label="Ghi chú" value={booking.note ?? 'Không có ghi chú'} />
          </div>

          <div className="mt-5">
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-on-surface-variant">Timeline trạng thái</h3>
            <div className="mt-3 space-y-3">
              {['Tạo booking', 'Xác nhận', 'Check-in', 'Check-out / Hoàn tất'].map((item, index) => (
                <div key={item} className="flex items-center gap-3">
                  <span className={['h-2.5 w-2.5 rounded-full', index === 0 ? 'bg-brand-orange' : 'bg-outline'].join(' ')} />
                  <span className="text-sm text-on-surface-variant">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {primaryAction && (
            <button
              type="button"
              onClick={() => onPrimaryAction(booking)}
              className="mt-5 h-10 rounded-lg bg-brand-orange px-4 font-display text-sm font-bold text-white transition hover:bg-brand-orangeHover"
            >
              {primaryAction.label}
            </button>
          )}
        </div>
      </aside>
    </div>
  )
}

function ConfirmDialog({ action, onCancel }: { action: ConfirmAction; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-outline-variant bg-white p-5 shadow-[var(--band-shadow-elevated)]">
        <h2 className="font-display text-xl font-semibold text-on-surface">{action.title}</h2>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">{action.description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-lg border border-outline bg-white px-4 font-display text-sm font-semibold text-on-surface hover:bg-surface-container-low"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={action.onConfirm}
            className={[
              'h-10 rounded-lg px-4 font-display text-sm font-semibold text-white transition active:scale-[0.98]',
              action.variant === 'danger' ? 'bg-error hover:bg-error/90' : 'bg-brand-orange hover:bg-brand-orangeHover',
            ].join(' ')}
          >
            {action.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed right-5 top-5 z-[60] rounded-xl border border-outline-variant bg-white px-4 py-3 text-sm font-semibold text-on-surface shadow-[var(--band-shadow-elevated)]">
      {message}
    </div>
  )
}

function PanelHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h1 className="font-display text-2xl font-semibold text-on-surface">{title}</h1>
      <button
        type="button"
        onClick={onClose}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline bg-white text-on-surface transition hover:bg-surface-container-low"
        aria-label="Đóng"
      >
        ×
      </button>
    </div>
  )
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
      <p className="font-display text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">{label}</p>
      <p className="mt-1 text-sm font-semibold text-on-surface">{value}</p>
    </div>
  )
}

function StatusBadge({ meta }: { meta: StatusMeta }) {
  return <span className={['inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold', meta.className].join(' ')}>{meta.label}</span>
}

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="rounded-xl border border-dashed border-outline bg-white px-5 py-10 text-center shadow-[var(--band-shadow-card)]">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary-container text-brand-orange shadow-sm">
        <IconCalendar className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-on-surface">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">{description}</p>
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-lg bg-brand-orange px-4 py-2 font-display text-sm font-bold text-white shadow-[0_12px_28px_rgba(255,117,24,0.24)] transition hover:bg-brand-orangeHover active:scale-[0.98]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

function ScheduleSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="h-[270px] w-[178px] shrink-0 animate-pulse rounded-xl bg-white shadow-[var(--band-shadow-card)]">
            <div className="space-y-3 p-4">
              <SkeletonLine className="h-3 w-14" />
              <SkeletonLine className="h-7 w-20" />
              <SkeletonLine className="h-4 w-28" />
              <div className="pt-4 space-y-2">
                <SkeletonLine className="h-14 w-full rounded-lg" />
                <SkeletonLine className="h-14 w-full rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)]">
        <div className="rounded-xl bg-white p-5 shadow-[var(--band-shadow-card)]">
          <SkeletonLine className="h-6 w-48" />
          <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <SkeletonLine className="h-44 w-full rounded-xl" />
            <SkeletonLine className="h-44 w-full rounded-xl" />
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-[var(--band-shadow-card)]">
          <SkeletonLine className="h-6 w-52" />
          <div className="mt-5 space-y-3">
            <SkeletonLine className="h-28 w-full rounded-xl" />
            <SkeletonLine className="h-28 w-full rounded-xl" />
            <SkeletonLine className="h-28 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

function SkeletonLine({ className }: { className: string }) {
  return <div className={['animate-pulse rounded-lg bg-surface-container-high', className].join(' ')} />
}

function getShiftStatusMeta(status: ShiftStatus) {
  return shiftStatusMeta[status]
}

function getBookingStatusMeta(status: BookingStatus) {
  return bookingStatusMeta[status]
}

function getAvailableBookingActions(status: BookingStatus) {
  const actionMap: Partial<
    Record<
      BookingStatus,
      Array<{
        label: string
        nextStatus: BookingStatus
        requiresConfirm: boolean
        confirmTitle: string
        confirmDescription: string
        variant?: 'primary' | 'danger'
      }>
    >
  > = {
    PENDING: [
      {
        label: 'Xác nhận',
        nextStatus: 'CONFIRMED',
        requiresConfirm: true,
        confirmTitle: 'Xác nhận booking này?',
        confirmDescription: 'Booking sẽ chuyển sang trạng thái Đã xác nhận và có thể check-in.',
      },
    ],
    CONFIRMED: [
      {
        label: 'Check-in',
        nextStatus: 'CHECKED_IN',
        requiresConfirm: false,
        confirmTitle: '',
        confirmDescription: '',
      },
    ],
    CHECKED_IN: [
      {
        label: 'Check-out',
        nextStatus: 'COMPLETED',
        requiresConfirm: true,
        confirmTitle: 'Check-out booking này?',
        confirmDescription: 'Booking sẽ được hoàn tất sau khi check-out.',
      },
    ],
    IN_PROGRESS: [
      {
        label: 'Kết thúc',
        nextStatus: 'COMPLETED',
        requiresConfirm: true,
        confirmTitle: 'Kết thúc booking này?',
        confirmDescription: 'Booking sẽ chuyển sang trạng thái Hoàn tất.',
      },
    ],
  }

  return actionMap[status] ?? []
}

function isTerminalBookingStatus(status: BookingStatus) {
  return status === 'COMPLETED' || status === 'CANCELLED' || status === 'NO_SHOW'
}

function filterBookings(bookings: BookingInShift[], filters: BookingFilters) {
  return bookings.filter((booking) => {
    if (filters.status !== 'ALL' && booking.status !== filters.status) return false
    if (filters.hasEquipment && booking.equipment.length === 0) return false
    if (filters.hasNote && !booking.note) return false
    return true
  })
}

function createWeekShifts(days: Date[]): StaffShift[] {
  return days.flatMap((day, dayIndex) => {
    const date = toDateKey(day)
    return getShiftTemplates(dayIndex).map((template, index) => ({
      ...template,
      id: `${date}-${index}`,
      date,
      status: getShiftStatus(date, template.startTime, template.endTime),
    }))
  })
}

function getShiftTemplates(dayIndex: number): Omit<StaffShift, 'id' | 'date' | 'status'>[] {
  const templates: Array<Omit<StaffShift, 'id' | 'date' | 'status'>[]> = [
    [
      { name: 'Ca sáng', startTime: '08:00', endTime: '12:00', staffName: 'Nhân viên', roomCount: 3, bookingCount: 6, pendingCount: 1, inUseCount: 1 },
      { name: 'Ca chiều', startTime: '13:00', endTime: '17:00', staffName: 'Gia Hân', roomCount: 3, bookingCount: 0, pendingCount: 0, inUseCount: 0 },
    ],
    [
      { name: 'Ca sáng', startTime: '08:00', endTime: '12:00', staffName: 'Gia Hân', roomCount: 2, bookingCount: 3, pendingCount: 1, inUseCount: 0 },
      { name: 'Ca tối', startTime: '18:00', endTime: '22:00', staffName: 'Hoàng Nam', roomCount: 5, bookingCount: 4, pendingCount: 0, inUseCount: 2 },
    ],
    [
      { name: 'Ca sáng', startTime: '08:00', endTime: '12:00', staffName: 'Gia Hân', roomCount: 3, bookingCount: 5, pendingCount: 1, inUseCount: 1 },
      { name: 'Ca tối', startTime: '18:00', endTime: '22:00', staffName: 'Hoàng Nam', roomCount: 4, bookingCount: 4, pendingCount: 0, inUseCount: 2 },
    ],
    [
      { name: 'Ca sáng', startTime: '08:00', endTime: '12:00', staffName: 'Minh Anh', roomCount: 3, bookingCount: 4, pendingCount: 1, inUseCount: 1 },
      { name: 'Ca chiều', startTime: '13:00', endTime: '17:00', staffName: 'Tuấn Kiệt', roomCount: 2, bookingCount: 3, pendingCount: 0, inUseCount: 1 },
      { name: 'Ca tối', startTime: '18:00', endTime: '22:00', staffName: 'Hoàng Nam', roomCount: 5, bookingCount: 7, pendingCount: 2, inUseCount: 2 },
    ],
    [
      { name: 'Ca sáng', startTime: '08:00', endTime: '12:00', staffName: 'Gia Hân', roomCount: 3, bookingCount: 4, pendingCount: 1, inUseCount: 1 },
      { name: 'Ca tối', startTime: '18:00', endTime: '22:00', staffName: 'Hoàng Nam', roomCount: 4, bookingCount: 4, pendingCount: 0, inUseCount: 1 },
    ],
    [
      { name: 'Ca sáng', startTime: '08:00', endTime: '12:00', staffName: 'Tuấn Kiệt', roomCount: 4, bookingCount: 2, pendingCount: 0, inUseCount: 0 },
      { name: 'Ca chiều', startTime: '13:00', endTime: '17:00', staffName: 'Minh Anh', roomCount: 3, bookingCount: 3, pendingCount: 1, inUseCount: 1 },
    ],
    [],
  ]

  return templates[dayIndex] ?? []
}

function createInitialBookings(shifts: StaffShift[]) {
  return shifts.flatMap((shift, shiftIndex) =>
    Array.from({ length: Math.min(shift.bookingCount, 4) }).map((_, index) =>
      createBooking(shift, shiftIndex, index),
    ),
  )
}

function groupBookingsByShift(bookings: BookingInShift[]) {
  return bookings.reduce<Record<string, BookingInShift[]>>((bookingMap, booking) => {
    const existingBookings = bookingMap[booking.shiftId] ?? []
    bookingMap[booking.shiftId] = [...existingBookings, booking]
    return bookingMap
  }, {})
}

function createBooking(shift: StaffShift, shiftIndex: number, index: number): BookingInShift {
  const customers = ['Blue River Band', 'Mộc Session', 'The Monday Jam', 'Hải Đăng', 'An Acoustic']
  const rooms = ['Studio B', 'Live Room', 'Drum Booth', 'Studio Violet', 'Studio A']
  const statuses: BookingStatus[] = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW']
  const startHour = Number(shift.startTime.slice(0, 2)) + index

  return {
    id: `BK-${shift.date.slice(5).replace('-', '')}-${60 + index}`,
    shiftId: shift.id,
    customerName: customers[(shiftIndex + index) % customers.length],
    roomName: rooms[(shiftIndex + index) % rooms.length],
    startTime: `${startHour.toString().padStart(2, '0')}:00`,
    endTime: `${(startHour + 1).toString().padStart(2, '0')}:30`,
    guestCount: 3 + ((shiftIndex + index) % 4),
    equipment: index % 2 === 0 ? ['Micro Shure SM58', 'Amp guitar'] : [],
    note: index === 1 ? 'Khách yêu cầu kiểm tra mixer trước khi vào phòng.' : undefined,
    status: statuses[(shiftIndex + index) % statuses.length],
  }
}

function getShiftStatus(dateKey: string, startTime: string, endTime: string): ShiftStatus {
  const now = new Date()
  const todayKey = toDateKey(now)

  if (dateKey < todayKey) return 'ENDED'
  if (dateKey > todayKey) return 'UPCOMING'

  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  if (currentTime >= startTime && currentTime <= endTime) return 'ACTIVE'
  if (currentTime < startTime) return 'UPCOMING'
  return 'ENDED'
}

function startOfWeek(date: Date) {
  const nextDate = new Date(date)
  const day = nextDate.getDay()
  nextDate.setDate(nextDate.getDate() + (day === 0 ? -6 : 1 - day))
  nextDate.setHours(0, 0, 0, 0)
  return nextDate
}

function getWeekDays(date: Date) {
  const start = startOfWeek(date)
  return Array.from({ length: 7 }, (_, index) => addDays(start, index))
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatWeekRange(days: Date[]) {
  return `${dateFormatter.format(days[0])} - ${dateFormatter.format(days[6])}/${days[6].getFullYear()}`
}

function formatFullDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return fullDateFormatter.format(new Date(year, month - 1, day))
}

function IconLogo() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 9v6M8 5v14M12 8v8M16 3v18M20 9v6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

function IconCalendar({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconChevron({ direction }: { direction: 'left' | 'right' }) {
  return <span className="text-lg leading-none">{direction === 'left' ? '‹' : '›'}</span>
}

function IconMenuDot({ active }: { active: boolean }) {
  return <span className={['h-2.5 w-2.5 rounded-full', active ? 'bg-brand-orange' : 'bg-inverse-on-surface/35'].join(' ')} />
}

function IconFilter({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 7h14M8 12h8M10 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconDots() {
  return <span className="text-lg leading-none">···</span>
}

function IconShift({ status }: { status: ShiftStatus }) {
  if (status === 'ACTIVE') return <span className="text-xl">◐</span>
  if (status === 'ENDED') return <span className="text-xl">✓</span>
  return <span className="text-xl">☼</span>
}

function IconBooking({ status }: { status: BookingStatus }) {
  if (status === 'PENDING') return <span className="text-2xl">◷</span>
  if (status === 'CONFIRMED') return <span className="text-2xl">✓</span>
  if (status === 'CHECKED_IN') return <span className="text-2xl">◎</span>
  if (status === 'IN_PROGRESS') return <span className="text-2xl">▶</span>
  return <span className="text-2xl">•</span>
}
