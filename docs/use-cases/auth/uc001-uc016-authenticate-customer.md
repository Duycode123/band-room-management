# UC001 / UC016 - Authenticate Customer

## Metadata

- Source: Product Backlog `UC001`, `UC016`
- Primary actor: Customer
- Supporting actors: Authentication system, email service
- Current status in repo: Implemented with cookie-based JWT session flow

## Goal

Allow a customer to register, sign in, refresh session, sign out, inspect the current session, and recover a password securely.

## Related Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

## Preconditions

- For registration: customer provides valid registration data.
- For login: customer already has an account.
- For refresh/logout/session: auth cookies may already exist.
- For password reset: customer account exists and email delivery is available.

## Main Flow

### Register

1. Customer opens the registration screen.
2. Customer submits registration data.
3. Backend validates required fields and uniqueness constraints.
4. Backend hashes the password and creates the account.
5. Backend returns a successful registration response.

### Login

1. Customer submits email and password.
2. Backend validates credentials.
3. Backend issues access and refresh tokens.
4. Backend sets auth cookies and returns the auth payload.

### Refresh Session

1. Client sends the refresh request with refresh cookie.
2. Backend validates the refresh token.
3. Backend issues a new token pair.
4. Backend rotates auth cookies.

### Logout

1. Customer chooses logout.
2. Backend invalidates or revokes the active tokens.
3. Backend clears auth cookies.

### Forgot / Reset Password

1. Customer submits email for password recovery.
2. Backend creates a reset token and stores an expiration time.
3. Backend sends reset email with reset link.
4. Customer submits new password with reset token.
5. Backend validates token and updates the password.

## Alternate and Error Flows

- Duplicate registration data: backend rejects duplicate email.
- Invalid credentials: backend returns authentication failure.
- Missing or invalid refresh token: backend denies refresh.
- Unknown email on forgot-password: backend returns an error.
- Expired or invalid reset token: backend denies reset.
- Email delivery failure: backend returns server error for forgot-password.

## Business Rules

- Passwords must never be stored in plain text.
- Session tokens must be rotated via refresh.
- Logout must make old tokens unusable.
- Session inspection must return unauthorized when the principal is invalid.
- Password reset tokens must expire.

## Data Touched

- `User`
- `RevokedToken`
- reset token fields on user account

## Current Implementation Notes

- The backend sets both access and refresh cookies on login and refresh.
- The backend also returns token values in the response body today.
- `GET /api/auth/session` currently returns the authenticated role only.
- Forgot-password is implemented directly in the controller and currently builds a localhost reset URL.

## Known Gaps / Follow-up

- Align one clear session contract across frontend and backend so cookies are the primary transport.
- Move reset-email composition and user lookups out of controller-heavy logic during hexagonal refactor.
- Standardize error payload shape for all auth failure modes.

## Hexagonal Refactor Notes

Suggested inbound ports:

- `RegisterCustomerUseCase`
- `LoginCustomerUseCase`
- `RefreshSessionUseCase`
- `LogoutUseCase`
- `RequestPasswordResetUseCase`
- `ResetPasswordUseCase`

Suggested outbound ports:

- `LoadUserPort`
- `SaveUserPort`
- `IssueTokenPort`
- `RevokeTokenPort`
- `SendEmailPort`
