# Tasks: CreditModeler Data Models Builder

**Input**: Design documents from `specs/008-data-models-builder/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/data-models-api.md](./contracts/data-models-api.md), [quickstart.md](./quickstart.md)

**Tests**: Tests are required because the implementation plan explicitly requires story-specific tests to be written and observed failing before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and has no dependency on incomplete tasks in the same phase.
- **[Story]**: User story label for story-phase tasks only.
- Every task includes an exact file path.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add shared dependencies and empty feature module files needed by all stories.

- [X] T001 Add `sqlglot` dependency to `apps/api/pyproject.toml`
- [X] T002 Create data models module package in `apps/api/app/modules/data_models/__init__.py`
- [X] T003 [P] Create placeholder backend model file in `apps/api/app/modules/data_models/models.py`
- [X] T004 [P] Create placeholder backend schemas file in `apps/api/app/modules/data_models/schemas.py`
- [X] T005 [P] Create placeholder backend API file in `apps/api/app/modules/data_models/api.py`
- [X] T006 [P] Create placeholder frontend type file in `apps/web/features/creditmodeler/data-model-types.ts`
- [X] T007 [P] Create placeholder frontend client file in `apps/web/features/creditmodeler/data-models-client.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared persistence, schema definitions, validation primitives, and routing that all user stories depend on.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T008 Define `AnalyticalDataModel` SQLAlchemy model with ownership, normalized name, model JSON, status, diagnostics, and timestamps in `apps/api/app/modules/data_models/models.py`
- [X] T009 Add Alembic migration for analytical data models and per-user normalized-name uniqueness in `apps/api/alembic/versions/003_data_models.py`
- [X] T010 Register data model metadata imports in `apps/api/app/db/base.py`
- [X] T011 Add `InternalUser` relationship to saved data models in `apps/api/app/modules/auth/models.py`
- [X] T012 Define backend status, diagnostic, schema metadata, model definition, create, update, list, and response schemas in `apps/api/app/modules/data_models/schemas.py`
- [X] T013 [P] Implement data model repository ownership helpers in `apps/api/app/modules/data_models/repository.py`
- [X] T014 [P] Implement shared diagnostic factories and safe error message helpers in `apps/api/app/modules/data_models/diagnostics.py`
- [X] T015 [P] Implement model status calculation helpers for draft, untested, tested, failed, and stale in `apps/api/app/modules/data_models/status.py`
- [X] T016 Implement base data model service skeleton and ownership checks in `apps/api/app/modules/data_models/service.py`
- [X] T017 Create data model router skeleton with authenticated dependency wiring in `apps/api/app/modules/data_models/api.py`
- [X] T018 Register the data model router under `/api` in `apps/api/app/api/router.py`
- [X] T019 Define frontend data model, schema metadata, diagnostic, status, request, and response types in `apps/web/features/creditmodeler/data-model-types.ts`
- [X] T020 [P] Add shared test fixtures for data model users and SQLite connections in `apps/api/tests/conftest.py`

**Checkpoint**: Foundation ready; user story implementation can now begin.

---

## Phase 3: User Story 1 - Build and Test a Data Model (Priority: P1) MVP

**Goal**: Users can open Data Models, inspect saved SQLite connection schema, configure a strict star-schema model with business rules, and run a zero-row compilation test that returns safe structured diagnostics.

**Independent Test**: Open Data Models, select saved SQLite connections, configure a fact table, dimension, relationship, join keys, and business rule, then run Test and receive success, warnings, or safe structured errors without saving the model.

### Tests for User Story 1

- [X] T021 [P] [US1] Add contract tests for schema inspection and unsaved test responses in `apps/api/tests/contract/test_data_models_api.py`
- [X] T022 [P] [US1] Add integration tests for schema metadata safety and SQLite system-object exclusion in `apps/api/tests/integration/test_data_models_flow.py`
- [X] T023 [P] [US1] Add integration tests for strict star-schema validation, caps, role-playing dimensions, composite keys, inner-join warnings, and non-empty measures rejection in `apps/api/tests/integration/test_data_model_validation.py`
- [X] T024 [P] [US1] Add integration tests for business rule parsing, unsafe expression rejection, the approved scalar function allowlist, unknown references, business-rule alias rewrites, ambiguous rewrite diagnostics, and relationship alias-reference updates in `apps/api/tests/integration/test_data_model_business_rules.py`
- [X] T025 [P] [US1] Add integration tests for zero-row dry-run compilation across multiple saved SQLite connections in `apps/api/tests/integration/test_data_model_dry_run.py`
- [X] T026 [P] [US1] Add frontend client unit tests for schema inspection and unsaved test helpers in `apps/web/tests/unit/data-models-client.test.ts`
- [X] T027 [P] [US1] Add builder unit tests for blank builder, incomplete-draft Test, source selection, schema loading, validation diagnostics, and test success warnings in `apps/web/tests/unit/data-model-builder.test.tsx`

### Implementation for User Story 1

- [X] T028 [US1] Implement schema inspection service for user-owned SQLite Connections in `apps/api/app/modules/data_models/schema_inspection.py`
- [X] T029 [US1] Add schema inspection endpoint `GET /api/data-models/connections/{connection_id}/schema` in `apps/api/app/modules/data_models/api.py`
- [X] T030 [US1] Implement strict model validation for shape, IDs, aliases, caps, fact table, dimensions, relationships, joins, measures, and warnings in `apps/api/app/modules/data_models/validation.py`
- [X] T031 [US1] Implement business rule parser and validator with the approved scalar function allowlist in `apps/api/app/modules/data_models/rule_parser.py`
- [X] T032 [US1] Implement safe alias cascade support for relationship alias references and business rule qualifiers when fact, dimension, or source aliases change in `apps/api/app/modules/data_models/rule_parser.py`
- [X] T033 [US1] Implement zero-row star-schema query compiler with safe identifier handling and no SQL exposure in `apps/api/app/modules/data_models/query_compiler.py`
- [X] T034 [US1] Implement unsaved test orchestration with deterministic validation before dry-run execution in `apps/api/app/modules/data_models/service.py`
- [X] T035 [US1] Add `POST /api/data-models/test` endpoint in `apps/api/app/modules/data_models/api.py`
- [X] T036 [US1] Implement frontend schema inspection and unsaved test client helpers in `apps/web/features/creditmodeler/data-models-client.ts`
- [X] T037 [US1] Implement `DataModelBuilder` blank mode with name, description, source, fact, dimension, relationship, business rule, preview, diagnostics, and Test UI in `apps/web/features/creditmodeler/DataModelBuilder.tsx`
- [X] T038 [US1] Add data model builder styles that preserve canvas scrolling and geometry in `apps/web/app/globals.css`
- [X] T039 [US1] Wire top-level `Data Models` tree selection to blank `DataModelBuilder` in `apps/web/features/creditmodeler/CreditModelerWorkbench.tsx`

**Checkpoint**: User Story 1 is independently functional and testable without saved data model persistence beyond existing Connections.

---

## Phase 4: User Story 2 - Save, Reopen, Update, and Drop Data Models (Priority: P2)

**Goal**: Users can save drafts and completed models, see them as dynamic Data Models children, reopen and update them, retest saved versions, and drop obsolete models.

**Independent Test**: Save a draft with only a valid name, confirm it appears under Data Models, reopen it with read-only name, update configuration, save, retest, and drop it with confirmation.

### Tests for User Story 2

- [X] T040 [P] [US2] Add contract tests for list, single-status list filtering, create, read, update, delete, and saved test endpoints in `apps/api/tests/contract/test_data_models_api.py`
- [X] T041 [P] [US2] Add integration tests for draft save, per-user name uniqueness, immutable name update rejection, status transitions, stale diagnostics, saved test timestamps, and delete behavior in `apps/api/tests/integration/test_data_models_flow.py`
- [X] T042 [P] [US2] Add frontend client unit tests for list, single-status list filtering, create, read, update, delete, and saved test helpers in `apps/web/tests/unit/data-models-client.test.ts`
- [X] T043 [P] [US2] Add workbench unit tests for dynamic Data Models submenu, auto-expand, saved child selection, upsert after save, and removal after drop in `apps/web/tests/unit/data-model-builder.test.tsx`
- [X] T044 [US2] Add frontend builder unit tests for draft save, existing read-only name, stale diagnostics after save, saved test status, and drop confirmation in `apps/web/tests/unit/data-model-builder.test.tsx`

### Implementation for User Story 2

- [X] T045 [US2] Implement create, list, single-status filter, get, update, delete, and saved test repository operations in `apps/api/app/modules/data_models/repository.py`
- [X] T046 [US2] Implement create, list, single-status list filtering, read, update, delete, saved test, immutable-name, duplicate-name, last-save-wins, status transition, and diagnostics persistence service logic in `apps/api/app/modules/data_models/service.py`
- [X] T047 [US2] Add `GET /api/data-models` with optional single-status filter, `POST /api/data-models`, `GET /api/data-models/{model_id}`, `PUT /api/data-models/{model_id}`, `DELETE /api/data-models/{model_id}`, and `POST /api/data-models/{model_id}/test` endpoints in `apps/api/app/modules/data_models/api.py`
- [X] T048 [US2] Implement frontend list with optional single-status filter, create, read, update, delete, and saved test client helpers in `apps/web/features/creditmodeler/data-models-client.ts`
- [X] T049 [US2] Remove static `Origination` and `Portfolio` children from Data Models tree config in `apps/web/config/tree-menu.ts`
- [X] T050 [US2] Load saved data models, build dynamic Data Models submenu, auto-expand when models exist, and preserve Connections behavior in `apps/web/features/creditmodeler/CreditModelerWorkbench.tsx`
- [X] T051 [US2] Map saved Data Models child selection to populated `DataModelBuilder` in `apps/web/features/creditmodeler/CreditModelerWorkbench.tsx`
- [X] T052 [US2] Add create, save draft, update, saved test, stale diagnostics, read-only saved name, and drop flows to `apps/web/features/creditmodeler/DataModelBuilder.tsx`
- [X] T053 [US2] Update builder styles for saved-mode actions, status badges, and diagnostics in `apps/web/app/globals.css`
- [X] T054 [US2] Add e2e coverage for create draft, dynamic submenu, reopen saved model, test success, save stale status, and drop in `apps/web/tests/e2e/local-interactions.spec.ts`

**Checkpoint**: User Stories 1 and 2 are independently functional; a complete saved data model can be created, reopened, updated, tested, and dropped.

---

## Phase 5: User Story 3 - Repair Models When Connections Change (Priority: P3)

**Goal**: Saved models remain visible and repairable when referenced Connections are changed or deleted, preserving recoverable modeling work.

**Independent Test**: Save a model, delete or change a referenced Connection, reopen the model, observe missing-connection diagnostics, replace the missing source, preserve compatible configuration, and retest.

### Tests for User Story 3

- [X] T055 [P] [US3] Add backend integration tests for missing Connection diagnostics on load and test in `apps/api/tests/integration/test_data_models_flow.py`
- [X] T056 [US3] Add backend integration tests for replacement source preservation and revalidation in `apps/api/tests/integration/test_data_models_flow.py`
- [X] T057 [P] [US3] Add frontend builder unit tests for missing Connection diagnostics, replacement selection, preserved configuration, invalid rule preservation, and retest in `apps/web/tests/unit/data-model-builder.test.tsx`
- [X] T058 [P] [US3] Add e2e coverage for deleting a referenced Connection, reopening the model, repairing the source, and retesting in `apps/web/tests/e2e/local-interactions.spec.ts`

### Implementation for User Story 3

- [X] T059 [US3] Add missing-connection detection and repairable diagnostics to model read and test service flows in `apps/api/app/modules/data_models/service.py`
- [X] T060 [US3] Implement replacement source validation and preservation of table names, aliases, relationships, and business rules where possible in `apps/api/app/modules/data_models/validation.py`
- [X] T061 [US3] Preserve invalid business rules with structured diagnostics after source replacement in `apps/api/app/modules/data_models/rule_parser.py`
- [X] T062 [US3] Return missing-connection and repair diagnostics in read, update, and test responses in `apps/api/app/modules/data_models/api.py`
- [X] T063 [US3] Add missing-connection display, replacement connection selector, preservation messaging, and retest flow to `apps/web/features/creditmodeler/DataModelBuilder.tsx`
- [X] T064 [US3] Update frontend data model types for missing-source and repair diagnostics in `apps/web/features/creditmodeler/data-model-types.ts`
- [X] T065 [US3] Add missing-connection and repair UI styles in `apps/web/app/globals.css`

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, regression protection, and documentation alignment across all stories.

- [X] T066 [P] Add responsive layout assertions for the Data Model Builder in `apps/web/tests/e2e/responsive-layout.spec.ts`
- [X] T067 [P] Add responsive usability assertions for stacked builder sections and accessible primary actions in `apps/web/tests/e2e/responsive-usability.spec.ts`
- [X] T068 [P] Add visual geometry assertions for preserving shell, tree, and canvas layout in `apps/web/tests/visual/layout-geometry.spec.ts`
- [X] T069 [P] Add regression assertions that existing Connections behavior remains intact in `apps/web/tests/unit/connection-builder.test.tsx`
- [X] T070 Harden safe diagnostic coverage for no generated SQL, paths, stack traces, raw driver errors, row data, or profiling details in `apps/api/tests/integration/test_data_model_dry_run.py`
- [X] T071 Run backend verification with `pytest` from `apps/api`
- [X] T072 Run frontend unit verification with `npm run test` from `apps/web`
- [X] T073 Run frontend lint verification with `npm run lint` from `apps/web`
- [X] T074 Run workbench visual verification with `npm run test:visual:desktop` from `apps/web`
- [X] T075 Execute the manual acceptance flow from `specs/008-data-models-builder/quickstart.md`, including local performance acceptance that list, save, update, drop, schema metadata, and validation feedback appear within 2 seconds and zero-row dry-run tests complete within 5 seconds under MVP caps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational; MVP slice.
- **User Story 2 (Phase 4)**: Depends on Foundational and can reuse US1 validation/test services; deliver after US1 for practical incremental value.
- **User Story 3 (Phase 5)**: Depends on Foundational and benefits from US2 saved-model flows; deliver after US2.
- **Polish (Phase 6)**: Depends on all targeted user stories being complete.

### User Story Dependencies

- **US1 Build and Test**: Starts after Foundation; no dependency on US2 or US3.
- **US2 Save/Reopen/Update/Drop**: Starts after Foundation, but uses US1 validation and test services for saved tests.
- **US3 Repair Changed Connections**: Starts after Foundation, but uses US2 saved-model load/update flows.

### Within Each User Story

- Write and observe story tests failing before implementation.
- Implement backend contracts and services before frontend integration.
- Implement frontend client helpers before builder/workbench UI wiring.
- Complete each story checkpoint before moving to the next priority story.

### Parallel Opportunities

- T003, T004, T005, T006, and T007 can run in parallel after T002.
- T013, T014, T015, and T020 can run in parallel after T012.
- US1 test tasks T021 through T027 can run in parallel.
- US2 test tasks T040 through T044 can run in parallel.
- US3 test tasks T055 through T058 can run in parallel.
- Responsive, visual, and Connections regression polish tasks T066 through T069 can run in parallel after story implementation.

---

## Parallel Example: User Story 1

```text
Task: "T021 [US1] Add contract tests for schema inspection and unsaved test responses in apps/api/tests/contract/test_data_models_api.py"
Task: "T023 [US1] Add integration tests for strict star-schema validation, caps, role-playing dimensions, composite keys, inner-join warnings, and non-empty measures rejection in apps/api/tests/integration/test_data_model_validation.py"
Task: "T026 [US1] Add frontend client unit tests for schema inspection and unsaved test helpers in apps/web/tests/unit/data-models-client.test.ts"
Task: "T027 [US1] Add builder unit tests for blank builder, incomplete-draft Test, source selection, schema loading, validation diagnostics, and test success warnings in apps/web/tests/unit/data-model-builder.test.tsx"
```

---

## Parallel Example: User Story 2

```text
Task: "T040 [US2] Add contract tests for list, create, read, update, delete, and saved test endpoints in apps/api/tests/contract/test_data_models_api.py"
Task: "T042 [US2] Add frontend client unit tests for list, create, read, update, delete, and saved test helpers in apps/web/tests/unit/data-models-client.test.ts"
Task: "T043 [US2] Add workbench unit tests for dynamic Data Models submenu, auto-expand, saved child selection, upsert after save, and removal after drop in apps/web/tests/unit/data-model-builder.test.tsx"
```

---

## Parallel Example: User Story 3

```text
Task: "T055 [US3] Add backend integration tests for missing Connection diagnostics on load and test in apps/api/tests/integration/test_data_models_flow.py"
Task: "T057 [US3] Add frontend builder unit tests for missing Connection diagnostics, replacement selection, preserved configuration, invalid rule preservation, and retest in apps/web/tests/unit/data-model-builder.test.tsx"
Task: "T058 [US3] Add e2e coverage for deleting a referenced Connection, reopening the model, repairing the source, and retesting in apps/web/tests/e2e/local-interactions.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Stop and validate: users can configure and test an unsaved strict star-schema model with safe diagnostics.

### Incremental Delivery

1. Add User Story 1 to prove schema inspection, validation, business rules, and zero-row dry-run testing.
2. Add User Story 2 to persist models and make the Data Models workbench menu dynamic.
3. Add User Story 3 to make saved models repairable when Connections change.
4. Complete polish and run the quickstart acceptance flow.

### Parallel Team Strategy

1. Complete Setup and Foundational tasks together.
2. Split backend validation/parser/compiler work from frontend builder/client work within each story.
3. Keep test files separate where possible to preserve parallel work.
4. Integrate in priority order: US1, then US2, then US3.

## Notes

- Tests must be written and observed failing before the corresponding implementation tasks.
- Preserve existing Connections behavior while adding Data Models behavior.
- Do not expose generated SQL, absolute paths, raw driver errors, stack traces, row data, or profiling details in any user-facing response.
- Do not implement measures, materialization, profiling, snowflake relationships, graph editing, or non-SQLite sources in this feature.
