# Data Model: CreditModeler Data Models Builder

## AnalyticalDataModel

User-owned persisted metadata for one saved data model.

### Fields

- `id`: Stable internal identifier.
- `user_id`: Owner identifier; all operations are scoped to the authenticated owner.
- `name`: Trimmed user-facing name; immutable after creation.
- `normalized_name`: Case-insensitive normalized name for per-user uniqueness.
- `description`: Optional editable description.
- `model_json`: Canonical schema-version-2 rooted-tree definition plus explicit UI metadata objects.
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

The persisted rooted dimensional-tree configuration. New and updated definitions use this strict core shape:

```json
{
  "schema_version": 2,
  "sources": [],
  "fact_table": null,
  "dimensions": [],
  "relationships": [],
  "business_rules": [],
  "measures": [],
  "metadata": {}
}
```

### Fields

- `schema_version`: Required integer `2` for create, update, and unsaved-test payloads and for every API response.
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
- Testable models require one configured fact root, a valid rooted tree, and valid referenced saved Connections and schema objects.
- Non-empty `measures` are rejected.
- Unknown core keys, unknown schema versions, and payloads mixing legacy and version-2 relationship fields are rejected.
- Generated SQL, absolute paths, raw driver errors, stack traces, row data, and profiling details are never stored for display or returned to clients.

### Persisted Legacy Normalization

Persisted definitions without `schema_version` are version 1. One backend storage-read boundary normalizes them before strict version-2 validation:

1. Add `schema_version: 2`.
2. Select the first fact ID not used by a dimension from `fact_root`, `fact_root_1`, `fact_root_2`, and subsequent numeric suffixes.
3. Add the selected ID to a configured legacy fact.
4. If the fact is null but relationships exist, create `{ "id": "<selected-root-id>", "connection_id": "", "table": "", "object_type": "table", "alias": "", "grain": null, "primary_key": [], "metadata": { "legacy_placeholder": true } }`. These blank fields are saveable draft gaps, and selecting a fact completes this object without changing its ID.
5. Translate each legacy relationship's implicit fact endpoint to `parent_table_id: <selected-root-id>`.
6. Translate `dimension_id` to `child_table_id`.
7. Translate `fact_column` and `dimension_column` to `parent_column` and `child_column`.
8. Preserve relationship IDs, dimensions, aliases, sources, rules, measures, metadata, diagnostics, status, and test history.

Normalization is deterministic and idempotent. Reads return version 2; stored JSON is rewritten only by the next successful save. Public create, update, and unsaved-test requests do not accept version 1. Canonical normalized definitions drive dirty-state and status comparison, so a semantically unchanged normalization-only save does not stale diagnostics or alter status or test timestamps.

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

The single root table instance used as model grain and main source for dry-run execution. Its ID identifies an alias instance rather than only a physical object.

### Fields

- `id`: Stable generated table-instance ID using the `fact_` prefix for new frontend drafts; immutable across source, object, alias, grain, and key edits.
- `connection_id`: Saved Connection identifier.
- `table`: Selected table or view name.
- `object_type`: `table` or `view`.
- `alias`: Editable fact alias.
- `grain`: Optional user-entered description of fact grain.
- `primary_key`: Array of one or more selected columns when configured.
- `metadata`: Optional UI-only object.

### Validation Rules

- Exactly one fact table is allowed in a testable model.
- The fact ID is unique across the fact and all dimension IDs.
- The fact has no incoming relationship.
- The fact table's Connection is the main SQLite source for dry-run execution.
- Selected object must exist in safe schema metadata and must not be a SQLite system object.
- The fact and dimension aliases share one trimmed, case-insensitively unique SQL table-alias namespace when nonblank; blank aliases remain saveable gaps.
- Relationships remain stable across alias changes because they use table-instance IDs. Business rule references are rewritten only when unambiguous.

## DimensionDefinition

An enrichment table instance joined into the rooted tree. The same physical object can appear through multiple stable alias instances.

### Fields

- `id`: Stable generated ID using the `dim_` UUID convention for new frontend instances, immutable after creation.
- `connection_id`: Saved Connection identifier.
- `table`: Selected table or view name.
- `object_type`: `table` or `view`.
- `alias`: Editable dimension alias.
- `primary_key`: Array of one or more selected columns when configured.
- `metadata`: Optional UI-only object.

### Validation Rules

- Dimension IDs are stable and unique across the fact and dimensions.
- Nonblank dimension aliases are trimmed and case-insensitively unique with the fact alias.
- The same source table may be reused through different aliases for role-playing dimensions.
- Selected object must exist in safe schema metadata and must not be a SQLite system object.
- A testable dimension has exactly one incoming relationship and one path to the fact root; an unparented or disconnected dimension remains saveable as a draft.
- Dimension alias changes do not change relationship endpoints and update business rule references only where safely rewritable.

## RelationshipDefinition

A directed model-topology edge from a table instance nearer the fact root to one farther from the root. `parent` and `child` do not describe source-database foreign-key direction.

### Fields

- `id`: Stable generated ID using the `rel_` UUID convention for new frontend relationships, immutable after creation.
- `parent_table_id`: Fact or dimension table-instance ID nearer the fact root.
- `child_table_id`: Dimension table-instance ID farther from the fact root.
- `join_type`: `left` or `inner`; defaults to `left`.
- `key_pairs`: Array of KeyPairDefinition.
- `metadata`: Optional UI-only object.

### Validation Rules

- Relationship IDs are unique and stable.
- Endpoints reference two distinct configured table-instance IDs; unknown endpoints are malformed and save-blocking.
- The child endpoint cannot be the fact and has at most one incoming relationship.
- Self-links, cycles, duplicate incoming edges, and duplicate parent-child endpoint pairs are save-blocking.
- Every dimension must be reachable from the fact for testing; unparented dimensions and disconnected branches are saveable draft gaps.
- `left` and `inner` are the only allowed join types.
- A left join preserves its immediate parent/root-side rows. An inner join produces a path-specific warning because it can filter the root through the complete path.
- Composite key pairs are allowed and compile as conjunctive key matches.
- Relationship validation does not depend on array order.

## KeyPairDefinition

One parent-endpoint-column to child-endpoint-column relationship key.

### Fields

- `parent_column`: Column selected from the parent endpoint metadata.
- `child_column`: Column selected from the child endpoint metadata.

### Validation Rules

- Columns must exist on their selected endpoints in safe schema metadata.
- Each relationship must contain at least one complete pair for testing; missing or unavailable columns remain saveable draft gaps.
- Suspicious join affinity mismatches produce warnings rather than automatically blocking compilation unless the underlying column reference is invalid.

## Relationship Provenance Metadata

Suggestions are derived frontend state and are never persisted. An accepted relationship may persist advisory metadata without affecting backend validation or compilation:

```json
{
  "origin": "foreign_key",
  "foreign_key": {
    "connection_id": "conn_chinook",
    "local_table": "InvoiceLine",
    "referenced_table": "Track",
    "column_pairs": [
      { "local_column": "TrackId", "referenced_column": "TrackId" }
    ]
  }
}
```

Manual relationships use `origin: "manual"`. The structured declaration carries source-schema identity, while relationship endpoints carry path-specific alias-instance identity. After reopen or schema refresh, the frontend compares provenance with current safe metadata; a mismatch is shown as `Previously detected; verify` rather than a current declaration.

## Safe Schema Relationship Metadata

Each inspected table has `foreign_keys`, grouped by SQLite foreign-key ID and ordered by sequence so composite declarations remain intact. Each item has `referenced_table` and concrete ordered `column_pairs` containing `local_column` and `referenced_column`.

If SQLite omits referenced columns, inspection resolves them only from the referenced object's ordered primary key when object identity and key cardinality match. Otherwise the declaration is omitted and remains manually configurable. Views return `foreign_keys: []`. Missing objects, system objects, unresolved declarations, database paths, source rows, counts, profiling values, generated SQL, and raw errors are never returned.

## Derived Relationship Suggestions

- Discovery starts after fact selection and recursively follows same-connection declared foreign keys from each root-reachable local instance toward referenced objects.
- The current local instance becomes `parent_table_id`; the referenced instance becomes `child_table_id`; local/referenced columns become parent/child columns.
- Traversal is breadth-first in root-path order with a per-path visited table set. It stops at 25 edges and caps alias-creating candidates at remaining dimension capacity; alias-reuse candidates do not consume capacity.
- Self references, cycles, second incoming edges, duplicate endpoint pairs, missing or unsafe targets, and stale declarations are excluded.
- A declaration reached through distinct alias paths remains distinct. Suggestion identity combines structured declaration identity with parent instance/path identity rather than delimiter-joined text.
- Physical declarations are deduplicated only for the same proposed local table instance; accepting multiple paths to one physical table requires distinct alias instances.
- Sort order is path depth, case-insensitive referenced table name, local column signature, referenced column signature, then source object name.
- A deep suggestion displays its complete path and selects its unresolved prerequisite closure. Required prerequisites cannot be deselected while a dependent remains selected.
- Individual or batch confirmation revalidates all selected items and inserts the full closure atomically in root-first order. Any stale, ambiguous, or over-cap item blocks the entire insertion.
- Acceptance may create a `dim_` instance with inspected source/object/primary key and a collision-free `dim_<snake_case_table>` alias, or reuse one explicitly selected unconnected matching alias. Multiple matches require a user choice. Missing primary keys remain visible analytical-key gaps.
- Schema refresh removes stale suggestions but never deletes accepted or otherwise configured draft content.

## Rooted-Tree Validation And Compilation

A testable definition has exactly one configured fact root, no incoming fact edge, exactly one incoming edge per dimension, distinct configured endpoints, complete endpoint key pairs, unique relationship and table-instance IDs, no cycles or duplicate endpoint pairs, and full reachability from the fact. Validation returns all errors in deterministic order and does not depend on relationship array order.

Compilation builds adjacency from validated edges, starts with the fact's read-only SQLite connection, attaches other referenced connections under safe backend-generated aliases, and traverses root first. Siblings sort by case-insensitive child alias, child table-instance ID, then relationship ID. Each child joins only after its parent is present. Composite pairs compile as conjunctive equality predicates; rules compile against connected aliases; the existing zero-row dry run remains the only execution. Diagnostics sort by section/path, code, table-instance ID, relationship ID, and key-pair index, so equivalent relationship permutations produce equivalent join plans and diagnostics.

## Save And Test Severity

| Diagnostic class | Save behavior | Test behavior |
|---|---|---|
| Unsupported or mixed schema version, unknown core keys, cap violations, non-empty measures | Block save | Error |
| Duplicate IDs or aliases within their required namespaces, unknown relationship endpoints, incoming fact edge, self-link, cycle, duplicate incoming edge, duplicate endpoint pair | Block save | Error |
| Missing or incomplete fact, missing source/object/key, dimension without incoming edge, disconnected branch, unavailable schema column | Save as draft | Error |
| Inner join and compile-only limitations | Save | Warning |

Destructive edits remove every relationship touching a removed table rather than retaining unknown endpoint IDs. A factless placeholder, unparented dimension, disconnected descendant branch, missing source, and unavailable join column must all round-trip without data loss.

Saved-model tests accept no definition body and test the canonical saved version only. New or dirty drafts use the strict version-2 unsaved-test operation and cannot mark an older saved definition as tested. Validation reports all saveable completeness gaps before compilation.

## Destructive-Edit State

- Removing an intermediate relationship preserves its descendant instances and descendant-to-descendant edges as a disconnected repair branch.
- Removing a table with descendants requires an atomic choice to preserve descendants for reattachment or remove the full descendant closure. Every edge touching a removed instance is removed.
- Clearing the fact removes the fact and its touching edges but preserves dimensions and edges between dimensions. A replacement fact gets a new ID unless it completes a normalized legacy placeholder.
- Removing a source computes one deduplicated impact set even when affected instances are ancestors of one another. Preserving other-source descendants removes affected instances and touching edges but leaves unaffected descendants unparented. Removing affected branches takes the deduplicated descendant closure; when the source contains the fact, the confirmation states that the entire connected tree is removed. Cancellation causes no partial mutation.
- Business rules are preserved and receive diagnostics when referenced aliases are no longer connected.

## BusinessRuleDefinition

Named row-level derived expression evaluated during compilation testing.

### Fields

- `id`: Stable generated ID using the `rule_` UUID convention for new frontend rules, immutable after creation.
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
- `location`: Optional model location such as source, fact table, dimension, root path, relationship, endpoint/key pair, or business rule.
- `stale`: Whether the diagnostic was produced for an earlier saved model definition.

### Validation Rules

- Diagnostics must not include generated SQL, absolute paths, stack traces, raw database driver errors, sample rows, or profiling information.
- Errors block successful test status.
- Static warnings and dynamic warnings do not block successful test status.

## Status Transitions

- New saved model with only valid name: `draft`.
- Any saveable completeness or connectivity gap: `draft`.
- Complete saved model with no current test: `untested`, or `stale` when existing test history no longer matches.
- Successful saved zero-row compilation test: `tested`.
- Failed saved test: `failed`.
- Semantically changed saved edit after latest test: `stale` when complete, otherwise `draft`.
- Normalization-only save of a semantically unchanged legacy definition: preserve diagnostics, stale flag, status, and all test timestamps.
- Referenced Connection changed or deleted after latest test: stale or repair-needed diagnostics until retested or repaired.
- Failed test after previous success: update latest failure timestamp and preserve previous successful timestamp.
