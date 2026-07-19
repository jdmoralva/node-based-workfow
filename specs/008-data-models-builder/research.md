# Research: CreditModeler Data Models Builder

## Decision: Implement Data Models as a new backend domain module and frontend workbench builder

**Rationale**: The existing Connections feature already follows the product pattern needed here: authenticated backend domain module, per-user metadata, typed frontend client, dynamic workbench tree children, and a canvas-panel builder. Reusing that shape minimizes architectural novelty and keeps Data Models aligned with current `/creditmodeler-service` behavior.

**Alternatives considered**: Embed Data Models into the Connections module; rejected because data models have separate lifecycle, validation, diagnostics, and persisted shape. Build a standalone route; rejected because the feature explicitly belongs inside the existing workbench canvas.

## Decision: Persist data models as user-owned metadata with strict JSON model definition

**Rationale**: A saved analytical model is primarily metadata: name, description, star-schema definition, status, diagnostics, and timestamps. Strict schemas allow validation and forward compatibility while explicit metadata objects provide safe room for UI-only state.

**Alternatives considered**: Normalize every fact/dimension/relationship/rule into separate tables; rejected for MVP complexity and because the primary need is save/reopen/update/test of a cohesive model definition. Store arbitrary JSON only; rejected because unknown core keys and unsafe shapes must be rejected.

## Decision: Limit MVP scope to strict star-schema, multi-SQLite compilation checks

**Rationale**: The feature is designed to prove that joins, keys, aliases, and row-level business rules compile across saved SQLite sources. Strict star schemas reduce ambiguity, align with risk analytics modeling needs, and keep dry-run validation deterministic.

**Alternatives considered**: Support snowflake relationships; rejected as out of scope and higher validation complexity. Support non-SQLite sources; rejected because the current Connections capability and MVP source decisions are SQLite-focused. Support measures and materialization; rejected because the spec explicitly excludes analytical workloads and computed measures.

## Decision: Use saved Connections only and inspect schema through safe metadata

**Rationale**: Saved Connections already enforce user ownership and database reference validation. Schema metadata needs to support modeling decisions without exposing row data, paths, generated SQL, or profiling metrics.

**Alternatives considered**: Let users enter database references in the Data Model Builder; rejected because it bypasses the Connections security boundary. Include sample rows or counts for better UX; rejected because the spec limits metadata disclosure and test validation to compilation only.

## Decision: Validate business rules with parser-backed allowlisting

**Rationale**: Business rules are SQL-like expressions, which creates injection and unsafe-expression risk. Parser-backed inspection supports deterministic rejection of statements, subqueries, comments, unknown functions, unknown aliases, and unsupported expression nodes while enabling alias rewrites.

**Alternatives considered**: Treat rule expressions as opaque strings; rejected as unsafe and incompatible with alias cascade. Build a custom expression grammar from scratch; rejected because parser-backed SQLite expression support is more pragmatic for this MVP.

## Decision: Test by deterministic validation before zero-row dry-run compilation

**Rationale**: Deterministic validation catches shape, ownership, alias, relationship, key, measure, and business-rule problems before opening source databases. Zero-row dry-run compilation then proves the assembled model compiles without reading analytical data or materializing output.

**Alternatives considered**: Execute sample-row queries; rejected because the feature does not validate data quality, row retention, fanout, or cardinality. Skip SQL dry-run and rely only on structural validation; rejected because the user goal is to prove joins, keys, and rules compile across sources.

## Decision: Persist latest diagnostics and mark them stale after edits

**Rationale**: Users need continuity after failures and source changes. Persisted diagnostics explain the latest test outcome, and stale markers prevent users from trusting diagnostics against a changed model.

**Alternatives considered**: Clear diagnostics after every edit; rejected because it loses useful repair context. Keep diagnostics without stale marker; rejected because it creates false confidence.

## Decision: Keep Test available for incomplete drafts

**Rationale**: The spec clarifies that Test remains clickable for incomplete drafts. This allows the UI to show obvious gaps while backend validation remains authoritative and returns structured completeness diagnostics.

**Alternatives considered**: Disable Test until structural completeness; rejected because it hides backend validation and conflicts with clarified UX behavior.

## Decision: Apply moderate per-model caps for MVP

**Rationale**: The clarified limits of 5 sources, 25 dimensions, and 50 business rules keep validation, UI rendering, and dry-run compilation bounded while covering realistic pilot star schemas.

**Alternatives considered**: Smaller caps; rejected as unnecessarily restrictive for role-playing dimensions. No caps; rejected because it increases performance and UX risk without MVP value.

## Decision: Preserve workbench geometry and Connections behavior

**Rationale**: The Data Models builder must fit inside the current canvas frame and reuse the established workbench tree pattern. This reduces layout regression risk and protects the already implemented Connections feature.

**Alternatives considered**: Route-level redesign; rejected because the feature is explicitly a workbench option and visual regression risk is called out in the NFR plan.
