# Feature Specification: Legacy Frontend Standalone Migration

**Feature Branch**: `[003-legacy-nextjs-migration]`

**Created**: 2026-07-10

**Status**: Draft

**Input**: User description: "Migrate the complete legacy frontend to a standalone application that reproduces the current generated frontend experience, preserves its navigation and visual identity, and runs independently from the legacy generator and source directory."

## Clarifications

### Session 2026-07-10

- Q: What specific visual regression testing tasks must be included for this migration? → A: Add route-by-route screenshot coverage for the five migrated pages using legacy pages as the initial visual reference at 1366 x 768, 1440 x 900, and 390 x 844, validating shell dimensions, top-bar height, sidebar placement, hero-ribbon dimensions, card sizes, grid spacing, typography, icon dimensions, toolbar layout, login alignment, tree-panel dimensions, and responsive behavior.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Use the full migrated interface (Priority: P1)

As a product user, I want every currently available frontend page to exist in the new standalone application so that I can complete the same navigation journeys without relying on the legacy generated site.

**Why this priority**: The migration only delivers value if the new application fully replaces the current user-visible experience rather than shipping as a partial shell.

**Independent Test**: Can be fully tested by opening each public route directly, confirming that the landing page, sign-in page, applications listing, services listing, and CreditModeler workbench all render with their expected content and navigation.

**Acceptance Scenarios**:

1. **Given** a user opens the root route, **When** the page loads, **Then** the application shows the public landing page instead of redirecting elsewhere.
2. **Given** a user opens any migrated route directly, **When** the page loads or refreshes, **Then** the correct page appears without depending on the legacy frontend.
3. **Given** a user moves between the migrated pages, **When** the user uses normal in-app navigation, **Then** the destination pages open without broken links or legacy file references.

---

### User Story 2 - Navigate with legacy-consistent behavior (Priority: P1)

As a product user, I want navigation, breadcrumbs, sidebar actions, and card links to behave the same way they do today so that the migrated application feels familiar and predictable.

**Why this priority**: Preserving the current navigation model reduces retraining and avoids regressions in the most visible parts of the experience.

**Independent Test**: Can be fully tested by using the sign-in action, sidebar actions, breadcrumbs, application cards, and service cards and confirming that only elements with supported destinations navigate.

**Acceptance Scenarios**:

1. **Given** a user is on the landing page, **When** the user activates the Sign In action, **Then** the user reaches `/login`.
2. **Given** a user is on the applications page, **When** the user activates the Reporting card, **Then** the user reaches `/services`.
3. **Given** a user is on the services page, **When** the user activates the CreditModeler card, **Then** the user reaches `/creditmodeler-service`.
4. **Given** a card has no supported destination, **When** the user interacts with that card, **Then** the card remains available but does not behave like a link.

---

### User Story 3 - Experience the same visual system across devices (Priority: P2)

As a product stakeholder, I want the migrated application to preserve the legacy visual identity, layout proportions, and responsive behavior so that the migration is seen as a faithful replacement rather than a redesign.

**Why this priority**: Visual drift would undermine confidence in the migration even if route coverage is complete.

**Independent Test**: Can be fully tested by comparing the migrated pages with the current frontend reference at representative desktop, tablet, and mobile viewports and confirming that key layout regions, spacing, and hierarchy remain aligned.

**Acceptance Scenarios**:

1. **Given** a stakeholder compares the migrated landing, applications, services, login, and workbench pages to the current frontend, **When** the core layouts are reviewed, **Then** branding, page hierarchy, and major interface proportions remain recognizably consistent.
2. **Given** a user opens the migrated application on supported viewport sizes, **When** the layout adapts, **Then** primary panels, grids, toolbars, and actions remain usable without unintended horizontal scrolling.

---

### User Story 4 - Use frontend-only interactions safely during migration (Priority: P3)

As a product team member, I want the migrated application to preserve current interactive states while staying frontend-only so that the interface can be validated before backend integration begins.

**Why this priority**: The migration stage must remain isolated from backend delivery while still allowing realistic interface validation.

**Independent Test**: Can be fully tested by exercising login validation, card selection, tree expansion, workbench selection states, and button interactions without requiring an active backend service.

**Acceptance Scenarios**:

1. **Given** a user submits the sign-in form with missing required fields, **When** validation runs, **Then** the page shows clear client-side validation feedback without attempting real authentication.
2. **Given** a user selects cards, expands tree nodes, or uses internal controls, **When** the interaction completes, **Then** the page updates local interface state without creating a session or calling backend services.
3. **Given** a user activates a menu or metadata control inside a navigable card, **When** the control is used, **Then** the control performs its own action without triggering card navigation.

### Edge Cases

- If the migration encounters a legacy navigation target that is not explicitly supported, the affected element remains non-navigable until the destination is formally added.
- If a page is refreshed or opened in a new tab, the same migrated route and page state entry point remain available without requiring a legacy file.
- If a user navigates with the browser Back or Forward buttons, the application preserves the expected page history and active section state.
- If a visually selectable card has no destination, keyboard and pointer users can still interact with its non-navigation behaviors without it being exposed as a broken link.
- If the workbench tree contains collapsed or expanded branches, the interface preserves clear expanded-state indicators and selected-item feedback.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a standalone frontend application under `apps/web` that can be built and run without requiring the legacy `frontend/` directory at build time or runtime.
- **FR-002**: The system MUST replace the current generated frontend pages with migrated routes for `/`, `/login`, `/applications`, `/services`, and `/creditmodeler-service`.
- **FR-003**: The system MUST reproduce the current landing page as the root route and MUST NOT automatically redirect the root route to `/applications`.
- **FR-004**: The system MUST preserve the current visual identity, page hierarchy, and interaction patterns across all migrated pages.
- **FR-005**: The system MUST provide the shared shell elements used across the current frontend experience, including top branding, breadcrumb region, sidebar navigation, page headers, and page-level action areas where they exist today.
- **FR-006**: The system MUST preserve the current sign-in page as a frontend-only experience with required-field validation and placeholder feedback, and MUST NOT present it as real authentication.
- **FR-007**: The system MUST preserve the current applications page content, including its application cards, selection behavior, badges, menus, and page actions.
- **FR-008**: The system MUST preserve the current services page content, including its service cards, toolbar, page actions, and service-specific layout.
- **FR-009**: The system MUST preserve the current CreditModeler workbench content, including breadcrumb hierarchy, stage navigation, object tree, search, design canvas, and responsive workbench layout.
- **FR-010**: The system MUST preserve legacy navigation intent by supporting only the known destinations mapped from the current frontend: `/`, `/login`, `/applications`, `/services`, and `/creditmodeler-service`.
- **FR-011**: The system MUST route the landing-page Sign In action to `/login`.
- **FR-012**: The system MUST route the Applications sidebar action to `/applications` and indicate that the Applications section is active while the user remains within that section.
- **FR-013**: The system MUST make the Reporting application card navigable to `/services`.
- **FR-014**: The system MUST make the CreditModeler service card navigable to `/creditmodeler-service`.
- **FR-015**: The system MUST keep AI Copilot, Documentation, Mortgage, and PayrollDeduction visible but non-navigable until an explicit supported destination exists.
- **FR-016**: The system MUST ensure that card navigation and card-internal controls are separate behaviors so that menus, metadata actions, delete actions, and similar controls do not trigger navigation.
- **FR-017**: The system MUST provide breadcrumb trails that reflect the expected hierarchy for the login, applications, services, and CreditModeler pages, with the current page shown as the non-linked terminal segment.
- **FR-018**: The system MUST use explicit application destinations for all internal navigation and MUST NOT depend on legacy `.html` filenames or runtime string conversion of legacy filenames.
- **FR-019**: The system MUST treat unknown or unmapped legacy destinations as unsupported until they are explicitly added, and MUST NOT generate routes or broken links from them automatically.
- **FR-020**: The system MUST include all static assets needed for the migrated experience within the new application so that no production page loads fonts, icons, images, or similar assets from `frontend/`.
- **FR-021**: The system MUST manage reusable visual values such as colors, spacing, typography, shadows, borders, and responsive breakpoints within the new application so the migrated interface remains consistent without relying on legacy stylesheets.
- **FR-022**: The system MUST preserve responsive usability for the migrated pages at `1440 x 900`, `1366 x 768`, `768 x 1024`, and `390 x 844`, including preventing unintended horizontal scrolling.
- **FR-023**: The system MUST preserve or improve accessibility by providing semantic landmarks, labeled navigation regions, visible focus indicators, meaningful form labels, correct current-page indicators, correct expandable-state indicators, and non-link treatment for elements without destinations.
- **FR-024**: The system MUST support direct route access, browser Back and Forward navigation, page refresh, bookmarking, link copying, and opening navigable destinations in a new tab.
- **FR-025**: The system MUST remain frontend-only for this stage and MUST NOT require backend authentication, session management, protected routes, data persistence, or communication with `apps/api`.
- **FR-026**: The system MUST allow local interface state for temporary interactions such as card selection, tree expansion, selected tree item, disabled states, and validation feedback, but MUST NOT store simulated credentials, tokens, or authenticated-session data.
- **FR-027**: The system MUST include automated verification for route rendering, navigation behavior, non-navigable elements, login validation, tree interaction, responsive layouts, keyboard accessibility, direct route loading, and absence of legacy `.html` references in production source.
- **FR-028**: The system MUST include automated visual regression coverage for `/`, `/login`, `/applications`, `/services`, and `/creditmodeler-service` using the generated legacy pages as the initial approved visual reference set, capturing evidence at `1366 x 768`, `1440 x 900`, and `390 x 844`, and validating the applicable checkpoint set of shell dimensions, top-bar height, sidebar placement, hero-ribbon dimensions, card sizes, grid spacing, typography, icon dimensions, toolbar layout, login alignment, tree-panel dimensions, and responsive behavior.
- **FR-029**: The system MUST exclude backend integration, real user authentication, authorization, data retrieval, workflow execution, persistence features, and deletion of the legacy frontend from this migration stage.

### Key Entities *(include if feature involves data)*

- **Migrated Page**: A user-facing page in the standalone frontend that replaces one current generated page while preserving its purpose, layout hierarchy, and navigation role.
- **Supported Destination**: An explicitly approved internal destination that a navigable element may open within the migrated application.
- **Navigation Element**: A sidebar action, breadcrumb segment, button, or card area that may or may not be navigable depending on whether it has a supported destination.
- **Interactive Card**: A selectable application or service card that may contain both navigation behavior and non-navigation controls.
- **Shared Shell**: The recurring structural interface frame that includes branding, top bar, breadcrumbs, sidebar, and content container patterns across migrated pages.
- **Workbench Tree Item**: A selectable and optionally expandable entry within the CreditModeler object tree used to drive workbench context.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All five current frontend pages are available in the standalone application through their migrated routes and can be opened directly without using legacy generated files.
- **SC-002**: 100% of currently supported legacy navigation targets are mapped to explicit migrated destinations, and 0 unsupported elements expose broken or invented links.
- **SC-003**: 100% of production source checks for the migrated application confirm that legacy `.html` route references are absent.
- **SC-004**: At least 95% of defined navigation, form-validation, and local-state interaction checks pass on the first automated verification run for the migrated pages.
- **SC-005**: The migrated application passes responsive verification at `1440 x 900`, `1366 x 768`, `768 x 1024`, and `390 x 844` without unintended horizontal scrolling on any migrated page.
- **SC-006**: Visual comparison checks for the five migrated pages show no critical regressions in branding, shell layout, page hierarchy, or primary interaction regions against the approved legacy reference set.
- **SC-007**: 100% of the five migrated routes have screenshot coverage at `1366 x 768`, `1440 x 900`, and `390 x 844`, and 100% of those reviews assess the applicable checkpoint set of shell dimensions, top-bar height, sidebar placement, hero-ribbon dimensions, card sizes, grid spacing, typography, icon dimensions, toolbar layout, login alignment, tree-panel dimensions, and responsive behavior.

## Assumptions

- The current generated pages and their visible behavior are the authoritative reference for what the migrated frontend must reproduce during this stage.
- Only the five currently generated pages named in the request are part of this migration scope.
- Elements that currently lack a destination remain intentionally non-navigable unless a future feature adds an explicit supported destination.
- Frontend-only validation and placeholder feedback are sufficient for the sign-in page until a later backend-authentication feature is integrated.
- The legacy frontend remains available as a migration reference after this feature is delivered, but the new standalone application does not depend on it.
