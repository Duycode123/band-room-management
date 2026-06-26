import { formatEquipmentPrice } from '@/lib/admin/equipment/adminEquipmentApi'
import { EQUIPMENT_TYPE_LABELS } from '@/lib/admin/equipment/equipmentLabels'
import { EQUIPMENT_TYPE_META } from '@/lib/admin/equipment/equipmentTypeMeta'
import type { AdminEquipment } from '@/lib/admin/equipment/types'
import { EquipmentStatusBadge } from './EquipmentBadges'

type EquipmentTableProps = {
  equipment: AdminEquipment[]
  isLoading: boolean
  selectedId: string | null
  onSelect: (item: AdminEquipment) => void
}

export default function EquipmentTable({
  equipment,
  isLoading,
  selectedId,
  onSelect,
}: EquipmentTableProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-52 animate-pulse rounded-2xl border border-outline-variant bg-white shadow-[var(--shadow-card)]"
          />
        ))}
      </div>
    )
  }

  if (equipment.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-outline-variant bg-white px-8 py-16 text-center shadow-[var(--shadow-card)]">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container text-3xl">
          🎵
        </div>
        <p className="font-display text-lg font-bold text-on-surface">Không tìm thấy thiết bị</p>
        <p className="mt-2 text-sm text-on-surface-variant">
          Thử đổi bộ lọc hoặc thêm thiết bị mới vào hệ thống.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {equipment.map((item) => {
        const active = selectedId === item.equipmentId
        const meta = EQUIPMENT_TYPE_META[item.equipmentType]
        const availabilityPct =
          item.quantity > 0 ? Math.round((item.availableQuantity / item.quantity) * 100) : 0

        return (
          <button
            key={item.equipmentId}
            type="button"
            onClick={() => onSelect(item)}
            className={[
              'group relative overflow-hidden rounded-2xl border bg-white text-left shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]',
              active
                ? 'border-brand-orange ring-2 ring-brand-orange/25'
                : 'border-outline-variant/80 hover:border-brand-orange/30',
            ].join(' ')}
          >
            {/* Header visual */}
            <div className={['relative h-28 bg-gradient-to-br', meta.gradient].join(' ')}>
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-90 mix-blend-overlay"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/20 to-transparent" />

              <div className="relative flex h-full items-end justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/60 bg-white/90 text-lg shadow-sm backdrop-blur-sm">
                    {meta.emoji}
                  </div>
                  <div>
                    <p className="font-display text-[10px] font-bold uppercase tracking-wider text-brand-orange">
                      {item.equipmentCode}
                    </p>
                    <p className="text-[11px] text-on-surface-variant">
                      {EQUIPMENT_TYPE_LABELS[item.equipmentType]}
                    </p>
                  </div>
                </div>
                <EquipmentStatusBadge status={item.status} />
              </div>
            </div>

            {/* Body */}
            <div className="p-4 pt-3">
              <h3 className="line-clamp-2 font-display text-base font-bold leading-snug text-on-surface transition-colors group-hover:text-brand-orange">
                {item.equipmentName}
              </h3>
              {item.description && (
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-on-surface-variant">
                  {item.description}
                </p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-surface-container-low px-3 py-2">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
                    Khả dụng
                  </p>
                  <p className="mt-0.5 font-display text-lg font-bold text-on-surface">
                    {item.availableQuantity}
                    <span className="text-sm font-medium text-on-surface-variant">/{item.quantity}</span>
                  </p>
                </div>
                <div className="rounded-xl bg-primary-container/30 px-3 py-2">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-on-primary-container/80">
                    Giá thuê
                  </p>
                  <p className="mt-0.5 font-display text-sm font-bold text-on-primary-container">
                    {formatEquipmentPrice(item.rentalPrice)}
                  </p>
                </div>
              </div>

              {/* Availability bar */}
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-[10px] text-on-surface-variant">
                  <span>Tỷ lệ khả dụng</span>
                  <span className="font-semibold">{availabilityPct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-container">
                  <div
                    className={[
                      'h-full rounded-full transition-all',
                      availabilityPct === 0
                        ? 'bg-error'
                        : availabilityPct < 50
                          ? 'bg-tertiary'
                          : 'bg-secondary-container',
                    ].join(' ')}
                    style={{ width: `${availabilityPct}%` }}
                  />
                </div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
