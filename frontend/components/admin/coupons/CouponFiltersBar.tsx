'use client'

import { IconSearch } from '@/components/admin/AdminIcons'
import {
  COUPON_LIFECYCLE_LABELS,
  COUPON_TYPE_LABELS,
} from '@/lib/admin/coupons/adminCouponApi'
import type { CouponDiscountType, CouponFilters, CouponLifecycle } from '@/lib/admin/coupons/types'

type CouponFiltersBarProps = {
  filters: CouponFilters
  onChange: (filters: CouponFilters) => void
  resultCount: number
}

const inputClass =
  'h-11 w-full rounded-xl border border-outline bg-surface-container-lowest px-3 text-sm text-on-surface outline-none transition-all focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/15'

const labelClass =
  'mb-1.5 block font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant'

const quickTypes: (CouponDiscountType | 'ALL')[] = ['ALL', 'PERCENTAGE', 'FIXED_AMOUNT']
const quickLifecycle: (CouponLifecycle | 'ALL')[] = ['ALL', 'ACTIVE', 'NO_EXPIRY', 'EXPIRED']

export default function CouponFiltersBar({ filters, onChange, resultCount }: CouponFiltersBarProps) {
  const set = (patch: Partial<CouponFilters>) => onChange({ ...filters, ...patch })

  const hasActiveFilters =
    filters.query ||
    filters.discountType !== 'ALL' ||
    filters.lifecycle !== 'ALL' ||
    filters.sortBy !== 'code' ||
    filters.sortOrder !== 'asc'

  return (
    <div className="overflow-hidden rounded-2xl border border-outline-variant/80 bg-white shadow-[var(--shadow-card)]">
      <div className="border-b border-outline-variant/60 bg-gradient-to-r from-surface-container-low to-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-sm font-bold text-on-surface">Bo loc coupon</h2>
            <p className="text-xs text-on-surface-variant">
              <span className="font-semibold text-brand-orange">{resultCount}</span> coupon phu hop
            </p>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() =>
                onChange({
                  query: '',
                  discountType: 'ALL',
                  lifecycle: 'ALL',
                  sortBy: 'code',
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
              placeholder="Ma coupon hoac ID..."
              className={[inputClass, 'pl-10'].join(' ')}
            />
          </div>
        </label>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <span className={labelClass}>Loai nhanh</span>
            <div className="flex flex-wrap gap-2">
              {quickTypes.map((type) => {
                const active = filters.discountType === type
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => set({ discountType: type })}
                    className={[
                      'rounded-full px-3 py-1.5 font-display text-xs font-medium transition-all',
                      active
                        ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/25'
                        : 'border border-outline-variant bg-surface-container-low text-on-surface-variant hover:border-brand-orange/30 hover:text-on-surface',
                    ].join(' ')}
                  >
                    {type === 'ALL' ? 'Tat ca' : COUPON_TYPE_LABELS[type]}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <span className={labelClass}>Hieu luc nhanh</span>
            <div className="flex flex-wrap gap-2">
              {quickLifecycle.map((lifecycle) => {
                const active = filters.lifecycle === lifecycle
                return (
                  <button
                    key={lifecycle}
                    type="button"
                    onClick={() => set({ lifecycle })}
                    className={[
                      'rounded-full px-3 py-1.5 font-display text-xs font-medium transition-all',
                      active
                        ? 'bg-secondary text-inverse-on-surface shadow-md shadow-secondary/20'
                        : 'border border-outline-variant bg-surface-container-low text-on-surface-variant hover:border-secondary/30 hover:text-on-surface',
                    ].join(' ')}
                  >
                    {lifecycle === 'ALL' ? 'Tat ca' : COUPON_LIFECYCLE_LABELS[lifecycle]}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className={labelClass}>Loai coupon</span>
            <select
              value={filters.discountType}
              onChange={(event) => set({ discountType: event.target.value as CouponFilters['discountType'] })}
              className={inputClass}
            >
              <option value="ALL">Tat ca</option>
              <option value="PERCENTAGE">{COUPON_TYPE_LABELS.PERCENTAGE}</option>
              <option value="FIXED_AMOUNT">{COUPON_TYPE_LABELS.FIXED_AMOUNT}</option>
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Hieu luc</span>
            <select
              value={filters.lifecycle}
              onChange={(event) => set({ lifecycle: event.target.value as CouponFilters['lifecycle'] })}
              className={inputClass}
            >
              <option value="ALL">Tat ca</option>
              <option value="ACTIVE">{COUPON_LIFECYCLE_LABELS.ACTIVE}</option>
              <option value="NO_EXPIRY">{COUPON_LIFECYCLE_LABELS.NO_EXPIRY}</option>
              <option value="EXPIRED">{COUPON_LIFECYCLE_LABELS.EXPIRED}</option>
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Sap xep theo</span>
            <select
              value={filters.sortBy}
              onChange={(event) => set({ sortBy: event.target.value as CouponFilters['sortBy'] })}
              className={inputClass}
            >
              <option value="code">Ma coupon</option>
              <option value="value">Gia tri</option>
              <option value="minOrderValue">Don toi thieu</option>
              <option value="expiresAt">Ngay het han</option>
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Thu tu</span>
            <select
              value={filters.sortOrder}
              onChange={(event) => set({ sortOrder: event.target.value as CouponFilters['sortOrder'] })}
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
