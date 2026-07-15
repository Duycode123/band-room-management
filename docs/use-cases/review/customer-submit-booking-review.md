# Customer Submit Booking Review

## Metadata

- Primary actor: Customer
- Current status in repo: Implemented (hybrid eligibility)

## Related Endpoints

- `POST /api/reviews`
- `GET /api/reviews/eligibility/{bookingId}`
- `GET /api/bookings/my/history` / `GET /api/bookings/my/{id}` (`canReview` flag)

## Goal

Allow a customer to leave one review for a booking after the rehearsal session has effectively ended, without being permanently blocked when staff forgets to press “Hoàn tất”.

## Business Rules

A booking is reviewable when it is **not** already reviewed and either:

1. Status is `COMPLETED` (staff completed / auto-completed), **or**
2. Status is `PAID`, `DEPOSIT_PAID`, or `CHECKED_IN` **and** current Vietnam wall-clock time is at or after `endTime`

Never reviewable:

- `PENDING_PAYMENT`
- `CANCELLED`
- Already reviewed (unique per booking)

## Auto-complete Support

A scheduled sweep (`BookingExpiryService`) auto-moves `CHECKED_IN` → `COMPLETED` when `endTime` has passed (Asia/Ho_Chi_Minh). Staff can still complete earlier manually.

## Main Flow

1. Customer opens booking history / detail after the session.
2. Frontend shows review UI when `canReview === true`.
3. Backend re-validates with `BookingReviewPolicy` on create / eligibility check.
4. Review is saved once per booking.

## Known Gaps

- No-show `PAID` bookings that pass `endTime` also become reviewable (intentional escape hatch when check-in was skipped).
- Public listing still respects review `approved` flag.
