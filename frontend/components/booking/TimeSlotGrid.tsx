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
  booked: 'border-outline-variant bg-surface-container text-on-surface-variant/50 cursor-not-allowed',
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

  const showSelectionBar = selectedCount > 0 && onClearSelection

  return (
    <div className="space-y-3">
      {(showSelectionBar || hint) && (
        <div className="space-y-2">
          {showSelectionBar && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center justify-between gap-3 rounded-lg border border-outline-variant bg-white px-3 py-2.5 shadow-[var(--shadow-card)]"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-brand-orange px-1 font-display text-xs font-bold tabular-nums text-white"
                  aria-hidden
                >
                  {selectedCount}
                </span>
                <p className="truncate font-display text-sm font-medium text-on-surface">khung giờ đã chọn</p>
              </div>

              <button
                type="button"
                onClick={onClearSelection}
                aria-label={`Xóa tất cả ${selectedCount} khung giờ đã chọn`}
                className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-outline bg-surface-container-low py-1.5 pl-1.5 pr-3.5 font-display text-sm font-semibold text-on-surface shadow-sm transition-all hover:border-error/35 hover:bg-error-container/50 hover:text-error active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-on-surface-variant shadow-sm transition-colors group-hover:bg-error-container group-hover:text-error">
                  <CloseIcon />
                </span>
                Xóa tất cả
              </button>
            </div>
          )}

          {hint && selectedCount === 0 && (
            <p className="rounded-lg bg-surface-container-low px-3 py-2.5 text-xs leading-relaxed text-on-surface-variant">
              {hint}
            </p>
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

function CloseIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
