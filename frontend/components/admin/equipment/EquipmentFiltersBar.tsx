'use client'

import {
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_STATUS_OPTIONS,
  EQUIPMENT_TYPE_LABELS,
  EQUIPMENT_TYPE_OPTIONS,
} from '@/lib/admin/equipment/equipmentLabels'
import type { EquipmentFilters, EquipmentStatus, EquipmentType } from '@/lib/admin/equipment/types'
import { IconSearch } from '@/components/admin/AdminIcons'

type EquipmentFiltersBarProps = {
  filters: EquipmentFilters
  onChange: (filters: EquipmentFilters) => void
  resultCount: number
}

const inputClass =
  'h-11 w-full rounded-xl border border-outline bg-surface-container-lowest px-3 text-sm text-on-surface outline-none transition-all focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/15'

const labelClass =
  'mb-1.5 block font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant'

export default function EquipmentFiltersBar({ filters, onChange, resultCount }: EquipmentFiltersBarProps) {
  const set = (patch: Partial<EquipmentFilters>) => onChange({ ...filters, ...patch })

  const hasActiveFilters =
    filters.query ||
    filters.equipmentType !== 'ALL' ||
    filters.status !== 'ALL' ||
    filters.sortBy !== 'name' ||
    filters.sortOrder !== 'asc'

  const quickTypes: (EquipmentType | 'ALL')[] = ['ALL', 'AMP', 'MIC', 'DRUM', 'GUITAR']
  const quickStatuses: (EquipmentStatus | 'ALL')[] = ['ALL', 'GOOD', 'BROKEN', 'MAINTENANCE']

  return (
    <div className="overflow-hidden rounded-2xl border border-outline-variant/80 bg-white shadow-[var(--shadow-card)]">
      <div className="border-b border-outline-variant/60 bg-gradient-to-r from-surface-container-low to-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-sm font-bold text-on-surface">Bo loc va tim kiem</h2>
            <p className="text-xs text-on-surface-variant">
              <span className="font-semibold text-brand-orange">{resultCount}</span> thiet bi phu hop
            </p>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() =>
                onChange({
                  query: '',
                  equipmentType: 'ALL',
                  status: 'ALL',
                  sortBy: 'name',
                  sortOrder: 'asc',
                })
              }
              className="rounded-full border border-outline px-3 py-1.5 font-display text-xs font-medium text-brand-orange transition-colors hover:bg-primary-container/30"
            >
              Xoa bo loc
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4 p-5">
        <label className="block">
          <span className={labelClass}>Tim kiem</span>
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="search"
              value={filters.query}
              onChange={(event) => set({ query: event.target.value })}
              placeholder="Ten thiet bi, phong, ma EQ..."
              className={[inputClass, 'pl-10'].join(' ')}
            />
          </div>
        </label>

        <div>
          <span className={labelClass}>Loai nhanh</span>
          <div className="flex flex-wrap gap-2">
            {quickTypes.map((type) => {
              const active = filters.equipmentType === type
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => set({ equipmentType: type })}
                  className={[
                    'rounded-full px-3 py-1.5 font-display text-xs font-medium transition-all',
                    active
                      ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/25'
                      : 'border border-outline-variant bg-surface-container-low text-on-surface-variant hover:border-brand-orange/30 hover:text-on-surface',
                  ].join(' ')}
                >
                  {type === 'ALL' ? 'Tat ca' : EQUIPMENT_TYPE_LABELS[type]}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <span className={labelClass}>Trang thai nhanh</span>
          <div className="flex flex-wrap gap-2">
            {quickStatuses.map((status) => {
              const active = filters.status === status
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => set({ status })}
                  className={[
                    'rounded-full px-3 py-1.5 font-display text-xs font-medium transition-all',
                    active
                      ? 'bg-secondary text-inverse-on-surface shadow-md shadow-secondary/20'
                      : 'border border-outline-variant bg-surface-container-low text-on-surface-variant hover:border-secondary/30 hover:text-on-surface',
                  ].join(' ')}
                >
                  {status === 'ALL' ? 'Tat ca' : EQUIPMENT_STATUS_LABELS[status]}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className={labelClass}>Loai chi tiet</span>
            <select
              value={filters.equipmentType}
              onChange={(event) => set({ equipmentType: event.target.value as EquipmentFilters['equipmentType'] })}
              className={inputClass}
            >
              <option value="ALL">Tat ca</option>
              {EQUIPMENT_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {EQUIPMENT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Trang thai</span>
            <select
              value={filters.status}
              onChange={(event) => set({ status: event.target.value as EquipmentFilters['status'] })}
              className={inputClass}
            >
              <option value="ALL">Tat ca</option>
              {EQUIPMENT_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {EQUIPMENT_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Sap xep theo</span>
            <select
              value={filters.sortBy}
              onChange={(event) => set({ sortBy: event.target.value as EquipmentFilters['sortBy'] })}
              className={inputClass}
            >
              <option value="name">Ten</option>
              <option value="room">Phong</option>
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Thu tu</span>
            <select
              value={filters.sortOrder}
              onChange={(event) => set({ sortOrder: event.target.value as EquipmentFilters['sortOrder'] })}
              className={inputClass}
            >
              <option value="asc">Tang dan</option>
              <option value="desc">Giam dan</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  )
}
