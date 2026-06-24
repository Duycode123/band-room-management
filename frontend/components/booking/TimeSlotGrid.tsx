import type { TimeSlot } from '@/lib/booking/types'

type TimeSlotGridProps = {
  slots: TimeSlot[]
  isLoading: boolean
  onSelect: (slotId: string) => void
}

const statusStyles: Record<TimeSlot['status'], string> = {
  available:
    'border-outline bg-white text-on-surface hover:border-brand-orange hover:bg-primary-container/20 cursor-pointer',
  selected: 'border-brand-orange bg-brand-orange text-white cursor-pointer ring-2 ring-brand-orange/30',
  booked: 'border-outline-variant bg-surface-container text-on-surface-variant/50 cursor-not-allowed line-through',
  past: 'border-outline-variant bg-surface-container-low text-on-surface-variant/40 cursor-not-allowed',
}

const statusLabel: Record<TimeSlot['status'], string> = {
  available: 'Trống',
  selected: 'Đã chọn',
  booked: 'Đã đặt',
  past: 'Đã qua',
}

export default function TimeSlotGrid({ slots, isLoading, onSelect }: TimeSlotGridProps) {
  if (isLoading && slots.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-surface-container" />
        ))}
      </div>
    )
  }

  if (slots.length === 0) {
    return <p className="text-sm text-on-surface-variant">Chọn phòng và ngày để xem lịch trống.</p>
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {slots.map((slot) => {
        const disabled = slot.status === 'booked' || slot.status === 'past'
        return (
          <button
            key={slot.id}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onSelect(slot.id)}
            className={[
              'rounded-lg border px-3 py-3 text-left transition-all',
              statusStyles[slot.status],
            ].join(' ')}
          >
            <p className="font-display text-sm font-semibold">{slot.start}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider opacity-80">{statusLabel[slot.status]}</p>
          </button>
        )
      })}
    </div>
  )
}
