# Contract: Visual Regression Coverage

## Purpose

Define the required screenshot matrix and visual review checkpoints for the standalone frontend migration.

## Baseline source

- The current generated pages under `frontend/` are the initial approved visual reference set for the migration.
- Baselines are reference inputs only; the migrated application must not depend on legacy files at runtime.

## Route matrix

| Migrated route | Legacy baseline page |
|----------------|----------------------|
| `/` | `frontend/index.html` |
| `/login` | `frontend/login.html` |
| `/applications` | `frontend/applications.html` |
| `/services` | `frontend/services.html` |
| `/creditmodeler-service` | `frontend/creditmodeler-service.html` |

## Required viewport matrix

| Viewport label | Size |
|----------------|------|
| Desktop wide | `1440 x 900` |
| Desktop standard | `1366 x 768` |
| Mobile | `390 x 844` |

Every migrated route must have screenshot coverage at all three required viewport sizes.

## Review checkpoints

Visual regression reviews must validate the applicable subset of:

- shell dimensions
- top-bar height
- sidebar placement
- hero-ribbon dimensions
- card sizes
- grid spacing
- typography
- icon dimensions
- toolbar layout
- login alignment
- tree-panel dimensions
- responsive behavior

## Route-specific emphasis

- `/`: shell dimensions, top-bar height, sidebar placement, hero-ribbon dimensions, card sizes, grid spacing, typography, icon dimensions
- `/login`: shell dimensions, top-bar height, hero-ribbon dimensions, login alignment, typography, responsive behavior
- `/applications`: shell dimensions, top-bar height, sidebar placement, hero-ribbon dimensions, card sizes, grid spacing, typography, icon dimensions
- `/services`: shell dimensions, top-bar height, sidebar placement, toolbar layout, card sizes, grid spacing, typography, icon dimensions
- `/creditmodeler-service`: shell dimensions, top-bar height, sidebar placement, tree-panel dimensions, typography, icon dimensions, responsive behavior

## Pass conditions

- Each route and viewport pair produces a stable screenshot artifact.
- No critical regressions are accepted in the required review checkpoints.
- Responsive screenshots do not show unintended horizontal scrolling.
- When the baseline changes intentionally, the approved reference set is updated in one controlled step.

## Baseline Review Notes

- Initial standalone baseline filenames are stored under `apps/web/tests/visual/__screenshots__/README.md`.
- The initial review set covers 15 route-and-viewport combinations: 5 migrated routes x 3 screenshot viewports.
- Tablet responsiveness is validated through browser assertions at `768 x 1024` even though screenshot baselines remain defined only for `1366 x 768`, `1440 x 900`, and `390 x 844`.
- The current approved baseline images are stored directly under `apps/web/tests/visual/__screenshots__/` and are regenerated intentionally with Playwright snapshot updates.
- The current baseline image set was refreshed on 2026-07-10 after the final accessibility, font, and responsive layout polish changes.
