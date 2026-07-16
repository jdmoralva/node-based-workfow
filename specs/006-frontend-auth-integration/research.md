# Research: Frontend Authentication Integration

## Frontend auth integration boundary

### Decision
Keep authentication state owned by `apps/api` and add a small frontend auth service layer in `apps/web` that only submits credentials, validates the current user, signs out, and normalizes auth outcomes.

### Rationale
The backend already exposes the required session-auth endpoints and owns the cookie lifecycle. A thin frontend service keeps the login form, route protection, and logout flow consistent without duplicating cookie or token logic in the browser.

### Alternatives considered
- Put all fetch calls directly in page and component files: rejected because it spreads auth behavior across multiple routes and makes route protection harder to keep consistent.
- Manage a frontend token or cookie manually: rejected because the spec requires the backend to remain the sole owner of session credentials.

## Session confirmation rule

### Decision
Treat `GET /api/auth/me` as the authoritative source of authenticated state after sign-in and before protected routes render.

### Rationale
`POST /api/auth/login` alone only confirms that submitted credentials were accepted. The feature explicitly requires a second-step session confirmation before treating the user as authenticated, which also covers cookie propagation and revoked-or-invalid session cases.

### Alternatives considered
- Treat a successful login response as sufficient: rejected because it can misclassify users as authenticated when session validation fails.
- Use only a lightweight protected-check route for all frontend validation: rejected because the feature and backend contract already define `/api/auth/me` as the primary session-validation endpoint.

## Protected-route architecture

### Decision
Use layered route protection made of a server-side root redirect, middleware-based early rejection for obviously unauthenticated requests, and authoritative session validation in a protected layout before protected content renders.

### Rationale
No single layer covers all failure modes. Middleware improves fast rejection and intended-route preservation, while layout-level validation prevents forged, expired, or revoked cookies from rendering protected UI.

### Alternatives considered
- Client-side route guards only: rejected because they allow flashes of protected content and are bypassable when JavaScript is disabled.
- Middleware-only protection: rejected because cookie presence is not proof of a valid backend session.

## Protected route grouping

### Decision
Introduce a shared protected route group or equivalent shared layout in `apps/web` so `/applications`, `/services`, and `/creditmodeler-service` inherit the same server-side auth validation.

### Rationale
The current app has independent route files with no shared auth boundary. A protected layout keeps auth checks centralized and reduces repeated logic across page files.

### Alternatives considered
- Duplicate auth validation in every page route: rejected because it is repetitive and increases the chance of inconsistent behavior.
- Keep all routes flat and try to share only helper functions: rejected because route structure itself should express the protected/public boundary.

## Redirect-target safety

### Decision
Allow intended-route restoration only for an explicit allowlist of internal application paths and fall back to `/applications` for any absolute URL, external domain, malformed path, or unknown route.

### Rationale
The feature includes a direct open-redirect risk. A short allowlist is the safest MVP rule because the protected route inventory is small and explicit.

### Alternatives considered
- Accept any path that begins with `/`: rejected because encoded or malformed values can still escape intended boundaries.
- Preserve no intended destination at all: rejected because it degrades user flow unnecessarily when safe restoration is feasible.

## Login UI preservation approach

### Decision
Keep the existing `LoginForm` markup, CSS classes, labels, and layout containers intact while swapping the placeholder submit/result behavior for real auth state handling.

### Rationale
The feature forbids redesign and requires idle-state visual equivalence. The lowest-risk path is to preserve the existing form structure and only change its behavior, messages, disabled state, and redirect flow.

### Alternatives considered
- Replace the login form with a new component tree: rejected because it would create unnecessary visual regression risk.
- Add separate banners, wrappers, or loaders outside the current containers: rejected because they would likely change geometry and hierarchy.

## Local development connectivity

### Decision
Support direct browser-to-API auth requests in split-origin local development through explicit environment-driven API base URLs and credentialed requests, while keeping same-host deployment as the preferred production shape.

### Rationale
The repo already runs `apps/web` and `apps/api` separately in development. Environment-driven URLs avoid hardcoded hosts and preserve a path to same-host deployment later.

### Alternatives considered
- Hardcode localhost API hosts in frontend code: rejected because it is brittle and environment-specific.
- Require same-origin development only: rejected because the current repo already supports separate app runtimes.

## Frontend test strategy

### Decision
Use three levels of verification in `apps/web`: unit tests for login helpers and redirect-target validation, Playwright end-to-end tests for route/auth flows, and visual checks for idle-state login parity.

### Rationale
This feature changes both local form behavior and server-side routing behavior. Unit tests keep auth-state branching cheap to verify, Playwright covers redirects and session behavior end to end, and visual tests protect the non-regression requirement.

### Alternatives considered
- End-to-end tests only: rejected because redirect-target and error-state logic deserve smaller, faster checks.
- Unit tests only: rejected because protected-route behavior depends on real routing and session propagation.
