# Feature Specification: Legacy Visual Parity

**Feature Branch**: `[004-legacy-visual-parity]`

**Created**: 2026-07-11

**Status**: Implemented

**Input**: User description: "@docs/nfr/Legacy Visual Parity for web app.md"

## Clarifications

### Session 2026-07-11

- Q: Should legacy screenshots remain the visual reference for all supported viewports, or only for desktop while tablet/mobile use explicit responsive criteria? → A: Use legacy screenshots only for desktop viewports; validate tablet/mobile with explicit responsive usability and layout requirements instead of legacy-image matching.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Review migrated pages against the approved legacy interface (Priority: P1)

As a product stakeholder, I want the migrated web application to be evaluated against the actual legacy pages so that visual migration decisions are based on the current approved experience rather than on a newer interpretation.

**Why this priority**: The feature only delivers value if the team compares the migrated pages against the true legacy reference and prevents the new application from redefining the standard for itself.

**Independent Test**: Can be fully tested by generating the approved legacy screenshot set from the current legacy pages, then running the migrated-page comparison suite and confirming that each migrated route is checked against the matching approved baseline without replacing it.

**Acceptance Scenarios**:

1. **Given** a clean validation environment, **When** the approved legacy baseline set is generated, **Then** one approved screenshot is produced for every in-scope page and required desktop viewport pair.
2. **Given** an approved baseline already exists, **When** the corresponding migrated route is validated, **Then** the current migrated page is compared against the approved legacy baseline.
3. **Given** a migrated page exceeds the approved visual tolerance, **When** the comparison completes, **Then** the validation fails and retains expected, actual, and difference evidence for review.
4. **Given** a migrated page matches the approved baseline within tolerance, **When** the comparison completes, **Then** the validation passes without altering the approved baseline.

---

### User Story 2 - Preserve the familiar page structure and visual identity (Priority: P1)

As a product user, I want the migrated pages to keep the same visible hierarchy, spacing, and component proportions as the legacy interface so that the new application feels like a faithful continuation of the existing product.

**Why this priority**: Familiarity is central to this migration. If the visual hierarchy or page proportions change materially, users experience the result as a redesign rather than a compatible replacement.

**Independent Test**: Can be fully tested by reviewing the migrated landing page, sign-in page, applications page, services page, and CreditModeler workbench against the approved legacy baselines and confirming that the major layout regions, cards, forms, and workbench panels remain visually aligned.

**Acceptance Scenarios**:

1. **Given** a migrated page and its approved legacy baseline, **When** both are rendered at the same viewport, **Then** the shell, top bar, navigation, and primary content regions retain equivalent placement and proportions.
2. **Given** a page with cards or toolbars, **When** the migrated page is compared with the approved legacy baseline, **Then** card size, spacing, borders, shadows, typography, and action alignment remain visually consistent.
3. **Given** the sign-in page, **When** it is reviewed at the required desktop viewports, **Then** the hero ribbon, form width, and surrounding whitespace remain aligned with the legacy experience.
4. **Given** the CreditModeler workbench, **When** it is reviewed at the required desktop viewports, **Then** the stage bar, object tree, and design canvas retain the legacy proportions and layout relationships.

---

### User Story 3 - Define improved responsive behavior across supported screen sizes (Priority: P2)

As a user on desktop, tablet, or mobile screens, I want the migrated application to provide a responsive and usable layout designed for each supported screen size so that the interface adapts appropriately without being constrained by the legacy responsive behavior.

**Why this priority**: Desktop parity alone is insufficient. The migrated application must preserve legacy identity where appropriate while deliberately improving tablet and mobile usability.

**Independent Test**: Can be fully tested by validating all in-scope migrated routes at the supported desktop, tablet, and mobile viewports, confirming desktop presentation against the approved legacy desktop baselines, and confirming tablet/mobile usability through explicit responsive layout criteria.

**Acceptance Scenarios**:

1. **Given** a supported desktop viewport, **When** an in-scope migrated page is rendered, **Then** its desktop layout matches the corresponding approved legacy baseline.
2. **Given** a supported tablet or mobile viewport, **When** an in-scope migrated page is rendered, **Then** layout regions may stack, collapse, resize, or reorder as needed provided the page preserves branding, component identity, and content hierarchy while keeping primary navigation and actions reachable.
3. **Given** any supported tablet or mobile viewport, **When** the page finishes rendering, **Then** it does not introduce unintended horizontal overflow, clipped primary controls, or overlapped primary task regions.
4. **Given** a breakpoint transition, **When** the viewport crosses into another supported layout range, **Then** the migrated page applies the selected responsive pattern for that page while preserving readable content flow and usable forms, cards, toolbars, and tree interactions.

### Edge Cases

- If an approved baseline is missing for an in-scope page and viewport pair, the comparison run fails instead of creating or approving a replacement automatically.
- If a migrated page contains deterministic default states such as selected cards, expanded tree nodes, or highlighted navigation, those states remain stable across repeated validation runs.
- If a route contains an element that is visible but intentionally non-navigable in the legacy interface, the migrated page preserves the same visible treatment without inventing a new destination.
- If a supported viewport exposes a layout transition near a breakpoint, the migrated page may change wrapping or region ordering when that produces a more usable layout.
- If a page contains a legitimate internal scrollable region, that region is documented so it is not confused with unintended full-page horizontal overflow.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST treat the current generated legacy pages as the authoritative visual reference for this migration stage.
- **FR-002**: The system MUST cover exactly five migrated routes in this feature: `/`, `/login`, `/applications`, `/services`, and `/creditmodeler-service`.
- **FR-003**: The system MUST use legacy-derived screenshots as the initial approved visual baselines and MUST NOT use migrated-page screenshots as the reference set.
- **FR-004**: The system MUST produce exactly 10 approved baseline images for this feature, representing the five in-scope pages across the two required desktop screenshot viewports.
- **FR-005**: The system MUST validate legacy visual parity for each in-scope route at desktop-standard and desktop-wide screenshot viewports.
- **FR-006**: The system MUST validate responsive behavior for each in-scope route at tablet and mobile sizes through explicit usability and layout criteria rather than through legacy screenshot matching.
- **FR-007**: Approved baselines MUST be stored in a dedicated version-controlled location that is separate from temporary comparison artifacts.
- **FR-008**: Temporary actual images, difference images, reports, and similar failure artifacts MUST be stored separately from the approved baseline set.
- **FR-009**: Baseline generation MUST be an explicit operation and MUST NOT occur automatically during normal comparison runs.
- **FR-010**: Approved baselines MUST only be replaced after explicit review confirms that the legacy reference changed intentionally, the previous baseline was invalid, or the approved rendering environment changed intentionally.
- **FR-011**: A change in the migrated implementation alone MUST NOT be treated as a valid reason to replace an approved legacy baseline.
- **FR-012**: Validation runs MUST fail when an approved baseline is missing and MUST NOT silently create or approve a replacement.
- **FR-013**: The migrated pages MUST preserve the legacy shell structure, including the relative placement and proportions of branding, top navigation, breadcrumbs, sidebar navigation, and primary content regions where applicable.
- **FR-014**: The migrated pages MUST preserve the legacy visual characteristics that materially affect user recognition, including desktop page hierarchy, component identity, spacing, typography, iconography, borders, shadows, and decorative assets.
- **FR-015**: The migrated landing page, sign-in page, applications page, services page, and CreditModeler workbench MUST each retain the visible layout characteristics of their corresponding legacy page.
- **FR-016**: The migrated sign-in page MUST preserve the legacy alignment of the hero ribbon, form dimensions, field presentation, and surrounding whitespace.
- **FR-017**: The migrated applications and services pages MUST preserve the legacy card-grid behavior, card dimensions, toolbar alignment, and page action placement.
- **FR-018**: The migrated CreditModeler workbench MUST preserve the legacy stage bar, object tree, and design-canvas identity on desktop screens and MUST provide a usable responsive arrangement on tablet and mobile screens.
- **FR-019**: The migrated pages MUST use a deliberate responsive design for tablet and mobile screens based on usability, accessibility, maintainability, and page-specific needs rather than reproducing the legacy breakpoint strategy or adaptation patterns.
- **FR-020**: The migrated pages MUST NOT introduce unintended horizontal overflow at `1440 x 900`, `1366 x 768`, `768 x 1024`, or `390 x 844`.
- **FR-021**: Visual comparison MUST be complemented by structural checks for critical layout regions so that screenshot similarity is not the only readiness signal.
- **FR-021A**: Responsive validation at tablet and mobile sizes MUST confirm that primary navigation, key actions, forms, card grids, tree panels, and other primary task regions remain visible, reachable, and usable after layout adaptation.
- **FR-021B**: Visual comparison runs MUST retain expected images, actual images, generated difference images, and execution diagnostics in a temporary artifact location that is separate from the approved baseline directory.
- **FR-021C**: Desktop baseline capture and comparison runs MUST wait for fonts and static assets, disable or finish animations and transitions, and use deterministic default page states so repeated runs remain stable.
- **FR-022**: Each visual validation failure MUST retain expected, actual, and difference evidence for review.
- **FR-023**: Each visual validation failure MUST retain enough execution evidence to support diagnosis and reruns in the approved environment.
- **FR-024**: The production migrated application MUST NOT depend at runtime on legacy generated pages, legacy screenshots, or legacy runtime assets to achieve parity.
- **FR-025**: The system MUST allow invisible structural improvements, such as semantic or accessibility enhancements, only when they do not materially change the approved visible result or expected supported interactions.
- **FR-026**: The scope of this feature MUST remain a visual compatibility effort and MUST NOT expand into redesigning the interface, adding new migrated routes, enabling backend integration, introducing real authentication, or removing the legacy reference pages.
- **FR-027**: Baseline changes MUST be reviewed with the same scrutiny as source changes and MUST include a clear explanation of why the approved reference changed.
- **FR-028**: The comparison process used in shared validation environments MUST operate in comparison-only mode and MUST NOT refresh approved baselines automatically.

### Key Entities *(include if feature involves data)*

- **Legacy Reference Page**: One of the currently approved generated pages that defines the expected visual appearance for an in-scope migrated route.
- **Migrated Route**: A route in the new web application that replaces the corresponding legacy page while preserving its visible experience.
- **Approved Baseline Image**: A version-controlled screenshot captured from a legacy reference page and used as the accepted visual standard for one route and viewport pair.
- **Viewport Set**: The approved group of screen sizes used to validate desktop legacy parity and tablet/mobile responsive usability for this feature.
- **Visual Comparison Run**: A validation execution that compares migrated-route output against approved baseline images and produces review artifacts when differences exceed tolerance.
- **Critical Layout Region**: A visually important area such as the top bar, sidebar, hero ribbon, card grid, login panel, stage bar, object tree, or design canvas whose geometry materially affects user recognition of the page.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All five in-scope legacy pages can be rendered successfully in the approved baseline-capture environment without missing-page or missing-asset failures.
- **SC-002**: Exactly 10 approved baseline images exist for the feature, covering 100% of the five in-scope pages at the two required desktop screenshot viewports.
- **SC-003**: 100% of the five migrated routes are validated against their matching approved legacy baselines at the two required desktop screenshot viewports.
- **SC-004**: 100% of in-scope migrated routes pass the supported overflow checks at `1440 x 900`, `1366 x 768`, `768 x 1024`, and `390 x 844` without unintended horizontal overflow.
- **SC-005**: 100% of comparison failures produce expected, actual, and difference evidence that a reviewer can inspect.
- **SC-006**: Two consecutive comparison runs in the approved deterministic environment produce the same pass-or-fail outcome for the same code and baseline set, using the same retained artifact and diagnostics policy.
- **SC-007**: No critical regression remains in desktop shell geometry, navigation placement, page hierarchy, card layout, sign-in alignment, or workbench structure across the five in-scope migrated routes.
- **SC-007A**: 100% of in-scope migrated routes pass explicit tablet/mobile responsive usability checks covering navigation access, action visibility, readable content flow, usable forms or controls, and absence of clipped primary task regions.
- **SC-008**: 100% of approved baseline changes include reviewer-visible justification for why the approved reference changed.
- **SC-009**: At least one reviewer confirms that each of the five migrated routes remains recognizably equivalent to its legacy page after automated validation passes.

## Reviewer Guidance

- Review approved baseline changes separately from application code changes and require explicit justification for every baseline replacement.
- Use desktop screenshots and desktop checkpoint notes to judge parity, and use the responsive contract rather than legacy mobile screenshots to judge tablet/mobile behavior.
- When investigating visual instability, prefer the comparison-only repeatability command before considering any baseline refresh.

## Assumptions

- The generated pages currently stored under `frontend/` represent the approved legacy interface for this migration stage.
- Only the five page pairs named in this feature are in scope for visual parity work.
- Legacy pages remain authoritative for desktop presentation, branding, component identity, and content hierarchy, but not for responsive behavior, breakpoint strategy, or mobile adaptation patterns.
- A fixed validation environment is available so that the same code and baseline set can produce repeatable results.
- Minor invisible structural improvements are acceptable when they preserve the approved visible output and supported interactions.
- Any intentional visual divergence from the legacy presentation requires explicit approval and documented rationale before it is accepted.
