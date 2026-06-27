'use client'

import { IconSearch } from '@/components/admin/AdminIcons'
import type { RoomCategory, RoomFilters, RoomStatus } from '@/lib/admin/rooms/types'
import {
  roomCategoryLabels,
  roomCategoryOptions,
  roomStatusLabels,
  roomStatusOptions,
} from '@/lib/admin/rooms/types'

type RoomFiltersBarProps = {
  filters: RoomFilters
  onChange: (filters: RoomFilters) => void
  resultCount: number
}

const inputClass =
  'h-11 w-full rounded-xl border border-outline bg-surface-container-lowest px-3 text-sm text-on-surface outline-none transition-all focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/15'

const labelClass =
  'mb-1.5 block font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant'

export default function RoomFiltersBar({ filters, onChange, resultCount }: RoomFiltersBarProps) {
  const set = (patch: Partial<RoomFilters>) => onChange({ ...filters, ...patch })

  const hasActiveFilters =
    filters.query ||
    filters.category !== 'ALL' ||
    filters.status !== 'ALL' ||
    filters.sortBy !== 'updated'

  const quickCategories: (RoomCategory | 'ALL')[] = ['ALL', 'standard', 'band', 'recording', 'premium']
  const quickStatuses: (RoomStatus | 'ALL')[] = ['ALL', 'active', 'occupied', 'maintenance']

  return (
    <section className="overflow-hidden rounded-2xl border border-outline-variant/80 bg-white shadow-[var(--shadow-card)]">
      <div className="border-b border-outline-variant/60 bg-gradient-to-r from-surface-container-low to-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-sm font-bold text-on-surface">Bộ lọc phòng tập</h2>
            <p className="text-xs text-on-surface-variant">
              <span className="font-semibold text-brand-orange">{resultCount}</span> phòng phù hợp
            </p>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() =>
                onChange({
                  query: '',
                  category: 'ALL',
                  status: 'ALL',
                  sortBy: 'updated',
                })
              }
              className="rounded-full border border-outline px-3 py-1.5 font-display text-xs font-medium text-brand-orange transition-colors hover:bg-primary-container/30"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4 p-5">
        <label className="block">
          <span className={labelClass}>Tìm kiếm</span>
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="search"
              value={filters.query}
              onChange={(e) => set({ query: e.target.value })}
              placeholder="Tên phòng, mã phòng..."
              className={[inputClass, 'pl-10'].join(' ')}
            />
          </div>
        </label>

        <div>
          <span className={labelClass}>Hạng phòng nhanh</span>
          <div className="flex flex-wrap gap-2">
            {quickCategories.map((category) => {
              const active = filters.category === category
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => set({ category })}
                  className={[
                    'rounded-full px-3 py-1.5 font-display text-xs font-medium transition-all',
                    active
                      ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/25'
                      : 'border border-outline-variant bg-surface-container-low text-on-surface-variant hover:border-brand-orange/30 hover:text-on-surface',
                  ].join(' ')}
                >
                  {category === 'ALL' ? 'Tất cả' : roomCategoryLabels[category]}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <span className={labelClass}>Trạng thái nhanh</span>
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
                  {status === 'ALL' ? 'Tất cả' : roomStatusLabels[status]}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className={labelClass}>Hạng phòng</span>
            <select
              value={filters.category}
              onChange={(e) => set({ category: e.target.value as RoomFilters['category'] })}
              className={inputClass}
            >
              <option value="ALL">Tất cả</option>
              {roomCategoryOptions.map((category) => (
                <option key={category} value={category}>
                  {roomCategoryLabels[category]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Trạng thái</span>
            <select
              value={filters.status}
              onChange={(e) => set({ status: e.target.value as RoomFilters['status'] })}
              className={inputClass}
            >
              <option value="ALL">Tất cả</option>
              {roomStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {roomStatusLabels[status]}
                </option>
              ))}
            </select>
          </label>

          <label className="block sm:col-span-2">
            <span className={labelClass}>Sắp xếp</span>
            <select
              value={filters.sortBy}
              onChange={(e) => set({ sortBy: e.target.value as RoomFilters['sortBy'] })}
              className={inputClass}
            >
              <option value="updated">Cập nhật mới nhất</option>
              <option value="price-asc">Giá thấp đến cao</option>
              <option value="price-desc">Giá cao đến thấp</option>
              <option value="capacity">Sức chứa lớn nhất</option>
            </select>
          </label>
        </div>
      </div>
    </section>
  )
}
