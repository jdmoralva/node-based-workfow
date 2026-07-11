# Implementation Plan: Legacy Visual Parity

**Branch**: `[not set]` | **Date**: 2026-07-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-legacy-visual-parity/spec.md`

## Summary

Refine the existing `apps/web` migration so desktop views remain validated against approved legacy screenshots while tablet and mobile views are validated through explicit responsive-usability rules instead of legacy responsive mimicry. The implementation will keep the legacy pages as the desktop visual source of truth, move approved baselines into a dedicated legacy-baseline directory, and split validation into desktop screenshot comparison, layout-geometry assertions, and page-specific responsive interaction checks.

## Technical Context

**Language/Version**: TypeScript 5.6 on Node.js 22 LTS

**Primary Dependencies**: Next.js 15 App Router, React 18, Tailwind CSS 3, Playwright 1.49, Vitest 2.1, React Testing Library

**Storage**: Version-controlled documentation files plus committed desktop baseline images under `apps/web/tests/visual/baselines/legacy/`; no backend persistence

**Testing**: Vitest for unit-level route and state rules; Playwright for end-to-end navigation, responsive usability, geometry assertions, desktop visual comparison, repeatability checks, and retained failure diagnostics

**Target Platform**: Modern Chromium-based desktop and mobile browser layouts exercised from local Windows/Linux development and CI-style deterministic browser runs

**Project Type**: Web application

**Performance Goals**: Desktop comparison coverage completes the 10 required baseline comparisons in one deterministic run, responsive checks cover all five routes at `768 x 1024` and `390 x 844`, and local validation stays fast enough for repeated developer use during UI polish

**Constraints**: Legacy pages remain runtime-independent reference material only; desktop presentation must preserve branding and layout identity; tablet/mobile layouts may reorganize for usability; no automatic baseline refresh during normal validation; comparison runs must retain failure artifacts separately from approved baselines; deterministic capture must wait for stable fonts/assets/states; no backend integration or route expansion; no unintended horizontal overflow at supported viewports

**Scale/Scope**: One existing `apps/web` application, five migrated routes, 10 approved desktop baseline images, one shared shell, one CreditModeler workbench route, and focused test/documentation updates for desktop parity plus responsive usability

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- The repository constitution file is still an unfilled template with placeholder sections only.
- No enforceable project-specific constitutional rules are currently defined.
- Gate result before research: PASS by absence of active constitutional constraints.
- Gate result after Phase 1 design: PASS; the design stays scoped to the existing `apps/web` application, keeps `frontend/` as reference-only input, and strengthens validation without introducing new runtime dependencies.

## Project Structure

### Documentation (this feature)

```text
specs/004-legacy-visual-parity/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── desktop-visual-baselines.md
│   └── responsive-usability.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/web/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── login/page.tsx
│   ├── applications/page.tsx
│   ├── services/page.tsx
│   ├── creditmodeler-service/page.tsx
│   └── globals.css
├── components/
├── config/
├── features/
├── public/
│   ├── fonts/
│   ├── icons/
│   └── favicon.svg
├── tests/
│   ├── e2e/
│   ├── fixtures/
│   ├── helpers/
│   ├── unit/
│   └── visual/
├── package.json
└── playwright.config.ts

frontend/
├── *.html
├── assets/
├── src/dashboard_shell/
└── style.css
```

**Structure Decision**: Keep the feature inside the existing `apps/web` application. Update route presentation, responsive layout behavior, and Playwright coverage in place. Treat `frontend/` strictly as a baseline-generation and inspection source for desktop reference pages; do not use it as a runtime dependency.

## Phase 0: Research

Research outcomes are captured in [research.md](./research.md) and resolve the design choices required before implementation:

- Keep the current `apps/web` stack and validation toolchain aligned with the broader migration plan.
- Check primary dependencies and install them if not exists for this project.
- Restrict legacy screenshot baselines to the two desktop viewports and move tablet/mobile validation to explicit responsive-usability checks.
- Use one deterministic Playwright browser setup for legacy capture and migrated comparison to reduce environmental drift.
- Split browser validation into desktop screenshot comparison, critical-region geometry assertions, page-specific responsive interaction checks, and retained failure diagnostics.
- Add a comparison-only repeatability check so two consecutive desktop comparison runs use the same baseline set and governance rules.
- Separate approved baselines from temporary diff, trace, and report artifacts so baseline governance remains reviewable.

## Phase 1: Design & Contracts

- Define the desktop baseline set, responsive validation scenarios, and critical layout entities in [data-model.md](./data-model.md).
- Document desktop baseline capture and comparison rules in [contracts/desktop-visual-baselines.md](./contracts/desktop-visual-baselines.md).
- Document tablet/mobile responsive pass conditions in [contracts/responsive-usability.md](./contracts/responsive-usability.md).
- Capture the validation workflow and expected results in [quickstart.md](./quickstart.md).
- Update the managed Spec Kit block in `AGENTS.md` to point at this plan file.

## Complexity Tracking

No constitutional violations or exceptional complexity require justification for this feature.
