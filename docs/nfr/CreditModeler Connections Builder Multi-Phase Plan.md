# CreditModeler Connections Builder Multi-Phase Plan

## Objective

Develop the `Connections` option in `/creditmodeler-service` so a credit risk manager can create, test, save, reopen, update, and drop SQLite database connection metadata from the workbench canvas.

The connection builder is the first stage of a larger data-loading capability. This stage only saves reusable SQLite connection metadata and verifies that the selected SQLite database can be opened and queried. Dataset, table, and variable loading will be implemented later.

## Locked Scope Decisions

- Connections are persisted backend-side per authenticated user.
- `Drop` deletes only saved connection metadata and never deletes SQLite database files.
- SQLite databases are discovered recursively under `data/datasets/`.
- Users select a database from a backend-provided list; they do not type database paths manually.
- Database options display without `.db`, `.sqlite`, or `.sqlite3` extensions.
- Saved connection labels are unique per authenticated user.
- Existing connection labels are immutable after creation.
- Existing connections update in place.
- `Test` only verifies that the SQLite file can be opened and queried.
- `Test` does not inspect tables, columns, datasets, or variables in this stage.
- Hard-coded example labels `Server1` and `Server2` will be removed.

## User Experience

Clicking `Connections` in the workbench object tree opens a blank `Connection Builder` in the canvas panel.

Saved connections appear as child labels under `Connections`. Clicking one of those labels opens the same builder populated with the saved configuration.

New connection mode includes:

- `Connection label`, editable.
- `Database type`, fixed to `SQLite`.
- `Database`, selected from discovered databases under `data/datasets/`.
- `Test`.
- `Save Connection`.

Existing connection mode includes:

- `Connection label`, read-only.
- `Database type`, fixed to `SQLite`.
- `Database`, selectable from discovered databases under `data/datasets/`.
- `Test`.
- `Save Connection`.
- `Drop`, with confirmation.

The builder must display clear feedback for loading, validation, test success, test failure, save success, save failure, drop success, and drop failure.

If no SQLite databases are found under `data/datasets/`, the builder must show a clear empty state explaining that no `.db`, `.sqlite`, or `.sqlite3` files are available.

## Database Discovery Rules

The backend scans `data/datasets/` recursively.

Discovery includes only files with these extensions:

- `.db`
- `.sqlite`
- `.sqlite3`

Discovery must not expose absolute server paths. It returns stable relative values and extensionless labels.

Example response:

```json
[
  {
    "value": "portfolio.db",
    "label": "portfolio"
  },
  {
    "value": "risk/loan_book.sqlite",
    "label": "risk/loan_book"
  }
]
```

Saved connection requests must use a `database_path` that matches one of the discovered database option values. The backend rejects unknown paths, absolute paths, empty paths, and traversal attempts.

## Persisted Connection Data

The first-stage schema is SQLite-specific.

Fields:

- `id`
- `user_id`
- `label`
- `driver`
- `database_path`
- `created_at`
- `updated_at`
- `last_tested_at`

Rules:

- `driver` is always `sqlite` in this stage.
- `(user_id, label)` is unique.
- `label` is set when creating a connection and cannot be changed later.
- `database_path` can be updated in place.
- `database_path` stores the relative discovered value, not an absolute path.
- `last_tested_at` is updated only after a successful test of a saved connection.

## Backend Endpoints

All endpoints require an authenticated user.

- `GET /api/connections/databases`
- `GET /api/connections`
- `POST /api/connections`
- `GET /api/connections/{id}`
- `PUT /api/connections/{id}`
- `DELETE /api/connections/{id}`
- `POST /api/connections/test`
- `POST /api/connections/{id}/test`

`POST /api/connections/test` tests a selected database before saving a connection.

`POST /api/connections/{id}/test` tests an existing saved connection and updates `last_tested_at` after success.

The SQLite test runs a minimal query:

```sql
SELECT name FROM sqlite_master LIMIT 1
```

The test must not inspect table schemas, return table names, return column names, load datasets, or create database files.

## Phase 1: Backend Data Model

Add the `DatabaseConnection` model and migration.

Tasks:

- Create the SQLAlchemy model.
- Add an Alembic migration for the `database_connections` table.
- Add a relationship from `InternalUser` to saved connections if useful for ownership queries.
- Add a unique constraint on `(user_id, label)`.

Likely files:

- `apps/api/app/modules/connections/models.py`
- `apps/api/alembic/versions/002_database_connections.py`
- `apps/api/app/modules/auth/models.py`

## Phase 2: Backend Discovery And Validation

Add safe recursive database discovery under `data/datasets/`.

Tasks:

- Add a `datasets_root` setting that defaults to repo-root `data/datasets`.
- Recursively discover SQLite files under the datasets root.
- Return extensionless labels and relative values.
- Resolve all internal filesystem paths safely.
- Reject database paths that are not present in the discovered set.

Likely files:

- `apps/api/app/core/config.py`
- `apps/api/app/modules/connections/service.py`

## Phase 3: Backend API

Add the connections module.

Tasks:

- Add schemas for database options, saved connections, create/update payloads, and test responses.
- Add repository functions for user-owned connection records.
- Add service functions for validation, discovery, CRUD, and SQLite testing.
- Add the API router and register it under `/api`.
- Enforce ownership for read, update, delete, and saved test operations.
- Return clear validation errors for duplicate labels, unknown databases, immutable label changes, missing records, and failed tests.

Likely files:

- `apps/api/app/modules/connections/api.py`
- `apps/api/app/modules/connections/schemas.py`
- `apps/api/app/modules/connections/repository.py`
- `apps/api/app/modules/connections/service.py`
- `apps/api/app/api/router.py`

## Phase 4: Frontend API Client

Add frontend helpers for connection operations.

Tasks:

- Reuse the existing browser API base URL pattern.
- Add helpers for discovery, list, create, read, update, delete, unsaved test, and saved test.
- Normalize API errors into user-facing messages.
- Keep these helpers under the CreditModeler feature area.

Likely files:

- `apps/web/features/creditmodeler/connections-client.ts`
- `apps/web/features/creditmodeler/connection-types.ts`

## Phase 5: Workbench State Refactor

Make the canvas respond to object-tree selection.

Tasks:

- Add a stateful `CreditModelerWorkbench` container.
- Lift selected tree state out of `ObjectTree` or allow `ObjectTree` to report selection upward.
- Preserve expand/collapse behavior.
- Preserve existing workbench layout and geometry.
- Keep the default canvas hint for non-connection selections unless a specific view is implemented.

Likely files:

- `apps/web/app/(protected)/creditmodeler-service/page.tsx`
- `apps/web/features/creditmodeler/CreditModelerWorkbench.tsx`
- `apps/web/components/workbench/Workbench.tsx`
- `apps/web/components/workbench/ObjectTree.tsx`
- `apps/web/components/workbench/ObjectTreeItem.tsx`
- `apps/web/features/creditmodeler/useWorkbenchTree.ts`

## Phase 6: Dynamic Connections Menu

Replace static example connection children with backend data.

Tasks:

- Remove `Server1` and `Server2` from the default `Connections` submenu.
- Load saved connections for the current user.
- Render saved connections as dynamic children under `Connections`.
- Clicking `Connections` opens a blank builder.
- Clicking a saved connection opens that saved record.
- Keep all non-connection tree sections unchanged.

Likely files:

- `apps/web/config/tree-menu.ts`
- `apps/web/features/creditmodeler/CreditModelerWorkbench.tsx`

## Phase 7: Connection Builder UI

Implement the canvas-panel connection builder.

Tasks:

- Render the builder inside `CanvasPanel` for connection selections.
- Load database options from `GET /api/connections/databases`.
- Validate that new connections have a non-empty label and selected database.
- Make existing connection labels read-only.
- Allow existing records to update selected database only.
- Test unsaved and saved database selections.
- Save new connections and refresh the submenu.
- Update existing connections in place and refresh the selected state.
- Confirm before dropping a saved connection.
- Drop metadata only and refresh the submenu.

Likely files:

- `apps/web/components/workbench/CanvasPanel.tsx`
- `apps/web/features/creditmodeler/ConnectionBuilder.tsx`
- `apps/web/app/globals.css`

## Phase 8: Backend Tests

Add backend coverage before or alongside implementation.

Required coverage:

- Discovery is recursive.
- Discovery includes only `.db`, `.sqlite`, and `.sqlite3` files.
- Discovery labels omit extensions.
- Discovery values are relative and do not expose absolute paths.
- Connections endpoints require authentication.
- Save rejects unknown database paths.
- Save enforces per-user label uniqueness.
- Different users can use the same label.
- Update preserves immutable labels.
- Update can change selected database.
- Read, update, delete, and saved test enforce user ownership.
- Drop removes metadata only.
- Unsaved test succeeds for a valid SQLite file.
- Unsaved test fails cleanly for invalid or unopenable files.
- Saved test updates `last_tested_at` after success.
- Test does not inspect or return table/column metadata.

Likely files:

- `apps/api/tests/integration/test_connections_flow.py`
- `apps/api/tests/contract/test_connections_api.py`

## Phase 9: Frontend Tests

Add frontend unit and interaction coverage.

Required coverage:

- Clicking `Connections` opens a blank builder.
- Database options load into the selector.
- Empty database discovery shows a useful empty state.
- Saving creates a submenu label.
- Saved labels appear under `Connections`.
- Clicking a saved label opens a populated builder.
- Existing connection label field is read-only.
- Updating changes the selected database only.
- Testing shows success and failure feedback.
- Drop requires confirmation.
- Confirmed drop removes the submenu label.
- API errors show visible feedback.
- Existing tree expand/collapse and selected-state tests remain valid.

Likely files:

- `apps/web/tests/unit/connection-builder.test.tsx`
- `apps/web/tests/unit/workbench-tree.test.tsx`
- `apps/web/tests/e2e/local-interactions.spec.ts`

## Phase 10: Verification

Run the narrowest relevant verification first, then broader frontend checks.

Backend verification:

```powershell
pytest
```

Run from `apps/api`.

Frontend verification:

```powershell
npm run test
npm run lint
```

Run from `apps/web`.

If workbench layout or CSS changes affect geometry, also run:

```powershell
npm run test:visual:desktop
```

Run from `apps/web`.

## Execution Order

1. Backend model and migration.
2. Backend discovery service.
3. Backend CRUD and test endpoints.
4. Backend tests.
5. Frontend connection client.
6. Workbench state refactor.
7. Dynamic connections menu.
8. Connection Builder UI.
9. Frontend tests.
10. Full verification.

## Main Risks And Mitigations

Path safety risk: users must not be able to probe arbitrary server files. Mitigation: users never type paths; saves/tests only accept values from recursive discovery under `data/datasets/`.

Visual regression risk: the workbench currently has layout-sensitive visual coverage. Mitigation: keep the frame, tree column, and canvas panel geometry stable; add builder content inside the existing panel.

Duplicate label risk: duplicate labels would make the submenu ambiguous. Mitigation: enforce `(user_id, label)` uniqueness backend-side and validate in the UI.

Future dataset loading risk: later table and variable loading will depend on stable saved connection identity. Mitigation: keep connection IDs stable, update records in place, and make labels immutable.

SQLite lifecycle risk: users may assume `Drop` deletes the database file. Mitigation: label the action as metadata removal in the confirmation copy and never delete files from `data/datasets/`.
