import type { PracticeRoom } from '@/lib/booking/types'
import { formatPrice } from '@/lib/booking/bookingApi'

type RoomCardProps = {
  room: PracticeRoom
  selected: boolean
  onSelect: () => void
}

export default function RoomCard({ room, selected, onSelect }: RoomCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'w-full rounded-xl border p-4 text-left transition-all',
        'hover:shadow-[var(--shadow-elevated)]',
        selected
          ? 'border-brand-orange bg-primary-container/30 ring-2 ring-brand-orange/40'
          : 'border-outline-variant bg-white shadow-[var(--shadow-card)] hover:border-brand-orange/40',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-base font-semibold text-on-surface">{room.name}</h3>
          <p className="mt-1 text-xs text-on-surface-variant">Tối đa {room.capacity} người</p>
        </div>
        {room.isVip && (
          <span className="shrink-0 rounded-full bg-tertiary-container px-2 py-0.5 font-display text-[10px] font-semibold uppercase tracking-wider text-on-tertiary-container">
            VIP
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {room.equipment.slice(0, 3).map((item) => (
          <span
            key={item}
            className="rounded-md bg-surface-container-low px-2 py-0.5 text-[11px] text-on-surface-variant"
          >
            {item}
          </span>
        ))}
      </div>

      <p className="mt-3 font-display text-sm font-semibold text-brand-orange">
        {formatPrice(room.pricePerHour)}
        <span className="font-sans text-xs font-normal text-on-surface-variant"> / giờ</span>
      </p>
    </button>
  )
}
