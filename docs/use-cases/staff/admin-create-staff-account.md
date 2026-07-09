# Admin manage staff account

## Business goal

Allow an admin to create, update, and delete staff login/profile records so staff-only flows can resolve the authenticated account to a `staff.id` while keeping staff identity data current.

## Actors

- Primary actor: Admin
- Supporting actor: Staff member

## Preconditions

- Admin is authenticated with `ADMIN` role.
- The target email is not already used by an account.
- The target email is not already used by a staff profile.

## Main flow

### Create staff account

1. Admin enters staff full name, email, optional phone, optional date of birth, and optional initial password.
2. Backend normalizes the email.
3. Backend creates an `account` row with role `STAFF`.
4. Backend creates a `staff` row linked by `staff.account_id`.
5. Backend returns the account id, staff id, and initial password.

### Update staff account

1. Admin selects an existing staff profile.
2. Admin updates full name, email, phone, date of birth, and optionally a new password.
3. Backend verifies the staff profile exists and is linked to a `STAFF` account.
4. Backend rejects the update if the new email is already used by another account or staff profile.
5. Backend updates both `account.email` and `staff.email` so login identity and staff profile stay aligned.

### Delete staff account

1. Admin selects an existing staff profile to delete.
2. Backend verifies the staff profile exists and is linked to a `STAFF` account.
3. Backend deletes the `staff` row first and then the linked `account` row.
4. If related operational records already reference the staff member, backend rejects deletion to preserve history.

## Alternate and error flows

- Missing full name or email: backend returns validation error.
- Duplicate account email: backend rejects the request.
- Duplicate staff profile email: backend rejects the request.
- Missing initial password: backend uses `123123`.
- Staff profile not found during update/delete: backend rejects the request.
- Delete staff with linked attendance, shift, booking, or facility records: backend rejects the request.

## Business rules

- Admin-created staff accounts use role `STAFF`.
- Admin-created staff accounts are marked email-verified so the staff member can log in with the initial password.
- Staff-only APIs require both `account.role = STAFF` and a linked `staff` profile.
- Staff account email and staff profile email are kept in sync during update.
- Deletion is a hard delete only when no related operational data blocks it.

## Related endpoints

- `POST /api/admin/staff`
- `PUT /api/admin/staff/{staffId}`
- `DELETE /api/admin/staff/{staffId}`

## Data touched

- Writes `account`.
- Writes `staff`.
- Updates `account`.
- Updates `staff`.
- Deletes `staff`.
- Deletes `account`.

## Current implementation notes

- Implemented in the `backend.staff` feature package with a use-case boundary.
- `StaffManagementUseCaseService` creates the account and staff profile in one transaction.
- `StaffManagementUseCaseService` also updates and deletes staff accounts through dedicated use-case ports.

## Known gaps

- There is no staff account listing/deactivation endpoint yet.
- The initial password is returned in the response for local/admin handoff; a forced password-change flow is still future scope.
