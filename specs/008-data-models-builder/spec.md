# Feature Specification: CreditModeler Data Models Builder

**Feature Branch**: `main`

**Created**: 2026-07-18

**Status**: Draft

**Input**: User description: "@docs/nfr/CreditModeler Data Models Builder Multi-Phase Plan.md"

## Clarifications

### Session 2026-07-18

- Q: How should the system handle concurrent edits to the same saved data model? → A: Last save wins; no merge or conflict prompt.
- Q: What MVP complexity caps should apply to a single data model? → A: Up to 5 sources, 25 dimensions, and 50 business rules.
- Q: Should Test remain available for incomplete draft models? → A: Test stays clickable for incomplete drafts.

### Session 2026-07-21

- Q: What relationship topology replaces the original one-level relationship limitation? → A: A rooted, acyclic dimensional tree in which every dimension has exactly one path to the fact root.
- Q: How are existing saved definitions preserved? → A: A single backend storage-read boundary deterministically normalizes legacy definitions to schema version 2; public writes accept version 2 only.
- Q: How should declared foreign keys affect the draft? → A: They appear in a review-first suggestion queue and never change the draft until the user confirms them.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Build and Test a Data Model (Priority: P1)

As an internal CreditModeler user, I want to open the Data Models workspace, choose saved source connections, define a rooted dimensional model, and test whether the model definition compiles before I save or rely on it.

**Why this priority**: This is the core value of the feature: users can consolidate saved SQL sources into a reusable analytical model without running analytical workloads or exposing source internals.

**Independent Test**: Can be fully tested by opening Data Models, selecting saved SQLite connections, configuring one fact root and a connected tree of dimensions, optional row-level business rules, and running Test to receive structured success, warnings, or errors.

**Acceptance Scenarios**:

1. **Given** an authenticated internal user has at least two saved SQLite connections, **When** the user opens Data Models and configures a complete rooted tree with a valid fact table, dimensions, relationships, join keys, and business rule, **Then** the user can run Test and receive a successful compilation result with any applicable warnings.
2. **Given** a model has missing join keys, unknown columns, unsupported business rule syntax, or inaccessible sources, **When** the user runs Test, **Then** the system returns structured, safe diagnostics that explain what must be fixed without exposing generated queries, file locations, stack traces, or raw driver errors.
3. **Given** a user chooses an inner join, **When** the relationship is shown or tested, **Then** the workspace displays a path-specific warning that the join can filter the fact root through that path.

---

### User Story 2 - Save, Reopen, Update, and Drop Data Models (Priority: P2)

As an internal CreditModeler user, I want to save data model drafts and completed models, reopen them from the workbench tree, update their configuration, retest them, and drop models I no longer need.

**Why this priority**: Persisted model management makes the workspace reusable and aligns Data Models with the existing Connections workbench pattern.

**Independent Test**: Can be tested by saving a draft with only a valid name, confirming it appears under Data Models, reopening it, updating configuration, saving, retesting, and dropping it with confirmation.

**Acceptance Scenarios**:

1. **Given** a user enters a valid unique model name and no complete schema configuration, **When** the user saves, **Then** the model is saved as a draft and appears as a child item under Data Models.
2. **Given** a saved model exists, **When** the user opens it from the Data Models child list, **Then** the builder loads the saved configuration, displays the model name as read-only, and allows editable configuration fields to be changed.
3. **Given** a user edits a saved model after its latest test, **When** the user saves those edits, **Then** previous diagnostics remain visible but are marked stale and the model status reflects whether it is incomplete or needs retesting.
4. **Given** a saved model is no longer needed, **When** the user confirms Drop, **Then** the model is removed from the saved list and no longer appears under Data Models.

---

### User Story 3 - Repair Models When Connections Change (Priority: P3)

As an internal CreditModeler user, I want saved data models to remain visible and repairable when referenced connections are changed or deleted, so prior modeling work is not lost.

**Why this priority**: Connection lifecycle changes are likely in a modeling workspace, and preserving recoverable work reduces rework and user frustration.

**Independent Test**: Can be tested by saving a model, deleting or changing a referenced connection, reopening the model, observing missing-connection diagnostics, replacing the source, and confirming preserved configuration is revalidated.

**Acceptance Scenarios**:

1. **Given** a saved model references a connection that was deleted, **When** the user opens the model, **Then** the model remains visible and the builder reports missing-connection diagnostics.
2. **Given** a user replaces a missing connection, **When** the replacement is selected, **Then** table names, aliases, relationships, and business rules are preserved where possible and the model is marked for validation or retesting.
3. **Given** a business rule becomes invalid after a source change, **When** the model is reopened or tested, **Then** the invalid rule remains in the model and is marked with structured diagnostics instead of being silently deleted.

### Edge Cases

- A user tries to create two data models with names that differ only by case or leading/trailing spaces.
- A user attempts to rename an existing data model after creation.
- A user saves a draft with only a name and no selected sources.
- A user clicks Test on an incomplete draft and receives structured completeness diagnostics.
- A saved source exposes SQLite system objects or hidden internals.
- A selected source contains views as well as tables.
- A dimension is reused with different aliases for role-playing use cases.
- A dimension relationship uses multiple key pairs.
- A relationship connects one dimension to another while retaining exactly one path to the fact root.
- A relationship would create a self-link, cycle, duplicate endpoint pair, second parent, incoming edge to the fact, or disconnected branch.
- A legacy definition has no configured fact but still contains relationships, or a dimension ID collides with the preferred normalized fact ID.
- A declared foreign key omits referenced column names, points to a missing or system object, is self-referencing, or competes with another path to the same physical table.
- A deep relationship suggestion depends on unresolved prerequisite suggestions or becomes stale before batch acceptance.
- A model includes non-empty measures even though measure computation is not part of this release.
- A test fails after previous success; the prior successful test timestamp must remain distinguishable from the latest failed test.
- Two sessions save changes to the same data model; the latest save becomes the active model without merge or conflict prompts.
- A user tries to save or test a model that exceeds the MVP caps of 5 sources, 25 dimensions, or 50 business rules.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a Data Models workspace from the CreditModeler service workbench.
- **FR-002**: The system MUST show saved data models as dynamic child items under Data Models and remove static example child items from that menu.
- **FR-003**: The system MUST allow authenticated internal users to create a new data model with a valid unique name and optional description.
- **FR-004**: The system MUST allow draft data models to be saved with only a valid name.
- **FR-005**: The system MUST prevent users from changing a data model name after creation.
- **FR-006**: The system MUST enforce case-insensitive, trimmed-name uniqueness for data models owned by the same user.
- **FR-007**: The system MUST restrict data model sources to saved SQLite connections owned by the current user.
- **FR-008**: The system MUST allow users to inspect source metadata needed for modeling, limited to connection label, tables, views, columns, declared column types, nullable indicators when available, primary-key indicators, and safe grouped declared foreign-key identifiers and ordered column pairs.
- **FR-009**: The system MUST NOT expose sample rows, row counts, distinct counts, profiling metrics, generated query text, filesystem paths, system objects, stack traces, or raw database errors through the modeling workflow.
- **FR-010**: The system MUST support exactly one fact table for each testable data model.
- **FR-011**: The system MUST support a rooted, acyclic dimensional tree in which a configured dimension may join the fact or another configured dimension.
- **FR-012**: For a testable model, the fact MUST be the only root with no incoming relationship, every dimension MUST have exactly one incoming relationship and one path to the fact, and every configured table instance MUST be reachable from the fact.
- **FR-013**: The system MUST allow dimensions to repeat when each repeated use has a distinct editable alias.
- **FR-014**: The system MUST allow exactly one incoming relationship per connected dimension alias and MUST reject self-links, cycles, duplicate incoming edges, duplicate parent-child endpoint pairs, and relationships that point to unknown table-instance IDs.
- **FR-015**: The system MUST support single-column and composite relationship keys.
- **FR-016**: The system MUST support left and inner joins, default new relationships to left joins, and warn users when inner joins are used.
- **FR-017**: The system MUST allow editable source aliases, fact aliases, dimension aliases, and business rule names; nonblank fact and dimension SQL aliases MUST be trimmed and case-insensitively unique in one shared table-alias namespace.
- **FR-018**: Relationships MUST reference stable table-instance IDs rather than editable aliases. The system MUST update business rule references when fact or dimension aliases are edited only when every qualified reference can be mapped unambiguously; otherwise it MUST preserve the original expression and mark it invalid with diagnostics.
- **FR-019**: The system MUST support row-level business rules using constrained SQL-like expressions with column references, literals, arithmetic, comparisons, boolean logic, case expressions, and only these approved scalar functions: `abs`, `coalesce`, `ifnull`, `lower`, `ltrim`, `max`, `min`, `nullif`, `round`, `rtrim`, `substr`, `trim`, `upper`.
- **FR-020**: The system MUST reject unsafe or unsupported business rule content, including comments, semicolons, full statements, subqueries, data-changing operations, schema-changing operations, window logic, unknown functions, unknown aliases, and unknown columns.
- **FR-021**: The system MUST preserve invalid business rules and mark them invalid with diagnostics instead of automatically deleting them.
- **FR-022**: The system MUST reject non-empty measures for this release while preserving an explicit empty measures area for future extension.
- **FR-023**: The system MUST test dirty or new drafts only through the unsaved-test operation with a version-2 definition body, and MUST test a saved model only through the saved-model test operation with no definition body and against the current canonical saved definition.
- **FR-024**: The system MUST return structured test results containing success state, safe errors, and safe warnings.
- **FR-025**: The system MUST warn users that the test validates compilation only and that multi-hop joins can introduce filtering, unmatched lookup values, fanout, or cardinality problems that compilation does not measure.
- **FR-026**: The system MUST keep Test available for incomplete drafts and return structured completeness diagnostics when required model sections are missing.
- **FR-027**: The system MUST persist the latest saved-model test status, test timestamps, structured errors, structured warnings, and whether diagnostics are stale.
- **FR-028**: The system MUST classify saved data models as draft, untested, tested, failed, or stale according to current completeness, latest test outcome, edits, and referenced source changes.
- **FR-029**: The system MUST mark diagnostics stale when a semantically changed canonical model is saved after its latest test; a normalization-only save of an unchanged legacy model MUST NOT stale diagnostics or alter test timestamps or status.
- **FR-030**: The system MUST keep saved data models visible when referenced connections are deleted or changed, and report repairable diagnostics when the model is opened or tested.
- **FR-031**: The system MUST allow users to replace missing referenced connections while preserving table names, table-instance IDs, aliases, relationships, and business rules where possible.
- **FR-032**: The system MUST allow users to list all saved data models and optionally filter by one current status.
- **FR-033**: The system MUST allow users to read, update, test, and drop only data models they own.
- **FR-034**: The system MUST show clear user feedback for loading, validation, test success, test failure, save success, save failure, drop success, drop failure, missing connections, stale diagnostics, and draft completeness gaps.
- **FR-035**: The system MUST render a readable rooted Model map of the in-memory draft, including paths, relationship health, and a separate repair group for disconnected configured tables, without exposing source data or generated SQL.
- **FR-036**: The system MUST keep the Data Models builder within the existing CreditModeler workbench layout and remain usable on desktop and narrow viewports.
- **FR-037**: If two sessions save changes to the same data model, the system MUST treat the latest successful save as the active model without merge or conflict prompts.
- **FR-038**: The system MUST limit each data model to no more than 5 source connections, 25 dimensions, and 50 business rules for this release.
- **FR-039**: Every newly created or updated model definition MUST use `schema_version: 2`, and every API response containing a model definition MUST return only the normalized version-2 shape.
- **FR-040**: The fact table and every dimension MUST have a stable table-instance ID; each relationship MUST have explicit `parent_table_id` and `child_table_id` endpoints, where parent is nearer the fact root, plus endpoint-neutral `parent_column` and `child_column` key fields.
- **FR-041**: On persisted storage reads only, the system MUST normalize definitions without `schema_version` as version 1 by adding version 2, selecting the first collision-free ID from `fact_root`, `fact_root_1`, and subsequent numeric suffixes, assigning it to the fact or a strict incomplete fact placeholder, translating implicit fact/dimension endpoints and key names, and preserving IDs, dimensions, aliases, sources, rules, measures, metadata, diagnostics, and status history.
- **FR-042**: Legacy normalization MUST be deterministic and idempotent, MUST rewrite stored JSON only on the next successful save, and MUST preserve the normalized placeholder fact ID when the user completes that placeholder.
- **FR-043**: Create, update, and unsaved-test requests MUST accept version 2 only. Unknown versions, mixed version-1/version-2 relationship fields, and a definition body sent to the saved-model test operation MUST be rejected.
- **FR-044**: Save MUST block unsupported or mixed versions, unknown core keys, cap violations, non-empty measures, duplicate IDs or aliases within their required namespaces, unknown relationship endpoints, incoming edges to the fact, self-links, cycles, duplicate incoming edges, and duplicate endpoint pairs.
- **FR-045**: Save MUST preserve repairable draft gaps, including an incomplete fact, missing source/object/key, a dimension without an incoming edge, a disconnected branch, or an unavailable schema column; Test MUST report every such gap as an error before compilation. Inner joins and compile-only limitations remain saveable warnings.
- **FR-046**: SQLite foreign-key inspection MUST group declarations by foreign-key ID and sequence, resolve omitted referenced columns against ordered primary-key columns only when cardinality and identity can be established safely, return concrete non-null identifiers only, and omit unsafe declarations. Views MUST return an empty foreign-key list unless a supported declared source becomes available.
- **FR-047**: Declared foreign keys MUST produce derived, same-connection, outbound local-to-referenced suggestions in breadth-first root-path order. Suggestions MUST be advisory, path-qualified, bounded to 25 edges and remaining dimension capacity, deterministic, cycle-safe, and excluded for self references, second parents, duplicate endpoints, unsafe objects, and declarations outside current safe metadata. Distinct alias paths to one physical table MUST remain distinct and require distinct accepted aliases. The UI MUST report cap omissions. A schema refresh MUST remove stale suggestions without deleting configured draft content.
- **FR-048**: A deep suggestion MUST include unresolved prerequisites; batch acceptance MUST take the prerequisite closure, revalidate it, and apply it atomically in root-first order or make no draft changes. No suggestion may alter or persist in the draft before explicit individual or batch confirmation.
- **FR-049**: Accepting a suggestion MAY create a new editable dimension instance and relationship or reuse one unconnected matching alias. Ambiguous matches MUST require a user choice; generated aliases and IDs MUST be stable and collision-free; a missing analytical primary key MUST remain a visible saveable gap.
- **FR-050**: Persisted relationship provenance MAY identify a structured current foreign-key declaration or manual origin, but the backend MUST NOT trust provenance for validation or compilation. Reopen and schema refresh MUST downgrade mismatched provenance to `Previously detected; verify` without deleting configuration.
- **FR-051**: Manual relationship controls MUST select a root-connected `From table` and an unparented configured `Joined table`, including across saved Connections, exclude immediately invalid endpoint choices, use endpoint-specific safe columns, default to left join, and support repeatable composite key pairs.
- **FR-052**: Relationship validation and compilation MUST be independent of relationship array order. Compilation MUST traverse from the fact root and order siblings by case-insensitive child alias, child table-instance ID, and relationship ID; equivalent permutations MUST produce equivalent diagnostic ordering.
- **FR-053**: Removing an intermediate edge MUST preserve its descendant branch as disconnected work. Removing a table MUST use an explicit atomic choice to preserve descendants for reattachment or remove its descendant closure; every edge touching a removed table MUST be removed while business rules remain repairable.
- **FR-054**: Removing a model source MUST compute one deduplicated impact set for all affected instances. The user MUST atomically choose to preserve unaffected other-source descendants as unparented work or remove affected descendant closures; removing a fact source's affected branches MUST identify that the entire connected tree will be removed. Cancelling MUST cause no partial mutation.
- **FR-055**: The Relationships section MUST use a review-first detected-join queue, path-oriented configured cards, and a keyboard-accessible manual flow. Cards MUST show the fact path, endpoint aliases, join health, keys, and provenance; endpoint changes MUST preserve compatible keys and visibly clear incompatible keys without substitution. On narrow viewports, suggestions and cards MUST precede the Model map and key rows MUST not cause horizontal page scrolling.
- **FR-056**: The Chinook acceptance model MUST use `InvoiceLine` as fact root and contain the eight left-join edges `InvoiceLine→Invoice→Customer→Employee`, `InvoiceLine→Track→Album→Artist`, `Track→Genre`, and `Track→MediaType`; all nine instances MUST have one root path, compile successfully, and discovery MUST NOT pull in `Playlist`, `PlaylistTrack`, or unrelated tables.
- **FR-057**: Clearing the fact MUST remove the fact and its touching relationships while preserving dimensions and dimension-to-dimension relationships as saveable disconnected work. Changing the fact MUST preserve configured tables and rules and revalidate all paths. A replacement fact MUST receive a new stable ID unless completing a normalized legacy placeholder.

### Key Entities *(include if feature involves data)*

- **Analytical Data Model**: A user-owned saved modeling asset with immutable name, editable description, status, latest diagnostics, timestamps, and a canonical version-2 rooted-tree definition.
- **Source Connection Reference**: A reference from a data model to a saved SQLite connection owned by the user, including an editable modeling alias.
- **Fact Table**: The stable-ID root table or view that defines the analytical grain.
- **Dimension**: A stable-ID table or view that enriches the root through exactly one incoming relationship and may be reused through distinct aliases.
- **Relationship**: A parent-to-child table-instance edge with join type and one or more endpoint-specific key pairs.
- **Relationship Suggestion**: Derived, non-persisted review state based on a safe declared foreign key and its proposed path to the fact.
- **Business Rule**: A named row-level derived expression evaluated against the fact and joined dimensions during compilation testing.
- **Diagnostic**: A structured warning or error produced by validation or test actions, safe for display to internal users.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90% of pilot users can save a draft data model with only a name in under 1 minute without assistance.
- **SC-002**: At least 85% of pilot users can configure and successfully test a valid one-fact, one-dimension model from existing saved connections in under 10 minutes.
- **SC-003**: 100% of failed tests return user-safe structured diagnostics and do not expose generated query text, filesystem paths, stack traces, or raw driver errors.
- **SC-004**: 100% of saved models remain visible after referenced connections are deleted, allowing users to identify and repair missing sources.
- **SC-005**: The Data Models workbench menu reflects create, update, and drop operations within one user interaction cycle without requiring a full page reload.
- **SC-006**: At least 95% of common validation mistakes in pilot testing produce a specific actionable message rather than a generic failure.
- **SC-007**: Existing Connections workbench behavior remains unchanged in regression testing while Data Models dynamic child items are introduced.
- **SC-008**: The builder remains usable on narrow viewports, with all primary actions and diagnostics accessible without horizontal page scrolling.
- **SC-009**: Users receive a clear validation message 100% of the time when a model exceeds the MVP caps of 5 sources, 25 dimensions, or 50 business rules.
- **SC-010**: The complete nine-instance, eight-edge Chinook acceptance tree compiles successfully when its relationship array is submitted in any order.
- **SC-011**: 100% of legacy version-1 saved definitions used in compatibility tests reopen as deterministic version-2 definitions without losing configuration, diagnostics, status, or timestamps.
- **SC-012**: No detected relationship changes a draft before confirmation, and a blocked batch acceptance leaves the draft unchanged in 100% of acceptance tests.

## Assumptions

- Users are authenticated internal CreditModeler users with access to the existing workbench.
- Saved Connections already exist as a user-owned feature and provide the only source selection path for this release.
- The release is intentionally limited to saved SQLite connections and rooted, acyclic dimensional-tree compilation checks rather than arbitrary graph modeling.
- The test action validates model compilation only; analytical execution, materialization, profiling, measure computation, and quality analysis are future capabilities.
- Data model names are user-facing identifiers and become immutable after creation to preserve tree navigation and saved-model identity.
- Source metadata is the latest available metadata from referenced saved connections when the model is opened or tested.
- Security and privacy defaults favor safe diagnostics and non-disclosure of generated queries, internal locations, and low-level errors.
