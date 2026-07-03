'use client'

import { useMemo, useState, type ReactNode } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { StaffPageShell } from '@/components/staff/StaffShared'

type ShiftStatus = 'EMPTY' | 'OFFLINE' | 'REGISTERED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED'
type AttendanceStatus = 'NOT_STARTED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'NO_SHIFT'
type AttendanceResult = 'NOT_CHECKED_IN' | 'ON_TIME' | 'LATE'
type DayKey = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'
type ShiftName = 'Ca sáng' | 'Ca chiều' | 'Ca tối' | 'Ca linh hoạt'
type ShiftAvailabilityStatus = 'AVAILABLE' | 'ALMOST_FULL' | 'FULL'
type VerificationStatus = 'IDLE' | 'CHECKING' | 'VALID' | 'INVALID' | 'BLOCKED'
type ConditionStatus = 'PASSED' | 'FAILED' | 'CHECKING'
type TimeSlotStatus = 'AVAILABLE' | 'SELECTED' | 'REGISTERED' | 'ASSIGNED' | 'DISABLED'

type StaffShiftCell = {
  id: string
  day: DayKey
  shiftName: ShiftName
  date?: string
  startTime: string
  endTime: string
  status: ShiftStatus
  note?: string
  checkInTime?: string
  checkOutTime?: string
  attendanceResult?: AttendanceResult
  lateMinutes?: number
}

type ShiftOption = {
  id: string
  day: DayKey
  date: string
  shiftName: ShiftName
  startTime: string
  endTime: string
  registeredCount: number
  requiredCount: number
  status: ShiftAvailabilityStatus
  description?: string
}

type StaffShiftEvent = StaffShiftCell & {
  title: string
  date: string
}

type WeekDayItem = {
  key: DayKey
  label: string
  longLabel: string
  date: Date
  dateKey: string
  isToday: boolean
}

type StatusMeta = {
  label: string
  className: string
}

type RegisterForm = {
  day: DayKey | ''
  startTime: string
  endTime: string
  selectedSlots: TimeSlot[]
  note: string
}

type TimeSlot = {
  id: string
  date: string
  day: DayKey
  startTime: string
  endTime: string
  status: TimeSlotStatus
}

type ShiftSlotGroup = {
  id: string
  name: string
  icon: 'sun' | 'sunset' | 'moon'
  startTime: string
  endTime: string
}

const STUDIO_LOCATION = {
  name: 'BandHub Studio',
  address: '123 Âu Cơ, Tân Bình',
  lat: 21.0285,
  lng: 105.8542,
  radiusMeters: 100,
}

const CHECK_IN_EARLY_MINUTES = 30
const CALENDAR_START_HOUR = 8
const CALENDAR_END_HOUR = 22
const CALENDAR_HOUR_HEIGHT = 72

const days: { key: DayKey; label: string; longLabel: string; date: string }[] = [
  { key: 'MON', label: 'Th 2', longLabel: 'Thứ 2', date: '29/06' },
  { key: 'TUE', label: 'Th 3', longLabel: 'Thứ 3', date: '30/06' },
  { key: 'WED', label: 'Th 4', longLabel: 'Thứ 4', date: '01/07' },
  { key: 'THU', label: 'Th 5', longLabel: 'Thứ 5', date: '02/07' },
  { key: 'FRI', label: 'Th 6', longLabel: 'Thứ 6', date: '03/07' },
  { key: 'SAT', label: 'Th 7', longLabel: 'Thứ 7', date: '04/07' },
  { key: 'SUN', label: 'CN', longLabel: 'Chủ nhật', date: '05/07' },
]

const shiftRows: { name: ShiftName; startTime: string; endTime: string }[] = [
  { name: 'Ca sáng', startTime: '08:00', endTime: '12:00' },
  { name: 'Ca chiều', startTime: '13:30', endTime: '17:30' },
]

const shiftTemplates: Record<ShiftName, { startTime: string; endTime: string; description: string }> = {
  'Ca sáng': {
    startTime: '08:00',
    endTime: '12:00',
    description: 'Phù hợp hỗ trợ phòng tập buổi sáng.',
  },
  'Ca chiều': {
    startTime: '13:30',
    endTime: '17:30',
    description: 'Cần chuẩn bị phòng và thiết bị cho khách đặt chiều.',
  },
  'Ca tối': {
    startTime: '18:00',
    endTime: '22:00',
    description: 'Phù hợp trực vận hành và hỗ trợ khách đặt ca tối.',
  },
  'Ca linh hoạt': {
    startTime: '08:00',
    endTime: '22:00',
    description: 'Khung giờ linh hoạt cho nhân viên part-time.',
  },
}

const initialShiftOptions: ShiftOption[] = [
  option('MON', 'Ca sáng', 1, 2),
  option('MON', 'Ca chiều', 2, 2),
  option('MON', 'Ca tối', 0, 2),
  option('TUE', 'Ca sáng', 0, 2),
  option('TUE', 'Ca chiều', 1, 2),
  option('TUE', 'Ca tối', 1, 1),
  option('WED', 'Ca sáng', 1, 2),
  option('WED', 'Ca chiều', 1, 2),
  option('WED', 'Ca tối', 0, 2),
  option('THU', 'Ca sáng', 0, 2),
  option('THU', 'Ca chiều', 2, 3),
  option('THU', 'Ca tối', 2, 2),
  option('FRI', 'Ca sáng', 1, 2),
  option('FRI', 'Ca chiều', 1, 3),
  option('FRI', 'Ca tối', 0, 2),
  option('SAT', 'Ca sáng', 0, 2),
  option('SAT', 'Ca chiều', 1, 2),
  option('SAT', 'Ca tối', 2, 2),
  option('SUN', 'Ca sáng', 0, 1),
  option('SUN', 'Ca chiều', 0, 1),
  option('SUN', 'Ca tối', 1, 1),
]

const initialShifts: StaffShiftCell[] = [
  createCell('FRI', 'Ca chiều', 'ASSIGNED', 'Hỗ trợ phòng A và phòng B'),
]

const defaultRegisterForm: RegisterForm = {
  day: '',
  startTime: '',
  endTime: '',
  selectedSlots: [],
  note: '',
}

export default function StaffSchedulePage() {
  const [shifts, setShifts] = useState<StaffShiftCell[]>(initialShifts)
  const [shiftOptions, setShiftOptions] = useState<ShiftOption[]>(initialShiftOptions)
  const [selectedCell, setSelectedCell] = useState<StaffShiftCell | null>(null)
  const [selectedCellDate, setSelectedCellDate] = useState('')
  const [currentWeekDate, setCurrentWeekDate] = useState(() => new Date())
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [isStudioVerified, setIsStudioVerified] = useState(false)
  const [locationStatus, setLocationStatus] = useState<VerificationStatus>('IDLE')
  const [locationDistance, setLocationDistance] = useState<number | null>(null)
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false)
  const [isRegisterLoading, setIsRegisterLoading] = useState(false)
  const [attendanceError, setAttendanceError] = useState('')
  const [registerError, setRegisterError] = useState('')
  const [registerSuccess, setRegisterSuccess] = useState('')
  const [registerForm, setRegisterForm] = useState<RegisterForm>(defaultRegisterForm)

  const shiftMap = useMemo(() => {
    return shifts.reduce<Record<string, StaffShiftCell>>((acc, shift) => {
      acc[getCellKey(shift.day, shift.shiftName)] = shift
      return acc
    }, {})
  }, [shifts])

  const currentShift = useMemo(() => findCurrentShift(shifts), [shifts])
  const attendanceStatus = getAttendanceStatus(currentShift)
  const hasAnyShift = shifts.some((shift) => shift.status !== 'EMPTY')
  const weekDays = useMemo(() => getWeekDays(currentWeekDate), [currentWeekDate])
  const timeSlots = useMemo(() => getTimeSlots(CALENDAR_START_HOUR, CALENDAR_END_HOUR), [])
  const shiftEventsByDate = useMemo(() => groupShiftEventsByDate(shifts, weekDays), [shifts, weekDays])
  const weekRangeLabel = formatWeekRange(weekDays)

  const handleRegisterShift = async () => {
    const firstSelectedSlot = registerForm.selectedSlots[0]
    const validationError = validateSlotRegistration(registerForm, shifts)
    setRegisterError(validationError)
    setRegisterSuccess('')

    if (validationError || !firstSelectedSlot) return

    setIsRegisterLoading(true)
    await wait()
    const newShiftEvents = groupSelectedSlotsToShiftEvents(registerForm.selectedSlots)

    setShifts((current) => [
      ...current,
      ...newShiftEvents.map((event, index) => ({
        id: `shift-${firstSelectedSlot.date}-${Date.now()}-${index}`,
        day: firstSelectedSlot.day,
        date: firstSelectedSlot.date,
        shiftName: detectShiftTitle(event.startTime, event.endTime),
        startTime: event.startTime,
        endTime: event.endTime,
        status: 'REGISTERED' as ShiftStatus,
        note: registerForm.note.trim() || 'Đăng ký mới',
      })),
    ])
    setIsRegisterLoading(false)
    setRegisterSuccess('Đã gửi đăng ký ca làm việc. Vui lòng chờ quản lý phân công.')
    window.setTimeout(() => {
      setRegisterForm(defaultRegisterForm)
      setRegisterSuccess('')
      setRegisterError('')
      setIsRegisterOpen(false)
    }, 700)
  }

  const handleVerifyLocation = async () => {
    setAttendanceError('')
    setLocationStatus('CHECKING')
    setLocationDistance(null)

    if (!navigator.geolocation) {
      setIsStudioVerified(false)
      setLocationStatus('BLOCKED')
      setAttendanceError('Không thể truy cập vị trí. Vui lòng bật quyền vị trí trên trình duyệt.')
      return
    }

    try {
      const position = await getCurrentPosition()
      const distance = calculateDistanceMeters(position.coords.latitude, position.coords.longitude, STUDIO_LOCATION.lat, STUDIO_LOCATION.lng)

      setLocationDistance(distance)
      if (isWithinStudioRadius(distance)) {
        setIsStudioVerified(true)
        setLocationStatus('VALID')
        return
      }

      setIsStudioVerified(false)
      setLocationStatus('INVALID')
      setAttendanceError('Bạn chưa ở gần BandHub Studio. Vui lòng đến studio để điểm danh.')
    } catch {
      setIsStudioVerified(false)
      setLocationStatus('BLOCKED')
      setAttendanceError('Không thể truy cập vị trí. Vui lòng bật quyền vị trí trên trình duyệt.')
    }
  }

  const handleCheckIn = async () => {
    setAttendanceError('')

    if (!currentShift) {
      setAttendanceError('Không có ca hiện tại.')
      return
    }

    if (currentShift.checkInTime) {
      setAttendanceError('Bạn đã check-in ca này rồi.')
      return
    }

    if (currentShift.status === 'COMPLETED') {
      setAttendanceError('Ca làm này đã hoàn tất.')
      return
    }

    if (!isWithinCheckInWindow(currentShift)) {
      setAttendanceError('Chưa đến khung giờ check-in ca làm.')
      return
    }

    if (!isStudioVerified) {
      setAttendanceError('Bạn chưa ở gần studio.')
      return
    }

    setIsAttendanceLoading(true)
    await wait()
    const checkInTime = getCurrentTime()
    const lateMinutes = calculateLateMinutes(currentShift.startTime, checkInTime)
    updateShift(currentShift.id, {
      status: 'IN_PROGRESS',
      checkInTime,
      attendanceResult: lateMinutes > 0 ? 'LATE' : 'ON_TIME',
      lateMinutes,
    })
    setIsAttendanceLoading(false)
  }

  const handleCheckOut = async () => {
    setAttendanceError('')

    if (!currentShift) {
      setAttendanceError('Không có ca hiện tại.')
      return
    }

    if (!currentShift.checkInTime) {
      setAttendanceError('Bạn cần check-in trước khi check-out.')
      return
    }

    if (currentShift.checkOutTime || currentShift.status === 'COMPLETED') {
      setAttendanceError('Ca làm này đã hoàn tất.')
      return
    }

    if (!isAfterShiftEnd(currentShift)) {
      setAttendanceError(`Chưa đến giờ kết thúc ca. Bạn có thể check-out sau ${currentShift.endTime}.`)
      return
    }

    if (!isStudioVerified) {
      setAttendanceError('Bạn chưa ở gần studio.')
      return
    }

    setIsAttendanceLoading(true)
    await wait()
    updateShift(currentShift.id, {
      status: 'COMPLETED',
      checkOutTime: getCurrentTime(),
    })
    setIsAttendanceLoading(false)
  }

  const updateShift = (id: string, patch: Partial<StaffShiftCell>) => {
    setShifts((current) => current.map((shift) => (shift.id === id ? { ...shift, ...patch } : shift)))
  }

  const openRegisterForDay = (day: DayKey) => {
    setRegisterForm({ ...defaultRegisterForm, day })
    setRegisterError('')
    setRegisterSuccess('')
    setIsRegisterOpen(true)
  }

  const removeRegisteredShift = (id: string) => {
    setShifts((current) => current.filter((shift) => shift.id !== id || shift.status !== 'REGISTERED'))
  }

  const openShiftDetail = (shift: StaffShiftEvent) => {
    setSelectedCell(shift)
    setSelectedCellDate(formatFullDateLabel(shift.date))
  }

  return (
    <AuthGuard allowedRoles={['STAFF']}>
      <StaffPageShell>
        <section className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="font-display text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">Lịch làm việc</h1>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => setIsAttendanceOpen(true)} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#FFF5F5] px-6 font-display text-sm font-bold text-[#B91C1C] transition hover:bg-[#FFE8E8]">
                Điểm danh
                <IconCalendarCheck />
              </button>
              <button type="button" onClick={() => openRegisterForDay(weekDays.find((day) => day.isToday)?.key ?? weekDays[0]?.key ?? 'MON')} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#C91F2E] px-6 font-display text-sm font-bold text-white shadow-[0_12px_26px_rgba(201,31,46,0.22)] transition hover:bg-[#A91724]">
                Đăng ký ca làm việc
                <IconCalendarPlus />
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-outline-variant bg-white shadow-[var(--band-shadow-card)]">
            {!hasAnyShift && (
              <div className="m-5 rounded-xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-5 text-sm text-on-surface-variant">
                Tuần này chưa có ca làm nào. Bạn có thể đăng ký ca làm việc ở nút phía trên.
              </div>
            )}

            <div className="flex flex-col gap-3 border-b border-outline-variant px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <p className="font-display text-sm font-bold text-on-surface-variant">Tuần làm việc</p>
                <p className="mt-1 font-display text-xl font-bold text-on-surface">{weekRangeLabel}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setCurrentWeekDate((date) => addDays(date, -7))} className="btn-secondary">
                  Tuần trước
                </button>
                <button type="button" onClick={() => setCurrentWeekDate(new Date())} className="btn-secondary">
                  Hôm nay
                </button>
                <button type="button" onClick={() => setCurrentWeekDate((date) => addDays(date, 7))} className="btn-secondary">
                  Tuần sau
                </button>
              </div>
            </div>

            <WeeklyCalendar
              weekDays={weekDays}
              timeSlots={timeSlots}
              eventsByDate={shiftEventsByDate}
              onEventClick={openShiftDetail}
              onEmptySlotClick={openRegisterForDay}
            />
          </div>
        </section>

        {isAttendanceOpen && (
          <AttendanceModal
            shift={currentShift}
            status={attendanceStatus}
            isStudioVerified={isStudioVerified}
            locationStatus={locationStatus}
            locationDistance={locationDistance}
            isLoading={isAttendanceLoading}
            error={attendanceError}
            onVerify={handleVerifyLocation}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            onClose={() => {
              setIsAttendanceOpen(false)
              setAttendanceError('')
            }}
          />
        )}

        {isRegisterOpen && (
          <FlexibleRegisterShiftModal
            form={registerForm}
            shifts={shifts}
            weekDays={weekDays}
            error={registerError}
            success={registerSuccess}
            isLoading={isRegisterLoading}
            onChange={(nextForm) => {
              setRegisterForm(nextForm)
              setRegisterError('')
              setRegisterSuccess('')
            }}
            onSubmit={handleRegisterShift}
            onRemoveShift={removeRegisteredShift}
            onClose={() => {
              setIsRegisterOpen(false)
              setRegisterForm(defaultRegisterForm)
              setRegisterError('')
              setRegisterSuccess('')
            }}
          />
        )}

        {selectedCell && <ShiftDetailModal shift={selectedCell} dateLabel={selectedCellDate} onClose={() => setSelectedCell(null)} />}
      </StaffPageShell>
    </AuthGuard>
  )
}

function WeeklyCalendar({
  weekDays,
  timeSlots,
  eventsByDate,
  onEventClick,
  onEmptySlotClick,
}: {
  weekDays: WeekDayItem[]
  timeSlots: string[]
  eventsByDate: Record<string, StaffShiftEvent[]>
  onEventClick: (shift: StaffShiftEvent) => void
  onEmptySlotClick: (day: DayKey) => void
}) {
  const calendarHeight = (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * CALENDAR_HOUR_HEIGHT
  const gridTemplateColumns = '80px repeat(7, minmax(148px, 1fr))'

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1120px]">
        <div className="grid border-b border-outline-variant bg-[#FDFBF8]" style={{ gridTemplateColumns }}>
          <div className="flex min-h-[76px] flex-col items-center justify-center border-r border-outline-variant px-2 text-center">
            <IconClockSmall />
            <span className="mt-1 font-display text-xs font-bold text-on-surface-variant">Giờ VN</span>
          </div>
          {weekDays.map((day) => (
            <div
              key={day.dateKey}
              className={[
                'min-h-[76px] border-r border-outline-variant px-3 py-3 text-center last:border-r-0',
                day.isToday ? 'bg-primary-container/30' : 'bg-white',
              ].join(' ')}
            >
              <p className="font-display text-base font-bold text-on-surface">{formatShortDate(day.date)}</p>
              <p className={['mt-1 text-sm font-semibold', day.isToday ? 'text-brand-orange' : 'text-on-surface-variant'].join(' ')}>
                {day.longLabel}
              </p>
            </div>
          ))}
        </div>

        <div className="grid" style={{ gridTemplateColumns }}>
          <div className="relative border-r border-outline-variant bg-[#FDFBF8]" style={{ height: calendarHeight }}>
            {timeSlots.map((slot) => (
              <div
                key={slot}
                className="absolute right-3 -translate-y-2 font-display text-xs font-bold text-on-surface-variant"
                style={{ top: calculateEventTop(slot) }}
              >
                {slot}
              </div>
            ))}
          </div>

          {weekDays.map((day) => {
            const events = eventsByDate[day.dateKey] ?? []

            return (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => onEmptySlotClick(day.key)}
                className={[
                  'relative block border-r border-outline-variant bg-white text-left last:border-r-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-orange',
                  day.isToday ? 'bg-primary-container/10' : 'hover:bg-surface-container-low/70',
                ].join(' ')}
                style={{ height: calendarHeight }}
                aria-label={`Đăng ký ca làm việc ${day.longLabel}`}
              >
                {timeSlots.slice(0, -1).map((slot) => (
                  <span
                    key={slot}
                    className="pointer-events-none absolute left-0 right-0 border-t border-outline-variant"
                    style={{ top: calculateEventTop(slot) }}
                  />
                ))}

                {events.map((event) => {
                  const top = calculateEventTop(event.startTime)
                  const height = calculateEventHeight(event.startTime, event.endTime)
                  const meta = getShiftStatusMeta(event.status)

                  return (
                    <span
                      key={event.id}
                      role="button"
                      tabIndex={0}
                      onClick={(eventClick) => {
                        eventClick.stopPropagation()
                        onEventClick(event)
                      }}
                      onKeyDown={(eventKey) => {
                        if (eventKey.key === 'Enter' || eventKey.key === ' ') {
                          eventKey.preventDefault()
                          eventKey.stopPropagation()
                          onEventClick(event)
                        }
                      }}
                      className={[
                        'absolute left-2 right-2 overflow-hidden rounded-xl border p-3 shadow-[0_12px_26px_rgba(26,28,30,0.10)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(26,28,30,0.14)]',
                        getShiftEventStyle(event.status),
                      ].join(' ')}
                      style={{ top: top + 6, height: Math.max(56, height - 10) }}
                    >
                      <span className="block truncate font-display text-sm font-bold">{event.title}</span>
                      <span className="mt-1 block text-xs font-semibold">{event.startTime} - {event.endTime}</span>
                      <span className={['mt-2 inline-flex rounded-full px-2 py-0.5 font-display text-[10px] font-bold', meta.className].join(' ')}>
                        {meta.label}
                      </span>
                      {event.note && <span className="mt-2 line-clamp-2 block text-xs leading-5 opacity-90">{event.note}</span>}
                    </span>
                  )
                })}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function AttendanceModal({
  shift,
  status,
  isStudioVerified,
  locationStatus,
  locationDistance,
  isLoading,
  error,
  onVerify,
  onCheckIn,
  onCheckOut,
  onClose,
}: {
  shift: StaffShiftCell | null
  status: AttendanceStatus
  isStudioVerified: boolean
  locationStatus: VerificationStatus
  locationDistance: number | null
  isLoading: boolean
  error: string
  onVerify: () => void
  onCheckIn: () => void
  onCheckOut: () => void
  onClose: () => void
}) {
  const statusMeta = getAttendanceStatusMeta(status)
  const hasValidShift = Boolean(shift && shift.status !== 'EMPTY' && shift.status !== 'OFFLINE')
  const withinCheckInWindow = shift ? isWithinCheckInWindow(shift) : false
  const afterShiftEnd = shift ? isAfterShiftEnd(shift) : false
  const canCheckIn = status === 'NOT_STARTED' && hasValidShift && withinCheckInWindow && isStudioVerified && !isLoading
  const canCheckOut = status === 'CHECKED_IN' && afterShiftEnd && isStudioVerified && !isLoading
  const locationConditionStatus = locationStatus === 'CHECKING' ? 'CHECKING' : isStudioVerified ? 'PASSED' : 'FAILED'
  const attendanceResult = getAttendanceResult(shift)
  const attendanceMeta = getAttendanceResultMeta(attendanceResult)
  const lateLabel = attendanceResult === 'LATE' ? `Đi muộn ${shift?.lateMinutes ?? 0} phút` : attendanceMeta.label

  return (
    <ModalFrame title="Điểm danh ca hiện tại" description="Xác minh ca làm, vị trí tại studio và thời gian trước khi check-in hoặc check-out." onClose={onClose} size="lg">
      {!shift ? (
        <div className="rounded-xl border border-error-container bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container">Không có ca hiện tại.</div>
      ) : (
        <div className="space-y-5">
          <section className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-display text-xl font-bold text-on-surface">{shift.shiftName}</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {getDayLabel(shift.day)} · {shift.startTime} - {shift.endTime}
                </p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">{shift.note ?? 'Không có ghi chú cho ca này.'}</p>
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <span className={['w-fit rounded-full px-3 py-1 font-display text-xs font-bold', statusMeta.className].join(' ')}>{statusMeta.label}</span>
                <span className={['w-fit rounded-full px-3 py-1 font-display text-xs font-bold', attendanceMeta.className].join(' ')}>
                  {lateLabel}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-4 shadow-[0_8px_24px_rgba(26,28,30,0.04)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-on-surface">Xác minh vị trí</h3>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {STUDIO_LOCATION.name} · {STUDIO_LOCATION.address} · bán kính {STUDIO_LOCATION.radiusMeters}m
                </p>
                {locationDistance !== null && (
                  <p className="mt-1 text-sm font-semibold text-on-surface">Khoảng cách hiện tại: {formatDistance(locationDistance)}</p>
                )}
              </div>
              <button type="button" onClick={onVerify} disabled={locationStatus === 'CHECKING' || isLoading} className="btn-secondary shrink-0 disabled:cursor-not-allowed disabled:opacity-60">
                {locationStatus === 'CHECKING' ? 'Đang kiểm tra vị trí...' : 'Kiểm tra vị trí'}
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-4 shadow-[0_8px_24px_rgba(26,28,30,0.04)]">
            <h3 className="font-display text-base font-bold text-on-surface">Điều kiện điểm danh</h3>
            <div className="mt-4 grid gap-2">
              <ConditionLine status={hasValidShift ? 'PASSED' : 'FAILED'} label="Ca làm hợp lệ" />
              <ConditionLine status={withinCheckInWindow ? 'PASSED' : 'FAILED'} label={`Đúng khung giờ check-in từ ${getCheckInStartTime(shift)} đến ${shift.endTime}`} />
              <ConditionLine status={locationConditionStatus} label="Đang ở gần studio" />
              <ConditionLine status={afterShiftEnd ? 'PASSED' : 'FAILED'} label={`Đã đến giờ kết thúc ca ${shift.endTime}`} />
            </div>
          </section>

          <section className="grid gap-3 text-sm sm:grid-cols-2">
            <InfoItem label="Giờ vào" value={shift.checkInTime ?? 'Chưa check-in'} />
            <InfoItem label="Giờ ra" value={shift.checkOutTime ?? 'Chưa check-out'} />
            <InfoItem label="Tổng thời lượng làm việc" value={calculateWorkingDuration(shift.checkInTime, shift.checkOutTime)} />
            <InfoItem label="Trạng thái đi làm" value={lateLabel} />
            <InfoItem label="Trạng thái ca" value={statusMeta.label} />
            <InfoItem label="Số phút muộn" value={attendanceResult === 'LATE' ? `${shift.lateMinutes ?? 0} phút` : '0 phút'} />
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-4 shadow-[0_8px_24px_rgba(26,28,30,0.04)]">
            <h3 className="font-display text-base font-bold text-on-surface">Timeline ca làm</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <TimelineStep label="Bắt đầu ca" value={shift.startTime} active />
              <TimelineStep label="Check-in" value={formatCheckInTimelineValue(shift)} active={Boolean(shift.checkInTime)} />
              <TimelineStep label="Kết thúc ca" value={shift.checkOutTime ?? shift.endTime} active={Boolean(shift.checkOutTime)} />
            </div>
          </section>

          {status === 'CHECKED_IN' && !afterShiftEnd && (
            <div className="rounded-xl border border-[#FEF3C7] bg-[#FFFBEB] px-4 py-3 text-sm font-semibold text-[#92400E]">
              Chưa đến giờ kết thúc ca. Bạn có thể check-out sau {shift.endTime}.
            </div>
          )}
          {error && <div className="rounded-xl border border-error-container bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container">{error}</div>}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isLoading}>
              Hủy
            </button>
            {status === 'NOT_STARTED' && (
              <button type="button" onClick={onCheckIn} disabled={!canCheckIn} className="btn-warm disabled:cursor-not-allowed disabled:opacity-50">
                {isLoading ? 'Đang check-in...' : 'Check-in'}
              </button>
            )}
            {status === 'CHECKED_IN' && (
              <button type="button" onClick={onCheckOut} disabled={!canCheckOut} className="btn-warm disabled:cursor-not-allowed disabled:opacity-50">
                {isLoading ? 'Đang check-out...' : 'Check-out'}
              </button>
            )}
            {status === 'CHECKED_OUT' && (
              <button type="button" disabled className="btn-secondary opacity-70">
                Đã hoàn tất ca
              </button>
            )}
          </div>
        </div>
      )}
    </ModalFrame>
  )
}

function FlexibleRegisterShiftModal({
  form,
  shifts,
  weekDays,
  error,
  success,
  isLoading,
  onChange,
  onSubmit,
  onRemoveShift,
  onClose,
}: {
  form: RegisterForm
  shifts: StaffShiftCell[]
  weekDays: WeekDayItem[]
  error: string
  success: string
  isLoading: boolean
  onChange: (form: RegisterForm) => void
  onSubmit: () => void
  onRemoveShift: (id: string) => void
  onClose: () => void
}) {
  const [registrationWeekDate, setRegistrationWeekDate] = useState(() => getNextWeek())
  const registrationWeekDays = useMemo(() => getWeekDays(registrationWeekDate), [registrationWeekDate])
  const [calendarMonth, setCalendarMonth] = useState(() => getNextWeek())

  {
    const registrationWeekStart = startOfWeek(registrationWeekDate)
    const canRegisterSelectedWeek = canRegisterInWeek(registrationWeekStart)
    const selectedDay = registrationWeekDays.find((day) => day.key === form.day) ?? registrationWeekDays[0]
    const selectedDate = selectedDay?.date ?? new Date()
    const selectedDateKey = selectedDay?.dateKey ?? formatDateKey(selectedDate)
    const selectedSlotIds = new Set(form.selectedSlots.map((slot) => slot.id))
    const existingWeekEvents = getRegisteredWeekEvents(shifts, registrationWeekDays)
    const visibleWeekItems = getRegisterSummaryItems(existingWeekEvents, form.selectedSlots, selectedDay)
    const totalWeekMinutes = visibleWeekItems.reduce((total, item) => total + calculateDuration(item.startTime, item.endTime), 0)
    const selectedMinutes = calculateSelectedDuration(form.selectedSlots)
    const selectedGroups = groupSelectedSlotsToShiftEvents(form.selectedSlots)
    const validationMessage = validateSlotRegistration(form, shifts, registrationWeekDays, registrationWeekStart)
    const slotGroups = getShiftSlotGroups()
    const calendarDays = generateCalendarDays(calendarMonth)
    const registrationWeekLabel = formatWeekRange(registrationWeekDays)

    const changeRegistrationWeek = (direction: -1 | 1) => {
      const nextWeekDate = addDays(registrationWeekDate, direction * 7)
      const nextWeekDays = getWeekDays(nextWeekDate)
      setRegistrationWeekDate(nextWeekDate)
      setCalendarMonth(startOfWeek(nextWeekDate))
      onChange({ ...form, day: form.day || nextWeekDays[0]?.key || 'MON', startTime: '', endTime: '', selectedSlots: [] })
    }

    const updateSelectedDay = (day: WeekDayItem) => {
      onChange({ ...form, day: day.key, startTime: '', endTime: '', selectedSlots: [] })
    }

    const handleToggleSlot = (slot: TimeSlot, status: TimeSlotStatus) => {
      if (!canRegisterSelectedWeek) return
      if (status !== 'AVAILABLE' && status !== 'SELECTED') return

      const nextSlots = selectedSlotIds.has(slot.id)
        ? form.selectedSlots.filter((selectedSlot) => selectedSlot.id !== slot.id)
        : [...form.selectedSlots, { ...slot, status: 'SELECTED' as TimeSlotStatus }]

      onChange({ ...form, selectedSlots: nextSlots.sort((first, second) => convertTimeToMinutes(first.startTime) - convertTimeToMinutes(second.startTime)) })
    }

    const clearAllSlots = () => {
      onChange({ ...form, selectedSlots: [] })
    }

    const removeSelectedGroup = (group: { startTime: string; endTime: string }) => {
      onChange({
        ...form,
        selectedSlots: form.selectedSlots.filter((slot) => !(slot.startTime >= group.startTime && slot.endTime <= group.endTime)),
      })
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1C1E]/35 p-3 sm:p-4" onClick={onClose}>
        <section className="flex max-h-[90vh] w-full max-w-[1280px] flex-col overflow-hidden rounded-[28px] border border-outline-variant bg-white shadow-[var(--band-shadow-elevated)]" onClick={(event) => event.stopPropagation()}>
          <header className="flex items-start justify-between gap-4 border-b border-outline-variant px-6 py-5">
            <div>
              <h2 className="font-display text-3xl font-bold text-on-surface">Đăng ký ca làm việc</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
                Chọn các ca bạn muốn đăng ký trong tuần. Lịch của bạn sẽ hiển thị trên lịch làm việc.
              </p>
              <p className="mt-3 inline-flex rounded-full bg-primary-container px-4 py-2 font-display text-sm font-bold text-on-primary-container">
                Đăng ký ca cho tuần {registrationWeekLabel}
              </p>
            </div>
            <button type="button" onClick={onClose} className="icon-button shrink-0" aria-label="Đóng" disabled={isLoading}>
              <IconClose />
            </button>
          </header>

          <div className="grid flex-1 gap-5 overflow-y-auto bg-[#FDFBF8] p-5 lg:grid-cols-[minmax(300px,0.32fr)_minmax(0,0.68fr)]">
            <aside className="space-y-4">
              <section className="rounded-2xl border border-outline-variant bg-white p-5 shadow-[0_10px_28px_rgba(26,28,30,0.05)]">
                <h3 className="font-display text-base font-bold text-on-surface">Chọn ngày</h3>
                <div className="mt-4 flex items-center justify-between gap-2 rounded-2xl bg-surface-container-low p-2">
                  <button type="button" onClick={() => changeRegistrationWeek(-1)} className="btn-secondary px-3 py-2 text-xs" disabled={isLoading}>
                    Tuần trước
                  </button>
                  <span className="text-center font-display text-xs font-bold text-on-surface">{registrationWeekLabel}</span>
                  <button type="button" onClick={() => changeRegistrationWeek(1)} className="btn-secondary px-3 py-2 text-xs" disabled={isLoading}>
                    Tuần sau
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <button type="button" onClick={() => setCalendarMonth((current) => addMonths(current, -1))} className="icon-button h-9 w-9" aria-label="Tháng trước">
                    <IconChevronLeft />
                  </button>
                  <p className="font-display text-base font-bold text-on-surface">{formatMonthTitle(calendarMonth)}</p>
                  <button type="button" onClick={() => setCalendarMonth((current) => addMonths(current, 1))} className="icon-button h-9 w-9" aria-label="Tháng sau">
                    <IconChevronRight />
                  </button>
                </div>
                <div className="mt-5 grid grid-cols-7 gap-1 text-center">
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((label) => (
                    <span key={label} className="py-1 font-display text-xs font-bold text-on-surface-variant">{label}</span>
                  ))}
                  {calendarDays.map((calendarDay) => {
                    const weekDay = registrationWeekDays.find((day) => day.dateKey === formatDateKey(calendarDay.date))
                    const selected = Boolean(weekDay && weekDay.dateKey === selectedDateKey)
                    const hasRegistered = existingWeekEvents.some((event) => event.date === formatDateKey(calendarDay.date))
                    const selectable = Boolean(weekDay)

                    return (
                      <button
                        key={calendarDay.id}
                        type="button"
                        onClick={() => weekDay && updateSelectedDay(weekDay)}
                        disabled={!selectable || isLoading}
                        className={[
                          'relative flex h-10 items-center justify-center rounded-full font-display text-sm transition',
                          selected ? 'bg-brand-orange text-white shadow-[0_10px_22px_rgba(255,117,24,0.22)]' : calendarDay.isToday ? 'bg-primary-container text-on-primary-container' : 'text-on-surface hover:bg-surface-container-low',
                          !calendarDay.inMonth ? 'opacity-45' : '',
                          !selectable ? 'cursor-not-allowed text-on-surface-variant/45 hover:bg-transparent' : '',
                        ].join(' ')}
                      >
                        {calendarDay.date.getDate()}
                        {hasRegistered && !selected && <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-brand-orange" />}
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-outline-variant bg-white p-5 shadow-[0_10px_28px_rgba(26,28,30,0.05)]">
                <h3 className="font-display text-sm font-bold text-on-surface">Chú thích</h3>
                <div className="mt-4 grid gap-3 text-sm text-on-surface-variant">
                  <LegendItem color="bg-primary-container" label="Đã đăng ký" />
                  <LegendItem color="bg-[#E8F5EC]" label="Đã phân công" />
                  <LegendItem color="bg-brand-orange" label="Ngày đang chọn" />
                  <LegendItem color="bg-surface-container-high" label="Không thể đăng ký" />
                </div>
              </section>

              <section className="rounded-2xl border border-outline-variant bg-white p-5 shadow-[0_10px_28px_rgba(26,28,30,0.05)]">
                <h3 className="font-display text-sm font-bold text-on-surface">Ca đã đăng ký trong tuần <span className="text-on-surface-variant">({visibleWeekItems.length} ca)</span></h3>
                <div className="mt-4 space-y-2">
                  {visibleWeekItems.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-4 text-sm text-on-surface-variant">Chưa có ca nào trong tuần.</p>
                  ) : (
                    visibleWeekItems.map((item) => {
                      const statusLabel = item.status === 'ASSIGNED' ? 'Đã phân công' : item.status === 'SELECTED' ? 'Đã chọn' : 'Đã đăng ký'
                      const statusClass = item.status === 'ASSIGNED'
                        ? 'bg-[#E8F5EC] text-secondary'
                        : item.status === 'SELECTED'
                          ? 'bg-primary-container text-on-primary-container'
                          : 'bg-[#FFF3E8] text-[#A44900]'

                      return (
                        <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant bg-white px-3 py-3 shadow-[0_6px_16px_rgba(26,28,30,0.04)]">
                          <div>
                            <p className="text-xs font-semibold text-on-surface-variant">{item.dateLabel}</p>
                            <p className="mt-1 font-display text-sm font-bold text-on-surface">{item.startTime} - {item.endTime}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={['rounded-full px-2.5 py-1 text-xs font-bold', statusClass].join(' ')}>
                              {statusLabel}
                            </span>
                            {item.removable && canRegisterSelectedWeek && (
                              <button type="button" onClick={() => item.source === 'selected' ? removeSelectedGroup(item) : onRemoveShift(item.id)} className="rounded-full p-1 text-on-surface-variant hover:bg-error-container hover:text-error" aria-label="Xóa ca">
                                <IconClose />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-outline-variant pt-4 text-sm">
                  <span className="text-on-surface-variant">Tổng thời lượng</span>
                  <span className="font-display font-bold text-on-surface">{formatDuration(totalWeekMinutes)}</span>
                </div>
              </section>
            </aside>

            <main className="flex min-w-0 flex-col rounded-2xl border border-outline-variant bg-white shadow-[0_10px_28px_rgba(26,28,30,0.05)]">
              <div className="flex flex-col gap-4 border-b border-outline-variant px-6 py-5 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <h3 className="font-display text-xl font-bold text-on-surface">
                    Chọn ca làm cho <span className="text-brand-orange">{formatFullDateLabel(selectedDateKey)}</span>
                  </h3>
                  <p className="mt-2 text-sm text-on-surface-variant">Chọn một hoặc nhiều khung giờ phù hợp với thời gian của bạn.</p>
                </div>
                <div className="grid w-full gap-3 rounded-2xl bg-surface-container-low px-4 py-3 text-sm sm:grid-cols-2 xl:w-[310px]">
                  <InfoMini label="Giờ làm việc" value="08:00 - 22:00" />
                  <InfoMini label="Bước chọn" value="30 phút" />
                </div>
              </div>

              <div className="space-y-6 px-6 py-5">
                {!canRegisterSelectedWeek && (
                  <div className="rounded-xl border border-[#F6D7B8] bg-[#FFF7ED] px-4 py-3 text-sm font-semibold text-[#92400E]">
                    Tuần này đã bắt đầu, bạn không thể đăng ký ca mới. Vui lòng đăng ký cho tuần sau.
                  </div>
                )}
                {slotGroups.map((group) => {
                  const slots = generateTimeSlots(group.startTime, group.endTime, 30, selectedDateKey, selectedDay?.key ?? 'MON')

                  return (
                    <section key={group.name} className="grid gap-4 border-b border-outline-variant pb-6 last:border-b-0 last:pb-0 lg:grid-cols-[160px_1fr]">
                      <div className="flex gap-3 lg:block">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-container text-brand-orange">
                          <ShiftGroupIcon icon={group.icon} />
                        </div>
                        <div className="lg:mt-4">
                          <p className="font-display text-base font-bold text-on-surface">{group.name}</p>
                          <p className="mt-2 text-sm text-on-surface-variant">{group.startTime} - {group.endTime} <span className="ml-2 rounded-full bg-surface-container px-2 py-1 text-xs font-bold">4 giờ</span></p>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {slots.map((slot) => {
                          const status = getTimeSlotStatus(slot, shifts, registrationWeekStart, form.selectedSlots)
                          const meta = getSlotStatusMeta(status)

                          return (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => handleToggleSlot(slot, status)}
                              disabled={isLoading || status === 'REGISTERED' || status === 'ASSIGNED' || status === 'DISABLED'}
                              className={['flex min-h-14 items-center justify-between rounded-xl border px-4 py-3 text-left font-display text-sm font-semibold transition disabled:cursor-not-allowed', meta.className].join(' ')}
                            >
                              <span>{slot.startTime} - {slot.endTime}</span>
                              <span className="shrink-0">{meta.icon}</span>
                            </button>
                          )
                        })}
                      </div>
                    </section>
                  )
                })}

                <div className="flex flex-col gap-3 rounded-xl border border-[#DDEEE4] bg-[#F1FAF5] px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-semibold text-secondary">
                    {form.selectedSlots.length === 0 ? 'Chưa chọn khung giờ nào' : `Đã chọn ${form.selectedSlots.length} khung giờ (${formatDuration(selectedMinutes)})`}
                  </p>
                  {form.selectedSlots.length > 0 && (
                    <button type="button" onClick={clearAllSlots} className="font-display text-sm font-bold text-error hover:underline">
                      Xóa tất cả
                    </button>
                  )}
                </div>

                {(error || validationMessage) && (
                  <div className="rounded-xl border border-error-container bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container">
                    {error || validationMessage}
                  </div>
                )}
                {success && <div className="rounded-xl border border-[#CDE9D6] bg-[#E8F5EC] px-4 py-3 text-sm font-semibold text-secondary">{success}</div>}
              </div>
            </main>
          </div>

          <footer className="flex flex-col gap-4 border-t border-outline-variant bg-white px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="rounded-2xl border border-outline-variant bg-white px-4 py-3 text-sm text-on-surface-variant">
              <p className="font-display font-bold text-on-surface">Lưu ý</p>
              <p className="mt-1">Mỗi ca tối thiểu 1 giờ, tối đa 8 giờ.</p>
              <p>Bạn có thể đăng ký nhiều khung giờ khác nhau trong ngày.</p>
              <p>Đã đăng ký: yêu cầu đang chờ duyệt. Đã phân công: quản lý đã duyệt, không thể sửa.</p>
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} className="btn-secondary" disabled={isLoading}>
                Hủy
              </button>
              <button type="button" onClick={onSubmit} disabled={isLoading || !canRegisterSelectedWeek || Boolean(validationMessage)} className="btn-warm min-w-[210px] disabled:cursor-not-allowed disabled:opacity-50">
                {isLoading ? 'Đang đăng ký...' : `Xác nhận đăng ký (${selectedGroups.length} ca)`}
              </button>
            </div>
          </footer>
        </section>
      </div>
    )
  }

  const timeOptions = getFlexibleTimeOptions()
  const selectedDay = weekDays.find((day) => day.key === form.day) ?? weekDays[0]
  const durationMinutes = form.startTime && form.endTime ? calculateDuration(form.startTime, form.endTime) : 0
  const shiftTitle = form.startTime && form.endTime ? detectShiftTitle(form.startTime, form.endTime) : ''
  const validationMessage = validateFlexibleShiftRegistration(form, shifts, weekDays)
  const isSubmitDisabled = isLoading || Boolean(validationMessage)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1C1E]/35 p-3 sm:p-4" onClick={onClose}>
      <section className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-[760px] flex-col overflow-hidden rounded-xl border border-outline-variant bg-white shadow-[var(--band-shadow-elevated)]" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-4 border-b border-outline-variant px-5 py-5 sm:px-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-on-surface">Đăng ký ca làm việc</h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-on-surface-variant">
              Chọn ngày và khung giờ linh hoạt để đăng ký lịch làm việc part-time trong tuần.
            </p>
          </div>
          <button type="button" onClick={onClose} className="icon-button shrink-0" aria-label="Đóng" disabled={isLoading}>
            <IconClose />
          </button>
        </header>

        <div className="space-y-5 overflow-y-auto bg-[#FDFBF8] px-5 py-5 sm:px-6">
          <section className="rounded-xl border border-outline-variant bg-white p-4 shadow-[0_8px_24px_rgba(26,28,30,0.04)]">
            <div className="flex flex-col gap-1">
              <h3 className="font-display text-base font-bold text-on-surface">Chọn ngày làm việc</h3>
              <p className="text-sm text-on-surface-variant">Chỉ hiển thị các ngày trong tuần đang xem trên lịch.</p>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {weekDays.map((day) => {
                const active = form.day === day.key
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => onChange({ ...form, day: day.key })}
                    disabled={isLoading}
                    className={[
                      'rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60',
                      active ? 'border-brand-orange bg-primary-container/55 shadow-[0_10px_24px_rgba(255,117,24,0.12)]' : 'border-outline-variant bg-white hover:border-brand-orange/50 hover:bg-primary-container/20',
                    ].join(' ')}
                  >
                    <span className="block font-display text-sm font-bold text-on-surface">{day.label}</span>
                    <span className="mt-1 block text-lg font-bold text-on-surface">{formatShortDate(day.date)}</span>
                    <span className="mt-2 inline-flex rounded-full bg-surface-container px-2.5 py-1 text-xs font-semibold text-on-surface-variant">
                      {day.longLabel}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-4 shadow-[0_8px_24px_rgba(26,28,30,0.04)]">
            <div className="flex flex-col gap-1">
              <h3 className="font-display text-base font-bold text-on-surface">Chọn khung giờ</h3>
              <p className="text-sm text-on-surface-variant">Giờ làm việc từ 08:00 đến 22:00, chọn theo bước 30 phút.</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="font-display text-sm font-bold text-on-surface">Giờ bắt đầu</span>
                <select
                  value={form.startTime}
                  onChange={(event) => onChange({ ...form, startTime: event.target.value })}
                  disabled={isLoading}
                  className="mt-2 h-12 w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 font-display text-sm font-bold text-on-surface outline-none transition focus:border-brand-orange focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">Chọn giờ bắt đầu</option>
                  {timeOptions.slice(0, -2).map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="font-display text-sm font-bold text-on-surface">Giờ kết thúc</span>
                <select
                  value={form.endTime}
                  onChange={(event) => onChange({ ...form, endTime: event.target.value })}
                  disabled={isLoading}
                  className="mt-2 h-12 w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 font-display text-sm font-bold text-on-surface outline-none transition focus:border-brand-orange focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">Chọn giờ kết thúc</option>
                  {timeOptions.slice(2).map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </label>
            </div>
            {form.startTime && form.endTime && (
              <div className="mt-4 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
                Khung giờ đã chọn: <span className="font-bold text-on-surface">{form.startTime} - {form.endTime}</span>
                {durationMinutes > 0 && <span> · {formatDuration(durationMinutes)} · {shiftTitle}</span>}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-4 shadow-[0_8px_24px_rgba(26,28,30,0.04)]">
            <label className="block">
              <span className="font-display text-sm font-bold text-on-surface">Ghi chú cho quản lý</span>
              <textarea
                value={form.note}
                onChange={(event) => onChange({ ...form, note: event.target.value })}
                disabled={isLoading}
                className="mt-2 min-h-28 w-full resize-none rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm outline-none transition placeholder:text-on-surface-variant/70 focus:border-brand-orange focus:bg-white focus:ring-4 focus:ring-brand-orange/10 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Ví dụ: Có thể hỗ trợ set up phòng sáng, trực quầy hoặc hỗ trợ phòng thu vocal."
              />
              <span className="mt-2 block text-sm text-on-surface-variant">
                Ghi chú là tùy chọn và sẽ được gửi kèm yêu cầu đăng ký ca.
              </span>
            </label>
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-4 shadow-[0_8px_24px_rgba(26,28,30,0.04)]">
            <h3 className="font-display text-base font-bold text-on-surface">Tóm tắt đăng ký</h3>
            {!form.day || !form.startTime || !form.endTime || !selectedDay || durationMinutes <= 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-4 text-sm text-on-surface-variant">
                Vui lòng chọn ngày và khung giờ để xem tóm tắt.
              </p>
            ) : (
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <InfoItem label="Ngày đăng ký" value={`${selectedDay.longLabel} · ${formatShortDate(selectedDay.date)}/${selectedDay.date.getFullYear()}`} />
                <InfoItem label="Khung giờ" value={`${form.startTime} - ${form.endTime}`} />
                <InfoItem label="Tổng thời lượng" value={formatDuration(durationMinutes)} />
                <InfoItem label="Loại ca" value={shiftTitle} />
                <div className="sm:col-span-2">
                  <InfoItem label="Ghi chú" value={form.note.trim() || 'Không có'} />
                </div>
              </dl>
            )}
          </section>

          {(error || validationMessage) && (
            <div className="rounded-xl border border-error-container bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container">
              {error || validationMessage}
            </div>
          )}
          {success && <div className="rounded-xl border border-[#CDE9D6] bg-[#E8F5EC] px-4 py-3 text-sm font-semibold text-secondary">{success}</div>}
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-outline-variant bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={isLoading}>
            Hủy
          </button>
          <button type="button" onClick={onSubmit} disabled={isSubmitDisabled} className="btn-warm disabled:cursor-not-allowed disabled:opacity-50">
            {isLoading ? 'Đang đăng ký...' : 'Đăng ký ca'}
          </button>
        </footer>
      </section>
    </div>
  )
}

function ShiftDetailModal({ shift, dateLabel, onClose }: { shift: StaffShiftCell; dateLabel?: string; onClose: () => void }) {
  const meta = getShiftStatusMeta(shift.status)

  return (
    <ModalFrame title="Chi tiết ca làm" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 rounded-xl border border-outline-variant bg-surface-container-low p-4">
          <div>
            <p className="font-display text-xl font-bold text-on-surface">{shift.shiftName}</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              {getDayLabel(shift.day)} · {shift.startTime} - {shift.endTime}
            </p>
          </div>
          <span className={['rounded-full px-3 py-1 font-display text-xs font-bold', meta.className].join(' ')}>{meta.label}</span>
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <InfoItem label="Ngày" value={dateLabel || getDayLabel(shift.day)} />
          <InfoItem label="Ca" value={shift.shiftName} />
          <InfoItem label="Thời gian" value={`${shift.startTime} - ${shift.endTime}`} />
          <InfoItem label="Trạng thái" value={meta.label} />
          <InfoItem label="Ghi chú" value={shift.note ?? 'Không có'} />
          <InfoItem label="Check-in" value={shift.checkInTime ?? 'Chưa có'} />
          <InfoItem label="Check-out" value={shift.checkOutTime ?? 'Chưa có'} />
          <InfoItem label="Tổng thời lượng" value={calculateWorkingDuration(shift.checkInTime, shift.checkOutTime)} />
        </dl>
      </div>
    </ModalFrame>
  )
}

function ModalFrame({
  title,
  description,
  children,
  onClose,
  size = 'md',
}: {
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
  size?: 'md' | 'lg'
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1C1E]/35 p-3 sm:p-4" onClick={onClose}>
      <section className={['flex max-h-[calc(100vh-1.5rem)] w-full flex-col overflow-hidden rounded-xl border border-outline-variant bg-white shadow-[var(--band-shadow-elevated)]', size === 'lg' ? 'max-w-[760px]' : 'max-w-xl'].join(' ')} onClick={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-4 border-b border-outline-variant px-5 py-5 sm:px-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-on-surface">{title}</h2>
            {description && <p className="mt-1 max-w-xl text-sm leading-6 text-on-surface-variant">{description}</p>}
          </div>
          <button type="button" onClick={onClose} className="icon-button shrink-0" aria-label="Đóng">
            <IconClose />
          </button>
        </header>
        <div className="overflow-y-auto bg-[#FDFBF8] px-5 py-5 sm:px-6">{children}</div>
      </section>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-white px-4 py-3">
      <dt className="font-display text-xs font-bold uppercase text-on-surface-variant">{label}</dt>
      <dd className="mt-1 font-medium text-on-surface">{value}</dd>
    </div>
  )
}

function ConditionLine({ status, label }: { status: ConditionStatus; label: string }) {
  const meta = {
    PASSED: { mark: '✓', label: 'Đạt', className: 'bg-secondary text-white', textClass: 'text-secondary' },
    FAILED: { mark: '•', label: 'Chưa đạt', className: 'bg-surface-container-high text-on-surface-variant', textClass: 'text-on-surface-variant' },
    CHECKING: { mark: '…', label: 'Đang kiểm tra', className: 'bg-primary-container text-on-primary-container', textClass: 'text-on-primary-container' },
  }[status]

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant bg-white px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className={['flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold', meta.className].join(' ')}>{meta.mark}</span>
        <span className="font-medium text-on-surface">{label}</span>
      </div>
      <span className={['shrink-0 text-xs font-bold', meta.textClass].join(' ')}>{meta.label}</span>
    </div>
  )
}

function TimelineStep({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div className={['rounded-xl border px-4 py-3', active ? 'border-brand-orange bg-primary-container/35' : 'border-outline-variant bg-surface-container-low'].join(' ')}>
      <p className="font-display text-xs font-bold uppercase text-on-surface-variant">{label}</p>
      <p className="mt-1 font-display text-lg font-bold text-on-surface">{value}</p>
    </div>
  )
}

function getShiftSlotGroups(): ShiftSlotGroup[] {
  return [
    { id: 'morning', name: 'Ca sáng', icon: 'sun', startTime: '08:00', endTime: '12:00' },
    { id: 'afternoon', name: 'Ca chiều', icon: 'sunset', startTime: '13:30', endTime: '17:30' },
    { id: 'evening', name: 'Ca tối', icon: 'moon', startTime: '18:00', endTime: '22:00' },
  ]
}

function generateTimeSlots(startTime: string, endTime: string, stepMinutes: number, date: string, day: DayKey): TimeSlot[] {
  const slots: TimeSlot[] = []
  const start = convertTimeToMinutes(startTime)
  const end = convertTimeToMinutes(endTime)

  for (let minutes = start; minutes < end; minutes += stepMinutes) {
    const slotStart = formatMinutesAsTime(minutes)
    const slotEnd = formatMinutesAsTime(minutes + stepMinutes)
    slots.push({
      id: `${date}-${slotStart}-${slotEnd}`,
      date,
      day,
      startTime: slotStart,
      endTime: slotEnd,
      status: 'AVAILABLE',
    })
  }

  return slots
}

function groupSelectedSlotsToShiftEvents(selectedSlots: TimeSlot[]) {
  const sortedSlots = [...selectedSlots].sort((first, second) => convertTimeToMinutes(first.startTime) - convertTimeToMinutes(second.startTime))
  const groups: Array<{ startTime: string; endTime: string }> = []

  sortedSlots.forEach((slot) => {
    const previousGroup = groups[groups.length - 1]
    if (previousGroup && previousGroup.endTime === slot.startTime) {
      previousGroup.endTime = slot.endTime
      return
    }

    groups.push({ startTime: slot.startTime, endTime: slot.endTime })
  })

  return groups
}

function calculateSelectedDuration(selectedSlots: TimeSlot[]) {
  return selectedSlots.reduce((total, slot) => total + calculateDuration(slot.startTime, slot.endTime), 0)
}

function hasSlotOverlap(slot: Pick<TimeSlot, 'date' | 'day' | 'startTime' | 'endTime'>, existingShift: StaffShiftCell) {
  const sameDate = existingShift.date ? existingShift.date === slot.date : existingShift.day === slot.day
  if (!sameDate) return false

  const newStart = convertTimeToMinutes(slot.startTime)
  const newEnd = convertTimeToMinutes(slot.endTime)
  const existingStart = convertTimeToMinutes(existingShift.startTime)
  const existingEnd = convertTimeToMinutes(existingShift.endTime)

  return newStart < existingEnd && newEnd > existingStart
}

function getNextWeek(date: Date = new Date()) {
  return addDays(startOfWeek(date), 7)
}

function isCurrentOrPastWeek(weekStart: Date) {
  return startOfWeek(weekStart).getTime() <= startOfWeek(new Date()).getTime()
}

function canRegisterInWeek(weekStart: Date) {
  return !isCurrentOrPastWeek(weekStart)
}

function getTimeSlotStatus(slot: TimeSlot, existingShifts: StaffShiftCell[], selectedWeek: Date, selectedSlots: TimeSlot[]): TimeSlotStatus {
  if (!isWithinWorkingHours(slot.startTime, slot.endTime)) return 'DISABLED'
  const overlappingShift = existingShifts.find((shift) => shift.status !== 'EMPTY' && hasSlotOverlap(slot, shift))
  if (overlappingShift?.status === 'REGISTERED') return 'REGISTERED'
  if (overlappingShift?.status === 'ASSIGNED' || overlappingShift?.status === 'IN_PROGRESS' || overlappingShift?.status === 'COMPLETED') return 'ASSIGNED'
  if (!canRegisterInWeek(selectedWeek)) return 'DISABLED'
  if (selectedSlots.some((selectedSlot) => selectedSlot.id === slot.id)) return 'SELECTED'
  if (!overlappingShift) return 'AVAILABLE'
  return 'DISABLED'
}

function getSlotStatusMeta(status: TimeSlotStatus) {
  const meta: Record<TimeSlotStatus, { className: string; icon: string }> = {
    AVAILABLE: { className: 'border-outline-variant bg-white text-on-surface hover:border-brand-orange hover:bg-primary-container/20', icon: '+' },
    SELECTED: { className: 'border-brand-orange bg-primary-container/70 text-on-primary-container shadow-[0_10px_22px_rgba(255,117,24,0.14)]', icon: 'Đã chọn' },
    REGISTERED: { className: 'border-brand-orange/25 bg-primary-container/35 text-on-primary-container opacity-80', icon: 'Đã đăng ký' },
    ASSIGNED: { className: 'border-[#CDE9D6] bg-[#E8F5EC] text-secondary opacity-85', icon: 'Đã phân công' },
    DISABLED: { className: 'border-outline-variant bg-surface-container-high text-on-surface-variant opacity-55', icon: 'Không thể đăng ký' },
  }

  return meta[status]
}

function validateSlotRegistration(form: RegisterForm, shifts: StaffShiftCell[], weekDays?: WeekDayItem[], selectedWeek?: Date) {
  const firstSelectedSlot = form.selectedSlots[0]
  const selectedDay = weekDays?.find((day) => day.key === form.day) ?? (firstSelectedSlot ? { date: createDateFromDateKey(firstSelectedSlot.date), dateKey: firstSelectedSlot.date } : null)
  if (!selectedDay) return 'Vui lòng chọn ngày làm việc.'

  const registrationWeekStart = selectedWeek ?? startOfWeek(selectedDay.date)
  if (!canRegisterInWeek(registrationWeekStart)) return 'Tuần này đã bắt đầu, bạn không thể đăng ký ca mới. Vui lòng đăng ký cho tuần sau.'

  const selectedMinutes = calculateSelectedDuration(form.selectedSlots)
  if (selectedMinutes < 60) return 'Vui lòng chọn ít nhất 1 giờ làm việc.'
  if (selectedMinutes > 480) return 'Tổng thời lượng trong ngày không được vượt quá 8 giờ.'

  const invalidSlot = form.selectedSlots.find((slot) => !isWithinWorkingHours(slot.startTime, slot.endTime))
  if (invalidSlot) return 'Không thể đăng ký ngoài giờ làm việc 08:00 - 22:00.'

  const assignedOverlap = form.selectedSlots.some((slot) =>
    shifts.some((shift) => (shift.status === 'ASSIGNED' || shift.status === 'IN_PROGRESS' || shift.status === 'COMPLETED') && hasSlotOverlap(slot, shift)),
  )
  if (assignedOverlap) return 'Khung giờ này đã được phân công, không thể đăng ký.'

  const registeredOverlap = form.selectedSlots.some((slot) =>
    shifts.some((shift) => shift.status === 'REGISTERED' && hasSlotOverlap(slot, shift)),
  )
  if (registeredOverlap) return 'Khung giờ bị trùng với lịch đã đăng ký.'

  return ''
}

function getRegisteredWeekEvents(shifts: StaffShiftCell[], weekDays: WeekDayItem[]) {
  return weekDays.flatMap((day) =>
    shifts
      .filter((shift) => (shift.date ? shift.date === day.dateKey : shift.day === day.key) && (shift.status === 'REGISTERED' || shift.status === 'ASSIGNED' || shift.status === 'IN_PROGRESS' || shift.status === 'COMPLETED'))
      .map((shift) => ({
        ...shift,
        date: shift.date ?? day.dateKey,
        dateLabel: `${day.longLabel}, ${formatShortDate(day.date)}`,
      })),
  )
}

function getRegisterSummaryItems(existingWeekEvents: Array<StaffShiftCell & { date: string; dateLabel: string }>, selectedSlots: TimeSlot[], selectedDay?: WeekDayItem) {
  const selectedGroups = groupSelectedSlotsToShiftEvents(selectedSlots).map((group) => ({
    id: `selected-${group.startTime}-${group.endTime}`,
    dateLabel: selectedDay ? `${selectedDay.longLabel}, ${formatShortDate(selectedDay.date)}` : '',
    startTime: group.startTime,
    endTime: group.endTime,
    status: 'SELECTED' as TimeSlotStatus,
    removable: true,
    source: 'selected' as const,
  }))

  const existingItems = existingWeekEvents.map((event) => ({
    id: event.id,
    dateLabel: event.dateLabel,
    startTime: event.startTime,
    endTime: event.endTime,
    status: event.status === 'REGISTERED' ? 'REGISTERED' as ShiftStatus : 'ASSIGNED' as ShiftStatus,
    removable: event.status === 'REGISTERED',
    source: 'existing' as const,
  }))

  return [...existingItems, ...selectedGroups].sort((first, second) => convertTimeToMinutes(first.startTime) - convertTimeToMinutes(second.startTime))
}

function generateCalendarDays(monthDate: Date) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const calendarStart = startOfWeek(firstDay)
  const todayKey = formatDateKey(new Date())

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(calendarStart, index)
    return {
      id: formatDateKey(date),
      date,
      inMonth: date.getMonth() === monthDate.getMonth(),
      isToday: formatDateKey(date) === todayKey,
    }
  })
}

function addMonths(date: Date, monthsToAdd: number) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + monthsToAdd)
  return next
}

function formatMonthTitle(date: Date) {
  return `Tháng ${date.getMonth() + 1} - ${date.getFullYear()}`
}

function formatMinutesAsTime(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

function getShiftAvailabilityMeta(status: ShiftAvailabilityStatus): StatusMeta {
  const meta: Record<ShiftAvailabilityStatus, StatusMeta> = {
    AVAILABLE: { label: 'Còn chỗ', className: 'bg-[#E8F5EC] text-secondary' },
    ALMOST_FULL: { label: 'Sắp đủ', className: 'bg-[#FEF3C7] text-[#92400E]' },
    FULL: { label: 'Đã đủ', className: 'bg-error-container text-on-error-container' },
  }

  return meta[status]
}

function getShiftStatusMeta(status: ShiftStatus): StatusMeta {
  const meta: Record<ShiftStatus, StatusMeta> = {
    EMPTY: { label: 'Trống', className: 'bg-surface-container text-on-surface-variant' },
    OFFLINE: { label: 'Offline', className: 'bg-[#FFF3F3] text-[#B91C1C]' },
    REGISTERED: { label: 'Đã đăng ký', className: 'bg-primary-container text-on-primary-container' },
    ASSIGNED: { label: 'Đã phân công', className: 'bg-[#E8F5EC] text-secondary' },
    IN_PROGRESS: { label: 'Đang làm', className: 'bg-[#FEF3C7] text-[#92400E]' },
    COMPLETED: { label: 'Hoàn tất', className: 'bg-[#E8E4DC] text-on-surface-variant' },
  }

  return meta[status]
}

function getAttendanceStatusMeta(status: AttendanceStatus): StatusMeta {
  const meta: Record<AttendanceStatus, StatusMeta> = {
    NOT_STARTED: { label: 'Chưa check-in', className: 'bg-primary-container text-on-primary-container' },
    CHECKED_IN: { label: 'Đã check-in', className: 'bg-[#FEF3C7] text-[#92400E]' },
    CHECKED_OUT: { label: 'Đã check-out', className: 'bg-[#E8E4DC] text-on-surface-variant' },
    NO_SHIFT: { label: 'Không có ca', className: 'bg-error-container text-on-error-container' },
  }

  return meta[status]
}

function validateShiftRegistration(form: RegisterForm, selectedShift: ShiftOption | null, shiftMap: Record<string, StaffShiftCell>) {
  if (!form.day) return 'Vui lòng chọn ngày làm việc.'
  if (!form.startTime || !form.endTime) return 'Vui lòng chọn khung giờ làm việc.'
  if (!selectedShift) return 'Vui lòng chọn ca làm việc.'
  if (isShiftFull(selectedShift)) return 'Ca này đã đủ nhân viên, vui lòng chọn ca khác.'

  const existing = shiftMap[getCellKey(form.day, selectedShift.shiftName)]
  if (existing && isRegisteredShiftStatus(existing.status)) return 'Bạn đã đăng ký ca này.'

  return ''
}

function isShiftFull(shift: ShiftOption) {
  return shift.status === 'FULL' || shift.registeredCount >= shift.requiredCount
}

function isRegisteredShiftStatus(status: ShiftStatus) {
  return status === 'REGISTERED' || status === 'ASSIGNED' || status === 'IN_PROGRESS' || status === 'COMPLETED'
}

function validateFlexibleShiftRegistration(form: RegisterForm, shifts: StaffShiftCell[], weekDays: WeekDayItem[]) {
  if (!form.day) return 'Vui lòng chọn ngày làm việc.'
  if (!form.startTime) return 'Vui lòng chọn giờ bắt đầu.'
  if (!form.endTime) return 'Vui lòng chọn giờ kết thúc.'
  if (!isWithinWorkingHours(form.startTime, form.endTime)) return 'Chỉ có thể đăng ký trong khung 08:00 - 22:00.'

  const durationMinutes = calculateDuration(form.startTime, form.endTime)
  if (durationMinutes <= 0) return 'Giờ kết thúc phải sau giờ bắt đầu.'
  if (durationMinutes < 60) return 'Ca làm tối thiểu 1 giờ.'
  if (durationMinutes > 480) return 'Ca làm tối đa 8 giờ.'

  const selectedDay = weekDays.find((day) => day.key === form.day)
  if (!selectedDay) return 'Vui lòng chọn ngày làm việc.'

  if (hasTimeOverlap({ day: form.day, date: selectedDay.dateKey, startTime: form.startTime, endTime: form.endTime }, shifts)) {
    return 'Khung giờ này bị trùng với lịch đã đăng ký.'
  }

  return ''
}

function calculateDuration(startTime: string, endTime: string) {
  return convertTimeToMinutes(endTime) - convertTimeToMinutes(startTime)
}

function formatDuration(minutes: number) {
  const safeMinutes = Math.max(0, minutes)
  const hours = Math.floor(safeMinutes / 60)
  const remainingMinutes = safeMinutes % 60

  if (hours === 0) return `${remainingMinutes} phút`
  if (remainingMinutes === 0) return `${hours} giờ`
  return `${hours} giờ ${remainingMinutes} phút`
}

function detectShiftTitle(startTime: string, endTime: string): ShiftName {
  if (startTime === '08:00' && endTime === '12:00') return 'Ca sáng'
  if (startTime === '13:30' && endTime === '17:30') return 'Ca chiều'
  if (startTime === '18:00' && endTime === '22:00') return 'Ca tối'
  return 'Ca linh hoạt'
}

function isWithinWorkingHours(startTime: string, endTime: string) {
  const start = convertTimeToMinutes(startTime)
  const end = convertTimeToMinutes(endTime)
  return start >= CALENDAR_START_HOUR * 60 && end <= CALENDAR_END_HOUR * 60
}

function hasTimeOverlap(newShift: { day: DayKey; date: string; startTime: string; endTime: string }, existingShifts: StaffShiftCell[]) {
  const newStart = convertTimeToMinutes(newShift.startTime)
  const newEnd = convertTimeToMinutes(newShift.endTime)

  return existingShifts.some((shift) => {
    if (shift.status === 'EMPTY' || shift.status === 'OFFLINE') return false
    const sameDate = shift.date ? shift.date === newShift.date : shift.day === newShift.day
    if (!sameDate) return false

    const existingStart = convertTimeToMinutes(shift.startTime)
    const existingEnd = convertTimeToMinutes(shift.endTime)
    return newStart < existingEnd && newEnd > existingStart
  })
}

function getFlexibleTimeOptions() {
  const start = CALENDAR_START_HOUR * 60
  const end = CALENDAR_END_HOUR * 60
  const options: string[] = []

  for (let minutes = start; minutes <= end; minutes += 30) {
    const hour = Math.floor(minutes / 60)
    const minute = minutes % 60
    options.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
  }

  return options
}

function calculateDistanceMeters(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const earthRadiusMeters = 6371000
  const fromPhi = toRadians(fromLat)
  const toPhi = toRadians(toLat)
  const deltaPhi = toRadians(toLat - fromLat)
  const deltaLambda = toRadians(toLng - fromLng)
  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) + Math.cos(fromPhi) * Math.cos(toPhi) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return earthRadiusMeters * c
}

function isWithinStudioRadius(distanceMeters: number) {
  return distanceMeters <= STUDIO_LOCATION.radiusMeters
}

function isWithinCheckInWindow(shift: StaffShiftCell, now = new Date()) {
  const start = createDateFromTime(shift.startTime, now)
  const end = createDateFromTime(shift.endTime, now)
  const earliestCheckIn = new Date(start.getTime() - CHECK_IN_EARLY_MINUTES * 60 * 1000)

  return now >= earliestCheckIn && now <= end
}

function isAfterShiftEnd(shift: StaffShiftCell, now = new Date()) {
  return now >= createDateFromTime(shift.endTime, now)
}

function calculateWorkingDuration(checkInTime?: string, checkOutTime?: string) {
  if (!checkInTime) return 'Chưa bắt đầu'
  if (!checkOutTime) return 'Đang tính'

  const checkIn = parseTimeToMinutes(checkInTime)
  const checkOut = parseTimeToMinutes(checkOutTime)
  const minutes = Math.max(0, checkOut - checkIn)
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours === 0) return `${remainingMinutes} phút`
  return `${hours} giờ ${remainingMinutes} phút`
}

function calculateLateMinutes(startTime: string, checkInTime: string) {
  const lateMinutes = parseTimeToMinutes(checkInTime) - parseTimeToMinutes(startTime)
  return Math.max(0, lateMinutes)
}

function getAttendanceResult(shift: StaffShiftCell | null): AttendanceResult {
  if (!shift?.checkInTime) return 'NOT_CHECKED_IN'
  if (shift.attendanceResult) return shift.attendanceResult
  return calculateLateMinutes(shift.startTime, shift.checkInTime) > 0 ? 'LATE' : 'ON_TIME'
}

function getAttendanceResultMeta(result: AttendanceResult): StatusMeta {
  const meta: Record<AttendanceResult, StatusMeta> = {
    NOT_CHECKED_IN: { label: 'Chưa check-in', className: 'bg-surface-container-high text-on-surface-variant' },
    ON_TIME: { label: 'Đúng giờ', className: 'bg-[#E8F5EC] text-secondary' },
    LATE: { label: 'Đi muộn', className: 'bg-[#FEF3C7] text-[#92400E]' },
  }

  return meta[result]
}

function formatCheckInTimelineValue(shift: StaffShiftCell) {
  if (!shift.checkInTime) return 'Chưa có'
  const result = getAttendanceResult(shift)
  if (result !== 'LATE') return shift.checkInTime
  return `${shift.checkInTime} · Muộn ${shift.lateMinutes ?? calculateLateMinutes(shift.startTime, shift.checkInTime)} phút`
}

function getAttendanceStatus(shift: StaffShiftCell | null): AttendanceStatus {
  if (!shift) return 'NO_SHIFT'
  if (shift.checkOutTime || shift.status === 'COMPLETED') return 'CHECKED_OUT'
  if (shift.checkInTime || shift.status === 'IN_PROGRESS') return 'CHECKED_IN'
  return 'NOT_STARTED'
}

function getWeekDays(currentWeekDate: Date): WeekDayItem[] {
  const start = startOfWeek(currentWeekDate)
  const dayKeys: DayKey[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  const todayKey = formatDateKey(new Date())

  return dayKeys.map((key, index) => {
    const date = addDays(start, index)
    const staticDay = days.find((item) => item.key === key)
    const dateKey = formatDateKey(date)

    return {
      key,
      label: staticDay?.label ?? key,
      longLabel: staticDay?.longLabel ?? key,
      date,
      dateKey,
      isToday: dateKey === todayKey,
    }
  })
}

function getTimeSlots(startHour: number, endHour: number) {
  return Array.from({ length: endHour - startHour + 1 }, (_, index) => `${String(startHour + index).padStart(2, '0')}:00`)
}

function convertTimeToMinutes(time: string) {
  return parseTimeToMinutes(time)
}

function calculateEventTop(startTime: string) {
  const minutesFromStart = convertTimeToMinutes(startTime) - CALENDAR_START_HOUR * 60
  return Math.max(0, (minutesFromStart / 60) * CALENDAR_HOUR_HEIGHT)
}

function calculateEventHeight(startTime: string, endTime: string) {
  const durationMinutes = Math.max(30, convertTimeToMinutes(endTime) - convertTimeToMinutes(startTime))
  return (durationMinutes / 60) * CALENDAR_HOUR_HEIGHT
}

function groupShiftEventsByDate(shifts: StaffShiftCell[], weekDays: WeekDayItem[]) {
  return weekDays.reduce<Record<string, StaffShiftEvent[]>>((acc, day) => {
    acc[day.dateKey] = shifts
      .filter((shift) => (shift.date ? shift.date === day.dateKey : shift.day === day.key) && isRenderableWorkShiftStatus(shift.status))
      .map((shift) => ({
        ...shift,
        title: shift.shiftName,
        date: day.dateKey,
      }))
      .sort((first, second) => convertTimeToMinutes(first.startTime) - convertTimeToMinutes(second.startTime))

    return acc
  }, {})
}

function isRenderableWorkShiftStatus(status: ShiftStatus) {
  return status === 'REGISTERED' || status === 'ASSIGNED' || status === 'IN_PROGRESS' || status === 'COMPLETED'
}

function getShiftEventStyle(status: ShiftStatus) {
  const styles: Record<ShiftStatus, string> = {
    EMPTY: 'border-outline-variant bg-surface-container text-on-surface-variant',
    OFFLINE: 'border-[#F4C7C7] bg-[#FFF3F3] text-[#B91C1C] opacity-70',
    REGISTERED: 'border-brand-orange/40 bg-primary-container text-on-primary-container',
    ASSIGNED: 'border-[#CDE9D6] bg-[#E8F5EC] text-secondary',
    IN_PROGRESS: 'border-[#FACC15]/50 bg-[#FEF3C7] text-[#92400E]',
    COMPLETED: 'border-outline-variant bg-[#E8E4DC] text-on-surface-variant',
  }

  return styles[status]
}

function findCurrentShift(shifts: StaffShiftCell[]) {
  return shifts.find((shift) => shift.status === 'ASSIGNED' || shift.status === 'IN_PROGRESS') ?? null
}

function option(day: DayKey, shiftName: ShiftName, registeredCount: number, requiredCount: number): ShiftOption {
  const template = shiftTemplates[shiftName]
  return {
    id: `${day}-${shiftName}`,
    day,
    date: days.find((item) => item.key === day)?.date ?? '',
    shiftName,
    startTime: template.startTime,
    endTime: template.endTime,
    registeredCount,
    requiredCount,
    status: getAvailabilityStatus(registeredCount, requiredCount),
    description: template.description,
  }
}

function getAvailabilityStatus(registeredCount: number, requiredCount: number): ShiftAvailabilityStatus {
  if (registeredCount >= requiredCount) return 'FULL'
  if (registeredCount >= Math.max(1, requiredCount - 1)) return 'ALMOST_FULL'
  return 'AVAILABLE'
}

function findShiftOption(shiftOptions: ShiftOption[], day: DayKey, shiftName: ShiftName) {
  return shiftOptions.find((shift) => shift.day === day && shift.shiftName === shiftName) ?? null
}

function createCell(day: DayKey, shiftName: ShiftName, status: ShiftStatus, note?: string): StaffShiftCell {
  const row = shiftRows.find((shift) => shift.name === shiftName) ?? shiftRows[0]
  return {
    id: `${day}-${shiftName}`,
    day,
    shiftName,
    startTime: row.startTime,
    endTime: row.endTime,
    status,
    note,
  }
}

function createEmptyCell(day: DayKey, row: { name: ShiftName; startTime: string; endTime: string }): StaffShiftCell {
  return {
    id: `${day}-${row.name}-empty`,
    day,
    shiftName: row.name,
    startTime: row.startTime,
    endTime: row.endTime,
    status: 'EMPTY',
  }
}

function getCellKey(day: DayKey, shiftName: ShiftName) {
  return `${day}-${shiftName}`
}

function getDayLabel(day: DayKey) {
  return days.find((item) => item.key === day)?.longLabel ?? day
}

function addDays(date: Date, daysToAdd: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + daysToAdd)
  return next
}

function startOfWeek(date: Date) {
  const start = new Date(date)
  const day = start.getDay()
  start.setDate(start.getDate() + (day === 0 ? -6 : 1 - day))
  start.setHours(0, 0, 0, 0)
  return start
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function createDateFromDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date)
}

function formatFullDateLabel(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(year, month - 1, day))
}

function formatWeekRange(weekDays: WeekDayItem[]) {
  const firstDay = weekDays[0]?.date
  const lastDay = weekDays[weekDays.length - 1]?.date
  if (!firstDay || !lastDay) return ''

  return `${formatShortDate(firstDay)}/${firstDay.getFullYear()} - ${formatShortDate(lastDay)}/${lastDay.getFullYear()}`
}

function getCurrentTime() {
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date())
}

function getCurrentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    })
  })
}

function getCheckInStartTime(shift: StaffShiftCell) {
  const startMinutes = parseTimeToMinutes(shift.startTime) - CHECK_IN_EARLY_MINUTES
  const normalizedMinutes = Math.max(0, startMinutes)
  const hours = Math.floor(normalizedMinutes / 60)
  const minutes = normalizedMinutes % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function createDateFromTime(time: string, baseDate: Date) {
  const [hours, minutes] = time.split(':').map(Number)
  const date = new Date(baseDate)
  date.setHours(hours, minutes, 0, 0)
  return date
}

function parseTimeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function formatDistance(distanceMeters: number) {
  if (distanceMeters < 1000) return `${Math.round(distanceMeters)}m`
  return `${(distanceMeters / 1000).toFixed(1)}km`
}

function wait() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, 450)
  })
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={['h-3 w-3 rounded-full', color].join(' ')} />
      <span>{label}</span>
    </div>
  )
}

function InfoMini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-xs font-bold text-on-surface-variant">{label}</p>
      <p className="mt-1 font-display text-sm font-bold text-on-surface">{value}</p>
    </div>
  )
}

function ShiftGroupIcon({ icon }: { icon: ShiftSlotGroup['icon'] }) {
  if (icon === 'moon') {
    return <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true"><path d="M20 15.3A8 8 0 0 1 8.7 4 7 7 0 1 0 20 15.3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
  }

  if (icon === 'sunset') {
    return <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true"><path d="M4 18h16M6 14a6 6 0 0 1 12 0M12 3v4M5 7l2.5 2.5M19 7l-2.5 2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
  }

  return <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true"><path d="M12 4V2M12 22v-2M4.93 4.93 3.52 3.52M20.48 20.48l-1.41-1.41M4 12H2M22 12h-2M4.93 19.07l-1.41 1.41M20.48 3.52l-1.41 1.41M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function IconChevronLeft() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true"><path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function IconChevronRight() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true"><path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function IconCalendarCheck() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M7 3v3M17 3v3M4.5 9h15M6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10A2.5 2.5 0 0 1 6.5 5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="m8.5 14 2 2 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function IconCalendarPlus() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M7 3v3M17 3v3M4.5 9h15M6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10A2.5 2.5 0 0 1 6.5 5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M12 12v5M9.5 14.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
}

function IconClockSmall() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand-orange" fill="none" aria-hidden="true"><path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function IconClose() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}
