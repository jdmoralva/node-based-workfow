# Contract: Auth and Health API

## Purpose

Define the initial backend HTTP contract required for backend readiness checks and internal username/password authentication.

## Base conventions

- All routes are served by the backend application under a shared `/api` prefix.
- Authentication state is maintained by the backend and transported through a secure HTTP-only cookie.
- Authentication failures must not reveal whether the username or password was incorrect.

## Health check

### `GET /api/health`

Purpose: Confirm that the backend application is running.

Successful outcome:
- Returns a success response indicating the backend is available.

Failure outcome:
- If the backend process cannot serve requests, the route is unavailable.

## Login

### `POST /api/auth/login`

Purpose: Validate submitted username/password credentials and create a backend-managed authenticated session.

Request body:

```json
{
  "username": "internal.user",
  "password": "secret-password"
}
```

Successful outcome:
- Returns an authenticated-user response suitable for frontend sign-in confirmation.
- Sets a secure HTTP-only session cookie.

Failure outcome:
- Returns one generic authentication failure outcome for any invalid credential combination.
- Does not disclose whether the username exists.

## Logout

### `POST /api/auth/logout`

Purpose: Invalidate or clear the current authenticated session.

Successful outcome:
- Clears the backend-managed session association.
- Clears the browser session cookie.

Failure outcome:
- If no active session exists, the backend still returns a safe sign-out outcome suitable for the frontend.

## Current user

### `GET /api/auth/me`

Purpose: Allow the frontend to verify whether a user is authenticated and retrieve the active internal user identity.

Successful outcome:

```json
{
  "id": "user_123",
  "username": "internal.user"
}
```

Failure outcome:
- Returns an unauthenticated outcome when the request has no valid session.

## Protected-session validation example

### `GET /api/auth/protected-check`

Purpose: Provide at least one endpoint or route group check that proves protected access requires a valid session.

Successful outcome:
- Returns success only when the request is associated with a valid backend-managed authenticated session.

Failure outcome:
- Returns an unauthenticated outcome when the request has no valid, active session.
