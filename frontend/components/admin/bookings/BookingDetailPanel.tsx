'use client'

import { useState, type ReactNode } from 'react'
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_OPTIONS,
} from '@/lib/admin/bookingLabels'
import { formatAdminPrice, formatBookingDateTime } from '@/lib/admin/adminBookingApi'
import type { AdminBooking, BookingStatus } from '@/lib/admin/types'
import { BookingStatusBadge, PaymentStatusBadge } from './BookingBadges'

type BookingDetailPanelProps = {
  booking: AdminBooking | null
  onClose: () => void
  onStatusChange: (bookingId: number, status: BookingStatus) => Promise<void>
}

export default function BookingDetailPanel({ booking, onClose, onStatusChange }: BookingDetailPanelProps) {
  const [pendingStatus, setPendingStatus] = useState<BookingStatus | ''>('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  if (!booking) return null

  const handleSaveStatus = async () => {
    if (!pendingStatus || pendingStatus === booking.bookingStatus) return
    setIsSaving(true)
    setMessage('')
    try {
      await onStatusChange(booking.bookingId, pendingStatus)
      setMessage('Cập nhật trạng thái thành công.')
      setPendingStatus('')
    } catch {
      setMessage('Không thể cập nhật trạng thái. Thử lại sau.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Đóng chi tiết"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-inverse-surface/40 backdrop-blur-[2px] lg:bg-transparent lg:backdrop-blur-none"
      />

      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-outline-variant bg-white shadow-[var(--shadow-elevated)]">
        <header className="border-b border-outline-variant px-5 py-4">
          <p className="font-display text-[10px] font-medium uppercase tracking-[0.15em] text-brand-orange">
            Chi tiết đơn
          </p>
          <h2 className="font-display text-lg font-bold text-on-surface">{booking.bookingCode}</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <BookingStatusBadge status={booking.bookingStatus} />
            <PaymentStatusBadge status={booking.paymentStatus} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <Section title="Khách hàng">
            <InfoRow label="Họ tên" value={booking.customerName} />
            <InfoRow label="Email" value={booking.customerEmail} />
            <InfoRow label="SĐT" value={booking.customerPhone} />
          </Section>

          <Section title="Phòng tập">
            <InfoRow label="Phòng" value={booking.roomName} />
            <InfoRow label="Loại phòng" value={booking.roomType} />
          </Section>

          <Section title="Thời gian sử dụng">
            <InfoRow label="Bắt đầu" value={formatBookingDateTime(booking.startTime)} />
            <InfoRow label="Kết thúc" value={formatBookingDateTime(booking.endTime)} />
            <InfoRow label="Thời lượng" value={`${booking.durationHours} giờ`} />
          </Section>

          <Section title="Thiết bị đi kèm">
            {booking.equipment.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5">
                {booking.equipment.map((item) => (
                  <li
                    key={item}
                    className="rounded-md bg-surface-container-low px-2 py-1 text-xs text-on-surface-variant"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-on-surface-variant">Không có thiết bị thuê thêm.</p>
            )}
          </Section>

          <Section title="Thanh toán">
            <InfoRow label="Tổng chi phí" value={formatAdminPrice(booking.totalPrice)} highlight />
          </Section>

          {booking.note && (
            <Section title="Ghi chú">
              <p className="text-sm text-on-surface-variant">{booking.note}</p>
            </Section>
          )}

          <Section title="Cập nhật trạng thái">
            <select
              value={pendingStatus || booking.bookingStatus}
              onChange={(e) => setPendingStatus(e.target.value as BookingStatus)}
              className="h-10 w-full rounded-lg border border-outline bg-white px-3 text-sm outline-none focus:border-brand-orange"
            >
              {BOOKING_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {BOOKING_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={isSaving || !pendingStatus || pendingStatus === booking.bookingStatus}
              onClick={() => void handleSaveStatus()}
              className="mt-3 flex h-10 w-full items-center justify-center rounded-lg bg-brand-orange font-display text-sm font-medium text-white transition-colors hover:bg-brand-orangeHover disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-on-surface-variant"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu trạng thái'}
            </button>
            {message && (
              <p
                className={[
                  'mt-2 text-xs',
                  message.includes('thành công') ? 'text-secondary' : 'text-error',
                ].join(' ')}
              >
                {message}
              </p>
            )}
          </Section>
        </div>

        <footer className="shrink-0 border-t border-outline-variant bg-surface-container-low/50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-outline bg-white px-5 py-2.5 font-display text-sm font-medium text-on-surface-variant hover:text-on-surface"
          >
            Đóng
          </button>
        </footer>
      </aside>
    </>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 font-display text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
        {title}
      </h3>
      <div className="space-y-2 rounded-lg border border-outline-variant bg-surface-container-low/50 p-3">
        {children}
      </div>
    </section>
  )
}

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-on-surface-variant">{label}</span>
      <span
        className={[
          'text-right font-medium',
          highlight ? 'font-display text-brand-orange' : 'text-on-surface',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  )
}
