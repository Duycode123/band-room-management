'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import BookingDatePicker from '@/components/booking/BookingDatePicker'
import BookingStepSection from '@/components/booking/BookingStepSection'
import BookingSummary from '@/components/booking/BookingSummary'
import RoomCard from '@/components/booking/RoomCard'
import TimeSlotGrid from '@/components/booking/TimeSlotGrid'
import CustomerPageHeader from '@/components/customer/CustomerPageHeader'
import CustomerShell from '@/components/customer/CustomerShell'
import { useAvailableSlots } from '@/hooks/useAvailableSlots'
import { fetchRooms } from '@/lib/booking/bookingApi'
import { getTodayKey } from '@/lib/booking/dateUtils'
import { getSelectedSlots } from '@/lib/booking/slotSelection'
import type { PracticeRoom } from '@/lib/booking/types'

export default function CustomerBookingPage() {
  const router = useRouter()
  const [rooms, setRooms] = useState<PracticeRoom[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(getTodayKey)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) ?? null

  const { slots, isLoading, lastUpdated, error, refresh, selectSlot, deselectSlot, clearSelection } =
    useAvailableSlots(selectedRoomId, selectedDate)

  const selectedSlots = getSelectedSlots(slots)

  useEffect(() => {
    fetchRooms().then((data) => {
      setRooms(data)
      setSelectedRoomId((current) => current ?? data[0]?.id ?? null)
    })
  }, [])

  const handleConfirm = useCallback(() => {
    if (!selectedRoom || selectedSlots.length === 0) {
      setMessage('Vui lòng chọn phòng và ít nhất một khung giờ.')
      return
    }

    const startSlot = selectedSlots[0]
    const endSlot = selectedSlots[selectedSlots.length - 1]

    if (!startSlot || !endSlot) {
      setMessage('Không xác định được khung giờ đặt phòng.')
      return
    }

    setIsSubmitting(true)
    setMessage('')

    const params = new URLSearchParams({
      source: 'dashboard-booking',
      roomId: selectedRoom.id,
      roomName: selectedRoom.name,
      roomType: selectedRoom.roomTypeName || '',
      roomCapacity: String(selectedRoom.capacity),
      roomLocation: selectedRoom.location || '',
      roomDescription: selectedRoom.description || '',
      roomHighlights: selectedRoom.equipment.join(','),
      pricePerHour: String(selectedRoom.pricePerHour),
      date: selectedDate,
      startTime: startSlot.start,
      endTime: endSlot.end,
      duration: String(selectedSlots.length),
    })

    if (selectedRoom.imageUrl) {
      params.set('roomImage', selectedRoom.imageUrl)
    }

    router.push(`/customer/booking/confirmation?${params.toString()}`)
  }, [router, selectedDate, selectedRoom, selectedSlots])

  return (
    <AuthGuard allowedRoles={['CUSTOMER']}>
      <CustomerShell>
        <CustomerPageHeader
          eyebrow="Đặt lịch tập"
          title="Đặt phòng tập nhạc"
          description="Chọn studio yêu thích, ngày tập và khung giờ trống với dữ liệu lịch phòng từ backend."
          breadcrumbs={[
            { label: 'Trang chủ', href: '/customer/dashboard' },
            { label: 'Đặt phòng' },
          ]}
        />

        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <BookingStepSection
              step={1}
              title="Chọn phòng tập"
              description="Danh sách phòng đang lấy từ backend. Những phần mô tả chi tiết chưa có contract sẽ dùng nhãn hiển thị tối thiểu."
            >
              <div className="grid gap-4 sm:grid-cols-2">
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
            </BookingStepSection>

            <BookingStepSection
              step={2}
              title="Chọn ngày & khung giờ"
              description="Lịch trống được tải từ endpoint BE và tự làm mới mỗi 15 giây."
              action={
                lastUpdated ? (
                  <div className="flex flex-wrap items-center gap-2 rounded-full border border-outline-variant bg-white px-3 py-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-orange opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-orange" />
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      {lastUpdated.toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={refresh}
                      className="rounded-full bg-surface-container-low px-2 py-0.5 font-display text-[10px] font-semibold text-on-surface-variant hover:bg-primary-container/30 hover:text-brand-orange"
                    >
                      Làm mới
                    </button>
                  </div>
                ) : undefined
              }
            >
              <BookingDatePicker
                value={selectedDate}
                onChange={(dateKey) => {
                  setSelectedDate(dateKey)
                  setMessage('')
                }}
              />

              {error && (
                <p className="mt-4 rounded-xl border border-error/20 bg-error-container px-4 py-3 text-xs text-error">
                  {error}
                </p>
              )}

              <div className="mt-6">
                <TimeSlotGrid
                  slots={slots}
                  isLoading={isLoading}
                  selectedCount={selectedSlots.length}
                  onClearSelection={clearSelection}
                  emptyMessage={
                    selectedRoomId
                      ? 'Đang tải lịch trống từ backend...'
                      : '← Chọn phòng ở bước 1 để xem khung giờ.'
                  }
                  hint="Click khung trống để chọn. Chỉ các khung backend trả về là còn khả dụng."
                  onSelect={(id) => {
                    selectSlot(id)
                    setMessage('')
                  }}
                  onDeselect={(id) => {
                    deselectSlot(id)
                    setMessage('')
                  }}
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-4 rounded-xl bg-surface-container-low px-4 py-3 text-[11px] text-on-surface-variant">
                <LegendItem color="bg-white border border-outline" label="Trống" />
                <LegendItem color="bg-gradient-to-br from-brand-orange to-[#FF8C3A]" label="Đã chọn" />
                <LegendItem color="bg-surface-container" label="Đã đặt / không khả dụng" />
                <LegendItem color="bg-surface-container-low" label="Đã qua" />
              </div>
            </BookingStepSection>
          </div>

          <BookingSummary
            room={selectedRoom}
            selectedDate={selectedDate}
            selectedSlots={selectedSlots}
            message={message}
            isSubmitting={isSubmitting}
            onConfirm={handleConfirm}
          />
        </div>
      </CustomerShell>
    </AuthGuard>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={['h-3.5 w-3.5 rounded-md', color].join(' ')} />
      {label}
    </span>
  )
}
