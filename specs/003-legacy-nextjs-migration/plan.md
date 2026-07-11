# Implementation Plan: Legacy Frontend Standalone Migration

**Branch**: `[003-legacy-nextjs-migration]` | **Date**: 2026-07-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-legacy-nextjs-migration/spec.md`

## Summary

Create a standalone `apps/web` application that replaces the generated legacy frontend with a route-based React application while preserving the current page inventory, navigation rules, shared shell, local-only interactions, assets, and visual identity. The migration will move legacy navigation and card definitions into explicit typed route metadata, rebuild the visual system with local application-owned styles and tokens, and add both functional browser coverage and route-by-route visual regression checks against the current generated pages.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 22 LTS

**Primary Dependencies**: Next.js App Router, React, Tailwind CSS, the Next.js font pipeline for local font integration, Vitest, React Testing Library, Playwright

**Storage**: No backend persistence in this phase; static assets, route metadata, card definitions, and visual baselines live inside `apps/web` and the feature docs directory

**Testing**: Vitest plus React Testing Library for route metadata and component behavior; Playwright for route navigation, keyboard interaction, responsive checks, and visual regression screenshots

**Target Platform**: Modern desktop and mobile browsers with local development on Windows or Linux via Node.js

**Project Type**: Web application

**Performance Goals**: The five migrated routes load and become interactable within 2 seconds during local verification on a standard developer workstation, client-side navigations complete without full page reloads, and one local visual regression run completes the required 15 screenshot captures successfully

**Constraints**: Keep `apps/web` independent from `frontend/` at build time and runtime; preserve the five existing pages and their navigation behavior; avoid legacy `.html` references in production code; do not introduce backend integration; migrate all required assets into `apps/web/public`; integrate local fonts through the Next.js font pipeline; preserve responsive behavior across `1440 x 900`, `1366 x 768`, `768 x 1024`, and `390 x 844`; include route-by-route visual regression coverage against the generated legacy pages

**Scale/Scope**: One new standalone frontend application under `apps/web`, five migrated routes, one shared application shell, one local route/config layer, one migrated asset set, one workbench tree interaction model, and focused automated plus visual regression coverage for the migrated experience

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- The repository constitution file is still an unfilled template with placeholder sections only.
- No enforceable project-specific constitutional rules are currently defined.
- Gate result before research: PASS by absence of active constitutional constraints.
- Gate result after Phase 1 design: PASS; the design remains scoped to one frontend application, keeps legacy dependencies out of runtime, and adds explicit validation artifacts for navigation and visual parity.

## Project Structure

### Documentation (this feature)

```text
specs/003-legacy-nextjs-migration/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── navigation-ui.md
│   └── visual-regression.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/
├── api/
└── web/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── login/
    │   │   └── page.tsx
    │   ├── applications/
    │   │   └── page.tsx
    │   ├── services/
    │   │   └── page.tsx
    │   ├── creditmodeler-service/
    │   │   └── page.tsx
    │   └── globals.css
    ├── components/
    │   ├── shell/
    │   ├── cards/
    │   ├── workbench/
    │   └── icons/
    ├── features/
    │   ├── navigation/
    │   ├── applications/
    │   ├── services/
    │   ├── login/
    │   └── creditmodeler/
    ├── config/
    │   ├── routes.ts
    │   ├── breadcrumbs.ts
    │   ├── cards.ts
    │   └── tree-menu.ts
    ├── public/
    │   ├── fonts/
    │   ├── icons/
    │   ├── images/
    │   └── favicon.svg
    └── tests/
        ├── unit/
        ├── integration/
        ├── e2e/
        └── visual/

frontend/
├── assets/
├── src/dashboard_shell/
├── *.html
└── style.css
```

**Structure Decision**: Add `apps/web` as a self-contained frontend application with route entrypoints under `app/`, reusable interface elements under `components/`, feature-scoped state and composition under `features/`, and explicit migration-owned metadata under `config/`. The legacy `frontend/` directory remains a read-only migration reference and visual baseline source, while `apps/api` stays untouched and outside this phase.

## Phase 0: Research

Research outcomes are captured in [research.md](./research.md) and resolve the implementation choices required before delivery:

- Use one App Router application in `apps/web` with explicit route metadata rather than string-based legacy filename transforms.
- Migrate legacy page, card, breadcrumb, and tree-menu data into app-owned typed configuration files instead of reading from `frontend/` at runtime.
- Use a shared shell plus route-specific feature modules so the interface stays visually consistent without recreating the Python generator.
- Rebuild the legacy visual system with app-owned design tokens, utility classes, and reusable components while loading fonts through the Next.js font pipeline and serving icons and images locally from `apps/web/public`.
- Use local component state only for card selection, login validation, tree expansion, and similar temporary interactions.
- Use Vitest plus React Testing Library for metadata and component checks, and Playwright for navigation, responsive verification, and screenshot-based visual regression.
- Capture visual baselines per migrated route and viewport using the current generated pages as the initial reference set.

## Phase 1: Design & Contracts

- Define the migrated route, navigation, card, workbench tree, and visual baseline entities in [data-model.md](./data-model.md).
- Document the UI navigation contract for routes, breadcrumbs, cards, and non-navigable states in [contracts/navigation-ui.md](./contracts/navigation-ui.md).
- Document the required screenshot matrix and visual review checkpoints in [contracts/visual-regression.md](./contracts/visual-regression.md).
- Capture the local setup and end-to-end validation flow in [quickstart.md](./quickstart.md).
- Update the managed Spec Kit block in `AGENTS.md` to point at this plan file.

## Complexity Tracking

No constitutional violations or exceptional complexity require justification for this feature.
