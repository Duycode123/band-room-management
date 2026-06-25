import type { TimeSlot } from '@/lib/booking/types'

type TimeSlotGridProps = {
  slots: TimeSlot[]
  isLoading: boolean
  onSelect: (slotId: string) => void
  onDeselect: (slotId: string) => void
  hint?: string
  emptyMessage?: string
  selectedCount?: number
  onClearSelection?: () => void
}

const statusStyles: Record<TimeSlot['status'], string> = {
  available:
    'border-outline bg-white text-on-surface hover:border-brand-orange hover:bg-primary-container/20 cursor-pointer active:scale-[0.98]',
  selected:
    'border-brand-orange bg-brand-orange text-white cursor-pointer ring-2 ring-brand-orange/30 active:scale-[0.98]',
  booked: 'border-outline-variant bg-surface-container text-on-surface-variant/50 cursor-not-allowed line-through',
  past: 'border-outline-variant bg-surface-container-low text-on-surface-variant/40 cursor-not-allowed',
}

export default function TimeSlotGrid({
  slots,
  isLoading,
  onSelect,
  onDeselect,
  hint,
  emptyMessage = 'Chọn phòng và ngày để xem lịch trống.',
  selectedCount = 0,
  onClearSelection,
}: TimeSlotGridProps) {
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
    return (
      <p className="rounded-lg border border-dashed border-outline-variant bg-surface-container-low px-4 py-6 text-center text-sm text-on-surface-variant">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {hint && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2">
          <p className="text-xs text-on-surface-variant">{hint}</p>
          {selectedCount > 0 && onClearSelection && (
            <button
              type="button"
              onClick={onClearSelection}
              className="shrink-0 font-display text-[11px] font-medium text-brand-orange hover:underline"
            >
              Xóa tất cả ({selectedCount})
            </button>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {slots.map((slot) => {
          const disabled = slot.status === 'booked' || slot.status === 'past'
          return (
            <button
              key={slot.id}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (disabled) return
                if (slot.status === 'selected') {
                  onDeselect(slot.id)
                  return
                }
                onSelect(slot.id)
              }}
              aria-pressed={slot.status === 'selected'}
              className={[
                'flex items-center justify-center rounded-lg border px-3 py-3 transition-all select-none',
                statusStyles[slot.status],
              ].join(' ')}
            >
              <p className="font-display text-sm font-semibold">{slot.start}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
