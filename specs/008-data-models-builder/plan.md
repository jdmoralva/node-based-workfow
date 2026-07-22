# Implementation Plan: CreditModeler Data Models Builder

**Branch**: `main` | **Date**: 2026-07-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/008-data-models-builder/spec.md`; approved topology design from `docs/superpowers/specs/2026-07-21-rooted-data-model-relationships-design.md`; implementation detail source from `docs/nfr/CreditModeler Data Models Builder Multi-Phase Plan.md`

## Summary

Build the CreditModeler workbench `Data Models` capability as an authenticated full-stack feature. The backend persists per-user analytical data model metadata, exposes CRUD, safe foreign-key-aware schema inspection, and zero-row compilation-test operations, normalizes stored legacy definitions to a strict version-2 rooted-tree contract, and returns safe structured diagnostics without exposing generated SQL, file paths, stack traces, or row data. The frontend provides a review-first relationship workbench, explicit parent/child table-instance edges, a rooted Model map, and the existing draft save, source, rule, test, repair, and lifecycle flows.

Implementation follows the user-provided multi-phase plan, with story-specific tests written and observed failing before each story's implementation tasks:

1. Backend persistence foundation.
2. Backend CRUD API.
3. Schema metadata endpoint.
4. Model validation service.
5. Business rule parser and alias cascade.
6. Query compiler and zero-row dry-run test.
7. Backend coverage completion.
8. Frontend API client and types.
9. Workbench dynamic Data Models menu.
10. Data Model Builder UI.
11. Styling and responsive layout.
12. Frontend coverage completion.
13. Verification.
14. Active 008 documentation reconciliation prerequisite.
15. Version-2 backend topology and compatibility changes using TDD.
16. Review-first frontend relationship changes using TDD.
17. Chinook browser acceptance and full verification.

## Technical Context

**Language/Version**: Python >=3.11 for `apps/api`; TypeScript 5.6.3 with React 18.3.1 for `apps/web`

**Primary Dependencies**: FastAPI, Pydantic Settings, SQLAlchemy 2.x, Alembic, pytest, httpx, `sqlglot` for SQLite-expression parsing and rendering; Next.js 15.0.3, React, Vitest, Testing Library, Playwright

**Storage**: Existing application database through SQLAlchemy/Alembic for saved data model metadata and persisted diagnostics; definitions remain JSON, so version-2 topology requires no application-database migration; existing saved SQLite Connections provide source references; source SQLite files remain resolved through the Connections feature rather than user-entered paths

**Testing**: `pytest` in `apps/api`; `npm run test`, `npm run lint`, and targeted Playwright visual/e2e commands in `apps/web`

**Target Platform**: Local/deployed web application with FastAPI backend and Next.js frontend

**Project Type**: Web application with separate backend API and frontend app under `apps/api` and `apps/web`

**Performance Goals**: List, save, update, drop, schema metadata, and validation feedback visible to users within 2 seconds during local acceptance verification with local SQLite files; zero-row dry-run tests complete within 5 seconds for the MVP caps of 5 sources, 25 dimensions, and 50 business rules

**Constraints**: Only saved user-owned SQLite Connections can be modeled; generated SQL, absolute filesystem paths, stack traces, raw database errors, sample rows, row counts, profiling metrics, and SQLite system objects must never be exposed; tests validate compilation only and must warn that row retention, fanout, unmatched dimensions, and cardinality are not validated; model names are immutable after creation; last successful save wins for concurrent edits; business rule scalar functions are limited to `abs`, `coalesce`, `ifnull`, `lower`, `ltrim`, `max`, `min`, `nullif`, `round`, `rtrim`, `substr`, `trim`, and `upper`

**Scale/Scope**: Multi-SQLite rooted dimensional trees only; one fact root, up to 25 dimension instances, explicit parent/child edges, and one incoming edge and one root path per dimension; no arbitrary cyclic or multi-parent graph, free-form graph editing, analytical workloads, profiling, measures, materialized datasets, non-SQLite sources, or advanced semantic-layer governance; per-model caps are 5 source connections, 25 dimensions, and 50 business rules

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The repository has `.specify/memory/constitution.md`, but it currently contains only the default placeholder template and no enforceable project-specific MUST/SHOULD statements. Planning therefore applies `AGENTS.md`, `docs/SPEC.md`, and the active feature specification as governing constraints until a separate constitution update replaces the placeholder content.

Pre-design gates:

- PASS: Source-of-truth feature scope is captured in `spec.md`; the approved rooted-relationships design supersedes prior topology constraints; implementation detail also draws from the user-provided Data Models NFR multi-phase plan.
- PASS: No unresolved `NEEDS CLARIFICATION` markers remain in the spec or this plan.
- PASS: The current constitution artifact was checked and contains no project-specific mandatory gates beyond placeholder text.
- PASS: The plan preserves the security boundary: only saved user-owned Connections can be referenced, generated SQL and filesystem paths are never exposed, and unsafe business rule expressions are rejected.
- PASS: The plan preserves product scope: multi-SQLite rooted-tree compilation checks only; no arbitrary graph, profiling, measures, materialization, analytical workloads, or non-SQLite engines.
- PASS: Verification is per-area, matching the repo shape in `AGENTS.md`.

Post-design gates:

- PASS: `research.md`, `data-model.md`, `contracts/data-models-api.md`, and `quickstart.md` reflect the same scope and constraints.
- PASS: API contracts include authenticated ownership checks, safe schema metadata, CRUD/test boundaries, immutable-name behavior, status/diagnostics semantics, missing-connection repair expectations, and safe error requirements.
- PASS: Data model design includes schema version 2, stable fact/dimension identity, per-user name uniqueness, rooted-tree topology, deterministic legacy normalization, exact save/test severity, model caps, alias cascade expectations, and persisted diagnostic fields.

## Project Structure

### Documentation (this feature)

```text
specs/008-data-models-builder/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── data-models-api.md
├── checklists/
│   └── requirements.md
└── tasks.md              # Created later by /speckit.tasks
```

### Source Code (repository root)

```text
apps/
├── api/
│   ├── alembic/
│   │   └── versions/
│   ├── app/
│   │   ├── api/
│   │   ├── db/
│   │   └── modules/
│   │       ├── auth/
│   │       ├── connections/
│   │       └── data_models/
│   └── tests/
│       ├── contract/
│       └── integration/
└── web/
    ├── app/
    │   └── (protected)/creditmodeler-service/
    ├── config/
    ├── features/creditmodeler/
    └── tests/
        ├── e2e/
        ├── unit/
        └── visual/
```

**Structure Decision**: Implement the feature in the existing `apps/api` and `apps/web` applications. Backend data model domain code belongs in a new `apps/api/app/modules/data_models/` module and migration under `apps/api/alembic/versions/`. Frontend types, client helpers, workbench integration, and builder UI belong in `apps/web/features/creditmodeler/`, with tree configuration in `apps/web/config/tree-menu.ts` and layout styles in `apps/web/app/globals.css` only when needed.

The version-2 topology extension does not change API URLs, Next.js proxy routes, the workbench route, object-tree composition, or the relational `AnalyticalDataModel` storage table.

## Complexity Tracking

No constitution violations or additional complexity exceptions are required.

## Phase 0: Research

Research output is captured in [research.md](./research.md). All technical context unknowns are resolved from the active spec, existing app manifests, implemented Connections feature shape, and the user-provided Data Models multi-phase implementation plan.

## Phase 1: Design And Contracts

Design outputs:

- [data-model.md](./data-model.md)
- [contracts/data-models-api.md](./contracts/data-models-api.md)
- [quickstart.md](./quickstart.md)

## Implementation Phases

### Phase 1: Backend Persistence Foundation

Add data model storage.

- Add `sqlglot` to `apps/api/pyproject.toml`.
- Create `apps/api/app/modules/data_models/`.
- Add the SQLAlchemy `AnalyticalDataModel` model.
- Add Alembic migration `apps/api/alembic/versions/003_data_models.py`.
- Register data model models in `apps/api/app/db/base.py`.
- Add an `InternalUser` relationship to saved data models when useful for ownership queries.
- Enforce per-user normalized name uniqueness.
- Add persisted timestamp and structured diagnostics fields.

### Phase 2: Backend CRUD API

Expose authenticated create, list, read, update, and delete operations.

- Add Pydantic schemas for data model create, update, response, list, diagnostics, status, and model definition shapes.
- Add repository functions for current-user-owned records.
- Add service logic for draft/untested/stale status calculation.
- Support listing all saved models and filtering by exactly one current status.
- Add the API router and register it under `/api`.
- Reject changed names on update.
- Enforce ownership for read, update, delete, saved test, and schema operations.

### Phase 3: Schema Metadata Endpoint

Expose safe table/view/column metadata for saved Connections.

- Add schema inspection service functions.
- Reuse existing Connection ownership and database-reference validation.
- Open SQLite files in read-only mode.
- Return user tables and views only; exclude SQLite system objects.
- Return declared column type, nullable flag when available, and primary-key flag.
- Group SQLite foreign keys by declaration ID and sequence and return safe ordered local/referenced identifier pairs.
- Resolve omitted referenced columns only against an identifiable ordered primary key with matching cardinality; otherwise omit the declaration from suggestions.
- Return `foreign_keys: []` for views and exclude unresolved, missing, unsafe, and system-object declarations.
- Ensure no sample rows, counts, profiling metrics, generated SQL, absolute paths, or raw errors are exposed.

### Phase 4: Model Validation Service

Validate data model definitions independently of SQL compilation.

- Validate version-2 model schemas and reject unknown core keys, unknown versions, mixed relationship fields, and version-1 public write payloads.
- Normalize persisted version-1 definitions at one storage-read boundary before strict version-2 validation; make normalization deterministic and idempotent and rewrite only on successful save.
- Assign a stable ID to the fact and retain stable generated IDs for dimensions, relationships, and business rules.
- Validate duplicate IDs and one shared, trimmed, case-insensitive table-alias namespace.
- Enforce caps of 5 sources, 25 dimensions, and 50 business rules.
- Validate one fact table when testing.
- Validate role-playing dimensions by alias.
- Validate explicit `parent_table_id` and `child_table_id` relationships as an unordered rooted tree.
- Reject unknown endpoints, an incoming fact edge, self-links, cycles, duplicate incoming edges, duplicate endpoint pairs, and disconnected topology at test time.
- Allow saveable repair gaps while blocking malformed topology according to the approved severity matrix.
- Validate exactly one incoming relationship and one fact-root path per dimension for testability.
- Validate single and composite join keys.
- Validate allowed join types and inner-join warnings.
- Reject non-empty `measures`.
- Return structured deterministic errors and warnings.

### Phase 5: Business Rule Parser And Alias Cascade

Add parser-backed rule validation and expression rewriting.

- Parse business rule expressions using SQLite dialect support.
- Reject unsafe raw input before parsing.
- Reject unsupported expression nodes after parsing.
- Validate column references against fact and joined dimension aliases.
- Validate function calls against the approved scalar allowlist: `abs`, `coalesce`, `ifnull`, `lower`, `ltrim`, `max`, `min`, `nullif`, `round`, `rtrim`, `substr`, `trim`, and `upper`.
- Render validated expressions back to SQLite-compatible expressions for dry-run compilation.
- Keep ID-based relationship endpoints stable when aliases change; rewrite business rule table qualifiers only when unambiguous and otherwise preserve and diagnose the expression.
- Preserve invalid rules and report structured diagnostics instead of deleting them.

### Phase 6: Query Compiler And Dry-Run Test

Compile the rooted dimensional tree and run zero-row SQLite dry-run tests.

- Build a compiler that quotes identifiers and isolates generated SQL from API responses.
- Use the fact Connection as the main read-only SQLite connection.
- Attach additional referenced SQLite files read-only using backend-generated aliases.
- Build adjacency independently of relationship payload order and traverse root first, sorting siblings by child alias, child table-instance ID, and relationship ID.
- Join each child only after its parent is present; compile endpoint-neutral composite key pairs and business rules across all connected aliases.
- Execute a zero-row query only.
- Return all deterministic validation errors before dry-run.
- Return any compile failure as a structured safe error.
- Persist success/failure timestamps and diagnostics for saved tests.

### Phase 7: Backend Test Coverage Check

Confirm backend contract and integration coverage. Story-specific backend tests are still written and observed failing before the corresponding story implementation tasks.

- Authentication and ownership enforcement for all data model endpoints.
- Draft create with only a valid name.
- Per-user case-insensitive trimmed-name uniqueness, with same name allowed for different users.
- Update rejects changed names.
- List default-all and single-status filter behavior.
- Delete removes saved metadata.
- Schema endpoint returns safe tables/views/columns/grouped foreign keys and excludes system objects and sensitive details.
- Storage-read normalization covers complete and partial legacy definitions, fact-ID collisions, deterministic placeholders, idempotence, and normalization-only saves.
- Public write/test contracts reject legacy, mixed, unknown-version, and saved-test-body payloads and always respond with version 2.
- Validation accepts role-playing dimensions, dimension-to-dimension edges, and composite keys in a complete rooted tree.
- Validation distinguishes malformed save-blocking topology from saveable incomplete/disconnected repair states and rejects non-empty measures, over-cap models, duplicate aliases/IDs, and unsupported joins.
- Business rule parser accepts allowed expressions and rejects unsafe expressions.
- Alias cascade rewrites business rule qualifiers.
- Dry-run compiles the complete Chinook-shaped tree across multiple attached SQLite files when relationships arrive out of order.
- Saved test persists status, timestamps, warnings, and errors, preserving prior successful timestamp after later failure.
- Generated SQL and absolute paths are never returned.

### Phase 8: Frontend API Client And Types

Add typed frontend helpers.

- Add TypeScript types for schema-version-2 saved data models, stable fact identity, explicit relationship endpoints, safe grouped foreign-key metadata, diagnostics, statuses, and test responses.
- Add client helpers for list, create, read, update, delete, test, and schema inspection.
- Reuse existing API base URL and credential pattern.
- Normalize backend validation and failure messages for UI display.

### Phase 9: Workbench Integration And Dynamic Data Models Menu

Make `Data Models` dynamic like `Connections`.

- Remove static `Origination` and `Portfolio` children from the default tree config.
- Load saved data models on workbench mount.
- Render saved models as children under `Data Models`.
- Auto-expand `Data Models` when saved models exist.
- Map top-level `Data Models` selection to a blank builder.
- Map saved child selections to populated builders.
- Upsert saved models into the submenu after create/update.
- Remove dropped models from the submenu and clear selection.
- Preserve existing `Connections` behavior.

### Phase 10: Data Model Builder UI

Implement the structured rooted-model workspace inside the existing canvas frame.

- Add `DataModelBuilder`.
- Render new and existing modes.
- Make saved model names read-only.
- Allow saving drafts with only a valid name.
- Keep Test clickable for incomplete drafts and render structured completeness diagnostics.
- Load saved Connections for source selection.
- Load schema metadata by saved Connection ID.
- Configure fact root, dimensions, explicit endpoint relationships, and business rules.
- Derive deterministic breadth-first relationship suggestions from safe same-connection foreign keys without persisting suggestions or changing the draft before confirmation.
- Show prerequisite-aware individual and atomic batch acceptance; revalidate the full selection before root-first insertion.
- Create or explicitly reuse dimension aliases during acceptance, handling alias collisions, ambiguity, missing primary keys, depth limits, and capacity omissions visibly.
- Support role-playing dimensions through aliases.
- Support composite relationship key pairs.
- Show static warnings for inner joins and zero-row limitation.
- Show structured diagnostics and stale diagnostics notices.
- Allow replacement of missing Connections while preserving configuration where possible.
- Preserve invalid business rules and show validation diagnostics.
- Render a read-only indented Model map with root paths, edge health, focus navigation, and a disconnected repair group.
- Keep manual endpoint-aware relationship cards and branch/source destructive-edit confirmations available.
- Implement Test, Save, and Drop actions with confirmation for Drop.
- Apply last-save-wins semantics for concurrent saves.

### Phase 11: Styling And Responsive Layout

Fit the builder into the approved workbench geometry.

- Add `rv-data-model-builder` styles only as needed.
- Reuse the existing builder visual language where practical.
- Keep scrolling inside the canvas panel.
- Preserve shell, tree column, and canvas geometry.
- Support stacked sections on narrow viewports.
- Avoid route-level layout changes.

### Phase 12: Frontend Test Coverage Check

Confirm frontend unit and interaction coverage. Story-specific frontend tests are still written and observed failing before the corresponding story implementation tasks.

- Clicking `Data Models` opens a blank builder.
- Static `Origination` and `Portfolio` labels are removed.
- Saved model labels appear under `Data Models` and auto-expand the submenu.
- Saving a draft creates a submenu child.
- Clicking a saved child opens a populated builder.
- Existing model name is read-only.
- Test remains clickable for incomplete drafts and renders structured errors.
- Test success renders tested status and warnings.
- Save after edit renders stale or draft status as appropriate.
- Drop requires confirmation and removes the submenu child.
- Missing Connection diagnostics are visible.
- Missing Connection replacement preserves configuration where possible.
- Inner join warning is visible.
- Chinook suggestions are ordered root first, stay advisory until confirmed, and exclude reverse child transactions and unrelated tables.
- Deep-suggestion prerequisite closure and stale/over-cap batch rejection are atomic.
- Manual dimension-to-dimension relationships work while immediate self-link, cycle, and second-parent choices are prevented.
- Connected and disconnected branches render and focus the matching editor without horizontal page scrolling.
- Intermediate-edge, table, fact, and source removal preserve or remove descendants exactly as confirmed without dangling endpoint IDs or lost business rules.
- Existing `Connections` behavior remains intact.

### Phase 13: Baseline Verification

Run focused verification from the relevant app directories.

```powershell
# apps/api
pytest

# apps/web
npm run test
npm run lint
npm run test:visual:desktop
```

Run visual verification when workbench layout or CSS changes affect geometry. Protected-route Playwright checks remain backend-auth gated according to the existing app convention.

During local acceptance verification, confirm list, save, update, drop, schema metadata, and validation feedback are visible within 2 seconds, and zero-row dry-run tests complete within 5 seconds for the MVP caps of 5 source connections, 25 dimensions, and 50 business rules.

### Phase 14: Approved Design Documentation Prerequisite

Before changing production code, reconcile `spec.md`, this plan, `data-model.md`, `contracts/data-models-api.md`, `tasks.md`, `research.md`, `quickstart.md`, and `checklists/requirements.md` with the approved rooted-relationships design. Search all eight active documents and remove any requirement that constrains relationships to one topology level or rejects a valid dimension-to-dimension tree edge. Production implementation remains blocked until this prerequisite is complete.

### Phase 15: Version-2 Backend Topology And Compatibility

Follow red-green-refactor for each focused behavior; tests use deterministic temporary Chinook-shaped SQLite databases rather than local untracked data.

- Add failing contract and integration tests for deterministic, collision-free, idempotent storage-read normalization of complete and every currently saveable partial version-1 shape.
- Add failing tests proving create, update, and unsaved test accept version 2 only; saved test accepts no body; unknown versions and mixed relationship fields are rejected; all model responses are normalized version 2.
- Add failing tests proving a semantically unchanged legacy save rewrites storage without changing diagnostics, stale state, status, or test timestamps.
- Add failing inspection tests for grouped single/composite SQLite foreign keys, ordered-primary-key resolution, view behavior, and sensitive metadata exclusion.
- Add failing validation and status tests for all rooted-tree invariants and the exact save-blocking, saveable-gap, test-error, and warning classes in the approved severity table.
- Add failing compiler tests for the complete Chinook tree, out-of-order relationships, deterministic sibling/diagnostic ordering, role-playing aliases, composite keys, and manual cross-connection edges.
- Implement the minimum version-2 schemas, storage-read normalizer, safe foreign-key inspection, rooted validation/status logic, and deterministic compiler changes needed to pass each test, refactoring only while green.

Create, update, and unsaved-test bodies are strict version 2. The saved-model test endpoint rejects any definition body and tests only the canonical saved definition; a dirty draft must use unsaved test and cannot mark an older saved definition tested. Repairable gaps round-trip as drafts, while malformed topology is save-blocking. Unknown endpoint IDs are never persisted after a destructive edit.

### Phase 16: Review-First Frontend Relationships

Follow red-green-refactor for each interaction and derived-state behavior.

- Add failing unit tests for version-2 draft initialization, stable fact IDs, normalized hydration, safe foreign-key typing, and canonical dirty-state comparison.
- Add failing deterministic discovery tests for root-first Chinook traversal, per-path identity, alias-path reuse, cycles, dangling targets, the 25-edge depth bound, capacity reporting, and candidate ordering.
- Add failing tests for advisory-only suggestions, deep prerequisite selection, locked prerequisites, atomic stale/ambiguous/over-cap batch rejection, alias creation/reuse choice, primary-key gaps, and stale provenance.
- Add failing interaction tests for endpoint-aware manual relationships, compatible-key preservation, invalid-key clearing, rooted map focus, connected/disconnected rendering, and path-specific diagnostics.
- Add failing destructive-edit tests for intermediate edges, table branches, clearing/replacing the fact, overlapping source impact sets, preserved business rules, and cancellation without partial mutation.
- Add failing responsive/accessibility tests for keyboard review and confirmations, polite action feedback, relationship key stacking, and suggestions/cards preceding the Model map on narrow viewports.
- Implement the minimum types, review queue, relationship cards, Model map, destructive-edit flows, and styling needed to pass each test, refactoring only while green.

### Phase 17: Chinook Acceptance And Verification

- Verify the eight approved left-join edges and nine table instances from `InvoiceLine` through `Invoice`, `Customer`, `Employee`, `Track`, `Album`, `Artist`, `Genre`, and `MediaType`.
- Verify outbound local-to-referenced discovery does not propose `Playlist`, `PlaylistTrack`, or unrelated tables.
- Test and save the completed model, reopen it, edit a multi-hop edge, observe stale status, and retest.
- Open a legacy saved model and save it without reconstructing relationships.
- Run all backend and frontend commands below and repeat the active-document contradiction search.

```powershell
# apps/api
pytest

# apps/web
npm run test
npm run lint
npm run test:visual:desktop
```
