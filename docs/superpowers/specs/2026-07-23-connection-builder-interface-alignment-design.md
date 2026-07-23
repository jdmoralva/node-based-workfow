# Connection Builder Interface Alignment Design

**Date:** 2026-07-23  
**Status:** Approved design  
**Feature source:** `docs/nfr/CreditModeler Connections Builder Multi-Phase Plan.md`  
**Visual reference:** Current `DataModelBuilder` implementation and `docs/superpowers/specs/2026-07-19-data-model-builder-interface-design.md`

## Context

The Connection Builder supports the required create, test, save, reopen, update, and drop workflow, but its presentation is a sparse standalone form. The Data Models Builder now establishes the stronger CreditModeler workbench language: a status-oriented header, compact health context, progressive setup sections, inset controls, a supporting inspector, and a sticky action bar.

This design aligns the Connection Builder with that language while keeping the connection workflow proportionate to its three fields. It does not change API endpoints, persistence, workbench selection behavior, database discovery, validation rules, or connection ownership rules.

## Goals

- Make Connections and Data Models feel like parts of one CreditModeler workbench.
- Give connection setup one clear focal point without turning the simple form into a multi-step wizard.
- Expose connection readiness, test state, and the limited meaning of a connection test at a glance.
- Preserve the current create, saved, loading, empty, error, test, save, and drop workflow while correcting saved-hydration ordering, visible-selection testing, and unsafe action availability after load failures.
- Keep content scrolling inside the existing canvas and remain usable at narrow canvas widths.

## Non-Goals

- No backend, API contract, route, persistence, or database-discovery changes.
- No schema inspection, table or column preview, profiling, sample rows, or connection monitoring.
- No new editable fields or additional save requirements.
- No workbench shell, object tree, or canvas geometry changes.
- No generic dashboard metrics or decorative cards unrelated to connection setup.

## Product Intent

The primary user is a credit-modeling analyst registering a trusted SQLite source before using it in an analytical data model. The task is to name the source, select a discovered database, verify access, and save reusable metadata. The interface should feel precise, calm, and operational rather than promotional.

Domain concepts include saved source identity, SQLite driver, discovered database catalog, access verification, immutable labels, reusable connection metadata, and connection readiness.

The color world remains the established drafting-paper white, graphite text, database steel, and CreditModeler violet. Semantic amber, green, and muted red communicate untested, successful, and failed states. The connection-specific signature is a compact readiness checklist paired with the same health-and-action hierarchy used by Data Models.

The design rejects three defaults:

- A large empty form floating directly on the canvas.
- A literal miniature of the six-section Data Models workflow.
- Decorative database administration panels that imply unsupported monitoring or schema inspection.

## Approved Direction

Use a focused workbench layout. It carries over the Data Models visual hierarchy but scales it to one setup section and one narrow readiness panel.

### Header

The white header contains:

- `SQLite connection` eyebrow.
- `New database connection` in create mode or the immutable saved label in existing mode.
- `Name locked` beside a saved label.
- A short explanation: register a trusted SQLite source, verify access, and make it available to data models.
- A status badge derived from existing frontend and API state.
- Supporting text indicating `Unsaved connection` or `Saved connection`.

Status badges are semantic:

- `Untested`: no successful test is known for the currently selected database in the current component state.
- `Testing`: a test request is in flight.
- `Tested`: the latest test for the current selection succeeded, or the loaded saved record has `last_tested_at` and its database selection has not changed locally.
- `Failed`: the latest test attempt in the current component state failed.
- `Loading`: database options or a selected saved connection are loading.
- `Unavailable`: database discovery or saved-connection hydration failed, or the currently selected saved database is no longer present in the successful discovery catalog.

Status precedence is `Unavailable`, `Loading`, `Testing`, the latest local test outcome for the selected database, a successful loaded saved test for the unchanged saved database, then `Untested`. Local test outcomes are associated with the database path they tested, so changing the selection cannot display another database's result. Returning to the unchanged saved database may again use its loaded `last_tested_at` state.

Save and drop failures remain feedback messages and do not incorrectly change the test status.

### Health Strip

A compact three-cell strip below the header shows:

- Driver: `SQLite`.
- Database: `Selected`, `Not selected`, `No databases` when discovery returned an empty catalog, or `Unavailable` when discovery failed or the currently selected saved database is missing from a successful catalog.
- Last successful test: formatted successful test date when known, `Passed this session` after an unsaved test that returns no timestamp, otherwise `Not tested`. If the database selection changes or a later test fails, the prior date remains explicitly historical while status and readiness reflect the current selection and latest outcome.

Saved dates use a stable `DD Mon YYYY` UTC presentation, such as `16 Jul 2026`, so server and browser time zones do not change the displayed day.

The strip is orientation context, not a monitoring dashboard. Values use the same weight, casing, spacing, and semantic tones as Data Models health cells.

### Main Layout

The desktop content area uses a main setup column and a narrower supporting panel.

The main column contains one open numbered section:

- Number: `01`.
- Title: `Connection details`.
- Summary: `Identity and database source`.
- State: `Complete`, `Label required`, `Database required`, `Database unavailable`, `Loading`, `No databases`, or `Unavailable`.

The section body preserves the current form:

- `Connection label`, editable only in create mode.
- `Database type`, read-only `SQLite`.
- `Database`, selected from backend discovery results.

Controls reuse the Data Models inset background, border, focus ring, disabled state, radius, field-label hierarchy, and two-column-to-one-column responsive behavior. The Database field spans the full section width.

If a loaded saved database is absent from an otherwise successful discovery catalog, keep it visible as an `unavailable` select option so the user can understand and replace it. While that option remains selected, the health strip shows `Unavailable`, the section shows `Database unavailable`, database readiness is incomplete, and Test and Save remain disabled. Drop remains available because the saved record loaded successfully. Choosing an available replacement immediately transitions the builder to dirty `Untested`: database readiness becomes complete, the action note becomes `Database selection changed`, and Test and Save become enabled.

### Readiness Panel

The supporting panel contains three checks derived only from current state:

- A non-empty connection label is present.
- A discovered SQLite database is selected.
- A successful connection test is known.

The header shows `n of 3`. Each check uses a restrained semantic dot and direct text. The panel also permanently explains:

`Connection-only test. Testing verifies that SQLite can be opened and queried. It does not inspect tables or columns.`

The checklist does not claim continuous availability, schema validity, or database health.

Readiness copy is deterministic:

- Label ready: `Connection label added.` in create mode or `Connection label saved.` in saved mode.
- Label missing: `Add a connection label.`
- Database ready: `SQLite database selected.`
- Database missing: `Select a discovered SQLite database.`
- Empty catalog: `No discovered SQLite databases are available.`
- Selected saved database unavailable: `Saved database is unavailable. Select a replacement.`
- Test ready: `Connection test passed.`
- Test missing: `Run a connection test.`
- Test failed: `Latest connection test failed.`

### Feedback

Loading, empty discovery, validation, test, save, and drop messages remain visible and are announced through one `aria-live="polite"` region. Feedback uses the Data Models inline message treatment. Test success and failure also update the status badge and readiness check without replacing the detailed message.

The empty discovery message remains explicit that no SQLite databases were found under the configured datasets folder. The form and actions remain present so the user understands the context, while Test and Save stay disabled.

### Action Bar

A sticky action bar mirrors Data Models:

- `Drop` is isolated on the left and appears only for saved connections.
- A short current-state note appears near the primary actions.
- `Test connection` is the secondary action.
- `Save Connection` remains the primary action in both create and saved modes, preserving the existing Connections plan and interaction contract.

The current-state note is selected in this precedence order:

- Loading or unavailable: no note; visible status and feedback explain the state.
- Missing label: `Add a label to continue`.
- Missing or unavailable database: `Select a database to continue`.
- Active request: no note; the busy action label explains the state.
- Latest local test for the selected path failed: `Review test feedback`.
- Saved mode with a database path different from the current rebased saved path: `Database selection changed`.
- Latest local test for the selected path succeeded: `Connection test passed`.
- Saved mode with an unchanged path: `Saved connection`.
- Otherwise: `Ready to test or save`.

Busy labels identify the active request: `Testing...`, `Saving...`, or `Dropping...`. While one action is active, all action buttons are disabled to prevent duplicate or conflicting requests. Drop keeps the existing confirmation text that the source database file will not be deleted.

## State And Data Flow

`ConnectionBuilder` continues to own local form and request state.

1. Load database options on mount.
2. In saved mode, load the selected connection and hydrate label, database path, and last successful test timestamp.
3. Derive section completion, health values, and readiness checks from the loaded options, form fields, and latest test state.
4. Keep database-option and saved-record hydration independent without allowing a late option response to replace a saved database path. The first discovered option is a default only in create mode.
5. Associate each local test result with the database path tested. When the selection changes, derive status for the new selection instead of reusing the previous result; retain a prior saved timestamp only as historical context.
6. For a new connection or a saved connection whose database selection differs from its loaded saved path, test the visible selection with the existing unsaved-test client. For an unchanged saved connection, use the existing saved-test client so `last_tested_at` is persisted.
7. Preserve the existing validation before test or save.
8. On successful testing, update the local test status and use `Passed this session` when the unsaved-test response has no timestamp.
9. On test failure, show safe feedback and mark only the tested path's current local state failed.
10. Save and drop through the existing client functions and workbench callbacks.
11. After a successful saved-mode update, rebase the saved database path to the returned `database_path`. If the path changed, do not associate the record's older `last_tested_at` with the new path; keep it only as historical context until the new saved selection is tested. A subsequent test then uses the saved-test client and persists a current `last_tested_at`.

The implementation may replace the current boolean `submitting` state with an action discriminator such as `"test" | "save" | "drop" | null` so labels and disabled states are exact. It may also retain the loaded saved database path and path-keyed local test outcome. These are local presentation and correctness state, not workflow or API changes.

## Loading And Error States

- Initial option loading renders the full workbench shell with `Loading` status and localized loading copy.
- Saved connection loading uses the same shell and prevents actions until hydration completes.
- Database discovery failure renders `Unavailable`, keeps the safe discovery error, does not also render the empty-discovery message, and disables Test and Save.
- Empty discovery renders `No databases` in section and health context and explicitly states that no `.db`, `.sqlite`, or `.sqlite3` files were found under the configured datasets folder.
- A loaded saved path missing from a successful non-empty catalog remains visible for replacement, renders `Database unavailable`, and disables Test and Save until an available path is selected. Selecting a replacement transitions to dirty `Untested` with database readiness complete and actions enabled.
- Connection load failure renders `Unavailable`, keeps the current safe message, does not expose an editable fallback as though a saved record had loaded, and disables Test, Save, and Drop.
- Validation feedback remains specific to a missing label or database selection.
- Test, save, and drop errors use normalized client messages without raw paths, stack traces, or driver details.

## Responsive Behavior

- The builder remains the canvas scroll container and does not shift the shell or tree geometry.
- At medium canvas widths, the readiness panel stacks below Connection details.
- At narrow widths, the header and status block stack, health cells remain readable, form fields become one column, and the action bar wraps.
- Drop remains visually separated from primary actions even when wrapped.
- No horizontal page or canvas overflow is introduced.
- Interactive controls remain at least 40 pixels high with visible keyboard focus.

## Visual System

The implementation reuses the Data Models visual decisions rather than creating new generic tokens:

- Typography: existing Barlow application typography; hierarchy uses weight and tone more than size.
- Density: 4-pixel base with 12-16 pixel setup padding and compact 40-pixel controls.
- Depth: quiet borders and subtle surface shifts; restrained shadow only on the open setup section and primary action.
- Surfaces: `#f5f7fa` canvas, white header/cards/actions, and `#f6f7f9` inset controls, using the existing equivalent CSS values.
- Structural accent: existing CreditModeler violet.
- Semantic color: amber for incomplete or untested, green for successful, and muted red for failure or danger.
- Radius: 8-pixel controls, 9-10 pixel cards, and pill status badges, matching Data Models.

## Accessibility

- Retain native labels, inputs, select, and buttons.
- Keep the saved label and database type programmatically read-only.
- Provide visible `:focus-visible` treatment for every interactive control.
- Announce feedback through a single polite live region without moving focus.
- Do not use color alone: every status, readiness item, and disabled state includes text.
- Keep status text concise and expose loading through visible text, not animation alone.
- Respect `prefers-reduced-motion` using the same reduced-motion behavior as Data Models.

## Component Boundaries

Keep the implementation in `ConnectionBuilder` unless a small local helper improves repeated rendering. The feature does not justify a new global store or broad shared-builder abstraction.

Reuse Data Models styling values deliberately, but retain `rv-connection-builder` class ownership so future connection-specific changes do not couple both builders through one oversized selector. Shared design tokens may be used where they already exist; do not refactor unrelated Data Models CSS as part of this task.

## Verification Strategy

Follow test-driven development for state and behavior changes.

### Unit And Component Coverage

- Create mode renders the aligned header, one Connection details section, readiness panel, health strip, and action bar.
- Saved mode renders `Name locked`, read-only label, `Drop`, and `Save Connection`.
- Untested, testing, tested, and failed states render from existing data and test outcomes.
- Readiness count responds to label, database, and successful testing state.
- Changing a tested database selection yields `Untested`; returning to an unchanged saved selection can reuse its loaded saved test state.
- Dirty saved selections use the existing unsaved-test client, while unchanged saved selections use the saved-test client.
- Changing a saved selection, saving it, and then testing rebases the saved path and uses the saved-test client.
- Test, Save, and Drop use exact busy labels and disable conflicting actions.
- Empty database discovery renders the aligned empty state and disables Test and Save.
- Database discovery failure is distinct from empty discovery and disables Test and Save.
- A saved database missing from a successful discovery catalog remains visible as unavailable; Test and Save stay disabled until it is replaced, while Drop remains available.
- Selecting an available replacement for a missing saved database renders dirty `Untested`, completes database readiness, shows `Database selection changed`, and enables Test and Save.
- Saved-connection load failure renders `Unavailable` and disables Test, Save, and Drop.
- Saved hydration retains the saved database when it is not the first discovered option, regardless of which request resolves first.
- The action note follows the specified precedence in create, saved, dirty, tested, failed, loading, empty, and unavailable states.
- UTC `Last successful test`, historical-date, and `Passed this session` presentations are covered.
- Existing validation, create, update, drop, confirmation, and workbench callback behavior remains unchanged apart from the explicit correctness fixes in this design.
- The single polite live region announces feedback, and reduced-motion styling remains effective.

### Browser And Geometry Coverage

- The builder stays within the existing workbench canvas bounds.
- Desktop renders setup and readiness side by side.
- Dedicated medium and narrow canvas coverage proves that header, setup, readiness, and actions stack without horizontal overflow.
- Keyboard focus remains visible and action targets remain reachable.
- Existing CreditModeler visual and interaction suites continue to pass.

### Commands

From `apps/web`:

```powershell
npm run test -- tests/unit/connection-builder.test.tsx
npm run lint
npm run test:e2e:responsive
npm run test:visual:desktop
```

Run the focused unit test during red-green-refactor, then the broader frontend and browser checks required by the affected geometry.

## Implementation Constraints

- Preserve `/creditmodeler-service`, `Workbench`, `CanvasPanel`, and object-tree behavior.
- Preserve existing Connections API client calls and payloads.
- Preserve immutable saved labels and metadata-only Drop behavior.
- Preserve safe discovered relative database values and never display absolute paths.
- Do not add unsupported monitoring, schema, table, column, or profiling claims.
- Keep the change focused on `ConnectionBuilder`, its tests, and its scoped styles in `apps/web/app/globals.css`.
