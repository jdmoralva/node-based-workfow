# Research: Backend Authentication Foundation

## Backend application boundaries

### Decision
Organize `apps/api` as a self-contained modular monolith with domain-first modules and a thin shared support layer.

### Rationale
ADR-001 requires a modular monolith, and `docs/SPEC.md` already separates product capabilities by domain. A domain-first structure keeps the authentication module bounded, avoids a generic shared-services blob, and leaves clean seams for later modules such as datasets, pipelines, execution, and chat.

### Alternatives considered
- Flat layer-only folders for all models, services, and repositories: rejected because they blur domain boundaries as the backend grows.
- Independent microservices from day one: rejected by ADR-001 as unnecessary complexity for the MVP.

## Application entrypoint and routing

### Decision
Use a small `app/main.py` entrypoint that builds one backend application, applies shared middleware and settings, and mounts module routers under a stable `/api` prefix.

### Rationale
This preserves the separation required by ADR-002 while keeping the MVP deployable as one backend process. It also keeps startup wiring centralized without mixing business logic into the entrypoint.

### Alternatives considered
- A single oversized entrypoint file with all route and setup logic inline: rejected because it does not scale as new modules are added.
- Multiple application objects per domain: rejected as premature composition complexity for the MVP.

## Configuration management

### Decision
Use one typed, environment-driven configuration layer for application settings, cookie/session behavior, and database paths.

### Rationale
Centralized configuration keeps sensitive values in the backend, avoids scattered environment access, and supports local and same-host MVP deployment without hardcoded runtime values.

### Alternatives considered
- Reading environment variables directly throughout the codebase: rejected because it spreads configuration logic and makes validation harder.
- Hardcoded checked-in configuration values: rejected because they weaken portability and secret handling.

## Application persistence strategy

### Decision
Use a dedicated SQLite application database for internal users and authenticated sessions, while keeping future portfolio data storage separate.

### Rationale
This matches the product architecture and keeps authentication and application state isolated from future business-data querying concerns. It also supports same-host MVP simplicity without introducing extra infrastructure.

### Alternatives considered
- A single combined database for application state and future portfolio data: rejected because it mixes operational metadata with business data and makes future separation harder.
- A heavier database platform from day one: rejected because it adds operational overhead beyond MVP needs.

## Password protection

### Decision
Use Argon2id-based password hashing and store only the hashed password representation in the backend database.

### Rationale
Argon2id is the strongest practical default for new password-based systems and aligns with the requirement that plaintext passwords must never be stored.

### Alternatives considered
- bcrypt: acceptable but not preferred as the new default.
- Fast or reversible hashing approaches: rejected because they do not meet secure password storage requirements.

## Session management model

### Decision
Use backend-managed server-side sessions stored in the application database, with an opaque session identifier carried in a secure HTTP-only cookie.

### Rationale
This is the most direct implementation of ADR-008 and supports logout, invalidation, and protected-route checks without exposing authentication state details to the frontend.

### Alternatives considered
- Stateless JWT-based browser sessions: rejected because they add rotation and revocation complexity the MVP does not need.
- Client-managed auth tokens in browser storage: rejected because the frontend must not manage session tokens manually.

## Authentication endpoint conventions

### Decision
Define explicit sign-in, sign-out, current-user, health, and protected-route validation endpoints under the backend API.

### Rationale
Explicit route boundaries are easy for the existing login page and future frontend application to consume and make the authentication contract easy to test independently from the UI.

### Alternatives considered
- Collapsing all session actions into one generic session endpoint: rejected because it is less explicit for the MVP and complicates frontend integration.

## Authentication failure behavior

### Decision
Return one generic authentication failure outcome for invalid credentials and one generic unauthenticated outcome for missing, expired, or invalid sessions.

### Rationale
This reduces user-enumeration risk and satisfies the requirement not to reveal whether the username or password was incorrect.

### Alternatives considered
- Distinct responses for unknown user versus wrong password: rejected because they expose sensitive authentication information.

## Protected-route enforcement

### Decision
Implement one central session-validation dependency that loads the authenticated user from the backend session and can be applied to future protected routes.

### Rationale
This keeps access checks consistent, testable, and reusable while MVP authorization remains minimal.

### Alternatives considered
- Per-endpoint manual session checks: rejected because they are repetitive and error-prone.
- Middleware-only protection without a reusable dependency: rejected because it is less explicit and less flexible for route-level access control.

## Backend test strategy

### Decision
Create a backend-owned test suite with unit, integration, and API contract coverage focused on startup, health, authentication, session handling, and protected access.

### Rationale
The repo currently has no backend application, so the highest-value early checks are the foundation behaviors that prove the app starts, routes correctly, persists auth state, and protects access.

### Alternatives considered
- Manual validation only: rejected because session and security behavior need repeatable verification.
- Full frontend-to-backend end-to-end coverage as the primary test strategy: rejected because it is too heavy for the initial backend foundation.
