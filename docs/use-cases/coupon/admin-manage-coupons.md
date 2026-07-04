# Admin manage coupons

## Business goal

Allow an administrator to create and maintain coupon campaigns that can later be validated during checkout and recorded after payment.

## Actors

- Primary actor: Admin
- Supporting actors: customer checkout, booking creation, payment confirmation

## Preconditions

- Admin is authenticated with `ADMIN` role.
- `discount_code` table and `discount_type` enum already exist.

## Main flow

1. Admin opens coupon management.
2. Backend lists existing coupons from `discount_code`.
3. Admin creates or updates a coupon with code, type, value, optional minimum order value, and optional expiry date.
4. Backend normalizes the coupon code to uppercase.
5. Backend validates amount rules and duplicate code rules.
6. Backend saves the coupon and returns the stored coupon data.

## Alternate and error flows

- Coupon not found: backend returns 404.
- Duplicate coupon code: backend rejects the request.
- Missing code, type, or value: backend returns validation error.
- Non-positive discount value: backend rejects the request.
- Negative minimum order value: backend rejects the request.
- Delete coupon already applied to a booking or recorded in usage: backend rejects the request.

## Business rules

- Coupon codes are stored uppercase and compared case-insensitively.
- Coupon `value` must be greater than zero.
- `min_order_value`, when supplied, cannot be negative.
- Deleting a coupon is only allowed while no booking or coupon usage references it.
- Validation, booking creation, and payment confirmation remain responsible for applying coupon effects.

## Related endpoints

- `GET /api/admin/coupons`
- `GET /api/admin/coupons/{id}`
- `POST /api/admin/coupons`
- `PUT /api/admin/coupons/{id}`
- `DELETE /api/admin/coupons/{id}`

## Data touched

- Reads and writes `discount_code`.
- Reads `booking.discount_code_id` and `coupon_usage.discount_code_id` before delete.

## Current implementation notes

- Implemented under the `backend.coupon` feature package.
- `AdminCouponController` is the inbound web adapter.
- `CouponManagementService` is the application use case boundary.
- `CouponManagementPersistenceAdapter` maps between domain coupon models and the legacy JPA `DiscountCode` entity.

## Known gaps

- Usage limit, per-user limit, active/inactive status, and coupon campaign names are not implemented yet.
