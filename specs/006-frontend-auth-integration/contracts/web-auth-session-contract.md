# Contract: Web Authentication Session Flow

## Purpose

Define the frontend-to-backend contract and route-level expectations for login, session validation, protected-route access, and logout.

## Base conventions

- `apps/web` is responsible for route decisions, login-form interaction, and display of safe user-facing auth messages.
- `apps/api` remains the sole owner of the authenticated session cookie and session lifecycle.
- Requests that depend on the backend session must include browser credentials.
- The frontend must not create, decode, persist, or inspect the backend session cookie directly.

## Public and protected routes

### Public routes

- `/`
- `/login`

Expected behavior:
- `/` redirects to `/login` before app resources render.
- `/login` renders the login flow for unauthenticated users.
- `/login` redirects authenticated users to `/applications`.

### Protected routes

- `/applications`
- `/services`
- `/creditmodeler-service`

Expected behavior:
- Protected routes require a confirmed backend session before content renders.
- Missing, expired, revoked, forged, or unknown sessions are treated as unauthenticated.
- Unauthenticated requests redirect to `/login` with a safe `next` value when applicable.

## Login

### `POST /api/auth/login`

Purpose: Submit username and password to the backend and begin the authenticated session flow.

Request body:

```json
{
  "username": "analyst",
  "password": "correct-horse-battery-staple"
}
```

Successful outcome:
- Backend accepts the credentials.
- Backend sets the session cookie.
- Frontend follows with authoritative session validation before treating the user as authenticated.

Failure outcome:
- Invalid credentials produce one generic authentication failure outcome.
- Connectivity failures, timeouts, and backend availability failures produce a distinct unavailable outcome.

## Current-user validation

### `GET /api/auth/me`

Purpose: Confirm whether the current request is associated with a valid authenticated session and return the authenticated user identity.

Successful outcome:

```json
{
  "id": 1,
  "username": "analyst"
}
```

Failure outcome:
- Returns an unauthenticated outcome when the request has no valid session.
- Protected frontend routes fail closed when this validation cannot confirm authentication.

## Logout

### `POST /api/auth/logout`

Purpose: Revoke or clear the current backend-managed session and return the frontend to the sign-in flow.

Successful outcome:
- Backend clears or invalidates the session.
- Frontend clears non-sensitive in-memory user state.
- Frontend redirects to `/login`.

Failure outcome:
- If no active session exists, the frontend still ends in an unauthenticated state.

## Redirect target handling

Purpose: Restore the intended protected route only when the destination is a known safe internal path.

Allowed destinations:
- `/applications`
- `/services`
- `/creditmodeler-service`

Rejected destinations:
- absolute URLs
- protocol-relative URLs
- external domains
- JavaScript URLs
- malformed paths
- unknown internal routes
- encoded values that resolve outside the app

Fallback outcome:
- Any rejected destination resolves to `/applications` after successful sign-in.
