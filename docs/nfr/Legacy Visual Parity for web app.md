# Feature Specification: Legacy Visual Parity for `apps/web`

**Feature Branch**: `[004-legacy-visual-parity]`
**Status**: Draft
**Related Specification**: `specs/003-legacy-nextjs-migration/spec.md`

## 1. Objective

Update the standalone frontend under `apps/web` so that its visual presentation faithfully reproduces the generated legacy pages under `frontend/`.

The generated legacy pages are the authoritative visual reference for this migration stage. Playwright screenshots captured directly from those pages shall become the approved visual baseline against which the corresponding `apps/web` routes are evaluated.

This feature is a visual migration and compatibility effort, not a redesign. Changes that intentionally alter the legacy visual identity, layout hierarchy, component proportions, responsive behavior, or visible content are outside the scope unless explicitly approved.

## 2. Scope

The following legacy pages and migrated routes are included:

| Legacy page                           | Migrated route           |
| ------------------------------------- | ------------------------ |
| `frontend/index.html`                 | `/`                      |
| `frontend/login.html`                 | `/login`                 |
| `frontend/applications.html`          | `/applications`          |
| `frontend/services.html`              | `/services`              |
| `frontend/creditmodeler-service.html` | `/creditmodeler-service` |

The implementation shall preserve the visual characteristics applicable to each page, including:

* application shell dimensions;
* top-bar height and content alignment;
* branding placement;
* breadcrumb placement and spacing;
* sidebar width, position and active-state presentation;
* page-content offsets;
* hero-ribbon shape, dimensions and typography;
* application and service card dimensions;
* card border, radius, shadow and internal spacing;
* card grid columns, gaps and wrapping behavior;
* page-level actions and toolbar alignment;
* login form dimensions and alignment;
* CreditModeler stage bar;
* object-tree panel dimensions;
* design-canvas position and proportions;
* typography, font weights and line heights;
* icons, badges and decorative assets;
* responsive layout behavior.

## 3. Source of Truth

### 3.1 Authoritative visual reference

The rendered legacy pages under `frontend/` shall be treated as the source of truth for visual comparison.

The tests shall compare the rendered output of `apps/web` against screenshots generated from the legacy pages, rather than against screenshots generated from an earlier version of `apps/web`.

Legacy source HTML or CSS shall not be imported into the production implementation of `apps/web`. Legacy files may only be used by development and test tooling to:

* serve the reference pages;
* generate approved baseline screenshots;
* inspect computed styles;
* measure layout geometry;
* document visual differences.

### 3.2 Baseline immutability

Once generated and approved, legacy baseline screenshots shall not be regenerated automatically during normal test execution.

Updating a baseline shall require an explicit command and a review confirming one of the following:

1. the legacy reference page changed intentionally;
2. the previously captured baseline was technically invalid;
3. the viewport, browser or deterministic test environment changed intentionally.

Changing the implementation in `apps/web` shall not, by itself, be a valid reason to replace a legacy baseline.

## 4. User Stories

### User Story 1 — Review migrated pages against the actual legacy interface

As a product stakeholder, I want the new Next.js pages to be compared with screenshots generated from the corresponding legacy pages so that visual migration decisions are based on the actual existing interface.

#### Acceptance scenarios

1. **Given** a clean test environment, **when** the baseline-generation command is executed, **then** Playwright renders each supported legacy page and produces one screenshot for every required route and viewport pair.
2. **Given** an approved legacy baseline exists, **when** the corresponding `apps/web` route is tested, **then** its current screenshot is compared with that legacy baseline.
3. **Given** the migrated page differs beyond the approved tolerance, **when** the visual test completes, **then** the test fails and produces expected, actual and difference artifacts.
4. **Given** the migrated page matches the approved baseline within tolerance, **when** the visual test completes, **then** the test passes without replacing the baseline.

### User Story 2 — Preserve page structure and proportions

As a product user, I want the migrated application to retain the same visible hierarchy and proportions as the legacy interface so that the new application feels familiar.

#### Acceptance scenarios

1. **Given** a migrated page and its legacy baseline, **when** both are rendered at the same viewport, **then** their main shell, top bar, sidebar and content regions retain equivalent placement and proportions.
2. **Given** a page containing cards, **when** the page is compared with the legacy reference, **then** card size, spacing, borders, typography, icons and grid behavior remain visually aligned.
3. **Given** the login route, **when** it is rendered at each required viewport, **then** the form, hero ribbon and surrounding empty space retain the legacy alignment.
4. **Given** the CreditModeler route, **when** it is rendered at each required viewport, **then** its stage bar, object tree and design canvas retain the legacy proportions.

### User Story 3 — Preserve responsive behavior

As a user on different screen sizes, I want the migrated application to adapt in the same way as the legacy pages so that no layout regression is introduced by the migration.

#### Acceptance scenarios

1. **Given** a supported desktop viewport, **when** a migrated page is rendered, **then** its desktop layout matches the corresponding legacy baseline.
2. **Given** the mobile viewport, **when** a migrated page is rendered, **then** stacking, wrapping, panel sizing and visible controls remain consistent with the legacy page.
3. **Given** any supported viewport, **when** the page finishes rendering, **then** it does not introduce horizontal overflow that is absent from the legacy reference.
4. **Given** a viewport transition, **when** the breakpoint is crossed, **then** the new implementation follows the same effective layout transition as the legacy implementation.

## 5. Functional Requirements

### Legacy baseline generation

* **FR-VIS-001**: The repository MUST include a Playwright-based mechanism for serving the generated pages under `frontend/` in a browser-accessible local environment.

* **FR-VIS-002**: The baseline generator MUST capture screenshots directly from the rendered legacy pages and MUST NOT use screenshots from `apps/web` as the initial reference.

* **FR-VIS-003**: The baseline generator MUST cover all five legacy pages included in the route mapping.

* **FR-VIS-004**: The baseline generator MUST use the following viewport matrix:

  | Label              | Width | Height |
  | ------------------ | ----- | ------ |
  | `desktop-standard` | 1366  | 768    |
  | `desktop-wide`     | 1440  | 900    |
  | `mobile`           | 390   | 844    |

* **FR-VIS-005**: The generator MUST produce exactly 15 approved legacy baseline images: five pages multiplied by three screenshot viewports.

* **FR-VIS-006**: The baseline filenames MUST use route-neutral canonical names, for example:

  ```text
  legacy-home-desktop-standard.png
  legacy-login-mobile.png
  legacy-applications-desktop-wide.png
  legacy-services-mobile.png
  legacy-creditmodeler-service-desktop-standard.png
  ```

* **FR-VIS-007**: Approved legacy baselines MUST be stored in a dedicated version-controlled directory, such as:

  ```text
  apps/web/tests/visual/baselines/legacy/
  ```

* **FR-VIS-008**: The approved baseline directory MUST NOT be excluded by `.gitignore`.

* **FR-VIS-009**: Temporary actual, difference, trace, report and failure screenshots MUST be stored separately from approved baselines and MAY be ignored by Git.

* **FR-VIS-010**: Baseline generation MUST be an explicit operation and MUST NOT occur automatically during normal visual-test execution.

### Deterministic rendering

* **FR-VIS-011**: Legacy and migrated pages MUST be rendered using the same Playwright browser project, operating-system environment, device scale factor and viewport dimensions.
* **FR-VIS-012**: The browser version used to generate and compare baselines MUST be pinned through the Playwright dependency and installation process.
* **FR-VIS-013**: The baseline environment SHOULD be reproducible through CI or a fixed container image rather than relying on an arbitrary developer workstation.
* **FR-VIS-014**: Both legacy and migrated pages MUST use the same locally available font files during visual capture.
* **FR-VIS-015**: Tests MUST wait for `document.fonts.ready` before taking screenshots.
* **FR-VIS-016**: Tests MUST wait for the primary page landmark or heading to be visible before taking screenshots.
* **FR-VIS-017**: Tests MUST disable or finish CSS animations, transitions and blinking cursors before capture.
* **FR-VIS-018**: Tests MUST ensure that images, SVG sprites and other visible static resources have finished loading.
* **FR-VIS-019**: Pages MUST use deterministic data and deterministic local interaction states during screenshot capture.
* **FR-VIS-020**: Dates, random identifiers, timers, user-dependent content and other unstable visual values MUST be mocked, frozen, hidden or excluded from the comparison.

### Migrated implementation

* **FR-VIS-021**: `apps/web` MUST reproduce the legacy visual hierarchy without importing production CSS, HTML or JavaScript from `frontend/`.
* **FR-VIS-022**: Reusable visual properties MUST be represented within `apps/web` using maintainable tokens or shared styles, including colors, spacing, typography, borders, shadows, radii and breakpoints.
* **FR-VIS-023**: The migrated shared shell MUST provide consistent top-bar, breadcrumb, sidebar and content-region geometry across all applicable routes.
* **FR-VIS-024**: Route-specific components MUST preserve the layout characteristics of their legacy counterpart.
* **FR-VIS-025**: Differences caused only by replacing legacy markup with semantic React components are permitted provided they do not materially alter the visible result or supported interactions.
* **FR-VIS-026**: The implementation MUST preserve accessibility improvements required by the parent specification even when invisible DOM structure differs from the legacy pages.
* **FR-VIS-027**: Visual parity MUST NOT be achieved by embedding the legacy page in an iframe, copying generated HTML wholesale into React components, or loading runtime assets from `frontend/`.
* **FR-VIS-028**: The implementation MAY refactor legacy styles into CSS Modules, shared styles or design tokens, provided rendered visual output remains within the approved tolerance.

### Visual comparison

* **FR-VIS-029**: Each migrated route MUST have one Playwright visual test for every required screenshot viewport.
* **FR-VIS-030**: Each test MUST compare the migrated route against the corresponding approved legacy image.
* **FR-VIS-031**: Visual tests MUST use full-page screenshots where the full document height is part of the legacy experience.
* **FR-VIS-032**: Tests MAY additionally capture stable component regions where full-page comparison does not sufficiently diagnose a failure.
* **FR-VIS-033**: The comparison policy MUST define an explicit pixel-difference threshold or maximum difference ratio.
* **FR-VIS-034**: The tolerance MUST only absorb browser rasterization noise and MUST NOT allow visible layout displacement, incorrect spacing, missing elements or typography changes.
* **FR-VIS-035**: Visual failures MUST retain the expected image, actual image and generated difference image.
* **FR-VIS-036**: Playwright traces MUST be retained on failure.
* **FR-VIS-037**: Visual tests MUST run serially or under another controlled concurrency configuration that produces stable screenshots.
* **FR-VIS-038**: Visual tests MUST fail when an approved baseline is missing; they MUST NOT silently create or approve a replacement.
* **FR-VIS-039**: Baseline-update commands MUST be separate from comparison commands.
* **FR-VIS-040**: CI MUST execute comparison mode only and MUST NOT update baseline images.

### Geometry and responsive assertions

* **FR-VIS-041**: Screenshot comparison MUST be complemented by DOM-based geometry assertions for critical layout regions.
* **FR-VIS-042**: Tests MUST verify that no migrated route has unintended horizontal overflow at `1440 × 900`, `1366 × 768`, `768 × 1024` and `390 × 844`.
* **FR-VIS-043**: Where applicable, tests MUST verify the bounding boxes of the top bar, sidebar, hero ribbon, principal card grid, login panel, service toolbar, object tree and workbench canvas.
* **FR-VIS-044**: Geometry assertions SHOULD compare the migrated measurement with a recorded legacy measurement or an approved tolerance range.
* **FR-VIS-045**: A screenshot match MUST NOT be the only assertion used to validate route readiness; the expected heading or landmark MUST also be present.

## 6. Visual Test Architecture

The visual test suite shall separate baseline creation from migrated-page verification.

### 6.1 Legacy capture project

A dedicated Playwright project or configuration shall:

1. start a static server rooted at `frontend/`;
2. open each legacy `.html` page;
3. wait for fonts and assets;
4. normalize unstable browser behavior;
5. capture the page at the three required viewport sizes;
6. write images into the approved legacy baseline directory only when explicitly invoked.

Suggested command:

```bash
npm run test:visual:baseline --prefix apps/web
```

This command shall be reserved for deliberate baseline creation or refresh.

### 6.2 Migrated comparison project

A separate Playwright project or configuration shall:

1. start the Next.js application under `apps/web`;
2. open the corresponding migrated route;
3. apply the same browser and viewport configuration used for the legacy capture;
4. wait for the stable rendering conditions;
5. compare the current image against the approved legacy image;
6. produce failure artifacts without modifying the baseline.

Suggested command:

```bash
npm run test:visual --prefix apps/web
```

### 6.3 Recommended directory structure

```text
apps/web/
├── tests/
│   ├── visual/
│   │   ├── baselines/
│   │   │   └── legacy/
│   │   │       ├── legacy-home-desktop-standard.png
│   │   │       ├── legacy-home-desktop-wide.png
│   │   │       ├── legacy-home-mobile.png
│   │   │       └── ...
│   │   ├── fixtures/
│   │   │   ├── route-matrix.ts
│   │   │   └── visual-environment.ts
│   │   ├── helpers/
│   │   │   ├── wait-for-stable-page.ts
│   │   │   ├── compare-with-legacy.ts
│   │   │   └── measure-layout.ts
│   │   ├── legacy-baseline.spec.ts
│   │   ├── migrated-pages.spec.ts
│   │   └── layout-geometry.spec.ts
│   └── e2e/
├── playwright.config.ts
└── playwright.legacy.config.ts
```

## 7. Required Visual Test Matrix

### 7.1 Full-page screenshot tests

| Migrated route           | Legacy reference                      | Desktop standard | Desktop wide | Mobile   |
| ------------------------ | ------------------------------------- | ---------------- | ------------ | -------- |
| `/`                      | `frontend/index.html`                 | Required         | Required     | Required |
| `/login`                 | `frontend/login.html`                 | Required         | Required     | Required |
| `/applications`          | `frontend/applications.html`          | Required         | Required     | Required |
| `/services`              | `frontend/services.html`              | Required         | Required     | Required |
| `/creditmodeler-service` | `frontend/creditmodeler-service.html` | Required         | Required     | Required |

Total required full-page comparisons: **15**.

### 7.2 Tablet responsive assertions

The viewport `768 × 1024` does not require a committed screenshot baseline unless later approved, but it MUST be covered by structural responsive tests for:

* absence of horizontal overflow;
* visible and usable primary navigation;
* correct card-grid wrapping;
* usable page actions;
* usable login form;
* usable object tree and workbench canvas;
* no overlapping regions;
* no clipped interactive controls.

### 7.3 Route-specific visual checkpoints

#### `/`

The visual test MUST assess:

* overall shell geometry;
* brand and top-bar placement;
* breadcrumb position;
* sidebar placement;
* `APPLICATIONS` hero ribbon;
* public action placement;
* application-card size;
* grid columns and spacing;
* card typography and icons;
* lower-page spacing.

#### `/login`

The visual test MUST assess:

* shell and top-bar geometry;
* breadcrumb region;
* `SIGN IN` hero ribbon;
* form width and vertical placement;
* field dimensions;
* label typography;
* submit-button dimensions;
* page alignment at desktop and mobile sizes.

The test MUST capture the default, non-error form state. Validation-error states shall be covered by functional or component tests unless separately approved as visual states.

#### `/applications`

The visual test MUST assess:

* authenticated-style shell presentation used by the legacy page;
* sidebar active state;
* page title and actions;
* card dimensions and selected-state-neutral appearance;
* badge and menu placement;
* grid spacing;
* responsive wrapping.

#### `/services`

The visual test MUST assess:

* shell geometry;
* breadcrumb hierarchy;
* service toolbar position and dimensions;
* page actions;
* service-card size and spacing;
* card icons and metadata;
* responsive layout.

#### `/creditmodeler-service`

The visual test MUST assess:

* shell and breadcrumb geometry;
* stage-bar height and spacing;
* object-tree width and placement;
* tree-item indentation;
* expansion indicators;
* selected-state presentation;
* search and toolbar controls;
* design-canvas position and dimensions;
* responsive behavior of the tree and canvas.

The default deterministic tree expansion and selection state used for screenshot capture MUST be documented.

## 8. Component-Level Visual Tests

Full-page tests shall be the primary acceptance mechanism. The following component-region screenshots SHOULD be added when they materially improve diagnosis:

* shared top bar;
* shared sidebar;
* hero ribbon;
* application card;
* service card;
* service toolbar;
* login panel;
* CreditModeler stage bar;
* object tree;
* empty design canvas.

Component-level screenshots MUST use the same styles and production components used by the actual routes. They MUST NOT rely on duplicated test-only markup.

Component screenshots shall not replace full-page route comparisons.

## 9. Non-Visual Supporting Tests

The following tests are required because screenshot comparison alone cannot prove correct behavior:

### Navigation

* Sign In action routes from `/` to `/login`.
* Reporting card routes from `/applications` to `/services`.
* CreditModeler card routes from `/services` to `/creditmodeler-service`.
* Unsupported cards remain non-navigable.
* Breadcrumb links use migrated routes and not `.html` filenames.

### Accessibility

* Each page exposes the expected heading or landmark.
* Navigation regions have accessible labels.
* Active navigation state is exposed semantically.
* Non-navigable cards are not exposed as links.
* Expandable tree nodes expose `aria-expanded`.
* Focus indicators remain visible.

### Responsive behavior

For all five routes at `1440 × 900`, `1366 × 768`, `768 × 1024` and `390 × 844`:

```typescript
document.documentElement.scrollWidth <=
document.documentElement.clientWidth
```

must evaluate to `true`, unless the legacy page intentionally contains a documented scrollable internal region.

### Independence from legacy runtime files

Production source under `apps/web` MUST be tested to ensure it does not:

* import files from `frontend/`;
* reference legacy `.html` routes;
* load fonts or icons from `frontend/`;
* read legacy screenshots during application runtime.

Test-only Playwright configurations and fixtures MAY reference `frontend/`.

## 10. Visual Difference Classification

Visual failures shall be classified as follows.

### Critical regression

The test MUST fail and the implementation MUST be corrected when there is:

* missing or additional major UI region;
* incorrect shell, sidebar or top-bar placement;
* wrong page hierarchy;
* incorrect responsive arrangement;
* unintended horizontal overflow;
* missing card, toolbar, form or workbench panel;
* materially incorrect card or panel dimensions;
* incorrect font family;
* missing icons or assets;
* overlapping or clipped content;
* wrong visible page state;
* broken mobile layout.

### Significant regression

The test SHOULD fail and require review when there is:

* visible spacing drift;
* wrong line height or font weight;
* incorrect icon size;
* incorrect border radius or shadow;
* alignment drift across repeated components;
* different card-grid gaps;
* wrong panel padding;
* visible color mismatch.

### Tolerable rendering noise

A small configured tolerance MAY absorb:

* minor antialiasing differences;
* subpixel rasterization noise;
* one-pixel font-edge variation caused by the fixed browser environment.

Tolerance MUST NOT be used to hide layout differences.

## 11. Baseline Governance

* Baselines MUST be committed to the repository.
* Baseline changes MUST be reviewed like source-code changes.
* A pull request changing baselines MUST explain why the reference changed.
* Baseline generation and baseline comparison MUST use the same documented environment.
* CI MUST publish actual, expected and diff images as artifacts when a visual test fails.
* CI MUST reject missing baselines.
* CI MUST reject unapproved baseline changes.
* Developers MUST inspect diff artifacts before using the baseline-update command.
* A baseline refresh MUST update the entire intended route-and-viewport set in one controlled commit when the rendering environment changes.

## 12. Suggested Commands

```json
{
  "scripts": {
    "test:visual": "playwright test --config playwright.config.ts --grep @visual",
    "test:visual:baseline": "playwright test --config playwright.legacy.config.ts --grep @legacy-baseline",
    "test:visual:update": "playwright test --config playwright.legacy.config.ts --grep @legacy-baseline --update-snapshots",
    "test:visual:report": "playwright show-report"
  }
}
```

`test:visual:update` MUST NOT run in CI.

## 13. Success Criteria

* **SC-VIS-001**: All five legacy pages can be rendered by the baseline-generation environment without loading errors.
* **SC-VIS-002**: Exactly 15 approved legacy baseline screenshots are stored and versioned.
* **SC-VIS-003**: All 15 migrated route-and-viewport combinations are compared against their corresponding legacy baseline.
* **SC-VIS-004**: All visual comparisons pass within the explicitly approved rasterization tolerance.
* **SC-VIS-005**: No migrated route exhibits unintended horizontal overflow at the four supported responsive viewports.
* **SC-VIS-006**: No critical visual regression exists in shell geometry, navigation placement, page hierarchy, card layout, login alignment or workbench structure.
* **SC-VIS-007**: Visual-test failures produce expected, actual and diff artifacts.
* **SC-VIS-008**: CI executes visual comparisons without modifying approved baselines.
* **SC-VIS-009**: Production code under `apps/web` has no runtime dependency on `frontend/`.
* **SC-VIS-010**: The visual test suite produces the same pass or fail result in two consecutive runs in the documented deterministic environment.
* **SC-VIS-011**: At least one reviewer confirms that each migrated page remains recognizably equivalent to the legacy page after automated tests pass.

## 14. Out of Scope

This feature does not include:

* redesigning the legacy interface;
* introducing a new design system that intentionally changes visible appearance;
* backend integration;
* real authentication;
* migration of new routes beyond the five listed pages;
* deletion of `frontend/`;
* automatic approval of changed screenshots;
* pixel-level reproduction of browser defects that impair accessibility or usability;
* iframe-based reuse of legacy pages;
* runtime loading of legacy CSS, HTML or JavaScript.

## 15. Assumptions

* The generated pages currently stored under `frontend/` represent the approved legacy interface.
* The legacy pages can be served locally with all required assets.
* The visual reference environment uses a pinned Chromium and Playwright version.
* Minor semantic and accessibility improvements may alter the DOM without materially altering the visible output.
* Baselines are generated on the same operating-system environment used by visual comparison in CI.
* Any intentional divergence from the legacy presentation requires explicit documentation and approval.
