/** Maximum days ahead a customer can book (industry-standard advance window). */
export const MAX_BOOKING_DAYS_AHEAD = 90

const pad = (n: number) => n.toString().padStart(2, '0')

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return startOfDay(d)
}

/** ISO week: Monday as first day of week. */
export function startOfWeek(date: Date): Date {
  const d = startOfDay(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  return addDays(d, diff)
}

export function getTodayKey(): string {
  return toDateKey(startOfDay(new Date()))
}

export function getMaxBookableDate(): Date {
  return addDays(startOfDay(new Date()), MAX_BOOKING_DAYS_AHEAD)
}

export function isDateSelectable(key: string): boolean {
  const date = parseDateKey(key)
  const today = startOfDay(new Date())
  const max = getMaxBookableDate()
  return date >= today && date <= max
}

export function getWeekDayKeys(weekStart: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => toDateKey(addDays(weekStart, i)))
}

export function formatDateLong(key: string): string {
  return parseDateKey(key).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
}

export function formatWeekdayShort(key: string): string {
  return parseDateKey(key).toLocaleDateString('vi-VN', { weekday: 'short' })
}

export function formatDayNumber(key: string): string {
  return parseDateKey(key).toLocaleDateString('vi-VN', { day: '2-digit' })
}

export function isToday(key: string): boolean {
  return key === getTodayKey()
}

export type CalendarCell = {
  key: string
  day: number
  inMonth: boolean
  selectable: boolean
}

export function getCalendarMonthCells(viewMonth: Date): CalendarCell[] {
  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const start = startOfWeek(firstOfMonth)
  const cells: CalendarCell[] = []

  for (let i = 0; i < 42; i++) {
    const date = addDays(start, i)
    const key = toDateKey(date)
    cells.push({
      key,
      day: date.getDate(),
      inMonth: date.getMonth() === month,
      selectable: isDateSelectable(key),
    })
  }

  return cells
}
