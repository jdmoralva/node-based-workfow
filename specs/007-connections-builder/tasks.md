# Tasks: CreditModeler Connections Builder

**Input**: Design documents from `specs/007-connections-builder/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/connections-api.md`, `quickstart.md`

**Tests**: Included because the feature specification defines independent testing scenarios and the implementation plan requires backend/frontend coverage.

**Organization**: Tasks are grouped by user story to enable independently testable increments.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create empty feature files and test scaffolds before shared foundation work.

- [X] T001 Create backend connections package marker in `apps/api/app/modules/connections/__init__.py`
- [X] T002 [P] Create frontend connection type definitions scaffold in `apps/web/features/creditmodeler/connection-types.ts`
- [X] T003 [P] Create frontend connection client scaffold in `apps/web/features/creditmodeler/connections-client.ts`
- [X] T004 [P] Create frontend Connection Builder component scaffold in `apps/web/features/creditmodeler/ConnectionBuilder.tsx`
- [X] T005 [P] Create frontend CreditModeler workbench container scaffold in `apps/web/features/creditmodeler/CreditModelerWorkbench.tsx`
- [X] T006 [P] Create backend connection contract test file scaffold in `apps/api/tests/contract/test_connections_api.py`
- [X] T007 [P] Create backend connection integration test file scaffold in `apps/api/tests/integration/test_connections_flow.py`
- [X] T008 [P] Create frontend connection builder unit test file scaffold in `apps/web/tests/unit/connection-builder.test.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared backend model, discovery, validation, routing, and frontend state structure required before story-specific behavior can be completed.

**Critical**: No user story implementation should begin until this phase is complete.

- [X] T009 Add `datasets_root` settings support with repo-root `data/datasets` default in `apps/api/app/core/config.py`
- [X] T010 Create `DatabaseConnection` model with owner, label, normalized label, driver, database path, timestamps, and uniqueness in `apps/api/app/modules/connections/models.py`
- [X] T011 Register `DatabaseConnection` metadata import with SQLAlchemy base metadata in `apps/api/app/db/base.py`
- [X] T012 Add user-to-connections relationship for ownership queries in `apps/api/app/modules/auth/models.py`
- [X] T013 Create Alembic migration for `database_connections` table and `(user_id, normalized_label)` uniqueness in `apps/api/alembic/versions/002_database_connections.py`
- [X] T014 [P] Create connection Pydantic schemas for database options, saved connections, create/update payloads, and test responses in `apps/api/app/modules/connections/schemas.py`
- [X] T015 [P] Create connection repository module scaffolding and function signatures for current-user CRUD queries in `apps/api/app/modules/connections/repository.py`
- [X] T016 Create connection service module scaffolding and helper signatures for label normalization, dataset discovery, path validation, and SQLite testing in `apps/api/app/modules/connections/service.py`
- [X] T017 Create connection API router skeleton with authenticated dependencies in `apps/api/app/modules/connections/api.py`
- [X] T018 Register the connections router under the main API router in `apps/api/app/api/router.py`
- [X] T019 Create frontend connection domain types matching the contract in `apps/web/features/creditmodeler/connection-types.ts`
- [X] T020 Create frontend API client function signatures for database discovery, connection CRUD, unsaved test, and saved test in `apps/web/features/creditmodeler/connections-client.ts`
- [X] T021 Refactor workbench tree selection hook to expose selected item state and selection callbacks in `apps/web/features/creditmodeler/useWorkbenchTree.ts`
- [X] T022 Update workbench tree props to accept external selection state and selection callbacks in `apps/web/components/workbench/ObjectTree.tsx`
- [X] T023 Update workbench tree item props to report selections upward without breaking expand/collapse in `apps/web/components/workbench/ObjectTreeItem.tsx`
- [X] T024 Update workbench shell props so the canvas can receive selected connection context in `apps/web/components/workbench/Workbench.tsx`
- [X] T025 Create CreditModeler workbench container that owns tree selection and connection list state in `apps/web/features/creditmodeler/CreditModelerWorkbench.tsx`
- [X] T026 Replace direct Workbench rendering with CreditModeler workbench container in `apps/web/app/(protected)/creditmodeler-service/page.tsx`

**Checkpoint**: Backend connections module exists, safe discovery helpers exist, API/client scaffolds exist, and tree selection can drive canvas content.

---

## Phase 3: User Story 1 - Create a reusable database connection (Priority: P1) MVP

**Goal**: A signed-in credit risk manager can open a blank builder, choose a discovered SQLite database, test it, save it with a unique label, and see it under `Connections`.

**Independent Test**: Sign in, open `/creditmodeler-service`, select `Connections`, choose a discovered database, test successfully, save with a unique label, and verify the saved label appears under `Connections` for that same user.

### Tests for User Story 1

- [X] T027 [P] [US1] Add backend contract tests for database discovery, list connections, create connection, and unsaved test in `apps/api/tests/contract/test_connections_api.py`
- [X] T028 [P] [US1] Add backend integration tests for recursive discovery, allowed extensions, extensionless labels, relative values, blank labels, duplicate labels for one user, same-label allowance across two users, invalid paths, valid unsaved test, and metadata-only create in `apps/api/tests/integration/test_connections_flow.py`
- [X] T029 [P] [US1] Add frontend unit tests for blank builder rendering, database option loading, empty discovery state, validation messages, test feedback, save success, and submenu refresh in `apps/web/tests/unit/connection-builder.test.tsx`
- [X] T030 [P] [US1] Add frontend tree regression tests for top-level `Connections` selection and preserved expand/collapse behavior in `apps/web/tests/unit/workbench-tree.test.tsx`

### Implementation for User Story 1

- [X] T035 [US1] Implement SQLite open/query validation with no table, column, schema, dataset, variable, or absolute-path output in `apps/api/app/modules/connections/service.py`
- [X] T036 [US1] Implement create-time label trimming, case-folded uniqueness, immutable label storage, and duplicate-label errors in `apps/api/app/modules/connections/service.py`
- [X] T037 [US1] Implement dataset discovery sorting, recursive extension filtering, extensionless labels, and relative value generation in `apps/api/app/modules/connections/service.py`
- [X] T038 [US1] Implement create/list repository persistence helpers in `apps/api/app/modules/connections/repository.py`
- [X] T031 [US1] Implement `GET /api/connections/databases` discovery endpoint behavior in `apps/api/app/modules/connections/api.py`
- [X] T032 [US1] Implement `GET /api/connections` current-user list endpoint behavior in `apps/api/app/modules/connections/api.py`
- [X] T033 [US1] Implement `POST /api/connections` create endpoint behavior in `apps/api/app/modules/connections/api.py`
- [X] T034 [US1] Implement `POST /api/connections/test` unsaved test endpoint behavior in `apps/api/app/modules/connections/api.py`
- [X] T039 [US1] Implement frontend database discovery, list, create, and unsaved test client calls in `apps/web/features/creditmodeler/connections-client.ts`
- [X] T040 [US1] Implement blank new-connection mode with editable label, fixed database type, selector, Test, and Save Connection controls in `apps/web/features/creditmodeler/ConnectionBuilder.tsx`
- [X] T041 [US1] Implement frontend loading, empty, validation, test success, test failure, save success, and save failure states in `apps/web/features/creditmodeler/ConnectionBuilder.tsx`
- [X] T042 [US1] Render Connection Builder in the canvas for top-level `Connections` selection in `apps/web/components/workbench/CanvasPanel.tsx`
- [X] T043 [US1] Remove hard-coded `Server1` and `Server2` connection children from static tree config in `apps/web/config/tree-menu.ts`
- [X] T044 [US1] Load saved connections and render them as dynamic children under `Connections` in `apps/web/features/creditmodeler/CreditModelerWorkbench.tsx`
- [X] T045 [US1] Add or adjust workbench and builder styles without changing frame geometry in `apps/web/app/globals.css`

**Checkpoint**: User Story 1 is independently functional and testable as the MVP.

---

## Phase 4: User Story 2 - Reopen and update an existing connection (Priority: P2)

**Goal**: A signed-in credit risk manager can select a saved connection, see a populated builder with a read-only label, test it, update the selected database, and keep the same label.

**Independent Test**: Use a saved connection fixture or create one through US1, select it under `Connections`, confirm the label is read-only, change the selected database, save, reopen, and verify the updated selection and latest successful test time behavior.

### Tests for User Story 2

- [X] T046 [P] [US2] Add backend contract tests for read connection, update connection, and saved connection test endpoints in `apps/api/tests/contract/test_connections_api.py`
- [X] T047 [P] [US2] Add backend integration tests for owner-only read/update/test, immutable label, database update preserving previous `last_tested_at`, missing database failure, and `last_tested_at` success-only updates in `apps/api/tests/integration/test_connections_flow.py`
- [X] T048 [P] [US2] Add frontend unit tests for opening a saved connection, populated builder fields, read-only label, database update, saved test feedback, and refreshed selected state in `apps/web/tests/unit/connection-builder.test.tsx`

### Implementation for User Story 2

- [X] T052 [US2] Implement read, update, and saved-test repository helpers in `apps/api/app/modules/connections/repository.py`
- [X] T053 [US2] Implement saved-test timestamp update only after successful validation and preserve the previous timestamp on database-only updates in `apps/api/app/modules/connections/service.py`
- [X] T049 [US2] Implement `GET /api/connections/{id}` read endpoint behavior with ownership enforcement in `apps/api/app/modules/connections/api.py`
- [X] T050 [US2] Implement `PUT /api/connections/{id}` update endpoint behavior with immutable label and database-path validation in `apps/api/app/modules/connections/api.py`
- [X] T051 [US2] Implement `POST /api/connections/{id}/test` saved test endpoint behavior with ownership enforcement in `apps/api/app/modules/connections/api.py`
- [X] T054 [US2] Implement frontend read, update, and saved-test client calls in `apps/web/features/creditmodeler/connections-client.ts`
- [X] T055 [US2] Implement populated existing-connection mode with read-only label and selected database state in `apps/web/features/creditmodeler/ConnectionBuilder.tsx`
- [X] T056 [US2] Implement existing-connection save and saved-test UI flows in `apps/web/features/creditmodeler/ConnectionBuilder.tsx`
- [X] T057 [US2] Wire saved connection tree item selection to populated builder state in `apps/web/features/creditmodeler/CreditModelerWorkbench.tsx`
- [X] T058 [US2] Preserve non-connection canvas hint behavior while routing connection selections in `apps/web/components/workbench/CanvasPanel.tsx`

**Checkpoint**: User Stories 1 and 2 are independently functional and testable.

---

## Phase 5: User Story 3 - Drop a saved connection safely (Priority: P3)

**Goal**: A signed-in credit risk manager can drop saved connection metadata only after confirmation, while the source database file remains available.

**Independent Test**: Open a saved connection, choose Drop, cancel once and verify the connection remains, then confirm and verify the tree label disappears while the database option remains selectable.

### Tests for User Story 3

- [X] T059 [P] [US3] Add backend contract tests for delete connection endpoint and non-owned delete rejection in `apps/api/tests/contract/test_connections_api.py`
- [X] T060 [P] [US3] Add backend integration tests proving delete removes metadata only and leaves source SQLite files available in `apps/api/tests/integration/test_connections_flow.py`
- [X] T061 [P] [US3] Add frontend unit tests for Drop visibility, confirmation cancel, confirmation accept, drop error feedback, and submenu refresh in `apps/web/tests/unit/connection-builder.test.tsx`

### Implementation for User Story 3

- [X] T063 [US3] Implement delete metadata repository helper in `apps/api/app/modules/connections/repository.py`
- [X] T064 [US3] Implement delete service behavior that never removes source database files in `apps/api/app/modules/connections/service.py`
- [X] T062 [US3] Implement `DELETE /api/connections/{id}` endpoint behavior with ownership enforcement in `apps/api/app/modules/connections/api.py`
- [X] T065 [US3] Implement frontend delete client call in `apps/web/features/creditmodeler/connections-client.ts`
- [X] T066 [US3] Implement Drop button, confirmation dialog, cancel behavior, success behavior, and failure feedback in `apps/web/features/creditmodeler/ConnectionBuilder.tsx`
- [X] T067 [US3] Refresh connection submenu and clear dropped selection after confirmed drop in `apps/web/features/creditmodeler/CreditModelerWorkbench.tsx`

**Checkpoint**: All user stories are independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verification, visual stability, docs consistency, and final cleanup across stories.

- [X] T068 [P] Add or update e2e coverage for create, reopen, update, and drop flows, including visible feedback within 2 seconds during local acceptance verification, in `apps/web/tests/e2e/local-interactions.spec.ts`
- [X] T069 [P] Add or update desktop geometry assertions for Connection Builder canvas rendering in `apps/web/tests/visual/layout-geometry.spec.ts`
- [X] T070 [P] Review quickstart validation steps against implemented behavior in `specs/007-connections-builder/quickstart.md`
- [X] T071 Run backend verification command documented in `specs/007-connections-builder/quickstart.md`
- [X] T072 Run frontend unit and lint verification commands documented in `specs/007-connections-builder/quickstart.md`
- [X] T073 Run frontend visual verification command documented in `specs/007-connections-builder/quickstart.md`
- [X] T074 Review generated feature docs for consistency after implementation in `specs/007-connections-builder/plan.md`

---

## Dependencies & Execution Order

### Phase Dependencies

| Phase | Depends On | Notes |
|-------|------------|-------|
| Phase 1 Setup | None | Can start immediately. |
| Phase 2 Foundational | Phase 1 | Blocks user-story implementation. |
| Phase 3 US1 | Phase 2 | MVP scope. |
| Phase 4 US2 | Phase 2, test fixture or US1-created saved connection | Can be tested with fixture data but naturally builds on saved connection behavior. |
| Phase 5 US3 | Phase 2, test fixture or US1-created saved connection | Can be tested with fixture data but naturally builds on saved connection behavior. |
| Phase 6 Polish | Desired user stories complete | Run after implementation increments. |

### User Story Dependencies

| Story | Dependency | Independent Value |
|-------|------------|-------------------|
| US1 Create reusable database connection | Foundational phase only | Delivers MVP: save and see reusable connection metadata. |
| US2 Reopen and update existing connection | Foundational phase plus saved connection fixture or US1 | Delivers correction/retest workflow for existing metadata. |
| US3 Drop saved connection safely | Foundational phase plus saved connection fixture or US1 | Delivers safe metadata cleanup. |

### Within Each User Story

| Step | Rule |
|------|------|
| Tests | Write story tests first and confirm they fail before implementation. |
| Backend | Implement schemas/service/repository behavior before endpoint completion when dependencies exist. |
| Frontend | Implement client behavior before UI flows that consume it. |
| Integration | Refresh tree/canvas state after backend and client behavior are available. |
| Checkpoint | Validate each story independently before moving to the next priority. |

---

## Parallel Execution Examples

### User Story 1

```text
Task: "Add backend contract tests for database discovery, list connections, create connection, and unsaved test in apps/api/tests/contract/test_connections_api.py"
Task: "Add backend integration tests for recursive discovery, allowed extensions, extensionless labels, relative values, blank labels, duplicate labels, invalid paths, valid unsaved test, and metadata-only create in apps/api/tests/integration/test_connections_flow.py"
Task: "Add frontend unit tests for blank builder rendering, database option loading, empty discovery state, validation messages, test feedback, save success, and submenu refresh in apps/web/tests/unit/connection-builder.test.tsx"
Task: "Add frontend tree regression tests for top-level Connections selection and preserved expand/collapse behavior in apps/web/tests/unit/workbench-tree.test.tsx"
```

### User Story 2

```text
Task: "Add backend contract tests for read connection, update connection, and saved connection test endpoints in apps/api/tests/contract/test_connections_api.py"
Task: "Add backend integration tests for owner-only read/update/test, immutable label, database update preserving previous last_tested_at, missing database failure, and last_tested_at success-only updates in apps/api/tests/integration/test_connections_flow.py"
Task: "Add frontend unit tests for opening a saved connection, populated builder fields, read-only label, database update, saved test feedback, and refreshed selected state in apps/web/tests/unit/connection-builder.test.tsx"
```

### User Story 3

```text
Task: "Add backend contract tests for delete connection endpoint and non-owned delete rejection in apps/api/tests/contract/test_connections_api.py"
Task: "Add backend integration tests proving delete removes metadata only and leaves source SQLite files available in apps/api/tests/integration/test_connections_flow.py"
Task: "Add frontend unit tests for Drop visibility, confirmation cancel, confirmation accept, drop error feedback, and submenu refresh in apps/web/tests/unit/connection-builder.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup.
2. Complete Phase 2 foundational backend/frontend scaffolding.
3. Complete Phase 3 User Story 1 tests and implementation.
4. Stop and validate User Story 1 independently with backend tests, frontend tests, and manual create/test/save flow.

### Incremental Delivery

1. Deliver US1 create/test/save and dynamic submenu.
2. Deliver US2 reopen/update/saved-test behavior.
3. Deliver US3 drop confirmation and metadata-only deletion.
4. Run cross-cutting e2e, lint, and visual verification.

### Parallel Team Strategy

1. Complete shared setup and foundational work together.
2. Split tests by backend contract, backend integration, and frontend unit coverage within each story.
3. After foundational APIs and client contracts stabilize, backend and frontend implementation can proceed in parallel by story.

## Notes

- `[P]` tasks modify different files or are independently testable without incomplete same-file dependencies.
- `[US1]`, `[US2]`, and `[US3]` map tasks to user stories in `specs/007-connections-builder/spec.md`.
- Tests should be created and observed failing before implementation tasks for each story.
- Do not delete files under `data/datasets/` as part of Drop implementation or tests.
