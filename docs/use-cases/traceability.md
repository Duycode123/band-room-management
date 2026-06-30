# Use Case Traceability

This file maps the source backlog/SRS use cases to the current backend repository status.

| UC ID | Title | Current Backend Coverage | Related Endpoints | Notes / Gaps |
| --- | --- | --- | --- | --- |
| UC001 | Register account | Implemented | `POST /api/auth/register` | Covers registration; backlog text also mixes login/logout into the same item. |
| UC016 | Secure login and session | Partially implemented | `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/session` | Current backend sets auth cookies and returns tokens in body. Frontend route-guard behavior is outside this repo's backend scope. |
| UC002 | List rooms | Partially implemented | `GET /api/rooms` | Current backend supports filter by `roomTypeId` and `status`. Search, richer filters, and pagination are still gaps. |
| UC003 | View room detail | Partially implemented | `GET /api/rooms/{id}` | Backend detail endpoint exists. SRS/gallery/404 presentation concerns belong mostly to frontend. |
| UC004 | Create booking | Implemented core flow | `GET /api/rooms/{id}/available-slots`, `POST /api/bookings/calculate-cost`, `POST /api/bookings` | Overlap prevention and pending-payment creation exist. Full payment completion flow is still separate/incomplete in current source. |
| UC008 | Admin manage bookings | Partially implemented | `GET /api/admin/bookings`, `GET /api/admin/bookings/{id}`, `PATCH /api/admin/bookings/{id}/status`, `PUT /api/admin/bookings/{id}/cancel` | Current backend supports list, detail, status update, and cancel. Rich search/filter/payment status sync from backlog remain gaps. |
| UC009 | Customer booking history | Partially implemented | `GET /api/bookings/my/history` | Supports pagination, sorting, status/time filters. Dedicated customer booking detail endpoint is not present yet. |
| UC010 | Customer cancel booking with refund | Not implemented in current backend | N/A | Backlog contains refund flow and refund tables, but current source does not expose a customer cancel/refund endpoint yet. |

## Working Rule

When a new backend feature lands, update this table in the same task so the repo keeps a realistic view of what is done versus what remains product scope.
