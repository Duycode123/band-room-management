import type { RoomCategory, RoomStatus } from '@/lib/admin/rooms/types'
import { roomCategoryLabels, roomStatusLabels } from '@/lib/admin/rooms/types'

const statusStyles: Record<RoomStatus, string> = {
  active: 'border-secondary-container/50 bg-secondary-container/25 text-secondary',
  occupied: 'border-primary-container bg-primary-container/35 text-on-primary-container',
  maintenance: 'border-tertiary-container bg-tertiary-container/40 text-on-tertiary-container',
  inactive: 'border-outline-variant bg-surface-container text-on-surface-variant',
}

const categoryStyles: Record<RoomCategory, string> = {
  standard: 'border-outline-variant bg-surface-container-low text-on-surface-variant',
  band: 'border-primary-container bg-primary-container/25 text-on-primary-container',
  recording: 'border-secondary-container/50 bg-secondary-container/20 text-secondary',
  premium: 'border-tertiary-container bg-tertiary-container/35 text-on-tertiary-container',
}

type BadgeSize = 'sm' | 'md'

const sizeClass: Record<BadgeSize, string> = {
  sm: 'px-2 py-1 text-[10px]',
  md: 'px-3 py-1.5 text-xs',
}

export function RoomStatusBadge({
  status,
  size = 'sm',
}: {
  status: RoomStatus
  size?: BadgeSize
}) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border font-display font-semibold',
        sizeClass[size],
        statusStyles[status],
      ].join(' ')}
    >
      {roomStatusLabels[status]}
    </span>
  )
}

export function RoomCategoryBadge({
  category,
  size = 'sm',
}: {
  category: RoomCategory
  size?: BadgeSize
}) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border font-display font-semibold',
        sizeClass[size],
        categoryStyles[category],
      ].join(' ')}
    >
      {roomCategoryLabels[category]}
    </span>
  )
}
