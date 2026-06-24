'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  addDays,
  formatDateLong,
  formatDayNumber,
  formatMonthYear,
  formatWeekdayShort,
  getCalendarMonthCells,
  getTodayKey,
  getWeekDayKeys,
  isDateSelectable,
  isToday,
  MAX_BOOKING_DAYS_AHEAD,
  parseDateKey,
  startOfWeek,
  toDateKey,
} from '@/lib/booking/dateUtils'

const WEEKDAY_HEADERS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

type BookingDatePickerProps = {
  value: string
  onChange: (dateKey: string) => void
}

export default function BookingDatePicker({ value, onChange }: BookingDatePickerProps) {
  const todayKey = getTodayKey()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(parseDateKey(value || todayKey)))
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => {
    const base = value ? parseDateKey(value) : parseDateKey(todayKey)
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })
  const calendarRef = useRef<HTMLDivElement>(null)

  const weekKeys = useMemo(() => getWeekDayKeys(weekStart), [weekStart])
  const monthCells = useMemo(() => getCalendarMonthCells(viewMonth), [viewMonth])

  useEffect(() => {
    if (!value) return
    const selected = parseDateKey(value)
    setWeekStart(startOfWeek(selected))
    setViewMonth(new Date(selected.getFullYear(), selected.getMonth(), 1))
  }, [value])

  useEffect(() => {
    if (!calendarOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setCalendarOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [calendarOpen])

  const shiftWeek = (delta: number) => {
    setWeekStart((current) => addDays(current, delta * 7))
  }

  const canGoPrevWeek = weekStart > startOfWeek(new Date())
  const canGoNextWeek = isDateSelectable(toDateKey(addDays(weekStart, 7)))

  const selectDate = (key: string) => {
    if (!isDateSelectable(key)) return
    onChange(key)
    setCalendarOpen(false)
  }

  const shiftMonth = (delta: number) => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
  }

  return (
    <div className="space-y-4">
      {/* Selected date + navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3">
        <div className="min-w-0">
          <p className="font-display text-[10px] font-medium uppercase tracking-[0.12em] text-on-surface-variant">
            Ngày đã chọn
          </p>
          <p className="font-display text-base font-semibold text-on-surface">
            {value ? formatDateLong(value) : '—'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftWeek(-1)}
            disabled={!canGoPrevWeek}
            aria-label="Tuần trước"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline bg-white text-on-surface-variant transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            onClick={() => setCalendarOpen((o) => !o)}
            aria-expanded={calendarOpen}
            aria-label="Mở lịch chọn ngày"
            className="flex h-9 items-center gap-2 rounded-lg border border-outline bg-white px-3 font-display text-xs font-medium text-on-surface transition-colors hover:border-brand-orange/50 hover:bg-primary-container/20"
          >
            <CalendarIcon />
            Chọn ngày
          </button>
          <button
            type="button"
            onClick={() => shiftWeek(1)}
            disabled={!canGoNextWeek}
            aria-label="Tuần sau"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline bg-white text-on-surface-variant transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      {/* Week strip — 7 equal columns */}
      <div className="overflow-hidden rounded-xl border border-outline-variant bg-white">
        <div className="grid grid-cols-7 border-b border-outline-variant bg-surface-container-low">
          {WEEKDAY_HEADERS.map((label) => (
            <div
              key={label}
              className="py-2 text-center font-display text-[10px] font-medium uppercase tracking-wider text-on-surface-variant"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 divide-x divide-outline-variant">
          {weekKeys.map((key) => {
            const selectable = isDateSelectable(key)
            const selected = value === key
            const today = isToday(key)

            return (
              <button
                key={key}
                type="button"
                disabled={!selectable}
                onClick={() => selectDate(key)}
                aria-label={formatDateLong(key)}
                aria-pressed={selected}
                className={[
                  'flex min-h-[4.5rem] flex-col items-center justify-center gap-0.5 py-3 transition-all',
                  selected
                    ? 'bg-brand-orange text-white'
                    : selectable
                      ? 'bg-white text-on-surface hover:bg-primary-container/15'
                      : 'cursor-not-allowed bg-surface-container-low text-on-surface-variant/35',
                ].join(' ')}
              >
                <span
                  className={[
                    'font-display text-lg font-semibold leading-none',
                    today && !selected ? 'text-brand-orange' : '',
                  ].join(' ')}
                >
                  {formatDayNumber(key)}
                </span>
                <span
                  className={[
                    'font-display text-[10px] font-medium',
                    selected ? 'text-white/90' : 'text-on-surface-variant',
                  ].join(' ')}
                >
                  {today ? 'Hôm nay' : formatWeekdayShort(key)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Month calendar popover */}
      {calendarOpen && (
        <div
          ref={calendarRef}
          className="rounded-xl border border-outline-variant bg-white p-4 shadow-[var(--shadow-elevated)]"
          role="dialog"
          aria-label="Lịch chọn ngày"
        >
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="Tháng trước"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low"
            >
              <ChevronLeft />
            </button>
            <p className="font-display text-sm font-semibold capitalize text-on-surface">
              {formatMonthYear(viewMonth)}
            </p>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Tháng sau"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low"
            >
              <ChevronRight />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEKDAY_HEADERS.map((label) => (
              <div
                key={`cal-${label}`}
                className="py-1 text-center font-display text-[10px] font-medium text-on-surface-variant"
              >
                {label}
              </div>
            ))}
            {monthCells.map((cell) => {
              const selected = value === cell.key
              return (
                <button
                  key={cell.key}
                  type="button"
                  disabled={!cell.selectable}
                  onClick={() => selectDate(cell.key)}
                  aria-label={formatDateLong(cell.key)}
                  aria-pressed={selected}
                  className={[
                    'flex h-9 w-full items-center justify-center rounded-lg font-display text-sm transition-colors',
                    selected
                      ? 'bg-brand-orange font-semibold text-white'
                      : cell.selectable
                        ? cell.inMonth
                          ? 'text-on-surface hover:bg-primary-container/20'
                          : 'text-on-surface-variant/50 hover:bg-surface-container-low'
                        : 'cursor-not-allowed text-on-surface-variant/25',
                    isToday(cell.key) && !selected ? 'ring-1 ring-brand-orange/50' : '',
                  ].join(' ')}
                >
                  {cell.day}
                </button>
              )
            })}
          </div>

          <p className="mt-3 text-center text-[11px] text-on-surface-variant">
            Có thể đặt trước tối đa {MAX_BOOKING_DAYS_AHEAD} ngày
          </p>
        </div>
      )}
    </div>
  )
}

function ChevronLeft() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="h-4 w-4 text-brand-orange" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  )
}
