# View Staff Work Schedule

## Business Goal

Allow a staff member to see assigned shifts and the room bookings that overlap a selected shift so they can prepare rooms and equipment before customers arrive.

## Actors

- Primary actor: Staff
- Supporting actors: Staff scheduling data, booking system

## Preconditions

- The caller is authenticated.
- The authenticated account has a staff profile.
- Shift data exists in the `shift` table.

## Main Flow - View Assigned Shifts

1. Staff opens the work schedule view.
2. Backend resolves the staff profile from the authenticated account email.
3. Backend loads shifts assigned to that staff member for the requested `fromDate` and `toDate`.
4. If no date range is supplied, backend defaults to the current week.
5. Backend returns shift id, date, start time, and end time.

## Main Flow - View Room Bookings In A Shift

1. Staff selects one shift.
2. Backend resolves the staff profile from the authenticated account email.
3. Backend verifies the selected shift belongs to that staff member.
4. Backend loads non-cancelled bookings whose time window overlaps the shift window.
5. Backend returns bookings ordered by start time.

## Alternate And Error Flows

- No assigned shifts: backend returns an empty list.
- Shift has no bookings: backend returns an empty list.
- Selected shift does not exist: backend returns not found.
- Selected shift belongs to another staff member: backend returns forbidden.
- Authenticated account does not have a staff profile: backend returns forbidden.
- Invalid date range where `fromDate` is after `toDate`: backend returns bad request.

## Business Rules

- Staff can only see their own shifts.
- Staff can only open bookings for a shift assigned to themselves.
- Booking lookup uses overlapping time windows: `booking.startTime < shiftEnd` and `booking.endTime > shiftStart`.
- Cancelled bookings are excluded from the shift booking list.
- Request/response DTOs stay in the web adapter; ownership and range rules live in the application service.

## Related Endpoints

- `GET /api/staff/schedule/shifts?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD`
- `GET /api/staff/schedule/shifts/{shiftId}/bookings`

## Data Touched

- `staff`: maps authenticated account to staff profile.
- `shift`: stores assigned staff shifts.
- `booking`: stores room booking windows and status.
- `room`: provides room name for booking response.
- `customer`: provides customer name for booking response.

## Current Implementation Notes

- Implemented in `backend.staffschedule` with incremental hexagonal boundaries.
- `StaffScheduleController` is the inbound web adapter.
- `StaffScheduleUseCaseService` enforces staff ownership and date range rules.
- `StaffSchedulePersistenceAdapter` reads shifts and bookings through outbound persistence ports.

## Known Gaps

- Empty state text is handled by the frontend using empty response lists.
- Equipment details are currently represented by booking `equipmentNotes`; structured per-equipment booking data is not available in the current persistence model.
