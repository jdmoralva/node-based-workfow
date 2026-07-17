# Feature Specification: CreditModeler Connections Builder

**Feature Branch**: `007-connections-builder`

**Created**: 2026-07-16

**Status**: Draft

**Input**: User description: `@docs/nfr/CreditModeler Connections Builder Multi-Phase Plan.md`

## Clarifications

### Session 2026-07-16

- Q: How should saved connection label uniqueness treat capitalization and surrounding whitespace? → A: Unique per user, case-insensitive after trimming whitespace.
- Q: Which database files are selectable in this stage? → A: Files ending in `.db`, `.sqlite`, or `.sqlite3`, discovered recursively under the approved datasets area.
- Q: What information may the connection test reveal? → A: The test may only report whether the selected database can be opened and minimally queried; it must not reveal table names, column names, schema details, dataset contents, or variables.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a reusable database connection (Priority: P1)

A signed-in credit risk manager opens the CreditModeler workbench, selects `Connections`, chooses an available `.db`, `.sqlite`, or `.sqlite3` database file from the approved datasets area, validates that it can be opened, and saves it under a memorable connection label.

**Why this priority**: Creating a trusted, reusable connection is the foundation for later data-loading workflows. Without this, users cannot prepare data sources for credit modelling work.

**Independent Test**: Can be fully tested by signing in, opening the workbench, creating one new connection from a discovered database option, testing it, saving it, and verifying it appears under `Connections` for that same user.

**Acceptance Scenarios**:

1. **Given** a signed-in credit risk manager and at least one available database file, **When** the user selects `Connections`, enters a unique label, selects a database, tests it successfully, and saves, **Then** the connection is stored for that user and appears as a child item under `Connections`.
2. **Given** a signed-in credit risk manager, **When** the user attempts to save a new connection without a label or without selecting a database, **Then** the user sees a clear validation message and no connection is saved.
3. **Given** a signed-in credit risk manager already has a saved connection label, **When** the user attempts to create another connection with the same label using different capitalization or surrounding whitespace, **Then** the user sees a duplicate-label message and the existing connection remains unchanged.

---

### User Story 2 - Reopen and update an existing connection (Priority: P2)

A signed-in credit risk manager selects a saved connection from the workbench tree, reviews its details, tests it again, and updates the selected database while keeping the original connection label stable.

**Why this priority**: Users need to correct or redirect saved connection metadata without creating confusing duplicate labels or losing the reference that future workflows will depend on.

**Independent Test**: Can be tested by opening an existing connection, confirming the label cannot be edited, changing the selected database to another available option, saving, reopening the connection, and verifying the new selection persists.

**Acceptance Scenarios**:

1. **Given** a signed-in credit risk manager has a saved connection, **When** the user selects that connection under `Connections`, **Then** the canvas shows the saved connection details with the label visible and non-editable.
2. **Given** a saved connection is open, **When** the user selects a different available database and saves, **Then** the saved connection is updated in place, still appears under the same label, and preserves the previous latest successful test time until the user runs another successful saved-connection test.
3. **Given** a saved connection is open, **When** the user tests it successfully, **Then** the user sees success feedback and the connection records the latest successful test time.

---

### User Story 3 - Drop a saved connection safely (Priority: P3)

A signed-in credit risk manager removes a saved connection from their workbench when it is no longer needed, with confirmation that only the saved connection entry will be removed and source data files will remain untouched.

**Why this priority**: Users need safe cleanup of obsolete connection metadata without risking accidental deletion of dataset files.

**Independent Test**: Can be tested by opening a saved connection, choosing `Drop`, cancelling once to verify no deletion occurs, then confirming drop and verifying the connection label disappears while the source database remains available for future selection.

**Acceptance Scenarios**:

1. **Given** a saved connection is open, **When** the user selects `Drop`, **Then** the user must confirm the action before the connection is removed.
2. **Given** the drop confirmation is shown, **When** the user cancels, **Then** the saved connection remains unchanged and visible under `Connections`.
3. **Given** the drop confirmation is shown, **When** the user confirms, **Then** the saved connection metadata is removed from the workbench and the underlying database remains available if it still exists in the approved datasets area.

---

### Edge Cases

- When no `.db`, `.sqlite`, or `.sqlite3` files are available in the approved datasets area, the builder shows an empty state explaining that there are no supported database files to select.
- When a database file is removed after a connection was saved, opening or testing that connection shows a clear failure message without removing or changing the saved connection automatically.
- When a database file cannot be opened or validated, testing fails with a user-readable message and does not mark the connection as successfully tested.
- When a user is not signed in, connection discovery, creation, testing, updates, and deletion are unavailable.
- When two signed-in users choose the same connection label in their own accounts, both can save their own connections independently.
- When a user enters leading or trailing spaces in a connection label, uniqueness is evaluated after trimming those spaces.
- When a saved connection belongs to another user, it is not visible, openable, updateable, testable, or droppable by the current user.
- When available database labels are displayed, file extensions are omitted so users see concise business-oriented names.
- When supported database files exist in nested folders, the builder includes enough relative folder context in labels to distinguish files with the same base name.
- When connection lists refresh after save, update, or drop, existing non-connection workbench tree behavior remains stable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a signed-in credit risk manager to open a connection builder from the `Connections` item in the CreditModeler workbench.
- **FR-002**: The system MUST show a blank connection builder when the user selects the top-level `Connections` item.
- **FR-003**: The system MUST show saved connections as child items under `Connections` for the current signed-in user.
- **FR-004**: The system MUST prevent users from seeing, opening, updating, testing, or dropping another user's saved connections.
- **FR-005**: The system MUST recursively discover `.db`, `.sqlite`, and `.sqlite3` files from the approved datasets area and present only those files as selectable options.
- **FR-006**: The system MUST display database option labels without `.db`, `.sqlite`, or `.sqlite3` extensions while retaining enough relative folder context to distinguish files in different folders.
- **FR-007**: The system MUST prevent users from manually entering database file paths.
- **FR-008**: The system MUST reject unknown, empty, absolute, or traversal-style database locations.
- **FR-009**: The system MUST allow users to create a new saved connection with a non-empty label and one selected available database.
- **FR-010**: The system MUST require saved connection labels to be unique within a user's own account after trimming surrounding whitespace and ignoring capitalization.
- **FR-011**: The system MUST allow different users to use the same connection label independently.
- **FR-012**: The system MUST keep a saved connection label immutable after creation.
- **FR-013**: The system MUST allow users to update the selected database for an existing saved connection without changing the connection label or clearing the previous latest successful test time.
- **FR-014**: The system MUST provide a test action for a selected database before saving a new connection.
- **FR-015**: The system MUST provide a test action for an existing saved connection.
- **FR-016**: The system MUST clearly show test success or failure feedback to the user.
- **FR-017**: The system MUST record the latest successful test time only when an existing saved connection test succeeds; updating the selected database without a successful saved-connection test MUST leave the previous latest successful test time unchanged.
- **FR-018**: The system MUST NOT expose table names, column names, schema details, dataset contents, or variables as part of this feature.
- **FR-019**: The system MUST allow users to drop saved connection metadata only after explicit confirmation.
- **FR-020**: The system MUST NOT delete source database files when a user drops a saved connection.
- **FR-021**: The system MUST refresh the visible connection list after successful create, update, or drop actions.
- **FR-022**: The system MUST display clear feedback for loading, validation, save success, save failure, drop success, and drop failure states.
- **FR-023**: The system MUST remove static example connection labels from the user-facing workbench tree once dynamic saved connections are available.
- **FR-024**: The system MUST preserve existing workbench navigation, expand/collapse behavior, and canvas behavior for non-connection items.

### Key Entities *(include if feature involves data)*

- **Saved Connection**: A user-owned reusable reference to an available database file, including a stable label, fixed local-file database type, selected database reference, creation time, update time, and latest successful test time.
- **Database Option**: A selectable `.db`, `.sqlite`, or `.sqlite3` file discovered from the approved datasets area, shown to users with a concise extensionless display label and used internally as a stable relative file reference.
- **Signed-In User**: The authenticated workbench user who owns saved connections and can only manage their own connection metadata.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of users can create, test, and save a new connection from an available database in under 2 minutes during usability testing.
- **SC-002**: 100% of saved connections are visible only to the user who created them during access-control testing.
- **SC-003**: 100% of drop actions require confirmation and remove only the saved connection entry, not the source database file, during acceptance testing.
- **SC-004**: 95% of successful save, update, test, and drop actions show visible user feedback within 2 seconds during local acceptance verification with the backend and frontend running on the same development machine and using local SQLite dataset files.
- **SC-005**: 100% of invalid database selections, unsupported file types, duplicate labels, missing labels, missing database selections, and failed tests produce clear user-facing error messages during validation testing.
- **SC-006**: 0 table names, column names, schema details, dataset contents, or variables are exposed by this feature during feature-scope testing.

## Assumptions

- Users are already authenticated before accessing the CreditModeler workbench.
- The first release supports one fixed local-file database type; support for additional database types is outside this feature.
- Source database files are managed outside this feature and are already placed in the approved datasets area by an authorized process.
- Creating, editing, or deleting source database files is outside this feature.
- Loading tables, variables, model inputs, or dataset previews is outside this feature and will be handled by later work.
- Saved connection metadata is retained until the owning user drops it or an administrator removes the user's account data through a separate process.
- Existing workbench visual layout and navigation patterns remain the baseline experience.
