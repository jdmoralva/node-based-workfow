# Contract: Tree Panel Readability

## Purpose

Define the desktop readability and overflow rules for the CreditModeler object-tree panel.

## Approved content scope

- The current approved tree hierarchy and labels from `apps/web/config/tree-menu.ts` define the expected desktop content set.
- This feature does not change labels, hierarchy, accessible names, or navigation semantics.

## Required readability conditions

- The tree panel provides enough usable width for current approved labels, including `TransitionAnalysis`, to render fully at both required desktop viewports.
- Indentation remains progressive and compact so nesting stays visible without consuming unnecessary label space.
- Row internals minimize duplicated horizontal spacing across icons, carets, gaps, and option padding.
- Search and toolbar controls retain their current functionality and accessible names.

## Overflow policy

- The tree content region uses the remaining available panel height.
- Vertical scrolling inside the tree panel is allowed when content exceeds available height.
- Horizontal scrolling is not allowed for the current approved content set.
- Ellipsis is allowed only for genuinely oversized or future dynamic labels that exceed the approved panel width.

## Shared width rule

- One shared layout token governs the tree-panel width and the first desktop workbench column.
- Any tree width increase must preserve desktop canvas usability within the inherited legacy tolerance.

## Reference validation coverage

- `apps/web/tests/unit/workbench-tree.test.tsx` covers expansion and selection behavior.
- `apps/web/tests/visual/layout-geometry.spec.ts` covers desktop tree width bounds and page-level overflow.
- `apps/web/tests/e2e/desktop-layout-checks.spec.ts` covers tree-to-canvas ordering and stage-bar coherence.
- The desktop visual comparison suite confirms the resulting tree density still matches the approved legacy desktop baseline.

## Pass conditions

- Current approved labels fit without unnecessary truncation at both required desktop viewports.
- The panel shows no horizontal scrollbar for the current approved content set.
- Internal vertical scrolling remains available when tree content exceeds visible height.
- Search and toolbar controls remain accessible and functionally unchanged.
