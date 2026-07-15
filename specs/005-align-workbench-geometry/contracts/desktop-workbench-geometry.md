# Contract: Desktop Workbench Geometry

## Purpose

Define the approved desktop alignment checkpoints for the migrated `/creditmodeler-service` workbench.

## Baseline source

- The approved desktop reference page is `frontend/creditmodeler-service.html`.
- Approved desktop screenshots captured from that page remain the source of truth for this feature.
- The broader legacy-parity desktop viewport matrix and geometry tolerance apply unchanged.

## Required desktop viewport matrix

| Viewport label | Size |
|----------------|------|
| Desktop standard | `1366 x 768` |
| Desktop wide | `1440 x 900` |

## Required desktop checkpoints

- Workbench content begins at the same effective vertical position as the approved legacy reference within the inherited desktop tolerance.
- The narrow application sidebar aligns to the same shared shell frame as the adjusted workbench content.
- Unnecessary vertical separation between the stage region and the tree-and-canvas region is removed.
- The tree panel remains the first desktop workbench column.
- The visible desktop canvas width remains within the inherited desktop tolerance of the approved legacy reference.
- No unintended full-page horizontal or vertical overflow is introduced.

## Geometry ownership rules

- Alignment must be driven by shared shell or page geometry.
- The feature must not correct the route by applying an isolated negative transform to the workbench component.
- Sidebar and workbench alignment must stay synchronized after any page-level adjustment.

## Reference validation coverage

- `apps/web/tests/visual/migrated-pages.spec.ts` compares the migrated route against the approved desktop baselines.
- `apps/web/tests/visual/layout-geometry.spec.ts` verifies the workbench tree region and shell geometry remain within expected desktop bounds.
- `apps/web/tests/e2e/desktop-layout-checks.spec.ts` verifies stage-bar alignment, tree-to-canvas ordering, and route-level desktop checkpoints.

## Pass conditions

- Both required desktop viewport scenarios pass visual comparison against the approved legacy baselines.
- Both required desktop viewport scenarios pass direct geometry checks for workbench top alignment and sidebar alignment.
- Desktop canvas width remains visually equivalent to the approved reference within the inherited tolerance.
- Failure artifacts remain reviewable through the existing visual-comparison workflow.
