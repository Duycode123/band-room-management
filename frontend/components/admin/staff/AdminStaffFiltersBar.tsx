import { IconSearch } from '@/components/admin/AdminIcons'
import type { StaffAccountFilters } from '@/lib/admin/staff/adminStaffApi'

type AdminStaffFiltersBarProps = {
  filters: StaffAccountFilters
  resultCount: number
  onChange: (filters: StaffAccountFilters) => void
}

const selectClass =
  'h-11 rounded-xl border border-outline-variant bg-white px-3 font-display text-sm font-medium text-on-surface outline-none transition focus:border-brand-orange'

export default function AdminStaffFiltersBar({ filters, resultCount, onChange }: AdminStaffFiltersBarProps) {
  return (
    <section className="rounded-2xl border border-outline-variant bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block min-w-0 flex-1">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            value={filters.query}
            onChange={(event) => onChange({ ...filters, query: event.target.value })}
            placeholder="Search by name, email, phone, staff ID"
            className="h-11 w-full rounded-xl border border-outline-variant bg-surface-container-low pl-9 pr-3 text-sm text-on-surface outline-none transition focus:border-brand-orange focus:bg-white"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={filters.status}
            onChange={(event) =>
              onChange({ ...filters, status: event.target.value as StaffAccountFilters['status'] })
            }
            className={selectClass}
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active only</option>
            <option value="DISABLED">Disabled only</option>
          </select>

          <select
            value={filters.verification}
            onChange={(event) =>
              onChange({ ...filters, verification: event.target.value as StaffAccountFilters['verification'] })
            }
            className={selectClass}
          >
            <option value="ALL">All email states</option>
            <option value="VERIFIED">Verified</option>
            <option value="UNVERIFIED">Unverified</option>
          </select>

          <p className="rounded-xl bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface-variant">
            {resultCount} results
          </p>
        </div>
      </div>
    </section>
  )
}
