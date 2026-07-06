import {
  COUPON_LIFECYCLE_LABELS,
  COUPON_TYPE_LABELS,
} from '@/lib/admin/coupons/adminCouponApi'
import type { CouponDiscountType, CouponLifecycle } from '@/lib/admin/coupons/types'

type BadgeProps = {
  children: React.ReactNode
  className: string
}

function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-1 font-display text-[11px] font-semibold',
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}

export function CouponTypeBadge({ type }: { type: CouponDiscountType }) {
  const className =
    type === 'PERCENTAGE'
      ? 'bg-primary-container text-on-primary-container'
      : 'bg-tertiary-container text-on-tertiary-container'

  return <Badge className={className}>{COUPON_TYPE_LABELS[type]}</Badge>
}

export function CouponLifecycleBadge({ lifecycle }: { lifecycle: CouponLifecycle }) {
  const className =
    lifecycle === 'ACTIVE'
      ? 'bg-secondary-container text-secondary'
      : lifecycle === 'EXPIRED'
        ? 'bg-error-container/60 text-error'
        : 'bg-surface-container text-on-surface-variant'

  return <Badge className={className}>{COUPON_LIFECYCLE_LABELS[lifecycle]}</Badge>
}
