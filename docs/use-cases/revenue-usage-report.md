# Revenue Usage Report

## Business Goal

Allow an administrator to review revenue and room usage frequency over time so they can evaluate business performance.

## Actors

- Administrator

## Preconditions

- The administrator is authenticated.
- Booking data exists in the `booking` table.
- The database has already been migrated to the English schema.

## Main Flow

1. The administrator requests a report with `from`, `to`, and an optional `bucket`.
2. The system validates that `from` is before `to`.
3. The system aggregates reportable bookings by time bucket.
4. The system aggregates usage by room.
5. The system returns total revenue, total booking count, total usage hours, period breakdowns, and room breakdowns.

## Alternate/Error Flows

- If `from` or `to` is missing, the request is rejected.
- If `from` is not before `to`, the request is rejected.
- If the requested range is too large for the selected bucket, the request is rejected.
- If there are no reportable bookings, totals are returned as zero and breakdown lists are empty.

## Business Rules

- Reportable bookings are bookings with status `PAID`, `CHECKED_IN`, or `COMPLETED`.
- Cancelled and unpaid pending bookings do not count toward revenue or usage.
- Revenue is calculated from `booking.total_price`.
- Usage hours are calculated from `booking.end_time - booking.start_time`.
- Supported time buckets are `DAY`, `WEEK`, and `MONTH`.

## Related Endpoints

- `GET /api/admin/reports/revenue-usage?from={ISO_DATE_TIME}&to={ISO_DATE_TIME}&bucket=DAY`

## Data Touched

- `booking`
- `room`
- `room_tier`

## Current Implementation Notes

- The use case lives under `backend.report`.
- The web adapter is `AdminReportController`.
- Persistence uses a PostgreSQL aggregation query through `JdbcTemplate`.
- The endpoint is covered by the existing `/api/admin/**` security rule and requires an admin role.

## Known Gaps

- The current report groups bookings by booking start time.
- The current report does not split a single booking across multiple time buckets.
- The current report does not compare against previous periods.
