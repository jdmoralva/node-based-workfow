---

description: "Executable task list for frontend authentication integration"
---

# Tasks: Frontend Authentication Integration

**Input**: Design documents from `/specs/006-frontend-auth-integration/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/web-auth-session-contract.md, quickstart.md

**Tests**: Include unit, end-to-end, and visual-regression tasks because the feature spec explicitly requires automated authentication, route-protection, security-sensitive session, and visual non-regression coverage.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated as an independently testable increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]** marks tasks that can run in parallel because they touch different files and have no dependency on unfinished tasks.
- **[Story]** maps tasks to the corresponding user story from `spec.md`.
- Every task includes an exact file path.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create shared auth configuration and test scaffolding used by all stories.

- [X] T001 Create frontend auth environment template in `apps/web/.env.example`
- [X] T002 [P] Add shared auth test utilities for browser/session setup in `apps/web/tests/helpers/auth-session.ts`
- [X] T003 [P] Document split-origin and same-host auth setup in `apps/web/README.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the shared frontend auth foundation that all user stories depend on.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [X] T004 Extend route metadata with public/protected access rules and default redirect targets in `apps/web/config/routes.ts`
- [X] T005 [P] Define shared auth types and normalized auth outcome helpers in `apps/web/lib/auth/auth-types.ts`
- [X] T006 [P] Implement safe redirect-target parsing and allowlist validation in `apps/web/lib/auth/redirect-target.ts`
- [X] T007 [P] Implement browser-side login and logout request helpers in `apps/web/lib/auth/auth-client.ts`
- [X] T008 [P] Implement server-side current-user and session-validation helpers in `apps/web/lib/auth/auth-server.ts`
- [X] T009 Implement shared frontend session orchestration helpers in `apps/web/lib/auth/session.ts`
- [X] T010 Create middleware-based early auth redirects with explicit static-asset and internal-route exclusions in `apps/web/middleware.ts`

**Checkpoint**: Shared auth types, request helpers, redirect validation, and middleware are ready for story work.

---

## Phase 3: User Story 1 - Sign in through the existing login experience (Priority: P1) 🎯 MVP

**Goal**: Replace the frontend-only placeholder login flow with real backend-backed sign-in while preserving the current login UI.

**Independent Test**: Open `/login`, submit valid and invalid credentials, and confirm only a validated backend session grants authenticated access while the login page stays visually consistent in its idle state.

### Tests for User Story 1

- [X] T011 [P] [US1] Replace placeholder login form assertions with real auth-state unit coverage in `apps/web/tests/unit/login-form.test.tsx`
- [X] T012 [P] [US1] Add browser auth client unit coverage for login outcome normalization in `apps/web/tests/unit/auth-client.test.ts`
- [X] T013 [P] [US1] Add login interaction and accessibility coverage for submitting, disabled state, invalid-credential messaging, and login-service unavailability in `apps/web/tests/e2e/local-interactions.spec.ts` and `apps/web/tests/e2e/accessibility.spec.ts`

### Implementation for User Story 1

- [X] T014 [US1] Wire real sign-in, error-state handling, and default post-login navigation into `apps/web/features/login/LoginForm.tsx`
- [X] T015 [US1] Redirect authenticated visitors away from `/login` in `apps/web/app/login/page.tsx`

**Checkpoint**: User Story 1 should support valid sign-in, generic invalid-credential handling, unavailable-service handling, and authenticated-user redirect from `/login`.

---

## Phase 4: User Story 2 - Reach protected pages only after authentication (Priority: P1)

**Goal**: Make `/login` the application entry gate and prevent protected pages from rendering without confirmed authentication.

**Independent Test**: Visit `/`, `/applications`, `/services`, and `/creditmodeler-service` with and without a valid session and confirm that protected content never appears before authentication is confirmed.

### Tests for User Story 2

- [X] T016 [P] [US2] Replace landing-page route assumptions with redirect and protected-route unit coverage in `apps/web/tests/unit/routes.test.ts`
- [X] T017 [P] [US2] Add end-to-end route-protection, direct-entry, static/internal-route exclusion, and current-user-unavailable coverage in `apps/web/tests/e2e/routes.spec.ts` and `apps/web/tests/e2e/navigation.spec.ts`

### Implementation for User Story 2

- [X] T018 [US2] Convert `apps/web/app/page.tsx` into a server redirect to `/login`
- [X] T019 [US2] Move protected route pages into `apps/web/app/(protected)/applications/page.tsx`, `apps/web/app/(protected)/services/page.tsx`, and `apps/web/app/(protected)/creditmodeler-service/page.tsx`
- [X] T020 [US2] Update protected route imports and route-page references after the route-group move in `apps/web/tests/unit/routes.test.ts` and `apps/web/tests/e2e/routes.spec.ts`
- [X] T021 [US2] Implement authoritative protected-layout session validation for protected-route entry, including backend-unavailable fail-closed handling before protected content renders, in `apps/web/app/(protected)/layout.tsx`

**Checkpoint**: User Story 2 should enforce `/login` as the entry point and protect all initial app routes through middleware plus server-side layout validation.

---

## Phase 5: User Story 3 - Resume intended work and recover safely from session loss (Priority: P2)

**Goal**: Restore only safe intended routes after sign-in and ensure logout or session loss returns the user to a safe unauthenticated state.

**Independent Test**: Open a protected route while signed out, sign in and confirm safe restoration, then sign out or invalidate the session and verify protected content cannot be reused without renewed validation.

### Tests for User Story 3

- [X] T022 [P] [US3] Add redirect-target allowlist unit coverage in `apps/web/tests/unit/redirect-target.test.ts`
- [X] T023 [P] [US3] Add logout-control unit coverage in `apps/web/tests/unit/sidebar-logout.test.tsx`
- [X] T024 [P] [US3] Add intended-route restoration, logout, and session-loss end-to-end coverage in `apps/web/tests/e2e/navigation.spec.ts`

### Implementation for User Story 3

- [X] T025 [US3] Preserve and restore safe `next` destinations in `apps/web/features/login/LoginForm.tsx` and `apps/web/lib/auth/redirect-target.ts`
- [X] T026 [US3] Connect the existing logout control to backend sign-out in `apps/web/components/shell/Sidebar.tsx`
- [X] T027 [US3] Enforce logout, browser-Back, and subsequent session revalidation behavior for expired, revoked, missing, forged, and backend-unavailable session states in `apps/web/app/(protected)/layout.tsx`, `apps/web/app/login/page.tsx`, and `apps/web/lib/auth/session.ts`

**Checkpoint**: User Story 3 should restore only approved destinations, support logout from the existing control, and require renewed auth after session loss or browser Back.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finish visual, documentation, and full-validation work that spans multiple stories.

- [X] T028 [P] Add idle-state login visual non-regression coverage in `apps/web/tests/visual/migrated-pages.spec.ts`
- [X] T029 [P] Update auth validation instructions and route expectations in `apps/web/README.md` and `specs/006-frontend-auth-integration/quickstart.md`
- [X] T030 Run the full auth validation suite from `specs/006-frontend-auth-integration/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup and blocks all story implementation.
- **User Story 1 (Phase 3)**: Depends on Foundational completion.
- **User Story 2 (Phase 4)**: Depends on Foundational completion and reuses the auth flow delivered in User Story 1 for authenticated route validation.
- **User Story 3 (Phase 5)**: Depends on Foundational completion and builds on the working sign-in and protected-route behavior from User Stories 1 and 2.
- **Polish (Phase 6)**: Depends on the desired user stories being complete.

### User Story Dependencies

- **US1**: Starts first after Foundational and defines the MVP sign-in experience.
- **US2**: Builds on shared auth helpers and the working authenticated session flow from US1.
- **US3**: Builds on US1 sign-in plus US2 protected-route enforcement.

### Within Each User Story

- Story tests come before implementation tasks.
- Shared auth helpers come before route wiring.
- Route wiring comes before story-level end-to-end validation.
- A story should be validated independently before moving to the next priority.

### Parallel Opportunities

- `T002` and `T003` can run in parallel during setup.
- `T005`, `T006`, `T007`, and `T008` can run in parallel after `T004` defines route metadata expectations.
- US1 tests `T011`, `T012`, and `T013` can run in parallel.
- US2 tests `T016` and `T017` can run in parallel.
- US3 tests `T022`, `T023`, and `T024` can run in parallel.
- Polish tasks `T028` and `T029` can run in parallel before final validation in `T030`.

---

## Parallel Example: User Story 1

```text
Task: "Replace placeholder login form assertions with real auth-state unit coverage in apps/web/tests/unit/login-form.test.tsx"
Task: "Add browser auth client unit coverage for login outcome normalization in apps/web/tests/unit/auth-client.test.ts"
Task: "Add login interaction and accessibility coverage in apps/web/tests/e2e/local-interactions.spec.ts and apps/web/tests/e2e/accessibility.spec.ts"
```

## Parallel Example: User Story 2

```text
Task: "Replace landing-page route assumptions with redirect and protected-route unit coverage in apps/web/tests/unit/routes.test.ts"
Task: "Add end-to-end route-protection, direct-entry, static/internal-route exclusion, and current-user-unavailable coverage in apps/web/tests/e2e/routes.spec.ts and apps/web/tests/e2e/navigation.spec.ts"
```

## Parallel Example: User Story 3

```text
Task: "Add redirect-target allowlist unit coverage in apps/web/tests/unit/redirect-target.test.ts"
Task: "Add logout-control unit coverage in apps/web/tests/unit/sidebar-logout.test.tsx"
Task: "Add intended-route restoration, logout, and session-loss end-to-end coverage in apps/web/tests/e2e/navigation.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Validate sign-in, invalid-credential handling, unavailable-service handling, and authenticated-user redirect from `/login`.

### Incremental Delivery

1. Finish Setup and Foundational to establish the shared auth layer.
2. Deliver US1 to replace the placeholder login flow.
3. Deliver US2 to gate all protected routes behind confirmed auth.
4. Deliver US3 to restore safe destinations and connect logout/session-loss handling.
5. Finish with visual and full-suite validation in Phase 6.

### Parallel Team Strategy

1. One developer can finish `T004` and another can prepare `T002` and `T003`.
2. After `T004`, different developers can split `T005` through `T008`.
3. After Foundational is complete, one developer can lead UI/login flow tasks while another prepares route-protection tests and protected-layout wiring.

---

## Notes

- All tasks use the required checklist format with task ID, optional `[P]`, optional story label, and exact file paths.
- User stories are intentionally ordered as `US1 -> US2 -> US3` because protected-route and logout behavior depend on a working authenticated session flow.
- `apps/api` is treated as an existing contract dependency; this task list focuses implementation work on `apps/web` plus feature documentation updates.
