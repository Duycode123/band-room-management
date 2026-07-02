'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import BookingSchedulePicker from '@/components/booking/BookingSchedulePicker'
import {
  DEFAULT_DURATION,
  formatCurrency,
  getTodayDateString,
  getRoomSubtotal,
  isApiBackedBookingRoom,
  normalizeDuration,
  type BookingRoom,
} from '@/components/booking/booking-data'
import type { BookingScheduleValue } from '@/components/booking/booking-time-utils'

type BookingQuickModalProps = {
  room: BookingRoom
  open: boolean
  initialDate?: string
  initialStartTime?: string
  initialDuration?: number
  onClose: () => void
}

export default function BookingQuickModal({
  room,
  open,
  initialDate,
  initialStartTime,
  initialDuration,
  onClose,
}: BookingQuickModalProps) {
  const router = useRouter()
  const hasInitialTime = Boolean(initialStartTime && initialDuration && initialDuration > 0)
  const [date, setDate] = useState(initialDate || getTodayDateString())
  const [startTime, setStartTime] = useState(hasInitialTime ? initialStartTime || '' : '')
  const [duration, setDuration] = useState(hasInitialTime ? normalizeDuration(initialDuration ?? DEFAULT_DURATION) : 0)
  const [endTime, setEndTime] = useState('')
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const roomSubtotal = useMemo(() => getRoomSubtotal(room, duration), [room, duration])

  useEffect(() => {
    if (!open) return

    setDate(initialDate || getTodayDateString())
    const shouldPrefillTime = Boolean(initialStartTime && initialDuration && initialDuration > 0)
    setStartTime(shouldPrefillTime ? initialStartTime || '' : '')
    setDuration(shouldPrefillTime ? normalizeDuration(initialDuration ?? DEFAULT_DURATION) : 0)
    setEndTime('')
    setSelectedSlots([])
    setNote('')
    setError('')
  }, [initialDate, initialDuration, initialStartTime, open, room.id])

  if (!open) return null

  const handleScheduleChange = useCallback((value: BookingScheduleValue) => {
    setDate(value.date)
    setStartTime(value.startTime)
    setEndTime(value.endTime)
    setDuration(value.duration)
    setSelectedSlots(value.selectedSlots)
    setError('')
  }, [])

  const handleContinue = () => {
    if (!date || !startTime || !endTime || duration < 1 || selectedSlots.length === 0) {
      setError('Vui long chon khung gio dat phong.')
      return
    }

    const params = new URLSearchParams({
      roomId: room.id,
      date,
      startTime,
      endTime,
      duration: String(duration),
      slots: selectedSlots.join(','),
      note,
    })

    if (isApiBackedBookingRoom(room)) {
      params.set('source', 'api-booking')
      params.set('roomName', room.name)
      params.set('roomType', room.type)
      params.set('roomCapacity', room.capacity.replace(/[^\d]/g, ''))
      params.set('roomLocation', room.location)
      if (room.description) {
        params.set('roomDescription', room.description)
      }
      params.set('roomHighlights', room.includedEquipments.join(','))
      params.set('pricePerHour', String(room.pricePerHour))
      if (room.image) {
        params.set('roomImage', room.image)
      }
    }

    router.push(`/customer/booking/confirmation?${params.toString()}`)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-[620px] overflow-y-auto rounded-[24px] border border-[#E8E4DC] bg-white p-6 shadow-[0_12px_48px_rgba(26,28,30,0.18)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-[#FF7518]">Dat phong</p>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#1A1C1E]">Xac nhan nhanh</h2>
            <p className="mt-1 text-sm text-[#5C5348]">
              Quick booking nay da bo add-on mock va chi giu thong tin ma backend hien dang xu ly duoc.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E8E4DC] text-xl leading-none text-[#5C5348] transition hover:bg-[#FAF8F4]"
            aria-label="Dong modal"
          >
            X
          </button>
        </div>

        <div className="grid gap-5 sm:grid-cols-[170px_1fr]">
          {room.image ? (
            <Image
              src={room.image}
              alt={room.name}
              width={340}
              height={250}
              className={`h-[150px] w-full rounded-2xl object-cover ${room.imageClassName}`}
              priority
            />
          ) : (
            <div className="flex h-[150px] w-full items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top,#FFE8D6,transparent_55%),linear-gradient(135deg,#F5F2EC,#E8E4DC)] px-4 text-center">
              <div>
                <p className="font-display text-lg font-bold text-[#6B3200]">{room.name}</p>
                <p className="mt-2 text-sm text-[#5C5348]">Backend chua cung cap anh phong.</p>
              </div>
            </div>
          )}

          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="font-display text-xl font-bold text-[#1A1C1E]">{room.name}</h3>
              {room.badge && (
                <span className="rounded-full bg-[#FFE8D6] px-3 py-1 font-display text-xs font-semibold uppercase tracking-wide text-[#6B3200]">
                  {room.badge}
                </span>
              )}
              {typeof room.rating === 'number' && (
                <span className="font-display text-sm font-semibold text-[#B45309]">★ {room.rating.toFixed(1)}</span>
              )}
            </div>

            <div className="space-y-2 text-sm text-[#5C5348]">
              <p>{room.type}</p>
              <p>{room.capacity}</p>
            </div>

            <p className="mt-4 font-display text-2xl font-bold text-[#1A1C1E]">
              {formatCurrency(room.pricePerHour)}
              <span className="ml-1 text-sm font-medium text-[#5C5348]">/ gio</span>
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {room.equipments.map((item) => (
            <span key={item} className="rounded-full bg-[#F0EDE6] px-3 py-1 text-sm text-[#5C5348]">
              {item}
            </span>
          ))}
        </div>

        <BookingSchedulePicker
          key={`${room.id}-${initialDate ?? 'today'}-${initialStartTime ?? 'empty'}-${initialDuration ?? 0}`}
          roomId={room.id}
          initialDate={date}
          initialStartTime={startTime}
          initialDuration={duration}
          onChange={handleScheduleChange}
          className="mt-6"
        />

        <section className="mt-6 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-4 text-sm text-[#5C5348]">
          Add-on hien khong con duoc de xuat trong quick booking vi backend chua co contract phan nay.
        </section>

        <Field label="Ghi chu khach hang" className="mt-6 block">
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            placeholder="Vi du: Can chuan bi phong truoc 15 phut, uu tien am thanh vocal ro."
            className="w-full resize-none rounded-2xl border border-[#C9C2B6] bg-white px-3 py-3 text-sm text-[#1A1C1E] outline-none transition placeholder:text-[#8A8176] focus:border-[#FF7518] focus:ring-2 focus:ring-[#FF7518]/20"
          />
        </Field>

        <div className="mt-5 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-4">
          <SummaryRow label="Gia phong" value={`${formatCurrency(room.pricePerHour)} / gio`} />
          <SummaryRow label="Thoi luong" value={duration > 0 ? `${duration} gio` : 'Chua chon'} />
          <SummaryRow label="Khung gio" value={startTime && endTime ? `${startTime} - ${endTime}` : 'Chua chon'} />
          <SummaryRow label="Tien phong" value={formatCurrency(roomSubtotal)} />
          <SummaryRow label="Dich vu thue them" value="Khong ap dung" />
          <div className="my-3 h-px bg-[#E8E4DC]" />
          <div className="flex items-center justify-between">
            <span className="font-display font-semibold text-[#1A1C1E]">Tam tinh</span>
            <span className="font-display text-2xl font-bold text-[#FF7518]">{formatCurrency(roomSubtotal)}</span>
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-2xl border border-[#C62828]/20 bg-[#FFEBEE] px-4 py-3 text-sm text-[#C62828]">
            {error}
          </p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-2xl border border-[#C9C2B6] bg-transparent font-display font-semibold text-[#1A1C1E] transition hover:bg-[#FAF8F4]"
          >
            Huy
          </button>

          <button
            type="button"
            onClick={handleContinue}
            disabled={duration < 1 || selectedSlots.length === 0}
            className="h-12 rounded-2xl bg-[#FF7518] font-display font-semibold text-white transition hover:bg-[#E6640F] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Tiep tuc dat phong
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={className}>
      <span className="mb-1 block font-display text-xs font-bold uppercase tracking-wider text-[#5C5348]">
        {label}
      </span>
      {children}
    </label>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-[#5C5348]">{label}</span>
      <span className="font-semibold text-[#1A1C1E]">{value}</span>
    </div>
  )
}
