import {
  formatCouponDate,
  formatCouponMoney,
  formatCouponValue,
} from '@/lib/admin/coupons/adminCouponApi'
import type { AdminCoupon } from '@/lib/admin/coupons/types'
import { CouponLifecycleBadge, CouponTypeBadge } from './CouponBadges'

type CouponTableProps = {
  coupons: AdminCoupon[]
  isLoading: boolean
  selectedId: number | null
  onSelect: (coupon: AdminCoupon) => void
  onEdit: (coupon: AdminCoupon) => void
  onDelete: (coupon: AdminCoupon) => void
}

const actionClass =
  'rounded-lg border border-outline-variant px-2.5 py-1.5 font-display text-xs font-medium text-on-surface-variant transition-colors hover:border-brand-orange/40 hover:text-brand-orange'

export default function CouponTable({
  coupons,
  isLoading,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
}: CouponTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-outline-variant/80 bg-white p-4 shadow-[var(--shadow-card)]">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-xl bg-surface-container-low" />
          ))}
        </div>
      </div>
    )
  }

  if (coupons.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-outline-variant bg-white px-8 py-16 text-center shadow-[var(--shadow-card)]">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container text-lg font-bold text-brand-orange">
          %
        </div>
        <p className="font-display text-lg font-bold text-on-surface">Khong tim thay coupon</p>
        <p className="mt-2 text-sm text-on-surface-variant">Thu doi bo loc hoac tao ma coupon moi.</p>
      </div>
    )
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-outline-variant/80 bg-white shadow-[var(--shadow-card)] lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full border-collapse text-left">
            <thead className="bg-surface-container-low text-[10px] uppercase tracking-[0.12em] text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 font-display font-semibold">Ma coupon</th>
                <th className="px-4 py-3 font-display font-semibold">Loai</th>
                <th className="px-4 py-3 font-display font-semibold">Gia tri</th>
                <th className="px-4 py-3 font-display font-semibold">Don toi thieu</th>
                <th className="px-4 py-3 font-display font-semibold">Het han</th>
                <th className="px-4 py-3 font-display font-semibold">Trang thai</th>
                <th className="px-4 py-3 font-display font-semibold">Thao tac</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/70">
              {coupons.map((coupon) => {
                const selected = selectedId === coupon.couponId
                return (
                  <tr
                    key={coupon.couponId}
                    className={[
                      'transition-colors',
                      selected ? 'bg-primary-container/20' : 'hover:bg-surface-container-lowest',
                    ].join(' ')}
                  >
                    <td className="px-4 py-4">
                      <p className="font-display text-sm font-bold text-on-surface">{coupon.code}</p>
                      <p className="mt-0.5 text-xs font-medium text-brand-orange">
                        CP-{String(coupon.couponId).padStart(4, '0')}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <CouponTypeBadge type={coupon.discountType} />
                    </td>
                    <td className="px-4 py-4 font-display text-sm font-bold text-brand-orange">
                      {formatCouponValue(coupon)}
                    </td>
                    <td className="px-4 py-4 text-sm text-on-surface-variant">
                      {formatCouponMoney(coupon.minOrderValue)}
                    </td>
                    <td className="px-4 py-4 text-sm text-on-surface-variant">
                      {formatCouponDate(coupon.expiresAt)}
                    </td>
                    <td className="px-4 py-4">
                      <CouponLifecycleBadge lifecycle={coupon.lifecycle} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => onSelect(coupon)} className={actionClass}>
                          Chi tiet
                        </button>
                        <button type="button" onClick={() => onEdit(coupon)} className={actionClass}>
                          Sua
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(coupon)}
                          className="rounded-lg border border-error/25 px-2.5 py-1.5 font-display text-xs font-medium text-error transition-colors hover:bg-error-container/30"
                        >
                          Xoa
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 lg:hidden">
        {coupons.map((coupon) => (
          <article
            key={coupon.couponId}
            className={[
              'rounded-2xl border bg-white p-4 shadow-[var(--shadow-card)]',
              selectedId === coupon.couponId
                ? 'border-brand-orange ring-2 ring-brand-orange/20'
                : 'border-outline-variant/80',
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg font-bold text-on-surface">{coupon.code}</p>
                <p className="mt-0.5 text-xs font-semibold text-brand-orange">
                  CP-{String(coupon.couponId).padStart(4, '0')}
                </p>
              </div>
              <CouponLifecycleBadge lifecycle={coupon.lifecycle} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <CouponTypeBadge type={coupon.discountType} />
              <span className="rounded-full bg-surface-container px-2.5 py-1 font-display text-[11px] font-semibold text-on-surface">
                {formatCouponValue(coupon)}
              </span>
            </div>

            <div className="mt-4 grid gap-2 border-y border-outline-variant/70 py-3 text-sm">
              <p className="text-on-surface-variant">
                Don toi thieu <span className="font-semibold text-on-surface">{formatCouponMoney(coupon.minOrderValue)}</span>
              </p>
              <p className="text-on-surface-variant">
                Het han <span className="font-semibold text-on-surface">{formatCouponDate(coupon.expiresAt)}</span>
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => onSelect(coupon)} className={actionClass}>
                Chi tiet
              </button>
              <button type="button" onClick={() => onEdit(coupon)} className={actionClass}>
                Sua
              </button>
              <button
                type="button"
                onClick={() => onDelete(coupon)}
                className="rounded-lg border border-error/25 px-2.5 py-1.5 font-display text-xs font-medium text-error transition-colors hover:bg-error-container/30"
              >
                Xoa
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
