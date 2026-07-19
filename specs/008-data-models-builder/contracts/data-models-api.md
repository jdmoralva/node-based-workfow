# Contract: Data Models API

All data model operations require an authenticated internal user. All persisted records and source references are scoped to the current user.

## Shared Types

### DataModelStatus

Allowed values: `draft`, `untested`, `tested`, `failed`, `stale`.

### Diagnostic

```json
{
  "severity": "error",
  "code": "missing_fact_table",
  "message": "Select one fact table before testing this model.",
  "location": {
    "section": "fact_table"
  },
  "stale": false
}
```

Diagnostics must be safe for display. They must not include generated SQL, filesystem paths, stack traces, raw database driver errors, sample rows, row counts, profiling metrics, or source contents.

### ModelDefinition

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

Core keys are strict. Unknown core keys are rejected. `metadata` objects are allowed for UI-only state and ignored by validation/compilation.

## List Data Models

`GET /api/data-models`

Optional query parameters:

- `status`: one current status value.

Response `200`:

```json
{
  "items": [
    {
      "id": "model_1",
      "name": "Portfolio Star",
      "description": "Reusable portfolio model",
      "test_status": "tested",
      "diagnostics_stale": false,
      "last_tested_at": "2026-07-18T14:30:00Z",
      "last_test_succeeded_at": "2026-07-18T14:30:00Z",
      "last_test_failed_at": null,
      "created_at": "2026-07-18T14:00:00Z",
      "updated_at": "2026-07-18T14:30:00Z"
    }
  ]
}
```

Rules:

- Returns current user's models only.
- Without `status`, returns all current-user models.
- Supports one status filter at a time.

## Create Data Model

`POST /api/data-models`

Request:

```json
{
  "name": "Portfolio Star",
  "description": "Reusable portfolio model",
  "model": {
    "sources": [],
    "dimensions": [],
    "relationships": [],
    "business_rules": [],
    "measures": [],
    "metadata": {}
  }
}
```

Response `201`:

```json
{
  "id": "model_1",
  "name": "Portfolio Star",
  "description": "Reusable portfolio model",
  "model": {
    "sources": [],
    "dimensions": [],
    "relationships": [],
    "business_rules": [],
    "measures": [],
    "metadata": {}
  },
  "test_status": "draft",
  "diagnostics_stale": false,
  "last_tested_at": null,
  "last_test_succeeded_at": null,
  "last_test_failed_at": null,
  "last_test_errors": [],
  "last_test_warnings": [],
  "created_at": "2026-07-18T14:00:00Z",
  "updated_at": "2026-07-18T14:00:00Z"
}
```

Errors:

- `400`: invalid name, changed immutable fields, invalid model shape, over-cap model, non-empty measures, or unsafe core keys.
- `401`: unauthenticated.
- `409`: duplicate normalized name for current user.

## Get Data Model

`GET /api/data-models/{model_id}`

Response `200`: full saved data model response, including `model`, latest diagnostics, status, and timestamps.

Errors:

- `401`: unauthenticated.
- `404`: model does not exist or is not owned by current user.

Rules:

- A model remains retrievable even when referenced Connections are missing.
- Missing referenced Connections are surfaced as diagnostics when loading or testing.

## Update Data Model

`PUT /api/data-models/{model_id}`

Request:

```json
{
  "name": "Portfolio Star",
  "description": "Updated description",
  "model": {
    "sources": [],
    "dimensions": [],
    "relationships": [],
    "business_rules": [],
    "measures": [],
    "metadata": {}
  }
}
```

Response `200`: full saved data model response.

Rules:

- `name` is immutable; sending a different name returns `400`.
- Last successful save wins if two sessions save the same model.
- After edits, previous diagnostics remain visible but are marked stale.
- Save status becomes `draft` if structurally incomplete; otherwise `stale` when the model needs retesting.

Errors:

- `400`: changed name, invalid model shape, over-cap model, non-empty measures, or unsafe core keys.
- `401`: unauthenticated.
- `404`: model does not exist or is not owned by current user.

## Delete Data Model

`DELETE /api/data-models/{model_id}`

Response `204`: no body.

Rules:

- Deletes saved metadata immediately.
- Does not delete source Connections or SQLite files.

Errors:

- `401`: unauthenticated.
- `404`: model does not exist or is not owned by current user.

## Test Unsaved Data Model

`POST /api/data-models/test`

Request:

```json
{
  "model": {
    "sources": [],
    "dimensions": [],
    "relationships": [],
    "business_rules": [],
    "measures": [],
    "metadata": {}
  }
}
```

Response `200`:

```json
{
  "succeeded": false,
  "status": "draft",
  "errors": [
    {
      "severity": "error",
      "code": "missing_fact_table",
      "message": "Select one fact table before testing this model.",
      "location": { "section": "fact_table" },
      "stale": false
    }
  ],
  "warnings": [
    {
      "severity": "warning",
      "code": "compile_only",
      "message": "This test validates compilation only and does not validate row retention, fanout, unmatched dimensions, or cardinality.",
      "location": null,
      "stale": false
    }
  ]
}
```

Rules:

- Test is allowed for incomplete draft payloads.
- Unsaved tests do not persist diagnostics or timestamps.
- Deterministic validation errors are returned before dry-run execution.
- On deterministic validation success, runs zero-row compilation only.

## Test Saved Data Model

`POST /api/data-models/{model_id}/test`

Request body: optional; if omitted, tests the current saved model.

Response `200`: same shape as unsaved test response, plus persisted saved model timestamp/status effects available on subsequent reads.

Rules:

- Tests current user's model only.
- Persists `last_tested_at` for successful and failed saved tests.
- Successful saved test updates `last_test_succeeded_at` and status `tested`.
- Failed saved test updates `last_test_failed_at` and status `failed` while preserving prior `last_test_succeeded_at`.
- Persists latest safe structured warnings and errors.
- Static warnings do not block success.

## Inspect Connection Schema

`GET /api/data-models/connections/{connection_id}/schema`

Response `200`:

```json
{
  "connection_id": "conn_1",
  "connection_label": "Portfolio DB",
  "objects": [
    {
      "name": "loan_observations",
      "object_type": "table",
      "columns": [
        {
          "name": "account_id",
          "declared_type": "TEXT",
          "nullable": false,
          "primary_key": true
        }
      ]
    },
    {
      "name": "active_loans_view",
      "object_type": "view",
      "columns": [
        {
          "name": "account_id",
          "declared_type": "TEXT",
          "nullable": null,
          "primary_key": false
        }
      ]
    }
  ]
}
```

Rules:

- Connection must exist and be owned by current user.
- SQLite system objects such as `sqlite_%` are excluded.
- Views are selectable and flagged as views.
- Response must not include sample rows, row counts, distinct counts, min/max values, profiling metrics, generated SQL, filesystem paths, or raw driver errors.

Errors:

- `401`: unauthenticated.
- `404`: connection does not exist or is not owned by current user.
- `400`: connection is not a supported SQLite source for this release.
