# Data Model: Frontend Authentication Integration

## Login Submission

### Purpose
Represents a single frontend sign-in attempt initiated from the existing login form.

### Fields
- `username`: submitted internal username
- `password`: submitted password value used only for the active request
- `next`: optional intended internal destination requested before sign-in
- `status`: current submission state
- `message`: optional user-visible feedback message

### Validation rules
- `username` must be present before a sign-in attempt can proceed.
- `password` must be present before a sign-in attempt can proceed.
- `password` must not be stored in browser-managed persistent storage.
- `next` may only be used if it resolves to an approved internal route.

### State transitions
- `idle` -> `validating` when the user submits the form
- `validating` -> `submitting` when required fields are present
- `validating` -> `invalid_credentials` only after the backend rejects credentials generically
- `submitting` -> `success` when the session is confirmed as authenticated
- `submitting` -> `backend_unavailable` when the auth service cannot be reached or fails availability checks
- `submitting` -> `unexpected_error` for other non-auth success outcomes that still fail the flow

## Authentication Outcome

### Purpose
Represents the normalized result returned to frontend route and UI logic after sign-in, session validation, or logout.

### Fields
- `kind`: one of `authenticated`, `unauthenticated`, `invalid_credentials`, `backend_unavailable`, or `unexpected_error`
- `user`: optional authenticated user identity
- `redirectTarget`: safe destination to navigate to next
- `message`: optional generic user-facing message

### Validation rules
- `invalid_credentials` must never reveal whether the username, password, or account status caused rejection.
- `backend_unavailable` must remain distinct from `invalid_credentials`.
- `authenticated` requires a confirmed backend-managed session.

## Authenticated User

### Purpose
Represents the frontend-safe identity returned after successful session validation.

### Fields
- `id`: backend-owned internal user identifier
- `username`: authenticated username

### Validation rules
- The authenticated user payload must not include password material, raw cookie values, or session secrets.
- The authenticated user is available only when the backend confirms a valid session.

## Redirect Target

### Purpose
Represents the internal application destination preserved when an unauthenticated user is redirected to the login flow.

### Fields
- `requestedPath`: original route requested by the user
- `normalizedPath`: safe internal path after validation
- `isAllowed`: whether the target belongs to the approved internal allowlist

### Validation rules
- Only known internal application routes may be marked allowed.
- Absolute URLs, protocol-relative URLs, external domains, JavaScript URLs, malformed paths, and encoded escape paths must be rejected.
- Rejected targets must fall back to `/applications`.

## Route Access Decision

### Purpose
Represents the frontend routing decision made before protected content is rendered.

### Fields
- `requestedRoute`: route being accessed
- `routeType`: `public` or `protected`
- `cookiePresent`: whether an auth cookie appears to exist for early checks
- `sessionConfirmed`: whether the backend confirmed a valid session
- `action`: `render`, `redirect_to_login`, or `redirect_to_applications`

### Validation rules
- Protected routes require `sessionConfirmed` before render.
- `cookiePresent` alone must never allow protected content to render.
- Public routes `/` and `/login` remain reachable without an authenticated session.

## Logout Request

### Purpose
Represents a user-initiated sign-out from an existing logout control.

### Fields
- `initiatedFrom`: route or UI surface where logout was triggered
- `sessionPresent`: whether a session was believed to exist before sign-out
- `result`: `signed_out` or `unauthenticated`

### Validation rules
- Sign-out must always leave the frontend in an unauthenticated state.
- Sign-out must clear only non-sensitive in-memory user state from the frontend.
- A subsequent Back navigation must require a fresh session validation before protected content is usable.
