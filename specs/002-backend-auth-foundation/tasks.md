---

description: "Executable task list for Backend Authentication Foundation"
---

# Tasks: Backend Authentication Foundation

**Input**: Design documents from `/specs/002-backend-auth-foundation/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No separate test-writing tasks are included because the feature specification did not explicitly request a TDD workflow. Validation is captured through implementation tasks and quickstart execution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Backend application code lives under `apps/api/app/`
- Backend tests live under `apps/api/tests/`
- Feature documentation lives under `specs/002-backend-auth-foundation/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the backend project skeleton and baseline dependency/config files.

- [X] T001 Create the backend directory skeleton under `apps/api/app/`, `apps/api/tests/`, and `apps/api/app/modules/`
- [X] T002 Initialize backend package and dependency manifests in `apps/api/pyproject.toml`, `apps/api/requirements.txt`, and `apps/api/app/__init__.py`
- [X] T003 [P] Create backend environment example and runtime ignore rules in `apps/api/.env.example` and `apps/api/.gitignore`
- [X] T004 [P] Create package markers for planned modules in `apps/api/app/api/__init__.py`, `apps/api/app/core/__init__.py`, `apps/api/app/db/__init__.py`, `apps/api/app/modules/auth/__init__.py`, and `apps/api/app/modules/health/__init__.py`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the shared application shell, persistence, configuration, and security building blocks required before any user story work.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Create typed backend settings and configuration loading in `apps/api/app/core/config.py`
- [X] T006 [P] Create database engine, session factory, and base database helpers in `apps/api/app/core/database.py` and `apps/api/app/db/base.py`
- [X] T007 [P] Create password hashing and credential verification helpers in `apps/api/app/core/security.py`
- [X] T008 [P] Create backend-managed session token and cookie helpers in `apps/api/app/core/session.py`
- [X] T009 Create root API router assembly in `apps/api/app/api/router.py`
- [X] T010 Create FastAPI application entrypoint and shared startup wiring in `apps/api/app/main.py`
- [X] T011 Create migration configuration scaffold for the application database in `apps/api/alembic.ini`, `apps/api/alembic/env.py`, and `apps/api/alembic/versions/.gitkeep`
- [X] T012 Create backend test scaffolding and shared fixtures in `apps/api/tests/conftest.py`, `apps/api/tests/unit/__init__.py`, `apps/api/tests/integration/__init__.py`, and `apps/api/tests/contract/__init__.py`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel where dependencies allow

---

## Phase 3: User Story 1 - Sign in as an internal user (Priority: P1) 🎯 MVP

**Goal**: Deliver backend-managed username/password authentication with secure password storage, login/logout endpoints, current-user lookup, and browser cookie session handling.

**Independent Test**: Submit valid and invalid credentials through the auth endpoints, confirm successful login sets a backend-managed cookie session, confirm `/api/auth/me` returns the authenticated user, and confirm logout clears that session without exposing whether username or password was incorrect.

### Implementation for User Story 1

- [X] T013 [P] [US1] Create auth persistence models for internal users and authenticated sessions in `apps/api/app/modules/auth/models.py`
- [X] T014 [P] [US1] Create auth request/response schemas for login, logout, and current-user flows in `apps/api/app/modules/auth/schemas.py`
- [X] T015 [US1] Create auth repository methods for user lookup and session persistence in `apps/api/app/modules/auth/repository.py`
- [X] T016 [US1] Implement auth service logic for password validation, session creation, session revocation, and current-user lookup in `apps/api/app/modules/auth/service.py`
- [X] T017 [US1] Implement auth routes for `POST /api/auth/login`, `POST /api/auth/logout`, and `GET /api/auth/me` in `apps/api/app/modules/auth/api.py`
- [X] T018 [US1] Register the auth router and auth module wiring in `apps/api/app/api/router.py` and `apps/api/app/main.py`
- [X] T019 [US1] Create the initial application database migration for internal users and authenticated sessions in `apps/api/alembic/versions/001_auth_foundation.py`
- [X] T020 [US1] Add backend integration coverage for login, invalid login, current-user lookup, and logout flows in `apps/api/tests/integration/test_auth_session_flow.py`
- [X] T021 [US1] Add integration coverage for secure HTTP-only session cookie behavior on login and logout in `apps/api/tests/integration/test_auth_cookie_behavior.py`

**Checkpoint**: User Story 1 should provide a complete backend sign-in/session flow for internal users

---

## Phase 4: User Story 2 - Verify the backend application is available (Priority: P1)

**Goal**: Deliver a runnable backend service with a health endpoint that proves the API can start and respond independently from the frontend.

**Independent Test**: Start the backend process without the frontend and confirm `GET /api/health` returns a successful availability response.

### Implementation for User Story 2

- [X] T022 [P] [US2] Create the health endpoint route in `apps/api/app/modules/health/api.py`
- [X] T023 [US2] Register the health router in `apps/api/app/api/router.py`
- [X] T024 [US2] Add contract coverage for `GET /api/health` in `apps/api/tests/contract/test_health_api.py`
- [X] T025 [US2] Add startup and health integration coverage in `apps/api/tests/integration/test_health_startup.py`

**Checkpoint**: User Story 2 should prove the backend foundation can run and expose an availability check on its own

---

## Phase 5: User Story 3 - Protect future internal API routes (Priority: P2)

**Goal**: Deliver a reusable authenticated-session dependency and at least one protected endpoint that proves future internal routes can enforce backend session checks consistently.

**Independent Test**: Call a protected backend endpoint with and without a valid authenticated session and confirm only authenticated requests succeed.

### Implementation for User Story 3

- [X] T026 [US3] Implement the reusable current-user/session-protection dependency in `apps/api/app/modules/auth/service.py` and `apps/api/app/core/session.py`
- [X] T027 [US3] Add a protected validation endpoint or protected route group example in `apps/api/app/modules/auth/api.py`
- [X] T028 [US3] Add contract coverage for protected access behavior in `apps/api/tests/contract/test_auth_protected_api.py`
- [X] T029 [US3] Add integration coverage for authenticated versus unauthenticated protected access in `apps/api/tests/integration/test_protected_access.py`

**Checkpoint**: User Story 3 should prove the backend can enforce authenticated access on future internal endpoints

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize developer operability, documentation, and end-to-end validation across the delivered stories.

- [X] T030 [P] Document backend setup, local run, and auth usage in `apps/api/README.md`
- [X] T031 Update frontend integration expectations for the existing login flow in `docs/SPEC.md`
- [X] T032 [P] Add a simple internal-user seed utility in `apps/api/scripts/seed_internal_user.py`
- [X] T033 Run the backend validation scenarios from `specs/002-backend-auth-foundation/quickstart.md` and record any required adjustments in `specs/002-backend-auth-foundation/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion
- **User Story 3 (Phase 5)**: Depends on Foundational completion and reuses User Story 1 authentication/session components
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational and delivers the MVP authentication core
- **User Story 2 (P1)**: Starts after Foundational and can proceed in parallel with User Story 1
- **User Story 3 (P2)**: Starts after Foundational but depends on the auth/session behavior implemented in User Story 1

### Within Each User Story

- Persistence models and schemas before repositories and services
- Repositories before service orchestration
- Services before route completion
- Route wiring before story-specific integration validation

### Parallel Opportunities

- `T003` and `T004` can run in parallel during Setup
- `T006`, `T007`, and `T008` can run in parallel during Foundational
- After Foundational, User Story 1 and User Story 2 can proceed in parallel
- `T013` and `T014` can run in parallel inside User Story 1
- `T030` and `T032` can run in parallel during Polish

---

## Parallel Example: User Story 1

```bash
# Launch the auth model and schema tasks together:
Task: "Create auth persistence models in apps/api/app/modules/auth/models.py"
Task: "Create auth request/response schemas in apps/api/app/modules/auth/schemas.py"

# Once foundational helpers exist, run backend helper work in parallel:
Task: "Create database helpers in apps/api/app/core/database.py and apps/api/app/db/base.py"
Task: "Create password hashing helpers in apps/api/app/core/security.py"
Task: "Create session helpers in apps/api/app/core/session.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate login, logout, and current-user flow independently
5. Demo the authentication foundation before adding more backend surface area

### Incremental Delivery

1. Complete Setup + Foundational to create the backend shell
2. Add User Story 1 to deliver real authenticated sessions
3. Add User Story 2 to prove independent backend operability
4. Add User Story 3 to make protected-route enforcement reusable
5. Finish with documentation, seeding, and quickstart validation

### Parallel Team Strategy

1. One developer completes setup and app scaffolding
2. One developer builds shared config/database/security helpers during Foundational
3. After Foundational, one developer can take User Story 1 while another takes User Story 2
4. User Story 3 follows once the User Story 1 auth/session behavior is stable

---

## Notes

- All tasks follow the required checklist format with IDs and file paths
- `[P]` is used only where tasks can proceed without file conflicts or incomplete prerequisites
- User-story labels are applied only to story-phase tasks
- User Story 1 is the recommended MVP slice because it delivers the core authentication capability required by the feature
