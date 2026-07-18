# Feature Specification: CreditModeler Data Models Builder

**Feature Branch**: `main`

**Created**: 2026-07-18

**Status**: Draft

**Input**: User description: "@docs/nfr/CreditModeler Data Models Builder Multi-Phase Plan.md"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Build and Test a Data Model (Priority: P1)

As an internal CreditModeler user, I want to open the Data Models workspace, choose saved source connections, define a strict star-schema model, and test whether the model definition compiles before I save or rely on it.

**Why this priority**: This is the core value of the feature: users can consolidate saved SQL sources into a reusable analytical model without running analytical workloads or exposing source internals.

**Independent Test**: Can be fully tested by opening Data Models, selecting saved SQLite connections, configuring one fact table, one or more directly joined dimensions, optional row-level business rules, and running Test to receive structured success, warnings, or errors.

**Acceptance Scenarios**:

1. **Given** an authenticated internal user has at least two saved SQLite connections, **When** the user opens Data Models and configures a complete star schema with a valid fact table, dimension, relationship, join keys, and business rule, **Then** the user can run Test and receive a successful compilation result with any applicable warnings.
2. **Given** a model has missing join keys, unknown columns, unsupported business rule syntax, or inaccessible sources, **When** the user runs Test, **Then** the system returns structured, safe diagnostics that explain what must be fixed without exposing generated queries, file locations, stack traces, or raw driver errors.
3. **Given** a user chooses an inner join, **When** the relationship is shown or tested, **Then** the workspace displays a warning that inner joins can filter fact rows.

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
- A saved source exposes SQLite system objects or hidden internals.
- A selected source contains views as well as tables.
- A dimension is reused with different aliases for role-playing use cases.
- A dimension relationship uses multiple key pairs.
- A relationship attempts to connect a dimension to another dimension instead of directly to the fact table.
- A model includes non-empty measures even though measure computation is not part of this release.
- A test fails after previous success; the prior successful test timestamp must remain distinguishable from the latest failed test.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a Data Models workspace from the CreditModeler service workbench.
- **FR-002**: The system MUST show saved data models as dynamic child items under Data Models and remove static example child items from that menu.
- **FR-003**: The system MUST allow authenticated internal users to create a new data model with a valid unique name and optional description.
- **FR-004**: The system MUST allow draft data models to be saved with only a valid name.
- **FR-005**: The system MUST prevent users from changing a data model name after creation.
- **FR-006**: The system MUST enforce case-insensitive, trimmed-name uniqueness for data models owned by the same user.
- **FR-007**: The system MUST restrict data model sources to saved SQLite connections owned by the current user.
- **FR-008**: The system MUST allow users to inspect source metadata needed for modeling, limited to connection label, tables, views, columns, declared column types, nullable indicators when available, and primary-key indicators.
- **FR-009**: The system MUST NOT expose sample rows, row counts, distinct counts, profiling metrics, generated query text, filesystem paths, system objects, stack traces, or raw database errors through the modeling workflow.
- **FR-010**: The system MUST support exactly one fact table for each testable data model.
- **FR-011**: The system MUST support a strict star schema where each dimension joins directly to the fact table.
- **FR-012**: The system MUST reject snowflake relationships between dimensions.
- **FR-013**: The system MUST allow dimensions to repeat when each repeated use has a distinct editable alias.
- **FR-014**: The system MUST allow one relationship per dimension alias.
- **FR-015**: The system MUST support single-column and composite relationship keys.
- **FR-016**: The system MUST support left and inner joins, default new relationships to left joins, and warn users when inner joins are used.
- **FR-017**: The system MUST allow editable source aliases, fact aliases, dimension aliases, and business rule names.
- **FR-018**: The system MUST automatically update relationships and business rule references when aliases are edited, preserving user intent where expressions can be safely rewritten.
- **FR-019**: The system MUST support row-level business rules using constrained SQL-like expressions with column references, literals, arithmetic, comparisons, boolean logic, case expressions, and approved scalar functions.
- **FR-020**: The system MUST reject unsafe or unsupported business rule content, including comments, semicolons, full statements, subqueries, data-changing operations, schema-changing operations, window logic, unknown functions, unknown aliases, and unknown columns.
- **FR-021**: The system MUST preserve invalid business rules and mark them invalid with diagnostics instead of automatically deleting them.
- **FR-022**: The system MUST reject non-empty measures for this release while preserving an explicit empty measures area for future extension.
- **FR-023**: The system MUST let users test unsaved and saved data model definitions for compilation without executing analytical workloads, profiling data, computing measures, or materializing modeled datasets.
- **FR-024**: The system MUST return structured test results containing success state, safe errors, and safe warnings.
- **FR-025**: The system MUST warn users that the test validates compilation only and does not prove row retention, fanout, unmatched dimensions, or cardinality correctness.
- **FR-026**: The system MUST persist the latest saved-model test status, test timestamps, structured errors, structured warnings, and whether diagnostics are stale.
- **FR-027**: The system MUST classify saved data models as draft, untested, tested, failed, or stale according to current completeness, latest test outcome, edits, and referenced source changes.
- **FR-028**: The system MUST mark diagnostics stale when a saved model is edited after its latest test.
- **FR-029**: The system MUST keep saved data models visible when referenced connections are deleted or changed, and report repairable diagnostics when the model is opened or tested.
- **FR-030**: The system MUST allow users to replace missing referenced connections while preserving table names, aliases, relationships, and business rules where possible.
- **FR-031**: The system MUST allow users to list all saved data models and optionally filter by one current status.
- **FR-032**: The system MUST allow users to read, update, test, and drop only data models they own.
- **FR-033**: The system MUST show clear user feedback for loading, validation, test success, test failure, save success, save failure, drop success, drop failure, missing connections, stale diagnostics, and draft completeness gaps.
- **FR-034**: The system MUST render a readable star-schema preview of the current fact table, dimensions, relationships, aliases, and business rules.
- **FR-035**: The system MUST keep the Data Models builder within the existing CreditModeler workbench layout and remain usable on desktop and narrow viewports.

### Key Entities *(include if feature involves data)*

- **Analytical Data Model**: A user-owned saved modeling asset with immutable name, editable description, status, latest diagnostics, timestamps, and the current star-schema definition.
- **Source Connection Reference**: A reference from a data model to a saved SQLite connection owned by the user, including an editable modeling alias.
- **Fact Table**: The single central table or view that defines the analytical grain and joins to all dimensions.
- **Dimension**: A table or view that enriches the fact table and may be reused through distinct aliases.
- **Relationship**: A direct fact-to-dimension join definition with join type and one or more key pairs.
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

## Assumptions

- Users are authenticated internal CreditModeler users with access to the existing workbench.
- Saved Connections already exist as a user-owned feature and provide the only source selection path for this release.
- The first release is intentionally limited to saved SQLite connections and strict star-schema compilation checks.
- The test action validates model compilation only; analytical execution, materialization, profiling, measure computation, and quality analysis are future capabilities.
- Data model names are user-facing identifiers and become immutable after creation to preserve tree navigation and saved-model identity.
- Source metadata is the latest available metadata from referenced saved connections when the model is opened or tested.
- Security and privacy defaults favor safe diagnostics and non-disclosure of generated queries, internal locations, and low-level errors.
