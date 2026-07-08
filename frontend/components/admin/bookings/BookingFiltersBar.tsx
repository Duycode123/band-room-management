import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_OPTIONS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_OPTIONS,
} from '@/lib/admin/bookingLabels'
import type { BookingFilters } from '@/lib/admin/types'

type BookingFiltersBarProps = {
  filters: BookingFilters
  onChange: (filters: BookingFilters) => void
  resultCount: number
}

export default function BookingFiltersBar({ filters, onChange, resultCount }: BookingFiltersBarProps) {
  const set = (patch: Partial<BookingFilters>) => onChange({ ...filters, ...patch })

  return (
    <div className="rounded-xl border border-outline-variant bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
        <label className="block">
          <span className="mb-1 block font-display text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
            Tìm kiếm
          </span>
          <input
            type="search"
            value={filters.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder="Mã đơn, tên khách, SĐT..."
            className="h-10 w-full rounded-lg border border-outline bg-white px-3 text-sm text-on-surface outline-none transition-colors focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
          />
        </label>

        <label className="block min-w-[10rem]">
          <span className="mb-1 block font-display text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
            Trạng thái booking
          </span>
          <select
            value={filters.bookingStatus}
            onChange={(e) => set({ bookingStatus: e.target.value as BookingFilters['bookingStatus'] })}
            className="h-10 w-full rounded-lg border border-outline bg-white px-3 text-sm text-on-surface outline-none focus:border-brand-orange"
          >
            <option value="ALL">Tất cả</option>
            {BOOKING_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {BOOKING_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>

        <label className="block min-w-[10rem]">
          <span className="mb-1 block font-display text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
            Thanh toán
          </span>
          <select
            value={filters.paymentStatus}
            onChange={(e) => set({ paymentStatus: e.target.value as BookingFilters['paymentStatus'] })}
            className="h-10 w-full rounded-lg border border-outline bg-white px-3 text-sm text-on-surface outline-none focus:border-brand-orange"
          >
            <option value="ALL">Tất cả</option>
            {PAYMENT_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {PAYMENT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>

        <label className="block min-w-[10rem]">
          <span className="mb-1 block font-display text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
            Ngày đặt
          </span>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => set({ date: e.target.value })}
            className="h-10 w-full rounded-lg border border-outline bg-white px-3 text-sm text-on-surface outline-none focus:border-brand-orange"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant pt-3">
        <p className="text-xs text-on-surface-variant">
          <span className="font-semibold text-on-surface">{resultCount}</span> đơn phù hợp
        </p>
        {(filters.query || filters.bookingStatus !== 'ALL' || filters.paymentStatus !== 'ALL' || filters.date) && (
          <button
            type="button"
            onClick={() =>
              onChange({ query: '', bookingStatus: 'ALL', paymentStatus: 'ALL', date: '' })
            }
            className="font-display text-xs font-medium text-brand-orange hover:underline"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>
    </div>
  )
}
