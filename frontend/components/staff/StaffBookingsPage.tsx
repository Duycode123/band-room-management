'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { StaffPageShell } from './StaffShared'

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
type DateFilter = 'ALL' | 'TODAY' | 'TOMORROW' | 'THIS_WEEK'

type BookingHistoryItem = {
  id: string
  action: string
  createdAt: string
  actor: string
}

type StaffBooking = {
  id: string
  code: string
  customerName: string
  phone?: string
  roomName: string
  date: string
  startTime: string
  endTime: string
  guestCount: number
  equipment: string[]
  totalPrice: number
  note?: string
  status: BookingStatus
  checkInTime?: string
  checkOutTime?: string
  history: BookingHistoryItem[]
}

type StatusMeta = {
  label: string
  className: string
}

type BookingAction = {
  key: string
  label: string
  nextStatus?: BookingStatus
  variant?: 'primary' | 'secondary' | 'danger'
}

type AvailableBookingActions = {
  primary?: BookingAction
  secondary?: BookingAction
  menu: BookingAction[]
}

type ConfirmAction = {
  title: string
  description: string
  confirmLabel: string
  variant?: 'primary' | 'danger'
  onConfirm: () => void
}

const todayKey = formatDateKey(new Date())
const tomorrowKey = formatDateKey(addDays(new Date(), 1))
const STAFF_ACTOR = 'Nhân viên quầy'

const initialBookings: StaffBooking[] = [
  createBooking({
    id: 'b1',
    code: 'BK-0701-60',
    customerName: 'Blue River Band',
    phone: '0908 123 456',
    roomName: 'Studio A',
    date: todayKey,
    startTime: '08:00',
    endTime: '09:30',
    guestCount: 5,
    equipment: ['Micro Shure SM58', 'Amp guitar'],
    totalPrice: 520000,
    note: 'Khách cần kiểm tra mixer trước khi vào phòng.',
    status: 'PENDING',
  }),
  createBooking({
    id: 'b2',
    code: 'BK-0701-61',
    customerName: 'Mộc Session',
    phone: '0912 567 890',
    roomName: 'Live Room',
    date: todayKey,
    startTime: '09:00',
    endTime: '10:30',
    guestCount: 6,
    equipment: [],
    totalPrice: 720000,
    status: 'CONFIRMED',
    history: ['Tạo booking', 'Đã xác nhận booking'],
  }),
  createBooking({
    id: 'b3',
    code: 'BK-0701-62',
    customerName: 'The Monday Jam',
    phone: '0987 444 221',
    roomName: 'Drum Booth',
    date: todayKey,
    startTime: '10:00',
    endTime: '11:30',
    guestCount: 3,
    equipment: ['Micro drum', 'Cable pack'],
    totalPrice: 430000,
    status: 'CHECKED_IN',
    checkInTime: '10:03',
    history: ['Tạo booking', 'Đã xác nhận booking', 'Đã check-in'],
  }),
  createBooking({
    id: 'b4',
    code: 'BK-0701-63',
    customerName: 'Hải Đăng',
    phone: '0933 880 112',
    roomName: 'Studio VIP',
    date: todayKey,
    startTime: '11:00',
    endTime: '12:30',
    guestCount: 4,
    equipment: ['Keyboard Korg'],
    totalPrice: 900000,
    note: 'Khách có voucher thành viên.',
    status: 'IN_PROGRESS',
    checkInTime: '11:02',
    history: ['Tạo booking', 'Đã xác nhận booking', 'Đã check-in', 'Khách đang sử dụng phòng'],
  }),
  createBooking({
    id: 'b5',
    code: 'BK-0701-64',
    customerName: 'Noise Lab',
    phone: '0901 777 222',
    roomName: 'Studio B',
    date: todayKey,
    startTime: '13:00',
    endTime: '15:00',
    guestCount: 5,
    equipment: ['Mixer Yamaha'],
    totalPrice: 610000,
    status: 'COMPLETED',
    checkInTime: '13:00',
    checkOutTime: '15:02',
    history: ['Tạo booking', 'Đã xác nhận booking', 'Đã check-in', 'Đã check-out'],
  }),
  createBooking({
    id: 'b6',
    code: 'BK-0701-65',
    customerName: 'Late Echo',
    phone: '0978 112 334',
    roomName: 'Studio C',
    date: todayKey,
    startTime: '15:30',
    endTime: '17:00',
    guestCount: 4,
    equipment: [],
    totalPrice: 360000,
    note: 'Đã gọi nhắc nhưng khách chưa đến.',
    status: 'NO_SHOW',
    history: ['Tạo booking', 'Đã xác nhận booking', 'Đánh dấu không đến'],
  }),
  createBooking({
    id: 'b7',
    code: 'BK-0702-01',
    customerName: 'Mộc Session',
    phone: '0912 567 890',
    roomName: 'Live Room',
    date: tomorrowKey,
    startTime: '18:00',
    endTime: '20:00',
    guestCount: 7,
    equipment: ['Monitor speaker'],
    totalPrice: 840000,
    status: 'CONFIRMED',
    history: ['Tạo booking', 'Đã xác nhận booking'],
  }),
]

const statusOptions: Array<BookingStatus | 'ALL'> = [
  'ALL',
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
]

const dateOptions: Array<{ value: DateFilter; label: string }> = [
  { value: 'ALL', label: 'Tất cả ngày' },
  { value: 'TODAY', label: 'Hôm nay' },
  { value: 'TOMORROW', label: 'Ngày mai' },
  { value: 'THIS_WEEK', label: 'Tuần này' },
]

export default function StaffBookingsPage() {
  const [bookings, setBookings] = useState<StaffBooking[]>(initialBookings)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>('ALL')
  const [dateFilter, setDateFilter] = useState<DateFilter>('TODAY')
  const [roomFilter, setRoomFilter] = useState('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 320)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!toastMessage) return
    const timer = window.setTimeout(() => setToastMessage(null), 2600)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  const roomOptions = useMemo(() => ['ALL', ...Array.from(new Set(bookings.map((booking) => booking.roomName)))], [bookings])
  const filteredBookings = useMemo(
    () => filterBookings(bookings, { query, statusFilter, dateFilter, roomFilter }),
    [bookings, dateFilter, query, roomFilter, statusFilter],
  )
  const selectedBooking = useMemo(
    () => bookings.find((booking) => booking.id === selectedBookingId) ?? null,
    [bookings, selectedBookingId],
  )
  const todayBookings = bookings.filter((booking) => booking.date === todayKey)
  const kpis = [
    { label: 'Tổng booking hôm nay', value: todayBookings.length, helper: 'Tất cả booking trong ngày', icon: <IconCalendar />, className: 'bg-secondary text-on-secondary' },
    { label: 'Chờ xác nhận', value: todayBookings.filter((booking) => booking.status === 'PENDING').length, helper: 'Cần nhân viên xử lý', icon: <IconClock />, className: 'bg-primary-container text-brand-orange' },
    { label: 'Đã check-in', value: todayBookings.filter((booking) => booking.status === 'CHECKED_IN' || booking.status === 'IN_PROGRESS').length, helper: 'Khách đã đến hoặc đang dùng phòng', icon: <IconCheck />, className: 'bg-on-secondary-container text-[#001A0D]' },
    { label: 'Không đến / Đã hủy', value: todayBookings.filter((booking) => booking.status === 'NO_SHOW' || booking.status === 'CANCELLED').length, helper: 'Cần đối soát cuối ngày', icon: <IconAlert />, className: 'bg-error-container text-error' },
  ]

  const showToast = (message: string) => setToastMessage(message)

  const addBookingHistory = (booking: StaffBooking, action: string): StaffBooking => ({
    ...booking,
    history: [
      ...booking.history,
      {
        id: `${booking.id}-${Date.now()}`,
        action,
        createdAt: getCurrentTimestamp(),
        actor: STAFF_ACTOR,
      },
    ],
  })

  const updateBookingStatus = (bookingId: string, nextStatus: BookingStatus, action: string) => {
    setBookings((current) =>
      current.map((booking) => {
        if (booking.id !== bookingId) return booking

        const nextBooking: StaffBooking = {
          ...booking,
          status: nextStatus,
          checkInTime: nextStatus === 'CHECKED_IN' ? getCurrentTime() : booking.checkInTime,
          checkOutTime: nextStatus === 'COMPLETED' ? getCurrentTime() : booking.checkOutTime,
        }

        return addBookingHistory(nextBooking, action)
      }),
    )
  }

  const undoCheckIn = (bookingId: string) => {
    setBookings((current) =>
      current.map((booking) => {
        if (booking.id !== bookingId) return booking
        if (booking.status !== 'CHECKED_IN' || booking.checkOutTime) return booking

        return addBookingHistory(
          {
            ...booking,
            status: 'CONFIRMED',
            checkInTime: undefined,
          },
          'Đã hoàn tác check-in',
        )
      }),
    )
  }

  const requestAction = (booking: StaffBooking, action: BookingAction) => {
    setOpenMenuId(null)

    if (action.key === 'view') {
      setSelectedBookingId(booking.id)
      return
    }

    if (action.key === 'undo-check-in') {
      setConfirmAction({
        title: 'Hoàn tác check-in?',
        description: 'Booking sẽ quay lại trạng thái Đã xác nhận. Hành động này nên dùng khi nhân viên check-in nhầm.',
        confirmLabel: 'Hoàn tác',
        onConfirm: () => {
          undoCheckIn(booking.id)
          setConfirmAction(null)
          showToast(`Đã hoàn tác check-in cho booking ${booking.code}`)
        },
      })
      return
    }

    if (!action.nextStatus) return

    const confirmCopy = getConfirmCopy(booking, action)
    setConfirmAction({
      ...confirmCopy,
      variant: action.variant === 'danger' ? 'danger' : 'primary',
      onConfirm: () => {
        updateBookingStatus(booking.id, action.nextStatus as BookingStatus, confirmCopy.historyAction)
        setConfirmAction(null)
        showToast(getSuccessMessage(booking.code, action.nextStatus as BookingStatus))
      },
    })
  }

  const refreshData = () => {
    setIsLoading(true)
    window.setTimeout(() => {
      setIsLoading(false)
      showToast('Đã làm mới danh sách booking.')
    }, 360)
  }

  const resetFilters = () => {
    setQuery('')
    setStatusFilter('ALL')
    setDateFilter('TODAY')
    setRoomFilter('ALL')
  }

  return (
    <AuthGuard allowedRoles={['STAFF']}>
      <StaffPageShell>
        <div className="space-y-6">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="font-display text-sm font-bold uppercase tracking-wide text-brand-orange">Vận hành đặt phòng</p>
              <h1 className="mt-2 font-display text-[32px] font-bold leading-10 text-on-surface">Quản lý booking</h1>
              <p className="mt-2 max-w-2xl text-base leading-6 text-on-surface-variant">
                Theo dõi, xác nhận, check-in, check-out và xử lý các tình huống phát sinh trong ngày.
              </p>
            </div>
            <button type="button" onClick={refreshData} className="btn-secondary self-start">
              <IconRefresh />
              Làm mới
            </button>
          </header>

          {isLoading ? (
            <PageSkeleton />
          ) : (
            <>
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((kpi) => (
                  <KpiCard key={kpi.label} {...kpi} />
                ))}
              </section>

              <section className="rounded-3xl border border-outline-variant bg-white p-4 shadow-[var(--band-shadow-card)]">
                <div className="grid gap-3 xl:grid-cols-[minmax(280px,1fr)_220px_180px_220px_auto]">
                  <SearchInput value={query} onChange={setQuery} />
                  <SelectField value={statusFilter} onChange={(value) => setStatusFilter(value as BookingStatus | 'ALL')}>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status === 'ALL' ? 'Tất cả trạng thái' : getBookingStatusMeta(status).label}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField value={dateFilter} onChange={(value) => setDateFilter(value as DateFilter)}>
                    {dateOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField value={roomFilter} onChange={setRoomFilter}>
                    {roomOptions.map((room) => (
                      <option key={room} value={room}>
                        {room === 'ALL' ? 'Tất cả phòng' : room}
                      </option>
                    ))}
                  </SelectField>
                  <button type="button" onClick={resetFilters} className="btn-secondary">
                    Đặt lại
                  </button>
                </div>
              </section>

              {filteredBookings.length > 0 ? (
                <section className="grid gap-4">
                  {filteredBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      open={openMenuId === booking.id}
                      onToggleMenu={() => setOpenMenuId((current) => (current === booking.id ? null : booking.id))}
                      onAction={(action) => requestAction(booking, action)}
                    />
                  ))}
                </section>
              ) : (
                <EmptyState
                  title="Không tìm thấy booking"
                  description="Thử đổi từ khóa hoặc bộ lọc để xem kết quả khác."
                  onReset={resetFilters}
                />
              )}
            </>
          )}
        </div>

        {selectedBooking && (
          <BookingDetailPanel
            booking={selectedBooking}
            onClose={() => setSelectedBookingId(null)}
            onAction={(action) => requestAction(selectedBooking, action)}
          />
        )}
        {confirmAction && <ConfirmDialog action={confirmAction} onCancel={() => setConfirmAction(null)} />}
        {toastMessage && <Toast message={toastMessage} />}
      </StaffPageShell>
    </AuthGuard>
  )
}

function BookingCard({
  booking,
  open,
  onToggleMenu,
  onAction,
}: {
  booking: StaffBooking
  open: boolean
  onToggleMenu: () => void
  onAction: (action: BookingAction) => void
}) {
  const status = getBookingStatusMeta(booking.status)
  const actions = getAvailableBookingActions(booking.status)

  return (
    <article className="rounded-3xl border border-outline-variant bg-white p-5 shadow-[var(--band-shadow-card)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-sm font-bold uppercase tracking-wide text-brand-orange">{booking.code}</p>
            <StatusBadge meta={status} />
          </div>
          <h2 className="mt-2 font-display text-2xl font-bold text-on-surface">{booking.customerName}</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            {booking.phone ?? 'Chưa có số điện thoại'} · {booking.roomName} · {formatDisplayDate(booking.date)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          {actions.secondary && (
            <button type="button" onClick={() => onAction(actions.secondary as BookingAction)} className="btn-secondary">
              {actions.secondary.label}
            </button>
          )}
          {actions.primary && (
            <button type="button" onClick={() => onAction(actions.primary as BookingAction)} className="btn-warm">
              {actions.primary.label}
            </button>
          )}
          <div className="relative">
            <button type="button" onClick={onToggleMenu} className="icon-button" aria-label={`Mở menu ${booking.code}`}>
              <IconDots />
            </button>
            {open && (
              <div className="absolute right-0 top-12 z-20 w-60 overflow-hidden rounded-2xl border border-outline-variant bg-white p-2 shadow-[var(--band-shadow-elevated)]">
                {actions.menu.map((action) => (
                  <MenuButton key={action.key} danger={action.variant === 'danger'} onClick={() => onAction(action)}>
                    {action.label}
                  </MenuButton>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Thời gian" value={`${booking.startTime} - ${booking.endTime}`} />
        <Metric label="Số người" value={`${booking.guestCount} người`} />
        <Metric label="Phòng" value={booking.roomName} />
        <Metric label="Thiết bị" value={booking.equipment.length ? `${booking.equipment.length} món` : 'Không thuê'} />
        <Metric label="Tổng tiền" value={formatCurrency(booking.totalPrice)} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {booking.equipment.length ? (
          booking.equipment.map((item) => (
            <span key={item} className="rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface-variant">
              {item}
            </span>
          ))
        ) : (
          <span className="rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface-variant">
            Không thuê thiết bị thêm
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-on-surface-variant">
        {booking.checkInTime && <span className="rounded-full bg-[#E8F5EC] px-3 py-1 text-secondary">Check-in {booking.checkInTime}</span>}
        {booking.checkOutTime && <span className="rounded-full bg-surface-container px-3 py-1">Check-out {booking.checkOutTime}</span>}
      </div>

      {booking.note && (
        <p className="mt-4 rounded-2xl border border-outline-variant bg-surface-container-low p-3 text-sm leading-6 text-on-surface-variant">
          {booking.note}
        </p>
      )}
    </article>
  )
}

function BookingDetailPanel({
  booking,
  onClose,
  onAction,
}: {
  booking: StaffBooking
  onClose: () => void
  onAction: (action: BookingAction) => void
}) {
  const actions = getAvailableBookingActions(booking.status)

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#042A16]/45 backdrop-blur-sm" onClick={onClose}>
      <aside className="h-full w-full overflow-y-auto border-l border-outline-variant bg-white p-5 shadow-[var(--band-shadow-elevated)] sm:max-w-2xl sm:p-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-wide text-brand-orange">{booking.code}</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-on-surface">{booking.customerName}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Chi tiết booking và lịch sử thao tác</p>
          </div>
          <button type="button" onClick={onClose} className="icon-button" aria-label="Đóng chi tiết">
            <IconClose />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <StatusBadge meta={getBookingStatusMeta(booking.status)} />
          <span className="rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 font-display text-xs font-bold text-on-surface-variant">
            {formatDisplayDate(booking.date)} · {booking.startTime} - {booking.endTime}
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Metric label="Khách hàng" value={booking.customerName} />
          <Metric label="Điện thoại" value={booking.phone ?? 'Chưa có'} />
          <Metric label="Phòng" value={booking.roomName} />
          <Metric label="Số người" value={`${booking.guestCount} người`} />
          <Metric label="Tổng tiền" value={formatCurrency(booking.totalPrice)} />
          <Metric label="Trạng thái hiện tại" value={getBookingStatusMeta(booking.status).label} />
          <Metric label="Check-in" value={booking.checkInTime ?? 'Chưa có'} />
          <Metric label="Check-out" value={booking.checkOutTime ?? 'Chưa có'} />
        </div>

        <PanelSection title="Thiết bị thuê thêm">
          <div className="flex flex-wrap gap-2">
            {booking.equipment.length ? (
              booking.equipment.map((item) => (
                <span key={item} className="rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface-variant">
                  {item}
                </span>
              ))
            ) : (
              <p className="text-sm text-on-surface-variant">Không thuê thiết bị thêm.</p>
            )}
          </div>
        </PanelSection>

        <PanelSection title="Ghi chú">
          <p className="text-sm leading-6 text-on-surface-variant">{booking.note ?? 'Không có ghi chú.'}</p>
        </PanelSection>

        <PanelSection title="Lịch sử thao tác">
          <BookingHistory history={booking.history} />
        </PanelSection>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">Đóng</button>
          {actions.secondary && <button type="button" onClick={() => onAction(actions.secondary as BookingAction)} className="btn-secondary">{actions.secondary.label}</button>}
          {actions.primary && <button type="button" onClick={() => onAction(actions.primary as BookingAction)} className="btn-warm">{actions.primary.label}</button>}
        </div>
      </aside>
    </div>
  )
}

function KpiCard({ label, value, helper, icon, className }: { label: string; value: number; helper: string; icon: ReactNode; className: string }) {
  return (
    <article className="rounded-3xl border border-outline-variant bg-white p-5 shadow-[var(--band-shadow-card)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-sm font-bold text-on-surface-variant">{label}</p>
          <p className="mt-3 font-display text-4xl font-bold leading-none text-on-surface">{value}</p>
        </div>
        <span className={['flex h-12 w-12 items-center justify-center rounded-2xl', className].join(' ')}>{icon}</span>
      </div>
      <p className="mt-4 text-sm text-on-surface-variant">{helper}</p>
    </article>
  )
}

function SearchInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="relative block">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"><IconSearch /></span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Tìm mã booking, khách/band, phòng, số điện thoại..."
        className="h-12 w-full rounded-2xl border border-outline-variant bg-surface-container-low pl-11 pr-4 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/70 focus:border-brand-orange focus:bg-white"
      />
    </label>
  )
}

function SelectField({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-2xl border border-outline-variant bg-surface-container-low px-4 font-display text-sm font-bold text-on-surface outline-none transition focus:border-brand-orange focus:bg-white">
      {children}
    </select>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-3">
      <p className="font-display text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">{label}</p>
      <p className="mt-2 text-sm font-semibold text-on-surface">{value}</p>
    </div>
  )
}

function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="font-display text-base font-bold text-on-surface">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function StatusBadge({ meta }: { meta: StatusMeta }) {
  return <span className={['inline-flex rounded-full border px-3 py-1 font-display text-xs font-bold', meta.className].join(' ')}>{meta.label}</span>
}

function MenuButton({ children, danger, onClick }: { children: ReactNode; danger?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={['block w-full rounded-xl px-3 py-2 text-left font-display text-sm font-semibold transition', danger ? 'text-error hover:bg-error-container' : 'text-on-surface hover:bg-surface-container-low'].join(' ')}>
      {children}
    </button>
  )
}

function ConfirmDialog({ action, onCancel }: { action: ConfirmAction; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#042A16]/50 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-md rounded-3xl border border-outline-variant bg-white p-6 shadow-[var(--band-shadow-elevated)]" onClick={(event) => event.stopPropagation()}>
        <div className={['flex h-12 w-12 items-center justify-center rounded-2xl', action.variant === 'danger' ? 'bg-error-container text-error' : 'bg-primary-container text-brand-orange'].join(' ')}>
          <IconAlert />
        </div>
        <h2 className="mt-5 font-display text-xl font-bold text-on-surface">{action.title}</h2>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">{action.description}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="btn-secondary">Hủy</button>
          <button type="button" onClick={action.onConfirm} className={['inline-flex min-h-11 items-center justify-center rounded-[14px] px-5 font-display text-sm font-bold text-white shadow-[var(--band-shadow-card)] transition', action.variant === 'danger' ? 'bg-error hover:bg-[#A61F1F]' : 'bg-brand-orange hover:bg-brand-orangeHover'].join(' ')}>
            {action.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ title, description, onReset }: { title: string; description: string; onReset: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-outline bg-white px-5 py-14 text-center shadow-[var(--band-shadow-card)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-container text-brand-orange"><IconSearch /></div>
      <h2 className="mt-5 font-display text-xl font-bold text-on-surface">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">{description}</p>
      <button type="button" onClick={onReset} className="btn-warm mx-auto mt-6">Đặt lại bộ lọc</button>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-3xl border border-outline-variant bg-white shadow-[var(--band-shadow-card)]" />)}
      </div>
      <div className="h-20 animate-pulse rounded-3xl border border-outline-variant bg-white shadow-[var(--band-shadow-card)]" />
      {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-64 animate-pulse rounded-3xl border border-outline-variant bg-white shadow-[var(--band-shadow-card)]" />)}
    </div>
  )
}

function Toast({ message }: { message: string }) {
  return <div className="fixed bottom-5 left-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-secondary-container bg-secondary px-4 py-3 text-sm font-semibold text-on-secondary shadow-[var(--band-shadow-elevated)]">{message}</div>
}

function BookingHistory({ history }: { history: BookingHistoryItem[] }) {
  return (
    <div className="space-y-3">
      {history.map((item, index) => (
        <div key={item.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="mt-1 h-3 w-3 rounded-full bg-brand-orange" />
            {index < history.length - 1 && <span className="mt-1 h-8 w-px bg-outline-variant" />}
          </div>
          <div>
            <p className="font-display text-sm font-bold text-on-surface">{item.action}</p>
            <p className="mt-1 text-xs text-on-surface-variant">{item.createdAt} · {item.actor}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function getBookingStatusMeta(status: BookingStatus): StatusMeta {
  const meta: Record<BookingStatus, StatusMeta> = {
    PENDING: { label: 'Chờ xác nhận', className: 'border-primary-container bg-primary-container text-on-primary-container' },
    CONFIRMED: { label: 'Đã xác nhận', className: 'border-on-secondary-container/40 bg-on-secondary-container text-[#001A0D]' },
    CHECKED_IN: { label: 'Đã check-in', className: 'border-tertiary-container bg-tertiary-container text-on-tertiary-container' },
    IN_PROGRESS: { label: 'Đang sử dụng', className: 'border-secondary-container bg-secondary text-on-secondary' },
    COMPLETED: { label: 'Hoàn tất', className: 'border-outline-variant bg-surface-container-high text-on-surface-variant' },
    CANCELLED: { label: 'Đã hủy', className: 'border-outline-variant bg-surface-container-high text-on-surface-variant' },
    NO_SHOW: { label: 'Không đến', className: 'border-error-container bg-error-container text-on-error-container' },
  }
  return meta[status]
}

function getAvailableBookingActions(status: BookingStatus): AvailableBookingActions {
  if (status === 'PENDING') {
    return {
      primary: { key: 'confirm', label: 'Xác nhận', nextStatus: 'CONFIRMED', variant: 'primary' },
      menu: [
        { key: 'cancel', label: 'Hủy booking', nextStatus: 'CANCELLED', variant: 'danger' },
        { key: 'view', label: 'Xem chi tiết' },
      ],
    }
  }

  if (status === 'CONFIRMED') {
    return {
      primary: { key: 'check-in', label: 'Check-in', nextStatus: 'CHECKED_IN', variant: 'primary' },
      menu: [
        { key: 'no-show', label: 'Đánh dấu không đến', nextStatus: 'NO_SHOW', variant: 'danger' },
        { key: 'cancel', label: 'Hủy booking', nextStatus: 'CANCELLED', variant: 'danger' },
        { key: 'view', label: 'Xem chi tiết' },
      ],
    }
  }

  if (status === 'CHECKED_IN') {
    return {
      primary: { key: 'check-out', label: 'Check-out', nextStatus: 'COMPLETED', variant: 'primary' },
      secondary: { key: 'undo-check-in', label: 'Hoàn tác check-in', variant: 'secondary' },
      menu: [{ key: 'view', label: 'Xem chi tiết' }],
    }
  }

  if (status === 'IN_PROGRESS') {
    return {
      primary: { key: 'complete', label: 'Kết thúc', nextStatus: 'COMPLETED', variant: 'primary' },
      menu: [{ key: 'view', label: 'Xem chi tiết' }],
    }
  }

  return {
    menu: [{ key: 'view', label: 'Xem chi tiết' }],
  }
}

function getConfirmCopy(booking: StaffBooking, action: BookingAction) {
  if (action.key === 'confirm') {
    return {
      title: 'Xác nhận booking?',
      description: `${booking.code} sẽ chuyển sang trạng thái Đã xác nhận và sẵn sàng check-in.`,
      confirmLabel: 'Xác nhận',
      historyAction: 'Đã xác nhận booking',
    }
  }

  if (action.key === 'check-in') {
    return {
      title: 'Check-in booking?',
      description: `${booking.customerName} sẽ được ghi nhận đã đến studio.`,
      confirmLabel: 'Check-in',
      historyAction: 'Đã check-in',
    }
  }

  if (action.key === 'check-out') {
    return {
      title: 'Check-out booking?',
      description: `${booking.code} sẽ được hoàn tất và ghi nhận giờ check-out.`,
      confirmLabel: 'Check-out',
      historyAction: 'Đã check-out',
    }
  }

  if (action.key === 'complete') {
    return {
      title: 'Kết thúc booking?',
      description: `${booking.code} sẽ chuyển sang trạng thái Hoàn tất.`,
      confirmLabel: 'Kết thúc',
      historyAction: 'Đã kết thúc booking',
    }
  }

  if (action.key === 'no-show') {
    return {
      title: 'Đánh dấu khách không đến?',
      description: `${booking.code} sẽ chuyển sang trạng thái Không đến.`,
      confirmLabel: 'Đánh dấu không đến',
      historyAction: 'Đánh dấu không đến',
    }
  }

  return {
    title: 'Hủy booking này?',
    description: `${booking.code} sẽ được đánh dấu Đã hủy trên màn hình nhân viên.`,
    confirmLabel: 'Hủy booking',
    historyAction: 'Đã hủy booking',
  }
}

function getSuccessMessage(code: string, status: BookingStatus) {
  return `Đã cập nhật ${code} thành ${getBookingStatusMeta(status).label}.`
}

function filterBookings(bookings: StaffBooking[], filters: { query: string; statusFilter: BookingStatus | 'ALL'; dateFilter: DateFilter; roomFilter: string }) {
  const query = normalizeText(filters.query)
  return bookings.filter((booking) => {
    const matchesQuery = !query || normalizeText([booking.code, booking.customerName, booking.roomName, booking.phone].join(' ')).includes(query)
    const matchesStatus = filters.statusFilter === 'ALL' || booking.status === filters.statusFilter
    const matchesRoom = filters.roomFilter === 'ALL' || booking.roomName === filters.roomFilter
    const matchesDate =
      filters.dateFilter === 'ALL'
        ? true
        : filters.dateFilter === 'THIS_WEEK'
          ? isInThisWeek(booking.date)
          : filters.dateFilter === 'TOMORROW'
            ? booking.date === tomorrowKey
            : booking.date === todayKey
    return matchesQuery && matchesStatus && matchesRoom && matchesDate
  })
}

function createBooking(booking: Omit<StaffBooking, 'history'> & { history?: string[] }): StaffBooking {
  const history = booking.history ?? ['Tạo booking']
  return {
    ...booking,
    history: history.map((action, index) => ({
      id: `${booking.id}-history-${index}`,
      action,
      createdAt: getMockTimestamp(index),
      actor: index === 0 ? 'Hệ thống' : STAFF_ACTOR,
    })),
  }
}

function normalizeText(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDisplayDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(year, month - 1, day))
}

function isInThisWeek(dateKey: string) {
  const today = new Date()
  const day = today.getDay() === 0 ? 6 : today.getDay() - 1
  const start = addDays(today, -day)
  const end = addDays(start, 6)
  const [year, month, date] = dateKey.split('-').map(Number)
  const target = new Date(year, month - 1, date)
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)
  return target >= start && target <= end
}

function getCurrentTime() {
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date())
}

function getCurrentTimestamp() {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
}

function getMockTimestamp(offset: number) {
  const date = new Date()
  date.setMinutes(date.getMinutes() - (90 - offset * 18))
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function IconCalendar() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M7 3v4M17 3v4M4 9h16M6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10A2.5 2.5 0 0 1 6.5 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function IconClock() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function IconCheck() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function IconAlert() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M12 8v5M12 17h.01M10.2 4.7 2.8 18a2 2 0 0 0 1.8 3h14.8a2 2 0 0 0 1.8-3L13.8 4.7a2 2 0 0 0-3.6 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function IconSearch() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15ZM16 16l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function IconRefresh() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M18 3v4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function IconDots() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M12 12h.01M19 12h.01M5 12h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
}

function IconClose() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
}
