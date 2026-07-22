# Research: CreditModeler Data Models Builder

## Decision: Implement Data Models as a new backend domain module and frontend workbench builder

**Rationale**: The existing Connections feature already follows the product pattern needed here: authenticated backend domain module, per-user metadata, typed frontend client, dynamic workbench tree children, and a canvas-panel builder. Reusing that shape minimizes architectural novelty and keeps Data Models aligned with current `/creditmodeler-service` behavior.

**Alternatives considered**: Embed Data Models into the Connections module; rejected because data models have separate lifecycle, validation, diagnostics, and persisted shape. Build a standalone route; rejected because the feature explicitly belongs inside the existing workbench canvas.

## Decision: Persist data models as user-owned metadata with strict JSON model definition

**Rationale**: A saved analytical model is primarily metadata: name, description, rooted-tree definition, status, diagnostics, and timestamps. Strict schemas allow validation and forward compatibility while explicit metadata objects provide safe room for UI-only state.

**Alternatives considered**: Normalize every fact/dimension/relationship/rule into separate tables; rejected for MVP complexity and because the primary need is save/reopen/update/test of a cohesive model definition. Store arbitrary JSON only; rejected because unknown core keys and unsafe shapes must be rejected.

## Decision: Use a rooted, acyclic dimensional tree

**Rationale**: A fact-rooted tree supports valid multi-hop lookup hierarchies while keeping paths, validation, and compilation deterministic. The fact has no incoming edge; every dimension has exactly one incoming edge and one fact path; cycles, second parents, duplicate endpoints, and disconnected testable topology are invalid. Dimensions remain separate alias instances and can connect to the fact or another dimension.

**Alternatives considered**: Keep relationships limited to one topology level; rejected because it cannot represent the approved Chinook hierarchy. Support an arbitrary graph; rejected because cycles and multiple root paths make analytical intent and deterministic planning harder to understand. Support non-SQLite sources, measures, or materialization; rejected because those remain outside this release.

## Decision: Introduce a strict version-2 definition with table-instance endpoints

**Rationale**: Giving the fact a stable `fact_` ID and each relationship explicit `parent_table_id` and `child_table_id` endpoints makes topology independent of aliases and permits dimension-to-dimension edges. Neutral `parent_column` and `child_column` names match the model path rather than assuming the endpoint is always the fact. IDs identify role-playing alias instances and survive edits to source, object, alias, grain, and keys.

**Alternatives considered**: Infer one endpoint from the fact; rejected because it cannot encode a multi-hop edge. Use aliases as endpoint identity; rejected because aliases are editable and business-rule rewrites may be ambiguous. Use physical connection/table identity; rejected because it collapses role-playing instances.

## Decision: Normalize legacy definitions only at the storage-read boundary

**Rationale**: Existing saved work must reopen without broadening public payload compatibility. Persisted definitions without a version are deterministically normalized to version 2 before strict validation, including a collision-free `fact_root` ID and an incomplete fact placeholder when legacy relationships exist without a fact. Normalization is idempotent; API responses are version 2; storage rewrites only on successful save. Canonical comparison prevents normalization-only saves from staling diagnostics or changing status and timestamps.

**Alternatives considered**: Accept version 1 on all writes; rejected because it creates multiple public contracts and ambiguous mixed payloads. Eagerly migrate every JSON record; rejected because no relational schema change is needed and read normalization safely handles partial drafts. Generate a random legacy fact ID; rejected because repeated reads would be unstable.

## Decision: Distinguish malformed topology from repairable draft gaps

**Rationale**: Unsupported/mixed versions, unknown core keys, caps, measures, duplicate identity/aliases, unknown endpoints, incoming fact edges, self-links, cycles, duplicate incoming edges, and duplicate endpoint pairs are malformed and block save. Missing fact/source/object/key, unparented dimensions, disconnected branches, and unavailable columns are repair states that save as drafts but fail Test. Inner joins and compile-only limits remain warnings. This lets destructive edits preserve work without persisting dangling endpoint IDs.

**Alternatives considered**: Block every incomplete graph on save; rejected because it breaks draft and repair workflows. Save unknown endpoint IDs; rejected because a version-2 edge with a missing instance is malformed rather than a completeness gap.

## Decision: Keep saved and unsaved tests separate

**Rationale**: Create, update, and unsaved Test accept version 2 only. Saved Test accepts no definition body and always evaluates the canonical saved definition. Dirty drafts use unsaved Test and cannot mark an older saved definition tested. This keeps persisted status and timestamps attached to exactly the definition that was evaluated.

**Alternatives considered**: Let saved Test accept an optional draft body; rejected because it can mark a saved record tested for content that was never saved.

## Decision: Use saved Connections and expose safe grouped foreign-key metadata

**Rationale**: Saved Connections already enforce user ownership and database reference validation. SQLite foreign-key rows can be grouped by declaration ID and sequence to retain composite keys. Omitted referenced columns are resolved only against an identifiable ordered primary key with matching cardinality. The API returns concrete identifiers and excludes unresolved declarations, views' unsupported relationships, rows, paths, generated SQL, system objects, raw errors, and profiling metrics.

**Alternatives considered**: Let users enter database references in the Data Model Builder; rejected because it bypasses the Connections security boundary. Include sample rows or counts for better UX; rejected because the spec limits metadata disclosure and test validation to compilation only.

## Decision: Use a review-first foreign-key suggestion queue

**Rationale**: Suggestions are derived frontend state, follow same-connection local-to-referenced declarations from root-reachable instances, and never mutate or persist in the draft before confirmation. Breadth-first, path-qualified traversal discovers the approved Chinook lookup hierarchy without pulling reverse child transactions such as `PlaylistTrack`. Deep selections include prerequisite closure; acceptance revalidates and inserts atomically in root-first order. The 25-edge depth and remaining dimension capacity bound hostile schemas.

**Alternatives considered**: Automatically add every detected relationship; rejected because schema declarations are advisory and can produce unwanted aliases. Use a free-form graph editor; rejected because explicit review cards and a read-only rooted map make paths and repair states clearer. Deduplicate only by physical table; rejected because role-playing alias paths must remain distinct.

## Decision: Treat accepted foreign-key provenance as advisory

**Rationale**: Structured provenance records source connection, local/referenced objects, and ordered pairs without delimiter ambiguity, while explicit endpoints retain alias-path identity. The backend never trusts provenance for validation or compilation. Reopen or refresh compares it to current safe metadata and marks mismatches `Previously detected; verify` without deleting configuration.

**Alternatives considered**: Persist suggestion objects; rejected because suggestions are derived and become stale. Trust provenance as authoritative; rejected because source schemas can change independently.

## Decision: Validate business rules with parser-backed allowlisting

**Rationale**: Business rules are SQL-like expressions, which creates injection and unsafe-expression risk. Parser-backed inspection supports deterministic rejection of statements, subqueries, comments, unknown functions, unknown aliases, and unsupported expression nodes while enabling alias rewrites.

**Alternatives considered**: Treat rule expressions as opaque strings; rejected as unsafe and incompatible with alias cascade. Build a custom expression grammar from scratch; rejected because parser-backed SQLite expression support is more pragmatic for this MVP.

## Decision: Test by deterministic validation before zero-row dry-run compilation

**Rationale**: Deterministic validation catches shape, ownership, alias, topology, key, measure, and business-rule problems before opening source databases. Compilation treats relationships as an unordered tree, traverses root first, sorts siblings by child alias/ID and relationship ID, and joins each child after its parent. Zero-row dry-run compilation then proves the assembled model compiles without reading analytical data or materializing output.

**Alternatives considered**: Execute sample-row queries; rejected because the feature does not validate data quality, row retention, fanout, or cardinality. Skip SQL dry-run and rely only on structural validation; rejected because the user goal is to prove joins, keys, and rules compile across sources.

## Decision: Persist latest diagnostics and mark them stale after edits

**Rationale**: Users need continuity after failures and source changes. Persisted diagnostics explain the latest test outcome, and stale markers prevent users from trusting diagnostics against a changed model.

**Alternatives considered**: Clear diagnostics after every edit; rejected because it loses useful repair context. Keep diagnostics without stale marker; rejected because it creates false confidence.

## Decision: Keep Test available for incomplete drafts

**Rationale**: The spec clarifies that Test remains clickable for incomplete drafts. This allows the UI to show obvious gaps while backend validation remains authoritative and returns structured completeness diagnostics.

**Alternatives considered**: Disable Test until structural completeness; rejected because it hides backend validation and conflicts with clarified UX behavior.

## Decision: Apply moderate per-model caps for MVP

**Rationale**: The clarified limits of 5 sources, 25 dimensions, and 50 business rules keep validation, suggestion discovery, UI rendering, and dry-run compilation bounded while covering realistic pilot rooted models.

**Alternatives considered**: Smaller caps; rejected as unnecessarily restrictive for role-playing dimensions. No caps; rejected because it increases performance and UX risk without MVP value.

## Decision: Preserve workbench geometry and Connections behavior

**Rationale**: The Data Models builder must fit inside the current canvas frame and reuse the established workbench tree pattern. This reduces layout regression risk and protects the already implemented Connections feature.

**Alternatives considered**: Route-level redesign; rejected because the feature is explicitly a workbench option and visual regression risk is called out in the NFR plan.

## Decision: Use Chinook as the acceptance topology and require TDD

**Rationale**: `InvoiceLine` with `Invoice→Customer→Employee` and `Track→Album→Artist`, `Track→Genre`, and `Track→MediaType` exercises eight declared edges, nine instances, branching, depth, and deterministic planning. Temporary Chinook-shaped test databases avoid dependence on local untracked data. Every backend and frontend behavior begins with a focused failing test, followed by the minimum implementation and refactoring while green.

**Alternatives considered**: Accept only a one-edge example; rejected because it does not prove multi-hop behavior. Depend on `data/datasets/Chinook.db`; rejected because local data is not a deterministic tracked test fixture.
