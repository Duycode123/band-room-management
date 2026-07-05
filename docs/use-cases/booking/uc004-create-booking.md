# UC004 - Create Booking

## Metadata

- Source: Product Backlog `UC004`
- Primary actor: Customer
- Supporting actors: Booking system, payment flow
- Current status in repo: Implemented — availability lookup, cost calculation, booking creation, checkout session, and authenticated provider-webhook payment completion

## Related Endpoints

- `GET /api/rooms/{id}/available-slots`
- `POST /api/bookings/calculate-cost`
- `POST /api/bookings`
- `POST /api/payments/sessions`
- `GET /api/payments/transactions/{paymentId}`
- `POST /api/payments/sepay/webhook` (SePay confirmation, authenticated by HMAC or API-key shared secret)
- `GET /api/payments/vnpay/ipn` (VNPay confirmation, signature-verified)

## Goal

Allow an authenticated customer to select a valid room/time range, see the expected cost, and create a booking without overbooking the room.

## Preconditions

- Customer is authenticated.
- Selected room exists.
- Requested booking time is in the future.
- Requested booking duration is valid.

## Main Flow

1. Customer opens the booking flow for a room.
2. Frontend requests available slots for a selected time window.
3. Backend returns free slots based on existing blocking bookings and room status.
4. Customer selects a start time, end time, payment method, and optional coupon code.
5. Frontend requests cost calculation.
6. Backend calculates price based on room hourly rate and duration, and applies the coupon when one is provided and valid.
7. Customer confirms booking.
8. Backend validates the request again, checks availability under concurrency control, and creates the booking.
9. Backend stores the booking with pending-payment status and returns booking summary data.
10. For online SePay payment, backend creates a pending payment transaction using a `PAY...` transfer reference and returns the SePay-hosted payment portal URL.
11. Frontend redirects the customer to the SePay portal returned by `POST /api/payments/sessions`.
12. SePay posts the bank transaction webhook after money is received; backend verifies the webhook, matches the transfer reference and amount, then marks the transaction as succeeded and the booking as paid.

## Alternate and Error Flows

- Customer is not authenticated: request must be rejected by auth layer.
- Room does not exist: backend returns not found.
- Room is under maintenance: booking is rejected.
- Requested time overlaps an existing blocking booking: backend rejects the request.
- Another user books the same slot concurrently: backend rejects the later request.
- Invalid time range or booking in the past: backend rejects the request.
- Invalid, expired, or ineligible coupon: backend rejects the request with the coupon validation reason.

## Business Rules

- Booking start time must be before end time.
- Booking cannot be created in the past.
- Minimum booking duration is one hour.
- Rooms in maintenance are not bookable.
- Cancelled bookings do not block availability.
- A new booking starts in `CHO_THANH_TOAN` state.
- A valid coupon changes the final payable amount but does not create `coupon_usage` until payment is confirmed.

## Data Touched

- `Booking`
- `Room`
- `RoomType`
- `Customer`
- `User`
- `DiscountCode`

## Current Implementation Notes

- Availability is calculated through `GET /api/rooms/{id}/available-slots`.
- Cost calculation is exposed as a separate endpoint before creation.
- Booking creation uses room locking plus overlap checks to reduce race conditions.
- The service catches persistence conflicts and converts them into booking conflict errors.
- A scheduled expiry job exists to auto-cancel stale unpaid bookings after the configured timeout.
- Checkout now asks the backend to create a `payment_transaction` record instead of simulating payment only in the frontend.
- The current backend maps checkout methods into the existing booking payment model (`CASH` or `ONLINE`) and exposes a payment-return lookup endpoint for the frontend.
- Cost calculation and booking creation now reuse the coupon validation use case so the same coupon rules apply before and during booking creation.
- The SePay checkout path returns the external portal URL built from `payment.sepay.checkout-url` plus transaction parameters such as `paymentId`, `orderCode`, `amount`, and return URLs. `checkout-url` may also use placeholders like `{paymentId}` or `{amount}` if the deployed SePay portal requires a fixed URL template.
- Payment completion is closed by the provider webhooks: `PaymentWebhookServiceImpl` moves the transaction to `SUCCEEDED`/`FAILED`, flips the booking from `PENDING_PAYMENT` to `PAID` (or `CANCELLED` on VNPay failure), and records coupon usage on success. VNPay IPN is HMAC-SHA512 signature-verified; SePay can use HMAC-SHA256 headers (`payment.sepay.webhook-hmac-secret`) or the fallback `Authorization: Apikey <secret>` value from `payment.sepay.ipn-secret`.
- The SePay secret is optional in local/dev (blank secret = webhook open so the flow can be exercised without a SePay account); production should set `payment.sepay.webhook-hmac-secret`.

## Known Gaps / Follow-up

- The exact SePay portal URL/parameter contract must be configured from the live SePay merchant portal/API settings. Local tests validate URL generation and webhook confirmation, not live money movement.
- Instrument add-ons and richer checkout breakdown from backlog are not yet covered in this backend path.
- Deposit vs full-payment amounts are modelled, but partial-payment tracking (remaining balance due at counter) is not yet a first-class booking field.

## Hexagonal Refactor Notes

Suggested inbound ports:

- `GetRoomAvailabilityUseCase`
- `CalculateBookingCostUseCase`
- `CreateBookingUseCase`

Suggested outbound ports:

- `LoadRoomPort`
- `LockRoomPort`
- `LoadCustomerPort`
- `LoadBlockingBookingsPort`
- `SaveBookingPort`
