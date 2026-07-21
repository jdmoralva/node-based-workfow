# Data Model Builder Interface Design

**Date:** 2026-07-19  
**Status:** Approved design  
**Feature source:** `docs/nfr/CreditModeler Data Models Builder Multi-Phase Plan.md`  
**Implementation source:** `specs/008-data-models-builder/`

## Context

The current `DataModelBuilder` proves the basic workbench integration and API flow, but it is not yet the planned modeling workspace. It supports one selected connection, one fact table, one dimension, hard-coded keys and aliases, and one unnamed rule expression. It cannot represent the complete persisted `model_json` shape or make model completeness understandable.

This design replaces that compact form with a full guided modeling canvas while preserving the existing CreditModeler route, object tree, canvas geometry, backend contracts, and visual language.

## Goals

- Let a user configure the complete planned model shape: details, up to 5 sources, one fact table, up to 25 repeated dimension aliases, direct relationships with composite keys, and up to 50 business rules.
- Keep model structure, completeness, diagnostics, and compile-only limitations visible while editing.
- Support new, saved, stale, failed, tested, and missing-source states without losing configuration.
- Keep draft save easy: a valid unique name remains the only requirement for the initial save.
- Make the full workspace usable without horizontal page scrolling on desktop and narrow viewports.
- Preserve dynamic Data Models tree behavior and existing Connections behavior.

## Non-Goals

- No graph-based node editing.
- No snowflake relationship editing.
- No measures, profiling, row counts, sample rows, cardinality analysis, fanout analysis, analytical execution, or materialization.
- No route-level shell redesign.
- No changes to the immutable-name or latest-save-wins behavior.

## Product Intent

The primary user is an internal credit-modeling analyst assembling a strict analytical star schema from trusted saved SQLite connections. The interface should feel like a precise modeling workbench: dense enough for expert configuration, calm enough to expose dependencies, and explicit about what is incomplete or untested.

Domain concepts include source catalogs, schema objects, grains, aliases, keys, joins, derived expressions, star topology, compiler diagnostics, and model health.

The visual color world uses the existing drafting-paper white, graphite text, database steel, and CreditModeler violet, with semantic amber, green, and muted red reserved for warnings, tested states, and errors. The signature element is the combination of a live star map and a model-health rail that remains visible beside the editable definition.

The design explicitly avoids three generic patterns:

- Equal card grids that flatten the editing hierarchy.
- Wizard steps that hide cross-section dependencies.
- Generic database-admin tables with no model topology or completeness context.

## Approved Layout

Use a guided canvas inside the existing workbench canvas panel.

### Header

The header contains:

- `Analytical data model` eyebrow.
- Current model name, or `New data model` in create mode.
- A visible `Name locked` indicator for existing models.
- Description or short modeling context.
- Current status badge and completeness count.
- Last-tested or edited recency when available.

Status styling is semantic rather than decorative:

- `draft`: amber with a gap count when known.
- `untested`: neutral violet-gray.
- `tested`: restrained green.
- `failed`: muted red.
- `stale`: amber with a stale explanation.

### Model Health Strip

A compact four-cell strip below the header shows:

- Sources: current count of 5.
- Dimensions: current count of 25.
- Business rules: current count of 50.
- Model health: complete, or current actionable gap count.

Counts use tabular numerals. The strip is a quick orientation device, not a dashboard of decorative metrics.

### Main Editing Column

The main column uses numbered progressive sections. This is not a wizard: users can expand multiple sections and move directly between them.

1. Model details
2. Source connections
3. Fact table
4. Dimensions
5. Relationships
6. Business rules

Each collapsed header shows a concise summary and a section state such as `Complete`, `2 configured`, `1 incomplete`, or `Schema unavailable`. Diagnostics can open and focus the relevant section.

### Inspector Column

The desktop inspector remains sticky within the canvas scroll container and contains:

- A readable live star map showing the fact alias, all dimension aliases, direct relationships, and join types.
- Structured diagnostics grouped by errors and warnings.
- A permanent compile-only limitation note.

The preview is derived from the current in-memory draft and never displays generated SQL, paths, rows, counts, or profiling data.

### Action Bar

The action bar remains visible at the bottom of the builder content:

- `Drop model` is isolated on the left in existing mode only.
- Dirty/saved feedback appears near the primary actions.
- `Test model` is always available unless another action is submitting.
- `Save draft` or `Save changes` is the primary action.

Drop requires confirmation and clearly states that connections and source files are not deleted.

## Section Behavior

### Model Details

- New model names are editable.
- Saved model names are read-only.
- Description remains editable.
- Save is disabled only when the name is blank or an action is already submitting.

### Source Connections

- Sources are selected only from owned saved SQLite Connections.
- Each row shows connection label, editable model alias, current role, and remove action.
- `Add source connection` is disabled at 5 sources.
- Selecting a source starts safe schema metadata loading for that connection.
- A source used by the fact table or a dimension cannot be removed without a clear confirmation or dependency diagnostic.
- Missing sources remain visible as repair rows rather than disappearing.

### Fact Table

- The user selects a configured source, then a table or view from that source.
- The user edits the fact alias and optional grain.
- Primary keys use a column multi-select and support composite keys.
- Object type is derived from schema metadata and displayed, not manually entered.
- Changing source or table preserves compatible selections and clearly marks incompatible keys or relationships for repair.

### Dimensions

- Dimensions are repeatable items with stable frontend-generated `dim_` IDs.
- Each item selects source, table or view, alias, and one or more primary-key columns.
- The same schema object can be added multiple times when aliases differ.
- Removing a dimension also removes or explicitly confirms removal of its relationship; business rules that referenced its alias are preserved and marked invalid.
- `Add dimension` is disabled at 25 dimensions.

### Relationships

- Every dimension is related directly to the singleton fact table by stable dimension identity.
- Each relationship has a stable frontend-generated `rel_` ID.
- Join type is `left` by default and can be changed to `inner`.
- Inner joins display a persistent warning that fact rows may be filtered.
- Key pairs are repeatable and compile as `AND`.
- Fact-column and dimension-column choices come from their selected schema objects.
- A relationship cannot target another dimension.

### Business Rules

- Rules are repeatable items with stable frontend-generated `rule_` IDs.
- Each item has editable name, expression, and output type.
- The expression editor shows available fact and joined-dimension aliases without exposing sample data.
- Invalid rules stay in the draft and display their diagnostic rather than being deleted.
- Alias edits preserve relationship identity and cascade qualified rule references through the parser-backed rewrite behavior required by the active feature specification.
- `Add business rule` is disabled at 50 rules.

## State And Data Flow

`DataModelBuilder` owns one complete in-memory `DataModelDefinition` draft rather than parallel fact, dimension, and rule form states.

1. On mount, load saved Connections.
2. In existing mode, load the saved model and hydrate the complete draft without replacing its stable IDs.
3. Load schema metadata lazily for referenced or newly selected connections.
4. Cache schema request state by connection ID so repeated dimensions do not trigger duplicate requests.
5. Apply all edits immutably to the draft and mark the builder dirty.
6. Derive section summaries, capacity counts, star preview, and client-known completeness gaps from the draft.
7. Treat backend validation and test diagnostics as authoritative.

New item IDs use `crypto.randomUUID()` with the required `dim_`, `rel_`, or `rule_` prefix. IDs never change during alias, source, or table edits.

### Test Semantics

`Test model` always represents the definition currently visible in the builder.

- New or dirty definitions use `POST /api/data-models/test` and display draft-only results without claiming that saved status or timestamps changed.
- A clean saved definition uses `POST /api/data-models/{model_id}/test`, which persists status, diagnostics, and timestamps.
- A successful draft-only test displays `Draft test passed` with an explanation that saving and retesting persists the tested status.
- Test remains available for incomplete drafts and renders structured completeness diagnostics.

This prevents the current risk of testing an older persisted definition while unsaved edits are visible.

### Save Semantics

- New mode creates a model and switches to existing mode without leaving the canvas.
- Existing mode updates the full draft.
- Saving a changed complete model produces the backend-derived `stale` status.
- Saving an incomplete model produces `draft`.
- Stored diagnostics remain visible and stale when returned by the backend.
- Successful saves update the dynamic Data Models tree immediately.

## Loading, Error, And Repair States

Loading is localized so unrelated editing remains usable:

- Builder hydration uses a full canvas loading state because no safe draft exists yet.
- Connection list loading affects source selectors only.
- Schema loading affects selectors for that connection only.
- Action buttons use explicit busy labels and prevent duplicate submission.

Feedback is announced through a single `aria-live="polite"` region. Diagnostics remain in their structured panel and are not reduced to generic toast text.

Errors and warnings include an actionable message and, where a section location is available, a control that expands and focuses that section. Safe API messages are used; generated SQL, paths, stack traces, raw driver errors, rows, and profiling details are never rendered.

Missing Connection diagnostics produce an inline repair flow:

- The missing reference remains visible with its prior alias and usage.
- The user selects a replacement owned saved Connection.
- Table names, aliases, relationships, and rules are preserved where possible.
- Repaired schema references are revalidated and incompatible fields remain visible as actionable diagnostics.

## Responsive Behavior

- The workbench shell, object tree, and route geometry do not change.
- The builder scrolls within the existing canvas panel.
- At narrower canvas widths, the inspector stacks below the editor sections.
- Health cells wrap into two columns and then one column as needed.
- Section field grids become one column.
- Repeatable table-like rows become labeled stacked cards rather than overflowing horizontally.
- The action bar wraps while keeping `Test model` and `Save` reachable.
- All interactive targets remain at least 40 pixels high, with 44 pixels preferred where geometry permits.

## Visual System

The interface continues to use the existing Barlow typography and Risk Viewer tokens. The builder introduces no second design system.

- Density: 4-pixel base with 12-16 pixel control-zone padding and 18-24 pixel section separation.
- Depth: quiet borders and subtle surface shifts; only the active section and primary action receive restrained shadow.
- Controls: slightly inset neutral backgrounds, clear focus rings, and consistent 8-10 pixel radii.
- Hierarchy: weight and text tone do more work than size; section names and values lead, labels and metadata recede.
- Color: existing violet is the sole structural accent; semantic colors are reserved for status and diagnostics.

## Component Boundaries

Keep orchestration in `DataModelBuilder`, but move repeatable domain editors into focused components once implementation begins:

- `DataModelBuilder`: loading, draft ownership, dirty state, API actions, and workbench callbacks.
- `DataModelHeader`: title, immutable-name state, status, recency, and health counts.
- `DataModelSection`: shared progressive-section shell and focus behavior.
- `DataModelSourcesSection`: source rows, aliases, loading, and repair entry points.
- `DataModelFactSection`: fact source, schema object, alias, grain, and key selection.
- `DataModelDimensionsSection`: repeatable dimension editors.
- `DataModelRelationshipsSection`: join type and repeatable key-pair editors.
- `DataModelRulesSection`: repeatable rule editors and invalid-rule states.
- `DataModelInspector`: star preview, diagnostics, and compile-only warning.
- `DataModelActionBar`: dirty state and test/save/drop actions.

Shared draft mutations and completeness derivation should be pure functions with unit coverage. Do not introduce a global store for this isolated canvas workflow.

## Accessibility

- Use native form controls and buttons.
- Give every editor and repeatable item a programmatic label.
- Use fieldsets and legends where controls form a fact, dimension, relationship, or rule group.
- Use `aria-expanded` on progressive sections.
- Announce loading and action feedback without moving focus unexpectedly.
- Move focus to the first invalid control only when the user activates a diagnostic link.
- Preserve visible focus indicators and keyboard access for add, remove, expand, test, save, repair, and drop actions.

## Verification Strategy

Follow test-driven development for behavior changes.

### Unit And Component Coverage

- Blank builder and name-only draft save.
- Existing immutable name and complete definition hydration.
- Add/remove sources with capacity enforcement.
- Lazy schema loading and per-connection cache behavior.
- Fact table, object type, grain, and composite primary-key editing.
- Repeated dimensions using the same table with different aliases.
- Add/remove relationships and repeatable composite key pairs.
- Default left join and persistent inner-join warning.
- Add/remove business rules and preservation of invalid rules.
- Stable IDs after all non-identity edits.
- Draft-only test behavior versus clean saved-model persisted test behavior.
- Stale diagnostics after save.
- Missing-source repair with preserved configuration.
- Drop confirmation and tree removal.

### Browser Coverage

- Full create, configure, test, save, reopen, edit, stale, repair, retest, and drop flow.
- Sticky inspector and canvas-contained scrolling at desktop geometry.
- Stacked sections, readable repeatable rows, and reachable actions on narrow viewports.
- No horizontal page scrolling.
- Existing Connections builder regression coverage.

### Verification Commands

From `apps/web`:

```powershell
npm run test
npm run lint
npm run test:visual:desktop
```

Run focused tests during red-green-refactor cycles before the complete frontend verification commands.

## Implementation Constraints

- Preserve the existing `/creditmodeler-service` route and `Workbench` composition.
- Reuse the existing API base URL and credential behavior.
- Do not expose sensitive backend details in new feedback UI.
- Do not change Connections behavior while extending Data Models.
- Do not hand-roll non-native interaction primitives when an existing project primitive or native control fits.
- Keep the implementation focused on the approved interface and required full model editing; do not add measures, graph manipulation, profiling, or materialization.
