# Use Case Traceability

This file maps the source backlog/SRS use cases to the current backend repository status.

| UC ID | Title | Current Backend Coverage | Related Endpoints | Notes / Gaps |
| --- | --- | --- | --- | --- |
| UC001 | Register account | Implemented | `POST /api/auth/register`, `POST /api/auth/verify-email`, `POST /api/auth/resend-verification-email` | Registration now creates an unverified account, sends an email verification link, stores only a hashed verification token, and blocks login until verification. |
| UC016 | Secure login and session | Partially implemented | `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/session` | Current backend sets auth cookies and returns tokens in body. Login requires a verified email. Frontend route-guard behavior is outside this repo's backend scope. |
| UC002 | List rooms | Partially implemented | `GET /api/rooms` | Current backend supports filter by `roomTypeId` and `status`. Search, richer filters, and pagination are still gaps. |
| UC003 | View room detail | Partially implemented | `GET /api/rooms/{id}` | Backend detail endpoint exists. SRS/gallery/404 presentation concerns belong mostly to frontend. |
| UC004 | Create booking | Implemented core flow | `GET /api/rooms/{id}/available-slots`, `POST /api/bookings/calculate-cost`, `POST /api/bookings` | Overlap prevention and pending-payment creation exist. Full payment completion flow is still separate/incomplete in current source. |
| UC008 | Admin manage bookings | Partially implemented | `GET /api/admin/bookings`, `GET /api/admin/bookings/{id}`, `PATCH /api/admin/bookings/{id}/status`, `PUT /api/admin/bookings/{id}/cancel` | Current backend supports list, detail, status update, and cancel. Rich search/filter/payment status sync from backlog remain gaps. |
| UC009 | Customer booking history | Partially implemented | `GET /api/bookings/my/history` | Supports pagination, sorting, status/time filters. Dedicated customer booking detail endpoint is not present yet. |
| UC010 | Customer cancel booking with refund | Partially implemented | `PUT /api/bookings/{id}/cancel` | Supports customer-owned paid booking cancellation before 24 hours, 100% refund summary, email notification, and in-app notification. Refund disbursement is not automated yet. |
| N/A | Admin room performance report | Implemented core flow | `GET /api/admin/reports/room-performance` | Counts successful bookings (`PAID`, `CHECKED_IN`, `COMPLETED`) per room for an inclusive date range and includes rooms with zero successful bookings. |
| ISSUE-236 / ISSUE-237 | Staff check-in/check-out shift | Implemented core flow | `POST /api/staff/attendance/check-in`, `POST /api/staff/attendance/check-out` | Records real check-in/out time against the current assigned shift, calculates work duration, prevents duplicate check-in, and marks missing checkout rows through a scheduled job. Admin correction UI and payroll aggregation remain separate scope. |
| ISSUE-264 | Staff record room/equipment condition | Implemented core flow | `POST /api/staff/facility/rooms/{roomId}/status`, `POST /api/staff/facility/rooms/{roomId}/condition`, `POST /api/staff/facility/equipment/{equipmentId}/condition`, `GET /api/admin/facility/condition-reports` | Staff can update room status, record room/equipment condition, and create maintenance suggestions when condition is `BROKEN`. Hard room-scope validation by shift remains a future schema concern. |
| N/A | Moderate reviews and write one admin response | Implemented core flow | `POST /api/reviews`, `GET /api/reviews`, `GET /api/admin/reviews`, `PATCH /api/admin/reviews/{id}/approval`, `PUT /api/admin/reviews/{id}/response`, `DELETE /api/admin/reviews/{id}/response` | Backend supports review creation, public listing, approval toggle, and one optional admin response per review. Customer and public FE pages are not mapped to these APIs yet. |
| N/A | Manage equipment | Implemented core flow | `GET /api/admin/equipment`, `GET /api/admin/equipment/{id}`, `POST /api/admin/equipment`, `PUT /api/admin/equipment/{id}`, `DELETE /api/admin/equipment/{id}` | Backend-managed feature from the current task; source backlog ID is not normalized in repo docs yet. |

## Working Rule

When a new backend feature lands, update this table in the same task so the repo keeps a realistic view of what is done versus what remains product scope.
