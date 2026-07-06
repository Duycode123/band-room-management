export type CouponDiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT'

export type CouponLifecycle = 'ACTIVE' | 'EXPIRED' | 'NO_EXPIRY'

export type AdminCoupon = {
  couponId: number
  code: string
  discountType: CouponDiscountType
  discountValue: number
  minOrderValue: number | null
  expiresAt: string | null
  lifecycle: CouponLifecycle
}

export type CouponFilters = {
  query: string
  discountType: CouponDiscountType | 'ALL'
  lifecycle: CouponLifecycle | 'ALL'
  sortBy: 'code' | 'value' | 'minOrderValue' | 'expiresAt'
  sortOrder: 'asc' | 'desc'
}

export type CouponFormData = {
  code: string
  discountType: CouponDiscountType
  discountValue: string
  minOrderValue: string
  expiresAt: string
}

export type CouponFormErrors = Partial<Record<keyof CouponFormData, string>>
