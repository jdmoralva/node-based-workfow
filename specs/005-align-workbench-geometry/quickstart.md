# Quickstart: Align Workbench Geometry

## Purpose

Validate the CreditModeler desktop workbench alignment feature after implementation.

## Prerequisites

- The repository is available locally.
- Node.js 22 LTS or the project-supported equivalent is installed.
- Dependencies for `apps/web` are installed.
- The approved legacy CreditModeler reference page remains available at `frontend/creditmodeler-service.html` for desktop baseline comparison context.

## Setup

1. Install dependencies with `npm install --prefix apps/web`.
2. Start the web app with `npm run dev --prefix apps/web`.
3. Confirm the local app is reachable at `http://127.0.0.1:3000`.
4. Confirm the approved legacy desktop baseline images remain present under `apps/web/tests/visual/baselines/legacy/`.

## Validation scenarios

### 1. Workbench unit behavior and legacy dependency guards

1. Run the focused workbench unit tests.
2. Run the production-source guard tests that prevent runtime references to legacy assets.
3. Confirm tree expansion, selection behavior, and legacy dependency protections remain intact.

Commands:
- `npm run test --prefix apps/web -- workbench-tree.test.tsx`
- `npm run test --prefix apps/web -- no-legacy-runtime-dependencies.test.ts no-legacy-html-references.test.ts`

Expected outcome:
- Tree submenu toggles still report the correct expanded state.
- Tree selection behavior still works after geometry changes.
- Production source files keep runtime references to `frontend/`, legacy baseline paths, and legacy `.html` or `.htm` files out of the shipped app.

### 2. Desktop workbench geometry checks

1. Run the focused desktop geometry assertions.
2. Review the `/creditmodeler-service` checkpoints for stage alignment, tree width, canvas relationship, and page-level overflow.

Command:
- `npx playwright test tests/visual/layout-geometry.spec.ts tests/e2e/desktop-layout-checks.spec.ts --config apps/web/playwright.config.ts`

Expected outcome:
- The workbench top position stays aligned to the approved desktop reference.
- The narrow application sidebar stays aligned with the shared shell frame.
- Tree width and canvas width remain within the approved desktop relationship.
- No unintended page-level overflow is introduced.

### 3. Desktop visual comparison for CreditModeler

1. Run the desktop visual comparison suite.
2. Review expected, actual, and diff artifacts for the CreditModeler route if any failure occurs.
3. Confirm the comparison run does not refresh approved baselines.

Command:
- `npm run test:visual:desktop --prefix apps/web`

Expected outcome:
- The migrated `/creditmodeler-service` route matches the approved legacy desktop baselines at both required desktop viewports.
- Failure artifacts remain under `apps/web/tests/visual/artifacts/comparison/`.

### 4. Accessibility and responsive guardrails

1. Run the existing accessibility and responsive suites.
2. Confirm geometry changes do not break accessible names, reachable controls, or responsive usability expectations.

Commands:
- `npx playwright test tests/e2e/accessibility.spec.ts --config apps/web/playwright.config.ts`
- `npm run test:e2e:responsive --prefix apps/web`

Expected outcome:
- Search and tree toolbar controls keep their current accessible names and remain reachable.
- The CreditModeler stage bar stays within the viewport at tablet and mobile sizes.
- Tablet and mobile layouts remain usable without being forced to copy the legacy responsive arrangement.

### 5. Full route validation set

1. Run `npm run test --prefix apps/web`.
2. Run `npm run test:e2e --prefix apps/web`.
3. Run `npm run test:visual:desktop --prefix apps/web`.
4. Run `npm run test:e2e:responsive --prefix apps/web`.

Expected outcome:
- Unit, desktop, accessibility, and responsive checks all pass.
- The feature meets the desktop workbench geometry and tree-readability contracts defined for this route.

## Latest Validation Status

Validated on: `2026-07-11`

Focused validation results:
- `npm run test --prefix apps/web -- workbench-tree.test.tsx` -> PASS
- `npm run test --prefix apps/web -- no-legacy-runtime-dependencies.test.ts no-legacy-html-references.test.ts` -> PASS
- `npx playwright test tests/visual/layout-geometry.spec.ts tests/e2e/desktop-layout-checks.spec.ts --config apps/web/playwright.config.ts` -> PASS
- `npm run test:visual:desktop --prefix apps/web` -> PASS
- `npx playwright test tests/e2e/accessibility.spec.ts --config apps/web/playwright.config.ts` -> PASS
- `npm run test:e2e:responsive --prefix apps/web` -> PASS

Broader validation results:
- `npm run test --prefix apps/web` -> PASS
- `npm run test:e2e --prefix apps/web` -> PASS
- `npm run test:visual:desktop --prefix apps/web` -> PASS
- `npm run test:e2e:responsive --prefix apps/web` -> PASS

## References

- Feature spec: [spec.md](./spec.md)
- Implementation plan: [plan.md](./plan.md)
- Data model: [data-model.md](./data-model.md)
- Desktop geometry contract: [contracts/desktop-workbench-geometry.md](./contracts/desktop-workbench-geometry.md)
- Tree readability contract: [contracts/tree-panel-readability.md](./contracts/tree-panel-readability.md)
