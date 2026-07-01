# Report Customer Issue

## Metadata

- Source: Normalized from current frontend support flow and backend controller contract
- Primary actor: Customer
- Current status in repo: Implemented core flow

## Related Endpoints

- `POST /api/customer/report-issue`

## Goal

Allow an authenticated customer to submit a support issue that the backend can track, optionally linked to one booking they own.

## Preconditions

- Customer is authenticated.
- Customer profile exists and is linked to the authenticated account.

## Main Flow

1. Customer opens the report-issue page.
2. Frontend loads the customer's existing bookings to help them choose a valid booking code.
3. Customer selects an issue type and enters a description.
4. Customer may include one booking code that belongs to them.
5. Backend validates the issue type, description, and optional booking ownership.
6. Backend stores the issue with `OPEN` status and returns the created report summary.

## Alternate and Error Flows

- Customer profile is missing: backend returns not found.
- Issue type is missing or invalid: backend rejects the request.
- Description is blank or longer than 1000 characters: backend rejects the request.
- Booking code format is invalid: backend rejects the request.
- Booking code refers to another customer's booking: backend returns not found for the owned-booking lookup.

## Business Rules

- Customers can link an issue only to a booking they own.
- Booking linkage is optional.
- Allowed issue types are `ROOM`, `EQUIPMENT`, `PAYMENT`, `ACCOUNT`, and `OTHER`.
- New issue reports start in `OPEN` status.

## Data Touched

- `Customer`
- `Booking`
- `CustomerIssueReport`

## Current Implementation Notes

- The backend persists reports in `customer_issue_report`.
- Status is stored explicitly as a small lifecycle string rather than inferred from frontend UI state.
- The current API is create-only; staff/admin triage endpoints are still future work.

## Known Gaps / Follow-up

- No staff/admin management endpoint exists yet for triage or status updates.
- Notifications, SLA tracking, and attachments are not implemented.
