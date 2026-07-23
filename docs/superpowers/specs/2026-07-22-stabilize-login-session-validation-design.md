# Stabilize Login Session Validation

## Problem

A successful same-origin login can redirect back to `/login` when the protected layout validates the new session. Browser login and current-user requests use the Next.js `/api/auth/*` proxy, but server-side session validation defaults `API_BASE_URL` to the Next.js origin on port 3000. This makes the protected layout call the application through its own auth proxy.

During development, that recursive request can reach an auth route while Next.js is compiling it and receive a transient `404`. Session validation fails closed, so the valid login is redirected back to `/login`. The behavior can disappear after the auth route has compiled, which makes a restart or manual retry appear to fix it.

## Design

Server-side session validation will default directly to the FastAPI backend at `http://127.0.0.1:8000`. An explicit `API_BASE_URL` will continue to override the default for other deployments.

Browser authentication will remain same-origin:

- `NEXT_PUBLIC_API_BASE_URL` remains unset by default.
- Browser requests continue through Next.js `/api/auth/*` routes.
- Next.js auth proxy routes continue forwarding to `API_BASE_URL` or their existing backend fallback.
- Protected layouts continue validating the backend-owned session before rendering.
- Middleware continues rejecting protected requests that do not contain the configured session cookie.

The environment example will describe this default local topology: `API_BASE_URL` points to FastAPI on port 8000, while `NEXT_PUBLIC_API_BASE_URL` is omitted. Split-origin browser requests remain an explicit option only for deployments with credentialed CORS support.

## Failure Behavior

Session validation remains fail closed. A missing cookie, rejected session, unavailable backend, or malformed response still redirects to the login route with the protected destination preserved in `next`.

The fix does not trust cookie presence as proof of authentication and does not broaden cookie domain or path settings.

## Verification

Implementation follows test-driven development:

1. Add a unit regression asserting that server auth configuration defaults to `http://127.0.0.1:8000` when `API_BASE_URL` is absent.
2. Run the new test before implementation and confirm it fails because the current fallback is port 3000.
3. Change the fallback and environment example with the smallest possible edits.
4. Run focused auth unit tests, lint, and the production build.
5. Run the backend-authenticated Playwright navigation test and confirm a real sign-in reaches `/services`, remains authenticated, and does not return to `/login`.

## Scope

This change is limited to the server-auth default and frontend environment guidance. It does not alter credentials, API session issuance, cookie attributes, middleware route protection, or protected-layout authorization behavior.
