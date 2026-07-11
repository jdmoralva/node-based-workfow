# Quickstart: Legacy Visual Parity

## Purpose

Validate desktop parity and responsive usability for the migrated `apps/web` routes after implementation.

## Prerequisites

- The repository is available locally.
- Node.js 22 LTS or the project-supported equivalent is installed.
- Dependencies for `apps/web` are installed.
- The generated legacy pages remain available under `frontend/` for explicit desktop baseline capture.

## Setup

1. Install dependencies with `npm install --prefix apps/web`.
2. Start the web app with `npm run dev --prefix apps/web`.
3. Confirm the local app is reachable at `http://127.0.0.1:3000`.
4. Keep the legacy reference pages and assets available locally for baseline capture.

## Validation scenarios

### 1. Desktop baseline generation

1. Run the explicit desktop baseline generation command for `apps/web`.
2. Confirm desktop images are produced for all five in-scope routes at `1366 x 768` and `1440 x 900`.
3. Verify the approved images are written only into the legacy baseline directory.

Command:
- `npm run test:visual:legacy --prefix apps/web`

Expected outcome:
- Exactly 10 approved desktop baseline images exist.
- No mobile or tablet images are added to the approved legacy baseline set.

### 2. Desktop visual comparison

1. Run the desktop visual comparison command for `apps/web`.
2. Review expected, actual, and diff artifacts for any failures.
3. Confirm baselines are not modified during the comparison run.

Command:
- `npm run test:visual:desktop --prefix apps/web`

Expected outcome:
- Each in-scope route is compared against the matching approved legacy desktop baseline.
- Failures retain review artifacts without refreshing the approved images.
- Comparison-only runs write diagnostics under `apps/web/tests/visual/artifacts/comparison/`.

### 2A. Desktop repeatability check

1. Run the comparison-only repeatability command for `apps/web`.
2. Confirm it executes the desktop comparison suite twice against the same approved baseline set.
3. Verify the two runs produce the same pass-or-fail outcome before any baseline refresh is considered.

Command:
- `npm run test:visual:repeatability --prefix apps/web`

Expected outcome:
- Both invocations stay in comparison-only mode.
- Neither invocation refreshes approved baselines.
- Matching results across the two runs increase confidence that the environment remains deterministic.

### 3. Responsive usability validation

1. Run the browser validation suite that covers tablet and mobile layouts.
2. Exercise `/`, `/login`, `/applications`, `/services`, and `/creditmodeler-service` at `768 x 1024` and `390 x 844`.
3. Verify navigation access, action visibility, content flow, control usability, and absence of unintended horizontal overflow.

Command:
- `npm run test:e2e:responsive --prefix apps/web`

Expected outcome:
- Smaller-screen layouts may adapt intentionally.
- No primary task region is clipped or unusable.
- Shared application navigation remains reachable on smaller screens.
- Landing and applications cards keep a readable two-column tablet layout and a single-column mobile layout.
- Services toolbar actions and the CreditModeler stage/tree/canvas flow remain usable after stacking.

### 4. Geometry and route checks

1. Run route, navigation, and geometry checks for the shared shell and route-specific critical regions.
2. Review desktop measurements for the top bar, sidebar, hero ribbon, login panel, service toolbar, stage bar, object tree, and canvas where applicable.

Expected outcome:
- Desktop geometry remains aligned with approved legacy expectations.
- Responsive assertions complement screenshots rather than relying on them alone.

### 5. Full validation command set

1. Run `npm run test --prefix apps/web`.
2. Run `npm run test:e2e --prefix apps/web`.
3. Run `npm run test:visual --prefix apps/web`.
4. Run `npm run test:e2e:responsive --prefix apps/web`.
5. Run `npm run test:visual:repeatability --prefix apps/web`.
6. Run `npm run test:visual:legacy --prefix apps/web` only when intentionally capturing approved desktop baselines.

Expected outcome:
- Unit, end-to-end, and visual validation all pass.
- Desktop parity and responsive usability both meet the contracts defined for this feature.

## Latest validation record

- Validation run date: `2026-07-11`
- `npm run test --prefix apps/web` -> PASS
- `npm run test:e2e --prefix apps/web` -> PASS
- `npm run test:e2e:responsive --prefix apps/web` -> PASS
- `npm run test:visual --prefix apps/web` -> FAIL
  - Current blocker: all 10 desktop migrated-page screenshot comparisons in `tests/visual/migrated-pages.spec.ts` still differ from the approved legacy baselines.
  - The desktop geometry and governance checks inside the visual suite still pass.
- `npm run test:visual:repeatability --prefix apps/web` -> not executed after the failing desktop comparison run because repeatability would only restate the same comparison-only failure state.

Record the pass/fail outcome of this exact command set before sign-off so reviewers can compare reruns against the same workflow.

## References

- Feature spec: [spec.md](./spec.md)
- Implementation plan: [plan.md](./plan.md)
- Data model: [data-model.md](./data-model.md)
- Desktop baseline contract: [contracts/desktop-visual-baselines.md](./contracts/desktop-visual-baselines.md)
- Responsive usability contract: [contracts/responsive-usability.md](./contracts/responsive-usability.md)
