# Tasks: Legacy Visual Parity

**Input**: Design documents from `/specs/004-legacy-visual-parity/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Automated tests are required by the feature specification, including desktop visual comparison, layout geometry checks, responsive usability checks, and supporting route/state validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align the existing `apps/web` toolchain and docs with the desktop-only baseline strategy for this feature.

- [X] T001 Update validation scripts for explicit desktop baseline capture and comparison in `apps/web/package.json`
- [X] T002 [P] Add a dedicated legacy baseline Playwright config in `apps/web/playwright.legacy.config.ts`
- [X] T003 [P] Document the desktop-baseline and responsive-validation commands in `apps/web/README.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared fixtures, helpers, and artifact directories required by all user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create the approved desktop baseline directory and placeholder tracking files in `apps/web/tests/visual/baselines/legacy/.gitkeep` and `apps/web/tests/visual/baselines/legacy/README.md`
- [X] T005 [P] Update legacy route and viewport fixtures for desktop baselines plus responsive scenarios in `apps/web/tests/fixtures/legacy-routes.ts` and `apps/web/tests/fixtures/viewports.ts`
- [X] T006 [P] Create shared Playwright stabilization and geometry helpers in `apps/web/tests/helpers/wait-for-stable-page.ts`, `apps/web/tests/helpers/compare-with-legacy.ts`, and `apps/web/tests/helpers/measure-layout.ts`
- [X] T007 [P] Add a test to prevent production runtime dependencies on legacy pages or screenshot files in `apps/web/tests/unit/no-legacy-runtime-dependencies.test.ts`
- [X] T008 [P] Configure temporary Playwright artifact directories for actual images, diff images, traces, and reports in `apps/web/playwright.config.ts` and `apps/web/playwright.legacy.config.ts`
- [X] T009 Migrate the legacy screenshot inventory notes to the new contract and baseline directory in `apps/web/tests/visual/__screenshots__/README.md` and `apps/web/tests/visual/baselines/legacy/README.md`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Review migrated pages against the approved legacy interface (Priority: P1) 🎯 MVP

**Goal**: Make desktop legacy screenshots the explicit approved baseline source and compare all five migrated routes against that source without mutating baselines during normal validation.

**Independent Test**: Run the explicit baseline-generation command to produce 10 desktop legacy images, then run the desktop comparison suite and confirm `/`, `/login`, `/applications`, `/services`, and `/creditmodeler-service` compare against those approved images without regenerating them.

### Tests for User Story 1

- [X] T010 [P] [US1] Add baseline-generation coverage for the five legacy pages at the two desktop viewports in `apps/web/tests/visual/legacy-baseline.spec.ts`
- [X] T011 [P] [US1] Add migrated desktop comparison coverage for the five routes in `apps/web/tests/visual/migrated-pages.spec.ts`
- [X] T012 [P] [US1] Add missing-baseline, no-auto-refresh, and artifact-retention assertions in `apps/web/tests/e2e/visual-baseline-governance.spec.ts`

### Implementation for User Story 1

- [X] T013 [P] [US1] Implement canonical desktop baseline naming and route mapping in `apps/web/tests/fixtures/legacy-routes.ts`
- [X] T014 [P] [US1] Implement explicit desktop baseline capture flow in `apps/web/playwright.legacy.config.ts` and `apps/web/tests/helpers/compare-with-legacy.ts`
- [X] T015 [P] [US1] Implement deterministic desktop capture waits for fonts, assets, animations, and stable page state in `apps/web/tests/helpers/wait-for-stable-page.ts` and `apps/web/tests/visual/legacy-baseline.spec.ts`
- [X] T016 [US1] Implement comparison-only desktop visual execution rules and retained failure diagnostics in `apps/web/playwright.config.ts` and `apps/web/package.json`
- [X] T017 [US1] Update feature-level documentation for approved desktop baseline governance in `specs/004-legacy-visual-parity/quickstart.md` and `specs/004-legacy-visual-parity/contracts/desktop-visual-baselines.md`

**Checkpoint**: User Story 1 is fully functional and testable as the MVP desktop-baseline workflow

---

## Phase 4: User Story 2 - Preserve the familiar page structure and visual identity (Priority: P1)

**Goal**: Keep the five migrated routes visually aligned with the legacy interface on desktop through geometry checks and desktop-focused UI polish.

**Independent Test**: Run the desktop comparison suite and geometry checks, then confirm each migrated route preserves the expected desktop shell, card, login, and workbench proportions against the approved legacy reference set.

### Tests for User Story 2

- [X] T018 [P] [US2] Add desktop critical-region geometry assertions for all in-scope routes in `apps/web/tests/visual/layout-geometry.spec.ts`
- [X] T019 [P] [US2] Add desktop route-level visual checkpoint assertions for shell and workbench regions in `apps/web/tests/e2e/desktop-layout-checks.spec.ts`

### Implementation for User Story 2

- [X] T020 [P] [US2] Refine shared shell desktop geometry in `apps/web/app/globals.css`, `apps/web/components/shell/ApplicationShell.tsx`, and `apps/web/components/shell/Sidebar.tsx`
- [X] T021 [P] [US2] Refine landing, applications, and services desktop card layouts in `apps/web/app/page.tsx`, `apps/web/app/applications/page.tsx`, `apps/web/app/services/page.tsx`, `apps/web/components/cards/ApplicationGrid.tsx`, and `apps/web/components/cards/ServiceGrid.tsx`
- [X] T022 [P] [US2] Refine login desktop alignment in `apps/web/app/login/page.tsx` and `apps/web/features/login/LoginForm.tsx`
- [X] T023 [P] [US2] Refine CreditModeler desktop geometry in `apps/web/app/creditmodeler-service/page.tsx`, `apps/web/components/workbench/Workbench.tsx`, `apps/web/components/workbench/ObjectTree.tsx`, and `apps/web/components/workbench/CanvasPanel.tsx`
- [X] T024 [US2] Update desktop review checkpoint documentation and route notes in `specs/004-legacy-visual-parity/contracts/desktop-visual-baselines.md` and `specs/004-legacy-visual-parity/data-model.md`

**Checkpoint**: User Stories 1 and 2 both work independently, with desktop legacy parity validated beyond raw screenshots

---

## Phase 5: User Story 3 - Define improved responsive behavior across supported screen sizes (Priority: P2)

**Goal**: Replace legacy mobile mimicry with deliberate tablet/mobile layouts that remain usable and preserve branding, hierarchy, and primary task access.

**Independent Test**: Run responsive browser checks at `768 x 1024` and `390 x 844` for all five routes and confirm navigation access, action visibility, readable content flow, usable controls, and absence of unintended horizontal overflow or clipped primary regions.

### Tests for User Story 3

- [X] T025 [P] [US3] Add responsive usability coverage for all five routes in `apps/web/tests/e2e/responsive-layout.spec.ts`
- [X] T026 [P] [US3] Add route-specific tablet/mobile interaction checks for navigation, forms, cards, and workbench layout in `apps/web/tests/e2e/responsive-usability.spec.ts`

### Implementation for User Story 3

- [X] T027 [P] [US3] Implement responsive shell adaptations for tablet and mobile in `apps/web/app/globals.css`, `apps/web/components/shell/ApplicationShell.tsx`, and `apps/web/components/shell/Sidebar.tsx`
- [X] T028 [P] [US3] Implement responsive card-grid and toolbar adaptations in `apps/web/app/page.tsx`, `apps/web/app/applications/page.tsx`, `apps/web/app/services/page.tsx`, `apps/web/components/cards/ApplicationGrid.tsx`, `apps/web/components/cards/ServiceGrid.tsx`, and `apps/web/components/shell/ServiceToolbar.tsx`
- [X] T029 [P] [US3] Implement responsive sign-in layout behavior in `apps/web/app/login/page.tsx` and `apps/web/features/login/LoginForm.tsx`
- [X] T030 [P] [US3] Implement responsive CreditModeler adaptations for the stage bar, object tree, and canvas in `apps/web/app/creditmodeler-service/page.tsx`, `apps/web/components/workbench/StageBar.tsx`, `apps/web/components/workbench/Workbench.tsx`, `apps/web/components/workbench/ObjectTree.tsx`, and `apps/web/components/workbench/CanvasPanel.tsx`
- [X] T031 [US3] Update the responsive-usability contract and validation guide in `specs/004-legacy-visual-parity/contracts/responsive-usability.md` and `specs/004-legacy-visual-parity/quickstart.md`

**Checkpoint**: Responsive behavior is independently testable without relying on legacy mobile screenshots

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finish cross-story cleanup, verification, and documentation updates required for sign-off.

- [X] T032 [P] Remove or archive the obsolete mobile baseline inventory from `apps/web/tests/visual/__screenshots__/README.md` and align any remaining notes in `apps/web/README.md`
- [X] T033 [P] Update feature references and reviewer guidance in `specs/004-legacy-visual-parity/spec.md`, `specs/004-legacy-visual-parity/plan.md`, and `specs/004-legacy-visual-parity/research.md`
- [X] T034 [P] Add a repeatability check for two consecutive desktop comparison runs in `apps/web/tests/e2e/visual-repeatability.spec.ts` and `specs/004-legacy-visual-parity/quickstart.md`
- [X] T035 Run the full validation flow and record the final command set in `specs/004-legacy-visual-parity/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion - MVP baseline workflow
- **User Story 2 (Phase 4)**: Depends on User Story 1 for the desktop baseline workflow and artifact structure
- **User Story 3 (Phase 5)**: Depends on Foundational completion and benefits from User Story 2 desktop geometry polish, but remains independently testable once responsive checks are in place
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational completion and establishes the approved desktop baseline workflow
- **User Story 2 (P1)**: Starts after User Story 1 and uses that workflow to refine desktop parity
- **User Story 3 (P2)**: Starts after Foundational completion; it can overlap with User Story 2 where file ownership does not conflict, but final validation uses the same shared helpers

### Within Each User Story

- Tests should be written before or alongside implementation and must fail before the corresponding implementation is considered complete
- Shared fixtures and helpers precede baseline capture and comparison tasks
- Desktop baseline capture precedes comparison-only validation
- Responsive implementation precedes final responsive browser assertions

### Parallel Opportunities

- Setup tasks `T002` and `T003` can run in parallel after `T001`
- Foundational tasks `T005` through `T008` can run in parallel after `T004`
- In US1, test tasks `T010` through `T012` can run in parallel, and implementation tasks `T013` through `T015` can run in parallel
- In US2, tasks `T020` through `T023` can run in parallel by route area
- In US3, tests `T025` and `T026` can run in parallel, and implementation tasks `T027` through `T030` can run in parallel by layout surface

---

## Parallel Example: User Story 1

```bash
# Launch US1 tests together:
Task: "Add baseline-generation coverage for the five legacy pages at the two desktop viewports in apps/web/tests/visual/legacy-baseline.spec.ts"
Task: "Add migrated desktop comparison coverage for the five routes in apps/web/tests/visual/migrated-pages.spec.ts"
Task: "Add missing-baseline and no-auto-refresh assertions in apps/web/tests/e2e/visual-baseline-governance.spec.ts"

# Launch US1 implementation work together:
Task: "Implement canonical desktop baseline naming and route mapping in apps/web/tests/fixtures/legacy-routes.ts"
Task: "Implement explicit desktop baseline capture flow in apps/web/playwright.legacy.config.ts and apps/web/tests/helpers/compare-with-legacy.ts"
```

## Parallel Example: User Story 2

```bash
# Launch desktop parity checks together:
Task: "Add desktop critical-region geometry assertions for all in-scope routes in apps/web/tests/visual/layout-geometry.spec.ts"
Task: "Add desktop route-level visual checkpoint assertions for shell and workbench regions in apps/web/tests/e2e/desktop-layout-checks.spec.ts"

# Launch route-area desktop polish together:
Task: "Refine landing, applications, and services desktop card layouts in apps/web/app/page.tsx, apps/web/app/applications/page.tsx, apps/web/app/services/page.tsx, apps/web/components/cards/ApplicationGrid.tsx, and apps/web/components/cards/ServiceGrid.tsx"
Task: "Refine login desktop alignment in apps/web/app/login/page.tsx and apps/web/features/login/LoginForm.tsx"
Task: "Refine CreditModeler desktop geometry in apps/web/app/creditmodeler-service/page.tsx, apps/web/components/workbench/Workbench.tsx, apps/web/components/workbench/ObjectTree.tsx, and apps/web/components/workbench/CanvasPanel.tsx"
```

## Parallel Example: User Story 3

```bash
# Launch responsive checks together:
Task: "Add responsive usability coverage for all five routes in apps/web/tests/e2e/responsive-layout.spec.ts"
Task: "Add route-specific tablet/mobile interaction checks for navigation, forms, cards, and workbench layout in apps/web/tests/e2e/responsive-usability.spec.ts"

# Launch responsive implementation by surface:
Task: "Implement responsive shell adaptations for tablet and mobile in apps/web/app/globals.css, apps/web/components/shell/ApplicationShell.tsx, and apps/web/components/shell/Sidebar.tsx"
Task: "Implement responsive sign-in layout behavior in apps/web/app/login/page.tsx and apps/web/features/login/LoginForm.tsx"
Task: "Implement responsive CreditModeler adaptations for the stage bar, object tree, and canvas in apps/web/app/creditmodeler-service/page.tsx, apps/web/components/workbench/StageBar.tsx, apps/web/components/workbench/Workbench.tsx, apps/web/components/workbench/ObjectTree.tsx, and apps/web/components/workbench/CanvasPanel.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Confirm explicit desktop baseline generation and comparison-only execution

### Incremental Delivery

1. Complete Setup + Foundational → shared baseline and helper infrastructure ready
2. Add User Story 1 → validate desktop baseline workflow → MVP
3. Add User Story 2 → validate desktop parity quality → deliver improved desktop confidence
4. Add User Story 3 → validate responsive usability → deliver the full clarified feature scope

### Parallel Team Strategy

1. One developer updates Playwright configs and shared helpers
2. One developer refines desktop route parity work
3. One developer focuses on responsive layout and browser usability checks
4. Rejoin for the final validation run and documentation cleanup

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] labels map tasks directly to spec user stories
- Each user story remains independently testable using the criteria listed in its phase
- All tasks above follow the required checklist format with IDs, optional `[P]`, story labels where required, and explicit file paths
