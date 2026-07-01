# UC004 - Create Booking

## Metadata

- Source: Product Backlog `UC004`
- Primary actor: Customer
- Supporting actors: Booking system, payment flow
- Current status in repo: Implemented for availability lookup, cost calculation, booking creation, and backend-managed checkout handoff

## Related Endpoints

- `GET /api/rooms/{id}/available-slots`
- `POST /api/bookings/calculate-cost`
- `POST /api/bookings`
- `POST /api/payments/sessions`
- `GET /api/payments/transactions/{paymentId}`

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
4. Customer selects a start time, end time, and payment method.
5. Frontend requests cost calculation.
6. Backend calculates price based on room hourly rate and duration.
7. Customer confirms booking.
8. Backend validates the request again, checks availability under concurrency control, and creates the booking.
9. Backend stores the booking with pending-payment status and returns booking summary data.
10. Frontend opens checkout using the stored booking identity instead of rebuilding a local mock summary.
11. Backend creates a payment transaction for the selected checkout method.
12. For the current simplified flow, counter payments stay pending while online payments are marked succeeded immediately.

## Alternate and Error Flows

- Customer is not authenticated: request must be rejected by auth layer.
- Room does not exist: backend returns not found.
- Room is under maintenance: booking is rejected.
- Requested time overlaps an existing blocking booking: backend rejects the request.
- Another user books the same slot concurrently: backend rejects the later request.
- Invalid time range or booking in the past: backend rejects the request.

## Business Rules

- Booking start time must be before end time.
- Booking cannot be created in the past.
- Minimum booking duration is one hour.
- Rooms in maintenance are not bookable.
- Cancelled bookings do not block availability.
- A new booking starts in `CHO_THANH_TOAN` state.

## Data Touched

- `Booking`
- `Room`
- `RoomType`
- `Customer`
- `User`

## Current Implementation Notes

- Availability is calculated through `GET /api/rooms/{id}/available-slots`.
- Cost calculation is exposed as a separate endpoint before creation.
- Booking creation uses room locking plus overlap checks to reduce race conditions.
- The service catches persistence conflicts and converts them into booking conflict errors.
- A scheduled expiry job exists to auto-cancel stale unpaid bookings after the configured timeout.
- Checkout now asks the backend to create a `payment_transaction` record instead of simulating payment only in the frontend.
- The current backend maps checkout methods into the existing booking payment model (`CASH` or `ONLINE`) and exposes a payment-return lookup endpoint for the frontend.

## Known Gaps / Follow-up

- Instrument add-ons, coupon application, and richer checkout breakdown from backlog are not yet covered in this backend path.
- Real gateway callback/reconciliation is still follow-up work; the current online path is a backend-owned simulated success.

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
