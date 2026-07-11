# Tasks: Legacy Frontend Standalone Migration

**Input**: Design documents from `/specs/003-legacy-nextjs-migration/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Automated tests are required by the feature specification, including route rendering, interaction coverage, accessibility checks, and Playwright visual regression screenshots.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the standalone frontend workspace and baseline tooling for implementation and browser validation.

- [x] T001 Create the `apps/web` application skeleton and base directories in `apps/web/app`, `apps/web/components`, `apps/web/features`, `apps/web/config`, `apps/web/public`, and `apps/web/tests`
- [x] T002 Initialize the Node.js and Next.js package manifest in `apps/web/package.json`
- [x] T003 [P] Configure TypeScript and Next.js defaults in `apps/web/tsconfig.json`, `apps/web/next.config.ts`, and `apps/web/next-env.d.ts`
- [x] T004 [P] Configure Tailwind CSS and PostCSS in `apps/web/tailwind.config.ts`, `apps/web/postcss.config.js`, and `apps/web/app/globals.css`
- [x] T005 [P] Configure linting, formatting, and npm scripts in `apps/web/eslint.config.js` and `apps/web/package.json`
- [x] T006 [P] Configure Vitest and React Testing Library in `apps/web/vitest.config.ts` and `apps/web/tests/setup-vitest.ts`
- [x] T007 [P] Configure Playwright for interaction and screenshot coverage in `apps/web/playwright.config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the migration-owned shell, metadata, assets, and shared test harness required by every user story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Migrate route and supported-destination metadata into `apps/web/config/routes.ts`
- [x] T009 [P] Migrate breadcrumb definitions into `apps/web/config/breadcrumbs.ts`
- [x] T010 [P] Migrate application and service card definitions into `apps/web/config/cards.ts`
- [x] T011 [P] Migrate CreditModeler tree-menu definitions into `apps/web/config/tree-menu.ts`
- [x] T012 Migrate shared shell design tokens and global layout rules into `apps/web/app/globals.css`
- [x] T013 [P] Migrate fonts, icons, images, and favicon into `apps/web/public/fonts`, `apps/web/public/icons`, `apps/web/public/images`, and `apps/web/public/favicon.svg`
- [x] T014 [P] Create shared shell components in `apps/web/components/shell/ApplicationShell.tsx`, `apps/web/components/shell/Topbar.tsx`, `apps/web/components/shell/Brand.tsx`, `apps/web/components/shell/Breadcrumbs.tsx`, `apps/web/components/shell/Sidebar.tsx`, `apps/web/components/shell/HeroRibbon.tsx`, and `apps/web/components/shell/PageHeader.tsx`
- [x] T015 [P] Create shared card and icon components in `apps/web/components/cards/ApplicationCard.tsx`, `apps/web/components/cards/ApplicationGrid.tsx`, `apps/web/components/cards/ServiceCard.tsx`, `apps/web/components/cards/ServiceGrid.tsx`, `apps/web/components/shell/ServiceToolbar.tsx`, and `apps/web/components/icons/Icon.tsx`
- [x] T016 [P] Create shared workbench components in `apps/web/components/workbench/StageBar.tsx`, `apps/web/components/workbench/Workbench.tsx`, `apps/web/components/workbench/ObjectTree.tsx`, `apps/web/components/workbench/ObjectTreeItem.tsx`, and `apps/web/components/workbench/CanvasPanel.tsx`
- [x] T017 Create the root app layout and shared providers in `apps/web/app/layout.tsx`
- [x] T018 [P] Create test fixtures and browser helpers for legacy route references and viewport coverage in `apps/web/tests/fixtures/legacy-routes.ts` and `apps/web/tests/helpers/viewports.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Use the full migrated interface (Priority: P1) 🎯 MVP

**Goal**: Deliver all five standalone routes so users can open the full migrated interface directly without relying on generated HTML.

**Independent Test**: Start `apps/web`, open `/`, `/login`, `/applications`, `/services`, and `/creditmodeler-service` directly, refresh each route, and confirm every page renders the expected shell and route-specific content with no legacy runtime dependency.

### Tests for User Story 1

- [x] T019 [P] [US1] Add route rendering tests in `apps/web/tests/unit/routes.test.ts`
- [x] T020 [P] [US1] Add direct route loading browser tests in `apps/web/tests/e2e/routes.spec.ts`

### Implementation for User Story 1

- [x] T021 [P] [US1] Implement the landing page route in `apps/web/app/page.tsx`
- [x] T022 [P] [US1] Implement the login page route in `apps/web/app/login/page.tsx`
- [x] T023 [P] [US1] Implement the applications page route in `apps/web/app/applications/page.tsx`
- [x] T024 [P] [US1] Implement the services page route in `apps/web/app/services/page.tsx`
- [x] T025 [P] [US1] Implement the CreditModeler workbench route in `apps/web/app/creditmodeler-service/page.tsx`
- [x] T026 [US1] Wire route-level metadata, page titles, and shell composition across all five routes in `apps/web/app/page.tsx`, `apps/web/app/login/page.tsx`, `apps/web/app/applications/page.tsx`, `apps/web/app/services/page.tsx`, and `apps/web/app/creditmodeler-service/page.tsx`
- [x] T027 [US1] Add production source safeguards against legacy `.html` route references in `apps/web/tests/unit/no-legacy-html-references.test.ts`

**Checkpoint**: User Story 1 is fully functional and directly testable as the MVP route set

---

## Phase 4: User Story 2 - Navigate with legacy-consistent behavior (Priority: P1)

**Goal**: Preserve breadcrumb, sidebar, card, and action navigation behavior exactly for supported destinations while keeping unsupported elements non-navigable.

**Independent Test**: From the running app, verify `Sign In` opens `/login`, `Reporting` opens `/services`, `CreditModeler` opens `/creditmodeler-service`, breadcrumbs match the route contract, and cards without destinations never behave like links.

### Tests for User Story 2

- [x] T028 [P] [US2] Add breadcrumb and route-mapping tests in `apps/web/tests/unit/navigation-metadata.test.ts`
- [x] T029 [P] [US2] Add browser navigation tests for sidebar, cards, history, and direct links in `apps/web/tests/e2e/navigation.spec.ts`
- [x] T030 [P] [US2] Add non-navigable card and internal-control browser tests in `apps/web/tests/e2e/card-behavior.spec.ts`

### Implementation for User Story 2

- [x] T031 [P] [US2] Implement navigation hooks and typed link helpers in `apps/web/features/navigation/useActiveNav.ts` and `apps/web/features/navigation/linking.ts`
- [x] T032 [P] [US2] Implement breadcrumb rendering and current-page behavior in `apps/web/components/shell/Breadcrumbs.tsx`
- [x] T033 [P] [US2] Implement sidebar active-state behavior in `apps/web/components/shell/Sidebar.tsx`
- [x] T034 [P] [US2] Implement navigable and non-navigable application card behavior in `apps/web/components/cards/ApplicationCard.tsx` and `apps/web/components/cards/ApplicationGrid.tsx`
- [x] T035 [P] [US2] Implement navigable and non-navigable service card behavior in `apps/web/components/cards/ServiceCard.tsx` and `apps/web/components/cards/ServiceGrid.tsx`
- [x] T036 [US2] Integrate navigation contracts across route pages and shared shell in `apps/web/app/page.tsx`, `apps/web/app/login/page.tsx`, `apps/web/app/applications/page.tsx`, `apps/web/app/services/page.tsx`, and `apps/web/app/creditmodeler-service/page.tsx`

**Checkpoint**: User Stories 1 and 2 both work independently, with contract-accurate navigation

---

## Phase 5: User Story 3 - Experience the same visual system across devices (Priority: P2)

**Goal**: Reproduce the legacy visual identity, layout proportions, and responsive behavior across the migrated routes without relying on legacy runtime styles.

**Independent Test**: Compare the migrated `/`, `/login`, `/applications`, `/services`, and `/creditmodeler-service` pages against the legacy reference pages at `1440 x 900`, `1366 x 768`, and `390 x 844`, and verify responsive layout behavior at `768 x 1024`, confirming that layout hierarchy and checkpoint visuals stay aligned and no unintended horizontal scrolling appears.

### Tests for User Story 3

- [x] T037 [P] [US3] Add responsive layout browser assertions for `1440 x 900`, `1366 x 768`, `768 x 1024`, and `390 x 844` in `apps/web/tests/e2e/responsive-layout.spec.ts`
- [x] T038 [P] [US3] Add Playwright screenshot coverage for `/` and `/login` in `apps/web/tests/visual/public-pages.spec.ts`
- [x] T039 [P] [US3] Add Playwright screenshot coverage for `/applications`, `/services`, and `/creditmodeler-service` in `apps/web/tests/visual/app-pages.spec.ts`

### Implementation for User Story 3

- [x] T040 [P] [US3] Rebuild landing and applications visual styling in `apps/web/app/page.tsx`, `apps/web/app/applications/page.tsx`, and `apps/web/components/cards/ApplicationGrid.tsx`
- [x] T041 [P] [US3] Rebuild login page visual styling in `apps/web/app/login/page.tsx` and `apps/web/features/login/LoginForm.tsx`
- [x] T042 [P] [US3] Rebuild services page visual styling in `apps/web/app/services/page.tsx`, `apps/web/components/shell/ServiceToolbar.tsx`, and `apps/web/components/cards/ServiceGrid.tsx`
- [x] T043 [P] [US3] Rebuild CreditModeler workbench visual styling in `apps/web/app/creditmodeler-service/page.tsx` and `apps/web/components/workbench/Workbench.tsx`
- [x] T044 [US3] Finalize viewport-specific spacing, sizing, and scroll constraints for desktop, tablet, and mobile layouts in `apps/web/app/globals.css`
- [x] T045 [US3] Capture and store approved visual baselines and review notes for all required route/viewport pairs in `apps/web/tests/visual/__screenshots__` and `specs/003-legacy-nextjs-migration/contracts/visual-regression.md`

**Checkpoint**: User Stories 1, 2, and 3 are independently verifiable with responsive and screenshot coverage

---

## Phase 6: User Story 4 - Use frontend-only interactions safely during migration (Priority: P3)

**Goal**: Preserve local-only UI interactions for the login form, selected cards, and CreditModeler tree behavior without introducing backend dependencies or fake authentication state.

**Independent Test**: Submit `/login` with missing fields, toggle and select workbench tree items on `/creditmodeler-service`, interact with card-local controls, and confirm that all state changes remain local and no backend calls or stored credentials are introduced.

### Tests for User Story 4

- [x] T046 [P] [US4] Add login validation and placeholder behavior tests in `apps/web/tests/unit/login-form.test.tsx`
- [x] T047 [P] [US4] Add workbench tree state tests in `apps/web/tests/unit/workbench-tree.test.tsx`
- [x] T048 [P] [US4] Add browser interaction tests for login validation, tree expansion, and selection state in `apps/web/tests/e2e/local-interactions.spec.ts`

### Implementation for User Story 4

- [x] T049 [P] [US4] Implement the frontend-only login form state and validation in `apps/web/features/login/LoginForm.tsx`
- [x] T050 [P] [US4] Implement application and service card selected-state behavior in `apps/web/features/applications/useCardSelection.ts` and `apps/web/components/cards/ApplicationCard.tsx`
- [x] T051 [P] [US4] Implement CreditModeler tree expansion and selection state in `apps/web/features/creditmodeler/useWorkbenchTree.ts`, `apps/web/components/workbench/ObjectTree.tsx`, and `apps/web/components/workbench/ObjectTreeItem.tsx`
- [x] T052 [US4] Verify that frontend-only interactions do not create auth/session storage side effects in `apps/web/tests/e2e/local-interactions.spec.ts` and `apps/web/tests/unit/login-form.test.tsx`

**Checkpoint**: All four user stories are independently functional and testable

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Finish cross-story accessibility, validation, and documentation work required before implementation sign-off.

- [x] T053 [P] Implement breadcrumb, sidebar, and shared-shell accessibility attributes in `apps/web/components/shell/Breadcrumbs.tsx`, `apps/web/components/shell/Sidebar.tsx`, and `apps/web/components/shell/ApplicationShell.tsx`
- [x] T054 [P] Implement login, workbench-tree, and decorative-icon accessibility attributes in `apps/web/features/login/LoginForm.tsx`, `apps/web/components/workbench/ObjectTree.tsx`, `apps/web/components/workbench/ObjectTreeItem.tsx`, and `apps/web/components/icons/Icon.tsx`
- [x] T055 [P] Integrate local font loading through the Next.js font pipeline in `apps/web/app/layout.tsx`
- [x] T056 [P] Add accessibility verification for landmarks, labels, focus states, `aria-current`, `aria-expanded`, and decorative icon hiding in `apps/web/tests/e2e/accessibility.spec.ts`
- [x] T057 [P] Add final route, navigation, and validation commands to `apps/web/README.md`
- [x] T058 Update the migration notes and verification commands in `specs/003-legacy-nextjs-migration/quickstart.md`
- [x] T059 Run the full validation flow and record any required baseline updates in `specs/003-legacy-nextjs-migration/quickstart.md` and `specs/003-legacy-nextjs-migration/contracts/visual-regression.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational completion and provides the standalone route inventory MVP
- **User Story 2 (P1)**: Starts after Foundational completion and depends on US1 route pages existing for final wiring
- **User Story 3 (P2)**: Starts after Foundational completion and depends on US1 pages plus US2 navigation surfaces for full visual parity validation
- **User Story 4 (P3)**: Starts after Foundational completion and depends on US1 pages plus shared components; it can proceed alongside US2 and US3 once those files exist

### Within Each User Story

- Tests should be written before or alongside implementation and must fail before the corresponding implementation is considered complete
- Shared metadata and components precede route integration
- Browser and visual tests follow the route or interaction implementation they validate
- Story completion requires passing its independent test criteria

### Parallel Opportunities

- Setup tasks `T003` through `T007` can run in parallel after `T001` and `T002`
- Foundational metadata tasks `T009` through `T011` can run in parallel after `T008`
- Shared component tasks `T014` through `T016` can run in parallel after the foundational config files exist
- In US1, page-route implementation tasks `T021` through `T025` can run in parallel
- In US2, card and shell navigation tasks `T031` through `T035` can run in parallel
- In US3, screenshot suites `T038` and `T039` can run in parallel, and visual rebuild tasks `T040` through `T043` can run in parallel by route area
- In US4, local interaction implementation tasks `T049` through `T051` can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch route tests together:
Task: "Add route rendering tests in apps/web/tests/unit/routes.test.ts"
Task: "Add direct route loading browser tests in apps/web/tests/e2e/routes.spec.ts"

# Launch route page implementation together:
Task: "Implement the landing page route in apps/web/app/page.tsx"
Task: "Implement the login page route in apps/web/app/login/page.tsx"
Task: "Implement the applications page route in apps/web/app/applications/page.tsx"
Task: "Implement the services page route in apps/web/app/services/page.tsx"
Task: "Implement the CreditModeler workbench route in apps/web/app/creditmodeler-service/page.tsx"
```

## Parallel Example: User Story 2

```bash
# Launch navigation behavior tests together:
Task: "Add breadcrumb and route-mapping tests in apps/web/tests/unit/navigation-metadata.test.ts"
Task: "Add browser navigation tests for sidebar, cards, history, and direct links in apps/web/tests/e2e/navigation.spec.ts"
Task: "Add non-navigable card and internal-control browser tests in apps/web/tests/e2e/card-behavior.spec.ts"

# Launch navigation component work together:
Task: "Implement breadcrumb rendering and current-page behavior in apps/web/components/shell/Breadcrumbs.tsx"
Task: "Implement sidebar active-state behavior in apps/web/components/shell/Sidebar.tsx"
Task: "Implement navigable and non-navigable application card behavior in apps/web/components/cards/ApplicationCard.tsx and apps/web/components/cards/ApplicationGrid.tsx"
Task: "Implement navigable and non-navigable service card behavior in apps/web/components/cards/ServiceCard.tsx and apps/web/components/cards/ServiceGrid.tsx"
```

## Parallel Example: User Story 3

```bash
# Launch screenshot suites together:
Task: "Add Playwright screenshot coverage for / and /login in apps/web/tests/visual/public-pages.spec.ts"
Task: "Add Playwright screenshot coverage for /applications, /services, and /creditmodeler-service in apps/web/tests/visual/app-pages.spec.ts"

# Launch route-area visual rebuilds together:
Task: "Rebuild landing and applications visual styling in apps/web/app/page.tsx, apps/web/app/applications/page.tsx, and apps/web/components/cards/ApplicationGrid.tsx"
Task: "Rebuild login page visual styling in apps/web/app/login/page.tsx and apps/web/features/login/LoginForm.tsx"
Task: "Rebuild services page visual styling in apps/web/app/services/page.tsx, apps/web/components/shell/ServiceToolbar.tsx, and apps/web/components/cards/ServiceGrid.tsx"
Task: "Rebuild CreditModeler workbench visual styling in apps/web/app/creditmodeler-service/page.tsx and apps/web/components/workbench/Workbench.tsx"
```

## Parallel Example: User Story 4

```bash
# Launch local interaction tests together:
Task: "Add login validation and placeholder behavior tests in apps/web/tests/unit/login-form.test.tsx"
Task: "Add workbench tree state tests in apps/web/tests/unit/workbench-tree.test.tsx"
Task: "Add browser interaction tests for login validation, tree expansion, and selection state in apps/web/tests/e2e/local-interactions.spec.ts"

# Launch local interaction implementation together:
Task: "Implement the frontend-only login form state and validation in apps/web/features/login/LoginForm.tsx"
Task: "Implement application and service card selected-state behavior in apps/web/features/applications/useCardSelection.ts and apps/web/components/cards/ApplicationCard.tsx"
Task: "Implement CreditModeler tree expansion and selection state in apps/web/features/creditmodeler/useWorkbenchTree.ts, apps/web/components/workbench/ObjectTree.tsx, and apps/web/components/workbench/ObjectTreeItem.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate direct route loading and absence of legacy runtime dependencies
5. Demo the standalone five-route shell as the MVP replacement surface

### Incremental Delivery

1. Complete Setup + Foundational to establish the migration-owned frontend base
2. Add User Story 1 and validate standalone route coverage
3. Add User Story 2 and validate navigation parity
4. Add User Story 3 and validate responsive and visual parity
5. Add User Story 4 and validate frontend-only interactive behavior
6. Finish with accessibility, documentation, and full quickstart verification

### Parallel Team Strategy

1. One developer completes Phase 1 and core package setup while another prepares foundational config migrations
2. After Phase 2, route implementation, navigation behavior, and screenshot harness work can be split across contributors
3. Visual parity and local interaction work can proceed in parallel once route pages and shared components exist

---

## Notes

- [P] tasks target different files or isolated route areas and can be parallelized safely
- Every user story includes executable test tasks because the spec explicitly requires automated validation
- User Story 1 is the recommended MVP scope because it delivers the standalone route inventory and direct page access
- All tasks use the required checklist format with IDs, optional parallel markers, story labels where required, and explicit file paths
