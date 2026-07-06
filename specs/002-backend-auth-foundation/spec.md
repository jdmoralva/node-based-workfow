# Feature Specification: Backend Authentication Foundation

**Feature Branch**: `[002-backend-auth-foundation]`

**Created**: 2026-07-05

**Status**: Draft

**Input**: User description: "Start the backend implementation according to the architectural decisions documented in `docs/adr/0001-backend-modular-monolith-mvp.md` and `docs/adr/0002-separar-web-api-un-host.md`.

The backend must be implemented under `apps/api` as a FastAPI-based modular monolith. The initial implementation should establish the backend foundation, project structure, application entry point, configuration layer, database integration, and basic API routing conventions required for the MVP.

The implementation must preserve a clear separation between `apps/web` and `apps/api`. The frontend and backend must remain independent applications, even if they are intended to be deployed together on a single host during the MVP stage.

Additionally, continue the implementation of the internal authentication flow described in `docs/adr/0008-autenticacion-interna-usuario-contrasena.md`.

Functional requirements:

* Create the initial `apps/api` backend structure using FastAPI.
* Organize the backend as a modular monolith, separating domain modules and support modules clearly.
* Add a backend application entry point.
* Add a health-check endpoint to validate that the API is running.
* Add the initial SQLite database configuration.
* Define the initial persistence layer required for internal users.
* Implement an internal user model suitable for username/password authentication.
* Store user credentials only in the backend database.
* Store passwords using a secure password hashing mechanism.
* Implement a login endpoint that validates username and password credentials.
* Implement backend-managed authenticated sessions.
* Use a secure `HTTP-only` cookie for session handling.
* Implement a logout endpoint that invalidates or clears the authenticated session.
* Add a current-user endpoint, such as `/auth/me`, to allow the frontend to verify the authenticated user.
* Add the initial authentication dependency or middleware required to protect future internal API endpoints.
* Keep authorization minimal for the MVP; role-based access control is not required at this stage unless already defined elsewhere.
* Ensure the implementation remains compatible with the existing `login.html` frontend page and future frontend integration.

Architecture requirements:

* The backend must live under `apps/api`.
* The existing frontend remains outside this feature's implementation scope and continues to integrate through HTTP API calls until a future `apps/web` application is introduced.
* The backend must not be embedded directly into the frontend.
* The frontend must communicate with the backend through HTTP API endpoints.
* The backend should be deployable as a single application process for the MVP.
* The codebase should avoid unnecessary microservice, serverless, or event-driven complexity at this stage.
* The backend structure must remain easy to evolve into separated services in the future if needed.

Security requirements:

* Plain-text passwords must never be stored.
* Password validation must happen only in the backend.
* Authentication state must be managed by the backend.
* Session cookies must be configured as `HTTP-only`.
* Sensitive authentication data must not be exposed to the frontend.
* The frontend must not store credentials, password hashes, or session tokens manually.
* Authentication errors must avoid exposing whether the username or password was incorrect.

Out of scope:

* Corporate SSO integration.
* External IAM integration.
* Multi-factor authentication.
* Full role-based access control.
* Advanced user administration screens.
* Password recovery flow.
* Deployment automation.
* Reverse proxy production configuration, unless required only for local development wiring.

Definition of Done:

* `apps/api` contains a working FastAPI backend foundation.
* The backend can be started locally.
* A health-check endpoint is available.
* SQLite integration is configured.
* An internal user persistence model exists.
* Passwords are securely hashed before being stored.
* Login, logout, and current-user endpoints are implemented.
* Authenticated sessions are managed by the backend.
* Session state is handled through a secure `HTTP-only` cookie.
* At least one protected endpoint or authentication dependency is available to validate the session flow.
* The backend remains logically separated from the existing frontend implementation and any future `apps/web` application.
* The implementation follows the modular monolith approach defined for the MVP."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign in as an internal user (Priority: P1)

As an internal pilot user, I want to sign in with my assigned username and password so that the product can protect internal capabilities without exposing credential handling to the browser.

**Why this priority**: Internal authentication is required before the MVP can safely expose portfolio, pipeline, and chat functionality to pilot users.

**Independent Test**: Can be fully tested by submitting valid and invalid credentials, confirming that successful sign-in establishes backend-managed access, and verifying that failed sign-in does not reveal whether the username or password was incorrect.

**Acceptance Scenarios**:

1. **Given** an internal user submits valid credentials, **When** the user signs in, **Then** the backend authenticates the user and creates a backend-managed session.
2. **Given** an internal user submits invalid credentials, **When** the user signs in, **Then** the backend rejects the attempt with a generic authentication failure outcome.
3. **Given** an authenticated session exists, **When** the frontend asks for the current user, **Then** the backend returns the authenticated user identity without exposing sensitive credential data.

---

### User Story 2 - Verify the backend application is available (Priority: P1)

As a product operator, I want a lightweight way to confirm that the backend application is running so that I can validate the MVP backend foundation independently from the frontend application.

**Why this priority**: A clear backend readiness check is necessary to operate the API as its own application while the frontend and backend remain separately deployable on the same host.

**Independent Test**: Can be fully tested by starting the backend application without the frontend and confirming that a health-check route responds successfully.

**Acceptance Scenarios**:

1. **Given** the backend application has been started, **When** an operator checks the backend health route, **Then** the backend confirms that the API is available.
2. **Given** the frontend application is unavailable, **When** the backend is started on its own, **Then** the backend still exposes its own health-check and authentication routes.

---

### User Story 3 - Protect future internal API routes (Priority: P2)

As a product team member, I want the backend foundation to include a reusable authenticated-session check so that future internal API routes can be protected consistently without redesigning the authentication flow.

**Why this priority**: MVP authorization stays minimal, but the backend still needs a standard session-validation mechanism before additional internal endpoints are added.

**Independent Test**: Can be fully tested by calling a protected backend path or dependency target with and without an authenticated session and confirming that access is granted only when the backend session is valid.

**Acceptance Scenarios**:

1. **Given** a request reaches a protected backend path without a valid session, **When** the backend evaluates access, **Then** the request is denied.
2. **Given** a request reaches a protected backend path with a valid session, **When** the backend evaluates access, **Then** the request is treated as authenticated for MVP access purposes.

### Edge Cases

- If the login request omits the username or password, the backend rejects the request without creating a session and returns a safe client-facing validation error.
- If the backend receives a logout request without an active authenticated session, it returns a safe sign-out outcome and leaves the client unauthenticated.
- If the current-user request is made after the session has been cleared or expired, the backend returns an unauthenticated outcome and no user identity payload.
- If an internal username exists but the submitted password is incorrect, the backend returns the same generic authentication failure outcome used for any invalid credential attempt.
- If the backend application is reachable but the application data store is unavailable, health and authentication routes return a failure outcome that does not expose sensitive backend details.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a dedicated backend application under `apps/api` that remains logically separate from `apps/web`.
- **FR-002**: The system MUST organize the backend as a single deployable application with clearly separated business modules and support modules.
- **FR-003**: The system MUST provide a backend application entry point that allows the API to be started independently from the frontend application.
- **FR-004**: The system MUST expose a health-check route that allows operators and integrators to confirm that the backend application is running.
- **FR-005**: The system MUST provide an application data store suitable for persisting internal user records and authenticated-session state needed for the MVP.
- **FR-006**: The system MUST persist internal user identities in the backend data store.
- **FR-007**: The system MUST store password representations in a non-plain-text form suitable for secure credential verification.
- **FR-008**: The system MUST validate submitted usernames and passwords only in the backend.
- **FR-009**: The system MUST provide a login route that authenticates valid internal credentials and rejects invalid credentials without revealing whether the username or password was incorrect.
- **FR-010**: The system MUST create and manage authenticated session state in the backend after successful sign-in.
- **FR-011**: The system MUST use a secure HTTP-only cookie to carry the session between the browser and the backend.
- **FR-012**: The system MUST provide a logout route that clears or invalidates the authenticated session.
- **FR-013**: The system MUST provide a current-user route so the frontend can determine whether a user is authenticated and which internal user identity is active.
- **FR-014**: The system MUST provide a reusable session-validation mechanism that future internal API routes can use for access protection.
- **FR-015**: The system MUST keep MVP authorization minimal and MUST NOT require role-based access control for this feature.
- **FR-016**: The system MUST keep sensitive authentication data out of frontend-managed storage and frontend-visible responses.
- **FR-017**: The system MUST remain compatible with the existing login page and future frontend calls that rely on backend-managed sign-in, sign-out, and current-user checks.
- **FR-018**: The system MUST remain deployable as one backend application process for the MVP while preserving boundaries that allow future separation by domain if needed.
- **FR-019**: The system MUST remain within MVP scope by excluding corporate identity integration, multi-factor authentication, advanced user administration, password recovery, and production deployment automation from this feature.

### Key Entities *(include if feature involves data)*

- **Backend Application**: The dedicated product backend that serves API routes, owns business logic, and runs independently from the frontend while sharing the same host during the MVP.
- **Internal User**: A pilot user identity stored in the backend data store and used for username/password authentication.
- **Password Credential Record**: The backend-only stored credential representation associated with an internal user and used for secure password verification.
- **Authenticated Session**: The backend-managed authenticated state established after successful sign-in and cleared on logout or expiry.
- **Protected API Access Check**: The reusable backend validation step that confirms whether a request is associated with a valid authenticated session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of sign-in attempts are validated by the backend without requiring the frontend to store or verify credentials.
- **SC-002**: 100% of stored password records are persisted in a non-plain-text form before the corresponding user can authenticate.
- **SC-003**: 100% of authentication failures return the same user-facing failure outcome regardless of whether the username or password was incorrect.
- **SC-004**: 100% of current-user and protected-route checks correctly distinguish between requests with a valid authenticated session and requests without one during functional verification.
- **SC-005**: The backend application can be started and health-checked independently from the frontend in the MVP environment.

## Assumptions

- Internal pilot users receive their usernames and initial passwords through an administrative process outside the scope of this feature.
- Minimal MVP authorization means any authenticated internal user can access the same protected backend capabilities unless a future feature introduces finer-grained rules.
- The frontend continues to rely on backend-managed cookies and does not need to manage session tokens directly.
- The same application data store can hold both internal user records and session-related data for the MVP phase.
- Same-host deployment means the frontend and backend share infrastructure location while remaining independently runnable and independently changeable applications.
