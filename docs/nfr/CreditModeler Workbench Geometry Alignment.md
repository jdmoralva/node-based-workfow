## CreditModeler Workbench Geometry Alignment

### Objective

Adjust the `/creditmodeler-service` implementation under `apps/web` so that its desktop workbench geometry more closely matches the approved legacy reference `frontend/creditmodeler-service.html` while preserving the new application's component architecture, accessibility, and independently designed responsive behavior.

The changes shall focus on vertical placement, navigation-sidebar alignment, object-tree width, usable text space, and tree indentation density.

Playwright screenshots captured directly from legacy reference shall become the approved visual baseline for `/creditmodeler-service`.

### Scope

This work includes:

- vertical positioning of the workbench content;
- vertical positioning of the narrow application sidebar;
- object-tree panel width;
- spacing between the object tree and canvas;
- tree-node indentation;
- tree-row internal spacing;
- tree-label available width;
- horizontal truncation behavior;
- tree-panel overflow behavior.

This work does not include:

- redesigning the CreditModeler workbench;
- changing tree labels or hierarchy;
- changing navigation behavior;
- reproducing legacy mobile behavior;
- removing semantic or accessibility improvements;
- importing legacy CSS into `apps/web`.

### Functional Requirements

- **FR-WBG-001**: The desktop `/creditmodeler-service` workbench MUST begin at the same effective vertical coordinate as the approved legacy reference within an allowed geometry tolerance.

- **FR-WBG-002**: The workbench vertical correction MUST be implemented through the page or shell layout rules and MUST NOT use an isolated negative transform on the workbench component.

- **FR-WBG-003**: The implementation MUST remove unnecessary vertical spacing between the workbench breadcrumb/stage region and the tree-and-canvas region.

- **FR-WBG-004**: The workbench height calculation MUST remain compatible with the viewport and MUST NOT cause unintended page-level vertical or horizontal overflow.

- **FR-WBG-005**: The narrow application sidebar MUST align vertically with the approved legacy reference within the defined geometry tolerance.

- **FR-WBG-006**: Sidebar alignment MUST be based on the actual topbar and breadcrumb-region geometry rather than on an undocumented visual offset.

- **FR-WBG-007**: The object-tree panel MUST provide sufficient usable width for the label `TransitionAnalysis` to render fully at the required desktop viewports.

- **FR-WBG-008**: The object-tree panel width MAY be increased from its current fixed width when required, provided that the design canvas retains sufficient usable space and does not create page-level horizontal overflow.

- **FR-WBG-009**: The tree-panel width MUST be expressed through a reusable layout token or CSS custom property rather than duplicated hard-coded values.

- **FR-WBG-010**: The workbench grid MUST use the tree-panel width token as the first column definition.

- **FR-WBG-011**: Tree indentation MUST be progressive and compact, following the nesting hierarchy rather than using excessive absolute margins for every depth.

- **FR-WBG-012**: Tree-node indentation MUST preserve visible hierarchy while maximizing the horizontal space available to labels.

- **FR-WBG-013**: The combined width consumed by the caret, icon, row gaps, option padding, and indentation MUST be minimized without reducing pointer or keyboard usability.

- **FR-WBG-014**: The implementation MUST reduce unnecessary duplication between row-level gaps and option-level gaps.

- **FR-WBG-015**: Tree labels at the required desktop viewports MUST not be truncated when they fit within the approved panel width.

- **FR-WBG-016**: Ellipsis MAY remain as a fallback for genuinely oversized or future dynamic labels, but it MUST NOT truncate the current approved labels at desktop reference sizes.

- **FR-WBG-017**: The tree content region MUST use the remaining panel height and provide internal vertical scrolling when its content exceeds the available space.

- **FR-WBG-018**: Horizontal scrolling MUST NOT be introduced into the object-tree panel for the current approved tree content.

- **FR-WBG-019**: The search field and tree toolbar MUST retain their current functionality and accessible names after geometry adjustments.

- **FR-WBG-020**: Changes to desktop geometry MUST NOT require the responsive implementation to reproduce legacy tablet or mobile behavior.

### Recommended Layout Tokens

The implementation SHOULD define explicit workbench geometry tokens, for example:

```css
:root {
  --rv-workbench-content-top: 8px;
  --rv-workbench-tree-width: 228px;
  --rv-workbench-panel-gap: 8px;
  --rv-tree-indent-first: 14px;
  --rv-tree-indent-nested: 12px;
  --rv-tree-row-gap: 5px;
  --rv-tree-option-gap: 6px;
}