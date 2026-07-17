# Research: CreditModeler Connections Builder

## Decision: Use the existing `apps/api` and `apps/web` applications

**Rationale**: The active repository contains a FastAPI backend under `apps/api` and a Next.js frontend under `apps/web`, including existing auth/session code, protected CreditModeler route, workbench components, and test infrastructure. Implementing the feature there avoids creating a parallel prototype path.

**Alternatives considered**: The legacy `frontend/` shell was considered, but the active feature specification and current codebase references target the Next.js app and authenticated backend.

## Decision: Persist saved connections in backend metadata storage

**Rationale**: Connections are user-owned and must be hidden from other users, reopened across sessions, updated in place, and dropped without deleting source files. Existing SQLAlchemy/Alembic infrastructure supports durable metadata and ownership constraints.

**Alternatives considered**: Browser-only storage was rejected because it would not support authenticated cross-device persistence or backend ownership checks. File-based JSON metadata was rejected because the existing backend already has a relational persistence foundation.

## Decision: Restrict selectable datasets to recursive discovery under `data/datasets/`

**Rationale**: The feature must prevent users from typing arbitrary paths or probing server files. Recursive discovery under a known datasets root lets the UI present safe choices while preserving nested folder context.

**Alternatives considered**: Manual path entry was rejected for security and usability. Non-recursive discovery was rejected because the source plan explicitly requires recursive discovery and nested labels.

## Decision: Support only `.db`, `.sqlite`, and `.sqlite3` files in this stage

**Rationale**: The product stage is explicitly SQLite-only and focused on connection metadata. Limiting extensions gives clear validation and keeps later database-type support out of scope.

**Alternatives considered**: Allowing all files was rejected because invalid files would create confusing test failures. Supporting additional database engines was rejected as later work.

## Decision: Store relative dataset references, never absolute paths

**Rationale**: Relative references avoid leaking server filesystem layout and allow the backend to resolve paths safely against the configured datasets root.

**Alternatives considered**: Storing absolute paths was rejected because it exposes internal server layout and complicates environment portability.

## Decision: Treat saved connection labels as immutable and per-user unique after trimming and case folding

**Rationale**: Immutable labels keep tree entries and future downstream references stable. Case-insensitive, trimmed uniqueness prevents ambiguous duplicates such as `RiskDB`, `riskdb`, and ` RiskDB ` for the same user.

**Alternatives considered**: Case-sensitive uniqueness was rejected because it would allow visually confusing tree items. Exact-text uniqueness was rejected because surrounding spaces are accidental user input.

## Decision: Test connections with the minimal SQLite catalog query only

**Rationale**: The feature confirms that a selected file can be opened and queried without entering later dataset/schema discovery scope. The test must not return table names, columns, schema details, rows, datasets, or variables.

**Alternatives considered**: Inspecting tables or columns was rejected because the specification explicitly defers dataset/table/variable loading.

## Decision: Update `last_tested_at` only for successful tests of saved connections

**Rationale**: The timestamp should represent the last known successful validation of a persisted connection. Unsaved tests and failed saved tests should not create misleading recency signals.

**Alternatives considered**: Updating the timestamp for every test was rejected because failed tests would appear as successful validation events.

## Decision: Refactor workbench selection state so the canvas can react to tree selection

**Rationale**: The current workbench needs the tree selection to control whether the canvas shows the blank builder, populated builder, or existing default hint. Lifting or reporting selection state is the smallest UI architecture change to support this feature.

**Alternatives considered**: Keeping selection local to the tree was rejected because the canvas would not know which connection view to render.

## Decision: Preserve workbench geometry and verify visually when layout/CSS changes are made

**Rationale**: The workbench has layout-sensitive visual coverage. The builder should be inserted inside the existing canvas panel without changing the frame, tree column, or general panel geometry.

**Alternatives considered**: Rebuilding the workbench layout was rejected as unnecessary scope expansion.
