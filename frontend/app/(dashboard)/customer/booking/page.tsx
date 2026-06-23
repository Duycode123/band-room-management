'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AuthGuard from '@/components/AuthGuard'
import RoomCard from '@/components/booking/RoomCard'
import TimeSlotGrid from '@/components/booking/TimeSlotGrid'
import { useAvailableSlots } from '@/hooks/useAvailableSlots'
import { createBooking, fetchRooms, formatPrice, getDateOptions } from '@/lib/booking/bookingApi'
import type { PracticeRoom } from '@/lib/booking/types'

export default function CustomerBookingPage() {
  const router = useRouter()
  const { logout } = useAuth()
  const dateOptions = useMemo(() => getDateOptions(), [])

  const [rooms, setRooms] = useState<PracticeRoom[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(dateOptions[0]?.value ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? null

  const { slots, isLoading, lastUpdated, error, refresh, selectSlot } = useAvailableSlots(
    selectedRoomId,
    selectedDate,
  )

  const selectedSlot = slots.find((s) => s.status === 'selected') ?? null

  useEffect(() => {
    fetchRooms().then(setRooms)
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!selectedRoomId || !selectedSlot) {
      setMessage('Vui lòng chọn phòng và khung giờ.')
      return
    }
    setIsSubmitting(true)
    setMessage('')
    const result = await createBooking({
      roomId: selectedRoomId,
      date: selectedDate,
      slotId: selectedSlot.id,
    })
    setIsSubmitting(false)
    setMessage(result.message)
    if (result.success) {
      selectSlot(null)
      refresh()
    } else {
      refresh()
    }
  }, [selectedRoomId, selectedSlot, selectedDate, refresh, selectSlot])

  return (
    <AuthGuard allowedRoles={['CUSTOMER']}>
      <main className="min-h-screen bg-brand-bgGray">
        <header className="border-b border-outline-variant bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
            <div>
              <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-brand-orange">
                Đặt lịch
              </p>
              <h1 className="font-display text-2xl font-bold tracking-tight text-on-surface">
                Đặt phòng tập nhạc
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/customer/dashboard"
                className="rounded-lg border border-outline px-4 py-2 font-display text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout()
                  router.push('/login')
                }}
                className="rounded-lg bg-inverse-surface px-4 py-2 font-display text-sm font-medium text-inverse-on-surface"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-6xl gap-6 p-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            {/* Chọn phòng */}
            <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-[var(--shadow-card)]">
              <h2 className="font-display text-lg font-semibold text-on-surface">1. Chọn phòng tập</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Chọn studio phù hợp với nhu cầu của bạn.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {rooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    selected={selectedRoomId === room.id}
                    onSelect={() => {
                      setSelectedRoomId(room.id)
                      setMessage('')
                    }}
                  />
                ))}
              </div>
            </section>

            {/* Chọn ngày + lịch real-time */}
            <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold text-on-surface">2. Chọn ngày & khung giờ</h2>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Lịch trống cập nhật theo thời gian thực mỗi 15 giây.
                  </p>
                </div>
                {lastUpdated && (
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-orange opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-orange" />
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      Cập nhật{' '}
                      {lastUpdated.toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={refresh}
                      className="rounded-md border border-outline px-2 py-1 font-display text-[11px] font-medium text-on-surface-variant hover:bg-surface-container-low"
                    >
                      Làm mới
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {dateOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSelectedDate(opt.value)
                      setMessage('')
                    }}
                    className={[
                      'rounded-lg border px-3 py-2 font-display text-xs font-medium transition-all',
                      selectedDate === opt.value
                        ? 'border-brand-orange bg-brand-orange text-white'
                        : 'border-outline bg-white text-on-surface-variant hover:border-brand-orange/50',
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {error && (
                <p className="mt-4 rounded-lg border border-error/20 bg-error-container px-3 py-2 text-xs text-error">
                  {error}
                </p>
              )}

              <div className="mt-5">
                <TimeSlotGrid
                  slots={slots}
                  isLoading={isLoading}
                  onSelect={(id) => {
                    selectSlot(id)
                    setMessage('')
                  }}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded border border-outline bg-white" /> Trống
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-brand-orange" /> Đã chọn
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-surface-container line-through" /> Đã đặt
                </span>
              </div>
            </section>
          </div>

          {/* Tóm tắt đặt phòng */}
          <aside className="h-fit rounded-xl border border-outline-variant bg-white p-6 shadow-[var(--shadow-card)] lg:sticky lg:top-6">
            <h2 className="font-display text-lg font-semibold text-on-surface">Tóm tắt</h2>

            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wider text-on-surface-variant">Phòng</dt>
                <dd className="mt-0.5 font-medium text-on-surface">
                  {selectedRoom?.name ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-on-surface-variant">Ngày</dt>
                <dd className="mt-0.5 font-medium text-on-surface">
                  {selectedDate
                    ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString('vi-VN', {
                        weekday: 'long',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-on-surface-variant">Khung giờ</dt>
                <dd className="mt-0.5 font-medium text-on-surface">
                  {selectedSlot ? `${selectedSlot.start} – ${selectedSlot.end}` : '—'}
                </dd>
              </div>
              <div className="border-t border-outline-variant pt-3">
                <dt className="text-xs uppercase tracking-wider text-on-surface-variant">Tổng tiền</dt>
                <dd className="mt-0.5 font-display text-xl font-bold text-brand-orange">
                  {selectedRoom ? formatPrice(selectedRoom.pricePerHour) : '—'}
                </dd>
              </div>
            </dl>

            {message && (
              <p
                className={[
                  'mt-4 rounded-lg px-3 py-2 text-xs',
                  message.includes('thành công')
                    ? 'border border-secondary-container/50 bg-secondary-container/20 text-secondary'
                    : 'border border-error/20 bg-error-container text-error',
                ].join(' ')}
              >
                {message}
              </p>
            )}

            <button
              type="button"
              disabled={!selectedRoom || !selectedSlot || isSubmitting}
              onClick={handleConfirm}
              className="mt-5 flex h-12 w-full cursor-pointer items-center justify-center rounded-lg bg-brand-orange font-display text-sm font-medium text-white transition-all hover:bg-brand-orangeHover active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-on-surface-variant"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt phòng'}
            </button>

            <p className="mt-3 text-center text-[11px] text-on-surface-variant">
              * Demo FE — sẽ kết nối API backend khi sẵn sàng
            </p>
          </aside>
        </div>
      </main>
    </AuthGuard>
  )
}
