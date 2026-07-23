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
  "schema_version": 2,
  "sources": [
    {
      "connection_id": "conn_1",
      "alias": "chinook",
      "metadata": {}
    }
  ],
  "fact_table": {
    "id": "fact_550e8400e29b41d4a716446655440000",
    "connection_id": "conn_1",
    "table": "InvoiceLine",
    "object_type": "table",
    "alias": "fact_invoice_line",
    "grain": "one row per invoiced track",
    "primary_key": ["InvoiceLineId"],
    "metadata": {}
  },
  "dimensions": [
    {
      "id": "dim_invoice",
      "connection_id": "conn_1",
      "table": "Invoice",
      "object_type": "table",
      "alias": "dim_invoice",
      "primary_key": ["InvoiceId"],
      "metadata": {}
    },
    {
      "id": "dim_customer",
      "connection_id": "conn_1",
      "table": "Customer",
      "object_type": "table",
      "alias": "dim_customer",
      "primary_key": ["CustomerId"],
      "metadata": {}
    }
  ],
  "relationships": [
    {
      "id": "rel_550e8400e29b41d4a716446655440001",
      "parent_table_id": "fact_550e8400e29b41d4a716446655440000",
      "child_table_id": "dim_invoice",
      "join_type": "left",
      "key_pairs": [
        {
          "parent_column": "InvoiceId",
          "child_column": "InvoiceId"
        }
      ],
      "metadata": {}
    },
    {
      "id": "rel_550e8400e29b41d4a716446655440002",
      "parent_table_id": "dim_invoice",
      "child_table_id": "dim_customer",
      "join_type": "left",
      "key_pairs": [
        {
          "parent_column": "CustomerId",
          "child_column": "CustomerId"
        }
      ],
      "metadata": {
        "origin": "foreign_key",
        "foreign_key": {
          "connection_id": "conn_1",
          "local_table": "Invoice",
          "referenced_table": "Customer",
          "column_pairs": [
            {
              "local_column": "CustomerId",
              "referenced_column": "CustomerId"
            }
          ]
        }
      }
    }
  ],
  "business_rules": [
    {
      "id": "rule_550e8400e29b41d4a716446655440003",
      "name": "customer_country",
      "expression": "coalesce(dim_customer.Country, 'Unknown')",
      "output_type": "text",
      "metadata": {}
    }
  ],
  "measures": [],
  "metadata": {}
}
```

Core keys are strict. Unknown core keys, unknown schema versions, and payloads mixing `dimension_id`/`fact_column`/`dimension_column` with version-2 endpoint fields are rejected. `metadata` objects are allowed for advisory UI state and ignored by backend validation and compilation.

`parent_table_id` is the configured table instance nearer the fact root; `child_table_id` is the instance farther from the root. These are model-topology terms, not source foreign-key terminology. Fact and dimension IDs identify alias instances and remain stable across source, object, alias, grain, or key edits.

### Rooted-Tree And Save Semantics

Testability requires exactly one configured fact root with no incoming edge, exactly one incoming edge per dimension, distinct configured endpoints, complete endpoint key pairs, unique relationship/table-instance IDs, one path from every dimension to the fact, no cycles, and no duplicate endpoint pairs. Nonblank fact and dimension aliases share one trimmed, case-insensitively unique namespace; source aliases and business-rule names retain their existing separate namespaces. Validation and compilation are independent of relationship array order. Diagnostics sort by section/path, code, table-instance ID, relationship ID, and key-pair index.

| Diagnostic class | Create/update | Test |
|---|---|---|
| Unsupported/mixed schema version, unknown core keys, cap violations, non-empty measures | Reject request | Error |
| Duplicate IDs or aliases within their required namespaces, unknown endpoints, incoming fact edge, self-link, cycle, duplicate incoming edge, duplicate endpoint pair | Reject request | Error |
| Missing/incomplete fact, missing source/object/key, unparented dimension, disconnected branch, unavailable schema column | Save as `draft` | Error before compilation |
| Inner join and compile-only limitations | Save | Warning |

Destructive edits must remove relationships touching removed table instances rather than submit dangling endpoint IDs.

### Persisted Legacy Read Boundary

Definitions read from storage without `schema_version` are version 1. Before strict validation, one backend storage-read boundary adds version 2; chooses the first dimension-ID-safe fact ID from `fact_root`, `fact_root_1`, `fact_root_2`, and so on; adds it to the fact; translates `dimension_id`, `fact_column`, and `dimension_column` to explicit child/parent endpoints and columns; and preserves all other definition content and saved diagnostics/history.

If a stored legacy definition has relationships but no fact, normalization inserts this saveable incomplete placeholder:

```json
{
  "id": "<selected-root-id>",
  "connection_id": "",
  "table": "",
  "object_type": "table",
  "alias": "",
  "grain": null,
  "primary_key": [],
  "metadata": { "legacy_placeholder": true }
}
```

Normalization is deterministic and idempotent. API reads return version 2, while stored JSON is rewritten only on the next successful save. Completing a placeholder retains its ID. Canonical normalized definitions drive dirty/status comparison, so saving a semantically unchanged legacy model does not stale diagnostics or alter status or test timestamps.

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
      "name": "Portfolio Model",
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
  "name": "Portfolio Model",
  "description": "Reusable portfolio model",
  "model": {
    "schema_version": 2,
    "sources": [],
    "fact_table": null,
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
  "name": "Portfolio Model",
  "description": "Reusable portfolio model",
  "model": {
    "schema_version": 2,
    "sources": [],
    "fact_table": null,
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

- `400`: invalid name, changed immutable fields, unsupported/mixed schema version, malformed topology, over-cap model, non-empty measures, or unsafe core keys.
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
- The returned `model` is always canonical version 2 after storage-read normalization.
- Reading a legacy record does not rewrite its stored JSON; the next successful save does.

## Update Data Model

`PUT /api/data-models/{model_id}`

Request:

```json
{
  "name": "Portfolio Model",
  "description": "Updated description",
  "model": {
    "schema_version": 2,
    "sources": [],
    "fact_table": null,
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
- A canonical normalization-only save preserves diagnostics, stale state, status, and all test timestamps.
- Repairable missing/connectivity/schema gaps are accepted as drafts; malformed identities and topology are rejected according to the shared severity table.

Errors:

- `400`: changed name, unsupported/mixed schema version, malformed topology, over-cap model, non-empty measures, or unsafe core keys.
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
    "schema_version": 2,
    "sources": [],
    "fact_table": null,
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
      "message": "This test validates compilation only. Multi-hop joins can introduce filtering, unmatched lookup values, fanout, or cardinality problems that this test does not measure.",
      "location": null,
      "stale": false
    }
  ]
}
```

Rules:

- Test is allowed for incomplete draft payloads.
- The request body must contain a strict version-2 definition; version 1, unknown versions, and mixed relationship fields return `400`.
- Unsaved tests do not persist diagnostics or timestamps.
- Deterministic validation errors are returned before dry-run execution.
- On deterministic validation success, runs zero-row compilation only.

## Test Saved Data Model

`POST /api/data-models/{model_id}/test`

Request body: none. A request containing a definition body is rejected with `400`.

Response `200`: same shape as unsaved test response, plus persisted saved model timestamp/status effects available on subsequent reads.

Rules:

- Tests current user's model only.
- Always tests the current canonical saved definition; dirty frontend drafts must use `POST /api/data-models/test`.
- Testing a dirty draft cannot update the status or timestamps of an older saved definition.
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
        },
        {
          "name": "customer_id",
          "declared_type": "TEXT",
          "nullable": false,
          "primary_key": false
        }
      ],
      "foreign_keys": [
        {
          "referenced_table": "customers",
          "column_pairs": [
            {
              "local_column": "customer_id",
              "referenced_column": "customer_id"
            }
          ]
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
      ],
      "foreign_keys": []
    }
  ]
}
```

Rules:

- Connection must exist and be owned by current user.
- SQLite system objects such as `sqlite_%` are excluded.
- Views are selectable and flagged as views.
- Table foreign keys are grouped by SQLite declaration ID and ordered by sequence so composite declarations remain one item.
- If SQLite omits referenced column names, inspection resolves them against the referenced table's ordered primary key only when the referenced object can be identified and local/referenced cardinality matches. Otherwise the declaration is omitted and remains manually configurable.
- Every returned foreign-key pair contains concrete non-null identifiers. Missing, unsafe, system, or unsupported referenced objects are omitted.
- Views return `foreign_keys: []` unless SQLite gains a separately supported declared relationship source.
- Response must not include sample rows, row counts, distinct counts, min/max values, profiling metrics, generated SQL, filesystem paths, or raw driver errors.

Frontend relationship suggestions are derived from this safe metadata and are not API resources or persisted model fields. Discovery follows same-connection local-to-referenced declarations outward from root-reachable instances. The frontend must review and revalidate individual or prerequisite-closed batch selections before atomically adding dimensions and explicit relationships; the backend continues to validate only the submitted model topology and never trusts provenance metadata.

Errors:

- `401`: unauthenticated.
- `404`: connection does not exist or is not owned by current user.
- `400`: connection is not a supported SQLite source for this release.
