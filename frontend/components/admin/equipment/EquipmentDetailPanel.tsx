'use client'

import { useState } from 'react'
import { formatEquipmentPrice } from '@/lib/admin/equipment/adminEquipmentApi'
import { EQUIPMENT_TYPE_LABELS } from '@/lib/admin/equipment/equipmentLabels'
import { EQUIPMENT_TYPE_META } from '@/lib/admin/equipment/equipmentTypeMeta'
import type { AdminEquipment } from '@/lib/admin/equipment/types'
import { EquipmentStatusBadge } from './EquipmentBadges'

type EquipmentDetailPanelProps = {
  equipment: AdminEquipment | null
  onClose: () => void
  onEdit: (item: AdminEquipment) => void
  onDelete: (id: string) => Promise<void>
}

export default function EquipmentDetailPanel({
  equipment,
  onClose,
  onEdit,
  onDelete,
}: EquipmentDetailPanelProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [message, setMessage] = useState('')

  if (!equipment) return null

  const meta = EQUIPMENT_TYPE_META[equipment.equipmentType]
  const availabilityPct =
    equipment.quantity > 0 ? Math.round((equipment.availableQuantity / equipment.quantity) * 100) : 0

  const handleDelete = async () => {
    setIsDeleting(true)
    setMessage('')
    try {
      await onDelete(equipment.equipmentId)
      onClose()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Không thể xóa thiết bị.')
      setConfirmDelete(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Đóng chi tiết"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-inverse-surface/50 backdrop-blur-sm"
      />

      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-outline-variant bg-white shadow-[var(--shadow-elevated)] sm:max-w-lg">
        {/* Hero header */}
        <div className={['relative shrink-0 bg-gradient-to-br px-5 pb-5 pt-5', meta.gradient].join(' ')}>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/95" />
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/70 bg-white/90 text-2xl shadow-sm">
                  {meta.emoji}
                </div>
                <div>
                  <p className="font-display text-[10px] font-bold uppercase tracking-[0.15em] text-brand-orange">
                    {equipment.equipmentCode}
                  </p>
                  <h2 className="font-display text-xl font-bold leading-tight text-on-surface">
                    {equipment.equipmentName}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-outline-variant/80 bg-white/80 text-on-surface-variant backdrop-blur-sm hover:bg-white"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <EquipmentStatusBadge status={equipment.status} size="md" />
              <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-on-surface-variant backdrop-blur-sm">
                {EQUIPMENT_TYPE_LABELS[equipment.equipmentType]}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {equipment.imageUrl && (
            <div className="mb-4 overflow-hidden rounded-2xl border border-outline-variant shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={equipment.imageUrl}
                alt={equipment.equipmentName}
                className="h-44 w-full object-cover"
                onError={(e) => {
                  e.currentTarget.parentElement!.style.display = 'none'
                }}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Tổng SL" value={String(equipment.quantity)} />
            <MetricCard
              label="Khả dụng"
              value={String(equipment.availableQuantity)}
              accent={equipment.availableQuantity === 0 ? 'error' : 'success'}
            />
            <MetricCard
              label="Giá thuê"
              value={formatEquipmentPrice(equipment.rentalPrice)}
              className="col-span-2"
              accent="price"
            />
          </div>

          <div className="mt-4 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
            <div className="mb-2 flex justify-between text-xs">
              <span className="text-on-surface-variant">Tỷ lệ khả dụng</span>
              <span className="font-display font-bold text-on-surface">{availabilityPct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-container">
              <div
                className={[
                  'h-full rounded-full',
                  availabilityPct === 0 ? 'bg-error' : availabilityPct < 50 ? 'bg-tertiary' : 'bg-secondary-container',
                ].join(' ')}
                style={{ width: `${availabilityPct}%` }}
              />
            </div>
          </div>

          {equipment.description && (
            <Section title="Mô tả">
              <p className="text-sm leading-relaxed text-on-surface-variant">{equipment.description}</p>
            </Section>
          )}

          {equipment.inActiveBooking && (
            <div className="mt-4 flex gap-2 rounded-2xl border border-tertiary-container bg-tertiary-container/30 px-4 py-3 text-xs text-on-tertiary-container">
              <span>⚠</span>
              <span>Thiết bị đang được sử dụng trong đơn đặt phòng — không thể xóa.</span>
            </div>
          )}

          {message && (
            <p className="mt-4 rounded-2xl border border-error/30 bg-error-container/30 px-4 py-3 text-xs text-error">
              {message}
            </p>
          )}
        </div>

        <footer className="shrink-0 space-y-2 border-t border-outline-variant bg-surface-container-low/50 px-5 py-4">
          {confirmDelete ? (
            <div className="space-y-3">
              <p className="text-sm text-on-surface-variant">
                Xác nhận xóa <strong className="text-on-surface">{equipment.equipmentName}</strong>?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl border border-outline py-2.5 font-display text-sm font-medium text-on-surface-variant hover:bg-white disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl bg-error py-2.5 font-display text-sm font-medium text-white hover:bg-error/90 disabled:opacity-50"
                >
                  {isDeleting ? 'Đang xóa...' : 'Xóa thiết bị'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onEdit(equipment)}
                className="flex-1 rounded-xl bg-brand-orange py-2.5 font-display text-sm font-medium text-white shadow-md shadow-brand-orange/20 hover:bg-brand-orangeHover"
              >
                Chỉnh sửa
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={equipment.inActiveBooking}
                title={
                  equipment.inActiveBooking
                    ? 'Thiết bị hiện đang được sử dụng trong hệ thống.'
                    : undefined
                }
                className="flex-1 rounded-xl border border-error/30 py-2.5 font-display text-sm font-medium text-error hover:bg-error-container/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Xóa
              </button>
            </div>
          )}
        </footer>
      </aside>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="mb-2 font-display text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
        {title}
      </h3>
      {children}
    </section>
  )
}

function MetricCard({
  label,
  value,
  accent,
  className,
}: {
  label: string
  value: string
  accent?: 'error' | 'success' | 'price'
  className?: string
}) {
  const valueClass =
    accent === 'error'
      ? 'text-error'
      : accent === 'success'
        ? 'text-secondary'
        : accent === 'price'
          ? 'text-brand-orange'
          : 'text-on-surface'

  const bgClass =
    accent === 'price' ? 'bg-primary-container/25 border-primary-container/40' : 'bg-white border-outline-variant'

  return (
    <div className={['rounded-2xl border p-3', bgClass, className].filter(Boolean).join(' ')}>
      <p className="text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className={['mt-1 font-display text-lg font-bold', valueClass].join(' ')}>{value}</p>
    </div>
  )
}
