# Compact Fact Table Section Design

**Date:** 2026-07-22

## Context

The fact-table section uses a two-column field grid with a native multiple select for primary-key columns. That control is at least 88 pixels tall and adds a separate Ctrl/Cmd instruction, making the fact section substantially taller than the compact dimension editor.

This follow-up applies the approved dimension density pattern to the fact controls while preserving the fact section's distinct fields and hierarchy.

## Goals

- Reduce the fact section's desktop height without hiding or collapsing fields.
- Keep source connection, table or view, alias, primary keys, and grain directly editable.
- Give fact and dimension primary keys the same composite-key interaction.
- Preserve current model mutation, schema-repair, validation, and payload behavior.
- Retain accessible desktop and mobile control targets.

## Non-Goals

- Do not change the fact model shape, API payloads, validation, or persistence.
- Do not compact model details, source connections, relationships, or business rules.
- Do not collapse the fact section after configuration.
- Do not change the existing section header or responsive breakpoint.
- Do not add column search or automatic key-selection behavior.

## Approved Layout

The fact section keeps its current field order and two-column desktop hierarchy:

1. Fact source connection
2. Fact table or view
3. Fact alias
4. Fact primary key columns
5. Grain, spanning both columns

The grid receives a fact-specific compact modifier. Desktop controls are 34 pixels high, field labels use the same compact typography as dimension labels, and the grid follows a 4-pixel label gap with 7-pixel row gaps. Fields align to the top so the key picker cannot stretch its neighboring alias field.

At the existing 620-pixel breakpoint, the fields stack in their current document order. Controls use a 40-pixel height on that narrow layout, preserving the builder's minimum touch target and avoiding horizontal overflow.

## Primary-Key Picker

The native fact multiple select and its Ctrl/Cmd instruction are replaced by the existing `ColumnMultiSelect` component. The picker remains generic and receives the fact schema columns, current fact key names, the `Fact primary key columns` accessible label, and a fact-specific change callback.

The trigger follows the dimension behavior:

- No selection reads `Select primary key columns`.
- One selection displays that column as a token.
- Composite keys display the first selected column and a `+N` remainder.
- The checklist marks schema-declared primary keys with `PK` metadata.
- Selection changes update `fact_table.primary_key` immediately in schema column order.
- Escape, outside click, and repeated trigger activation close the popover.

The picker is disabled until a valid fact table or view is selected. Existing fact-table changes continue to replace or filter key selections through the current draft mutation logic.

## Visual Direction

The fact section remains part of the dense analytical-modeling workbench. The source and table establish the root identity, alias and keys refine it, and grain remains the final full-width statement.

The implementation reuses the existing borders-only depth strategy, cool-gray inset controls, quiet slate labels, lavender focus treatment, and green `PK` metadata. It introduces no new palette, radius, typography, or elevation decisions.

## Component Boundaries

- `ColumnMultiSelect` continues to own checklist rendering, focus, keyboard behavior, and open/close interaction.
- `DataModelBuilder` maps fact key changes to `draft.fact_table.primary_key`.
- Fact-only CSS modifiers own density and responsive control heights.
- Existing dimension picker behavior and styles remain unchanged.

## Verification

Unit coverage will prove that:

- Fact primary keys use the compact picker rather than a native multiple select.
- Existing schema-declared fact keys render in the closed trigger and open checklist.
- Editing a composite fact key updates the unsaved-test payload.
- The fact picker remains disabled until a valid fact table is selected.
- Changing the fact table continues to repair incompatible selected keys.
- Dimension key-picker behavior remains unchanged.

Browser coverage will check that:

- In a configured, error-free state, the desktop fact grid is no taller than 175 pixels and the open fact section, including its header and body, is no taller than 255 pixels.
- Fact controls are 34 pixels high on desktop and 40 pixels high at 600 pixels.
- The primary-key popover stays visible above surrounding sections.
- The page has no horizontal overflow at desktop or narrow widths.

Focused unit and Playwright tests will run before the broader frontend test, lint, and production-build checks.

## Files

- `apps/web/features/creditmodeler/DataModelBuilder.tsx`: fact picker integration and compact grid class.
- `apps/web/app/globals.css`: fact-only density and responsive styles.
- `apps/web/tests/unit/data-model-builder.test.tsx`: fact picker and payload regressions.
- `apps/web/tests/e2e/local-interactions.spec.ts`: desktop and mobile geometry checks.
