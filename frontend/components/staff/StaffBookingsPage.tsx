'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { useAuth } from '@/contexts/AuthContext'
import { getDisplayName, getInitials, getRoleLabel } from '@/lib/staff-profile'

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
type DateFilter = 'TODAY' | 'TOMORROW' | 'THIS_WEEK'

type StaffBooking = {
  id: string
  code: string
  customerId: string
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
}

type StatusMeta = {
  label: string
  className: string
  dotClassName: string
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

const initialBookings: StaffBooking[] = [
  {
    id: 'b1',
    code: 'BK-0701-60',
    customerId: 'c1',
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
  },
  {
    id: 'b2',
    code: 'BK-0701-61',
    customerId: 'c2',
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
  },
  {
    id: 'b3',
    code: 'BK-0701-62',
    customerId: 'c3',
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
  },
  {
    id: 'b4',
    code: 'BK-0701-63',
    customerId: 'c4',
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
  },
  {
    id: 'b5',
    code: 'BK-0701-64',
    customerId: 'c5',
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
  },
  {
    id: 'b6',
    code: 'BK-0701-65',
    customerId: 'c6',
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
  },
  {
    id: 'b7',
    code: 'BK-0702-01',
    customerId: 'c2',
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
  },
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
  { value: 'TODAY', label: 'Hôm nay' },
  { value: 'TOMORROW', label: 'Ngày mai' },
  { value: 'THIS_WEEK', label: 'Tuần này' },
]

export default function StaffBookingsPage() {
  const [bookings, setBookings] = useState(initialBookings)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>('ALL')
  const [dateFilter, setDateFilter] = useState<DateFilter>('TODAY')
  const [roomFilter, setRoomFilter] = useState('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<StaffBooking | null>(null)
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
  const todayBookings = bookings.filter((booking) => booking.date === todayKey)
  const kpis = [
    { label: 'Tổng booking hôm nay', value: todayBookings.length, helper: 'Tất cả booking trong ngày', icon: <IconCalendar />, className: 'bg-secondary text-on-secondary' },
    { label: 'Chờ xác nhận', value: todayBookings.filter((booking) => booking.status === 'PENDING').length, helper: 'Cần nhân viên xử lý', icon: <IconClock />, className: 'bg-primary-container text-brand-orange' },
    { label: 'Đã check-in', value: todayBookings.filter((booking) => booking.status === 'CHECKED_IN').length, helper: 'Khách đã đến quầy', icon: <IconCheck />, className: 'bg-on-secondary-container text-[#001A0D]' },
    { label: 'Không đến / Đã hủy', value: todayBookings.filter((booking) => booking.status === 'NO_SHOW' || booking.status === 'CANCELLED').length, helper: 'Cần đối soát cuối ngày', icon: <IconAlert />, className: 'bg-error-container text-error' },
  ]

  const showToast = (message: string) => setToastMessage(message)

  const refreshData = () => {
    setIsLoading(true)
    window.setTimeout(() => {
      setIsLoading(false)
      showToast('Đã làm mới danh sách booking.')
    }, 360)
  }

  const updateBookingStatus = (id: string, nextStatus: BookingStatus) => {
    setBookings((current) => current.map((booking) => (booking.id === id ? { ...booking, status: nextStatus } : booking)))
    setSelectedBooking((current) => (current?.id === id ? { ...current, status: nextStatus } : current))
  }

  const applyStatus = (booking: StaffBooking, nextStatus: BookingStatus) => {
    updateBookingStatus(booking.id, nextStatus)
    setOpenMenuId(null)
    showToast(`Đã cập nhật ${booking.code} thành ${getBookingStatusMeta(nextStatus).label}.`)
  }

  const requestDangerAction = (booking: StaffBooking, nextStatus: BookingStatus, title: string, description: string, label: string) => {
    setOpenMenuId(null)
    setConfirmAction({
      title,
      description,
      confirmLabel: label,
      variant: 'danger',
      onConfirm: () => {
        applyStatus(booking, nextStatus)
        setConfirmAction(null)
      },
    })
  }

  const primaryAction = (booking: StaffBooking) => {
    const nextStatus = getNextPrimaryStatus(booking.status)
    if (!nextStatus) return
    applyStatus(booking, nextStatus)
  }

  const copyBookingCode = async (booking: StaffBooking) => {
    try {
      await navigator.clipboard.writeText(booking.code)
      showToast(`Đã sao chép mã booking ${booking.code}.`)
    } catch {
      showToast(`Mã booking: ${booking.code}`)
    } finally {
      setOpenMenuId(null)
    }
  }

  const resetFilters = () => {
    setQuery('')
    setStatusFilter('ALL')
    setDateFilter('TODAY')
    setRoomFilter('ALL')
  }

  return (
    <AuthGuard allowedRoles={['STAFF']}>
      <div className="min-h-screen bg-brand-bgGray text-on-surface lg:flex">
        <StaffSidebar />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1480px] space-y-6">
            <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="font-display text-sm font-bold uppercase tracking-wide text-brand-orange">Vận hành đặt phòng</p>
                <h1 className="mt-2 font-display text-[32px] font-bold leading-10 text-on-surface">Quản lý booking</h1>
                <p className="mt-2 max-w-2xl text-base leading-6 text-on-surface-variant">
                  Theo dõi, xác nhận và cập nhật trạng thái đặt phòng.
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
                        onPrimaryAction={() => primaryAction(booking)}
                        onView={() => {
                          setSelectedBooking(booking)
                          setOpenMenuId(null)
                        }}
                        onCopy={() => copyBookingCode(booking)}
                        onNoShow={() =>
                          requestDangerAction(
                            booking,
                            'NO_SHOW',
                            'Đánh dấu khách không đến?',
                            `${booking.code} sẽ chuyển sang trạng thái Không đến.`,
                            'Đánh dấu không đến',
                          )
                        }
                        onCancel={() =>
                          requestDangerAction(
                            booking,
                            'CANCELLED',
                            'Hủy booking này?',
                            `${booking.code} sẽ được đánh dấu đã hủy trên màn hình nhân viên.`,
                            'Hủy booking',
                          )
                        }
                      />
                    ))}
                  </section>
                ) : (
                  <EmptyState title="Không tìm thấy booking" description="Thử đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái." onReset={resetFilters} />
                )}
              </>
            )}
          </div>
        </main>

        {selectedBooking && (
          <BookingDetailPanel
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onPrimaryAction={() => primaryAction(selectedBooking)}
          />
        )}
        {confirmAction && <ConfirmDialog action={confirmAction} onCancel={() => setConfirmAction(null)} />}
        {toastMessage && <Toast message={toastMessage} />}
      </div>
    </AuthGuard>
  )
}

function BookingCard({
  booking,
  open,
  onToggleMenu,
  onPrimaryAction,
  onView,
  onCopy,
  onNoShow,
  onCancel,
}: {
  booking: StaffBooking
  open: boolean
  onToggleMenu: () => void
  onPrimaryAction: () => void
  onView: () => void
  onCopy: () => void
  onNoShow: () => void
  onCancel: () => void
}) {
  const status = getBookingStatusMeta(booking.status)
  const nextStatus = getNextPrimaryStatus(booking.status)

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
        <div className="flex items-center gap-2">
          {nextStatus && (
            <button type="button" onClick={onPrimaryAction} className="btn-warm">
              {getPrimaryActionLabel(booking.status)}
            </button>
          )}
          <div className="relative">
            <button type="button" onClick={onToggleMenu} className="icon-button" aria-label={`Mở menu ${booking.code}`}>
              <IconDots />
            </button>
            {open && (
              <div className="absolute right-0 top-12 z-20 w-56 overflow-hidden rounded-2xl border border-outline-variant bg-white p-2 shadow-[var(--band-shadow-elevated)]">
                <MenuButton onClick={onView}>Xem chi tiết</MenuButton>
                <MenuButton onClick={onCopy}>Sao chép mã booking</MenuButton>
                <MenuButton onClick={onNoShow} danger>Đánh dấu không đến</MenuButton>
                <MenuButton onClick={onCancel} danger>Hủy booking</MenuButton>
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
        {booking.equipment.length ? booking.equipment.map((item) => (
          <span key={item} className="rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface-variant">
            {item}
          </span>
        )) : (
          <span className="rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface-variant">
            Không thuê thiết bị thêm
          </span>
        )}
      </div>
      {booking.note && <p className="mt-4 rounded-2xl border border-outline-variant bg-surface-container-low p-3 text-sm leading-6 text-on-surface-variant">{booking.note}</p>}
    </article>
  )
}

function BookingDetailPanel({ booking, onClose, onPrimaryAction }: { booking: StaffBooking; onClose: () => void; onPrimaryAction: () => void }) {
  const nextStatus = getNextPrimaryStatus(booking.status)

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#042A16]/45 backdrop-blur-sm">
      <aside className="h-full w-full overflow-y-auto border-l border-outline-variant bg-white p-5 shadow-[var(--band-shadow-elevated)] sm:max-w-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-wide text-brand-orange">{booking.code}</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-on-surface">{booking.customerName}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Chi tiết booking và trạng thái xử lý</p>
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
          <Metric label="Trạng thái" value={getBookingStatusMeta(booking.status).label} />
        </div>

        <PanelSection title="Thiết bị thuê thêm">
          <div className="flex flex-wrap gap-2">
            {booking.equipment.length ? booking.equipment.map((item) => (
              <span key={item} className="rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface-variant">
                {item}
              </span>
            )) : <p className="text-sm text-on-surface-variant">Không thuê thiết bị thêm.</p>}
          </div>
        </PanelSection>

        <PanelSection title="Ghi chú">
          <p className="text-sm leading-6 text-on-surface-variant">{booking.note ?? 'Không có ghi chú.'}</p>
        </PanelSection>

        <PanelSection title="Timeline trạng thái">
          <Timeline status={booking.status} />
        </PanelSection>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">Đóng</button>
          {nextStatus && <button type="button" onClick={onPrimaryAction} className="btn-warm">{getPrimaryActionLabel(booking.status)}</button>}
        </div>
      </aside>
    </div>
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
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-orange text-white shadow-[0_12px_28px_rgba(255,117,24,0.24)]"><IconLogo /></div>
        <div><p className="font-display text-lg font-bold leading-none text-inverse-on-surface">BandHub Studio</p><p className="mt-1 font-display text-xs font-bold uppercase tracking-wide text-brand-orange">Staff</p></div>
      </div>
      <div className="mt-8 border-t border-secondary-container/60 pt-6">
        <div className="rounded-xl border border-secondary-container/70 bg-secondary-container/45 px-3 py-3">
          <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-primary-container font-display font-bold text-on-primary-container">{user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : avatarInitial}</div><div className="min-w-0"><p className="truncate font-display text-sm font-bold text-inverse-on-surface">{displayName}</p><p className="text-xs text-on-secondary-container">{roleLabel}</p></div></div>
        </div>
      </div>
      <nav className="mt-6 space-y-1">
        {menuItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link key={item.label} href={item.href} className={['relative flex h-12 items-center gap-3 rounded-lg px-3 font-display text-sm font-medium transition', active ? 'bg-[rgba(255,117,24,0.12)] text-brand-orange before:absolute before:left-0 before:top-2 before:h-8 before:w-[3px] before:rounded-full before:bg-brand-orange' : 'text-inverse-on-surface/75 hover:bg-brand-orange/10 hover:text-inverse-on-surface'].join(' ')}>
              <span className="flex h-5 w-5 items-center justify-center"><IconMenuDot active={active} /></span>{item.label}
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto space-y-4">
        <div className="rounded-xl border border-secondary-container/70 bg-secondary-container/45 p-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-orange text-white"><IconLogo /></div><div><p className="font-display text-sm font-bold text-inverse-on-surface">BandHub Studio</p><p className="text-xs text-on-secondary-container">123 Âu Cơ, Tân Bình</p></div></div></div>
        <div className="rounded-xl border border-brand-orange/20 bg-brand-orange/10 p-4"><p className="font-display text-sm font-bold text-inverse-on-surface">Cần hỗ trợ?</p><p className="mt-1 text-xs text-inverse-on-surface/75">Hotline: 1900 1234</p></div>
      </div>
    </aside>
  )
}

function KpiCard({ label, value, helper, icon, className }: { label: string; value: number; helper: string; icon: ReactNode; className: string }) {
  return (
    <article className="rounded-3xl border border-outline-variant bg-white p-5 shadow-[var(--band-shadow-card)]">
      <div className="flex items-start justify-between gap-4"><div><p className="font-display text-sm font-bold text-on-surface-variant">{label}</p><p className="mt-3 font-display text-4xl font-bold leading-none text-on-surface">{value}</p></div><span className={['flex h-12 w-12 items-center justify-center rounded-2xl', className].join(' ')}>{icon}</span></div>
      <p className="mt-4 text-sm text-on-surface-variant">{helper}</p>
    </article>
  )
}

function SearchInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="relative block"><span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"><IconSearch /></span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Tìm mã booking, khách/band, phòng, số điện thoại..." className="h-12 w-full rounded-2xl border border-outline-variant bg-surface-container-low pl-11 pr-4 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/70 focus:border-brand-orange focus:bg-white" /></label>
  )
}

function SelectField({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-2xl border border-outline-variant bg-surface-container-low px-4 font-display text-sm font-bold text-on-surface outline-none transition focus:border-brand-orange focus:bg-white">{children}</select>
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-3"><p className="font-display text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">{label}</p><p className="mt-2 text-sm font-semibold text-on-surface">{value}</p></div>
}

function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="mt-6"><h3 className="font-display text-base font-bold text-on-surface">{title}</h3><div className="mt-3">{children}</div></section>
}

function StatusBadge({ meta }: { meta: StatusMeta }) {
  return <span className={['inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-display text-xs font-bold', meta.className].join(' ')}><span className={['h-1.5 w-1.5 rounded-full', meta.dotClassName].join(' ')} />{meta.label}</span>
}

function MenuButton({ children, danger, onClick }: { children: ReactNode; danger?: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={['block w-full rounded-xl px-3 py-2 text-left font-display text-sm font-semibold transition', danger ? 'text-error hover:bg-error-container' : 'text-on-surface hover:bg-surface-container-low'].join(' ')}>{children}</button>
}

function ConfirmDialog({ action, onCancel }: { action: ConfirmAction; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#042A16]/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-outline-variant bg-white p-6 shadow-[var(--band-shadow-elevated)]">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-error-container text-error"><IconAlert /></div>
        <h2 className="mt-5 font-display text-xl font-bold text-on-surface">{action.title}</h2>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">{action.description}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} className="btn-secondary">Quay lại</button><button type="button" onClick={action.onConfirm} className={['inline-flex min-h-11 items-center justify-center rounded-[14px] px-5 font-display text-sm font-bold text-white shadow-[var(--band-shadow-card)] transition', action.variant === 'danger' ? 'bg-error hover:bg-[#A61F1F]' : 'bg-brand-orange hover:bg-brand-orangeHover'].join(' ')}>{action.confirmLabel}</button></div>
      </div>
    </div>
  )
}

function EmptyState({ title, description, onReset }: { title: string; description: string; onReset: () => void }) {
  return <div className="rounded-3xl border border-dashed border-outline bg-white px-5 py-14 text-center shadow-[var(--band-shadow-card)]"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-container text-brand-orange"><IconSearch /></div><h2 className="mt-5 font-display text-xl font-bold text-on-surface">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">{description}</p><button type="button" onClick={onReset} className="btn-warm mx-auto mt-6">Đặt lại bộ lọc</button></div>
}

function PageSkeleton() {
  return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-3xl border border-outline-variant bg-white shadow-[var(--band-shadow-card)]" />)}</div><div className="h-20 animate-pulse rounded-3xl border border-outline-variant bg-white shadow-[var(--band-shadow-card)]" />{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-64 animate-pulse rounded-3xl border border-outline-variant bg-white shadow-[var(--band-shadow-card)]" />)}</div>
}

function Toast({ message }: { message: string }) {
  return <div className="fixed bottom-5 left-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-secondary-container bg-secondary px-4 py-3 text-sm font-semibold text-on-secondary shadow-[var(--band-shadow-elevated)]">{message}</div>
}

function Timeline({ status }: { status: BookingStatus }) {
  const confirmed = ['CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED'].includes(status)
  const checkedIn = ['CHECKED_IN', 'IN_PROGRESS', 'COMPLETED'].includes(status)
  const completed = status === 'COMPLETED'
  const stopped = status === 'CANCELLED' || status === 'NO_SHOW'
  const items = [
    { label: 'Tạo booking', done: true },
    { label: stopped ? getBookingStatusMeta(status).label : 'Xác nhận', done: confirmed || stopped },
    { label: 'Check-in', done: checkedIn },
    { label: 'Check-out / Hoàn tất', done: completed },
  ]
  return <div className="space-y-3">{items.map((item, index) => <div key={item.label} className="flex gap-3"><div className="flex flex-col items-center"><span className={['mt-1 h-3 w-3 rounded-full', item.done ? 'bg-brand-orange' : 'bg-outline-variant'].join(' ')} />{index < items.length - 1 && <span className="mt-1 h-8 w-px bg-outline-variant" />}</div><p className="font-display text-sm font-bold text-on-surface">{item.label}</p></div>)}</div>
}

function getBookingStatusMeta(status: BookingStatus): StatusMeta {
  const meta: Record<BookingStatus, StatusMeta> = {
    PENDING: { label: 'Chờ xác nhận', className: 'border-primary-container bg-primary-container text-on-primary-container', dotClassName: 'bg-brand-orange' },
    CONFIRMED: { label: 'Đã xác nhận', className: 'border-on-secondary-container/40 bg-on-secondary-container text-[#001A0D]', dotClassName: 'bg-secondary-container' },
    CHECKED_IN: { label: 'Đã check-in', className: 'border-tertiary-container bg-tertiary-container text-on-tertiary-container', dotClassName: 'bg-tertiary' },
    IN_PROGRESS: { label: 'Đang sử dụng', className: 'border-secondary-container bg-secondary text-on-secondary', dotClassName: 'bg-on-secondary-container' },
    COMPLETED: { label: 'Hoàn tất', className: 'border-outline-variant bg-surface-container-high text-on-surface-variant', dotClassName: 'bg-on-surface-variant' },
    CANCELLED: { label: 'Đã hủy', className: 'border-outline-variant bg-surface-container-high text-on-surface-variant', dotClassName: 'bg-on-surface-variant' },
    NO_SHOW: { label: 'Không đến', className: 'border-error-container bg-error-container text-on-error-container', dotClassName: 'bg-error' },
  }
  return meta[status]
}

function getNextPrimaryStatus(status: BookingStatus): BookingStatus | null {
  if (status === 'PENDING') return 'CONFIRMED'
  if (status === 'CONFIRMED') return 'CHECKED_IN'
  if (status === 'CHECKED_IN' || status === 'IN_PROGRESS') return 'COMPLETED'
  return null
}

function getPrimaryActionLabel(status: BookingStatus) {
  if (status === 'PENDING') return 'Xác nhận'
  if (status === 'CONFIRMED') return 'Check-in'
  return 'Check-out'
}

function filterBookings(bookings: StaffBooking[], filters: { query: string; statusFilter: BookingStatus | 'ALL'; dateFilter: DateFilter; roomFilter: string }) {
  const query = normalizeText(filters.query)
  return bookings.filter((booking) => {
    const matchesQuery = !query || normalizeText([booking.code, booking.customerName, booking.roomName, booking.phone].join(' ')).includes(query)
    const matchesStatus = filters.statusFilter === 'ALL' || booking.status === filters.statusFilter
    const matchesRoom = filters.roomFilter === 'ALL' || booking.roomName === filters.roomFilter
    const matchesDate =
      filters.dateFilter === 'THIS_WEEK'
        ? isInThisWeek(booking.date)
        : filters.dateFilter === 'TOMORROW'
          ? booking.date === tomorrowKey
          : booking.date === todayKey
    return matchesQuery && matchesStatus && matchesRoom && matchesDate
  })
}

function normalizeText(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
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

function IconLogo() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M4 9v6M8 5v14M12 3v18M16 6v12M20 10v4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg> }
function IconMenuDot({ active }: { active: boolean }) { return <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true"><rect x="4" y="4" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" opacity={active ? 1 : 0.68} /><path d="M7 10h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity={active ? 1 : 0.68} /></svg> }
function IconCalendar() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M7 3v4M17 3v4M4 9h16M6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10A2.5 2.5 0 0 1 6.5 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> }
function IconClock() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function IconCheck() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function IconAlert() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M12 8v5M12 17h.01M10.2 4.7 2.8 18a2 2 0 0 0 1.8 3h14.8a2 2 0 0 0 1.8-3L13.8 4.7a2 2 0 0 0-3.6 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function IconSearch() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15ZM16 16l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> }
function IconRefresh() { return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M18 3v4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function IconDots() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M12 12h.01M19 12h.01M5 12h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg> }
function IconClose() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg> }
