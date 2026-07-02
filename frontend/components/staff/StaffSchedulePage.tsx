'use client'

import { useMemo, useState, type ReactNode } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { StaffPageShell } from '@/components/staff/StaffShared'

type ShiftStatus = 'EMPTY' | 'OFFLINE' | 'REGISTERED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED'
type AttendanceStatus = 'NOT_STARTED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'NO_SHIFT'
type DayKey = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'
type ShiftName = 'Ca sáng' | 'Ca chiều' | 'Ca tối'
type ShiftAvailabilityStatus = 'AVAILABLE' | 'ALMOST_FULL' | 'FULL'
type VerificationStatus = 'IDLE' | 'CHECKING' | 'VALID' | 'INVALID' | 'BLOCKED'
type ConditionStatus = 'PASSED' | 'FAILED' | 'CHECKING'

type StaffShiftCell = {
  id: string
  day: DayKey
  shiftName: ShiftName
  startTime: string
  endTime: string
  status: ShiftStatus
  note?: string
  checkInTime?: string
  checkOutTime?: string
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

type StatusMeta = {
  label: string
  className: string
}

type RegisterForm = {
  day: DayKey | ''
  shiftName: ShiftName | ''
  note: string
}

const STUDIO_LOCATION = {
  name: 'BandHub Studio',
  address: '123 Âu Cơ, Tân Bình',
  lat: 21.0285,
  lng: 105.8542,
  radiusMeters: 100,
}

const CHECK_IN_EARLY_MINUTES = 30

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
  createCell('MON', 'Ca sáng', 'OFFLINE', 'Nghỉ ca sáng'),
  createCell('WED', 'Ca sáng', 'OFFLINE', 'Nghỉ ca sáng'),
  createCell('WED', 'Ca chiều', 'OFFLINE', 'Nghỉ ca chiều'),
  createCell('THU', 'Ca chiều', 'OFFLINE', 'Nghỉ ca chiều'),
  createCell('FRI', 'Ca chiều', 'ASSIGNED', 'Hỗ trợ phòng A và phòng B'),
]

const defaultRegisterForm: RegisterForm = {
  day: '',
  shiftName: '',
  note: '',
}

export default function StaffSchedulePage() {
  const [shifts, setShifts] = useState<StaffShiftCell[]>(initialShifts)
  const [shiftOptions, setShiftOptions] = useState<ShiftOption[]>(initialShiftOptions)
  const [selectedCell, setSelectedCell] = useState<StaffShiftCell | null>(null)
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

  const selectedShiftOption = useMemo(() => {
    if (!registerForm.day || !registerForm.shiftName) return null
    return findShiftOption(shiftOptions, registerForm.day, registerForm.shiftName)
  }, [registerForm.day, registerForm.shiftName, shiftOptions])

  const handleRegisterShift = async () => {
    const validationError = validateShiftRegistration(registerForm, selectedShiftOption, shiftMap)
    setRegisterError(validationError)
    setRegisterSuccess('')

    if (validationError || !selectedShiftOption || !registerForm.day || !registerForm.shiftName) return

    setIsRegisterLoading(true)
    await wait()

    setShifts((current) => [
      ...current,
      {
        id: `${registerForm.day}-${registerForm.shiftName}-${Date.now()}`,
        day: registerForm.day as DayKey,
        shiftName: registerForm.shiftName as ShiftName,
        startTime: selectedShiftOption.startTime,
        endTime: selectedShiftOption.endTime,
        status: 'REGISTERED',
        note: registerForm.note.trim() || 'Đăng ký mới',
      },
    ])
    setShiftOptions((current) =>
      current.map((shift) =>
        shift.id === selectedShiftOption.id
          ? {
              ...shift,
              registeredCount: Math.min(shift.requiredCount, shift.registeredCount + 1),
              status: getAvailabilityStatus(Math.min(shift.requiredCount, shift.registeredCount + 1), shift.requiredCount),
            }
          : shift,
      ),
    )
    setIsRegisterLoading(false)
    setRegisterSuccess('Đăng ký ca làm việc thành công.')
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
    updateShift(currentShift.id, {
      status: 'IN_PROGRESS',
      checkInTime: getCurrentTime(),
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
              <button type="button" onClick={() => setIsRegisterOpen(true)} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#C91F2E] px-6 font-display text-sm font-bold text-white shadow-[0_12px_26px_rgba(201,31,46,0.22)] transition hover:bg-[#A91724]">
                Đăng ký ca làm việc
                <IconCalendarPlus />
              </button>
            </div>
          </div>

          <div className="border border-outline-variant bg-white p-4 shadow-[var(--band-shadow-card)] sm:p-7">
            {!hasAnyShift && (
              <div className="mb-5 rounded-xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-5 text-sm text-on-surface-variant">
                Tuần này chưa có ca làm nào. Bạn có thể đăng ký ca làm việc ở nút phía trên.
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left">
                <thead>
                  <tr>
                    <th className="h-14 w-[170px] border border-[#C9D3E1] bg-white" />
                    {days.map((day) => (
                      <th key={day.key} className="h-14 border border-[#C9D3E1] bg-white text-center font-display text-lg font-medium text-[#1F2937]">
                        {day.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shiftRows.map((row) => (
                    <tr key={row.name}>
                      <th className="h-[220px] w-[170px] border border-[#C9D3E1] bg-white px-3 align-middle sm:px-4">
                        <div>
                          <p className="font-display text-xl font-medium text-on-surface">{row.name}</p>
                          <span className="mt-2 inline-flex rounded-full bg-[#E3E9F1] px-3 py-1 font-display text-sm font-bold text-[#253044]">
                            {row.startTime} - {row.endTime}
                          </span>
                        </div>
                      </th>
                      {days.map((day) => {
                        const cell = shiftMap[getCellKey(day.key, row.name)] ?? createEmptyCell(day.key, row)
                        const meta = getShiftStatusMeta(cell.status)

                        return (
                          <td key={`${day.key}-${row.name}`} className={['h-[220px] border border-[#C9D3E1] align-middle', cell.status === 'OFFLINE' ? 'bg-[#F3F6F9]' : 'bg-white'].join(' ')}>
                            <button
                              type="button"
                              onClick={() => setSelectedCell(cell)}
                              className="flex h-full w-full items-center justify-center p-4 text-center transition hover:bg-primary-container/30 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-orange"
                            >
                              <span className={['inline-flex rounded-full px-4 py-2 font-display text-sm font-bold', meta.className].join(' ')}>
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
          <RegisterShiftModal
            form={registerForm}
            shifts={shifts}
            shiftOptions={shiftOptions}
            selectedShift={selectedShiftOption}
            error={registerError}
            success={registerSuccess}
            isLoading={isRegisterLoading}
            onChange={(nextForm) => {
              setRegisterForm(nextForm)
              setRegisterError('')
              setRegisterSuccess('')
            }}
            onSubmit={handleRegisterShift}
            onClose={() => {
              setIsRegisterOpen(false)
              setRegisterForm(defaultRegisterForm)
              setRegisterError('')
              setRegisterSuccess('')
            }}
          />
        )}

        {selectedCell && <ShiftDetailModal shift={selectedCell} onClose={() => setSelectedCell(null)} />}
      </StaffPageShell>
    </AuthGuard>
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
              <span className={['w-fit rounded-full px-3 py-1 font-display text-xs font-bold', statusMeta.className].join(' ')}>{statusMeta.label}</span>
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
            <InfoItem label="Trạng thái ca" value={statusMeta.label} />
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-4 shadow-[0_8px_24px_rgba(26,28,30,0.04)]">
            <h3 className="font-display text-base font-bold text-on-surface">Timeline ca làm</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <TimelineStep label="Bắt đầu ca" value={shift.startTime} active />
              <TimelineStep label="Check-in" value={shift.checkInTime ?? 'Chưa có'} active={Boolean(shift.checkInTime)} />
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

function RegisterShiftModal({
  form,
  shifts,
  shiftOptions,
  selectedShift,
  error,
  success,
  isLoading,
  onChange,
  onSubmit,
  onClose,
}: {
  form: RegisterForm
  shifts: StaffShiftCell[]
  shiftOptions: ShiftOption[]
  selectedShift: ShiftOption | null
  error: string
  success: string
  isLoading: boolean
  onChange: (form: RegisterForm) => void
  onSubmit: () => void
  onClose: () => void
}) {
  const dayOptions = days.map((day) => {
    const slots = shiftOptions.filter((shift) => shift.day === day.key && !isShiftFull(shift)).length
    return { ...day, slots }
  })
  const visibleShiftOptions = form.day ? shiftOptions.filter((shift) => shift.day === form.day) : []
  const duplicateShift = Boolean(form.day && form.shiftName && shifts.some((shift) => shift.day === form.day && shift.shiftName === form.shiftName && isRegisteredShiftStatus(shift.status)))
  const isSubmitDisabled = isLoading || !form.day || !form.shiftName || !selectedShift || isShiftFull(selectedShift) || duplicateShift

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1C1E]/35 p-3 sm:p-4">
      <section className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-[760px] flex-col overflow-hidden rounded-xl border border-outline-variant bg-white shadow-[var(--band-shadow-elevated)]">
        <header className="flex items-start justify-between gap-4 border-b border-outline-variant px-5 py-5 sm:px-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-on-surface">Đăng ký ca làm việc</h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-on-surface-variant">
              Chọn ngày và ca phù hợp để đăng ký lịch làm việc trong tuần.
            </p>
          </div>
          <button type="button" onClick={onClose} className="icon-button shrink-0" aria-label="Đóng" disabled={isLoading}>
            <IconClose />
          </button>
        </header>

        <div className="space-y-5 overflow-y-auto bg-[#FDFBF8] px-5 py-5 sm:px-6">
          <section className="rounded-xl border border-outline-variant bg-white p-4 shadow-[0_8px_24px_rgba(26,28,30,0.04)]">
            <div className="flex flex-col gap-1">
              <h3 className="font-display text-base font-bold text-on-surface">Chọn ngày</h3>
              <p className="text-sm text-on-surface-variant">Chỉ hiển thị các ngày trong tuần hiện tại.</p>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {dayOptions.map((day) => {
                const active = form.day === day.key
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => onChange({ ...form, day: day.key, shiftName: '' })}
                    disabled={isLoading}
                    className={[
                      'rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60',
                      active ? 'border-brand-orange bg-primary-container/55 shadow-[0_10px_24px_rgba(255,117,24,0.12)]' : 'border-outline-variant bg-white hover:border-brand-orange/50 hover:bg-primary-container/20',
                    ].join(' ')}
                  >
                    <span className="block font-display text-sm font-bold text-on-surface">{day.label}</span>
                    <span className="mt-1 block text-lg font-bold text-on-surface">{day.date}</span>
                    <span className="mt-2 inline-flex rounded-full bg-surface-container px-2.5 py-1 text-xs font-semibold text-on-surface-variant">
                      {day.slots} ca còn trống
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-4 shadow-[0_8px_24px_rgba(26,28,30,0.04)]">
            <div className="flex flex-col gap-1">
              <h3 className="font-display text-base font-bold text-on-surface">Chọn ca</h3>
              <p className="text-sm text-on-surface-variant">Ca đã đủ nhân viên sẽ bị khóa và không thể đăng ký.</p>
            </div>
            <div className="mt-4 grid gap-3">
              {visibleShiftOptions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-5 text-sm text-on-surface-variant">
                  Vui lòng chọn ngày làm việc để xem danh sách ca.
                </div>
              ) : (
                visibleShiftOptions.map((shift) => {
                  const active = form.shiftName === shift.shiftName
                  const full = isShiftFull(shift)
                  const meta = getShiftAvailabilityMeta(shift.status)
                  return (
                    <button
                      key={shift.id}
                      type="button"
                      onClick={() => !full && onChange({ ...form, shiftName: shift.shiftName })}
                      disabled={isLoading || full}
                      className={[
                        'rounded-xl border p-4 text-left transition',
                        active ? 'border-brand-orange bg-primary-container/45 shadow-[0_12px_26px_rgba(255,117,24,0.14)]' : 'border-outline-variant bg-white hover:border-brand-orange/50',
                        full ? 'cursor-not-allowed opacity-60 hover:border-outline-variant' : '',
                      ].join(' ')}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-display text-lg font-bold text-on-surface">{shift.shiftName}</p>
                            {active && <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-orange text-xs font-bold text-white">✓</span>}
                          </div>
                          <p className="mt-1 font-semibold text-on-surface">{shift.startTime} - {shift.endTime}</p>
                          <p className="mt-2 text-sm leading-6 text-on-surface-variant">{shift.description}</p>
                        </div>
                        <div className="flex shrink-0 flex-row items-center gap-2 sm:flex-col sm:items-end">
                          <span className={['rounded-full px-3 py-1 font-display text-xs font-bold', meta.className].join(' ')}>
                            {meta.label}
                          </span>
                          <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
                            {shift.registeredCount}/{shift.requiredCount} nhân viên
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-4 shadow-[0_8px_24px_rgba(26,28,30,0.04)]">
            <label className="block">
              <span className="font-display text-sm font-bold text-on-surface">Ghi chú cho quản lý</span>
              <textarea
                value={form.note}
                onChange={(event) => onChange({ ...form, note: event.target.value })}
                disabled={isLoading}
                className="mt-2 min-h-28 w-full resize-none rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm outline-none transition placeholder:text-on-surface-variant/70 focus:border-brand-orange focus:bg-white focus:ring-4 focus:ring-brand-orange/10 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Ví dụ: Có thể hỗ trợ phòng thu vocal, setup thiết bị hoặc trực ca tối."
              />
              <span className="mt-2 block text-sm text-on-surface-variant">
                Ghi chú là tùy chọn và sẽ được gửi kèm yêu cầu đăng ký ca.
              </span>
            </label>
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-4 shadow-[0_8px_24px_rgba(26,28,30,0.04)]">
            <h3 className="font-display text-base font-bold text-on-surface">Tóm tắt đăng ký</h3>
            {!form.day || !form.shiftName || !selectedShift ? (
              <p className="mt-3 rounded-xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-4 text-sm text-on-surface-variant">
                Vui lòng chọn ngày và ca làm việc để xem tóm tắt.
              </p>
            ) : (
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <InfoItem label="Ngày đã chọn" value={`${getDayLabel(selectedShift.day)} · ${selectedShift.date}`} />
                <InfoItem label="Ca đã chọn" value={selectedShift.shiftName} />
                <InfoItem label="Thời gian" value={`${selectedShift.startTime} - ${selectedShift.endTime}`} />
                <InfoItem label="Trạng thái ca" value={getShiftAvailabilityMeta(selectedShift.status).label} />
                <div className="sm:col-span-2">
                  <InfoItem label="Ghi chú" value={form.note.trim() || 'Không có'} />
                </div>
              </dl>
            )}
          </section>

          {error && <div className="rounded-xl border border-error-container bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container">{error}</div>}
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

function ShiftDetailModal({ shift, onClose }: { shift: StaffShiftCell; onClose: () => void }) {
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
          <InfoItem label="Ngày" value={getDayLabel(shift.day)} />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1C1E]/35 p-3 sm:p-4">
      <section className={['flex max-h-[calc(100vh-1.5rem)] w-full flex-col overflow-hidden rounded-xl border border-outline-variant bg-white shadow-[var(--band-shadow-elevated)]', size === 'lg' ? 'max-w-[760px]' : 'max-w-xl'].join(' ')}>
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
  if (!form.shiftName) return 'Vui lòng chọn ca làm việc.'
  if (!selectedShift) return 'Vui lòng chọn ca làm việc.'
  if (isShiftFull(selectedShift)) return 'Ca này đã đủ nhân viên, vui lòng chọn ca khác.'

  const existing = shiftMap[getCellKey(form.day, form.shiftName)]
  if (existing && isRegisteredShiftStatus(existing.status)) return 'Bạn đã đăng ký ca này.'

  return ''
}

function isShiftFull(shift: ShiftOption) {
  return shift.status === 'FULL' || shift.registeredCount >= shift.requiredCount
}

function isRegisteredShiftStatus(status: ShiftStatus) {
  return status === 'REGISTERED' || status === 'ASSIGNED' || status === 'IN_PROGRESS' || status === 'COMPLETED'
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

function getAttendanceStatus(shift: StaffShiftCell | null): AttendanceStatus {
  if (!shift) return 'NO_SHIFT'
  if (shift.checkOutTime || shift.status === 'COMPLETED') return 'CHECKED_OUT'
  if (shift.checkInTime || shift.status === 'IN_PROGRESS') return 'CHECKED_IN'
  return 'NOT_STARTED'
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

function IconCalendarCheck() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M7 3v3M17 3v3M4.5 9h15M6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10A2.5 2.5 0 0 1 6.5 5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="m8.5 14 2 2 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function IconCalendarPlus() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M7 3v3M17 3v3M4.5 9h15M6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10A2.5 2.5 0 0 1 6.5 5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M12 12v5M9.5 14.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
}

function IconClose() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}
