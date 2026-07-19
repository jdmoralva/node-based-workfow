# Data Model: CreditModeler Data Models Builder

## AnalyticalDataModel

User-owned persisted metadata for one saved data model.

### Fields

- `id`: Stable internal identifier.
- `user_id`: Owner identifier; all operations are scoped to the authenticated owner.
- `name`: Trimmed user-facing name; immutable after creation.
- `normalized_name`: Case-insensitive normalized name for per-user uniqueness.
- `description`: Optional editable description.
- `model_json`: Strict star-schema definition plus explicit UI metadata objects.
- `test_status`: Current status: `draft`, `untested`, `tested`, `failed`, or `stale`.
- `last_tested_at`: Timestamp of the latest saved-model test attempt.
- `last_test_succeeded_at`: Timestamp of the latest successful saved-model test.
- `last_test_failed_at`: Timestamp of the latest failed saved-model test.
- `last_test_errors_json`: Latest structured safe test errors.
- `last_test_warnings_json`: Latest structured safe test warnings.
- `diagnostics_stale`: Whether persisted diagnostics are stale relative to the current saved model definition.
- `created_at`: Creation timestamp.
- `updated_at`: Last update timestamp.

### Validation Rules

- `(user_id, normalized_name)` is unique.
- `name` is trimmed and required on create.
- `name` cannot change after create.
- Different users may use the same `name`.
- Unknown core keys inside `model_json` are rejected.
- Explicit `metadata` objects are allowed for UI-only state and ignored by validation/compilation.
- Latest successful save wins if two sessions save the same data model.

## ModelDefinition (`model_json`)

The persisted star-schema configuration.

### Fields

- `sources`: Array of SourceConnectionReference, maximum 5.
- `fact_table`: Singleton FactTableDefinition when structurally configured.
- `dimensions`: Array of DimensionDefinition, maximum 25.
- `relationships`: Array of RelationshipDefinition.
- `business_rules`: Array of BusinessRuleDefinition, maximum 50.
- `measures`: Must be an empty array for this release.
- `metadata`: Optional UI-only object.

### Validation Rules

- Model definitions may be saved as drafts with only a valid model name.
- Testing incomplete drafts is allowed and returns structured completeness diagnostics.
- Testable models require one fact table and valid referenced saved Connections.
- Non-empty `measures` are rejected.
- Generated SQL, absolute paths, raw driver errors, stack traces, row data, and profiling details are never stored for display or returned to clients.

## SourceConnectionReference

Reference to a saved SQLite Connection owned by the current user.

### Fields

- `connection_id`: Saved Connection identifier.
- `alias`: Editable modeling alias.
- `metadata`: Optional UI-only object.

### Validation Rules

- Connection must exist and belong to the current user when tested or inspected.
- Connection must be SQLite for this release.
- Source aliases must be unique within the model.
- Source aliases are editable.
- Missing referenced Connections do not hide or delete the Data Model; they produce repairable diagnostics.

## FactTableDefinition

The single central table or view used as model grain and main source for dry-run execution.

### Fields

- `connection_id`: Saved Connection identifier.
- `table`: Selected table or view name.
- `object_type`: `table` or `view`.
- `alias`: Editable fact alias.
- `grain`: Optional user-entered description of fact grain.
- `primary_key`: Array of one or more selected columns when configured.
- `metadata`: Optional UI-only object.

### Validation Rules

- Exactly one fact table is allowed in a testable model.
- The fact table's Connection is the main SQLite source for dry-run execution.
- Selected object must exist in safe schema metadata and must not be a SQLite system object.
- Fact alias changes cascade to relationships and business rule references where safely rewritable.

## DimensionDefinition

Direct enrichment object joined to the fact table.

### Fields

- `id`: Stable generated ID, immutable after creation.
- `connection_id`: Saved Connection identifier.
- `table`: Selected table or view name.
- `object_type`: `table` or `view`.
- `alias`: Editable dimension alias.
- `primary_key`: Array of one or more selected columns when configured.
- `metadata`: Optional UI-only object.

### Validation Rules

- Dimension IDs are unique and stable.
- Dimension aliases are unique within the model.
- The same source table may be reused through different aliases for role-playing dimensions.
- Selected object must exist in safe schema metadata and must not be a SQLite system object.
- Dimension alias changes cascade to relationships and business rule references where safely rewritable.

## RelationshipDefinition

Direct join from the fact table to one dimension alias.

### Fields

- `id`: Stable generated ID, immutable after creation.
- `dimension_id`: Referenced DimensionDefinition ID.
- `join_type`: `left` or `inner`; defaults to `left`.
- `key_pairs`: Array of KeyPairDefinition.
- `metadata`: Optional UI-only object.

### Validation Rules

- Relationship IDs are unique and stable.
- Each dimension alias may have at most one relationship to the fact table.
- Relationships must join fact table directly to dimension; dimension-to-dimension relationships are rejected.
- `left` and `inner` are the only allowed join types.
- Inner joins produce a static warning because they can filter fact rows.
- Composite key pairs are allowed and compile as conjunctive key matches.

## KeyPairDefinition

One fact-column to dimension-column relationship key.

### Fields

- `fact_column`: Column selected from the fact table metadata.
- `dimension_column`: Column selected from the dimension metadata.

### Validation Rules

- Columns must exist in safe schema metadata.
- Composite pairs must contain at least one valid pair.
- Suspicious join affinity mismatches produce warnings rather than automatically blocking compilation unless the underlying column reference is invalid.

## BusinessRuleDefinition

Named row-level derived expression evaluated during compilation testing.

### Fields

- `id`: Stable generated ID, immutable after creation.
- `name`: Editable rule name.
- `expression`: Constrained SQL-like row-level expression.
- `output_type`: Declared output type such as text, integer, real, numeric, boolean, date, datetime, or unknown.
- `metadata`: Optional UI-only object.

### Validation Rules

- Business rule IDs are unique and stable.
- Rule names are editable and unique within the model.
- Invalid rules are preserved and marked invalid with diagnostics.
- Allowed expression features: column references from fact and joined dimension aliases, literals, arithmetic, comparisons, boolean logic, case expressions, and the approved scalar functions `abs`, `coalesce`, `ifnull`, `lower`, `ltrim`, `max`, `min`, `nullif`, `round`, `rtrim`, `substr`, `trim`, and `upper`.
- Rejected expression features: semicolons, comments, subqueries, full statements, schema-changing operations, data-changing operations, CTEs, window functions, unknown functions, unknown aliases, unknown columns, and unsupported expression nodes.

## Diagnostic

Safe structured warning or error shown to users and optionally persisted from saved tests.

### Fields

- `severity`: `error` or `warning`.
- `code`: Stable machine-readable diagnostic code.
- `message`: User-safe actionable message.
- `location`: Optional model location such as source, fact table, dimension, relationship, key pair, or business rule.
- `stale`: Whether the diagnostic was produced for an earlier saved model definition.

### Validation Rules

- Diagnostics must not include generated SQL, absolute paths, stack traces, raw database driver errors, sample rows, or profiling information.
- Errors block successful test status.
- Static warnings and dynamic warnings do not block successful test status.

## Status Transitions

- New saved model with only valid name: `draft`.
- Structurally complete saved model with no current test: `untested`.
- Successful saved zero-row compilation test: `tested`.
- Failed saved test: `failed`.
- Saved edit after latest test: `stale` when structurally complete, otherwise `draft`.
- Referenced Connection changed or deleted after latest test: stale or repair-needed diagnostics until retested or repaired.
- Failed test after previous success: update latest failure timestamp and preserve previous successful timestamp.
