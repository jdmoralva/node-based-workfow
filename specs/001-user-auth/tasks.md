---

description: "Task list for implementing the internal user login frontend feature"
---

# Tasks: Internal User Login

**Input**: Design documents from `/specs/001-user-auth/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Focused regression coverage is included because this repo already verifies generated frontend shell changes through `frontend/scripts/tests/test_build_dashboard_shell.py`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Frontend source-of-truth files live under `frontend/src/dashboard_shell/`, `frontend/assets/js/`, and `frontend/scripts/`
- Generated pages live directly under `frontend/*.html`
- Rebuild generated pages with `frontend/scripts/build_dashboard_shell.py`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the login-page source files that the generator and later user-story work will build on.

- [ ] T001 Create the login page partial scaffold in `frontend/src/dashboard_shell/partials/login-page.html`
- [ ] T002 [P] Create the login page bootstrap scaffold in `frontend/assets/js/pages/login-page.js`
- [ ] T003 [P] Add the initial login page source entry in `frontend/src/dashboard_shell/pages.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Wire the generator and shared styling so the login page can be rendered and verified.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 Implement the `login-form` page rendering branch in `frontend/scripts/dashboard_shell_build/page_specs.py`
- [ ] T005 [P] Register the login page bootstrap bundle in `frontend/scripts/dashboard_shell_build/shell.py`
- [ ] T006 [P] Add shared login surface, unauthenticated shell-state, and form styles in `frontend/style.css`
- [ ] T007 Update generated login-page regression coverage in `frontend/scripts/tests/test_build_dashboard_shell.py`

**Checkpoint**: Foundation ready; the login page can be rendered by the shell generator and verified by the focused frontend test.

---

## Phase 3: User Story 1 - Sign in from the main entry point (Priority: P1) 🎯 MVP

**Goal**: Make the dedicated login page reachable from `index.html` while keeping the page visually consistent with the existing frontend shell.

**Independent Test**: Open `frontend/index.html`, follow the visible sign-in action to `frontend/login.html`, and confirm the login page renders the expected internal-user screen with username and password inputs.

### Implementation for User Story 1

- [ ] T008 [P] [US1] Update the entry-page hero action markup to support navigation in `frontend/src/dashboard_shell/partials/card-grid-hero.html`
- [ ] T009 [US1] Pass hero action link metadata through `frontend/scripts/dashboard_shell_build/page_specs.py`
- [ ] T010 [US1] Define `index.html` sign-in navigation and `login.html` page metadata, including the unauthenticated login-page shell state, in `frontend/src/dashboard_shell/pages.json`
- [ ] T011 [P] [US1] Build the static internal login layout and credential fields in `frontend/src/dashboard_shell/partials/login-page.html`

**Checkpoint**: User Story 1 is complete when users can reach a styled dedicated login page from the existing frontend entry point.

---

## Phase 4: User Story 2 - Submit required credentials (Priority: P1)

**Goal**: Let users use a clear primary sign-in action that routes completed credentials through a frontend-only placeholder handler without implying real authentication.

**Independent Test**: Open `frontend/login.html` directly, enter values in both fields, submit the form, and confirm the page shows a neutral placeholder result instead of simulated authenticated access.

### Implementation for User Story 2

- [ ] T012 [P] [US2] Implement placeholder submit handling, result-state messaging, and no-storage/no-session-simulation guards in `frontend/assets/js/pages/login-page.js`
- [ ] T013 [P] [US2] Add the primary sign-in action hooks and placeholder result region in `frontend/src/dashboard_shell/partials/login-page.html`
- [ ] T014 [US2] Set the login page bootstrap key and placeholder copy in `frontend/src/dashboard_shell/pages.json`

**Checkpoint**: User Story 2 is complete when completed credentials trigger a frontend-only informational placeholder flow with no session simulation.

---

## Phase 5: User Story 3 - See validation before submission (Priority: P2)

**Goal**: Prevent incomplete sign-in attempts and show clear required-field feedback before the placeholder submit path can succeed.

**Independent Test**: Open `frontend/login.html` directly, submit with missing fields, and confirm required-field messages appear and the placeholder success state is blocked until both fields are present.

### Implementation for User Story 3

- [ ] T015 [US3] Extend the login controller with required-field validation and field-reset behavior in `frontend/assets/js/pages/login-page.js`
- [ ] T016 [US3] Add field-level validation message containers and invalid-state hooks in `frontend/src/dashboard_shell/partials/login-page.html`
- [ ] T017 [US3] Style login validation and feedback states in `frontend/style.css`

**Checkpoint**: User Story 3 is complete when required-field validation blocks incomplete submissions and updates feedback as the user corrects inputs.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize documentation, generated outputs, and focused verification across the whole feature.

- [ ] T018 [P] Update login-page rebuild, preview, and unauthenticated-shell notes in `frontend/README.md`
- [ ] T019 Rebuild generated outputs for `frontend/index.html` and `frontend/login.html` using `frontend/scripts/build_dashboard_shell.py`
- [ ] T020 Confirm final focused shell verification expectations, including no storage/session simulation checks, in `frontend/scripts/tests/test_build_dashboard_shell.py`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion for implementation and is independently verifiable by opening `frontend/login.html` directly; it follows User Story 1 in this task list to keep delivery aligned with the user-facing entry flow
- **User Story 3 (Phase 5)**: Depends on User Story 2 for implementation because validation extends the submit controller and placeholder flow, but it remains independently verifiable on `frontend/login.html`
- **Polish (Phase 6)**: Depends on completion of the user stories you intend to ship

### User Story Dependencies

- **US1**: Starts after Phase 2; no dependency on later stories
- **US2**: Can be validated independently on `login.html`; it is sequenced after US1 in implementation order to keep the visible entry flow complete first
- **US3**: Can be validated independently on `login.html`; it is sequenced after US2 because it extends the same submit interaction

### Within Each User Story

- Generator and shared-style changes come before page-specific behavior that depends on them
- Static page structure comes before JavaScript behavior that binds to it
- Rebuild and focused verification happen after implementation changes for the story are complete

### Parallel Opportunities

- **Phase 1**: T002 and T003 can run in parallel after T001
- **Phase 2**: T005 and T006 can run in parallel after T004
- **US1**: T008 and T011 can run in parallel once the foundational generator work is ready
- **US2**: T012 and T013 can run in parallel once the login page structure from the earlier phases is in place
- **Polish**: T018 can run in parallel with the final rebuild and verification work

---

## Parallel Example: User Story 1

```bash
# After foundational work is complete, these can proceed together:
Task: "Update the entry-page hero action markup in frontend/src/dashboard_shell/partials/card-grid-hero.html"
Task: "Build the static internal login layout in frontend/src/dashboard_shell/partials/login-page.html"
```

## Parallel Example: User Story 2

```bash
# After US1 is complete, these can proceed together:
Task: "Implement placeholder submit handling in frontend/assets/js/pages/login-page.js"
Task: "Add the primary sign-in action hooks and placeholder result region in frontend/src/dashboard_shell/partials/login-page.html"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Rebuild generated pages and verify `frontend/index.html -> frontend/login.html`
5. Stop and validate before adding submit behavior

### Incremental Delivery

1. Deliver US1 to establish the dedicated login route from the entry point
2. Add US2 to wire a safe frontend-only placeholder sign-in flow
3. Add US3 to enforce required-field validation before placeholder submission
4. Finish with documentation and generated-page verification

### Suggested MVP Scope

- **MVP**: User Story 1 only
- **Next increment**: User Story 2
- **Final increment**: User Story 3 plus polish

---

## Notes

- All tasks use the required checklist format with task ID, optional `[P]` marker, user-story label where applicable, and exact file paths
- Generated `frontend/*.html` files are outputs, not source-of-truth files
- Keep the implementation frontend-only; do not add credential persistence, browser storage for auth artifacts, session simulation, or backend authentication behavior
