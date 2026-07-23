# CreditModeler Data Models Builder Multi-Phase Plan

## Objective

Develop the `Data Models` option in `/creditmodeler-service` as a specialized workspace for designing analytical data models from saved SQL connections already configured in the application.

This feature lets internal users build, test, save, reopen, update, and drop consolidated star-schema data models that combine multiple SQLite sources through saved `Connections`. The first implementation is intentionally limited to multi-SQLite modeling and zero-row dry-run validation. It does not execute analytical workloads, profile data, compute measures, or materialize modeled datasets.

## Planning Context

The current `/creditmodeler-service` workbench already has these relevant foundations:

- `Connections` is implemented as an authenticated full-stack feature.
- Saved connections are persisted per user and rendered dynamically as child labels under `Connections`.
- Clicking a top-level workbench tree option can open a builder inside the existing canvas panel.
- Clicking a saved child label can reopen a persisted configuration for update or drop.
- The `Data Models` tree option currently contains static example labels: `Origination` and `Portfolio`.

This plan extends the same product pattern to `Data Models`. The static example children will be removed once dynamic saved data models are implemented.

The design decisions in this plan were locked through a grilling session. They should be treated as feature planning constraints unless explicitly superseded by a later specification.

Primary source-of-truth references:

- `docs/SPEC.md`
- `docs/PRD.md`
- `docs/METHODOLOGY.md`
- `specs/007-connections-builder/plan.md`
- `docs/nfr/CreditModeler Connections Builder Multi-Phase Plan.md`

## User Story

As an internal user, I want to configure, manage, and store analytical data models that integrate multiple SQL sources.

To do that, I click the `Data Models` option in `/creditmodeler-service` and access a visual, structured workspace that supports the definition of fact tables, dimension tables, business rules, joins, keys, and relationships required for downstream analytics.

When I finish configuring a data model, I can test the configured parameters before saving the data model. The test must run a zero-row dry-run SQL query across the selected SQLite sources to prove that joins, keys, and business rules compile.

After saving, the data model appears as a child label under the `Data Models` submenu. When I click a stored data model, I can update its configuration, save changes, test it again, or drop the data model. The data model name cannot be changed after creation.

## Locked Scope Decisions

- The first implementation supports multi-SQLite only.
- Data models use saved `Connections` only; users cannot model from unsaved database references.
- The fact table connection is always the main SQLite connection for dry-run execution.
- Additional SQLite files are attached read-only through SQLite `ATTACH DATABASE` with backend-generated aliases.
- The schema endpoint exposes tables, views, and columns only.
- The schema endpoint does not expose sample rows, row counts, profiling metrics, absolute paths, or generated SQL.
- SQLite system objects such as `sqlite_%` are rejected.
- Views are selectable and flagged as views.
- Data models use a strict star schema: exactly one fact table and dimensions that join directly to the fact table.
- Snowflake relationships are out of scope for this implementation.
- Dimensions can repeat by alias to support role-playing dimensions.
- A dimension alias can have one relationship to the fact table; composite join keys are allowed.
- Composite join key pairs compile with `AND`.
- Allowed join types are `left` and `inner`, with `left` as the default.
- Inner joins show a static warning because they can filter fact rows.
- Test validates compilation only and does not validate row retention, fanout, unmatched dimensions, or cardinality.
- Test returns warnings for static limitations and dynamic validation concerns such as suspicious join affinity mismatch.
- Business rules are row-level constrained SQL-like expressions.
- Business rules are parsed and validated with `sqlglot` using SQLite dialect support.
- Aggregate measures are designed as a future-compatible `measures: []` field, but non-empty measures are rejected in this implementation.
- Data model names are immutable after save.
- Source aliases, fact aliases, dimension aliases, and business rule names are editable.
- Alias edits cascade automatically through relationships and business rule expressions.
- Business rule expression rewrites use `sqlglot` parsing and rendering.
- Dimensions, relationships, and business rules have stable immutable frontend-generated IDs.
- The singleton fact table is addressed as `fact_table` and does not need a separate ID.
- Draft models can be saved with only a valid name.
- Incomplete saved models use a single `draft` status.
- Test remains clickable in the UI even for incomplete drafts; the UI shows obvious gaps and the backend returns authoritative structured errors.
- The `Data Models` tree shows all saved models the same way; status appears inside the builder.
- `GET /api/data-models` returns all saved models by default.
- `GET /api/data-models?status=...` supports a single current-status filter.
- Saved models always use the latest referenced Connection metadata.
- If a referenced Connection is deleted, the Data Model remains visible and repairable, but test/load reports missing-connection diagnostics.
- Replacing a missing Connection preserves table names, aliases, relationships, and business rules where possible, then revalidates.
- Invalid business rules are preserved and marked invalid, not automatically deleted.
- Warnings and errors from the latest test are persisted as structured diagnostics.
- Saved model edits make previous diagnostics stale.
- Saved config changes set current status to `stale`, unless the model is structurally incomplete, in which case the status is `draft`.

## User Experience

Clicking top-level `Data Models` opens a blank `Data Model Builder` inside the existing workbench canvas panel.

Saved data models appear as child labels under `Data Models`. Clicking a child label opens that saved model in the same builder.

New data model mode includes:

- `Data model name`, editable.
- `Description`, editable.
- Source connection selection from saved Connections.
- Fact table configuration.
- Dimension table configuration.
- Relationship configuration.
- Business rule configuration.
- Star-schema preview.
- Diagnostics panel.
- `Test`.
- `Save Data Model`.

Existing data model mode includes:

- `Data model name`, read-only.
- Editable description and configuration sections.
- Latest test status and diagnostics.
- `Test`.
- `Save Data Model`.
- `Drop`, with confirmation.

The builder must display clear feedback for loading, validation, test success, test failure, save success, save failure, drop success, drop failure, missing connections, stale diagnostics, and draft completeness gaps.

The tree must auto-expand `Data Models` when saved data models exist, matching the existing `Connections` behavior.

## Status Model

Current statuses:

- `draft`: saved but structurally incomplete.
- `untested`: structurally complete enough to test, but no successful or failed test has been run for the current saved config.
- `tested`: latest saved config passed zero-row dry-run compilation.
- `failed`: latest saved config was tested and failed.
- `stale`: saved config or referenced Connection metadata changed after the latest test.

Rules:

- Static warnings do not block test success.
- Successful saved tests update `last_tested_at` and `last_test_succeeded_at`.
- Failed saved tests update `last_tested_at` and `last_test_failed_at`.
- Failed saved tests preserve the previous successful test timestamp.
- Structured warnings and errors are stored from the latest test.
- After model edits, stored diagnostics remain visible but are marked stale.
- If the model becomes structurally incomplete after edit/save, status becomes `draft`.
- If the model remains structurally complete after edit/save, status becomes `stale`.
- If a referenced Connection is updated or deleted, the model status is derived as stale or invalid until retested or repaired.

## Persisted Data Model Data

Persisted entity: `AnalyticalDataModel`.

Fields:

- `id`
- `user_id`
- `name`
- `normalized_name`
- `description`
- `model_json`
- `test_status`
- `last_tested_at`
- `last_test_succeeded_at`
- `last_test_failed_at`
- `last_test_errors_json`
- `last_test_warnings_json`
- `diagnostics_stale`
- `created_at`
- `updated_at`

Rules:

- `(user_id, normalized_name)` is unique.
- `name` is trimmed and immutable after creation.
- `normalized_name` is used for case-insensitive uniqueness.
- `description` can be updated.
- `model_json` stores the star-schema configuration and UI-only metadata.
- Core model sections use strict schemas.
- Explicit `metadata` objects can store UI-only state and are ignored by the compiler.
- Unknown core keys are rejected.

## Model JSON Shape

Representative shape:

```json
{
  "sources": [
    {
      "connection_id": "conn_1",
      "alias": "portfolio",
      "metadata": {}
    }
  ],
  "fact_table": {
    "connection_id": "conn_1",
    "table": "loan_observations",
    "object_type": "table",
    "alias": "fact_loans",
    "grain": "one row per account observation",
    "primary_key": ["account_id", "observation_date"],
    "metadata": {}
  },
  "dimensions": [
    {
      "id": "dim_550e8400e29b41d4a716446655440000",
      "connection_id": "conn_2",
      "table": "customers",
      "object_type": "table",
      "alias": "dim_customer",
      "primary_key": ["customer_id"],
      "metadata": {}
    }
  ],
  "relationships": [
    {
      "id": "rel_550e8400e29b41d4a716446655440001",
      "dimension_id": "dim_550e8400e29b41d4a716446655440000",
      "join_type": "left",
      "key_pairs": [
        {
          "fact_column": "customer_id",
          "dimension_column": "customer_id"
        }
      ],
      "metadata": {}
    }
  ],
  "business_rules": [
    {
      "id": "rule_550e8400e29b41d4a716446655440002",
      "name": "delinquency_flag",
      "expression": "case when fact_loans.days_past_due >= 30 then 1 else 0 end",
      "output_type": "integer",
      "metadata": {}
    }
  ],
  "measures": [],
  "metadata": {}
}
```

## Backend Endpoints

All endpoints require an authenticated user.

- `GET /api/data-models`
- `GET /api/data-models?status=draft`
- `POST /api/data-models`
- `GET /api/data-models/{model_id}`
- `PUT /api/data-models/{model_id}`
- `DELETE /api/data-models/{model_id}`
- `POST /api/data-models/test`
- `POST /api/data-models/{model_id}/test`
- `GET /api/data-models/connections/{connection_id}/schema`

Endpoint behavior:

- `GET /api/data-models` returns all current-user models by default.
- The optional `status` query parameter filters by current status only.
- `POST /api/data-models` creates a new model or draft.
- `PUT /api/data-models/{model_id}` updates configuration but rejects changed names with `400`.
- `DELETE /api/data-models/{model_id}` deletes saved metadata immediately.
- `POST /api/data-models/test` tests an unsaved payload without persistence.
- `POST /api/data-models/{model_id}/test` tests a saved model and persists timestamps, status, warnings, and errors.
- `GET /api/data-models/connections/{connection_id}/schema` exposes schema metadata only for saved Connections owned by the current user.

## Schema Metadata Rules

The schema endpoint opens the saved SQLite Connection in read-only mode and returns tables/views and columns.

Response content:

- connection ID
- connection label
- object name
- object type: `table` or `view`
- columns
- declared SQLite type
- nullable flag when available
- primary-key flag

Excluded content:

- sample rows
- row counts
- distinct counts
- min/max values
- profiling metrics
- generated SQL
- filesystem paths
- SQLite system objects

## Business Rule Validation

Business rules are constrained SQL-like row-level expressions.

Allowed expression features:

- Column references from the fact alias and joined dimension aliases.
- Literals.
- Arithmetic: `+`, `-`, `*`, `/`.
- Comparisons: `=`, `!=`, `<>`, `<`, `<=`, `>`, `>=`.
- Boolean logic: `and`, `or`, `not`.
- `case when ... then ... else ... end`.
- Allowlisted scalar functions: `coalesce`, `nullif`, `abs`, `round`, `lower`, `upper`, `trim`, `date`, `strftime`.

Rejected expression features:

- Semicolons.
- Comments.
- Subqueries.
- Full `SELECT` statements.
- DDL and DML statements.
- CTEs.
- Window functions.
- Unknown functions.
- Unknown aliases or columns.
- Unsupported AST nodes.

The backend must use `sqlglot` to parse expressions, inspect the AST, validate references and functions, rewrite aliases during cascade operations, and render SQLite-compatible expressions for dry-run compilation.

## Dry-Run Query Test

The `Test` action must prove that the configured model compiles across selected SQLite sources.

Execution sequence:

1. Validate model JSON shape.
2. Validate owned saved Connections.
3. Load schema metadata for referenced Connections.
4. Validate fact table, dimensions, relationships, keys, aliases, and business rules.
5. Collect deterministic validation errors before SQL execution.
6. If deterministic validation passes, open the fact Connection as the main read-only SQLite connection.
7. Attach additional referenced SQLite files read-only using backend-generated aliases.
8. Compile the star-schema query.
9. Project row-level business rules as derived columns.
10. Execute a zero-row dry-run query with `WHERE 1 = 0` or `LIMIT 0`.
11. Return safe structured success, errors, and warnings only.

The API must never return generated SQL, absolute paths, stack traces, or raw database driver errors.

## Phase 0: Specification And Scope Lock

Turn this plan into executable Spec Kit documentation.

Tasks:

- Create a feature folder such as `specs/008-data-models-builder/`.
- Write `spec.md` with user stories, acceptance criteria, and exclusions.
- Write `plan.md` with the implementation strategy.
- Write `data-model.md` with persisted entities and `model_json` shape.
- Write `contracts/data-models-api.md` with request and response contracts.
- Write `quickstart.md` with manual validation steps.
- Write `tasks.md` with implementation tasks.

## Phase 1: Backend Persistence Foundation

Add data model storage.

Tasks:

- Add `sqlglot` to `apps/api/pyproject.toml`.
- Add `apps/api/app/modules/data_models/`.
- Add the SQLAlchemy `AnalyticalDataModel` model.
- Add Alembic migration `003_data_models.py`.
- Register data model models in `app/db/base.py`.
- Add a relationship from `InternalUser` to saved data models.
- Enforce per-user normalized name uniqueness.
- Add timestamp and diagnostics fields.

Likely files:

- `apps/api/pyproject.toml`
- `apps/api/app/modules/data_models/models.py`
- `apps/api/alembic/versions/003_data_models.py`
- `apps/api/app/modules/auth/models.py`
- `apps/api/app/db/base.py`

## Phase 2: Backend CRUD API

Expose authenticated create, list, read, update, and delete operations.

Tasks:

- Add Pydantic schemas for data model create, update, response, list, diagnostics, and status.
- Add repository functions for user-owned records.
- Add service logic for save-time status calculation.
- Add the API router and register it under `/api`.
- Reject changed names on update.
- Support a single `status` filter on list.
- Enforce ownership for read, update, delete, and test operations.

Likely files:

- `apps/api/app/modules/data_models/api.py`
- `apps/api/app/modules/data_models/schemas.py`
- `apps/api/app/modules/data_models/repository.py`
- `apps/api/app/modules/data_models/service.py`
- `apps/api/app/api/router.py`

## Phase 3: Schema Metadata Endpoint

Expose table/view/column metadata for saved Connections.

Tasks:

- Add schema inspection service functions.
- Reuse existing Connection ownership and database-reference validation.
- Open SQLite files in read-only mode.
- Return user tables and views only.
- Exclude SQLite system objects.
- Return declared column type, nullable flag when available, and primary-key flag.
- Ensure no sample data, counts, paths, or generated SQL are exposed.

Likely files:

- `apps/api/app/modules/data_models/api.py`
- `apps/api/app/modules/data_models/schema_inspection.py`
- `apps/api/app/modules/connections/repository.py`
- `apps/api/app/modules/connections/service.py`

## Phase 4: Model Validation Service

Validate the data model definition independently of SQL compilation.

Tasks:

- Validate strict model schemas.
- Validate stable frontend-generated IDs for dimensions, relationships, and business rules.
- Validate duplicate IDs and aliases.
- Validate one fact table when testing.
- Validate role-playing dimensions by alias.
- Validate strict star-schema relationships.
- Validate one relationship per dimension alias.
- Validate composite join keys.
- Validate allowed join types.
- Reject non-empty `measures`.
- Return structured deterministic errors.
- Return static and dynamic warnings.

Likely files:

- `apps/api/app/modules/data_models/validation.py`
- `apps/api/app/modules/data_models/schemas.py`
- `apps/api/tests/contract/test_data_models_api.py`
- `apps/api/tests/integration/test_data_models_flow.py`

## Phase 5: Business Rule Parser And Alias Cascade

Add `sqlglot`-based rule validation and expression rewriting.

Tasks:

- Parse business rule expressions using SQLite dialect.
- Reject unsafe raw input before parsing.
- Reject unsupported AST nodes after parsing.
- Validate column references against fact and joined dimension aliases.
- Validate function calls against the allowlist.
- Render validated expressions back to SQLite-compatible SQL.
- Rewrite table alias qualifiers when aliases are edited.
- Preserve invalid rules and report structured diagnostics instead of deleting them.

Likely files:

- `apps/api/app/modules/data_models/rule_parser.py`
- `apps/api/app/modules/data_models/validation.py`
- `apps/api/tests/integration/test_data_model_business_rules.py`

## Phase 6: Query Compiler And Dry-Run Test

Compile the star schema and run zero-row SQLite dry-run tests.

Tasks:

- Build a compiler that quotes identifiers and isolates generated SQL from API responses.
- Use the fact Connection as the main read-only SQLite connection.
- Attach additional SQLite files read-only using backend-generated aliases.
- Compile fact table, dimensions, relationships, join keys, and row-level business rules.
- Execute a zero-row query.
- Return all deterministic validation errors before dry-run.
- Return the first SQLite compile failure as a structured safe error.
- Persist success/failure timestamps and diagnostics for saved tests.

Likely files:

- `apps/api/app/modules/data_models/query_compiler.py`
- `apps/api/app/modules/data_models/service.py`
- `apps/api/app/modules/data_models/api.py`
- `apps/api/tests/integration/test_data_model_dry_run.py`

## Phase 7: Frontend API Client And Types

Add typed frontend helpers.

Tasks:

- Add TypeScript types for saved data models, model definitions, schema metadata, diagnostics, and test responses.
- Add client helpers for list, create, read, update, delete, test, and schema inspection.
- Reuse the existing API base URL and credential pattern.
- Normalize API errors into user-facing messages.

Likely files:

- `apps/web/features/creditmodeler/data-model-types.ts`
- `apps/web/features/creditmodeler/data-models-client.ts`
- `apps/web/tests/unit/data-models-client.test.ts`

## Phase 8: Workbench Integration And Dynamic Data Models Menu

Make `Data Models` dynamic like `Connections`.

Tasks:

- Remove static `Origination` and `Portfolio` children from the default tree config.
- Load saved data models on workbench mount.
- Render saved models as children under `Data Models`.
- Auto-expand `Data Models` when saved models exist.
- Map top-level `Data Models` selection to a blank builder.
- Map saved child selections to populated builders.
- Upsert saved models into the submenu after create/update.
- Remove dropped models from the submenu and clear selection.

Likely files:

- `apps/web/config/tree-menu.ts`
- `apps/web/features/creditmodeler/CreditModelerWorkbench.tsx`
- `apps/web/tests/unit/data-model-builder.test.tsx`

## Phase 9: Data Model Builder UI

Implement the structured star-schema workspace inside the existing canvas frame.

Tasks:

- Add `DataModelBuilder`.
- Render new and existing modes.
- Make saved model names read-only.
- Allow saving drafts with only a valid name.
- Load saved Connections for source selection.
- Load schema metadata by saved Connection ID.
- Configure fact table, dimensions, relationships, and business rules.
- Support role-playing dimensions through aliases.
- Support composite relationship key pairs.
- Show static warnings for inner joins and zero-row limitation.
- Show structured diagnostics and stale diagnostics notice.
- Allow replacement of missing Connections while preserving configuration.
- Preserve invalid business rules and show validation diagnostics.
- Render a simple star-schema preview.
- Implement Test, Save, and Drop actions.

Likely files:

- `apps/web/features/creditmodeler/DataModelBuilder.tsx`
- `apps/web/features/creditmodeler/data-model-types.ts`
- `apps/web/app/globals.css`
- `apps/web/tests/unit/data-model-builder.test.tsx`

## Phase 10: Styling And Responsive Layout

Fit the builder into the approved workbench geometry.

Tasks:

- Add `rv-data-model-builder` styles.
- Reuse the existing builder visual language where practical.
- Keep scrolling inside the canvas panel.
- Preserve shell, tree column, and canvas geometry.
- Support stacked sections on narrow viewports.
- Avoid route-level layout changes.

Likely files:

- `apps/web/app/globals.css`
- `apps/web/tests/visual/layout-geometry.spec.ts`
- `apps/web/tests/e2e/responsive-layout.spec.ts`
- `apps/web/tests/e2e/responsive-usability.spec.ts`

## Phase 11: Backend Tests

Add focused backend coverage.

Required coverage:

- Data model endpoints require authentication.
- Create supports draft save with only a valid name.
- Per-user name uniqueness is enforced.
- Different users can use the same model name.
- Update rejects changed names.
- Read, update, delete, and saved test enforce ownership.
- List supports default-all and single-status filter.
- Delete removes metadata immediately.
- Schema endpoint returns tables/views/columns only.
- Schema endpoint excludes SQLite system objects.
- Schema endpoint rejects non-owned or missing Connections.
- Validation allows role-playing dimensions.
- Validation rejects snowflake relationships.
- Validation rejects non-empty measures.
- Business rule parser accepts allowed expressions.
- Business rule parser rejects unsafe expressions.
- Alias cascade rewrites business rule qualifiers.
- Dry-run compiles across multiple attached SQLite files.
- Successful saved test updates success timestamps and warnings.
- Failed saved test stores structured errors and preserves prior success timestamp.
- Generated SQL and absolute paths are never returned.

Likely files:

- `apps/api/tests/contract/test_data_models_api.py`
- `apps/api/tests/integration/test_data_models_flow.py`
- `apps/api/tests/integration/test_data_model_business_rules.py`
- `apps/api/tests/integration/test_data_model_dry_run.py`

## Phase 12: Frontend Tests

Add frontend unit and interaction coverage.

Required coverage:

- Clicking `Data Models` opens a blank builder.
- Static `Origination` and `Portfolio` labels are removed.
- Saved model labels appear under `Data Models`.
- Saved data models auto-expand the submenu.
- Saving a draft creates a submenu child.
- Clicking a saved child opens a populated builder.
- Existing model name is read-only.
- Test returns and renders structured validation errors.
- Test success renders tested status and warnings.
- Save after edit renders stale status.
- Drop requires confirmation and removes the submenu child.
- Missing Connection diagnostics are visible.
- Missing Connection replacement preserves configuration.
- Inner join warning is visible.
- Existing `Connections` behavior remains intact.

Likely files:

- `apps/web/tests/unit/data-model-builder.test.tsx`
- `apps/web/tests/unit/connection-builder.test.tsx`
- `apps/web/tests/e2e/local-interactions.spec.ts`

## Phase 13: Verification

Run focused backend verification from `apps/api`:

```powershell
pytest
```

Run focused frontend verification from `apps/web`:

```powershell
npm run test
npm run lint
```

If workbench layout or CSS changes affect geometry, also run from `apps/web`:

```powershell
npm run test:visual:desktop
```

## Manual Acceptance Flow

1. Log in as an internal user.
2. Create at least two saved SQLite Connections.
3. Open `/creditmodeler-service`.
4. Click `Data Models`.
5. Save a draft data model with only a valid name.
6. Confirm the saved draft appears under `Data Models`.
7. Open the saved draft and confirm the model name is read-only.
8. Add source Connections, a fact table, a dimension table, a relationship, and a business rule.
9. Run `Test` and confirm zero-row dry-run success.
10. Confirm status becomes `tested` and warnings are visible.
11. Edit the configuration and save.
12. Confirm status becomes `stale` or `draft` depending on completeness.
13. Delete a referenced Connection.
14. Reopen the Data Model and confirm missing-connection diagnostics.
15. Replace the missing Connection and confirm configuration is preserved where possible.
16. Retest successfully.
17. Drop the data model and confirm it disappears from the submenu.

## Execution Order

1. Specification and scope lock.
2. Backend persistence foundation.
3. Backend CRUD API.
4. Schema metadata endpoint.
5. Model validation service.
6. Business rule parser and alias cascade.
7. Query compiler and dry-run test.
8. Backend tests.
9. Frontend API client and types.
10. Workbench dynamic Data Models menu.
11. Data Model Builder UI.
12. Styling and responsive layout.
13. Frontend tests.
14. Full verification.

## Main Risks And Mitigations

SQL safety risk: business rules are SQL-like expressions and could become an injection vector. Mitigation: parse with `sqlglot`, reject unsupported AST nodes, allowlist functions, quote identifiers, use saved Connections only, and never expose generated SQL.

Cross-database execution risk: SQLite `ATTACH DATABASE` can be misused if aliases or paths are user-controlled. Mitigation: use backend-generated database aliases, validated saved Connection IDs, read-only SQLite URI modes, and internal path resolution.

False confidence risk: zero-row dry-run validates compilation but not row counts, cardinality, fanout, or unmatched dimensions. Mitigation: show and persist warnings that explain the limitation.

Stale status risk: referenced Connections can change or be deleted after a Data Model is tested. Mitigation: compute and return `test_status`, preserve diagnostics as stale after edits, and let users repair missing Connections.

Visual regression risk: the workbench geometry is layout-sensitive. Mitigation: render the builder inside the existing canvas frame and avoid route or shell layout changes.

Scope creep risk: measures, profiling, graph editing, snowflake schemas, and non-SQLite engines are natural follow-ups. Mitigation: keep this implementation limited to strict star-schema multi-SQLite compilation and represent future measures only as rejected non-empty `measures` payloads.
