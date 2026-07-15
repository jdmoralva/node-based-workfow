# Research: Align Workbench Geometry

## Technical stack continuity

### Decision
Keep this feature on the current `apps/web` stack: Next.js 15 App Router, React 18, TypeScript 5.6, Tailwind CSS 3, Playwright 1.49, Vitest 2.1, and Testing Library.

### Rationale
The work is a focused refinement of an existing migrated route and its validation suite. Reusing the current stack avoids introducing new tooling for what is primarily a layout-and-validation adjustment and keeps the implementation aligned with the tests already exercising `/creditmodeler-service`.

### Alternatives considered
- Introduce a CSS-only reference capture workflow outside the existing browser tests: rejected because the current Playwright-based desktop baseline process already governs legacy parity.
- Treat the feature as documentation-only: rejected because the requirements change runtime geometry and verification expectations.

## Geometry ownership strategy

### Decision
Apply desktop vertical alignment through shared shell or page-level geometry rules rather than through an isolated negative transform on the workbench component.

### Rationale
The feature explicitly forbids correcting the workbench with a stand-alone transform. Shell-owned geometry keeps the sidebar, breadcrumb or stage region, and workbench frame aligned together and reduces the risk of visual compensation that only fixes one region while misaligning another.

### Alternatives considered
- Add a negative translate or relative offset only to the workbench container: rejected because it hides the root layout issue and violates the feature requirement.
- Leave shell geometry untouched and tune only internal workbench spacing: rejected because vertical start-position mismatch would remain visible.

## Desktop tolerance policy

### Decision
Reuse the existing desktop geometry tolerance and viewport matrix already approved for the broader legacy-parity feature.

### Rationale
This keeps the CreditModeler alignment work governed by the same desktop comparison rules already approved for the migration program, avoids feature-specific tolerance drift, and makes cross-route review easier.

### Alternatives considered
- Define a tighter route-specific tolerance: rejected because the current spec does not justify a stricter rule than the approved desktop baseline program.
- Define a looser route-specific tolerance: rejected because it would weaken parity expectations for the most geometry-sensitive route.

## Tree width and column-layout strategy

### Decision
Use one shared tree-panel width token that controls both the tree panel itself and the first column of the workbench layout grid.

### Rationale
The current workbench couples tree width and canvas space. A shared token prevents duplicated width values from drifting out of sync and makes it easier to balance wider label space against the canvas while keeping the layout testable.

### Alternatives considered
- Keep separate hard-coded widths for tree and grid layout: rejected because the feature explicitly calls for a reusable shared source of width values.
- Let the tree size itself automatically from content: rejected because it would reduce determinism in desktop geometry validation.

## Tree readability strategy

### Decision
Reduce indentation, row gap duplication, and non-essential horizontal chrome so current approved labels fit within the approved desktop panel width without adding horizontal scrolling.

### Rationale
The main usability problem is not the label set itself but how much width is spent on indentation, gaps, and row internals. Compact progressive nesting preserves hierarchy while recovering enough readable space for labels such as `TransitionAnalysis`.

### Alternatives considered
- Increase tree width aggressively and leave spacing unchanged: rejected because it would consume canvas width unnecessarily.
- Keep current spacing and accept more ellipsis: rejected because the feature explicitly forbids truncating current approved labels when they fit.

## Canvas usability rule

### Decision
Judge canvas usability by keeping its visible desktop width within the approved legacy desktop geometry tolerance of the legacy reference.

### Rationale
This gives implementation and tests a concrete target tied to the approved visual reference instead of a subjective notion of “enough space.” It also preserves the legacy desktop balance between the tree rail and canvas while allowing limited rebalancing to fix label truncation.

### Alternatives considered
- Define usability only as “primary interactions remain reachable”: rejected because it is too broad to guide desktop geometry tuning.
- Define usability only by absence of internal canvas scrolling: rejected because width regression could still escape detection.

## Validation strategy

### Decision
Extend the existing desktop comparison, geometry, accessibility, and tree-behavior tests rather than adding a separate validation harness for this route.

### Rationale
The relevant test surfaces already exist in `migrated-pages.spec.ts`, `layout-geometry.spec.ts`, `desktop-layout-checks.spec.ts`, `accessibility.spec.ts`, and `workbench-tree.test.tsx`. Concentrating feature work there keeps the new rules close to the current route coverage and avoids duplicate validation semantics.

### Alternatives considered
- Create a new standalone suite only for CreditModeler geometry: rejected because it would fragment route validation and duplicate existing helpers.
- Rely on screenshots alone: rejected because readable labels, sidebar alignment, and overflow behavior need direct assertions in addition to desktop image comparison.
