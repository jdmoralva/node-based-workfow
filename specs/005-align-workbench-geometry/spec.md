# Feature Specification: Align Workbench Geometry

**Feature Branch**: `[005-align-workbench-geometry]`

**Created**: 2026-07-11

**Status**: Draft

**Input**: User description: "@docs/nfr/CreditModeler Workbench Geometry Alignment.md"

## Clarifications

### Session 2026-07-11

- Q: Which geometry tolerance should govern desktop alignment validation for this feature? → A: Reuse the existing desktop geometry tolerance from the broader legacy-parity feature.
- Q: How should design-canvas usability be judged when the tree panel grows wider on desktop? → A: The canvas is usable if its visible desktop width remains within the approved legacy geometry tolerance of the legacy reference.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Match the approved desktop workbench frame (Priority: P1)

As a product stakeholder, I want the migrated `/creditmodeler-service` desktop workbench to line up with the approved legacy reference so that the migrated page feels like the same product instead of a redesigned tool.

**Why this priority**: Desktop workbench alignment is the primary purpose of this feature. If the page frame, sidebar, and workbench start position remain visibly offset from the approved reference, the migration fails its visual-compatibility goal.

**Independent Test**: Can be fully tested by rendering the migrated `/creditmodeler-service` route and the approved legacy baseline at the required desktop reference viewports, then confirming the workbench frame, top alignment, and sidebar placement stay within the approved geometry tolerance.

**Acceptance Scenarios**:

1. **Given** the approved legacy baseline for `/creditmodeler-service`, **When** the migrated desktop workbench is rendered at a required desktop reference viewport, **Then** the workbench begins at the same effective vertical position as the approved reference within the approved geometry tolerance.
2. **Given** the same desktop reference viewport, **When** the migrated page is rendered, **Then** the narrow application sidebar aligns with the approved reference instead of appearing visually higher or lower than the shared shell frame.
3. **Given** the migrated workbench is aligned to the approved reference, **When** the page is reviewed as a whole, **Then** the breadcrumb region, workbench region, and adjacent shell elements appear as one coordinated layout rather than as separately offset sections.

---

### User Story 2 - Keep the object tree readable and space-efficient (Priority: P1)

As a CreditModeler user, I want the object tree to show the current approved labels without unnecessary truncation or wasted space so that I can scan the workbench hierarchy quickly.

**Why this priority**: The object tree is a primary navigation and orientation tool inside the workbench. If labels are clipped or indentation consumes too much width, the workbench becomes harder to use even if the broader page geometry is correct.

**Independent Test**: Can be fully tested by rendering the approved desktop workbench tree content at the required desktop reference viewports and confirming the current approved labels fit, hierarchy remains visible, and the panel does not introduce horizontal scrolling.

**Acceptance Scenarios**:

1. **Given** the approved desktop workbench tree content, **When** the migrated page is rendered at a required desktop reference viewport, **Then** the object-tree panel provides enough usable width for current approved labels, including `TransitionAnalysis`, to render fully.
2. **Given** a nested tree structure, **When** the migrated page is rendered, **Then** hierarchy remains visually clear while indentation and row spacing preserve as much label space as possible.
3. **Given** tree content that exceeds the available panel height, **When** the migrated page is rendered, **Then** the tree panel scrolls internally without causing horizontal scrolling for the approved tree content.

---

### User Story 3 - Preserve accessibility and responsive behavior while refining desktop geometry (Priority: P2)

As a product team member, I want the desktop geometry correction to preserve the migrated application's accessibility improvements and independent responsive behavior so that desktop parity does not force a regression elsewhere.

**Why this priority**: The feature is intentionally a geometry-alignment adjustment, not a rollback of accessibility gains or a requirement to copy legacy tablet and mobile behavior.

**Independent Test**: Can be fully tested by confirming the search field and tree toolbar still expose their current accessible names after alignment changes, and by checking that desktop geometry updates do not introduce unintended page-level overflow or force the responsive layouts to mimic the legacy mobile experience.

**Acceptance Scenarios**:

1. **Given** the migrated `/creditmodeler-service` page after geometry alignment, **When** the search field and tree toolbar are exercised, **Then** they retain their current functionality and accessible names.
2. **Given** a supported desktop viewport, **When** the adjusted page is rendered, **Then** the page does not introduce unintended full-page vertical or horizontal overflow.
3. **Given** tablet or mobile viewport ranges used by the migrated application, **When** the page is reviewed after this feature, **Then** it remains free to use its independently designed responsive behavior instead of being forced to reproduce the legacy responsive layout.

### Edge Cases

- If the shared page frame is corrected for desktop alignment, the narrow application sidebar must remain synchronized with that same frame rather than drifting out of alignment.
- If the approved tree content grows taller than the visible tree region, the tree panel must scroll vertically inside the panel without expanding the page into unintended overflow.
- If a current approved label fits within the approved desktop tree-panel width, it must remain fully visible rather than showing ellipsis.
- If a future label is genuinely wider than the approved desktop tree-panel width, the panel may still apply truncation behavior without adding horizontal scrolling for the current approved content set.
- If the page is rendered near the narrowest approved desktop reference viewport, the workbench may rebalance panel space, but the design canvas must remain usable and the page must not introduce unintended horizontal overflow.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST treat screenshots captured from the approved legacy CreditModeler reference page as the approved desktop visual baseline for this feature.
- **FR-002**: The system MUST apply this feature only to the migrated `/creditmodeler-service` workbench and MUST NOT expand scope into a broader workbench redesign.
- **FR-003**: The migrated desktop workbench MUST begin at the same effective vertical position as the approved legacy reference within the existing desktop geometry tolerance already approved for the broader legacy-parity feature.
- **FR-004**: The migrated narrow application sidebar MUST align vertically with the approved legacy reference within the existing desktop geometry tolerance already approved for the broader legacy-parity feature.
- **FR-005**: The migrated desktop layout MUST remove unnecessary vertical separation between the breadcrumb or stage region and the tree-and-canvas region.
- **FR-006**: The migrated desktop workbench height and placement MUST remain compatible with the viewport and MUST NOT introduce unintended full-page vertical or horizontal overflow.
- **FR-007**: Desktop geometry adjustments MUST come from the shared page and shell geometry so that the workbench frame and sidebar remain aligned together.
- **FR-008**: The object-tree panel MUST provide enough usable label width for the current approved desktop tree content to render without unnecessary truncation.
- **FR-009**: The migrated desktop layout MUST allow the object-tree panel to be wider than its current implementation when needed, provided the design canvas remains within the approved legacy desktop geometry tolerance of the legacy reference and the page does not introduce unintended horizontal overflow.
- **FR-010**: The migrated workbench MUST use one shared source of width values for the object-tree panel wherever that panel width affects workbench layout.
- **FR-011**: Tree indentation MUST remain progressive and compact so the hierarchy stays clear without consuming unnecessary label space.
- **FR-012**: The combined horizontal space used by hierarchy affordances, icons, gaps, and row padding MUST be minimized without reducing pointer or keyboard usability.
- **FR-013**: The migrated tree rows MUST reduce redundant internal spacing that does not improve comprehension or usability.
- **FR-014**: Current approved tree labels at the required desktop reference viewports MUST remain fully visible whenever they fit within the approved panel width.
- **FR-015**: Ellipsis MAY remain only as a fallback for labels that are genuinely too wide for the approved panel width or future dynamic content.
- **FR-016**: The tree content region MUST use the remaining available panel height and MUST provide internal vertical scrolling when needed.
- **FR-017**: The object-tree panel MUST NOT introduce horizontal scrolling for the current approved tree content.
- **FR-018**: The search field and tree toolbar MUST retain their current functionality and accessible names after geometry alignment changes.
- **FR-019**: Desktop geometry alignment changes MUST preserve the migrated application's semantic and accessibility improvements.
- **FR-020**: Desktop geometry alignment changes MUST NOT require tablet or mobile layouts to reproduce the legacy responsive behavior.

### Key Entities *(include if feature involves data)*

- **Approved Legacy Baseline**: The accepted desktop screenshot reference derived from the approved legacy CreditModeler page and used to judge migrated workbench geometry.
- **Migrated Workbench**: The `/creditmodeler-service` page in the new application whose desktop frame, sidebar, tree panel, and canvas must visually align with the approved baseline.
- **Workbench Geometry**: The observable layout relationship among the top shell, breadcrumb or stage region, application sidebar, object tree, and design canvas.
- **Object Tree Content Set**: The currently approved tree hierarchy and labels that must remain readable within the desktop panel without unnecessary truncation or horizontal scrolling.
- **Geometry Tolerance**: The approved allowance for small differences between the migrated desktop layout and the approved legacy baseline during visual validation.
- **Canvas Usability**: The condition in which the visible desktop canvas width remains within the approved legacy desktop geometry tolerance of the legacy reference while primary workbench regions stay intact.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of required desktop reference captures for `/creditmodeler-service` use the approved legacy CreditModeler screenshots as the comparison baseline.
- **SC-002**: At 100% of required desktop reference viewports, the migrated workbench top position and narrow sidebar position fall within the existing desktop geometry tolerance already approved for the broader legacy-parity feature.
- **SC-003**: At 100% of required desktop reference viewports, the current approved object-tree labels render without unnecessary truncation, including `TransitionAnalysis`.
- **SC-004**: At 100% of required desktop reference viewports, the object-tree panel shows no horizontal scrollbar for the current approved tree content.
- **SC-005**: At 100% of required desktop reference viewports, the adjusted page avoids unintended full-page horizontal overflow and unintended full-page vertical overflow.
- **SC-005A**: At 100% of required desktop reference viewports, any desktop tree-panel width increase still leaves the visible design canvas within the approved legacy desktop geometry tolerance of the legacy reference.
- **SC-006**: 100% of post-change checks confirm that the search field and tree toolbar keep their current accessible names and expected interaction behavior.
- **SC-007**: No approved tablet or mobile validation rule is changed to require reproduction of the legacy responsive behavior as a condition of this feature.

## Assumptions

- The approved desktop reference viewports and desktop geometry tolerance already defined by the broader legacy-parity program remain in force for this feature.
- The approved legacy CreditModeler reference page is the current generated legacy page represented by `frontend/creditmodeler-service.html`.
- Only the desktop geometry of `/creditmodeler-service` is in scope; changes to tree labels, hierarchy, or navigation behavior are out of scope.
- The current approved object-tree content set is stable enough to act as the reference for label-fit and overflow expectations in this feature.
- Accessibility improvements already present in the migrated application must be preserved unless a change is required to maintain equivalent or better usability.
- Tablet and mobile layouts may continue using the migrated application's intentionally designed responsive behavior as long as desktop alignment goals are met.
