# Connect the frontend login flow to backend authentication

## Objective

Connect the existing login interface in `apps/web` to the authentication capabilities exposed by `apps/api`.

The implementation must allow internal users to authenticate using a username and password and access the application resources through a backend-managed session.

The current frontend design must remain unchanged. This feature must not introduce a redesign, modify the established visual hierarchy, or alter the current CSS behavior of `apps/web`.

## User stories

### US1 — Internal user authentication

As an internal user, I want to authenticate through the frontend using my username and password so that I can access the application resources.

### US2 — Login as the application entry point

As an application user, I want `/login` to be the default entry page so that accessing the application root URL automatically takes me to the authentication flow.

The application must implement controls that prevent unauthenticated users from bypassing the login flow by entering protected URLs directly.

## Scope

This feature includes:

* connecting the existing login form to `apps/api`;
* creating and validating backend-managed sessions;
* redirecting `/` to `/login`;
* protecting frontend resource routes;
* restoring an intended route after successful authentication;
* handling invalid, expired, revoked, and unavailable sessions;
* connecting the existing logout action where present; and
* adding automated authentication and route-protection tests.

This feature must preserve the current frontend appearance.

## Authentication API contract

The frontend must integrate with the following backend endpoints:

| Method | Endpoint           | Purpose                                                 |
| ------ | ------------------ | ------------------------------------------------------- |
| `POST` | `/api/auth/login`  | Authenticate the user and establish the session         |
| `GET`  | `/api/auth/me`     | Retrieve and validate the current authenticated user    |
| `POST` | `/api/auth/logout` | Revoke the current session and clear the session cookie |

The protected-check endpoint may be used in integration tests, but `/api/auth/me` must be the primary frontend session-validation endpoint.

### Login request

The login form must submit:

```json
{
  "username": "string",
  "password": "string"
}
```

The request must use:

```ts
credentials: "include"
```

The frontend must not attempt to create, read, decode, or manually persist the backend session cookie.

### Login success

When the backend accepts the credentials:

1. The backend creates the authenticated session.
2. The backend returns the session cookie through `Set-Cookie`.
3. The frontend verifies the resulting session through `GET /api/auth/me`.
4. The frontend redirects the user to the intended protected route or to `/applications`.

A successful HTTP response from `/login` must not be treated as sufficient by itself when the subsequent session validation fails.

### Invalid credentials

When the backend rejects the credentials, the frontend must display a generic message such as:

```text
Invalid username or password.
```

The interface must not reveal whether:

* the username does not exist;
* the password is incorrect;
* the user is inactive; or
* another credential-specific condition caused the rejection.

### Backend unavailable

Network errors, timeouts, and backend `5xx` responses must be represented separately from invalid credentials.

Example:

```text
The authentication service is currently unavailable. Please try again.
```

The user must remain on `/login`.

## Root-route behavior

The application root route must redirect to `/login`.

Expected behavior:

```text
/ → /login
```

This redirect must be implemented at the Next.js server-routing level, using `redirect("/login")` or equivalent App Router behavior.

It must not depend on:

* a client-side `useEffect`;
* browser JavaScript completing successfully;
* a clickable link;
* a delayed timer; or
* local React state.

The root page must not render application resources before performing the redirect.

## Login-page session behavior

When an unauthenticated user visits `/login`, the existing login page must be displayed.

When an authenticated user visits `/login`, the application must validate the session through `/api/auth/me` and redirect the user to:

```text
/applications
```

Expected behavior:

```text
authenticated user → /login → /applications
```

Consequently, an authenticated user entering `/` may follow:

```text
/ → /login → /applications
```

The login interface must not briefly appear while the authenticated session is being validated.

## Protected routes

The following routes must require a valid authenticated session:

```text
/applications
/services
/creditmodeler-service
```

Future application resource routes must be protected by default unless they are explicitly registered as public routes.

The initial public route set must be limited to:

```text
/
/login
```

Static assets, framework resources, and required internal Next.js endpoints must be excluded from route protection.

## Layered route-protection controls

Route protection must not rely exclusively on client-side React logic.

The implementation must use layered controls.

### 1. Root server redirect

`/` must redirect to `/login` before rendering application content.

### 2. Middleware early check

Next.js middleware should perform an early session-cookie presence check for protected paths.

If the configured session cookie is absent, middleware must redirect to:

```text
/login?next=<requested-path>
```

Example:

```text
/services → /login?next=/services
```

The middleware cookie check is only an early rejection mechanism. Cookie presence must not be considered proof that the session is valid.

### 3. Authoritative server-side validation

The protected App Router layout must validate the session through:

```text
GET /api/auth/me
```

The request must:

* forward the incoming session cookie;
* disable response caching;
* fail closed when authentication cannot be confirmed; and
* complete before protected page content is rendered.

A forged, expired, revoked, or unknown cookie must not grant access.

### 4. Backend endpoint enforcement

Frontend route protection is not an authorization boundary.

Every protected backend endpoint must continue validating the authenticated backend session independently.

Manipulating frontend code, disabling JavaScript, or navigating directly to a URL must not provide access to protected backend resources.

## Protected route layout

Create a protected route group or shared layout comparable to:

```text
apps/web/app/
├── page.tsx
├── (auth)/
│   └── login/
│       └── page.tsx
└── (protected)/
    ├── layout.tsx
    ├── applications/
    │   └── page.tsx
    ├── services/
    │   └── page.tsx
    └── creditmodeler-service/
        └── page.tsx
```

The exact structure may differ, but session validation must be centralized.

Individual pages must not independently duplicate authentication logic.

## Intended-route restoration

When an unauthenticated user requests a protected route, preserve the requested internal path through a `next` query parameter.

Example:

```text
/creditmodeler-service
  → /login?next=/creditmodeler-service
  → successful login
  → /creditmodeler-service
```

The redirect target must be validated against an explicit allowlist of internal application routes.

The application must reject:

* absolute URLs;
* protocol-relative URLs;
* external domains;
* JavaScript URLs;
* malformed paths;
* unknown internal routes; and
* encoded values that resolve outside the application.

An invalid `next` value must fall back to:

```text
/applications
```

## Frontend authentication service

Create a centralized authentication service under `apps/web`.

Suggested responsibilities:

```text
apps/web/lib/auth/
├── auth-client.ts
├── auth-server.ts
├── auth-types.ts
├── redirect-target.ts
└── session.ts
```

### Browser authentication client

The browser-facing client must provide:

* `login(credentials)`;
* `getCurrentUser()`;
* `logout()`; and
* normalized authentication errors.

All requests requiring the session cookie must use:

```ts
credentials: "include"
```

### Server authentication client

The server-facing client must:

* read the incoming request cookies;
* forward the cookie header to `apps/api`;
* call `/api/auth/me`;
* use `cache: "no-store"`;
* distinguish unauthenticated and unavailable states; and
* never expose the raw session cookie to client components.

### API URL configuration

Use environment configuration rather than hard-coded hosts.

Suggested variables:

```text
API_BASE_URL
NEXT_PUBLIC_API_BASE_URL
AUTH_SESSION_COOKIE_NAME
```

`API_BASE_URL` should be used by server-side code.

`NEXT_PUBLIC_API_BASE_URL` should only be used when browser-side requests must communicate directly with the API.

No secret value may be exposed through a `NEXT_PUBLIC_` variable.

## Login form behavior

Preserve the current login component, DOM structure, class names, styles, dimensions, spacing, and responsive behavior.

Only replace the frontend placeholder submission behavior with the real API integration.

The form must preserve:

* username input;
* password input;
* current labels;
* existing submit button;
* existing validation area;
* existing result-message area;
* current hero ribbon;
* current panel alignment; and
* all current CSS classes.

### Submission lifecycle

The form must support these states:

```text
idle
validating
submitting
success
invalid_credentials
backend_unavailable
unexpected_error
```

During submission:

* the button must be disabled;
* duplicate requests must be prevented;
* the existing button label may temporarily display `Signing In...`;
* the password must not be logged;
* form data must not be stored in browser storage; and
* the interface must preserve its current dimensions.

After an invalid attempt:

* the generic error message must be displayed;
* the username may remain populated;
* the password should be cleared;
* focus should move appropriately for correction; and
* the page must not navigate.

## Session cookie requirements

The backend must remain the sole owner of the session cookie.

The frontend must not set the session cookie through JavaScript.

The cookie must be configured by the backend with:

* `HttpOnly`;
* `Secure` in HTTPS environments;
* an appropriate `SameSite` policy;
* `Path=/`;
* a defined expiration or maximum age; and
* no exposure to `document.cookie`.

Authentication tokens, session identifiers, or credentials must not be stored in:

* `localStorage`;
* `sessionStorage`;
* IndexedDB;
* URL parameters;
* React-persisted storage; or
* non-HTTP-only cookies.

## Cross-origin development configuration

When `apps/web` and `apps/api` use different local origins, the backend must allow only the explicitly configured frontend origin.

The CORS configuration must:

* use an explicit origin allowlist;
* enable credentials;
* allow the required authentication methods and headers; and
* never combine credentialed requests with `Access-Control-Allow-Origin: *`.

Production deployment should prefer same-origin routing through the planned reverse proxy.

## Session failure behavior

### Missing session

Redirect to:

```text
/login?next=<current-protected-path>
```

### Expired or revoked session

The protected route must:

* hide protected content;
* redirect to `/login`;
* preserve the intended route when safe; and
* avoid showing stale application content.

### Forged or unknown cookie

Treat it as unauthenticated.

Cookie presence alone must never allow protected content to render.

### Backend unavailable

When `/api/auth/me` cannot be reached:

* protected content must remain hidden;
* the application must fail closed;
* a controlled unavailable state may be displayed;
* a retry action may be provided; and
* the user must not be treated as authenticated.

## Logout integration

Where the current frontend already displays a logout control, connect that existing control to:

```text
POST /api/auth/logout
```

Logout must:

1. invoke the backend endpoint with credentials included;
2. clear any non-sensitive in-memory user state;
3. redirect to `/login`;
4. prevent previously rendered protected content from remaining visible; and
5. prevent browser Back navigation from restoring usable protected content without a new session check.

No visual redesign of the logout control is permitted.

## Visual non-regression requirements

Authentication integration must not change the existing appearance of `apps/web`.

The implementation must not modify:

* design tokens;
* colors;
* typography;
* gradients;
* shadows;
* borders;
* spacing;
* page geometry;
* sidebar positioning;
* top-bar sizing;
* hero ribbons;
* card layouts;
* responsive breakpoints; or
* workbench dimensions.

Authentication state components must reuse existing containers and style classes.

New visible banners, modal dialogs, loaders, or page wrappers must not be introduced unless they reuse the existing design and are explicitly required for an error state.

The login page before and after integration must remain visually equivalent in its idle state.

## Cache and rendering controls

Authentication-dependent responses must not be statically cached.

Session validation requests must use:

```ts
cache: "no-store"
```

Protected layouts must be dynamically rendered when required.

Pages must not reuse authenticated content across users through:

* static generation;
* shared server caches;
* cached `/api/auth/me` responses; or
* client caches that survive logout.

## Accessibility requirements

Preserve or improve:

* form labels;
* keyboard navigation;
* visible focus indicators;
* inline validation associations;
* accessible error messages;
* `aria-live` behavior for authentication results;
* disabled-button state; and
* focus management after errors or redirects.

Authentication status must not be communicated only through color.

## Testing requirements

### Unit tests

Cover:

* required-field validation;
* login request payload;
* `credentials: "include"`;
* generic invalid-credential handling;
* backend-unavailable handling;
* redirect-target validation;
* rejection of external redirect targets; and
* absence of browser-storage session persistence.

### Route tests

Verify:

```text
/ → /login
```

Verify that unauthenticated requests to:

```text
/applications
/services
/creditmodeler-service
```

are redirected before protected content is rendered.

### Session tests

Verify:

* valid credentials establish a usable session;
* invalid credentials do not establish a session;
* `/api/auth/me` confirms the authenticated user;
* an expired session is rejected;
* a revoked session is rejected;
* a forged cookie is rejected;
* a missing cookie is rejected; and
* backend unavailability fails closed.

### Navigation tests

Verify:

* successful login defaults to `/applications`;
* the safe `next` destination is restored;
* invalid `next` values fall back to `/applications`;
* authenticated users are redirected away from `/login`;
* logout redirects to `/login`; and
* browser Back does not bypass renewed session validation.

### Security tests

Verify that:

* protected content is unavailable with JavaScript disabled;
* changing client-side React state cannot unlock routes;
* cookie presence without a valid backend session does not unlock routes;
* direct URL entry cannot bypass authentication;
* no credentials or tokens appear in browser storage;
* no password appears in logs or error telemetry; and
* CORS does not allow arbitrary credentialed origins.

### Visual regression tests

Compare the login page before and after integration in the idle state.

The screenshot difference should be limited to unavoidable rendering variance.

Authentication integration must not alter:

* login panel position;
* form dimensions;
* field sizes;
* button size;
* ribbon position;
* typography; or
* surrounding shell geometry.

## Out of scope

This feature does not include:

* visual redesign;
* registration;
* password recovery;
* password-change screens;
* multi-factor authentication;
* corporate SSO;
* role-based authorization;
* user-administration interfaces;
* changes to the password-hashing algorithm;
* replacement of the backend session model;
* changes to application resource functionality; or
* migration to token storage in the browser.

## Definition of Done

The feature is complete when:

* accessing `/` redirects to `/login` at the server-routing level;
* the existing login form sends username and password to `apps/api`;
* successful login creates a backend-managed session;
* the session is validated through `/api/auth/me`;
* authenticated users can access `/applications`, `/services`, and `/creditmodeler-service`;
* unauthenticated users cannot access protected routes directly;
* forged, expired, or revoked cookies do not grant access;
* protected content is never rendered before validation;
* safe intended destinations are restored after login;
* open redirects are prevented;
* authenticated users visiting `/login` are redirected to `/applications`;
* the existing logout control terminates the session;
* no session credential is stored in browser-managed storage;
* authentication requests include credentials correctly;
* integration works in local development and same-host deployment;
* the current frontend design and styles remain unchanged;
* functional, security, navigation, and visual-regression tests pass; and
* backend endpoints continue enforcing authentication independently of the frontend.
