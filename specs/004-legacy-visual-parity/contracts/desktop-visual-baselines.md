# Contract: Desktop Visual Baselines

## Purpose

Define the approved desktop screenshot matrix and baseline-governance rules for legacy visual parity.

## Baseline source

- The generated legacy pages under `frontend/` are the authoritative desktop visual reference set.
- Legacy pages are capture inputs only and must not be used by `apps/web` at runtime.

## Route matrix

| Migrated route | Legacy reference page |
|----------------|-----------------------|
| `/` | `frontend/index.html` |
| `/login` | `frontend/login.html` |
| `/applications` | `frontend/applications.html` |
| `/services` | `frontend/services.html` |
| `/creditmodeler-service` | `frontend/creditmodeler-service.html` |

## Approved desktop viewport matrix

| Viewport label | Size |
|----------------|------|
| Desktop standard | `1366 x 768` |
| Desktop wide | `1440 x 900` |

Every migrated route must have approved desktop baseline coverage at both desktop viewport sizes.

## Approved baseline inventory

- Total approved baseline images: `10`
- Naming pattern: `legacy-<route>-<viewport>.png`
- Approved storage location: `apps/web/tests/visual/baselines/legacy/`
- Explicit capture command: `npm run test:visual:legacy --prefix apps/web`
- Comparison-only command: `npm run test:visual:desktop --prefix apps/web`

## Required desktop checkpoints

Desktop parity reviews must validate the applicable subset of:

- shell dimensions
- top-bar height and alignment
- branding placement
- breadcrumb placement
- sidebar placement and active state
- hero-ribbon dimensions
- card sizes and spacing
- borders, shadows, and radii
- typography and iconography
- toolbar alignment
- login alignment
- stage-bar, object-tree, and design-canvas geometry

## Route notes

- `/` and `/applications`: verify the fixed left rail, centered hero ribbon, right-aligned action button, and the three-card desktop grid with the selected Reporting card leading the set.
- `/login`: verify the two-row topbar without the desktop rail, the compact sign-in ribbon, centered form card, and preserved whitespace around the login surface.
- `/services`: verify the combined desktop toolbar row, centered services ribbon, right-aligned add action, and service cards that retain the narrow desktop proportions.
- `/creditmodeler-service`: verify the desktop workbench height, centered stage bar, narrow object tree rail, and main canvas panel relationship.

## Pass conditions

- Each desktop route-and-viewport pair produces a stable screenshot artifact.
- No critical regression is accepted in the applicable desktop checkpoints.
- Missing approved baselines fail validation instead of generating a replacement.
- Desktop comparison runs retain expected, actual, and diff artifacts on failure.

## Baseline governance

- Baseline generation is an explicit operation separate from normal comparison runs.
- App changes alone do not justify baseline replacement.
- Approved baseline changes require reviewer-visible justification.
- Temporary actual, diff, trace, and report artifacts remain outside the approved baseline directory.
- The explicit capture flow runs with Playwright snapshot updates enabled, while comparison-mode scripts do not pass `--update-snapshots`.
