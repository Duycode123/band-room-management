import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_OPTIONS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_OPTIONS,
} from '@/lib/admin/bookingLabels'
import { toLocalDateInputValue } from '@/lib/admin/adminBookingApi'
import type { BookingFilters } from '@/lib/admin/types'

type BookingFiltersBarProps = {
  filters: BookingFilters
  onChange: (filters: BookingFilters) => void
  resultCount: number
}

export default function BookingFiltersBar({ filters, onChange, resultCount }: BookingFiltersBarProps) {
  const set = (patch: Partial<BookingFilters>) => onChange({ ...filters, ...patch })

  const today = toLocalDateInputValue()
  const tomorrowDate = new Date()
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrow = toLocalDateInputValue(tomorrowDate)

  const quickDates: { label: string; value: string }[] = [
    { label: 'Hôm nay', value: today },
    { label: 'Ngày mai', value: tomorrow },
  ]

  return (
    <div className="rounded-xl border border-outline-variant bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="font-display text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
          Xem nhanh
        </span>
        {quickDates.map((item) => {
          const active = filters.date === item.value
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => set({ date: active ? '' : item.value })}
              className={[
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                active
                  ? 'bg-brand-orange text-white shadow-sm'
                  : 'border border-outline-variant bg-surface-container-low text-on-surface hover:border-brand-orange/40 hover:text-brand-orange',
              ].join(' ')}
            >
              {item.label}
            </button>
          )
        })}
        {filters.date && filters.date !== today && filters.date !== tomorrow && (
          <span className="rounded-lg border border-brand-orange/30 bg-primary-container/40 px-3 py-1.5 text-xs font-semibold text-brand-orange">
            Đang lọc ngày đã chọn
          </span>
        )}
      </div>

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
            Ngày sử dụng
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
          <span className="font-semibold text-on-surface">{resultCount}</span> đơn · nhóm theo ngày sử dụng
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
