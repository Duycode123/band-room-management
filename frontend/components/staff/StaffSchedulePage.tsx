'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { EmptyState, StaffPageShell, Toast } from '@/components/staff/StaffShared'
import {
  checkInCurrentShift,
  checkOutCurrentShift,
  fetchCurrentAttendance,
  fetchShiftBookings,
  fetchStaffSchedule,
  type StaffAttendanceRecord,
  type StaffScheduleShift,
  type StaffShiftBooking,
} from '@/lib/staff-schedule-service'

type ShiftStatus = 'EMPTY' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED'
type AttendanceStatus = 'NOT_STARTED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'NO_SHIFT'
type DayKey = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'
type ShiftName = 'Ca sang' | 'Ca chieu' | 'Ca toi'
type VerificationStatus = 'IDLE' | 'CHECKING' | 'VALID' | 'INVALID' | 'BLOCKED'
type ConditionStatus = 'PASSED' | 'FAILED' | 'CHECKING'

type WeekDay = {
  key: DayKey
  label: string
  longLabel: string
  isoDate: string
  shortDate: string
}

type ShiftRow = {
  name: ShiftName
  startTime: string
  endTime: string
}

type StaffShiftCell = {
  cellId: string
  shiftId: number | null
  dayKey: DayKey
  date: string
  shiftName: ShiftName
  startTime: string
  endTime: string
  status: ShiftStatus
  note: string
  checkInTime?: string
  checkOutTime?: string
}

type ShiftBookingView = {
  bookingId: number
  roomName: string
  customerName: string
  startTime: string
  endTime: string
  status: string
  equipment: string[]
}

type ShiftDetailState = {
  cell: StaffShiftCell
  bookings: ShiftBookingView[]
  isLoading: boolean
  error: string
}

type StatusMeta = {
  label: string
  className: string
}

const STUDIO_LOCATION = {
  name: 'BandHub Studio',
  address: '123 Au Co, Tan Binh',
  lat: 21.0285,
  lng: 105.8542,
  radiusMeters: 100,
}

const CHECK_IN_EARLY_MINUTES = 30

const SHIFT_ROWS: ShiftRow[] = [
  { name: 'Ca sang', startTime: '08:00', endTime: '12:00' },
  { name: 'Ca chieu', startTime: '13:30', endTime: '17:30' },
  { name: 'Ca toi', startTime: '18:00', endTime: '22:00' },
]

const DAY_META: Record<DayKey, { label: string; longLabel: string }> = {
  MON: { label: 'Th 2', longLabel: 'Thu 2' },
  TUE: { label: 'Th 3', longLabel: 'Thu 3' },
  WED: { label: 'Th 4', longLabel: 'Thu 4' },
  THU: { label: 'Th 5', longLabel: 'Thu 5' },
  FRI: { label: 'Th 6', longLabel: 'Thu 6' },
  SAT: { label: 'Th 7', longLabel: 'Thu 7' },
  SUN: { label: 'CN', longLabel: 'Chu nhat' },
}

export default function StaffSchedulePage() {
  const [now, setNow] = useState(() => new Date())
  const [schedule, setSchedule] = useState<StaffScheduleShift[]>([])
  const [currentAttendance, setCurrentAttendance] = useState<StaffAttendanceRecord | null>(null)
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true)
  const [pageError, setPageError] = useState('')
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false)
  const [locationStatus, setLocationStatus] = useState<VerificationStatus>('IDLE')
  const [locationDistance, setLocationDistance] = useState<number | null>(null)
  const [attendanceError, setAttendanceError] = useState('')
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false)
  const [shiftDetail, setShiftDetail] = useState<ShiftDetailState | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  const weekDays = useMemo(() => getWeekDays(now), [now.getFullYear(), now.getMonth(), now.getDate()])
  const weekRange = useMemo(
    () => ({
      fromDate: weekDays[0]?.isoDate ?? '',
      toDate: weekDays[weekDays.length - 1]?.isoDate ?? '',
    }),
    [weekDays],
  )

  const loadSchedule = useCallback(async () => {
    if (!weekRange.fromDate || !weekRange.toDate) return

    setIsLoadingSchedule(true)
    try {
      const [nextSchedule, nextAttendance] = await Promise.all([
        fetchStaffSchedule(weekRange.fromDate, weekRange.toDate),
        fetchCurrentAttendance(),
      ])

      setSchedule(nextSchedule)
      setCurrentAttendance(nextAttendance)
      setPageError('')
    } catch (error) {
      setSchedule([])
      setCurrentAttendance(null)
      setPageError(error instanceof Error ? error.message : 'Khong the tai lich lam viec.')
    } finally {
      setIsLoadingSchedule(false)
    }
  }, [weekRange.fromDate, weekRange.toDate])

  useEffect(() => {
    void loadSchedule()
  }, [loadSchedule])

  const shiftCells = useMemo(
    () => schedule.map((shift) => mapShiftToCell(shift, currentAttendance)).sort(compareShiftCells),
    [currentAttendance, schedule],
  )

  const shiftMap = useMemo(() => {
    return shiftCells.reduce<Record<string, StaffShiftCell>>((acc, cell) => {
      acc[getCellKey(cell.dayKey, cell.shiftName)] = cell
      return acc
    }, {})
  }, [shiftCells])

  useEffect(() => {
    if (!shiftDetail) return

    const nextCell = shiftCells.find((cell) => cell.cellId === shiftDetail.cell.cellId)
    if (!nextCell) return

    setShiftDetail((current) => {
      if (!current || current.cell.cellId !== nextCell.cellId) return current
      if (
        current.cell.status === nextCell.status &&
        current.cell.checkInTime === nextCell.checkInTime &&
        current.cell.checkOutTime === nextCell.checkOutTime &&
        current.cell.note === nextCell.note
      ) {
        return current
      }
      return { ...current, cell: nextCell }
    })
  }, [shiftCells, shiftDetail])

  const currentShift = useMemo(() => findCurrentShiftCell(shiftCells, currentAttendance, now), [currentAttendance, now, shiftCells])
  const attendanceStatus = useMemo(
    () => getAttendanceStatus(currentShift, currentAttendance),
    [currentAttendance, currentShift],
  )

  const handleRefresh = async () => {
    await loadSchedule()
    setToast('Da dong bo lai lich lam viec tu backend.')
  }

  const handleRegisterShift = () => {
    setToast('Backend chua co API dang ky ca lam viec. Tam thoi chi dong bo lich da phan cong.')
  }

  const handleVerifyLocation = async () => {
    setAttendanceError('')
    setLocationStatus('CHECKING')
    setLocationDistance(null)

    if (!navigator.geolocation) {
      setLocationStatus('BLOCKED')
      setAttendanceError('Khong the truy cap vi tri tren trinh duyet nay.')
      return
    }

    try {
      const position = await getCurrentPosition()
      const distance = calculateDistanceMeters(
        position.coords.latitude,
        position.coords.longitude,
        STUDIO_LOCATION.lat,
        STUDIO_LOCATION.lng,
      )

      setLocationDistance(distance)
      if (isWithinStudioRadius(distance)) {
        setLocationStatus('VALID')
        return
      }

      setLocationStatus('INVALID')
      setAttendanceError('Ban chua o gan studio de diem danh.')
    } catch {
      setLocationStatus('BLOCKED')
      setAttendanceError('Khong the truy cap vi tri. Vui long bat quyen vi tri va thu lai.')
    }
  }

  const handleCheckIn = async () => {
    setAttendanceError('')

    if (!currentShift) {
      setAttendanceError('Khong co ca hien tai de check-in.')
      return
    }

    if (!isWithinCheckInWindow(currentShift, now)) {
      setAttendanceError(`Chi duoc check-in tu ${getCheckInStartTime(currentShift)} den ${currentShift.endTime}.`)
      return
    }

    if (locationStatus !== 'VALID') {
      setAttendanceError('Vui long xac minh vi tri gan studio truoc khi check-in.')
      return
    }

    setIsAttendanceLoading(true)
    try {
      const attendance = await checkInCurrentShift()
      setCurrentAttendance(attendance)
      setToast('Check-in thanh cong.')
      setAttendanceError('')
    } catch (error) {
      setAttendanceError(error instanceof Error ? error.message : 'Khong the check-in ca lam.')
    } finally {
      setIsAttendanceLoading(false)
    }
  }

  const handleCheckOut = async () => {
    setAttendanceError('')

    if (!currentShift) {
      setAttendanceError('Khong co ca hien tai de check-out.')
      return
    }

    if (locationStatus !== 'VALID') {
      setAttendanceError('Vui long xac minh vi tri gan studio truoc khi check-out.')
      return
    }

    if (!isAfterShiftEnd(currentShift, now)) {
      setAttendanceError(`Chua den gio ket thuc ca. Ban co the check-out sau ${currentShift.endTime}.`)
      return
    }

    setIsAttendanceLoading(true)
    try {
      const attendance = await checkOutCurrentShift()
      setCurrentAttendance(attendance)
      setToast('Check-out thanh cong.')
      setAttendanceError('')
    } catch (error) {
      setAttendanceError(error instanceof Error ? error.message : 'Khong the check-out ca lam.')
    } finally {
      setIsAttendanceLoading(false)
    }
  }

  const openShiftDetails = useCallback(async (cell: StaffShiftCell) => {
    const nextState: ShiftDetailState = {
      cell,
      bookings: [],
      isLoading: Boolean(cell.shiftId),
      error: '',
    }
    setShiftDetail(nextState)

    if (!cell.shiftId) {
      return
    }

    try {
      const bookings = await fetchShiftBookings(cell.shiftId)
      setShiftDetail((current) => {
        if (!current || current.cell.cellId !== cell.cellId) return current
        return {
          ...current,
          bookings: bookings.map(mapShiftBookingToView),
          isLoading: false,
        }
      })
    } catch (error) {
      setShiftDetail((current) => {
        if (!current || current.cell.cellId !== cell.cellId) return current
        return {
          ...current,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Khong the tai booking trong ca lam.',
        }
      })
    }
  }, [])

  return (
    <AuthGuard allowedRoles={['STAFF']}>
      <StaffPageShell>
        <section className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-sm font-bold uppercase tracking-wide text-brand-orange">
                Staff workspace
              </p>
              <h1 className="font-display text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
                Lich lam viec
              </h1>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setAttendanceError('')
                  setLocationStatus('IDLE')
                  setLocationDistance(null)
                  setIsAttendanceOpen(true)
                }}
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#FFF5F5] px-6 font-display text-sm font-bold text-[#B91C1C] transition hover:bg-[#FFE8E8]"
              >
                Diem danh
                <IconCalendarCheck />
              </button>
              <button
                type="button"
                onClick={() => void handleRefresh()}
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-outline-variant bg-white px-6 font-display text-sm font-bold text-on-surface shadow-[var(--band-shadow-card)] transition hover:border-brand-orange/40 hover:text-brand-orange"
              >
                Lam moi
                <IconRefresh />
              </button>
              <button
                type="button"
                onClick={handleRegisterShift}
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#C91F2E] px-6 font-display text-sm font-bold text-white shadow-[0_12px_26px_rgba(201,31,46,0.22)] transition hover:bg-[#A91724]"
              >
                Dang ky ca lam viec
                <IconCalendarPlus />
              </button>
            </div>
          </div>

          {pageError && (
            <div className="rounded-xl border border-error-container bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container">
              {pageError}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <SummaryCard
              label="Ca trong tuan"
              value={shiftCells.length}
              helper="Lay tu /api/staff/schedule/shifts"
            />
            <SummaryCard
              label="Ca hien tai"
              value={currentShift ? currentShift.shiftName : 'Khong co'}
              helper={
                currentShift
                  ? `${formatDateForHeader(currentShift.date)} · ${currentShift.startTime} - ${currentShift.endTime}`
                  : 'Khong co ca dang dien ra'
              }
            />
            <SummaryCard
              label="Cham cong"
              value={getAttendanceStatusMeta(attendanceStatus).label}
              helper="Dong bo tu attendance API hien tai"
            />
          </div>

          <div className="border border-outline-variant bg-white p-4 shadow-[var(--band-shadow-card)] sm:p-7">
            {isLoadingSchedule ? (
              <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-10 text-center text-sm text-on-surface-variant">
                Dang tai lich lam viec...
              </div>
            ) : shiftCells.length === 0 ? (
              <EmptyState
                title="Chua co ca lam viec trong tuan nay"
                description="Backend chua tra ve ca nao cho tai khoan staff hien tai."
                actionLabel="Dong bo lai"
                onAction={() => void handleRefresh()}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1120px] border-collapse text-left">
                  <thead>
                    <tr>
                      <th className="h-14 w-[170px] border border-[#C9D3E1] bg-white" />
                      {weekDays.map((day) => (
                        <th
                          key={day.key}
                          className="h-14 border border-[#C9D3E1] bg-white text-center font-display text-lg font-medium text-[#1F2937]"
                        >
                          <div>{day.label}</div>
                          <div className="mt-1 text-xs font-semibold text-on-surface-variant">{day.shortDate}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SHIFT_ROWS.map((row) => (
                      <tr key={row.name}>
                        <th className="h-[220px] w-[170px] border border-[#C9D3E1] bg-white px-3 align-middle sm:px-4">
                          <div>
                            <p className="font-display text-xl font-medium text-on-surface">{row.name}</p>
                            <span className="mt-2 inline-flex rounded-full bg-[#E3E9F1] px-3 py-1 font-display text-sm font-bold text-[#253044]">
                              {row.startTime} - {row.endTime}
                            </span>
                          </div>
                        </th>
                        {weekDays.map((day) => {
                          const cell = shiftMap[getCellKey(day.key, row.name)] ?? createEmptyCell(day, row)
                          const meta = getShiftStatusMeta(cell.status)

                          return (
                            <td
                              key={`${day.key}-${row.name}`}
                              className={[
                                'h-[220px] border border-[#C9D3E1] align-middle',
                                cell.status === 'EMPTY' ? 'bg-[#F7F8FA]' : 'bg-white',
                              ].join(' ')}
                            >
                              <button
                                type="button"
                                onClick={() => void openShiftDetails(cell)}
                                className="flex h-full w-full items-center justify-center p-4 text-center transition hover:bg-primary-container/30 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-orange"
                              >
                                <span
                                  className={[
                                    'inline-flex rounded-full px-4 py-2 font-display text-sm font-bold',
                                    meta.className,
                                  ].join(' ')}
                                >
                                  {meta.label}
                                </span>
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {isAttendanceOpen && (
          <AttendanceModal
            shift={currentShift}
            status={attendanceStatus}
            attendance={currentAttendance}
            locationStatus={locationStatus}
            locationDistance={locationDistance}
            isLoading={isAttendanceLoading}
            error={attendanceError}
            now={now}
            onVerify={handleVerifyLocation}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            onClose={() => {
              setIsAttendanceOpen(false)
              setAttendanceError('')
            }}
          />
        )}

        {shiftDetail && (
          <ShiftDetailModal
            detail={shiftDetail}
            now={now}
            onClose={() => setShiftDetail(null)}
          />
        )}

        {toast && <Toast message={toast} />}
      </StaffPageShell>
    </AuthGuard>
  )
}

function AttendanceModal({
  shift,
  status,
  attendance,
  locationStatus,
  locationDistance,
  isLoading,
  error,
  now,
  onVerify,
  onCheckIn,
  onCheckOut,
  onClose,
}: {
  shift: StaffShiftCell | null
  status: AttendanceStatus
  attendance: StaffAttendanceRecord | null
  locationStatus: VerificationStatus
  locationDistance: number | null
  isLoading: boolean
  error: string
  now: Date
  onVerify: () => void
  onCheckIn: () => void
  onCheckOut: () => void
  onClose: () => void
}) {
  const statusMeta = getAttendanceStatusMeta(status)
  const hasShift = Boolean(shift)
  const withinCheckInWindow = shift ? isWithinCheckInWindow(shift, now) : false
  const afterShiftEnd = shift ? isAfterShiftEnd(shift, now) : false
  const canCheckIn = status === 'NOT_STARTED' && hasShift && withinCheckInWindow && locationStatus === 'VALID' && !isLoading
  const canCheckOut = status === 'CHECKED_IN' && hasShift && afterShiftEnd && locationStatus === 'VALID' && !isLoading
  const locationConditionStatus: ConditionStatus =
    locationStatus === 'CHECKING'
      ? 'CHECKING'
      : locationStatus === 'VALID'
        ? 'PASSED'
        : 'FAILED'

  return (
    <ModalFrame
      title="Diem danh ca hien tai"
      description="Xac minh vi tri va ghi nhan check-in/check-out cho ca dang dien ra."
      onClose={onClose}
      size="lg"
    >
      {!shift ? (
        <div className="rounded-xl border border-error-container bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container">
          Khong co ca hien tai.
        </div>
      ) : (
        <div className="space-y-5">
          <section className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-display text-xl font-bold text-on-surface">{shift.shiftName}</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {formatDateForHeader(shift.date)} · {shift.startTime} - {shift.endTime}
                </p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">{shift.note}</p>
              </div>
              <span className={['w-fit rounded-full px-3 py-1 font-display text-xs font-bold', statusMeta.className].join(' ')}>
                {statusMeta.label}
              </span>
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-4 shadow-[0_8px_24px_rgba(26,28,30,0.04)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-on-surface">Xac minh vi tri</h3>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {STUDIO_LOCATION.name} · {STUDIO_LOCATION.address} · ban kinh {STUDIO_LOCATION.radiusMeters}m
                </p>
                {locationDistance !== null && (
                  <p className="mt-1 text-sm font-semibold text-on-surface">
                    Khoang cach hien tai: {formatDistance(locationDistance)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onVerify}
                disabled={locationStatus === 'CHECKING' || isLoading}
                className="btn-secondary shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {locationStatus === 'CHECKING' ? 'Dang kiem tra vi tri...' : 'Kiem tra vi tri'}
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-4 shadow-[0_8px_24px_rgba(26,28,30,0.04)]">
            <h3 className="font-display text-base font-bold text-on-surface">Dieu kien diem danh</h3>
            <div className="mt-4 grid gap-2">
              <ConditionLine status="PASSED" label="Ca lam hop le tu backend" />
              <ConditionLine
                status={withinCheckInWindow ? 'PASSED' : 'FAILED'}
                label={`Dung khung gio check-in tu ${getCheckInStartTime(shift)} den ${shift.endTime}`}
              />
              <ConditionLine status={locationConditionStatus} label="Dang o gan studio" />
              <ConditionLine
                status={afterShiftEnd ? 'PASSED' : 'FAILED'}
                label={`Da den gio ket thuc ca ${shift.endTime}`}
              />
            </div>
          </section>

          <section className="grid gap-3 text-sm sm:grid-cols-2">
            <InfoItem label="Gio vao" value={shift.checkInTime ?? 'Chua check-in'} />
            <InfoItem label="Gio ra" value={shift.checkOutTime ?? 'Chua check-out'} />
            <InfoItem
              label="Tong thoi luong lam viec"
              value={formatAttendanceDuration(attendance, shift.checkInTime, shift.checkOutTime, now)}
            />
            <InfoItem label="Trang thai ca" value={statusMeta.label} />
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-4 shadow-[0_8px_24px_rgba(26,28,30,0.04)]">
            <h3 className="font-display text-base font-bold text-on-surface">Timeline ca lam</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <TimelineStep label="Bat dau ca" value={shift.startTime} active />
              <TimelineStep label="Check-in" value={shift.checkInTime ?? 'Chua co'} active={Boolean(shift.checkInTime)} />
              <TimelineStep label="Ket thuc ca" value={shift.checkOutTime ?? shift.endTime} active={Boolean(shift.checkOutTime)} />
            </div>
          </section>

          {status === 'CHECKED_IN' && !afterShiftEnd && (
            <div className="rounded-xl border border-[#FEF3C7] bg-[#FFFBEB] px-4 py-3 text-sm font-semibold text-[#92400E]">
              Chua den gio ket thuc ca. Ban co the check-out sau {shift.endTime}.
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-error-container bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isLoading}>
              Huy
            </button>
            {status === 'NOT_STARTED' && (
              <button
                type="button"
                onClick={onCheckIn}
                disabled={!canCheckIn}
                className="btn-warm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? 'Dang check-in...' : 'Check-in'}
              </button>
            )}
            {status === 'CHECKED_IN' && (
              <button
                type="button"
                onClick={onCheckOut}
                disabled={!canCheckOut}
                className="btn-warm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? 'Dang check-out...' : 'Check-out'}
              </button>
            )}
            {status === 'CHECKED_OUT' && (
              <button type="button" disabled className="btn-secondary opacity-70">
                Da hoan tat ca
              </button>
            )}
          </div>
        </div>
      )}
    </ModalFrame>
  )
}

function ShiftDetailModal({
  detail,
  now,
  onClose,
}: {
  detail: ShiftDetailState
  now: Date
  onClose: () => void
}) {
  const meta = getShiftStatusMeta(detail.cell.status)

  return (
    <ModalFrame title="Chi tiet ca lam" onClose={onClose} size="lg">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 rounded-xl border border-outline-variant bg-surface-container-low p-4">
          <div>
            <p className="font-display text-xl font-bold text-on-surface">{detail.cell.shiftName}</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              {formatDateForHeader(detail.cell.date)} · {detail.cell.startTime} - {detail.cell.endTime}
            </p>
          </div>
          <span className={['rounded-full px-3 py-1 font-display text-xs font-bold', meta.className].join(' ')}>
            {meta.label}
          </span>
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <InfoItem label="Ngay" value={formatDateForHeader(detail.cell.date)} />
          <InfoItem label="Ca" value={detail.cell.shiftName} />
          <InfoItem label="Thoi gian" value={`${detail.cell.startTime} - ${detail.cell.endTime}`} />
          <InfoItem label="Trang thai" value={meta.label} />
          <InfoItem label="Check-in" value={detail.cell.checkInTime ?? 'Chua co'} />
          <InfoItem label="Check-out" value={detail.cell.checkOutTime ?? 'Chua co'} />
          <InfoItem
            label="Tong thoi luong"
            value={formatAttendanceDuration(null, detail.cell.checkInTime, detail.cell.checkOutTime, now)}
          />
          <InfoItem label="Ghi chu" value={detail.cell.note} />
        </dl>

        <section className="rounded-xl border border-outline-variant bg-white p-4 shadow-[0_8px_24px_rgba(26,28,30,0.04)]">
          <h3 className="font-display text-base font-bold text-on-surface">Booking trong ca</h3>
          {detail.isLoading ? (
            <p className="mt-3 text-sm text-on-surface-variant">Dang tai booking trong ca...</p>
          ) : detail.error ? (
            <p className="mt-3 rounded-xl border border-error-container bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container">
              {detail.error}
            </p>
          ) : detail.bookings.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-4 text-sm text-on-surface-variant">
              Khong co booking nao trong khung gio nay.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {detail.bookings.map((booking) => (
                <article key={booking.bookingId} className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-display text-base font-bold text-on-surface">{booking.customerName}</p>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        {booking.roomName} · {formatBookingWindow(booking.startTime, booking.endTime)}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-on-surface-variant">
                      {booking.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-on-surface-variant">
                    Thiet bi: {booking.equipment.length > 0 ? booking.equipment.join(', ') : 'Khong co ghi chu thiet bi'}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </ModalFrame>
  )
}

function SummaryCard({
  label,
  value,
  helper,
}: {
  label: string
  value: string | number
  helper: string
}) {
  return (
    <article className="rounded-3xl border border-outline-variant bg-white p-5 shadow-[var(--band-shadow-card)]">
      <p className="font-display text-sm font-bold text-on-surface-variant">{label}</p>
      <p className="mt-3 font-display text-3xl font-bold leading-none text-on-surface">{value}</p>
      <p className="mt-4 text-sm text-on-surface-variant">{helper}</p>
    </article>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1C1E]/35 p-3 sm:p-4">
      <section
        className={[
          'flex max-h-[calc(100vh-1.5rem)] w-full flex-col overflow-hidden rounded-xl border border-outline-variant bg-white shadow-[var(--band-shadow-elevated)]',
          size === 'lg' ? 'max-w-[760px]' : 'max-w-xl',
        ].join(' ')}
      >
        <header className="flex items-start justify-between gap-4 border-b border-outline-variant px-5 py-5 sm:px-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-on-surface">{title}</h2>
            {description && <p className="mt-1 max-w-xl text-sm leading-6 text-on-surface-variant">{description}</p>}
          </div>
          <button type="button" onClick={onClose} className="icon-button shrink-0" aria-label="Dong">
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
    PASSED: { mark: 'OK', label: 'Dat', className: 'bg-secondary text-white', textClass: 'text-secondary' },
    FAILED: { mark: '!', label: 'Chua dat', className: 'bg-surface-container-high text-on-surface-variant', textClass: 'text-on-surface-variant' },
    CHECKING: { mark: '...', label: 'Dang kiem tra', className: 'bg-primary-container text-on-primary-container', textClass: 'text-on-primary-container' },
  }[status]

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant bg-white px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className={['flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold', meta.className].join(' ')}>
          {meta.mark}
        </span>
        <span className="font-medium text-on-surface">{label}</span>
      </div>
      <span className={['shrink-0 text-xs font-bold', meta.textClass].join(' ')}>{meta.label}</span>
    </div>
  )
}

function TimelineStep({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div
      className={[
        'rounded-xl border px-4 py-3',
        active ? 'border-brand-orange bg-primary-container/35' : 'border-outline-variant bg-surface-container-low',
      ].join(' ')}
    >
      <p className="font-display text-xs font-bold uppercase text-on-surface-variant">{label}</p>
      <p className="mt-1 font-display text-lg font-bold text-on-surface">{value}</p>
    </div>
  )
}

function getShiftStatusMeta(status: ShiftStatus): StatusMeta {
  const meta: Record<ShiftStatus, StatusMeta> = {
    EMPTY: { label: 'Trong', className: 'bg-surface-container text-on-surface-variant' },
    ASSIGNED: { label: 'Da phan cong', className: 'bg-[#E8F5EC] text-secondary' },
    IN_PROGRESS: { label: 'Dang lam', className: 'bg-[#FEF3C7] text-[#92400E]' },
    COMPLETED: { label: 'Hoan tat', className: 'bg-[#E8E4DC] text-on-surface-variant' },
  }

  return meta[status]
}

function getAttendanceStatusMeta(status: AttendanceStatus): StatusMeta {
  const meta: Record<AttendanceStatus, StatusMeta> = {
    NOT_STARTED: { label: 'Chua check-in', className: 'bg-primary-container text-on-primary-container' },
    CHECKED_IN: { label: 'Da check-in', className: 'bg-[#FEF3C7] text-[#92400E]' },
    CHECKED_OUT: { label: 'Da check-out', className: 'bg-[#E8E4DC] text-on-surface-variant' },
    NO_SHIFT: { label: 'Khong co ca', className: 'bg-error-container text-on-error-container' },
  }

  return meta[status]
}

function getAttendanceStatus(
  currentShift: StaffShiftCell | null,
  attendance: StaffAttendanceRecord | null,
): AttendanceStatus {
  if (!currentShift) return 'NO_SHIFT'
  if (!attendance || attendance.shiftId !== currentShift.shiftId) return 'NOT_STARTED'
  if (attendance.status === 'WORKING') return 'CHECKED_IN'
  return 'CHECKED_OUT'
}

function getWeekDays(baseDate: Date): WeekDay[] {
  const start = startOfWeek(baseDate)

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const key = toDayKey(date)

    return {
      key,
      label: DAY_META[key].label,
      longLabel: DAY_META[key].longLabel,
      isoDate: toDateKey(date),
      shortDate: new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date),
    }
  })
}

function mapShiftToCell(
  shift: StaffScheduleShift,
  attendance: StaffAttendanceRecord | null,
): StaffShiftCell {
  const day = parseDate(shift.date)
  const dayKey = toDayKey(day)
  const shiftName = inferShiftName(shift.startTime, shift.endTime)
  const normalizedStart = normalizeTime(shift.startTime)
  const normalizedEnd = normalizeTime(shift.endTime)
  const currentAttendance = attendance?.shiftId === shift.shiftId ? attendance : null

  return {
    cellId: `${dayKey}-${shiftName}`,
    shiftId: shift.shiftId,
    dayKey,
    date: shift.date,
    shiftName,
    startTime: normalizedStart,
    endTime: normalizedEnd,
    status: currentAttendance
      ? currentAttendance.status === 'WORKING'
        ? 'IN_PROGRESS'
        : 'COMPLETED'
      : 'ASSIGNED',
    note: 'Dong bo tu lich backend. Mo chi tiet de xem booking trong ca.',
    checkInTime: currentAttendance?.checkInTime ? formatTimeFromIso(currentAttendance.checkInTime) : undefined,
    checkOutTime: currentAttendance?.checkOutTime ? formatTimeFromIso(currentAttendance.checkOutTime) : undefined,
  }
}

function mapShiftBookingToView(booking: StaffShiftBooking): ShiftBookingView {
  return {
    bookingId: booking.bookingId,
    roomName: booking.roomName,
    customerName: booking.customerName,
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.status,
    equipment: normalizeEquipmentNotes(booking.equipmentNotes),
  }
}

function compareShiftCells(firstCell: StaffShiftCell, secondCell: StaffShiftCell) {
  return (
    firstCell.date.localeCompare(secondCell.date) ||
    SHIFT_ROWS.findIndex((row) => row.name === firstCell.shiftName) -
      SHIFT_ROWS.findIndex((row) => row.name === secondCell.shiftName)
  )
}

function findCurrentShiftCell(
  cells: StaffShiftCell[],
  attendance: StaffAttendanceRecord | null,
  now: Date,
): StaffShiftCell | null {
  if (attendance) {
    const matchedCell = cells.find((cell) => cell.shiftId === attendance.shiftId)
    if (matchedCell) return matchedCell
  }

  return cells.find((cell) => isShiftHappeningNow(cell, now)) ?? null
}

function createEmptyCell(day: WeekDay, row: ShiftRow): StaffShiftCell {
  return {
    cellId: `${day.key}-${row.name}`,
    shiftId: null,
    dayKey: day.key,
    date: day.isoDate,
    shiftName: row.name,
    startTime: row.startTime,
    endTime: row.endTime,
    status: 'EMPTY',
    note: 'Chua co ca duoc phan cong o khung gio nay.',
  }
}

function getCellKey(dayKey: DayKey, shiftName: ShiftName) {
  return `${dayKey}-${shiftName}`
}

function inferShiftName(startTime: string, endTime: string): ShiftName {
  const normalizedStart = normalizeTime(startTime)
  const normalizedEnd = normalizeTime(endTime)

  const matchedRow = SHIFT_ROWS.find(
    (row) => row.startTime === normalizedStart && row.endTime === normalizedEnd,
  )
  if (matchedRow) return matchedRow.name

  const startMinutes = parseTimeToMinutes(normalizedStart)
  if (startMinutes < 12 * 60) return 'Ca sang'
  if (startMinutes < 18 * 60) return 'Ca chieu'
  return 'Ca toi'
}

function normalizeTime(value: string) {
  if (!value) return '00:00'
  const [hours = '00', minutes = '00'] = value.split(':')
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
}

function formatTimeFromIso(value: string) {
  return new Date(value).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatDateForHeader(dateKey: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  }).format(parseDate(dateKey))
}

function formatBookingWindow(startIso: string, endIso: string) {
  return `${formatTimeFromIso(startIso)} - ${formatTimeFromIso(endIso)}`
}

function formatAttendanceDuration(
  attendance: StaffAttendanceRecord | null,
  checkInTime?: string,
  checkOutTime?: string,
  now = new Date(),
) {
  const numericDuration =
    typeof attendance?.workDuration === 'number'
      ? attendance.workDuration
      : typeof attendance?.workDuration === 'string'
        ? Number(attendance.workDuration)
        : null

  if (numericDuration !== null && Number.isFinite(numericDuration) && numericDuration >= 0) {
    const hours = numericDuration
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)
    if (wholeHours <= 0) return `${minutes} phut`
    if (minutes <= 0) return `${wholeHours} gio`
    return `${wholeHours} gio ${minutes} phut`
  }

  if (!checkInTime) return 'Chua bat dau'
  const checkIn = createDateFromTime(checkInTime, now)
  const checkOut = checkOutTime ? createDateFromTime(checkOutTime, now) : now
  const diffMinutes = Math.max(0, Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000))
  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60

  if (hours <= 0) return `${minutes} phut`
  if (minutes <= 0) return `${hours} gio`
  return `${hours} gio ${minutes} phut`
}

function normalizeEquipmentNotes(notes?: string | null) {
  return (notes ?? '')
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function isShiftHappeningNow(shift: StaffShiftCell, now: Date) {
  const shiftStart = createDateFromTime(shift.startTime, parseDate(shift.date))
  const shiftEnd = createDateFromTime(shift.endTime, parseDate(shift.date))
  return now >= shiftStart && now <= shiftEnd
}

function isWithinCheckInWindow(shift: StaffShiftCell, now: Date) {
  const shiftStart = createDateFromTime(shift.startTime, parseDate(shift.date))
  const shiftEnd = createDateFromTime(shift.endTime, parseDate(shift.date))
  const earliestCheckIn = new Date(shiftStart.getTime() - CHECK_IN_EARLY_MINUTES * 60 * 1000)
  return now >= earliestCheckIn && now <= shiftEnd
}

function isAfterShiftEnd(shift: StaffShiftCell, now: Date) {
  return now >= createDateFromTime(shift.endTime, parseDate(shift.date))
}

function getCheckInStartTime(shift: StaffShiftCell) {
  const startMinutes = parseTimeToMinutes(shift.startTime) - CHECK_IN_EARLY_MINUTES
  const normalizedMinutes = Math.max(0, startMinutes)
  const hours = Math.floor(normalizedMinutes / 60)
  const minutes = normalizedMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function startOfWeek(date: Date) {
  const result = new Date(date)
  const day = result.getDay()
  const diff = day === 0 ? -6 : 1 - day
  result.setDate(result.getDate() + diff)
  result.setHours(0, 0, 0, 0)
  return result
}

function toDayKey(date: Date): DayKey {
  const keys: DayKey[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  return keys[date.getDay()]
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

function createDateFromTime(time: string, baseDate: Date) {
  const [hours, minutes] = normalizeTime(time).split(':').map(Number)
  const date = new Date(baseDate)
  date.setHours(hours, minutes, 0, 0)
  return date
}

function parseTimeToMinutes(time: string) {
  const [hours, minutes] = normalizeTime(time).split(':').map(Number)
  return hours * 60 + minutes
}

function calculateDistanceMeters(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const earthRadiusMeters = 6371000
  const fromPhi = toRadians(fromLat)
  const toPhi = toRadians(toLat)
  const deltaPhi = toRadians(toLat - fromLat)
  const deltaLambda = toRadians(toLng - fromLng)
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(fromPhi) * Math.cos(toPhi) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return earthRadiusMeters * c
}

function isWithinStudioRadius(distanceMeters: number) {
  return distanceMeters <= STUDIO_LOCATION.radiusMeters
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

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function formatDistance(distanceMeters: number) {
  if (distanceMeters < 1000) return `${Math.round(distanceMeters)}m`
  return `${(distanceMeters / 1000).toFixed(1)}km`
}

function IconCalendarCheck() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M7 3v3M17 3v3M4.5 9h15M6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10A2.5 2.5 0 0 1 6.5 5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="m8.5 14 2 2 5-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconCalendarPlus() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M7 3v3M17 3v3M4.5 9h15M6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10A2.5 2.5 0 0 1 6.5 5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M12 12v5M9.5 14.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconRefresh() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M20 5v5h-5M4 19v-5h5M6.9 9A7 7 0 0 1 19 10m-1.9 5A7 7 0 0 1 5 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
