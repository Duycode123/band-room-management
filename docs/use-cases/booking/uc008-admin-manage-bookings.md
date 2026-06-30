# UC008 - Admin Manage Bookings

## Metadata

- Source: Product Backlog `UC008`
- Primary actor: Admin or staff with management permission
- Current status in repo: Partially implemented

## Related Endpoints

- `GET /api/admin/bookings`
- `GET /api/admin/bookings/{id}`
- `PATCH /api/admin/bookings/{id}/status`
- `PUT /api/admin/bookings/{id}/cancel`

## Goal

Allow operational staff to inspect bookings, review details, update booking status, and cancel bookings when management action is required.

## Preconditions

- Caller is authenticated.
- Caller has `ADMIN` or `STAFF` permission for management actions.
- Target booking exists for detail or update actions.

## Main Flow

### View Booking List

1. Manager opens booking management.
2. Frontend requests booking list, optionally by status.
3. Backend validates caller role.
4. Backend returns booking summaries ordered by newest first.

### View Booking Detail

1. Manager selects a booking.
2. Backend validates role and loads the booking.
3. Backend returns detail data.

### Update Booking Status

1. Manager chooses a new status.
2. Backend validates role and target booking.
3. Backend updates the booking status.
4. Backend returns the updated booking.

### Cancel Booking

1. Manager chooses cancel action.
2. Backend validates role and target booking.
3. Backend blocks invalid cancellation for completed bookings.
4. Backend updates status to cancelled and appends cancellation reason when provided.

## Alternate and Error Flows

- Caller lacks management permission: backend rejects the request.
- Booking does not exist: backend returns not found.
- Invalid status change request: backend rejects the request.
- Attempt to cancel completed booking: backend rejects the request.

## Business Rules

- Only admin/staff management roles can use the admin booking endpoints.
- Completed bookings cannot be cancelled through the current management flow.
- Cancellation reason, if provided, is appended into booking note history.

## Data Touched

- `Booking`
- `User`

## Current Implementation Notes

- Current list endpoint supports optional filter by `BookingStatus` only.
- Current detail endpoint returns one booking detail record.
- Status update uses query param `status`.
- Current management cancel flow does not include refund processing.

## Known Gaps / Follow-up

- Search by customer, date range, and payment status from the backlog is not yet present.
- Payment-status synchronization and audit log detail should be formalized.
- Explicit state-transition rules should move into domain/application policy during hexagonal refactor.

## Hexagonal Refactor Notes

Suggested inbound ports:

- `ListBookingsForManagementUseCase`
- `GetBookingManagementDetailUseCase`
- `UpdateBookingStatusUseCase`
- `CancelBookingForManagementUseCase`

Suggested outbound ports:

- `LoadBookingPort`
- `SearchBookingsPort`
- `SaveBookingPort`
- `LoadCurrentUserPort`
