# Admin create staff account

## Business goal

Allow an admin to create a new staff login and staff profile in one operation so staff-only flows can resolve the authenticated account to a `staff.id`.

## Actors

- Primary actor: Admin
- Supporting actor: Staff member

## Preconditions

- Admin is authenticated with `ADMIN` role.
- The target email is not already used by an account.
- The target email is not already used by a staff profile.

## Main flow

1. Admin enters staff full name, email, optional phone, optional date of birth, and optional initial password.
2. Backend normalizes the email.
3. Backend creates an `account` row with role `STAFF`.
4. Backend creates a `staff` row linked by `staff.account_id`.
5. Backend returns the account id, staff id, and initial password.

## Alternate and error flows

- Missing full name or email: backend returns validation error.
- Duplicate account email: backend rejects the request.
- Duplicate staff profile email: backend rejects the request.
- Missing initial password: backend uses `123123`.

## Business rules

- Admin-created staff accounts use role `STAFF`.
- Admin-created staff accounts are marked email-verified so the staff member can log in with the initial password.
- Staff-only APIs require both `account.role = STAFF` and a linked `staff` profile.

## Related endpoints

- `POST /api/admin/staff`

## Data touched

- Writes `account`.
- Writes `staff`.

## Current implementation notes

- Implemented in the `backend.staff` feature package with a use-case boundary.
- `StaffManagementUseCaseService` creates the account and staff profile in one transaction.

## Known gaps

- There is no staff account listing/update/deactivation endpoint yet.
- The initial password is returned in the response for local/admin handoff; a forced password-change flow is still future scope.
