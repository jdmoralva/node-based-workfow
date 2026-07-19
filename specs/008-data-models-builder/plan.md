# Implementation Plan: CreditModeler Data Models Builder

**Branch**: `main` | **Date**: 2026-07-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/008-data-models-builder/spec.md`; implementation detail source from `docs/nfr/CreditModeler Data Models Builder Multi-Phase Plan.md`

## Summary

Build the CreditModeler workbench `Data Models` capability as an authenticated full-stack feature. The backend will persist per-user analytical data model metadata, expose CRUD, schema-inspection, and zero-row compilation-test operations, validate strict star-schema definitions across saved SQLite `Connections`, and return safe structured diagnostics without exposing generated SQL, file paths, stack traces, or row data. The frontend will replace static Data Models examples with dynamic saved models and render a canvas-panel Data Model Builder for draft save, source selection, fact/dimension/relationship/rule configuration, test, update, repair, and drop flows.

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

## Technical Context

**Language/Version**: Python >=3.11 for `apps/api`; TypeScript 5.6.3 with React 18.3.1 for `apps/web`

**Primary Dependencies**: FastAPI, Pydantic Settings, SQLAlchemy 2.x, Alembic, pytest, httpx, `sqlglot` for SQLite-expression parsing and rendering; Next.js 15.0.3, React, Vitest, Testing Library, Playwright

**Storage**: Existing application database through SQLAlchemy/Alembic for saved data model metadata and persisted diagnostics; existing saved SQLite Connections provide source references; source SQLite files remain resolved through the Connections feature rather than user-entered paths

**Testing**: `pytest` in `apps/api`; `npm run test`, `npm run lint`, and targeted Playwright visual/e2e commands in `apps/web`

**Target Platform**: Local/deployed web application with FastAPI backend and Next.js frontend

**Project Type**: Web application with separate backend API and frontend app under `apps/api` and `apps/web`

**Performance Goals**: List, save, update, drop, schema metadata, and validation feedback visible to users within 2 seconds during local acceptance verification with local SQLite files; zero-row dry-run tests complete within 5 seconds for the MVP caps of 5 sources, 25 dimensions, and 50 business rules

**Constraints**: Only saved user-owned SQLite Connections can be modeled; generated SQL, absolute filesystem paths, stack traces, raw database errors, sample rows, row counts, profiling metrics, and SQLite system objects must never be exposed; tests validate compilation only and must warn that row retention, fanout, unmatched dimensions, and cardinality are not validated; model names are immutable after creation; last successful save wins for concurrent edits; business rule scalar functions are limited to `abs`, `coalesce`, `ifnull`, `lower`, `ltrim`, `max`, `min`, `nullif`, `round`, `rtrim`, `substr`, `trim`, and `upper`

**Scale/Scope**: First-stage multi-SQLite strict star-schema modeling only; one fact table; direct fact-to-dimension relationships only; no snowflake schemas, analytical workloads, profiling, measures, materialized datasets, graph editing, non-SQLite sources, or advanced semantic-layer governance; per-model caps are 5 source connections, 25 dimensions, and 50 business rules

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The repository has `.specify/memory/constitution.md`, but it currently contains only the default placeholder template and no enforceable project-specific MUST/SHOULD statements. Planning therefore applies `AGENTS.md`, `docs/SPEC.md`, and the active feature specification as governing constraints until a separate constitution update replaces the placeholder content.

Pre-design gates:

- PASS: Source-of-truth feature scope is captured in `spec.md`; implementation detail source is the user-provided Data Models NFR multi-phase plan.
- PASS: No unresolved `NEEDS CLARIFICATION` markers remain in the spec or this plan.
- PASS: The current constitution artifact was checked and contains no project-specific mandatory gates beyond placeholder text.
- PASS: The plan preserves the security boundary: only saved user-owned Connections can be referenced, generated SQL and filesystem paths are never exposed, and unsafe business rule expressions are rejected.
- PASS: The plan preserves product scope: multi-SQLite strict star-schema compilation checks only; no profiling, measures, materialization, analytical workloads, non-SQLite engines, or snowflake modeling.
- PASS: Verification is per-area, matching the repo shape in `AGENTS.md`.

Post-design gates:

- PASS: `research.md`, `data-model.md`, `contracts/data-models-api.md`, and `quickstart.md` reflect the same scope and constraints.
- PASS: API contracts include authenticated ownership checks, safe schema metadata, CRUD/test boundaries, immutable-name behavior, status/diagnostics semantics, missing-connection repair expectations, and safe error requirements.
- PASS: Data model design includes stable identity, per-user name uniqueness, status transitions, strict star-schema shape, model caps, alias cascade expectations, and persisted diagnostic fields.

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
- Ensure no sample rows, counts, profiling metrics, generated SQL, absolute paths, or raw errors are exposed.

### Phase 4: Model Validation Service

Validate data model definitions independently of SQL compilation.

- Validate strict model schemas and reject unknown core keys.
- Validate stable generated IDs for dimensions, relationships, and business rules.
- Validate duplicate IDs and aliases.
- Enforce caps of 5 sources, 25 dimensions, and 50 business rules.
- Validate one fact table when testing.
- Validate role-playing dimensions by alias.
- Validate strict star-schema relationships and reject snowflake relationships.
- Validate one relationship per dimension alias.
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
- Rewrite relationship alias references and business rule table alias qualifiers when aliases are edited; preserve and diagnose expressions that cannot be rewritten unambiguously.
- Preserve invalid rules and report structured diagnostics instead of deleting them.

### Phase 6: Query Compiler And Dry-Run Test

Compile the star schema and run zero-row SQLite dry-run tests.

- Build a compiler that quotes identifiers and isolates generated SQL from API responses.
- Use the fact Connection as the main read-only SQLite connection.
- Attach additional referenced SQLite files read-only using backend-generated aliases.
- Compile fact table, dimensions, relationships, join keys, and row-level business rules.
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
- Schema endpoint returns tables/views/columns only and excludes system objects and sensitive details.
- Validation allows role-playing dimensions and composite keys.
- Validation rejects snowflake relationships, non-empty measures, over-cap models, duplicate aliases/IDs, and unsupported joins.
- Business rule parser accepts allowed expressions and rejects unsafe expressions.
- Alias cascade rewrites business rule qualifiers.
- Dry-run compiles across multiple attached SQLite files.
- Saved test persists status, timestamps, warnings, and errors, preserving prior successful timestamp after later failure.
- Generated SQL and absolute paths are never returned.

### Phase 8: Frontend API Client And Types

Add typed frontend helpers.

- Add TypeScript types for saved data models, model definitions, schema metadata, diagnostics, statuses, and test responses.
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

Implement the structured star-schema workspace inside the existing canvas frame.

- Add `DataModelBuilder`.
- Render new and existing modes.
- Make saved model names read-only.
- Allow saving drafts with only a valid name.
- Keep Test clickable for incomplete drafts and render structured completeness diagnostics.
- Load saved Connections for source selection.
- Load schema metadata by saved Connection ID.
- Configure fact table, dimensions, relationships, and business rules.
- Support role-playing dimensions through aliases.
- Support composite relationship key pairs.
- Show static warnings for inner joins and zero-row limitation.
- Show structured diagnostics and stale diagnostics notices.
- Allow replacement of missing Connections while preserving configuration where possible.
- Preserve invalid business rules and show validation diagnostics.
- Render a simple star-schema preview.
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
- Existing `Connections` behavior remains intact.

### Phase 13: Verification

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
