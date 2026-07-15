# Tasks: Align Workbench Geometry

**Input**: Design documents from `/specs/005-align-workbench-geometry/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Include focused test updates because the specification defines explicit independent test criteria and measurable validation outcomes for desktop geometry, tree readability, accessibility, and responsive guardrails.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare the existing validation harness and route files for focused CreditModeler geometry work.

- [X] T001 Review current CreditModeler baseline, route, and workbench files in `frontend/creditmodeler-service.html`, `apps/web/app/creditmodeler-service/page.tsx`, and `apps/web/components/workbench/`
- [X] T002 Review the current CreditModeler validation surface in `apps/web/tests/visual/migrated-pages.spec.ts`, `apps/web/tests/visual/layout-geometry.spec.ts`, `apps/web/tests/e2e/desktop-layout-checks.spec.ts`, and `apps/web/tests/unit/workbench-tree.test.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared geometry primitives and baseline measurement support before user-story work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Create shared desktop workbench geometry tokens in `apps/web/app/globals.css`
- [X] T004 Update shared shell spacing and content frame rules in `apps/web/components/shell/ApplicationShell.tsx` and `apps/web/app/globals.css` so page-level geometry can control CreditModeler alignment
- [X] T005 [P] Extend desktop geometry helpers or fixtures for CreditModeler-specific assertions in `apps/web/tests/helpers/measure-layout.ts` and `apps/web/tests/fixtures/viewports.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Match the approved desktop workbench frame (Priority: P1) 🎯 MVP

**Goal**: Align the migrated CreditModeler desktop workbench frame, top position, and sidebar relationship with the approved legacy desktop reference.

**Independent Test**: Render `/creditmodeler-service` at `1366 x 768` and `1440 x 900`, compare against the approved legacy baseline, and confirm workbench top alignment and sidebar placement remain within the inherited desktop tolerance.

### Tests for User Story 1

- [X] T006 [P] [US1] Add or tighten CreditModeler desktop geometry assertions in `apps/web/tests/visual/layout-geometry.spec.ts`
- [X] T007 [P] [US1] Add or tighten CreditModeler shell and stage alignment checks in `apps/web/tests/e2e/desktop-layout-checks.spec.ts`

### Implementation for User Story 1

- [X] T008 [US1] Update route-level CreditModeler page composition in `apps/web/app/creditmodeler-service/page.tsx` to let shared shell geometry drive workbench placement
- [X] T009 [US1] Update shared shell or stage-region layout behavior in `apps/web/components/shell/ApplicationShell.tsx`, `apps/web/components/shell/Breadcrumbs.tsx`, and `apps/web/components/workbench/StageBar.tsx`
- [X] T010 [US1] Adjust desktop workbench container and canvas wrapper geometry in `apps/web/components/workbench/Workbench.tsx` and `apps/web/app/globals.css`
- [X] T011 [US1] Verify legacy desktop comparison coverage for the CreditModeler route remains correct in `apps/web/tests/visual/migrated-pages.spec.ts`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Keep the object tree readable and space-efficient (Priority: P1)

**Goal**: Make the object tree wide and compact enough for current approved labels to fit without horizontal scrolling while preserving clear hierarchy and canvas balance.

**Independent Test**: Render the CreditModeler tree at both required desktop viewports and confirm `TransitionAnalysis` fits, indentation remains clear, the panel scrolls vertically when needed, and no horizontal tree scrollbar appears.

### Tests for User Story 2

- [X] T012 [P] [US2] Add tree-width, truncation, oversized-label fallback, remaining-height scroll, and no-horizontal-scroll assertions in `apps/web/tests/visual/layout-geometry.spec.ts`
- [X] T013 [P] [US2] Extend tree interaction and label-fit coverage, including ellipsis fallback expectations, in `apps/web/tests/unit/workbench-tree.test.tsx`

### Implementation for User Story 2

- [X] T014 [US2] Refactor shared tree width usage in `apps/web/components/workbench/Workbench.tsx` and `apps/web/app/globals.css` so one token controls both panel width and workbench column layout
- [X] T015 [US2] Adjust tree panel structure, search region, and action-row layout in `apps/web/components/workbench/ObjectTree.tsx`
- [X] T016 [US2] Compact indentation, row spacing, and label-width behavior in `apps/web/components/workbench/ObjectTreeItem.tsx` and `apps/web/app/globals.css`
- [X] T017 [US2] Tune canvas-panel width relationship and tree-region remaining-height scroll behavior in `apps/web/components/workbench/CanvasPanel.tsx` and `apps/web/app/globals.css`

**Checkpoint**: At this point, User Stories 1 and 2 should both work independently

---

## Phase 5: User Story 3 - Preserve accessibility and responsive behavior while refining desktop geometry (Priority: P2)

**Goal**: Keep accessible names, responsive usability, and no-overflow guarantees intact after the desktop geometry changes.

**Independent Test**: Run accessibility and responsive validation after the desktop layout changes and confirm search and tree toolbar controls remain accessible, desktop overflow stays clean, and responsive layouts remain usable without legacy mimicry.

### Tests for User Story 3

- [X] T018 [P] [US3] Add or tighten CreditModeler accessibility expectations in `apps/web/tests/e2e/accessibility.spec.ts`
- [X] T019 [P] [US3] Add or tighten CreditModeler responsive regression checks in `apps/web/tests/e2e/responsive-layout.spec.ts` and `apps/web/tests/e2e/responsive-usability.spec.ts`

### Implementation for User Story 3

- [X] T020 [US3] Preserve search and toolbar accessible names while applying layout changes in `apps/web/components/workbench/ObjectTree.tsx`
- [X] T021 [US3] Adjust responsive workbench behavior to avoid forcing legacy mobile layout in `apps/web/components/workbench/Workbench.tsx`, `apps/web/components/workbench/ObjectTree.tsx`, and `apps/web/app/globals.css`
- [X] T022 [US3] Verify route-level overflow and responsive guardrails remain intact in `apps/web/app/creditmodeler-service/page.tsx` and `apps/web/components/shell/ApplicationShell.tsx`
- [X] T023 [US3] Update legacy runtime dependency guard coverage in `apps/web/tests/unit/no-legacy-runtime-dependencies.test.ts` and `apps/web/tests/unit/no-legacy-html-references.test.ts`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation updates that cut across all stories.

- [X] T024 [P] Update validation guidance if commands or expectations changed in `specs/005-align-workbench-geometry/quickstart.md`
- [X] T025 Run the focused workbench validation commands from `specs/005-align-workbench-geometry/quickstart.md` and record the resulting status in `specs/005-align-workbench-geometry/quickstart.md`
- [X] T026 Run the broader `apps/web` unit, desktop visual, accessibility, responsive, and legacy-dependency checks referenced in `specs/005-align-workbench-geometry/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Phase 2 and establishes the desktop frame alignment MVP
- **User Story 2 (P1)**: Starts after Phase 2 and remains independently testable; coordinate shared layout edits with US1 through the Phase 2 geometry token and shell rules
- **User Story 3 (P2)**: Starts after the core desktop geometry changes from US1 and US2 are in place

### Within Each User Story

- Update targeted tests before or alongside implementation so geometry regressions are explicit
- Shared layout primitives before route-level polish
- Tree width token before indentation and spacing refinements
- Complete story validation before moving to cross-cutting polish

### Parallel Opportunities

- `T005` can run in parallel with `T003` and `T004`
- `T006` and `T007` can run in parallel
- `T012` and `T013` can run in parallel
- `T018` and `T019` can run in parallel
- `T024` can run in parallel with late implementation cleanup once validation commands are known

---

## Parallel Example: User Story 1

```bash
# Launch the two desktop validation updates together:
Task: "Add or tighten CreditModeler desktop geometry assertions in apps/web/tests/visual/layout-geometry.spec.ts"
Task: "Add or tighten CreditModeler shell and stage alignment checks in apps/web/tests/e2e/desktop-layout-checks.spec.ts"
```

## Parallel Example: User Story 2

```bash
# Launch the two tree-focused test updates together:
Task: "Add tree-width, truncation, and no-horizontal-scroll assertions in apps/web/tests/visual/layout-geometry.spec.ts"
Task: "Extend tree interaction and label-fit coverage in apps/web/tests/unit/workbench-tree.test.tsx"
```

## Parallel Example: User Story 3

```bash
# Launch the accessibility and responsive regression updates together:
Task: "Add or tighten CreditModeler accessibility expectations in apps/web/tests/e2e/accessibility.spec.ts"
Task: "Add or tighten CreditModeler responsive regression checks in apps/web/tests/e2e/responsive-layout.spec.ts and apps/web/tests/e2e/responsive-usability.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Stop and validate desktop CreditModeler frame alignment against the approved legacy desktop baseline

### Incremental Delivery

1. Complete Setup + Foundational to establish shared geometry ownership
2. Deliver User Story 1 for desktop frame alignment MVP
3. Deliver User Story 2 for readable, space-efficient tree behavior
4. Deliver User Story 3 for accessibility and responsive guardrails
5. Finish with cross-cutting validation and quickstart updates

### Parallel Team Strategy

1. One developer handles shared geometry tokens and shell rules in Phase 2
2. A second developer can prepare US1 validation updates while Phase 2 is finishing
3. After US1 lands, tree-density work and accessibility or responsive guardrails can split across separate contributors

---

## Notes

- [P] tasks touch different files and avoid incomplete-task dependencies
- [US1], [US2], and [US3] labels map directly to the user stories in `spec.md`
- Each story is scoped to be independently testable using the criteria defined in the spec and quickstart guide
- The MVP is User Story 1 because it delivers the primary desktop geometry outcome
