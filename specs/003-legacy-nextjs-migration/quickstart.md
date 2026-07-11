# Quickstart: Legacy Frontend Standalone Migration

## Purpose

Validate the standalone frontend migration end to end after implementation.

## Prerequisites

- The repository is available locally.
- Node.js 22 LTS or equivalent project-supported runtime is installed.
- Frontend dependencies for `apps/web` are installed.
- The legacy generated pages remain available locally under `frontend/` for baseline comparison during migration.

## Setup

1. Install frontend dependencies from the repository root with `npm install --prefix apps/web`.
2. Start the standalone frontend from the repository root with `npm run dev --prefix apps/web`.
3. Open the local application URL exposed by the dev server.
4. Keep the legacy reference pages available locally for manual comparison and visual baseline generation.
5. Confirm the local font pipeline loads the migrated Barlow font family from `apps/web/app/layout.tsx`.

## Validation scenarios

### 1. Route inventory and direct access

1. Open `/`, `/login`, `/applications`, `/services`, and `/creditmodeler-service` directly.
2. Refresh each route once.
3. Open one route in a new tab.

Expected outcome:
- All five migrated routes load successfully.
- No route depends on a generated `.html` page.
- Direct access, refresh, and new-tab usage remain functional.

### 2. Navigation behavior

1. Open `/` and activate the `Sign In` action.
2. Open `/applications` and activate the `Reporting` card.
3. Open `/services` and activate the `CreditModeler` card.
4. Use browser Back and Forward across these transitions.

Expected outcome:
- `Sign In` opens `/login`.
- `Reporting` opens `/services`.
- `CreditModeler` opens `/creditmodeler-service`.
- Navigation stays client-side and browser history remains correct.

### 3. Non-navigable card and local control behavior

1. Open `/applications` and interact with `AI Copilot` and `Documentation`.
2. Open `/services` and interact with `Mortgage` and `PayrollDeduction`.
3. Use menu or metadata controls inside a navigable card.

Expected outcome:
- Non-navigable cards remain visible but do not behave as links.
- Local card controls do not trigger navigation.
- Selected-card and local interaction states remain usable.

### 4. Login and workbench interactions

1. Open `/login` and submit the form with empty required fields.
2. Confirm that the page shows local validation feedback only.
3. Open `/creditmodeler-service` and expand or collapse multiple tree groups.
4. Select one or more workbench tree items.

Expected outcome:
- The sign-in form remains frontend-only and does not attempt backend authentication.
- Tree expansion, selection, and workbench layout behave predictably.

### 5. Automated verification

1. Run the frontend unit and component suite with `npm run test --prefix apps/web`.
2. Run browser interaction coverage with `npm run test:e2e --prefix apps/web`.
3. Run visual regression coverage with `npm run test:visual --prefix apps/web`.
4. Run accessibility browser coverage with `npx playwright test tests/e2e/accessibility.spec.ts`.

Expected outcome:
- Route metadata, component behavior, and browser interaction checks pass.
- Screenshot coverage exists for the five migrated routes at the required viewports.
- Accessibility checks pass for landmarks, labels, current-page markers, tree expansion state, and decorative icon hiding.

### 6. Visual regression review

1. Review the screenshot outputs defined in [contracts/visual-regression.md](./contracts/visual-regression.md).
2. Compare the migrated routes with the route matrix and baseline expectations.
3. Confirm responsive screenshots at `1440 x 900`, `1366 x 768`, and `390 x 844`.

Expected outcome:
- No critical regressions are present in required checkpoints.
- Shell dimensions, hero regions, grid spacing, and workbench proportions remain aligned with the legacy reference set.

## Validation result

- Frontend verification passes for route behavior, local interactions, and visual regression coverage.
- The local font pipeline, accessibility checks, and screenshot baseline set all validate successfully.
- Latest verification run on 2026-07-10 completed successfully with `npm run test`, `npm run test:e2e`, and `npm run test:visual` from `apps/web`.
- The visual baseline set under `apps/web/tests/visual/__screenshots__/` was refreshed after the final accessibility and responsive polish updates.

## References

- Feature spec: [spec.md](./spec.md)
- Implementation plan: [plan.md](./plan.md)
- Data model: [data-model.md](./data-model.md)
- Navigation contract: [contracts/navigation-ui.md](./contracts/navigation-ui.md)
- Visual contract: [contracts/visual-regression.md](./contracts/visual-regression.md)
