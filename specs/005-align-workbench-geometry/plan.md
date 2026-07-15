# Implementation Plan: Align Workbench Geometry

**Branch**: `[not set]` | **Date**: 2026-07-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-align-workbench-geometry/spec.md`

## Summary

Refine the migrated `apps/web` CreditModeler route so its desktop workbench frame, sidebar alignment, tree width, and tree density match the approved legacy CreditModeler reference more closely without weakening accessibility or forcing legacy responsive behavior. The implementation will keep the existing Next.js workbench architecture, move desktop alignment through shared shell or page geometry instead of isolated visual offsets, and tighten validation around desktop workbench measurements, tree readability, and overflow behavior.

## Technical Context

**Language/Version**: TypeScript 5.6 on Node.js 22 LTS

**Primary Dependencies**: Next.js 15 App Router, React 18, Playwright 1.49, Vitest 2.1, Testing Library, Tailwind CSS 3

**Storage**: Version-controlled application source, committed legacy baseline screenshots, and committed planning documents; no backend persistence

**Testing**: Vitest for workbench tree behavior and route-level guards; Playwright for desktop visual comparison, layout geometry assertions, accessibility checks, and responsive validation

**Target Platform**: Modern Chromium-based desktop and responsive browser layouts exercised from local development and deterministic Playwright runs

**Project Type**: Web application

**Performance Goals**: Complete one deterministic local CreditModeler desktop-geometry validation pass covering `1366 x 768` and `1440 x 900`, while preserving the existing browser-validation command set and proving no unintended page-level overflow at those desktop viewports

**Constraints**: Must preserve the current `apps/web` component architecture; must use the approved legacy CreditModeler desktop screenshots as the reference baseline; must not rely on isolated negative transforms for workbench correction; must preserve accessible names and semantics; must not require tablet or mobile layouts to mimic legacy responsive behavior; must not add runtime dependency on legacy HTML or CSS

**Scale/Scope**: One migrated route (`/creditmodeler-service`), one shared shell layout, one stage bar, one tree panel, one canvas panel, one approved tree content set, two required desktop baseline viewports, and focused updates to existing workbench-related tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- The repository constitution file is still an unfilled template with placeholder sections only.
- No enforceable project-specific constitutional rules are currently defined.
- Gate result before research: PASS by absence of active constitutional constraints.
- Gate result after Phase 1 design: PASS; the design stays within the existing `apps/web` application, preserves the legacy reference as validation input only, and narrows implementation to layout and test adjustments without introducing new architectural exceptions.

## Project Structure

### Documentation (this feature)

```text
specs/005-align-workbench-geometry/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── desktop-workbench-geometry.md
│   └── tree-panel-readability.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/web/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   └── creditmodeler-service/page.tsx
├── components/
│   ├── shell/
│   │   ├── ApplicationShell.tsx
│   │   ├── Breadcrumbs.tsx
│   │   └── Sidebar.tsx
│   └── workbench/
│       ├── Workbench.tsx
│       ├── StageBar.tsx
│       ├── ObjectTree.tsx
│       ├── ObjectTreeItem.tsx
│       └── CanvasPanel.tsx
├── config/
│   └── tree-menu.ts
├── tests/
│   ├── unit/
│   │   └── workbench-tree.test.tsx
│   ├── e2e/
│   │   ├── desktop-layout-checks.spec.ts
│   │   ├── responsive-layout.spec.ts
│   │   ├── responsive-usability.spec.ts
│   │   └── accessibility.spec.ts
│   ├── fixtures/
│   │   ├── legacy-routes.ts
│   │   └── viewports.ts
│   ├── helpers/
│   │   ├── compare-with-legacy.ts
│   │   ├── measure-layout.ts
│   │   └── wait-for-stable-page.ts
│   └── visual/
│       ├── migrated-pages.spec.ts
│       ├── layout-geometry.spec.ts
│       └── baselines/legacy/
├── package.json
└── playwright.config.ts

frontend/
├── creditmodeler-service.html
├── assets/
└── src/dashboard_shell/
```

**Structure Decision**: Keep the feature entirely inside the existing `apps/web` application and its current visual-validation harness. Treat `frontend/creditmodeler-service.html` only as the approved desktop baseline source and validation reference, while implementation changes remain confined to shared shell styles, workbench components, route composition, and focused tests.

## Phase 0: Research

Research outcomes are captured in [research.md](./research.md) and resolve the planning decisions required before implementation:

- Keep the feature on the existing `apps/web` Next.js, React, Vitest, and Playwright stack.
- Drive desktop workbench alignment from shared page or shell geometry rather than isolated workbench transforms.
- Reuse the broader legacy-parity desktop tolerance and viewport matrix for CreditModeler alignment checks.
- Express tree-panel width through one shared layout token that also drives the workbench column layout.
- Compact tree indentation and row spacing so current approved labels fit without adding horizontal scrolling.
- Extend the current workbench geometry and accessibility checks rather than creating a separate one-off validation workflow.

## Phase 1: Design & Contracts

- Define the layout entities, geometry targets, readability constraints, and validation relationships in [data-model.md](./data-model.md).
- Document the required desktop workbench frame and alignment checkpoints in [contracts/desktop-workbench-geometry.md](./contracts/desktop-workbench-geometry.md).
- Document tree width, indentation, truncation, and overflow pass conditions in [contracts/tree-panel-readability.md](./contracts/tree-panel-readability.md).
- Capture the validation flow and expected results in [quickstart.md](./quickstart.md).
- Update the managed Spec Kit block in `AGENTS.md` to point at this plan file.

## Complexity Tracking

No constitutional violations or exceptional complexity require justification for this feature.
