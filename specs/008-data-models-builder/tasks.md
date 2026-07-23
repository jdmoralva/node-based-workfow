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

**Goal**: Establish the initial version-1 model-builder baseline with schema inspection, business rules, and a zero-row compilation test that returns safe structured diagnostics. The approved version-2 rooted topology is added by the pending phases below.

**Independent Test**: Open Data Models, select saved SQLite connections, configure a fact table, dimension, relationship, join keys, and business rule, then run Test and receive success, warnings, or safe structured errors without saving the model.

### Tests for User Story 1

- [X] T021 [P] [US1] Add contract tests for schema inspection and unsaved test responses in `apps/api/tests/contract/test_data_models_api.py`
- [X] T022 [P] [US1] Add integration tests for schema metadata safety and SQLite system-object exclusion in `apps/api/tests/integration/test_data_models_flow.py`
- [X] T023 [P] [US1] Add integration tests for the initial version-1 relationship validation baseline, caps, role-playing dimensions, composite keys, inner-join warnings, and non-empty measures rejection in `apps/api/tests/integration/test_data_model_validation.py`
- [X] T024 [P] [US1] Add integration tests for business rule parsing, unsafe expression rejection, the approved scalar function allowlist, unknown references, business-rule alias rewrites, ambiguous rewrite diagnostics, and the initial version-1 alias-reference behavior in `apps/api/tests/integration/test_data_model_business_rules.py`
- [X] T025 [P] [US1] Add integration tests for zero-row dry-run compilation across multiple saved SQLite connections in `apps/api/tests/integration/test_data_model_dry_run.py`
- [X] T026 [P] [US1] Add frontend client unit tests for schema inspection and unsaved test helpers in `apps/web/tests/unit/data-models-client.test.ts`
- [X] T027 [P] [US1] Add builder unit tests for blank builder, incomplete-draft Test, source selection, schema loading, validation diagnostics, and test success warnings in `apps/web/tests/unit/data-model-builder.test.tsx`

### Implementation for User Story 1

- [X] T028 [US1] Implement schema inspection service for user-owned SQLite Connections in `apps/api/app/modules/data_models/schema_inspection.py`
- [X] T029 [US1] Add schema inspection endpoint `GET /api/data-models/connections/{connection_id}/schema` in `apps/api/app/modules/data_models/api.py`
- [X] T030 [US1] Implement the initial version-1 model validation baseline for shape, IDs, aliases, caps, fact table, dimensions, relationships, joins, measures, and warnings in `apps/api/app/modules/data_models/validation.py`
- [X] T031 [US1] Implement business rule parser and validator with the approved scalar function allowlist in `apps/api/app/modules/data_models/rule_parser.py`
- [X] T032 [US1] Implement the initial version-1 alias cascade behavior and safe business rule qualifier rewrites when fact, dimension, or source aliases change in `apps/api/app/modules/data_models/rule_parser.py`
- [X] T033 [US1] Implement the initial zero-row query compiler with safe identifier handling and no SQL exposure in `apps/api/app/modules/data_models/query_compiler.py`
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

## Phase 6: Baseline Polish & Cross-Cutting Concerns

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
- [X] T075 Execute the then-current baseline manual acceptance flow, later superseded by the version-2 flow in T111, including local performance acceptance that list, save, update, drop, schema metadata, and validation feedback appear within 2 seconds and zero-row dry-run tests complete within 5 seconds under MVP caps

---

## Phase 7: Approved Design Documentation Prerequisite

**Purpose**: Reconcile every active 008 feature document with the approved rooted-relationships design before any version-2 production or test change.

- [X] T076 Reconcile requirements, scenarios, entities, and acceptance criteria in `specs/008-data-models-builder/spec.md`
- [X] T077 Reconcile scope, gates, phases, TDD strategy, and verification in `specs/008-data-models-builder/plan.md`
- [X] T078 Reconcile version-2 entities, normalization, topology, and save/test severity in `specs/008-data-models-builder/data-model.md`
- [X] T079 Reconcile request/response shapes, saved/unsaved test boundaries, legacy reads, and schema metadata in `specs/008-data-models-builder/contracts/data-models-api.md`
- [X] T080 Preserve completed implementation history and add pending rooted-topology TDD work in `specs/008-data-models-builder/tasks.md`
- [X] T081 Replace superseded topology decisions and record approved compatibility and suggestion decisions in `specs/008-data-models-builder/research.md`
- [X] T082 Replace the baseline flow with version-2, Chinook, legacy, and repair-state acceptance in `specs/008-data-models-builder/quickstart.md`
- [X] T083 Record approved-design readiness and contradiction checks in `specs/008-data-models-builder/checklists/requirements.md`

**Checkpoint**: All eight active documents agree on schema version 2, rooted-tree topology, explicit relationship endpoints, and exact save/test semantics; implementation may begin.

---

## Phase 8: Version-2 Backend Topology And Compatibility

**Purpose**: Add the canonical version-2 contract, legacy storage-read compatibility, safe foreign-key metadata, rooted validation, and deterministic compilation using strict red-green-refactor cycles.

### Failing Tests First

- [ ] T084 [P] Add contract tests proving create, update, and unsaved test require version 2; all model responses return version 2; unknown/mixed versions fail; and `POST /api/data-models/{model_id}/test` rejects every definition body in `apps/api/tests/contract/test_data_models_api.py`
- [ ] T085 [P] Add normalization tests for complete and every currently saveable partial version-1 shape, including null-fact relationships, the strict placeholder, `fact_root` collisions, field translation, preservation, determinism, and idempotence in `apps/api/tests/integration/test_data_models_flow.py`
- [ ] T086 [P] Add canonical comparison tests proving a normalization-only save rewrites stored JSON without changing status, stale state, diagnostics, or test timestamps and proving dirty drafts use unsaved testing in `apps/api/tests/integration/test_data_models_flow.py`
- [ ] T087 [P] Add schema tests for grouped single/composite SQLite foreign keys, sequence order, safe omitted-column resolution, unresolved declaration omission, empty view metadata, and exclusion of system/sensitive details in `apps/api/tests/integration/test_data_models_flow.py`
- [ ] T088 [P] Add rooted validation/status tests for fact identity, shared alias uniqueness, missing/unknown endpoints, self-links, cycles, duplicate incoming edges and endpoints, disconnected branches, invalid endpoint columns, unsupported joins, exact save severity, and save/reopen of every repairable state in `apps/api/tests/integration/test_data_model_validation.py`
- [ ] T089 [P] Add compiler tests for the complete eight-edge Chinook tree, relationships submitted out of order, deterministic sibling and diagnostic order, composite pairs, role-playing aliases, inner-path warnings, and manual cross-connection edges using temporary databases in `apps/api/tests/integration/test_data_model_dry_run.py`

### Minimum Implementation

- [ ] T090 Define strict version-2 fact IDs, explicit relationship endpoints/key pairs, foreign-key metadata, and response schemas while rejecting legacy/mixed public writes in `apps/api/app/modules/data_models/schemas.py`
- [ ] T091 Implement the single storage-read version-1 normalizer, collision-free placeholder ID selection, idempotence, and canonical semantic comparison in `apps/api/app/modules/data_models/service.py`
- [ ] T092 Implement safe grouped SQLite foreign-key inspection and ordered-primary-key resolution in `apps/api/app/modules/data_models/schema_inspection.py`
- [ ] T093 Implement rooted-tree validation, deterministic diagnostics, exact malformed-versus-repairable save severity, shared table-alias rules, and graph-based completeness/status in `apps/api/app/modules/data_models/validation.py` and `apps/api/app/modules/data_models/status.py`
- [ ] T094 Implement unordered adjacency planning, deterministic root-first sibling traversal, endpoint-aware joins, and path-specific warnings in `apps/api/app/modules/data_models/query_compiler.py`
- [ ] T095 Enforce version-2 create/update/unsaved-test bodies, bodyless canonical saved tests, normalized responses, rewrite-on-save only, and normalization-preserving history in `apps/api/app/modules/data_models/api.py` and `apps/api/app/modules/data_models/service.py`

**Checkpoint**: The backend accepts the complete Chinook tree, preserves legacy saved work, distinguishes malformed topology from saveable repair states, and never exposes unsafe metadata or generated SQL.

---

## Phase 9: Review-First Frontend Relationships

**Purpose**: Add advisory relationship discovery, explicit endpoint editing, rooted navigation, and safe destructive edits using strict red-green-refactor cycles.

### Failing Tests First

- [ ] T096 [P] Add tests for version-2 draft initialization, stable `fact_` identity, normalized hydration without ID replacement, safe foreign-key types, and canonical dirty-state behavior in `apps/web/tests/unit/data-model-builder.test.tsx`
- [ ] T097 [P] Add deterministic discovery tests for breadth-first Chinook paths, per-path visited sets and identity, alias-path declarations, self/mutual cycles, dangling/system targets, 25-edge depth, remaining capacity, reuse exceptions, omission reporting, and normative sorting in `apps/web/tests/unit/data-model-relationship-suggestions.test.ts`
- [ ] T098 [P] Add tests for advisory-only suggestions, single acceptance, deep prerequisite closure and locked prerequisites, root-first batch insertion, atomic stale/ambiguous/over-cap rejection, dimension alias generation/reuse choice, missing primary-key gaps, and stale provenance in `apps/web/tests/unit/data-model-relationship-suggestions.test.ts`
- [ ] T099 [P] Add endpoint editor and Model map tests for manual dimension-to-dimension joins, prevention of immediate invalid choices, compatible-key preservation, visible incompatible-key clearing, connected/disconnected branches, path diagnostics, and node/edge focus in `apps/web/tests/unit/data-model-builder.test.tsx`
- [ ] T100 [P] Add destructive-edit tests for intermediate-edge preservation, table preserve/remove branch choices, all touching-edge removal, fact clearing and legacy-placeholder completion, overlapping source impact sets, other-source descendant preservation, fact-source full-tree warning/removal, cancellation atomicity, and business-rule preservation in `apps/web/tests/unit/data-model-builder.test.tsx`
- [ ] T101 [P] Add keyboard, live-region, narrow-viewport ordering, stacked key-row, and no-horizontal-page-scroll acceptance for review, manual joins, map focus, and branch confirmation in `apps/web/tests/e2e/responsive-usability.spec.ts`

### Minimum Implementation

- [ ] T102 Add version-2 fact/relationship and safe foreign-key frontend types in `apps/web/features/creditmodeler/data-model-types.ts`
- [ ] T103 Implement bounded deterministic derived suggestions, structured identities, prerequisite closure, capacity reporting, and atomic acceptance in `apps/web/features/creditmodeler/data-model-relationship-suggestions.ts`
- [ ] T104 Implement the detected-join review queue, explicit endpoint relationship cards, alias creation/reuse choice, provenance revalidation, and manual relationship flow in `apps/web/features/creditmodeler/DataModelBuilder.tsx`
- [ ] T105 Replace the former preview with an indented rooted Model map, disconnected repair group, edge health, and editor focus navigation in `apps/web/features/creditmodeler/DataModelBuilder.tsx`
- [ ] T106 Implement atomic intermediate-edge, table branch, fact, and source destructive-edit flows without dangling endpoint IDs or silent rule deletion in `apps/web/features/creditmodeler/DataModelBuilder.tsx`
- [ ] T107 Add responsive and accessible review queue, relationship card, Model map, warning, and confirmation styling in `apps/web/app/globals.css`

**Checkpoint**: Suggestions never mutate the draft before confirmation; manual and detected multi-hop relationships remain understandable, repairable, keyboard accessible, and usable on narrow viewports.

---

## Phase 10: Rooted-Tree Verification

- [ ] T108 Run all backend tests with `pytest` from `apps/api`
- [ ] T109 Run frontend tests and lint with `npm run test` and `npm run lint` from `apps/web`
- [ ] T110 Run desktop visual verification with `npm run test:visual:desktop` from `apps/web`
- [ ] T111 Execute the Chinook, legacy reopen/save, multi-hop stale/retest, repair-state round-trip, and unchanged Connections flows in `specs/008-data-models-builder/quickstart.md`
- [ ] T112 Search all eight active 008 documents for any remaining requirement that constrains valid relationships to one topology level or rejects dimension-to-dimension tree edges, and resolve every result in `specs/008-data-models-builder/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational; MVP slice.
- **User Story 2 (Phase 4)**: Depends on Foundational and can reuse US1 validation/test services; deliver after US1 for practical incremental value.
- **User Story 3 (Phase 5)**: Depends on Foundational and benefits from US2 saved-model flows; deliver after US2.
- **Baseline Polish (Phase 6)**: Depends on all initial user stories being complete.
- **Documentation Prerequisite (Phase 7)**: Depends on the approved design and blocks all version-2 implementation work.
- **Backend Topology (Phase 8)**: Depends on Phase 7; each implementation task depends on its focused failing test.
- **Frontend Relationships (Phase 9)**: Depends on Phase 7 and the version-2 contract from Phase 8; each implementation task depends on its focused failing test.
- **Rooted Verification (Phase 10)**: Depends on Phases 8 and 9.

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
- Documentation tasks T076 through T083 can be edited in parallel but the contradiction check must consider the complete set.
- Backend failing-test tasks T084 through T089 can run in parallel before implementation tasks T090 through T095.
- Frontend failing-test tasks T096 through T101 can run in parallel before implementation tasks T102 through T107.

---

## Parallel Example: User Story 1

```text
Task: "T021 [US1] Add contract tests for schema inspection and unsaved test responses in apps/api/tests/contract/test_data_models_api.py"
Task: "T023 [US1] Add integration tests for the initial version-1 relationship validation baseline, caps, role-playing dimensions, composite keys, inner-join warnings, and non-empty measures rejection in apps/api/tests/integration/test_data_model_validation.py"
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
4. Stop and validate the initial model-builder baseline with safe diagnostics.

### Incremental Delivery

1. Add User Story 1 to prove schema inspection, validation, business rules, and zero-row dry-run testing.
2. Add User Story 2 to persist models and make the Data Models workbench menu dynamic.
3. Add User Story 3 to make saved models repairable when Connections change.
4. Complete polish and run the quickstart acceptance flow.
5. Complete the approved-design documentation prerequisite.
6. Add version-2 backend topology and compatibility test-first.
7. Add review-first frontend relationships test-first.
8. Run rooted-tree and Chinook acceptance.

### Parallel Team Strategy

1. Complete Setup and Foundational tasks together.
2. Split backend validation/parser/compiler work from frontend builder/client work within each story.
3. Keep test files separate where possible to preserve parallel work.
4. Integrate in priority order: US1, then US2, then US3.

## Notes

- Tests must be written and observed failing before the corresponding implementation tasks.
- Preserve existing Connections behavior while adding Data Models behavior.
- Do not expose generated SQL, absolute paths, raw driver errors, stack traces, row data, or profiling details in any user-facing response.
- Do not implement measures, materialization, profiling, arbitrary cyclic or multi-parent graph editing, or non-SQLite sources in this feature.
- Every version-2 behavior starts with a focused failing test, then the minimum implementation, then refactoring while green.
