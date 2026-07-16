# Quickstart: Frontend Authentication Integration

## Purpose

Validate the frontend login-to-backend authentication flow end to end after implementation.

## Prerequisites

- Repository dependencies for both `apps/web` and `apps/api` are installed.
- A local internal user exists in `apps/api` for sign-in testing.
- Environment variables for the web app and API are configured for either split-origin local development or same-host validation.
- For the current local setup, `apps/web` should proxy browser auth requests to `apps/api` through same-host `/api/auth/*` routes.

## Setup

1. Install frontend dependencies with `npm install --prefix apps/web`.
2. Install backend dependencies with `python -m pip install -r apps/api/requirements.txt`.
3. Seed an internal user if needed with `python apps/api/scripts/seed_internal_user.py --username analyst --password correct-horse-battery-staple`.
4. Start the API with `python -m uvicorn app.main:app --app-dir apps/api --host 127.0.0.1 --port 8000`.
5. In `apps/web/.env.local`, set `API_BASE_URL=http://127.0.0.1:8000` and keep `NEXT_PUBLIC_API_BASE_URL` unset for same-host proxy validation.
6. Start the web app with `npm run dev --prefix apps/web`.

Split-origin note:

- Only set `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000` when `apps/api` has explicit CORS support for credentialed requests from `http://127.0.0.1:3000`.

## Validation Scenarios

### 1. Root route redirects to login

1. Open the web app root URL.
2. Confirm that the application redirects to `/login` before protected or landing content is shown.

Expected outcome:
- `/` resolves to `/login`.
- The previous landing-page behavior is no longer reachable as the default entry path.

### 2. Successful login and default navigation

1. Open `/login` while signed out.
2. Enter valid credentials for the seeded user.
3. Submit the existing login form.
4. Confirm that the app verifies the session and lands on `/applications` when no safe `next` value is present.

Expected outcome:
- The current login UI remains visually unchanged in the idle state.
- The backend-managed session is confirmed before the user is treated as authenticated.

### 3. Protected-route redirect and safe restoration

1. While signed out, open `/services` or `/creditmodeler-service` directly.
2. Confirm that the app redirects to `/login` with a safe preserved destination.
3. Sign in successfully.
4. Confirm that the original protected route is restored.

Expected outcome:
- Protected content is not rendered before session confirmation.
- A safe intended route is restored after sign-in.

### 4. Invalid-credential and unavailable-service handling

1. Submit an invalid username/password combination.
2. Confirm that the page stays on `/login` with a generic auth-failure message.
3. Simulate API unavailability and submit again.
4. Confirm that the page stays on `/login` with a service-unavailable outcome distinct from invalid credentials.

Expected outcome:
- Credential-specific causes are not exposed.
- Availability failures fail closed and do not create an authenticated experience.

### 5. Authenticated access and `/login` redirect

1. Sign in successfully.
2. Navigate to `/login` directly.
3. Confirm that the app redirects to `/applications` without showing the login panel first.

Expected outcome:
- Authenticated users cannot remain on the login route.
- Login-page flash is avoided during authenticated session validation.

### 6. Logout and renewed session enforcement

1. Sign in successfully.
2. Use the existing logout control.
3. Confirm that the app returns to `/login`.
4. Use browser Back to attempt returning to a protected route.

Expected outcome:
- The backend session is revoked or cleared.
- Protected content requires a new successful session validation before reuse.

## Validation Commands

- `npm run test --prefix apps/web`
- `E2E_AUTH_WITH_BACKEND=1 API_BASE_URL=http://127.0.0.1:8000 AUTH_SESSION_COOKIE_NAME=rv_session npm exec --prefix apps/web playwright test -- --config apps/web/playwright.config.ts apps/web/tests/e2e/local-interactions.spec.ts apps/web/tests/e2e/accessibility.spec.ts apps/web/tests/e2e/routes.spec.ts apps/web/tests/e2e/navigation.spec.ts --grep-invert "@visual"`
- `npm exec --prefix apps/web playwright test -- --config apps/web/playwright.config.ts apps/web/tests/visual/migrated-pages.spec.ts`

## References

- Feature spec: [spec.md](./spec.md)
- Implementation plan: [plan.md](./plan.md)
- Data model: [data-model.md](./data-model.md)
- Contract: [contracts/web-auth-session-contract.md](./contracts/web-auth-session-contract.md)
