'use client'

import Image from 'next/image'
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { formatCurrency, type BookingRoom } from '@/components/booking/booking-data'

type BookingRoomCardProps = {
  room: BookingRoom
  renderIcon: (name: 'star' | 'users' | 'clock', className?: string) => ReactNode
  onOpenDetail?: (room: BookingRoom) => void
  onBook?: (room: BookingRoom) => void
}

export default function BookingRoomCard({ room, renderIcon, onOpenDetail, onBook }: BookingRoomCardProps) {
  const openDetail = () => {
    onOpenDetail?.(room)
  }

  const handleBook = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onBook?.(room)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.currentTarget !== event.target) return
    if (event.key !== 'Enter' && event.key !== ' ') return

    event.preventDefault()
    openDetail()
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={handleKeyDown}
      aria-label={`Xem chi tiết ${room.name}`}
      className="group cursor-pointer overflow-hidden rounded-xl border border-outline-variant bg-white shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-[#FF7518]/40 hover:shadow-[0_16px_44px_rgba(26,28,30,0.12)] focus:outline-none focus-visible:-translate-y-1 focus-visible:border-[#FF7518]/60 focus-visible:ring-4 focus-visible:ring-[#FF7518]/18"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-container">
        <Image
          src={room.image}
          alt={room.name}
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          className={`object-cover transition-transform duration-300 group-hover:scale-105 ${room.imageClassName}`}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(4,42,22,0.6),rgba(4,42,22,0.08)_58%,transparent)] transition-opacity duration-300 group-hover:opacity-90" />
        <span className="absolute left-3 top-3 rounded-full bg-primary-container px-3 py-1 font-display text-xs font-semibold text-on-primary-container">
          {room.badge}
        </span>
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 font-display text-xs font-semibold text-on-surface">
          {renderIcon('star', 'h-3.5 w-3.5 text-tertiary')}
          {room.rating}
        </span>
      </div>

      <div className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-xs font-semibold uppercase text-on-surface-variant">{room.categoryLabel}</p>
          <span className="rounded-full bg-surface-container px-2.5 py-1 text-xs font-medium text-on-surface-variant">
            {room.type}
          </span>
        </div>
        <h3 className="mt-1.5 font-display text-xl font-bold text-on-surface">{room.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-on-surface-variant">{room.description}</p>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            {renderIcon('users', 'h-3.5 w-3.5')}
            {room.capacity}
          </span>
          <span className="flex items-center gap-1.5">
            {renderIcon('clock', 'h-3.5 w-3.5')}
            Tính theo giờ
          </span>
          <span
            className={[
              'rounded-full px-2.5 py-1 font-display font-semibold',
              room.isAvailable ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container text-on-surface-variant',
            ].join(' ')}
          >
            {room.isAvailable
              ? room.nextAvailableTime
                ? `Trống từ ${room.nextAvailableTime}`
                : 'Còn trống hôm nay'
              : 'Kín lịch hôm nay'}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {room.equipments.map((gear) => (
            <span
              key={gear}
              className="rounded-lg border border-outline-variant bg-surface-container px-2.5 py-1 font-display text-xs font-medium text-on-surface-variant"
            >
              {gear}
            </span>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-outline-variant pt-4">
          <div>
            <span className="font-display text-2xl font-bold text-on-surface">{formatCurrency(room.pricePerHour)}</span>
            <span className="text-xs text-on-surface-variant"> / giờ</span>
          </div>
          <button
            type="button"
            onClick={handleBook}
            className="rounded-lg bg-brand-orange px-4 py-2.5 font-display text-xs font-semibold text-white shadow-[0_10px_26px_rgba(255,117,24,0.22)] transition-all duration-300 hover:bg-brand-orangeHover group-hover:shadow-[0_14px_32px_rgba(255,117,24,0.3)]"
          >
            {room.isAvailable ? 'Đặt ngay' : 'Chọn ngày khác'}
          </button>
        </div>
      </div>
    </article>
  )
}
