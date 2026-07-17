# Implementation Plan: CreditModeler Connections Builder

**Branch**: `007-connections-builder` | **Date**: 2026-07-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-connections-builder/spec.md`; implementation detail source from `docs/nfr/CreditModeler Connections Builder Multi-Phase Plan.md`

## Summary

Build the CreditModeler workbench `Connections` capability as an authenticated full-stack feature. The backend will persist per-user SQLite connection metadata, safely discover selectable SQLite files under `data/datasets/`, expose CRUD and test operations, and enforce path/ownership/label constraints. The frontend will replace static example connection tree entries with saved user connections and render a canvas-panel Connection Builder for creating, testing, updating, reopening, and dropping saved connection metadata.

Implementation follows the user-provided multi-phase plan:

1. Backend data model and migration.
2. Backend database discovery and validation.
3. Backend authenticated API.
4. Frontend connection API client.
5. Workbench state refactor.
6. Dynamic Connections menu.
7. Connection Builder UI.
8. Backend tests.
9. Frontend tests.
10. Verification.

## Technical Context

**Language/Version**: Python >=3.11 for `apps/api`; TypeScript 5.6.3 with React 18.3.1 for `apps/web`

**Primary Dependencies**: FastAPI, Pydantic Settings, SQLAlchemy 2.x, Alembic, pytest, httpx; Next.js 15.0.3, React, Vitest, Testing Library, Playwright

**Storage**: Existing application database through SQLAlchemy/Alembic for saved metadata; source SQLite dataset files under `data/datasets/` for selectable database options

**Testing**: `pytest` in `apps/api`; `npm run test`, `npm run lint`, and targeted Playwright visual/e2e commands in `apps/web`

**Target Platform**: Local/deployed web application with FastAPI backend and Next.js frontend

**Project Type**: Web application with separate backend API and frontend app under `apps/api` and `apps/web`

**Performance Goals**: Discovery, list, save, update, drop, and test feedback visible to users within 2 seconds under normal operating conditions; no table/schema scans during connection tests

**Constraints**: Users must not type paths; absolute paths must never be exposed; path traversal and unknown dataset references must be rejected; `Drop` must remove metadata only; connection tests must not reveal tables, columns, schema, dataset contents, or variables

**Scale/Scope**: First-stage local-file SQLite connection metadata only; supports recursive discovery of `.db`, `.sqlite`, and `.sqlite3` files under `data/datasets/`; later dataset/table/variable loading is explicitly out of scope

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The current constitution file contains placeholder principles and no enforceable project-specific gates. Planning therefore applies the repository guidance in `AGENTS.md` and the active feature specification as the governing constraints.

Pre-design gates:

- PASS: Source-of-truth feature scope is captured in `spec.md` and implementation details are sourced from the NFR multi-phase plan.
- PASS: No unresolved `NEEDS CLARIFICATION` markers remain in the spec or this plan.
- PASS: The plan preserves the explicit security boundary: users select discovered database options only, and absolute/traversal paths are rejected.
- PASS: The plan preserves scope boundaries: no table/column/schema/dataset/variable loading in this feature.
- PASS: Verification is per-area, matching the repo shape.

Post-design gates:

- PASS: `research.md`, `data-model.md`, `contracts/connections-api.md`, and `quickstart.md` reflect the same scope and constraints.
- PASS: API contracts include authenticated ownership checks, path validation, duplicate-label behavior, and test boundaries.
- PASS: Data model includes stable identity, immutable labels, per-user uniqueness, relative dataset references, and successful-test timestamp behavior.

## Project Structure

### Documentation (this feature)

```text
specs/007-connections-builder/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── connections-api.md
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
│   │   ├── core/
│   │   ├── db/
│   │   └── modules/
│   │       ├── auth/
│   │       └── connections/
│   └── tests/
│       ├── contract/
│       └── integration/
├── web/
│   ├── app/
│   │   └── (protected)/creditmodeler-service/
│   ├── components/workbench/
│   ├── config/
│   ├── features/creditmodeler/
│   └── tests/
│       ├── e2e/
│       ├── unit/
│       └── visual/

data/
└── datasets/
```

**Structure Decision**: Implement the feature in the existing `apps/api` and `apps/web` applications. Backend connection domain code belongs in a new `apps/api/app/modules/connections/` module and migration under `apps/api/alembic/versions/`. Frontend connection state/client/UI code belongs in `apps/web/features/creditmodeler/` and existing workbench components/config.

## Complexity Tracking

No constitution violations or additional complexity exceptions are required.

## Phase 0: Research

Research output is captured in [research.md](./research.md). All technical context unknowns are resolved from existing repo manifests, current source shape, the active specification, and the NFR multi-phase implementation plan.

## Phase 1: Design And Contracts

Design outputs:

- [data-model.md](./data-model.md)
- [contracts/connections-api.md](./contracts/connections-api.md)
- [quickstart.md](./quickstart.md)

## Implementation Phases

### Phase 1: Backend Data Model

Add `DatabaseConnection` metadata persistence.

- Create `apps/api/app/modules/connections/models.py`.
- Add migration `apps/api/alembic/versions/002_database_connections.py`.
- Add an `InternalUser` relationship if useful for ownership queries.
- Enforce per-user label uniqueness using normalized labels that trim whitespace and ignore capitalization.

### Phase 2: Backend Discovery And Validation

Add safe recursive dataset discovery.

- Add `datasets_root` configuration defaulting to repo-root `data/datasets`.
- Discover only `.db`, `.sqlite`, and `.sqlite3` files recursively.
- Return relative values and extensionless labels.
- Resolve paths internally and reject unknown, absolute, empty, and traversal-style references.

### Phase 3: Backend API

Add authenticated connection operations.

- Add schemas, repository, service, and router under `apps/api/app/modules/connections/`.
- Register the router in `apps/api/app/api/router.py`.
- Implement discovery, list, create, read, update, delete, unsaved test, and saved test.
- Ensure saved test updates `last_tested_at` only after successful validation.
- Ensure test responses reveal no table, column, schema, dataset, or variable metadata.

### Phase 4: Frontend API Client

Add CreditModeler connection client helpers.

- Add connection types and client functions under `apps/web/features/creditmodeler/`.
- Reuse existing frontend API base URL/auth patterns.
- Normalize backend validation and failure messages for UI display.

### Phase 5: Workbench State Refactor

Make tree selection drive the canvas.

- Add or adapt a `CreditModelerWorkbench` container.
- Lift selected tree state so `CanvasPanel` can render connection-specific content.
- Preserve existing expand/collapse behavior and non-connection canvas hints.

### Phase 6: Dynamic Connections Menu

Replace static connection examples.

- Remove hard-coded `Server1` and `Server2` from the user-facing connections submenu.
- Load saved connections for the signed-in user.
- Render saved connections as children under `Connections`.
- Map top-level `Connections` selection to a blank builder and saved-child selection to a populated builder.

### Phase 7: Connection Builder UI

Implement create, test, save, update, and drop flows in the canvas panel.

- New mode: editable label, fixed database type, database selector, test, save.
- Existing mode: read-only label, fixed database type, database selector, test, save, drop.
- Show loading, empty, validation, success, and failure states.
- Confirm before dropping; remove metadata only.

### Phase 8: Backend Tests

Add contract and integration coverage.

- Discovery recursion, extension filtering, relative values, and extensionless labels.
- Authentication and ownership enforcement.
- Duplicate-label validation including trim/case-insensitive uniqueness.
- Unknown/path traversal/absolute path rejection.
- Create, read, update, delete, unsaved test, saved test, and `last_tested_at` behavior.
- No table/column/schema metadata in test responses.

### Phase 9: Frontend Tests

Add unit and interaction coverage.

- Blank builder from top-level `Connections`.
- Database option loading and empty state.
- Save creates submenu item.
- Saved item opens populated builder with read-only label.
- Update selected database only.
- Test success/failure feedback.
- Drop confirmation and submenu refresh.
- Existing workbench tree behavior remains valid.

### Phase 10: Verification

Run focused verification from the relevant app directories.

```powershell
# apps/api
pytest

# apps/web
npm run test
npm run lint
npm run test:visual:desktop
```

Run visual verification when workbench layout or CSS changes affect geometry.
