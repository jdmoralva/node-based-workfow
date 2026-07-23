# Compact Dimension Card Design

**Date:** 2026-07-22

## Context

Each dimension editor currently uses a two-column field grid with a native multiple select for primary-key columns. The multiple select makes its grid row tall, and the alias field stretches to match that height. A model with several dimensions therefore requires unnecessary vertical scrolling.

The approved direction keeps every dimension field visible while replacing only the tall dimension primary-key control with a compact checklist popover.

## Goals

- Keep a configured dimension card's resting height at or below 145 pixels on desktop.
- Keep source connection, table or view, alias, primary keys, and removal visible and directly editable.
- Preserve composite-key selection and existing draft mutation behavior.
- Match the current CreditModeler visual language and responsive layout.
- Provide complete mouse and keyboard operation.

## Non-Goals

- Do not change fact-table primary-key controls.
- Do not collapse completed dimension cards.
- Do not change model schemas, API payloads, validation, or persistence.
- Do not add column search; the checklist scrolls when a table has many columns.
- Do not redesign other repeatable cards or form controls.

## Approved Layout

The fieldset, legend, and top-right Remove action remain. The Remove action keeps its 40-pixel target and aligns with the `Dimension N` legend so its box does not overlap the table selector. This positioning is scoped to dimension cards; other repeatable-card actions remain unchanged. The four fields use the existing two-column order:

1. Source connection
2. Table or view
3. Dimension alias
4. Primary key columns

Desktop dimension controls are 34 pixels high with a 4-pixel-based internal spacing rhythm. Labels and controls align to the top of each grid cell so one field cannot stretch another. At the existing 620-pixel breakpoint, fields stack into one column and controls retain a minimum 40-pixel touch target.

The design continues the workbench's borders-only depth strategy: white card, inset cool-gray controls, quiet slate borders, muted lavender focus state, and green reserved for detected primary-key metadata. No new global color or typography system is introduced.

## Compact Key Picker

The dimension primary-key control becomes a button styled like the other form controls.

- With no selection, it reads `Select primary key columns`.
- With one selection, it shows that column as a token.
- With a composite key, it shows the first selected column and `+N` for the remaining selections.
- The button exposes its open state with `aria-expanded` and references the checklist with `aria-controls`.

Activating the button opens a popover anchored below it. The popover contains:

- A short instruction and selected-column count.
- One native checkbox per available schema column.
- A `PK` metadata badge on columns declared as primary keys by schema inspection.
- A bounded, vertically scrollable list for long schemas.

Checkbox changes update `dimension.primary_key` immediately and preserve schema column order. The popover closes when the trigger is activated again, the user clicks outside it, or the user presses Escape. Escape returns focus to the trigger. Opening one dimension's key picker closes any other open picker.

The popover is not a modal and does not trap focus. Its width matches the field on desktop and stays within the dimension card on narrow screens.

## Component Boundary

A focused `ColumnMultiSelect` component owns trigger rendering, open/close interaction, outside-click handling, keyboard handling, and checkbox semantics. It receives available columns, selected column names, an accessible label, and an `onChange` callback. It does not know about dimensions or mutate the model itself.

`DataModelBuilder` remains responsible for mapping a picker change to the matching dimension in the draft. The existing native fact-table multiple select remains unchanged.

## States

- **Unavailable:** The trigger is disabled when no valid schema object is selected.
- **Empty:** The placeholder communicates that key selection is required.
- **Selected:** The trigger displays the first selected key and composite-key remainder count.
- **Open:** The trigger receives the existing focus treatment and the checklist is visible above surrounding content.
- **Repaired schema:** Existing compatible-key filtering continues to remove selections that are absent from the newly selected object.

## Verification

Unit coverage will prove that:

- The compact picker renders selected dimension keys without the native multiple select.
- Opening the picker exposes all available columns and declared-primary-key badges.
- Selecting and clearing checkboxes updates the dimension draft and submitted model payload.
- Composite selections render the first key plus the correct remainder count.
- Escape closes the picker and restores trigger focus.
- Changing a dimension source or table still filters incompatible selected keys.
- Fact-table key selection continues to use its existing control.
- The Remove action's lower edge stays above the table selector at desktop and narrow viewports.

Focused lint and unit tests will run after implementation. Browser verification will check desktop card density, Remove-action geometry, popover positioning, the 620-pixel single-column layout, keyboard operation, and horizontal overflow.

## Files

- `apps/web/features/creditmodeler/ColumnMultiSelect.tsx`: focused compact checklist control.
- `apps/web/features/creditmodeler/DataModelBuilder.tsx`: dimension integration and draft updates.
- `apps/web/app/globals.css`: scoped dimension-card and picker styles.
- `apps/web/tests/unit/data-model-builder.test.tsx`: interaction and payload regressions.
