# Rooted Data Model Relationships Design

**Date:** 2026-07-21  
**Status:** Approved design  
**Feature source:** `specs/008-data-models-builder/`  
**Prior interface design:** `docs/superpowers/specs/2026-07-19-data-model-builder-interface-design.md`

## Context

The current Data Models Builder intentionally implements a strict star schema. A relationship identifies only a dimension, and the fact table is the implicit other endpoint. This prevents users from representing valid multi-hop dimensional models such as the Chinook sales hierarchy:

```text
InvoiceLine
|- Invoice
|  `- Customer
|     `- Employee
`- Track
   |- Album
   |  `- Artist
   |- Genre
   `- MediaType
```

The current limitation exists across the frontend types and editor, API schema, persisted JSON, validation, compiler, diagnostics, tests, and the active feature specification. This is therefore a full-stack topology change rather than an interface-only adjustment.

This design supersedes the direct fact-to-dimension constraints in the active feature documents, specifically the strict-star and snowflake-rejection behavior in `specs/008-data-models-builder/spec.md`, `plan.md`, `data-model.md`, `contracts/data-models-api.md`, and the prior interface design.

Updating the active feature specification is an implementation prerequisite, not deferred cleanup. Before production code changes, the implementation plan must add explicit tasks to reconcile `spec.md`, `plan.md`, `data-model.md`, `contracts/data-models-api.md`, `tasks.md`, `research.md`, `quickstart.md`, and `checklists/requirements.md`. Verification must confirm that none of those documents still requires direct-only joins or snowflake rejection.

## Approved Decisions

- Support a rooted, acyclic dimensional tree rather than an arbitrary graph.
- Retain separate `fact_table` and `dimensions` collections.
- Give the fact table a stable ID and give every relationship explicit parent and child table-instance endpoints.
- Detect declared SQLite foreign keys and present them as suggestions that require confirmation.
- Use the full Chinook sales snowflake as the acceptance model.
- Normalize existing direct-star definitions transparently so saved work remains usable.
- Use a review-first relationship workbench rather than a free-form graph editor.

## Goals

- Allow a configured dimension to join another configured dimension when both remain connected to the fact root.
- Make the path from every table back to the fact understandable while editing.
- Let users build the Chinook acceptance model from detected relationships without duplicating table setup and relationship setup.
- Keep manual relationship configuration available for cross-connection joins and schemas without declared foreign keys.
- Produce deterministic join plans independent of relationship array order.
- Preserve legacy saved models, aliases, business rules, keys, diagnostics, and status.
- Preserve the existing security boundary and compile-only semantics.
- Remain usable with keyboard input and on narrow viewports.

## Non-Goals

- No arbitrary cyclic graph.
- No table with multiple incoming relationships or multiple paths to the fact.
- No free-form node dragging, edge drawing, or graph auto-layout controls.
- No cardinality inference, row profiling, sample rows, fanout analysis, or row-retention analysis.
- No automatic insertion of suggested relationships without user confirmation.
- No cross-connection foreign-key discovery; cross-connection relationships remain manual.
- No change to model ownership, immutable names, last-save-wins behavior, measures, or analytical materialization.
- No application-database schema migration solely for the topology change because model definitions are stored as JSON.

## Product Intent

The primary user is an internal analyst translating an operational relational schema into an analytical model. The user must understand where each table enters the model, how it reaches the analytical grain, and which configuration remains incomplete.

The interface should feel like a schema cartography workbench: precise, path-oriented, and calm. It should reduce repetitive setup without hiding joins or changing the draft unexpectedly.

Domain concepts include root grain, table instances, join paths, declared foreign keys, role-playing aliases, composite keys, schema provenance, model connectivity, and compile diagnostics.

The visual color world remains the existing drafting-paper white, graphite text, database steel, model violet, warning amber, tested green, and muted diagnostic red.

The signature element is a review queue of detected joins paired with a rooted model map. A user can see both the proposed change and the resulting path to the fact before accepting it.

The design rejects three common defaults:

- Free-form graph editing is replaced by explicit relationship cards and a read-only interactive map.
- A wizard that hides dependencies is replaced by the existing progressive sections.
- Generic relationship table rows are replaced by path-oriented cards with endpoint-aware key controls.

## Version 2 Data Contract

### Model Definition

Every newly created or updated definition uses `schema_version: 2`.

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

All current core-key strictness remains. Version 2 is the only response shape returned by the API after normalization.

### Table Instance Identity

The fact table gains a stable `id` field. Dimensions retain their existing stable IDs.

```json
{
  "id": "fact_550e8400e29b41d4a716446655440000",
  "connection_id": "conn_chinook",
  "table": "InvoiceLine",
  "object_type": "table",
  "alias": "fact_invoice_line",
  "grain": "one row per invoiced track",
  "primary_key": ["InvoiceLineId"],
  "metadata": {}
}
```

An ID identifies an alias instance, not only a physical connection and table. This preserves role-playing dimensions. The ID does not change when the source, object, alias, grain, or selected keys are edited.

New frontend IDs use the existing UUID convention with `fact_`, `dim_`, `rel_`, and `rule_` prefixes. A normalized legacy fact uses a deterministic available root ID. The normalizer tries `fact_root`, then `fact_root_1`, `fact_root_2`, and so on until the ID does not collide with any dimension ID. The same legacy input therefore always produces the same root ID.

### Relationship Definition

Relationships use explicit topology endpoints and neutral key names.

```json
{
  "id": "rel_550e8400e29b41d4a716446655440001",
  "parent_table_id": "fact_550e8400e29b41d4a716446655440000",
  "child_table_id": "dim_track",
  "join_type": "left",
  "key_pairs": [
    {
      "parent_column": "TrackId",
      "child_column": "TrackId"
    }
  ],
  "metadata": {}
}
```

`parent_table_id` means the endpoint nearer the fact root. `child_table_id` means the newly joined endpoint farther from the root. These are model-topology terms and do not mean parent and child in the source database's foreign-key terminology.

For a left join, the parent/root-side rows are preserved by the immediate join. An inner join can filter the root through the complete path and therefore retains the existing warning behavior with path-specific copy.

### Legacy Normalization

Persisted definitions without `schema_version` are version 1. A single backend storage-read normalization boundary converts them before strict version-2 validation:

1. Add `schema_version: 2`.
2. Select a deterministic collision-free root ID using the algorithm above.
3. Add that ID to a configured legacy fact table.
4. If the legacy fact is null but relationships exist, create this strict version-2-compatible incomplete fact placeholder: `{ "id": "<selected-root-id>", "connection_id": "", "table": "", "object_type": "table", "alias": "", "grain": null, "primary_key": [], "metadata": { "legacy_placeholder": true } }`. Blank fields are saveable draft gaps. The placeholder is replaced in place when the user selects a fact.
5. Translate each relationship's implicit fact endpoint to the selected root ID in `parent_table_id`.
6. Translate legacy `dimension_id` to `child_table_id`.
7. Translate `fact_column` and `dimension_column` to `parent_column` and `child_column`.
8. Preserve relationship IDs, dimensions, aliases, sources, rules, measures, metadata, and diagnostics.

Normalization is idempotent. API reads return the normalized version-2 definition. Existing stored JSON is rewritten only on the next successful model save.

Create, update, and unsaved-test request bodies accept version 2 only. Persisted storage is the concrete compatibility boundary; public write payload compatibility is not expanded. The saved-model test endpoint accepts no definition body and always tests the current canonical saved definition. Dirty frontend drafts continue to use the unsaved-test endpoint and cannot mark an older saved definition as tested. A saved-model test request containing a definition body is rejected. Unknown versions and payloads that mix version-1 and version-2 relationship fields are also rejected.

Status and dirty-state comparison use canonical normalized version-2 definitions. Reading and saving a semantically unchanged legacy model rewrites storage without marking diagnostics stale or changing `tested`/`failed` status and test timestamps.

## Safe Foreign-Key Metadata

Schema inspection extends each table object with grouped foreign keys.

```json
{
  "name": "InvoiceLine",
  "object_type": "table",
  "columns": [],
  "foreign_keys": [
    {
      "referenced_table": "Track",
      "column_pairs": [
        {
          "local_column": "TrackId",
          "referenced_column": "TrackId"
        }
      ]
    }
  ]
}
```

SQLite `PRAGMA foreign_key_list` rows are grouped by foreign-key ID and ordered by sequence so composite relationships remain intact. Views return an empty `foreign_keys` array unless SQLite exposes a supported declared relationship source in the future.

SQLite permits a foreign key to omit referenced column names. When `PRAGMA foreign_key_list` returns null referenced columns, schema inspection resolves them to the referenced table's primary-key columns in declared key order only when local and referenced key cardinality matches. If the referenced object or ordered primary key cannot be resolved safely, that foreign key is omitted from suggestion metadata and remains manually configurable. Returned `column_pairs` always contain concrete non-null identifiers.

Only identifiers are returned. The endpoint still excludes source rows, row counts, profiling values, generated SQL, database paths, raw driver errors, and SQLite system objects.

## Relationship Suggestion Rules

Suggestions are derived frontend state and are never persisted in `model_json`.

After a fact table is selected, discovery recursively follows declared foreign keys from each root-reachable local table toward its referenced tables. The conversion is normative: the current root-side local instance becomes `parent_table_id`, the referenced instance becomes `child_table_id`, `local_column` becomes `parent_column`, and `referenced_column` becomes `child_column`. For Chinook, this direction discovers lookup hierarchies but does not pull child transaction or bridge tables such as `PlaylistTrack` into the sales model.

A suggestion contains:

- The source connection and schema objects.
- The proposed root-side and joined table instances.
- Local and referenced key pairs.
- The resulting path back to the fact.
- Whether accepting it will create a new dimension alias or reuse an unconnected configured alias.
- A reason such as `Declared foreign key` or `Extends Track path`.

Suggestion constraints:

- Only same-connection declared foreign keys are suggested.
- Self-referencing foreign keys are not suggested automatically.
- Suggestions that create a cycle, second incoming edge, or duplicate endpoint pair are excluded.
- Multiple foreign-key paths to the same physical table remain separate path-qualified suggestions and require distinct aliases when both are accepted.
- Stale suggestions disappear after schema refresh, but configured draft content is not deleted.
- Traversal uses breadth-first root-path order and a per-path visited table set. Physical declarations are deduplicated only for the same proposed local table instance; the same declaration reached through a distinct alias path remains a distinct suggestion.
- Each suggestion identity combines its proposed parent table-instance/path identity with a canonical structured foreign-key declaration. It is not a delimiter-joined string.
- Traversal stops at a depth of 25 edges and caps candidates that create aliases at the remaining dimension capacity. Suggestions that reuse an existing unconnected alias do not consume dimension capacity. The UI reports when additional valid relationships were omitted by the model cap.
- Referenced objects that are missing, are SQLite system objects, or are outside safe inspected metadata are excluded.
- Suggestions are sorted by path depth, case-insensitive referenced-table name, local column signature, referenced column signature, and source object name.
- A deep suggestion remains visible with its complete proposed path. Activating it automatically selects its unresolved prerequisite suggestions and states the total tables and relationships that confirmation will add. A prerequisite cannot be deselected while one of its dependents remains selected.
- Batch acceptance takes the prerequisite closure, revalidates every selected item, and applies all selected changes atomically in root-first order. If any item is stale, ambiguous, or over capacity, no selected item is inserted and the review queue explains the blocking items.

Accepting a suggestion may create both a dimension table instance and its relationship. This avoids forcing the user to configure the same object separately in Dimensions before confirming the join.

A created dimension receives the inspected connection ID, table name, object type, declared primary-key columns, a stable generated `dim_` ID, and a `dim_<snake_case_table>` alias. Alias collisions receive the first available numeric suffix such as `_2`. If the referenced object has no declared primary key, acceptance remains allowed but the new dimension is visibly incomplete until the user selects its analytical key.

If exactly one matching configured alias is unconnected, the suggestion offers reuse or creation of a new alias. If several matching aliases are unconnected, the user must choose one or explicitly create a new alias; the builder never chooses ambiguously.

Accepted relationships may persist advisory UI metadata using a structured declaration with ordered column pairs:

```json
{
  "origin": "foreign_key",
  "foreign_key": {
    "connection_id": "conn_chinook",
    "local_table": "InvoiceLine",
    "referenced_table": "Track",
    "column_pairs": [
      {
        "local_column": "TrackId",
        "referenced_column": "TrackId"
      }
    ]
  }
}
```

Manual relationships use `origin: "manual"`. The relationship endpoints provide path-specific instance identity; the structured declaration provides source-schema identity without delimiter escaping or composite-key ambiguity. The backend never trusts provenance metadata for validation or compilation. After reopen or schema refresh, the frontend compares the declaration with current safe schema metadata. A mismatch is displayed as `Previously detected; verify` rather than as a current declared relationship.

## Rooted Tree Validation

Drafts may remain incomplete and save with only a valid model name. A testable model must satisfy all existing source, table, alias, key, business-rule, and measure rules plus these topology rules:

- Exactly one configured fact table is the root.
- The fact has no incoming relationship.
- Every dimension has exactly one incoming relationship.
- Every relationship references two distinct configured table-instance IDs.
- Every table instance is reachable from the fact.
- The graph is acyclic.
- Duplicate parent-child endpoint pairs are rejected.
- Relationship IDs and all table-instance IDs are unique.
- Nonblank fact and dimension SQL aliases are trimmed and case-insensitively unique in one shared table-alias namespace. Blank aliases remain saveable completeness gaps. Source aliases and business-rule names retain their existing separate namespaces.
- Each key-pair column exists on its selected endpoint.
- Each relationship contains at least one complete key pair.
- Only `left` and `inner` joins are supported.

Validation does not depend on relationship array order. It returns all deterministic errors together so users can repair the model in one pass.

New or revised diagnostic concepts include:

- Missing relationship endpoint.
- Self relationship.
- Multiple parents for one table.
- Relationship cycle.
- Disconnected table or branch.
- Missing parent-side or child-side column.
- Duplicate relationship endpoints.
- Inner join on a named root path.

Completeness and saved-model status use graph connectivity rather than the former rule that every dimension must directly reference the fact.

### Save And Test Severity

Topology diagnostics have explicit save behavior.

| Diagnostic class | Save behavior | Test behavior |
|---|---|---|
| Unsupported/mixed schema version, unknown core keys, cap violations, non-empty measures | Block save | Error |
| Duplicate IDs or aliases, unknown relationship endpoint IDs, an incoming edge to the fact, self-links, cycles, duplicate incoming edges, duplicate endpoint pairs | Block save | Error |
| Missing/incomplete fact, missing source/object/key, dimension without an incoming edge, disconnected branch, unavailable schema column | Save as draft | Error |
| Inner join and compile-only limitations | Save | Warning |

A version-2 relationship with an unknown endpoint is malformed and save-blocking. Repairable destructive edits therefore remove edges that touch a removed table rather than preserving dangling endpoint IDs.

Saved-model status follows the existing rules after canonical normalization:

- Any saveable completeness gap produces `draft`.
- A complete model without a current test is `untested` or `stale` according to existing history.
- A normalization-only save does not stale diagnostics or alter test timestamps.
- Test reports every saveable gap as an error before compilation.

Save/reopen behavior for repair states is part of acceptance: a factless placeholder, a dimension without an incoming edge, a disconnected descendant branch, a missing source, and unavailable join columns must round-trip without losing configuration.

## Join Planning And Compilation

The compiler treats relationships as an unordered rooted tree.

1. Start from the fact table and its connection as the main read-only SQLite source.
2. Attach other referenced connections using the existing safe backend-generated aliases.
3. Build adjacency from validated relationships.
4. Traverse root first with deterministic sibling ordering by case-insensitive child alias, child table-instance ID, and relationship ID.
5. For each edge, join a new child table to a parent that is already present in the query.
6. Compile composite key pairs as conjunctive equality predicates.
7. Compile business rules against all connected aliases.
8. Execute the existing zero-row dry run.

The API never returns generated SQL. Relationship payload order cannot change query correctness or compiled join order. Diagnostics sort by section/path, diagnostic code, table-instance ID, relationship ID, and key-pair index so equivalent relationship permutations return equivalent diagnostic ordering.

The compile-only warning explicitly states that multi-hop joins can introduce filtering, unmatched lookup values, fanout, or cardinality problems that compilation does not measure.

## Review-First Interface

The existing Data Model Builder layout, route, tree navigation, health strip, progressive sections, inspector, and sticky action bar remain.

Strict-star terminology changes to rooted dimensional-model terminology. `Star map` becomes `Model map`.

### Fact And Dimensions

Selecting the fact establishes the root and starts relationship discovery. Changing the fact preserves configured tables and rules but revalidates every relationship and marks unreachable branches for repair.

Dimensions remain repeatable alias instances. Dimensions created from a suggestion appear immediately in the Dimensions section and can be edited through the existing source, table, alias, and primary-key controls.

### Detected Join Review

The Relationships section begins with a review queue when valid suggestions exist.

Each suggestion shows:

- The proposed equality, for example `InvoiceLine.TrackId = Track.TrackId`.
- The source, destination alias, and resulting root path.
- The declared-foreign-key reason.
- Whether a table instance will be created.
- An `Add relationship` action.

Users can select several suggestions and use `Add selected`. No suggestion changes the draft before individual or batch confirmation.

### Manual Relationships

Manual creation remains available.

- `From table` selects a table that is already connected to the root.
- `Joined table` selects a configured table without an incoming relationship.
- Endpoint choices exclude combinations that would immediately create a self-link, cycle, or second parent.
- Column choices come from each selected endpoint's safe schema metadata.
- Join type defaults to `left`.
- Composite key pairs remain repeatable.

Backend validation remains authoritative even when the interface prevents known-invalid choices.

### Configured Relationship Cards

Each card shows:

- A path breadcrumb from the fact to the joined table.
- Root-side and joined aliases.
- Join type and inner-join warning.
- Repeatable endpoint-aware key pairs.
- Detected or manual provenance.
- Inline missing-schema, missing-column, disconnected, and stale states.

Changing an endpoint preserves compatible keys and clears incompatible keys visibly. It never substitutes a column silently.

### Model Map

The inspector renders an indented rooted tree rather than a radial or draggable graph.

- The fact root has the existing restrained violet emphasis.
- Every edge displays its join type and health.
- Disconnected configured tables appear in a separate repair group.
- Selecting a node or edge opens and focuses the corresponding Dimensions or Relationships card.
- The map is derived from the in-memory draft and contains no generated SQL or source data.

### Destructive Edits

Removing an intermediate relationship disconnects its descendant branch but preserves those tables and relationships as repairable work.

Removing a table that has descendants requires a confirmation surface with two explicit choices:

- Preserve descendants for reattachment. This is the default.
- Remove the entire branch. This removes descendant table instances and relationships only after explicit confirmation.

When descendants are preserved, the selected table and every relationship touching it are removed. Descendant table instances and relationships between those descendants remain. Each former direct child becomes an unparented draft gap available for reattachment.

Clearing the fact removes the fact object and relationships that touch it but preserves dimensions and relationships between dimensions. The remaining branches save as disconnected draft work. Selecting a replacement fact creates a new stable fact ID unless the user is completing a normalized legacy placeholder, in which case the placeholder ID is retained.

Removing a model source calculates one atomic impact set containing every table instance that uses the source, including cases where affected instances are ancestors of one another.

- `Preserve other-source descendants` removes the affected table instances and every relationship touching them. Unaffected descendants on other sources remain as unparented repairable work.
- `Remove affected branches` takes the deduplicated descendant closure of every affected instance and removes that closure plus all touching relationships. If the affected source contains the fact, this choice removes the entire connected model tree and requires copy that states that impact explicitly.

No partial mutation occurs if confirmation is cancelled. Deleting a Connection outside the model continues to preserve all references through the existing missing-source repair flow.

Business rules are always preserved and become invalid with diagnostics when their aliases are no longer connected.

### Responsive And Accessible Behavior

- On narrow viewports, suggestions and configured cards remain before the model map.
- Relationship key rows stack without horizontal page scrolling.
- Native controls, fieldsets, legends, and visible focus states remain.
- Suggestion selection, batch acceptance, manual joins, map focus, and branch confirmation are keyboard-accessible.
- Loading and action feedback use the existing polite live region.
- Reduced-motion behavior remains unchanged.

## Error And Repair Behavior

- Schema-load failures affect only suggestions and controls for that connection.
- A failed schema refresh removes stale suggestions but preserves accepted configuration.
- Missing connections remain visible through the existing replacement flow.
- Replacing a connection preserves table names, table-instance IDs, aliases, relationships, and rules where possible.
- Unknown endpoint tables or columns remain visible with specific repair diagnostics.
- A disconnected branch is saved as a draft and can still be tested to receive authoritative completeness diagnostics.
- Unsafe backend failures remain reduced to safe structured messages.
- No validation or repair action silently deletes persisted modeling work.

## Chinook Acceptance Model

The primary acceptance case uses `InvoiceLine` as the fact root with grain `one row per invoiced track`.

| Root-side table | Root-side column | Joined table | Joined column |
|---|---|---|---|
| InvoiceLine | InvoiceId | Invoice | InvoiceId |
| Invoice | CustomerId | Customer | CustomerId |
| Customer | SupportRepId | Employee | EmployeeId |
| InvoiceLine | TrackId | Track | TrackId |
| Track | AlbumId | Album | AlbumId |
| Album | ArtistId | Artist | ArtistId |
| Track | GenreId | Genre | GenreId |
| Track | MediaTypeId | MediaType | MediaTypeId |

All relationships default to left joins. The model map must show eight edges and nine table instances, every dimension must have one path to `InvoiceLine`, and the zero-row compile test must succeed.

Declared foreign-key discovery must not automatically include `Playlist`, `PlaylistTrack`, or unrelated tables because they are not reached by outbound local-to-referenced foreign-key traversal from `InvoiceLine`.

## Testing Strategy

Implementation follows test-driven development. Each behavior begins with a focused failing test, followed by the minimum implementation and refactoring while green.

### Backend Tests

- Normalize a complete version-1 model to version 2 without data loss.
- Prove normalization is deterministic and idempotent.
- Normalize every currently saveable partial version-1 shape, including relationships with no configured fact and a dimension ID that collides with `fact_root`.
- Reject version-1 public write/test payloads, mixed relationship fields, and unknown schema versions.
- Reject definition bodies on the saved-model test endpoint and prove dirty drafts use unsaved testing.
- Return version 2 from create, read, update, and test flows.
- Rewrite a semantically unchanged legacy model without changing status, stale state, diagnostics, or test timestamps.
- Group single and composite SQLite foreign keys in schema inspection.
- Resolve omitted referenced columns against ordered primary keys and exclude declarations that cannot be resolved safely.
- Exclude system objects and sensitive metadata from the expanded schema contract.
- Accept the complete Chinook-shaped rooted tree.
- Compile the complete tree when relationships arrive out of order.
- Return test errors for self-links, cycles, duplicate incoming edges, disconnected tables, missing endpoints, invalid columns, duplicate identities, and unsupported joins.
- Distinguish save-blocking malformed topology from saveable draft connectivity and schema gaps.
- Save and reopen each repairable topology state without data loss.
- Preserve role-playing aliases for repeated physical tables.
- Compile a manual relationship across attached SQLite connections.
- Preserve prior diagnostics and status semantics across legacy normalization and save.
- Preserve repairable configuration when a source disappears or changes.

Backend tests create deterministic temporary Chinook-shaped SQLite databases. They do not depend on the untracked local `data/datasets/Chinook.db`.

### Frontend Tests

- Initialize new drafts as version 2 with a stable fact ID.
- Hydrate normalized saved models without replacing stable IDs.
- Derive root-first Chinook suggestions from safe schema metadata.
- Bound and deterministically order discovery for self references, mutual cycles, dense graphs, dangling targets, and schemas that exceed the dimension cap.
- Accept one suggestion and create its table and relationship.
- Batch-accept the complete Chinook tree in root-first order.
- Include unresolved prerequisites when a deep suggestion is selected and prevent invalid prerequisite deselection.
- Reject a stale or over-cap batch atomically without partially changing the draft.
- Generate complete dimension fields, deterministic collision-free aliases, and visible missing-primary-key gaps.
- Require a choice when several unconnected aliases match a suggestion.
- Keep suggestions advisory until confirmation.
- Revalidate persisted foreign-key provenance and downgrade stale provenance after reopen.
- Configure a dimension-to-dimension relationship manually.
- Prevent immediate self-links, cycles, and second-parent choices in controls.
- Preserve compatible key pairs and visibly clear incompatible pairs after endpoint changes.
- Render connected and disconnected branches in the model map.
- Focus the matching editor from a map node or edge.
- Preserve descendants after intermediate-edge removal.
- Preserve descendant relationships while removing every edge that touches a removed table.
- Clear a fact into saveable disconnected branches and complete a legacy fact placeholder without changing its stable ID.
- Require explicit confirmation before removing an entire branch.
- Apply source-removal impact sets atomically for overlapping affected instances, other-source descendants, and a fact-source removal.
- Keep business rules and show diagnostics when aliases become disconnected.
- Preserve current save, test, drop, missing-source repair, and dynamic-tree behavior.
- Keep all relationship actions reachable without horizontal page scrolling on narrow viewports.

### Browser Acceptance

- Load the Chinook connection and select `InvoiceLine` as the fact.
- Review and accept the eight target declared relationships.
- Confirm that dimensions and the model map update immediately.
- Confirm that the final map matches the approved hierarchy.
- Run Test model and receive successful zero-row compilation plus compile-only warnings.
- Save, reopen, edit a multi-hop edge, observe stale status, and retest.
- Open a legacy direct-star model and save it without reconstructing its relationships.
- Verify the Connections workspace remains unchanged.

## Expected Implementation Boundaries

Backend changes are expected in:

- `apps/api/app/modules/data_models/schemas.py`
- `apps/api/app/modules/data_models/schema_inspection.py`
- `apps/api/app/modules/data_models/validation.py`
- `apps/api/app/modules/data_models/status.py`
- `apps/api/app/modules/data_models/service.py`
- `apps/api/app/modules/data_models/query_compiler.py`
- Focused contract, unit, and integration tests under `apps/api/tests/`

Frontend changes are expected in:

- `apps/web/features/creditmodeler/data-model-types.ts`
- `apps/web/features/creditmodeler/DataModelBuilder.tsx`
- Focused relationship/model-map components if extraction reduces the current builder's responsibilities
- `apps/web/app/globals.css`
- Focused unit, interaction, responsive, and visual tests under `apps/web/tests/`

The API URLs, Next.js proxy routes, workbench route, object tree composition, and relational persistence table do not need to change.

## Verification

Run focused tests during each red-green-refactor cycle, then complete per-area verification.

From `apps/api`:

```powershell
pytest
```

From `apps/web`:

```powershell
npm run test
npm run lint
npm run test:visual:desktop
```

Use browser acceptance against the loaded local Chinook connection after automated tests pass. Do not commit the local Chinook database or application metadata database as part of this feature.
