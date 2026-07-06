# Quickstart: Backend Authentication Foundation

## Purpose

Validate the initial backend foundation and internal authentication flow end to end after implementation.

## Prerequisites

- The repository is available locally.
- Backend dependencies for `apps/api` are installed.
- Local environment variables required by the backend configuration are set.
- The application data directory is writable.

## Setup

1. Install backend dependencies from the repository root with `python -m pip install -r apps/api/requirements.txt`.
2. Start the backend application from the repository root with `python -m uvicorn app.main:app --app-dir apps/api --host 127.0.0.1 --port 8000`.
3. Confirm that the application data store can be created or opened.
4. Seed or create at least one internal user for authentication testing with `python apps/api/scripts/seed_internal_user.py --username analyst --password correct-horse-battery-staple`.

## Validation scenarios

### 1. Backend startup and health

1. Start the backend application.
2. Call `GET /api/health`.
3. Confirm that the response indicates the backend is available.
4. Optionally verify the automated backend suite with `python -m pytest apps/api/tests`.

Expected outcome:
- The backend runs independently from the frontend.
- The health endpoint returns a success response.

### 2. Successful login and current-user lookup

1. Send a valid username/password pair to `POST /api/auth/login`.
2. Confirm that the response succeeds and that the backend sets the session cookie.
3. Send `GET /api/auth/me` using the authenticated browser or HTTP client session.
4. Confirm that the current-user response returns the authenticated internal user identity.

Expected outcome:
- A valid session is created.
- The frontend-facing current-user check recognizes the authenticated user.

### 3. Invalid login behavior

1. Send an invalid username/password pair to `POST /api/auth/login`.
2. Repeat with an existing username and an incorrect password.
3. Compare the failure outcomes.

Expected outcome:
- Both failures return the same generic authentication outcome.
- No password material or distinguishing credential detail is exposed.

### 4. Protected-route enforcement

1. Call the protected validation route from [contracts/auth-health-api.md](./contracts/auth-health-api.md) without an authenticated session.
2. Confirm that access is denied.
3. Call the same route with a valid authenticated session.
4. Confirm that access succeeds.

Expected outcome:
- Protected access is denied when no valid session exists.
- Protected access succeeds when the backend session is valid.

### 5. Logout and session invalidation

1. Sign in successfully.
2. Call `POST /api/auth/logout`.
3. Call `GET /api/auth/me` again with the same client session.

Expected outcome:
- The logout route clears or invalidates the session.
- The current-user route no longer treats the client as authenticated.

## Validation result

- Backend contract and integration coverage pass with `python -m pytest apps/api/tests`.

## References

- Feature spec: [spec.md](./spec.md)
- Data model: [data-model.md](./data-model.md)
- API contract: [contracts/auth-health-api.md](./contracts/auth-health-api.md)
